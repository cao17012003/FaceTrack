import React from 'react';
import { Box, Container, Typography, Paper, Grid, Card, CardContent, CardHeader, Divider } from '@mui/material';
import { People as PeopleIcon, Business as BusinessIcon, AccessTime as AccessTimeIcon, Assessment as AssessmentIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
  const navigate = useNavigate();

  // Định nghĩa các chức năng quản lý của admin
  const adminFeatures = [
    {
      title: 'Quản lý Nhân viên',
      description: 'Xem, thêm, sửa, xóa thông tin nhân viên',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      path: '/employees',
    },
    {
      title: 'Quản lý Phòng ban',
      description: 'Xem, thêm, sửa, xóa thông tin phòng ban',
      icon: <BusinessIcon sx={{ fontSize: 40 }} />,
      path: '/departments',
    },
    {
      title: 'Quản lý Ca làm việc',
      description: 'Xem, thêm, sửa, xóa thông tin ca làm việc',
      icon: <AccessTimeIcon sx={{ fontSize: 40 }} />,
      path: '/shifts',
    },
    {
      title: 'Báo cáo & Thống kê',
      description: 'Xem các báo cáo và thống kê chi tiết',
      icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
      path: '/reports',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Trang Quản trị
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Chào mừng bạn đến với trang quản trị hệ thống. Dưới đây là các chức năng quản lý dành cho admin.
        </Typography>
      </Paper>

      {/* Các chức năng quản lý admin */}
      <Grid container spacing={3}>
        {adminFeatures.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-4px)',
                  transition: 'all 0.3s ease-in-out',
                },
              }}
              onClick={() => navigate(feature.path)}
            >
              <CardHeader
                avatar={feature.icon}
                title={feature.title}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '& .MuiCardHeader-avatar': {
                    color: 'white',
                  },
                }}
              />
              <Divider />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default AdminPage;
