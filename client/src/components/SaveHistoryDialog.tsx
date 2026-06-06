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
  initialName?: string;   // 当前记录的名称，用于重命名时预填
  title?: string;         // 对话框标题，默认为"重命名对话"
  buttonLabel?: string;   // 确认按钮文本，默认为"重命名"
}

export default function SaveHistoryDialog({
  open,
  onClose,
  onSave,
  initialName = '',
  title = '重命名对话',
  buttonLabel = '重命名',
}: SaveHistoryDialogProps) {
  // 会话名称输入状态
  const [name, setName] = useState('');

  // 当弹窗打开时，使用传入的初始名称
  useEffect(() => {
    if (open) {
      setName(initialName);
    }
  }, [open, initialName]);

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
      <DialogTitle>{title}</DialogTitle>
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
          {buttonLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
