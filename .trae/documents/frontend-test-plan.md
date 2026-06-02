# 前端测试用例计划

## 一、项目概况

### 技术栈
- **框架**: React 19.2.6 + TypeScript 6.0.2
- **构建工具**: Vite 8.0.12
- **UI 组件库**: Material-UI (MUI) 9.0.1
- **HTTP 客户端**: Axios 1.16.1
- **Markdown 渲染**: react-markdown + remark-gfm
- **代码高亮**: react-syntax-highlighter

### 当前状态
- ❌ 无测试框架配置
- ❌ 无测试文件
- ❌ 无测试脚本

## 二、测试框架选型

### 推荐方案
使用 **Vitest** + **React Testing Library** + **MSW (Mock Service Worker)**

#### 选型理由
1. **Vitest**: 
   - 与 Vite 原生集成，配置简单
   - 速度极快，支持 HMR
   - 兼容 Jest API，迁移成本低
   - 内置 TypeScript 支持

2. **React Testing Library**:
   - React 官方推荐
   - 关注用户行为而非实现细节
   - 与 Jest/Vitest 完美配合

3. **MSW (Mock Service Worker)**:
   - 在浏览器和 Node 环境中模拟 API
   - 不污染全局对象
   - 支持流式响应（SSE）模拟

## 三、测试用例详细设计

### 3.1 工具函数测试 (`utils/`)

#### 3.1.1 API 模块测试 (`api.ts`)

**测试文件**: `client/src/utils/__tests__/api.test.ts`

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| `fetchModels` 正常返回 | Mock 成功响应 | 返回模型配置数组 |
| `fetchModels` 网络错误 | Mock 网络失败 | 抛出错误 |
| `fetchModels` 超时处理 | Mock 超时响应 | 抛出超时错误 |
| `updateModel` 成功 | Mock PUT 请求成功 | 无异常抛出 |
| `updateModel` 失败 | Mock 404 响应 | 抛出错误 |
| `createModel` 成功 | Mock POST 请求成功 | 返回新创建的模型 |
| `createModel` 验证失败 | Mock 400 响应 | 抛出验证错误 |
| `deleteModel` 成功 | Mock DELETE 请求成功 | 无异常抛出 |
| `deleteModel` 不存在 | Mock 404 响应 | 抛出错误 |
| `updateModelDetail` 成功 | Mock PUT 请求成功 | 返回更新后的模型 |
| `createChatStreamUrl` 无历史 | 传入空历史 | 返回正确的 URL 参数 |
| `createChatStreamUrl` 有历史 | 传入历史记录 | URL 包含 history 参数 |
| `fetchHistories` 成功 | Mock GET 请求成功 | 返回历史记录摘要数组 |
| `saveHistory` 成功 | Mock POST 请求成功 | 返回完整历史记录 |
| `deleteHistory` 成功 | Mock DELETE 请求成功 | 无异常抛出 |
| `fetchHistoryDetail` 成功 | Mock GET 请求成功 | 返回完整历史记录详情 |

#### 3.1.2 chatReducer 测试 (`chatReducer.ts`)

