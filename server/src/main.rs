// 多模型聊天后端服务入口
// 功能：加载配置、初始化日志、启动 HTTP 服务

mod config;
mod gateway;
mod history;
mod models;
mod routes;

use std::sync::Arc;
use tokio::sync::RwLock;
use tower_http::cors::{Any, CorsLayer};
use tower_http::limit::RequestBodyLimitLayer;
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};
use axum::{
    extract::Request,
    middleware::{self, Next},
    response::Response,
};
use models::AppState;

/// 认证中间件（V1.0 预留设计，暂不强制验证）
/// 检查 Authorization 请求头，记录日志但不拒绝未认证请求
/// 后续版本可在此处启用 Bearer Token 验证
async fn auth_middleware(
    request: Request,
    next: Next,
) -> Response {
    let auth_header = request
        .headers()
        .get("Authorization")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("<未提供>");

    // 日志记录（脱敏：仅记录前缀类型）
    let masked_auth = if auth_header.starts_with("Bearer ") {
        "Bearer ****"
    } else {
        auth_header
    };

    tracing::debug!("请求认证头: {}", masked_auth);

    // V1.0：放行所有请求，后续版本将在此处校验 Bearer Token
    // if auth_header == "<未提供>" {
    //     return Response::builder()
    //         .status(StatusCode::UNAUTHORIZED)
    //         .body(Body::from(r#"{"error": "Missing Authorization header"}"#))
    //         .unwrap();
    // }

    next.run(request).await
}

#[tokio::main]
async fn main() {
    // ========== 1. 初始化日志系统 ==========
    // 使用 env-filter，默认级别 INFO；可通过 RUST_LOG 环境变量覆盖
    let env_filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));

    tracing_subscriber::registry()
        // 日志格式：包含时间戳、级别、模块路径
        .with(fmt::layer().with_target(true).with_timer(fmt::time::LocalTime::rfc_3339()))
        .with(env_filter)
        .init();

    // ========== 2. 加载配置 ==========
    let app_config = match config::load_config() {
        Ok(cfg) => cfg,
        Err(e) => {
            tracing::error!("加载配置失败: {}", e);
            std::process::exit(1);
        }
    };

    let model_count = app_config.models.len();
    let enabled_count = app_config.models.iter().filter(|m| m.enabled).count();

    // 收集唯一的 provider 名称列表（转为 String 避免引用冲突）
    let providers: Vec<String> = app_config
        .models
        .iter()
        .map(|m| m.provider.clone())
        .collect::<std::collections::HashSet<String>>()
        .into_iter()
        .collect();

    // ========== 3. 加载历史记录 ==========
    let histories = match history::load_histories() {
        Ok(h) => {
            tracing::info!("已加载历史记录: {} 条", h.len());
            h
        }
        Err(e) => {
            tracing::warn!("加载历史记录失败: {}，将使用空列表", e);
            Vec::new()
        }
    };

    // 获取历史记录数量（在 state 被 move 之前）
    let history_count = histories.len();

    // ========== 4. 创建全局共享状态 ==========
    let state = AppState {
        models: Arc::new(RwLock::new(app_config.models)),
        histories: Arc::new(RwLock::new(histories)),
    };

    // ========== 5. 配置 CORS（开发阶段允许所有来源） ==========
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // ========== 6. 构建路由 ==========
    // 通过 routes 模块统一管理所有 API 路由
    let app = routes::create_router()
        // 认证中间件（V1.0 预留，暂不强制）
        .layer(middleware::from_fn(auth_middleware))
        // 请求体大小限制 10KB
        .layer(RequestBodyLimitLayer::new(10 * 1024))
        .layer(cors)
        .with_state(state);

    // ========== 7. 打印启动日志 ==========
    tracing::info!("========================================");
    tracing::info!("  多模型聊天后端服务 启动中...");
    tracing::info!("========================================");
    tracing::info!("监听地址: http://127.0.0.1:3001");
    tracing::info!(
        "已加载模型: {} 个（其中 {} 个已启用）",
        model_count,
        enabled_count
    );
    tracing::info!(
        "已加载历史记录: {} 条",
        history_count
    );
    tracing::info!(
        "服务提供商: {:?}",
        providers
    );
    tracing::info!("========================================");

    // ========== 8. 启动 HTTP 服务 ==========
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3001").await.unwrap();

    if let Err(e) = axum::serve(listener, app).await {
        tracing::error!("服务启动失败: {}", e);
        std::process::exit(1);
    }
}
