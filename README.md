# FaceTrack-AI

Hệ thống chấm công thông minh sử dụng công nghệ nhận diện khuôn mặt (Face Recognition)

## Tính năng

- Nhận diện khuôn mặt để điểm danh vào/ra
- Phát hiện và ngăn chặn giả mạo khuôn mặt
- Quản lý nhân viên, phòng ban và ca làm việc
- Thống kê điểm danh và báo cáo
- Hệ thống thông báo
- Dashboard trực quan
- Phân quyền admin và nhân viên

## Công nghệ sử dụng

### Backend
- Django & Django REST Framework
- Sqlite3 (cơ sở dữ liệu)
- Face Recognition (thư viện nhận diện khuôn mặt)
- OpenCV (xử lý hình ảnh)

### Frontend
- React
- Material-UI
- Chart.js
- Axios

## Cài đặt và chạy

### Backend

```bash
cd backend
python -m venv env
source env/bin/activate  # Windows: env\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## Cấu trúc dự án

- **backend/**: API Django/DRF
  - **employees/**: Quản lý nhân viên và nhận diện khuôn mặt
  - **attendance/**: Quản lý điểm danh
  - **notifications/**: Quản lý thông báo
  - **api/**: API chung và Dashboard

- **frontend/**: Ứng dụng React
  - **src/pages/**: Các trang của ứng dụng
  - **src/components/**: Components tái sử dụng
  - **src/contexts/**: React contexts cho state management

## Tác giả

FaceTrack-AI Team 