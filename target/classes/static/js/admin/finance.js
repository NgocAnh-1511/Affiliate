/**
 * ==========================================================================
 * Javascript xử lý logic động cho Trang Đối soát & Thanh toán Admin
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    
    // --- 1. KHỞI TẠO CÁC DROPDOWN VÀ THÔNG BÁO CHUNG ---
    initAdminDropdown();

    // --- 2. XỬ LÝ CHECKBOX CHỌN HÀNG LOẠT (BULK CHECKBOXES) ---
    initBulkSelection();

    // --- 3. XỬ LÝ PHÊ DUYỆT ĐƠN LẺ VÀ DUYỆT HÀNG LOẠT ---
    initPayoutApprover();
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
 * Checkbox chọn hàng loạt (Bulk select checkboxes)
 */
function initBulkSelection() {
    const selectAllCb = document.getElementById('selectAllCheckbox');
    const rowCbs = document.querySelectorAll('.row-checkbox');

    if (!selectAllCb) return;

    selectAllCb.addEventListener('change', function () {
        const isChecked = this.checked;
        rowCbs.forEach(cb => {
            // Chỉ tích chọn những dòng còn ở trạng thái chờ duyệt (chưa được xử lý)
            const row = cb.closest('tr');
            const statusBadge = row.querySelector('.status-badge');
            if (statusBadge && statusBadge.classList.contains('pending')) {
                cb.checked = isChecked;
            }
        });
    });

    // Bỏ check "chọn tất cả" nếu có bất kỳ dòng nào bị bỏ chọn thủ công
    rowCbs.forEach(cb => {
        cb.addEventListener('change', function () {
            if (!this.checked) {
                selectAllCb.checked = false;
            }
        });
    });
}

/**
 * Xử lý đối soát rút tiền đơn lẻ và hàng loạt
 */
