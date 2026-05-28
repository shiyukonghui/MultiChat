import { Box, Typography, Chip, Paper } from '@mui/material';
import type { ChatMessage } from '../types';

// ChatHistory 的 Props
interface ChatHistoryProps {
  messages: ChatMessage[];
}

// 对话历史展示组件
// 以时间线形式展示完整的对话记录
export default function ChatHistory({ messages }: ChatHistoryProps) {
  // 无消息时显示空状态提示
  if (messages.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          暂无对话历史，开始提问吧
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {messages.map((msg, index) => (
        <Paper
          key={index}
          variant="outlined"
          sx={{
            p: 1.5,
            mb: 1,
            // 用户消息使用 action.hover 背景，助手消息使用 grey.50 背景
            bgcolor: msg.role === 'user' ? 'action.hover' : 'grey.50',
            borderLeft: '4px solid',
            borderLeftColor: msg.role === 'user' ? 'primary.main' : 'secondary.main',
          }}
        >
          {/* 消息头部：角色标签 + 模型来源 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Chip
              label={msg.role === 'user' ? '你' : (msg.model || '助手')}
              size="small"
              color={msg.role === 'user' ? 'primary' : 'secondary'}
              variant="outlined"
            />
            {msg.role === 'assistant' && msg.model && (
              <Typography variant="caption" color="text.secondary">
                来自 {msg.model}
              </Typography>
            )}
          </Box>
          {/* 消息内容：保留换行，超长截断 */}
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: 200,
              overflowY: 'auto',
            }}
          >
            {msg.content.length > 500
              ? msg.content.slice(0, 500) + '...'
              : msg.content}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
