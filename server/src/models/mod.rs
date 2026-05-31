// 数据模型模块
// 定义 API 请求/响应结构体以及应用共享状态

use crate::config::ModelConfig;
use crate::history::HistoryRecord;
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
