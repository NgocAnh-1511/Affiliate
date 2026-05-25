/**
 * ==========================================================================
 * Javascript xử lý logic động cho Trang Nhật ký Hoạt động (Audit Trail Logs)
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', function () {
    
    // --- 1. KHỞI TẠO CÁC DROPDOWN VÀ TOAST CHUNG ---
    initAdminDropdown();

    // --- 2. XỬ LÝ HIGHLIGHT CÚ PHÁP JSON CHI TIẾT BẢN GHI ---
    initJsonSyntaxHighlighting();

    // --- 3. XỬ LÝ ĐÓNG MỞ CHI TIẾT BẢN GHI LOG (ROW EXPANSION) ---
    initLogsExpansion();

    // --- 4. XỬ LÝ SAO CHÉP CHI TIẾT BẢN GHI JSON ---
    initCopyJson();

    // --- 5. XỬ LÝ LỌC VÀ TÌM KIẾM NHẬT KÝ KIỂM TOÁN (AUDIT LOG FILTER) ---
    initAuditLogFilter();

    // --- 6. XỬ LÝ XUẤT FILE CSV ĐỘNG THỰC TẾ ---
    initExportCSV();
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
        
        // Quay nhẹ icon chevron
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
 * Hàm highlight cú pháp JSON bằng CSS/HTML động
 * Giúp giao diện code block trông cực kỳ premium và sinh động
 */
function initJsonSyntaxHighlighting() {
    const codeBlocks = document.querySelectorAll('code.language-json');
    codeBlocks.forEach(block => {
        const rawJson = block.textContent;
        try {
            // Định dạng lại đẹp đẽ trước khi tô màu
            const parsed = JSON.parse(rawJson);
            const formatted = JSON.stringify(parsed, null, 2);
            block.innerHTML = syntaxHighlightJson(formatted);
        } catch (e) {
            // Nếu không parse được, giữ nguyên và highlight cơ bản
            block.innerHTML = syntaxHighlightJson(rawJson);
        }
    });
}

/**
 * Hàm phụ trợ định dạng màu sắc cho chuỗi JSON
 */
function syntaxHighlightJson(json) {
    if (typeof json !== 'string') {
        json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
        let cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        
        let color = '#38bdf8'; // Sky blue cho key JSON
        if (cls === 'number') color = '#fb7185'; // Rose cho con số
        else if (cls === 'string') color = '#34d399'; // Emerald cho chuỗi giá trị
        else if (cls === 'boolean') color = '#a78bfa'; // Violet cho boolean
        else if (cls === 'null') color = '#94a3b8'; // Slate cho null
        
        if (cls === 'key') {
            return '<span style="color: ' + color + '; font-weight: 700;">' + match + '</span>';
        } else {
            return '<span style="color: ' + color + ';">' + match + '</span>';
        }
    });
}

/**
 * Xử lý đóng/mở chi tiết bản ghi log (Row Expansion)
 */
