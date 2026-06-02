import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  chatReducer,
  initialChatState,
  loadHistoryFromStorage,
  saveHistoryToStorage,
} from '../chatReducer'
import type { ChatState, ChatAction, ChatMessage } from '../../types'

describe('chatReducer 测试', () => {
  let state: ChatState

  beforeEach(() => {
    state = { ...initialChatState }
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('SEND_MESSAGE action', () => {
    it('添加用户消息到 messages', () => {
      const userMsg: ChatMessage = { role: 'user', content: '你好' }
      const newState = chatReducer(state, { type: 'SEND_MESSAGE', payload: userMsg })
      
      expect(newState.messages).toHaveLength(1)
      expect(newState.messages[0]).toEqual(userMsg)
      expect(newState.isLoading).toBe(true)
      expect(newState.error).toBeNull()
    })

    it('保存消息到 localStorage', () => {
      const userMsg: ChatMessage = { role: 'user', content: '测试' }
      
      chatReducer(state, { type: 'SEND_MESSAGE', payload: userMsg })
      
      const stored = localStorage.getItem('multichat_history')
      expect(stored).toBeTruthy()
      expect(JSON.parse(stored!)).toEqual([userMsg])
    })
  })

  describe('MODEL_CHUNK action', () => {
    it('首次接收时自动设置 selectedModel', () => {
      const action: ChatAction = {
        type: 'MODEL_CHUNK',
        payload: { model: 'gpt-4', content: '你' },
      }
      const newState = chatReducer(state, action)
      
      expect(newState.selectedModel).toBe('gpt-4')
      expect(newState.modelStatuses['gpt-4'].content).toBe('你')
      expect(newState.modelStatuses['gpt-4'].status).toBe('streaming')
    })

    it('增量更新已有模型的内容', () => {
      state.modelStatuses['gpt-4'] = {
        id: 'gpt-4',
        name: 'gpt-4',
        provider: 'openai',
        content: '你',
        status: 'streaming',
      }
      
      const action: ChatAction = {
        type: 'MODEL_CHUNK',
        payload: { model: 'gpt-4', content: '好' },
      }
      const newState = chatReducer(state, action)
      
      expect(newState.modelStatuses['gpt-4'].content).toBe('你好')
    })

    it('多模型并发时各模型状态独立更新', () => {
      const freshState: ChatState = {
        messages: [],
        modelStatuses: {},
        selectedModel: null,
        isLoading: false,
        isReconnecting: false,
        error: null,
      }
      const action1: ChatAction = {
        type: 'MODEL_CHUNK',
        payload: { model: 'gpt-4', content: 'GPT' },
      }
      const action2: ChatAction = {
        type: 'MODEL_CHUNK',
        payload: { model: 'claude-3', content: 'Claude' },
      }
      
      let newState = chatReducer(freshState, action1)
      newState = chatReducer(newState, action2)
      
      expect(newState.modelStatuses['gpt-4'].content).toBe('GPT')
      expect(newState.modelStatuses['claude-3'].content).toBe('Claude')
      expect(newState.selectedModel).toBe('gpt-4')
    })
  })

  describe('MODEL_DONE action', () => {
    it('标记模型为 done 状态', () => {
      state.modelStatuses['gpt-4'] = {
        id: 'gpt-4',
        name: 'gpt-4',
        provider: 'openai',
        content: '你好',
        status: 'streaming',
      }
      
      const action: ChatAction = {
        type: 'MODEL_DONE',
        payload: { model: 'gpt-4', content: '你好！' },
      }
      const newState = chatReducer(state, action)
      
      expect(newState.modelStatuses['gpt-4'].status).toBe('done')
      expect(newState.modelStatuses['gpt-4'].content).toBe('你好！')
    })

    it('将助手回复加入对话历史', () => {
      state.messages = [{ role: 'user', content: '你好' }]
      
      const action: ChatAction = {
        type: 'MODEL_DONE',
        payload: { model: 'gpt-4', content: '你好！有什么可以帮助你的吗？' },
      }
      const newState = chatReducer(state, action)
      
      expect(newState.messages).toHaveLength(2)
      expect(newState.messages[1]).toEqual({
        role: 'assistant',
        content: '你好！有什么可以帮助你的吗？',
        model: 'gpt-4',
      })
    })

    it('无现有状态时创建默认完成状态', () => {
      const action: ChatAction = {
        type: 'MODEL_DONE',
        payload: { model: 'new-model', content: '回复内容' },
      }
      const newState = chatReducer(state, action)
      
      expect(newState.modelStatuses['new-model']).toBeDefined()
      expect(newState.modelStatuses['new-model'].status).toBe('done')
    })
  })

  describe('MODEL_ERROR action', () => {
    it('标记模型为 error 状态', () => {
      state.modelStatuses['gpt-4'] = {
        id: 'gpt-4',
        name: 'gpt-4',
        provider: 'openai',
        content: '',
        status: 'pending',
      }
      
      const action: ChatAction = {
        type: 'MODEL_ERROR',
        payload: { model: 'gpt-4', error: 'API 错误' },
      }
      const newState = chatReducer(state, action)
      
      expect(newState.modelStatuses['gpt-4'].status).toBe('error')
      expect(newState.modelStatuses['gpt-4'].error).toBe('API 错误')
    })

    it('无现有状态时创建默认错误状态', () => {
      const action: ChatAction = {
        type: 'MODEL_ERROR',
        payload: { model: 'new-model', error: '连接失败' },
      }
      const newState = chatReducer(state, action)
      
      expect(newState.modelStatuses['new-model']).toBeDefined()
      expect(newState.modelStatuses['new-model'].status).toBe('error')
      expect(newState.modelStatuses['new-model'].error).toBe('连接失败')
    })
  })

  describe('SELECT_MODEL action', () => {
    it('切换选中的模型', () => {
      state.modelStatuses = {
        'gpt-4': { id: 'gpt-4', name: 'gpt-4', provider: 'openai', content: '回复1', status: 'done' },
        'claude-3': { id: 'claude-3', name: 'claude-3', provider: 'anthropic', content: '回复2', status: 'done' },
      }
      
      const action: ChatAction = { type: 'SELECT_MODEL', payload: 'claude-3' }
      const newState = chatReducer(state, action)
      
      expect(newState.selectedModel).toBe('claude-3')
    })
  })

  describe('SET_LOADING action', () => {
    it('设置加载状态', () => {
      const action: ChatAction = { type: 'SET_LOADING', payload: true }
      const newState = chatReducer(state, action)
      
      expect(newState.isLoading).toBe(true)
    })
  })

  describe('SET_RECONNECTING action', () => {
    it('设置重连状态', () => {
      const action: ChatAction = { type: 'SET_RECONNECTING', payload: true }
      const newState = chatReducer(state, action)
      
      expect(newState.isReconnecting).toBe(true)
    })
  })

  describe('INIT_MODELS action', () => {
    it('初始化模型列表为 pending 状态', () => {
      const action: ChatAction = {
        type: 'INIT_MODELS',
        payload: ['gpt-4', 'claude-3'],
      }
      const newState = chatReducer(state, action)
      
      expect(Object.keys(newState.modelStatuses)).toHaveLength(2)
      expect(newState.modelStatuses['gpt-4'].status).toBe('pending')
      expect(newState.modelStatuses['claude-3'].status).toBe('pending')
      expect(newState.selectedModel).toBeNull()
    })
  })

  describe('REFRESH_MODELS action', () => {
    it('添加新模型为 pending 状态', () => {
      state.modelStatuses = {
        'gpt-4': { id: 'gpt-4', name: 'gpt-4', provider: 'openai', content: '', status: 'pending' },
      }
      
      const action: ChatAction = {
        type: 'REFRESH_MODELS',
        payload: ['gpt-4', 'claude-3'],
      }
      const newState = chatReducer(state, action)
      
      expect(newState.modelStatuses['claude-3']).toBeDefined()
      expect(newState.modelStatuses['claude-3'].status).toBe('pending')
    })

    it('移除禁用且无内容的模型', () => {
      state.modelStatuses = {
        'gpt-4': { id: 'gpt-4', name: 'gpt-4', provider: 'openai', content: '有内容', status: 'done' },
        'claude-3': { id: 'claude-3', name: 'claude-3', provider: 'anthropic', content: '', status: 'pending' },
      }
      
      const action: ChatAction = {
        type: 'REFRESH_MODELS',
        payload: ['gpt-4'],
      }
      const newState = chatReducer(state, action)
      
      expect(newState.modelStatuses['gpt-4']).toBeDefined()
      expect(newState.modelStatuses['claude-3']).toBeUndefined()
    })
  })

  describe('RESET action', () => {
    it('重置所有状态为初始值', () => {
      state.messages = [{ role: 'user', content: '测试' }]
      state.modelStatuses = {
        'gpt-4': { id: 'gpt-4', name: 'gpt-4', provider: 'openai', content: '回复', status: 'done' },
      }
      state.selectedModel = 'gpt-4'
      state.isLoading = true
      
      const action: ChatAction = { type: 'RESET' }
      const newState = chatReducer(state, action)
      
      expect(newState.messages).toHaveLength(0)
      expect(newState.selectedModel).toBeNull()
      expect(newState.isLoading).toBe(false)
    })

    it('清空 localStorage', () => {
      localStorage.setItem('multichat_history', JSON.stringify([{ role: 'user', content: 'test' }]))
      
      chatReducer(state, { type: 'RESET' })
      
      const stored = localStorage.getItem('multichat_history')
      expect(stored).toBe('[]')
    })
  })

  describe('LOAD_HISTORY action', () => {
    it('恢复历史消息', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: '你好' },
        { role: 'assistant', content: '你好！', model: 'gpt-4' },
      ]
      
      const action: ChatAction = {
        type: 'LOAD_HISTORY',
        payload: { messages, selectedModel: 'gpt-4' },
      }
      const newState = chatReducer(state, action)
      
      expect(newState.messages).toEqual(messages)
      expect(newState.selectedModel).toBe('gpt-4')
      expect(newState.isLoading).toBe(false)
    })

    it('无效数据时使用空数组', () => {
      const consoleSpy = vi.spyOn(console, 'warn')
      
      const action: ChatAction = {
        type: 'LOAD_HISTORY',
        payload: { messages: 'invalid' as any, selectedModel: null },
      }
      const newState = chatReducer(state, action)
      
      expect(newState.messages).toEqual([])
      expect(consoleSpy).toHaveBeenCalled()
    })
  })
})

