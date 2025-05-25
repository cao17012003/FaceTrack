import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  Alert,
  useTheme,
  Container,
  alpha,
  Card,
  CardContent,
  IconButton,
  Fade,
  Stack
} from '@mui/material';
import { 
  SupportAgent as SupportIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  AssignmentTurnedIn as AssignmentIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { supportApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import NewTicketDialog from '../components/support/NewTicketDialog';
import TicketList from '../components/support/TicketList';
import TicketDetail from '../components/support/TicketDetail';
import EmptySupportState from '../components/support/EmptySupportState';
import ErrorHandler from '../components/support/ErrorHandler';

const SupportPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { isAdmin, currentUser, getUserInfo, getEmployeeId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [ticketStats, setTicketStats] = useState({
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
    total: 0
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Lấy danh sách ticket
  const fetchTickets = async () => {
    setLoading(true);
    setError(null);
    setErrorCode(null);
    
    try {
      // Kiểm tra xác thực trước khi gọi API
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Vui lòng đăng nhập để xem danh sách hỗ trợ');
        setTickets([]);
        setLoading(false);
        return;
      }
      
      let response;
      // Sử dụng cùng một API cho cả admin và user thông thường
      // Backend sẽ tự động lọc dựa trên thông tin người dùng
      const status = tabValue === 0 ? '' : 
                     tabValue === 1 ? 'open' : 
                     tabValue === 2 ? 'in_progress' : 
                     tabValue === 3 ? 'resolved' : 'closed';
      
      if (isAdmin()) {
        // Đối với admin, sử dụng getAllTickets với filter theo tab
        response = await supportApi.getAllTickets({ status });
      } else {
        // Đối với nhân viên thường, sử dụng getMyTickets
        // (API getMyTickets đã được sửa để gọi đến /tickets/ thay vì /tickets/my_tickets/)
        console.log("Đang tải danh sách ticket của người dùng");
        response = await supportApi.getMyTickets({ status });  // Truyền status luôn cho user thường
      }
      
      // Kiểm tra response có tồn tại không
      if (response && response.data) {
        console.log(`Đã tải ${response.data.length} tickets thành công`, response.data);
        
        // Hiển thị thông báo nếu đang dùng dữ liệu dự phòng
        if (response._fromFallback) {
          console.log(`Đang sử dụng dữ liệu dự phòng: ${response._source || 'unknown'}`);
          if (response._source === 'empty' && response.data.length === 0) {
            // Nếu không có dữ liệu và đang sử dụng fallback rỗng, hiển thị thông báo
            setError("Không thể kết nối đến máy chủ. Hiển thị giao diện trống.");
          } else {
            setError("Đang hiển thị dữ liệu dự phòng. Máy chủ hiện không khả dụng.");
          }
        }
        
        // Không cần lọc tickets nữa vì backend đã xử lý việc này
        setTickets(response.data);
        
        // Nếu chưa chọn ticket nào và có ticket trong danh sách, chọn ticket đầu tiên
        if (!selectedTicket && response.data.length > 0) {
          // Lấy chi tiết của ticket đầu tiên
          try {
            const ticketId = response.data[0].id;
            console.log(`Đang tải chi tiết ticket với ID: ${ticketId}`);
            const detailResponse = await supportApi.getTicketById(ticketId);
            
            if (detailResponse && detailResponse.data) {
              console.log("Chi tiết ticket đã tải thành công:", detailResponse.data);
              setSelectedTicket(detailResponse.data);
              
              // Hiển thị thông báo nếu đang dùng dữ liệu dự phòng
              if (detailResponse.data._fromFallback) {
                console.log(`Đang sử dụng dữ liệu dự phòng cho chi tiết ticket: ${detailResponse.data._source || 'unknown'}`);
                setError("Không thể tải đầy đủ thông tin từ máy chủ. Hiển thị dữ liệu có sẵn.");
              }
            } else {
              console.error("Không nhận được dữ liệu chi tiết ticket hợp lệ");
              setError("Không thể tải chi tiết yêu cầu hỗ trợ. Vui lòng thử lại sau.");
            }
          } catch (detailErr) {
            console.error("Error loading ticket details:", detailErr);
            // Kiểm tra nếu lỗi là 403 Forbidden - không có quyền xem ticket này
            if (detailErr.response && detailErr.response.status === 403) {
              setError("Bạn không có quyền xem yêu cầu hỗ trợ này.");
              setSelectedTicket(null);
              setErrorCode(403);
            } else {
              // Chỉ hiển thị thông báo lỗi cho người dùng khi cần thiết
              if (!isAdmin()) {
                setError("Không thể tải chi tiết yêu cầu hỗ trợ. Vui lòng thử lại sau hoặc tạo yêu cầu mới.");
                
                // Lưu mã lỗi nếu có
                if (detailErr.response) {
                  setErrorCode(detailErr.response.status);
                }
              }
            }
          }
        }
      } else {
        console.warn("Không nhận được dữ liệu ticket từ server");
        setTickets([]);
      }
      
      // Nếu là admin, lấy thêm thống kê
      if (isAdmin()) {
        try {
          const statsResponse = await supportApi.getTicketStats();
          setTicketStats(statsResponse.data);
        } catch (statsErr) {
          console.error('Lỗi khi tải thống kê:', statsErr);
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách ticket:', err);
      
      // Nếu lỗi là 403 Forbidden - không có quyền xem ticket
      if (err.response && err.response.status === 403) {
        setError("Bạn không có quyền xem danh sách yêu cầu hỗ trợ.");
        setErrorCode(403);
      } else {
        setError('Có lỗi xảy ra khi tải danh sách hỗ trợ. Vui lòng thử lại sau.');
        
        // Lưu mã lỗi nếu có
        if (err.response) {
          setErrorCode(err.response.status);
        }
      }
      
      setTickets([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchTickets();
  }, [tabValue]);
  
  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
    setSelectedTicket(null);
  };
  
  const handleSelectTicket = (ticket) => {
    // Thêm xử lý an toàn khi chọn ticket
    try {
      console.log("Đang chọn ticket:", ticket);
      
      // Kiểm tra ticket có hợp lệ không trước khi đặt vào state
      if (ticket && ticket.id) {
        (async () => {
          try {
            // Hiển thị ticket đã chọn ngay lập tức (dữ liệu cơ bản)
            // Để người dùng không phải đợi API trả về
            setSelectedTicket(ticket);
            
            // Sau đó tải thông tin chi tiết
            const response = await supportApi.getTicketById(ticket.id);
            if (response && response.data) {
              // Kiểm tra nếu đây là dữ liệu dự phòng
              if (response.data._fromFallback) {
                console.log("Đang sử dụng dữ liệu dự phòng cho chi tiết ticket:", 
                  response.data._source || 'unknown');
                
                if (!ticket._shownFallbackMessage) {
                  // Nếu là dữ liệu dự phòng, hiển thị thông báo nhưng không làm gián đoạn UI
                  setError("Hiển thị dữ liệu dự phòng. Một số tính năng có thể không khả dụng.");
                }
              }
              
              setSelectedTicket({
                ...response.data,
                _shownFallbackMessage: true // Đánh dấu đã hiển thị thông báo
              });
            } else {
              throw new Error("Không nhận được dữ liệu chi tiết ticket");
            }
          } catch (err) {
            console.error("Lỗi khi tải chi tiết ticket đã chọn:", err);
            
            // Kiểm tra nếu lỗi là 403 Forbidden - không có quyền xem ticket này
            if (err.response && err.response.status === 403) {
              setError("Bạn không có quyền xem yêu cầu hỗ trợ này.");
              setSelectedTicket(null); // Xóa ticket đã chọn
              setErrorCode(403);
              return;
            }
            
            // Lưu mã lỗi nếu có
            if (err.response) {
              setErrorCode(err.response.status);
            }
          }
        })();
      } else {
        console.error("Dữ liệu ticket không hợp lệ:", ticket);
      }
    } catch (error) {
      console.error("Lỗi không xác định khi chọn ticket:", error);
    }
  };
  
  const handleCreateTicket = () => {
    setCreateDialogOpen(true);
  };
  
  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
  };
  
  const handleTicketCreated = async (newTicketData) => {
    // Thêm log để debug
    console.log("New ticket created:", newTicketData);
    
    setLoading(true);
    setError(null);
    setErrorCode(null);
    
    try {
      // Nếu có dữ liệu ticket mới truyền vào, sử dụng nó trực tiếp
      if (newTicketData && newTicketData.id) {
        // Lấy thông tin người dùng
        const userInfo = getUserInfo();
        
        // Đầu tiên, tạo một object ticket tạm thời để hiển thị ngay lập tức
        // Thêm ticket vào danh sách hiện tại ngay lập tức để người dùng thấy
        const temporaryTicket = {
          ...newTicketData,
          status: newTicketData.status || 'open',
          created_at: newTicketData.created_at || new Date().toISOString(),
          employee_name: userInfo?.fullName || 'Bạn',
          _isTemporary: true
        };
        
        // Thêm vào danh sách tickets hiện tại để người dùng thấy ngay
        setTickets(prevTickets => [temporaryTicket, ...prevTickets]);
        
        // Đặt ticket này làm ticket được chọn
        setSelectedTicket(temporaryTicket);
        
        try {
          // Lấy thông tin chi tiết của ticket mới tạo
          console.log(`Đang tải chi tiết ticket mới tạo: ${newTicketData.id}`);
          const detailResponse = await supportApi.getTicketById(newTicketData.id);
          console.log("Ticket detail loaded:", detailResponse.data);
          
          // Kiểm tra nếu đây là dữ liệu dự phòng
          if (detailResponse.data && detailResponse.data._fromFallback) {
            console.log("Đang sử dụng dữ liệu dự phòng cho ticket:", 
              detailResponse.data._source || 'unknown');
          }
          
          // Cập nhật selectedTicket với dữ liệu đầy đủ từ server
          setSelectedTicket(detailResponse.data);
          
          // Tải lại tất cả danh sách ticket để có dữ liệu mới nhất
          await fetchTickets();
        } catch (detailErr) {
          console.error("Error loading ticket details:", detailErr);
          
          // Vẫn giữ lại ticket tạm thời đã thêm vào danh sách
          // Không cần làm gì vì danh sách đã được cập nhật
          
          // Hiển thị thông báo lỗi
          setError("Không thể tải đầy đủ thông tin. Hiển thị dữ liệu cơ bản.");
          
          // Lưu mã lỗi nếu có
          if (detailErr.response) {
            setErrorCode(detailErr.response.status);
          }
        }
      } else {
        // Trường hợp không có dữ liệu ticket mới trả về
        await fetchTickets();
      }
    } catch (err) {
      console.error('Lỗi khi tải lại danh sách ticket:', err);
      setError('Có lỗi xảy ra khi tải danh sách hỗ trợ. Vui lòng thử lại sau.');
      
      // Lưu mã lỗi nếu có
      if (err.response) {
        setErrorCode(err.response.status);
      }
      
      // Vẫn tải lại danh sách để cập nhật mới nhất
      await fetchTickets();
    } finally {
      setLoading(false);
      setCreateDialogOpen(false);
    }
  };
  
  const handleTicketUpdated = () => {
    fetchTickets();
    // Cập nhật chi tiết ticket được chọn
    if (selectedTicket) {
      const fetchTicketDetail = async () => {
        try {
          const response = await supportApi.getTicketById(selectedTicket.id);
          setSelectedTicket(response.data);
        } catch (err) {
          console.error('Lỗi khi cập nhật chi tiết ticket:', err);
          
          if (err.response) {
            setErrorCode(err.response.status);
          }
        }
      };
      fetchTicketDetail();
    }
  };
  
  // Hàm xử lý khi người dùng muốn thử lại
  const handleRetry = () => {
    setError(null);
    setErrorCode(null);
    fetchTickets();
  };

  // Hàm làm mới dữ liệu
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTickets();
  };
  
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section - Modernized */}
      <Box 
        sx={{
          position: 'relative',
          borderRadius: 2,
          overflow: 'hidden',
          mb: 4,
          p: 3,
          background: isDark 
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.7)}, ${alpha(theme.palette.primary.main, 0.4)})`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.3)}, ${alpha(theme.palette.primary.main, 0.1)})`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            bottom: -20,
            right: -20,
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: isDark 
              ? alpha(theme.palette.primary.main, 0.1)
              : alpha(theme.palette.primary.main, 0.07),
            zIndex: 0
          }}
        />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
    <Box>
            <Typography 
              variant="h4" 
              fontWeight="bold"
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                mb: 1
              }}
            >
              <SupportIcon sx={{ mr: 1.5, fontSize: 35, color: theme.palette.primary.main }} />
          Hỗ trợ & Khiếu nại
        </Typography>
            <Typography variant="body1" color="text.secondary">
              Hệ thống hỗ trợ trực tuyến 24/7. Gửi yêu cầu và nhận phản hồi nhanh chóng từ đội ngũ hỗ trợ của chúng tôi.
            </Typography>
          </Box>
        
          <Stack direction="row" spacing={1}>
            {!isAdmin() && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateTicket}
                sx={{ 
                  fontWeight: 600, 
                  px: 3, 
                  py: 1,
                  borderRadius: 2,
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}
        >
                Tạo yêu cầu mới
        </Button>
            )}
            <IconButton 
              color="primary" 
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2)
                }
              }}
            >
              <RefreshIcon sx={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Stack>
        </Box>
      </Box>
      
      {/* Stats Section - Modernized */}
      {isAdmin() && (
        <Card 
          sx={{ 
            mb: 4,
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            background: isDark 
              ? alpha(theme.palette.background.paper, 0.6)
              : theme.palette.background.paper
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AssignmentIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
              <Typography variant="h6" fontWeight="600">Thống kê yêu cầu hỗ trợ</Typography>
            </Box>
            
          <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Card 
                sx={{ 
                  p: 2, 
                    height: '100%',
                    background: isDark 
                      ? `linear-gradient(45deg, ${alpha(theme.palette.info.dark, 0.8)}, ${alpha(theme.palette.info.main, 0.5)})`
                      : `linear-gradient(45deg, ${alpha(theme.palette.info.light, 0.5)}, ${alpha(theme.palette.info.main, 0.15)})`,
                    color: isDark ? '#fff' : 'inherit',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.07)',
                    borderRadius: 2,
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)'
                    }
                }}
              >
                  <Typography variant="h3" fontWeight="bold" align="center">{ticketStats.open}</Typography>
                  <Typography variant="subtitle2" align="center" sx={{ opacity: 0.9 }}>Đang mở</Typography>
                </Card>
            </Grid>
              <Grid item xs={6} sm={3}>
                <Card 
                sx={{ 
                  p: 2, 
                    height: '100%',
                    background: isDark 
                      ? `linear-gradient(45deg, ${alpha(theme.palette.warning.dark, 0.8)}, ${alpha(theme.palette.warning.main, 0.5)})`
                      : `linear-gradient(45deg, ${alpha(theme.palette.warning.light, 0.5)}, ${alpha(theme.palette.warning.main, 0.15)})`,
                    color: isDark ? '#fff' : 'inherit',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.07)',
                    borderRadius: 2,
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)'
                    }
                }}
              >
                  <Typography variant="h3" fontWeight="bold" align="center">{ticketStats.in_progress}</Typography>
                  <Typography variant="subtitle2" align="center" sx={{ opacity: 0.9 }}>Đang xử lý</Typography>
                </Card>
            </Grid>
              <Grid item xs={6} sm={3}>
                <Card 
                sx={{ 
                  p: 2, 
                    height: '100%',
                    background: isDark 
                      ? `linear-gradient(45deg, ${alpha(theme.palette.success.dark, 0.8)}, ${alpha(theme.palette.success.main, 0.5)})`
                      : `linear-gradient(45deg, ${alpha(theme.palette.success.light, 0.5)}, ${alpha(theme.palette.success.main, 0.15)})`,
                    color: isDark ? '#fff' : 'inherit',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.07)',
                    borderRadius: 2,
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)'
                    }
                }}
              >
                  <Typography variant="h3" fontWeight="bold" align="center">{ticketStats.resolved}</Typography>
                  <Typography variant="subtitle2" align="center" sx={{ opacity: 0.9 }}>Đã giải quyết</Typography>
                </Card>
            </Grid>
              <Grid item xs={6} sm={3}>
                <Card 
                sx={{ 
                  p: 2, 
                    height: '100%',
                    background: isDark 
                      ? `linear-gradient(45deg, ${alpha(theme.palette.grey[700], 0.8)}, ${alpha(theme.palette.grey[600], 0.5)})`
                      : `linear-gradient(45deg, ${alpha(theme.palette.grey[300], 0.8)}, ${alpha(theme.palette.grey[400], 0.3)})`,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.07)',
                    borderRadius: 2,
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)'
                    }
                }}
              >
                  <Typography variant="h3" fontWeight="bold" align="center">{ticketStats.closed}</Typography>
                  <Typography variant="subtitle2" align="center" sx={{ opacity: 0.9 }}>Đã đóng</Typography>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
      
      {/* Error Alert - Styled */}
      {error && !errorCode && (
        <Fade in={true}>
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}
          >
          {error}
        </Alert>
        </Fade>
      )}
      
      {/* Tabs with animation for Admin */}
      {isAdmin() ? (
        <Paper 
          sx={{ 
            mb: 3,
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}
        >
        <Tabs 
          value={tabValue} 
          onChange={handleChangeTab} 
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                fontWeight: 500,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.04)
                }
              }
            }}
        >
            <Tab 
              label="Tất cả" 
              sx={{ 
                fontSize: '0.95rem',
                py: 1.5
              }}
            />
          <Tab 
            label="Đang mở" 
            icon={ticketStats.open > 0 ? <Badge badgeContent={ticketStats.open} color="error" /> : null}
            iconPosition="end"
              sx={{ fontSize: '0.95rem', py: 1.5 }}
          />
          <Tab 
            label="Đang xử lý"
            icon={ticketStats.in_progress > 0 ? <Badge badgeContent={ticketStats.in_progress} color="warning" /> : null}
            iconPosition="end"
              sx={{ fontSize: '0.95rem', py: 1.5 }}
          />
            <Tab 
              label="Đã giải quyết" 
              sx={{ fontSize: '0.95rem', py: 1.5 }}
            />
            <Tab 
              label="Đã đóng" 
              sx={{ fontSize: '0.95rem', py: 1.5 }}
            />
        </Tabs>
        </Paper>
      ) : (
        <Divider sx={{ mb: 3, opacity: 0.7 }} />
      )}
      
      {/* Loading, Error or Content */}
      {loading ? (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            mt: 6,
            mb: 6 
          }}
        >
          <CircularProgress size={50} thickness={4} />
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            Đang tải yêu cầu hỗ trợ...
          </Typography>
        </Box>
      ) : errorCode ? (
        <ErrorHandler 
          error={error}
          errorCode={errorCode}
          onRetry={handleRetry}
          onCreateNewTicket={handleCreateTicket}
        />
      ) : tickets.length === 0 ? (
        <Card
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 400
          }}
        >
        <EmptySupportState 
          onCreateTicket={handleCreateTicket} 
          isOffline={!navigator.onLine} 
          hasServerError={error && error.includes('máy chủ')}
        />
        </Card>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={selectedTicket ? 4 : 12}>
            <TicketList 
              tickets={tickets}
              selectedTicket={selectedTicket}
              onSelectTicket={handleSelectTicket}
              isAdmin={isAdmin()}
            />
          </Grid>
          
          {selectedTicket && (
            <Grid item xs={12} md={8}>
              <TicketDetail 
                ticket={selectedTicket}
                onTicketUpdated={handleTicketUpdated}
                isAdmin={isAdmin()}
              />
            </Grid>
          )}
        </Grid>
      )}
      
      {/* Support Dialog */}
      <NewTicketDialog 
        open={createDialogOpen} 
        onClose={handleCloseCreateDialog} 
        onTicketCreated={handleTicketCreated}
      />
      
      {/* Help Banner at Bottom */}
      {!isAdmin() && (
        <Card
          sx={{
            mt: 4,
            p: 2,
            background: isDark 
              ? alpha(theme.palette.info.dark, 0.2)
              : alpha(theme.palette.info.light, 0.2),
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <HelpIcon sx={{ color: theme.palette.info.main, mr: 1.5, fontSize: 20 }} />
            <Typography variant="body2">
              Cần thêm trợ giúp? Liên hệ với đội ngũ chúng tôi qua email: support@facetrack-ai.com
            </Typography>
    </Box>
          <Button
            variant="outlined"
            size="small"
            color="info"
            onClick={handleCreateTicket}
          >
            Tạo yêu cầu
          </Button>
        </Card>
      )}

      {/* CSS Animation for spinner */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Container>
  );
};

export default SupportPage; 