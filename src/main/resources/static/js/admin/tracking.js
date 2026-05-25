/**
 * ==========================================================================
 * Javascript xử lý logic động cho Trang Giám sát Hệ thống Admin
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    
    // --- 1. KHỞI TẠO CÁC DROPDOWN VÀ THÔNG BÁO CHUNG ---
    initAdminDropdown();

    // --- 2. KHỞI TẠO BIỂU ĐỒ REAL-TIME CHẠY CUỘN LIÊN TỤC (CHART.JS) ---
    initRealtimeTrafficChart();

    // --- 3. XỬ LÝ HÀNH ĐỘNG KHÓA TÀI KHOẢN NGHI PHẠM ---
    initSuspectsActions();
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
 * Biểu đồ Real-time chạy cuộn liên tục (Chart.js Real-time Running Plot)
 */
function initRealtimeTrafficChart() {
    const ctx = document.getElementById('realtimeTrafficChart');
    const clockEl = document.getElementById('monitoringClock');
    if (!ctx) return;

    // Thiết lập 7 điểm lịch sử gốc (cột mốc 10:19 đến 10:24)
    const initialLabels = ['10:19', '10:20', '10:21', '10:22', '10:23', '10:24', '10:25'];
    
    // Cấp phát mảng dữ liệu mặc định khớp với hình ảnh thiết kế
    const normalData = [2200, 2400, 2100, 2300, 2200, 1800, 2400];
    const botData = [400, 450, 420, 480, 500, 4500, 420]; // Spike bất thường khổng lồ ở cột thứ 6!

    // Setup color gradients
    const chartCtx = ctx.getContext('2d');
    
    const normalGrad = chartCtx.createLinearGradient(0, 0, 0, 250);
    normalGrad.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
    normalGrad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    const botGrad = chartCtx.createLinearGradient(0, 0, 0, 250);
    botGrad.addColorStop(0, 'rgba(239, 68, 68, 0.2)');
    botGrad.addColorStop(1, 'rgba(239, 68, 68, 0.0)');

    const trafficChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: initialLabels,
            datasets: [
                {
                    label: 'Traffic Bình thường',
                    data: normalData,
                    borderColor: '#3b82f6',
                    backgroundColor: normalGrad,
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#ffffff',
                    pointRadius: 3
                },
                {
                    label: 'Traffic Bất thường / Bot',
                    data: botData,
                    borderColor: '#ef4444',
                    backgroundColor: botGrad,
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#ffffff',
                    pointRadius: 3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Tự làm legend bằng HTML bên trên
                },
                tooltip: {
                    backgroundColor: '#0f172a',
                    cornerRadius: 6,
                    titleFont: { family: 'Plus Jakarta Sans', weight: '700' },
                    bodyFont: { family: 'Plus Jakarta Sans' }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { family: 'Plus Jakarta Sans', size: 10 }, color: '#64748b' }
                },
                y: {
                    min: 0,
                    max: 6000,
                    grid: { color: '#f1f5f9' },
                    ticks: {
                        font: { family: 'Plus Jakarta Sans', size: 10 },
                        color: '#64748b',
                        callback: function(val) {
                            return val >= 1000 ? (val / 1000) + 'K' : val;
                        }
                    }
                }
            }
        }
    });

    // Cứ sau 3 giây, tự động thêm 1 điểm dữ liệu click ngẫu nhiên để mô phỏng Real-time Uptime Uploader
    let counter = 26;
    setInterval(function () {
        // Cập nhật đồng hồ thời gian thực ở tiêu đề
        const now = new Date();
        const hrs = now.getHours().toString().padStart(2, '0');
        const mins = now.getMinutes().toString().padStart(2, '0');
        const secs = now.getSeconds().toString().padStart(2, '0');
        
        if (clockEl) {
            clockEl.textContent = `Cập nhật lúc: ${hrs}:${mins}:${secs}`;
        }

        // Tạo dữ liệu click ngẫu nhiên
        const nextNormal = Math.round(2000 + Math.random() * 600);
        const nextBot = Math.round(300 + Math.random() * 200);
        const nextLabel = `${hrs}:${mins}`;

        // Thêm dữ liệu vào mảng
        trafficChart.data.labels.push(nextLabel);
        trafficChart.data.datasets[0].data.push(nextNormal);
        trafficChart.data.datasets[1].data.push(nextBot);

        // Đẩy phần tử cũ ra để cuộn mượt sang trái (Scroll view)
        if (trafficChart.data.labels.length > 8) {
            trafficChart.data.labels.shift();
            trafficChart.data.datasets[0].data.shift();
            trafficChart.data.datasets[1].data.shift();
        }

        // Cập nhật biểu đồ
        trafficChart.update();
        counter++;
    }, 3000);
}

/**
 * Xử lý click Khóa tài khoản / Bỏ qua cho đối tượng nghi vấn
 */
function initSuspectsActions() {
    const lockBtns = document.querySelectorAll('.btn-lock-account');
    const ignoreBtns = document.querySelectorAll('.btn-ignore-suspect');
    const suspectBadge = document.getElementById('suspectBadge');

    function updateSuspectCount() {
        const remainingRows = document.querySelectorAll('#suspectsTableBody tr.suspect-row');
        const remainingCount = remainingRows.length;

        if (suspectBadge) {
            if (remainingCount > 0) {
                suspectBadge.textContent = `${remainingCount} đối tượng`;
            } else {
                suspectBadge.style.display = 'none';
                document.getElementById('suspectsTableBody').innerHTML = `
                    <tr>
                        <td colspan="7" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🛡️</div>
                            <strong>Hệ thống an toàn tuyệt đối. Không có đối tượng khả nghi cần xử lý.</strong>
                        </td>
                    </tr>
                `;
            }
        }
    }

    // Khóa tài khoản
    lockBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const row = this.closest('tr');
            const name = this.getAttribute('data-name');

            if (confirm(`Bạn có chắc chắn muốn KHÓA tài khoản của đối tác KOC [${name}] ngay lập tức?\nMọi lưu lượng click từ địa chỉ IP và mã liên kết của đối tác này sẽ bị chặn vĩnh viễn.`)) {
                row.classList.add('fade-out');
                
                setTimeout(() => {
                    row.remove();
                    updateSuspectCount();
                    showAdminToast(`Đã khóa tài khoản [${name}] và đưa IP Proxy vào danh sách đen thành công!`);
                }, 400);
            }
        });
    });

    // Bỏ qua cảnh báo
    ignoreBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const row = this.closest('tr');
            const name = this.getAttribute('data-name');

            row.classList.add('fade-out');
            
            setTimeout(() => {
                row.remove();
                updateSuspectCount();
                showAdminToast(`Đã bỏ qua cảnh báo gian lận cho đối tác [${name}].`);
            }, 400);
        });
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

    if (toast.dataset.timerId) {
        clearTimeout(parseInt(toast.dataset.timerId));
    }

    toast.classList.add('show');

    const timerId = setTimeout(function () {
        toast.classList.remove('show');
    }, 3500);

    toast.dataset.timerId = timerId.toString();
}
