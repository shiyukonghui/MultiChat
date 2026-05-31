// 配置加载模块：负责从 YAML 文件读取模型配置，并从环境变量获取 API Key

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

/// 应用配置顶层结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub models: Vec<ModelConfig>,
}

/// 单个模型的配置信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelConfig {
    /// 模型唯一标识
    pub id: String,
    /// 服务提供商 (openai / anthropic / ...)
    pub provider: String,
    /// 具体模型名称
    pub model: String,
    /// 是否启用
    #[serde(default = "default_enabled")]
    pub enabled: bool,
    /// 请求超时时间（秒）
    #[serde(default = "default_timeout")]
    pub timeout_seconds: u64,
    /// 最大 token 数
    #[serde(default = "default_max_tokens")]
    pub max_tokens: u32,
    /// 模型状态（例如 "active" 或 "inactive"）
    #[serde(default = "default_status")]
    pub status: String,
    /// API Key，直接保存到 YAML 文件
    #[serde(default)]
    pub api_key: String,

    // 新增字段
    /// API 格式
    #[serde(default = "default_api_format")]
    pub api_format: String,
    /// API 端点地址
    #[serde(default)]
    pub api_endpoint: String,
    /// 是否支持多模态
    #[serde(default)]
    pub is_multimodal: bool,
    /// 模型系列
    #[serde(default = "default_model_series")]
    pub model_series: String,
    /// 模型展示名称（用于UI显示）
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    /// 上下文窗口 - 输入
    #[serde(default = "default_context_window_input")]
    pub context_window_input: u32,
    /// 上下文窗口 - 输出
    #[serde(default = "default_context_window_output")]
    pub context_window_output: u32,
    /// 工具调用轮次
    #[serde(default = "default_tool_call_rounds")]
    pub tool_call_rounds: u32,
    /// 是否使用完整 URL
    #[serde(default)]
    pub use_full_url: bool,
}

// 默认值函数
fn default_enabled() -> bool {
    true
}

fn default_timeout() -> u64 {
    60
}

fn default_max_tokens() -> u32 {
    4096
}

fn default_status() -> String {
    "active".to_string()
}

fn default_api_format() -> String {
    "openai-chat-completions".to_string()
}

fn default_model_series() -> String {
    "default".to_string()
}

fn default_context_window_input() -> u32 {
    184000
}

fn default_context_window_output() -> u32 {
    16000
}

fn default_tool_call_rounds() -> u32 {
    200
}

/// 从 YAML 文件加载配置
pub fn load_config() -> Result<AppConfig, Box<dyn std::error::Error>> {
    // 定位配置文件路径（相对于项目根目录的 server 目录）
    let config_path = Path::new("config/models.yaml");

    // 读取并解析 YAML 文件
    let yaml_content = fs::read_to_string(config_path)?;
    let config: AppConfig = serde_yaml::from_str(&yaml_content)?;

    // 日志输出各模型的配置情况
    for model in &config.models {
        let masked_key = if model.api_key.len() > 4 {
            format!("{}****", &model.api_key[..4])
        } else if model.api_key.is_empty() {
            "<未设置>".to_string()
        } else {
            "****".to_string()
        };

        tracing::info!(
            "模型 [{}] (provider: {}) API Key: {}",
            model.id,
            model.provider,
            masked_key
        );
    }

    Ok(config)
}

/// 获取配置文件路径
pub fn get_config_path() -> PathBuf {
    Path::new("config/models.yaml").to_path_buf()
}

/// 保存模型配置到 YAML 文件
pub fn save_config(models: &[ModelConfig]) -> Result<(), Box<dyn std::error::Error>> {
    let config = AppConfig {
        models: models.to_vec(),
    };
    let yaml_content = serde_yaml::to_string(&config)?;
    fs::write(get_config_path(), yaml_content)?;
    Ok(())
}
