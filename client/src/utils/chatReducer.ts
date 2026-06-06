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


// 对话状态 Reducer
// 管理消息列表、多模型流式状态、选中模型和加载/错误状态
export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    // 发送新消息：将用户消息追加到历史，进入加载状态
    case 'SEND_MESSAGE': {
      const newMessages = [...state.messages, action.payload];
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

    // 刷新模型列表：添加新增模型，移除已禁用的空状态模型
    case 'REFRESH_MODELS': {
      const modelIds = action.payload;
      const newStatuses = { ...state.modelStatuses };

      // 添加新增模型为 pending 状态
      modelIds.forEach((id) => {
        if (!newStatuses[id]) {
          newStatuses[id] = {
            id,
            name: id,
            provider: '',
            content: '',
            status: 'pending',
          };
        }
      });

      // 移除已被禁用且从未有内容的模型（pending 状态且内容为空）
      Object.keys(newStatuses).forEach((id) => {
        if (!modelIds.includes(id)) {
          const status = newStatuses[id];
          if (status.status === 'pending' && !status.content) {
            delete newStatuses[id];
          }
        }
      });

      return { ...state, modelStatuses: newStatuses };
    }

    // 重置会话：清空所有状态
    case 'RESET': {
      return { ...initialChatState };
    }

    // 从历史记录恢复会话
    case 'LOAD_HISTORY': {
      const { messages, selectedModel } = action.payload;

      // 验证 messages 是否为数组，防止传入无效数据
      const validMessages = Array.isArray(messages) ? messages : [];
      if (!Array.isArray(messages)) {
        console.warn('LOAD_HISTORY 接收到的 messages 不是数组，已使用空数组代替');
      }

      return {
        ...state,
        messages: validMessages,
        selectedModel,
        modelStatuses: {},
        isLoading: false,
      };
    }

    default:
      return state;
  }
}
