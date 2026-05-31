import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Alert,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LinkIcon from '@mui/icons-material/Link';
import type { ModelFormData, ModelConfig } from '../types';
import { DEFAULT_MODEL_FORM_DATA, API_FORMAT_OPTIONS, MODEL_SERIES_OPTIONS } from '../types';

// 模型配置弹窗组件属性
interface ModelConfigDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (model: Omit<ModelConfig, 'status' | 'reason'>) => void;
  onUpdate?: (id: string, model: Omit<ModelConfig, 'status' | 'reason'>) => void;
  editModel?: ModelConfig | null;
}

// Tab 面板组件
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`model-config-tabpanel-${index}`}
      aria-labelledby={`model-config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

// 将 ModelConfig 转换为 ModelFormData
function modelToFormData(model: ModelConfig): ModelFormData {
  return {
    id: model.id,
    apiFormat: model.apiFormat,
    apiEndpoint: model.apiEndpoint,
    apiKey: model.apiKey || '',
    isMultimodal: model.isMultimodal,
    modelSeries: model.modelSeries || 'default',
    displayName: model.displayName || '',
    contextWindowInput: model.contextWindowInput || 184000,
    contextWindowOutput: model.contextWindowOutput || 16000,
    toolCallRounds: model.toolCallRounds || 200,
    useFullUrl: model.useFullUrl,
    configMode: 'custom',
    provider: model.provider === 'custom' ? '' : model.provider,
  };
}

// 模型配置弹窗组件（支持添加和编辑两种模式）
export default function ModelConfigDialog({ open, onClose, onSubmit, onUpdate, editModel }: ModelConfigDialogProps) {
  const isEditMode = !!editModel;

  // 表单数据状态
  const [formData, setFormData] = useState<ModelFormData>(DEFAULT_MODEL_FORM_DATA);
  // 表单验证错误
  const [errors, setErrors] = useState<Record<string, string>>({});
  // 当前选中的 Tab
  const [tabValue, setTabValue] = useState(1);

  // 当 editModel 变化时回填表单
  useEffect(() => {
    if (editModel) {
      setFormData(modelToFormData(editModel));
      setErrors({});
    } else {
      setFormData(DEFAULT_MODEL_FORM_DATA);
      setErrors({});
    }
  }, [editModel, open]);

  // 处理字段变化
  const handleChange = useCallback((field: keyof ModelFormData, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // 处理 Tab 切换
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setFormData((prev) => ({
      ...prev,
      configMode: newValue === 0 ? 'provider' : 'custom',
    }));
  };

  // 验证表单
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.id.trim()) {
      newErrors.id = '请输入模型 ID';
    }

    if (!formData.apiEndpoint.trim()) {
      newErrors.apiEndpoint = '请输入请求地址';
    }

    if (!formData.apiKey.trim()) {
      newErrors.apiKey = '请输入 API 密钥';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // 提交表单
  const handleSubmit = useCallback(() => {
    if (!validateForm()) {
      return;
    }

    const modelConfig: Omit<ModelConfig, 'status' | 'reason'> = {
      id: formData.id,
      provider: formData.configMode === 'provider' ? formData.provider || 'custom' : 'custom',
      enabled: editModel ? editModel.enabled : true,
      apiFormat: formData.apiFormat,
      apiEndpoint: formData.apiEndpoint,
      apiKey: formData.apiKey,
      isMultimodal: formData.isMultimodal,
      modelSeries: formData.modelSeries,
      displayName: formData.displayName,
      contextWindowInput: formData.contextWindowInput,
      contextWindowOutput: formData.contextWindowOutput,
      toolCallRounds: formData.toolCallRounds,
      useFullUrl: formData.useFullUrl,
    };

    if (isEditMode && onUpdate && editModel) {
      onUpdate(editModel.id, modelConfig);
    } else {
      onSubmit(modelConfig);
    }

    setFormData(DEFAULT_MODEL_FORM_DATA);
    setErrors({});
  }, [formData, validateForm, onSubmit, onUpdate, isEditMode, editModel]);

  // 关闭弹窗
  const handleClose = useCallback(() => {
    setFormData(DEFAULT_MODEL_FORM_DATA);
    setErrors({});
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>{isEditMode ? '编辑模型' : '添加模型'}</DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        {/* Tab 切换 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="模型配置模式"
            variant="fullWidth"
          >
            <Tab label="模型服务商" id="model-config-tab-0" />
            <Tab label="自定义配置" id="model-config-tab-1" />
          </Tabs>
        </Box>

        {/* 模型服务商 Tab */}
        <TabPanel value={tabValue} index={0}>
          <Alert severity="info" sx={{ mb: 2 }}>
            选择预设的模型服务商，快速添加常用模型
          </Alert>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>选择模型服务商</InputLabel>
            <Select
              value={formData.provider}
              label="选择模型服务商"
              onChange={(e) => handleChange('provider', e.target.value)}
            >
              <MenuItem value="openai">OpenAI</MenuItem>
              <MenuItem value="anthropic">Anthropic</MenuItem>
              <MenuItem value="google">Google (Gemini)</MenuItem>
              <MenuItem value="azure">Azure OpenAI</MenuItem>
            </Select>
          </FormControl>
        </TabPanel>

        {/* 自定义配置 Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box component="form" noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* API 格式 */}
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, color: 'error.main' }}>
                * API 格式
              </Typography>
              <FormControl fullWidth error={!!errors.apiFormat}>
                <Select
                  value={formData.apiFormat}
                  onChange={(e) => handleChange('apiFormat', e.target.value)}
                  displayEmpty
                >
                  {API_FORMAT_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* 自定义请求地址 */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: 'error.main' }}>
                  * 自定义请求地址
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LinkIcon fontSize="small" color="action" />
                  <Typography variant="caption" color="text.secondary">
                    完整 URL
                  </Typography>
                  <Switch
                    size="small"
                    checked={formData.useFullUrl}
                    onChange={(e) => handleChange('useFullUrl', e.target.checked)}
                  />
                </Box>
              </Box>
              <TextField
                fullWidth
                placeholder="e.g. https://api.openai.com/v1"
                value={formData.apiEndpoint}
                onChange={(e) => handleChange('apiEndpoint', e.target.value)}
                error={!!errors.apiEndpoint}
                helperText={errors.apiEndpoint}
              />
              <Alert severity="info" sx={{ mt: 1 }} icon={<LinkIcon />}>
                <Typography variant="caption">
                  请填写兼容 OpenAI API 的服务端点地址，不要以斜杠结尾。
                  <br />
                  /chat/completions 将会被补充到你填写的地址末尾。
                </Typography>
              </Alert>
            </Box>

            {/* 模型 ID */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: 'error.main' }}>
                  * 模型 ID
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={formData.isMultimodal}
                      onChange={(e) => handleChange('isMultimodal', e.target.checked)}
                    />
                  }
                  label={
                    <Typography variant="caption" color="text.secondary">
                      多模态
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
              </Box>
              <TextField
                fullWidth
                placeholder="输入模型 ID"
                value={formData.id}
                onChange={(e) => handleChange('id', e.target.value)}
                error={!!errors.id}
                helperText={errors.id}
                disabled={isEditMode}
              />
              {isEditMode && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  模型 ID 创建后不可修改
                </Typography>
              )}
            </Box>

            {/* API 密钥 */}
            <Box>
              <Typography variant="body2" sx={{ mb: 0.5, color: 'error.main' }}>
                * API 密钥
              </Typography>
              <TextField
                fullWidth
                type="password"
                placeholder={isEditMode ? '留空则保持原密钥不变' : '输入 API 密钥'}
                value={formData.apiKey}
                onChange={(e) => handleChange('apiKey', e.target.value)}
                error={!!errors.apiKey}
                helperText={errors.apiKey}
              />
            </Box>

            {/* 高级配置 - 可折叠 */}
            <Accordion defaultExpanded={false} sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ px: 0, minHeight: 40 }}
              >
                <Typography variant="body2">高级配置</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 0, pt: 0 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* 模型系列 */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      模型系列
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      针对特定模型系列优化了 Prompt 和超参，未选择时使用默认配置。
                    </Typography>
                    <FormControl fullWidth>
                      <Select
                        value={formData.modelSeries}
                        onChange={(e) => handleChange('modelSeries', e.target.value)}
                        displayEmpty
                      >
                        {MODEL_SERIES_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* 模型展示名称 */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      模型展示名称
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                      在模型列表中展示的名称，未设置时默认显示 Model ID。
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="请输入模型展示名称"
                      value={formData.displayName}
                      onChange={(e) => handleChange('displayName', e.target.value)}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <Chip
                              label={`${formData.displayName.length}/32`}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, '& .MuiChip-label': { px: 0.5, fontSize: 12 } }}
                            />
                          ),
                        },
                      }}
                    />
                  </Box>

                  {/* 上下文窗口 */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      上下文窗口
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        label="输入"
                        type="number"
                        value={formData.contextWindowInput}
                        onChange={(e) => handleChange('contextWindowInput', parseInt(e.target.value) || 0)}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="输出"
                        type="number"
                        value={formData.contextWindowOutput}
                        onChange={(e) => handleChange('contextWindowOutput', parseInt(e.target.value) || 0)}
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  </Box>

                  {/* 工具调用轮次 */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      工具调用轮次
                    </Typography>
                    <TextField
                      fullWidth
                      type="number"
                      value={formData.toolCallRounds}
                      onChange={(e) => handleChange('toolCallRounds', parseInt(e.target.value) || 0)}
                    />
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        </TabPanel>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          disabled={tabValue === 0 && !formData.provider}
        >
          {isEditMode ? '保存修改' : '添加模型'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}