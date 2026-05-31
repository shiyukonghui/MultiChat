// 历史记录存储模块：负责管理聊天历史记录的读写操作
// 历史记录持久化存储在 data/histories.yaml 文件中

use crate::models::ChatMessage;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

/// 历史记录结构体：代表一次完整的对话会话
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
struct HistoryRecords {
    /// 历史记录列表
    histories: Vec<HistoryRecord>,
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
