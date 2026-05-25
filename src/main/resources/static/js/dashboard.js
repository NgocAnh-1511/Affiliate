document.addEventListener('DOMContentLoaded', function() {
    // --------------------------------------------------------------------------
    // 1. Khởi tạo Biểu đồ Đường kép: Lượt Click & Đơn hàng (Chart.js Line Chart)
    // --------------------------------------------------------------------------
    const lineCtx = document.getElementById('lineChart');
    if (lineCtx) {
        // Tạo gradient màu mượt mà cho 2 đường click và order
        const clickGradient = lineCtx.getContext('2d').createLinearGradient(0, 0, 0, 250);
        clickGradient.addColorStop(0, 'rgba(37, 99, 235, 0.22)');
        clickGradient.addColorStop(1, 'rgba(37, 99, 235, 0.00)');

        const orderGradient = lineCtx.getContext('2d').createLinearGradient(0, 0, 0, 250);
        orderGradient.addColorStop(0, 'rgba(124, 58, 237, 0.22)');
        orderGradient.addColorStop(1, 'rgba(124, 58, 237, 0.00)');

        new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: ['13/05 (T2)', '14/05 (T3)', '15/05 (T4)', '16/05 (T5)', '17/05 (T6)', '18/05 (T7)', '19/05 (CN)'],
                datasets: [
                    {
                        label: 'Lượt Click',
                        data: [1650, 2180, 2950, 3420, 2890, 2340, 1970],
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
                        data: [45, 68, 85, 112, 98, 63, 61],
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
                        min: 0,
                        max: 4000,
                        ticks: {
                            stepSize: 1000,
                            color: '#64748b',
                            font: {
                                family: 'Plus Jakarta Sans',
                                size: 11,
                                weight: '600'
                            },
                            callback: function(value) {
                                return value === 0 ? '0' : (value / 1000) + 'K';
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
                        min: 0,
                        max: 150,
                        ticks: {
                            stepSize: 50,
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
    const donutCtx = document.getElementById('donutChart');
    if (donutCtx) {
        new Chart(donutCtx, {
            type: 'doughnut',
            data: {
                labels: ['Mobile', 'Desktop'],
                datasets: [{
                    data: [78, 22],
                    backgroundColor: ['#005bf6', '#7c3aed'],
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
    // 3. Chuông thông báo góc phải (Bell Toast alert)
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
    // 4. Menu thả xuống của Hồ sơ góc phải (Right Header Dropdown)
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
    // 5. Nút Xuất báo cáo (Export Report Simulator)
    // --------------------------------------------------------------------------
    const btnExport = document.getElementById('btnExportReport');
    if (btnExport) {
        btnExport.addEventListener('click', function() {
            alert('Báo cáo hiệu suất tiếp thị liên kết 7 ngày qua đang được xuất thành file PDF. Quá trình này có thể mất một vài giây...');
        });
    }
});
