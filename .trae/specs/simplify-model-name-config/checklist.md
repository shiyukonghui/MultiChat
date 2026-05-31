# 精简模型名称配置 Checklist

- [x] 后端 `ModelConfig` 结构体已移除 `name` 字段
- [x] 后端 `ModelConfigResponse` 结构体已移除 `name` 字段
- [x] 后端 `routes/models.rs` 已移除所有对 `name` 字段的引用
- [x] 前端 `ModelConfig` 接口已移除 `name` 字段
- [x] 前端 `ModelSidebar.tsx` 已改为使用 `modelId`
- [x] 前端 `ModelConfigPanel.tsx` 已改为使用 `model.id`
- [x] 前端 `AddModelDialog.tsx` 已移除对 `name` 字段的引用
- [x] 配置文件 `models.yaml` 已移除 `name` 字段
- [x] 后端代码编译通过，无错误
- [x] 前端代码编译通过，无 TypeScript 错误
- [x] 后端服务启动正常，配置加载成功
- [x] 前端服务启动正常，模型列表展示正确
