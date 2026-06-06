# Tasks

## Task 1: 后端新增 upsert API
在后端新增一个用于创建或更新同一会话历史记录的 API 端点。
- [ ] 在 `server/src/routes/history.rs` 中新增 `POST /api/histories/upsert` 路由
  - [ ] 请求体包含: `id`(可选), `name`, `selectedModel`, `messages`
  - [ ] 如果 `id` 存在且数据库中能找到该记录，则更新该记录（messages 替换为新数组）
  - [ ] 如果 `id` 不存在或未提供，则创建新记录（生成 UUID）
  - [ ] 返回该记录的完整 `HistoryRecord`（包含 id）
- [ ] 在路由注册文件中注册新路由
- [ ] 在 `client/src/utils/api.ts` 中新增 `upsertHistory` API 封装

## Task 2: 前端移除 localStorage 依赖
清理前端代码中所有 localStorage 读写逻辑。
- [ ] 修改 `client/src/utils/chatReducer.ts`
  - [ ] 删除 `STORAGE_KEY` 和 `MAX_ROUNDS` 常量
  - [ ] 删除 `loadHistoryFromStorage()` 和 `saveHistoryToStorage()` 函数
  - [ ] `SEND_MESSAGE` action 中移除 `saveHistoryToStorage` 调用
  - [ ] `MODEL_DONE` action 中移除 `saveHistoryToStorage` 调用
  - [ ] `RESET` action 中移除 `saveHistoryToStorage` 调用
  - [ ] `LOAD_HISTORY` action 中移除 `saveHistoryToStorage` 调用
- [ ] 修改 `client/src/hooks/useChatStream.ts`
  - [ ] 删除 `loadMessages()` 函数
  - [ ] `useReducer` 初始 state 中 `messages` 设为 `[]`

## Task 3: 前端实现自动保存逻辑
在模型回复完成时自动保存到后端，使用 upsert API。
- [ ] 在 `client/src/App.tsx` 中新增自动保存状态
  - [ ] 新增 `currentRecordId` 状态（`string | null`）
  - [ ] 新增 `isAutoSaving` 状态（防重复请求）
- [ ] 监听 `state.messages` 变化，当有新的 assistant 消息时触发自动保存
  - [ ] 使用 `useRef` 记录上一次保存的消息数量，避免重复保存
  - [ ] 首次保存调用 `POST /api/histories/upsert`（不带 id）
  - [ ] 后续保存调用 `POST /api/histories/upsert`（携带 `currentRecordId`）
  - [ ] 保存成功后更新 `currentRecordId`
- [ ] 自动生成的名称使用第一条 user 消息截取前 30 字符
- [ ] 重置会话时清空 `currentRecordId`

## Task 4: 手动保存按钮改为重命名功能
将现有的保存对话框改为重命名对话框。
- [ ] 创建新的 `RenameDialog` 组件或修改 `SaveHistoryDialog`
  - [ ] 标题改为"重命名对话"
  - [ ] 输入框默认显示当前记录名称
  - [ ] 调用 `PUT /api/histories/:id` 仅更新 name 字段
- [ ] 更新 `App.tsx`
  - [ ] 保存按钮改为重命名按钮（图标可以不变）
  - [ ] 无 `currentRecordId` 时禁用按钮
  - [ ] 重命名成功后更新本地列表中的名称

## Task 5: 页面加载时预加载历史记录列表
在 App 组件挂载时自动加载历史记录列表。
- [ ] 在 `App.tsx` 的 `useEffect` 中添加初始化加载
  - [ ] 组件挂载时调用 `loadHistories()`
  - [ ] 只在首次挂载时执行（空依赖数组或 ref 控制）
  - [ ] 不打开侧边栏
  - [ ] 如果加载失败，静默处理（不阻塞 UI）

# Task Dependencies
- Task 1（后端 upsert API）必须先于 Task 3（前端自动保存）完成
- Task 2（移除 localStorage）可以与 Task 1 并行进行
- Task 3（前端自动保存）依赖 Task 1 完成后才能实施
- Task 4（重命名）依赖 Task 1 完成后才能实施
- Task 5（预加载列表）可以独立并行实施
