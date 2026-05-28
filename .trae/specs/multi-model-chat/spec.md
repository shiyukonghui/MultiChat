# MultiChat 多模型并发对话系统 Spec

## Why
构建一个 Web 应用，允许用户在单一界面输入一次提问，系统并发发送至多个已配置的大语言模型（LLM），并通过 SSE 流式实时推送各模型回复。用户可通过侧边栏自由切换、对比不同模型的完整回答，支持多轮对话保留上下文，并提供前端模型配置管理界面。

## What Changes
- 初始化 Rust 后端项目（Axum + llmg-gateway），实现 SSE 流式对话接口和模型管理 REST API
- 初始化 React + TypeScript + MUI 前端项目，实现聊天界面、侧边栏、模型配置面板
- 实现多模型并发调用、实时流式推送、最快返回优先展示
- 实现多轮对话上下文管理和前端 localStorage 持久化
- 实现前端模型配置管理，配置变更实时生效
- 实现错误处理：单模型失败不影响其他模型、超时控制、SSE 断线重连
- 记录开发过程中的功能决策点到 `docs/功能决策点.md`

## Impact
- Affected specs: 无（全新项目）
- Affected code: 全新项目，无现有代码影响

## ADDED Requirements

### Requirement: 后端项目脚手架
系统 SHALL 提供基于 Rust + Axum + llmg-gateway 的后端服务基础框架，包含项目结构、依赖管理、日志系统。

#### Scenario: 后端服务启动
- **WHEN** 开发者执行 `cargo run`
- **THEN** 后端服务在指定端口启动，打印启动日志，并加载模型配置

#### Scenario: 模型配置加载
- **WHEN** 后端服务启动
- **THEN** 从 `config/models.yaml` 加载默认模型配置，API Key 从环境变量 `LLM_API_KEY_{PROVIDER}` 读取

---

### Requirement: SSE 流式对话接口 (GET /api/chat/stream)
系统 SHALL 提供 SSE 接口，接收用户消息和对话历史，并发调用所有已启用的模型，实时流式推送各模型的回复。

#### Scenario: 正常流式对话
- **WHEN** 用户发送消息 "什么是 Rust 的异步机制？"
- **THEN** 后端并行向所有已启用模型发送请求，通过 SSE 逐步推送每个模型的 `chunk` 事件和最终的 `done` 事件

#### Scenario: 单模型调用失败
- **WHEN** 某个模型返回错误（如超时、API 配额不足）
- **THEN** 后端推送该模型的 `error` 事件，其他模型继续正常返回，HTTP 状态仍为 200

#### Scenario: 所有模型均失败
- **WHEN** 所有已启用的模型均返回错误
- **THEN** 后端为每个模型推送 `error` 事件，SSE 连接正常关闭

#### Scenario: 单个模型超时
- **WHEN** 某个模型在 60 秒内未返回任何内容
- **THEN** 后端推送该模型的 `error` 事件（code: TIMEOUT），不阻塞其他模型

#### Scenario: 请求参数无效
- **WHEN** 消息为空或超过 4000 字符
- **THEN** 返回 HTTP 400 错误，不建立 SSE 连接

---

### Requirement: 模型管理 REST API (GET/PUT /api/models)
系统 SHALL 提供 REST API 用于查询和更新模型配置。

#### Scenario: 获取模型列表
- **WHEN** 前端请求 `GET /api/models`
- **THEN** 返回所有模型的列表，包含 id、name、provider、enabled、status 字段

#### Scenario: 更新模型启用状态
- **WHEN** 前端发送 `PUT /api/models/{id}` 修改 `enabled` 字段
- **THEN** 后端更新内存中的模型启用状态，变更立即生效，无需重启

---

### Requirement: 前端项目脚手架
系统 SHALL 提供基于 React 18 + TypeScript + MUI v5 的前端项目基础框架。

#### Scenario: 前端开发服务器启动
- **WHEN** 开发者执行 `npm start`（或 `pnpm dev`）
- **THEN** 前端开发服务器在指定端口启动，显示基础聊天界面框架

---

### Requirement: 聊天输入与发送 (UC1)
系统 SHALL 提供聊天输入框，支持输入校验和发送控制。

#### Scenario: 正常发送消息
- **WHEN** 用户在输入框键入 "什么是 Rust？" 并点击发送
- **THEN** 前端校验通过，发起 SSE 连接，发送按钮在请求期间禁用，界面进入加载状态

