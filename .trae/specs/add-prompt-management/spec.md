# 系统提示词（System Prompt）管理功能 Spec

## Why

用户在多模型对比对话中，需要为不同模型设置统一的系统提示词（System Prompt）来约束模型行为、角色设定或分析框架。目前每次新建对话或切换场景都需要手动输入提示词，缺乏保存、管理和快速切换的机制，导致重复劳动且无法系统性地对比不同提示词对模型输出的影响。

## What Changes

- 在顶部工具栏"清空"按钮右侧新增"提示词"按钮（SmartToy 图标）
- 点击按钮弹出居中 Dialog，包含提示词管理界面
- 提示词列表展示（标题、内容摘要、激活状态标识）
- 支持提示词的 CRUD（创建、读取、更新、删除）
- 支持激活/取消激活提示词（同一时刻只能激活一个）
- **新增后端模块**：`server/src/routes/prompts.rs`（提示词 CRUD API）
- **新增后端数据模型**：`server/src/models/prompt.rs`
- **新增后端存储文件**：`server/data/prompts.yaml`
- 前端发送消息时，检测是否有激活的提示词，如有则作为 `role: "system"` 注入 messages 数组头部
- 历史记录**保留** system 消息（供后续对比不同提示词效果）
- 激活状态纯前端管理（localStorage 持久化），后端不感知

## Impact

- 受影响组件: `App.tsx`（工具栏新增按钮、Dialog 开关状态）、`ChatInput.tsx`（发送时注入 system message）
- 新增前端组件: `PromptDialog.tsx`（提示词管理弹窗）
- 新增后端模块: `server/src/models/prompt.rs`、`server/src/routes/prompts.rs`
- 新增后端路由: `/api/prompts`（CRUD 接口）
- 新增存储文件: `server/data/prompts.yaml`

## ADDED Requirements

### Requirement: 工具栏提示词按钮
The system SHALL 在顶部工具栏提供提示词入口按钮。

#### Scenario: 显示提示词按钮
- **GIVEN** 用户处于主界面
- **WHEN** 查看顶部工具栏
- **THEN** 可以看到"提示词"图标按钮，位于"清空"按钮右侧

#### Scenario: 点击打开提示词管理弹窗
- **GIVEN** 用户点击提示词按钮
- **WHEN** 系统响应
- **THEN** 弹出居中 Dialog，显示提示词管理界面

### Requirement: 提示词列表
The system SHALL 在 Dialog 中以列表形式展示所有已保存的提示词。

#### Scenario: 显示提示词列表
- **GIVEN** 提示词管理弹窗已打开
- **WHEN** 系统加载完成
- **THEN** 显示所有提示词列表，每条显示标题、内容摘要、创建/更新时间、激活状态标识

#### Scenario: 显示空状态
- **GIVEN** 没有保存任何提示词
- **WHEN** 打开提示词管理弹窗
- **THEN** 显示"暂无提示词，点击上方按钮创建"的占位提示

#### Scenario: 列表排序
- **GIVEN** 提示词列表已加载
- **WHEN** 展示列表
- **THEN** 按 `updated_at` 降序排列（最近修改的排最前）

### Requirement: 创建提示词
The system SHALL 支持用户创建新的提示词。

#### Scenario: 创建提示词
- **GIVEN** 提示词管理弹窗已打开
- **WHEN** 用户点击"新建"按钮，填写标题和内容，点击"保存"
- **THEN** 新提示词保存到后端，列表刷新，显示成功提示

#### Scenario: 创建时校验
- **GIVEN** 用户正在创建提示词
- **WHEN** 标题为空或超过50字符，或内容为空或超过4000字符
- **THEN** 保存按钮禁用，显示相应校验错误提示

### Requirement: 编辑提示词
The system SHALL 支持用户编辑已有的提示词。

#### Scenario: 编辑提示词
- **GIVEN** 提示词列表已显示
- **WHEN** 用户点击某条提示词的"编辑"按钮，修改标题或内容后点击"保存"
- **THEN** 更新后的数据保存到后端，列表刷新