**测试文件**: `client/src/utils/__tests__/chatReducer.test.ts`

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| `SEND_MESSAGE` 添加用户消息 | 发送消息 action | messages 包含新消息，isLoading 为 true |
| `SEND_MESSAGE` 保存到 localStorage | 发送消息后 | localStorage 被更新 |
| `MODEL_CHUNK` 首次接收 | 第一个模型返回内容 | selectedModel 自动设置，content 追加 |
| `MODEL_CHUNK` 增量更新 | 已有模型继续返回 | content 正确追加 |
| `MODEL_CHUNK` 多模型并发 | 多个模型同时返回 | 各模型状态独立更新 |
| `MODEL_DONE` 完成标记 | 模型完成回复 | status 变为 done，消息加入历史 |
| `MODEL_DONE` 无内容时 | 模型无现有状态 | 创建默认完成状态 |
| `MODEL_ERROR` 标记错误 | 模型返回错误 | status 变为 error，记录错误信息 |
| `SELECT_MODEL` 切换模型 | 选择不同模型 | selectedModel 更新 |
| `SET_LOADING` 设置加载状态 | 设置加载状态 | isLoading 正确更新 |
| `SET_RECONNECTING` 设置重连状态 | 设置重连状态 | isReconnecting 正确更新 |
| `INIT_MODELS` 初始化模型列表 | 传入模型 ID 数组 | 所有模型设为 pending 状态 |
| `REFRESH_MODELS` 添加新模型 | 传入新模型 ID | 新模型添加为 pending |
| `REFRESH_MODELS` 移除禁用模型 | 传入不包含某模型 | pending 且无内容的模型被移除 |
| `RESET` 重置会话 | 执行重置 | 所有状态恢复初始值 |
| `RESET` 清空 localStorage | 执行重置 | localStorage 被清空 |
| `LOAD_HISTORY` 恢复历史 | 传入消息数组 | messages 被正确设置 |
| `LOAD_HISTORY` 无效数据 | 传入非数组 | 使用空数组，记录警告 |
| `loadHistoryFromStorage` 正常数据 | localStorage 有有效数据 | 返回解析后的数组 |
| `loadHistoryFromStorage` 无数据 | localStorage 为空 | 返回空数组 |
| `loadHistoryFromStorage` 损坏数据 | localStorage 有无效 JSON | 返回空数组，清除损坏数据 |
| `loadHistoryFromStorage` 过滤无效消息 | 数组包含无效元素 | 只返回有效消息 |
| `loadHistoryFromStorage` 限制轮数 | 超过 10 轮对话 | 只保留最近 10 轮 |
| `saveHistoryToStorage` 正常保存 | 传入消息数组 | localStorage 正确更新 |

### 3.2 自定义 Hook 测试 (`hooks/`)

#### 3.2.1 useChatStream 测试 (`useChatStream.ts`)

**测试文件**: `client/src/hooks/__tests__/useChatStream.test.ts`

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| 初始状态正确 | Hook 初始化 | messages 从 localStorage 恢复 |
| `sendMessage` 添加用户消息 | 调用发送 | messages 包含用户消息 |
| `sendMessage` 建立 SSE 连接 | 调用发送 | EventSource 被创建 |
| `sendMessage` 接收 chunk 事件 | Mock SSE chunk | modelStatuses 更新 |
| `sendMessage` 接收 done 事件 | Mock SSE done | 模型状态变为 done |
| `sendMessage` 接收 error 事件 | Mock SSE error | 模型状态变为 error |
| `sendMessage` 所有模型完成 | 所有模型返回 done | EventSource 关闭，isLoading 为 false |
| `sendMessage` 连接重连 | Mock 连接断开重连 | isReconnecting 为 true |
| `sendMessage` 重连成功 | Mock 重连成功 | isReconnecting 为 false |
| `selectModel` 切换模型 | 调用选择 | selectedModel 更新 |
| `resetSession` 重置会话 | 调用重置 | 所有状态清空，连接关闭 |
| `refreshModels` 刷新模型列表 | Mock API 响应 | modelStatuses 更新 |
| `loadHistory` 加载历史 | 传入消息数组 | messages 被正确设置 |
| `loadHistory` 无效参数 | 传入非数组 | 使用空数组，记录错误 |
| 连接在重置时关闭 | 重置时连接存在 | EventSource.close() 被调用 |
| 多次发送消息 | 连续发送 | 旧连接关闭，新连接建立 |

### 3.3 组件测试 (`components/`)

#### 3.3.1 ChatInput 测试 (`ChatInput.tsx`)

