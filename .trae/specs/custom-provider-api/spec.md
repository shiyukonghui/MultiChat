# 修复 custom provider 真实 API 调用功能

## Why

用户配置了自定义模型（provider: "custom"），带有 API Key、API Endpoint、API Format，但后端 gateway 只实现了 openai 和 anthropic 两个 provider 的真实调用。custom provider 走到默认 `_ =>` 分支，返回模拟文本"暂不支持直接调用"，导致无法使用自定义 API 端点。

## What Changes

- **gateway.rs**: `call_real_api` 函数新增 `api_format` 路由逻辑，当 `api_format = "openai-chat-completions"` 时使用 OpenAI 兼容格式调用 `api_endpoint`
- **gateway.rs**: 当 `api_endpoint` 为空时返回错误提示，而不是模拟文本

## Impact

- Affected specs: 多模型对话
- Affected code: `server/src/gateway.rs`

## ADDED Requirements

### Requirement: Custom Provider 真实 API 调用

The system SHALL support custom API endpoints with OpenAI-compatible format.

#### Scenario: 自定义 OpenAI 兼容 API
- **GIVEN** 一个模型配置了 `provider: "custom"`, `api_format: "openai-chat-completions"`, `api_endpoint` 和 `api_key`
- **WHEN** 用户发送消息
- **THEN** 后端使用配置的 `api_endpoint` 以 OpenAI Chat Completions 格式发起真实 API 请求

#### Scenario: 自定义 API 但 endpoint 为空
- **GIVEN** 一个模型配置了 `provider: "custom"` 但 `api_endpoint` 为空
- **WHEN** 用户发送消息
- **THEN** 返回错误："请配置 API 端点地址"

## MODIFIED Requirements

### Requirement: call_real_api 函数

修改 `gateway.rs` 中的 `call_real_api` 函数，在 match provider 逻辑后增加 `api_format` 的路由：

```rust
match model_config.provider.as_str() {
    "openai" => { ... }  // 保留现有逻辑
    "anthropic" => { ... }  // 保留现有逻辑
    _ => {
        // 尝试根据 api_format 匹配
        match model_config.api_format.as_str() {
            "openai-chat-completions" => {
                // 使用 api_endpoint 或默认 OpenAI 端点
                let endpoint = if !model_config.api_endpoint.is_empty() {
                    if model_config.use_full_url {
                        model_config.api_endpoint.clone()
                    } else {
                        format!("{}/chat/completions", model_config.api_endpoint.trim_end_matches('/'))
                    }
                } else {
                    return Err("请配置 API 端点地址".to_string());
                };
                // ... OpenAI 兼容 API 调用 ...
            }
            _ => {
                Err(format!("不支持的 API 格式: {}", model_config.api_format))
            }
        }
    }
}
```

## REMOVED Requirements
无