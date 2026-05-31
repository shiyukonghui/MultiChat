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