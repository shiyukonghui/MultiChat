# 自动保存历史记录 Spec

## Why
当前聊天历史记录依赖前端 localStorage 自动保存，页面刷新后自动恢复；后端保存需要用户手动点击保存按钮。用户希望：
1. 页面刷新不再自动恢复之前会话
2. 模型回复后自动保存到后端，无需手动操作
3. 新打开网站时自动加载历史记录列表

## What Changes
- **前端**: 移除所有 localStorage 读写逻辑，初始 state.messages 为空数组
- **后端**: 新增 upsert 语义 API（创建或更新同一会话记录）
- **前端自动保存**: 单个模型完成时自动调用 upsert API
- **重命名功能**: 手动保存按钮改为重命名当前自动保存记录
- **历史列表预加载**: 页面挂载时自动调用 fetchHistories()
- **BREAKING**: localStorage 存储的 `multichat_history` 不再使用

## Impact
- Affected specs: 前端数据流、后端 API、历史记录交互
- Affected code:
  - `client/src/utils/chatReducer.ts` — 移除 localStorage 读写
  - `client/src/hooks/useChatStream.ts` — 初始 state 改为空数组
  - `client/src/App.tsx` — 新增自动保存逻辑、历史列表预加载、重命名功能
  - `server/src/routes/history.rs` — 新增 upsert API
  - `server/src/history.rs` — 优化写入方式

## ADDED Requirements

### Requirement: 前端初始加载不恢复历史
The system SHALL initialize `state.messages` as an empty array on page load.
- **WHEN** user refreshes the page
- **THEN** no previous conversation messages are displayed

### Requirement: 移除 localStorage 依赖
The system SHALL remove all read/write operations to localStorage key `multichat_history` in chatReducer.ts.
- **WHEN** any chat action (SEND_MESSAGE, MODEL_DONE, RESET, LOAD_HISTORY) is dispatched
- **THEN** no data is written to localStorage

### Requirement: 自动保存到后端（单个模型完成时）
The system SHALL auto-save the conversation to backend when a single model completes its response.

#### Scenario: 首次自动保存（创建）
- **WHEN** a model completes its response (MODEL_DONE dispatched)
- **AND** no `currentRecordId` exists for this session
- **THEN** frontend calls `POST /api/histories` with messages + selectedModel
- **AND** frontend stores the returned record ID as `currentRecordId`

#### Scenario: 后续自动保存（更新）
- **WHEN** another model completes or a new round starts
- **AND** `currentRecordId` already exists
- **THEN** frontend calls `PUT /api/histories/:currentRecordId` to update the same record

### Requirement: 自动保存的记录名称
The system SHALL auto-generate a name for auto-saved records using the first user message.
- **WHEN** first auto-save creates a new record
- **THEN** the record name is the first user message truncated to 30 characters + "..."

### Requirement: 手动保存改为重命名
The system SHALL change the manual save button to a rename function.

#### Scenario: 重命名自动保存记录
- **WHEN** user clicks the save/rename button
- **AND** a `currentRecordId` exists
- **THEN** a rename dialog is shown where user can modify the record name
- **AND** calling `PUT /api/histories/:id` to update only the name field

#### Scenario: 无自动保存记录时
- **WHEN** user clicks the rename button
- **AND** no `currentRecordId` exists (empty conversation)
- **THEN** button is disabled

### Requirement: 页面加载时预加载历史记录列表
The system SHALL load the history list from backend when the page mounts.
- **WHEN** the App component mounts for the first time
- **THEN** `fetchHistories()` is called silently
- **AND** the data is stored in state ready for display
- **AND** the sidebar remains closed by default

### Requirement: 自动保存的防抖和去重
The system SHALL debounce auto-save calls to prevent redundant requests.
- **WHEN** multiple MODELE_DONE events fire in quick succession
- **THEN** auto-save requests are debounced with a 300ms delay
- **AND** only the latest messages are sent in the final request

## MODIFIED Requirements

### Requirement: LOAD_HISTORY action 不再写入 localStorage
The LOAD_HISTORY action in chatReducer SHALL no longer call `saveHistoryToStorage`.

### Requirement: RESET action 重置 sessionId
The RESET action SHALL clear the `currentRecordId` so a new session starts fresh.

## REMOVED Requirements

### Requirement: localStorage 自动保存
**Reason**: 已迁移到后端自动保存
**Migration**: `chatReducer.ts` 中所有 `saveHistoryToStorage` 和 `loadHistoryFromStorage` 调用将被移除