**测试文件**: `client/src/components/__tests__/ChatInput.test.tsx`

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| 渲染输入框和按钮 | 组件挂载 | 显示 TextField 和 IconButton |
| 输入文本更新 | 输入内容 | 输入框值更新 |
| 点击发送按钮 | 输入内容后点击 | onSend 被调用，输入框清空 |
| Enter 键发送 | 按 Enter 键 | onSend 被调用 |
| Shift+Enter 换行 | 按 Shift+Enter | 不发送，换行 |
| 空消息不发送 | 输入框为空点击发送 | onSend 不被调用 |
| 加载中禁用 | isLoading 为 true | 输入框和按钮禁用 |
| 字符数超限 | 输入超过 4000 字符 | 显示错误，按钮禁用 |
| 字符计数显示 | 输入内容 | 显示当前字符数 |
| 发送后聚焦 | 发送消息后 | 输入框获得焦点 |
| 按钮样式正确 | 不同状态 | 禁用/启用样式正确 |

#### 3.3.2 StreamingResponse 测试 (`StreamingResponse.tsx`)

**测试文件**: `client/src/components/__tests__/StreamingResponse.test.tsx`

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| 无模型选中 | modelStatus 为 undefined | 显示"选择一个模型查看回复" |
| pending 状态 | status 为 pending | 显示加载动画和等待文本 |
| streaming 状态 | status 为 streaming | 显示内容，有闪烁光标 |
| done 状态 | status 为 done | 显示完整内容，无光标 |
| error 状态 | status 为 error | 显示错误提示 |
| Markdown 渲染 | 内容包含 Markdown | 正确渲染标题、列表、代码块 |
| 代码块高亮 | 内容包含代码块 | 语法高亮正确 |
| GFM 扩展 | 内容包含表格、任务列表 | 正确渲染 |
| 自动滚动 | 内容更新 | 滚动到底部 |
| 空内容处理 | content 为空 | 不崩溃，显示空 |

#### 3.3.3 ModelSidebar 测试 (`ModelSidebar.tsx`)

**测试文件**: `client/src/components/__tests__/ModelSidebar.test.tsx`

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| 渲染模型列表 | 传入多个模型状态 | 显示所有模型 |
| 模型状态图标 | 不同状态 | pending/streaming/done/error 图标正确 |
| 选中模型高亮 | selectedModel 设置 | 选中项样式不同 |
| 点击模型 | 点击模型项 | onSelectModel 被调用 |
| 空模型列表 | modelStatuses 为空 | 显示空状态提示 |
| 模型名称显示 | 有 name 和 id | 显示正确的名称 |
| 流式状态指示 | streaming 状态 | 显示动态指示器 |

#### 3.3.4 HistorySidebar 测试 (`HistorySidebar.tsx`)

**测试文件**: `client/src/components/__tests__/HistorySidebar.test.tsx`

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| 打开侧边栏 | open 为 true | 侧边栏可见 |
| 关闭侧边栏 | open 为 false | 侧边栏隐藏 |
| 渲染历史列表 | 传入多条历史记录 | 显示所有记录 |
| 点击历史记录 | 点击某条记录 | onSelectHistory 被调用 |
| 删除历史记录 | 点击删除按钮 | onDeleteHistory 被调用 |
| 空历史列表 | histories 为空 | 显示空状态提示 |
| 时间格式化 | 显示时间戳 | 格式化为可读时间 |
| 消息数量显示 | 显示 messageCount | 数量正确显示 |

#### 3.3.5 AddModelDialog 测试 (`AddModelDialog.tsx`)

**测试文件**: `client/src/components/__tests__/AddModelDialog.test.tsx`

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| 打开对话框 | open 为 true | 对话框可见 |
| 关闭对话框 | 点击关闭 | onClose 被调用 |
| 表单字段渲染 | 对话框打开 | 所有必填字段显示 |
| 必填字段验证 | 提交空表单 | 显示验证错误 |
| 提交有效数据 | 填写完整表单提交 | onSubmit 被调用，数据正确 |
| 取消操作 | 点击取消 | onClose 被调用，数据不提交 |
| Tab 切换 | 切换配置模式 | 显示不同的表单字段 |
| 默认值正确 | 对话框打开 | 表单显示默认值 |

