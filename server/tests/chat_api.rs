// 聊天 API 集成测试

mod common;

use axum::{
    body::Body,
    http::{Method, Request, StatusCode},
};
use http_body_util::BodyExt;
use multichat_server::models::AppState;
use multichat_server::routes::create_router;
use tower::ServiceExt;

fn create_state_with_enabled_models() -> AppState {
    let models = vec![
        common::create_test_model("gpt-4", "openai", true),
        common::create_test_model("claude-3", "anthropic", true),
    ];
    common::create_state_with_models(models)
}

fn create_state_with_no_enabled_models() -> AppState {
    let models = vec![
        common::create_test_model("gpt-4", "openai", false),
        common::create_test_model("claude-3", "anthropic", false),
    ];
    common::create_state_with_models(models)
}

fn create_empty_state() -> AppState {
    common::create_empty_state()
}

#[tokio::test]
async fn test_chat_stream_empty_message() {
    let state = create_state_with_enabled_models();
    let app = create_router().with_state(state);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/chat/stream?message=")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_chat_stream_message_too_long() {
    let state = create_state_with_enabled_models();
    let app = create_router().with_state(state);

    let long_message = "x".repeat(4001);
    let uri = format!("/api/chat/stream?message={}", urlencoding::encode(&long_message));

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_chat_stream_no_enabled_models() {
    let state = create_state_with_no_enabled_models();
    let app = create_router().with_state(state);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/chat/stream?message=Hello")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
}

#[tokio::test]
async fn test_chat_stream_empty_models() {
    let state = create_empty_state();
    let app = create_router().with_state(state);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/chat/stream?message=Hello")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);
}

#[tokio::test]
async fn test_chat_stream_success() {
    let state = create_state_with_enabled_models();
    let app = create_router().with_state(state);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/chat/stream?message=Hello")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    
    let content_type = response
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    
    assert!(content_type.contains("text/event-stream"));
}

#[tokio::test]
async fn test_chat_stream_with_history() {
    let state = create_state_with_enabled_models();
    let app = create_router().with_state(state);

    let history = urlencoding::encode(r#"[{"role":"user","content":"Hi"},{"role":"assistant","content":"Hello!"}]"#);
    let uri = format!("/api/chat/stream?message=How%20are%20you?&history={}", history);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_chat_stream_mock_mode() {
    let state = create_state_with_enabled_models();
    let app = create_router().with_state(state);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/chat/stream?message=Test%20message")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    
    let body = response.into_body().collect().await.unwrap().to_bytes();
    let body_str = String::from_utf8_lossy(&body);
    
    assert!(body_str.contains("模拟回复") || body_str.contains("event:"));
}

#[tokio::test]
async fn test_chat_stream_message_boundary() {
    let state = create_state_with_enabled_models();
    let app = create_router().with_state(state);

    let boundary_message = "x".repeat(4000);
    let uri = format!("/api/chat/stream?message={}", urlencoding::encode(&boundary_message));

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri(&uri)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_chat_stream_whitespace_message() {
    let state = create_state_with_enabled_models();
    let app = create_router().with_state(state);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/chat/stream?message=%20%20%20")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_chat_stream_no_message_param() {
    let state = create_state_with_enabled_models();
    let app = create_router().with_state(state);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/chat/stream")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

mod urlencoding {
    pub fn encode(s: &str) -> String {
        urlencoding::encode(s).to_string()
    }
}