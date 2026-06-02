import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AddModelDialog from '../AddModelDialog'
import type { ModelConfig } from '../../types'

// 模拟模型配置数据
const mockEditModel: ModelConfig = {
  id: 'gpt-4',
  provider: 'openai',
  enabled: true,
  status: 'available',
  apiFormat: 'openai-chat-completions',
  apiEndpoint: 'https://api.openai.com/v1',
  apiKey: 'test-api-key',
  isMultimodal: false,
  useFullUrl: false,
  displayName: 'GPT-4',
  modelSeries: 'default',
  contextWindowInput: 128000,
  contextWindowOutput: 4096,
  toolCallRounds: 200,
  maxTokens: 4096,
}

describe('AddModelDialog 组件测试', () => {
  const mockOnClose = vi.fn()
  const mockOnSubmit = vi.fn()
  const mockOnUpdate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('弹窗基本状态', () => {
    it('open=true 时弹窗可见', () => {
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: '添加模型' })).toBeInTheDocument()
    })

    it('open=false 时弹窗不可见', () => {
      render(
        <AddModelDialog
          open={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('编辑模式显示正确的标题', () => {
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          editModel={mockEditModel}
        />
      )

      expect(screen.getByText('编辑模型')).toBeInTheDocument()
    })
  })

  describe('表单字段渲染', () => {
    it('渲染所有必填字段', () => {
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByText(/API 格式/)).toBeInTheDocument()
      expect(screen.getByText(/自定义请求地址/)).toBeInTheDocument()
      expect(screen.getByText(/模型 ID/)).toBeInTheDocument()
      expect(screen.getByText(/API 密钥/)).toBeInTheDocument()
    })

    it('渲染多模态开关', () => {
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByText('多模态')).toBeInTheDocument()
    })

    it('渲染完整 URL 开关', () => {
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByText('完整 URL')).toBeInTheDocument()
    })
  })

  describe('Tab 切换功能', () => {
    it('默认选中自定义配置 Tab', () => {
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByRole('tabpanel')).toBeInTheDocument()
    })

    it('点击模型服务商 Tab 切换显示', async () => {
      const user = userEvent.setup()
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      await user.click(screen.getByRole('tab', { name: /模型服务商/ }))

      expect(screen.getByText('选择预设的模型服务商，快速添加常用模型')).toBeInTheDocument()
    })

    it('模型服务商 Tab 显示预设选项', async () => {
      const user = userEvent.setup()
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      await user.click(screen.getByRole('tab', { name: /模型服务商/ }))
      const select = screen.getByRole('combobox')
      await user.click(select)

      expect(screen.getByRole('option', { name: 'OpenAI' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Anthropic' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Google (Gemini)' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Azure OpenAI' })).toBeInTheDocument()
    })
  })

  describe('表单验证', () => {
    it('空模型 ID 时显示错误', async () => {
      const user = userEvent.setup()
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      const submitButton = screen.getByRole('button', { name: /添加模型/ })
      await user.click(submitButton)

      expect(screen.getByText('请输入模型 ID')).toBeInTheDocument()
    })

    it('空 API 地址时显示错误', async () => {
      const user = userEvent.setup()
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      const idInput = screen.getByPlaceholderText('输入模型 ID')
      await user.type(idInput, 'test-model')

      const submitButton = screen.getByRole('button', { name: /添加模型/ })
      await user.click(submitButton)

      expect(screen.getByText('请输入请求地址')).toBeInTheDocument()
    })

    it('空 API 密钥时显示错误', async () => {
      const user = userEvent.setup()
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      const idInput = screen.getByPlaceholderText('输入模型 ID')
      await user.type(idInput, 'test-model')

      const endpointInput = screen.getByPlaceholderText('e.g. https://api.openai.com/v1')
      await user.type(endpointInput, 'https://api.test.com/v1')

      const submitButton = screen.getByRole('button', { name: /添加模型/ })
      await user.click(submitButton)

      expect(screen.getByText('请输入 API 密钥')).toBeInTheDocument()
    })

    it('验证失败时不调用 onSubmit', async () => {
      const user = userEvent.setup()
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      const submitButton = screen.getByRole('button', { name: /添加模型/ })
      await user.click(submitButton)

      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('字段变化时清除对应错误提示', async () => {
      const user = userEvent.setup()
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      const submitButton = screen.getByRole('button', { name: /添加模型/ })
      await user.click(submitButton)

      expect(screen.getByText('请输入模型 ID')).toBeInTheDocument()

      const idInput = screen.getByPlaceholderText('输入模型 ID')
      await user.type(idInput, 'test')

      expect(screen.queryByText('请输入模型 ID')).not.toBeInTheDocument()
    })
  })

  describe('添加模式', () => {
    it('成功提交调用 onSubmit', async () => {
      const user = userEvent.setup()
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      const idInput = screen.getByPlaceholderText('输入模型 ID')
      await user.type(idInput, 'test-model')

      const endpointInput = screen.getByPlaceholderText('e.g. https://api.openai.com/v1')
      await user.type(endpointInput, 'https://api.test.com/v1')

      const apiKeyInput = screen.getByPlaceholderText('输入 API 密钥')
      await user.type(apiKeyInput, 'test-key')

      const submitButton = screen.getByRole('button', { name: /添加模型/ })
      await user.click(submitButton)

      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-model',
          apiEndpoint: 'https://api.test.com/v1',
          apiKey: 'test-key',
        })
      )
    })

    it('提交后清空表单', async () => {
      const user = userEvent.setup()
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      const idInput = screen.getByPlaceholderText('输入模型 ID')
      await user.type(idInput, 'test-model')

      const endpointInput = screen.getByPlaceholderText('e.g. https://api.openai.com/v1')
      await user.type(endpointInput, 'https://api.test.com/v1')

      const apiKeyInput = screen.getByPlaceholderText('输入 API 密钥')
      await user.type(apiKeyInput, 'test-key')

      const submitButton = screen.getByRole('button', { name: /添加模型/ })
      await user.click(submitButton)

      expect(screen.getByPlaceholderText('输入模型 ID')).toHaveValue('')
    })
  })

  describe('编辑模式', () => {
    it('编辑模式下模型 ID 输入框禁用', () => {
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          editModel={mockEditModel}
        />
      )

      const idInput = screen.getByPlaceholderText('输入模型 ID')
      expect(idInput).toBeDisabled()
    })

    it('编辑模式下显示模型 ID 不可修改提示', () => {
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          editModel={mockEditModel}
        />
      )

      expect(screen.getByText('模型 ID 创建后不可修改')).toBeInTheDocument()
    })

    it('编辑模式下 API 密钥显示不同提示', () => {
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          editModel={mockEditModel}
        />
      )

      expect(screen.getByPlaceholderText('留空则保持原密钥不变')).toBeInTheDocument()
    })

    it('编辑模式下回填表单数据', () => {
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          editModel={mockEditModel}
        />
      )

      const idInput = screen.getByPlaceholderText('输入模型 ID')
      expect(idInput).toHaveValue('gpt-4')

      const endpointInput = screen.getByPlaceholderText('e.g. https://api.openai.com/v1')
      expect(endpointInput).toHaveValue('https://api.openai.com/v1')
    })

    it('编辑模式提交调用 onUpdate', async () => {
      const user = userEvent.setup()
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          onUpdate={mockOnUpdate}
          editModel={mockEditModel}
        />
      )

      const apiKeyInput = screen.getByPlaceholderText('留空则保持原密钥不变')
      await user.type(apiKeyInput, 'new-key')

      const submitButton = screen.getByRole('button', { name: /保存修改/ })
      await user.click(submitButton)

      expect(mockOnUpdate).toHaveBeenCalledWith(
        'gpt-4',
        expect.objectContaining({
          apiKey: 'test-api-keynew-key',
        })
      )
    })
  })

  describe('高级配置', () => {
    it('高级配置默认折叠', () => {
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      expect(screen.getByText('高级配置')).toBeInTheDocument()
    })

    it('点击展开高级配置', async () => {
      const user = userEvent.setup()
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      await user.click(screen.getByText('高级配置'))

      expect(screen.getByText('模型系列')).toBeInTheDocument()
      expect(screen.getByText('模型展示名称')).toBeInTheDocument()
      expect(screen.getByText('上下文窗口')).toBeInTheDocument()
      expect(screen.getByText('工具调用轮次')).toBeInTheDocument()
      expect(screen.getByText(/最大 Token 数/)).toBeInTheDocument()
    })

    it('展开后可以修改上下文窗口', async () => {
      const user = userEvent.setup()
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      await user.click(screen.getByText('高级配置'))

      const inputs = screen.getAllByRole('spinbutton')
      expect(inputs.length).toBeGreaterThan(0)
    })

    it('展开后可以修改最大 Token 数', async () => {
      const user = userEvent.setup()
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      await user.click(screen.getByText('高级配置'))

      expect(screen.getByText(/限制模型单次回复生成的最大 token 数量/)).toBeInTheDocument()
    })
  })

  describe('关闭弹窗', () => {
    it('点击关闭按钮调用 onClose', async () => {
      const user = userEvent.setup()
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      await user.keyboard('{Escape}')

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('关闭时清空表单数据', async () => {
      const user = userEvent.setup()
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      const idInput = screen.getByPlaceholderText('输入模型 ID')
      await user.type(idInput, 'test')

      await user.keyboard('{Escape}')

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('多模态开关', () => {
    it('默认关闭', () => {
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      const switchElement = screen.getByRole('switch', { name: /多模态/ })
      expect(switchElement).not.toBeChecked()
    })

    it('点击切换状态', async () => {
      const user = userEvent.setup()
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      const switchElement = screen.getByRole('switch', { name: /多模态/ })
      await user.click(switchElement)

      expect(switchElement).toBeChecked()
    })
  })

  describe('完整 URL 开关', () => {
    it('默认关闭', () => {
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      const switches = screen.getAllByRole('switch')
      const fullUrlSwitch = switches.find(s => s.closest('.MuiBox-root')?.textContent?.includes('完整 URL'))
      expect(fullUrlSwitch).toBeInTheDocument()
    })

    it('点击切换状态', async () => {
      const user = userEvent.setup()
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      const switches = screen.getAllByRole('switch')
      const fullUrlSwitch = switches.find(s => s.closest('.MuiBox-root')?.textContent?.includes('完整 URL'))
      if (fullUrlSwitch) {
        await user.click(fullUrlSwitch)
        expect(fullUrlSwitch).toBeChecked()
      }
    })
  })

  describe('模型服务商 Tab 提交按钮状态', () => {
    it('模型服务商 Tab 未选择时提交按钮禁用', async () => {
      const user = userEvent.setup()
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      await user.click(screen.getByRole('tab', { name: /模型服务商/ }))

      const submitButton = screen.getByRole('button', { name: /添加模型/ })
      expect(submitButton).toBeDisabled()
    })

    it('模型服务商 Tab 选择后提交按钮启用', async () => {
      const user = userEvent.setup()
      render(
        <AddModelDialog
          open={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      )

      await user.click(screen.getByRole('tab', { name: /模型服务商/ }))
      const select = screen.getByRole('combobox')
      await user.click(select)
      await user.click(screen.getByRole('option', { name: 'OpenAI' }))

      const submitButton = screen.getByRole('button', { name: /添加模型/ })
      expect(submitButton).not.toBeDisabled()
    })
  })
})