#### 3.3.6 SaveHistoryDialog 测试 (`SaveHistoryDialog.tsx`)

**测试文件**: `client/src/components/__tests__/SaveHistoryDialog.test.tsx`

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| 打开对话框 | open 为 true | 对话框可见 |
| 输入名称 | 输入历史记录名称 | 输入框值更新 |
| 保存操作 | 输入名称后保存 | onSave 被调用 |
| 空名称验证 | 不输入名称保存 | 显示错误，不调用 onSave |
| 取消操作 | 点击取消 | onClose 被调用 |

#### 3.3.7 ChatHistory 测试 (`ChatHistory.tsx`)

**测试文件**: `client/src/components/__tests__/ChatHistory.test.tsx`

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| 渲染消息列表 | 传入多条消息 | 显示所有消息气泡 |
| 用户消息样式 | role 为 user | 右对齐，蓝色背景 |
| 助手消息样式 | role 为 assistant | 左对齐，灰色背景 |
| 模型名称显示 | 助手消息有 model | 显示模型名称 |
| 空消息列表 | messages 为空 | 不显示任何内容 |
| 长消息处理 | 消息内容很长 | 正确换行显示 |

### 3.4 页面组件测试 (`pages/`)

#### 3.4.1 ModelConfigPanel 测试 (`ModelConfigPanel.tsx`)

**测试文件**: `client/src/pages/__tests__/ModelConfigPanel.test.tsx`

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| 渲染模型列表 | 组件挂载 | 显示所有模型配置 |
| 加载模型列表 | 组件挂载 | 调用 API 获取模型 |
| 启用/禁用模型 | 切换开关 | 调用 updateModel API |
| 删除模型 | 点击删除按钮 | 显示确认对话框 |
| 确认删除 | 确认对话框中确认 | 调用 deleteModel API |
| 打开添加模型对话框 | 点击添加按钮 | AddModelDialog 打开 |
| 添加模型成功 | 提交新模型 | 刷新模型列表 |
| 编辑模型 | 点击编辑按钮 | 打开编辑对话框 |
| 更新模型配置 | 提交编辑表单 | 调用 updateModelDetail API |
| 加载状态 | API 请求中 | 显示加载指示器 |
| 错误处理 | API 失败 | 显示错误提示 |

### 3.5 集成测试

#### 3.5.1 App 组件集成测试

**测试文件**: `client/src/__tests__/App.integration.test.tsx`

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| 完整对话流程 | 输入消息 -> 发送 -> 接收回复 | 消息显示，模型状态更新 |
| 新建会话 | 点击新建按钮 | 会话重置，显示提示 |
| 清空会话 | 点击清空 -> 确认 | 会话清空 |
| 保存历史记录 | 对话后保存 | 历史记录保存成功 |
| 加载历史记录 | 从历史记录恢复 | 消息正确加载 |
| 删除历史记录 | 删除某条历史 | 历史记录被删除 |
| 模型配置管理 | 打开配置 -> 添加模型 | 模型添加成功 |
| 错误边界 | 子组件抛出错误 | 显示错误页面 |
| SSE 重连 | 连接断开后重连 | 显示重连提示，恢复连接 |

### 3.6 端到端测试 (E2E)

#### 3.6.1 用户流程测试

**测试文件**: `client/e2e/chat.spec.ts` (使用 Playwright)

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| 首次访问 | 打开应用 | 显示欢迎页面 |
| 发送消息 | 输入并发送 | 消息显示，模型开始回复 |
| 查看不同模型回复 | 切换模型 | 显示对应模型的回复 |
| 保存对话 | 保存当前对话 | 保存成功，显示在历史记录中 |
| 恢复历史对话 | 加载历史记录 | 对话正确恢复 |
| 配置模型 | 添加新模型 | 模型添加成功，可以使用 |
| 响应式布局 | 不同屏幕尺寸 | 布局正确适配 |

## 四、实施步骤

