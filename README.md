# FaceTrack-AI - Hệ thống chấm công khuôn mặt bằng AI

FaceTrack-AI là hệ thống chấm công hiện đại sử dụng trí tuệ nhân tạo để nhận diện khuôn mặt, chống giả mạo (anti-spoofing), quản lý nhân viên, ca làm việc, hỗ trợ và dashboard trực quan.

---

## Tính năng nổi bật

- Nhận diện khuôn mặt chính xác với DeepFace
- Chống giả mạo (anti-spoofing)
- Quản lý nhân viên, phòng ban, ca làm việc
- Chấm công, thống kê, báo cáo
- Hỗ trợ, khiếu nại, chat nội bộ (admin - nhân viên)
- Giao diện React hiện đại, thân thiện
- API RESTful chuẩn, dễ tích hợp

---

## Yêu cầu hệ thống

- **Python** 3.7+
- **Node.js** 14+
- **Docker** & **Docker Compose** (Khuyến nghị để chạy nhanh)
- **PostgreSQL** (chạy qua Docker)
- Các thư viện Python: DeepFace, OpenCV, Django, djangorestframework, psycopg2-binary, ...
- Các thư viện JS: React, Material-UI, Axios, ...

---

## Cài đặt & Khởi động nhanh với Docker

1. **Clone source code**

   ```bash
   git clone https://github.com/your-username/FaceTrack-AI.git
   cd FaceTrack-AI
   ```

2. **Chạy toàn bộ hệ thống bằng Docker Compose**

   ```bash
   docker-compose up -d
   ```

- **Chạy lần đầu**: Nên migrate database và tạo superuser Django để truy cập trang admin:
  ```bash
  docker-compose exec backend python manage.py migrate
  docker-compose exec backend python manage.py createsuperuser
  ```

3. **Truy cập ứng dụng:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8000](http://localhost:8000)
   - Admin Django: [http://localhost:8000/admin](http://localhost:8000/admin)

---

## Hướng dẫn chạy thủ công (không dùng Docker)

### Backend (Django)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # hoặc .\venv\Scripts\activate trên Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend (React)

```bash
cd frontend
npm install
npm start
```

---

## Cấu trúc thư mục

```
FaceTrack-AI/
├── backend/             # Django backend
│   ├── api/             # API endpoints
│   ├── attendance/      # Quản lý chấm công
│   ├── employees/       # Quản lý nhân viên
│   ├── support/         # Hỗ trợ, khiếu nại, chat
│   ├── notifications/   # Thông báo
│   ├── face_checkin/    # Cấu hình Django chính
│   └── manage.py
│
├── frontend/            # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
│
├── docker-compose.yml   # Chạy toàn bộ hệ thống
├── nginx/               # Cấu hình reverse proxy (nếu dùng)
└── media/               # Lưu trữ ảnh khuôn mặt, file upload
```

---

## Một số lưu ý khi sử dụng

- **Ảnh khuôn mặt**: Được lưu trong thư mục `media/face_data/` và truy cập qua backend.
- **Kết nối database**: Mặc định dùng PostgreSQL qua Docker, port 5432.
- **Cấu hình domain**: Nếu deploy thật, cần sửa các biến môi trường trong `docker-compose.yml` cho đúng domain thực tế.
- **Chạy lần đầu**: Nên tạo superuser Django để truy cập trang admin:
  ```bash
  docker-compose exec backend python manage.py createsuperuser
  ```

---

## Demo tính năng anti-spoofing với DeepFace

```python
from deepface import DeepFace
face_objs = DeepFace.extract_faces(img_path="image.jpg", anti_spoofing=True)
assert all(face_obj["is_real"] is True for face_obj in face_objs)
```

---
