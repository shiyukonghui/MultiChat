// 模型管理 API 路由 handler
// 提供 GET /api/models（列表查询）、PUT /api/models/{id}（更新启用状态）、POST /api/models（创建模型）

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use crate::config;
use crate::config::ModelConfig;
use crate::models::{AppState, ModelConfigResponse, UpdateModelRequest, UpdateModelDetailRequest, CreateModelRequest};

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

/// PUT /api/models/{id} - 更新指定模型的配置信息
/// 支持两种请求格式：
///   1. { "enabled": true/false } - 仅更新启用/禁用状态（向后兼容）
///   2. 全字段更新 - 编辑模型全部配置字段
/// 成功返回 200，模型不存在返回 404
pub async fn update_model(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(body): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let mut models = state.models.write().await;
    let model_found = models.iter().position(|m| m.id == id);

    if let Some(index) = model_found {
        let model = &mut models[index];

        // 判断是全字段更新(包含 apiFormat/apiEndpoint 字段)还是仅更新 enabled
        if body.get("apiFormat").is_some() || body.get("apiEndpoint").is_some() || body.get("provider").is_some() {
            match serde_json::from_value::<UpdateModelDetailRequest>(body.clone()) {
                Ok(detail) => {
                    if let Some(provider) = detail.provider {
                        model.provider = provider;
                    }
                    if let Some(api_format) = detail.api_format {
                        model.api_format = api_format;
                    }
                    if let Some(api_endpoint) = detail.api_endpoint {
                        model.api_endpoint = api_endpoint;
                    }
                    if let Some(api_key) = detail.api_key {
                        model.api_key = api_key;
                    }
                    if let Some(is_multimodal) = detail.is_multimodal {
                        model.is_multimodal = is_multimodal;
                    }
                    if let Some(model_series) = detail.model_series {
                        model.model_series = model_series;
                    }
                    // displayName: 空字符串视为未设置
                    if let Some(display_name) = detail.display_name {
                        if display_name.is_empty() {
                            model.display_name = None;
                        } else {
                            model.display_name = Some(display_name);
                        }
                    }
                    if let Some(ctx_in) = detail.context_window_input {
                        model.context_window_input = ctx_in;
                    }
                    if let Some(ctx_out) = detail.context_window_output {
                        model.context_window_output = ctx_out;
                    }
                    if let Some(rounds) = detail.tool_call_rounds {
                        model.tool_call_rounds = rounds;
                    }
                    if let Some(use_full_url) = detail.use_full_url {
                        model.use_full_url = use_full_url;
                    }

                    if let Some(enabled) = body.get("enabled").and_then(|v| v.as_bool()) {
                        model.enabled = enabled;
                    }
                }
                Err(e) => {
                    tracing::error!("反序列化 UpdateModelDetailRequest 失败: {}, body: {}", e, body);
                }
            }
        } else {
            if let Ok(body) = serde_json::from_value::<UpdateModelRequest>(body) {
                model.enabled = body.enabled;
            }
        }

        // 持久化到 YAML 文件（在可变借用释放后进行）
        let _ = model;

        if let Err(e) = config::save_config(&models) {
            tracing::warn!("保存模型配置到文件失败: {}", e);
        }

        Ok(Json(serde_json::json!({
            "id": id,
            "enabled": models[index].enabled
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

    // 持久化到 YAML 文件
    if let Err(e) = config::save_config(&models_guard) {
        tracing::warn!("保存新模型到配置文件失败: {}", e);
    }

    // 构建响应
    let response = ModelConfigResponse {
        id: new_model.id.clone(),
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

/// DELETE /api/models/{id} - 删除指定模型
/// 成功返回 200，模型不存在返回 404
pub async fn delete_model(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, StatusCode> {
    let mut models = state.models.write().await;
    let initial_len = models.len();
    models.retain(|m| m.id != id);

    if models.len() == initial_len {
        // 没有找到匹配的模型
        return Err(StatusCode::NOT_FOUND);
    }

    // 持久化到 YAML 文件
    if let Err(e) = config::save_config(&models) {
        tracing::warn!("保存模型配置到文件失败: {}", e);
    }

    Ok(Json(serde_json::json!({
        "id": id,
        "deleted": true
    })))
}
