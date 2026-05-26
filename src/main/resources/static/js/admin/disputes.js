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

    // --- 4. KHỞI TẠO BỘ LỌC TÌM KIẾM VÀ TRẠNG THÁI ---
    initTicketFilters();
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
 * Helper để ngăn chặn lỗi XSS khi chèn tin nhắn của người dùng vào HTML
 */
function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Tải danh sách các tin nhắn phản hồi của một ticket từ database và vẽ lên UI
 */
function loadReplies(ticketId) {
    const repliesList = document.getElementById('adminRepliesList');
    if (!repliesList) return;

    fetch(`/api/admin/disputes/${encodeURIComponent(ticketId)}/replies`)
        .then(response => response.json())
        .then(replies => {
            repliesList.innerHTML = '';
            
            replies.forEach(reply => {
                const bubble = document.createElement('div');
                if (reply.sender === 'admin') {
                    bubble.className = 'admin-chat-bubble';
                    bubble.innerHTML = `
                        <span class="bubble-time">${reply.created_at}</span>
                        <div class="bubble-content">${escapeHtml(reply.message)}</div>
                    `;
                } else {
                    bubble.className = 'koc-chat-bubble';
                    bubble.innerHTML = `
                        <span class="bubble-time">${reply.created_at}</span>
                        <div class="bubble-content">${escapeHtml(reply.message)}</div>
                    `;
                }
                repliesList.appendChild(bubble);
            });

            // Tự động cuộn xuống dưới cùng của khung chat
            const conversationArea = document.getElementById('chatConversationArea');
            if (conversationArea) {
                conversationArea.scrollTop = conversationArea.scrollHeight;
            }
        })
        .catch(err => {
            console.error('Error loading replies for ticket ' + ticketId, err);
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
        const update = item.getAttribute('data-update');
        const desc = item.getAttribute('data-desc');
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
            statusBadge.style.display = 'inline-flex';
            statusBadge.className = `chat-status-badge ${status}`;
            statusBadge.textContent = status === 'pending' ? 'Chờ Xử Lý' : (status === 'resolved' ? 'Đã giải quyết' : 'Đã đóng');
        }

        // Xử lý ẩn/hiện khung phản hồi và banner (Chế độ chỉ đọc khi ticket đã hoàn thành/đóng)
        const responsePanel = document.querySelector('.chat-response-panel');
        const closedBanner = document.getElementById('chatClosedBanner');
        const closedBannerText = document.getElementById('chatClosedBannerText');

        if (responsePanel && closedBanner) {
            if (status === 'resolved' || status === 'closed') {
                responsePanel.style.display = 'none';
                closedBanner.style.display = 'flex';
                if (status === 'resolved') {
                    closedBannerText.innerHTML = `✅ <strong>Khiếu nại đã giải quyết.</strong> Cuộc thảo luận đã kết thúc ở chế độ chỉ đọc.`;
                    closedBanner.style.backgroundColor = 'rgba(16, 185, 129, 0.03)';
                    closedBanner.style.color = 'var(--emerald-color)';
                    closedBanner.style.borderTop = '1px solid rgba(16, 185, 129, 0.15)';
                } else {
                    closedBannerText.innerHTML = `🔒 <strong>Khiếu nại đã đóng.</strong> Cuộc thảo luận đã kết thúc ở chế độ chỉ đọc.`;
                    closedBanner.style.backgroundColor = 'rgba(239, 68, 68, 0.03)';
                    closedBanner.style.color = '#ef4444';
                    closedBanner.style.borderTop = '1px solid rgba(239, 68, 68, 0.15)';
                }
            } else {
                responsePanel.style.display = 'flex';
                closedBanner.style.display = 'none';
            }
        }

        // Tải các phản hồi chat thực tế từ CSDL
        loadReplies(id);

        // Xử lý tệp đính kèm
        const attachSection = document.getElementById('chatAttachmentsSection');
        const attachGrid = document.getElementById('chatAttachmentsGrid');
        
        if (attachStr && attachGrid) {
            attachSection.style.display = 'block';
            attachGrid.innerHTML = ''; // Làm rỗng

            const files = attachStr.split(',');
            files.forEach(file => {
                const cleanFile = file.trim();
                if (!cleanFile) return;
                const isImage = cleanFile.endsWith('.jpg') || cleanFile.endsWith('.png') || cleanFile.endsWith('.jpeg');
                const fileIcon = isImage ? '📷' : '📄';
                const mockSize = cleanFile.includes('tiktok') || cleanFile.includes('doisoat') ? '245 KB' : '312 KB';

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

    // Tự động kích hoạt tải tin nhắn cho ticket đang active mặc định đầu tiên khi vào trang
    setTimeout(() => {
        const activeItem = scrollList.querySelector('.ticket-list-item.active');
        if (activeItem) {
            activeItem.click();
        }
    }, 100);
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

    // GỬI PHẢN HỒI TIN NHẮN (GỌI REST API)
    btnSend.addEventListener('click', function () {
        const text = textarea.value.trim();
        if (!text) {
            alert('Vui lòng nhập nội dung phản hồi trước khi gửi!');
            return;
        }

        const activeItem = document.querySelector('.ticket-list-item.active');
        if (!activeItem) return;

        const ticketId = activeItem.getAttribute('data-id');

        fetch('/api/admin/disputes/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketId: ticketId, message: text })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Tạo bubble chat Admin màu gradient tím
                const bubble = document.createElement('div');
                bubble.className = 'admin-chat-bubble';
                bubble.innerHTML = `
                    <span class="bubble-time">${data.time}</span>
                    <div class="bubble-content">${escapeHtml(text)}</div>
                `;

                repliesList.appendChild(bubble);
                textarea.value = ''; // Reset ô nhập

                // Cập nhật số lượt bình luận trên pill bên trái
                const commentPill = activeItem.querySelector('.comment-count-pill');
                if (commentPill) {
                    const currentCount = parseInt(commentPill.textContent.replace('💬', '').trim()) || 0;
                    commentPill.textContent = `💬 ${currentCount + 1}`;
                }

                // Cuộn khung chat xuống đáy mượt mà (Smooth scroll to bottom)
                conversationArea.scrollTo({
                    top: conversationArea.scrollHeight,
                    behavior: 'smooth'
                });

                showAdminToast('Đã gửi phản hồi thành công đến KOC!');
            } else {
                alert('Lỗi: ' + (data.message || 'Không thể gửi phản hồi.'));
            }
        })
        .catch(err => {
            console.error('Error sending reply:', err);
            alert('Lỗi kết nối khi gửi phản hồi.');
        });
    });

    // ĐÁNH DẤU ĐÃ GIẢI QUYẾT (RESOLVE - GỌI REST API)
    if (btnResolve) {
        btnResolve.addEventListener('click', function () {
            const activeItem = document.querySelector('.ticket-list-item.active');
            if (!activeItem) return;

            const ticketId = activeItem.getAttribute('data-id');
            const koc = activeItem.getAttribute('data-koc');

            fetch('/api/admin/disputes/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId: ticketId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // Cập nhật trạng thái
                    activeItem.setAttribute('data-status', 'resolved');
                    
                    // Cập nhật giao diện chi tiết bên phải
                    const statusBadge = document.getElementById('chatTicketStatus');
                    if (statusBadge) {
                        statusBadge.className = 'chat-status-badge resolved';
                        statusBadge.textContent = 'Đã giải quyết';
                    }

                    // Đổi chấm trạng thái bên trái thành màu xanh lục
                    const dot = activeItem.querySelector('.active-indicator-dot');
                    if (dot) dot.style.backgroundColor = 'var(--emerald-color)';

                    // Click lại để re-trigger detail loader (chuyển sang chế độ chỉ đọc)
                    activeItem.click();

                    // Cập nhật lại bộ lọc để ẩn ticket nếu bộ lọc hiện tại không khớp
                    const statusFilter = document.getElementById('ticketStatusFilter');
                    if (statusFilter) {
                        statusFilter.dispatchEvent(new Event('change'));
                    }

                    showAdminToast(`Đã giải quyết thành công yêu cầu ${ticketId} của ${koc}!`);
                } else {
                    alert('Lỗi: ' + (data.message || 'Không thể cập nhật trạng thái.'));
                }
            })
            .catch(err => {
                console.error('Error resolving ticket:', err);
                alert('Lỗi kết nối khi đánh dấu giải quyết.');
            });
        });
    }

    // TỪ CHỐI / ĐÓNG TICKET (REJECT - GỌI REST API)
    if (btnReject) {
        btnReject.addEventListener('click', function () {
            const activeItem = document.querySelector('.ticket-list-item.active');
            if (!activeItem) return;

            const ticketId = activeItem.getAttribute('data-id');

            fetch('/api/admin/disputes/close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId: ticketId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    activeItem.setAttribute('data-status', 'closed');

                    const statusBadge = document.getElementById('chatTicketStatus');
                    if (statusBadge) {
                        statusBadge.className = 'chat-status-badge closed';
                        statusBadge.textContent = 'Đã đóng';
                    }

                    const dot = activeItem.querySelector('.active-indicator-dot');
                    if (dot) dot.style.backgroundColor = '#ef4444';

                    // Click lại để re-trigger detail loader (chuyển sang chế độ chỉ đọc)
                    activeItem.click();

                    // Cập nhật lại bộ lọc để ẩn ticket nếu bộ lọc hiện tại không khớp
                    const statusFilter = document.getElementById('ticketStatusFilter');
                    if (statusFilter) {
                        statusFilter.dispatchEvent(new Event('change'));
                    }

                    showAdminToast(`Đã từ chối và đóng Ticket hỗ trợ ${ticketId}.`);
                } else {
                    alert('Lỗi: ' + (data.message || 'Không thể đóng ticket.'));
                }
            })
            .catch(err => {
                console.error('Error closing ticket:', err);
                alert('Lỗi kết nối khi đóng ticket.');
            });
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

/**
 * Khởi tạo bộ lọc tìm kiếm và trạng thái của danh sách Ticket
 */
function initTicketFilters() {
    const searchInput = document.getElementById('ticketSearchInput');
    const statusFilter = document.getElementById('ticketStatusFilter');
    const scrollList = document.getElementById('ticketsScrollList');
    const paginationInfo = document.querySelector('.pagination-info');

    if (!scrollList) return;

    function applyFilter() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const selectedStatus = statusFilter ? statusFilter.value : 'all';

        const items = scrollList.querySelectorAll('.ticket-list-item');
        let visibleCount = 0;
        let firstVisibleItem = null;

        items.forEach(item => {
            const id = (item.getAttribute('data-id') || '').toLowerCase();
            const kocName = (item.getAttribute('data-koc') || '').toLowerCase();
            const subject = (item.getAttribute('data-subject') || '').toLowerCase();
            const status = item.getAttribute('data-status') || '';

            // Kiểm tra trạng thái
            const matchesStatus = (selectedStatus === 'all') || (status === selectedStatus);

            // Kiểm tra tìm kiếm theo mã ID, tên KOC hoặc tiêu đề
            const matchesSearch = !query || 
                id.includes(query) || 
                kocName.includes(query) || 
                subject.includes(query);

            if (matchesStatus && matchesSearch) {
                item.style.display = 'flex';
                visibleCount++;
                if (!firstVisibleItem) {
                    firstVisibleItem = item;
                }
            } else {
                item.style.display = 'none';
            }
        });

        // Cập nhật thông tin hiển thị số lượng
        if (paginationInfo) {
            paginationInfo.textContent = `Hiển thị ${visibleCount} ticket`;
        }

        // Tự động chọn ticket đầu tiên trong danh sách sau khi lọc nếu ticket active cũ bị ẩn
        const activeItem = scrollList.querySelector('.ticket-list-item.active');
        if (activeItem && activeItem.style.display === 'none') {
            activeItem.classList.remove('active');
            if (firstVisibleItem) {
                firstVisibleItem.click();
            } else {
                clearTicketDetail();
            }
        } else if (!activeItem && firstVisibleItem) {
            firstVisibleItem.click();
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', applyFilter);
    }
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilter);
    }

    // Chạy bộ lọc lần đầu tiên để đồng bộ danh sách khi tải trang
    applyFilter();
}

