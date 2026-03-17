import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execa } from 'execa';
import chalk from 'chalk';
import fetch from 'node-fetch';
import { NETAVERSES_API_BASE } from './config.js';
// Decide whether a path (relative to workspace root) should be excluded from snapshot
const shouldExclude = (relPath) => {
    if (!relPath)
        return false;
    const parts = relPath.split(path.sep);
    // VCS
    if (parts.includes('.git'))
        return true;
    // Dependencies / build artifacts
    if (parts.includes('node_modules'))
        return true;
    if (parts.includes('dist') || parts.includes('build') || parts.includes('out'))
        return true;
    if (parts.includes('.turbo'))
        return true;
    if (parts.includes('.next') || parts.includes('.svelte-kit') || parts.includes('.nuxt'))
        return true;
    const base = path.basename(relPath);
    // Environment & OS specific
    if (base.startsWith('.env'))
        return true;
    if (base === '.DS_Store')
        return true;
    if (base === 'Thumbs.db')
        return true;
    return false;
};
const copyDir = (src, dest, base = src) => {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const rel = path.relative(base, srcPath);
        if (shouldExclude(rel))
            continue;
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            if (!fs.existsSync(destPath))
                fs.mkdirSync(destPath, { recursive: true });
            copyDir(srcPath, destPath, base);
        }
        else if (entry.isFile()) {
            fs.copyFileSync(srcPath, destPath);
        }
    }
};
const createTempDir = () => {
    const base = path.join(os.tmpdir(), 'ws-share-');
    return fs.mkdtempSync(base);
};
const generateTempSshKeyPair = async (tempDir) => {
    const keyPath = path.join(tempDir, 'id_ed25519');
    // Reuse system ssh-keygen, as in setup.ts
    await execa('ssh-keygen', ['-t', 'ed25519', '-f', keyPath, '-N', '', '-q']);
    const pubKey = fs.readFileSync(`${keyPath}.pub`, 'utf-8').trim();
    return { keyPath, pubKey };
};
const callShareInit = async (name, publicKey) => {
    const res = await fetch(`${NETAVERSES_API_BASE}/api/v1/share/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, publicKey })
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Share init failed: ${res.status} ${res.statusText} - ${text}`);
    }
    const data = await res.json();
    if (!data.sshUrl || !data.webUrl) {
        throw new Error('Invalid response from share init API');
    }
    return { sshUrl: data.sshUrl, webUrl: data.webUrl };
};
export const shareWorkspace = async (workspaceDir) => {
    const folderName = path.basename(workspaceDir);
    console.log(chalk.blue(`Preparing anonymous snapshot for workspace: ${workspaceDir}`));
    const tempDir = createTempDir();
    try {
        console.log(chalk.blue('Copying workspace to temporary directory (excluding .git, node_modules, .env, etc.)...'));
        copyDir(workspaceDir, tempDir);
        console.log(chalk.blue('Initializing clean git repository in temporary directory...'));
        await execa('git', ['init'], { cwd: tempDir });
        await execa('git', ['config', 'user.name', 'Netaverses Anonymous'], { cwd: tempDir });
        await execa('git', ['config', 'user.email', 'anon@netaverses.io'], { cwd: tempDir });
        await execa('git', ['add', '.'], { cwd: tempDir });
        try {
            await execa('git', ['commit', '-m', 'Anonymous share from Netaverses Workspace'], { cwd: tempDir });
        }
        catch (e) {
            if (e.stderr && typeof e.stderr === 'string' && e.stderr.includes('nothing to commit')) {
                console.log(chalk.yellow('Nothing to commit in workspace snapshot, creating empty repository.'));
            }
            else {
                throw e;
            }
        }
        console.log(chalk.blue('Generating ephemeral SSH key pair...'));
        const { keyPath, pubKey } = await generateTempSshKeyPair(tempDir);
        console.log(chalk.blue('Requesting anonymous repository from Netaverses...'));
        const { sshUrl, webUrl } = await callShareInit(folderName, pubKey);
        console.log(chalk.blue(`Binding remote: ${sshUrl}`));
        await execa('git', ['remote', 'add', 'origin', sshUrl], { cwd: tempDir });
        console.log(chalk.blue('Pushing snapshot to anonymous repository...'));
        const env = {
            ...process.env,
            GIT_SSH_COMMAND: `ssh -i ${keyPath} -o IdentitiesOnly=yes -o StrictHostKeyChecking=no`
        };
        // main 分支名在新 Git 版本中通常是默认；如果不是，可以在后端统一设置或这里先创建 main
        await execa('git', ['push', '-u', 'origin', 'main'], { cwd: tempDir, env });
        console.log(chalk.green('✔ Anonymous share completed!'));
        console.log(chalk.green(`✔ Repository URL: ${webUrl}`));
        console.log(chalk.yellow('ℹ This is a one-way snapshot. Further changes require a new share.'));
    }
    finally {
        try {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
        catch {
            // ignore cleanup errors
        }
    }
};
