---
name: workspace-man
description: Use this skill when the user wants to save progress, create a checkpoint, back up their work, or sync work across devices or with the cloud. It saves locally by default and syncs with Netaverses when configured.
---

# Workspace Manager

Use this skill to save a user's workspace state and optionally sync it with Netaverses.

## Use this skill for

- Saving progress
- Creating checkpoints
- Backing up current work
- Syncing work across devices
- Cloud sync requests

## Do not use this skill for

- Editing files
- Reviewing code or content in detail
- Advanced Git workflows (branches, rebase, conflict resolution)

## Agent rules

- Speak in user terms: **save progress**, **checkpoint**, **backup**, **sync**.
- Do **not** mention Git, commits, SSH keys, remotes, or ignore rules unless the user explicitly asks.
- Prefer local safety first: saving locally is the default; cloud sync is optional.
- If setup is missing, handle it for the user instead of asking them to initialize manually.

## Commands

Run these from `skills/workspace-man`:

- `pnpm start init`
  - Prepares the current folder for this skill
  - Always works locally
  - If `NETA_TOKEN` exists, also prepares Netaverses cloud backup

- `pnpm start save "<message>"`
  - Creates a local checkpoint
  - Never pushes automatically

- `pnpm start sync`
  - Syncs local and remote state
  - Use only when cloud sync is configured or the user explicitly asks to sync

## Routing guidance

- "Save my work" / "Back this up" / "Create a checkpoint" → `pnpm start save "<summary>"`
- "Sync to the cloud" / "Get my latest work here" / "Sync across devices" → `pnpm start sync`
- If saving fails because the folder is not prepared yet, run `pnpm start init` first, then retry `save`

## Response guidance

- If the user does not provide a save message, write a short, human-readable summary.
- If cloud setup is missing or sync fails, explain that the latest work is still saved locally and cloud sync can be done later.
- Keep responses short and non-technical.
