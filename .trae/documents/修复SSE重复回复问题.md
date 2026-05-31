# 修复 SSE 重复回复问题

## 问题分析

SSE 连接在所有模型回复完成后正常关闭 → 触发 onerror（readyState = CLOSED）→ EventSource 自动重连 → 用同样的 message + history 再次请求 → 产生重复回复。

## 修复方案

在 `useChatStream.ts` 中用 `useRef` 跟踪模型完成计数，当所有模型都完成时主动关闭 EventSource。

### 涉及文件

- `hooks/useChatStream.ts`

### 改动内容

1. 新增 `completedCountRef` 跟踪已完成模型数
2. 在 `done` 和 `error` 事件回调中，dispatch 后检查是否全部完成
3. 全部完成时：关闭 EventSource、设置 `isLoading = false`