describe('loadHistoryFromStorage 测试', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('正常数据时返回解析后的数组', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: '你好' },
      { role: 'assistant', content: '你好！', model: 'gpt-4' },
    ]
    localStorage.setItem('multichat_history', JSON.stringify(messages))
    
    const result = loadHistoryFromStorage()
    
    expect(result).toEqual(messages)
  })

  it('无数据时返回空数组', () => {
    const result = loadHistoryFromStorage()
    
    expect(result).toEqual([])
  })

  it('空字符串时返回空数组', () => {
    localStorage.setItem('multichat_history', '')
    
    const result = loadHistoryFromStorage()
    
    expect(result).toEqual([])
  })

  it('损坏数据时返回空数组并清除数据', () => {
    localStorage.setItem('multichat_history', 'invalid json')
    
    const result = loadHistoryFromStorage()
    
    expect(result).toEqual([])
    expect(localStorage.getItem('multichat_history')).toBeNull()
  })

  it('过滤无效消息', () => {
    const invalidMessages = [
      { role: 'user', content: '有效' },
      { role: 'invalid' },
      { content: '缺少 role' },
      null,
      { role: 'assistant', content: '有效回复' },
    ] as any[]
    localStorage.setItem('multichat_history', JSON.stringify(invalidMessages))
    
    const result = loadHistoryFromStorage()
    
    expect(result).toHaveLength(2)
    expect(result[0].content).toBe('有效')
    expect(result[1].content).toBe('有效回复')
  })

  it('限制最多 10 轮对话', () => {
    const messages: ChatMessage[] = []
    for (let i = 0; i < 25; i++) {
      messages.push({ role: 'user', content: `用户消息 ${i}` })
      messages.push({ role: 'assistant', content: `助手回复 ${i}`, model: 'gpt-4' })
    }
    localStorage.setItem('multichat_history', JSON.stringify(messages))
    
    const result = loadHistoryFromStorage()
    
    expect(result.length).toBeLessThanOrEqual(20)
  })
})

describe('saveHistoryToStorage 测试', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('正常保存消息到 localStorage', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: '测试' },
      { role: 'assistant', content: '回复', model: 'gpt-4' },
    ]
    
    saveHistoryToStorage(messages)
    
    const stored = localStorage.getItem('multichat_history')
    expect(stored).toBeTruthy()
    expect(JSON.parse(stored!)).toEqual(messages)
  })
})