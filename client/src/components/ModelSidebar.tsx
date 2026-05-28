import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import type { ModelStatus, ModelRunStatus } from '../types';

// ModelSidebar 的 Props
interface ModelSidebarProps {
  modelStatuses: Record<string, ModelStatus>;
  selectedModel: string | null;
  onSelectModel: (model: string) => void;
}

// 根据模型状态返回对应图标
function ModelStatusIcon({ status }: { status: ModelRunStatus }) {
  switch (status) {
    case 'streaming':
      return (
        <CircularProgress
          size={20}
          color="primary"
          aria-label="正在回复中"
        />
      );
    case 'done':
      return (
        <Tooltip title="回复完成">
          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
        </Tooltip>
      );
    case 'error':
      return (
        <Tooltip title="回复失败">
          <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />
        </Tooltip>
      );
    case 'pending':
    default:
      return (
        <HourglassEmptyIcon
          sx={{ color: 'text.disabled', fontSize: 20 }}
        />
      );
  }
}

// 模型侧边栏组件
// 展示所有已启用模型的实时状态，支持点击切换查看
export default function ModelSidebar({
  modelStatuses,
  selectedModel,
  onSelectModel,
}: ModelSidebarProps) {
  const modelIds = Object.keys(modelStatuses);

  // 没有任何模型时显示空状态
  if (modelIds.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          模型列表
        </Typography>
        <Typography variant="body2" color="text.disabled">
          暂无可用模型
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* 标题 */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Typography variant="subtitle1" color="text.secondary">
          模型列表
        </Typography>
      </Box>

      {/* 模型列表 */}
      <List disablePadding>
        {modelIds.map((modelId) => {
          const model = modelStatuses[modelId];
          const isSelected = selectedModel === modelId;
          const hasError = model.status === 'error';

          return (
            <ListItemButton
              key={modelId}
              selected={isSelected}
              onClick={() => onSelectModel(modelId)}
              sx={{
                py: 1.5,
                px: 2,
                borderLeft: '4px solid',
                borderLeftColor: isSelected ? 'primary.main' : 'transparent',
                bgcolor: isSelected ? 'action.selected' : 'transparent',
                '&:hover': {
                  bgcolor: isSelected ? 'action.selected' : 'action.hover',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {/* 状态图标 */}
              <ListItemIcon sx={{ minWidth: 36 }}>
                <ModelStatusIcon status={model.status} />
              </ListItemIcon>

              {/* 模型名称和描述 */}
              <ListItemText
                primary={model.name || modelId}
                secondary={
                  hasError
                    ? model.error || '回复异常'
                    : model.status === 'streaming'
                      ? '正在回复...'
                      : model.status === 'done'
                        ? '回复完成'
                        : '等待中'
                }
                slotProps={{
                  primary: {
                    sx: {
                      fontSize: '0.9rem',
                      fontWeight: isSelected ? 600 : 400,
                    },
                    noWrap: true,
                  },
                  secondary: {
                    sx: {
                      fontSize: '0.75rem',
                      color: hasError ? 'error.main' : 'text.secondary',
                    },
                    noWrap: true,
                  },
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
