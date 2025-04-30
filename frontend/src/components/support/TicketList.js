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
  Badge
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
  Error as UrgentIcon
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
  return (
    <Paper sx={{ height: '100%', maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
      {tickets.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <FileIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Không có yêu cầu hỗ trợ nào
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Bạn chưa có yêu cầu hỗ trợ nào. Hãy tạo mới một yêu cầu nếu bạn cần trợ giúp.
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {tickets.map((ticket) => (
            <React.Fragment key={ticket.id}>
              <ListItem 
                alignItems="flex-start" 
                sx={{ 
                  cursor: 'pointer',
                  bgcolor: selectedTicket && selectedTicket.id === ticket.id ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                  transition: 'background-color 0.3s',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.08)'
                  }
                }}
                onClick={() => onSelectTicket(ticket)}
              >
                <ListItemAvatar>
                  <Badge
                    badgeContent={ticket.unread_messages_count}
                    color="error"
                    invisible={ticket.unread_messages_count === 0}
                  >
                    <Avatar>
                      <FileIcon />
                    </Avatar>
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" component="div" noWrap>
                      {ticket.title}
                    </Typography>
                  }
                  secondary={
                    <React.Fragment>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 1 }}>
                        <Chip 
                          icon={getStatusIcon(ticket.status)} 
                          label={getStatusText(ticket.status)} 
                          size="small" 
                          color={getStatusColor(ticket.status)}
                          variant="outlined"
                          sx={{ mr: 1 }}
                        />
                        <Chip 
                          icon={getPriorityIcon(ticket.priority)} 
                          label={getPriorityText(ticket.priority)} 
                          size="small" 
                          variant="outlined"
                        />
                      </Box>
                      
                      {isAdmin ? (
                        <Typography
                          variant="body2"
                          color="text.primary"
                          sx={{ display: 'block' }}
                        >
                          {ticket.employee_name || 'Nhân viên không xác định'}
                        </Typography>
                      ) : null}
                      
                      {ticket.latest_message ? (
                        <Typography
                          variant="body2"
                          color="text.primary"
                          sx={{ 
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%'
                          }}
                        >
                          {ticket.latest_message.content}
                        </Typography>
                      ) : (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ display: 'block' }}
                        >
                          Chưa có tin nhắn
                        </Typography>
                      )}
                      
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5 }}
                      >
                        {ticket.updated_at ? format(new Date(ticket.updated_at), 'dd/MM/yyyy HH:mm') : ''}
                      </Typography>
                    </React.Fragment>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default TicketList; 