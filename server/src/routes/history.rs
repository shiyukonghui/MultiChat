// 历史记录 API 路由 handler
// 提供 GET /api/histories（列表查询）、POST /api/histories（创建历史记录）、DELETE /api/histories/:id（删除历史记录）

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

use crate::history::{self, HistoryRecord};
use crate::models::{AppState, ChatMessage};

/// 历史记录列表项响应体（用于列表查询，不包含完整消息）
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryResponse {
    /// 历史记录唯一标识符
    pub id: String,
    /// 对话名称/标题
    pub name: String,
    /// 创建时间戳
    pub timestamp: u64,
    /// 当前选中的模型ID
    pub selected_model: Option<String>,
    /// 消息数量（不返回完整消息列表，减少数据传输）
    pub message_count: usize,
}

/// 历史记录详情响应体（用于详情查询，包含完整消息）
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryDetailResponse {
    /// 历史记录唯一标识符
    pub id: String,
    /// 对话名称/标题
    pub name: String,
    /// 创建时间戳
    pub timestamp: u64,
    /// 当前选中的模型ID
    pub selected_model: Option<String>,
    /// 对话消息列表
    pub messages: Vec<ChatMessage>,
}

impl From<HistoryRecord> for HistoryDetailResponse {
    fn from(record: HistoryRecord) -> Self {
        Self {
            id: record.id,
            name: record.name,
            timestamp: record.timestamp,
            selected_model: record.selected_model,
            messages: record.messages,
        }
    }
}

/// 创建历史记录的请求体
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateHistoryRequest {
    /// 对话名称/标题
    pub name: String,
    /// 当前选中的模型ID
    pub selected_model: Option<String>,
    /// 对话消息列表
    pub messages: Vec<ChatMessage>,
}

/// GET /api/histories - 获取所有历史记录列表
/// 
/// 返回历史记录的基本信息（不包含完整的消息内容，以减少数据传输）
pub async fn get_histories(State(state): State<AppState>) -> Json<Vec<HistoryResponse>> {
    // 从状态中获取历史记录列表
    let histories = state.histories.read().await;
    
    // 转换为响应格式
    let response: Vec<HistoryResponse> = histories
        .iter()
        .map(|h| HistoryResponse {
            id: h.id.clone(),
            name: h.name.clone(),
            timestamp: h.timestamp,
            selected_model: h.selected_model.clone(),
            message_count: h.messages.len(),
        })
        .collect();
    
    Json(response)
}

/// POST /api/histories - 创建新历史记录
/// 
/// 自动生成 UUID 作为 ID，使用当前系统时间戳
/// 成功返回 201 和创建的历史记录
pub async fn create_history(
    State(state): State<AppState>,
    Json(body): Json<CreateHistoryRequest>,
) -> Result<Json<HistoryRecord>, StatusCode> {
    // 生成新的 UUID
    let id = Uuid::new_v4().to_string();
    
    // 获取当前时间戳
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    
    // 创建新历史记录
    let new_record = HistoryRecord {
        id,
        name: body.name,
        timestamp,
        selected_model: body.selected_model,
        messages: body.messages,
    };
    
    // 添加到历史记录列表
    let mut histories = state.histories.write().await;
    histories.push(new_record.clone());
    
    // 持久化到 YAML 文件
    if let Err(e) = history::save_histories(&histories) {
        tracing::warn!("保存历史记录到文件失败: {}", e);
    }
    
    Ok(Json(new_record))
}

/// DELETE /api/histories/:id - 删除指定历史记录
/// 
/// 成功返回 200，历史记录不存在返回 404
pub async fn delete_history(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let mut histories = state.histories.write().await;
    let initial_len = histories.len();
    
    // 移除匹配的历史记录
    histories.retain(|h| h.id != id);
    
    // 检查是否找到并删除了记录
    if histories.len() == initial_len {
        // 没有找到匹配的历史记录
        return Err(StatusCode::NOT_FOUND);
    }
    
    // 持久化到 YAML 文件
    if let Err(e) = history::save_histories(&histories) {
        tracing::warn!("保存历史记录到文件失败: {}", e);
    }
    
    Ok(Json(serde_json::json!({
        "id": id,
        "deleted": true
    })))
}

