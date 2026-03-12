#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import path from 'node:path';
import fetch from 'node-fetch';
import { gitSave, gitStatus, gitInit, gitSync, gitBindRemote, ensureGitignore } from './git.js';
import { setupEnvironment, ensureGitConfig } from './setup.js';

const HONO_API_BASE = 'https://api.netaverses.cc';
const GITEA_SSH_HOST = 'git.netaverses.cc';

const program = new Command();

program
  .name('ws')
  .description('Netaverses Workspace Manager - A simplified git-based workflow for humans')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize a new workspace (local-first) and optionally connect to Netaverses if configured')
  .action(async () => {
    try {
      await gitInit();
      await ensureGitConfig();
      await ensureGitignore();

      const token = process.env.NETA_TOKEN;
      if (!token) {
        console.log(chalk.green('✔ Local workspace initialized!'));
        console.log(chalk.yellow('ℹ To enable cloud backup later, set NETA_TOKEN and run `ws sync` when ready.'));
        return;
      }

      const user = await setupEnvironment();
      const folderName = path.basename(process.cwd());
      
      console.log(chalk.blue(`Ensuring remote repository ${folderName} exists on Netaverses...`));
      
      const res = await fetch(`${HONO_API_BASE}/api/v1/user/repos`, {
        method: 'POST',
        headers: {
          'x-token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: folderName, private: true })
      });
      
      if (res.ok || res.status === 409) {
        const sshUrl = `git@${GITEA_SSH_HOST}:${user.username || user.nick_name}/${folderName}.git`;
        await gitBindRemote(sshUrl);
        console.log(chalk.green(`✔ Remote bound: ${sshUrl}`));
        console.log(chalk.green('✔ Workspace initialized and connected to Netaverses!'));
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
  .action(async (message) => {
    try {
      await gitSave(message);
      console.log(chalk.green('✔ Progress saved locally!'));
      console.log(chalk.yellow('ℹ To update the cloud copy (if configured), run `ws sync` or `pnpm start sync` in this workspace.'));
    } catch (e: any) {
      console.error(chalk.red(`Error: ${e.message}`));
    }
  });

program
  .command('sync')
  .description('Sync local changes with the remote workspace (if a remote is configured)')
  .action(async () => {
    try {
      await gitSync();
      console.log(chalk.green('✔ Workspace synced with remote!'));
    } catch (e: any) {
      console.error(chalk.red(`Error: ${e.message}`));
    }
  });

program.parse();
