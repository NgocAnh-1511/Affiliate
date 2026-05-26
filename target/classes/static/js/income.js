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
    // 5. Submit Form & Thực hiện gửi yêu cầu Rút tiền thực tế lên Server CSDL
    // ==========================================================================
    let withdrawalHistory = [];

    function fetchWithdrawalHistory() {
        fetch('/api/withdraw/history')
            .then(res => res.json())
            .then(data => {
                withdrawalHistory = data;
                if (tabWithdrawals && tabWithdrawals.classList.contains('active')) {
                    renderWithdrawalsTable();
                }
            })
            .catch(err => console.error('Error fetching withdrawal history:', err));
    }

    // Nạp lịch sử ban đầu từ database
    fetchWithdrawalHistory();

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
            
            fetch('/api/withdraw/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: withdrawAmount.toString() })
            })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    // 1. Trừ tiền khả dụng và cập nhật giao diện chính
                    availableBalanceVal -= withdrawAmount;
                    if (balanceTextEl) balanceTextEl.textContent = formatVND(availableBalanceVal);
                    if (drawerBalanceEl) drawerBalanceEl.textContent = formatVND(availableBalanceVal);
                    
                    // 2. Nạp lại lịch sử rút tiền mới nhất từ database
                    fetchWithdrawalHistory();
                    
                    // 3. Chuyển sang màn hình báo thành công
                    if (drawerLoading) drawerLoading.classList.remove('active');
                    if (drawerSuccess) {
                        const desc = drawerSuccess.querySelector('.success-desc');
                        if (desc) {
                            desc.textContent = `Yêu cầu rút tiền ${data.amountFormatted} (Mã lệnh: ${data.requestId}) của bạn đã được tiếp nhận thành công và đang chờ đối soát.`;
                        }
                        drawerSuccess.classList.add('active');
                    }
                } else {
                    alert('Lỗi: ' + (data.message || 'Không thể tạo yêu cầu rút tiền.'));
                    if (drawerLoading) drawerLoading.classList.remove('active');
                    withdrawForm.style.display = 'flex';
                }
            })
            .catch(err => {
                console.error('Error creating withdrawal:', err);
                alert('Lỗi kết nối khi gửi yêu cầu rút tiền.');
                if (drawerLoading) drawerLoading.classList.remove('active');
                withdrawForm.style.display = 'flex';
            });
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
        if (withdrawalHistory.length === 0) {
            html = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 4rem 1rem; color: var(--text-muted);">
                        <div class="empty-state-wrapper" style="display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
                            <!-- Icon thông báo rỗng -->
                            <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-muted); opacity: 0.6;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            <span style="font-size: 0.9rem; font-weight: 700; color: var(--text-main);">Chưa có lịch sử rút tiền</span>
                            <span style="font-size: 0.76rem; opacity: 0.85; max-width: 320px; line-height: 1.4; margin: 0 auto;">Mọi yêu cầu rút tiền của bạn sau khi gửi duyệt sẽ hiển thị chi tiết tại đây.</span>
                        </div>
                    </td>
                </tr>
            `;
        } else {
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
        }
        
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
