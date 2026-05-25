/**
 * ==========================================================================
 * Javascript xử lý logic động cho Trang Quản lý Khiếu nại Admin
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    
    // --- 1. KHỞI TẠO CÁC DROPDOWN VÀ THÔNG BÁO CHUNG ---
    initAdminDropdown();

    // --- 2. XỬ LÝ LỰA CHỌN TICKET ĐỔI CHI TIẾT ĐỘNG BÊN PHẢI (EVENT DELEGATION) ---
    initTicketDetailLoader();

    // --- 3. XỬ LÝ GỬI PHẢN HỒI VÀ GIẢI QUYẾT TICKET ---
    initTicketResponseManager();
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
 * Click chọn ticket bên trái, đổi chi tiết đàm thoại bên phải động (Real-time Dispute Selector)
 */
function initTicketDetailLoader() {
    const scrollList = document.getElementById('ticketsScrollList');
    if (!scrollList) return;

    // Lắng nghe sự kiện click bằng cơ chế Uỷ thác sự kiện (Event Delegation)
    scrollList.addEventListener('click', function (e) {
        const item = e.target.closest('.ticket-list-item');
        if (!item) return;

        // Bỏ active cũ, gán active mới
        const allItems = scrollList.querySelectorAll('.ticket-list-item');
        allItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        // Thu thập toàn bộ thuộc tính dữ liệu (dataset) chèn sẵn ở HTML Thymeleaf
        const id = item.getAttribute('data-id');
        const koc = item.getAttribute('data-koc');
        const username = item.getAttribute('data-username');
        const tier = item.getAttribute('data-tier');
        const subject = item.getAttribute('data-subject');
        const date = item.getAttribute('data-date');
        const desc = item.getAttribute('data-desc');
        const update = item.getAttribute('data-update');
        const status = item.getAttribute('data-status');
        const attachStr = item.getAttribute('data-attachments') || '';

        // Đồng bộ hoá sang khung chi tiết hội thoại bên phải
        document.getElementById('chatTicketId').textContent = id;
        document.getElementById('chatKocName').textContent = koc;
        document.getElementById('chatKocHandle').textContent = username;
        document.getElementById('chatKocTier').textContent = `👑 KOC Hạng ${tier}`;
        document.getElementById('chatSentTime').textContent = date;
        document.getElementById('chatUpdateTime').textContent = update;
        document.getElementById('chatDescription').textContent = desc;

        // Xử lý status badge
        const statusBadge = document.getElementById('chatTicketStatus');
        if (statusBadge) {
            statusBadge.className = `chat-status-badge ${status}`;
            statusBadge.textContent = status === 'pending' ? 'Chờ Xử Lý' : (status === 'resolved' ? 'Đã giải quyết' : 'Đã đóng');
        }

        // Làm sạch khung câu trả lời admin đã gửi cũ của ticket trước đó
        document.getElementById('adminRepliesList').innerHTML = '';

        // Xử lý tệp đính kèm
        const attachSection = document.getElementById('chatAttachmentsSection');
        const attachGrid = document.getElementById('chatAttachmentsGrid');
        
        if (attachStr && attachGrid) {
            attachSection.style.display = 'block';
            attachGrid.innerHTML = ''; // Làm rỗng

            const files = attachStr.split(',');
            files.forEach(file => {
                const cleanFile = file.trim();
                const isImage = cleanFile.endsWith('.jpg') || cleanFile.endsWith('.png') || cleanFile.endsWith('.jpeg');
                const fileIcon = isImage ? '📷' : '📄';
                const mockSize = cleanFile.includes('tiktok') ? '245 KB' : '312 KB';

                const fileEl = document.createElement('div');
                fileEl.className = 'attachment-item';
                fileEl.innerHTML = `
                    <div class="attachment-preview-img">${fileIcon}</div>
                    <div class="attachment-meta">
                        <span class="attachment-name">${cleanFile}</span>
                        <span class="attachment-size">${mockSize}</span>
                    </div>
                `;
                attachGrid.appendChild(fileEl);
            });
        } else if (attachSection) {
            attachSection.style.display = 'none';
        }

        // Tự động cuộn khung chat lên đầu khi đổi ticket
        const conversationArea = document.getElementById('chatConversationArea');
        if (conversationArea) {
            conversationArea.scrollTop = 0;
        }
    });
}

