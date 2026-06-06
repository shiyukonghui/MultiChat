import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatInput from '../ChatInput'

describe('ChatInput 组件测试', () => {
  it('渲染输入框和发送按钮', () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} isLoading={false} />)
    
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('输入文本更新输入框值', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} isLoading={false} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '你好')
    
    expect(input).toHaveValue('你好')
  })

  it('点击发送按钮调用 onSend', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} isLoading={false} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '你好')
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(onSend).toHaveBeenCalledWith('你好')
  })

  it('发送后清空输入框', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} isLoading={false} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '你好')
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(input).toHaveValue('')
  })

  it('Enter 键发送消息', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} isLoading={false} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '你好{enter}')
    
    expect(onSend).toHaveBeenCalledWith('你好')
  })

  it('Shift+Enter 换行不发送', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} isLoading={false} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '你好')
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    
    expect(onSend).not.toHaveBeenCalled()
  })

  it('空消息时发送按钮禁用', () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} isLoading={false} />)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('只有空格的消息时发送按钮禁用', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} isLoading={false} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '   ')
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('加载中时禁用输入框和按钮', () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} isLoading={true} />)
    
    const input = screen.getByRole('textbox')
    const button = screen.getByRole('button')
    
    expect(input).toBeDisabled()
    expect(button).toBeDisabled()
  })

  it('字符数超限时显示错误', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} isLoading={false} />)
    
    const input = screen.getByRole('textbox')
    const longText = 'a'.repeat(4001)
    await user.click(input)
    await user.paste(longText)
    await user.tab()
    
    expect(screen.getByText(/字符数超限/)).toBeInTheDocument()
  })

  it('字符数超限时禁用发送按钮', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} isLoading={false} />)
    
    screen.getByRole('textbox')
    const longText = 'a'.repeat(4001)
    await user.paste(longText)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('显示字符计数', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} isLoading={false} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'ab')
    
    expect(screen.getByText(/2.*\/.*4000/)).toBeInTheDocument()
  })

  it('发送后输入框获得焦点', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} isLoading={false} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '你好')
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(input).toHaveFocus()
  })

  it('输入框占位符文本正确', () => {
    const onSend = vi.fn()
    render(<ChatInput onSend={onSend} isLoading={false} />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('placeholder', '输入您的问题，Enter 发送，Shift+Enter 换行')
  })

  describe('粘贴长文本处理', () => {
    it('粘贴超长文本显示错误', async () => {
      const user = userEvent.setup()
      const onSend = vi.fn()
      render(<ChatInput onSend={onSend} isLoading={false} />)
      
      const input = screen.getByRole('textbox')
      const longText = 'a'.repeat(5000)
      await user.click(input)
      await user.paste(longText)
      
      expect(screen.getByText(/字符数超限/)).toBeInTheDocument()
    })
  })

  describe('Unicode 字符计数', () => {
    it('正确计算中文字符数', async () => {
      const user = userEvent.setup()
      const onSend = vi.fn()
      render(<ChatInput onSend={onSend} isLoading={false} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, '你好世界')
      
      expect(screen.getByText(/4.*\/.*4000/)).toBeInTheDocument()
    })

    it('正确计算 emoji 字符数', async () => {
      const user = userEvent.setup()
      const onSend = vi.fn()
      render(<ChatInput onSend={onSend} isLoading={false} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, '😀🎉')
      
      expect(screen.getByText(/4.*\/.*4000/)).toBeInTheDocument()
    })
  })

  describe('连续快速发送处理', () => {
    it('加载中时禁用发送', async () => {
      const onSend = vi.fn()
      render(<ChatInput onSend={onSend} isLoading={true} />)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })
  })

  describe('输入框焦点管理', () => {
    it('组件挂载时输入框可以获取焦点', async () => {
      const onSend = vi.fn()
      render(<ChatInput onSend={onSend} isLoading={false} />)
      
      const input = screen.getByRole('textbox')
      input.focus()
      expect(input).toHaveFocus()
    })
  })

  describe('无障碍访问测试', () => {
    it('输入框有正确的 ARIA 标签', () => {
      const onSend = vi.fn()
      render(<ChatInput onSend={onSend} isLoading={false} />)
      
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-label', '消息输入框')
    })

    it('发送按钮有正确的 ARIA 标签', () => {
      const onSend = vi.fn()
      render(<ChatInput onSend={onSend} isLoading={false} />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', '发送消息')
    })
  })

  describe('边界情况', () => {
    it('处理只有换行符的消息', async () => {
      const user = userEvent.setup()
      const onSend = vi.fn()
      render(<ChatInput onSend={onSend} isLoading={false} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, '\n\n\n')
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('处理消息前后空格', async () => {
      const user = userEvent.setup()
      const onSend = vi.fn()
      render(<ChatInput onSend={onSend} isLoading={false} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, '  测试消息  ')
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(onSend).toHaveBeenCalledWith('测试消息')
    })

    it('处理特殊字符消息', async () => {
      const user = userEvent.setup()
      const onSend = vi.fn()
      render(<ChatInput onSend={onSend} isLoading={false} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, '<script>alert("test")</script>')
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(onSend).toHaveBeenCalledWith('<script>alert("test")</script>')
    })
  })
})