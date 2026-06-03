// 数据模型模块
// 定义 API 请求/响应结构体以及应用共享状态

pub mod prompt;

use crate::config::ModelConfig;
use crate::history::HistoryRecord;
use crate::models::prompt::Prompt;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

/// 模型配置响应（适应前端 API 返回格式）
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModelConfigResponse {
    /// 模型唯一标识
    pub id: String,
    /// 服务提供商
    pub provider: String,
    /// 是否启用
    pub enabled: bool,
    /// 状态描述（如 "available" 或 "disabled"）
    pub status: String,
    /// 不可用原因（仅在状态异常时有值）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,

    // 新增字段
    /// API 格式
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api_format: Option<String>,
    /// API 端点地址
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api_endpoint: Option<String>,
    /// API 密钥
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api_key: Option<String>,
    /// 是否支持多模态
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_multimodal: Option<bool>,
    /// 模型系列
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_series: Option<String>,
    /// 模型展示名称
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    /// 上下文窗口 - 输入
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context_window_input: Option<u32>,
    /// 上下文窗口 - 输出
    #[serde(skip_serializing_if = "Option::is_none")]
    pub context_window_output: Option<u32>,
    /// 工具调用轮次
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_call_rounds: Option<u32>,
    /// 最大 Token 数
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<u32>,
    /// 是否使用完整 URL
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_full_url: Option<bool>,
}

/// 更新模型状态的请求体
#[derive(Debug, Deserialize)]
pub struct UpdateModelRequest {
    /// 是否启用该模型
    pub enabled: bool,
}

/// 更新模型详情的请求体（用于编辑模型全部字段）
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateModelDetailRequest {
    /// 服务提供商
    pub provider: Option<String>,
    /// API 格式
    pub api_format: Option<String>,
    /// API 端点地址
    pub api_endpoint: Option<String>,
    /// API 密钥
    pub api_key: Option<String>,
    /// 是否支持多模态
    pub is_multimodal: Option<bool>,
    /// 模型系列
    pub model_series: Option<String>,
    /// 模型展示名称
    pub display_name: Option<String>,
    /// 上下文窗口 - 输入
    pub context_window_input: Option<u32>,
    /// 上下文窗口 - 输出
    pub context_window_output: Option<u32>,
    /// 工具调用轮次
    pub tool_call_rounds: Option<u32>,
    /// 最大 Token 数
    pub max_tokens: Option<u32>,
    /// 是否使用完整 URL
    pub use_full_url: Option<bool>,
}

/// 创建模型的请求体
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateModelRequest {
    /// 模型唯一标识
    pub id: String,
    /// 服务提供商
    pub provider: String,
    /// 是否启用
    #[serde(default = "default_true")]
    pub enabled: bool,

    // 新增字段
    /// API 格式
    pub api_format: Option<String>,
    /// API 端点地址
    pub api_endpoint: Option<String>,
    /// API 密钥
    pub api_key: Option<String>,
    /// 是否支持多模态
    pub is_multimodal: Option<bool>,
    /// 模型系列
    pub model_series: Option<String>,
    /// 模型展示名称
    pub display_name: Option<String>,
    /// 上下文窗口 - 输入
    pub context_window_input: Option<u32>,
    /// 上下文窗口 - 输出
    pub context_window_output: Option<u32>,
    /// 工具调用轮次
    pub tool_call_rounds: Option<u32>,
    /// 最大 Token 数
    pub max_tokens: Option<u32>,
    /// 是否使用完整 URL
    pub use_full_url: Option<bool>,
}

fn default_true() -> bool {
    true
}

/// 应用全局共享状态，所有 handler 通过 State 提取器访问
#[derive(Clone)]
pub struct AppState {
    /// 模型配置列表，支持并发读写
    pub models: Arc<RwLock<Vec<ModelConfig>>>,
    /// 历史记录列表，支持并发读写
    pub histories: Arc<RwLock<Vec<HistoryRecord>>>,
    /// 提示词列表，支持并发读写
    pub prompts: Arc<RwLock<Vec<Prompt>>>,
}

/// 对话消息（用于携带对话历史）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
    pub model: Option<String>,
}

