/**
 * ==========================================================================
 * Javascript xử lý logic động cho Trang Hệ thống Giới thiệu (Referral System)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    
    // --- 1. KHỞI TẠO CÁC DROPDOWN VÀ THÔNG BÁO CHUNG ---
    initUserDropdown();
    initNotificationBell();

    // --- 2. XỬ LÝ CHIA SẺ VÀ SAO CHÉP MÃ/LINK GIỚI THIỆU ---
    initCopyFields();
    initQuickShareButtons();

    // --- 3. XỬ LÝ LỌC THỜI GIAN VÀ PHÂN TRANG BẢNG MẠNG LƯỚI ---
    initTableFiltersAndPagination();
});

/**
 * Xử lý bật tắt Dropdown Menu KOC Profile góc phải
 */
function initUserDropdown() {
    const userProfileMenu = document.getElementById('userProfileMenu');
    const userDropdownMenu = document.getElementById('userDropdownMenu');

    if (!userProfileMenu || !userDropdownMenu) return;

    userProfileMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        const isShown = userDropdownMenu.classList.contains('show');
        
        if (isShown) {
            userDropdownMenu.classList.remove('show');
            userProfileMenu.classList.remove('active');
            userProfileMenu.setAttribute('aria-expanded', 'false');
        } else {
            userDropdownMenu.classList.add('show');
            userProfileMenu.classList.add('active');
            userProfileMenu.setAttribute('aria-expanded', 'true');
        }
    });

    document.addEventListener('click', function(e) {
        if (!userProfileMenu.contains(e.target) && !userDropdownMenu.contains(e.target)) {
            userDropdownMenu.classList.remove('show');
            userProfileMenu.classList.remove('active');
            userProfileMenu.setAttribute('aria-expanded', 'false');
        }
    });
}

/**
 * Chuông báo thông báo ở đầu trang
 */
function initNotificationBell() {
    const bellBtn = document.getElementById('bellNotificationBtn');
    if (bellBtn) {
        bellBtn.addEventListener('click', function() {
            alert('Bạn có 3 thông báo mới chưa đọc từ hệ thống KOC/KOL Affiliate Network!');
            const badge = bellBtn.querySelector('.notification-badge');
            if (badge) badge.remove(); // Xoá chấm đỏ thông báo
        });
    }
}

/**
 * Hàm sao chép nội dung trong các ô Mã và Đường dẫn giới thiệu
 */
function copyInviteField(inputId, fieldName) {
    const inputEl = document.getElementById(inputId);
    if (!inputEl) return;

    const copyText = inputEl.value.trim();

    // Sử dụng Clipboard API hiện đại của trình duyệt
    navigator.clipboard.writeText(copyText).then(() => {
        showRefToast(`Đã sao chép ${fieldName} thành công! 📋`);
    }).catch(err => {
        console.error('Không thể sao chép văn bản: ', err);
        // Phương án dự phòng cho trình duyệt cũ
        inputEl.select();
        inputEl.setSelectionRange(0, 99999);
        try {
            document.execCommand('copy');
            showRefToast(`Đã sao chép ${fieldName} (dự phòng)!`);
        } catch (ex) {
            showRefToast('Không thể sao chép tự động. Hãy chọn bằng tay.');
        }
    });
}

/**
 * Đăng ký hàm copyInviteField toàn cục để gọi từ HTML inline onclick
 */
window.copyInviteField = copyInviteField;

function initCopyFields() {
    // Không cần xử lý bổ sung vì hàm copyInviteField đã được khai báo toàn cục để HTML gọi trực tiếp.
}

/**
 * Thiết lập các tương tác cho các nút chia sẻ nhanh (Facebook, Zalo, Telegram)
 */
