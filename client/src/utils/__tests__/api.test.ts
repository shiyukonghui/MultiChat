import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import {
  fetchModels,
  updateModel,
  createModel,
  deleteModel,
  createChatStreamUrl,
  fetchHistories,
  saveHistory,
  deleteHistory,
  fetchHistoryDetail,
  updateModelDetail,
  fetchPrompts,
  createPrompt,
  updatePrompt,
  deletePrompt,
} from '../api'
import type { ModelConfig, HistoryRecord, HistoryRecordSummary, Prompt } from '../../types'

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
const handlers = [
  http.get('/api/models', () => {
    return HttpResponse.json(mockModels)
  }),

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

  http.post('/api/models', async ({ request }) => {
    const body = await request.json() as Omit<ModelConfig, 'status' | 'reason'>
    const newModel: ModelConfig = {
      ...body,
      status: 'unknown',
    }
    mockModels.push(newModel)
    return HttpResponse.json(newModel)
  }),

  http.delete('/api/models/:id', ({ params }) => {
    const id = params.id as string
    const index = mockModels.findIndex(m => m.id === id)
    if (index === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    mockModels.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),

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

  http.delete('/api/histories/:id', ({ params }) => {
    const id = params.id as string
    const index = mockHistories.findIndex(h => h.id === id)
    if (index === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    mockHistories.splice(index, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/histories/:id', ({ params }) => {
    const id = params.id as string
    const history = mockHistories.find(h => h.id === id)
    if (!history) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(history)
  }),

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
]

// 设置 MSW 服务器
const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('API 模块测试', () => {
  describe('fetchModels', () => {
    it('正常返回模型配置数组', async () => {
      const models = await fetchModels()
      expect(models).toBeInstanceOf(Array)
      expect(models.length).toBeGreaterThan(0)
      expect(models[0]).toHaveProperty('id')
      expect(models[0]).toHaveProperty('provider')
      expect(models[0]).toHaveProperty('enabled')
    })

    it('网络错误时抛出异常', async () => {
      server.use(
        http.get('/api/models', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )
      await expect(fetchModels()).rejects.toThrow()
    })
  })

  describe('updateModel', () => {
    it('成功更新模型启用状态', async () => {
      await expect(updateModel('gpt-4', false)).resolves.toBeUndefined()
    })

    it('模型不存在时抛出错误', async () => {
      server.use(
        http.put('/api/models/non-existent', () => {
          return new HttpResponse(null, { status: 404 })
        })
      )
      await expect(updateModel('non-existent', true)).rejects.toThrow()
    })
  })

  describe('createModel', () => {
    it('成功创建新模型', async () => {
      const newModelData = {
        id: 'test-model',
        provider: 'test-provider',
        enabled: true,
        apiFormat: 'openai-chat-completions',
        apiEndpoint: 'https://test.com/api',
        isMultimodal: false,
        useFullUrl: false,
      }
      const model = await createModel(newModelData)
      expect(model).toHaveProperty('id', 'test-model')
      expect(model).toHaveProperty('status')
    })

    it('验证失败时抛出错误', async () => {
      server.use(
        http.post('/api/models', () => {
          return new HttpResponse(null, { status: 400 })
        })
      )
      await expect(createModel({} as any)).rejects.toThrow()
    })
  })

  describe('deleteModel', () => {
    it('成功删除模型', async () => {
      await expect(deleteModel('claude-3')).resolves.toBeUndefined()
    })

    it('模型不存在时抛出错误', async () => {
      server.use(
        http.delete('/api/models/non-existent', () => {
          return new HttpResponse(null, { status: 404 })
        })
      )
      await expect(deleteModel('non-existent')).rejects.toThrow()
    })
  })

  describe('createChatStreamUrl', () => {
    it('无历史记录时返回正确的 URL', () => {
      const url = createChatStreamUrl('你好', '')
      expect(url).toContain('/api/chat/stream')
      expect(url).toContain('message=%E4%BD%A0%E5%A5%BD')
      expect(url).not.toContain('history=')
    })

    it('有历史记录时 URL 包含 history 参数', () => {
      const history = JSON.stringify([
        { role: 'user', content: '你好' },
        { role: 'assistant', content: '你好！', model: 'gpt-4' },
      ])
      const url = createChatStreamUrl('继续', history)
      expect(url).toContain('/api/chat/stream')
      expect(url).toContain('message=%E7%BB%A7%E7%BB%AD')
      expect(url).toContain('history=')
    })
  })

  describe('fetchHistories', () => {
    it('成功返回历史记录摘要数组', async () => {
      const histories = await fetchHistories()
      expect(histories).toBeInstanceOf(Array)
      expect(histories[0]).toHaveProperty('id')
      expect(histories[0]).toHaveProperty('name')
      expect(histories[0]).toHaveProperty('timestamp')
      expect(histories[0]).toHaveProperty('messageCount')
    })
  })

  describe('saveHistory', () => {
    it('成功保存历史记录', async () => {
      const historyData = {
        name: '新对话',
        selectedModel: 'gpt-4',
        messages: [
          { role: 'user' as const, content: '测试' },
          { role: 'assistant' as const, content: '回复', model: 'gpt-4' },
        ],
      }
      const history = await saveHistory(historyData)
      expect(history).toHaveProperty('id')
      expect(history).toHaveProperty('timestamp')
      expect(history.name).toBe('新对话')
    })
  })

  describe('deleteHistory', () => {
    it('成功删除历史记录', async () => {
      await expect(deleteHistory('history-1')).resolves.toBeUndefined()
    })

    it('历史记录不存在时抛出错误', async () => {
      server.use(
        http.delete('/api/histories/non-existent', () => {
          return new HttpResponse(null, { status: 404 })
        })
      )
      await expect(deleteHistory('non-existent')).rejects.toThrow()
    })
  })

  describe('fetchHistoryDetail', () => {
    it('成功返回历史记录详情', async () => {
      const history = await fetchHistoryDetail('history-2')
      expect(history).toHaveProperty('id', 'history-2')
      expect(history).toHaveProperty('messages')
      expect(history.messages).toBeInstanceOf(Array)
      expect(history.messages[0]).toHaveProperty('role')
      expect(history.messages[0]).toHaveProperty('content')
    })

    it('历史记录不存在时抛出错误', async () => {
      server.use(
        http.get('/api/histories/non-existent', () => {
          return new HttpResponse(null, { status: 404 })
        })
      )
      await expect(fetchHistoryDetail('non-existent')).rejects.toThrow()
    })
  })

  describe('updateModelDetail', () => {
    it('成功调用 updateModelDetail', async () => {
      server.use(
        http.put('/api/models/test-model', async ({ request }) => {
          const body = await request.json()
          return HttpResponse.json({ ...body, id: 'test-model', status: 'available' })
        })
      )
      const updateData = {
        id: 'test-model',
        provider: 'test',
        enabled: true,
        apiFormat: 'openai-chat-completions',
        apiEndpoint: 'https://test.com/api',
        isMultimodal: true,
        useFullUrl: false,
      }
      const model = await updateModelDetail('test-model', updateData)
      expect(model).toHaveProperty('id', 'test-model')
      expect(model.isMultimodal).toBe(true)
    })

    it('模型不存在时抛出错误', async () => {
      server.use(
        http.put('/api/models/non-existent', () => {
          return new HttpResponse(null, { status: 404 })
        })
      )
      await expect(updateModelDetail('non-existent', {} as any)).rejects.toThrow()
    })
  })

  describe('网络错误处理', () => {
    it('fetchModels 网络超时抛出错误', async () => {
      server.use(
        http.get('/api/models', () => {
          return new HttpResponse(null, { status: 504 })
        })
      )
      await expect(fetchModels()).rejects.toThrow()
    })

    it('fetchHistories 网络错误抛出错误', async () => {
      server.use(
        http.get('/api/histories', () => {
          return new HttpResponse(null, { status: 502 })
        })
      )
      await expect(fetchHistories()).rejects.toThrow()
    })

    it('saveHistory 网络错误抛出错误', async () => {
      server.use(
        http.post('/api/histories', () => {
          return new HttpResponse(null, { status: 503 })
        })
      )
      await expect(saveHistory({} as any)).rejects.toThrow()
    })
  })

  describe('createChatStreamUrl 边界情况', () => {
    it('特殊字符正确编码', () => {
      const url = createChatStreamUrl('你好世界！@#￥%', '')
      expect(url).toContain('message=')
      expect(url).not.toContain('你好世界')
    })

    it('空消息时 URL 正确', () => {
      const url = createChatStreamUrl('', '')
      expect(url).toContain('/api/chat/stream')
      expect(url).toContain('message=')
    })

    it('长历史记录时 URL 正确', () => {
      const longHistory = JSON.stringify(
        Array(50).fill(null).map((_, i) => ({
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `消息内容 ${i}`,
          model: i % 2 === 1 ? 'gpt-4' : undefined,
        }))
      )
      const url = createChatStreamUrl('测试', longHistory)
      expect(url).toContain('/api/chat/stream')
      expect(url).toContain('history=')
    })
  })

  describe('响应数据格式验证', () => {
    it('fetchModels 返回正确的数据结构', async () => {
      server.use(
        http.get('/api/models', () => {
          return HttpResponse.json([
            {
              id: 'test-model',
              provider: 'test-provider',
              enabled: true,
              apiFormat: 'openai-chat-completions',
              apiEndpoint: 'https://test.com/api',
              isMultimodal: false,
              useFullUrl: false,
            },
          ])
        })
      )
      const models = await fetchModels()
      models.forEach(model => {
        expect(model).toHaveProperty('id')
        expect(model).toHaveProperty('provider')
        expect(model).toHaveProperty('enabled')
        expect(model).toHaveProperty('apiFormat')
        expect(model).toHaveProperty('apiEndpoint')
        expect(model).toHaveProperty('isMultimodal')
        expect(model).toHaveProperty('useFullUrl')
      })
    })

    it('fetchHistories 返回正确的数据结构', async () => {
      server.use(
        http.get('/api/histories', () => {
          return HttpResponse.json([
            {
              id: 'test-history',
              name: '测试历史',
              timestamp: Date.now(),
              selectedModel: 'gpt-4',
              messageCount: 2,
            },
          ])
        })
      )
      const histories = await fetchHistories()
      histories.forEach(history => {
        expect(history).toHaveProperty('id')
        expect(history).toHaveProperty('name')
        expect(history).toHaveProperty('timestamp')
        expect(history).toHaveProperty('selectedModel')
        expect(history).toHaveProperty('messageCount')
      })
    })

    it('fetchHistoryDetail 返回正确的数据结构', async () => {
      server.use(
        http.get('/api/histories/:id', () => {
          return HttpResponse.json({
            id: 'test-history',
            name: '测试历史',
            timestamp: Date.now(),
            selectedModel: 'gpt-4',
            messages: [
              { role: 'user', content: '你好' },
              { role: 'assistant', content: '你好！', model: 'gpt-4' },
            ],
          })
        })
      )
      const history = await fetchHistoryDetail('test-history')
      expect(history).toHaveProperty('id')
      expect(history).toHaveProperty('name')
      expect(history).toHaveProperty('timestamp')
      expect(history).toHaveProperty('messages')
      expect(Array.isArray(history.messages)).toBe(true)
    })
  })
})

// 模拟提示词数据
const mockPrompts: Prompt[] = [
  {
    id: 'prompt-1',
    title: '代码助手',
    content: '你是一个专业的代码助手。',
    createdAt: '2025-06-01T00:00:00Z',
    updatedAt: '2025-06-01T00:00:00Z',
  },
  {
    id: 'prompt-2',
    title: '翻译助手',
    content: '请将以下内容翻译成英文。',
    createdAt: '2025-06-02T00:00:00Z',
    updatedAt: '2025-06-02T00:00:00Z',
  },
]

describe('prompts API', () => {
  /// 测试获取所有提示词列表
  it('fetchPrompts 正常返回提示词数组', async () => {
    server.use(
      http.get('/api/prompts', () => {
        return HttpResponse.json(mockPrompts)
      })
    )
    const prompts = await fetchPrompts()
    expect(prompts).toBeInstanceOf(Array)
    expect(prompts.length).toBe(2)
    expect(prompts[0]).toHaveProperty('id')
    expect(prompts[0]).toHaveProperty('title')
    expect(prompts[0]).toHaveProperty('content')
    expect(prompts[0]).toHaveProperty('createdAt')
    expect(prompts[0]).toHaveProperty('updatedAt')
  })

  /// 测试 fetchPrompts 网络错误
  it('fetchPrompts 网络错误时抛出异常', async () => {
    server.use(
      http.get('/api/prompts', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )
    await expect(fetchPrompts()).rejects.toThrow()
  })

  /// 测试创建提示词
  it('createPrompt 成功创建新提示词', async () => {
    server.use(
      http.post('/api/prompts', async ({ request }) => {
        const body = await request.json() as { title: string; content: string }
        const newPrompt: Prompt = {
          id: `prompt-${Date.now()}`,
          title: body.title,
          content: body.content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        return HttpResponse.json(newPrompt)
      })
    )
    const prompt = await createPrompt({ title: '新提示词', content: '这是新提示词的内容。' })
    expect(prompt).toHaveProperty('id')
    expect(prompt).toHaveProperty('title', '新提示词')
    expect(prompt).toHaveProperty('content', '这是新提示词的内容。')
    expect(prompt).toHaveProperty('createdAt')
    expect(prompt).toHaveProperty('updatedAt')
    expect(typeof prompt.id).toBe('string')
  })

  /// 测试 createPrompt 验证失败时抛出错误
  it('createPrompt 验证失败时抛出错误', async () => {
    server.use(
      http.post('/api/prompts', () => {
        return new HttpResponse(null, { status: 400 })
      })
    )
    await expect(createPrompt({ title: '', content: '' })).rejects.toThrow()
  })

  /// 测试更新提示词
  it('updatePrompt 成功更新提示词标题', async () => {
    server.use(
      http.put('/api/prompts/prompt-1', async ({ request }) => {
        const body = await request.json() as { title?: string; content?: string }
        const updated: Prompt = {
          ...mockPrompts[0],
          ...body,
          updatedAt: new Date().toISOString(),
        }
        return HttpResponse.json(updated)
      })
    )
    const prompt = await updatePrompt('prompt-1', { title: '更新后的标题' })
    expect(prompt).toHaveProperty('id', 'prompt-1')
    expect(prompt.title).toBe('更新后的标题')
    expect(prompt.content).toBe('你是一个专业的代码助手。')
  })

  /// 测试 updatePrompt 部分更新内容
  it('updatePrompt 成功更新提示词内容', async () => {
    server.use(
      http.put('/api/prompts/prompt-2', async ({ request }) => {
        const body = await request.json() as { title?: string; content?: string }
        const updated: Prompt = {
          ...mockPrompts[1],
          ...body,
          updatedAt: new Date().toISOString(),
        }
        return HttpResponse.json(updated)
      })
    )
    const prompt = await updatePrompt('prompt-2', { content: '新的翻译内容。' })
    expect(prompt).toHaveProperty('id', 'prompt-2')
    expect(prompt.title).toBe('翻译助手')
    expect(prompt.content).toBe('新的翻译内容。')
  })

  /// 测试 deletePrompt 成功删除
  it('deletePrompt 成功删除提示词', async () => {
    server.use(
      http.delete('/api/prompts/prompt-1', () => {
        return new HttpResponse(null, { status: 204 })
      })
    )
    await expect(deletePrompt('prompt-1')).resolves.toBeUndefined()
  })

  /// 测试 deletePrompt 不存在的提示词返回错误
  it('deletePrompt 不存在的提示词时抛出错误', async () => {
    server.use(
      http.delete('/api/prompts/non-existent', () => {
        return new HttpResponse(null, { status: 404 })
      })
    )
    await expect(deletePrompt('non-existent')).rejects.toThrow()
  })

  /// 测试 fetchPrompts 返回空数组
  it('fetchPrompts 返回空数组', async () => {
    server.use(
      http.get('/api/prompts', () => {
        return HttpResponse.json([])
      })
    )
    const prompts = await fetchPrompts()
    expect(prompts).toBeInstanceOf(Array)
    expect(prompts.length).toBe(0)
  })

  /// 测试 updatePrompt 提示词不存在时抛出错误
  it('updatePrompt 提示词不存在时抛出错误', async () => {
    server.use(
      http.put('/api/prompts/non-existent', () => {
        return new HttpResponse(null, { status: 404 })
      })
    )
    await expect(updatePrompt('non-existent', { title: '新标题' })).rejects.toThrow()
  })
})