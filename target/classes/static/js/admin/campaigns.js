/**
 * ==========================================================================
 * Javascript xử lý logic động cho Trang Khởi tạo Chiến dịch Mới Admin
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    
    // --- 1. KHỞI TẠO CÁC DROPDOWN VÀ THÔNG BÁO CHUNG ---
    initAdminDropdown();
    initNotificationBell();

    // --- 2. ĐỊNH DẠNG SỐ TIỀN TỆ CHO NGÂN SÁCH THỜI GIAN THỰC ---
    initBudgetFormatter();

    // --- 3. ĐỒNG BỘ CÔNG TẮC BẬT TẮT VỚI Ô NHẬP LÝ LỆ (TOGGLE SWITCH & RATE INHIBITOR) ---
    initToggleSwitches();

    // --- 4. THÊM MỚI HẠNG HOA HỒNG KOC ĐỘNG (+ ADD CUSTOM TIER ROWS) ---
    initDynamicTierCreator();

    // --- 5. GỬI XUẤT BẢN & LƯU NHÁP CHIẾN DỊCH (PUBLISHER SIMULATOR) ---
    initFormPublisher();
});

/**
 * Xử lý bật tắt Dropdown Menu Administrator
 */
function initAdminDropdown() {
    const profileBtn = document.getElementById('userProfileMenu');
    const dropdownMenu = document.getElementById('userDropdownMenu');

    if (!profileBtn || !dropdownMenu) return;

    profileBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        const expanded = profileBtn.getAttribute('aria-expanded') === 'true';
        profileBtn.setAttribute('aria-expanded', !expanded);
        dropdownMenu.classList.toggle('show');
        
        // Quay nhẹ icon chevron
        const chevron = profileBtn.querySelector('.chevron-down');
        if (chevron) {
            chevron.style.transform = expanded ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    });

    document.addEventListener('click', function (e) {
        if (!profileBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
            profileBtn.setAttribute('aria-expanded', 'false');
            dropdownMenu.classList.remove('show');
            const chevron = profileBtn.querySelector('.chevron-down');
            if (chevron) {
                chevron.style.transform = 'rotate(0deg)';
            }
        }
    });
}

/**
 * Click nút chuông thông báo
 */
function initNotificationBell() {
    const bellBtn = document.getElementById('bellNotificationBtn');
    if (!bellBtn) return;

    bellBtn.addEventListener('click', function () {
        alert('Hộp thư thông báo quản trị chiến dịch:\nHiện tại chưa có chiến dịch nào bị quá hạn mức ngân sách.');
    });
}

/**
 * Định dạng ngân sách hàng nghìn bằng dấu phẩy tự động (Real-time Currency Formatter)
 */
function initBudgetFormatter() {
    const budgetInput = document.getElementById('campaignBudget');
    if (!budgetInput) return;

    // Định dạng ngay lần đầu tải trang nếu có sẵn dữ liệu từ Backend
    formatInput(budgetInput);

    budgetInput.addEventListener('input', function () {
        formatInput(this);
    });

    function formatInput(inputEl) {
        let val = inputEl.value.replace(/[^\d]/g, ''); // chỉ lấy chữ số
        if (val) {
            // Định dạng theo chuẩn phân tách hàng nghìn Việt Nam
            inputEl.value = parseInt(val).toLocaleString('vi-VN');
        } else {
            inputEl.value = '';
        }
    }
}

/**
 * Lắng nghe công tắc switch ban đầu để bật/tắt ô nhập tỷ lệ tương thích
 */
function initToggleSwitches() {
    const checkboxes = document.querySelectorAll('.toggle-checkbox');
    checkboxes.forEach(cb => {
        setupSwitchBehavior(cb);
    });
}

/**
 * Cài đặt hành vi khi công tắc thay đổi (Tắt -> Khóa ô gõ tỷ lệ & làm mờ dòng)
 */
function setupSwitchBehavior(checkbox) {
    checkbox.addEventListener('change', function () {
        const row = this.closest('.tier-row');
        const rateInput = row.querySelector('.rate-input-control');

        if (this.checked) {
            row.classList.remove('disabled');
            if (rateInput) rateInput.disabled = false;
        } else {
            row.classList.add('disabled');
            if (rateInput) rateInput.disabled = true;
        }
    });

    // Chạy đồng bộ ngay lần đầu để kiểm tra nếu backend trả về trạng thái false
    const row = checkbox.closest('.tier-row');
    const rateInput = row.querySelector('.rate-input-control');
    if (!checkbox.checked) {
        row.classList.add('disabled');
        if (rateInput) rateInput.disabled = true;
    }
}

/**
 * Xử lý thêm/xoá các dòng Hạng KOC hoa hồng động
 */
