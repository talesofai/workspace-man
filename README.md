# Workspace Manager (workspace-man)

A local-first workspace management skill for AI agents.

## Install

```bash
npx skills add talesofai/workspace-man/skills/workspace-man
```

## What this skill does

This skill lets agents:

- Initialize a folder as a workspace
- Save progress as local checkpoints
- Sync with the Netaverses cloud when configured

Agents should speak to users in simple terms like:

- "save my work"
- "create a checkpoint"
- "sync with the cloud"

and map those intents to this skill's commands.

See [`skills/workspace-man/SKILL.md`](./skills/workspace-man/SKILL.md) for behavior and prompting guidance.

## Environment

Local save flows work without extra configuration.

For cloud sync, the skill uses:

- `NETA_TOKEN`
