// 提示词 API 路由 handler
// 提供完整的 CRUD 操作：列表查询、详情查询、创建、更新、删除

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use chrono::Utc;
use uuid::Uuid;

use crate::models::prompt::{CreatePromptRequest, Prompt, UpdatePromptRequest};
use crate::models::AppState;
use crate::prompt_storage;

/// POST /api/prompts - 创建新提示词
///
/// 自动生成以 "p_" 为前缀的 UUID 作为 ID，使用 ISO 8601 格式时间戳
/// 输入校验：title 非空且不超过 50 字符，content 非空且不超过 4000 字符
/// 成功返回 201 和创建的提示词
pub async fn create_prompt(
    State(state): State<AppState>,
    Json(body): Json<CreatePromptRequest>,
) -> Result<(StatusCode, Json<Prompt>), StatusCode> {
    // 输入校验：title 非空且不超过 50 字符
    let title = body.title.trim();
    if title.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }
    if title.chars().count() > 50 {
        return Err(StatusCode::BAD_REQUEST);
    }

    // 输入校验：content 非空且不超过 4000 字符
    let content = body.content.trim();
    if content.is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }
    if content.chars().count() > 4000 {
        return Err(StatusCode::BAD_REQUEST);
    }

    // 生成以 "p_" 为前缀的 UUID 作为唯一标识
    let id = format!("p_{}", Uuid::new_v4().to_string());
    // 获取当前时间的 ISO 8601 格式字符串（UTC 时间）
    let now = Utc::now().to_rfc3339();

    // 创建新的提示词
    let new_prompt = Prompt {
        id,
        title: title.to_string(),
        content: content.to_string(),
        created_at: now.clone(),
        updated_at: now,
    };

    // 添加到提示词列表
    let mut prompts = state.prompts.write().await;
    prompts.push(new_prompt.clone());

    // 持久化到 YAML 文件
    if let Err(e) = prompt_storage::save_prompts(&prompts) {
        tracing::warn!("保存提示词到文件失败: {}", e);
    }

    Ok((StatusCode::CREATED, Json(new_prompt)))
}

/// GET /api/prompts - 获取所有提示词列表
///
/// 按 updated_at 降序排列（最新的在前）
pub async fn get_prompts(State(state): State<AppState>) -> Json<Vec<Prompt>> {
    let mut prompts = state.prompts.read().await.clone();

    // 按 updated_at 降序排列
    prompts.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));

    Json(prompts)
}

/// GET /api/prompts/:id - 获取单个提示词详情
///
/// 成功返回 200 和提示词详情，不存在返回 404
pub async fn get_prompt_detail(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<Prompt>, StatusCode> {
    let prompts = state.prompts.read().await;

    // 查找指定 ID 的提示词
    prompts
        .iter()
        .find(|p| p.id == id)
        .cloned()
        .map(Json)
        .ok_or(StatusCode::NOT_FOUND)
}

/// PUT /api/prompts/:id - 更新指定提示词
///
/// 支持部分更新 title 和/或 content
/// 输入校验规则与创建时一致
/// 成功返回 200，不存在返回 404
pub async fn update_prompt(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(body): Json<UpdatePromptRequest>,
) -> Result<Json<Prompt>, StatusCode> {
    let mut prompts = state.prompts.write().await;

    // 查找指定 ID 的提示词
    let prompt_index = prompts.iter().position(|p| p.id == id);
    let index = prompt_index.ok_or(StatusCode::NOT_FOUND)?;

    // 校验并更新 title（如果提供）
    if let Some(ref title) = body.title {
        let trimmed = title.trim();
        if trimmed.is_empty() || trimmed.chars().count() > 50 {
            return Err(StatusCode::BAD_REQUEST);
        }
        prompts[index].title = trimmed.to_string();
    }

    // 校验并更新 content（如果提供）
    if let Some(ref content) = body.content {
        let trimmed = content.trim();
        if trimmed.is_empty() || trimmed.chars().count() > 4000 {
            return Err(StatusCode::BAD_REQUEST);
        }
        prompts[index].content = trimmed.to_string();
    }

    // 更新修改时间
    prompts[index].updated_at = Utc::now().to_rfc3339();

    let updated_prompt = prompts[index].clone();

    // 持久化到 YAML 文件
    if let Err(e) = prompt_storage::save_prompts(&prompts) {
        tracing::warn!("保存提示词到文件失败: {}", e);
    }

    Ok(Json(updated_prompt))
}

/// DELETE /api/prompts/:id - 删除指定提示词
///
/// 成功返回 200，不存在返回 404
pub async fn delete_prompt(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let mut prompts = state.prompts.write().await;
    let initial_len = prompts.len();

    // 移除匹配的提示词
    prompts.retain(|p| p.id != id);

    // 检查是否找到并删除了记录
    if prompts.len() == initial_len {
        return Err(StatusCode::NOT_FOUND);
    }

    // 持久化到 YAML 文件
    if let Err(e) = prompt_storage::save_prompts(&prompts) {
        tracing::warn!("保存提示词到文件失败: {}", e);
    }

    Ok(Json(serde_json::json!({
        "id": id,
        "deleted": true
    })))
}