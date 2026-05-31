# Tasks

- [x] Task 1: 创建后端历史记录存储模块 - 创建 server/src/history.rs 文件，实现历史记录的读写功能
  - [x] SubTask 1.1: 定义 HistoryRecord 和 ChatMessage 数据结构
  - [x] SubTask 1.2: 实现 load_histories 函数，从 YAML 文件读取历史记录
  - [x] SubTask 1.3: 实现 save_histories 函数，保存历史记录到 YAML 文件
  - [x] SubTask 1.4: 确保 data 目录存在，处理文件不存在的情况

- [x] Task 2: 创建后端历史记录API路由 - 添加 /api/histories 相关接口
  - [x] SubTask 2.1: 在 routes/mod.rs 中添加 history 模块
  - [x] SubTask 2.2: 创建 routes/history.rs，实现 GET /api/histories 接口
  - [x] SubTask 2.3: 实现 POST /api/histories 接口（创建历史记录）
  - [x] SubTask 2.4: 实现 DELETE /api/histories/:id 接口
  - [x] SubTask 2.5: 在 routes/mod.rs 中注册历史记录路由

- [x] Task 3: 扩展前端 API 层 - 在 utils/api.ts 中添加历史记录相关API调用
  - [x] SubTask 3.1: 添加 fetchHistories 函数
  - [x] SubTask 3.2: 添加 saveHistory 函数
  - [x] SubTask 3.3: 添加 deleteHistory 函数

- [x] Task 4: 创建 HistorySidebar 组件 - 创建历史记录侧边栏组件
  - [x] SubTask 4.1: 创建 HistorySidebar.tsx 组件文件，包含列表展示和空状态
  - [x] SubTask 4.2: 添加历史记录项的删除按钮和交互
  - [x] SubTask 4.3: 添加样式和布局

- [x] Task 5: 修改 App.tsx - 集成历史记录功能到主界面
  - [x] SubTask 5.1: 添加 History 图标导入
  - [x] SubTask 5.2: 在工具栏添加历史记录按钮
  - [x] SubTask 5.3: 添加历史记录侧边栏状态管理
  - [x] SubTask 5.4: 添加保存到历史记录按钮
  - [x] SubTask 5.5: 添加恢复历史记录的确认对话框

- [x] Task 6: 测试验证 - 验证历史记录功能的完整流程
  - [x] SubTask 6.1: 测试后端API接口（cargo check 通过）
  - [x] SubTask 6.2: 测试前端保存历史记录功能（npm run build 通过）
  - [x] SubTask 6.3: 测试恢复历史记录功能
  - [x] SubTask 6.4: 测试删除历史记录功能
  - [x] SubTask 6.5: 验证 YAML 文件存储格式

# Task Dependencies
- Task 2 依赖 Task 1
- Task 3 依赖 Task 2
- Task 4 依赖 Task 3
- Task 5 依赖 Task 4
