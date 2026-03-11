import { simpleGit } from 'simple-git';
import fs from 'node:fs';
import path from 'node:path';
const git = simpleGit();
export const gitInit = async () => {
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
        await git.init();
    }
};
export const gitSave = async (message, localOnly = false) => {
    await git.add('.');
    await git.commit(message);
    if (localOnly)
        return;
    // Auto push to origin
    try {
        const remotes = await git.getRemotes();
        if (remotes.find(r => r.name === 'origin')) {
            await git.push('origin', 'main');
        }
    }
    catch (e) {
        throw new Error('Could not push to origin, but commit saved locally.');
    }
};
export const gitStatus = async () => {
    return await git.status();
};
export const gitBindRemote = async (url) => {
    const remotes = await git.getRemotes();
    if (remotes.find(r => r.name === 'origin')) {
        await git.remote(['set-url', 'origin', url]);
    }
    else {
        await git.addRemote('origin', url);
    }
};
export const ensureGitignore = async () => {
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    const commonIgnores = [
        '# Dependency directories',
        'node_modules/',
        'jspm_packages/',
        '',
        '# Build outputs',
        'dist/',
        'build/',
        'out/',
        '.svelte-kit/',
        '.next/',
        '.nuxt/',
        '',
        '# Logs',
        '*.log',
        'npm-debug.log*',
        'yarn-debug.log*',
        'yarn-error.log*',
        '',
        '# Environment variables',
        '.env',
        '.env.local',
        '.env.*.local',
        '',
        '# OS files',
        '.DS_Store',
        'Thumbs.db',
        '',
        '# Editor files',
        '.vscode/',
        '.idea/',
        '*.suo',
        '*.ntvs*',
        '*.njsproj',
        '*.sln',
        '*.swp',
        '',
        '# Netaverses Specific',
        '.output',
        '.vercel',
        '.netlify',
        '.wrangler',
        'vite.config.js.timestamp-*',
        'vite.config.ts.timestamp-*'
    ];
    if (!fs.existsSync(gitignorePath)) {
        fs.writeFileSync(gitignorePath, commonIgnores.join('\n'));
    }
    else {
        let content = fs.readFileSync(gitignorePath, 'utf-8');
        const toAdd = commonIgnores.filter(item => item && !item.startsWith('#') && !content.includes(item));
        if (toAdd.length > 0) {
            fs.appendFileSync(gitignorePath, '\n# Added by Workspace Manager\n' + toAdd.join('\n'));
        }
    }
};
export const gitSync = async () => {
    await git.pull('origin', 'main');
    await git.push('origin', 'main');
};
