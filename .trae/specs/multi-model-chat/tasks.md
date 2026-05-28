# Tasks

- [x] Task 1: 初始化 Rust 后端项目脚手架
  - [x] SubTask 1.1: 创建 Cargo 项目，配置 Axum、Tokio、llmg-gateway、serde、tracing 等依赖
  - [x] SubTask 1.2: 创建项目目录结构（src/main.rs, src/routes/, src/models/, config/）
  - [x] SubTask 1.3: 实现配置加载模块：从 `config/models.yaml` 读取模型配置，从环境变量读取 API Key
  - [x] SubTask 1.4: 实现日志系统（tracing-subscriber），配置日志格式和级别
  - [x] SubTask 1.5: 编写基础 main.rs，启动 Axum HTTP 服务，监听配置端口
  - **验证**：`cargo build` 成功，`cargo run` 启动后打印启动日志 ✅

- [x] Task 2: 实现后端模型管理 REST API (GET/PUT /api/models)
  - [x] SubTask 2.1: 定义 ModelConfig 数据结构（id, name, provider, model, enabled, timeout_seconds, max_tokens, status）
  - [x] SubTask 2.2: 实现共享状态管理（Arc<RwLock<Vec<ModelConfig>>>），支持并发读写
  - [x] SubTask 2.3: 实现 `GET /api/models` 接口，返回所有模型列表
  - [x] SubTask 2.4: 实现 `PUT /api/models/{id}` 接口，支持更新 enabled 状态
  - **验证**：用 curl 测试 GET 返回模型列表，PUT 修改后 GET 确认变更 ✅

- [x] Task 3: 实现后端 SSE 流式对话接口 (GET /api/chat/stream)
  - [x] SubTask 3.1: 定义请求参数结构（message, history），实现参数校验（非空、长度限制）
  - [x] SubTask 3.2: 实现 SSE 流式响应辅助工具（构建 SSE 事件格式：chunk/done/error）
  - [x] SubTask 3.3: 实现多模型并发调用逻辑：使用 tokio::spawn 对每个已启用模型发起异步请求
  - [x] SubTask 3.4: 集成 llmg-gateway 统一接口，传递消息和对话历史到各模型
  - [x] SubTask 3.5: 实现单模型超时控制（60 秒），超时后推送 error 事件
  - [x] SubTask 3.6: 实现错误处理和重试机制（最多重试 1 次，间隔 1 秒，仅网络错误和 5xx/429 重试）
  - [x] SubTask 3.7: 实现 SSE 事件流分发：通过 mpsc channel 汇总各模型的 chunk/done/error 事件，统一推送到前端
  - **验证**：启动服务，用 curl `GET /api/chat/stream?message=hello` 测试，观察 SSE 事件流输出 ✅

- [x] Task 4: 初始化 React + TypeScript + MUI 前端项目脚手架
  - [x] SubTask 4.1: 使用 Vite 创建 React + TypeScript 项目
  - [x] SubTask 4.2: 安装 MUI v5 依赖（@mui/material, @mui/icons-material, @emotion/react, @emotion/styled）
  - [x] SubTask 4.3: 安装其他依赖（axios, react-markdown, react-syntax-highlighter）
  - [x] SubTask 4.4: 创建前端目录结构（components/, hooks/, types/, pages/, utils/）
  - [x] SubTask 4.5: 配置 MUI 主题（ThemeProvider），设置基础布局（AppBar + 侧边栏 + 主内容区）
  - [x] SubTask 4.6: 配置 Vite 代理，将 /api 请求转发到后端服务
  - **验证**：`npm run dev` 启动后浏览器显示基础布局框架 ✅

- [x] Task 5: 实现聊天输入组件 ChatInput
  - [x] SubTask 5.1: 创建 ChatInput 组件，包含 TextField 和发送按钮（MUI）
  - [x] SubTask 5.2: 实现输入校验：空值禁用发送按钮，超过 4000 字符显示提示
  - [x] SubTask 5.3: 实现发送逻辑：调用 onSend 回调，请求期间禁用按钮（防重复提交）
  - [x] SubTask 5.4: 支持 Enter 键发送，Shift+Enter 换行
  - **验证**：UI 渲染正确，输入校验和发送逻辑正常 ✅

- [x] Task 6: 实现 SSE 流式数据接收与状态管理
  - [x] SubTask 6.1: 创建 useChatStream 自定义 Hook，封装 SSE 连接管理
  - [x] SubTask 6.2: 实现 SSE 事件解析：处理 chunk/done/error 事件类型
  - [x] SubTask 6.3: 实现对话状态管理（useReducer）：models 状态、responses、selectedModel
  - [x] SubTask 6.4: 实现最快返回优先逻辑：首个 chunk 事件的模型自动设为 selectedModel
  - [x] SubTask 6.5: 实现 SSE 断线重连机制（自动重连 + 用户提示）
  - **验证**：发起请求后，控制台可观察 SSE 事件接收和状态更新 ✅

