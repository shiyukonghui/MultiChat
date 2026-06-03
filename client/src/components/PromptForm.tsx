import { useState, useEffect, useCallback } from 'react';
import {
  TextField,
  Button,
  Box,
} from '@mui/material';

// 提示词表单组件属性
interface PromptFormProps {
  /** 编辑模式下的初始数据 */
  initialData?: { title: string; content: string };
  /** 提交回调 */
  onSubmit: (data: { title: string; content: string }) => void;
  /** 取消回调 */
  onCancel: () => void;
}

// 标题最大长度
const TITLE_MAX = 50;
// 内容最大长度
const CONTENT_MAX = 4000;

/**
 * 提示词表单组件
 * 用于创建/编辑系统提示词，包含标题和内容输入框及字符计数
 */
export default function PromptForm({ initialData, onSubmit, onCancel }: PromptFormProps) {
  // 表单状态
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  // 表单错误信息
  const [errors, setErrors] = useState<{ title?: string; content?: string }>({});

  // 编辑模式下回填初始数据
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
    }
  }, [initialData]);

  // 校验表单
  const validate = useCallback((): boolean => {
    const newErrors: { title?: string; content?: string } = {};

    if (!title.trim()) {
      newErrors.title = '标题不能为空';
    } else if (title.length > TITLE_MAX) {
      newErrors.title = `标题不能超过 ${TITLE_MAX} 个字符`;
    }

    if (!content.trim()) {
      newErrors.content = '内容不能为空';
    } else if (content.length > CONTENT_MAX) {
      newErrors.content = `内容不能超过 ${CONTENT_MAX} 个字符`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [title, content]);

  // 提交表单
  const handleSubmit = useCallback(() => {
    if (!validate()) return;
    onSubmit({ title: title.trim(), content: content.trim() });
  }, [validate, title, content, onSubmit]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
      {/* 标题输入 */}
      <TextField
        label="标题"
        placeholder="请输入提示词标题"
        fullWidth
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
        }}
        error={!!errors.title}
        helperText={errors.title || `${title.length}/${TITLE_MAX}`}
        slotProps={{
          htmlInput: { maxLength: TITLE_MAX },
        }}
      />

      {/* 内容输入 */}
      <TextField
        label="内容"
        placeholder="请输入系统提示词内容"
        fullWidth
        multiline
        minRows={6}
        maxRows={12}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          if (errors.content) setErrors((prev) => ({ ...prev, content: undefined }));
        }}
        error={!!errors.content}
        helperText={errors.content || `${content.length}/${CONTENT_MAX}`}
        slotProps={{
          htmlInput: { maxLength: CONTENT_MAX },
        }}
      />

      {/* 操作按钮 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button onClick={onCancel} color="inherit">
          取消
        </Button>
        <Button onClick={handleSubmit} variant="contained">
          {initialData ? '保存修改' : '创建'}
        </Button>
      </Box>
    </Box>
  );
}