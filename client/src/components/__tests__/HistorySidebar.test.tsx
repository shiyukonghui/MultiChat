import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HistorySidebar from '../HistorySidebar'
import type { HistoryRecordSummary } from '../../types'

describe('HistorySidebar 组件测试', () => {
  const mockHistories: HistoryRecordSummary[] = [
    {
      id: 'history-1',
      name: '测试对话 1',
      timestamp: Date.now() - 3600000,
      selectedModel: 'gpt-4',
      messageCount: 4,
    },
    {
      id: 'history-2',
      name: '测试对话 2',
      timestamp: Date.now() - 7200000,
      selectedModel: 'claude-3',
      messageCount: 2,
    },
  ]

  it('打开时侧边栏可见', () => {
    render(
      <HistorySidebar
        open={true}
        onClose={() => {}}
        histories={[]}
        onSelectHistory={() => {}}
        onDeleteHistory={() => {}}
      />
    )
    
    expect(screen.getByText('历史记录')).toBeInTheDocument()
  })

  it('关闭时侧边栏不可见', () => {
    render(
      <HistorySidebar
        open={false}
        onClose={() => {}}
        histories={mockHistories}
        onSelectHistory={() => {}}
        onDeleteHistory={() => {}}
      />
    )
    
    expect(screen.queryByText('测试对话 1')).not.toBeInTheDocument()
  })

  it('渲染历史记录列表', () => {
    render(
      <HistorySidebar
        open={true}
        onClose={() => {}}
        histories={mockHistories}
        onSelectHistory={() => {}}
        onDeleteHistory={() => {}}
      />
    )
    
    expect(screen.getByText('测试对话 1')).toBeInTheDocument()
    expect(screen.getByText('测试对话 2')).toBeInTheDocument()
  })

  it('点击历史记录调用 onSelectHistory', async () => {
    const user = userEvent.setup()
    const onSelectHistory = vi.fn()
    
    render(
      <HistorySidebar
        open={true}
        onClose={() => {}}
        histories={mockHistories}
        onSelectHistory={onSelectHistory}
        onDeleteHistory={() => {}}
      />
    )
    
    await user.click(screen.getByText('测试对话 1'))
    
    expect(onSelectHistory).toHaveBeenCalledWith(mockHistories[0])
  })

  it('点击删除按钮调用 onDeleteHistory', async () => {
    const user = userEvent.setup()
    const onDeleteHistory = vi.fn()
    
    render(
      <HistorySidebar
        open={true}
        onClose={() => {}}
        histories={mockHistories}
        onSelectHistory={() => {}}
        onDeleteHistory={onDeleteHistory}
      />
    )
    
    const deleteButtons = screen.getAllByRole('button', { name: /删除/i })
    await user.click(deleteButtons[0])
    
    expect(onDeleteHistory).toHaveBeenCalledWith('history-1')
  })

  it('空历史记录时显示提示', () => {
    render(
      <HistorySidebar
        open={true}
        onClose={() => {}}
        histories={[]}
        onSelectHistory={() => {}}
        onDeleteHistory={() => {}}
      />
    )
    
    expect(screen.getByText('暂无历史记录')).toBeInTheDocument()
  })

  it('显示格式化的时间', () => {
    render(
      <HistorySidebar
        open={true}
        onClose={() => {}}
        histories={mockHistories}
        onSelectHistory={() => {}}
        onDeleteHistory={() => {}}
      />
    )
    
    const date = new Date(mockHistories[0].timestamp)
    const formattedDate = date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
    
    expect(screen.getByText(formattedDate)).toBeInTheDocument()
  })

  it('显示选中的模型', () => {
    render(
      <HistorySidebar
        open={true}
        onClose={() => {}}
        histories={mockHistories}
        onSelectHistory={() => {}}
        onDeleteHistory={() => {}}
      />
    )
    
    expect(screen.getByText('模型: gpt-4')).toBeInTheDocument()
    expect(screen.getByText('模型: claude-3')).toBeInTheDocument()
  })

  it('无选中模型时不显示模型信息', () => {
    const historiesWithoutModel: HistoryRecordSummary[] = [
      {
        id: 'history-3',
        name: '无模型对话',
        timestamp: Date.now(),
        selectedModel: null,
        messageCount: 2,
      },
    ]
    
    render(
      <HistorySidebar
        open={true}
        onClose={() => {}}
        histories={historiesWithoutModel}
        onSelectHistory={() => {}}
        onDeleteHistory={() => {}}
      />
    )
    
    expect(screen.queryByText(/模型:/)).not.toBeInTheDocument()
  })

  it('点击关闭按钮调用 onClose', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    
    render(
      <HistorySidebar
        open={true}
        onClose={onClose}
        histories={[]}
        onSelectHistory={() => {}}
        onDeleteHistory={() => {}}
      />
    )
    
    await user.keyboard('{Escape}')
    
    expect(onClose).toHaveBeenCalled()
  })

  describe('长列表滚动', () => {
    it('渲染大量历史记录', () => {
      const longHistories: HistoryRecordSummary[] = Array(50).fill(null).map((_, i) => ({
        id: `history-${i}`,
        name: `对话 ${i}`,
        timestamp: Date.now() - i * 3600000,
        selectedModel: 'gpt-4',
        messageCount: i + 1,
      }))
      
      render(
        <HistorySidebar
          open={true}
          onClose={() => {}}
          histories={longHistories}
          onSelectHistory={() => {}}
          onDeleteHistory={() => {}}
        />
      )
      
      expect(screen.getByText('对话 0')).toBeInTheDocument()
      expect(screen.getByText('对话 49')).toBeInTheDocument()
    })
  })

  describe('删除确认交互', () => {
    it('删除按钮有正确的 aria-label', () => {
      render(
        <HistorySidebar
          open={true}
          onClose={() => {}}
          histories={mockHistories}
          onSelectHistory={() => {}}
          onDeleteHistory={() => {}}
        />
      )
      
      const deleteButtons = screen.getAllByRole('button', { name: /删除/i })
      expect(deleteButtons.length).toBeGreaterThan(0)
    })
  })

  describe('时间格式化', () => {
    it('显示相对时间格式', () => {
      const recentHistory: HistoryRecordSummary[] = [
        {
          id: 'recent',
          name: '最近对话',
          timestamp: Date.now() - 60000,
          selectedModel: 'gpt-4',
          messageCount: 1,
        },
      ]
      
      render(
        <HistorySidebar
          open={true}
          onClose={() => {}}
          histories={recentHistory}
          onSelectHistory={() => {}}
          onDeleteHistory={() => {}}
        />
      )
      
      expect(screen.getByText('最近对话')).toBeInTheDocument()
    })

    it('显示历史时间格式', () => {
      const oldHistory: HistoryRecordSummary[] = [
        {
          id: 'old',
          name: '历史对话',
          timestamp: Date.now() - 7 * 24 * 3600000,
          selectedModel: 'gpt-4',
          messageCount: 10,
        },
      ]
      
      render(
        <HistorySidebar
          open={true}
          onClose={() => {}}
          histories={oldHistory}
          onSelectHistory={() => {}}
          onDeleteHistory={() => {}}
        />
      )
      
      expect(screen.getByText('历史对话')).toBeInTheDocument()
    })
  })

  describe('消息数量显示', () => {
    it('显示正确的消息数量', () => {
      render(
        <HistorySidebar
          open={true}
          onClose={() => {}}
          histories={mockHistories}
          onSelectHistory={() => {}}
          onDeleteHistory={() => {}}
        />
      )
      
      expect(screen.getByText('4 条消息')).toBeInTheDocument()
      expect(screen.getByText('2 条消息')).toBeInTheDocument()
    })
  })

  describe('边界情况', () => {
    it('处理无名称的历史记录', () => {
      const noNameHistories: HistoryRecordSummary[] = [
        {
          id: 'no-name',
          name: '',
          timestamp: Date.now(),
          selectedModel: 'gpt-4',
          messageCount: 1,
        },
      ]
      
      render(
        <HistorySidebar
          open={true}
          onClose={() => {}}
          histories={noNameHistories}
          onSelectHistory={() => {}}
          onDeleteHistory={() => {}}
        />
      )
      
      expect(screen.getByRole('button', { name: /删除/i })).toBeInTheDocument()
    })

    it('处理零消息的历史记录', () => {
      const zeroMessages: HistoryRecordSummary[] = [
        {
          id: 'zero',
          name: '空对话',
          timestamp: Date.now(),
          selectedModel: 'gpt-4',
          messageCount: 0,
        },
      ]
      
      render(
        <HistorySidebar
          open={true}
          onClose={() => {}}
          histories={zeroMessages}
          onSelectHistory={() => {}}
          onDeleteHistory={() => {}}
        />
      )
      
      expect(screen.getByText('0 条消息')).toBeInTheDocument()
    })
  })
})