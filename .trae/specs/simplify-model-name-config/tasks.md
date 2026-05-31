# Tasks

- [x] Task 1: 修改后端配置文件结构
  - [x] SubTask 1.1: 修改 `server/src/config.rs`，移除 `ModelConfig` 结构体中的 `name` 字段
  - [x] SubTask 1.2: 修改 `server/src/models/mod.rs`，移除 `ModelConfigResponse` 结构体中的 `name` 字段
  - [x] SubTask 1.3: 修改 `server/src/routes/models.rs`，移除所有对 `name` 字段的引用

- [x] Task 2: 修改前端类型定义和组件
  - [x] SubTask 2.1: 修改 `client/src/types/index.ts`，移除 `ModelConfig` 接口中的 `name` 字段
  - [x] SubTask 2.2: 修改 `client/src/components/ModelSidebar.tsx`，将 `model.name || modelId` 改为直接使用 `modelId`
  - [x] SubTask 2.3: 修改 `client/src/pages/ModelConfigPanel.tsx`，将 `model.displayName || model.name` 改为 `model.displayName || model.id`
  - [x] SubTask 2.4: 修改 `client/src/components/AddModelDialog.tsx`，移除对 `name` 字段的引用

- [x] Task 3: 更新配置文件示例
  - [x] SubTask 3.1: 修改 `server/config/models.yaml`，移除 `name` 字段

- [x] Task 4: 验证修改
  - [x] SubTask 4.1: 编译后端代码，确保无编译错误
  - [x] SubTask 4.2: 编译前端代码，确保无 TypeScript 错误
  - [x] SubTask 4.3: 启动后端服务，验证配置加载正常
  - [x] SubTask 4.4: 启动前端服务，验证模型列表展示正常

# Task Dependencies
- Task 2 依赖 Task 1 完成
- Task 3 依赖 Task 1 和 Task 2 完成
- Task 4 依赖 Task 1、Task 2 和 Task 3 完成
