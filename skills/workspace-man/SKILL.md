---
name: workspace-man
description: A simplified workspace management tool designed for non-developers. Use this skill whenever the user wants to "start a new workspace", "save their progress", "backup their work", or "sync with the cloud". This tool automatically handles local tracking and, when a NETA_TOKEN is available, can also connect to the Netaverses service for cloud backups.
---

# Workspace Manager

This skill provides a human-friendly interface for managing files in a workspace using version control under the hood, with optional integration into the Netaverses ecosystem.

## Core Philosophy
- **No Technical Jargon**: When communicating with the user, ALWAYS speak in terms of "saving progress," "making backups," "cloud synchronization," or "checkpoints." DO NOT use complex technical terminology unless the user explicitly asks about them.
- **Local-First Reliability**: Always prioritize saving work locally. Network sync is treated as an enhancement, not a requirement.
- **Silent Automation**: The tool can handle configuration, security keys, ignore rules, and remote synchronization silently. Do not bother the user with these implementation details unless an error occurs.

## Commands

Execute these commands using `pnpm start` within the `skills/workspace-man` directory:

- `pnpm start init`: Initializes the workspace.
  - Always sets up local file tracking and standard ignore rules.
  - If `process.env.NETA_TOKEN` is present, it will also prepare the connection to Netaverses (SSH key, profile) and attempt to bind a remote repository for cloud backup.
  - If `NETA_TOKEN` is missing or any network step fails, the workspace still works locally.

- `pnpm start save "<message>"`: Saves the current state.
  - Saves all changes locally with the provided message (a local "checkpoint").
  - Does **not** push to the cloud by itself.
  - To update the cloud copy (when configured), the agent should call `pnpm start sync` separately.

- `pnpm start sync`: Syncs the local workspace with the remote workspace.
  - Pulls remote changes and pushes local changes to keep them in sync.
  - Requires that a remote repository is already configured (usually via `init` with `NETA_TOKEN`).

## Execution Guidelines for Agents

1. **Interpret Intent**: Map user phrases to commands:
   - "Start a new project" → `pnpm start init`
   - "Save my work" / "Create a checkpoint" → `pnpm start save "<summary of changes>"`
   - "Upload to the cloud" / "Sync with my other computer" → `pnpm start sync`

2. **Handle Context**: Before running commands, verify you are in the correct project directory (`skills/workspace-man`) and that the working directory contains the user's files.

3. **Draft Meaningful Messages**: For `pnpm start save "<message>"`, if the user doesn't provide a specific message, summarize the recent changes in a short, user-friendly sentence (e.g., "Updated the homepage layout and added a new logo").

4. **Graceful Degradation**:
   - If `pnpm start init` runs without `NETA_TOKEN` or the network is unavailable, continue with a local-only workspace and tell the user their work is still safely saved on this device.
   - If `pnpm start sync` fails, explain that their local work is still saved and that the cloud copy will be updated once the connection is restored or configured.

## Example Interactions

**User**: "I'm done for today, please save everything."
**Agent**: (Executes `pnpm start save "End of day progress"`) "I've saved all your progress on this device. When you're ready, I can also sync it to your cloud workspace."

**User**: "I just got back to my other computer, how do I get my latest work?"
**Agent**: (Executes `pnpm start sync`) "I've synchronized your workspace with the cloud. You now have the latest version of your work here."
