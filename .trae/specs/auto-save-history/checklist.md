# Checklist

## Task 1: 后端 upsert API
- [x] `POST /api/histories/upsert` 路由存在且可访问
- [x] 带 id 请求时更新已有记录（内容替换）
- [x] 不带 id 请求时创建新记录
- [x] 返回的响应中包含完整的 HistoryRecord（含 id）
- [x] 前端 `api.ts` 中有对应的 `upsertHistory` 函数

## Task 2: 移除 localStorage 依赖
- [x] `chatReducer.ts` 中不再引用 `STORAGE_KEY`
- [x] `chatReducer.ts` 中 `loadHistoryFromStorage()` 已删除
- [x] `chatReducer.ts` 中 `saveHistoryToStorage()` 已删除
- [x] 所有 reducer action 中不再调用 `saveHistoryToStorage`
- [x] `useChatStream.ts` 中不再导入 `loadHistoryFromStorage`
- [x] `useReducer` 初始 state 的 `messages` 为 `[]`
- [x] 页面刷新后不显示之前对话

## Task 3: 前端自动保存
- [x] 模型回复完成（MODEL_DONE）后自动触发保存
- [x] 首次保存创建新记录并存储 `currentRecordId`
- [x] 后续保存使用 `currentRecordId` 更新同一条记录
- [x] 自动生成的名称是第一条 user 消息截取前 30 字符
- [x] 连续快速完成多个模型时不会重复创建记录
- [x] 重置会话后 `currentRecordId` 被清空
- [x] 新会话重新开始自动保存流程

## Task 4: 手动保存改为重命名
- [x] 保存按钮改为重命名功能
- [x] 弹出重命名对话框，显示当前名称
- [x] 用户可以修改名称并确认
- [x] 无 `currentRecordId` 时按钮禁用
- [x] 重命名后历史记录列表中的名称更新

## Task 5: 页面预加载历史列表
- [x] 页面加载时自动调用 `fetchHistories()`
- [x] 加载失败时不阻塞页面渲染
- [x] 侧边栏保持关闭状态
- [x] 打开侧边栏时直接显示已加载的数据