function initLogsExpansion() {
    const logRows = document.querySelectorAll('.log-row');
    
    logRows.forEach(row => {
        // Lắng nghe sự kiện click trên dòng log chính hoặc nút mũi tên
        row.addEventListener('click', function (e) {
            // Không kích hoạt nếu click trực tiếp vào nút sao chép hoặc liên kết khác
            if (e.target.closest('.btn-copy-json') || e.target.closest('a')) {
                return;
            }

            const logId = this.getAttribute('data-id');
            // Tìm dòng mở rộng kế tiếp
            const nextRow = this.nextElementSibling;
            
            if (nextRow && nextRow.classList.contains('log-expansion-row')) {
                const isExpanded = this.classList.contains('expanded');
                
                // Thu gọn tất cả các dòng đang mở khác để tạo cảm giác gọn gàng (Accordion effect)
                // Nếu muốn cho phép mở nhiều dòng cùng lúc, hãy bình luận phần này
                logRows.forEach(otherRow => {
                    if (otherRow !== this && otherRow.classList.contains('expanded')) {
                        otherRow.classList.remove('expanded');
                        const otherNext = otherRow.nextElementSibling;
                        if (otherNext && otherNext.classList.contains('log-expansion-row')) {
                            otherNext.style.display = 'none';
                        }
                    }
                });

                if (isExpanded) {
                    // Thu gọn
                    this.classList.remove('expanded');
                    nextRow.style.display = 'none';
                } else {
                    // Mở rộng
                    this.classList.add('expanded');
                    nextRow.style.display = 'table-row';
                    
                    // Thêm hiệu ứng cuộn nhẹ đến dòng đang mở nếu nó bị che khuất
                    setTimeout(() => {
                        this.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 100);
                }
            }
        });
    });
}

/**
 * Xử lý sao chép chi tiết bản ghi dạng JSON vào Clipboard
 */
function initCopyJson() {
    const copyButtons = document.querySelectorAll('.btn-copy-json');
    
    copyButtons.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation(); // Ngăn sự kiện click lan ra dòng cha

            const jsonStr = this.getAttribute('data-json');
            if (!jsonStr) return;

            // Sử dụng Clipboard API hiện đại của trình duyệt
            navigator.clipboard.writeText(jsonStr).then(() => {
                // Thay đổi trạng thái nút tạm thời
                const originalText = this.textContent;
                this.textContent = 'Đã sao chép! ✓';
                this.classList.add('copied');
                
                // Hiển thị Toast thông báo thành công
                showAdminToast('Đã sao chép chi tiết log JSON vào bộ nhớ đệm!');
                
                // Khôi phục trạng thái ban đầu sau 2 giây
                setTimeout(() => {
                    this.textContent = originalText;
                    this.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                console.error('Không thể sao chép văn bản: ', err);
                // Phương án dự phòng cho trình duyệt cũ
                const tempTextArea = document.createElement('textarea');
                tempTextArea.value = jsonStr;
                document.body.appendChild(tempTextArea);
                tempTextArea.select();
                try {
                    document.execCommand('copy');
                    showAdminToast('Đã sao chép chi tiết log JSON (dự phòng)!');
                } catch (ex) {
                    showAdminToast('Không thể sao chép tự động. Hãy chọn tay.');
                }
                document.body.removeChild(tempTextArea);
            });
        });
    });
}

/**
 * Xử lý tìm kiếm và lọc nhật ký hệ thống nâng cao thời gian thực
 */
