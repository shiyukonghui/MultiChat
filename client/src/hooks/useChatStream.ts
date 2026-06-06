import { useReducer, useRef, useCallback } from 'react';
import { chatReducer, initialChatState } from '../utils/chatReducer';
import { createChatStreamUrl, fetchModels } from '../utils/api';
import type { ChatMessage, ChatState, SSEChunkData, SSEDoneData, SSEErrorData } from '../types';

// useChatStream 返回类型
interface UseChatStreamReturn {
  state: ChatState;
  sendMessage: (message: string, activePromptContent?: string) => void;
  selectModel: (model: string) => void;
  resetSession: () => void;
  refreshModels: () => Promise<void>;
  loadHistory: (messages: ChatMessage[], selectedModel: string | null) => void;
}

// SSE 流式对话管理 Hook
// 封装 EventSource 连接、多模型状态管理和断线重连逻辑
export function useChatStream(): UseChatStreamReturn {
  const [state, dispatch] = useReducer(chatReducer, {
    ...initialChatState,
    messages: [], // 初始为空，不再从 localStorage 恢复历史对话
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const isResettingRef = useRef(false);
  // 记录已完成的模型 ID 集合，所有模型完成后主动关闭连接
  const completedRef = useRef<Set<string> | null>(null);
  const totalModelsRef = useRef(0);

  // 检查是否所有模型都已完成，若是则关闭连接
  const checkAllCompleted = useCallback((currentEventSource: EventSource | null) => {
    const completed = completedRef.current;
    const total = totalModelsRef.current;
    if (completed && total > 0 && completed.size >= total) {
      // 所有模型都已回复完成，主动关闭连接
      if (currentEventSource) {
        currentEventSource.close();
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // 关闭当前 SSE 连接
  const closeConnection = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  // 发送消息：建立 SSE 连接并监听流式事件
  const sendMessage = useCallback(
    (message: string, activePromptContent?: string) => {
      // 关闭之前可能存在的连接
      closeConnection();

      // 重置完成计数
      completedRef.current = new Set();
      totalModelsRef.current = 0;

      // 标记未在重置流程中
      isResettingRef.current = false;

      // 添加用户消息到对话历史
      const userMsg: ChatMessage = { role: 'user', content: message };
      dispatch({ type: 'SEND_MESSAGE', payload: userMsg });

      // 预先获取已启用模型数量，用于判断全部完成
      fetchModels().then((models) => {
        totalModelsRef.current = models.filter((m) => m.enabled).length;
      }).catch(() => {
        totalModelsRef.current = 0;
      });

      // 序列化对话历史（包含刚添加的用户消息）
      const messages = [...state.messages, userMsg];

      // 如果有激活的系统提示词，注入到 messages 头部
      let historyMessages = messages;
      if (activePromptContent) {
        historyMessages = [
          { role: 'system' as const, content: activePromptContent },
          ...messages,
        ];
      }

      const history = JSON.stringify(
        historyMessages.map((m) => ({
          role: m.role,
          content: m.content,
          ...(m.model ? { model: m.model } : {}),
        }))
      );

      // 构建 SSE 请求 URL
      const url = createChatStreamUrl(message, history);

      // 建立 SSE 连接
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      // 记录首个返回内容的模型
      let firstModel: string | null = null;

      // 监听 chunk 事件：流式内容增量推送
      eventSource.addEventListener('chunk', (event: MessageEvent) => {
        try {
          const data: SSEChunkData = JSON.parse(event.data);
          if (!firstModel) {
            firstModel = data.model;
          }
          dispatch({
            type: 'MODEL_CHUNK',
            payload: { model: data.model, content: data.content },
          });
        } catch (e) {
          console.error('解析 chunk 事件失败:', e);
        }
      });

      // 监听 done 事件：单个模型回复完成
      eventSource.addEventListener('done', (event: MessageEvent) => {
        try {
          const data: SSEDoneData = JSON.parse(event.data);
          dispatch({
            type: 'MODEL_DONE',
            payload: { model: data.model, content: data.content },
          });
          // 记录该模型已完成，检查是否全部完成
          completedRef.current?.add(data.model);
          checkAllCompleted(eventSource);
        } catch (e) {
          console.error('解析 done 事件失败:', e);
        }
      });

      // 监听 error 事件：区分模型级别错误和连接级别错误
      eventSource.addEventListener('error', async (event: MessageEvent) => {
        // 模型级别错误：包含 data 字段，仅标记该模型错误，不断开连接
        if (event.data) {
          try {
            const data: SSEErrorData = JSON.parse(event.data);
            dispatch({
              type: 'MODEL_ERROR',
              payload: { model: data.model, error: data.error.userMessage },
            });
            // 记录该模型已完成（错误也算完成），检查是否全部完成
            completedRef.current?.add(data.model);
            checkAllCompleted(eventSource);
            return;
          } catch (e) {
            console.error('解析 error 事件失败:', e);
          }
        }
        // 连接级别错误：EventSource 连接中断，不做额外处理
        // 所有模型完成时会主动 close，不会走到这里
        if (!isResettingRef.current && eventSource.readyState === EventSource.CLOSED) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
        // EventSource 正在自动重连时，通知用户
        if (!isResettingRef.current && eventSource.readyState === EventSource.CONNECTING) {
          dispatch({ type: 'SET_RECONNECTING', payload: true });
        }
      });

      // SSE 连接建立成功（含重连成功），从响应头获取模型数量
      eventSource.addEventListener('open', () => {
        dispatch({ type: 'SET_RECONNECTING', payload: false });
      });
    },
    [state.messages, closeConnection, checkAllCompleted]
  );

  // 选择要查看的模型回复
  const selectModel = useCallback((model: string) => {
    dispatch({ type: 'SELECT_MODEL', payload: model });
  }, []);

  // 重置会话：断开连接并清空所有状态
  const resetSession = useCallback(() => {
    isResettingRef.current = true;
    closeConnection();
    dispatch({ type: 'RESET' });
  }, [closeConnection]);

  // 刷新模型列表：从后端获取已启用的模型并更新侧边栏
  const refreshModels = useCallback(async () => {
    try {
      const models = await fetchModels();
      const enabledIds = models
        .filter((m) => m.enabled)
        .map((m) => m.id);
      dispatch({ type: 'REFRESH_MODELS', payload: enabledIds });
    } catch (e) {
      console.error('刷新模型列表失败:', e);
    }
  }, []);

  // 从历史记录恢复会话
  const loadHistory = useCallback((messages: ChatMessage[], selectedModel: string | null) => {
    // 验证参数有效性
    if (!Array.isArray(messages)) {
      console.error('loadHistory 接收到的 messages 不是数组:', messages);
      messages = [];
    }

    isResettingRef.current = true;
    closeConnection();
    dispatch({ type: 'LOAD_HISTORY', payload: { messages, selectedModel } });
  }, [closeConnection]);

  return { state, sendMessage, selectModel, resetSession, refreshModels, loadHistory };
}