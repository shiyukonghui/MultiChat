import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StreamingResponse from '../StreamingResponse'
import type { ModelStatus } from '../../types'

describe('StreamingResponse 组件测试', () => {
  it('无模型选中时显示提示', () => {
    render(<StreamingResponse modelStatus={undefined} />)
    
    expect(screen.getByText('选择一个模型查看回复')).toBeInTheDocument()
  })

  it('pending 状态时显示加载动画', () => {
    const modelStatus: ModelStatus = {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'openai',
      content: '',
      status: 'pending',
    }
    
    render(<StreamingResponse modelStatus={modelStatus} />)
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByText(/等待 GPT-4 回复中/)).toBeInTheDocument()
  })

  it('streaming 状态时显示内容', () => {
    const modelStatus: ModelStatus = {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'openai',
      content: '你好',
      status: 'streaming',
    }
    
    render(<StreamingResponse modelStatus={modelStatus} />)
    
    expect(screen.getByText('你好')).toBeInTheDocument()
  })

  it('done 状态时显示完整内容', () => {
    const modelStatus: ModelStatus = {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'openai',
      content: '你好！有什么可以帮助你的吗？',
      status: 'done',
    }
    
    render(<StreamingResponse modelStatus={modelStatus} />)
    
    expect(screen.getByText(/你好/)).toBeInTheDocument()
    expect(screen.getByText(/有什么可以帮助你的吗/)).toBeInTheDocument()
  })

  it('error 状态时显示错误提示', () => {
    const modelStatus: ModelStatus = {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'openai',
      content: '',
      status: 'error',
      error: 'API 调用失败',
    }
    
    render(<StreamingResponse modelStatus={modelStatus} />)
    
    expect(screen.getByText('API 调用失败')).toBeInTheDocument()
  })

  it('无错误信息时显示默认错误提示', () => {
    const modelStatus: ModelStatus = {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'openai',
      content: '',
      status: 'error',
    }
    
    render(<StreamingResponse modelStatus={modelStatus} />)
    
    expect(screen.getByText('模型返回异常，请稍后重试')).toBeInTheDocument()
  })

  it('渲染 Markdown 标题', () => {
    const modelStatus: ModelStatus = {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'openai',
      content: '# 标题\n## 二级标题',
      status: 'done',
    }
    
    render(<StreamingResponse modelStatus={modelStatus} />)
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('标题')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('二级标题')
  })

  it('渲染 Markdown 列表', () => {
    const modelStatus: ModelStatus = {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'openai',
      content: '- 项目 1\n- 项目 2',
      status: 'done',
    }
    
    render(<StreamingResponse modelStatus={modelStatus} />)
    
    const listItems = screen.getAllByRole('listitem')
    expect(listItems).toHaveLength(2)
  })

  it('渲染 Markdown 代码块', () => {
    const modelStatus: ModelStatus = {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'openai',
      content: '```javascript\nconst x = 1;\n```',
      status: 'done',
    }
    
    render(<StreamingResponse modelStatus={modelStatus} />)
    
    expect(screen.getByRole('code')).toBeInTheDocument()
  })

  it('渲染 Markdown 表格', () => {
    const modelStatus: ModelStatus = {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'openai',
      content: '| 列1 | 列2 |\n|-----|-----|\n| 值1 | 值2 |',
      status: 'done',
    }
    
    render(<StreamingResponse modelStatus={modelStatus} />)
    
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('列1')).toBeInTheDocument()
    expect(screen.getByText('值1')).toBeInTheDocument()
  })

  it('渲染 Markdown 引用', () => {
    const modelStatus: ModelStatus = {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'openai',
      content: '> 这是一段引用',
      status: 'done',
    }
    
    render(<StreamingResponse modelStatus={modelStatus} />)
    
    expect(screen.getByText('这是一段引用')).toBeInTheDocument()
  })

  it('空内容时不崩溃', () => {
    const modelStatus: ModelStatus = {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'openai',
      content: '',
      status: 'done',
    }
    
    render(<StreamingResponse modelStatus={modelStatus} />)
    
    expect(screen.queryByText('选择一个模型查看回复')).not.toBeInTheDocument()
  })

  it('pending 状态时显示模型名称', () => {
    const modelStatus: ModelStatus = {
      id: 'claude-3',
      name: 'Claude 3',
      provider: 'anthropic',
      content: '',
      status: 'pending',
    }
    
    render(<StreamingResponse modelStatus={modelStatus} />)
    
    expect(screen.getByText(/等待 Claude 3 回复中/)).toBeInTheDocument()
  })

  it('pending 状态无 name 时显示 id', () => {
    const modelStatus: ModelStatus = {
      id: 'unknown-model',
      name: 'unknown-model',
      provider: '',
      content: '',
      status: 'pending',
    }
    
    render(<StreamingResponse modelStatus={modelStatus} />)
    
    expect(screen.getByText(/等待 unknown-model 回复中/)).toBeInTheDocument()
  })

  describe('更多 Markdown 元素渲染', () => {
    it('渲染任务列表', () => {
      const modelStatus: ModelStatus = {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        content: '- [x] 已完成\n- [ ] 未完成',
        status: 'done',
      }
      
      render(<StreamingResponse modelStatus={modelStatus} />)
      
      expect(screen.getByText('已完成')).toBeInTheDocument()
      expect(screen.getByText('未完成')).toBeInTheDocument()
    })

    it('渲染删除线', () => {
      const modelStatus: ModelStatus = {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        content: '~~删除的文本~~',
        status: 'done',
      }
      
      render(<StreamingResponse modelStatus={modelStatus} />)
      
      const deletedText = screen.getByText('删除的文本')
      expect(deletedText).toBeInTheDocument()
    })

    it('渲染行内代码', () => {
      const modelStatus: ModelStatus = {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        content: '这是 `行内代码` 示例',
        status: 'done',
      }
      
      render(<StreamingResponse modelStatus={modelStatus} />)
      
      expect(screen.getByText('行内代码')).toBeInTheDocument()
    })

    it('渲染链接', () => {
      const modelStatus: ModelStatus = {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        content: '[OpenAI](https://openai.com)',
        status: 'done',
      }
      
      render(<StreamingResponse modelStatus={modelStatus} />)
      
      const link = screen.getByRole('link', { name: 'OpenAI' })
      expect(link).toHaveAttribute('href', 'https://openai.com')
    })

    it('渲染自动链接', () => {
      const modelStatus: ModelStatus = {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        content: 'https://example.com',
        status: 'done',
      }
      
      render(<StreamingResponse modelStatus={modelStatus} />)
      
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', 'https://example.com')
    })
  })

  describe('代码块语法高亮', () => {
    it('渲染带语言标识的代码块', () => {
      const modelStatus: ModelStatus = {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        content: '```typescript\nconst x: number = 1;\n```',
        status: 'done',
      }
      
      render(<StreamingResponse modelStatus={modelStatus} />)
      
      expect(screen.getByRole('code')).toBeInTheDocument()
    })

    it('渲染无语言标识的代码块', () => {
      const modelStatus: ModelStatus = {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        content: '```\nplain code\n```',
        status: 'done',
      }
      
      render(<StreamingResponse modelStatus={modelStatus} />)
      
      expect(screen.getByRole('code')).toBeInTheDocument()
    })
  })

  describe('HTML 安全过滤', () => {
    it('不渲染原始 HTML 标签', () => {
      const modelStatus: ModelStatus = {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        content: '<script>alert("xss")</script>',
        status: 'done',
      }
      
      render(<StreamingResponse modelStatus={modelStatus} />)
      
      expect(screen.queryByText('xss')).not.toBeInTheDocument()
    })
  })

  describe('streaming 状态动态更新', () => {
    it('streaming 状态显示加载指示器', () => {
      const modelStatus: ModelStatus = {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        content: '正在输入',
        status: 'streaming',
      }
      
      render(<StreamingResponse modelStatus={modelStatus} />)
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  describe('复杂 Markdown 结构', () => {
    it('渲染嵌套列表', () => {
      const modelStatus: ModelStatus = {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        content: '- 项目 1\n  - 子项目 1\n  - 子项目 2\n- 项目 2',
        status: 'done',
      }
      
      render(<StreamingResponse modelStatus={modelStatus} />)
      
      const listItems = screen.getAllByRole('listitem')
      expect(listItems.length).toBeGreaterThan(0)
    })

    it('渲染多级标题', () => {
      const modelStatus: ModelStatus = {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        content: '# 一级标题\n## 二级标题\n### 三级标题',
        status: 'done',
      }
      
      render(<StreamingResponse modelStatus={modelStatus} />)
      
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
    })

    it('渲染水平分割线', () => {
      const modelStatus: ModelStatus = {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        content: '上文\n---\n下文',
        status: 'done',
      }
      
      render(<StreamingResponse modelStatus={modelStatus} />)
      
      expect(screen.getByText('上文')).toBeInTheDocument()
      expect(screen.getByText('下文')).toBeInTheDocument()
    })
  })
})