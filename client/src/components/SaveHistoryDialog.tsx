import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from '@mui/material';

// 组件 Props 接口
interface SaveHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

// 生成默认会话名称
const generateDefaultName = (): string => {
  const now = new Date();
  const formatted = now.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `新会话 ${formatted}`;
};

export default function SaveHistoryDialog({
  open,
  onClose,
  onSave,
}: SaveHistoryDialogProps) {
  // 会话名称输入状态
  const [name, setName] = useState('');

  // 当弹窗打开时，重置输入并设置默认名称
  useEffect(() => {
    if (open) {
      setName(generateDefaultName());
    }
  }, [open]);

  // 处理保存操作
  const handleSave = () => {
    const trimmedName = name.trim();
    if (trimmedName) {
      onSave(trimmedName);
      onClose();
    }
  };

  // 处理键盘事件，Enter 键保存
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>保存到历史记录</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="会话名称"
          placeholder="请输入会话名称"
          fullWidth
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!name.trim()}
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
}
