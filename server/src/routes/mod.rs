// 路由模块
// 定义所有 API 路由并统一创建 Router

pub mod chat;
pub mod history;
pub mod models;
pub mod prompts;

use axum::{
    routing::{get, post, put},
    Router,
};
use crate::models::AppState;

/// 创建所有 API 路由，返回配置好的 Router
/// 路由列表：
///   GET   /api/models       - 获取模型列表
///   POST  /api/models       - 创建新模型
///   PUT   /api/models/{id}  - 更新模型配置
///   DELETE /api/models/{id} - 删除模型
///   GET   /api/histories    - 获取历史记录列表
///   POST  /api/histories    - 创建新历史记录
///   GET   /api/histories/:id - 获取历史记录详情
///   PUT   /api/histories/:id - 更新历史记录
///   DELETE /api/histories/:id - 删除历史记录
///   GET   /api/chat/stream  - SSE 流式对话
pub fn create_router() -> Router<AppState> {
    Router::new()
        .route("/api/models", get(models::get_models).post(models::create_model))
        .route("/api/models/:id", put(models::update_model).delete(models::delete_model))
        .route("/api/histories", get(history::get_histories).post(history::create_history))
        .route("/api/histories/upsert", post(history::upsert_history))
        .route("/api/histories/:id", get(history::get_history_detail).put(history::update_history).delete(history::delete_history))
        .route("/api/prompts", get(prompts::get_prompts).post(prompts::create_prompt))
        .route("/api/prompts/:id", get(prompts::get_prompt_detail).put(prompts::update_prompt).delete(prompts::delete_prompt))
        .route("/api/chat/stream", get(chat::chat_stream_handler))
}
