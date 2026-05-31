# 修复前端模型配置编辑和删除按钮不可用的问题

## 问题描述

前端模型配置管理页面（`ModelConfigPanel.tsx`）中，编辑按钮**未绑定 `onClick` 事件**，删除按钮的 `handleDeleteModel` 仅为**TODO 占位实现**（仅弹出"开发中"提示）。对应的后端 API 也缺失：

- 无 `DELETE /api/models/{id}` 接口
- 无完整更新模型全字段的 `PUT /api/models/{id}` 接口（当前仅支持更新 `enabled` 字段）

## 修复步骤

### 步骤 1：后端 — 添加删除模型 API

**目标文件**：[server/src/routes/models.rs](file:///f:/RustProjects/MultiChat/server/src/routes/models.rs)

- 添加 `delete_model` handler：根据 `id` 从模型列表中移除匹配的模型并持久化到 YAML 文件
- 模型存在时返回 `200`，不存在返回 `404`

### 步骤 2：后端 — 扩展更新模型 API（支持全字段更新）

**目标文件**：[server/src/routes/models.rs](file:///f:/RustProjects/MultiChat/server/src/routes/models.rs)

- 在 [models/mod.rs](file:///f:/RustProjects/MultiChat/server/src/models/mod.rs) 添加 `UpdateModelDetailRequest` 结构体，包含所有可更新字段（均为 `Option`，仅更新传入的字段）
- 修改 `update_model` handler 逻辑：如果请求体包含 `enabled` 以外的字段，则执行全字段更新；否则保持现有逻辑仅更新 `enabled`

### 步骤 3：后端 — 注册新路由

**目标文件**：[server/src/routes/mod.rs](file:///f:/RustProjects/MultiChat/server/src/routes/mod.rs)

- 在 `create_router()` 中添加 `delete(models::delete_model)` 路由到 `/api/models/{id}`
- 确保 `axum::routing` 导入中包含 `delete`

### 步骤 4：前端 — 添加 API 函数

**目标文件**：[client/src/utils/api.ts](file:///f:/RustProjects/MultiChat/client/src/utils/api.ts)

- 添加 `deleteModel(id: string): Promise<void>` 函数，调用 `DELETE /api/models/{id}`
- 添加 `updateModelDetail(id: string, model: Partial<ModelConfig>): Promise<ModelConfig>` 函数，调用 `PUT /api/models/{id}`（传全字段）

### 步骤 5：前端 — 改造 AddModelDialog 以支持编辑模式

**目标文件**：[client/src/components/AddModelDialog.tsx](file:///f:/RustProjects/MultiChat/client/src/components/AddModelDialog.tsx)

- 新增 `editModel?: ModelConfig` prop
- 新增 `onUpdate?: (id: string, model: Omit<ModelConfig, 'status' | 'reason'>) => void` prop
- 当 `editModel` 不为空时：
  - 对话框标题显示"编辑模型"
  - 表单回填现有模型数据
  - 提交按钮显示"保存修改"
  - 提交时调用 `onUpdate` 而非 `onSubmit`
- 当关闭弹窗时重置 `editModel` 状态

### 步骤 6：前端 — 实现编辑和删除逻辑

**目标文件**：[client/src/pages/ModelConfigPanel.tsx](file:///f:/RustProjects/MultiChat/client/src/pages/ModelConfigPanel.tsx)

- 新增 `editingModel` 状态（用于跟踪正在编辑的模型）
- 新增 `handleEditModel(model: ModelConfig)` 函数：设置 `editingModel` 并打开弹窗
- 新增 `handleUpdateModel` 函数：调用 `updateModelDetail` API 并刷新列表
- 实现 `handleDeleteModel`：调用 `deleteModel` API，成功后从本地列表移除并刷新
- 为编辑按钮绑定 `onClick={() => handleEditModel(model)}`
- 将 `AddModelDialog` 扩展为支持编辑模式：传入 `editModel`、`onUpdate` 和 `onSubmit` 回调

### 步骤 7：验证

- 确认后端编译通过
- 确认前端编译通过
- 手动测试编辑和删除功能