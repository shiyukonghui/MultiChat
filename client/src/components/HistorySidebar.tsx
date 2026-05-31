import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import type { HistoryRecordSummary } from '../types';

// 组件 Props 接口
interface HistorySidebarProps {
  open: boolean;
  onClose: () => void;
  histories: HistoryRecordSummary[];  // 使用摘要类型
  onSelectHistory: (history: HistoryRecordSummary) => void;  // 选择时只传递摘要信息
  onDeleteHistory: (id: string) => void;
}

// 格式化时间戳为可读字符串
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function HistorySidebar({
  open,
  onClose,
  histories,
  onSelectHistory,
  onDeleteHistory,
}: HistorySidebarProps) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: { width: 320 },
        },
      }}
    >
      {/* 标题区域 */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" component="h2">
          历史记录
        </Typography>
      </Box>

      {/* 历史记录列表 */}
      {histories.length === 0 ? (
        // 空状态显示
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 'calc(100% - 64px)',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            暂无历史记录
          </Typography>
        </Box>
      ) : (
        <List sx={{ pt: 0 }}>
          {histories.map((history, index) => (
            <Box key={history.id}>
              {index > 0 && <Divider />}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => onSelectHistory(history)}
                >
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" noWrap>
                      {history.name}
                    </Typography>
                  }
                  secondary={
                    <Box component="span" sx={{ display: 'block' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {formatTimestamp(history.timestamp)}
                      </Typography>
                      {history.selectedModel && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
                          模型: {history.selectedModel}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="删除"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteHistory(history.id);
                    }}
                    size="small"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
                </ListItemButton>
              </ListItem>
            </Box>
          ))}
        </List>
      )}
    </Drawer>
  );
}
