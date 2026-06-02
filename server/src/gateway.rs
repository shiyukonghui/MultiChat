// LLM 网关模块：封装对各 Provider 的实际 API 调用
// 使用 reqwest 直接调用 LLM API，实现流式响应的模拟

use crate::config::ModelConfig;
use tokio::sync::mpsc;
use crate::models::SseEvent;

/// 向指定模型发起流式对话请求
/// 如果未配置 API Key，使用模拟响应进行演示
pub async fn stream_chat(
    model_config: &ModelConfig,
    message: &str,
    history: &str,
    tx: mpsc::UnboundedSender<SseEvent>,
) {
    let model_id = model_config.id.clone();
    // 使用 display_name 或 id 作为显示名称
    let model_display = model_config.display_name.as_ref().unwrap_or(&model_config.id).clone();

    // 解析对话历史，用于构建多轮对话上下文
    let history_context = if history.is_empty() {
        String::new()
    } else {
        format!("\n\n对话历史：\n{}", history)
    };

    // 检查 API Key 是否已配置
    if model_config.api_key.is_empty() {
        // 无 API Key：使用模拟响应（包含对话历史上下文）
        let mock_response = format!(
            "这是来自 **{}**（{}）的模拟回复。\n\n您的问题是：_{}_\n\n> ⚠️ 请设置 API 密钥以启用真实 API 调用。\n\n以下是模拟的详细回复：\n\n- 当前已配置模型：{}\n- 超时时间：{} 秒\n- 最大 Token：{}\n\n这是一段 **Markdown 格式** 的示例输出，包含：\n\n```rust\nfn main() {{\n    println!(\"Hello from MultiChat!\");\n}}\n```\n\n1. 列表项一\n2. 列表项二\n3. 列表项三{}",
            model_display,
            model_config.provider,
            message,
            model_config.model,
            model_config.timeout_seconds,
            model_config.max_tokens,
            history_context,
        );

        // 模拟流式输出：逐字符发送，模拟真实流式效果
        let chars: Vec<char> = mock_response.chars().collect();
        let chunk_size = 5usize; // 每次发送 5 个字符

        for chunk in chars.chunks(chunk_size) {
            let content: String = chunk.iter().collect();
            let _ = tx.send(SseEvent::Chunk {
                model: model_id.clone(),
                content,
            });
            // 模拟网络延迟
            tokio::time::sleep(std::time::Duration::from_millis(50)).await;
        }

        // 发送完成事件
        let _ = tx.send(SseEvent::Done {
            model: model_id.clone(),
            content: mock_response,
        });
    } else {
        // 真实 API 调用：使用 reqwest 调用各 Provider 的 API
        let response = match call_real_api(model_config, message, history).await {
            Ok(content) => content,
            Err(e) => {
                let _ = tx.send(SseEvent::Error {
                    model: model_id.clone(),
                    code: "API_ERROR".to_string(),
                    message: e,
                });
                return;
            }
        };

        // 模拟流式输出
        let chars: Vec<char> = response.chars().collect();
        let chunk_size = 10usize;

        for chunk in chars.chunks(chunk_size) {
            let content: String = chunk.iter().collect();
            let _ = tx.send(SseEvent::Chunk {
                model: model_id.clone(),
                content,
            });
            tokio::time::sleep(std::time::Duration::from_millis(30)).await;
        }

        let _ = tx.send(SseEvent::Done {
            model: model_id.clone(),
            content: response,
        });
    }
}

/// 调用 OpenAI 兼容 API
async fn call_openai_compatible_api(
    model_config: &ModelConfig,
    messages: &[serde_json::Value],
) -> Result<String, String> {
    // 构建请求端点
    let endpoint = if !model_config.api_endpoint.is_empty() {
        if model_config.use_full_url {
            model_config.api_endpoint.clone()
        } else {
            format!("{}/chat/completions", model_config.api_endpoint.trim_end_matches('/'))
        }
    } else {
        // 无自定义端点时使用默认 OpenAI 端点
        "https://api.openai.com/v1/chat/completions".to_string()
    };

    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "model": model_config.model,
        "messages": messages,
        "max_tokens": model_config.max_tokens,
        "stream": false,
    });

    let response = client
        .post(&endpoint)
        .header("Authorization", format!("Bearer {}", model_config.api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .timeout(std::time::Duration::from_secs(model_config.timeout_seconds))
        .send()
        .await
        .map_err(|e| format!("网络请求失败: {}", e))?;

    let status = response.status();
    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    if !status.is_success() {
        let error_msg = json["error"]["message"].as_str().unwrap_or("未知错误");
        return Err(format!("API 返回错误 ({}): {}", status.as_u16(), error_msg));
    }

    json["choices"][0]["message"]["content"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "API 返回格式异常，缺少 choices[0].message.content".to_string())
}

/// 调用 Anthropic API
async fn call_anthropic_api(
    model_config: &ModelConfig,
    messages: &[serde_json::Value],
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let body = serde_json::json!({
        "model": model_config.model,
        "max_tokens": model_config.max_tokens,
        "messages": messages,
    });

    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", &model_config.api_key)
        .header("anthropic-version", "2023-06-01")
        .header("Content-Type", "application/json")
        .json(&body)
        .timeout(std::time::Duration::from_secs(model_config.timeout_seconds))
        .send()
        .await
        .map_err(|e| format!("网络请求失败: {}", e))?;

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("解析响应失败: {}", e))?;

    json["content"][0]["text"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "API 返回格式异常".to_string())
}

