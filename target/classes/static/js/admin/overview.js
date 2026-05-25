/**
 * ==========================================================================
 * Javascript xử lý logic động cho Trang Tổng quan Admin (Admin Overview JS)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    
    // --- 1. KHỞI TẠO BIỂU ĐỒ DOANH SỐ VÀ HOA HỒNG (CHART.JS) ---
    initSalesTrendChart();

    // --- 2. XỬ LÝ DROPDOWN PROFILE ADMIN ---
    initAdminDropdown();

    // --- 3. XỬ LÝ BẮT SỰ KIỆN CLICK CHUÔNG THÔNG BÁO ---
    initNotificationBell();

    // --- 4. XỬ LÝ DUYỆT ĐỐI SOÁT NHANH (RECONCILIATION APPROVER) ---
    initReconciliationApprover();
});

/**
 * Khởi tạo biểu đồ xu hướng bằng Chart.js
 */
function initSalesTrendChart() {
    const ctx = document.getElementById('salesTrendChart');
    if (!ctx) return;

    // Dữ liệu 7 ngày qua
    const labels = ['18/05', '19/05', '20/05', '21/05', '22/05', '23/05', '24/05'];
    
    // Tạo gradient màu cho GMV (Pink/Rose) và Hoa hồng (Indigo/Violet)
    const chartContext = ctx.getContext('2d');
    
    const gmvGradient = chartContext.createLinearGradient(0, 0, 0, 300);
    gmvGradient.addColorStop(0, 'rgba(236, 72, 153, 0.25)');
    gmvGradient.addColorStop(1, 'rgba(236, 72, 153, 0.00)');

    const commissionGradient = chartContext.createLinearGradient(0, 0, 0, 300);
    commissionGradient.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
    commissionGradient.addColorStop(1, 'rgba(99, 102, 241, 0.00)');

    // Tạo biểu đồ
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Tổng Doanh số (GMV)',
                    data: [8200000000, 9400000000, 10100000000, 9800000000, 11200000000, 11800000000, 12450000000],
                    borderColor: '#ec4899',
                    backgroundColor: gmvGradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.38,
                    pointBackgroundColor: '#ec4899',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    yAxisID: 'y'
                },
                {
                    label: 'Hoa hồng Hệ thống',
                    data: [820000000, 940000000, 1010000000, 980000000, 1120000000, 1180000000, 1245000000],
                    borderColor: '#6366f1',
                    backgroundColor: commissionGradient,
                    borderWidth: 3,
                    fill: true,
                    tension: 0.38,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            family: 'Plus Jakarta Sans',
                            size: 12,
                            weight: '600'
                        },
                        color: '#64748b',
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: '#0f172a',
                    titleFont: {
                        family: 'Plus Jakarta Sans',
                        size: 13,
                        weight: '700'
                    },
                    bodyFont: {
                        family: 'Plus Jakarta Sans',
                        size: 12
                    },
                    padding: 12,
                    cornerRadius: 8,
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: 'Plus Jakarta Sans',
                            size: 11,
                            weight: '600'
                        },
                        color: '#64748b'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: {
                        color: '#f1f5f9'
                    },
                    ticks: {
                        font: {
                            family: 'Plus Jakarta Sans',
                            size: 11
                        },
                        color: '#64748b',
                        callback: function (value) {
                            return (value / 1000000000).toFixed(1) + ' tỷđ';
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false // Chỉ hiển thị lưới của trục trái
                    },
                    ticks: {
                        font: {
                            family: 'Plus Jakarta Sans',
                            size: 11
                        },
                        color: '#64748b',
                        callback: function (value) {
                            return (value / 1000000).toFixed(0) + ' trđ';
                        }
                    }
                }
            }
        }
    });
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
        
        // Quay nhẹ icon chevron down
        const chevron = profileBtn.querySelector('.chevron-down');
        if (chevron) {
            chevron.style.transform = expanded ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    });

    // Click ra ngoài để tắt dropdown
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
        alert('Hệ thống hiện tại không ghi nhận cảnh báo khẩn cấp nào.\nCác kết nối API ngân hàng và TikTok Shop hoạt động ổn định 100%.');
        
        // Ẩn badge đỏ thông báo sau khi click xem
        const badge = bellBtn.querySelector('.notification-badge');
        if (badge) {
            badge.style.display = 'none';
        }
    });
}

/**
 * Xử lý duyệt đối soát nhanh (Reconciliation Approver)
 */
