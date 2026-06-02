// 历史记录 API 集成测试

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

fn create_state_with_test_histories() -> AppState {
    let histories = vec![
        common::create_test_history("history-1", "First Chat"),
        common::create_test_history_with_messages(
            "history-2",
            "Second Chat",
            vec![
                common::create_test_message("user", "Hello"),
                common::create_test_message("assistant", "Hi there!"),
            ],
        ),
    ];
    common::create_state_with_histories(histories)
}

#[tokio::test]
async fn test_get_histories_empty() {
    let state = create_test_state();
    let app = create_router().with_state(state);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/histories")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let histories: serde_json::Value = serde_json::from_slice(&body).unwrap();
    
    assert!(histories.is_array());
    assert_eq!(histories.as_array().unwrap().len(), 0);
}

#[tokio::test]
async fn test_get_histories_success() {
    let state = create_state_with_test_histories();
    let app = create_router().with_state(state);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/histories")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let histories: serde_json::Value = serde_json::from_slice(&body).unwrap();
    
    assert!(histories.is_array());
    let histories_array = histories.as_array().unwrap();
    assert_eq!(histories_array.len(), 2);
    assert_eq!(histories_array[0]["id"], "history-1");
    assert_eq!(histories_array[0]["name"], "First Chat");
}

#[tokio::test]
async fn test_get_histories_message_count() {
    let state = create_state_with_test_histories();
    let app = create_router().with_state(state);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/histories")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let histories: serde_json::Value = serde_json::from_slice(&body).unwrap();
    let histories_array = histories.as_array().unwrap();
    
    assert_eq!(histories_array[0]["messageCount"], 0);
    assert_eq!(histories_array[1]["messageCount"], 2);
}

#[tokio::test]
async fn test_create_history_success() {
    let state = create_test_state();
    let app = create_router().with_state(state);

    let body = json!({
        "name": "New Chat",
        "messages": []
    });

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/histories")
                .header("Content-Type", "application/json")
                .body(Body::from(serde_json::to_vec(&body).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let response_body = response.into_body().collect().await.unwrap().to_bytes();
    let history: serde_json::Value = serde_json::from_slice(&response_body).unwrap();
    
    assert_eq!(history["name"], "New Chat");
    assert!(history["id"].is_string());
    assert!(history["timestamp"].is_number());
}

#[tokio::test]
async fn test_get_history_detail_success() {
    let state = create_state_with_test_histories();
    let app = create_router().with_state(state);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/histories/history-2")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let history: serde_json::Value = serde_json::from_slice(&body).unwrap();
    
    assert_eq!(history["id"], "history-2");
    assert_eq!(history["name"], "Second Chat");
    assert!(history["messages"].is_array());
    let messages = history["messages"].as_array().unwrap();
    assert_eq!(messages.len(), 2);
}

#[tokio::test]
async fn test_get_history_detail_not_found() {
    let state = create_test_state();
    let app = create_router().with_state(state);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::GET)
                .uri("/api/histories/nonexistent")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_update_history_name() {
    let state = create_state_with_test_histories();
    let app = create_router().with_state(state);

    let body = json!({
        "name": "Updated Chat Name"
    });

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::PUT)
                .uri("/api/histories/history-1")
                .header("Content-Type", "application/json")
                .body(Body::from(serde_json::to_vec(&body).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let response_body = response.into_body().collect().await.unwrap().to_bytes();
    let history: serde_json::Value = serde_json::from_slice(&response_body).unwrap();
    
    assert_eq!(history["name"], "Updated Chat Name");
}

#[tokio::test]
async fn test_update_history_not_found() {
    let state = create_test_state();
    let app = create_router().with_state(state);

    let body = json!({ "name": "Test" });

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::PUT)
                .uri("/api/histories/nonexistent")
                .header("Content-Type", "application/json")
                .body(Body::from(serde_json::to_vec(&body).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_delete_history_success() {
    let state = create_state_with_test_histories();
    let app = create_router().with_state(state);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri("/api/histories/history-1")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = response.into_body().collect().await.unwrap().to_bytes();
    let result: serde_json::Value = serde_json::from_slice(&body).unwrap();
    
    assert_eq!(result["id"], "history-1");
    assert!(result["deleted"].as_bool().unwrap());
}

#[tokio::test]
async fn test_delete_history_not_found() {
    let state = create_test_state();
    let app = create_router().with_state(state);

    let response = app
        .oneshot(
            Request::builder()
                .method(Method::DELETE)
                .uri("/api/histories/nonexistent")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}
