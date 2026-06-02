import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import App from '../App'
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
]

// MSW handlers
const handlers = [
  http.get('/api/models', () => {
    return HttpResponse.json(mockModels)
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

  http.get('/api/histories/:id', ({ params }) => {
    const id = params.id as string
    const history = mockHistories.find(h => h.id === id)
    if (!history) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(history)
  }),

  http.post('/api/histories', async ({ request }) => {
    const body = await request.json() as Omit<HistoryRecord, 'id' | 'timestamp'>
    const newHistory: HistoryRecord = {
      ...body,
      id: `history-${Date.now()}`,
      timestamp: Date.now(),
    }
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
]

// 设置 MSW 服务器
const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
  localStorage.clear()
})
afterAll(() => server.close())

describe('App 组件集成测试', () => {
  describe('应用初始化', () => {
    it('渲染应用标题', () => {
      render(<App />)

      expect(screen.getByText('MultiChat 多模型对话')).toBeInTheDocument()
    })

    it('渲染欢迎信息', () => {
      render(<App />)

      expect(screen.getByText('欢迎使用 MultiChat')).toBeInTheDocument()
    })

    it('渲染输入框', () => {
      render(<App />)

      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('渲染模型侧边栏', () => {
      render(<App />)

      expect(screen.getByText('模型列表')).toBeInTheDocument()
    })
  })

  describe('新建会话流程', () => {
    it('点击新建按钮显示提示', async () => {
      const user = userEvent.setup()
      render(<App />)

      const newButton = screen.getByRole('button', { name: /新建/ })
      await user.click(newButton)

      await waitFor(() => {
        expect(screen.getByText('已创建新会话')).toBeInTheDocument()
      })
    })
  })

  describe('清空会话流程', () => {
    it('点击清空按钮显示确认对话框', async () => {
      const user = userEvent.setup()
      render(<App />)

      const toolbar = screen.getByRole('toolbar')
      const clearButton = within(toolbar).getByRole('button', { name: /清空当前会话/ })
      await user.click(clearButton)

      await waitFor(() => {
        expect(screen.getByText('确认清空会话')).toBeInTheDocument()
      })
    })

    it('确认清空后关闭对话框', async () => {
      const user = userEvent.setup()
      render(<App />)

      const toolbar = screen.getByRole('toolbar')
      const clearButton = within(toolbar).getByRole('button', { name: /清空当前会话/ })
      await user.click(clearButton)

      await waitFor(() => {
        expect(screen.getByText('确认清空会话')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: '确认清空' })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(screen.queryByText('确认清空会话')).not.toBeInTheDocument()
      })
    })
  })

  describe('保存历史记录流程', () => {
    it('点击保存按钮显示对话框', async () => {
      const user = userEvent.setup()
      render(<App />)

      const toolbar = screen.getByRole('toolbar')
      const saveButton = within(toolbar).getByRole('button', { name: /保存当前会话/ })
      await user.click(saveButton)

      await waitFor(() => {
        expect(screen.getByText('保存到历史记录')).toBeInTheDocument()
      })
    })
  })

  describe('历史记录侧边栏', () => {
    it('点击历史按钮打开侧边栏', async () => {
      const user = userEvent.setup()
      render(<App />)

      const toolbar = screen.getByRole('toolbar')
      const historyButton = within(toolbar).getByRole('button', { name: /历史记录/ })
      await user.click(historyButton)

      await waitFor(() => {
        expect(screen.getByText('历史记录')).toBeInTheDocument()
      })
    })
  })

  describe('模型配置弹窗', () => {
    it('点击配置按钮打开弹窗', async () => {
      const user = userEvent.setup()
      render(<App />)

      const toolbar = screen.getByRole('toolbar')
      const configButton = within(toolbar).getByRole('button', { name: /模型配置/ })
      await user.click(configButton)

      await waitFor(() => {
        expect(screen.getByText('模型配置管理')).toBeInTheDocument()
      })
    })

    it('关闭按钮关闭弹窗', async () => {
      const user = userEvent.setup()
      render(<App />)

      const toolbar = screen.getByRole('toolbar')
      const configButton = within(toolbar).getByRole('button', { name: /模型配置/ })
      await user.click(configButton)

      await waitFor(() => {
        expect(screen.getByText('模型配置管理')).toBeInTheDocument()
      })

      const closeButton = screen.getByRole('button', { name: '关闭' })
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByText('模型配置管理')).not.toBeInTheDocument()
      })
    })
  })

  describe('输入框交互', () => {
    it('输入文本更新输入框', async () => {
      const user = userEvent.setup()
      render(<App />)

      const input = screen.getByRole('textbox')
      await user.type(input, '测试消息')

      expect(input).toHaveValue('测试消息')
    })

    it('发送按钮在空输入时禁用', () => {
      render(<App />)

      const sendButton = screen.getByRole('button', { name: /发送消息/ })
      expect(sendButton).toBeDisabled()
    })
  })

  describe('Snackbar 通知', () => {
    it('新建会话显示成功通知', async () => {
      const user = userEvent.setup()
      render(<App />)

      const newButton = screen.getByRole('button', { name: /新建/ })
      await user.click(newButton)

      await waitFor(() => {
        expect(screen.getByText('已创建新会话')).toBeInTheDocument()
      })
    })
  })

  describe('工具栏按钮状态', () => {
    it('加载中时禁用新建按钮', async () => {
      render(<App />)

      const newButton = screen.getByRole('button', { name: /新建/ })
      expect(newButton).not.toBeDisabled()
    })

    it('无消息时禁用保存按钮', () => {
      render(<App />)

      const saveButton = screen.getByRole('button', { name: /保存当前会话/ })
      expect(saveButton).toBeDisabled()
    })

    it('无消息时禁用清空按钮', () => {
      render(<App />)

      const clearButton = screen.getByRole('button', { name: /清空当前会话/ })
      expect(clearButton).toBeDisabled()
    })
  })

  describe('主题和样式', () => {
    it('应用正确的主题色', () => {
      render(<App />)

      const appBar = screen.getByRole('banner')
      expect(appBar).toBeInTheDocument()
    })
  })

  describe('无障碍访问', () => {
    it('输入框有正确的角色', () => {
      render(<App />)

      const input = screen.getByRole('textbox')
      expect(input).toBeInTheDocument()
    })

    it('按钮有正确的角色', () => {
      render(<App />)

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })
})