function initDynamicTierCreator() {
    const addBtn = document.getElementById('addTierBtn');
    const container = document.getElementById('tiersListContainer');

    if (!addBtn || !container) return;

    addBtn.addEventListener('click', function () {
        const newId = 'custom_' + Date.now();
        
        // Tạo phần tử div mới
        const row = document.createElement('div');
        row.className = 'tier-row new-row';
        row.setAttribute('data-id', newId);

        // Chèn mã HTML chứa input tên hạng để tự định nghĩa
        row.innerHTML = `
            <!-- Cột 1: Thông tin tự nhập -->
            <div class="col-tier-info">
                <div class="tier-icon-circle basic">
                    <span>🌟</span>
                </div>
                <div class="tier-meta">
                    <input type="text" class="tier-name-input" value="Hạng mới" placeholder="Tên hạng KOC...">
                    <span class="tier-requirement-text">Tự định nghĩa điều kiện</span>
                </div>
            </div>
            
            <!-- Cột 2: Tỷ lệ hoa hồng -->
            <div class="col-tier-rate">
                <div class="rate-input-wrapper">
                    <input type="number" class="rate-input-control" value="5" min="0" max="100">
                    <span class="rate-suffix">%</span>
                </div>
            </div>
            
            <!-- Cột 3: Công tắc -->
            <div class="col-tier-status">
                <label class="toggle-switch">
                    <input type="checkbox" class="toggle-checkbox" checked>
                    <span class="toggle-slider"></span>
                </label>
            </div>
            
            <!-- Cột 4: Nút xoá nhanh & icon drag -->
            <div class="col-tier-action" style="gap: 0.5rem;">
                <button type="button" class="btn-delete-tier" title="Xóa hạng này">
                    <!-- Icon thùng rác -->
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
                <div class="drag-handle-btn" title="Kéo thả sắp xếp">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="drag-icon"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                </div>
            </div>
        `;

        container.appendChild(row);

        // Đăng ký sự kiện switch bật tắt cho dòng mới chèn
        const newCb = row.querySelector('.toggle-checkbox');
        setupSwitchBehavior(newCb);

        // Đăng ký sự kiện nút xoá dòng
        const deleteBtn = row.querySelector('.btn-delete-tier');
        deleteBtn.addEventListener('click', function () {
            // Hiệu ứng mờ dần
            row.style.opacity = '0';
            row.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                row.remove();
                showAdminToast('Đã xóa hạng KOC vừa thêm.');
            }, 250);
        });

        showAdminToast('Đã thêm 1 dòng cấu hình hạng hoa hồng mới!');
    });
}

/**
 * Xử lý biểu mẫu lưu trữ, lưu nháp & xuất bản chiến dịch
 */
function initFormPublisher() {
    const form = document.getElementById('campaignForm');
    const btnPublish = document.getElementById('btnPublishCampaign');
    const btnDraft = document.getElementById('btnDraftCampaign');
    const btnCancel = document.getElementById('btnCancelCampaign');

    if (!form || !btnPublish) return;

    // Xử lý XUẤT BẢN CHIẾN DỊCH
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const name = document.getElementById('campaignName').value.trim();
        const duration = document.getElementById('campaignDuration').value.trim();
        const budget = document.getElementById('campaignBudget').value.trim();
        const status = document.getElementById('campaignStatusSelect').value;

        if (!name || !duration || !budget) {
            alert('Vui lòng điền đầy đủ các thông tin bắt buộc (*)!');
            return;
        }

        // Bật loading spinner
        btnPublish.classList.add('loading');

        // Mô phỏng đẩy dữ liệu cấu hình lên API hệ thống và TikTok/Shopee (1.2 giây)
        setTimeout(() => {
            btnPublish.classList.remove('loading');

            const statusText = status === 'active' ? 'được KÍCH HOẠT' : 'được LƯU NHÁP';
            showAdminToast(`Xuất bản Chiến dịch "${name}" với ngân sách ${budget} VNĐ thành công!`);

            // Tự động chuyển hướng về trang Tổng quan sau 2 giây
            setTimeout(() => {
                window.location.href = 'overview.html';
            }, 2000);

        }, 1200);
    });

    // Xử lý LƯU NHÁP nhanh
    if (btnDraft) {
        btnDraft.addEventListener('click', function () {
            const name = document.getElementById('campaignName').value.trim() || 'Chiến dịch mới';
            showAdminToast(`Đã lưu nháp chiến dịch "${name}" thành công!`);
        });
    }

    // Xử lý HỦY BỎ
    if (btnCancel) {
        btnCancel.addEventListener('click', function () {
            if (confirm('Bạn có chắc chắn muốn hủy bỏ toàn bộ thiết lập và quay lại trang chủ không?')) {
                window.location.href = 'overview.html';
            }
        });
    }
}

/**
 * Hiển thị Toast thông báo ở góc màn hình
 */
function showAdminToast(message) {
    const toast = document.getElementById('adminToast');
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
