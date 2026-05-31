# 修复计划：PUT /api/models/deepseek-v4-flash 接口 404 错误

## 问题归因

### 根本原因
在 [mod.rs:23](file:///f:/RustProjects/MultiChat/server/src/routes/mod.rs#L23) 中，路由定义使用了错误的路径参数语法：

```rust
// 错误写法
.route("/api/models/{id}", put(models::update_model).delete(models::delete_model))
```

**问题分析：**
- 项目使用 **Axum 0.7** 框架
- 在 Axum 0.7 中，路径参数必须使用 `:id` 语法，而不是 `{id}` 语法
- `{id}` 语法不被 Axum 识别为路径参数，而是被当作字面量字符串处理
- 因此请求 `/api/models/deepseek-v4-flash` 无法匹配到 `/api/models/{id}` 路由
- 导致所有 PUT 和 DELETE 请求都返回 404 错误

### Axum 0.7 正确语法（来自官方文档）

```rust
.route("/users/:id", get(show_user))  // 正确：使用 :id
```

## 修复方案

### 修改文件
[server/src/routes/mod.rs](file:///f:/RustProjects/MultiChat/server/src/routes/mod.rs)

### 具体修改
将第 23 行的路由定义从：
```rust
.route("/api/models/{id}", put(models::update_model).delete(models::delete_model))
```

修改为：
```rust
.route("/api/models/:id", put(models::update_model).delete(models::delete_model))
```

## 实施步骤

1. **修改路由定义** - 将 `{id}` 改为 `:id`
2. **验证修复** - 运行项目并测试 PUT 请求

## 影响范围

此修复将同时解决以下接口的 404 问题：
- `PUT /api/models/{id}` - 更新模型配置
- `DELETE /api/models/{id}` - 删除模型