/// 调用真实 LLM API（传入对话历史以支持多轮对话）
async fn call_real_api(
    model_config: &ModelConfig,
    message: &str,
    history: &str,
) -> Result<String, String> {
    // 构建 messages 数组：包含对话历史 + 当前消息
    let mut messages: Vec<serde_json::Value> = Vec::new();
    
    // 解析对话历史（JSON 格式的消息数组）
    if !history.is_empty() {
        if let Ok(history_msgs) = serde_json::from_str::<Vec<serde_json::Value>>(history) {
            for msg in history_msgs {
                messages.push(msg);
            }
        }
    }
    
    // 追加当前用户消息
    messages.push(serde_json::json!({
        "role": "user",
        "content": message
    }));

    // 根据 Provider 类型选择对应的 API 端点
    match model_config.provider.as_str() {
        "openai" => {
            call_openai_compatible_api(model_config, &messages).await
        }
        "anthropic" => {
            call_anthropic_api(model_config, &messages).await
        }
        _ => {
            // 非标准 provider：根据 api_format 选择调用方式
            match model_config.api_format.as_str() {
                "openai-chat-completions" => {
                    if model_config.api_endpoint.is_empty() {
                        Err("请配置 API 端点地址".to_string())
                    } else {
                        call_openai_compatible_api(model_config, &messages).await
                    }
                }
                _ => {
                    Err(format!("不支持的 API 格式: '{}'，当前仅支持 openai-chat-completions", model_config.api_format))
                }
            }
        }
    }
}

