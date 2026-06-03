# 系统提示词管理功能 - 任务分解

## Tasks

- [ ] Task 1: **后端数据模型和存储** — 创建提示词的 Rust 数据模型、YAML 文件读写逻辑
  - [ ] 1.1 创建 `server/src/models/prompt.rs`，定义 `Prompt`、`PromptsFile`、`CreatePromptRequest`、`UpdatePromptRequest` 结构体
  - [ ] 1.2 在 `server/src/models/mod.rs` 添加 `pub mod prompt;`
  - [ ] 1.3 实现 YAML 文件的读写函数（`read_prompts`、`write_prompts`）

- [ ] Task 2: **后端 CRUD API** — 实现提示词的 REST API 路由
  - [ ] 2.1 创建 `server/src/routes/prompts.rs`，实现 GET/POST/PUT/DELETE `/api/prompts` 路由
  - [ ] 2.2 实现输入校验（标题 1-50 字符，内容 1-4000 字符）
  - [ ] 2.3 在 `server/src/routes/mod.rs` 添加 `pub mod prompts;`
  - [ ] 2.4 在 `server/src/main.rs` 注册 `/api/prompts` 路由
  - [ ] 2.5 创建 `server/data/prompts.yaml` 初始空文件

- [ ] Task 3: **前端状态管理和 API 封装** — 提示词相关的前端数据层
  - [ ] 3.1 在 `client/src/types/index.ts` 新增 `Prompt` 接口
  - [ ] 3.2 在 `client/src/utils/api.ts` 新增提示词 CRUD API 方法
  - [ ] 3.3 在 `client/src/App.tsx` 新增提示词状态（prompts 列表、activePromptId），启动时加载提示词列表

- [ ] Task 4: **前端 PromptDialog 组件** — 提示词管理弹窗
  - [ ] 4.1 创建 `client/src/components/PromptDialog.tsx`，包含提示词列表、新建/编辑/删除/激活功能
  - [ ] 4.2 创建 `client/src/components/PromptForm.tsx`，提示词标题和内容的表单组件（含校验）
  - [ ] 4.3 在 `App.tsx` 工具栏添加"提示词"按钮（SmartToy 图标），点击控制 Dialog 开关

- [ ] Task 5: **发送消息时注入 System Prompt** — 消息发送流程集成
  - [ ] 5.1 修改 `ChatInput.tsx` 或发送逻辑，在构建 messages 数组时检测 activePromptId 并注入 system message
  - [ ] 5.2 确保无激活提示词时行为不变

## Task Dependencies

- [Task 1] 无依赖
- [Task 2] 依赖 [Task 1]
- [Task 3] 依赖 [Task 2]（API 可用后测试）
- [Task 4] 依赖 [Task 3]（状态和 API 就绪）
- [Task 5] 依赖 [Task 3]（需要 activePromptId 状态）