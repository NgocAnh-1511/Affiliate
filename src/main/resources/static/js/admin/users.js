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

    // --- 5. QUẢN LÝ THÊM NHÂN VIÊN NỘI BỘ MỚI ---
    initAddStaffManager();

    // --- 5b. QUẢN LÝ CHỈNH SỬA NHÂN VIÊN NỘI BỘ ---
    initEditStaffManager();

    // --- 6. XỬ LÝ CHUYỂN TAB CONCEPTUAL ---
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
            const id = this.getAttribute('data-id');
            
            fetch(`/admin/users/approve/${id}`, {
                method: 'POST'
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Thêm hiệu ứng fade-out trượt ngang mượt mà
                    row.classList.add('fade-out');
                    setTimeout(() => {
                        row.remove();
                        updateBadgeCount();
                        showAdminToast(data.message);
                    }, 400);
                } else {
                    showAdminToast(`Lỗi: ${data.message}`);
                }
            })
            .catch(err => {
                console.error(err);
                showAdminToast("Lỗi kết nối đến máy chủ!");
            });
        });
    });

    // Xử lý nút Từ chối
    rejectBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const row = this.closest('tr');
            const name = this.getAttribute('data-name');
            const id = this.getAttribute('data-id');
            
            fetch(`/admin/users/reject/${id}`, {
                method: 'POST'
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    row.classList.add('fade-out');
                    setTimeout(() => {
                        row.remove();
                        updateBadgeCount();
                        showAdminToast(data.message);
                    }, 400);
                } else {
                    showAdminToast(`Lỗi: ${data.message}`);
                }
            })
            .catch(err => {
                console.error(err);
                showAdminToast("Lỗi kết nối đến máy chủ!");
            });
        });
    });
}

/**
 * Tìm kiếm và lọc KOC hoạt động thời gian thực kết hợp phân trang động
 */
