import { useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ModelStatus } from '../types';

// StreamingResponse 组件的 Props
interface StreamingResponseProps {
  modelStatus: ModelStatus | undefined;
}

// 代码块渲染组件（用于 react-markdown 的 code 元素）
// 根据 className 中的语言标识（如 language-js）自动高亮代码
function CodeBlock({ className, children, ...props }: any) {
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');

  // 有语言标识的围栏代码块，使用 SyntaxHighlighter 渲染
  if (match) {
    return (
      <SyntaxHighlighter
        style={oneDark}
        language={match[1]}
        PreTag="div"
        customStyle={{ borderRadius: 8, fontSize: '0.875rem' }}
      >
        {codeString}
      </SyntaxHighlighter>
    );
  }

  // 行内代码，使用简单样式
  return (
    <code
      className={className}
      style={{
        backgroundColor: '#f0f0f0',
        padding: '2px 6px',
        borderRadius: 4,
        fontSize: '0.875em',
      }}
      {...props}
    >
      {children}
    </code>
  );
}

// 流式回复渲染组件
// 根据模型状态渲染不同的 UI：加载中 / 流式内容 / 错误 / 空状态
export default function StreamingResponse({ modelStatus }: StreamingResponseProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // 流式内容更新时，自动滚动到底部
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [modelStatus?.content]);

  // 无选中模型：提示用户选择
  if (!modelStatus) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: 'text.secondary',
        }}
      >
        <Typography variant="body1">选择一个模型查看回复</Typography>
      </Box>
    );
  }

  // 等待中状态：显示加载动画
  if (modelStatus.status === 'pending') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          等待 {modelStatus.name || modelStatus.id} 回复中...
        </Typography>
      </Box>
    );
  }

  // 错误状态：显示错误提示
  if (modelStatus.status === 'error') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" variant="outlined">
          {modelStatus.error || '模型返回异常，请稍后重试'}
        </Alert>
      </Box>
    );
  }

  // 流式输出中或已完成：渲染 Markdown 内容
  // 流式输出时显示闪烁光标，完成后隐藏
  const streamingStyle: SxProps<Theme> = modelStatus.status === 'streaming' ? {
    '&::after': {
      content: '"▎"',
      animation: 'blink 1s step-end infinite',
      color: 'primary.main',
      fontWeight: 'bold',
    },
    '@keyframes blink': {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0 },
    },
  } : {};

  return (
    <Box
      ref={contentRef}
      sx={{
        p: 3,
        height: '100%',
        overflowY: 'auto',
        // Markdown 内容样式
        '& h1': { fontSize: '1.8rem', fontWeight: 600, mt: 2, mb: 1 },
        '& h2': { fontSize: '1.5rem', fontWeight: 600, mt: 2, mb: 1 },
        '& h3': { fontSize: '1.25rem', fontWeight: 600, mt: 1.5, mb: 0.5 },
        '& p': { lineHeight: 1.8, mb: 1.5 },
        '& ul, & ol': { pl: 3, mb: 1.5 },
        '& li': { mb: 0.5 },
        '& blockquote': {
          borderLeft: '4px solid',
          borderColor: 'primary.main',
          pl: 2,
          py: 1,
          my: 2,
          bgcolor: 'action.hover',
          borderRadius: '0 8px 8px 0',
        },
        '& table': {
          borderCollapse: 'collapse',
          width: '100%',
          my: 2,
        },
        '& th, & td': {
          border: '1px solid',
          borderColor: 'divider',
          px: 2,
          py: 1,
        },
        '& th': {
          bgcolor: 'action.hover',
          fontWeight: 600,
        },
        '& pre': {
          borderRadius: 2,
          my: 2,
        },
        '& img': {
          maxWidth: '100%',
          borderRadius: 1,
        },
        '& hr': {
          my: 3,
          borderColor: 'divider',
        },
      }}
    >
      {/* 流式输出时显示加载指示器 */}
      {modelStatus.status === 'streaming' && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <CircularProgress size={16} sx={{ mr: 1 }} />
          <Typography variant="caption" color="text.secondary">
            正在生成...
          </Typography>
        </Box>
      )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code: CodeBlock as any,
        }}
      >
        {modelStatus.content || ''}
      </ReactMarkdown>
      {/* 流式输出闪烁光标 */}
      {modelStatus.status === 'streaming' && (
        <Box
          component="span"
          sx={{
            ...streamingStyle,
          }}
        />
      )}
    </Box>
  );
}
