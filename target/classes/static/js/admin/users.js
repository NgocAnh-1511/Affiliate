/**
 * ==========================================================================
 * Javascript xử lý logic động cho Trang Quản lý Tài khoản & Phân quyền Admin
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    
    // --- 1. KHỞI TẠO CÁC DROPDOWN VÀ CHUÔNG THÔNG BÁO CHUNG ---
    initAdminDropdown();
    initNotificationBell();

    // --- 2. XỬ LÝ PHÊ DUYỆT & TỪ CHỐI KOC GIA NHẬP (JOIN REQUESTS APPROVAL) ---
    initJoinRequestsApprover();

    // --- 3. XỬ LÝ LỌC TÌM KIẾM KOC HOẠT ĐỘNG (REAL-TIME KOC FILTER) ---
    initActiveKocFilter();

    // --- 4. XỬ LÝ PHÂN QUYỀN NHÂN VIÊN ĐỘNG (STAFF PERMISSIONS SYNC) ---
    initStaffPermissionsManager();

    // --- 5. XỬ LÝ CHUYỂN TAB CONCEPTUAL ---
    initConceptualTabs();
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
        alert('Hệ thống hiện ghi nhận 12 thông báo mới từ chiến dịch và yêu cầu rút tiền.\nVui lòng kiểm tra các mục liên quan.');
        const badge = bellBtn.querySelector('.notification-badge');
        if (badge) {
            badge.style.display = 'none';
        }
    });
}

/**
 * Phê duyệt & Từ chối KOC đăng ký gia nhập
 */
