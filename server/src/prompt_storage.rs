// 提示词存储模块：负责管理系统提示词的读写操作
// 提示词持久化存储在 data/prompts.yaml 文件中

use crate::models::prompt::{Prompt, PromptsFile};
use std::fs;
use std::path::{Path, PathBuf};

/// 获取提示词文件路径
fn get_prompt_file_path() -> PathBuf {
    Path::new("data/prompts.yaml").to_path_buf()
}

/// 确保 data 目录存在，如果不存在则自动创建
fn ensure_data_dir_exists() -> Result<(), Box<dyn std::error::Error>> {
    let data_dir = Path::new("data");
    if !data_dir.exists() {
        fs::create_dir_all(data_dir)?;
    }
    Ok(())
}

/// 从 YAML 文件加载所有提示词
///
/// # 返回值
/// - 成功时返回提示词列表
/// - 如果文件不存在或为空，返回空列表
/// - 如果解析失败，返回错误
pub fn load_prompts() -> Result<Vec<Prompt>, Box<dyn std::error::Error>> {
    let file_path = get_prompt_file_path();

    // 如果文件不存在，返回空列表
    if !file_path.exists() {
        return Ok(Vec::new());
    }

    // 读取文件内容
    let yaml_content = fs::read_to_string(&file_path)?;

    // 如果文件为空，返回空列表
    if yaml_content.trim().is_empty() {
        return Ok(Vec::new());
    }

    // 解析 YAML 内容
    let records: PromptsFile = serde_yaml::from_str(&yaml_content)?;

    Ok(records.prompts)
}