/**
 * Xử lý Gửi phản hồi, Đã giải quyết & Từ chối đóng
 */
function initTicketResponseManager() {
    const btnSend = document.getElementById('btnSendReply');
    const btnResolve = document.getElementById('btnResolveTicket');
    const btnReject = document.getElementById('btnRejectTicket');
    const textarea = document.getElementById('responseCommentArea');
    const repliesList = document.getElementById('adminRepliesList');
    const conversationArea = document.getElementById('chatConversationArea');

    if (!btnSend || !textarea) return;

    // GỬI PHẢN HỒI TIN NHẮN
    btnSend.addEventListener('click', function () {
        const text = textarea.value.trim();
        if (!text) {
            alert('Vui lòng nhập nội dung phản hồi trước khi gửi!');
            return;
        }

        const now = new Date();
        const hrs = now.getHours().toString().padStart(2, '0');
        const mins = now.getMinutes().toString().padStart(2, '0');

        // Tạo bubble chat Admin màu gradient tím
        const bubble = document.createElement('div');
        bubble.className = 'admin-chat-bubble';
        bubble.innerHTML = `
            <span class="bubble-time">Hôm nay, ${hrs}:${mins}</span>
            <div class="bubble-content">${text}</div>
        `;

        repliesList.appendChild(bubble);
        textarea.value = ''; // Reset ô nhập

        // Cuộn khung chat xuống đáy mượt mà (Smooth scroll to bottom)
        conversationArea.scrollTo({
            top: conversationArea.scrollHeight,
            behavior: 'smooth'
        });

        showAdminToast('Đã gửi phản hồi thành công đến KOC!');
    });

    // ĐÁNH DẤU ĐÃ GIẢI QUYẾT (RESOLVE)
    if (btnResolve) {
        btnResolve.addEventListener('click', function () {
            const activeItem = document.querySelector('.ticket-list-item.active');
            if (!activeItem) return;

            const ticketId = activeItem.getAttribute('data-id');
            const koc = activeItem.getAttribute('data-koc');

            // Cập nhật trạng thái DDTO
            activeItem.setAttribute('data-status', 'resolved');
            
            // Cập nhật giao diện chi tiết bên phải
            const statusBadge = document.getElementById('chatTicketStatus');
            if (statusBadge) {
                statusBadge.className = 'chat-status-badge resolved';
                statusBadge.textContent = 'Đã giải quyết';
            }

            // Đổi chấm trạng thái bên trái thành màu xanh
            const dot = activeItem.querySelector('.active-indicator-dot');
            if (dot) dot.style.backgroundColor = 'var(--emerald-color)';

            showAdminToast(`Đã giải quyết thành công yêu cầu ${ticketId} của ${koc}!`);
        });
    }

    // TỪ CHỐI / ĐÓNG TICKET (REJECT)
    if (btnReject) {
        btnReject.addEventListener('click', function () {
            const activeItem = document.querySelector('.ticket-list-item.active');
            if (!activeItem) return;

            const ticketId = activeItem.getAttribute('data-id');

            activeItem.setAttribute('data-status', 'closed');

            const statusBadge = document.getElementById('chatTicketStatus');
            if (statusBadge) {
                statusBadge.className = 'chat-status-badge closed';
                statusBadge.textContent = 'Đã đóng';
            }

            const dot = activeItem.querySelector('.active-indicator-dot');
            if (dot) dot.style.backgroundColor = '#ef4444';

            showAdminToast(`Đã từ chối và đóng Ticket hỗ trợ ${ticketId}.`);
        });
    }
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
