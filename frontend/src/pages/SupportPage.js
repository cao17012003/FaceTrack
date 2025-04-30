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
        <EmptySupportState 
          onCreateTicket={handleCreateTicket} 
          isOffline={!navigator.onLine} 
          hasServerError={error && error.includes('máy chủ')}
        />
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