function initJoinRequestsApprover() {
    const approveBtns = document.querySelectorAll('.btn-approve-koc');
    const rejectBtns = document.querySelectorAll('.btn-reject-koc');
    const requestBadge = document.getElementById('requestBadge');
    const footerStats = document.getElementById('footerRequestStats');

    // Hàm đếm và cập nhật số lượng yêu cầu trên badge và footer
    function updateBadgeCount() {
        const rows = document.querySelectorAll('#joinRequestsTableBody tr.request-row');
        const remainingCount = rows.length;
        
        if (requestBadge) {
            if (remainingCount > 0) {
                requestBadge.textContent = `${remainingCount} yêu cầu`;
            } else {
                requestBadge.style.display = 'none';
                
                // Hiển thị thông báo rỗng khi hết yêu cầu
                const tbody = document.getElementById('joinRequestsTableBody');
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="5" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                                <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎉</div>
                                <strong>Tuyệt vời! Không còn yêu cầu gia nhập nào cần xử lý.</strong>
                            </td>
                        </tr>
                    `;
                }
            }
        }

        if (footerStats) {
            footerStats.textContent = remainingCount > 0 
                ? `Hiển thị ${remainingCount} trên tổng số ${remainingCount} yêu cầu` 
                : 'Hiển thị 0 trên tổng số 0 yêu cầu';
        }
    }

    // Xử lý nút Duyệt
    approveBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const row = this.closest('tr');
            const name = this.getAttribute('data-name');
            
            // Thêm hiệu ứng fade-out trượt ngang mượt mà
            row.classList.add('fade-out');
            
            setTimeout(() => {
                row.remove();
                updateBadgeCount();
                showAdminToast(`Đã phê duyệt đối tác [${name}] gia nhập hệ thống thành công!`);
            }, 400);
        });
    });

    // Xử lý nút Từ chối
    rejectBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const row = this.closest('tr');
            const name = this.getAttribute('data-name');
            
            row.classList.add('fade-out');
            
            setTimeout(() => {
                row.remove();
                updateBadgeCount();
                showAdminToast(`Đã từ chối yêu cầu gia nhập của đối tác [${name}].`);
            }, 400);
        });
    });
}

/**
 * Tìm kiếm và lọc KOC hoạt động thời gian thực
 */
function initActiveKocFilter() {
    const searchInput = document.getElementById('searchKocInput');
    const tableBody = document.getElementById('activeKocTableBody');
    
    if (!searchInput || !tableBody) return;

    searchInput.addEventListener('input', function () {
        const query = this.value.trim().toLowerCase();
        const rows = tableBody.querySelectorAll('.koc-row-item');

        rows.forEach(row => {
            const name = row.querySelector('.user-full-name').textContent.toLowerCase();
            const username = row.querySelector('.user-handle').textContent.toLowerCase();
            
            if (name.includes(query) || username.includes(query)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });

    // Bắt sự kiện thay đổi select Tier (Thứ bậc KOC)
    const tierSelects = document.querySelectorAll('.tier-select');
    tierSelects.forEach(select => {
        select.addEventListener('change', function () {
            const kocRow = this.closest('tr');
            const kocName = kocRow.querySelector('.user-full-name').textContent;
            const tierText = this.options[this.selectedIndex].text;
            
            showAdminToast(`Đã cập nhật cấp bậc của KOC [${kocName}] thành [${tierText}]!`);
        });
    });
}

/**
 * Quản lý đồng bộ phân quyền nhân viên nội bộ
 */
function initStaffPermissionsManager() {
    const staffItems = document.querySelectorAll('.staff-item');
    const activeStaffNameEl = document.getElementById('activeStaffName');
    const checkboxes = document.querySelectorAll('.permission-checkbox');
    const btnSave = document.getElementById('btnSavePermissions');
    const btnCancel = document.getElementById('btnCancelPermissions');
    
    if (staffItems.length === 0) return;

    // Load quyền hạn cho nhân viên đang active ban đầu
    const activeStaffItem = document.querySelector('.staff-item.active');
    if (activeStaffItem) {
        syncCheckboxesWithStaff(activeStaffItem);
    }

    // Lắng nghe click chọn nhân viên
    staffItems.forEach(item => {
        item.addEventListener('click', function (e) {
            // Không kích hoạt chọn nếu click vào dropdown chọn vai trò của chính nhân viên đó
            if (e.target.closest('.role-select') || e.target.closest('.btn-more-options')) {
                return;
            }

            staffItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // Đồng bộ checkbox thời gian thực
            syncCheckboxesWithStaff(this);
            showAdminToast(`Đã tải thông tin quyền hạn của [${this.getAttribute('data-name')}].`);
        });
    });

    // Lắng nghe thay đổi dropdown Vai trò (Roles Select)
    const roleSelects = document.querySelectorAll('.role-select');
    roleSelects.forEach(select => {
        select.addEventListener('change', function (e) {
            const staffItem = this.closest('.staff-item');
            const staffName = staffItem.getAttribute('data-name');
            const roleName = this.options[this.selectedIndex].text;
            
            showAdminToast(`Đã thay đổi vai trò của [${staffName}] thành [${roleName}] thành công!`);
        });
    });

    // Đồng bộ checkbox dựa theo data-permissions của staff-item được click
    function syncCheckboxesWithStaff(item) {
        const name = item.getAttribute('data-name');
        const permsStr = item.getAttribute('data-permissions') || '';
        const permissions = permsStr.split(',').map(p => p.trim());

        if (activeStaffNameEl) {
            activeStaffNameEl.textContent = name;
        }

        checkboxes.forEach(cb => {
            cb.checked = permissions.includes(cb.value);
        });
    }

    // Xử lý nút LƯU THAY ĐỔI
    if (btnSave) {
        btnSave.addEventListener('click', function () {
            const activeItem = document.querySelector('.staff-item.active');
            if (!activeItem) return;

            const staffName = activeItem.getAttribute('data-name');

            // Kích hoạt spinner đang tải
            btnSave.classList.add('loading');

            // Giả lập độ trễ kết nối database (1.2 giây)
            setTimeout(() => {
                btnSave.classList.remove('loading');

                // Thu thập các quyền được tích chọn
                const checkedPerms = [];
                checkboxes.forEach(cb => {
                    if (cb.checked) {
                        checkedPerms.push(cb.value);
                    }
                });

                // Cập nhật lại thuộc tính data-permissions để ghi nhớ trạng thái
                activeItem.setAttribute('data-permissions', checkedPerms.join(','));

                showAdminToast(`Đã cập nhật hệ thống quyền hạn mới cho nhân viên [${staffName}] thành công!`);
            }, 1200);
        });
    }

    // Xử lý nút HỦY BỎ
    if (btnCancel) {
        btnCancel.addEventListener('click', function () {
            const activeItem = document.querySelector('.staff-item.active');
            if (!activeItem) return;

            // Khôi phục lại trạng thái ban đầu từ data-permissions
            syncCheckboxesWithStaff(activeItem);
            showAdminToast('Đã khôi phục trạng thái quyền hạn ban đầu của nhân viên!');
        });
    }
}

/**
 * Xử lý chuyển đổi tabs Quản lý KOC / Nhân sự Nội bộ
 */
function initConceptualTabs() {
    const tabKocBtn = document.getElementById('tabKocBtn');
    const tabStaffBtn = document.getElementById('tabStaffBtn');

    if (!tabKocBtn || !tabStaffBtn) return;

    tabKocBtn.addEventListener('click', function () {
        switchTab(tabKocBtn, tabStaffBtn, 'Quản lý KOC/KOL');
    });

    tabStaffBtn.addEventListener('click', function () {
        switchTab(tabStaffBtn, tabKocBtn, 'Nhân sự Nội bộ');
    });

    function switchTab(activeBtn, inactiveBtn, tabName) {
        if (activeBtn.classList.contains('active')) return;
        
        activeBtn.classList.add('active');
        inactiveBtn.classList.remove('active');
        
        showAdminToast(`Đã chuyển sang phân hệ: [${tabName}]`);
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