function initQuickShareButtons() {
    const shareBtns = document.querySelectorAll('.btn-share');
    const inviteLinkVal = document.getElementById('inviteLinkVal');
    
    if (shareBtns.length === 0 || !inviteLinkVal) return;

    shareBtns.forEach(btn => {
        btn.addEventListener('click', function (e) {
            // Loại trừ nút copylink vì nó đã gọi hàm inline onclick
            if (this.classList.contains('copylink')) return;

            let platformName = '';
            if (this.classList.contains('facebook')) {
                platformName = 'Facebook';
            } else if (this.classList.contains('zalo')) {
                platformName = 'Zalo';
            } else if (this.classList.contains('telegram')) {
                platformName = 'Telegram';
            }

            // Giả lập mở cửa sổ popup chia sẻ
            showRefToast(`Đang kết nối cổng chia sẻ với ứng dụng ${platformName}...`);
            
            setTimeout(() => {
                // Tạo một tin nhắn chia sẻ mẫu cực kỳ chân thực
                const shareText = `Tham gia mạng lưới KOC/KOL Affiliate Network cùng tôi để kiếm hoa hồng khủng trọn đời! Đường dẫn đăng ký: http://${inviteLinkVal.value}`;
                
                // Mở cửa sổ giả lập chia sẻ
                const width = 600;
                const height = 450;
                const left = (screen.width - width) / 2;
                const top = (screen.height - height) / 2;
                
                console.log(`[SHARE SIMULATOR] Mở cửa sổ chia sẻ trên ${platformName} với nội dung: "${shareText}"`);
                alert(`[Bộ mô phỏng chia sẻ ${platformName}]\n\nĐang chuẩn bị gửi nội dung chia sẻ:\n"${shareText}"`);
                
                showRefToast(`Đã chia sẻ thành công cơ hội lên ${platformName}! 🎉`);
            }, 800);
        });
    });
}

/**
 * Thiết lập tương tác cho bộ lọc thời gian và phân trang bảng dữ liệu
 */
function initTableFiltersAndPagination() {
    const btnFilterTime = document.querySelector('.btn-filter-time');
    const pageSizeSelect = document.querySelector('.page-size-select');
    const pageNumBtns = document.querySelectorAll('.btn-page-num');
    const arrowBtns = document.querySelectorAll('.btn-page-arrow');
    const kocTable = document.querySelector('.koc-table');

    // 1. Nhấp nút lọc thời gian
    if (btnFilterTime) {
        btnFilterTime.addEventListener('click', function () {
            // Xoay nhẹ chevron
            const arrow = this.querySelector('.arrow-down');
            if (arrow) {
                arrow.style.transform = arrow.style.transform === 'rotate(180deg)' ? 'rotate(0deg)' : 'rotate(180deg)';
            }
            
            // Bắn toast thông báo
            showRefToast('Hệ thống đang thống kê lại mạng lưới theo: [Tháng này]');
        });
    }

    // 2. Thay đổi số lượng dòng hiển thị
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', function () {
            const size = this.value;
            showRefToast(`Đang tải dữ liệu mạng lưới KOC: Hiển thị ${size} dòng trên trang...`);
            
            // Giả lập hiệu ứng tải lại bảng mượt mà
            if (kocTable) {
                kocTable.style.opacity = '0.4';
                setTimeout(() => {
                    kocTable.style.opacity = '1';
                }, 400);
            }
        });
    }

    // 3. Chuyển đổi số trang phân trang
    pageNumBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            if (this.classList.contains('active')) return;

            // Xóa active cũ và thêm active mới
            pageNumBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const pageNum = this.textContent;
            showRefToast(`Đang chuyển hướng sang dữ liệu phân trang: [Trang ${pageNum}]`);

            // Giả lập hiệu ứng tải lại bảng mượt mà
            if (kocTable) {
                kocTable.style.opacity = '0.3';
                setTimeout(() => {
                    kocTable.style.opacity = '1';
                    // Đưa trang lên đầu bảng cuộn
                    kocTable.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 300);
            }
        });
    });

    // 4. Nhấp nút mũi tên phân trang
    arrowBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            showRefToast('Chuyển trang tiếp theo của mạng lưới KOC...');
        });
    });
}

/**
 * Hiển thị Toast thông báo ở góc màn hình (Slide-in Toast System)
 */
function showRefToast(message) {
    const toast = document.getElementById('refToast');
    if (!toast) return;

    const messageEl = toast.querySelector('.toast-message');
    if (messageEl) {
        messageEl.textContent = message;
    }

    // Hủy bỏ hẹn giờ ẩn cũ nếu có click dồn dập
    if (toast.dataset.timerId) {
        clearTimeout(parseInt(toast.dataset.timerId));
    }

    toast.classList.add('show');

    // Tự động ẩn sau 3.5 giây
    const timerId = setTimeout(function () {
        toast.classList.remove('show');
    }, 3500);

    toast.dataset.timerId = timerId.toString();
}
