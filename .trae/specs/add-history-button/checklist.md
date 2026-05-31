# Checklist

- [x] server/src/history.rs 创建并实现历史记录存储功能
- [x] server/src/routes/history.rs 创建并实现API路由
- [x] 后端路由正确注册到 /api/histories
- [x] client/src/utils/api.ts 扩展了历史记录API调用
- [x] HistorySidebar 组件代码实现符合规范
- [x] App.tsx 集成了历史记录按钮和侧边栏
- [x] 顶部工具栏显示历史记录按钮，使用 History 图标
- [x] 点击历史记录按钮可以打开/关闭历史记录侧边栏
- [x] 历史记录侧边栏正确显示已保存的会话列表
- [x] 空状态时显示"暂无历史记录"提示
- [x] 可以保存当前会话到历史记录
- [x] 点击历史记录项可以恢复工作区状态
- [x] 恢复历史记录前如有未保存对话会显示确认对话框
- [x] 可以删除单条历史记录
- [x] 历史记录正确存储在 server/data/histories.yaml 文件中
- [x] 代码包含中文注释
