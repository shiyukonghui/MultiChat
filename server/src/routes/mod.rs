// 路由模块
// 定义所有 API 路由并统一创建 Router

pub mod chat;
pub mod models;

use axum::{
    routing::{delete, get, post, put},
    Router,
};
use crate::models::AppState;

/// 创建所有 API 路由，返回配置好的 Router
/// 路由列表：
///   GET   /api/models       - 获取模型列表
///   POST  /api/models       - 创建新模型
///   PUT   /api/models/{id}  - 更新模型配置
///   DELETE /api/models/{id} - 删除模型
///   GET   /api/chat/stream  - SSE 流式对话
pub fn create_router() -> Router<AppState> {
    Router::new()
        .route("/api/models", get(models::get_models).post(models::create_model))
        .route("/api/models/:id", put(models::update_model).delete(models::delete_model))
        .route("/api/chat/stream", get(chat::chat_stream_handler))
}
