import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChatHistory from '../ChatHistory'
import type { ChatMessage } from '../../types'

describe('ChatHistory 组件测试', () => {
  describe('空状态显示', () => {
    it('无消息时显示提示文本', () => {
      render(<ChatHistory messages={[]} />)

      expect(screen.getByText('暂无对话历史，开始提问吧')).toBeInTheDocument()
    })

    it('无消息时不渲染消息卡片', () => {
      render(<ChatHistory messages={[]} />)

      expect(screen.queryByRole('article')).not.toBeInTheDocument()
    })
  })

  describe('用户消息渲染', () => {
    it('显示用户消息内容', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: '你好，这是一个测试消息' },
      ]

      render(<ChatHistory messages={messages} />)

      expect(screen.getByText('你好，这是一个测试消息')).toBeInTheDocument()
    })

    it('用户消息显示"你"标签', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: '测试消息' },
      ]

      render(<ChatHistory messages={messages} />)

      expect(screen.getByText('你')).toBeInTheDocument()
    })

    it('用户消息不显示"来自"文本', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: '测试消息' },
      ]

      render(<ChatHistory messages={messages} />)

      expect(screen.queryByText(/来自/)).not.toBeInTheDocument()
    })
  })

  describe('助手消息渲染', () => {
    it('显示助手消息内容', () => {
      const messages: ChatMessage[] = [
        { role: 'assistant', content: '这是助手的回复', model: 'gpt-4' },
      ]

      render(<ChatHistory messages={messages} />)

      expect(screen.getByText('这是助手的回复')).toBeInTheDocument()
    })

    it('助手消息显示模型名称标签', () => {
      const messages: ChatMessage[] = [
        { role: 'assistant', content: '回复', model: 'gpt-4' },
      ]

      render(<ChatHistory messages={messages} />)

      expect(screen.getByText('gpt-4')).toBeInTheDocument()
    })

    it('助手消息显示"来自 xxx"文本', () => {
      const messages: ChatMessage[] = [
        { role: 'assistant', content: '回复', model: 'claude-3' },
      ]

      render(<ChatHistory messages={messages} />)

      expect(screen.getByText('来自 claude-3')).toBeInTheDocument()
    })

    it('助手消息无模型时显示"助手"标签', () => {
      const messages: ChatMessage[] = [
        { role: 'assistant', content: '回复' },
      ]

      render(<ChatHistory messages={messages} />)

      expect(screen.getByText('助手')).toBeInTheDocument()
    })

    it('助手消息无模型时不显示"来自"文本', () => {
      const messages: ChatMessage[] = [
        { role: 'assistant', content: '回复' },
      ]

      render(<ChatHistory messages={messages} />)

      expect(screen.queryByText(/来自/)).not.toBeInTheDocument()
    })
  })

  describe('消息内容显示', () => {
    it('保留换行符', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: '第一行\n第二行\n第三行' },
      ]

      render(<ChatHistory messages={messages} />)

      const messageElement = screen.getByText(/第一行/)
      expect(messageElement).toHaveTextContent('第一行 第二行 第三行')
    })

    it('超长内容截断显示', () => {
      const longContent = 'a'.repeat(600)
      const messages: ChatMessage[] = [
        { role: 'user', content: longContent },
      ]

      render(<ChatHistory messages={messages} />)

      expect(screen.getByText(/a\.\.\.$/)).toBeInTheDocument()
    })

    it('500 字符以内内容完整显示', () => {
      const content = 'a'.repeat(400)
      const messages: ChatMessage[] = [
        { role: 'user', content: content },
      ]

      render(<ChatHistory messages={messages} />)

      expect(screen.getByText(content)).toBeInTheDocument()
    })

    it('刚好 500 字符不截断', () => {
      const content = 'a'.repeat(500)
      const messages: ChatMessage[] = [
        { role: 'user', content: content },
      ]

      render(<ChatHistory messages={messages} />)

      expect(screen.getByText(content)).toBeInTheDocument()
    })

    it('501 字符时截断', () => {
      const content = 'a'.repeat(501)
      const messages: ChatMessage[] = [
        { role: 'user', content: content },
      ]

      render(<ChatHistory messages={messages} />)

      expect(screen.queryByText(content)).not.toBeInTheDocument()
      expect(screen.getByText(/a\.\.\.$/)).toBeInTheDocument()
    })
  })

  describe('多条消息列表渲染', () => {
    it('渲染多条消息', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: '问题 1' },
        { role: 'assistant', content: '回答 1', model: 'gpt-4' },
        { role: 'user', content: '问题 2' },
        { role: 'assistant', content: '回答 2', model: 'claude-3' },
      ]

      render(<ChatHistory messages={messages} />)

      expect(screen.getByText('问题 1')).toBeInTheDocument()
      expect(screen.getByText('回答 1')).toBeInTheDocument()
      expect(screen.getByText('问题 2')).toBeInTheDocument()
      expect(screen.getByText('回答 2')).toBeInTheDocument()
    })

    it('消息按顺序渲染', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: '第一条' },
        { role: 'assistant', content: '第二条', model: 'gpt-4' },
        { role: 'user', content: '第三条' },
      ]

      render(<ChatHistory messages={messages} />)

      const allMessages = screen.getAllByText(/第.*条/)
      expect(allMessages[0]).toHaveTextContent('第一条')
      expect(allMessages[1]).toHaveTextContent('第二条')
      expect(allMessages[2]).toHaveTextContent('第三条')
    })

    it('交替显示用户和助手消息', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: '用户消息' },
        { role: 'assistant', content: '助手消息', model: 'gpt-4' },
      ]

      render(<ChatHistory messages={messages} />)

      expect(screen.getByText('你')).toBeInTheDocument()
      expect(screen.getByText('gpt-4')).toBeInTheDocument()
    })
  })

  describe('消息卡片样式', () => {
    it('用户消息和助手消息使用不同的标签颜色', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: '用户' },
        { role: 'assistant', content: '助手', model: 'gpt-4' },
      ]

      render(<ChatHistory messages={messages} />)

      const userChip = screen.getByText('你').closest('.MuiChip-root')
      const assistantChip = screen.getByText('gpt-4').closest('.MuiChip-root')

      expect(userChip).toBeInTheDocument()
      expect(assistantChip).toBeInTheDocument()
    })
  })

  describe('特殊内容处理', () => {
    it('空内容消息不崩溃', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: '' },
      ]

      render(<ChatHistory messages={messages} />)

      expect(screen.getByText('你')).toBeInTheDocument()
    })

    it('包含特殊字符的内容正常显示', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: '特殊字符：<>&"\'测试' },
      ]

      render(<ChatHistory messages={messages} />)

      expect(screen.getByText(/特殊字符/)).toBeInTheDocument()
    })

    it('包含代码块的内容正常显示', () => {
      const messages: ChatMessage[] = [
        { role: 'assistant', content: '```javascript\nconst x = 1;\n```', model: 'gpt-4' },
      ]

      render(<ChatHistory messages={messages} />)

      expect(screen.getByText(/const x = 1/)).toBeInTheDocument()
    })

    it('包含 Markdown 格式的内容正常显示', () => {
      const messages: ChatMessage[] = [
        { role: 'assistant', content: '# 标题\n\n正文内容', model: 'gpt-4' },
      ]

      render(<ChatHistory messages={messages} />)

      expect(screen.getByText(/标题/)).toBeInTheDocument()
      expect(screen.getByText(/正文内容/)).toBeInTheDocument()
    })
  })
})
