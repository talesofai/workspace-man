#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import path from 'node:path';
import fs from 'node:fs';
import fetch from 'node-fetch';
import { gitSave, gitInit, gitSync, gitBindRemote, ensureGitignore } from './git.js';
import { setupEnvironment, ensureGitConfig } from './setup.js';
import { shareWorkspace } from './share.js';
import { NETAVERSES_API_BASE } from './config.js';

const GITEA_SSH_HOST = 'git.netaverses.cc';

const resolveWorkspaceDir = (workspace: string) => {
  const workspaceDir = path.resolve(workspace);

  if (!fs.existsSync(workspaceDir)) {
    throw new Error(`Workspace directory does not exist: ${workspaceDir}`);
  }

  return workspaceDir;
};

const program = new Command();

program
  .name('ws')
  .description('Netaverses Workspace Manager - A simplified git-based workflow for humans')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize a new workspace (local-first) and optionally connect to Netaverses if configured')
  .requiredOption('-w, --workspace <path>', 'Path to the user workspace directory')
  .action(async (options) => {
    try {
      const workspaceDir = resolveWorkspaceDir(options.workspace);
      await gitInit(workspaceDir);
      await ensureGitConfig(workspaceDir);
      await ensureGitignore(workspaceDir);

      const token = process.env.NETA_TOKEN;
      if (!token) {
        console.log(chalk.green(`✔ Local workspace initialized: ${workspaceDir}`));
        console.log(chalk.yellow('ℹ To enable cloud backup later, set NETA_TOKEN and run `ws sync` when ready.'));
        return;
      }

      const user = await setupEnvironment(workspaceDir);
      const folderName = path.basename(workspaceDir);

      console.log(chalk.blue(`Ensuring remote repository ${folderName} exists on Netaverses...`));

      const res = await fetch(`${NETAVERSES_API_BASE}/api/v1/user/repos`, {
        method: 'POST',
        headers: {
          'x-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: folderName, private: true })
      });

      if (res.ok || res.status === 409) {
        const sshUrl = `git@${GITEA_SSH_HOST}:${user.username || user.nick_name}/${folderName}.git`;
        await gitBindRemote(workspaceDir, sshUrl);
        console.log(chalk.green(`✔ Remote bound: ${sshUrl}`));
        console.log(chalk.green(`✔ Workspace initialized and connected to Netaverses: ${workspaceDir}`));
      } else {
        console.warn(chalk.yellow('Could not ensure remote repository existence. Workspace is initialized locally and can be synced later.'));
      }
    } catch (e: any) {
      console.error(chalk.red(`Error: ${e.message}`));
    }
  });

program
  .command('save')
  .description('Save current progress with a message (local checkpoint only)')
  .argument('<message>', 'Description of changes')
  .requiredOption('-w, --workspace <path>', 'Path to the user workspace directory')
  .action(async (message, options) => {
    try {
      const workspaceDir = resolveWorkspaceDir(options.workspace);
      await gitSave(workspaceDir, message);
      console.log(chalk.green(`✔ Progress saved locally: ${workspaceDir}`));
      console.log(chalk.yellow('ℹ To update the cloud copy (if configured), run `ws sync` or `pnpm start sync` in this workspace.'));
    } catch (e: any) {
      console.error(chalk.red(`Error: ${e.message}`));
    }
  });

program
  .command('sync')
  .description('Sync local changes with the remote workspace (if a remote is configured)')
  .requiredOption('-w, --workspace <path>', 'Path to the user workspace directory')
  .action(async (options) => {
    try {
      const workspaceDir = resolveWorkspaceDir(options.workspace);
      await gitSync(workspaceDir);
      console.log(chalk.green(`✔ Workspace synced with remote: ${workspaceDir}`));
    } catch (e: any) {
      console.error(chalk.red(`Error: ${e.message}`));
    }
  });

program
  .command('share')
  .description('Share a snapshot of the workspace anonymously to Netaverses')
  .requiredOption('-w, --workspace <path>', 'Path to the user workspace directory')
  .action(async (options) => {
    try {
      const workspaceDir = resolveWorkspaceDir(options.workspace);
      await shareWorkspace(workspaceDir);
    } catch (e: any) {
      console.error(chalk.red(`Error: ${e.message}`));
    }
  });

program.parse();