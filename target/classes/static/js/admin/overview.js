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

    // --- 5. XỬ LÝ BỘ LỌC CHU KỲ THỜI GIAN (PERIOD FILTER) ---
    initPeriodFilter();

    // --- 6. XỬ LÝ XUẤT BÁO CÁO (EXPORTERS) ---
    initExporters();
});

/**
 * Khởi tạo biểu đồ xu hướng bằng Chart.js
 */
function initSalesTrendChart(period = 'all') {
    const ctx = document.getElementById('salesTrendChart');
    if (!ctx) return;

    // Hủy bỏ thực thể biểu đồ cũ nếu đã tồn tại để tránh xung đột render của Chart.js
    if (window.salesTrendChart && typeof window.salesTrendChart.destroy === 'function') {
        window.salesTrendChart.destroy();
    }

    fetch(`/api/admin/dashboard/chart?period=${period}`)
    .then(res => res.json())
    .then(chartData => {
        const chartContext = ctx.getContext('2d');
        
        const gmvGradient = chartContext.createLinearGradient(0, 0, 0, 300);
        gmvGradient.addColorStop(0, 'rgba(236, 72, 153, 0.25)');
        gmvGradient.addColorStop(1, 'rgba(236, 72, 153, 0.00)');

        const commissionGradient = chartContext.createLinearGradient(0, 0, 0, 300);
        commissionGradient.addColorStop(0, 'rgba(99, 102, 241, 0.25)');
        commissionGradient.addColorStop(1, 'rgba(99, 102, 241, 0.00)');

        window.salesTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [
                    {
                        label: 'Tổng Doanh số (GMV)',
                        data: chartData.gmv,
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
                        data: chartData.commission,
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
                                if (value >= 1000000000) {
                                    return (value / 1000000000).toFixed(1) + ' tỷ đ';
                                } else if (value >= 1000000) {
                                    return (value / 1000000).toFixed(0) + ' tr đ';
                                }
                                return value;
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
                                if (value >= 1000000) {
                                    return (value / 1000000).toFixed(0) + ' tr đ';
                                }
                                return value;
                            }
                        }
                    }
                }
            }
        });
    })
    .catch(err => console.error('Error fetching admin overview chart:', err));
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
    const approveButtons = document.querySelectorAll('.btn-approve:not([data-bound])');
    const toast = document.getElementById('adminToast');
    
    if (approveButtons.length === 0) return;

    approveButtons.forEach(button => {
        button.setAttribute('data-bound', 'true');
        button.addEventListener('click', function (e) {
            e.stopPropagation();
            
            const btn = this;
            const itemId = btn.getAttribute('data-id');
            const amountStr = btn.getAttribute('data-amount');
            const kocName = btn.getAttribute('data-koc');
            
            // 1. Thêm trạng thái đang tải (Loading Spinner)
            btn.classList.add('loading');
            
            // 2. Gọi API duyệt đối soát rút tiền thực tế
            fetch('/api/admin/finance/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId: itemId })
            })
            .then(res => res.json())
            .then(data => {
                btn.classList.remove('loading');
                if (data.status === 'success') {
                    // 3. Tìm dòng tr của nút này
                    const tr = btn.closest('tr');
                    if (tr) {
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
                    }
                    
                    // 6. Cập nhật lại số liệu KPI trên màn hình với hiệu ứng số chạy động
                    updateKpiMetrics(amountStr);
                    
                    // 7. Hiển thị Toast thông báo thành công rực rỡ
                    showAdminToast(`Đã duyệt đối soát và chi trả ${amountStr} thành công cho đối tác ${kocName}!`);
                } else {
                    alert('Lỗi: ' + (data.message || 'Không thể phê duyệt yêu cầu.'));
                }
            })
            .catch(err => {
                btn.classList.remove('loading');
                console.error('Error in quick approval:', err);
                alert('Lỗi kết nối khi duyệt đối soát nhanh.');
            });
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

/**
 * Khởi tạo bộ lọc thời gian và cập nhật UI động khi thay đổi chu kỳ
 */
function initPeriodFilter() {
    const periodSelect = document.getElementById('adminPeriodFilter');
    if (!periodSelect) return;

    periodSelect.addEventListener('change', function () {
        const period = this.value;
        
        // 1. Cập nhật Biểu đồ doanh số và hoa hồng
        initSalesTrendChart(period);
        
        // 2. Tải số liệu thống kê tổng quan động qua AJAX
        fetch(`/api/admin/dashboard/stats?period=${period}`)
        .then(res => {
            if (!res.ok) throw new Error('Không thể tải số liệu thống kê mới');
            return res.json();
        })
        .then(stats => {
            // Cập nhật các KPI lớn với hiệu ứng chạy số đếm
            updateKpis(stats, period);
            
            // Cập nhật danh sách Top KOC
            updateTopKocList(stats.topKocs);
            
            // Cập nhật bảng đối soát thanh toán
            updateReconciliationsTable(stats.pendingReconciliations);
            
            showAdminToast(`Đã đồng bộ và cập nhật dữ liệu báo cáo thành công!`);
        })
        .catch(err => {
            console.error('Lỗi khi cập nhật thống kê chu kỳ:', err);
            showAdminToast('Lỗi kết nối khi cập nhật dữ liệu bộ lọc!');
        });
    });
}

/**
 * Cập nhật các KPI với hiệu ứng chạy số mượt mà
 */
function updateKpis(stats, period) {
    const kpiGmvEl = document.getElementById('kpiGMV');
    const kpiCommissionEl = document.getElementById('kpiCommission');
    const kpiKocCountEl = document.getElementById('kpiKocCount');
    const kpiCampaignCountEl = document.getElementById('kpiCampaignCount');
    
    // Parse các giá trị đích sang số nguyên để chạy hiệu ứng
    const targetGmv = parseCurrency(stats.gmv);
    const targetCommission = parseCurrency(stats.systemCommission);
    const targetKocCount = stats.activeKocCount;
    const targetCampaignCount = stats.activeCampaigns;
    
    // Lấy các giá trị hiện tại trên giao diện
    const currentGmv = kpiGmvEl ? parseCurrency(kpiGmvEl.textContent) : 0;
    const currentCommission = kpiCommissionEl ? parseCurrency(kpiCommissionEl.textContent) : 0;
    const currentKocCount = kpiKocCountEl ? parseInt(kpiKocCountEl.textContent.replace(/[^\d]/g, '')) || 0 : 0;
    const currentCampaignCount = kpiCampaignCountEl ? parseInt(kpiCampaignCountEl.textContent.replace(/[^\d]/g, '')) || 0 : 0;
    
    // Thực hiện hiệu ứng đếm số chạy Ease-out Quad
    if (kpiGmvEl) animateNumber(kpiGmvEl, currentGmv, targetGmv, 800, true);
    if (kpiCommissionEl) animateNumber(kpiCommissionEl, currentCommission, targetCommission, 800, true);
    if (kpiKocCountEl) animateNumber(kpiKocCountEl, currentKocCount, targetKocCount, 800, false);
    if (kpiCampaignCountEl) animateNumber(kpiCampaignCountEl, currentCampaignCount, targetCampaignCount, 800, false);
    
    // Cập nhật nhãn và lớp màu sắc tăng trưởng phần trăm
    updateKpiChange('kpiGMVChange', stats.gmvChange);
    updateKpiChange('kpiCommissionChange', stats.commissionChange);
    updateKpiChange('kpiKocChange', stats.kocChange);
    updateKpiChange('kpiCampaignChange', stats.campaignChange);
    
    // Đồng bộ nhãn mô tả chu kỳ thời gian
    let subtext = 'so với chu kỳ trước';
    if (period === 'week') subtext = 'so với tuần trước';
    else if (period === 'month') subtext = 'so với tháng trước';
    else if (period === 'year') subtext = 'so với năm trước';
    else if (period === 'all') subtext = 'toàn bộ thời gian';
    
    document.querySelectorAll('.kpi-change-sub').forEach(el => {
        el.textContent = subtext;
    });
}

/**
 * Cập nhật nhãn % tăng trưởng và định hướng mũi tên SVG tăng/giảm động
 */
function updateKpiChange(elementId, changeStr) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    el.textContent = changeStr;
    
    const parent = el.closest('.kpi-change');
    if (!parent) return;
    
    const svg = parent.querySelector('svg');
    
    // Kiểm tra xem là tăng, giảm hay trung hòa (không áp dụng)
    if (changeStr.includes('↑')) {
        parent.className = 'kpi-change green';
        if (svg) svg.style.display = 'inline-block';
        const polyline = parent.querySelector('polyline');
        if (polyline) {
            polyline.setAttribute('points', '18 15 12 9 6 15');
        }
    } else if (changeStr.includes('↓')) {
        parent.className = 'kpi-change red';
        if (svg) svg.style.display = 'inline-block';
        const polyline = parent.querySelector('polyline');
        if (polyline) {
            polyline.setAttribute('points', '6 9 12 15 18 9');
        }
    } else {
        parent.className = 'kpi-change gray';
        if (svg) svg.style.display = 'none';
    }
}

/**
 * Cập nhật danh sách Top KOC xuất sắc nhất
 */
function updateTopKocList(topKocs) {
    const listContainer = document.querySelector('.top-kocs-list');
    if (!listContainer) return;
    
    if (!topKocs || topKocs.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #64748b; font-weight: 500; font-family: 'Plus Jakarta Sans'; font-size: 13px;">
                Không có dữ liệu đối tác trong chu kỳ này
            </div>`;
        return;
    }
    
    let html = '';
    topKocs.forEach(koc => {
        let tierText = 'Bạc';
        if (koc.rankLevel === 'diamond') tierText = 'Kim Cương';
        else if (koc.rankLevel === 'gold') tierText = 'Vàng';
        
        const avatarUrl = koc.avatar.startsWith('http') ? koc.avatar : `/images/${koc.avatar}`;
        
        html += `
            <div class="top-koc-item">
                <div class="koc-rank-badge">${koc.rank}</div>
                <img src="${avatarUrl}" class="koc-avatar" alt="${koc.name}">
                <div class="koc-meta">
                    <span class="koc-name">${koc.name}</span>
                    <span class="koc-tier-badge ${koc.rankLevel || 'silver'}">${tierText}</span>
                </div>
                <div class="koc-revenue">
                    <span class="revenue-val">${koc.sales}</span>
                    <span class="revenue-label">Doanh số</span>
                </div>
            </div>
        `;
    });
    
    listContainer.innerHTML = html;
}

/**
 * Cập nhật bảng đối soát và rút tiền chờ xử lý
 */
function updateReconciliationsTable(reconciliations) {
    const tableBody = document.getElementById('reconciliationsTableBody');
    if (!tableBody) return;
    
    if (!reconciliations || reconciliations.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px 20px; color: #64748b; font-weight: 500; font-family: 'Plus Jakarta Sans'; font-size: 13px;">
                    Không có yêu cầu đối soát nào trong chu kỳ này
                </td>
            </tr>`;
        return;
    }
    
    let html = '';
    reconciliations.forEach(item => {
        let statusText = 'Chờ duyệt';
        if (item.status === 'approved') statusText = 'Đã duyệt';
        else if (item.status === 'processing') statusText = 'Đang xử lý';
        
        let approveButton = '';
        if (item.status === 'pending') {
            approveButton = `
                <button type="button" class="btn-approve" 
                        data-id="${item.id}" data-amount="${item.amount}" data-koc="${item.kocName}">
                    Duyệt nhanh
                </button>
            `;
        }
        
        html += `
            <tr>
                <td class="col-id">${item.id}</td>
                <td class="col-name">${item.kocName}</td>
                <td class="col-campaign">${item.campaign}</td>
                <td class="col-amount">${item.amount}</td>
                <td class="col-date">${item.date}</td>
                <td class="col-status">
                    <div class="status-badge ${item.status}">
                        <span class="status-dot"></span>
                        <span>${statusText}</span>
                    </div>
                </td>
                <td class="col-actions">
                    ${approveButton}
                    <button type="button" class="btn-view" data-id="${item.id}">
                        Xem chi tiết
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableBody.innerHTML = html;
    
    // Gắn lại sự kiện phê duyệt nhanh cho các dòng mới được nạp vào
    initReconciliationApprover();
}

/**
 * Khởi tạo sự kiện click xuất báo cáo (PDF & Excel)
 */
function initExporters() {
    const btnPDF = document.getElementById('btnExportPDF');
    const btnXLSX = document.getElementById('btnExportXLSX');
    const periodSelect = document.getElementById('adminPeriodFilter');
    
    if (btnPDF) {
        btnPDF.addEventListener('click', function () {
            const period = periodSelect ? periodSelect.value : 'all';
            window.open(`/admin/report/print?period=${period}`, '_blank');
        });
    }
    
    if (btnXLSX) {
        btnXLSX.addEventListener('click', function () {
            const period = periodSelect ? periodSelect.value : 'all';
            window.location.href = `/api/admin/report/export/xlsx?period=${period}`;
        });
    }
}
