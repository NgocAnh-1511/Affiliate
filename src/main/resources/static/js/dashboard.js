document.addEventListener('DOMContentLoaded', function() {
    // Canvas context
    const lineCtx = document.getElementById('lineChart');
    const donutCtx = document.getElementById('donutChart');
    
    // Global chart instances to avoid overlap
    let lineChartInstance = null;
    let donutChartInstance = null;

    // --------------------------------------------------------------------------
    // 1. Khởi tạo Biểu đồ Đường kép: Lượt Click & Đơn hàng (Chart.js Line Chart)
    // --------------------------------------------------------------------------
    function initLineChart(labels, clicks, orders) {
        if (!lineCtx) return;
        
        if (lineChartInstance) {
            lineChartInstance.destroy();
        }

        // Tạo gradient màu mượt mà cho 2 đường click và order
        const clickGradient = lineCtx.getContext('2d').createLinearGradient(0, 0, 0, 250);
        clickGradient.addColorStop(0, 'rgba(37, 99, 235, 0.22)');
        clickGradient.addColorStop(1, 'rgba(37, 99, 235, 0.00)');

        const orderGradient = lineCtx.getContext('2d').createLinearGradient(0, 0, 0, 250);
        orderGradient.addColorStop(0, 'rgba(124, 58, 237, 0.22)');
        orderGradient.addColorStop(1, 'rgba(124, 58, 237, 0.00)');

        lineChartInstance = new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Lượt Click',
                        data: clicks,
                        borderColor: '#2563eb',
                        borderWidth: 3,
                        backgroundColor: clickGradient,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#2563eb',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        yAxisID: 'yClick'
                    },
                    {
                        label: 'Đơn hàng',
                        data: orders,
                        borderColor: '#7c3aed',
                        borderWidth: 3,
                        backgroundColor: orderGradient,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#7c3aed',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        yAxisID: 'yOrder'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // Ẩn legend mặc định vì đã dựng legend HTML cực kỳ cao cấp
                    },
                    tooltip: {
                        padding: 12,
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
                        cornerRadius: 8,
                        boxPadding: 6
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                family: 'Plus Jakarta Sans',
                                size: 11,
                                weight: '600'
                            }
                        }
                    },
                    yClick: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        ticks: {
                            color: '#64748b',
                            font: {
                                family: 'Plus Jakarta Sans',
                                size: 11,
                                weight: '600'
                            }
                        },
                        grid: {
                            color: '#f1f5f9'
                        }
                    },
                    yOrder: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        ticks: {
                            color: '#64748b',
                            font: {
                                family: 'Plus Jakarta Sans',
                                size: 11,
                                weight: '600'
                            }
                        },
                        grid: {
                            drawOnChartArea: false // Ẩn grid line của trục Y phụ để không bị đè rối mắt
                        }
                    }
                }
            }
        });
    }

    // --------------------------------------------------------------------------
    // 2. Khởi tạo Biểu đồ Donut: Tỷ lệ thiết bị mua hàng (Chart.js Donut Chart)
    // --------------------------------------------------------------------------
    function initDonutChart(mobilePct, desktopPct) {
        if (!donutCtx) return;

        if (donutChartInstance) {
            donutChartInstance.destroy();
        }
        
        // Nếu cả hai đều bằng 0 (chưa có đơn hàng nào), hiển thị vòng xám nhạt đẹp mắt để tránh lỗi render
        const chartData = (mobilePct === 0 && desktopPct === 0) ? [0, 100] : [mobilePct, desktopPct];
        const chartColors = (mobilePct === 0 && desktopPct === 0) ? ['#e2e8f0', '#e2e8f0'] : ['#005bf6', '#7c3aed'];

        donutChartInstance = new Chart(donutCtx, {
            type: 'doughnut',
            data: {
                labels: ['Mobile', 'Desktop'],
                datasets: [{
                    data: chartData,
                    backgroundColor: chartColors,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%', // Tăng cutout để tạo vòng tròn donut thanh mảnh
                plugins: {
                    legend: {
                        display: false // Ẩn legend mặc định vì đã dựng legend HTML cực kỳ chuyên nghiệp
                    },
                    tooltip: {
                        enabled: !(mobilePct === 0 && desktopPct === 0), // Tắt tooltip nếu không có dữ liệu
                        padding: 10,
                        backgroundColor: '#0f172a',
                        titleFont: {
                            family: 'Plus Jakarta Sans',
                            size: 12,
                            weight: '700'
                        },
                        bodyFont: {
                            family: 'Plus Jakarta Sans',
                            size: 11
                        },
                        callbacks: {
                            label: function(context) {
                                return ' ' + context.label + ': ' + context.raw + '%';
                            }
                        },
                        cornerRadius: 6
                    }
                }
            }
        });
    }

    // --------------------------------------------------------------------------
    // 3. Hiệu ứng hoạt họa đếm số (Ease-out Number Animation)
    // --------------------------------------------------------------------------
    function animateValue(id, valueString) {
        const obj = document.getElementById(id);
        if (!obj) return;
        
        // Loại bỏ ký tự phân cách hàng nghìn để parse
        const cleanVal = parseInt(valueString.toString().replace(/,/g, '')) || 0;
        if (cleanVal === 0) {
            obj.innerText = valueString;
            return;
        }
        
        let start = 0;
        const duration = 750; // ms
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-out Quad
            const easeProgress = progress * (2 - progress);
            const currentVal = Math.floor(easeProgress * cleanVal);
            
            // Định dạng lại khi hiển thị
            obj.innerText = formatNumber(currentVal);
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                obj.innerText = valueString;
            }
        }
        
        requestAnimationFrame(update);
    }
    
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // Cập nhật phần trăm thay đổi KPI & màu sắc tương ứng
    function updateKpiChange(spanId, boxId, changeString) {
        const span = document.getElementById(spanId);
        const box = document.getElementById(boxId);
        if (!span || !box) return;

        span.innerText = changeString;
        const svg = box.querySelector('svg');
        
        // Cập nhật lớp màu sắc & hiển thị mũi tên
        if (changeString.includes('↑')) {
            box.className = 'kpi-change green';
            if (svg) {
                svg.style.display = 'inline-block';
                svg.style.transform = 'rotate(0deg)';
            }
        } else if (changeString.includes('↓')) {
            box.className = 'kpi-change red';
            if (svg) {
                svg.style.display = 'inline-block';
                svg.style.transform = 'rotate(180deg)';
            }
        } else {
            box.className = 'kpi-change gray';
            if (svg) {
                svg.style.display = 'none';
            }
        }
    }

    // --------------------------------------------------------------------------
    // 4. AJAX: Tải số liệu & Cập nhật các Component trên Dashboard
    // --------------------------------------------------------------------------
    function loadStats(period) {
        fetch(`/api/dashboard/stats?period=${period}`)
        .then(res => res.json())
        .then(stats => {
            // Cập nhật số liệu KPIs (Có hiệu ứng hoạt họa đếm số cho Click & Đơn hàng)
            animateValue('kpiClicks', stats.clicks);
            animateValue('kpiOrders', stats.orders);
            document.getElementById('kpiCR').innerText = stats.cr;
            document.getElementById('kpiCommission').innerText = stats.commission;

            // Cập nhật phần trăm thay đổi & màu sắc
            updateKpiChange('kpiClicksChange', 'kpiClicksChangeBox', stats.clickChange);
            updateKpiChange('kpiOrdersChange', 'kpiOrdersChangeBox', stats.ordersChange);
            updateKpiChange('kpiCRChange', 'kpiCRChangeBox', stats.crChange);
            updateKpiChange('kpiCommissionChange', 'kpiCommissionChangeBox', stats.commissionChange);

            // Cập nhật nhãn phụ của KPIs dựa theo bộ lọc
            let subText = "so với giai đoạn trước";
            if (period === 'week') subText = "so với 7 ngày trước";
            else if (period === 'month') subText = "so với 30 ngày trước";
            else if (period === 'year') subText = "so với năm trước";
            else if (period === 'all') subText = "tổng cộng";

            document.getElementById('kpiClicksSub').innerText = subText;
            document.getElementById('kpiOrdersSub').innerText = subText;
            document.getElementById('kpiCRSub').innerText = subText;
            document.getElementById('kpiCommissionSub').innerText = subText;

            // Cập nhật bảng Chiến dịch hiệu quả nhất
            const tableBody = document.getElementById('campaignsTableBody');
            if (tableBody) {
                tableBody.innerHTML = '';
                if (stats.topCampaigns && stats.topCampaigns.length > 0) {
                    stats.topCampaigns.forEach(camp => {
                        const tr = document.createElement('tr');
                        
                        let badgeHtml = '';
                        if (camp.trafficSource === 'shopee') {
                            badgeHtml = '<div class="traffic-badge shopee"><span class="badge-shopee">S</span></div>';
                        } else if (camp.trafficSource === 'tiktok') {
                            badgeHtml = `<div class="traffic-badge tiktok">
                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.94-1.74-.22-.2-.43-.4-.64-.62v7.14c.01 1.87-.5 3.79-1.75 5.17-1.42 1.58-3.67 2.45-5.79 2.14-2.45-.35-4.63-2.14-5.26-4.57-.75-2.9.75-6.09 3.52-7.14 1.13-.43 2.37-.53 3.55-.28V14c-1.39-.42-2.99-.08-4.04.91-1.17 1.1-1.49 2.94-.8 4.39.63 1.33 2.1 2.22 3.58 2.15 1.55.03 2.99-.95 3.42-2.43.14-.49.19-.99.18-1.5V.02h.02z"/>
                                </svg>
                            </div>`;
                        } else {
                            // Lazada fallback
                            badgeHtml = `<div class="traffic-badge lazada" style="background:#1a1a74; display:flex; align-items:center; justify-content:center; border-radius:4px; width:18px; height:18px; color:white; font-size:10px; font-weight:bold;">L</div>`;
                        }

                        tr.innerHTML = `
                            <td class="col-rank">${camp.rank}</td>
                            <td>
                                <div class="campaign-info">
                                    <div class="campaign-avatar-box">
                                        <img src="/images/profile_avatar.png" alt="Campaign Thumbnail" class="campaign-avatar">
                                    </div>
                                    <span class="campaign-name">${camp.name}</span>
                                </div>
                            </td>
                            <td class="col-traffic">${badgeHtml}</td>
                            <td class="col-orders">${camp.orders}</td>
                            <td class="col-commission">${camp.commission}</td>
                        `;
                        tableBody.appendChild(tr);
                    });
                } else {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="5" style="text-align: center; padding: 2.5rem; color: #64748b;">
                                Không có dữ liệu chiến dịch trong khoảng thời gian này
                            </td>
                        </tr>
                    `;
                }
            }

            // Cập nhật nhãn thiết bị biểu đồ Donut
            document.getElementById('donutOrders').innerText = stats.orders;
            document.getElementById('donutMobilePercent').innerText = stats.mobilePercent + '%';
            document.getElementById('donutMobileOrders').innerText = `(${stats.mobileOrders} đơn)`;
            document.getElementById('donutDesktopPercent').innerText = stats.desktopPercent + '%';
            document.getElementById('donutDesktopOrders').innerText = `(${stats.desktopOrders} đơn)`;

            // Vẽ lại biểu đồ Donut
            initDonutChart(stats.mobilePercent, stats.desktopPercent);
        })
        .catch(err => console.error('Error loading dashboard stats:', err));
    }

    function loadChart(period) {
        fetch(`/api/dashboard/chart?period=${period}`)
        .then(res => res.json())
        .then(chartData => {
            initLineChart(chartData.labels, chartData.clicks, chartData.orders);
        })
        .catch(err => console.error('Error fetching dashboard chart:', err));
    }

    // Hàm tổng hợp cập nhật
    function updateDashboard(period) {
        loadStats(period);
        loadChart(period);
    }

    // --------------------------------------------------------------------------
    // 5. Khởi động và Lắng nghe sự kiện
    // --------------------------------------------------------------------------
    const periodFilter = document.getElementById('kocPeriodFilter');
    if (periodFilter) {
        // Lấy giá trị ban đầu và tải dữ liệu
        const initialPeriod = periodFilter.value || 'all';
        updateDashboard(initialPeriod);

        // Lắng nghe sự kiện thay đổi bộ lọc
        periodFilter.addEventListener('change', function() {
            updateDashboard(this.value);
        });
    } else {
        // Fallback nếu không tìm thấy select bộ lọc
        updateDashboard('all');
    }

    // --------------------------------------------------------------------------
    // 6. Chuông thông báo góc phải (Bell Toast alert)
    // --------------------------------------------------------------------------
    const bellBtn = document.getElementById('bellNotificationBtn');
    if (bellBtn) {
        bellBtn.addEventListener('click', function() {
            alert('Bạn có 3 thông báo mới từ hệ thống KOC/KOL Affiliate Network!');
            const badge = bellBtn.querySelector('.notification-badge');
            if (badge) badge.remove(); // Xoá badge khi đã xem
        });
    }

    // --------------------------------------------------------------------------
    // 7. Menu thả xuống của Hồ sơ góc phải (Right Header Dropdown)
    // --------------------------------------------------------------------------
    const userProfileMenu = document.getElementById('userProfileMenu');
    const userDropdownMenu = document.getElementById('userDropdownMenu');

    if (userProfileMenu && userDropdownMenu) {
        userProfileMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            const isShown = userDropdownMenu.classList.contains('show');
            if (isShown) {
                userDropdownMenu.classList.remove('show');
                userProfileMenu.classList.remove('active');
            } else {
                userDropdownMenu.classList.add('show');
                userProfileMenu.classList.add('active');
            }
        });

        document.addEventListener('click', function(e) {
            if (!userProfileMenu.contains(e.target) && !userDropdownMenu.contains(e.target)) {
                userDropdownMenu.classList.remove('show');
                userProfileMenu.classList.remove('active');
            }
        });
    }

    // --------------------------------------------------------------------------
    // 8. Nút Xuất báo cáo (Export Report Simulator)
    // --------------------------------------------------------------------------
    const btnExport = document.getElementById('btnExportReport');
    if (btnExport) {
        btnExport.addEventListener('click', function() {
            const selectedPeriodText = periodFilter ? periodFilter.options[periodFilter.selectedIndex].text : "Tất cả thời gian";
            alert(`Báo cáo hiệu suất tiếp thị liên kết (${selectedPeriodText}) đang được xuất thành file Excel. Quá trình này diễn ra hoàn toàn từ dữ liệu CSDL...`);
        });
    }
});
