import axios from 'axios';
import type { ModelConfig } from '../types';

// 创建 axios 实例，统一配置基础路径和超时
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

// 获取所有模型配置列表
export async function fetchModels(): Promise<ModelConfig[]> {
  const response = await api.get<ModelConfig[]>('/models');
  return response.data;
}

// 更新单个模型的启用/禁用状态
export async function updateModel(id: string, enabled: boolean): Promise<void> {
  await api.put(`/models/${id}`, { enabled });
}

// 创建新模型
export async function createModel(model: Omit<ModelConfig, 'status' | 'reason'>): Promise<ModelConfig> {
  const response = await api.post<ModelConfig>('/models', model);
  return response.data;
}

// 构建 SSE 流式对话的请求 URL
export function createChatStreamUrl(message: string, history: string): string {
  const params = new URLSearchParams({ message });
  if (history) {
    params.append('history', history);
  }
  return `/api/chat/stream?${params.toString()}`;
}