/// 构建端点 URL（公开用于测试）
#[cfg(test)]
pub fn build_endpoint_url(model_config: &ModelConfig) -> String {
    if !model_config.api_endpoint.is_empty() {
        if model_config.use_full_url {
            model_config.api_endpoint.clone()
        } else {
            format!("{}/chat/completions", model_config.api_endpoint.trim_end_matches('/'))
        }
    } else {
        "https://api.openai.com/v1/chat/completions".to_string()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::SseEvent;

    /// 创建测试用的模型配置
    fn create_test_model_config() -> ModelConfig {
        ModelConfig {
            id: "test-model".to_string(),
            provider: "openai".to_string(),
            model: "gpt-4".to_string(),
            enabled: true,
            timeout_seconds: 60,
            max_tokens: 4096,
            status: "active".to_string(),
            api_key: String::new(), // 空 API Key，使用模拟响应
            api_format: "openai-chat-completions".to_string(),
            api_endpoint: String::new(),
            is_multimodal: false,
            model_series: "default".to_string(),
            display_name: Some("Test Model".to_string()),
            context_window_input: 184000,
            context_window_output: 16000,
            tool_call_rounds: 200,
            use_full_url: false,
        }
    }

    /// 测试端点 URL 构建 - 标准模式
    #[test]
    fn test_build_endpoint_url_standard() {
        let mut config = create_test_model_config();
        config.api_endpoint = "https://api.example.com/v1".to_string();
        config.use_full_url = false;
        
        let url = build_endpoint_url(&config);
        assert_eq!(url, "https://api.example.com/v1/chat/completions");
    }

    /// 测试端点 URL 构建 - 完整 URL 模式
    #[test]
    fn test_build_endpoint_url_full_url() {
        let mut config = create_test_model_config();
        config.api_endpoint = "https://api.example.com/custom/endpoint".to_string();
        config.use_full_url = true;
        
        let url = build_endpoint_url(&config);
        assert_eq!(url, "https://api.example.com/custom/endpoint");
    }

    /// 测试端点 URL 构建 - 默认端点
    #[test]
    fn test_build_endpoint_url_default() {
        let config = create_test_model_config();
        // api_endpoint 为空
        let url = build_endpoint_url(&config);
        assert_eq!(url, "https://api.openai.com/v1/chat/completions");
    }

    /// 测试端点 URL 构建 - 去除尾部斜杠
    #[test]
    fn test_build_endpoint_url_trailing_slash() {
        let mut config = create_test_model_config();
        config.api_endpoint = "https://api.example.com/v1/".to_string();
        config.use_full_url = false;
        
        let url = build_endpoint_url(&config);
        // 应该正确去除尾部斜杠
        assert_eq!(url, "https://api.example.com/v1/chat/completions");
    }

    /// 测试模拟响应（无 API Key）
    #[tokio::test]
    async fn test_stream_chat_mock_response() {
        let config = create_test_model_config();
        let (tx, mut rx) = mpsc::unbounded_channel();
        
        // 在后台运行 stream_chat
        let handle = tokio::spawn(async move {
            stream_chat(&config, "Hello", "", tx).await;
        });
        
        // 收集所有事件
        let mut events = Vec::new();
        while let Some(event) = rx.recv().await {
            events.push(event);
        }
        
        // 等待完成
        handle.await.unwrap();
        
        // 验证事件
        assert!(!events.is_empty());
        
        // 最后一个事件应该是 Done
        if let Some(last) = events.last() {
            match last {
                SseEvent::Done { model, content } => {
                    assert_eq!(model, "test-model");
                    assert!(content.contains("Test Model"));
                    assert!(content.contains("模拟回复"));
                }
                _ => panic!("Expected Done event"),
            }
        }
        
        // 应该有多个 Chunk 事件
        let chunk_count = events.iter().filter(|e| matches!(e, SseEvent::Chunk { .. })).count();
        assert!(chunk_count > 1);
    }

    /// 测试带历史记录的模拟响应
    #[tokio::test]
    async fn test_stream_chat_with_history() {
        let config = create_test_model_config();
        let (tx, mut rx) = mpsc::unbounded_channel();
        
        let history = r#"[{"role":"user","content":"Hi"},{"role":"assistant","content":"Hello!"}]"#;
        
        let handle = tokio::spawn(async move {
            stream_chat(&config, "How are you?", history, tx).await;
        });
        
        let mut events = Vec::new();
        while let Some(event) = rx.recv().await {
            events.push(event);
        }
        
        handle.await.unwrap();
        
        // 验证历史记录被包含在响应中
        if let Some(SseEvent::Done { content, .. }) = events.last() {
            assert!(content.contains("对话历史"));
        }
    }

    /// 测试不支持的 API 格式
    #[tokio::test]
    async fn test_call_real_api_unsupported_format() {
        let mut config = create_test_model_config();
        config.api_key = "test-key".to_string();
        config.provider = "unknown".to_string();
        config.api_format = "unsupported-format".to_string();
        config.api_endpoint = "https://api.example.com".to_string();
        
        let result = call_real_api(&config, "test", "").await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("不支持的 API 格式"));
    }

    /// 测试空端点错误
    #[tokio::test]
    async fn test_call_real_api_empty_endpoint() {
        let mut config = create_test_model_config();
        config.api_key = "test-key".to_string();
        config.provider = "custom".to_string();
        config.api_format = "openai-chat-completions".to_string();
        config.api_endpoint = String::new(); // 空端点
        
        let result = call_real_api(&config, "test", "").await;
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("请配置 API 端点地址"));
    }

    /// 测试消息构建逻辑
    #[test]
    fn test_message_building() {
        let history = r#"[{"role":"user","content":"Hello"},{"role":"assistant","content":"Hi!"}]"#;
        let history_msgs: Vec<serde_json::Value> = serde_json::from_str(history).unwrap();
        
        assert_eq!(history_msgs.len(), 2);
        assert_eq!(history_msgs[0]["role"], "user");
        assert_eq!(history_msgs[1]["role"], "assistant");
    }

    /// 测试空历史记录处理
    #[test]
    fn test_empty_history_handling() {
        let history = "";
        let result: Result<Vec<serde_json::Value>, _> = serde_json::from_str(history);
        
        // 空字符串应该解析失败
        assert!(result.is_err());
    }

    /// 测试 display_name 使用逻辑
    #[test]
    fn test_display_name_usage() {
        let config = create_test_model_config();
        assert_eq!(config.display_name, Some("Test Model".to_string()));
        
        // 当 display_name 存在时，应该使用它
        let display = config.display_name.as_ref().unwrap_or(&config.id);
        assert_eq!(display, "Test Model");
    }

    /// 测试无 display_name 时的回退逻辑
    #[test]
    fn test_display_name_fallback() {
        let mut config = create_test_model_config();
        config.display_name = None;
        
        let display = config.display_name.as_ref().unwrap_or(&config.id);
        assert_eq!(display, "test-model");
    }
}