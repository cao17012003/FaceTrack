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
  useTheme
} from '@mui/material';
import { 
  SupportAgent as SupportIcon,
  Add as AddIcon 
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
  const { isAdmin } = useAuth();
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
      if (isAdmin()) {
        // Admin lấy tất cả ticket và lọc theo tab đang chọn
        const status = tabValue === 0 ? '' : 
                     tabValue === 1 ? 'open' : 
                     tabValue === 2 ? 'in_progress' : 
                     tabValue === 3 ? 'resolved' : 'closed';
        
        response = await supportApi.getAllTickets({ status });
      } else {
        // Nhân viên chỉ lấy ticket của họ
        response = await supportApi.getMyTickets();
      }
      
      // Kiểm tra response có tồn tại không
      if (response && response.data) {
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
            } else {
              console.error("Không nhận được dữ liệu chi tiết ticket hợp lệ");
              setError("Không thể tải chi tiết yêu cầu hỗ trợ. Vui lòng thử lại sau.");
            }
          } catch (detailErr) {
            console.error("Error loading ticket details:", detailErr);
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
      } else {
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
      setError('Có lỗi xảy ra khi tải danh sách hỗ trợ. Vui lòng thử lại sau.');
      
      // Lưu mã lỗi nếu có
      if (err.response) {
        setErrorCode(err.response.status);
      }
      
      setTickets([]);
    } finally {
      setLoading(false);
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
            
            // Không hiển thị lỗi cho người dùng vì đã có dữ liệu cơ bản
            // setError("Không thể tải chi tiết yêu cầu hỗ trợ. Vui lòng thử lại sau.");
            
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
          
          // Cập nhật danh sách tickets
          let response;
          if (isAdmin()) {
            response = await supportApi.getAllTickets({});
          } else {
            response = await supportApi.getMyTickets();
          }
          
          if (response && response.data) {
            setTickets(response.data);
            
            // Kiểm tra nếu đây là dữ liệu dự phòng
            if (response._fromFallback) {
              console.log("Đang sử dụng danh sách ticket từ cache");
              
              // Hiển thị thông báo cho người dùng
              setError("Đang hiển thị dữ liệu đã lưu trong bộ nhớ. Một số thông tin có thể không phải là mới nhất.");
            }
          }
          
          // Hiển thị ticket chi tiết
          setSelectedTicket(detailResponse.data);
        } catch (detailErr) {
          console.error("Error loading ticket details:", detailErr);
          
          // Hiển thị ticket mặc định với thông tin từ newTicketData
          console.log("Sử dụng thông tin cơ bản từ ticket mới tạo");
          setSelectedTicket({
            ...newTicketData,
            _fromFallback: true,
            _source: 'creation'
          });
          
          // Hiển thị thông báo lỗi
          setError("Không thể tải đầy đủ thông tin. Hiển thị dữ liệu cơ bản.");
          
          // Lưu mã lỗi nếu có
          if (detailErr.response) {
            setErrorCode(detailErr.response.status);
          }
        }
      } else {
        // Trường hợp cũ: tìm ticket mới nhất nếu không có dữ liệu truyền vào
        let response;
        try {
          if (isAdmin()) {
            response = await supportApi.getAllTickets({});
          } else {
            response = await supportApi.getMyTickets();
          }
          
          if (response && response.data) {
            setTickets(response.data);
            
            // Tự động chọn ticket mới nhất vừa tạo (ticket có created_at gần nhất)
            if (response.data.length > 0) {
              const sortedTickets = [...response.data].sort((a, b) => 
                new Date(b.created_at) - new Date(a.created_at)
              );
              
              // Chọn ticket mới nhất
              const newestTicket = sortedTickets[0];
              
              // Lấy thông tin chi tiết của ticket mới nhất để hiển thị
              try {
                const detailResponse = await supportApi.getTicketById(newestTicket.id);
                setSelectedTicket(detailResponse.data);
              } catch (detailErr) {
                console.error("Không thể tải chi tiết ticket mới nhất:", detailErr);
                // Sử dụng dữ liệu cơ bản
                setSelectedTicket(newestTicket);
              }
            }
          }
        } catch (listErr) {
          console.error("Không thể tải danh sách ticket:", listErr);
          setError("Không thể tải danh sách yêu cầu hỗ trợ. Vui lòng làm mới trang.");
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải lại danh sách ticket:', err);
      setError('Có lỗi xảy ra khi tải danh sách hỗ trợ. Vui lòng thử lại sau.');
      
      // Lưu mã lỗi nếu có
      if (err.response) {
        setErrorCode(err.response.status);
      }
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
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          <SupportIcon sx={{ mr: 1, fontSize: 35 }} />
          Hỗ trợ & Khiếu nại
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateTicket}
        >
          Tạo yêu cầu hỗ trợ mới
        </Button>
      </Box>
      
      {isAdmin() && (
        <Paper sx={{ mb: 3, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Thống kê</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: theme.palette.info.light,
                  color: theme.palette.info.contrastText
                }}
              >
                <Typography variant="h3">{ticketStats.open}</Typography>
                <Typography variant="subtitle2">Đang mở</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: theme.palette.warning.light,
                  color: theme.palette.warning.contrastText
                }}
              >
                <Typography variant="h3">{ticketStats.in_progress}</Typography>
                <Typography variant="subtitle2">Đang xử lý</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: theme.palette.success.light,
                  color: theme.palette.success.contrastText
                }}
              >
                <Typography variant="h3">{ticketStats.resolved}</Typography>
                <Typography variant="subtitle2">Đã giải quyết</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center',
                  bgcolor: theme.palette.grey[300],
                }}
              >
                <Typography variant="h3">{ticketStats.closed}</Typography>
                <Typography variant="subtitle2">Đã đóng</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {error && !errorCode && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {isAdmin() ? (
        <Tabs 
          value={tabValue} 
          onChange={handleChangeTab} 
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Tất cả" />
          <Tab 
            label="Đang mở" 
            icon={ticketStats.open > 0 ? <Badge badgeContent={ticketStats.open} color="error" /> : null}
            iconPosition="end"
          />
          <Tab 
            label="Đang xử lý"
            icon={ticketStats.in_progress > 0 ? <Badge badgeContent={ticketStats.in_progress} color="warning" /> : null}
            iconPosition="end"
          />
          <Tab label="Đã giải quyết" />
          <Tab label="Đã đóng" />
        </Tabs>
      ) : (
        <Divider sx={{ mb: 3 }} />
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : errorCode ? (
        <ErrorHandler 
          error={error}
          errorCode={errorCode}
          onRetry={handleRetry}
          onCreateNewTicket={handleCreateTicket}
        />
      ) : tickets.length === 0 ? (
        <EmptySupportState onCreateTicket={handleCreateTicket} />
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
      
      <NewTicketDialog 
        open={createDialogOpen} 
        onClose={handleCloseCreateDialog} 
        onTicketCreated={handleTicketCreated}
      />
    </Box>
  );
};

export default SupportPage; 