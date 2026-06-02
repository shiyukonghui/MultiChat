// 测试辅助模块
// 提供测试用的 AppState 构造函数和测试数据生成工具

use std::sync::Arc;
use tokio::sync::RwLock;
use multichat_server::config::ModelConfig;
use multichat_server::history::HistoryRecord;
use multichat_server::models::{AppState, ChatMessage};

/// 创建空的测试 AppState
pub fn create_empty_state() -> AppState {
    AppState {
        models: Arc::new(RwLock::new(Vec::new())),
        histories: Arc::new(RwLock::new(Vec::new())),
    }
}

/// 创建带有测试模型的 AppState
pub fn create_state_with_models(models: Vec<ModelConfig>) -> AppState {
    AppState {
        models: Arc::new(RwLock::new(models)),
        histories: Arc::new(RwLock::new(Vec::new())),
    }
}

/// 创建带有测试历史记录的 AppState
pub fn create_state_with_histories(histories: Vec<HistoryRecord>) -> AppState {
    AppState {
        models: Arc::new(RwLock::new(Vec::new())),
        histories: Arc::new(RwLock::new(histories)),
    }
}

/// 创建完整的测试 AppState（包含模型和历史记录）
pub fn create_full_state(models: Vec<ModelConfig>, histories: Vec<HistoryRecord>) -> AppState {
    AppState {
        models: Arc::new(RwLock::new(models)),
        histories: Arc::new(RwLock::new(histories)),
    }
}

/// 创建测试用的模型配置
pub fn create_test_model(id: &str, provider: &str, enabled: bool) -> ModelConfig {
    ModelConfig {
        id: id.to_string(),
        provider: provider.to_string(),
        model: id.to_string(),
        enabled,
        timeout_seconds: 60,
        max_tokens: 4096,
        status: "active".to_string(),
        api_key: String::new(),
        api_format: "openai-chat-completions".to_string(),
        api_endpoint: String::new(),
        is_multimodal: false,
        model_series: "default".to_string(),
        display_name: None,
        context_window_input: 184000,
        context_window_output: 16000,
        tool_call_rounds: 200,
        use_full_url: false,
    }
}

/// 创建测试用的模型配置（带 API Key）
pub fn create_test_model_with_key(id: &str, provider: &str, api_key: &str) -> ModelConfig {
    ModelConfig {
        id: id.to_string(),
        provider: provider.to_string(),
        model: id.to_string(),
        enabled: true,
        timeout_seconds: 60,
        max_tokens: 4096,
        status: "active".to_string(),
        api_key: api_key.to_string(),
        api_format: "openai-chat-completions".to_string(),
        api_endpoint: "https://api.example.com/v1".to_string(),
        is_multimodal: false,
        model_series: "default".to_string(),
        display_name: None,
        context_window_input: 184000,
        context_window_output: 16000,
        tool_call_rounds: 200,
        use_full_url: false,
    }
}

/// 创建测试用的历史记录
pub fn create_test_history(id: &str, name: &str) -> HistoryRecord {
    HistoryRecord {
        id: id.to_string(),
        name: name.to_string(),
        timestamp: 1700000000,
        selected_model: None,
        messages: Vec::new(),
    }
}

/// 创建测试用的历史记录（带消息）
pub fn create_test_history_with_messages(
    id: &str,
    name: &str,
    messages: Vec<ChatMessage>,
) -> HistoryRecord {
    HistoryRecord {
        id: id.to_string(),
        name: name.to_string(),
        timestamp: 1700000000,
        selected_model: None,
        messages,
    }
}

/// 创建测试用的聊天消息
pub fn create_test_message(role: &str, content: &str) -> ChatMessage {
    ChatMessage {
        role: role.to_string(),
        content: content.to_string(),
        model: None,
    }
}