/**
 * Xóa trắng vùng chi tiết khi không có ticket nào được hiển thị/chọn
 */
function clearTicketDetail() {
    document.getElementById('chatTicketId').textContent = 'Không có yêu cầu';
    document.getElementById('chatKocName').textContent = '-';
    document.getElementById('chatKocHandle').textContent = '';
    document.getElementById('chatKocTier').textContent = '';
    document.getElementById('chatSentTime').textContent = '-';
    document.getElementById('chatUpdateTime').textContent = '-';
    document.getElementById('chatDescription').textContent = 'Vui lòng chọn một yêu cầu hỗ trợ từ danh sách hoặc thay đổi bộ lọc.';
    
    const statusBadge = document.getElementById('chatTicketStatus');
    if (statusBadge) {
        statusBadge.style.display = 'none';
    }

    const repliesList = document.getElementById('adminRepliesList');
    if (repliesList) repliesList.innerHTML = '';

    const attachSection = document.getElementById('chatAttachmentsSection');
    if (attachSection) attachSection.style.display = 'none';

    const responsePanel = document.querySelector('.chat-response-panel');
    const closedBanner = document.getElementById('chatClosedBanner');
    if (responsePanel) responsePanel.style.display = 'none';
    if (closedBanner) closedBanner.style.display = 'none';
}