/// 发送给 SSE 通道的事件类型
#[derive(Debug, Clone)]
pub enum SseEvent {
    /// 模型增量内容
    Chunk { model: String, content: String },
    /// 模型回复完成
    Done { model: String, content: String },
    /// 模型调用出错
    Error { model: String, code: String, message: String },
}

#[cfg(test)]
mod tests {
    use super::*;

    /// 测试 ModelConfigResponse 序列化（camelCase 转换）
    #[test]
    fn test_model_config_response_serialization() {
        let response = ModelConfigResponse {
            id: "gpt-4".to_string(),
            provider: "openai".to_string(),
            enabled: true,
            status: "available".to_string(),
            reason: None,
            api_format: Some("openai-chat-completions".to_string()),
            api_endpoint: Some("https://api.openai.com/v1".to_string()),
            api_key: Some("sk-test".to_string()),
            is_multimodal: Some(true),
            model_series: Some("gpt".to_string()),
            display_name: Some("GPT-4".to_string()),
            context_window_input: Some(128000),
            context_window_output: Some(4096),
            tool_call_rounds: Some(10),
            max_tokens: Some(8192),
            use_full_url: Some(false),
        };
        
        let json = serde_json::to_string(&response).unwrap();
        
        // 验证 camelCase 转换
        assert!(json.contains("apiFormat"));
        assert!(json.contains("apiEndpoint"));
        assert!(json.contains("apiKey"));
        assert!(json.contains("isMultimodal"));
        assert!(json.contains("modelSeries"));
        assert!(json.contains("displayName"));
        assert!(json.contains("contextWindowInput"));
        assert!(json.contains("contextWindowOutput"));
        assert!(json.contains("toolCallRounds"));
        assert!(json.contains("maxTokens"));
        assert!(json.contains("useFullUrl"));
        
        // 验证 snake_case 字段不存在
        assert!(!json.contains("api_format"));
        assert!(!json.contains("api_endpoint"));
    }

    /// 测试 CreateModelRequest 反序列化
    #[test]
    fn test_create_model_request_deserialization() {
        let json = r#"{
            "id": "claude-3",
            "provider": "anthropic",
            "enabled": true,
            "apiFormat": "anthropic-messages",
            "apiEndpoint": "https://api.anthropic.com",
            "apiKey": "sk-ant-test",
            "isMultimodal": false,
            "modelSeries": "claude",
            "displayName": "Claude 3",
            "contextWindowInput": 200000,
            "contextWindowOutput": 8000,
            "toolCallRounds": 5,
            "maxTokens": 4096,
            "useFullUrl": true
        }"#;
        
