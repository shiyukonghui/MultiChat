// SSE 流式对话路由处理器
// 实现 GET /api/chat/stream 接口：并发调用所有已启用模型，通过 SSE 实时推送回复

use axum::{
    extract::{Query, State},
    response::Sse,
    http::StatusCode,
};
use axum::response::sse::{Event, KeepAlive};
use futures::stream::Stream;
use std::convert::Infallible;
use tokio::sync::mpsc;
use crate::models::{AppState, SseEvent};
use crate::gateway;

/// 请求查询参数
#[derive(Debug, serde::Deserialize)]
pub struct ChatQuery {
    /// 用户消息（必填，不超过 4000 字符）
    pub message: Option<String>,
    /// JSON 编码的对话历史（可选）
    pub history: Option<String>,
}

/// GET /api/chat/stream——SSE 流式对话接口
///
/// 处理流程：
/// 1. 校验请求参数（message 非空、不超 4000 字符）
/// 2. 获取所有已启用的模型
/// 3. 并发向每个模型发起请求
/// 4. 通过 mpsc channel 汇总各模型的事件
/// 5. 以 SSE 格式实时推送到客户端
pub async fn chat_stream_handler(
    State(state): State<AppState>,
    Query(query): Query<ChatQuery>,
) -> Result<Sse<impl Stream<Item = Result<Event, Infallible>>>, StatusCode> {
    // 1. 参数校验
    let message = query.message.unwrap_or_default();
    let message = message.trim();

    if message.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }
    if message.len() > 4000 {
        return Err(StatusCode::BAD_REQUEST);
    }

    let history = query.history.unwrap_or_default();

    // 2. 获取已启用模型列表
    let models = state.models.read().await;
    let enabled_models: Vec<_> = models.iter().filter(|m| m.enabled).cloned().collect();
    drop(models); // 释放读锁

    if enabled_models.is_empty() {
        return Err(StatusCode::SERVICE_UNAVAILABLE);
    }

    // 3. 创建事件通道，用于汇总各模型的流式输出
    let (tx, mut rx) = mpsc::unbounded_channel::<SseEvent>();

    // 4. 并发向所有已启用模型发起请求
    for model_config in &enabled_models {
        let model_config = model_config.clone();
        let msg = message.to_string();
        let hist = history.clone();
        let tx_clone = tx.clone();

        tokio::spawn(async move {
            // 带超时的模型调用
            let result = tokio::time::timeout(
                std::time::Duration::from_secs(model_config.timeout_seconds),
                gateway::stream_chat(&model_config, &msg, &hist, tx_clone.clone()),
            )
            .await;

            if result.is_err() {
                // 超时：发送错误事件
                let _ = tx_clone.send(SseEvent::Error {
                    model: model_config.id.clone(),
                    code: "TIMEOUT".to_string(),
                    message: "模型响应超时，请稍后重试".to_string(),
                });
            }
        });
    }
    // 释放原始 tx，当所有发送端 drop 后 rx 会自然关闭
    drop(tx);

    // 5. 将 mpsc 接收器转换为 SSE 事件流
    let event_stream = async_stream::stream! {
        while let Some(event) = rx.recv().await {
            let sse_event = match event {
                SseEvent::Chunk { model, content } => {
                    let data = serde_json::json!({
                        "model": model,
                        "content": content,
                    });
                    Event::default()
                        .event("chunk")
                        .data(data.to_string())
                }
                SseEvent::Done { model, content } => {
                    let data = serde_json::json!({
                        "model": model,
                        "content": content,
                    });
                    Event::default()
                        .event("done")
                        .data(data.to_string())
                }
                SseEvent::Error { model, code, message } => {
                    let data = serde_json::json!({
                        "model": model,
                        "error": {
                            "code": code,
                            "userMessage": message,
                        }
                    });
                    Event::default()
                        .event("error")
                        .data(data.to_string())
                }
            };
            yield Ok(sse_event);
        }
    };

    Ok(Sse::new(event_stream).keep_alive(KeepAlive::default()))
}