function initActiveKocFilter() {
    const searchInput = document.getElementById('searchKocInput');
    const tableBody = document.getElementById('activeKocTableBody');
    const filterToggleBtn = document.getElementById('filterToggleBtn');
    const filterPanel = document.getElementById('filterPanel');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    
    if (!tableBody) return;

    // Trạng thái các bộ lọc hiện tại
    let filterPlatform = 'all';
    let filterTier = 'all';
    let filterStatus = 'all';
    let searchQuery = '';

    // Cấu hình phân trang động
    let currentPage = 1;
    let rowsPerPage = 10; // mặc định hiển thị 10 dòng
    
    const rowsSelect = document.querySelector('.rows-select');
    if (rowsSelect) {
        rowsPerPage = parseInt(rowsSelect.value);
        rowsSelect.addEventListener('change', function() {
            rowsPerPage = parseInt(this.value);
            currentPage = 1; // reset về trang 1
            applyCombinedFilter();
        });
    }

    // Hàm áp dụng tất cả các tiêu chí lọc cùng lúc và phân trang
    function applyCombinedFilter() {
        const rows = tableBody.querySelectorAll('.koc-row-item');
        const matchedRows = [];

        rows.forEach(row => {
            // 1. Kiểm tra tìm kiếm theo tên / handle
            const name = row.querySelector('.user-full-name').textContent.toLowerCase();
            const username = row.querySelector('.user-handle').textContent.toLowerCase();
            const matchesSearch = name.includes(searchQuery) || username.includes(searchQuery);

            // 2. Kiểm tra platform
            const platformBadge = row.querySelector('.platform-badge');
            let isShopee = false;
            let isTiktok = false;
            if (platformBadge) {
                isShopee = platformBadge.classList.contains('shopee');
                isTiktok = platformBadge.classList.contains('tiktok');
            }
            const rowPlatform = isShopee ? 'shopee' : (isTiktok ? 'tiktok' : 'all');
            const matchesPlatform = (filterPlatform === 'all') || (rowPlatform === filterPlatform);

            // 3. Kiểm tra tier
            const tierSelect = row.querySelector('.tier-select');
            const rowTier = tierSelect ? tierSelect.value : 'basic';
            const matchesTier = (filterTier === 'all') || (rowTier === filterTier);

            // 4. Kiểm tra status
            const statusPill = row.querySelector('.status-pill');
            let isActive = false;
            let isSuspended = false;
            if (statusPill) {
                isActive = statusPill.classList.contains('active');
                isSuspended = statusPill.classList.contains('suspended');
            }
            const rowStatus = isActive ? 'active' : (isSuspended ? 'suspended' : 'all');
            const matchesStatus = (filterStatus === 'all') || (rowStatus === filterStatus);

            if (matchesSearch && matchesPlatform && matchesTier && matchesStatus) {
                matchedRows.push(row);
            } else {
                row.style.display = 'none';
            }
        });

        // Áp dụng thuật toán phân trang trên danh sách khớp matchedRows
        const totalRows = matchedRows.length;
        const totalPages = Math.ceil(totalRows / rowsPerPage);
        
        if (currentPage > totalPages) {
            currentPage = totalPages || 1;
        }

        matchedRows.forEach((row, idx) => {
            const startIdx = (currentPage - 1) * rowsPerPage;
            const endIdx = currentPage * rowsPerPage;
            if (idx >= startIdx && idx < endIdx) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });

        // Vẽ lại các nút phân trang
        renderPaginationButtons(totalRows, totalPages);
    }

    // Hàm sinh động các nút số trang và nút mũi tên chuyển trang
    function renderPaginationButtons(totalRows, totalPages) {
        const pageNumbersContainer = document.querySelector('.page-numbers');
        if (!pageNumbersContainer) return;

        pageNumbersContainer.innerHTML = '';

        // Nút mũi tên trái (quay lại)
        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'page-arrow';
        prevBtn.innerHTML = '‹';
        if (currentPage === 1 || totalPages <= 1) {
            prevBtn.disabled = true;
        } else {
            prevBtn.addEventListener('click', function() {
                currentPage--;
                applyCombinedFilter();
            });
        }
        pageNumbersContainer.appendChild(prevBtn);

        // Các nút số trang cụ thể
        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.type = 'button';
            pageBtn.className = `page-num ${currentPage === i ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', function() {
                currentPage = i;
                applyCombinedFilter();
            });
            pageNumbersContainer.appendChild(pageBtn);
        }

        // Nút mũi tên phải (tiến lên)
        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'page-arrow';
        nextBtn.innerHTML = '›';
        if (currentPage === totalPages || totalPages <= 1) {
            nextBtn.disabled = true;
        } else {
            nextBtn.addEventListener('click', function() {
                currentPage++;
                applyCombinedFilter();
            });
        }
        pageNumbersContainer.appendChild(nextBtn);

        // Cập nhật thống số lượng dòng dưới chân bảng
        const footerStats = document.querySelector('.active-koc-stats');
        if (footerStats) {
            const startRange = totalRows > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0;
            const endRange = Math.min(currentPage * rowsPerPage, totalRows);
            footerStats.textContent = `Hiển thị ${startRange} - ${endRange} trên tổng số ${totalRows} đối tác`;
        }
    }

    // 1. Lắng nghe gõ tìm kiếm
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            searchQuery = this.value.trim().toLowerCase();
            currentPage = 1; // Gõ tìm kiếm tự reset về trang 1
            applyCombinedFilter();
        });
    }

    // 2. Bật tắt panel bộ lọc floating
    if (filterToggleBtn && filterPanel) {
        filterToggleBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const isHidden = filterPanel.style.display === 'none';
            filterPanel.style.display = isHidden ? 'flex' : 'none';
            filterToggleBtn.classList.toggle('active', isHidden);
        });

        // Click ra ngoài tự đóng
        document.addEventListener('click', function (e) {
            if (!filterToggleBtn.contains(e.target) && !filterPanel.contains(e.target)) {
                filterPanel.style.display = 'none';
                filterToggleBtn.classList.remove('active');
            }
        });
    }

    // 3. Nút đặt lại bộ lọc
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function () {
            document.querySelectorAll('input[name="filterPlatform"]').forEach(r => r.checked = r.value === 'all');
            document.querySelectorAll('input[name="filterTier"]').forEach(r => r.checked = r.value === 'all');
            document.querySelectorAll('input[name="filterStatus"]').forEach(r => r.checked = r.value === 'all');

            filterPlatform = 'all';
            filterTier = 'all';
            filterStatus = 'all';
            currentPage = 1;
            
            applyCombinedFilter();
            
            if (filterPanel) {
                filterPanel.style.display = 'none';
            }
            if (filterToggleBtn) {
                filterToggleBtn.classList.remove('active');
            }
            showAdminToast("Đã đặt lại toàn bộ bộ lọc!");
        });
    }

    // 4. Nút áp dụng bộ lọc
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function () {
            const platformRadio = document.querySelector('input[name="filterPlatform"]:checked');
            const tierRadio = document.querySelector('input[name="filterTier"]:checked');
            const statusRadio = document.querySelector('input[name="filterStatus"]:checked');

            filterPlatform = platformRadio ? platformRadio.value : 'all';
            filterTier = tierRadio ? tierRadio.value : 'all';
            filterStatus = statusRadio ? statusRadio.value : 'all';
            currentPage = 1; // Áp dụng bộ lọc tự reset về trang 1

            applyCombinedFilter();

            if (filterPanel) {
                filterPanel.style.display = 'none';
            }
            if (filterToggleBtn) {
                filterToggleBtn.classList.remove('active');
            }
            showAdminToast("Đã áp dụng các tiêu chí lọc!");
        });
    }

    // Bắt sự kiện thay đổi select Tier (Thứ bậc KOC)
    const tierSelects = document.querySelectorAll('.tier-select');
    tierSelects.forEach(select => {
        select.addEventListener('change', function () {
            const kocRow = this.closest('tr');
            const id = this.getAttribute('data-id');
            const tierValue = this.value;
            
            fetch(`/admin/users/update-tier?id=${id}&tier=${tierValue}`, {
                method: 'POST'
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showAdminToast(data.message);
                    applyCombinedFilter();
                } else {
                    showAdminToast(`Lỗi: ${data.message}`);
                }
            })
            .catch(err => {
                console.error(err);
                showAdminToast("Lỗi kết nối đến máy chủ!");
            });
        });
    });

    // Bắt sự kiện click vào pill trạng thái để toggle active <-> suspended
    const statusPills = document.querySelectorAll('.status-pill');
    statusPills.forEach(pill => {
        pill.style.cursor = 'pointer';
        pill.addEventListener('click', function () {
            const kocRow = this.closest('tr');
            const id = kocRow.getAttribute('data-id');
            const currentStatus = this.classList.contains('active') ? 'active' : 'suspended';
            const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
            
            fetch(`/admin/users/update-status?id=${id}&status=${nextStatus}`, {
                method: 'POST'
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    this.className = `status-pill ${data.status}`;
                    this.textContent = data.status === 'active' ? 'Hoạt động' : 'Tạm khóa';
                    showAdminToast(data.message);
                    applyCombinedFilter();
                } else {
                    showAdminToast(`Lỗi: ${data.message}`);
                }
            })
            .catch(err => {
                console.error(err);
                showAdminToast("Lỗi kết nối đến máy chủ!");
            });
        });
    });

    // 5. Xử lý click nút Hành động ba chấm (⋮) mở Context Menu tuyệt đẹp
    document.addEventListener('click', function (e) {
        const openMenus = document.querySelectorAll('.koc-action-menu');
        const moreBtn = e.target.closest('.btn-more-options');
        
        // Chỉ kích hoạt menu cho danh sách KOC hoạt động để tránh nhầm với nhân viên/chờ duyệt
        if (moreBtn && moreBtn.closest('#activeKocTableBody')) {
            e.stopPropagation();
            const row = moreBtn.closest('tr.koc-row-item');
            const id = row.getAttribute('data-id');
            const statusPill = row.querySelector('.status-pill');
            const isActive = statusPill && statusPill.classList.contains('active');
            const nextStatus = isActive ? 'suspended' : 'active';
            const actionText = isActive ? '🔒 Tạm khóa' : '🔓 Kích hoạt';
            const kocName = row.querySelector('.user-full-name').textContent;
            
            // Tìm menu đang hoạt động của chính dòng này
            const existingMenu = document.querySelector(`.koc-action-menu[data-owner-id="${id}"]`);
            
            // Xóa toàn bộ menu đang mở khác để tránh chồng chéo
            openMenus.forEach(m => m.remove());
            
            // Nếu menu đã mở sẵn thì click lại sẽ đóng nó (Toggled off)
            if (existingMenu) {
                return;
            }

            const dropdown = document.createElement('div');
            dropdown.className = 'koc-action-menu dropdown-menu show';
            dropdown.setAttribute('data-owner-id', id);
            dropdown.style.display = 'block';
            dropdown.style.position = 'absolute';
            dropdown.style.zIndex = '9999';

            // Tính toán vị trí tương đối so với document.body để chống trôi và chống bị clip bởi .table-container
            const rect = moreBtn.getBoundingClientRect();
            dropdown.style.top = `${rect.bottom + window.scrollY + 5}px`;
            dropdown.style.left = `${rect.right + window.scrollX - 170}px`;

            const statusItem = document.createElement('a');
            statusItem.href = '#';
            statusItem.className = 'dropdown-item';
            statusItem.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span>${actionText}</span>
            `;
            statusItem.addEventListener('click', function (ev) {
                ev.preventDefault();
                dropdown.remove();
                
                fetch(`/admin/users/update-status?id=${id}&status=${nextStatus}`, {
                    method: 'POST'
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        if (statusPill) {
                            statusPill.className = `status-pill ${data.status}`;
                            statusPill.textContent = data.status === 'active' ? 'Hoạt động' : 'Tạm khóa';
                        }
                        showAdminToast(data.message);
                        applyCombinedFilter();
                    } else {
                        showAdminToast(`Lỗi: ${data.message}`);
                    }
                })
                .catch(err => {
                    console.error(err);
                    showAdminToast("Lỗi kết nối đến máy chủ!");
                });
            });

            const deleteItem = document.createElement('a');
            deleteItem.href = '#';
            deleteItem.className = 'dropdown-item';
            deleteItem.style.color = '#ef4444';
            deleteItem.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                <span>✕ Xóa đối tác</span>
            `;
            deleteItem.addEventListener('click', function (ev) {
                ev.preventDefault();
                dropdown.remove();
                
                if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn KOC [${kocName}] khỏi hệ thống?`)) {
                    fetch(`/admin/users/reject/${id}`, {
                        method: 'POST'
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            row.classList.add('fade-out');
                            setTimeout(() => {
                                row.remove();
                                showAdminToast(`Đã xóa thành công đối tác [${kocName}] khỏi hệ thống.`);
                                applyCombinedFilter();
                            }, 400);
                        } else {
                            showAdminToast(`Lỗi: ${data.message}`);
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        showAdminToast("Lỗi kết nối đến máy chủ!");
                    });
                }
            });

            dropdown.appendChild(statusItem);
            dropdown.appendChild(deleteItem);
            document.body.appendChild(dropdown);

            // Đóng menu khi cuộn trang hoặc co giãn trình duyệt để tránh menu trôi lơ lửng
            const closeMenuOnEvent = () => {
                dropdown.remove();
                window.removeEventListener('scroll', closeMenuOnEvent);
                window.removeEventListener('resize', closeMenuOnEvent);
            };
            window.addEventListener('scroll', closeMenuOnEvent);
            window.addEventListener('resize', closeMenuOnEvent);
        } else if (moreBtn && moreBtn.closest('.staff-item')) {
            e.stopPropagation();
            const item = moreBtn.closest('.staff-item');
            const id = item.getAttribute('data-id');
            const staffName = item.getAttribute('data-name');
            
            // Tìm menu đang hoạt động của chính dòng này
            const existingMenu = document.querySelector(`.koc-action-menu[data-owner-id="${id}"]`);
            
            // Xóa toàn bộ menu đang mở khác để tránh chồng chéo
            openMenus.forEach(m => m.remove());
            
            // Nếu menu đã mở sẵn thì click lại sẽ đóng nó (Toggled off)
            if (existingMenu) {
                return;
            }

            const dropdown = document.createElement('div');
            dropdown.className = 'koc-action-menu dropdown-menu show';
            dropdown.setAttribute('data-owner-id', id);
            dropdown.style.display = 'block';
            dropdown.style.position = 'absolute';
            dropdown.style.zIndex = '9999';

            // Định vị menu tuyệt đối chống bị clipping bởi bảng hoặc flex-card
            const rect = moreBtn.getBoundingClientRect();
            dropdown.style.top = `${rect.bottom + window.scrollY + 5}px`;
            dropdown.style.left = `${rect.right + window.scrollX - 170}px`;

            const editItem = document.createElement('a');
            editItem.href = '#';
            editItem.className = 'dropdown-item';
            editItem.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                <span>✏️ Chỉnh sửa thông tin</span>
            `;
            editItem.addEventListener('click', function (ev) {
                ev.preventDefault();
                dropdown.remove();
                
                const username = item.getAttribute('data-username') || '';
                const email = item.querySelector('.staff-email').textContent;
                const phone = item.getAttribute('data-phone') || '';
                const roleSelect = item.querySelector('.role-select');
                const role = roleSelect ? roleSelect.value : 'STAFF';

                document.getElementById('editStaffId').value = id;
                document.getElementById('editStaffFullName').value = staffName;
                document.getElementById('editStaffUsername').value = username;
                document.getElementById('editStaffEmail').value = email;
                document.getElementById('editStaffPhone').value = phone;
                document.getElementById('editStaffRoleSelect').value = role;
                document.getElementById('editStaffPassword').value = '';
                
                document.getElementById('editStaffError').style.display = 'none';
                document.getElementById('editStaffError').textContent = '';

                const editStaffModal = document.getElementById('editStaffModal');
                editStaffModal.style.display = 'flex';
                setTimeout(() => {
                    editStaffModal.classList.add('show');
                }, 10);
            });

            const deleteItem = document.createElement('a');
            deleteItem.href = '#';
            deleteItem.className = 'dropdown-item';
            deleteItem.style.color = '#ef4444';
            deleteItem.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                <span>✕ Xóa tài khoản</span>
            `;
            deleteItem.addEventListener('click', function (ev) {
                ev.preventDefault();
                dropdown.remove();
                
                if (confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản nhân viên [${staffName}] khỏi hệ thống?`)) {
                    fetch(`/admin/users/delete-staff/${id}`, {
                        method: 'POST'
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            item.classList.add('fade-out');
                            setTimeout(() => {
                                const isActive = item.classList.contains('active');
                                item.remove();
                                showAdminToast(data.message);
                                
                                // Nếu dòng bị xóa đang active, chọn dòng khác
                                if (isActive) {
                                    const nextActive = document.querySelector('.staff-item');
                                    if (nextActive) {
                                        nextActive.click();
                                    } else {
                                        const activeStaffNameEl = document.getElementById('activeStaffName');
                                        if (activeStaffNameEl) activeStaffNameEl.textContent = 'Trống';
                                        const checkboxes = document.querySelectorAll('.permission-checkbox');
                                        checkboxes.forEach(cb => cb.checked = false);
                                    }
                                }
                            }, 400);
                        } else {
                            showAdminToast(`Lỗi: ${data.message}`);
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        showAdminToast("Lỗi kết nối đến máy chủ!");
                    });
                }
            });

            dropdown.appendChild(editItem);
            dropdown.appendChild(deleteItem);
            document.body.appendChild(dropdown);

            // Đóng menu khi cuộn trang hoặc co giãn trình duyệt
            const closeMenuOnEvent = () => {
                dropdown.remove();
                window.removeEventListener('scroll', closeMenuOnEvent);
                window.removeEventListener('resize', closeMenuOnEvent);
            };
            window.addEventListener('scroll', closeMenuOnEvent);
            window.addEventListener('resize', closeMenuOnEvent);
        } else {
            openMenus.forEach(m => m.remove());
        }
    });

    // Kích hoạt cuộc chạy lọc và phân trang ban đầu khi tải trang
    applyCombinedFilter();
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
            const id = this.getAttribute('data-id');
            const roleValue = this.value;
            
            fetch(`/admin/users/update-role?id=${id}&role=${roleValue}`, {
                method: 'POST'
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showAdminToast(data.message);
                    // Select active staff item to update roles if needed
                    staffItem.click();
                } else {
                    showAdminToast(`Lỗi: ${data.message}`);
                }
            })
            .catch(err => {
                console.error(err);
                showAdminToast("Lỗi kết nối đến máy chủ!");
            });
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
            const id = activeItem.getAttribute('data-id');

            // Kích hoạt spinner đang tải
            btnSave.classList.add('loading');

            // Thu thập các quyền được tích chọn
            const checkedPerms = [];
            checkboxes.forEach(cb => {
                if (cb.checked) {
                    checkedPerms.push(cb.value);
                }
            });

            // Gọi API thực tế
            const formData = new URLSearchParams();
            formData.append('id', id);
            checkedPerms.forEach(p => formData.append('permissions', p));

            fetch('/admin/users/update-permissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                btnSave.classList.remove('loading');
                if (data.success) {
                    // Cập nhật lại thuộc tính data-permissions để ghi nhớ trạng thái
                    activeItem.setAttribute('data-permissions', checkedPerms.join(','));
                    showAdminToast(data.message);
                } else {
                    showAdminToast(`Lỗi: ${data.message}`);
                }
            })
            .catch(err => {
                btnSave.classList.remove('loading');
                console.error(err);
                showAdminToast("Lỗi kết nối đến máy chủ!");
            });
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
    const joinRequestsSec = document.getElementById('joinRequestsSection');
    const activeKocCard = document.querySelector('.active-koc-card');
    const staffCard = document.querySelector('.staff-card');

    // Mặc định ẩn staff-card khi tải trang
    if (staffCard) {
        staffCard.style.display = 'none';
    }

    if (!tabKocBtn || !tabStaffBtn) return;

    tabKocBtn.addEventListener('click', function () {
        if (this.classList.contains('active')) return;
        
        this.classList.add('active');
        tabStaffBtn.classList.remove('active');
        
        if (joinRequestsSec) joinRequestsSec.style.display = '';
        if (activeKocCard) activeKocCard.style.display = '';
        if (staffCard) staffCard.style.display = 'none';
        
        showAdminToast("Đã chuyển sang phân hệ: [Quản lý KOC/KOL]");
    });

    tabStaffBtn.addEventListener('click', function () {
        if (this.classList.contains('active')) return;
        
        this.classList.add('active');
        tabKocBtn.classList.remove('active');
        
        if (joinRequestsSec) joinRequestsSec.style.display = 'none';
        if (activeKocCard) activeKocCard.style.display = 'none';
        if (staffCard) staffCard.style.display = 'flex';
        
        showAdminToast("Đã chuyển sang phân hệ: [Nhân sự Nội bộ]");
    });
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
 * Trình quản lý biểu mẫu và Modal Thêm nhân viên nội bộ mới
 */
function initAddStaffManager() {
    const addStaffBtn = document.getElementById('addStaffBtn');
    const addStaffModal = document.getElementById('addStaffModal');
    const closeAddStaffModalBtn = document.getElementById('closeAddStaffModalBtn');
    const cancelAddStaffBtn = document.getElementById('cancelAddStaffBtn');
    const addStaffForm = document.getElementById('addStaffForm');
    const addStaffError = document.getElementById('addStaffError');
    const submitAddStaffBtn = document.getElementById('submitAddStaffBtn');

    if (!addStaffBtn || !addStaffModal) return;

    // 1. Mở modal
    addStaffBtn.addEventListener('click', function () {
        addStaffError.style.display = 'none';
        addStaffError.textContent = '';
        addStaffForm.reset();
        
        addStaffModal.style.display = 'flex';
        setTimeout(() => {
            addStaffModal.classList.add('show');
        }, 10);
    });

    // 2. Hàm đóng modal
    function closeModal() {
        addStaffModal.classList.remove('show');
        setTimeout(() => {
            addStaffModal.style.display = 'none';
        }, 300);
    }

    if (closeAddStaffModalBtn) closeAddStaffModalBtn.addEventListener('click', closeModal);
    if (cancelAddStaffBtn) cancelAddStaffBtn.addEventListener('click', closeModal);

    // Đóng khi click ngoài modal content
    addStaffModal.addEventListener('click', function (e) {
        if (e.target === addStaffModal) {
            closeModal();
        }
    });

    // 3. Xử lý gửi biểu mẫu qua AJAX
    if (addStaffForm) {
        addStaffForm.addEventListener('submit', function (e) {
            e.preventDefault();
            addStaffError.style.display = 'none';
            addStaffError.textContent = '';

            // Bật loader
            submitAddStaffBtn.classList.add('loading');

            // Lấy dữ liệu form
            const formData = new FormData(addStaffForm);
            const params = new URLSearchParams();
            for (const pair of formData) {
                params.append(pair[0], pair[1]);
            }

            fetch('/admin/users/add-staff', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params
            })
            .then(res => res.json())
            .then(data => {
                submitAddStaffBtn.classList.remove('loading');
                if (data.success) {
                    showAdminToast(data.message);
                    closeModal();
                    
                    // Tiêm động nhân sự mới vào danh sách Roles
                    appendNewStaffToDom(data.staff);
                } else {
                    addStaffError.textContent = data.message;
                    addStaffError.style.display = 'block';
                }
            })
            .catch(err => {
                submitAddStaffBtn.classList.remove('loading');
                console.error(err);
                addStaffError.textContent = "Không thể kết nối đến máy chủ!";
                addStaffError.style.display = 'block';
            });
        });
    }

    // 4. Hàm chèn động nhân sự mới vào danh sách và kích hoạt click chọn ngay lập tức
    function appendNewStaffToDom(staff) {
        const staffList = document.querySelector('.staff-list');
        if (!staffList) return;

        // Tạo phần tử nhân sự mới
        const staffItem = document.createElement('div');
        staffItem.className = 'staff-item';
        staffItem.setAttribute('data-id', staff.id);
        staffItem.setAttribute('data-permissions', staff.permissions.join(','));
        staffItem.setAttribute('data-name', staff.name);
        staffItem.setAttribute('data-username', staff.username || '');
        staffItem.setAttribute('data-phone', staff.phone || '');

        staffItem.innerHTML = `
            <img src="/images/${staff.avatar}" class="staff-avatar" alt="Avatar">
            <div class="staff-meta">
                <span class="staff-name">${staff.name}</span>
                <span class="staff-email">${staff.email}</span>
            </div>
            <div class="staff-role-wrapper">
                <select class="role-select" data-id="${staff.id}">
                    <option value="STAFF" ${staff.role === 'STAFF' ? 'selected' : ''}>Staff</option>
                    <option value="ADMIN" ${staff.role === 'ADMIN' ? 'selected' : ''}>Admin</option>
                </select>
            </div>
            <button type="button" class="btn-more-options" aria-label="Lựa chọn">⋮</button>
        `;

        // Append vào danh sách
        staffList.appendChild(staffItem);

        // Lắng nghe click chọn nhân sự mới này
        staffItem.addEventListener('click', function (e) {
            if (e.target.closest('.role-select') || e.target.closest('.btn-more-options')) {
                return;
            }
            document.querySelectorAll('.staff-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // Đồng bộ checkbox
            const activeStaffNameEl = document.getElementById('activeStaffName');
            const checkboxes = document.querySelectorAll('.permission-checkbox');
            if (activeStaffNameEl) {
                activeStaffNameEl.textContent = staff.name;
            }
            checkboxes.forEach(cb => {
                cb.checked = staff.permissions.includes(cb.value);
            });
            showAdminToast(`Đã tải thông tin quyền hạn của [${staff.name}].`);
        });

        // Lắng nghe thay đổi dropdown vai trò nhân sự mới này
        const select = staffItem.querySelector('.role-select');
        select.addEventListener('change', function (e) {
            const roleValue = this.value;
            fetch(`/admin/users/update-role?id=${staff.id}&role=${roleValue}`, {
                method: 'POST'
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showAdminToast(data.message);
                    staffItem.click();
                } else {
                    showAdminToast(`Lỗi: ${data.message}`);
                }
            })
            .catch(err => {
                console.error(err);
                showAdminToast("Lỗi kết nối đến máy chủ!");
            });
        });

        // Tự động click chọn nhân sự vừa thêm để làm nổi bật và load quyền hạn ngay
        staffItem.click();
    }
}

/**
 * Trình quản lý biểu mẫu và Modal Chỉnh sửa nhân viên nội bộ
 */
function initEditStaffManager() {
    const editStaffModal = document.getElementById('editStaffModal');
    const closeEditStaffModalBtn = document.getElementById('closeEditStaffModalBtn');
    const cancelEditStaffBtn = document.getElementById('cancelEditStaffBtn');
    const editStaffForm = document.getElementById('editStaffForm');
    const editStaffError = document.getElementById('editStaffError');
    const submitEditStaffBtn = document.getElementById('submitEditStaffBtn');

    if (!editStaffModal) return;

    // Hàm đóng modal chỉnh sửa
    function closeEditModal() {
        editStaffModal.classList.remove('show');
        setTimeout(() => {
            editStaffModal.style.display = 'none';
        }, 300);
    }

    if (closeEditStaffModalBtn) closeEditStaffModalBtn.addEventListener('click', closeEditModal);
    if (cancelEditStaffBtn) cancelEditStaffBtn.addEventListener('click', closeEditModal);

    // Đóng khi click ngoài modal content
    editStaffModal.addEventListener('click', function (e) {
        if (e.target === editStaffModal) {
            closeEditModal();
        }
    });

    // Xử lý gửi biểu mẫu chỉnh sửa qua AJAX
    if (editStaffForm) {
        editStaffForm.addEventListener('submit', function (e) {
            e.preventDefault();
            editStaffError.style.display = 'none';
            editStaffError.textContent = '';

            // Bật loader
            submitEditStaffBtn.classList.add('loading');

            // Lấy dữ liệu form
            const formData = new FormData(editStaffForm);
            const params = new URLSearchParams();
            for (const pair of formData) {
                params.append(pair[0], pair[1]);
            }

            fetch('/admin/users/edit-staff', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params
            })
            .then(res => res.json())
            .then(data => {
                submitEditStaffBtn.classList.remove('loading');
                if (data.success) {
                    showAdminToast(data.message);
                    closeEditModal();
                    
                    // Cập nhật thông tin trên dòng DOM tương ứng tức thời không cần F5
                    const staffId = data.staff.id;
                    const staffItem = document.querySelector(`.staff-item[data-id="${staffId}"]`);
                    if (staffItem) {
                        staffItem.setAttribute('data-name', data.staff.name);
                        staffItem.setAttribute('data-username', data.staff.username || '');
                        staffItem.setAttribute('data-phone', data.staff.phone || '');
                        
                        const nameEl = staffItem.querySelector('.staff-name');
                        if (nameEl) nameEl.textContent = data.staff.name;
                        
                        const emailEl = staffItem.querySelector('.staff-email');
                        if (emailEl) emailEl.textContent = data.staff.email;

                        const selectEl = staffItem.querySelector('.role-select');
                        if (selectEl) selectEl.value = data.staff.role;
                        
                        // Kích hoạt click chọn lại để tải chuẩn quyền hạn
                        staffItem.click();
                    }
                } else {
                    editStaffError.textContent = data.message;
                    editStaffError.style.display = 'block';
                }
            })
            .catch(err => {
                submitEditStaffBtn.classList.remove('loading');
                console.error(err);
                editStaffError.textContent = "Không thể kết nối đến máy chủ!";
                editStaffError.style.display = 'block';
            });
        });
    }
}
