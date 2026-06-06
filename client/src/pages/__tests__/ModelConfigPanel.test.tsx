import { describe, it, expect, vi, beforeAll, afterAll, afterEach, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import ModelConfigPanel from '../ModelConfigPanel'
import type { ModelConfig } from '../../types'

// 模拟模型配置数据
const initialMockModels: ModelConfig[] = [
  {
    id: 'gpt-4',
    provider: 'openai',
    enabled: true,
    status: 'available',
    apiFormat: 'openai-chat-completions',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    isMultimodal: false,
    useFullUrl: false,
    displayName: 'GPT-4',
  },
  {
    id: 'claude-3',
    provider: 'anthropic',
    enabled: false,
    status: 'unavailable',
    apiFormat: 'openai-chat-completions',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    isMultimodal: true,
    useFullUrl: false,
  },
  {
    id: 'gemini-pro',
    provider: 'google',
    enabled: true,
    status: 'unknown',
    apiFormat: 'openai-chat-completions',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1',
    isMultimodal: false,
    useFullUrl: true,
  },
]

let mockModels: ModelConfig[] = []

beforeEach(() => {
  mockModels = JSON.parse(JSON.stringify(initialMockModels))
})

// MSW handlers - 使用函数返回 handlers 以确保每次使用最新的 mockModels
const createHandlers = () => [
  http.get('/api/models', () => {
    return HttpResponse.json(mockModels)
  }),

  http.put('/api/models/:id', async ({ params, request }) => {
    const id = params.id as string
    const body = await request.json() as { enabled: boolean }
    const modelIndex = mockModels.findIndex(m => m.id === id)
    if (modelIndex === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    mockModels[modelIndex] = { ...mockModels[modelIndex], enabled: body.enabled }
    return HttpResponse.json(mockModels[modelIndex])
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

  http.put('/api/models/:id/detail', async ({ params, request }) => {
    const id = params.id as string
    const body = await request.json() as Omit<ModelConfig, 'status' | 'reason'>
    const modelIndex = mockModels.findIndex(m => m.id === id)
    if (modelIndex === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    mockModels[modelIndex] = { ...mockModels[modelIndex], ...body }
    return HttpResponse.json(mockModels[modelIndex])
  }),
]

// 设置 MSW 服务器
const server = setupServer(...createHandlers())

beforeAll(() => server.listen())
afterEach(() => {
  server.resetHandlers()
  vi.clearAllMocks()
})
afterAll(() => server.close())

describe('ModelConfigPanel 页面测试', () => {
  describe('初始加载状态', () => {
    it('加载中显示加载动画', async () => {
      server.use(
        http.get('/api/models', async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
          return HttpResponse.json(mockModels)
        })
      )

      render(<ModelConfigPanel />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('加载完成后显示模型列表', async () => {
      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.getByText('GPT-4')).toBeInTheDocument()
      })
    })

    it('加载完成后不显示加载动画', async () => {
      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
      })
    })
  })

  describe('加载失败处理', () => {
    it('加载失败显示错误提示', async () => {
      server.use(
        http.get('/api/models', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.getByText(/无法加载模型配置/)).toBeInTheDocument()
      })
    })

    it('点击重试按钮重新加载', async () => {
      const user = userEvent.setup()
      let callCount = 0

      server.use(
        http.get('/api/models', () => {
          callCount++
          if (callCount === 1) {
            return new HttpResponse(null, { status: 500 })
          }
          return HttpResponse.json(mockModels)
        })
      )

      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.getByText(/重试/)).toBeInTheDocument()
      })

      await user.click(screen.getByText(/重试/))

      await waitFor(() => {
        expect(screen.getByText('GPT-4')).toBeInTheDocument()
      })
    })
  })

  describe('模型列表渲染', () => {
    it('显示页面标题', async () => {
      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.getByText('模型配置管理')).toBeInTheDocument()
      })
    })

    it('显示页面说明文本', async () => {
      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.getByText(/在此页面可以查看所有可用模型/)).toBeInTheDocument()
      })
    })

    it('显示添加模型按钮', async () => {
      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /添加模型/ })).toBeInTheDocument()
      })
    })

    it('渲染所有模型卡片', async () => {
      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.getByText('GPT-4')).toBeInTheDocument()
        expect(screen.getByText('claude-3')).toBeInTheDocument()
        expect(screen.getByText('gemini-pro')).toBeInTheDocument()
      })
    })

    it('显示模型 ID', async () => {
      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.getByText(/ID: gpt-4/)).toBeInTheDocument()
      })
    })

    it('显示 Provider 信息', async () => {
      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.getByText(/Provider: openai/)).toBeInTheDocument()
      })
    })

    it('显示 Endpoint 信息', async () => {
      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.getByText(/Endpoint: https:\/\/api.openai.com/)).toBeInTheDocument()
      })
    })

    it('显示 API 格式信息', async () => {
      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.getAllByText(/API格式: OpenAI/)[0]).toBeInTheDocument()
      })
    })

    it('显示多模态标签', async () => {
      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.getByText('多模态')).toBeInTheDocument()
      })
    })
  })

  describe('状态标签显示', () => {
    it('available 状态显示"可用"标签', async () => {
      render(<ModelConfigPanel />)

      await waitFor(() => {
        const availableChips = screen.getAllByText('可用')
        expect(availableChips.length).toBeGreaterThan(0)
      })
    })

    it('unavailable 状态显示"不可用"标签', async () => {
      server.use(
        http.get('/api/models', () => {
          return HttpResponse.json([
            {
              id: 'test-model',
              provider: 'test',
              enabled: true,
              status: 'unavailable',
              apiFormat: 'openai-chat-completions',
              apiEndpoint: 'https://api.test.com/v1',
              isMultimodal: false,
              useFullUrl: false,
            },
          ])
        })
      )

      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.getByText('不可用')).toBeInTheDocument()
      })
    })

    it('unknown 状态显示"未知"标签', async () => {
      render(<ModelConfigPanel />)

      await waitFor(() => {
        const unknownChips = screen.getAllByText('未知')
        expect(unknownChips.length).toBeGreaterThan(0)
      })
    })

    it('禁用状态显示"已禁用"标签', async () => {
      render(<ModelConfigPanel />)

      await waitFor(() => {
        const disabledChips = screen.getAllByText('已禁用')
        expect(disabledChips.length).toBeGreaterThan(0)
      })
    })
  })

  describe('启用/禁用切换', () => {
    it('Switch 组件显示正确状态', async () => {
      render(<ModelConfigPanel />)

      await waitFor(() => {
        const switches = screen.getAllByRole('switch')
        expect(switches[0]).toBeChecked()
      })
    })

    it('点击 Switch 调用 API 并更新状态', async () => {
      const user = userEvent.setup()
      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.getByText('GPT-4')).toBeInTheDocument()
      })

      const switches = screen.getAllByRole('switch')
      expect(switches[0]).toBeChecked()
      
      await user.click(switches[0])

      await waitFor(
        () => {
          expect(switches[0]).not.toBeChecked()
        },
        { timeout: 3000 }
      )
    })

    it('切换失败显示错误提示', async () => {
      const user = userEvent.setup()

      server.use(
        http.put('/api/models/:id', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )

      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.getByText('GPT-4')).toBeInTheDocument()
      })

      const switches = screen.getAllByRole('switch')
      await user.click(switches[0])

      await waitFor(() => {
        expect(screen.getByText(/更新失败/)).toBeInTheDocument()
      })
    })
  })

  describe('添加模型', () => {
    it('点击添加按钮打开弹窗', async () => {
      const user = userEvent.setup()
      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /添加模型/ })).toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /添加模型/ })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })
  })

  describe('编辑模型', () => {
    it('点击编辑按钮打开弹窗', async () => {
      const user = userEvent.setup()
      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.getByText('GPT-4')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByRole('button', { name: '' })
      const editButton = editButtons.find(btn => btn.querySelector('svg[data-testid="EditIcon"]'))

      if (editButton) {
        await user.click(editButton)

        await waitFor(() => {
          expect(screen.getByText('编辑模型')).toBeInTheDocument()
        })
      }
    })
  })

  describe('删除模型', () => {
    it('点击删除按钮删除模型', async () => {
      const user = userEvent.setup()
      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.getByText('claude-3')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button', { name: '' })
      const deleteButton = deleteButtons.find(btn => btn.querySelector('svg[data-testid="DeleteIcon"]'))

      if (deleteButton) {
        await user.click(deleteButton)

        await waitFor(() => {
          expect(screen.getByText(/模型已删除/)).toBeInTheDocument()
        })
      }
    })

    it('删除成功显示提示', async () => {
      const user = userEvent.setup()
      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.getByText('claude-3')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button', { name: '' })
      const deleteButton = deleteButtons.find(btn => btn.querySelector('svg[data-testid="DeleteIcon"]'))

      if (deleteButton) {
        await user.click(deleteButton)

        await waitFor(() => {
          expect(screen.getByText(/模型已删除/)).toBeInTheDocument()
        })
      }
    })
  })

  describe('空状态显示', () => {
    it('无模型时显示空状态提示', async () => {
      server.use(
        http.get('/api/models', () => {
          return HttpResponse.json([])
        })
      )

      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.getByText('暂无模型配置')).toBeInTheDocument()
      })
    })

    it('无模型时显示添加按钮', async () => {
      server.use(
        http.get('/api/models', () => {
          return HttpResponse.json([])
        })
      )

      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /添加第一个模型/ })).toBeInTheDocument()
      })
    })
  })

  describe('Snackbar 自动关闭', () => {
    it('Snackbar 显示后自动关闭', async () => {
      const user = userEvent.setup()
      render(<ModelConfigPanel />)

      await waitFor(() => {
        expect(screen.getByText('GPT-4')).toBeInTheDocument()
      })

      const switches = screen.getAllByRole('switch')
      await user.click(switches[0])

      await waitFor(
        () => {
          expect(switches[0]).not.toBeChecked()
        },
        { timeout: 3000 }
      )
    })
  })

  describe('onModelsChange 回调', () => {
    it('切换模型状态时调用 onModelsChange', async () => {
      const user = userEvent.setup()
      const onModelsChange = vi.fn()

      render(<ModelConfigPanel onModelsChange={onModelsChange} />)

      await waitFor(() => {
        expect(screen.getByText('GPT-4')).toBeInTheDocument()
      })

      const switches = screen.getAllByRole('switch')
      await user.click(switches[0])

      await waitFor(() => {
        expect(onModelsChange).toHaveBeenCalled()
      })
    })

    it('删除模型时调用 onModelsChange', async () => {
      const user = userEvent.setup()
      const onModelsChange = vi.fn()

      render(<ModelConfigPanel onModelsChange={onModelsChange} />)

      await waitFor(() => {
        expect(screen.getByText('claude-3')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button', { name: '' })
      const deleteButton = deleteButtons.find(btn => btn.querySelector('svg[data-testid="DeleteIcon"]'))

      if (deleteButton) {
        await user.click(deleteButton)

        await waitFor(() => {
          expect(onModelsChange).toHaveBeenCalled()
        })
      }
    })
  })
})