#### Scenario: 输入为空
- **WHEN** 用户输入为空并尝试发送
- **THEN** 发送按钮保持禁用状态，不发起请求

#### Scenario: 输入超过 4000 字符
- **WHEN** 用户输入超过 4000 字符
- **THEN** 前端显示字符数超限提示

---

### Requirement: 流式回复实时渲染 (UC1)
系统 SHALL 通过 SSE 接收流式内容，实时渲染各模型回复，并实现最快返回优先展示。

#### Scenario: 首个模型返回内容
- **WHEN** 任一模型首次推送 `chunk` 事件
- **THEN** 该模型自动成为当前选中模型，右侧主区域立即开始流式显示其回复

#### Scenario: 多模型同时流式更新
- **WHEN** 多个模型同时推送 `chunk` 事件
- **THEN** 所有模型的回复内容都在后台实时更新，侧边栏状态同步刷新

#### Scenario: Markdown 渲染
- **WHEN** 模型返回包含 Markdown 格式的回复
- **THEN** 前端以富文本形式渲染（含代码高亮）

---

### Requirement: 侧边栏模型切换 (UC2)
系统 SHALL 提供侧边栏展示所有模型状态，支持点击切换查看不同模型回复。

#### Scenario: 侧边栏展示模型状态
- **WHEN** 对话进行中
- **THEN** 侧边栏显示每个模型的名称、实时状态图标（加载中/已完成/失败）、当前选中项高亮

#### Scenario: 点击切换模型
- **WHEN** 用户在侧边栏点击某个已完成的模型
- **THEN** 右侧主区域立即切换为该模型的回复内容，无页面闪烁

#### Scenario: 失败模型显示
- **WHEN** 某个模型调用失败
- **THEN** 侧边栏该模型显示红色感叹号图标，右侧区域显示用户友好的错误提示

---

### Requirement: 多轮对话 (UC3)
系统 SHALL 支持多轮对话，将对话历史发送给后端，保留对话上下文。

#### Scenario: 连续提问
- **WHEN** 用户在第一轮对话后继续提问
- **THEN** 前端将完整对话历史（messages 数组）发送至后端，各模型基于上下文生成回复

#### Scenario: 对话历史持久化
- **WHEN** 用户刷新页面
- **THEN** 前端从 localStorage 恢复对话历史，可继续查看和对话

#### Scenario: Token 限制
- **WHEN** 对话历史超过 10 轮
- **THEN** 自动丢弃最早的对话记录，仅保留最近 10 轮

#### Scenario: 新建/清空会话
- **WHEN** 用户点击"新建会话"或"清空会话"
- **THEN** 对话历史清空，界面重置为初始状态

---

### Requirement: 模型配置管理界面 (UC4)
系统 SHALL 提供前端模型配置管理页面，支持查看和启用/禁用模型。

#### Scenario: 查看模型列表
- **WHEN** 用户进入模型配置页面
- **THEN** 以列表形式展示所有模型，包含名称、Provider、启用开关、当前状态

#### Scenario: 启用/禁用模型
- **WHEN** 用户切换某个模型的启用开关
- **THEN** 前端调用 `PUT /api/models/{id}` 更新配置，配置实时生效

#### Scenario: 禁用模型不参与对话
- **WHEN** 某模型被禁用后用户发送新消息
- **THEN** 被禁用的模型不出现在侧边栏，不参与请求

---

### Requirement: 错误处理与可靠性
系统 SHALL 提供全面的错误处理和用户友好的提示。

#### Scenario: SSE 连接中断
- **WHEN** SSE 连接意外断开
- **THEN** 前端自动重连，并提示用户"连接已断开，正在重连..."

#### Scenario: 所有模型不可用
- **WHEN** 发送请求后所有模型均失败
- **THEN** 前端显示"所有模型暂不可用"提示

#### Scenario: 重复提交防护
- **WHEN** 用户在一次请求未完成时尝试再次发送
- **THEN** 发送按钮保持禁用状态，直到当前请求完成

---

### Requirement: 功能决策点记录
系统 SHALL 在开发过程中将功能抉择、技术选型理由等记录到 `docs/功能决策点.md`。

#### Scenario: 技术选型决策
- **WHEN** 开发过程中面临多个可行方案需要选择
- **THEN** 将选择的方案、理由和备选方案记录到功能决策点文档

#### Scenario: 功能取舍决策
- **WHEN** 开发过程中决定实现或延后某个功能
- **THEN** 将决策原因记录到功能决策点文档
