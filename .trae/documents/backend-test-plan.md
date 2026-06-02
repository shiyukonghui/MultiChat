# 后端功能测试计划

## 项目概述

MultiChat 后端是一个基于 Rust + axum 的多模型聊天服务，主要功能包括：
- 模型配置管理（CRUD）
- 历史记录管理（CRUD）
- SSE 流式对话
- YAML 文件持久化

## 测试策略

采用分层测试策略：
1. **单元测试**：测试各模块的核心函数和逻辑
2. **集成测试**：测试 API 端点的完整流程
3. **使用 `tower::ServiceExt::oneshot` 进行 API 测试**（无需启动真实服务器）

## 测试框架和依赖

需要添加到 `Cargo.toml` 的测试依赖：
```toml
[dev-dependencies]
tokio-test = "0.4"
tower = "0.4"
http-body-util = "0.1"
tempfile = "3"
```

---

## 一、单元测试

### 1.1 配置模块测试 (`config.rs`)

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| `test_load_config_success` | 测试正常加载 YAML 配置 | 返回正确的 AppConfig |
| `test_load_config_file_not_found` | 测试配置文件不存在 | 返回错误 |
| `test_load_config_invalid_yaml` | 测试无效 YAML 格式 | 返回解析错误 |
| `test_save_config_success` | 测试保存配置到文件 | 文件内容正确 |
| `test_model_config_defaults` | 测试 ModelConfig 默认值 | 各字段使用正确默认值 |
| `test_get_config_path` | 测试配置路径获取 | 返回正确路径 |

### 1.2 历史记录模块测试 (`history.rs`)

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| `test_load_histories_success` | 测试正常加载历史记录 | 返回正确的历史列表 |
| `test_load_histories_file_not_found` | 测试文件不存在 | 返回空列表 |
| `test_load_histories_empty_file` | 测试空文件 | 返回空列表 |
| `test_save_histories_success` | 测试保存历史记录 | 文件内容正确 |
| `test_save_histories_creates_dir` | 测试自动创建目录 | data 目录被创建 |
| `test_history_record_serialization` | 测试序列化/反序列化 | 数据完整保留 |

### 1.3 数据模型测试 (`models/mod.rs`)

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| `test_model_config_response_serialization` | 测试响应结构序列化 | camelCase 正确转换 |
| `test_create_model_request_deserialization` | 测试请求结构反序列化 | 字段正确解析 |
| `test_update_model_detail_request_partial` | 测试部分字段更新 | 可选字段正确处理 |
| `test_chat_message_serialization` | 测试消息结构序列化 | JSON 格式正确 |
| `test_sse_event_variants` | 测试 SSE 事件类型 | 各变体正确构造 |

### 1.4 网关模块测试 (`gateway.rs`)

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| `test_stream_chat_mock_response` | 测试模拟响应（无 API Key） | 正确发送 Chunk 和 Done 事件 |
| `test_stream_chat_with_history` | 测试带历史记录的模拟响应 | 历史上下文正确包含 |
| `test_call_openai_compatible_api_endpoint` | 测试端点 URL 构建 | 正确拼接 URL |
| `test_call_openai_compatible_api_full_url` | 测试完整 URL 模式 | 直接使用配置的 URL |
| `test_call_real_api_unsupported_format` | 测试不支持的 API 格式 | 返回错误信息 |

---

## 二、集成测试（API 端点测试）

### 2.1 模型管理 API 测试 (`routes/models.rs`)

#### GET /api/models

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| `test_get_models_empty` | 测试空模型列表 | 返回空数组 |
| `test_get_models_success` | 测试获取模型列表 | 返回正确的模型数组 |
| `test_get_models_status_mapping` | 测试状态映射 | enabled=true → "available" |

#### POST /api/models

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| `test_create_model_success` | 测试创建模型成功 | 返回 201 和模型配置 |
| `test_create_model_duplicate_id` | 测试重复 ID | 返回 409 CONFLICT |
| `test_create_model_minimal_fields` | 测试最小字段创建 | 使用默认值填充 |
| `test_create_model_all_fields` | 测试完整字段创建 | 所有字段正确保存 |

#### PUT /api/models/:id

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| `test_update_model_enable` | 测试启用模型 | enabled 正确更新 |
| `test_update_model_disable` | 测试禁用模型 | enabled 正确更新 |
| `test_update_model_not_found` | 测试模型不存在 | 返回 404 NOT_FOUND |
| `test_update_model_full_details` | 测试全字段更新 | 所有字段正确更新 |
| `test_update_model_partial_fields` | 测试部分字段更新 | 仅更新传入字段 |

#### DELETE /api/models/:id

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| `test_delete_model_success` | 测试删除模型成功 | 返回 200 和删除确认 |
| `test_delete_model_not_found` | 测试删除不存在的模型 | 返回 404 NOT_FOUND |

### 2.2 历史记录 API 测试 (`routes/history.rs`)

#### GET /api/histories

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| `test_get_histories_empty` | 测试空历史列表 | 返回空数组 |
| `test_get_histories_success` | 测试获取历史列表 | 返回正确的历史数组 |
| `test_get_histories_message_count` | 测试消息数量计算 | message_count 正确 |