### Requirement: 删除提示词
The system SHALL 支持用户删除提示词。

#### Scenario: 删除提示词
- **GIVEN** 提示词列表已显示
- **WHEN** 用户点击某条提示词的"删除"按钮
- **THEN** 弹出确认对话框，确认后删除，列表刷新

#### Scenario: 删除已激活的提示词
- **GIVEN** 当前激活的提示词被删除
- **WHEN** 删除确认后
- **THEN** 该提示词被删除，同时自动取消激活状态（activePromptId 置为 null）

### Requirement: 激活/取消激活提示词
The system SHALL 支持用户激活或取消激活提示词。

#### Scenario: 激活提示词
- **GIVEN** 提示词列表已显示
- **WHEN** 用户点击某条提示词的"激活"按钮
- **THEN** 该提示词被标记为激活状态，之前激活的提示词（如有）自动取消激活

#### Scenario: 取消激活提示词
- **GIVEN** 有已激活的提示词
- **WHEN** 用户点击已激活提示词的"取消激活"按钮
- **THEN** 激活状态取消，activePromptId 置为 null

#### Scenario: 刷新后保持激活状态
- **GIVEN** 用户已激活某个提示词
- **WHEN** 页面刷新
- **THEN** 从 localStorage 读取 activePromptId，自动恢复激活状态

#### Scenario: 激活的提示词已被删除
- **GIVEN** localStorage 中存储的 activePromptId 对应的提示词已被删除
- **WHEN** 页面加载完成
- **THEN** 自动将 activePromptId 置为 null，无激活提示词

### Requirement: 发送消息时注入 System Prompt
The system SHALL 在发送消息时自动注入激活的系统提示词。

#### Scenario: 有激活提示词时发送消息
- **GIVEN** 用户激活了某个提示词，且在输入框中输入了消息
- **WHEN** 用户点击发送
- **THEN** 前端构建 messages 数组：`[{ role: "system", content: 激活的提示词内容 }, ...历史消息, { role: "user", content: 用户输入 }]`，通过 SSE 发送

#### Scenario: 无激活提示词时发送消息
- **GIVEN** 没有激活任何提示词
- **WHEN** 用户点击发送
- **THEN** 保持现有行为，不附加 system message

### Requirement: 提示词存储格式
The system SHALL 在后端 `data/prompts.yaml` 文件中按以下格式存储提示词：

```yaml
prompts:
  - id: "p_uuid-string"
    title: "代码审查助手"
    content: "你是一个资深代码审查专家，请从代码质量、安全性、性能三个方面给出审查意见。"
    created_at: "2026-06-01T10:00:00+08:00"
    updated_at: "2026-06-03T14:30:00+08:00"
```

### Requirement: 后端 API 接口
The system SHALL 提供以下 REST API：

- `GET /api/prompts` - 获取所有提示词列表
- `GET /api/prompts/{id}` - 获取单个提示词详情
- `POST /api/prompts` - 创建新提示词
  - 请求体: `{ title: string, content: string }`
  - 响应: 完整的 Prompt 对象（包含生成的 id 和 timestamp）
- `PUT /api/prompts/{id}` - 更新提示词（支持部分更新）
  - 请求体: `{ title?: string, content?: string }`
- `DELETE /api/prompts/{id}` - 删除指定提示词

### Requirement: 输入校验
The system SHALL 对提示词的标题和内容进行输入校验。

#### Scenario: 标题校验
- **GIVEN** 用户正在创建或编辑提示词
- **WHEN** 标题为空或超过50字符
- **THEN** 后端返回 400 错误，前端显示对应错误提示

#### Scenario: 内容校验
- **GIVEN** 用户正在创建或编辑提示词
- **WHEN** 内容为空或超过4000字符
- **THEN** 后端返回 400 错误，前端显示对应错误提示