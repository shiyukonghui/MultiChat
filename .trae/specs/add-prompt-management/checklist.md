# 系统提示词管理功能 - 检查清单

## 后端检查项

- [x] Prompt 数据模型定义与 YAML 格式一致
- [x] YAML 文件读写逻辑正确，文件不存在时自动初始化
- [x] GET /api/prompts 返回所有提示词列表
- [x] GET /api/prompts/{id} 返回单个提示词，不存在返回 404
- [x] POST /api/prompts 创建提示词成功
- [x] POST /api/prompts 校验：标题为空/超50字符返回 400
- [x] POST /api/prompts 校验：内容为空/超4000字符返回 400
- [x] PUT /api/prompts/{id} 更新提示词成功（支持部分更新）
- [x] PUT /api/prompts/{id} 校验规则与创建一致
- [x] PUT /api/prompts/{id} 不存在的 id 返回 404
- [x] DELETE /api/prompts/{id} 删除提示词成功
- [x] DELETE /api/prompts/{id} 不存在的 id 返回 404
- [x] 提示词列表按 updated_at 降序排列
- [x] 路由注册到 main.rs，服务启动无报错

## 前端检查项

- [x] 工具栏显示"提示词"按钮（SmartToy 图标），位于"清空"按钮右侧
- [x] 点击按钮弹出居中 Dialog
- [x] Dialog 关闭按钮正常关闭弹窗
- [x] 提示词列表正常展示，显示标题、内容摘要、更新时间、激活标识
- [x] 空列表显示占位提示
- [x] 列表按 updated_at 降序排列
- [x] 新建提示词：表单校验（标题 1-50 字符，内容 1-4000 字符）
- [x] 新建提示词：保存成功后列表刷新
- [x] 编辑提示词：表单预填已有数据，修改后保存成功
- [x] 删除提示词：确认对话框后删除，列表刷新
- [x] 删除已激活的提示词：自动取消激活
- [x] 激活提示词：标识更新，前一激活项自动取消
- [x] 取消激活提示词：标识移除
- [x] 刷新页面后，之前激活的提示词恢复激活状态
- [x] 被删除的提示词的 activePromptId 在加载时自动清空
- [x] 有激活提示词时发送消息，请求中包含 system message
- [x] 无激活提示词时发送消息，请求中不包含 system message

## 集成检查项

- [x] 后端编译成功，cargo check 无错误
- [x] 前端编译成功，tsc 或 vite build 无错误（仅测试文件有预存错误，生产代码无编译错误）
- [ ] 端到端：新建提示词 → 激活 → 发送消息 → 验证 API 请求包含 system message
- [ ] 端到端：切换激活的提示词 → 发送消息 → 验证 system message 更新
- [ ] 端到端：删除激活的提示词 → 发送消息 → 验证无 system message
- [x] 历史记录中包含 system 角色的消息（通过 state.messages 注入 API 请求的 history 参数）
- [x] 服务器重启后提示词数据持久化正常（YAML 文件存储）