import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Divider,
  Chip,
  CircularProgress,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  SupervisorAccount as AdminIcon,
  Inventory as OpenIcon,
  HourglassTop as InProgressIcon,
  CheckCircle as ResolvedIcon,
  Cancel as ClosedIcon,
  Chat as ChatIcon,
  WarningAmber as WarningIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { supportApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const getStatusColor = (status) => {
  switch (status) {
    case 'open':
      return 'info';
    case 'in_progress':
      return 'warning';
    case 'resolved':
      return 'success';
    case 'closed':
      return 'default';
    default:
      return 'info';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'open':
      return 'Đang mở';
    case 'in_progress':
      return 'Đang xử lý';
    case 'resolved':
      return 'Đã giải quyết';
    case 'closed':
      return 'Đã đóng';
    default:
      return 'Không xác định';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'open':
      return <OpenIcon fontSize="small" />;
    case 'in_progress':
      return <InProgressIcon fontSize="small" />;
    case 'resolved':
      return <ResolvedIcon fontSize="small" />;
    case 'closed':
      return <ClosedIcon fontSize="small" />;
    default:
      return <OpenIcon fontSize="small" />;
  }
};

const TicketDetail = ({ ticket, onTicketUpdated, isAdmin }) => {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(ticket ? ticket.status : 'open');
  const [retryingPending, setRetryingPending] = useState(false);
  const [fromFallback, setFromFallback] = useState(false);
  const chatEndRef = useRef(null);

  // Fetch messages when ticket changes
  useEffect(() => {
    if (ticket && ticket.id) {
      fetchMessages();
      setSelectedStatus(ticket.status);

      // Kiểm tra nếu dữ liệu ticket đến từ fallback
      if (ticket._fromFallback) {
        setFromFallback(true);

        // Hiển thị thông báo
        setError('Đang hiển thị dữ liệu dự phòng do không thể kết nối đến máy chủ. Một số tính năng có thể bị hạn chế.');
      } else {
        setFromFallback(false);
      }

      // Tải tin nhắn đang chờ từ localStorage
      loadPendingMessages();
    }
  }, [ticket]);

  // Auto-refresh messages every 30 seconds
  useEffect(() => {
    if (ticket && ticket.id) {
      const refreshInterval = setInterval(() => {
        fetchMessages(false); // silent refresh (no loading indicator)
        loadPendingMessages(); // refresh pending messages
      }, 30000); // refresh every 30 seconds

      return () => {
        clearInterval(refreshInterval);
      };
    }
  }, [ticket]);

  // Scroll to bottom on messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages, pendingMessages]);

  // Tải tin nhắn đang chờ từ localStorage
  const loadPendingMessages = () => {
    if (!ticket || !ticket.id) return;

    try {
      const allPendingMessages = JSON.parse(localStorage.getItem('pendingMessages') || '[]');

      // Lọc các tin nhắn thuộc về ticket hiện tại
      const ticketPendingMessages = allPendingMessages.filter(
        msg => msg.ticket === ticket.id
      );

      if (ticketPendingMessages.length > 0) {
        console.log(`Tìm thấy ${ticketPendingMessages.length} tin nhắn đang chờ cho ticket ${ticket.id}`);
      }

      setPendingMessages(ticketPendingMessages);
    } catch (err) {
      console.error('Lỗi khi tải tin nhắn đang chờ:', err);
      setPendingMessages([]);
    }
  };

  // Thử gửi lại tất cả tin nhắn đang chờ
  const retryPendingMessages = async () => {
    if (pendingMessages.length === 0) return;

    setRetryingPending(true);

    try {
      const result = await supportApi.retrySendPendingMessages();

      console.log('Kết quả gửi lại tin nhắn:', result);

      if (result.sent > 0) {
        setSuccess(`Đã gửi thành công ${result.sent}/${result.total} tin nhắn đang chờ.`);

        // Tải lại tin nhắn và danh sách tin nhắn đang chờ
        fetchMessages();
        loadPendingMessages();

        // Cập nhật ticket
        onTicketUpdated();
      } else if (result.total > 0) {
        setError(`Không thể gửi ${result.total} tin nhắn. Vui lòng thử lại sau.`);
      }
    } catch (err) {
      console.error('Lỗi khi thử gửi lại tin nhắn:', err);
      setError('Có lỗi xảy ra khi thử gửi lại tin nhắn. Vui lòng thử lại sau.');
    } finally {
      setRetryingPending(false);
    }
  };

  const fetchMessages = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      // Kiểm tra ticket có hợp lệ không
      if (!ticket || !ticket.id) {
        console.error("Dữ liệu ticket không hợp lệ khi tải tin nhắn:", ticket);
        setError('Thông tin yêu cầu hỗ trợ không hợp lệ. Vui lòng làm mới trang.');
        if (showLoading) {
          setLoading(false);
        }
        return;
      }

      console.log(`Đang tải tin nhắn cho ticket ID: ${ticket.id}`);
      const response = await supportApi.getMessages(ticket.id);

      if (response && response.data) {
        console.log(`Đã tải ${response.data.length} tin nhắn thành công`);
        setMessages(response.data);

        // Kiểm tra nếu dữ liệu đến từ fallback
        if (response._fromFallback) {
          console.log('Dữ liệu tin nhắn đến từ fallback');
          setFromFallback(true);
        } else {
          setFromFallback(false);
        }
      } else {
        console.error("Không nhận được dữ liệu tin nhắn hợp lệ:", response);
        setMessages([]);
      }
    } catch (err) {
      console.error('Lỗi khi tải tin nhắn:', err);

      // Hiển thị thông báo lỗi chi tiết hơn
      if (err.response) {
        console.error('Chi tiết lỗi từ server:', err.response.data);
        if (err.response.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (err.response.status === 403) {
          setError('Bạn không có quyền xem tin nhắn của yêu cầu hỗ trợ này.');
        } else if (err.response.status === 404) {
          setError('Không tìm thấy yêu cầu hỗ trợ. Có thể yêu cầu đã bị xóa.');
        } else {
          setError(`Lỗi khi tải tin nhắn (Mã: ${err.response.status}). Vui lòng thử lại sau.`);
        }
      } else if (err.request) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.');
      } else {
        setError('Có lỗi xảy ra khi tải tin nhắn. Vui lòng thử lại sau.');
      }

      // Đặt danh sách tin nhắn về trống để tránh hiển thị dữ liệu cũ
      setMessages([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setSending(true);
    setError(null);

    try {
      // Kiểm tra đầu vào và log
      console.log("Đang gửi tin nhắn đến ticket:", ticket.id);
      console.log("Dữ liệu người dùng hiện tại:", currentUser);

      // Kiểm tra người dùng có đủ thông tin không
      if (!currentUser || !currentUser.user || !currentUser.user.id) {
        console.error("Không có thông tin người dùng hợp lệ:", currentUser);
        setError('Thông tin người dùng không hợp lệ. Vui lòng đăng nhập lại.');
        setSending(false);
        return;
      }

      // Kiểm tra ticket có hợp lệ không
      if (!ticket || !ticket.id) {
        console.error("Dữ liệu ticket không hợp lệ:", ticket);
        setError('Thông tin yêu cầu hỗ trợ không hợp lệ. Vui lòng làm mới trang.');
        setSending(false);
        return;
      }

      // Tạo dữ liệu gửi tin nhắn
      const messageData = {
        ticket: ticket.id,
        content: message,
        sender: currentUser.user.id
      };

      console.log("Dữ liệu tin nhắn sẽ gửi:", messageData);

      // Gửi tin nhắn
      const response = await supportApi.sendMessage(messageData);

      console.log("Kết quả gửi tin nhắn:", response);

      setMessage('');

      // Chờ một khoảng thời gian ngắn trước khi tải lại tin nhắn
      setTimeout(() => {
        fetchMessages();
        loadPendingMessages();
        onTicketUpdated();
      }, 300);

    } catch (err) {
      console.error('Lỗi khi gửi tin nhắn:', err);

      // Hiển thị thông báo lỗi chi tiết hơn
      if (err.response) {
        // Lỗi từ server
        console.error('Chi tiết lỗi từ server:', err.response.data);
        if (err.response.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (err.response.status === 403) {
          setError('Bạn không có quyền gửi tin nhắn cho yêu cầu hỗ trợ này.');
        } else if (err.response.status === 404) {
          setError('Không tìm thấy yêu cầu hỗ trợ. Có thể yêu cầu đã bị xóa hoặc đóng.');
        } else if (err.response.status === 500) {
          setError('Lỗi máy chủ. Tin nhắn đã được lưu và sẽ tự động gửi lại sau.');
          // Tải lại danh sách tin nhắn đang chờ
          loadPendingMessages();
        } else {
          setError(`Lỗi khi gửi tin nhắn (Mã: ${err.response.status}). Vui lòng thử lại sau.`);
        }
      } else if (err.request) {
        // Không nhận được phản hồi từ server
        setError('Không thể kết nối đến máy chủ. Tin nhắn đã được lưu và sẽ tự động gửi lại khi kết nối được phục hồi.');
        // Tải lại danh sách tin nhắn đang chờ
        loadPendingMessages();
      } else {
        // Lỗi khác
        setError('Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setSelectedStatus(newStatus);

    try {
      await supportApi.changeTicketStatus(ticket.id, newStatus);
      setSuccess(`Đã chuyển trạng thái ticket thành ${getStatusText(newStatus)}`);
      onTicketUpdated();

      // Ẩn thông báo thành công sau 3 giây
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Lỗi khi thay đổi trạng thái ticket:', err);
      setError('Có lỗi xảy ra khi thay đổi trạng thái ticket. Vui lòng thử lại sau.');
    }
  };

  // Hiển thị tin nhắn đang chờ
  const renderPendingMessageItem = (msg, index) => {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          mb: 2,
          opacity: 0.7
        }}
        key={`pending-${index}`}
      >
        <Box
          sx={{
            maxWidth: '70%',
            backgroundColor: 'warning.light',
            color: 'warning.contrastText',
            borderRadius: 2,
            px: 2,
            py: 1,
            position: 'relative',
            border: '1px dashed',
            borderColor: 'warning.main'
          }}
        >
          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center' }}>
            <WarningIcon fontSize="small" sx={{ mr: 0.5 }} />
            Đang chờ gửi
          </Typography>

          <Typography variant="body1">
            {msg.content}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'right',
              mt: 0.5,
              opacity: 0.8
            }}
          >
            {msg.createdAt ? format(new Date(msg.createdAt), 'dd/MM/yyyy HH:mm') : ''}
          </Typography>
        </Box>

        <Avatar
          sx={{
            bgcolor: 'warning.main',
            ml: 1
          }}
        >
          <PersonIcon />
        </Avatar>
      </Box>
    );
  };

  const renderMessageItem = (msg) => {
    // Xác định người gửi có phải là currentUser không
    const isCurrentUser = msg.sender === (currentUser?.user?.id || currentUser?.id);
    // Nếu là admin và không có tên, hiển thị 'Admin'
    const isFromAdmin = msg.is_from_admin;
    const senderName = isFromAdmin ? (msg.sender_name && msg.sender_name.trim() !== '' ? msg.sender_name : 'Admin') : (msg.sender_name || 'Unknown');

    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
          mb: 2
        }}
        key={msg.id}
      >
        {/* Avatar bên trái nếu không phải currentUser */}
        {!isCurrentUser && (
          <Avatar
            sx={{
              bgcolor: isFromAdmin ? 'primary.main' : 'success.main',
              mr: 1
            }}
          >
            {isFromAdmin ? <AdminIcon /> : <PersonIcon />}
          </Avatar>
        )}

        <Box
          sx={{
            maxWidth: '70%',
            backgroundColor: isCurrentUser ? 'primary.light' : 'grey.200',
            color: isCurrentUser ? 'primary.contrastText' : 'text.primary',
            borderRadius: 2,
            px: 2,
            py: 1,
            position: 'relative'
          }}
        >
          <Typography variant="subtitle2">
            {senderName}
          </Typography>

          <Typography variant="body1">
            {msg.content}
          </Typography>

          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'right',
              mt: 0.5,
              opacity: 0.8
            }}
          >
            {msg.created_at ? format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm') : ''}
          </Typography>
        </Box>

        {/* Avatar bên phải nếu là currentUser */}
        {isCurrentUser && (
          <Avatar
            sx={{
              bgcolor: isFromAdmin ? 'primary.main' : 'success.main',
              ml: 1
            }}
          >
            {isFromAdmin ? <AdminIcon /> : <PersonIcon />}
          </Avatar>
        )}
      </Box>
    );
  };

  if (!ticket) return null;

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{ticket.title}</Typography>
          <Chip
            icon={getStatusIcon(ticket.status)}
            label={getStatusText(ticket.status)}
            color={getStatusColor(ticket.status)}
          />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, color: 'text.secondary' }}>
          <Typography variant="body2">
            ID: {ticket.id}
          </Typography>
          <Typography variant="body2">
            Tạo: {ticket.created_at ? format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm') : ''}
          </Typography>
        </Box>

        {fromFallback && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Đang hiển thị dữ liệu dự phòng. Một số tính năng có thể không khả dụng do lỗi kết nối.
          </Alert>
        )}

        <Divider sx={{ my: 1.5 }} />

        <Typography variant="body1">
          {ticket.description}
        </Typography>

        {isAdmin && (
          <Box sx={{ mt: 2 }}>
            <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Trạng thái</InputLabel>
              <Select
                value={selectedStatus}
                onChange={handleStatusChange}
                label="Trạng thái"
                disabled={fromFallback}
              >
                <MenuItem value="open">Đang mở</MenuItem>
                <MenuItem value="in_progress">Đang xử lý</MenuItem>
                <MenuItem value="resolved">Đã giải quyết</MenuItem>
                <MenuItem value="closed">Đã đóng</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}

        {(error || success) && (
          <Box sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            )}
          </Box>
        )}
      </Box>

      <Divider />

      {pendingMessages.length > 0 && (
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'warning.light' }}>
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', color: 'warning.contrastText' }}>
            <WarningIcon fontSize="small" sx={{ mr: 1 }} />
            {pendingMessages.length} tin nhắn đang chờ gửi
          </Typography>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<SyncIcon />}
            onClick={retryPendingMessages}
            disabled={retryingPending}
            sx={{ color: 'warning.contrastText', borderColor: 'warning.contrastText' }}
          >
            {retryingPending ? <CircularProgress size={20} /> : 'Thử lại'}
          </Button>
        </Box>
      )}

      <Box
        sx={{
          flexGrow: 1,
          p: 2,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 450px)',
          minHeight: '300px'
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 && pendingMessages.length === 0 ? (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: 'text.secondary'
          }}>
            <ChatIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography align="center">
              Chưa có tin nhắn nào. Hãy gửi tin nhắn đầu tiên!
            </Typography>
            <Typography variant="caption" align="center" sx={{ mt: 1, maxWidth: '80%' }}>
              {isAdmin
                ? 'Bạn có thể bắt đầu cuộc hội thoại với người dùng bằng cách gửi tin nhắn ở phía dưới.'
                : 'Hãy để lại tin nhắn mô tả chi tiết về vấn đề của bạn để nhân viên hỗ trợ có thể giúp đỡ bạn nhanh nhất.'}
            </Typography>
          </Box>
        ) : (
          <React.Fragment>
            {messages.map(renderMessageItem)}
            {pendingMessages.map(renderPendingMessageItem)}
            <div ref={chatEndRef} />
          </React.Fragment>
        )}
      </Box>

      <Divider />

      <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          placeholder="Nhập tin nhắn..."
          variant="outlined"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={sending || ticket.status === 'closed'}
          multiline
          maxRows={3}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <Badge
          color="warning"
          badgeContent={pendingMessages.length}
          invisible={pendingMessages.length === 0}
          sx={{ ml: 1 }}
        >
          <Button
            variant="contained"
            color="primary"
            sx={{ height: 56, minWidth: 56, width: 56 }}
            onClick={handleSendMessage}
            disabled={sending || !message.trim() || ticket.status === 'closed'}
          >
            {sending ? <CircularProgress size={24} /> : <SendIcon />}
          </Button>
        </Badge>
      </Box>
    </Paper>
  );
};

export default TicketDetail; 