function initReconciliationApprover() {
    const approveButtons = document.querySelectorAll('.btn-approve');
    const toast = document.getElementById('adminToast');
    
    if (approveButtons.length === 0) return;

    approveButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.stopPropagation();
            
            const btn = this;
            const itemId = btn.getAttribute('data-id');
            const amountStr = btn.getAttribute('data-amount');
            const kocName = btn.getAttribute('data-koc');
            
            // 1. Thêm trạng thái đang tải (Loading Spinner)
            btn.classList.add('loading');
            
            // 2. Mô phỏng độ trễ truyền dữ liệu sang ngân hàng đối tác (1.2 giây)
            setTimeout(function () {
                // gỡ bỏ trạng thái loading
                btn.classList.remove('loading');
                
                // 3. Tìm dòng tr của nút này
                const tr = btn.closest('tr');
                if (!tr) return;
                
                // 4. Thay đổi trạng thái dòng thành "Đã duyệt"
                const statusBadge = tr.querySelector('.status-badge');
                if (statusBadge) {
                    statusBadge.className = 'status-badge approved';
                    const statusText = statusBadge.querySelector('span:not(.status-dot)');
                    if (statusText) {
                        statusText.textContent = 'Đã duyệt';
                    }
                }
                
                // 5. Ẩn nút "Duyệt nhanh" khỏi ô hành động, chỉ giữ lại "Xem chi tiết"
                btn.style.display = 'none';
                
                // 6. Cập nhật lại số liệu KPI trên màn hình với hiệu ứng số chạy động
                updateKpiMetrics(amountStr);
                
                // 7. Hiển thị Toast thông báo thành công rực rỡ
                showAdminToast(`Đã duyệt đối soát và chi trả ${amountStr} cho đối tác ${kocName}!`);
                
            }, 1200);
        });
    });
}

/**
 * Cập nhật số liệu KPI GMV và Commission trên thẻ lớn với hiệu ứng số chạy mượt mà
 */
function updateKpiMetrics(approvedAmountStr) {
    const kpiGmvEl = document.getElementById('kpiGMV');
    const kpiCommissionEl = document.getElementById('kpiCommission');

    if (!kpiGmvEl || !kpiCommissionEl) return;

    // Phân tách số tiền đã được duyệt
    const approvedVal = parseCurrency(approvedAmountStr);
    if (approvedVal === 0) return;

    // Lấy số tiền hiện tại trên UI
    const currentGmvVal = parseCurrency(kpiGmvEl.textContent);
    const currentCommissionVal = parseCurrency(kpiCommissionEl.textContent);

    // Khi Admin duyệt chi trả tiền hoa hồng đối soát cho KOC:
    // - Hoa hồng hệ thống thực nhận sẽ được chốt giảm đi phần rút (hoặc GMV hoàn thành được củng cố)
    // Để biểu thị tương tác sinh động, ta sẽ CỘNG thêm doanh số GMV thực tế đã đối soát thành công 
    // và CỘNG doanh thu thực nhận (vì đơn hàng chuyển trạng thái ĐÃ ĐỐI SOÁT - APPROVED)
    const targetGmvVal = currentGmvVal + approvedVal;
    
    // Giả định hệ thống nhận 10% hoa hồng từ GMV này
    const systemComEarned = Math.round(approvedVal * 0.1); 
    const targetCommissionVal = currentCommissionVal + systemComEarned;

    // Thực hiện hiệu ứng đếm số chạy mượt mà trong 800ms
    animateNumber(kpiGmvEl, currentGmvVal, targetGmvVal, 800, true);
    animateNumber(kpiCommissionEl, currentCommissionVal, targetCommissionVal, 800, true);
}

/**
 * Phân tích chuỗi tiền tệ thành số nguyên
 */
function parseCurrency(str) {
    return parseInt(str.replace(/[^\d]/g, '')) || 0;
}

/**
 * Định dạng số thành chuỗi tiền tệ VNĐ
 */
function formatCurrency(val) {
    return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
}

/**
 * Hiệu ứng chạy số mượt mà (Ease-out numerical counter)
 */
function animateNumber(element, start, end, duration, isCurrency = true) {
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Sử dụng hàm cubic ease-out để chạy chậm lại khi gần đến đích
        const easeOutQuad = 1 - (1 - progress) * (1 - progress);
        const currentValue = Math.round(start + (end - start) * easeOutQuad);

        element.textContent = isCurrency ? formatCurrency(currentValue) : currentValue;

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = isCurrency ? formatCurrency(end) : end;
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

    // Hiển thị toast
    toast.classList.add('show');

    // Tự động ẩn sau 3.5 giây
    const timerId = setTimeout(function () {
        toast.classList.remove('show');
    }, 3500);

    // Lưu timerId để tránh chồng chéo nếu click liên tiếp
    toast.dataset.timerId = timerId;
}
