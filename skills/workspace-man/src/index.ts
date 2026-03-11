import { Command } from 'commander';
import chalk from 'chalk';
import path from 'node:path';
import fetch from 'node-fetch';
import { gitSave, gitStatus, gitInit, gitSync, gitBindRemote, ensureGitignore } from './git.js';
import { setupEnvironment, ensureGitConfig } from './setup.js';

const program = new Command();

program
  .name('ws')
  .description('Netaverses Workspace Manager - A simplified git-based workflow for humans')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize a new workspace and bind it to Gitea')
  .option('--local', 'Initialize locally without connecting to Netaverses')
  .action(async (options) => {
    try {
      await gitInit();
      await ensureGitConfig();
      await ensureGitignore();

      if (options.local) {
        console.log(chalk.green('✔ Local workspace initialized!'));
        return;
      }

      const token = process.env.NETA_TOKEN;
      if (!token) {
        console.log(chalk.yellow('! NETA_TOKEN not found. Workspace initialized locally. Run sync later to connect.'));
        return;
      }

      const user = await setupEnvironment();
      const folderName = path.basename(process.cwd());
      
      // Auto-create or bind remote repo
      const HONO_API_BASE = process.env.HONO_API_BASE || 'https://api.netaverses.cc';
      const GITEA_SSH_HOST = process.env.GITEA_SSH_HOST || 'git.netaverses.cc';
      
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
      } else {
        console.warn(chalk.yellow('Could not ensure remote repository existence. Initialized locally.'));
      }

      console.log(chalk.green('✔ Workspace initialized and connected to Netaverses!'));
    } catch (e: any) {
      console.error(chalk.red(`Error: ${e.message}`));
    }
  });

program
  .command('save')
  .description('Save current progress with a message')
  .argument('<message>', 'Description of changes')
  .option('--no-push', 'Only commit locally, do not attempt to push')
  .action(async (message, options) => {
    try {
      await gitSave(message, !options.push);
      console.log(chalk.green('✔ Progress saved locally!'));
      if (options.push) {
        console.log(chalk.green('✔ Changes pushed to remote!'));
      }
    } catch (e: any) {
      console.error(chalk.red(`Error: ${e.message}`));
    }
  });

program
  .command('sync')
  .description('Sync with remote Gitea')
  .action(async () => {
    try {
      await gitSync();
      console.log(chalk.green('✔ Workspace synced with Gitea!'));
    } catch (e: any) {
      console.error(chalk.red(`Error: ${e.message}`));
    }
  });

program.parse();
