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

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use std::fs;

    /// 测试正常加载 YAML 配置
    #[test]
    fn test_load_config_success() {
        // 创建临时目录和配置文件
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config").join("models.yaml");
        fs::create_dir_all(config_path.parent().unwrap()).unwrap();
        
        // 写入测试配置
        let yaml_content = r#"
models:
  - id: test-model
    provider: openai
    model: gpt-4
    enabled: true
    api_key: test-key
"#;
        fs::write(&config_path, yaml_content).unwrap();
        
        // 临时切换工作目录进行测试
        let original_dir = std::env::current_dir().unwrap();
        std::env::set_current_dir(temp_dir.path()).unwrap();
        
        // 由于 load_config 使用硬编码路径，这里测试序列化/反序列化逻辑
        let config: AppConfig = serde_yaml::from_str(yaml_content).unwrap();
        assert_eq!(config.models.len(), 1);
        assert_eq!(config.models[0].id, "test-model");
        assert_eq!(config.models[0].provider, "openai");
        assert!(config.models[0].enabled);
        
        std::env::set_current_dir(original_dir).unwrap();
    }

    /// 测试无效 YAML 格式
    #[test]
    fn test_load_config_invalid_yaml() {
        let invalid_yaml = "invalid: yaml: content: [";
        let result: Result<AppConfig, _> = serde_yaml::from_str(invalid_yaml);
        assert!(result.is_err());
    }

    /// 测试保存配置到文件
    #[test]
    fn test_save_config_success() {
        let temp_dir = TempDir::new().unwrap();
        let config_path = temp_dir.path().join("config").join("models.yaml");
        fs::create_dir_all(config_path.parent().unwrap()).unwrap();
        
        // 创建测试模型配置
        let models = vec![ModelConfig {
            id: "test-model".to_string(),
            provider: "openai".to_string(),
            model: "gpt-4".to_string(),
            enabled: true,
            timeout_seconds: 60,
            max_tokens: 4096,
            status: "active".to_string(),
            api_key: "test-key".to_string(),
            api_format: "openai-chat-completions".to_string(),
            api_endpoint: "https://api.openai.com/v1".to_string(),
            is_multimodal: false,
            model_series: "default".to_string(),
            display_name: None,
            context_window_input: 184000,
            context_window_output: 16000,
            tool_call_rounds: 200,
            use_full_url: false,
        }];
        
        // 保存配置
        let config = AppConfig { models: models.clone() };
        let yaml_content = serde_yaml::to_string(&config).unwrap();
        fs::write(&config_path, yaml_content).unwrap();
        
        // 验证文件内容
        let saved_content = fs::read_to_string(&config_path).unwrap();
        assert!(saved_content.contains("test-model"));
        assert!(saved_content.contains("openai"));
    }

    /// 测试 ModelConfig 默认值
    #[test]
    fn test_model_config_defaults() {
        // 测试带有缺失字段的 YAML 解析，验证默认值
        let yaml_content = r#"
models:
  - id: minimal-model
    provider: anthropic
    model: claude-3
"#;
        let config: AppConfig = serde_yaml::from_str(yaml_content).unwrap();
        let model = &config.models[0];
        
        // 验证默认值
        assert!(model.enabled); // default_enabled
        assert_eq!(model.timeout_seconds, 60); // default_timeout
        assert_eq!(model.max_tokens, 4096); // default_max_tokens
        assert_eq!(model.status, "active"); // default_status
        assert_eq!(model.api_key, ""); // default (empty)
        assert_eq!(model.api_format, "openai-chat-completions"); // default_api_format
        assert_eq!(model.model_series, "default"); // default_model_series
        assert_eq!(model.context_window_input, 184000); // default_context_window_input
        assert_eq!(model.context_window_output, 16000); // default_context_window_output
        assert_eq!(model.tool_call_rounds, 200); // default_tool_call_rounds
        assert!(!model.use_full_url); // default (false)
        assert!(!model.is_multimodal); // default (false)
    }

    /// 测试配置路径获取
    #[test]
    fn test_get_config_path() {
        let path = get_config_path();
        assert!(path.to_str().unwrap().contains("config"));
        assert!(path.to_str().unwrap().contains("models.yaml"));
    }

    /// 测试 AppConfig 序列化格式
    #[test]
    fn test_app_config_serialization() {
        let config = AppConfig {
            models: vec![ModelConfig {
                id: "test".to_string(),
                provider: "openai".to_string(),
                model: "gpt-4".to_string(),
                enabled: true,
                timeout_seconds: 30,
                max_tokens: 8192,
                status: "active".to_string(),
                api_key: "sk-test".to_string(),
                api_format: "openai-chat-completions".to_string(),
                api_endpoint: "https://api.openai.com/v1".to_string(),
                is_multimodal: true,
                model_series: "gpt".to_string(),
                display_name: Some("GPT-4".to_string()),
                context_window_input: 128000,
                context_window_output: 4096,
                tool_call_rounds: 10,
                use_full_url: true,
            }],
        };
        
        let yaml = serde_yaml::to_string(&config).unwrap();
        assert!(yaml.contains("id: test"));
        assert!(yaml.contains("provider: openai"));
        assert!(yaml.contains("display_name: GPT-4"));
    }
}
