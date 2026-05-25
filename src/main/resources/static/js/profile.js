document.addEventListener('DOMContentLoaded', function() {
    // --------------------------------------------------------------------------
    // 1. Sao chép KOC ID vào Clipboard (Copy KOC ID to Clipboard)
    // --------------------------------------------------------------------------
    const copyIdBtn = document.getElementById('copyKocIdBtn');
    const kocIdText = document.getElementById('kocId');

    if (copyIdBtn && kocIdText) {
        copyIdBtn.addEventListener('click', function() {
            // Lấy chuỗi ID KOC thực tế
            const idString = kocIdText.innerText.replace('ID KOC: ', '').trim();
            
            // Sử dụng Clipboard API để sao chép
            navigator.clipboard.writeText(idString).then(function() {
                showTooltip(copyIdBtn, 'Đã sao chép!');
            }).catch(function(err) {
                console.error('Lỗi khi sao chép: ', err);
            });
        });
    }

    // Hàm tạo tooltip động bay lên mượt mà
    function showTooltip(anchorElement, message) {
        const oldTooltip = document.querySelector('.copied-tooltip');
        if (oldTooltip) oldTooltip.remove();

        const tooltip = document.createElement('div');
        tooltip.className = 'copied-tooltip';
        tooltip.innerText = message;
        
        tooltip.style.position = 'absolute';
        tooltip.style.backgroundColor = '#1e293b';
        tooltip.style.color = '#ffffff';
        tooltip.style.padding = '4px 8px';
        tooltip.style.borderRadius = '6px';
        tooltip.style.fontSize = '0.75rem';
        tooltip.style.fontWeight = '600';
        tooltip.style.top = '-30px';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.animation = 'tooltipFadeUp 0.3s ease forwards';
        
        const container = anchorElement.closest('.koc-id-group');
        if (container) {
            container.style.position = 'relative';
            container.appendChild(tooltip);
        }

        setTimeout(function() {
            tooltip.style.animation = 'tooltipFadeOut 0.3s ease forwards';
            setTimeout(function() {
                tooltip.remove();
            }, 300);
        }, 1500);
    }

    // Thêm animation tooltip vào trang động
    const styleSheet = document.createElement('style');
    styleSheet.innerText = `
        @keyframes tooltipFadeUp {
            from { opacity: 0; transform: translate(-50%, 4px); }
            to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes tooltipFadeOut {
            from { opacity: 1; transform: translate(-50%, 0); }
            to { opacity: 0; transform: translate(-50%, -4px); }
        }
    `;
    document.head.appendChild(styleSheet);

    // --------------------------------------------------------------------------
    // 2. Ẩn/Hiện Số tài khoản thanh toán tự động (Dynamic Bank Account Masking)
    // --------------------------------------------------------------------------
    const toggleBankBtn = document.getElementById('toggleBankBtn');
    const bankAccountText = document.getElementById('bankAccountNumber');

    if (toggleBankBtn && bankAccountText) {
        const originalAccountNumber = bankAccountText.innerText.trim();
        let isMasked = true;

        // Hàm che số tài khoản, chỉ chừa lại 4 số cuối
        function maskAccountNumber(number) {
            if (number.length <= 4) return number;
            // Nếu số đã bị che sẵn rồi (chứa dấu *) thì giữ nguyên
            if (number.includes('*')) return number;
            return '*'.repeat(number.length - 4).replace(/(.{4})/g, '$1 ').trim() + ' ' + number.slice(-4);
        }

        // Che ngay khi load trang
        const maskedNumber = maskAccountNumber(originalAccountNumber);
        bankAccountText.innerText = maskedNumber;

        const eyeOpenSVG = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/>
                <circle cx="12" cy="12" r="3"/>
            </svg>
        `;

        const eyeClosedSVG = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                <line x1="2" y1="2" x2="22" y2="22"/>
            </svg>
        `;

        toggleBankBtn.addEventListener('click', function() {
            isMasked = !isMasked;
            if (isMasked) {
                bankAccountText.innerText = maskedNumber;
                toggleBankBtn.innerHTML = eyeClosedSVG;
                toggleBankBtn.setAttribute('aria-label', 'Hiển thị số tài khoản');
            } else {
                bankAccountText.innerText = originalAccountNumber;
                toggleBankBtn.innerHTML = eyeOpenSVG;
                toggleBankBtn.setAttribute('aria-label', 'Ẩn số tài khoản');
            }
        });
    }

    // --------------------------------------------------------------------------
    // 3. Chuông báo thông báo (Notification Bell Alert)
    // --------------------------------------------------------------------------
    const bellBtn = document.getElementById('bellNotificationBtn');
    if (bellBtn) {
        bellBtn.addEventListener('click', function() {
            alert('Bạn có 3 thông báo mới chưa đọc từ hệ thống KOC/KOL Affiliate Network!');
            const badge = bellBtn.querySelector('.notification-badge');
            if (badge) badge.remove();
        });
    }

    // --------------------------------------------------------------------------
    // 4. Dropdown Menu góc phải (Profile Dropdown Menu)
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
                userProfileMenu.setAttribute('aria-expanded', 'false');
            } else {
                userDropdownMenu.classList.add('show');
                userProfileMenu.classList.add('active');
                userProfileMenu.setAttribute('aria-expanded', 'true');
            }
        });

        document.addEventListener('click', function(e) {
            if (!userProfileMenu.contains(e.target) && !userDropdownMenu.contains(e.target)) {
                userDropdownMenu.classList.remove('show');
                userProfileMenu.classList.remove('active');
                userProfileMenu.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // --------------------------------------------------------------------------
    // 5. Điều khiển Modal chỉnh sửa hồ sơ (Edit Profile Modal Controller)
    // --------------------------------------------------------------------------
    const editModal = document.getElementById('editProfileModal');
    const openProfileBtn = document.getElementById('openProfileModalBtn');
    const openSocialBtn = document.getElementById('openSocialModalBtn');
    const openPaymentBtn = document.getElementById('openPaymentModalBtn');
    const closeProfileBtn = document.getElementById('closeProfileModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');

    // Mở modal và pre-select tab tương ứng
    function openModalWithTab(tabId) {
        if (!editModal) return;
        editModal.style.display = 'flex';
        setTimeout(() => editModal.classList.add('show'), 10);
        
        // Active tab tương ứng
        const tabButton = editModal.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        if (tabButton) {
            tabButton.click();
        }
    }

    if (openProfileBtn) {
        openProfileBtn.addEventListener('click', () => openModalWithTab('tab-personal'));
    }
    if (openSocialBtn) {
        openSocialBtn.addEventListener('click', () => openModalWithTab('tab-social'));
    }
    if (openPaymentBtn) {
        openPaymentBtn.addEventListener('click', () => openModalWithTab('tab-payment'));
    }

    // Đóng modal
    function closeModal() {
        if (!editModal) return;
        editModal.classList.remove('show');
        setTimeout(() => editModal.style.display = 'none', 300);
    }

    if (closeProfileBtn) closeProfileBtn.addEventListener('click', closeModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeModal);

    // Đóng modal khi click ra ngoài vùng content
    if (editModal) {
        editModal.addEventListener('click', function(e) {
            if (e.target === editModal) {
                closeModal();
            }
        });
    }

    // Chuyển đổi qua lại giữa các tab trong Modal
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active classes
            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // Add active to current
            this.classList.add('active');
            const targetPaneId = this.getAttribute('data-tab');
            const targetPane = document.getElementById(targetPaneId);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });

    // --------------------------------------------------------------------------
    // 6. Tự động ẩn thông báo sau 4 giây (Auto-dismiss alert banners)
    // --------------------------------------------------------------------------
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(function(alert) {
        // Tự động đóng sau 4 giây (4000ms)
        setTimeout(function() {
            if (alert && alert.parentNode) {
                alert.style.opacity = '0';
                alert.style.transform = 'translateY(-8px)';
                setTimeout(() => {
                    alert.style.height = '0';
                    alert.style.padding = '0';
                    alert.style.margin = '0';
                    alert.style.border = 'none';
                    setTimeout(() => alert.remove(), 400);
                }, 400);
            }
        }, 4000);
    });
});