function initAuditLogFilter() {
    const searchInput = document.getElementById('logSearchInput');
    const actionFilter = document.getElementById('logActionFilter');
    const moduleFilter = document.getElementById('logModuleFilter');
    const resultFilter = document.getElementById('logResultFilter');
    const btnFilter = document.getElementById('btnFilterLogs');
    const tableBody = document.getElementById('logsTableBody');
    const paginationInfo = document.querySelector('.pagination-info');

    if (!tableBody) return;

    // Hàm thực hiện bộ lọc dữ liệu
    function performFilter() {
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const selectedAction = actionFilter ? actionFilter.value : '';
        const selectedModule = moduleFilter ? moduleFilter.value : '';
        const selectedResult = resultFilter ? resultFilter.value : '';

        const logRows = tableBody.querySelectorAll('tr.log-row');
        let visibleCount = 0;
        let totalCount = logRows.length;

        logRows.forEach(row => {
            const nextExpansionRow = row.nextElementSibling;
            
            // Lấy thông tin cột để so khớp
            const userName = row.querySelector('.user-full-name').textContent.toLowerCase();
            const userEmail = row.querySelector('.user-handle').textContent.toLowerCase();
            const actionText = row.querySelector('.log-action-badge').textContent.trim();
            const actionClass = row.querySelector('.log-action-badge').className;
            const targetObjectName = row.querySelector('.object-name').textContent.toLowerCase();
            const targetObjectId = row.querySelector('.object-id').textContent.toLowerCase();
            const changeDetail = row.querySelector('.col-detail').textContent.toLowerCase();
            const ipAddress = row.querySelector('.col-ip').textContent.toLowerCase();
            
            // Lấy chuỗi JSON chi tiết từ nút copy tương ứng
            let jsonText = '';
            if (nextExpansionRow && nextExpansionRow.classList.contains('log-expansion-row')) {
                const copyBtn = nextExpansionRow.querySelector('.btn-copy-json');
                if (copyBtn) {
                    jsonText = copyBtn.getAttribute('data-json') || '';
                }
            }

            // 1. So khớp từ khóa tìm kiếm (Tên, email, đối tượng, IP, chi tiết)
            const matchesQuery = !query || 
                userName.includes(query) || 
                userEmail.includes(query) || 
                targetObjectName.includes(query) || 
                targetObjectId.includes(query) || 
                changeDetail.includes(query) || 
                ipAddress.includes(query);

            // 2. So khớp Loại hành động (Cập nhật, Phê duyệt, Xóa)
            const matchesAction = !selectedAction || actionText === selectedAction;

            // 3. So khớp Mô-đun (CAMPAIGN, WITHDRAWAL, KOC_PROFILE, SYSTEM_SETTINGS)
            let matchesModule = true;
            if (selectedModule) {
                // Kiểm tra xem trường "module" trong JSON có khớp không
                try {
                    const parsed = JSON.parse(jsonText);
                    matchesModule = parsed.module === selectedModule;
                } catch (e) {
                    // Nếu lỗi parse, dùng cách so khớp chuỗi phụ trợ
                    matchesModule = jsonText.includes(`"module": "${selectedModule}"`) || 
                                    jsonText.includes(`"module": "${selectedModule.toLowerCase()}"`);
                }
            }

            // 4. So khớp Kết quả (Thành công / Thất bại)
            // Trong dữ liệu mẫu, hầu hết là thành công (success).
            let matchesResult = true;
            if (selectedResult) {
                if (selectedResult === 'success') {
                    matchesResult = !jsonText.toLowerCase().includes('"failed"') && 
                                    !jsonText.toLowerCase().includes('"status": "failed"') &&
                                    !jsonText.toLowerCase().includes('"result": "failed"');
                } else if (selectedResult === 'failed') {
                    matchesResult = jsonText.toLowerCase().includes('"failed"') || 
                                    jsonText.toLowerCase().includes('"status": "failed"') ||
                                    jsonText.toLowerCase().includes('"result": "failed"');
                }
            }

            // Kết luận hiển thị dòng
            if (matchesQuery && matchesAction && matchesModule && matchesResult) {
                row.style.display = '';
                visibleCount++;
                
                // Giữ nguyên trạng thái dòng mở rộng nếu dòng chính đang mở
                if (row.classList.contains('expanded') && nextExpansionRow && nextExpansionRow.classList.contains('log-expansion-row')) {
                    nextExpansionRow.style.display = 'table-row';
                } else if (nextExpansionRow && nextExpansionRow.classList.contains('log-expansion-row')) {
                    nextExpansionRow.style.display = 'none';
                }
            } else {
                row.style.display = 'none';
                if (nextExpansionRow && nextExpansionRow.classList.contains('log-expansion-row')) {
                    nextExpansionRow.style.display = 'none';
                }
            }
        });

        // Cập nhật thông tin phân trang động
        if (paginationInfo) {
            paginationInfo.textContent = `Hiển thị ${visibleCount} dòng trên tổng số ${totalCount} dòng`;
        }
    }

    // Gắn sự kiện lọc cho nút lọc và thay đổi bộ lọc
    if (btnFilter) {
        btnFilter.addEventListener('click', function () {
            // Thêm hiệu ứng loading nhẹ cho nút
            btnFilter.style.opacity = '0.7';
            btnFilter.querySelector('span').textContent = 'Đang lọc...';
            
            setTimeout(() => {
                performFilter();
                btnFilter.style.opacity = '1';
                btnFilter.querySelector('span').textContent = 'Lọc Dữ Liệu';
                showAdminToast('Bộ lọc kiểm toán hệ thống đã được áp dụng!');
            }, 300);
        });
    }

    // Hỗ trợ tìm kiếm thời gian thực khi gõ
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            performFilter();
        });
    }

    // Tự động lọc khi thay đổi các thẻ Select để mang lại trải nghiệm mượt mà nhất
    [actionFilter, moduleFilter, resultFilter].forEach(select => {
        if (select) {
            select.addEventListener('change', function () {
                performFilter();
            });
        }
    });
}

