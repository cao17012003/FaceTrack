import {
  Home as HomeIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Today as TodayIcon,
  Notifications as NotificationsIcon,
  Business as BusinessIcon,
  AccessTime as AccessTimeIcon,
  CameraEnhance as CameraIcon,
  SupportAgent as SupportIcon
} from '@mui/icons-material';

const items = [
  { title: 'Trang chủ', icon: HomeIcon, path: '/', requiredRole: ['admin'] },
  { title: 'Điểm danh', icon: CameraIcon, path: '/check-in', requiredRole: ['user'] },
  { title: 'Thông báo', icon: NotificationsIcon, path: '/notifications', requiredRole: ['admin', 'user'] },
  { title: 'Hỗ trợ & Khiếu nại', icon: SupportIcon, path: '/support', requiredRole: ['admin', 'user'] },
  { title: 'Nhân viên', icon: PeopleIcon, path: '/employees', requiredRole: ['admin'] },
  { title: 'Phòng ban', icon: BusinessIcon, path: '/departments', requiredRole: ['admin'] },
  { title: 'Ca làm việc', icon: AccessTimeIcon, path: '/shifts', requiredRole: ['admin'] },
  { title: 'Lịch', icon: TodayIcon, path: '/calendar', requiredRole: ['admin', 'user'] },
  { title: 'Báo cáo điểm danh', icon: AssignmentIcon, path: '/reports', requiredRole: ['admin', 'user'] },
]; 