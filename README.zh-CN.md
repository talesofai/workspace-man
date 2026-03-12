# Workspace Manager (workspace-man)

一个给 AI Agent 使用的、本地优先的工作区管理 Skill。

## 安装

```bash
npx skills add talesofai/workspace-man/skills/workspace-man
```

## 这个 Skill 能做什么

它让 Agent 可以：

- 把一个文件夹初始化为工作区
- 把当前进度保存为本地检查点
- 在配置好后与 Netaverses 云端同步

Agent 应该用用户能理解的话来表达，例如：

- “帮我保存当前工作”
- “帮我打一个检查点”
- “同步到云端”

并在内部映射到这个 Skill 提供的命令。

具体行为和提示词约定见 [`skills/workspace-man/SKILL.md`](./skills/workspace-man/SKILL.md)。

## 环境变量

本地保存不需要额外配置。

云同步会使用：

- `NETA_TOKEN`

## 命令目标路径

这个 Skill 必须显式传入目标工作区路径：

- `pnpm start init --workspace <path>`
- `pnpm start save "<message>" --workspace <path>`
- `pnpm start sync --workspace <path>`
