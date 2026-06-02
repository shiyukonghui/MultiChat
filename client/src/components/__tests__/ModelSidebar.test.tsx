import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModelSidebar from '../ModelSidebar'
import type { ModelStatus } from '../../types'

describe('ModelSidebar 组件测试', () => {
  it('渲染模型列表', () => {
    const modelStatuses: Record<string, ModelStatus> = {
      'gpt-4': {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        content: '',
        status: 'pending',
      },
      'claude-3': {
        id: 'claude-3',
        name: 'Claude 3',
        provider: 'anthropic',
        content: '',
        status: 'pending',
      },
    }
    
    render(
      <ModelSidebar
        modelStatuses={modelStatuses}
        selectedModel={null}
        onSelectModel={() => {}}
      />
    )
    
    expect(screen.getByText('gpt-4')).toBeInTheDocument()
    expect(screen.getByText('claude-3')).toBeInTheDocument()
  })

  it('空模型列表时显示提示', () => {
    render(
      <ModelSidebar
        modelStatuses={{}}
        selectedModel={null}
        onSelectModel={() => {}}
      />
    )
    
    expect(screen.getByText('暂无可用模型')).toBeInTheDocument()
  })

  it('点击模型项调用 onSelectModel', async () => {
    const user = userEvent.setup()
    const onSelectModel = vi.fn()
    const modelStatuses: Record<string, ModelStatus> = {
      'gpt-4': {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        content: '',
        status: 'pending',
      },
    }
    
    render(
      <ModelSidebar
        modelStatuses={modelStatuses}
        selectedModel={null}
        onSelectModel={onSelectModel}
      />
    )
    
    await user.click(screen.getByText('gpt-4'))
    
    expect(onSelectModel).toHaveBeenCalledWith('gpt-4')
  })

  it('选中模型高亮显示', () => {
    const modelStatuses: Record<string, ModelStatus> = {
      'gpt-4': {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        content: '',
        status: 'pending',
      },
      'claude-3': {
        id: 'claude-3',
        name: 'Claude 3',
        provider: 'anthropic',
        content: '',
        status: 'pending',
      },
    }
    
    render(
      <ModelSidebar
        modelStatuses={modelStatuses}
        selectedModel="gpt-4"
        onSelectModel={() => {}}
      />
    )
    
    const selectedItem = screen.getByRole('button', { name: /gpt-4/i })
    expect(selectedItem).toHaveClass('Mui-selected')
  })

  it('pending 状态显示等待图标', () => {
    const modelStatuses: Record<string, ModelStatus> = {
      'gpt-4': {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        content: '',
        status: 'pending',
      },
    }
    
    render(
      <ModelSidebar
        modelStatuses={modelStatuses}
        selectedModel={null}
        onSelectModel={() => {}}
      />
    )
    
    expect(screen.getByText('等待中')).toBeInTheDocument()
  })

  it('streaming 状态显示加载动画', () => {
    const modelStatuses: Record<string, ModelStatus> = {
      'gpt-4': {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        content: '正在',
        status: 'streaming',
      },
    }
    
    render(
      <ModelSidebar
        modelStatuses={modelStatuses}
        selectedModel={null}
        onSelectModel={() => {}}
      />
    )
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByText('正在回复...')).toBeInTheDocument()
  })

  it('done 状态显示完成图标', () => {
    const modelStatuses: Record<string, ModelStatus> = {
      'gpt-4': {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        content: '完成',
        status: 'done',
      },
    }
    
    render(
      <ModelSidebar
        modelStatuses={modelStatuses}
        selectedModel={null}
        onSelectModel={() => {}}
      />
    )
    
    expect(screen.getByText('回复完成')).toBeInTheDocument()
  })

  it('error 状态显示错误图标和信息', () => {
    const modelStatuses: Record<string, ModelStatus> = {
      'gpt-4': {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        content: '',
        status: 'error',
        error: 'API 错误',
      },
    }
    
    render(
      <ModelSidebar
        modelStatuses={modelStatuses}
        selectedModel={null}
        onSelectModel={() => {}}
      />
    )
    
    expect(screen.getByText('API 错误')).toBeInTheDocument()
  })

  it('error 状态无错误信息时显示默认提示', () => {
    const modelStatuses: Record<string, ModelStatus> = {
      'gpt-4': {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        content: '',
        status: 'error',
      },
    }
    
    render(
      <ModelSidebar
        modelStatuses={modelStatuses}
        selectedModel={null}
        onSelectModel={() => {}}
      />
    )
    
    expect(screen.getByText('回复异常')).toBeInTheDocument()
  })

  it('显示标题', () => {
    const modelStatuses: Record<string, ModelStatus> = {
      'gpt-4': {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        content: '',
        status: 'pending',
      },
    }
    
    render(
      <ModelSidebar
        modelStatuses={modelStatuses}
        selectedModel={null}
        onSelectModel={() => {}}
      />
    )
    
    expect(screen.getByText('模型列表')).toBeInTheDocument()
  })

  describe('长模型名称截断', () => {
    it('显示长模型名称', () => {
      const modelStatuses: Record<string, ModelStatus> = {
        'very-long-model-name-that-should-be-displayed': {
          id: 'very-long-model-name-that-should-be-displayed',
          name: 'Very Long Model Name That Should Be Displayed',
          provider: 'openai',
          content: '',
          status: 'pending',
        },
      }
      
      render(
        <ModelSidebar
          modelStatuses={modelStatuses}
          selectedModel={null}
          onSelectModel={() => {}}
        />
      )
      
      expect(screen.getByText(/very-long-model-name/)).toBeInTheDocument()
    })
  })

  describe('多模型同时 streaming', () => {
    it('多个 streaming 模型同时显示加载动画', () => {
      const modelStatuses: Record<string, ModelStatus> = {
        'gpt-4': {
          id: 'gpt-4',
          name: 'GPT-4',
          provider: 'openai',
          content: '正在',
          status: 'streaming',
        },
        'claude-3': {
          id: 'claude-3',
          name: 'Claude 3',
          provider: 'anthropic',
          content: '正在',
          status: 'streaming',
        },
      }
      
      render(
        <ModelSidebar
          modelStatuses={modelStatuses}
          selectedModel={null}
          onSelectModel={() => {}}
        />
      )
      
      const progressbars = screen.getAllByRole('progressbar')
      expect(progressbars).toHaveLength(2)
    })
  })

  describe('模型状态实时更新', () => {
    it('从 pending 到 streaming 状态变化', () => {
      const modelStatuses: Record<string, ModelStatus> = {
        'gpt-4': {
          id: 'gpt-4',
          name: 'GPT-4',
          provider: 'openai',
          content: '',
          status: 'pending',
        },
      }
      
      const { rerender } = render(
        <ModelSidebar
          modelStatuses={modelStatuses}
          selectedModel={null}
          onSelectModel={() => {}}
        />
      )
      
      expect(screen.getByText('等待中')).toBeInTheDocument()
      
      const updatedStatuses: Record<string, ModelStatus> = {
        'gpt-4': {
          id: 'gpt-4',
          name: 'GPT-4',
          provider: 'openai',
          content: '正在回复',
          status: 'streaming',
        },
      }
      
      rerender(
        <ModelSidebar
          modelStatuses={updatedStatuses}
          selectedModel={null}
          onSelectModel={() => {}}
        />
      )
      
      expect(screen.getByText('正在回复...')).toBeInTheDocument()
    })

    it('从 streaming 到 done 状态变化', () => {
      const modelStatuses: Record<string, ModelStatus> = {
        'gpt-4': {
          id: 'gpt-4',
          name: 'GPT-4',
          provider: 'openai',
          content: '回复内容',
          status: 'streaming',
        },
      }
      
      const { rerender } = render(
        <ModelSidebar
          modelStatuses={modelStatuses}
          selectedModel={null}
          onSelectModel={() => {}}
        />
      )
      
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      
      const updatedStatuses: Record<string, ModelStatus> = {
        'gpt-4': {
          id: 'gpt-4',
          name: 'GPT-4',
          provider: 'openai',
          content: '完整回复',
          status: 'done',
        },
      }
      
      rerender(
        <ModelSidebar
          modelStatuses={updatedStatuses}
          selectedModel={null}
          onSelectModel={() => {}}
        />
      )
      
      expect(screen.getByText('回复完成')).toBeInTheDocument()
    })
  })

  describe('边界情况', () => {
    it('处理无 provider 的模型', () => {
      const modelStatuses: Record<string, ModelStatus> = {
        'unknown': {
          id: 'unknown',
          name: 'Unknown Model',
          provider: '',
          content: '',
          status: 'pending',
        },
      }
      
      render(
        <ModelSidebar
          modelStatuses={modelStatuses}
          selectedModel={null}
          onSelectModel={() => {}}
        />
      )
      
      expect(screen.getByText('unknown')).toBeInTheDocument()
    })

    it('处理空内容的 done 状态', () => {
      const modelStatuses: Record<string, ModelStatus> = {
        'gpt-4': {
          id: 'gpt-4',
          name: 'GPT-4',
          provider: 'openai',
          content: '',
          status: 'done',
        },
      }
      
      render(
        <ModelSidebar
          modelStatuses={modelStatuses}
          selectedModel={null}
          onSelectModel={() => {}}
        />
      )
      
      expect(screen.getByText('回复完成')).toBeInTheDocument()
    })
  })

  describe('大量模型列表', () => {
    it('渲染大量模型', () => {
      const modelStatuses: Record<string, ModelStatus> = {}
      for (let i = 0; i < 20; i++) {
        modelStatuses[`model-${i}`] = {
          id: `model-${i}`,
          name: `Model ${i}`,
          provider: 'openai',
          content: '',
          status: 'pending',
        }
      }
      
      render(
        <ModelSidebar
          modelStatuses={modelStatuses}
          selectedModel={null}
          onSelectModel={() => {}}
        />
      )
      
      expect(screen.getByText('model-0')).toBeInTheDocument()
      expect(screen.getByText('model-19')).toBeInTheDocument()
    })
  })
})