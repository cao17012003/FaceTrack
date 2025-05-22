import React from 'react';
import {
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Chip,
  Divider,
  Box,
  Badge,
  Card,
  alpha,
  useTheme
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  Inventory as OpenIcon,
  HourglassTop as InProgressIcon,
  CheckCircle as ResolvedIcon,
  Cancel as ClosedIcon,
  Flag as LowIcon,
  FlagCircle as MediumIcon,
  PriorityHigh as HighIcon,
  Error as UrgentIcon,
  QuestionAnswer as MessageIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const getPriorityIcon = (priority) => {
  switch (priority) {
    case 'low':
      return <LowIcon fontSize="small" sx={{ color: '#8bc34a' }} />;
    case 'medium':
      return <MediumIcon fontSize="small" sx={{ color: '#ff9800' }} />;
    case 'high':
      return <HighIcon fontSize="small" sx={{ color: '#f44336' }} />;
    case 'urgent':
      return <UrgentIcon fontSize="small" sx={{ color: '#d32f2f' }} />;
    default:
      return <MediumIcon fontSize="small" sx={{ color: '#ff9800' }} />;
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'open':
      return <OpenIcon fontSize="small" sx={{ color: '#2196f3' }} />;
    case 'in_progress':
      return <InProgressIcon fontSize="small" sx={{ color: '#ff9800' }} />;
    case 'resolved':
      return <ResolvedIcon fontSize="small" sx={{ color: '#4caf50' }} />;
    case 'closed':
      return <ClosedIcon fontSize="small" sx={{ color: '#9e9e9e' }} />;
    default:
      return <OpenIcon fontSize="small" sx={{ color: '#2196f3' }} />;
  }
};

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

const getPriorityText = (priority) => {
  switch (priority) {
    case 'low':
      return 'Thấp';
    case 'medium':
      return 'Trung bình';
    case 'high':
      return 'Cao';
    case 'urgent':
      return 'Khẩn cấp';
    default:
      return 'Không xác định';
  }
};

const TicketList = ({ tickets, selectedTicket, onSelectTicket, isAdmin }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  return (
    <Card 
      sx={{ 
        height: '100%', 
        maxHeight: 'calc(100vh - 250px)', 
        overflow: 'auto',
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      }}
    >
      {tickets.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <FileIcon sx={{ fontSize: 70, color: 'text.secondary', mb: 2, opacity: 0.6 }} />
          <Typography variant="h6" color="text.secondary" fontWeight="500">
            Không có yêu cầu hỗ trợ nào
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Bạn chưa có yêu cầu hỗ trợ nào. Hãy tạo mới một yêu cầu nếu bạn cần trợ giúp.
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {tickets.map((ticket) => {
            const isSelected = selectedTicket && selectedTicket.id === ticket.id;
            return (
              <React.Fragment key={ticket.id}>
                <ListItem 
                  alignItems="flex-start" 
                  sx={{ 
                    cursor: 'pointer',
                    bgcolor: isSelected 
                      ? isDark 
                        ? alpha(theme.palette.primary.main, 0.15) 
                        : alpha(theme.palette.primary.light, 0.1) 
                      : 'transparent',
                    transition: 'all 0.2s ease',
                    borderLeft: isSelected ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
                    py: 1.5,
                    '&:hover': {
                      bgcolor: isDark 
                        ? alpha(theme.palette.primary.main, 0.08)
                        : alpha(theme.palette.primary.light, 0.05)
                    }
                  }}
                  onClick={() => onSelectTicket(ticket)}
                >
                  <ListItemAvatar>
                    <Badge
                      badgeContent={ticket.unread_messages_count}
                      color="error"
                      invisible={true}
                      overlap="circular"
                    >
                      <Avatar 
                        sx={{ 
                          bgcolor: isSelected 
                            ? theme.palette.primary.main 
                            : isDark 
                              ? 'rgba(255,255,255,0.1)' 
                              : 'rgba(0,0,0,0.05)',
                          color: isSelected 
                            ? '#fff' 
                            : theme.palette.text.primary,
                          boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                        }}
                      >
                        {isSelected ? <MessageIcon /> : <FileIcon />}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography 
                        variant="subtitle1" 
                        component="div" 
                        noWrap
                        sx={{ 
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? theme.palette.primary.main : 'inherit'
                        }}
                      >
                        {ticket.title}
                      </Typography>
                    }
                    secondary={
                      <React.Fragment>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
                          <Chip 
                            icon={getStatusIcon(ticket.status)} 
                            label={getStatusText(ticket.status)} 
                            size="small" 
                            color={getStatusColor(ticket.status)}
                            variant="outlined"
                            sx={{ 
                              mr: 1, 
                              borderRadius: '4px',
                              '& .MuiChip-label': { px: 1, py: 0.1 }
                            }}
                          />
                          <Chip 
                            icon={getPriorityIcon(ticket.priority)} 
                            label={getPriorityText(ticket.priority)} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              borderRadius: '4px',
                              '& .MuiChip-label': { px: 1, py: 0.1 }
                            }}
                          />
                        </Box>
                        
                        {isAdmin ? (
                          <Typography
                            variant="body2"
                            color="text.primary"
                            sx={{ 
                              display: 'block',
                              fontWeight: 500
                            }}
                          >
                            {ticket.employee_name || 'Nhân viên không xác định'}
                          </Typography>
                        ) : null}
                        
                        {ticket.latest_message ? (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ 
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%',
                              mt: 0.5
                            }}
                          >
                            {ticket.latest_message.content}
                          </Typography>
                        ) : (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}
                          >
                            Chưa có tin nhắn
                          </Typography>
                        )}
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {ticket.updated_at ? format(new Date(ticket.updated_at), 'dd/MM/yyyy HH:mm') : ''}
                          </Typography>
                          
                          {ticket.unread_messages_count > 0 && (
                            <Chip
                              label={`${ticket.unread_messages_count} mới`}
                              color="error"
                              size="small"
                              sx={{ 
                                height: 20, 
                                fontSize: '0.7rem',
                                visibility: 'hidden' // Ẩn theo yêu cầu trước đó
                              }}
                            />
                          )}
                        </Box>
                      </React.Fragment>
                    }
                  />
                </ListItem>
                <Divider component="li" variant="inset" sx={{ ml: 0, opacity: isDark ? 0.1 : 0.6 }} />
              </React.Fragment>
            );
          })}
        </List>
      )}
    </Card>
  );
};

export default TicketList; 