#### POST /api/histories

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| `test_create_history_success` | 测试创建历史成功 | 返回正确的历史记录 |
| `test_create_history_with_messages` | 测试带消息创建 | 消息正确保存 |
| `test_create_history_auto_timestamp` | 测试自动时间戳 | 时间戳正确生成 |

#### GET /api/histories/:id

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| `test_get_history_detail_success` | 测试获取详情成功 | 返回完整消息列表 |
| `test_get_history_detail_not_found` | 测试历史不存在 | 返回 404 NOT_FOUND |

#### PUT /api/histories/:id

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| `test_update_history_name` | 测试更新名称 | 名称正确更新 |
| `test_update_history_messages` | 测试更新消息 | 消息正确更新 |
| `test_update_history_selected_model` | 测试更新选中模型 | selected_model 正确更新 |
| `test_update_history_not_found` | 测试历史不存在 | 返回 404 NOT_FOUND |
| `test_update_history_timestamp` | 测试时间戳自动更新 | 时间戳被刷新 |

#### DELETE /api/histories/:id

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| `test_delete_history_success` | 测试删除历史成功 | 返回 200 和删除确认 |
| `test_delete_history_not_found` | 测试删除不存在的历史 | 返回 404 NOT_FOUND |

### 2.3 聊天 API 测试 (`routes/chat.rs`)

#### GET /api/chat/stream

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| `test_chat_stream_success` | 测试正常流式对话 | 返回 SSE 事件流 |
| `test_chat_stream_empty_message` | 测试空消息 | 返回 400 BAD_REQUEST |
| `test_chat_stream_message_too_long` | 测试消息超长（>4000字符） | 返回 400 BAD_REQUEST |
| `test_chat_stream_no_enabled_models` | 测试无启用模型 | 返回 503 SERVICE_UNAVAILABLE |
| `test_chat_stream_with_history` | 测试带历史记录 | 历史正确传递 |
| `test_chat_stream_mock_mode` | 测试模拟模式（无 API Key） | 返回模拟响应 |

---

## 三、测试文件组织结构

```
server/
├── src/
│   ├── config.rs          # 内联单元测试（##[cfg(test)]）
│   ├── history.rs         # 内联单元测试
│   ├── models/mod.rs      # 内联单元测试
│   ├── gateway.rs         # 内联单元测试
│   └── routes/
│       ├── models.rs      # 内联单元测试
│       ├── history.rs     # 内联单元测试
│       └── chat.rs        # 内联单元测试
└── tests/                 # 集成测试目录
    ├── common/
    │   └── mod.rs         # 测试辅助函数（创建测试状态、模拟请求等）
    ├── models_api.rs      # 模型 API 集成测试
    ├── history_api.rs     # 历史记录 API 集成测试
    └── chat_api.rs        # 聊天 API 集成测试
```

---

## 四、实施步骤

### 步骤 1：添加测试依赖
- 更新 `Cargo.toml`，添加测试相关依赖

### 步骤 2：创建测试辅助模块
- 创建 `tests/common/mod.rs`
- 实现测试用的 AppState 构造函数
- 实现测试用的临时文件处理

### 步骤 3：实现配置模块单元测试
- 在 `config.rs` 添加 `##[cfg(test)] mod tests { ... }`
- 使用 tempfile 创建临时配置文件进行测试

### 步骤 4：实现历史记录模块单元测试
- 在 `history.rs` 添加单元测试
- 测试文件读写和序列化

### 步骤 5：实现数据模型单元测试
- 在 `models/mod.rs` 添加单元测试
- 测试序列化/反序列化和字段转换

### 步骤 6：实现网关模块单元测试
- 在 `gateway.rs` 添加单元测试
- 测试模拟响应和 URL 构建

### 步骤 7：实现模型管理 API 集成测试
- 创建 `tests/models_api.rs`
- 使用 `tower::ServiceExt::oneshot` 测试各端点

### 步骤 8：实现历史记录 API 集成测试
- 创建 `tests/history_api.rs`
- 测试 CRUD 操作和持久化

### 步骤 9：实现聊天 API 集成测试
- 创建 `tests/chat_api.rs`
- 测试参数校验和 SSE 流

### 步骤 10：运行全部测试并验证
- 执行 `cargo test`
- 确保所有测试通过

---

## 五、测试覆盖率目标

| 模块 | 目标覆盖率 |
|-----|-----------|
| config.rs | ≥ 90% |
| history.rs | ≥ 90% |
| models/mod.rs | ≥ 85% |
| gateway.rs | ≥ 80% |
| routes/models.rs | ≥ 90% |
| routes/history.rs | ≥ 90% |
| routes/chat.rs | ≥ 85% |

---

## 六、注意事项

1. **隔离性**：每个测试使用独立的临时文件，避免测试间干扰
2. **异步测试**：使用 `##[tokio::test]` 进行异步测试
3. **并发安全**：测试 AppState 的并发读写安全性
4. **错误路径**：确保错误情况（如文件不存在、解析失败）有对应测试
5. **边界条件**：测试空值、最大值、特殊字符等边界情况
