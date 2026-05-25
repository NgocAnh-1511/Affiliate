document.addEventListener('DOMContentLoaded', function() {
    // --------------------------------------------------------------------------
    // 1. Tính năng Ẩn/Hiện mật khẩu (Cho cả Mật khẩu và Xác nhận Mật khẩu)
    // --------------------------------------------------------------------------
    const eyeOpenSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    `;

    const eyeClosedSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
            <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
            <line x1="2" y1="2" x2="22" y2="22"/>
        </svg>
    `;

    function setupPasswordToggle(inputId, toggleId) {
        const inputField = document.getElementById(inputId);
        const toggleBtn = document.getElementById(toggleId);

        if (inputField && toggleBtn) {
            toggleBtn.addEventListener('click', function() {
                const type = inputField.getAttribute('type') === 'password' ? 'text' : 'password';
                inputField.setAttribute('type', type);
                
                if (type === 'password') {
                    toggleBtn.innerHTML = eyeClosedSVG;
                    toggleBtn.setAttribute('aria-label', 'Hiển thị mật khẩu');
                } else {
                    toggleBtn.innerHTML = eyeOpenSVG;
                    toggleBtn.setAttribute('aria-label', 'Ẩn mật khẩu');
                }
            });
        }
    }

    setupPasswordToggle('password', 'togglePassword');
    setupPasswordToggle('confirmPassword', 'toggleConfirmPassword');

    // --------------------------------------------------------------------------
    // 2. Xác thực Dữ liệu Form đăng ký phía Client
    // --------------------------------------------------------------------------
    const registerForm = document.getElementById('registerForm');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const agreeCheckbox = document.getElementById('agreeToTerms');
    const socialChannelLinkInput = document.getElementById('socialChannelLink');

    if (registerForm) {
        registerForm.addEventListener('submit', function(event) {
            let isValid = true;
            clearErrors();

            // 1. Kiểm tra Họ tên
            if (fullNameInput.value.trim() === '') {
                showError(fullNameInput, 'Vui lòng nhập họ và tên của bạn.');
                isValid = false;
            }

            // 2. Kiểm tra Email
            const emailValue = emailInput.value.trim();
            const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
            if (emailValue === '') {
                showError(emailInput, 'Vui lòng nhập địa chỉ Email.');
                isValid = false;
            } else if (!emailPattern.test(emailValue)) {
                showError(emailInput, 'Địa chỉ Email không đúng định dạng.');
                isValid = false;
            }

            // 3. Kiểm tra Số điện thoại
            const phoneValue = phoneInput.value.trim();
            const phonePattern = /^(0[3|5|7|8|9])+([0-9]{8})$/;
            if (phoneValue === '') {
                showError(phoneInput, 'Vui lòng nhập số điện thoại.');
                isValid = false;
            } else if (!phonePattern.test(phoneValue)) {
                showError(phoneInput, 'Số điện thoại Việt Nam không hợp lệ (phải gồm 10 số bắt đầu bằng 03, 05, 07, 08, 09).');
                isValid = false;
            }

            // 4. Kiểm tra Link mạng xã hội chính (TikTok/Shopee)
            const socialValue = socialChannelLinkInput.value.trim();
            if (socialValue === '') {
                showError(socialChannelLinkInput, 'Vui lòng nhập Link kênh mạng xã hội chính.');
                isValid = false;
            } else if (!socialValue.startsWith('http://') && !socialValue.startsWith('https://')) {
                showError(socialChannelLinkInput, 'Đường dẫn kênh mạng xã hội phải bắt đầu bằng http:// hoặc https://');
                isValid = false;
            }

            // 4. Kiểm tra Mật khẩu
            if (passwordInput.value === '') {
                showError(passwordInput, 'Vui lòng nhập mật khẩu.');
                isValid = false;
            } else if (passwordInput.value.length < 6) {
                showError(passwordInput, 'Mật khẩu phải dài tối thiểu 6 ký tự.');
                isValid = false;
            }

            // 5. Kiểm tra Xác nhận mật khẩu
            if (confirmPasswordInput.value === '') {
                showError(confirmPasswordInput, 'Vui lòng xác nhận mật khẩu.');
                isValid = false;
            } else if (passwordInput.value !== confirmPasswordInput.value) {
                showError(confirmPasswordInput, 'Mật khẩu xác nhận không trùng khớp.');
                isValid = false;
            }

            // 6. Kiểm tra Đồng ý điều khoản
            if (!agreeCheckbox.checked) {
                // Hiển thị lỗi checkbox bằng cách tô đỏ viền hoặc nhấp nháy, ở đây ta hiển thị thông báo dưới dòng
                showCheckboxError('Bạn phải đồng ý với Điều khoản & Chính sách.');
                isValid = false;
            }

            if (!isValid) {
                event.preventDefault();
            }
        });

        // Hàm hiển thị lỗi dưới Input
        function showError(inputElement, errorMessage) {
            inputElement.classList.add('is-invalid');
            const errorSpan = document.createElement('span');
            errorSpan.className = 'validation-error';
            errorSpan.innerText = errorMessage;
            const inputGroup = inputElement.closest('.input-group');
            if (inputGroup) {
                inputGroup.appendChild(errorSpan);
            }
        }

        // Hàm hiển thị lỗi checkbox
        function showCheckboxError(errorMessage) {
            const errorSpan = document.createElement('span');
            errorSpan.className = 'validation-error';
            errorSpan.style.width = '100%';
            errorSpan.innerText = errorMessage;
            const optionsGroup = agreeCheckbox.closest('.options-group');
            if (optionsGroup) {
                optionsGroup.appendChild(errorSpan);
            }
        }

        // Xóa tất cả các thông báo lỗi hiện hành
        function clearErrors() {
            const invalidInputs = registerForm.querySelectorAll('.is-invalid');
            invalidInputs.forEach(input => input.classList.remove('is-invalid'));

            const errorMessages = registerForm.querySelectorAll('.validation-error');
            errorMessages.forEach(msg => msg.remove());
        }

        // Tự động xóa lỗi khi người dùng bắt đầu chỉnh sửa lại dữ liệu
        [fullNameInput, emailInput, phoneInput, socialChannelLinkInput, passwordInput, confirmPasswordInput, agreeCheckbox].forEach(input => {
            input.addEventListener('input', function() {
                if (this.classList.contains('is-invalid')) {
                    this.classList.remove('is-invalid');
                    const error = this.closest('.input-group')?.querySelector('.validation-error');
                    if (error) error.remove();
                }
            });
        });

        agreeCheckbox.addEventListener('change', function() {
            const error = this.closest('.options-group')?.querySelector('.validation-error');
            if (error && this.checked) error.remove();
        });
    }
});
