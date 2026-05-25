document.addEventListener('DOMContentLoaded', function() {
    
    // ==========================================================================
    // 1. Quản lý Trạng thái Số dư khả dụng & Rút tiền
    // ==========================================================================
    let availableBalanceVal = 15500000; // Số dư mặc định dạng số
    
    const balanceTextEl = document.getElementById('availableBalanceText');
    const drawerBalanceEl = document.getElementById('drawerAvailableText');
    
    // Hàm định dạng tiền tệ Việt Nam (Ví dụ: 15,500,000 VNĐ)
    function formatVND(value) {
        return value.toLocaleString('vi-VN') + ' VNĐ';
    }

    // Cập nhật số dư hiển thị ban đầu nếu Thymeleaf chưa ghi đè
    if (balanceTextEl && !balanceTextEl.textContent.trim().includes('VNĐ')) {
        balanceTextEl.textContent = formatVND(availableBalanceVal);
    }
    if (drawerBalanceEl) {
        drawerBalanceEl.textContent = formatVND(availableBalanceVal);
    }

    // Trích xuất số dư khả dụng thực tế từ thẻ HTML (đề phòng Thymeleaf render giá trị khác)
    if (balanceTextEl) {
        const rawText = balanceTextEl.textContent.trim();
        const parsed = parseInt(rawText.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsed)) {
            availableBalanceVal = parsed;
        }
    }


    // ==========================================================================
    // 2. Xử lý Dropdown Đăng xuất của User Profile & Chuông thông báo
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
            // Tải hiệu ứng ảo: Xóa chấm thông báo đỏ khi click vào
            const badge = bellNotificationBtn.querySelector('.notification-badge');
            if (badge) {
                badge.style.opacity = '0';
                badge.style.pointerEvents = 'none';
            }
            alert('Bạn có 3 thông báo mới về hoa hồng chiến dịch LSOUL đối soát thành công!');
        });
    }


    // ==========================================================================
    // 3. Quản lý Mở/Đóng Side Drawer Yêu cầu rút tiền
    // ==========================================================================
    const btnWithdrawAction = document.getElementById('btnWithdrawAction');
    const withdrawDrawer = document.getElementById('withdrawDrawer');
    const drawerOverlay = document.getElementById('drawerOverlay');
    const btnCloseDrawer = document.getElementById('btnCloseDrawer');
    
    const withdrawForm = document.getElementById('withdrawForm');
    const withdrawAmountInput = document.getElementById('withdrawAmount');
    const withdrawError = document.getElementById('withdrawError');
    const btnConfirmWithdraw = document.getElementById('btnConfirmWithdraw');
    
    const drawerLoading = document.getElementById('drawerLoading');
    const drawerSuccess = document.getElementById('drawerSuccess');
    const btnSuccessClose = document.getElementById('btnSuccessClose');

    // Mở drawer
    if (btnWithdrawAction && withdrawDrawer && drawerOverlay) {
        btnWithdrawAction.addEventListener('click', function() {
            // Cập nhật số dư mới nhất vào Drawer
            if (drawerBalanceEl) {
                drawerBalanceEl.textContent = formatVND(availableBalanceVal);
            }
            
            // Reset form trạng thái ban đầu
            if (withdrawForm) withdrawForm.reset();
            if (withdrawAmountInput) {
                withdrawAmountInput.classList.remove('error-border');
            }
            if (withdrawError) {
                withdrawError.classList.remove('show');
            }
            if (btnConfirmWithdraw) {
                btnConfirmWithdraw.disabled = true;
            }
            
            // Ẩn các màn hình phụ
            if (drawerLoading) drawerLoading.classList.remove('active');
            if (drawerSuccess) drawerSuccess.classList.remove('active');
            if (withdrawForm) withdrawForm.style.display = 'flex';
            
            // Hiển thị drawer
            drawerOverlay.classList.add('active');
            withdrawDrawer.classList.add('open');
        });
    }

    // Đóng drawer
    function closeWithdrawDrawer() {
        if (withdrawDrawer && drawerOverlay) {
            withdrawDrawer.classList.remove('open');
            drawerOverlay.classList.remove('active');
        }
    }

    if (btnCloseDrawer) {
        btnCloseDrawer.addEventListener('click', closeWithdrawDrawer);
    }
    if (drawerOverlay) {
        drawerOverlay.addEventListener('click', closeWithdrawDrawer);
    }
    if (btnSuccessClose) {
        btnSuccessClose.addEventListener('click', closeWithdrawDrawer);
    }


    // ==========================================================================
    // 4. Validate dữ liệu rút tiền thời gian thực (Real-time Validation)
    // ==========================================================================
    if (withdrawAmountInput) {
        withdrawAmountInput.addEventListener('input', function() {
            const amount = parseInt(withdrawAmountInput.value, 10);
            
            if (isNaN(amount) || amount <= 0) {
                // Giá trị trống hoặc âm
                withdrawAmountInput.classList.remove('error-border');
                if (withdrawError) withdrawError.classList.remove('show');
                if (btnConfirmWithdraw) btnConfirmWithdraw.disabled = true;
            } else if (amount > availableBalanceVal) {
                // Nhập quá số dư khả dụng
                withdrawAmountInput.classList.add('error-border');
                if (withdrawError) {
                    withdrawError.textContent = 'Số dư khả dụng không đủ để thực hiện yêu cầu này!';
                    withdrawError.classList.add('show');
                }
                if (btnConfirmWithdraw) btnConfirmWithdraw.disabled = true;
            } else if (amount < 100000) {
                // Nhỏ hơn hạn mức rút tối thiểu (100K)
                withdrawAmountInput.classList.add('error-border');
                if (withdrawError) {
                    withdrawError.textContent = 'Hạn mức rút tiền tối thiểu là 100,000 VNĐ một lần giao dịch.';
                    withdrawError.classList.add('show');
                }
                if (btnConfirmWithdraw) btnConfirmWithdraw.disabled = true;
            } else {
                // Hợp lệ hoàn toàn
                withdrawAmountInput.classList.remove('error-border');
                if (withdrawError) withdrawError.classList.remove('show');
                if (btnConfirmWithdraw) btnConfirmWithdraw.disabled = false;
            }
        });
    }


    // ==========================================================================
    // 5. Submit Form & Giảm trừ tiền ảo tức thì (Simulation)
    // ==========================================================================
    // Khởi tạo Lịch sử rút tiền ảo để hiển thị khi chuyển tab
    let withdrawalHistory = [
        { id: "#WD12345672", campaign: "Vietcombank Rút tiền", source: "vcb", amount: "5,000,000 VNĐ", fee: "Miễn phí", date: "10/05/2024 14:15", status: "success", statusText: "Thành công" },
        { id: "#WD12345671", campaign: "Vietcombank Rút tiền", source: "vcb", amount: "10,000,000 VNĐ", fee: "Miễn phí", date: "02/05/2024 09:10", status: "success", statusText: "Thành công" },
        { id: "#WD12345670", campaign: "Vietcombank Rút tiền", source: "vcb", amount: "1,500,000 VNĐ", fee: "Miễn phí", date: "24/04/2024 16:45", status: "cancelled", statusText: "Hủy" }
    ];

    if (withdrawForm) {
        withdrawForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const withdrawAmount = parseInt(withdrawAmountInput.value, 10);
            if (isNaN(withdrawAmount) || withdrawAmount < 100000 || withdrawAmount > availableBalanceVal) {
                return;
            }
            
            // Ẩn form chính, hiển thị trạng thái loading quay tròn
            withdrawForm.style.display = 'none';
            if (drawerLoading) drawerLoading.classList.add('active');
            
            // Chạy thời gian ảo 1.5 giây mô phỏng chuyển tiền
            setTimeout(function() {
                // 1. Trừ tiền khả dụng
                availableBalanceVal -= withdrawAmount;
                
                // 2. Cập nhật lại giao diện chính và drawer
                if (balanceTextEl) balanceTextEl.textContent = formatVND(availableBalanceVal);
                if (drawerBalanceEl) drawerBalanceEl.textContent = formatVND(availableBalanceVal);
                
                // 3. Thêm lịch sử rút tiền mới này vào đầu danh sách lịch sử rút tiền
                const now = new Date();
                const formattedDate = now.getDate().toString().padStart(2, '0') + '/' + 
                                      (now.getMonth() + 1).toString().padStart(2, '0') + '/' + 
                                      now.getFullYear() + ' ' + 
                                      now.getHours().toString().padStart(2, '0') + ':' + 
                                      now.getMinutes().toString().padStart(2, '0');
                
                withdrawalHistory.unshift({
                    id: "#WD" + Math.floor(10000000 + Math.random() * 90000000),
                    campaign: "Vietcombank Rút tiền",
                    source: "vcb",
                    amount: formatVND(withdrawAmount),
                    fee: "Miễn phí",
                    date: formattedDate,
                    status: "success",
                    statusText: "Thành công"
                });
                
                // 4. Nếu đang ở tab rút tiền thì cập nhật lại bảng lập tức
                if (tabWithdrawals && tabWithdrawals.classList.contains('active')) {
                    renderWithdrawalsTable();
                }
                
                // 5. Chuyển sang màn hình báo thành công
                if (drawerLoading) drawerLoading.classList.remove('active');
                if (drawerSuccess) {
                    const desc = drawerSuccess.querySelector('.success-desc');
                    if (desc) {
                        desc.textContent = `Số tiền rút ${formatVND(withdrawAmount)} của bạn đã được chuyển khoản thành công vào tài khoản Vietcombank của đối tác Mai Phương.`;
                    }
                    drawerSuccess.classList.add('active');
                }
            }, 1500);
        });
    }


    // ==========================================================================
    // 6. Xử lý Chuyển đổi TAB Bảng dữ liệu (Chi tiết đơn hàng vs Lịch sử rút tiền)
    // ==========================================================================
    const tabOrders = document.getElementById('tabOrders');
    const tabWithdrawals = document.getElementById('tabWithdrawals');
    const tableBody = document.getElementById('tableBody');
    
    // Lưu trữ các dòng đơn hàng ban đầu được render từ Thymeleaf/HTML
    let cachedOrderRowsHTML = "";
    if (tableBody) {
        cachedOrderRowsHTML = tableBody.innerHTML;
    }

    // Hàm render bảng lịch sử rút tiền
    function renderWithdrawalsTable() {
        if (!tableBody) return;
        
        let html = "";
        withdrawalHistory.forEach(function(wd) {
            html += `
                <tr>
                    <td class="col-ord-id">${wd.id}</td>
                    <td>
                        <div class="campaign-cell">
                            <!-- Huy hiệu ngân hàng nhỏ -->
                            <div class="traffic-mini-badge shopee" style="background: linear-gradient(135deg, #10b981 0%, #047857 100%);">
                                <span class="badge-s">V</span>
                            </div>
                            <span class="campaign-cell-name">${wd.campaign}</span>
                        </div>
                    </td>
                    <td class="col-money">${wd.amount}</td>
                    <td class="col-commission" style="color: #64748b;">${wd.fee}</td>
                    <td class="col-date">${wd.date}</td>
                    <td class="col-status">
                        <div class="status-badge ${wd.status}">
                            <span class="status-dot"></span>
                            <span>${wd.statusText}</span>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
    }

    if (tabOrders && tabWithdrawals) {
        tabOrders.addEventListener('click', function() {
            if (tabOrders.classList.contains('active')) return;
            
            tabWithdrawals.classList.remove('active');
            tabOrders.classList.add('active');
            
            // Khôi phục danh sách đơn hàng ban đầu
            if (tableBody) {
                tableBody.innerHTML = cachedOrderRowsHTML;
            }
        });

        tabWithdrawals.addEventListener('click', function() {
            if (tabWithdrawals.classList.contains('active')) return;
            
            tabOrders.classList.remove('active');
            tabWithdrawals.classList.add('active');
            
            // Hiển thị lịch sử rút tiền
            renderWithdrawalsTable();
        });
    }


    // ==========================================================================
    // 7. Hộp thoại Đổi ngân hàng & Bộ lọc ảo
    // ==========================================================================
    const btnChangeBank = document.getElementById('btnChangeBank');
    if (btnChangeBank) {
        btnChangeBank.addEventListener('click', function() {
            alert('Tính năng liên kết và đổi tài khoản ngân hàng thụ hưởng thụ động đang được nâng cấp bảo mật ngân hàng!');
        });
    }

    const btnFilterTable = document.getElementById('btnFilterTable');
    if (btnFilterTable) {
        btnFilterTable.addEventListener('click', function() {
            alert('Áp dụng bộ lọc thời gian: Hệ thống đang trích xuất dữ liệu giao dịch đối soát của bạn...');
        });
    }

    const filterSelect = document.querySelector('.filter-select');
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            alert('Bạn đã chọn khoảng thời gian lọc: ' + filterSelect.value);
        });
    }

    // Xử lý nút thay đổi hàng hiển thị chân trang
    const rowsSelect = document.querySelector('.rows-select');
    if (rowsSelect) {
        rowsSelect.addEventListener('change', function() {
            alert('Đổi số hàng hiển thị sang: ' + rowsSelect.value + ' dòng/trang');
        });
    }

    // Xử lý click các nút phân trang
    const paginationItems = document.querySelectorAll('.pagination-list .page-item');
    paginationItems.forEach(function(item) {
        item.addEventListener('click', function() {
            paginationItems.forEach(el => el.classList.remove('active'));
            item.classList.add('active');
            alert('Đang tải trang dữ liệu thứ: ' + item.textContent);
        });
    });
});
