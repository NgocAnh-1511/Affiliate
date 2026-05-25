document.addEventListener('DOMContentLoaded', function() {
    
    // ==========================================================================
    // 1. Hiệu ứng chạy thanh tiến trình & Tăng doanh thu tích lũy động (Count-up Animation)
    // ==========================================================================
    const progressBarFill = document.getElementById('progressBarFill');
    const currentRevenueVal = document.getElementById('currentRevenueVal');
    const midLabelPointer = document.getElementById('midLabelPointer');

    const targetRevenue = 50000000; // Doanh thu tích lũy hiện tại (50M)
    const maxRevenue = 100000000;   // Doanh thu mục tiêu (100M)
    const duration = 1500;         // Thời gian chạy hiệu ứng (1.5 giây)

    if (progressBarFill && currentRevenueVal) {
        // Khởi động từ 0%
        progressBarFill.style.width = '0%';
        
        let startTimestamp = null;

        function step(timestamp) {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = timestamp - startTimestamp;
            
            // Tính toán tỷ lệ phần trăm thời gian hoàn thành (từ 0 đến 1)
            const progressRatio = Math.min(progress / duration, 1);
            
            // Hàm chuyển động mượt mà (Ease-out Cubic)
            const easeOutRatio = 1 - Math.pow(1 - progressRatio, 3);
            
            // Tính giá trị doanh thu chạy hiện tại
            const currentVal = Math.floor(easeOutRatio * targetRevenue);
            
            // Định dạng và hiển thị doanh thu
            currentRevenueVal.textContent = currentVal.toLocaleString('vi-VN') + ' VNĐ';
            
            // Đồng bộ hoá pointer text nhãn ở giữa thanh progress nếu có
            if (midLabelPointer) {
                midLabelPointer.textContent = currentVal.toLocaleString('vi-VN') + ' VNĐ';
            }
            
            // Tính toán chiều rộng thanh tiến trình (Target 50% max)
            const currentPercent = easeOutRatio * (targetRevenue / maxRevenue) * 100;
            progressBarFill.style.width = currentPercent + '%';

            if (progress < duration) {
                window.requestAnimationFrame(step);
            } else {
                // Đảm bảo dừng ở mốc chuẩn xác cuối cùng
                currentRevenueVal.textContent = targetRevenue.toLocaleString('vi-VN') + ' VNĐ';
                if (midLabelPointer) {
                    midLabelPointer.textContent = targetRevenue.toLocaleString('vi-VN') + ' VNĐ';
                }
                progressBarFill.style.width = ((targetRevenue / maxRevenue) * 100) + '%';
            }
        }

        // Bắt đầu chạy Animation sau 300ms delay để tạo cảm giác mượt mà khi tải trang xong
        setTimeout(function() {
            window.requestAnimationFrame(step);
        }, 300);
    }


    // ==========================================================================
    // 2. Xử lý Dropdown Đăng xuất & Chuông thông báo
    // ==========================================================================
    const userProfileMenu = document.getElementById('userProfileMenu');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    const bellNotificationBtn = document.getElementById('bellNotificationBtn');

    if (userProfileMenu && userDropdownMenu) {
        userProfileMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            userProfileMenu.classList.toggle('active');
            userDropdownMenu.classList.toggle('show');
        });
        
        // Đóng dropdown khi click ra ngoài
        document.addEventListener('click', function() {
            userProfileMenu.classList.remove('active');
            userDropdownMenu.classList.remove('show');
        });
    }

    if (bellNotificationBtn) {
        bellNotificationBtn.addEventListener('click', function() {
            const badge = bellNotificationBtn.querySelector('.notification-badge');
            if (badge) {
                badge.style.opacity = '0';
                badge.style.pointerEvents = 'none';
            }
            alert('Thông báo: Chúc mừng bạn đã duy trì Hạng Vàng xuất sắc trong 2 tháng liên tiếp!');
        });
    }
});
