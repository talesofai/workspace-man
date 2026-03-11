---
name: workspace-man
description: A simplified workspace management tool designed for non-developers. Use this skill whenever the user wants to "save their progress," "backup their work," "check history," or "sync with the cloud." This tool automatically handles configuration, secure key generation, and integration with the Netaverses service using the user's NETA_TOKEN. It translates natural language requests into simplified operations like "save" and "sync."
---

# Workspace Manager

This skill provides a human-friendly interface for managing files in a workspace using version control under the hood, with deep integration into the Netaverses ecosystem.

## Core Philosophy
- **No Technical Jargon**: When communicating with the user, ALWAYS speak in terms of "saving progress," "making backups," "cloud synchronization," or "checkpoints." DO NOT use complex technical terminology unless the user explicitly asks about them.
- **Silent Automation**: The tool handles configuration, security keys, ignore rules, and remote synchronization silently. Do not bother the user with these implementation details unless an error occurs.
- **Local-First Reliability**: Always prioritize saving work locally. Network sync is treated as an enhancement, not a blocker.

## Commands

Execute these commands using `pnpm start` within the `skills/workspace-man` directory:

- `pnpm start init`: Initializes the workspace.
  - *Local behavior*: Sets up local file tracking and standard ignore rules.
  - *Network behavior*: If `process.env.NETA_TOKEN` is present, it generates a security key, registers it with Netaverses via API, and binds a remote repository automatically.
  - *Flag*: Use `--local` to force a local-only initialization.
- `pnpm start save "<message>"`: Saves the current state.
  - Saves all changes locally with the provided message.
  - If connected to a remote, it automatically attempts to sync to the cloud.
  - *Flag*: Use `--no-push` if you specifically only want a local checkpoint.
- `pnpm start sync`: Keeps the local workspace and the Netaverses cloud perfectly synchronized.

## Execution Guidelines for Agents

1. **Interpret Intent**: When a user says "I want to start a new project," "Save my work," or "Push to the cloud," map these to the appropriate `ws` commands via `pnpm start`.
2. **Handle Context**: Before running commands, verify you are in the correct project directory (`skills/workspace-man`).
3. **Draft Meaningful Messages**: For `pnpm start save "<message>"`, if the user doesn't provide a specific message, summarize the changes you (or the user) have made in the workspace recently into a concise, human-readable sentence. (e.g., "Updated the homepage layout and added new logo").
4. **Graceful Degradation**: If `pnpm start init` or `pnpm start sync` fails due to network issues or a missing `NETA_TOKEN`, inform the user that their work is still safe locally, and they can sync later. Provide instructions on how to get or set the `NETA_TOKEN` if appropriate.

## Example Interactions

**User**: "I'm done for today, please save everything."
**Agent**: (Executes `pnpm start save "End of day progress"`) "I've saved all your progress! Your work is safely backed up."

**User**: "I just got back to my other computer, how do I get my latest work?"
**Agent**: (Executes `pnpm start sync`) "I've synced your workspace with the cloud. You're all caught up and ready to go!"
