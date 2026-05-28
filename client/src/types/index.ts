// 模型配置
export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  enabled: boolean;
  status: 'available' | 'unavailable' | 'unknown';
  reason?: string;

  // 新增字段
  apiFormat: 'openai-chat-completions' | string;
  apiEndpoint: string;
  apiKey?: string;
  isMultimodal: boolean;
  modelSeries?: string;
  displayName?: string;
  contextWindowInput?: number;
  contextWindowOutput?: number;
  toolCallRounds?: number;
  useFullUrl: boolean;
}

// 创建模型的表单数据（用于弹窗）
export interface ModelFormData {
  id: string;
  apiFormat: string;
  apiEndpoint: string;
  apiKey: string;
  isMultimodal: boolean;
  modelSeries: string;
  displayName: string;
  contextWindowInput: number;
  contextWindowOutput: number;
  toolCallRounds: number;
  useFullUrl: boolean;
  configMode: 'provider' | 'custom'; // Tab切换模式
  provider?: string; // 选择模型服务商时使用
}

// 模型表单默认值
export const DEFAULT_MODEL_FORM_DATA: ModelFormData = {
  id: '',
  apiFormat: 'openai-chat-completions',
  apiEndpoint: '',
  apiKey: '',
  isMultimodal: false,
  modelSeries: 'default',
  displayName: '',
  contextWindowInput: 184000,
  contextWindowOutput: 16000,
  toolCallRounds: 200,
  useFullUrl: false,
  configMode: 'custom',
  provider: '',
};

// API格式选项
export const API_FORMAT_OPTIONS = [
  { value: 'openai-chat-completions', label: 'OpenAI Chat Completions 格式' },
];

// 模型系列选项
export const MODEL_SERIES_OPTIONS = [
  { value: 'default', label: '默认' },
];

// 模型运行状态（单个对话周期内）
export type ModelRunStatus = 'pending' | 'streaming' | 'done' | 'error';

// 模型运行时状态
export interface ModelStatus {
  id: string;
  name: string;
  provider: string;
  status: ModelRunStatus;
  content: string;
  error?: string;
}

// 对话消息
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  model?: string;
}

// 对话全局状态
export interface ChatState {
  messages: ChatMessage[];
  modelStatuses: Record<string, ModelStatus>;
  selectedModel: string | null;
  isLoading: boolean;
  isReconnecting: boolean;
  error: string | null;
}

// SSE 流数据块
export interface SSEChunkData {
  model: string;
  content: string;
}

// SSE 完成事件数据
export interface SSEDoneData {
  model: string;
  content: string;
}

// SSE 错误事件数据
export interface SSEErrorData {
  model: string;
  error: {
    code: string;
    userMessage: string;
  };
}

// useReducer 使用的 Action 类型
export type ChatAction =
  | { type: 'SEND_MESSAGE'; payload: ChatMessage }
  | { type: 'MODEL_CHUNK'; payload: { model: string; content: string } }
  | { type: 'MODEL_DONE'; payload: { model: string; content: string } }
  | { type: 'MODEL_ERROR'; payload: { model: string; error: string } }
  | { type: 'SELECT_MODEL'; payload: string }
  | { type: 'RESET' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_RECONNECTING'; payload: boolean }
  | { type: 'INIT_MODELS'; payload: string[] };
