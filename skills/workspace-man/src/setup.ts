import { execa } from 'execa';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import fetch from 'node-fetch';
import chalk from 'chalk';

const HONO_API_BASE = 'https://api.netaverses.cc';
const GITEA_SSH_HOST = 'git.netaverses.cc';

export async function ensureGitConfig() {
  try {
    const { stdout: name } = await execa('git', ['config', 'user.name']);
    const { stdout: email } = await execa('git', ['config', 'user.email']);
    if (name && email) return;
  } catch (e) {
    // Config missing, continue to set defaults
  }

  console.log(chalk.blue('Setting up default git configuration...'));
  const fallbackName = os.userInfo().username || 'neta-user';
  const fallbackEmail = `${fallbackName}@netaverses.cc`;

  try {
    await execa('git', ['config', 'user.name', fallbackName]);
    await execa('git', ['config', 'user.email', fallbackEmail]);
  } catch (e) {
    console.warn(chalk.yellow('Failed to set local git config.'));
  }
}

export async function setupEnvironment() {
  const token = process.env.NETA_TOKEN;
  if (!token) {
    throw new Error('Missing NETA_TOKEN environment variable. Please authenticate with Netaverses first.');
  }

  // 1. Check/Generate SSH Key
  const sshDir = path.join(os.homedir(), '.ssh');
  const keyPath = path.join(sshDir, 'id_ed25519_neta');
  
  if (!fs.existsSync(keyPath)) {
    console.log(chalk.blue('Generating new Netaverses SSH key...'));
    if (!fs.existsSync(sshDir)) fs.mkdirSync(sshDir, { recursive: true });
    await execa('ssh-keygen', ['-t', 'ed25519', '-f', keyPath, '-N', '']);
  }

  const pubKey = fs.readFileSync(`${keyPath}.pub`, 'utf-8').trim();

  // 2. Sync SSH Key to Gitea via Hono BFF
  console.log(chalk.blue('Syncing SSH key via Netaverses API...'));
  const user = await fetchAuthUser(token);
  await uploadSshKey(token, pubKey, `neta-ws-${os.hostname()}`);

  // 3. Configure git config with remote info
  console.log(chalk.blue('Configuring git with Netaverses profile...'));
  
  const userName = user.nick_name || user.username || 'neta-user';
  const fakeEmail = `${userName}@netaverses.cc`;
  
  await execa('git', ['config', 'user.name', userName]);
  await execa('git', ['config', 'user.email', fakeEmail]);
  
  // Ensure SSH uses the specific key for this domain
  setupSshConfig(keyPath);

  return user;
}

async function fetchAuthUser(token: string) {
  const res = await fetch(`${HONO_API_BASE}/v1/user/`, {
    headers: { 'x-token': token }
  });
  if (!res.ok) throw new Error(`Failed to fetch user profile: ${res.statusText}`);
  return await res.json() as any;
}

async function uploadSshKey(token: string, key: string, title: string) {
  // Use the Hono API to proxy the SSH key upload to Gitea
  // This ensures the user is validated by Hono first
  const res = await fetch(`${HONO_API_BASE}/api/v1/user/keys`, {
    method: 'POST',
    headers: {
      'x-token': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ key, title })
  });
  
  if (res.status === 422 || res.status === 409) {
    console.log(chalk.yellow('SSH key already registered.'));
  } else if (!res.ok) {
    const errorText = await res.text();
    console.warn(chalk.yellow(`Could not upload SSH key via API: ${errorText}`));
  }
}

function setupSshConfig(keyPath: string) {
  const sshConfigPath = path.join(os.homedir(), '.ssh', 'config');
  const configEntry = `
Host ${GITEA_SSH_HOST}
  HostName ${GITEA_SSH_HOST}
  IdentityFile ${keyPath}
  User git
`;
  if (!fs.existsSync(sshConfigPath) || !fs.readFileSync(sshConfigPath, 'utf-8').includes(GITEA_SSH_HOST)) {
    fs.appendFileSync(sshConfigPath, configEntry);
  }
}