function initPayoutApprover() {
    const approveBtns = document.querySelectorAll('.btn-finance-approve');
    const rejectBtns = document.querySelectorAll('.btn-finance-reject');
    const bulkApproveBtn = document.getElementById('btnApproveBulk');

    const kpiPendingCountEl = document.getElementById('kpiPendingCount');
    const kpiPendingAmountEl = document.getElementById('kpiPendingAmount');
    const kpiTotalPaidEl = document.getElementById('kpiTotalPaid');

    // Hàm duyệt đơn lẻ
    approveBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const row = this.closest('tr');
            const id = this.getAttribute('data-id');
            const name = this.getAttribute('data-name');
            const amountStr = this.getAttribute('data-amount');
            const amountVal = parseCurrency(amountStr);

            // Cập nhật trạng thái dòng
            approveSingleRow(row);

            // Cập nhật chỉ số KPI nhảy số đếm mượt mà
            const currentPendingCount = parseCurrency(kpiPendingCountEl.textContent);
            const currentPendingAmount = parseCurrency(kpiPendingAmountEl.textContent);
            const currentTotalPaid = parseCurrency(kpiTotalPaidEl.textContent);

            animateNumber(kpiPendingCountEl, currentPendingCount, currentPendingCount - 1, 800, false, " Lệnh");
            animateNumber(kpiPendingAmountEl, currentPendingAmount, currentPendingAmount - amountVal, 800, true);
            animateNumber(kpiTotalPaidEl, currentTotalPaid, currentTotalPaid + amountVal, 800, true);

            showAdminToast(`Đã duyệt chi trả ${amountStr} thành công cho đối tác ${name}!`);
        });
    });

    // Hàm từ chối đơn lẻ
    rejectBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const row = this.closest('tr');
            const name = this.getAttribute('data-name');
            const amountStr = this.getAttribute('data-amount');
            const amountVal = parseCurrency(amountStr);

            // Đổi trạng thái thành từ chối
            rejectSingleRow(row);

            const currentPendingCount = parseCurrency(kpiPendingCountEl.textContent);
            const currentPendingAmount = parseCurrency(kpiPendingAmountEl.textContent);

            animateNumber(kpiPendingCountEl, currentPendingCount, currentPendingCount - 1, 800, false, " Lệnh");
            animateNumber(kpiPendingAmountEl, currentPendingAmount, currentPendingAmount - amountVal, 800, true);

            showAdminToast(`Đã từ chối yêu cầu rút tiền hoa hồng của đối tác ${name}.`);
        });
    });

    // Hàm duyệt hàng loạt (Bulk Approve)
    if (bulkApproveBtn) {
        bulkApproveBtn.addEventListener('click', function () {
            const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
            
            if (checkedBoxes.length === 0) {
                alert('Vui lòng chọn ít nhất 1 yêu cầu rút tiền để thực hiện phê duyệt hàng loạt!');
                return;
            }

            let approvedCount = 0;
            let totalApprovedAmount = 0;

            checkedBoxes.forEach(cb => {
                const row = cb.closest('tr');
                const amountStr = cb.getAttribute('data-amount');
                const amountVal = parseCurrency(amountStr);

                // Cập nhật trạng thái dòng
                approveSingleRow(row);
                cb.checked = false; // bỏ tích checkbox sau khi xong

                approvedCount++;
                totalApprovedAmount += amountVal;
            });

            // Đồng bộ bỏ check nút chọn tất cả
            const selectAllCb = document.getElementById('selectAllCheckbox');
            if (selectAllCb) selectAllCb.checked = false;

            // Chạy hiệu ứng chỉ số KPI
            const currentPendingCount = parseCurrency(kpiPendingCountEl.textContent);
            const currentPendingAmount = parseCurrency(kpiPendingAmountEl.textContent);
            const currentTotalPaid = parseCurrency(kpiTotalPaidEl.textContent);

            animateNumber(kpiPendingCountEl, currentPendingCount, Math.max(0, currentPendingCount - approvedCount), 800, false, " Lệnh");
            animateNumber(kpiPendingAmountEl, currentPendingAmount, Math.max(0, currentPendingAmount - totalApprovedAmount), 800, true);
            animateNumber(kpiTotalPaidEl, currentTotalPaid, currentTotalPaid + totalApprovedAmount, 800, true);

            showAdminToast(`Đã phê duyệt hàng loạt ${approvedCount} lệnh rút tiền thành công với tổng số ${formatCurrency(totalApprovedAmount)}!`);
        });
    }

    function approveSingleRow(row) {
        row.classList.add('approved');
        
        const statusBadge = row.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.className = 'status-badge approved';
            const statusText = statusBadge.querySelector('.status-text');
            if (statusText) statusText.textContent = 'Đã thanh toán';
        }

        const actionsCol = row.querySelector('.col-actions');
        if (actionsCol) {
            actionsCol.innerHTML = `<span style="font-weight: 700; color: var(--emerald-color);">✓ Đã duyệt</span>`;
        }

        // Vô hiệu hóa checkbox dòng đã xử lý
        const rowCb = row.querySelector('.row-checkbox');
        if (rowCb) rowCb.disabled = true;
    }

    function rejectSingleRow(row) {
        row.classList.add('rejected');

        const statusBadge = row.querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.className = 'status-badge rejected';
            // Cài style bổ sung cho badge bị từ chối
            statusBadge.style.backgroundColor = 'rgba(239, 68, 68, 0.06)';
            statusBadge.style.borderColor = 'rgba(239, 68, 68, 0.2)';
            statusBadge.style.color = '#ef4444';
            
            const dot = statusBadge.querySelector('.status-dot');
            if (dot) dot.style.backgroundColor = '#ef4444';

            const statusText = statusBadge.querySelector('.status-text');
            if (statusText) statusText.textContent = 'Từ chối';
        }

        const actionsCol = row.querySelector('.col-actions');
        if (actionsCol) {
            actionsCol.innerHTML = `<span style="font-weight: 700; color: #ef4444;">✕ Đã từ chối</span>`;
        }

        const rowCb = row.querySelector('.row-checkbox');
        if (rowCb) rowCb.disabled = true;
    }
}

/**
 * Trình phân tích tiền tệ VNĐ sang số
 */
function parseCurrency(str) {
    return parseInt(str.replace(/[^\d]/g, '')) || 0;
}

/**
 * Trình định dạng số sang VNĐ
 */
function formatCurrency(val) {
    return new Intl.NumberFormat('vi-VN').format(val) + ' VNĐ';
}

/**
 * Chạy số đếm mượt mà (Ease-out numerical counter)
 */
function animateNumber(element, start, end, duration, isCurrency = true, suffix = "") {
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeOutQuad = 1 - (1 - progress) * (1 - progress);
        const currentValue = Math.round(start + (end - start) * easeOutQuad);

        element.textContent = isCurrency ? formatCurrency(currentValue) : currentValue + suffix;

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = isCurrency ? formatCurrency(end) : end + suffix;
        }
    }

    requestAnimationFrame(update);
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

    if (toast.dataset.timerId) {
        clearTimeout(parseInt(toast.dataset.timerId));
    }

    toast.classList.add('show');

    const timerId = setTimeout(function () {
        toast.classList.remove('show');
    }, 3500);

    toast.dataset.timerId = timerId.toString();
}
