// 提示词系统 Prompt 数据模型
// 定义提示词的存储结构、API 请求/响应结构体

use serde::{Deserialize, Serialize};

/// 提示词结构体：代表一条系统提示词
/// 用于 YAML 持久化存储及 API 响应
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Prompt {
    /// 提示词唯一标识符（"p_" 前缀 UUID）
    pub id: String,
    /// 提示词标题
    pub title: String,
    /// 提示词内容（系统提示文本）
    pub content: String,
    /// 创建时间（ISO 8601 格式）
    pub created_at: String,
    /// 最后更新时间（ISO 8601 格式）
    pub updated_at: String,
}

/// 提示词列表包装结构体（用于 YAML 序列化）
#[derive(Debug, Serialize, Deserialize)]
pub struct PromptsFile {
    pub prompts: Vec<Prompt>,
}

/// 创建提示词的请求体
#[derive(Debug, Deserialize)]
pub struct CreatePromptRequest {
    pub title: String,
    pub content: String,
}

/// 更新提示词的请求体（支持部分更新）
#[derive(Debug, Deserialize)]
pub struct UpdatePromptRequest {
    pub title: Option<String>,
    pub content: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;

    /// 测试 Prompt 结构体各字段
    #[test]
    fn test_prompt_struct_fields() {
        let prompt = Prompt {
            id: "p-001".to_string(),
            title: "代码助手".to_string(),
            content: "你是一个专业的代码助手。".to_string(),
            created_at: "2025-06-01T00:00:00Z".to_string(),
            updated_at: "2025-06-01T12:00:00Z".to_string(),
        };

        assert_eq!(prompt.id, "p-001");
        assert_eq!(prompt.title, "代码助手");
        assert_eq!(prompt.content, "你是一个专业的代码助手。");
        assert_eq!(prompt.created_at, "2025-06-01T00:00:00Z");
        assert_eq!(prompt.updated_at, "2025-06-01T12:00:00Z");
    }

    /// 测试 Prompt 序列化为 JSON 时字段完整
    #[test]
    fn test_prompt_json_serialization() {
        let prompt = Prompt {
            id: "p-002".to_string(),
            title: "翻译助手".to_string(),
            content: "请翻译以下内容。".to_string(),
            created_at: "2025-06-01T00:00:00Z".to_string(),
            updated_at: "2025-06-01T00:00:00Z".to_string(),
        };

        let json = serde_json::to_string(&prompt).unwrap();
        assert!(json.contains("p-002"));
        assert!(json.contains("翻译助手"));
        assert!(json.contains("请翻译以下内容。"));
        assert!(json.contains("created_at"));
        assert!(json.contains("updated_at"));

        // 反序列化验证
        let deserialized: Prompt = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.id, prompt.id);
        assert_eq!(deserialized.title, prompt.title);
        assert_eq!(deserialized.content, prompt.content);
    }

    /// 测试 Prompt 序列化为 YAML 时字段完整
    #[test]
    fn test_prompt_yaml_serialization() {
        let prompt = Prompt {
            id: "p-003".to_string(),
            title: "写作助手".to_string(),
            content: "你是一个写作助手。".to_string(),
            created_at: "2025-06-01T00:00:00Z".to_string(),
            updated_at: "2025-06-01T00:00:00Z".to_string(),
        };

        let yaml = serde_yaml::to_string(&prompt).unwrap();
        assert!(yaml.contains("p-003"));
        assert!(yaml.contains("写作助手"));

        let deserialized: Prompt = serde_yaml::from_str(&yaml).unwrap();
        assert_eq!(deserialized.title, "写作助手");
    }

    /// 测试 CreatePromptRequest 反序列化
    #[test]
    fn test_create_prompt_request_deserialization() {
        let json = r#"{
            "title": "新提示词",
            "content": "这是提示词的内容。"
        }"#;

        let request: CreatePromptRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.title, "新提示词");
        assert_eq!(request.content, "这是提示词的内容。");
    }

    /// 测试 CreatePromptRequest 最小字段
    #[test]
    fn test_create_prompt_request_minimal() {
        let json = r#"{
            "title": "只有标题",
            "content": ""
        }"#;

        let request: CreatePromptRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.title, "只有标题");
        assert_eq!(request.content, "");
    }

    /// 测试 UpdatePromptRequest 完整字段反序列化
    #[test]
    fn test_update_prompt_request_full() {
        let json = r#"{
            "title": "更新的标题",
            "content": "更新的内容"
        }"#;

        let request: UpdatePromptRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.title, Some("更新的标题".to_string()));
        assert_eq!(request.content, Some("更新的内容".to_string()));
    }

    /// 测试 UpdatePromptRequest 部分更新（仅更新标题）
    #[test]
    fn test_update_prompt_request_partial_title() {
        let json = r#"{
            "title": "仅更新标题"
        }"#;

        let request: UpdatePromptRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.title, Some("仅更新标题".to_string()));
        assert!(request.content.is_none());
    }

    /// 测试 UpdatePromptRequest 部分更新（仅更新内容）
    #[test]
    fn test_update_prompt_request_partial_content() {
        let json = r#"{
            "content": "仅更新内容"
        }"#;

        let request: UpdatePromptRequest = serde_json::from_str(json).unwrap();
        assert!(request.title.is_none());
        assert_eq!(request.content, Some("仅更新内容".to_string()));
    }

    /// 测试 UpdatePromptRequest 空对象
    #[test]
    fn test_update_prompt_request_empty() {
        let json = r#"{}"#;

        let request: UpdatePromptRequest = serde_json::from_str(json).unwrap();
        assert!(request.title.is_none());
        assert!(request.content.is_none());
    }

    /// 测试 PromptsFile 包装结构体
    #[test]
    fn test_prompts_file_wrapper() {
        let prompts = vec![
            Prompt {
                id: "p-001".to_string(),
                title: "助手1".to_string(),
                content: "内容1".to_string(),
                created_at: "".to_string(),
                updated_at: "".to_string(),
            },
        ];

        let file = PromptsFile { prompts };
        assert_eq!(file.prompts.len(), 1);
        assert_eq!(file.prompts[0].id, "p-001");
    }
}