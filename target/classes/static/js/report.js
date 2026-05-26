/**
 * KOC/KOL Affiliate Network - Hỗ trợ & Khiếu nại JS Logic
 * Xử lý kéo thả tệp, gửi form động thêm dòng mới vào bảng, hiển thị Modal chi tiết, và Toast thông báo.
 */
document.addEventListener('DOMContentLoaded', function() {

    // ==========================================================================
    // 1. MENU THẢ XUỐNG USER & THÔNG BÁO (Header dropdown & notifications)
    // ==========================================================================
    const userProfileMenu = document.getElementById('userProfileMenu');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    const bellNotificationBtn = document.getElementById('bellNotificationBtn');

    if (userProfileMenu && userDropdownMenu) {
        userProfileMenu.addEventListener('click', function(e) {
            e.stopPropagation();
            userProfileMenu.classList.toggle('active');
            userDropdownMenu.classList.toggle('show');
        });

        // Đóng dropdown khi click ra ngoài
        document.addEventListener('click', function(e) {
            if (!userProfileMenu.contains(e.target) && !userDropdownMenu.contains(e.target)) {
                userProfileMenu.classList.remove('active');
                userDropdownMenu.classList.remove('show');
            }
        });
    }

    if (bellNotificationBtn) {
        bellNotificationBtn.addEventListener('click', function() {
            showToastNotification('Hệ thống: Bạn không có thông báo mới nào hôm nay.', '✓');
        });
    }


    // ==========================================================================
    // 2. KÉO THẢ VÀ CHỌN HÌNH ẢNH ĐỐI SOÁT (Drag & Drop File Upload)
    // ==========================================================================
    const dragDropArea = document.getElementById('dragDropArea');
    const fileInput = document.getElementById('fileInput');
    const uploadContent = dragDropArea.querySelector('.upload-content');
    const selectedFileDisplay = document.getElementById('selectedFileDisplay');
    const selectedFileName = document.getElementById('selectedFileName');
    const selectedFileSize = document.getElementById('selectedFileSize');
    const btnRemoveFile = document.getElementById('btnRemoveFile');

    let currentAttachedFile = null;

    // Ngăn chặn hành vi mặc định của trình duyệt cho sự kiện drag
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dragDropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Hiệu ứng highlight khi kéo tệp vào vùng upload
    ['dragenter', 'dragover'].forEach(eventName => {
        dragDropArea.addEventListener(eventName, () => {
            dragDropArea.classList.add('highlight');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dragDropArea.addEventListener(eventName, () => {
            dragDropArea.classList.remove('highlight');
        }, false);
    });

    // Xử lý khi thả file (drop)
    dragDropArea.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    // Xử lý khi chọn file qua hộp thoại duyệt file
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    // Hàm đọc và hiển thị thông tin tệp
    function handleFiles(files) {
        if (files.length === 0) return;

        const file = files[0];
        
        // Kiểm tra dung lượng tệp tối đa 5MB
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('Tệp quá lớn! Vui lòng chọn tệp có dung lượng nhỏ hơn 5MB.');
            fileInput.value = '';
            return;
        }

        // Kiểm tra định dạng tệp (Hình ảnh hoặc PDF)
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            alert('Định dạng tệp không hợp lệ! Vui lòng chỉ tải ảnh (JPG, PNG) hoặc tệp PDF.');
            fileInput.value = '';
            return;
        }

        // Lưu thông tin tệp
        currentAttachedFile = {
            name: file.name,
            sizeStr: formatBytes(file.size)
        };

        // Cập nhật giao diện: Ẩn đám mây, Hiện khung thông tin tệp
        selectedFileName.textContent = file.name;
        selectedFileSize.textContent = `(${formatBytes(file.size)})`;
        
        uploadContent.style.display = 'none';
        selectedFileDisplay.style.display = 'flex';
    }

    // Xử lý nút xóa tệp đã chọn
    btnRemoveFile.addEventListener('click', function(e) {
        e.stopPropagation(); // Ngăn sự kiện click kích hoạt chọn file mới
        clearSelectedFile();
    });

    function clearSelectedFile() {
        fileInput.value = '';
        currentAttachedFile = null;
        selectedFileName.textContent = '';
        selectedFileSize.textContent = '';
        
        selectedFileDisplay.style.display = 'none';
        uploadContent.style.display = 'flex';
    }

    // Helper format dung lượng tệp
    function formatBytes(bytes, decimals = 1) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }


    // ==========================================================================
    // 3. GỬI YÊU CẦU HỖ TRỢ VÀ THÊM DÒNG TICKET MỚI (Live Form Submit)
    // ==========================================================================
    const disputeForm = document.getElementById('disputeForm');
    const ticketsTableBody = document.getElementById('ticketsTableBody');

    if (disputeForm) {
        disputeForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Lấy thông tin đầu vào
            const disputeSubjectSelect = document.getElementById('disputeSubject');
            const disputeCode = document.getElementById('disputeCode').value.trim();
            const disputeDesc = document.getElementById('disputeDesc').value.trim();

            const subjectText = disputeSubjectSelect.options[disputeSubjectSelect.selectedIndex].text;
            const subjectVal = disputeSubjectSelect.value;

            // Lấy thông tin tệp đối soát đính kèm
            const fileName = currentAttachedFile ? currentAttachedFile.name : "";

            // Gọi API REST lưu trữ vào CSDL MySQL thực tế
            fetch('/api/disputes/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subjectType: subjectVal,
                    subjectText: subjectText,
                    relatedCode: disputeCode,
                    description: disputeDesc,
                    fileName: fileName
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    // Hiển thị Toast thông báo gửi thành công với mã ticket thực tế từ server
                    showToastNotification(`Gửi yêu cầu hỗ trợ thành công! Mã ticket: ${data.ticketId}`, '✓');

                    // Reset biểu mẫu & tệp tải lên
                    disputeForm.reset();
                    clearSelectedFile();

                    // Tải lại trang sau 1.2 giây để đồng bộ hóa hoàn hảo với CSDL
                    setTimeout(function() {
                        window.location.reload();
                    }, 1200);
                } else {
                    alert('Lỗi: ' + (data.message || 'Không thể gửi khiếu nại lúc này.'));
                }
            })
            .catch(error => {
                console.error('Error submitting dispute ticket:', error);
                alert('Có lỗi xảy ra khi kết nối tới hệ thống hỗ trợ.');
            });
        });
    }

    function padZero(num) {
        return num < 10 ? '0' + num : num;
    }


    // ==========================================================================
    // 4. TOAST NOTIFICATION POPUP SYSTEM
    // ==========================================================================
    const toastNotification = document.getElementById('toastNotification');
    let toastTimer = null;

    function showToastNotification(message, icon = '✓') {
        if (!toastNotification) return;

        // Xóa bộ hẹn giờ cũ nếu có
        if (toastTimer) {
            clearTimeout(toastTimer);
        }

        const iconEl = toastNotification.querySelector('.toast-icon');
        const msgEl = toastNotification.querySelector('.toast-message');

        if (iconEl) iconEl.textContent = icon;
        if (msgEl) msgEl.textContent = message;

        // Hiện Toast mượt mà
        toastNotification.classList.add('show');

        // Tự động ẩn sau 3.5 giây
        toastTimer = setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 3500);
    }


    // ==========================================================================
    // 5. HỘP THOẠI XEM CHI TIẾT TICKET (Ticket Detail Modal - Delegated event)
    // ==========================================================================
    const ticketModalOverlay = document.getElementById('ticketModalOverlay');
    const modalTicketId = document.getElementById('modalTicketId');
    const modalTicketDate = document.getElementById('modalTicketDate');
    const modalTicketBadge = document.getElementById('modalTicketBadge');
    const modalTicketStatusText = document.getElementById('modalTicketStatusText');
    const modalTicketSubject = document.getElementById('modalTicketSubject');
    const modalTicketDesc = document.getElementById('modalTicketDesc');
    const modalAttachmentGroup = document.getElementById('modalAttachmentGroup');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnModalCloseAction = document.getElementById('btnModalCloseAction');

    // Uỷ thác sự kiện click cho nút "Xem chi tiết" (Hỗ trợ tốt cho cả dòng ticket vừa thêm động)
    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('btn-view-ticket')) {
            const btn = e.target;
            
            const id = btn.getAttribute('data-id');
            const subject = btn.getAttribute('data-subject');
            const date = btn.getAttribute('data-date');
            const status = btn.getAttribute('data-status');
            const statusText = btn.getAttribute('data-status-text');
            const desc = btn.getAttribute('data-desc');
            
            const fileName = btn.getAttribute('data-file-name');
            const fileSize = btn.getAttribute('data-file-size');

            // Cập nhật thông tin Modal
            if (modalTicketId) modalTicketId.textContent = `Chi tiết Yêu cầu ${id}`;
            if (modalTicketDate) modalTicketDate.textContent = date;
            if (modalTicketSubject) modalTicketSubject.textContent = subject;
            if (modalTicketDesc) modalTicketDesc.textContent = desc;
            if (modalTicketStatusText) modalTicketStatusText.textContent = statusText;

            // Đặt Class trạng thái phù hợp cho Badge
            if (modalTicketBadge) {
                modalTicketBadge.className = `status-badge ${status}`;
            }

            // Xử lý tệp đính kèm hình ảnh
            if (modalAttachmentGroup) {
                if (fileName && fileSize) {
                    // Nếu có tệp tuỳ chỉnh đính kèm
                    modalAttachmentGroup.style.display = 'block';
                    modalAttachmentGroup.querySelector('.attachment-name').textContent = `${fileName} (${fileSize})`;
                } else if (id === '#TK-1042' || id === '#TK-1037' || id === '#TK-1028') {
                    // Trạng thái mặc định ban đầu cho dòng có tệp đính kèm
                    modalAttachmentGroup.style.display = 'block';
                    modalAttachmentGroup.querySelector('.attachment-name').textContent = 'screenshot_doisoat.png (1.2 MB)';
                } else {
                    // Nếu không có tệp đính kèm
                    modalAttachmentGroup.style.display = 'none';
                }
            }

            // --- TẢI TIN NHẮN TRÒ CHUYỆN THỰC TẾ TỪ CSDL ---
            const chatArea = document.getElementById('modalChatArea');
            if (chatArea) {
                chatArea.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 0.78rem; padding: 0.5rem 0;">Đang tải hội thoại...</p>';
                
                fetch(`/api/disputes/${encodeURIComponent(id)}/replies`)
                .then(res => res.json())
                .then(replies => {
                    chatArea.innerHTML = '';
                    if (replies.length === 0) {
                        chatArea.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 0.78rem; padding: 0.75rem 0; font-weight: 500;">Chưa có trao đổi nào với Admin.</p>';
                    } else {
                        replies.forEach(reply => {
                            const bubble = document.createElement('div');
                            if (reply.sender === 'admin') {
                                // Admin gửi: căn lề trái (màu xám)
                                bubble.className = 'modal-admin-bubble';
                                bubble.innerHTML = `
                                    <span class="modal-bubble-time">${reply.sender_name} - ${reply.created_at}</span>
                                    <div class="bubble-content">${escapeHtml(reply.message)}</div>
                                `;
                            } else {
                                // KOC gửi: căn lề phải (màu tím)
                                bubble.className = 'modal-koc-bubble';
                                bubble.innerHTML = `
                                    <span class="modal-bubble-time">${reply.created_at}</span>
                                    <div class="bubble-content">${escapeHtml(reply.message)}</div>
                                `;
                            }
                            chatArea.appendChild(bubble);
                        });
                    }
                    // Tự động cuộn xuống đáy khung chat modal
                    chatArea.scrollTop = chatArea.scrollHeight;
                })
                .catch(err => {
                    console.error('Error fetching ticket replies:', err);
                    chatArea.innerHTML = '<p style="text-align: center; color: #ef4444; font-size: 0.78rem; padding: 0.5rem 0;">Không thể tải lịch sử chat.</p>';
                });
            }

            // Ẩn/Hiện khung gửi phản hồi dựa trên trạng thái ticket (không cho chat khi ticket đã đóng)
            const chatInputWrapper = document.getElementById('modalChatInputWrapper');
            if (chatInputWrapper) {
                if (status === 'closed') {
                    chatInputWrapper.style.display = 'none';
                } else {
                    chatInputWrapper.style.display = 'flex';
                }
            }

            // Hiển thị modal
            if (ticketModalOverlay) {
                ticketModalOverlay.classList.add('show');
            }
        }
    });

    // Hàm đóng Modal
    function closeModal() {
        if (ticketModalOverlay) {
            ticketModalOverlay.classList.remove('show');
        }
    }

    if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
    if (btnModalCloseAction) btnModalCloseAction.addEventListener('click', closeModal);

    // Click ra ngoài vùng Modal để đóng
    if (ticketModalOverlay) {
        ticketModalOverlay.addEventListener('click', function(e) {
            if (e.target === ticketModalOverlay) {
                closeModal();
            }
        });
    }

    // --- XỬ LÝ KOC GỬI PHẢN HỒI MỚI NGAY TRONG MODAL ---
    const btnModalSendReply = document.getElementById('btnModalSendReply');
    const modalReplyText = document.getElementById('modalReplyText');

    if (btnModalSendReply && modalReplyText) {
        btnModalSendReply.addEventListener('click', function() {
            const text = modalReplyText.value.trim();
            if (!text) {
                alert('Vui lòng nhập nội dung câu trả lời của bạn!');
                return;
            }

            // Lấy ID ticket đang xem từ tiêu đề modal
            const modalTitleText = document.getElementById('modalTicketId').textContent;
            const ticketIdMatch = modalTitleText.match(/#TK-\d+/);
            if (!ticketIdMatch) {
                alert('Không thể xác định mã Ticket hiện tại.');
                return;
            }
            const ticketId = ticketIdMatch[0];

            btnModalSendReply.disabled = true;

            // Gọi API gửi câu trả lời
            fetch(`/api/disputes/${encodeURIComponent(ticketId)}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: text
                })
            })
            .then(res => res.json())
            .then(data => {
                btnModalSendReply.disabled = false;
                if (data.status === 'success') {
                    const chatArea = document.getElementById('modalChatArea');
                    if (chatArea) {
                        // Xóa dòng thông báo "Chưa có phản hồi" nếu có
                        const placeholder = chatArea.querySelector('p');
                        if (placeholder) {
                            chatArea.innerHTML = '';
                        }

                        // Vẽ bubble chat của KOC căn phải
                        const bubble = document.createElement('div');
                        bubble.className = 'modal-koc-bubble';
                        bubble.innerHTML = `
                            <span class="modal-bubble-time">${data.time}</span>
                            <div class="bubble-content">${escapeHtml(text)}</div>
                        `;
                        chatArea.appendChild(bubble);

                        // Reset ô nhập liệu
                        modalReplyText.value = '';

                        // Cuộn xuống đáy mượt mà
                        chatArea.scrollTo({
                            top: chatArea.scrollHeight,
                            behavior: 'smooth'
                        });
                    }
                } else {
                    alert('Lỗi: ' + (data.message || 'Không thể gửi câu trả lời lúc này.'));
                }
            })
            .catch(err => {
                btnModalSendReply.disabled = false;
                console.error('Error replying from KOC modal:', err);
                alert('Có lỗi xảy ra khi kết nối để gửi tin nhắn.');
            });
        });

        // Hỗ trợ gõ Enter gửi tin nhắn nhanh (Shift + Enter xuống dòng)
        modalReplyText.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                btnModalSendReply.click();
            }
        });
    }

    // Helper ngăn chặn lỗi bảo mật XSS khi chèn text của người dùng
    function escapeHtml(text) {
        if (!text) return "";
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    // ==========================================================================
    // 6. PHÂN TRANG VÀ SỐ HÀNG MOCKUP INTERACTION
    // ==========================================================================
    const pageItems = document.querySelectorAll('.page-item, .page-item-btn');
    const rowsSelect = document.querySelector('.rows-select');

    pageItems.forEach(item => {
        item.addEventListener('click', function() {
            if (item.classList.contains('page-dots')) return;

            // Xóa hoạt động cũ
            if (item.classList.contains('page-item')) {
                document.querySelectorAll('.page-item').forEach(p => p.classList.remove('active'));
                item.classList.add('active');
                
                const pageNum = item.textContent;
                showToastNotification(`Đang hiển thị dữ liệu lịch sử trang ${pageNum}...`, '✓');
            } else {
                showToastNotification(`Đang chuyển trang danh sách khiếu nại...`, '✓');
            }
        });
    });

    if (rowsSelect) {
        rowsSelect.addEventListener('change', function() {
            const count = this.value;
            showToastNotification(`Cập nhật hiển thị số dòng: ${count} dòng/trang`, '✓');
        });
    }

});
