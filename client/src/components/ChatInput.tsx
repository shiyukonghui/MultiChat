import { useState, useRef, type KeyboardEvent } from 'react';
import { Box, TextField, IconButton, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

// ChatInput 组件的 Props
interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

// 消息最大字符数
const MAX_CHARS = 4000;

// 聊天输入组件
// 包含输入框和发送按钮，支持输入校验和键盘快捷键
export default function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 发送消息
  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed.length === 0 || isLoading) return;
    onSend(trimmed);
    setMessage('');
    // 发送后聚焦输入框
    inputRef.current?.focus();
  };

  // 键盘事件处理：Enter 发送，Shift+Enter 换行
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isOverLimit = message.length > MAX_CHARS;
  const isSendDisabled = message.trim().length === 0 || isLoading || isOverLimit;

  return (
    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      {/* 输入框区域 */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        {/* 多行文本输入框 */}
        <TextField
          inputRef={inputRef}
          fullWidth
          multiline
          minRows={1}
          maxRows={6}
          placeholder="输入您的问题，Enter 发送，Shift+Enter 换行"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          error={isOverLimit}
          slotProps={{
            htmlInput: {
              'aria-label': '消息输入框',
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />
        {/* 发送按钮 */}
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={isSendDisabled}
          aria-label="发送消息"
          sx={{
            mb: 0.5,
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': { bgcolor: 'primary.dark' },
            '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' },
            width: 44,
            height: 44,
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
      {/* 字符计数与超限提示 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
        <Typography
          variant="caption"
          color={isOverLimit ? 'error' : 'text.secondary'}
        >
          {message.length}/{MAX_CHARS}
          {isOverLimit && ' 字符数超限'}
        </Typography>
      </Box>
    </Box>
  );
}
