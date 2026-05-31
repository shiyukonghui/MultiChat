import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Switch,
  Chip,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Button,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { fetchModels, updateModel, createModel, deleteModel, updateModelDetail } from '../utils/api';
import ModelConfigDialog from '../components/AddModelDialog';
import type { ModelConfig } from '../types';

// 模型配置管理页面组件
// 展示所有模型列表，支持启用/禁用切换，添加新模型
interface ModelConfigPanelProps {
  onModelsChange?: () => void;
}

export default function ModelConfigPanel({ onModelsChange }: ModelConfigPanelProps) {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<ModelConfig | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // 加载模型列表
  const loadModels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchModels();
      setModels(data);
    } catch (err) {
      setError('无法加载模型配置，请确认后端服务是否正常运行');
      console.error('加载模型配置失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // 切换模型启用状态
  const handleToggleModel = async (id: string, enabled: boolean) => {
    try {
      await updateModel(id, enabled);
      // 更新本地状态
      setModels((prev) =>
        prev.map((m) => (m.id === id ? { ...m, enabled } : m))
      );
      onModelsChange?.();
      setSnackbar({
        open: true,
        message: `${enabled ? '已启用' : '已禁用'}模型`,
        severity: 'success',
      });
    } catch (err) {
      console.error('更新模型配置失败:', err);
      setSnackbar({
        open: true,
        message: '更新失败，请稍后重试',
        severity: 'error',
      });
    }
  };

  // 添加新模型
  const handleAddModel = async (model: Omit<ModelConfig, 'status' | 'reason'>) => {
    try {
      const newModel = await createModel(model);
      // 添加新模型到列表
      setModels((prev) => [...prev, newModel]);
      setDialogOpen(false);
      onModelsChange?.();
      setSnackbar({
        open: true,
        message: '模型添加成功',
        severity: 'success',
      });
    } catch (err) {
      console.error('添加模型失败:', err);
      setSnackbar({
        open: true,
        message: '添加模型失败，请检查配置后重试',
        severity: 'error',
      });
    }
  };

  // 删除模型
  const handleDeleteModel = async (id: string) => {
    try {
      await deleteModel(id);
      setModels((prev) => prev.filter((m) => m.id !== id));
      onModelsChange?.();
      setSnackbar({
        open: true,
        message: '模型已删除',
        severity: 'success',
      });
    } catch (err) {
      console.error('删除模型失败:', err);
      setSnackbar({
        open: true,
        message: '删除失败，请稍后重试',
        severity: 'error',
      });
    }
  };

  // 编辑模型
  const handleEditModel = (model: ModelConfig) => {
    setEditingModel(model);
    setDialogOpen(true);
  };

  // 更新模型
  const handleUpdateModel = async (id: string, model: Omit<ModelConfig, 'status' | 'reason'>) => {
    try {
      await updateModelDetail(id, model);
      setModels((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...model } : m))
      );
      setDialogOpen(false);
      setEditingModel(null);
      onModelsChange?.();
      setSnackbar({
        open: true,
        message: '模型更新成功',
        severity: 'success',
      });
    } catch (err) {
      console.error('更新模型失败:', err);
      setSnackbar({
        open: true,
        message: '更新失败，请稍后重试',
        severity: 'error',
      });
    }
  };

  // 关闭弹窗
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingModel(null);
  };

  // 关闭 Snackbar
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // 状态标签颜色映射
  const getStatusChip = (model: ModelConfig) => {
    if (!model.enabled) {
      return <Chip label="已禁用" size="small" color="default" variant="outlined" />;
    }
    switch (model.status) {
      case 'available':
        return <Chip label="可用" size="small" color="success" />;
      case 'unavailable':
        return <Chip label="不可用" size="small" color="error" />;
      default:
        return <Chip label="未知" size="small" color="warning" />;
    }
  };

  // 获取API格式显示文本
  const getApiFormatLabel = (format?: string) => {
    switch (format) {
      case 'openai-chat-completions':
        return 'OpenAI';
      default:
        return format || '未知';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 页面标题 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon color="primary" />
          <Typography variant="h5" component="h2">
            模型配置管理
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          添加模型
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        在此页面可以查看所有可用模型，并启用或禁用模型。禁用的模型将不参与对话请求。
      </Typography>

      {/* 加载中 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={
          <Box component="span" sx={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={loadModels}>
            重试
          </Box>
        }>
          {error}
        </Alert>
      )}

      {/* 模型列表 - 卡片视图 */}
      {!loading && !error && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
          {models.map((model) => (
            <Card key={model.id} variant="outlined" sx={{ position: 'relative' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" component="div">
                      {model.displayName || model.id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {model.id}
                    </Typography>
                  </Box>
                  {getStatusChip(model)}
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Provider: {model.provider}
                  </Typography>
                  {model.apiEndpoint && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Endpoint: {model.apiEndpoint}
                    </Typography>
                  )}
                  {model.apiFormat && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      API格式: {getApiFormatLabel(model.apiFormat)}
                    </Typography>
                  )}
                  {model.isMultimodal && (
                    <Chip label="多模态" size="small" color="primary" variant="outlined" sx={{ mt: 0.5 }} />
                  )}
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Switch
                    checked={model.enabled}
                    onChange={(_, checked) => handleToggleModel(model.id, checked)}
                  />
                  <Box>
                    <IconButton size="small" sx={{ mr: 0.5 }} onClick={() => handleEditModel(model)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeleteModel(model.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* 空状态 */}
      {!loading && !error && models.length === 0 && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            暂无模型配置
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ mt: 1 }}
          >
            添加第一个模型
          </Button>
        </Paper>
      )}

      {/* 添加/编辑模型弹窗 */}
      <ModelConfigDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleAddModel}
        onUpdate={handleUpdateModel}
        editModel={editingModel}
      />

      {/* 操作反馈提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