/// GET /api/histories/:id - 获取单个历史记录的详细信息
///
/// 返回包含完整消息内容的历史记录
/// 成功返回 200，历史记录不存在返回 404
pub async fn get_history_detail(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<HistoryDetailResponse>, StatusCode> {
    let histories = state.histories.read().await;

    // 查找指定 ID 的历史记录
    if let Some(record) = histories.iter().find(|h| h.id == id) {
        let response: HistoryDetailResponse = record.clone().into();
        Ok(Json(response))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

/// 创建或更新历史记录的请求体（upsert 语义）
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpsertHistoryRequest {
    /// 如果提供 ID 且存在则更新，否则创建新记录
    pub id: Option<String>,
    /// 对话名称/标题
    pub name: String,
    /// 当前选中的模型ID
    pub selected_model: Option<String>,
    /// 对话消息列表
    pub messages: Vec<ChatMessage>,
}

/// POST /api/histories/upsert - 创建或更新历史记录（upsert 语义）
///
/// - 如果 body.id 为 Some(id) 且在 histories 中找到该记录，则更新它
/// - 如果 body.id 为 None 或未找到对应记录，则创建新记录（生成 UUID）
pub async fn upsert_history(
    State(state): State<AppState>,
    Json(body): Json<UpsertHistoryRequest>,
) -> Json<HistoryRecord> {
    let mut histories = state.histories.write().await;
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    // 尝试查找现有记录
    if let Some(ref id) = body.id {
        if let Some(index) = histories.iter().position(|h| h.id == *id) {
            // 更新现有记录
            histories[index].name = body.name;
            histories[index].selected_model = body.selected_model;
            histories[index].messages = body.messages;
            histories[index].timestamp = timestamp;

            let record = histories[index].clone();

            // 持久化到 YAML 文件
            if let Err(e) = history::save_histories(&histories) {
                tracing::warn!("保存历史记录到文件失败: {}", e);
            }

            return Json(record);
        }
    }

    // 创建新记录
    let new_id = body.id.unwrap_or_else(|| Uuid::new_v4().to_string());
    let new_record = HistoryRecord {
        id: new_id,
        name: body.name,
        timestamp,
        selected_model: body.selected_model,
        messages: body.messages,
    };

    histories.push(new_record.clone());

    // 持久化到 YAML 文件
    if let Err(e) = history::save_histories(&histories) {
        tracing::warn!("保存历史记录到文件失败: {}", e);
    }

    Json(new_record)
}

/// PUT /api/histories/:id - 更新历史记录
/// 
/// 支持更新名称、选中模型和消息列表
/// 成功返回 200，历史记录不存在返回 404
pub async fn update_history(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(body): Json<serde_json::Value>,
) -> Result<Json<HistoryRecord>, StatusCode> {
    let mut histories = state.histories.write().await;
    
    // 查找指定 ID 的历史记录
    let record_index = histories.iter().position(|h| h.id == id);
    
    if let Some(index) = record_index {
        // 更新可选字段
        if let Some(name) = body.get("name").and_then(|v| v.as_str()) {
            histories[index].name = name.to_string();
        }
        
        if let Some(selected_model) = body.get("selectedModel").and_then(|v| v.as_str()) {
            histories[index].selected_model = Some(selected_model.to_string());
        } else if body.get("selectedModel").is_some() {
            // 如果传入 null，则清除选中模型
            histories[index].selected_model = None;
        }
        
        if let Some(messages) = body.get("messages").and_then(|v| v.as_array()) {
            if let Ok(msgs) = serde_json::from_value(serde_json::Value::Array(messages.clone())) {
                histories[index].messages = msgs;
            }
        }
        
        // 更新时间戳
        histories[index].timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        
        let updated_record = histories[index].clone();
        
        // 持久化到 YAML 文件
        if let Err(e) = history::save_histories(&histories) {
            tracing::warn!("保存历史记录到文件失败: {}", e);
        }
        
        Ok(Json(updated_record))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}
