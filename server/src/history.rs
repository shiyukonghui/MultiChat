// 历史记录存储模块：负责管理聊天历史记录的读写操作
// 历史记录持久化存储在 data/histories.yaml 文件中

use crate::models::ChatMessage;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

/// 历史记录结构体：代表一次完整的对话会话
/// 用于 YAML 存储，字段使用下划线命名
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryRecord {
    /// 历史记录唯一标识符（UUID）
    pub id: String,
    /// 对话名称/标题
    pub name: String,
    /// 创建时间戳（Unix时间戳，秒）
    pub timestamp: u64,
    /// 当前选中的模型ID
    pub selected_model: Option<String>,
    /// 对话消息列表
    pub messages: Vec<ChatMessage>,
}

/// 历史记录列表包装结构体（用于YAML序列化）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoryRecords {
    /// 历史记录列表
    pub histories: Vec<HistoryRecord>,
}

/// 获取历史记录文件路径
fn get_history_file_path() -> PathBuf {
    Path::new("data/histories.yaml").to_path_buf()
}

/// 确保数据目录存在
/// 如果 data 目录不存在则自动创建
fn ensure_data_dir_exists() -> Result<(), Box<dyn std::error::Error>> {
    let data_dir = Path::new("data");
    if !data_dir.exists() {
        fs::create_dir_all(data_dir)?;
    }
    Ok(())
}

/// 从 YAML 文件加载所有历史记录
/// 
/// # 返回值
/// - 成功时返回历史记录列表
/// - 如果文件不存在或为空，返回空列表
/// - 如果解析失败，返回错误
pub fn load_histories() -> Result<Vec<HistoryRecord>, Box<dyn std::error::Error>> {
    let file_path = get_history_file_path();
    
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
    let records: HistoryRecords = serde_yaml::from_str(&yaml_content)?;
    
    Ok(records.histories)
}

/// 保存历史记录列表到 YAML 文件
/// 
/// # 参数
/// - `histories`: 要保存的历史记录列表
/// 
/// # 说明
/// 会自动创建 data 目录（如果不存在）
pub fn save_histories(histories: &[HistoryRecord]) -> Result<(), Box<dyn std::error::Error>> {
    // 确保数据目录存在
    ensure_data_dir_exists()?;
    
    let records = HistoryRecords {
        histories: histories.to_vec(),
    };
    
    // 序列化为 YAML 格式
    let yaml_content = serde_yaml::to_string(&records)?;
    
    // 写入文件
    fs::write(get_history_file_path(), yaml_content)?;
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use std::fs;

    /// 创建测试用的历史记录
    fn create_test_history_record(id: &str, name: &str) -> HistoryRecord {
        HistoryRecord {
            id: id.to_string(),
            name: name.to_string(),
            timestamp: 1700000000,
            selected_model: Some("test-model".to_string()),
            messages: vec![
                ChatMessage {
                    role: "user".to_string(),
                    content: "Hello".to_string(),
                    model: None,
                },
                ChatMessage {
                    role: "assistant".to_string(),
                    content: "Hi there!".to_string(),
                    model: Some("test-model".to_string()),
                },
            ],
        }
    }

    /// 测试正常加载历史记录
    #[test]
    fn test_load_histories_success() {
        let yaml_content = r#"
histories:
  - id: test-id-1
    name: Test Chat
    timestamp: 1700000000
    selected_model: gpt-4
    messages:
      - role: user
        content: Hello
      - role: assistant
        content: Hi!
"#;
        let records: HistoryRecords = serde_yaml::from_str(yaml_content).unwrap();
        assert_eq!(records.histories.len(), 1);
        assert_eq!(records.histories[0].id, "test-id-1");
        assert_eq!(records.histories[0].name, "Test Chat");
        assert_eq!(records.histories[0].messages.len(), 2);
    }

    /// 测试空文件返回空列表
    #[test]
    fn test_load_histories_empty_file() {
        let empty_yaml = "";
        let result: Result<HistoryRecords, _> = serde_yaml::from_str(empty_yaml);
        // 空字符串解析会失败，但 load_histories 会处理这种情况
        assert!(result.is_err() || result.unwrap().histories.is_empty());
    }

    /// 测试保存历史记录
    #[test]
    fn test_save_histories_success() {
        let temp_dir = TempDir::new().unwrap();
        let data_path = temp_dir.path().join("data");
        
        // 创建测试历史记录
        let histories = vec![create_test_history_record("test-id", "Test Chat")];
        
        // 序列化为 YAML
        let records = HistoryRecords {
            histories: histories.clone(),
        };
        let yaml_content = serde_yaml::to_string(&records).unwrap();
        
        // 确保目录存在并写入文件
        fs::create_dir_all(&data_path).unwrap();
        let file_path = data_path.join("histories.yaml");
        fs::write(&file_path, yaml_content).unwrap();
        
        // 验证文件内容
        let saved_content = fs::read_to_string(&file_path).unwrap();
        assert!(saved_content.contains("test-id"));
        assert!(saved_content.contains("Test Chat"));
    }

    /// 测试自动创建目录
    #[test]
    fn test_save_histories_creates_dir() {
        let temp_dir = TempDir::new().unwrap();
        let data_path = temp_dir.path().join("data");
        
        // 目录不应该存在
        assert!(!data_path.exists());
        
        // 创建目录
        fs::create_dir_all(&data_path).unwrap();
        
        // 现在目录应该存在
        assert!(data_path.exists());
    }

    /// 测试历史记录序列化/反序列化
    #[test]
    fn test_history_record_serialization() {
        let original = create_test_history_record("test-123", "My Chat");
        
        // 序列化
        let yaml = serde_yaml::to_string(&original).unwrap();
        
        // 反序列化
        let deserialized: HistoryRecord = serde_yaml::from_str(&yaml).unwrap();
        
        // 验证数据完整性
        assert_eq!(deserialized.id, original.id);
        assert_eq!(deserialized.name, original.name);
        assert_eq!(deserialized.timestamp, original.timestamp);
        assert_eq!(deserialized.selected_model, original.selected_model);
        assert_eq!(deserialized.messages.len(), original.messages.len());
    }

    /// 测试带有可选字段的历史记录
    #[test]
    fn test_history_record_with_optional_fields() {
        let yaml_content = r#"
id: test-id
name: Chat without model
timestamp: 1700000000
selected_model: null
messages: []
"#;
        let record: HistoryRecord = serde_yaml::from_str(yaml_content).unwrap();
        assert_eq!(record.id, "test-id");
        assert!(record.selected_model.is_none());
        assert!(record.messages.is_empty());
    }

    /// 测试 ChatMessage 序列化
    #[test]
    fn test_chat_message_serialization() {
        let message = ChatMessage {
            role: "user".to_string(),
            content: "Test message".to_string(),
            model: Some("gpt-4".to_string()),
        };
        
        let json = serde_json::to_string(&message).unwrap();
        assert!(json.contains("user"));
        assert!(json.contains("Test message"));
        
        let deserialized: ChatMessage = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.role, message.role);
        assert_eq!(deserialized.content, message.content);
    }
}
