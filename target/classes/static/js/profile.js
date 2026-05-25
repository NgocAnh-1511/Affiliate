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
                // Tạo thông báo tạm thời (Tooltip) ngay cạnh nút sao chép
                showTooltip(copyIdBtn, 'Đã sao chép!');
            }).catch(function(err) {
                console.error('Lỗi khi sao chép: ', err);
            });
        });
    }

    // Hàm tạo tooltip động bay lên mượt mà
    function showTooltip(anchorElement, message) {
        // Xóa tooltip cũ nếu có
        const oldTooltip = document.querySelector('.copied-tooltip');
        if (oldTooltip) oldTooltip.remove();

        const tooltip = document.createElement('div');
        tooltip.className = 'copied-tooltip';
        tooltip.innerText = message;
        
        // CSS inline cho tooltip cao cấp
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
        
        // Đảm bảo phần tử chứa có position relative
        const container = anchorElement.closest('.koc-id-group');
        if (container) {
            container.style.position = 'relative';
            container.appendChild(tooltip);
        }

        // Tự động biến mất sau 1.5 giây
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
    // 2. Ẩn/Hiện Số tài khoản thanh toán (Toggle Bank Account Visibility)
    // --------------------------------------------------------------------------
    const toggleBankBtn = document.getElementById('toggleBankBtn');
    const bankAccountText = document.getElementById('bankAccountNumber');

    if (toggleBankBtn && bankAccountText) {
        // Trạng thái gốc
        let isMasked = true;
        const maskedNumber = bankAccountText.innerText;
        const realNumber = "1011 2026 1234"; // Mock Số tài khoản thực

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
                bankAccountText.innerText = realNumber;
                toggleBankBtn.innerHTML = eyeOpenSVG;
                toggleBankBtn.setAttribute('aria-label', 'Ẩn số tài khoản');
            }
        });
    }

    // --------------------------------------------------------------------------
    // 3. Chuông báo thông báo (Notification Bell Toast)
    // --------------------------------------------------------------------------
    const bellBtn = document.getElementById('bellNotificationBtn');
    if (bellBtn) {
        bellBtn.addEventListener('click', function() {
            alert('Bạn có 3 thông báo mới chưa đọc từ hệ thống KOC/KOL Affiliate Network!');
            const badge = bellBtn.querySelector('.notification-badge');
            if (badge) badge.remove(); // Xoá badge khi đã click xem
        });
    }

    // --------------------------------------------------------------------------
    // 4. Menu thả xuống của Hồ sơ góc phải (Right Header Dropdown Menu Toggle)
    // --------------------------------------------------------------------------
    const userProfileMenu = document.getElementById('userProfileMenu');
    const userDropdownMenu = document.getElementById('userDropdownMenu');

    if (userProfileMenu && userDropdownMenu) {
        userProfileMenu.addEventListener('click', function(e) {
            e.stopPropagation(); // Ngăn sự kiện nổi bọt để tránh tự đóng ngay lập tức
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

        // Đóng dropdown khi người dùng nhấp chuột ra ngoài vùng menu
        document.addEventListener('click', function(e) {
            if (!userProfileMenu.contains(e.target) && !userDropdownMenu.contains(e.target)) {
                userDropdownMenu.classList.remove('show');
                userProfileMenu.classList.remove('active');
                userProfileMenu.setAttribute('aria-expanded', 'false');
            }
        });
    }
});
