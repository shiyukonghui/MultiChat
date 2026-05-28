// 模型管理 API 路由 handler
// 提供 GET /api/models（列表查询）、PUT /api/models/{id}（更新启用状态）、POST /api/models（创建模型）

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use crate::config::ModelConfig;
use crate::models::{AppState, ModelConfigResponse, UpdateModelRequest, CreateModelRequest};

/// GET /api/models - 获取所有模型配置列表
/// 返回启用/禁用状态及各模型基本信息
pub async fn get_models(
    State(state): State<AppState>,
) -> Json<Vec<ModelConfigResponse>> {
    let models = state.models.read().await;
    let response: Vec<ModelConfigResponse> = models
        .iter()
        .map(|m| {
            // 根据 enabled 字段判断模型当前状态
            let status = if m.enabled {
                "available".to_string()
            } else {
                "disabled".to_string()
            };

            ModelConfigResponse {
                id: m.id.clone(),
                name: m.name.clone(),
                provider: m.provider.clone(),
                enabled: m.enabled,
                status,
                reason: None,
                // 新增字段
                api_format: Some(m.api_format.clone()),
                api_endpoint: Some(m.api_endpoint.clone()),
                api_key: if m.api_key.is_empty() { None } else { Some(m.api_key.clone()) },
                is_multimodal: Some(m.is_multimodal),
                model_series: Some(m.model_series.clone()),
                display_name: m.display_name.clone(),
                context_window_input: Some(m.context_window_input),
                context_window_output: Some(m.context_window_output),
                tool_call_rounds: Some(m.tool_call_rounds),
                use_full_url: Some(m.use_full_url),
            }
        })
        .collect();
    Json(response)
}

/// PUT /api/models/{id} - 更新指定模型的启用/禁用状态
/// 请求体：{ "enabled": true/false }
/// 成功返回 200，模型不存在返回 404
pub async fn update_model(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(body): Json<UpdateModelRequest>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let mut models = state.models.write().await;
    if let Some(model) = models.iter_mut().find(|m| m.id == id) {
        model.enabled = body.enabled;
        Ok(Json(serde_json::json!({
            "id": id,
            "enabled": body.enabled
        })))
    } else {
        Err(StatusCode::NOT_FOUND)
    }
}

/// POST /api/models - 创建新模型
/// 请求体：CreateModelRequest
/// 成功返回 201 和创建的模型配置
pub async fn create_model(
    State(state): State<AppState>,
    Json(body): Json<CreateModelRequest>,
) -> Result<Json<ModelConfigResponse>, StatusCode> {
    // 检查模型 ID 是否已存在
    let models_guard = state.models.read().await;
    if models_guard.iter().any(|m| m.id == body.id) {
        return Err(StatusCode::CONFLICT);
    }
    drop(models_guard);

    // 构建新模型配置
    let new_model = ModelConfig {
        id: body.id.clone(),
        name: body.display_name.clone().unwrap_or_else(|| body.id.clone()),
        provider: body.provider.clone(),
        model: body.id.clone(),
        enabled: true,
        timeout_seconds: 60,
        max_tokens: 4096,
        status: "active".to_string(),
        api_key: body.api_key.clone().unwrap_or_default(),
        // 新增字段
        api_format: body.api_format.clone().unwrap_or_else(|| "openai-chat-completions".to_string()),
        api_endpoint: body.api_endpoint.clone().unwrap_or_default(),
        is_multimodal: body.is_multimodal.unwrap_or(false),
        model_series: body.model_series.clone().unwrap_or_else(|| "default".to_string()),
        display_name: body.display_name.clone(),
        context_window_input: body.context_window_input.unwrap_or(184000),
        context_window_output: body.context_window_output.unwrap_or(16000),
        tool_call_rounds: body.tool_call_rounds.unwrap_or(200),
        use_full_url: body.use_full_url.unwrap_or(false),
    };

    // 添加到模型列表
    let mut models_guard = state.models.write().await;
    models_guard.push(new_model.clone());

    // 构建响应
    let response = ModelConfigResponse {
        id: new_model.id.clone(),
        name: new_model.name.clone(),
        provider: new_model.provider.clone(),
        enabled: new_model.enabled,
        status: "available".to_string(),
        reason: None,
        api_format: Some(new_model.api_format.clone()),
        api_endpoint: Some(new_model.api_endpoint.clone()),
        api_key: if new_model.api_key.is_empty() { None } else { Some(new_model.api_key.clone()) },
        is_multimodal: Some(new_model.is_multimodal),
        model_series: Some(new_model.model_series.clone()),
        display_name: new_model.display_name.clone(),
        context_window_input: Some(new_model.context_window_input),
        context_window_output: Some(new_model.context_window_output),
        tool_call_rounds: Some(new_model.tool_call_rounds),
        use_full_url: Some(new_model.use_full_url),
    };

    Ok(Json(response))
}
