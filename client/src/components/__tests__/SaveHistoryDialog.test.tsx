import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SaveHistoryDialog from '../SaveHistoryDialog'

describe('SaveHistoryDialog 组件测试', () => {
  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('弹窗基本状态', () => {
    it('open=true 时弹窗可见', () => {
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('重命名对话')).toBeInTheDocument()
    })

    it('open=false 时弹窗不可见', () => {
      render(
        <SaveHistoryDialog
          open={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('显示正确的标题', () => {
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      expect(screen.getByText('重命名对话')).toBeInTheDocument()
    })
  })

  describe('初始名称行为', () => {
    it('弹窗打开时使用空的初始名称', () => {
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const input = screen.getByRole('textbox')
      const value = input.getAttribute('value') || ''
      expect(value).toBe('')
    })

    it('传入 initialName 时显示该名称', () => {
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialName="测试对话"
        />
      )

      const input = screen.getByRole('textbox')
      const value = input.getAttribute('value') || ''
      expect(value).toBe('测试对话')
    })
  })

  describe('输入框交互', () => {
    it('输入框获得焦点', async () => {
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const input = screen.getByRole('textbox')
      expect(input).toHaveFocus()
    })

    it('文本输入更新输入值', async () => {
      const user = userEvent.setup()
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, '自定义会话名称')

      expect(input).toHaveValue('自定义会话名称')
    })

    it('显示正确的占位符文本', () => {
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const input = screen.getByPlaceholderText('请输入会话名称')
      expect(input).toBeInTheDocument()
    })

    it('显示正确的标签', () => {
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const labels = screen.getAllByText('会话名称')
      expect(labels.length).toBeGreaterThan(0)
    })
  })

  describe('Enter 键保存', () => {
    it('Enter 键触发保存', async () => {
      const user = userEvent.setup()
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, '测试会话{enter}')

      expect(mockOnSave).toHaveBeenCalledWith('测试会话')
    })

    it('Enter 键保存后关闭弹窗', async () => {
      const user = userEvent.setup()
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, '测试{enter}')

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('空内容时 Enter 键不触发保存', async () => {
      const user = userEvent.setup()
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, '{enter}')

      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('只有空格时 Enter 键不触发保存', async () => {
      const user = userEvent.setup()
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, '   {enter}')

      expect(mockOnSave).not.toHaveBeenCalled()
    })
  })

  describe('保存按钮状态', () => {
    it('有内容时保存按钮启用', () => {
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialName="测试内容"
        />
      )

      const saveButton = screen.getByRole('button', { name: '重命名' })
      expect(saveButton).not.toBeDisabled()
    })

    it('空内容时保存按钮禁用', () => {
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const saveButton = screen.getByRole('button', { name: '重命名' })
      expect(saveButton).toBeDisabled()
    })

    it('只有空格时保存按钮禁用', () => {
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialName="   "
        />
      )

      const saveButton = screen.getByRole('button', { name: '重命名' })
      expect(saveButton).toBeDisabled()
    })
  })

  describe('onSave 回调调用', () => {
    it('点击保存按钮调用 onSave', async () => {
      const user = userEvent.setup()
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialName="测试内容"
        />
      )

      const saveButton = screen.getByRole('button', { name: '重命名' })
      await user.click(saveButton)

      expect(mockOnSave).toHaveBeenCalled()
    })

    it('保存时传入修剪后的名称', async () => {
      const user = userEvent.setup()
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const input = screen.getByRole('textbox')
      await user.type(input, '  测试会话名称  ')

      const saveButton = screen.getByRole('button', { name: '重命名' })
      await user.click(saveButton)

      expect(mockOnSave).toHaveBeenCalledWith('测试会话名称')
    })

    it('保存后关闭弹窗', async () => {
      const user = userEvent.setup()
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialName="测试内容"
        />
      )

      const saveButton = screen.getByRole('button', { name: '重命名' })
      await user.click(saveButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('取消按钮', () => {
    it('显示取消按钮', () => {
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
    })

    it('点击取消按钮调用 onClose', async () => {
      const user = userEvent.setup()
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const cancelButton = screen.getByRole('button', { name: '取消' })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('点击取消按钮不调用 onSave', async () => {
      const user = userEvent.setup()
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const cancelButton = screen.getByRole('button', { name: '取消' })
      await user.click(cancelButton)

      expect(mockOnSave).not.toHaveBeenCalled()
    })
  })

  describe('弹窗打开时重置', () => {
    it('每次打开都重置为传入的 initialName', async () => {
      const user = userEvent.setup()
      const { rerender } = render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialName="初始名称"
        />
      )

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('初始名称')

      await user.clear(input)
      await user.type(input, '修改后的名称')

      rerender(
        <SaveHistoryDialog
          open={false}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialName="初始名称"
        />
      )

      rerender(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialName="初始名称"
        />
      )

      const newInput = screen.getByRole('textbox')
      expect(newInput).toHaveValue('初始名称')
    })
  })

  describe('Escape 键关闭', () => {
    it('Escape 键调用 onClose', async () => {
      const user = userEvent.setup()
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      await user.keyboard('{Escape}')

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('Escape 键不调用 onSave', async () => {
      const user = userEvent.setup()
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      await user.keyboard('{Escape}')

      expect(mockOnSave).not.toHaveBeenCalled()
    })
  })

  describe('重命名模式', () => {
    it('使用 initialName 时显示该名称', () => {
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          initialName="测试对话"
        />
      )

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('测试对话')
    })

    it('不使用 initialName 时输入框为空', () => {
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('')
    })

    it('显示自定义标题', () => {
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          title="自定义标题"
        />
      )

      expect(screen.getByText('自定义标题')).toBeInTheDocument()
    })

    it('使用自定义按钮文本', () => {
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
          buttonLabel="自定义按钮"
        />
      )

      expect(screen.getByRole('button', { name: '自定义按钮' })).toBeInTheDocument()
    })

    it('使用默认标题', () => {
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      expect(screen.getByText('重命名对话')).toBeInTheDocument()
    })

    it('使用默认按钮文本', () => {
      render(
        <SaveHistoryDialog
          open={true}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      expect(screen.getByRole('button', { name: '重命名' })).toBeInTheDocument()
    })
  })
})
