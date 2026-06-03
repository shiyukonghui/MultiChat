import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Typography,
  Chip,
  Box,
  Snackbar,
  Alert,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { fetchPrompts, createPrompt, updatePrompt, deletePrompt } from '../utils/api';
import type { Prompt } from '../types';
import PromptForm from './PromptForm';

// 提示词管理弹窗组件属性
interface PromptDialogProps {
  open: boolean;
  onClose: () => void;
  activePromptId: string | null;
  onActivate: (id: string | null) => void;
  onPromptsChange: () => void;
}

/**
 * 提示词管理弹窗组件
 * 提供对系统提示词的完整 CRUD 操作和激活/取消激活管理
 */
export default function PromptDialog({
  open,
  onClose,
  activePromptId,
  onActivate,
  onPromptsChange,
}: PromptDialogProps) {
  // 提示词列表
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  // 加载状态
  const [loading, setLoading] = useState(false);
  // 当前是否显示创建表单
  const [showCreateForm, setShowCreateForm] = useState(false);
  // 当前编辑的提示词
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  // 删除确认的提示词 ID
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  // Snackbar 通知
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // 加载提示词列表
  const loadPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPrompts();
      // 按 updatedAt 降序排列
      const sorted = [...data].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setPrompts(sorted);
    } catch (error) {
      console.error('加载提示词列表失败:', error);
      setSnackbar({ open: true, message: '加载提示词列表失败', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  // 打开弹窗时加载提示词列表
  useEffect(() => {
    if (open) {
      loadPrompts();
      setShowCreateForm(false);
      setEditingPrompt(null);
      setDeleteConfirmId(null);
    }
  }, [open, loadPrompts]);

  // 创建提示词
  const handleCreate = useCallback(async (data: { title: string; content: string }) => {
    try {
      await createPrompt(data);
      setSnackbar({ open: true, message: '提示词创建成功', severity: 'success' });
      setShowCreateForm(false);
      loadPrompts();
      onPromptsChange();
    } catch (error) {
      console.error('创建提示词失败:', error);
      setSnackbar({ open: true, message: '创建提示词失败', severity: 'error' });
    }
  }, [loadPrompts, onPromptsChange]);

  // 更新提示词
  const handleUpdate = useCallback(async (data: { title: string; content: string }) => {
    if (!editingPrompt) return;
    try {
      await updatePrompt(editingPrompt.id, data);
      setSnackbar({ open: true, message: '提示词更新成功', severity: 'success' });
      setEditingPrompt(null);
      loadPrompts();
      onPromptsChange();
    } catch (error) {
      console.error('更新提示词失败:', error);
      setSnackbar({ open: true, message: '更新提示词失败', severity: 'error' });
    }
  }, [editingPrompt, loadPrompts, onPromptsChange]);

  // 删除提示词
  const handleDelete = useCallback(async (id: string) => {
    try {
      await deletePrompt(id);
      setSnackbar({ open: true, message: '提示词已删除', severity: 'success' });
      setDeleteConfirmId(null);
      // 如果删除的是当前激活的提示词，自动取消激活
      if (activePromptId === id) {
        onActivate(null);
      }
      loadPrompts();
      onPromptsChange();
    } catch (error) {
      console.error('删除提示词失败:', error);
      setSnackbar({ open: true, message: '删除提示词失败', severity: 'error' });
    }
  }, [activePromptId, onActivate, loadPrompts, onPromptsChange]);

  // 激活/取消激活提示词
  const handleToggleActivate = useCallback((id: string) => {
    if (activePromptId === id) {
      // 取消激活
      onActivate(null);
    } else {
      // 激活（自动取消之前激活的）
      onActivate(id);
    }
  }, [activePromptId, onActivate]);

  // 格式化日期时间
  const formatTime = (isoStr: string): string => {
    const date = new Date(isoStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 截取内容摘要（前 50 字符）
  const truncateContent = (content: string): string => {
    if (content.length <= 50) return content;
    return content.slice(0, 50) + '...';
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyIcon />
          系统提示词管理
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ ml: 'auto' }}
            title="关闭"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {/* 新建按钮 / 创建表单 / 编辑表单 */}
          {showCreateForm ? (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>新建提示词</Typography>
              <PromptForm
                onSubmit={handleCreate}
                onCancel={() => setShowCreateForm(false)}
              />
            </>
          ) : editingPrompt ? (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>编辑提示词</Typography>
              <PromptForm
                initialData={{ title: editingPrompt.title, content: editingPrompt.content }}
                onSubmit={handleUpdate}
                onCancel={() => setEditingPrompt(null)}
              />
            </>
          ) : (
            <>
              {/* 新建按钮 */}
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setShowCreateForm(true)}
                >
                  新建提示词
                </Button>
              </Box>

              <Divider sx={{ mb: 1 }} />

              {/* 提示词列表 */}
              {prompts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <SmartToyIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body1">
                    {loading ? '加载中...' : '暂无提示词，点击上方按钮创建'}
                  </Typography>
                </Box>
              ) : (
                <List dense sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  {prompts.map((prompt) => {
                    const isActive = activePromptId === prompt.id;
                    return (
                      <ListItem
                        key={prompt.id}
                        sx={{
                          border: isActive ? 1 : 0,
                          borderColor: 'primary.main',
                          borderRadius: 1,
                          mb: 0.5,
                          bgcolor: isActive ? 'action.selected' : 'transparent',
                        }}
                        secondaryAction={
                          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                            {/* 激活/取消激活按钮 */}
                            <IconButton
                              edge="end"
                              size="small"
                              color={isActive ? 'primary' : 'default'}
                              onClick={() => handleToggleActivate(prompt.id)}
                              title={isActive ? '取消激活' : '激活'}
                            >
                              {isActive ? (
                                <CheckCircleIcon fontSize="small" />
                              ) : (
                                <RadioButtonUncheckedIcon fontSize="small" />
                              )}
                            </IconButton>
                            {/* 编辑按钮 */}
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => setEditingPrompt(prompt)}
                              title="编辑"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            {/* 删除按钮 */}
                            {deleteConfirmId === prompt.id ? (
                              <>
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => handleDelete(prompt.id)}
                                  sx={{ minWidth: 40, fontSize: 12 }}
                                >
                                  确认
                                </Button>
                                <Button
                                  size="small"
                                  onClick={() => setDeleteConfirmId(null)}
                                  sx={{ minWidth: 40, fontSize: 12 }}
                                >
                                  取消
                                </Button>
                              </>
                            ) : (
                              <IconButton
                                edge="end"
                                size="small"
                                onClick={() => setDeleteConfirmId(prompt.id)}
                                title="删除"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: isActive ? 'bold' : 'normal' }}>
                                {prompt.title}
                              </Typography>
                              {isActive && (
                                <Chip
                                  label="已激活"
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                  sx={{ height: 20, '& .MuiChip-label': { px: 0.5, fontSize: 11 } }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                              >
                                {truncateContent(prompt.content)}
                              </Typography>
                              <Typography variant="caption" color="text.disabled">
                                {formatTime(prompt.updatedAt)}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar 通知 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ open: false, message: '', severity: 'success' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ open: false, message: '', severity: 'success' })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}