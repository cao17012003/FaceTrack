## FaceTrack-AI - Hệ thống chấm công khuôn mặt

FaceTrack-AI là hệ thống chấm công hiện đại sử dụng trí tuệ nhân tạo để nhận diện khuôn mặt, hỗ trợ chống giả mạo với DeepFace.

### Tính năng chính

- Nhận diện khuôn mặt chính xác với DeepFace
- Chống giả mạo với công nghệ anti-spoofing
- Quản lý nhân viên và chấm công
- Dashboard trực quan hiển thị thống kê
- API RESTful
- Giao diện người dùng thân thiện

### Yêu cầu hệ thống

- Python 3.7+
- Node.js 14+
- Các thư viện Python: DeepFace, OpenCV, Django, Django REST framework
- Các thư viện JavaScript: React, Material-UI, Axios

### Cài đặt

1. Clone repository

```bash
git clone https://github.com/your-username/FaceTrack-AI.git
cd FaceTrack-AI
```

2. Cài đặt dependencies cho backend

```bash
cd backend
pip install -r requirements.txt
```

3. Cài đặt dependencies cho frontend

```bash
cd ../frontend
npm install
```

### Chạy ứng dụng

#### Sử dụng script tự động

Chúng tôi cung cấp các script shell để dễ dàng chạy và quản lý ứng dụng:

1. Chạy cả backend và frontend

```bash
chmod +x run_app.sh
./run_app.sh
```

2. Dừng tất cả các dịch vụ

```bash
chmod +x stop_app.sh
./stop_app.sh
```

3. Debug ứng dụng

```bash
chmod +x debug_app.sh
./debug_app.sh
```

#### Chạy thủ công

1. Chạy backend (Django)

```bash
cd backend
python manage.py runserver
```

2. Chạy frontend (React)

```bash
cd frontend
npm start
```

### Debug và Xử lý sự cố

Script `debug_app.sh` cung cấp nhiều công cụ để debug:

- Kiểm tra trạng thái backend/frontend
- Xem logs
- Kiểm tra kết nối cơ sở dữ liệu
- Theo dõi logs theo thời gian thực
- Chạy các test cơ bản
- Hiển thị thông tin phiên bản thư viện

### Cấu trúc thư mục

```
FaceTrack-AI/
├── backend/             # Django backend
│   ├── api/             # API endpoints
│   ├── attendance/      # App quản lý chấm công
│   ├── employees/       # App quản lý nhân viên
│   ├── face_checkin/    # App cấu hình Django chính
│   └── manage.py        # Django CLI
│
├── frontend/            # React frontend
│   ├── public/          # Tài nguyên tĩnh
│   ├── src/             # Mã nguồn React
│   │   ├── components/  # React components
│   │   ├── pages/       # Các trang
│   │   └── services/    # Dịch vụ API
│   └── package.json     # Cấu hình npm
│
├── run_app.sh           # Script chạy ứng dụng
├── stop_app.sh          # Script dừng ứng dụng
└── debug_app.sh         # Script debug ứng dụng
```

### Thông tin về Anti-Spoofing

FaceTrack-AI sử dụng công nghệ DeepFace để phát hiện khuôn mặt giả mạo:

```python
# Sử dụng với anti-spoofing
face_objs = DeepFace.extract_faces(img_path="image.jpg", anti_spoofing=True)
assert all(face_obj["is_real"] is True for face_obj in face_objs)
```

### Đóng góp

Vui lòng đọc [CONTRIBUTING.md](CONTRIBUTING.md) để biết chi tiết về quy trình gửi pull request.
