// 模型管理 API 集成测试
// 测试 GET/POST/PUT/DELETE /api/models 端点

mod common;

use axum::{
    body::Body,
    http::{Method, Request, StatusCode},
};
use http_body_util::BodyExt;
use multichat_server::models::AppState;
use multichat_server::routes::create_router;
use tower::ServiceExt;
use serde_json::json;

fn create_test_state() -> AppState {
    common::create_empty_state()
}

fn create_state_with_test_models() -> AppState {
    let models = vec![
        common::create_test_model("gpt-4", "openai", true),
        common::create_test_model("claude-3", "anthropic", false),
    ];
    common::create_state_with_models(models)
}

#[tokio::test]
async fn test_get_models_empty() {
    let state = create_test_state();
    let app = create_router().with_state(state);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/models")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let models: serde_json::Value = serde_json::from_slice(&body).unwrap();
    
    assert!(models.is_array());
    assert_eq!(models.as_array().unwrap().len(), 0);
}

#[tokio::test]
async fn test_get_models_success() {
    let state = create_state_with_test_models();
    let app = create_router().with_state(state);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/models")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let models: serde_json::Value = serde_json::from_slice(&body).unwrap();
    
    assert!(models.is_array());
    let models_array = models.as_array().unwrap();
    assert_eq!(models_array.len(), 2);
    assert_eq!(models_array[0]["id"], "gpt-4");
    assert_eq!(models_array[0]["provider"], "openai");
    assert!(models_array[0]["enabled"].as_bool().unwrap());
}

#[tokio::test]
async fn test_get_models_status_mapping() {
    let state = create_state_with_test_models();
    let app = create_router().with_state(state);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/models")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let models: serde_json::Value = serde_json::from_slice(&body).unwrap();
    let models_array = models.as_array().unwrap();
    
    assert_eq!(models_array[0]["status"], "available");
    assert_eq!(models_array[1]["status"], "disabled");
}

#[tokio::test]
async fn test_create_model_success() {
    let state = create_test_state();
    let app = create_router().with_state(state);

    let body = json!({
        "id": "new-model",
        "provider": "openai"
    });

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/models")
                .header("Content-Type", "application/json")
                .body(Body::from(serde_json::to_vec(&body).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let response_body = response.into_body().collect().await.unwrap().to_bytes();
    let model: serde_json::Value = serde_json::from_slice(&response_body).unwrap();
    
    assert_eq!(model["id"], "new-model");
    assert_eq!(model["provider"], "openai");
    assert!(model["enabled"].as_bool().unwrap());
}

#[tokio::test]
async fn test_create_model_duplicate_id() {
    let state = create_state_with_test_models();
    let app = create_router().with_state(state);

    let body = json!({
        "id": "gpt-4",
        "provider": "openai"
    });

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/models")
                .header("Content-Type", "application/json")
                .body(Body::from(serde_json::to_vec(&body).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::CONFLICT);
}

#[tokio::test]
async fn test_update_model_enable() {
    let state = create_state_with_test_models();
    let app = create_router().with_state(state);

    let body = json!({ "enabled": true });

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::PUT)
                .uri("/api/models/claude-3")
                .header("Content-Type", "application/json")
                .body(Body::from(serde_json::to_vec(&body).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let response_body = response.into_body().collect().await.unwrap().to_bytes();
    let result: serde_json::Value = serde_json::from_slice(&response_body).unwrap();
    
    assert_eq!(result["id"], "claude-3");
    assert!(result["enabled"].as_bool().unwrap());
}

#[tokio::test]
async fn test_update_model_disable() {
    let state = create_state_with_test_models();
    let app = create_router().with_state(state);

    let body = json!({ "enabled": false });

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::PUT)
                .uri("/api/models/gpt-4")
                .header("Content-Type", "application/json")
                .body(Body::from(serde_json::to_vec(&body).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let response_body = response.into_body().collect().await.unwrap().to_bytes();
    let result: serde_json::Value = serde_json::from_slice(&response_body).unwrap();
    
    assert_eq!(result["id"], "gpt-4");
    assert!(!result["enabled"].as_bool().unwrap());
}

#[tokio::test]
async fn test_update_model_not_found() {
    let state = create_test_state();
    let app = create_router().with_state(state);

    let body = json!({ "enabled": true });

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::PUT)
                .uri("/api/models/nonexistent")
                .header("Content-Type", "application/json")
                .body(Body::from(serde_json::to_vec(&body).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_delete_model_success() {
    let state = create_state_with_test_models();
    let app = create_router().with_state(state);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri("/api/models/gpt-4")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let result: serde_json::Value = serde_json::from_slice(&body).unwrap();
    
    assert_eq!(result["id"], "gpt-4");
    assert!(result["deleted"].as_bool().unwrap());
}

#[tokio::test]
async fn test_delete_model_not_found() {
    let state = create_test_state();
    let app = create_router().with_state(state);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri("/api/models/nonexistent")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}
