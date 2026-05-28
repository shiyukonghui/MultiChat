import type { ChatState, ChatAction, ModelStatus, ChatMessage } from '../types';

// 初始对话状态
export const initialChatState: ChatState = {
  messages: [],
  modelStatuses: {},
  selectedModel: null,
  isLoading: false,
  isReconnecting: false,
  error: null,
};

// localStorage 存储键和保留轮数
const STORAGE_KEY = 'multichat_history';
const MAX_ROUNDS = 10;

// 从 localStorage 恢复对话历史
// 保留最近 N 轮（每轮包含 user + assistant 两条消息）
export function loadHistoryFromStorage(): ChatMessage[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const messages: ChatMessage[] = JSON.parse(stored);
      return messages.slice(-MAX_ROUNDS * 2);
    }
  } catch (e) {
    console.error('恢复对话历史失败:', e);
  }
  return [];
}

// 保存对话历史到 localStorage
export function saveHistoryToStorage(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {
    console.error('保存对话历史失败:', e);
  }
}

// 对话状态 Reducer
// 管理消息列表、多模型流式状态、选中模型和加载/错误状态
export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    // 发送新消息：将用户消息追加到历史，进入加载状态
    case 'SEND_MESSAGE': {
      const newMessages = [...state.messages, action.payload];
      saveHistoryToStorage(newMessages);
      return {
        ...state,
        messages: newMessages,
        isLoading: true,
        error: null,
      };
    }

    // 模型流式内容增量更新：追加片段到对应模型的 content
    case 'MODEL_CHUNK': {
      const { model, content } = action.payload;
      const currentModel = state.modelStatuses[model];

      // 首个返回内容的模型自动设为选中
      const newSelectedModel =
        state.selectedModel === null ? model : state.selectedModel;

      // 更新现有模型状态，或为首次出现的模型创建新状态
      const updatedStatus: ModelStatus = currentModel
        ? {
            ...currentModel,
            content: currentModel.content + content,
            status: 'streaming',
          }
        : {
            id: model,
            name: model,
            provider: '',
            content,
            status: 'streaming',
          };

      return {
        ...state,
        selectedModel: newSelectedModel,
        modelStatuses: {
          ...state.modelStatuses,
          [model]: updatedStatus,
        },
      };
    }

    // 模型回复完成：标记该模型为 done，并将完整回复追加到对话历史
    case 'MODEL_DONE': {
      const { model, content } = action.payload;
      const currentModel = state.modelStatuses[model];

      const doneStatus: ModelStatus = currentModel
        ? { ...currentModel, content, status: 'done' }
        : { id: model, name: model, provider: '', content, status: 'done' };

      // 助手回复加入对话历史
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content,
        model,
      };
      const newMessages = [...state.messages, assistantMsg];
      saveHistoryToStorage(newMessages);

      return {
        ...state,
        messages: newMessages,
        modelStatuses: {
          ...state.modelStatuses,
          [model]: doneStatus,
        },
      };
    }

    // 模型调用出错：标记该模型为 error 状态并记录错误信息
    case 'MODEL_ERROR': {
      const { model, error } = action.payload;
      const currentModel = state.modelStatuses[model];

      const errorStatus: ModelStatus = currentModel
        ? { ...currentModel, status: 'error', error }
        : { id: model, name: model, provider: '', content: '', status: 'error', error };

      return {
        ...state,
        modelStatuses: {
          ...state.modelStatuses,
          [model]: errorStatus,
        },
      };
    }

    // 选择查看的模型：切换右侧面板展示的模型回复
    case 'SELECT_MODEL': {
      return { ...state, selectedModel: action.payload };
    }

    // 设置加载状态
    case 'SET_LOADING': {
      return { ...state, isLoading: action.payload };
    }

    // SSE 连接重连状态
    case 'SET_RECONNECTING': {
      return { ...state, isReconnecting: action.payload };
    }

    // 初始化模型列表：请求开始时清空状态并设置所有模型为 pending
    case 'INIT_MODELS': {
      const modelIds = action.payload;
      const newStatuses: Record<string, ModelStatus> = {};
      modelIds.forEach((id) => {
        newStatuses[id] = {
          id,
          name: id,
          provider: '',
          content: '',
          status: 'pending',
        };
      });
      return {
        ...state,
        modelStatuses: newStatuses,
        selectedModel: null,
        error: null,
      };
    }

    // 重置会话：清空所有状态并持久化空历史
    case 'RESET': {
      saveHistoryToStorage([]);
      return { ...initialChatState };
    }

    default:
      return state;
  }
}
