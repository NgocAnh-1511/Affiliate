document.addEventListener('DOMContentLoaded', function() {
    
    // --------------------------------------------------------------------------
    // 1. Chuông thông báo & Dropdown góc phải (Header interactions)
    // --------------------------------------------------------------------------
    const bellBtn = document.getElementById('bellNotificationBtn');
    if (bellBtn) {
        bellBtn.addEventListener('click', function() {
            alert('Bạn có 3 thông báo mới từ hệ thống KOC/KOL Affiliate Network!');
            const badge = bellBtn.querySelector('.notification-badge');
            if (badge) badge.remove();
        });
    }

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
    // 2. Tìm kiếm chiến dịch thời gian thực (Live Campaign Search)
    // --------------------------------------------------------------------------
    const searchInput = document.getElementById('searchCampaign');
    const campaignCards = document.querySelectorAll('.campaign-card');

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = searchInput.value.toLowerCase().trim();
            filterCampaigns();
        });
    }

    // --------------------------------------------------------------------------
    // 3. Tab lọc chiến dịch: Tất cả / Hoa hồng cao / Mới nhất
    // --------------------------------------------------------------------------
    const tabAll = document.getElementById('tabAll');
    const tabHighComm = document.getElementById('tabHighComm');
    const tabNewest = document.getElementById('tabNewest');
    let activeTab = 'all';

    const tabs = [tabAll, tabHighComm, tabNewest];

    tabs.forEach(tab => {
        if (tab) {
            tab.addEventListener('click', function() {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                if (tab === tabAll) activeTab = 'all';
                if (tab === tabHighComm) activeTab = 'high-comm';
                if (tab === tabNewest) activeTab = 'newest';
                
                filterCampaigns();
            });
        }
    });

    // Hàm tổng hợp lọc chiến dịch theo cả Ô tìm kiếm và Tab
    function filterCampaigns() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        campaignCards.forEach(card => {
            const name = card.getAttribute('data-name').toLowerCase();
            const commissionText = card.getAttribute('data-commission');
            const isFeatured = card.getAttribute('data-featured') === 'true';
            
            // Tách tỉ lệ phần trăm để lọc hoa hồng cao (Ví dụ: "Hoa hồng 15%" -> 15)
            const commPercentage = parseInt(commissionText.replace(/[^0-9]/g, '')) || 0;
            
            let matchesSearch = name.includes(query);
            let matchesTab = true;

            if (activeTab === 'high-comm') {
                matchesTab = commPercentage >= 12; // Chiến dịch hoa hồng >= 12%
            } else if (activeTab === 'newest') {
                matchesTab = !isFeatured || commPercentage % 2 === 1; // Mô phỏng chiến dịch mới ngẫu nhiên
            }

            if (matchesSearch && matchesTab) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Sắp xếp chiến dịch
    const sortSelect = document.getElementById('sortCampaign');
    const campaignGrid = document.getElementById('campaignGrid');
    if (sortSelect && campaignGrid) {
        sortSelect.addEventListener('change', function() {
            const sortVal = sortSelect.value;
            const cardsArray = Array.from(campaignCards);

            if (sortVal === 'high-comm') {
                cardsArray.sort((a, b) => {
                    const commA = parseInt(a.getAttribute('data-commission').replace(/[^0-9]/g, '')) || 0;
                    const commB = parseInt(b.getAttribute('data-commission').replace(/[^0-9]/g, '')) || 0;
                    return commB - commA; // Sắp xếp hoa hồng giảm dần
                });
            } else {
                // Đưa về thứ tự mặc định của HTML
                cardsArray.sort((a, b) => {
                    return a.getAttribute('data-name').localeCompare(b.getAttribute('data-name'));
                });
            }

            // Gắn lại vào grid
            cardsArray.forEach(card => campaignGrid.appendChild(card));
        });
    }

    // --------------------------------------------------------------------------
    // 4. Click "Tham gia" -> Tự động điền link gốc cực kỳ thông minh
    // --------------------------------------------------------------------------
    const originalLinkInput = document.getElementById('originalLinkInput');
    const joinButtons = document.querySelectorAll('.btn-join-camp');

    joinButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const card = btn.closest('.campaign-card');
            const name = card.getAttribute('data-name');
            const source = card.getAttribute('data-source');
            
            // Mock đường dẫn gốc phù hợp cho từng chiến dịch
            let mockUrl = `https://${source}.vn/san-pham-doc-quyen-`;
            if (name.includes('LSOUL')) {
                mockUrl = 'https://shopee.vn/ao-thun-nu-cotton-lsoul';
            } else if (name.includes('Shopee 5.5')) {
                mockUrl = 'https://shopee.vn/sieu-sale-shopee-5.5';
            } else if (name.includes('Điện Tử')) {
                mockUrl = 'https://lazada.vn/dien-tu-cong-nghe-sale-50';
            } else if (name.includes('Làm Đẹp')) {
                mockUrl = 'https://shopee.vn/combo-lam-dep-cham-soc-da';
            } else if (name.includes('Thời Trang Hè')) {
                mockUrl = 'https://shopee.vn/thoi-trang-he-2024';
            } else if (name.includes('Nội Thất')) {
                mockUrl = 'https://tiki.vn/noi-that-trang-tri-phong-cach-song';
            }

            if (originalLinkInput) {
                originalLinkInput.value = mockUrl;
                
                // Hiệu ứng cuộn mượt đến bộ công cụ tạo link
                const toolsCard = document.querySelector('.tools-card');
                if (toolsCard) {
                    toolsCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Tạo viền sáng nhẹ để người dùng chú ý
                    toolsCard.style.outline = '3px solid #7c3aed';
                    setTimeout(() => {
                        toolsCard.style.outline = 'none';
                    }, 1500);
                }
            }
        });
    });

    // --------------------------------------------------------------------------
    // 5. Bộ tạo link rút gọn Affiliate (Short Link Generator)
    // --------------------------------------------------------------------------
    const btnGenerate = document.getElementById('btnGenerateLink');
    const toolsStep3Section = document.getElementById('toolsStep3Section');
    const trackingLinkOutput = document.getElementById('trackingLinkOutput');
    const shortLinkOutput = document.getElementById('shortLinkOutput');

    if (btnGenerate && originalLinkInput && toolsStep3Section) {
        btnGenerate.addEventListener('click', function() {
            const urlValue = originalLinkInput.value.trim();
            
            if (!urlValue) {
                alert('Vui lòng dán đường dẫn sản phẩm gốc Shopee/TikTok/Lazada/Tiki trước khi tạo link!');
                originalLinkInput.focus();
                return;
            }

            // Tạo Tracking Link dài
            const kocId = "KOC123456";
            const separator = urlValue.includes('?') ? '&' : '?';
            const longTrackingUrl = `${urlValue}${separator}utm_source=koc&utm_medium=affiliate&utm_campaign=${kocId}`;
            trackingLinkOutput.value = longTrackingUrl;

            // Tạo Short Link mượt dựa trên URL
            let slug = "koc-discount";
            try {
                // Tách lấy slug của sản phẩm từ URL shopee/lazada nếu có
                const parsedUrl = new URL(urlValue);
                const pathParts = parsedUrl.pathname.split('/');
                const lastPart = pathParts[pathParts.length - 1];
                if (lastPart && lastPart.length > 3) {
                    slug = lastPart.replace(/\.[^/.]+$/, "").substring(0, 20); // Bỏ đuôi file, lấy tối đa 20 ký tự
                }
            } catch(e) {
                // URL không hợp lệ, fallback lấy chuỗi ngẫu nhiên
                slug = "sp-uu-dai";
            }
            
            shortLinkOutput.innerText = `go.aff.vn/${slug}-koc`;

            // Kích hoạt hiển thị Bước 3 mượt mà
            toolsStep3Section.classList.add('active');
            
            // Cuộn nhẹ xuống chân card
            setTimeout(() => {
                toolsStep3Section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 300);
        });
    }

    // --------------------------------------------------------------------------
    // 6. Tính năng sao chép và hiển thị Tooltip (Clipboard API)
    // --------------------------------------------------------------------------
    const btnCopyTracking = document.getElementById('btnCopyTracking');
    const btnCopyShort = document.getElementById('btnCopyShort');

    if (btnCopyTracking) {
        btnCopyTracking.addEventListener('click', function() {
            if (trackingLinkOutput) {
                navigator.clipboard.writeText(trackingLinkOutput.value).then(function() {
                    alert('Đã sao chép Link gốc gắn mã (Tracking Link) vào clipboard thành công!');
                }).catch(err => {
                    console.error('Không thể sao chép: ', err);
                });
            }
        });
    }

    if (btnCopyShort) {
        btnCopyShort.addEventListener('click', function() {
            if (shortLinkOutput) {
                const textToCopy = shortLinkOutput.innerText;
                navigator.clipboard.writeText(textToCopy).then(function() {
                    // Hiển thị trạng thái "Đã chép!" tạm thời trong 1.5 giây
                    const originalText = btnCopyShort.innerHTML;
                    btnCopyShort.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Đã chép!</span>
                    `;
                    btnCopyShort.style.backgroundColor = '#059669'; // Chuyển màu xanh lá đậm hơn

                    setTimeout(() => {
                        btnCopyShort.innerHTML = originalText;
                        btnCopyShort.style.backgroundColor = '#10b981'; // Phục hồi trạng thái gốc
                    }, 1500);
                }).catch(err => {
                    console.error('Không thể sao chép: ', err);
                });
            }
        });
    }

    // --------------------------------------------------------------------------
    // 7. Tạo mã QR động (QR Code button click)
    // --------------------------------------------------------------------------
    const btnQr = document.getElementById('btnShowQr');
    if (btnQr) {
        btnQr.addEventListener('click', function() {
            const shortUrl = shortLinkOutput.innerText;
            alert(`Hệ thống đang khởi tạo mã QR cho đường dẫn rút gọn: ${shortUrl}\nMã QR chất lượng cao đã được tải tự động xuống thư mục Máy tính của bạn!`);
        });
    }
});
