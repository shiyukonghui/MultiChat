# 添加持久化到 YAML 文件功能

## 问题分析

当前创建的模型只保存在内存（`Arc<RwLock<Vec<ModelConfig>>>`）中，服务重启后丢失。

## 修改步骤

### 步骤一：config.rs 添加 `save_config` 保存函数

在 `config.rs` 中新增 `save_config()` 函数，接收模型列表并回写到 `config/models.yaml`。

**逻辑要点：**
- 将模型列表序列化为 YAML 格式
- 写回 `config/models.yaml` 文件
- 保存时过滤掉 `api_key` 字段（该字段通过 `#[serde(skip)]` 自动跳过）
- 返回 Result 以便调用方处理错误

### 步骤二：models/mod.rs 中让 AppState 持有配置文件路径

为了让路由 handler 能知道 YAML 文件路径，需要将配置路径存入 AppState。有两种方案：

**方案 A（推荐）**：在 `AppState` 中添加 `config_path: PathBuf` 字段
- 修改 `AppState` 结构体，新增 `config_path` 字段
- 在 `main.rs` 创建 `AppState` 时传入文件路径
- 这样 `create_model` 和后续的 `update_model` 都可以调用 `save_config` 持久化

### 步骤三：models.rs 中 create_model 调用 save_config

在 `create_model` handler 中，在 `models_guard.push(...)` 之后，调用 `config::save_config()` 将当前内存中的模型列表持久化到 YAML。

**逻辑要点：**
- 从 AppState 获取配置路径
- 读取当前内存中的完整模型列表
- 调用 `save_config` 写入文件
- 如果写入失败，记录错误日志但不影响模型添加结果（保证可用性）

### 步骤四：models.rs 中 update_model 也调用 save_config（可选增强）

同理，`update_model` handler 在修改模型 `enabled` 状态后，也应调用 `save_config` 持久化。

## 涉及的文件

| 文件 | 操作 |
|------|------|
| `server/src/config.rs` | 新增 `save_config()` 函数 |
| `server/src/models/mod.rs` | AppState 添加 `config_path` 字段 |
| `server/src/main.rs` | 创建 AppState 时传入配置路径 |
| `server/src/routes/models.rs` | create_model 和 update_model 调用 save_config |

## 注意事项

- **API 密钥安全**：`api_key` 字段在 `ModelConfig` 中有 `#[serde(skip)]`，序列化时会自动跳过，不会保存到 YAML 文件中。API Key 仍然通过环境变量注入。
- **错误处理**：保存失败不会阻断模型添加/更新操作，仅记录日志警告。
- **线程安全**：保存前获取写锁，保存完释放，避免竞态。