# Workspace Manager (workspace-man)

A simplified, "local-first" workspace management tool designed specifically for non-developers. It wraps complex version control operations into a human-friendly interface and deeply integrates with the Netaverses ecosystem (Auth & Sync).

This project is built as an **Agent Skill**, allowing AI agents to seamlessly help users manage their files, save progress, and synchronize with the cloud without ever exposing them to complex technical jargon.

## Core Features

- **Zero Configuration**: Users don't need to know what SSH keys or config files are. The tool handles identity setup and secure key generation automatically.
- **Local-First**: Works perfectly offline. Users can initialize a workspace and save their progress locally without needing a network connection or authentication.
- **Smart Ignore Rules**: Automatically generates and injects common ignore rules so users don't accidentally back up temporary build files or system noise.
- **Cloud Integration**: When provided with a `NETA_TOKEN`, it automatically syncs security keys with the Netaverses API and binds a private cloud repository for backup and synchronization.

## Installation & Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```
2. **Build the CLI**:
   ```bash
   pnpm run build
   ```

## Usage (CLI)

The tool provides a simplified command set:

### `init`
Initializes a new workspace.
```bash
# Initialize locally (creates local tracking and ignore rules)
pnpm start init --local

# Initialize and connect to Netaverses (requires NETA_TOKEN env var)
NETA_TOKEN="your_token" pnpm start init
```

### `save`
Takes a snapshot of your current progress.
```bash
# Save locally and attempt to push to cloud
pnpm start save "Added the new homepage design"

# Save locally only
pnpm start save "WIP: halfway through the document" --no-push
```

### `sync`
Synchronizes your local workspace with the cloud (pulls latest changes and pushes yours).
```bash
pnpm start sync
```

## Technical Implementation (For Developers)

Under the hood, this tool is a lightweight wrapper around **Git**, designed to automate the plumbing while providing a clean abstraction for AI agents.

1. **Git Automation**: Uses `simple-git` and `execa` to perform `init`, `add`, `commit`, `push`, and `pull`. It forces local-only `git config` (user.name/email) to avoid polluting the user's global settings.
2. **SSH Management**: Automatically generates an Ed25519 key pair in `~/.ssh/id_ed25519_neta` and configures `~/.ssh/config` to ensure the correct identity is used for `git.netaverses.cc`.
3. **BFF Integration**: Communicates with the Hono-based Netaverses API (`api.netaverses.cc`) to:
   - Validate `NETA_TOKEN`.
   - Register public keys to the sync service.
   - Idempotently create remote repositories.
4. **Agent Skill**: The `SKILL.md` file defines the prompt engineering required for an Agent to translate natural language intents into these CLI operations.

## Requirements

- Node.js >= 18
- Git installed on the host machine
- `pnpm` package manager
