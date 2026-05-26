/**
 * ==========================================================================
 * Javascript xử lý logic động cho Trang Khởi tạo Chiến dịch Mới Admin
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    
    // --- 1. KHỞI TẠO CÁC DROPDOWN VÀ THÔNG BÁO CHUNG ---
    initAdminDropdown();
    initNotificationBell();

    // --- 1b. PHÂN TÍCH VÀ ĐIỀN NGÀY THỜI GIAN DIỄN RA TỪ CSDL ---
    initDateRangeLoader();

    // --- 2. ĐỊNH DẠNG SỐ TIỀN TỆ CHO NGÂN SÁCH THỜI GIAN THỰC ---
    initBudgetFormatter();

    // --- 3. ĐỒNG BỘ CÔNG TẮC BẬT TẮT VỚI Ô NHẬP LÝ LỆ (TOGGLE SWITCH & RATE INHIBITOR) ---
    initToggleSwitches();

    // --- 4. THÊM MỚI HẠNG HOA HỒNG KOC ĐỘNG (+ ADD CUSTOM TIER ROWS) ---
    initDynamicTierCreator();

    // --- 5. GỬI XUẤT BẢN & LƯU NHÁP CHIẾN DỊCH (PUBLISHER SIMULATOR) ---
    initFormPublisher();

    // --- 6. KHỞI TẠO TABS VÀ CÁC NÚT SỬA/XÓA CHO DANH SÁCH CHIẾN DỊCH ---
    initCampaignTabsAndActions();
});

/**
 * Tự động phân tích chuỗi thời gian DD/MM/YYYY - DD/MM/YYYY từ CSDL và điền vào 2 ô lịch chọn ngày
 */