/**
 * Xử lý xuất Log kiểm toán sang file CSV thực tế bằng Javascript
 * Tạo hiệu ứng tải tệp tin và trích xuất dữ liệu thật từ bảng
 */
function initExportCSV() {
    const exportBtn = document.getElementById('btnExportCSV');
    if (!exportBtn) return;

    exportBtn.addEventListener('click', function () {
        const tableBody = document.getElementById('logsTableBody');
        if (!tableBody) return;

        const rows = tableBody.querySelectorAll('tr.log-row');
        if (rows.length === 0) {
            showAdminToast('Không có dữ liệu nhật ký hệ thống để xuất!');
            return;
        }

        // Định dạng dữ liệu CSV
        // Thêm BOM tiếng Việt cho UTF-8 Excel đọc chuẩn
        let csvContent = '\uFEFF'; 
        csvContent += 'Thời gian,Tài khoản Admin,Email Admin,Hành động,Mô-đun,Đối tượng tác động,Chi tiết Thay đổi,Địa chỉ IP\n';

        rows.forEach(row => {
            // Chỉ xuất những dòng đang hiển thị (nếu có bộ lọc)
            if (row.style.display === 'none') return;

            const time = escapeCSV(row.querySelector('.col-time').textContent.trim());
            const adminName = escapeCSV(row.querySelector('.user-full-name').textContent.trim());
            const adminEmail = escapeCSV(row.querySelector('.user-handle').textContent.trim());
            const action = escapeCSV(row.querySelector('.log-action-badge').textContent.trim());
            const targetObject = escapeCSV(row.querySelector('.object-name').textContent.trim());
            const targetObjectId = escapeCSV(row.querySelector('.object-id').textContent.trim());
            const detail = escapeCSV(row.querySelector('.col-detail').textContent.trim());
            const ip = escapeCSV(row.querySelector('.col-ip').textContent.trim());

            csvContent += `"${time}","${adminName}","${adminEmail}","${action}","${targetObjectId}","${targetObject}","${detail}","${ip}"\n`;
        });

        // Tạo đối tượng Blob để tải xuống trình duyệt
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        // Đặt tên tệp xuất
        const now = new Date();
        const dateStr = now.getFullYear() + '' + String(now.getMonth() + 1).padStart(2, '0') + '' + String(now.getDate()).padStart(2, '0');
        link.setAttribute('href', url);
        link.setAttribute('download', `koc_audit_logs_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showAdminToast('Đã xuất thành công nhật ký hoạt động sang tệp CSV!');
    });

    // Hàm phụ trợ xử lý ký tự đặc biệt trong CSV
    function escapeCSV(text) {
        if (!text) return '';
        return text.replace(/"/g, '""').replace(/\n/g, ' ');
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

    // Hủy bỏ hẹn giờ ẩn cũ nếu có click dồn dập
    if (toast.dataset.timerId) {
        clearTimeout(parseInt(toast.dataset.timerId));
    }

    toast.classList.add('show');

    // Tự động ẩn sau 3.5 giây
    const timerId = setTimeout(function () {
        toast.classList.remove('show');
    }, 3500);

    toast.dataset.timerId = timerId.toString();
}
