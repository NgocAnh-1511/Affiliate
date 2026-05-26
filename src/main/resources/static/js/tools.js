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
    // 3. Tab lọc chiến dịch: Tất cả / Chiến dịch của tôi / Hoa hồng cao / Mới nhất
    // --------------------------------------------------------------------------
    const tabAll = document.getElementById('tabAll');
    const tabMyCampaigns = document.getElementById('tabMyCampaigns');
    const tabHighComm = document.getElementById('tabHighComm');
    const tabNewest = document.getElementById('tabNewest');
    let activeTab = 'all';
 
    const tabs = [tabAll, tabMyCampaigns, tabHighComm, tabNewest];
 
    tabs.forEach(tab => {
        if (tab) {
            tab.addEventListener('click', function() {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                if (tab === tabAll) activeTab = 'all';
                if (tab === tabMyCampaigns) activeTab = 'my-campaigns';
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
            const isJoined = card.getAttribute('data-joined') === 'true';
            
            // Tách tỉ lệ phần trăm để lọc hoa hồng cao (Ví dụ: "Hoa hồng 15%" -> 15)
            const commPercentage = parseInt(commissionText.replace(/[^0-9]/g, '')) || 0;
            
            let matchesSearch = name.includes(query);
            let matchesTab = true;
 
            if (activeTab === 'my-campaigns') {
                matchesTab = isJoined;
            } else if (activeTab === 'high-comm') {
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
    // 4. Lựa chọn Chiến dịch & Đăng ký tham gia (Selection & Join Handler)
    // --------------------------------------------------------------------------
    const originalLinkInput = document.getElementById('originalLinkInput');
    const joinButtons = document.querySelectorAll('.btn-join-camp');

    // Nút copy link gốc của Admin
    const btnCopyAdminLink = document.getElementById('btnCopyAdminLink');
    if (btnCopyAdminLink) {
        btnCopyAdminLink.addEventListener('click', function(e) {
            e.stopPropagation();
            const anchor = document.getElementById('campaignAdminLinkAnchor');
            if (anchor && anchor.textContent) {
                navigator.clipboard.writeText(anchor.textContent).then(() => {
                    showToast('Đã sao chép link gốc của Admin!');
                });
            }
        });
    }

    // Hàm gọi API lấy danh sách link tiếp thị của tôi cho chiến dịch này
    function loadCampaignLinks(campaignId) {
        if (!campaignId) return;
        
        const tableBody = document.getElementById('kocLinksTableBody');
        const tableWrapper = document.getElementById('kocLinksTableWrapper');
        const fallback = document.getElementById('noLinksFallback');
        
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        fetch(`/api/affiliate/my-links?campaignId=${encodeURIComponent(campaignId)}`)
            .then(response => response.json())
            .then(links => {
                if (links && links.length > 0) {
                    links.forEach(link => {
                        const row = document.createElement('tr');
                        
                        const shortCode = link.short_code;
                        const originalUrl = link.original_url;
                        const shortUrl = `localhost:8080/go/${shortCode}`;
                        
                        row.innerHTML = `
                            <td>
                                <a href="http://${shortUrl}" target="_blank" class="koc-link-short-text" title="${shortUrl}">${shortUrl}</a>
                            </td>
                            <td>
                                <span class="koc-link-original-text" title="${originalUrl}">${originalUrl}</span>
                            </td>
                            <td style="text-align: center;">
                                <button type="button" class="btn-table-copy" data-link="${shortUrl}" title="Sao chép link rút gọn">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                </button>
                            </td>
                        `;
                        
                        // Đăng ký sự kiện sao chép cho nút trong dòng
                        const copyBtn = row.querySelector('.btn-table-copy');
                        copyBtn.addEventListener('click', function(e) {
                            e.stopPropagation();
                            const linkToCopy = this.getAttribute('data-link');
                            navigator.clipboard.writeText(linkToCopy).then(() => {
                                showToast('Đã sao chép link rút gọn!');
                            });
                        });
                        
                        tableBody.appendChild(row);
                    });
                    
                    if (tableWrapper) tableWrapper.style.display = 'block';
                    if (fallback) fallback.style.display = 'none';
                } else {
                    if (tableWrapper) tableWrapper.style.display = 'none';
                    if (fallback) fallback.style.display = 'block';
                }
            })
            .catch(err => {
                console.error('Error fetching campaign links:', err);
                if (tableWrapper) tableWrapper.style.display = 'none';
                if (fallback) fallback.style.display = 'block';
            });
    }

    // Đăng ký sự kiện khi click vào từng Campaign Card
    campaignCards.forEach(card => {
        card.addEventListener('click', function(e) {
            const joinBtn = card.querySelector('.btn-join-camp');
            const isAlreadyJoined = card.getAttribute('data-joined') === 'true' || (joinBtn && joinBtn.classList.contains('joined'));
            
            // Nếu click trúng nút "Tham gia" mà chưa đăng ký, để sự kiện của nút xử lý riêng
            if (e.target.classList.contains('btn-join-camp') && !isAlreadyJoined) {
                return;
            }
            
            const campId = card.getAttribute('data-campaign-id');
            const name = card.getAttribute('data-name');
            const source = card.getAttribute('data-source');
            const productLink = card.getAttribute('data-product-link') || '';
            
            // Lưu campId vào ô ẩn
            const activeCampaignIdEl = document.getElementById('activeCampaignId');
            if (activeCampaignIdEl) {
                activeCampaignIdEl.value = campId || '';
            }
            
            // Đánh dấu active cho card được chọn
            campaignCards.forEach(c => {
                c.classList.remove('active-card');
                c.style.border = 'none';
                c.style.boxShadow = 'none';
            });
            card.classList.add('active-card');
            card.style.border = '2px solid var(--primary-color)';
            card.style.boxShadow = '0 10px 25px rgba(63, 47, 212, 0.1)';
            
            // Điền link gốc làm mẫu
            let targetUrl = productLink;
            if (!targetUrl) {
                if (name.includes('LSOUL')) {
                    targetUrl = 'https://shopee.vn/ao-thun-nu-cotton-lsoul';
                } else if (name.includes('Shopee 5.5')) {
                    targetUrl = 'https://shopee.vn/sieu-sale-shopee-5.5';
                } else if (name.includes('Điện Tử')) {
                    targetUrl = 'https://lazada.vn/dien-tu-cong-nghe-sale-50';
                } else if (name.includes('Làm Đẹp')) {
                    targetUrl = 'https://shopee.vn/combo-lam-dep-cham-soc-da';
                } else if (name.includes('Thời Trang Hè')) {
                    targetUrl = 'https://shopee.vn/thoi-trang-he-2024';
                } else if (name.includes('Nội Thất')) {
                    targetUrl = 'https://tiki.vn/noi-that-trang-tri-phong-cach-song';
                } else {
                    targetUrl = `https://${source}.vn/san-pham-doc-quyen-`;
                }
            }
            
            if (originalLinkInput) {
                originalLinkInput.value = targetUrl;
            }
            
            // Hiển thị link gốc của Admin
            const adminLinkBox = document.getElementById('campaignAdminLinkBox');
            const adminLinkAnchor = document.getElementById('campaignAdminLinkAnchor');
            if (adminLinkBox && adminLinkAnchor && targetUrl) {
                adminLinkAnchor.href = targetUrl;
                adminLinkAnchor.textContent = targetUrl;
                adminLinkBox.style.display = 'block';
            } else if (adminLinkBox) {
                adminLinkBox.style.display = 'none';
            }
            
            // Cuộn mượt đến bộ công cụ tạo link
            const toolsCard = document.querySelector('.tools-card');
            if (toolsCard) {
                toolsCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                toolsCard.style.outline = '3px solid #7c3aed';
                setTimeout(() => {
                    toolsCard.style.outline = 'none';
                }, 1200);
            }
            
            // Hiển thị danh sách link rút gọn đã tạo của tôi
            const linksListCard = document.getElementById('linksListCard');
            const linksListTitle = document.getElementById('linksListTitle');
            if (linksListCard) {
                if (isAlreadyJoined) {
                    if (linksListTitle) {
                        linksListTitle.textContent = `Link Tiếp Thị Của Tôi - ${name}`;
                    }
                    linksListCard.style.display = 'block';
                    loadCampaignLinks(campId);
                } else {
                    linksListCard.style.display = 'none';
                }
            }
            
            showToast(`Đã chọn chiến dịch: [${name}]`);
        });
    });

    // Sự kiện click trực tiếp nút "Tham gia"
    joinButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // Ngăn sự kiện nổi bọt lên card
            
            const card = btn.closest('.campaign-card');
            const name = card.getAttribute('data-name');
            const campId = card.getAttribute('data-campaign-id');
            const isAlreadyJoined = card.getAttribute('data-joined') === 'true' || btn.classList.contains('joined');
            
            if (isAlreadyJoined) {
                // Nếu đã tham gia, chỉ cần giả lập click card để chọn chiến dịch
                card.click();
            } else {
                // Nếu chưa tham gia, thực hiện gọi API để đăng ký CSDL thực tế
                fetch('/api/campaigns/join', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        campaignId: campId
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        // Cập nhật trạng thái card và nút sang Đã tham gia
                        card.setAttribute('data-joined', 'true');
                        btn.setAttribute('data-joined', 'true');
                        btn.classList.add('joined');
                        btn.innerText = 'Đã tham gia';
                        
                        showToast(`Đăng ký tham gia chiến dịch [${name}] thành công!`);
                        
                        // Kích hoạt click card để hiển thị danh sách link
                        card.click();
                    } else {
                        console.warn('API error when joining: ' + data.message);
                        card.click();
                    }
                })
                .catch(err => {
                    console.error('Connection error when joining:', err);
                    card.click();
                });
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
                showToast('Vui lòng dán đường dẫn sản phẩm gốc trước!');
                originalLinkInput.focus();
                return;
            }

            // Lấy username của KOC để cá nhân hóa link rút gọn duy nhất
            const kocUsernameEl = document.getElementById('kocUsername');
            const kocUsername = kocUsernameEl ? kocUsernameEl.value.trim() : 'koc';

            // Tạo Short Link mượt dựa trên URL
            let slug = "koc-discount";
            try {
                const parsedUrl = new URL(urlValue);
                const pathParts = parsedUrl.pathname.split('/');
                const lastPart = pathParts[pathParts.length - 1];
                if (lastPart && lastPart.length > 3) {
                    slug = lastPart.replace(/\.[^/.]+$/, "").substring(0, 20); // Bỏ đuôi file, lấy tối đa 20 ký tự
                }
            } catch(e) {
                slug = "sp-uu-dai";
            }
            
            // Tạo Tracking Link dài
            const separator = urlValue.includes('?') ? '&' : '?';
            const longTrackingUrl = `${urlValue}${separator}utm_source=koc&utm_medium=affiliate&utm_campaign=${kocUsername}`;
            trackingLinkOutput.value = longTrackingUrl;

            // Xác định campaign ID
            let campaignId = '';
            const activeCampaignIdEl = document.getElementById('activeCampaignId');
            if (activeCampaignIdEl && activeCampaignIdEl.value) {
                campaignId = activeCampaignIdEl.value;
            } else {
                const firstCard = document.querySelector('.campaign-card');
                if (firstCard) {
                    campaignId = firstCard.getAttribute('data-campaign-id') || '';
                }
            }

            const shortCodeValue = `${slug}-${kocUsername}`;

            // Thực hiện gọi AJAX lưu link rút gọn trên server CSDL thực tế
            fetch('/api/affiliate/shorten', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    originalUrl: urlValue,
                    shortCode: shortCodeValue,
                    campaignId: campaignId
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    shortLinkOutput.innerText = data.shortUrl || `localhost:8080/go/${shortCodeValue}`;
                    showToast('Tạo link tiếp thị liên kết thành công!');
                } else {
                    console.warn('API error, falling back locally: ' + data.message);
                    shortLinkOutput.innerText = `localhost:8080/go/${shortCodeValue}`;
                    showToast('Tạo link tiếp thị thành công!');
                }
                
                // Cập nhật lại danh sách link đã tạo của chiến dịch này lập tức!
                loadCampaignLinks(campaignId);
            })
            .catch(err => {
                console.error('Connection error, using local fallback:', err);
                shortLinkOutput.innerText = `localhost:8080/go/${shortCodeValue}`;
                showToast('Tạo link tiếp thị thành công!');
                
                // Cập nhật lại danh sách link đã tạo của chiến dịch này lập tức!
                loadCampaignLinks(campaignId);
            });

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
                    showToast('Đã sao chép Link gốc gắn mã!');
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

                    showToast('Đã sao chép Link rút gọn!');
                }).catch(err => {
                    console.error('Không thể sao chép: ', err);
                });
            }
        });
    }

    // --------------------------------------------------------------------------
    // 7. Tạo mã QR động qua Modal Popup (QR Code API Integration)
    // --------------------------------------------------------------------------
    const btnQr = document.getElementById('btnShowQr');
    const qrModal = document.getElementById('qrModal');
    const qrModalClose = document.getElementById('btnLocationClose');
    const qrModalOverlay = document.getElementById('qrModalOverlay');
    const qrCodeImg = document.getElementById('qrCodeImg');
    const qrModalLink = document.getElementById('qrModalLink');
    const btnDownloadQr = document.getElementById('btnDownloadQr');

    if (btnQr && qrModal) {
        btnQr.addEventListener('click', function() {
            const shortUrl = shortLinkOutput.innerText;
            const fullUrl = trackingLinkOutput.value || `https://${shortUrl}`;
            
            // Gọi API tạo QR Code của qrserver
            const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(fullUrl)}`;
            
            if (qrCodeImg) qrCodeImg.src = qrApiUrl;
            if (qrModalLink) qrModalLink.textContent = shortUrl;
            if (btnDownloadQr) {
                btnDownloadQr.href = qrApiUrl;
                btnDownloadQr.target = '_blank';
            }
            
            // Hiển thị modal
            qrModal.style.display = 'flex';
            setTimeout(() => {
                qrModal.classList.add('show');
            }, 10);
            
            showToast('Khởi tạo QR tiếp thị thành công!');
        });
        
        // Đóng modal
        function hideQrModal() {
            qrModal.classList.remove('show');
            setTimeout(() => {
                qrModal.style.display = 'none';
            }, 350);
        }
        
        if (qrModalClose) qrModalClose.addEventListener('click', hideQrModal);
        if (qrModalOverlay) qrModalOverlay.addEventListener('click', hideQrModal);
    }

    // Helper: Tạo và hiển thị Toast thông báo cao cấp
    function showToast(message) {
        let toast = document.getElementById('toolsToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toolsToast';
            toast.className = 'toast-notification';
            toast.innerHTML = `
                <span class="toast-icon">✓</span>
                <span class="toast-message"></span>
            `;
            document.body.appendChild(toast);
        }
        
        const messageEl = toast.querySelector('.toast-message');
        if (messageEl) {
            messageEl.textContent = message;
        }
        
        toast.classList.add('show');
        
        if (toast.dataset.timerId) {
            clearTimeout(parseInt(toast.dataset.timerId));
        }
        
        const timerId = setTimeout(() => {
            toast.classList.remove('show');
        }, 2200);
        
        toast.dataset.timerId = timerId.toString();
    }
});
