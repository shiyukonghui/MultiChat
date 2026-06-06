import { useState, useCallback, useEffect, useRef, Component, type ErrorInfo, type ReactNode } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import SaveIcon from '@mui/icons-material/Save';
import SmartToyIcon from '@mui/icons-material/SmartToy';

import { useChatStream } from './hooks/useChatStream';
import ChatInput from './components/ChatInput';
import ModelSidebar from './components/ModelSidebar';
import StreamingResponse from './components/StreamingResponse';
import ModelConfigPanel from './pages/ModelConfigPanel';
import HistorySidebar from './components/HistorySidebar';
import SaveHistoryDialog from './components/SaveHistoryDialog';
import PromptDialog from './components/PromptDialog';
import { fetchHistories, fetchHistoryDetail, deleteHistory, fetchPrompts, upsertHistory } from './utils/api';
import type { ChatMessage, HistoryRecordSummary, Prompt } from './types';

// 侧边栏宽度常量
const DRAWER_WIDTH = 280;

// 创建 MUI 主题：深蓝色系主色调
const theme = createTheme({
  palette: {
    primary: {
      main: '#1a237e',
      light: '#534bae',
      dark: '#000051',
    },
    secondary: {
      main: '#0d47a1',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

// 错误边界组件：捕获子组件渲染异常
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    console.error('ErrorBoundary 捕获到异常:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            页面出现异常
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {this.state.error?.message || '未知错误'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
          >
            刷新页面
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

// 对话历史图标组件：区分用户消息和助手消息
function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 1.5,
      }}
    >
      <Box
        sx={{
          maxWidth: '80%',
          bgcolor: isUser ? 'primary.light' : 'grey.200',
          color: isUser ? 'white' : 'text.primary',
          borderRadius: 2,
          px: 2,
          py: 1.5,
        }}
      >
        {/* 角色标签 */}
        <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mb: 0.5 }}>
          {isUser ? '你' : message.model || '助手'}
        </Typography>
        {/* 消息内容，保留换行 */}
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.content}
        </Typography>
      </Box>
    </Box>
  );
}

