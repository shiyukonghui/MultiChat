import { http, HttpResponse } from 'msw'
import type { ModelConfig, HistoryRecord, HistoryRecordSummary } from '../types'

// 模拟模型配置数据
const mockModels: ModelConfig[] = [
  {
    id: 'gpt-4',
    provider: 'openai',
    enabled: true,
    status: 'available',
    apiFormat: 'openai-chat-completions',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    isMultimodal: false,
    useFullUrl: false,
  },
  {
    id: 'claude-3',
    provider: 'anthropic',
    enabled: true,
    status: 'available',
    apiFormat: 'openai-chat-completions',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    isMultimodal: false,
    useFullUrl: false,
  },
  {
    id: 'gemini-pro',
    provider: 'google',
    enabled: false,
    status: 'unknown',
    apiFormat: 'openai-chat-completions',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
    isMultimodal: false,
    useFullUrl: false,
  },
]

// 模拟历史记录数据
const mockHistories: HistoryRecord[] = [
  {
    id: 'history-1',
    name: '测试对话 1',
    timestamp: Date.now() - 3600000,
    selectedModel: 'gpt-4',
    messages: [
      { role: 'user', content: '你好' },
      { role: 'assistant', content: '你好！有什么可以帮助你的吗？', model: 'gpt-4' },
    ],
  },
  {
    id: 'history-2',
    name: '测试对话 2',
    timestamp: Date.now() - 7200000,
    selectedModel: 'claude-3',
    messages: [
      { role: 'user', content: '写一个函数' },
      { role: 'assistant', content: '好的，这是一个示例函数...', model: 'claude-3' },
    ],
  },
]

// MSW handlers
export const handlers = [
  // 获取所有模型配置
  http.get('/api/models', () => {
    return HttpResponse.json(mockModels)
  }),

  // 更新模型启用状态
  http.put('/api/models/:id', async ({ params, request }) => {
    const id = params.id as string
    const body = await request.json() as { enabled: boolean }
    const model = mockModels.find(m => m.id === id)
    if (!model) {
      return new HttpResponse(null, { status: 404 })
    }
    model.enabled = body.enabled
    return HttpResponse.json(model)
  }),

  // 创建新模型
  http.post('/api/models', async ({ request }) => {
    const body = await request.json() as Omit<ModelConfig, 'status' | 'reason'>
    const newModel: ModelConfig = {
      ...body,
      status: 'unknown',
    }
    mockModels.push(newModel)
    return HttpResponse.json(newModel)
  }),

  // 删除模型
  http.delete('/api/models/:id', ({ params }) => {
    const id = params.id as string
    const index = mockModels.findIndex(m => m.id === id)
    if (index === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    mockModels.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  // 更新模型详细配置
  http.put('/api/models/:id/detail', async ({ params, request }) => {
    const id = params.id as string
    const body = await request.json() as Omit<ModelConfig, 'status' | 'reason'>
    const model = mockModels.find(m => m.id === id)
    if (!model) {
      return new HttpResponse(null, { status: 404 })
    }
    Object.assign(model, body)
    return HttpResponse.json(model)
  }),

  // 获取历史记录列表（摘要）
  http.get('/api/histories', () => {
    const summaries: HistoryRecordSummary[] = mockHistories.map(h => ({
      id: h.id,
      name: h.name,
      timestamp: h.timestamp,
      selectedModel: h.selectedModel,
      messageCount: h.messages.length,
    }))
    return HttpResponse.json(summaries)
  }),

  // 保存历史记录
  http.post('/api/histories', async ({ request }) => {
    const body = await request.json() as Omit<HistoryRecord, 'id' | 'timestamp'>
    const newHistory: HistoryRecord = {
      ...body,
      id: `history-${Date.now()}`,
      timestamp: Date.now(),
    }
    mockHistories.push(newHistory)
    return HttpResponse.json(newHistory)
  }),

  // 删除历史记录
  http.delete('/api/histories/:id', ({ params }) => {
    const id = params.id as string
    const index = mockHistories.findIndex(h => h.id === id)
    if (index === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    mockHistories.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  // 获取历史记录详情
  http.get('/api/histories/:id', ({ params }) => {
    const id = params.id as string
    const history = mockHistories.find(h => h.id === id)
    if (!history) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(history)
  }),
]