- [x] Task 7: 实现流式回复渲染组件 StreamingResponse
  - [x] SubTask 7.1: 创建 StreamingResponse 组件，接收模型名和内容，实时渲染流式文本
  - [x] SubTask 7.2: 集成 react-markdown 实现 Markdown 渲染
  - [x] SubTask 7.3: 集成 react-syntax-highlighter 实现代码高亮
  - [x] SubTask 7.4: 实现加载状态动画（打字效果/闪烁光标）
  - [x] SubTask 7.5: 实现错误状态展示（用户友好的错误提示）
  - **验证**：收到 SSE chunk 事件后，内容实时渲染，Markdown 格式正确显示 ✅

- [x] Task 8: 实现模型侧边栏 ModelSidebar
  - [x] SubTask 8.1: 创建 ModelSidebar 组件，以列表形式展示所有已启用模型
  - [x] SubTask 8.2: 实现状态图标：加载中（CircularProgress）、已完成（绿色勾选 CheckCircle）、失败（红色感叹号 Error）
  - [x] SubTask 8.3: 实现点击切换：点击模型名更新 selectedModel 状态
  - [x] SubTask 8.4: 实现选中高亮样式：当前选中项有背景色和左侧边框标识
  - **验证**：对话进行中侧边栏实时显示各模型状态，点击切换右侧内容 ✅

- [x] Task 9: 实现多轮对话与历史管理
  - [x] SubTask 9.1: 创建 ChatHistory 组件/模块，管理对话历史数组
  - [x] SubTask 9.2: 实现 localStorage 持久化：页面刷新后恢复对话历史
  - [x] SubTask 9.3: 实现 Token 限制策略：保留最近 10 轮对话，超出自动丢弃
  - [x] SubTask 9.4: 实现新建会话和清空会话功能（按钮 + 确认对话框）
  - [x] SubTask 9.5: 发送新消息时携带完整对话历史到后端
  - **验证**：连续提问后刷新页面，历史保留；超过 10 轮后旧记录被裁剪 ✅

- [x] Task 10: 实现模型配置管理页面 ModelConfigPanel
  - [x] SubTask 10.1: 创建 ModelConfigPanel 页面组件（独立路由或对话框）
  - [x] SubTask 10.2: 页面加载时调用 GET /api/models 获取模型列表
  - [x] SubTask 10.3: 实现模型列表展示：名称、Provider、启用/禁用 Switch、状态标签
  - [x] SubTask 10.4: 实现 Switch 切换调用 PUT /api/models/{id} 更新配置
  - [x] SubTask 10.5: 实现配置变更反馈（成功/失败 Snackbar 提示）
  - **验证**：进入配置页面查看模型列表，切换开关后确认变更生效 ✅

- [x] Task 11: 集成主页面与整体调试
  - [x] SubTask 11.1: 创建主页面 ChatPage，组合 ChatInput、ModelSidebar、StreamingResponse
  - [x] SubTask 11.2: 实现全局错误处理边界（ErrorBoundary）
  - [x] SubTask 11.3: 实现所有模型均失败时的 "所有模型暂不可用" 提示
  - [x] SubTask 11.4: 端到端调试：前端输入消息 → 后端并发调用 → SSE 流式返回 → 前端实时渲染
  - [x] SubTask 11.5: 处理各类异常场景（网络断开、后端崩溃、单个模型超时）
  - **验证**：完整流程可正常运行，所有验收标准通过 ✅

- [x] Task 12: 创建功能决策点记录文档
  - [x] SubTask 12.1: 创建 `docs/功能决策点.md` 文件
  - [x] SubTask 12.2: 记录项目初始化阶段的技术选型和决策理由
  - [x] SubTask 12.3: 在各开发任务中持续记录功能抉择
  - **验证**：文档存在且内容完整 ✅

# Task Dependencies
- Task 2 依赖 Task 1（后端脚手架）
- Task 3 依赖 Task 2（需要模型配置状态）
- Task 5 依赖 Task 4（前端脚手架）
- Task 6 依赖 Task 5（需要 ChatInput 触发请求）
- Task 7 依赖 Task 6（需要 useChatStream 提供数据）
- Task 8 依赖 Task 6（需要状态管理数据）
- Task 9 依赖 Task 6 和 Task 8（需要状态和历史管理）
- Task 10 依赖 Task 4（前端脚手架即可，可独立开发）
- Task 11 依赖 Task 5, Task 6, Task 7, Task 8, Task 9（集成所有组件）
- Task 12 贯穿开发全程，可在任意阶段更新

# 可并行执行
- Task 1（后端）+ Task 4（前端）可并行
- Task 2（后端） + Task 5（前端）可并行
- Task 10 可与其他前端任务并行
