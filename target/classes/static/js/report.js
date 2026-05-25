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

            // Tạo mã Ticket ngẫu nhiên #TK-XXXX
            const randomId = Math.floor(1000 + Math.random() * 9000);
            const ticketId = `#TK-${randomId}`;

            // Định dạng ngày hiện tại DD/MM/YYYY HH:mm
            const now = new Date();
            const formattedDate = padZero(now.getDate()) + '/' + 
                                  padZero(now.getMonth() + 1) + '/' + 
                                  now.getFullYear() + ' ' + 
                                  padZero(now.getHours()) + ':' + 
                                  padZero(now.getMinutes());

            // Chủ đề hiển thị đầy đủ
            const displaySubject = `${subjectText} - Mã: ${disputeCode}`;

            // Tạo thẻ dòng TR mới
            const newRow = document.createElement('tr');
            
            // Thiết lập thuộc tính dữ liệu cho nút xem chi tiết của dòng mới
            let newButton = document.createElement('button');
            newButton.type = 'button';
            newButton.className = 'btn-view-ticket';
            newButton.textContent = 'Xem chi tiết';
            newButton.setAttribute('data-id', ticketId);
            newButton.setAttribute('data-subject', displaySubject);
            newButton.setAttribute('data-date', formattedDate);
            newButton.setAttribute('data-status', 'pending');
            newButton.setAttribute('data-status-text', 'Đang xử lý');
            newButton.setAttribute('data-desc', disputeDesc);

            if (currentAttachedFile) {
                newButton.setAttribute('data-file-name', currentAttachedFile.name);
                newButton.setAttribute('data-file-size', currentAttachedFile.sizeStr);
            }

            // Xây dựng cấu trúc HTML của dòng
            newRow.innerHTML = `
                <td class="col-ticket-id">${ticketId}</td>
                <td class="col-ticket-subject">${displaySubject}</td>
                <td class="col-ticket-date">${formattedDate}</td>
                <td class="col-ticket-status">
                    <div class="status-badge pending">
                        <span class="status-dot"></span>
                        <span>Đang xử lý</span>
                    </div>
                </td>
                <td class="col-ticket-action"></td>
            `;

            // Đưa nút vào cột action
            newRow.querySelector('.col-ticket-action').appendChild(newButton);

            // Thêm dòng mới lên trên cùng của bảng
            if (ticketsTableBody) {
                ticketsTableBody.insertBefore(newRow, ticketsTableBody.firstChild);
            }

            // Hiển thị Toast thông báo gửi thành công
            showToastNotification(`Gửi yêu cầu hỗ trợ thành công! Mã ticket: ${ticketId}`, '✓');

            // Reset biểu mẫu & tệp tải lên
            disputeForm.reset();
            clearSelectedFile();
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
