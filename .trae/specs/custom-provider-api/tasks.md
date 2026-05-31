# Tasks

- [x] Task 1: 修改 `call_real_api` 函数，在 `_ =>` 分支中根据 `api_format` 路由
  - [x] 提取 OpenAI 兼容 API 调用逻辑为独立函数 `call_openai_compatible_api`
  - [x] 提取 Anthropic API 调用逻辑为独立函数 `call_anthropic_api`
  - [x] 处理 `use_full_url` 开关的逻辑：true 时直接用 api_endpoint，false 时追加 `/chat/completions`
  - [x] api_endpoint 为空时返回有意义的错误提示

# Task Dependencies

- Task 1 无依赖