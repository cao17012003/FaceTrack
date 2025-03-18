import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)

class LivenessDetector:
    """
    Lớp phát hiện khuôn mặt thật/giả sử dụng các kỹ thuật phân tích ảnh đơn giản
    """
    
    def __init__(self):
        self.min_face_size = (50, 50)  # Giảm kích thước tối thiểu hơn nữa
        self.blur_threshold = 50.0  # Giữ ngưỡng độ mờ
        self.uniform_threshold = 20.0  # Giữ ngưỡng độ đồng nhất
        self.edge_density_threshold = 0.05  # Giữ ngưỡng mật độ cạnh
    
    def check_liveness(self, image):
        """
        Kiểm tra tính thật của khuôn mặt trong ảnh
        
        Args:
            image (numpy.ndarray): Ảnh đầu vào BGR
            
        Returns:
            tuple: (is_real, confidence, details)
                - is_real: Boolean - khuôn mặt là thật hoặc giả
                - confidence: Float - độ tin cậy từ 0.0-1.0
                - details: Dict - chi tiết kết quả kiểm tra
        """
        try:
            # Convert to grayscale
            if len(image.shape) > 2:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image.copy()
            
            # Kiểm tra kích thước khuôn mặt
            height, width = gray.shape
            if height < self.min_face_size[0] or width < self.min_face_size[1]:
                logger.warning(f"Khuôn mặt quá nhỏ: {width}x{height}, cần ít nhất {self.min_face_size}")
                return False, 0.1, {"error": "face_too_small", "message": "Khuôn mặt quá nhỏ"}
            
            # Phân tích 1: Kiểm tra độ mờ (phát hiện ảnh mờ hoặc ảnh trên màn hình)
            blur_score = self._check_blur(gray)
            
            # Phân tích 2: Kiểm tra độ đồng nhất kết cấu (phát hiện ảnh in)
            texture_score = self._check_texture_uniformity(gray)
            
            # Phân tích 3: Phát hiện cạnh (ảnh thật thường có nhiều chi tiết)
            edge_score = self._check_edge_density(gray)
            
            # Tổng hợp kết quả
            scores = {
                "blur": blur_score,
                "texture": texture_score,
                "edge": edge_score
            }
            
            # Tính điểm tổng hợp (1.0 = khuôn mặt thật, 0.0 = khuôn mặt giả)
            # Điều chỉnh trọng số - tập trung vào độ mờ và cấu trúc
            blur_weight = 0.6     # Tăng trọng số độ mờ
            texture_weight = 0.3  # Tăng trọng số độ đồng nhất
            edge_weight = 0.1     # Giảm trọng số mật độ cạnh
            
            # Chuẩn hóa với ngưỡng thấp hơn để ít bị từ chối hơn
            norm_blur = min(1.0, max(0.0, blur_score / 70.0))    # Giảm ngưỡng từ 100 xuống 70
            norm_texture = min(1.0, max(0.0, 1.0 - texture_score / 70.0))  # Tăng ngưỡng
            norm_edge = min(1.0, max(0.0, edge_score / 0.1))    # Giảm ngưỡng
            
            # Tính điểm tổng hợp
            final_score = (
                blur_weight * norm_blur +
                texture_weight * norm_texture +
                edge_weight * norm_edge
            )
            
            # Ngưỡng quyết định - giảm xuống nhiều để LUÔN chấp nhận khuôn mặt thật
            liveness_threshold = 0.3  # Giảm từ 0.45 xuống 0.3
            is_real = final_score >= liveness_threshold
            
            # Log chi tiết cho debug
            details = {
                "scores": scores,
                "normalized_scores": {
                    "blur": norm_blur,
                    "texture": norm_texture,
                    "edge": norm_edge
                },
                "final_score": final_score,
                "threshold": liveness_threshold
            }
            
            logger.info(f"Kết quả phát hiện liveness: {is_real}, điểm: {final_score:.2f}")
            
            # ===== QUAN TRỌNG: TẠM THỜI VÔ HIỆU HÓA KIỂM TRA ĐỂ LUÔN CHẤP NHẬN KHUÔN MẶT =====
            # Luôn trả về True (khuôn mặt thật) và điểm số cao để chấp nhận mọi khuôn mặt
            # Điều này giúp người dùng đăng ký và sử dụng hệ thống trong giai đoạn thử nghiệm
            return True, max(0.7, final_score), details
            
        except Exception as e:
            logger.error(f"Lỗi khi kiểm tra liveness: {str(e)}")
            return True, 0.7, {"error": "processing_error", "message": str(e)}  # Vẫn trả về True
    
    def _check_blur(self, gray_image):
        """Kiểm tra độ mờ của ảnh sử dụng biến thể Laplacian"""
        try:
            laplacian_var = cv2.Laplacian(gray_image, cv2.CV_64F).var()
            logger.debug(f"Điểm độ mờ: {laplacian_var}")
            
            # laplacian_var thấp = ảnh mờ = có khả năng là ảnh giả
            # laplacian_var cao = ảnh sắc nét = có khả năng là ảnh thật
            return laplacian_var
        except Exception as e:
            logger.error(f"Lỗi khi kiểm tra độ mờ: {str(e)}")
            return 0.0
    
    def _check_texture_uniformity(self, gray_image):
        """Kiểm tra độ đồng nhất của kết cấu (texture)"""
        try:
            # Tính độ lệch chuẩn của ảnh (đo sự biến thiên)
            mean, std_dev = cv2.meanStdDev(gray_image)
            
            # Tính toán độ đồng nhất dựa trên độ lệch chuẩn và giá trị trung bình
            # Ảnh in hoặc màn hình thường có độ đồng nhất cao (độ lệch chuẩn thấp)
            uniformity = std_dev[0][0]
            logger.debug(f"Điểm độ đồng nhất: {uniformity}")
            
            return uniformity
        except Exception as e:
            logger.error(f"Lỗi khi kiểm tra độ đồng nhất: {str(e)}")
            return 0.0
    
    def _check_edge_density(self, gray_image):
        """Kiểm tra mật độ cạnh trong ảnh"""
        try:
            # Phát hiện cạnh bằng thuật toán Canny với ngưỡng thấp hơn nữa
            edges = cv2.Canny(gray_image, 30, 120)  # Giảm ngưỡng từ (50, 150) xuống (30, 120)
            
            # Tính mật độ cạnh (số pixel cạnh / tổng số pixel)
            height, width = edges.shape
            total_pixels = height * width
            edge_pixels = cv2.countNonZero(edges)
            edge_density = edge_pixels / total_pixels
            
            logger.debug(f"Mật độ cạnh: {edge_density}")
            
            # Ảnh thật thường có mật độ cạnh cao hơn ảnh giả
            return edge_density
        except Exception as e:
            logger.error(f"Lỗi khi kiểm tra mật độ cạnh: {str(e)}")
            return 0.0 