function App() {
  // 对话状态管理（SSE 流式接收 + useReducer）
  const { state, sendMessage, selectModel, resetSession, refreshModels, loadHistory } = useChatStream();

  // 模型配置对话框状态
  const [configOpen, setConfigOpen] = useState(false);
  // 清空会话确认对话框
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  // Snackbar 通知状态
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  // 历史记录侧边栏状态
  const [historySidebarOpen, setHistorySidebarOpen] = useState(false);
  // 历史记录列表（只包含摘要信息）
  const [histories, setHistories] = useState<HistoryRecordSummary[]>([]);
  // 保存历史记录对话框状态
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // 自动保存相关状态
  const [currentRecordId, setCurrentRecordId] = useState<string | null>(null);
  const lastSavedCountRef = useRef(0);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 使用 ref 保存 currentRecordId 避免闭包问题
  const currentRecordIdRef = useRef<string | null>(null);
  useEffect(() => {
    currentRecordIdRef.current = currentRecordId;
  }, [currentRecordId]);

  // 恢复历史记录确认对话框状态
  const [loadHistoryConfirmOpen, setLoadHistoryConfirmOpen] = useState(false);
  // 待恢复的历史记录（只存储摘要，详情需要异步获取）
  const [pendingHistory, setPendingHistory] = useState<HistoryRecordSummary | null>(null);
  // 加载历史记录详情时的状态
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 提示词管理对话框状态
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  // 提示词列表
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  // 当前激活的提示词ID（持久化到 localStorage）
  const [activePromptId, setActivePromptId] = useState<string | null>(() => {
    return localStorage.getItem('activePromptId');
  });

  // 当前选中的模型状态
  const selectedModelStatus = state.selectedModel
    ? state.modelStatuses[state.selectedModel]
    : undefined;

  // 判断是否所有模型都失败了
  const modelIds = Object.keys(state.modelStatuses);
  const allModelsFailed =
    modelIds.length > 0 &&
    modelIds.every((id) => state.modelStatuses[id]?.status === 'error');

  // 加载提示词列表
  const loadPrompts = useCallback(async () => {
    try {
      const data = await fetchPrompts();
      setPrompts(data);
      // 如果激活的提示词已被删除，自动取消激活
      if (activePromptId && !data.find(p => p.id === activePromptId)) {
        setActivePromptId(null);
        localStorage.removeItem('activePromptId');
      }
    } catch (error) {
      console.error('加载提示词失败:', error);
    }
  }, [activePromptId]);

  // 激活/取消激活提示词
  const handleActivatePrompt = useCallback((id: string | null) => {
    setActivePromptId(id);
    if (id) {
      localStorage.setItem('activePromptId', id);
    } else {
      localStorage.removeItem('activePromptId');
    }
  }, []);

  // 发送消息回调
  const handleSend = useCallback(
    (message: string) => {
      // 查找激活的提示词内容
      const activePrompt = activePromptId
        ? prompts.find(p => p.id === activePromptId)
        : undefined;
      sendMessage(message, activePrompt?.content);
    },
    [sendMessage, activePromptId, prompts]
  );

  // 新建会话
  const handleNewSession = useCallback(() => {
    resetSession();
    setCurrentRecordId(null);
    setSnackbar({ open: true, message: '已创建新会话' });
  }, [resetSession]);

  // 清空会话（确认后执行）
  const handleClearSession = useCallback(() => {
    setClearDialogOpen(false);
    resetSession();
    setCurrentRecordId(null);
    setSnackbar({ open: true, message: '会话已清空' });
  }, [resetSession]);

  // 加载历史记录列表
  const loadHistories = useCallback(async () => {
    try {
      const data = await fetchHistories();
      setHistories(data);
    } catch (error) {
      console.error('加载历史记录失败:', error);
    }
  }, []);

  // 自动保存到后端（使用 upsert API）
  const performAutoSave = useCallback(async () => {
    if (state.messages.length === 0) return;

    // 生成自动名称（第一条用户消息的前30字符）
    const firstUserMsg = state.messages.find(m => m.role === 'user');
    const name = firstUserMsg
      ? (firstUserMsg.content.length > 30
        ? firstUserMsg.content.substring(0, 30) + '...'
        : firstUserMsg.content)
      : '新对话';

    try {
      const result = await upsertHistory({
        id: currentRecordIdRef.current || undefined,
        name,
        selectedModel: state.selectedModel,
        messages: state.messages,
      });

      // 首次保存时记录返回的 ID
      if (!currentRecordIdRef.current) {
        setCurrentRecordId(result.id);
      }
      lastSavedCountRef.current = state.messages.length;
    } catch (error) {
      console.error('自动保存失败:', error);
    }
  }, [state.messages, state.selectedModel]);

  // 页面加载时预加载历史记录列表
  useEffect(() => {
    loadHistories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听侧边栏打开时加载历史记录
  useEffect(() => {
    if (historySidebarOpen) {
      loadHistories();
    }
  }, [historySidebarOpen, loadHistories]);

  // 监听消息变化触发自动保存（防抖 300ms）
  useEffect(() => {
    // 只在消息数量增加时触发（新的模型回复完成）
    if (state.messages.length > lastSavedCountRef.current) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        performAutoSave();
      }, 300);
    }
  }, [state.messages, performAutoSave]);

  // 处理重命名历史记录
  const handleRenameHistory = useCallback(async (name: string) => {
    if (!currentRecordId) return;
    try {
      await upsertHistory({
        id: currentRecordId,
        name,
        selectedModel: state.selectedModel,
        messages: state.messages,
      });
      setSnackbar({ open: true, message: '已重命名' });
      loadHistories(); // 刷新列表
    } catch (error) {
      setSnackbar({ open: true, message: '重命名失败' });
    }
  }, [currentRecordId, state.selectedModel, state.messages, loadHistories]);

  // 处理选择历史记录
  const handleSelectHistory = useCallback(async (history: HistoryRecordSummary) => {
    // 如果有未保存的对话，显示确认对话框
    if (state.messages.length > 0) {
      setPendingHistory(history);
      setLoadHistoryConfirmOpen(true);
      return;
    }

    // 异步获取历史记录详情
    setIsLoadingHistory(true);
    try {
      const detail = await fetchHistoryDetail(history.id);
      loadHistory(detail.messages, detail.selectedModel);
      setHistorySidebarOpen(false);
      setSnackbar({ open: true, message: '已加载历史记录' });
    } catch (error) {
      console.error('加载历史记录详情失败:', error);
      setSnackbar({ open: true, message: '加载历史记录详情失败' });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [state.messages.length, loadHistory]);

  // 确认加载历史记录
  const confirmLoadHistory = useCallback(async () => {
    if (!pendingHistory) return;

    setIsLoadingHistory(true);
    try {
      // 异步获取完整的历史记录详情
      const detail = await fetchHistoryDetail(pendingHistory.id);
      loadHistory(detail.messages, detail.selectedModel);
      setSnackbar({ open: true, message: '已加载历史记录' });
    } catch (error) {
      console.error('加载历史记录详情失败:', error);
      setSnackbar({ open: true, message: '加载历史记录详情失败' });
    } finally {
      setPendingHistory(null);
      setLoadHistoryConfirmOpen(false);
      setHistorySidebarOpen(false);
      setIsLoadingHistory(false);
    }
  }, [pendingHistory, loadHistory]);

  // 处理删除历史记录
  const handleDeleteHistory = useCallback(async (id: string) => {
    try {
      await deleteHistory(id);
      setHistories(prev => prev.filter(h => h.id !== id));
      setSnackbar({ open: true, message: '已删除历史记录' });
    } catch (error) {
      setSnackbar({ open: true, message: '删除失败' });
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <ErrorBoundary>
        <Box sx={{ display: 'flex', height: '100vh' }}>
          {/* ========== 顶部导航栏 ========== */}
          <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
            <Toolbar sx={{ justifyContent: 'space-between' }}>
              {/* 标题 */}
              <Typography variant="h6" noWrap component="div">
                MultiChat 多模型对话
              </Typography>

              {/* 操作按钮组 */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="新建会话">
                  <span>
                    <Button
                      color="inherit"
                      startIcon={<AddIcon />}
                      onClick={handleNewSession}
                      disabled={state.isLoading}
                      size="small"
                    >
                      新建
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title="重命名当前对话">
                  <span>
                    <IconButton
                      color="inherit"
                      onClick={() => setSaveDialogOpen(true)}
                      disabled={state.isLoading || state.messages.length === 0 || !currentRecordId}
                      size="small"
                    >
                      <SaveIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="历史记录">
                  <span>
                    <IconButton
                      color="inherit"
                      onClick={() => setHistorySidebarOpen(true)}
                      size="small"
                    >
                      <HistoryIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="清空当前会话">
                  <span>
                    <IconButton
                      color="inherit"
                      onClick={() => setClearDialogOpen(true)}
                      disabled={state.isLoading || state.messages.length === 0}
                      size="small"
                    >
                      <DeleteSweepIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="系统提示词">
                  <span>
                    <IconButton
                      color="inherit"
                      onClick={() => {
                        loadPrompts();
                        setPromptDialogOpen(true);
                      }}
                      size="small"
                    >
                      <SmartToyIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="模型配置">
                  <span>
                    <IconButton
                      color="inherit"
                      onClick={() => setConfigOpen(true)}
                      size="small"
                    >
                    <SettingsIcon />
                  </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Toolbar>
          </AppBar>

          {/* ========== 左侧侧边栏 ========== */}
          <Drawer
            variant="permanent"
            sx={{
              width: DRAWER_WIDTH,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
              },
            }}
          >
            <Toolbar />
            <Box sx={{ overflow: 'auto', flex: 1 }}>
              <ModelSidebar
                modelStatuses={state.modelStatuses}
                selectedModel={state.selectedModel}
                onSelectModel={selectModel}
              />
            </Box>
          </Drawer>

          {/* ========== 右侧主内容区 ========== */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              display: 'flex',
              flexDirection: 'column',
              height: '100vh',
              bgcolor: 'background.default',
            }}
          >
            <Toolbar />

            {/* 对话内容区域（可滚动） */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                px: 3,
                py: 2,
              }}
            >
              {/* 暂无消息时的引导提示 */}
              {state.messages.length === 0 && !state.isLoading && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'text.secondary',
                    gap: 2,
                  }}
                >
                  <Typography variant="h5" color="text.primary">
                    欢迎使用 MultiChat
                  </Typography>
                  <Typography variant="body1">
                    在下方输入您的问题，系统将同时向多个 AI 模型提问
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    选中侧边栏中的模型即可查看其回复
                  </Typography>
                </Box>
              )}

              {/* 对话历史消息 */}
              {state.messages
                .filter((m) => m.role === 'user' || m.model === state.selectedModel)
                .map((message, index) => (
                  <ChatMessageBubble key={index} message={message} />
                ))}

              {/* 当前选中模型的流式回复 */}
              {selectedModelStatus &&
                selectedModelStatus.status === 'streaming' && (
                  <Box sx={{ mb: 2 }}>
                    <StreamingResponse modelStatus={selectedModelStatus} />
                  </Box>
                )}

              {/* 所有模型均失败的提示 */}
              {allModelsFailed && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  所有模型暂不可用，请稍后重试或检查模型配置
                </Alert>
              )}

              {/* SSE 连接断开正在重连提示 */}
              {state.isReconnecting && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  连接已断开，正在重连...
                </Alert>
              )}

              {/* 加载中状态（无任何模型开始回复时） */}
              {state.isLoading && modelIds.length === 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              )}
            </Box>

            {/* 底部输入区域 */}
            <ChatInput onSend={handleSend} isLoading={state.isLoading} />
          </Box>
        </Box>

        {/* ========== 模型配置对话框 ========== */}
        <Dialog
          open={configOpen}
          onClose={() => setConfigOpen(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>模型配置管理</DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <ModelConfigPanel onModelsChange={refreshModels} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfigOpen(false)}>关闭</Button>
          </DialogActions>
        </Dialog>

        {/* ========== 提示词管理对话框 ========== */}
        <PromptDialog
          open={promptDialogOpen}
          onClose={() => setPromptDialogOpen(false)}
          activePromptId={activePromptId}
          onActivate={handleActivatePrompt}
          onPromptsChange={loadPrompts}
        />

        {/* ========== 清空会话确认对话框 ========== */}
        <Dialog open={clearDialogOpen} onClose={() => setClearDialogOpen(false)}>
          <DialogTitle>确认清空会话</DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              清空后将删除当前所有对话记录，此操作不可撤销。
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setClearDialogOpen(false)}>取消</Button>
            <Button onClick={handleClearSession} color="error" variant="contained">
              确认清空
            </Button>
          </DialogActions>
        </Dialog>

        {/* ========== 历史记录侧边栏 ========== */}
        <HistorySidebar
          open={historySidebarOpen}
          onClose={() => setHistorySidebarOpen(false)}
          histories={histories}
          onSelectHistory={handleSelectHistory}
          onDeleteHistory={handleDeleteHistory}
        />

        {/* ========== 保存/重命名历史记录对话框 ========== */}
        <SaveHistoryDialog
          open={saveDialogOpen}
          onClose={() => setSaveDialogOpen(false)}
          onSave={handleRenameHistory}
          initialName={histories.find(h => h.id === currentRecordId)?.name || ''}
          title="重命名对话"
          buttonLabel="重命名"
        />

        {/* ========== 恢复历史记录确认对话框 ========== */}
        <Dialog open={loadHistoryConfirmOpen} onClose={() => !isLoadingHistory && setLoadHistoryConfirmOpen(false)}>
          <DialogTitle>确认加载历史记录</DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              当前会话将被替换为选中的历史记录，未保存的内容将丢失。
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLoadHistoryConfirmOpen(false)} disabled={isLoadingHistory}>
              取消
            </Button>
            <Button
              onClick={confirmLoadHistory}
              color="primary"
              variant="contained"
              disabled={isLoadingHistory}
            >
              {isLoadingHistory ? '加载中...' : '确认'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ========== 全局 Snackbar 通知 ========== */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ open: false, message: '' })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={() => setSnackbar({ open: false, message: '' })}
            severity="success"
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