        let request: CreateModelRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.id, "claude-3");
        assert_eq!(request.provider, "anthropic");
        assert!(request.enabled);
        assert_eq!(request.api_format, Some("anthropic-messages".to_string()));
        assert_eq!(request.display_name, Some("Claude 3".to_string()));
    }

    /// 测试 CreateModelRequest 最小字段
    #[test]
    fn test_create_model_request_minimal() {
        let json = r#"{
            "id": "minimal-model",
            "provider": "test"
        }"#;
        
        let request: CreateModelRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.id, "minimal-model");
        assert_eq!(request.provider, "test");
        // enabled 默认为 true
        assert!(request.enabled);
        // 其他字段为 None
        assert!(request.api_format.is_none());
        assert!(request.api_endpoint.is_none());
    }

    /// 测试 UpdateModelDetailRequest 部分字段更新
    #[test]
    fn test_update_model_detail_request_partial() {
        let json = r#"{
            "apiEndpoint": "https://new-endpoint.com",
            "maxTokens": 16384
        }"#;
        
        let request: UpdateModelDetailRequest = serde_json::from_str(json).unwrap();
        assert!(request.provider.is_none());
        assert_eq!(request.api_endpoint, Some("https://new-endpoint.com".to_string()));
        assert_eq!(request.max_tokens, Some(16384));
        assert!(request.api_format.is_none());
    }

    /// 测试 UpdateModelRequest（仅更新 enabled）
    #[test]
    fn test_update_model_request() {
        let json = r#"{"enabled": false}"#;
        let request: UpdateModelRequest = serde_json::from_str(json).unwrap();
        assert!(!request.enabled);
    }

    /// 测试 ChatMessage 序列化
    #[test]
    fn test_chat_message_serialization() {
        let message = ChatMessage {
            role: "user".to_string(),
            content: "Hello, world!".to_string(),
            model: Some("gpt-4".to_string()),
        };
        
        let json = serde_json::to_string(&message).unwrap();
        assert!(json.contains("role"));
        assert!(json.contains("user"));
        assert!(json.contains("Hello, world!"));
        assert!(json.contains("model"));
        
        // 反序列化验证
        let deserialized: ChatMessage = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.role, message.role);
        assert_eq!(deserialized.content, message.content);
        assert_eq!(deserialized.model, message.model);
    }

    /// 测试 ChatMessage 无 model 字段
    #[test]
    fn test_chat_message_without_model() {
        let message = ChatMessage {
            role: "assistant".to_string(),
            content: "Response".to_string(),
            model: None,
        };
        
        let json = serde_json::to_string(&message).unwrap();
        assert!(json.contains("null") || !json.contains("model"));
        
        let deserialized: ChatMessage = serde_json::from_str(&json).unwrap();
        assert!(deserialized.model.is_none());
    }

    /// 测试 SseEvent Chunk 变体
    #[test]
    fn test_sse_event_chunk() {
        let event = SseEvent::Chunk {
            model: "gpt-4".to_string(),
            content: "Hello".to_string(),
        };
        
        match event {
            SseEvent::Chunk { model, content } => {
                assert_eq!(model, "gpt-4");
                assert_eq!(content, "Hello");
            }
            _ => panic!("Expected Chunk event"),
        }
    }

    /// 测试 SseEvent Done 变体
    #[test]
    fn test_sse_event_done() {
        let event = SseEvent::Done {
            model: "claude-3".to_string(),
            content: "Complete response".to_string(),
        };
        
        match event {
            SseEvent::Done { model, content } => {
                assert_eq!(model, "claude-3");
                assert_eq!(content, "Complete response");
            }
            _ => panic!("Expected Done event"),
        }
    }

    /// 测试 SseEvent Error 变体
    #[test]
    fn test_sse_event_error() {
        let event = SseEvent::Error {
            model: "test-model".to_string(),
            code: "TIMEOUT".to_string(),
            message: "Request timed out".to_string(),
        };
        
        match event {
            SseEvent::Error { model, code, message } => {
                assert_eq!(model, "test-model");
                assert_eq!(code, "TIMEOUT");
                assert_eq!(message, "Request timed out");
            }
            _ => panic!("Expected Error event"),
        }
    }

    /// 测试 AppState 创建
    #[test]
    fn test_app_state_creation() {
        let state = AppState {
            models: Arc::new(RwLock::new(Vec::new())),
            histories: Arc::new(RwLock::new(Vec::new())),
            prompts: Arc::new(RwLock::new(Vec::new())),
        };
        
        // 测试 Clone trait 实现
        let _cloned = state.clone();
        // 测试 Arc 可以被克隆
        let _models_clone = state.models.clone();
        let _histories_clone = state.histories.clone();
        let _prompts_clone = state.prompts.clone();
    }

    /// 测试 ModelConfigResponse skip_serializing_if
    #[test]
    fn test_model_config_response_skip_none_fields() {
        let response = ModelConfigResponse {
            id: "test".to_string(),
            provider: "test".to_string(),
            enabled: true,
            status: "available".to_string(),
            reason: None,
            api_format: None,
            api_endpoint: None,
            api_key: None,
            is_multimodal: None,
            model_series: None,
            display_name: None,
            context_window_input: None,
            context_window_output: None,
            tool_call_rounds: None,
            max_tokens: None,
            use_full_url: None,
        };
        
        let json = serde_json::to_string(&response).unwrap();
        
        // None 字段应该被跳过
        assert!(!json.contains("apiFormat"));
        assert!(!json.contains("apiEndpoint"));
        assert!(!json.contains("reason"));
    }
}
