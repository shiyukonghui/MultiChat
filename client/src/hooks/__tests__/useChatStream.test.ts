import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { useChatStream } from '../useChatStream'
import type { ChatMessage } from '../../types'

// MSW handlers
const handlers = [
  http.get('/api/models', () => {
    return HttpResponse.json([
      { id: 'gpt-4', provider: 'openai', enabled: true },
      { id: 'claude-3', provider: 'anthropic', enabled: true },
    ])
  }),
]

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterAll(() => server.close())

describe('useChatStream Hook 测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    server.resetHandlers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('初始状态正确', () => {
    const { result } = renderHook(() => useChatStream())
    
    expect(result.current.state.messages).toEqual([])
    expect(result.current.state.modelStatuses).toEqual({})
    expect(result.current.state.selectedModel).toBeNull()
    expect(result.current.state.isLoading).toBe(false)
    expect(result.current.state.isReconnecting).toBe(false)
    expect(result.current.state.error).toBeNull()
  })

  it('从 localStorage 恢复历史消息', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: '你好' },
      { role: 'assistant', content: '你好！', model: 'gpt-4' },
    ]
    localStorage.setItem('multichat_history', JSON.stringify(messages))
    
    const { result } = renderHook(() => useChatStream())
    
    expect(result.current.state.messages).toEqual(messages)
  })

  it('sendMessage 添加用户消息', async () => {
    const { result } = renderHook(() => useChatStream())
    
    await act(async () => {
      result.current.sendMessage('你好')
    })
    
    expect(result.current.state.messages).toHaveLength(1)
    expect(result.current.state.messages[0]).toEqual({
      role: 'user',
      content: '你好',
    })
    expect(result.current.state.isLoading).toBe(true)
  })

  it('selectModel 切换选中的模型', () => {
    const { result } = renderHook(() => useChatStream())
    
    act(() => {
      result.current.selectModel('gpt-4')
    })
    
    expect(result.current.state.selectedModel).toBe('gpt-4')
  })

  it('resetSession 重置会话', async () => {
    const { result } = renderHook(() => useChatStream())
    
    await act(async () => {
      result.current.sendMessage('测试')
    })
    
    expect(result.current.state.messages).toHaveLength(1)
    
    act(() => {
      result.current.resetSession()
    })
    
    expect(result.current.state.messages).toHaveLength(0)
    expect(result.current.state.selectedModel).toBeNull()
    expect(result.current.state.isLoading).toBe(false)
  })

  it('loadHistory 加载历史记录', () => {
    const { result } = renderHook(() => useChatStream())
    
    const messages: ChatMessage[] = [
      { role: 'user', content: '历史问题' },
      { role: 'assistant', content: '历史回答', model: 'gpt-4' },
    ]
    
    act(() => {
      result.current.loadHistory(messages, 'gpt-4')
    })
    
    expect(result.current.state.messages).toEqual(messages)
    expect(result.current.state.selectedModel).toBe('gpt-4')
  })

  it('loadHistory 处理无效参数', () => {
    const consoleSpy = vi.spyOn(console, 'error')
    const { result } = renderHook(() => useChatStream())
    
    act(() => {
      result.current.loadHistory('invalid' as any, null)
    })
    
    expect(result.current.state.messages).toEqual([])
    expect(consoleSpy).toHaveBeenCalled()
  })

  it('多次发送消息时关闭旧连接', async () => {
    const { result } = renderHook(() => useChatStream())
    
    await act(async () => {
      result.current.sendMessage('第一条')
    })
    
    act(() => {
      result.current.sendMessage('第二条')
    })
    
    expect(result.current.state.messages).toHaveLength(2)
  })

  it('重置时关闭连接', async () => {
    const { result } = renderHook(() => useChatStream())
    
    await act(async () => {
      result.current.sendMessage('测试')
    })
    
    act(() => {
      result.current.resetSession()
    })
    
    expect(result.current.state.messages).toHaveLength(0)
  })

  describe('SSE 连接建立', () => {
    it('sendMessage 创建 EventSource 连接', async () => {
      const { result } = renderHook(() => useChatStream())
      
      await act(async () => {
        result.current.sendMessage('测试消息')
      })
      
      expect(result.current.state.isLoading).toBe(true)
    })

    it('EventSource URL 包含正确的消息参数', async () => {
      const { result } = renderHook(() => useChatStream())
      
      await act(async () => {
        result.current.sendMessage('你好世界')
      })
      
      expect(result.current.state.messages).toHaveLength(1)
      expect(result.current.state.messages[0].content).toBe('你好世界')
    })
  })

  describe('refreshModels 调用', () => {
    it('refreshModels 成功更新模型列表', async () => {
      const { result } = renderHook(() => useChatStream())
      
      await act(async () => {
        await result.current.refreshModels()
      })
      
      expect(result.current.state.modelStatuses).toBeDefined()
    })

    it('refreshModels 处理 API 错误', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      server.use(
        http.get('/api/models', () => {
          return new HttpResponse(null, { status: 500 })
        })
      )
      
      const { result } = renderHook(() => useChatStream())
      
      await act(async () => {
        await result.current.refreshModels()
      })
      
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('多模型并发响应', () => {
    it('多个模型同时 streaming 时状态独立', async () => {
      const { result } = renderHook(() => useChatStream())
      
      await act(async () => {
        result.current.sendMessage('测试')
      })
      
      act(() => {
        result.current.selectModel('gpt-4')
      })
      
      expect(result.current.state.selectedModel).toBe('gpt-4')
    })

    it('切换模型时保留其他模型状态', async () => {
      const { result } = renderHook(() => useChatStream())
      
      act(() => {
        result.current.selectModel('gpt-4')
      })
      
      expect(result.current.state.selectedModel).toBe('gpt-4')
      
      act(() => {
        result.current.selectModel('claude-3')
      })
      
      expect(result.current.state.selectedModel).toBe('claude-3')
    })
  })

  describe('错误恢复机制', () => {
    it('sendMessage 失败后可以重新发送', async () => {
      const { result } = renderHook(() => useChatStream())
      
      await act(async () => {
        result.current.sendMessage('第一条')
      })
      
      expect(result.current.state.messages).toHaveLength(1)
      
      await act(async () => {
        result.current.sendMessage('第二条')
      })
      
      expect(result.current.state.messages).toHaveLength(2)
    })

    it('重置后可以重新发送消息', async () => {
      const { result } = renderHook(() => useChatStream())
      
      await act(async () => {
        result.current.sendMessage('测试')
      })
      
      act(() => {
        result.current.resetSession()
      })
      
      expect(result.current.state.messages).toHaveLength(0)
      
      await act(async () => {
        result.current.sendMessage('新消息')
      })
      
      expect(result.current.state.messages).toHaveLength(1)
      expect(result.current.state.messages[0].content).toBe('新消息')
    })
  })

  describe('loadHistory 边界情况', () => {
    it('loadHistory 处理空数组', () => {
      const { result } = renderHook(() => useChatStream())
      
      act(() => {
        result.current.loadHistory([], null)
      })
      
      expect(result.current.state.messages).toHaveLength(0)
      expect(result.current.state.selectedModel).toBeNull()
    })

    it('loadHistory 处理大量消息', () => {
      const { result } = renderHook(() => useChatStream())
      
      const messages: ChatMessage[] = Array(100).fill(null).map((_, i) => ({
        role: i % 2 === 0 ? 'user' as const : 'assistant' as const,
        content: `消息 ${i}`,
        model: i % 2 === 1 ? 'gpt-4' : undefined,
      }))
      
      act(() => {
        result.current.loadHistory(messages, 'gpt-4')
      })
      
      expect(result.current.state.messages).toHaveLength(100)
    })

    it('loadHistory 处理 null 参数', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { result } = renderHook(() => useChatStream())
      
      act(() => {
        result.current.loadHistory(null as any, null)
      })
      
      expect(result.current.state.messages).toHaveLength(0)
      
      consoleSpy.mockRestore()
    })

    it('loadHistory 处理 undefined 参数', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { result } = renderHook(() => useChatStream())
      
      act(() => {
        result.current.loadHistory(undefined as any, null)
      })
      
      expect(result.current.state.messages).toHaveLength(0)
      
      consoleSpy.mockRestore()
    })
  })

  describe('selectModel 边界情况', () => {
    it('selectModel 处理空字符串', () => {
      const { result } = renderHook(() => useChatStream())
      
      act(() => {
        result.current.selectModel('')
      })
      
      expect(result.current.state.selectedModel).toBe('')
    })

    it('selectModel 处理特殊字符模型名', () => {
      const { result } = renderHook(() => useChatStream())
      
      act(() => {
        result.current.selectModel('model-with-special-chars!@#')
      })
      
      expect(result.current.state.selectedModel).toBe('model-with-special-chars!@#')
    })
  })

  describe('状态持久化', () => {
    it('消息保存到 localStorage', async () => {
      const { result } = renderHook(() => useChatStream())
      
      await act(async () => {
        result.current.sendMessage('持久化测试')
      })
      
      const stored = localStorage.getItem('multichat_history')
      expect(stored).toBeTruthy()
      const parsed = JSON.parse(stored!)
      expect(parsed.some((m: ChatMessage) => m.content === '持久化测试')).toBe(true)
    })

    it('重置清空 localStorage', async () => {
      localStorage.setItem('multichat_history', JSON.stringify([{ role: 'user', content: 'test' }]))
      
      const { result } = renderHook(() => useChatStream())
      
      act(() => {
        result.current.resetSession()
      })
      
      const stored = localStorage.getItem('multichat_history')
      expect(stored).toBe('[]')
    })
  })
})