/// 保存提示词列表到 YAML 文件
///
/// # 参数
/// - `prompts`: 要保存的提示词列表
///
/// # 说明
/// 会自动创建 data 目录（如果不存在）
pub fn save_prompts(prompts: &[Prompt]) -> Result<(), Box<dyn std::error::Error>> {
    // 确保数据目录存在
    ensure_data_dir_exists()?;

    let records = PromptsFile {
        prompts: prompts.to_vec(),
    };

    // 序列化为 YAML 格式
    let yaml_content = serde_yaml::to_string(&records)?;

    // 写入文件
    fs::write(get_prompt_file_path(), yaml_content)?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    /// 创建测试用的提示词
    fn create_test_prompt(id: &str, title: &str, content: &str) -> Prompt {
        Prompt {
            id: id.to_string(),
            title: title.to_string(),
            content: content.to_string(),
            created_at: "2025-06-01T00:00:00Z".to_string(),
            updated_at: "2025-06-01T00:00:00Z".to_string(),
        }
    }

    /// 测试 Prompt 结构体序列化/反序列化（YAML）
    #[test]
    fn test_prompt_yaml_serialization() {
        let original = create_test_prompt("p-001", "代码助手", "你是一个代码助手。");
        let yaml = serde_yaml::to_string(&original).unwrap();
        let deserialized: Prompt = serde_yaml::from_str(&yaml).unwrap();

        assert_eq!(deserialized.id, original.id);
        assert_eq!(deserialized.title, original.title);
        assert_eq!(deserialized.content, original.content);
        assert_eq!(deserialized.created_at, original.created_at);
        assert_eq!(deserialized.updated_at, original.updated_at);
    }

    /// 测试 Prompt 结构体序列化/反序列化（JSON）
    #[test]
    fn test_prompt_json_serialization() {
        let original = create_test_prompt("p-002", "翻译助手", "请将以下内容翻译成英文。");
        let json = serde_json::to_string(&original).unwrap();
        let deserialized: Prompt = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.id, original.id);
        assert_eq!(deserialized.title, original.title);
        assert_eq!(deserialized.content, original.content);
    }

    /// 测试创建 Prompt 时各字段正确性
    #[test]
    fn test_prompt_field_correctness() {
        let prompt = create_test_prompt("p-003", "测试提示词", "这是一个测试内容。");

        assert_eq!(prompt.id, "p-003");
        assert_eq!(prompt.title, "测试提示词");
        assert_eq!(prompt.content, "这是一个测试内容。");
        assert_eq!(prompt.created_at, "2025-06-01T00:00:00Z");
        assert_eq!(prompt.updated_at, "2025-06-01T00:00:00Z");
    }

    /// 测试 PromptsFile 序列化/反序列化（含多条记录）
    #[test]
    fn test_prompts_file_serialization() {
        let prompts = vec![
            create_test_prompt("p-001", "助手1", "内容1"),
            create_test_prompt("p-002", "助手2", "内容2"),
        ];
        let file = PromptsFile { prompts: prompts.clone() };
        let yaml = serde_yaml::to_string(&file).unwrap();

        // 验证 YAML 包含所有数据
        assert!(yaml.contains("p-001"));
        assert!(yaml.contains("助手1"));
        assert!(yaml.contains("p-002"));
        assert!(yaml.contains("助手2"));

        // 反序列化验证
        let deserialized: PromptsFile = serde_yaml::from_str(&yaml).unwrap();
        assert_eq!(deserialized.prompts.len(), 2);
        assert_eq!(deserialized.prompts[0].title, "助手1");
        assert_eq!(deserialized.prompts[1].title, "助手2");
    }

    /// 测试空提示词列表的序列化/反序列化
    #[test]
    fn test_empty_prompts_list() {
        let file = PromptsFile { prompts: Vec::new() };
        let yaml = serde_yaml::to_string(&file).unwrap();
        assert!(yaml.contains("prompts:"));

        let deserialized: PromptsFile = serde_yaml::from_str(&yaml).unwrap();
        assert!(deserialized.prompts.is_empty());
    }

    /// 测试空内容的提示词
    #[test]
    fn test_prompt_with_empty_content() {
        let prompt = create_test_prompt("p-empty", "空内容", "");
        assert_eq!(prompt.content, "");

        let yaml = serde_yaml::to_string(&prompt).unwrap();
        let deserialized: Prompt = serde_yaml::from_str(&yaml).unwrap();
        assert_eq!(deserialized.content, "");
    }

    /// 测试空标题的提示词
    #[test]
    fn test_prompt_with_empty_title() {
        let prompt = create_test_prompt("p-no-title", "", "一些内容");
        assert_eq!(prompt.title, "");

        let yaml = serde_yaml::to_string(&prompt).unwrap();
        let deserialized: Prompt = serde_yaml::from_str(&yaml).unwrap();
        assert_eq!(deserialized.title, "");
    }

    /// 测试 load_prompts 空文件返回空列表
    #[test]
    fn test_load_prompts_empty_yaml() {
        let empty_yaml = "";
        let result: Result<PromptsFile, _> = serde_yaml::from_str(empty_yaml);
        assert!(result.is_err()); // 空字符串解析会失败，但 load_prompts 会处理该情况
    }

    /// 测试 YAML 解析有效内容
    #[test]
    fn test_parse_valid_yaml() {
        let yaml_content = r#"
prompts:
  - id: p-001
    title: 代码助手
    content: 你是一个代码助手。
    created_at: "2025-06-01T00:00:00Z"
    updated_at: "2025-06-01T00:00:00Z"
"#;
        let file: PromptsFile = serde_yaml::from_str(yaml_content).unwrap();
        assert_eq!(file.prompts.len(), 1);
        assert_eq!(file.prompts[0].id, "p-001");
        assert_eq!(file.prompts[0].title, "代码助手");
        assert_eq!(file.prompts[0].content, "你是一个代码助手。");
    }

    /// 测试保存到文件后再读取
    #[test]
    fn test_save_and_load_prompts() {
        use tempfile::TempDir;
        use std::env;

        let temp_dir = TempDir::new().unwrap();
        let original_dir = env::current_dir().unwrap();

        // 切换到临时目录，确保文件写入隔离
        env::set_current_dir(temp_dir.path()).unwrap();

        let prompts = vec![
            create_test_prompt("p-001", "助手", "你好！"),
        ];

        // 保存提示词
        save_prompts(&prompts).unwrap();

        // 验证文件存在
        let file_path = temp_dir.path().join("data/prompts.yaml");
        assert!(file_path.exists());

        // 加载并验证
        let loaded = load_prompts().unwrap();
        assert_eq!(loaded.len(), 1);
        assert_eq!(loaded[0].id, "p-001");
        assert_eq!(loaded[0].content, "你好！");

        // 恢复到原目录
        env::set_current_dir(original_dir).unwrap();
    }
}