### 阶段一：测试框架搭建（第 1-2 天）

1. **安装依赖**
   ```bash
   cd client
   npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/coverage-v8 msw
   ```

2. **配置 Vitest**
   - 创建 `vitest.config.ts`
   - 配置测试环境为 jsdom
   - 配置覆盖率报告

3. **配置 MSW**
   - 创建 mock handlers
   - 设置服务器/客户端 mock

4. **添加测试脚本**
   - 在 `package.json` 中添加测试命令

### 阶段二：单元测试（第 3-7 天）

1. **工具函数测试**（第 3-4 天）
   - `api.ts` 测试
   - `chatReducer.ts` 测试

2. **Hook 测试**（第 5 天）
   - `useChatStream.ts` 测试

3. **组件测试**（第 6-7 天）
   - ChatInput 测试
   - StreamingResponse 测试
   - ModelSidebar 测试
   - HistorySidebar 测试
   - AddModelDialog 测试
   - SaveHistoryDialog 测试
   - ChatHistory 测试

### 阶段三：集成测试（第 8-9 天）

1. **ModelConfigPanel 集成测试**
2. **App 组件集成测试**

### 阶段四：E2E 测试（第 10-11 天）

1. **安装 Playwright**
2. **编写关键用户流程测试**

### 阶段五：CI/CD 集成（第 12 天）

1. **配置 GitHub Actions**
2. **添加测试覆盖率报告**
3. **设置测试失败通知**

## 五、测试覆盖率目标

| 类型 | 目标覆盖率 |
|------|-----------|
| 语句覆盖率 | ≥ 80% |
| 分支覆盖率 | ≥ 75% |
| 函数覆盖率 | ≥ 80% |
| 行覆盖率 | ≥ 80% |

## 六、测试最佳实践

### 6.1 测试原则
1. **测试用户行为，而非实现细节**
2. **每个测试独立，不依赖执行顺序**
3. **使用有意义的测试描述**
4. **Mock 外部依赖（API、localStorage）**
5. **测试边界条件和错误情况**

### 6.2 命名规范
- 测试文件：`*.test.ts` 或 `*.test.tsx`
- 测试目录：`__tests__` 或与源文件同级
- 测试描述：使用中文，清晰描述测试意图

### 6.3 Mock 策略
- **API 请求**：使用 MSW 拦截
- **localStorage**：使用 vitest 的 `vi.stubGlobal`
- **EventSource**：创建自定义 Mock 类
- **定时器**：使用 `vi.useFakeTimers`

## 七、测试文件结构

```
client/
├── src/
│   ├── components/
│   │   ├── __tests__/
│   │   │   ├── ChatInput.test.tsx
│   │   │   ├── StreamingResponse.test.tsx
│   │   │   ├── ModelSidebar.test.tsx
│   │   │   ├── HistorySidebar.test.tsx
│   │   │   ├── AddModelDialog.test.tsx
│   │   │   ├── SaveHistoryDialog.test.tsx
│   │   │   └── ChatHistory.test.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── __tests__/
│   │   │   └── useChatStream.test.ts
│   │   └── ...
│   ├── pages/
│   │   ├── __tests__/
│   │   │   └── ModelConfigPanel.test.tsx
│   │   └── ...
│   ├── utils/
│   │   ├── __tests__/
│   │   │   ├── api.test.ts
│   │   │   └── chatReducer.test.ts
│   │   └── ...
│   └── __tests__/
│       ├── App.integration.test.tsx
│       └── setup.ts
├── e2e/
│   └── chat.spec.ts
├── vitest.config.ts
└── package.json
```

## 八、预期成果

1. ✅ 完整的测试框架配置
2. ✅ 80+ 个单元测试用例
3. ✅ 10+ 个集成测试用例
4. ✅ 7+ 个 E2E 测试用例
5. ✅ ≥ 80% 的测试覆盖率
6. ✅ CI/CD 自动化测试流程
7. ✅ 测试文档和最佳实践指南
