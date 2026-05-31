# 添加历史记录按钮功能 Spec

## Why
用户需要在顶部工具栏快速访问和恢复历史会话。目前会话一旦清空或新建就无法恢复，缺乏历史记录管理机制。

## What Changes
- 在顶部工具栏添加"历史记录"按钮，使用History图标
- 点击按钮打开历史记录侧边栏/抽屉，显示已保存的会话快照列表
- 支持将当前会话保存为历史记录（手动保存）
- 点击历史记录项可恢复工作区到该历史状态（包括消息和选中模型）
- 支持删除单条历史记录
- **历史记录保存到后端文件**（data/histories.yaml），类似模型配置的存储方式

## Impact
- 受影响组件: App.tsx, 新增 HistorySidebar 组件
- 受影响hooks: useChatStream（添加保存/恢复历史状态功能）
- 新增后端模块: server/src/history.rs（历史记录存储管理）
- 新增后端路由: /api/histories（历史记录CRUD接口）
- 新增存储文件: server/data/histories.yaml

## ADDED Requirements

### Requirement: 历史记录按钮
The system SHALL 在顶部工具栏提供历史记录入口按钮。

#### Scenario: 显示历史记录按钮
- **GIVEN** 用户处于主界面
- **WHEN** 查看顶部工具栏
- **THEN** 可以看到"历史记录"图标按钮

### Requirement: 历史记录列表
The system SHALL 以侧边栏形式展示已保存的历史会话列表。

#### Scenario: 打开历史记录侧边栏
- **GIVEN** 用户点击历史记录按钮
- **WHEN** 系统响应
- **THEN** 右侧滑出历史记录侧边栏，显示历史会话列表

#### Scenario: 显示空状态
- **GIVEN** 没有保存任何历史记录
- **WHEN** 打开历史记录侧边栏
- **THEN** 显示"暂无历史记录"提示

### Requirement: 保存历史记录
The system SHALL 支持将当前会话保存为历史记录。

#### Scenario: 手动保存当前会话
- **GIVEN** 用户有活跃的对话
- **WHEN** 点击"保存到历史记录"按钮
- **THEN** 当前会话（消息+选中模型）被保存到后端文件，显示成功提示

### Requirement: 恢复历史记录
The system SHALL 支持从历史记录恢复会话状态。

#### Scenario: 点击历史记录项
- **GIVEN** 历史记录侧边栏已打开且有保存的会话
- **WHEN** 用户点击某条历史记录
- **THEN** 当前工作区恢复为该历史记录的状态（消息列表和选中模型）

#### Scenario: 恢复时清空当前会话确认
- **GIVEN** 当前有未保存的对话
- **WHEN** 用户点击历史记录项
- **THEN** 弹出确认对话框，确认后恢复历史状态

### Requirement: 删除历史记录
The system SHALL 支持删除单条历史记录。

#### Scenario: 删除历史记录
- **GIVEN** 历史记录侧边栏已打开
- **WHEN** 用户点击历史记录项的删除按钮
- **THEN** 该历史记录从列表和后端文件中移除

### Requirement: 历史记录存储格式
The system SHALL 在后端 data/histories.yaml 文件中按以下格式存储历史记录：

```yaml
histories:
  - id: "uuid-string"
    name: "会话名称"
    timestamp: 1234567890
    selected_model: "model-id"
    messages:
      - role: "user"
        content: "用户消息内容"
        model: null
      - role: "assistant"
        content: "助手回复内容"
        model: "model-id"
```

### Requirement: 后端API接口
The system SHALL 提供以下REST API：

- `GET /api/histories` - 获取所有历史记录列表
- `POST /api/histories` - 创建新历史记录
  - 请求体: `{ name: string, selected_model: string|null, messages: ChatMessage[] }`
  - 响应: 完整的HistoryRecord（包含生成的id和timestamp）
- `GET /api/histories/:id` - 获取单个历史记录详情
- `DELETE /api/histories/:id` - 删除指定历史记录
