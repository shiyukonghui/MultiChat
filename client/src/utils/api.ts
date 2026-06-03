import axios from 'axios';
import type { ModelConfig, HistoryRecord, HistoryRecordSummary, Prompt } from '../types';

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

// 删除模型
export async function deleteModel(id: string): Promise<void> {
  await api.delete(`/models/${id}`);
}

// 更新模型全部配置字段
export async function updateModelDetail(id: string, model: Omit<ModelConfig, 'status' | 'reason'>): Promise<ModelConfig> {
  const response = await api.put<ModelConfig>(`/models/${id}`, model);
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

// 获取历史记录列表（只返回摘要信息，不包含完整消息）
export async function fetchHistories(): Promise<HistoryRecordSummary[]> {
  const response = await api.get<HistoryRecordSummary[]>('/histories');
  return response.data;
}

// 保存历史记录
export async function saveHistory(history: Omit<HistoryRecord, 'id' | 'timestamp'>): Promise<HistoryRecord> {
  const response = await api.post<HistoryRecord>('/histories', history);
  return response.data;
}

// 删除历史记录
export async function deleteHistory(id: string): Promise<void> {
  await api.delete(`/histories/${id}`);
}

// 获取单个历史记录的详细信息（包含完整消息内容）
export async function fetchHistoryDetail(id: string): Promise<HistoryRecord> {
  const response = await api.get<HistoryRecord>(`/histories/${id}`);
  return response.data;
}

// 获取所有提示词列表
export async function fetchPrompts(): Promise<Prompt[]> {
  const response = await api.get<Prompt[]>('/prompts');
  return response.data;
}

// 创建提示词
export async function createPrompt(data: { title: string; content: string }): Promise<Prompt> {
  const response = await api.post<Prompt>('/prompts', data);
  return response.data;
}

// 更新提示词
export async function updatePrompt(id: string, data: { title?: string; content?: string }): Promise<Prompt> {
  const response = await api.put<Prompt>(`/prompts/${id}`, data);
  return response.data;
}

// 删除提示词
export async function deletePrompt(id: string): Promise<void> {
  await api.delete(`/prompts/${id}`);
}