function initDateRangeLoader() {
    const rawDurationEl = document.getElementById('campaignDurationRaw');
    if (rawDurationEl && rawDurationEl.value) {
        const parts = rawDurationEl.value.split(' - ');
        if (parts.length === 2) {
            function convertToYMD(dmy) {
                const dmyParts = dmy.split('/');
                if (dmyParts.length === 3) {
                    return `${dmyParts[2]}-${dmyParts[1]}-${dmyParts[0]}`;
                }
                return '';
            }
            const startDate = convertToYMD(parts[0]);
            const endDate = convertToYMD(parts[1]);
            
            const startInput = document.getElementById('campaignStartDate');
            const endInput = document.getElementById('campaignEndDate');
            
            if (startInput) startInput.value = startDate;
            if (endInput) endInput.value = endDate;
        }
    }
}

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

    if (!form) return;

    // Hàm phụ thu thập dữ liệu và gọi AJAX lưu CSDL
    function saveCampaignData(statusOverride, submitBtn) {
        const campaignId = document.getElementById('campaignId') ? document.getElementById('campaignId').value.trim() : '';
        const name = document.getElementById('campaignName').value.trim();
        
        const startDateVal = document.getElementById('campaignStartDate').value;
        const endDateVal = document.getElementById('campaignEndDate').value;
        const budget = document.getElementById('campaignBudget').value.trim();
        const productLinkEl = document.getElementById('campaignProductLink');
        const productLink = productLinkEl ? productLinkEl.value.trim() : '';
        const statusEl = document.getElementById('campaignStatus');
        const status = statusOverride || (statusEl ? statusEl.value : 'active');

        if (!name || !startDateVal || !endDateVal || !budget) {
            alert('Vui lòng điền đầy đủ các thông tin bắt buộc (*)!');
            return;
        }

        // Định dạng YYYY-MM-DD -> DD/MM/YYYY
        function formatToDMY(dateStr) {
            const parts = dateStr.split('-');
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        const duration = `${formatToDMY(startDateVal)} - ${formatToDMY(endDateVal)}`;

        // Thu thập các dòng hạng từ DOM
        const tierRows = document.querySelectorAll('#tiersListContainer .tier-row');
        const commissionTiers = [];
        tierRows.forEach(row => {
            const id = row.getAttribute('data-id');
            
            // Trích xuất icon / key class
            let icon = 'basic';
            const iconCircle = row.querySelector('.tier-icon-circle');
            if (iconCircle) {
                if (iconCircle.classList.contains('diamond')) icon = 'diamond';
                else if (iconCircle.classList.contains('gold')) icon = 'gold';
                else if (iconCircle.classList.contains('silver')) icon = 'silver';
                else if (iconCircle.classList.contains('bronze')) icon = 'bronze';
                else if (iconCircle.classList.contains('basic')) icon = 'basic';
            }

            // Trích xuất rankName
            let rankName = '';
            const nameTextEl = row.querySelector('.tier-name-text');
            if (nameTextEl) {
                rankName = nameTextEl.textContent.trim();
            } else {
                const nameInputEl = row.querySelector('.tier-name-input');
                if (nameInputEl) {
                    rankName = nameInputEl.value.trim();
                }
            }

            // Trích xuất requirement
            let requirement = 'Tự định nghĩa điều kiện';
            const reqEl = row.querySelector('.tier-requirement-text');
            if (reqEl) {
                requirement = reqEl.textContent.trim();
            }

            // Trích xuất rate
            let rate = 0;
            const rateInput = row.querySelector('.rate-input-control');
            if (rateInput) {
                rate = parseInt(rateInput.value) || 0;
            }

            // Trích xuất active
            let active = true;
            const activeCheckbox = row.querySelector('.toggle-checkbox');
            if (activeCheckbox) {
                active = activeCheckbox.checked;
            }

            commissionTiers.push({
                id: id,
                rankName: rankName,
                icon: icon,
                requirement: requirement,
                rate: rate,
                active: active
            });
        });

        // Bật trạng thái loading
        if (submitBtn) submitBtn.classList.add('loading');

        const payload = {
            id: campaignId,
            name: name,
            duration: duration,
            budget: budget,
            productLink: productLink,
            status: status,
            commissionTiers: commissionTiers
        };

        // Gửi AJAX POST lưu trữ CSDL
        fetch('/admin/campaigns/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            if (submitBtn) submitBtn.classList.remove('loading');

            if (data.success) {
                if (data.campaignId) {
                    const idInput = document.getElementById('campaignId');
                    if (idInput) idInput.value = data.campaignId;
                }
                const successMsg = status === 'active' 
                    ? `Xuất bản Chiến dịch "${name}" thành công!` 
                    : `Đã lưu nháp chiến dịch "${name}" thành công!`;
                
                showAdminToast(successMsg);

                // Chuyển hướng mượt mà về trang danh sách chiến dịch sau 2 giây
                setTimeout(() => {
                    window.location.href = '/admin/campaigns?tab=list';
                }, 2000);
            } else {
                alert(data.message || 'Lưu cấu hình chiến dịch thất bại.');
            }
        })
        .catch(err => {
            if (submitBtn) submitBtn.classList.remove('loading');
            console.error('Lỗi khi lưu chiến dịch:', err);
            alert('Có lỗi hệ thống xảy ra khi lưu cấu hình chiến dịch.');
        });
    }

    // Xử lý XUẤT BẢN CHIẾN DỊCH
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        saveCampaignData(null, btnPublish);
    });

    // Xử lý LƯU NHÁP nhanh
    if (btnDraft) {
        btnDraft.addEventListener('click', function () {
            saveCampaignData('draft', btnDraft);
        });
    }

    // Xử lý HỦY BỎ
    if (btnCancel) {
        btnCancel.addEventListener('click', function () {
            if (confirm('Bạn có chắc chắn muốn hủy bỏ toàn bộ thiết lập và quay lại trang danh sách không?')) {
                window.location.href = '/admin/campaigns?tab=list';
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

/**
 * Quản lý chuyển đổi tab và các nút bấm Sửa/Xóa chiến dịch trong danh sách
 */
function initCampaignTabsAndActions() {
    const tabFormBtn = document.getElementById('tabFormBtn');
    const tabListBtn = document.getElementById('tabListBtn');
    const formSection = document.getElementById('campaignFormSection');
    const listSection = document.getElementById('campaignsListSection');

    if (!tabFormBtn || !tabListBtn || !formSection || !listSection) return;

    // Chuyển sang Tab biểu mẫu thiết lập
    tabFormBtn.addEventListener('click', function () {
        if (this.classList.contains('active')) return;
        
        tabFormBtn.classList.add('active');
        tabListBtn.classList.remove('active');

        formSection.style.display = 'block';
        listSection.style.display = 'none';
        
        showAdminToast("Đã chuyển sang phân hệ: [Thiết lập Chiến dịch]");
    });

    // Chuyển sang Tab danh sách chiến dịch
    tabListBtn.addEventListener('click', function () {
        if (this.classList.contains('active')) return;
        
        tabListBtn.classList.add('active');
        tabFormBtn.classList.remove('active');

        formSection.style.display = 'none';
        listSection.style.display = 'block';
        
        showAdminToast("Đã chuyển sang phân hệ: [Danh sách Chiến dịch]");
    });

    // Tự động kích hoạt tab Danh sách nếu URL có query param "tab=list"
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'list' || urlParams.has('id')) {
        // Nếu có ID chiến dịch sửa thì vẫn ở tab form, nếu chỉ có tab=list thì hiển thị tab danh sách
        if (urlParams.get('tab') === 'list') {
            tabListBtn.click();
        } else {
            tabFormBtn.click();
        }
    }

    // Xử lý nút Sửa chiến dịch từ bảng danh sách
    const editBtns = document.querySelectorAll('.btn-edit-campaign-row');
    editBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            if (id) {
                // Tải lại trang với tham số ID chiến dịch cần chỉnh sửa
                window.location.href = `/admin/campaigns?id=${id}`;
            }
        });
    });

    // Xử lý nút Xóa chiến dịch từ bảng danh sách
    const deleteBtns = document.querySelectorAll('.btn-delete-campaign-row');
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            const row = this.closest('.campaign-list-row');
            
            if (!id || !row) return;

            if (confirm('Bạn có chắc chắn muốn xóa chiến dịch này vĩnh viễn khỏi hệ thống không?')) {
                // Gửi yêu cầu xóa AJAX POST lên backend
                fetch(`/admin/campaigns/delete/${id}`, {
                    method: 'POST'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showAdminToast('Đã xóa chiến dịch thành công!');
                        
                        // Hiệu ứng mờ và trượt dòng
                        row.style.opacity = '0';
                        row.style.transform = 'translateX(-10px)';
                        
                        setTimeout(() => {
                            row.remove();
                        }, 300);
                    } else {
                        alert(data.message || 'Xóa chiến dịch thất bại.');
                    }
                })
                .catch(err => {
                    console.error('Lỗi khi xóa chiến dịch:', err);
                    alert('Có lỗi mạng xảy ra khi xóa chiến dịch.');
                });
            }
        });
    });
}

