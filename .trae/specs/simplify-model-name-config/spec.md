# 精简模型名称配置 Spec

## Why
当前配置文件中 `id` 和 `name` 字段通常相同，造成冗余。前端只需要展示模型 ID 即可，不需要额外的"模型展示名称"字段，简化配置和使用流程。

## What Changes
- **BREAKING**: 移除 `models.yaml` 中的 `name` 字段，只保留 `id` 字段
- **BREAKING**: 移除后端 `ModelConfig` 结构体中的 `name` 字段
- **BREAKING**: 移除后端 `ModelConfigResponse` 结构体中的 `name` 字段
- **BREAKING**: 移除前端 `ModelConfig` 接口中的 `name` 字段
- 前端所有展示模型名称的地方改为直接使用 `id` 字段

## Impact
- Affected specs: multi-model-chat
- Affected code: 
  - `server/config/models.yaml`
  - `server/src/config.rs`
  - `server/src/models/mod.rs`
  - `server/src/routes/models.rs`
  - `client/src/types/index.ts`
  - `client/src/components/ModelSidebar.tsx`
  - `client/src/pages/ModelConfigPanel.tsx`
  - `client/src/components/AddModelDialog.tsx`

## ADDED Requirements

### Requirement: 简化模型配置结构
系统 SHALL 使用简化的模型配置结构，移除冗余的 `name` 字段，只保留 `id` 作为唯一标识和显示名称。

#### Scenario: 配置文件简化
- **GIVEN** 一个模型配置文件 `models.yaml`
- **WHEN** 加载配置时
- **THEN** 只需要 `id` 字段作为模型标识，无需 `name` 字段

#### Scenario: 前端展示模型
- **GIVEN** 前端需要展示模型名称
- **WHEN** 渲染模型列表或侧边栏
- **THEN** 直接使用 `model.id` 作为显示名称

## MODIFIED Requirements

### Requirement: 后端模型配置结构
修改 `server/src/config.rs` 中的 `ModelConfig` 结构体：

```rust
pub struct ModelConfig {
    /// 模型唯一标识（也用作显示名称）
    pub id: String,
    // 移除 name 字段
    pub provider: String,
    pub model: String,
    // ... 其他字段保持不变
}
```

### Requirement: 后端 API 响应结构
修改 `server/src/models/mod.rs` 中的 `ModelConfigResponse` 结构体：

```rust
pub struct ModelConfigResponse {
    /// 模型唯一标识（也用作显示名称）
    pub id: String,
    // 移除 name 字段
    pub provider: String,
    pub enabled: bool,
    // ... 其他字段保持不变
}
```

### Requirement: 前端类型定义
修改 `client/src/types/index.ts` 中的 `ModelConfig` 接口：

```typescript
export interface ModelConfig {
  id: string;
  // 移除 name 字段
  provider: string;
  enabled: boolean;
  status: 'available' | 'unavailable' | 'unknown';
  // ... 其他字段保持不变
}
```

### Requirement: 前端展示逻辑
修改前端组件，将所有使用 `model.name` 的地方改为使用 `model.id`：

- `ModelSidebar.tsx`: 将 `model.name || modelId` 改为直接使用 `modelId`
- `ModelConfigPanel.tsx`: 将 `model.displayName || model.name` 改为 `model.displayName || model.id`

## REMOVED Requirements

### Requirement: name 字段
**Reason**: `name` 字段与 `id` 通常相同，造成冗余
**Migration**: 所有使用 `name` 的地方改为使用 `id`
