document.addEventListener('DOMContentLoaded', function() {
    // --------------------------------------------------------------------------
    // 1. Tính năng Ẩn/Hiện mật khẩu (Show/Hide Password)
    // --------------------------------------------------------------------------
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (togglePasswordBtn && passwordInput) {
        // Biểu tượng con mắt đang mở (Mắt mở - Hiển thị mật khẩu)
        const eyeOpenSVG = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/>
                <circle cx="12" cy="12" r="3"/>
            </svg>
        `;

        // Biểu tượng con mắt có gạch chéo (Mắt nhắm - Ẩn mật khẩu)
        const eyeClosedSVG = `
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                <line x1="2" y1="2" x2="22" y2="22"/>
            </svg>
        `;

        togglePasswordBtn.addEventListener('click', function() {
            // Thay đổi kiểu của input mật khẩu
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Thay đổi biểu tượng SVG tương ứng
            if (type === 'password') {
                togglePasswordBtn.innerHTML = eyeClosedSVG;
                togglePasswordBtn.setAttribute('aria-label', 'Hiển thị mật khẩu');
            } else {
                togglePasswordBtn.innerHTML = eyeOpenSVG;
                togglePasswordBtn.setAttribute('aria-label', 'Ẩn mật khẩu');
            }
        });
    }

    // --------------------------------------------------------------------------
    // 2. Tính năng Xác thực dữ liệu Form phía Client (Client-side Validation)
    // --------------------------------------------------------------------------
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');

    if (loginForm && usernameInput && passwordInput) {
        loginForm.addEventListener('submit', function(event) {
            let isValid = true;

            // Xóa toàn bộ các lỗi cũ trước khi kiểm tra lại
            clearErrors();

            // Kiểm tra trường Tài khoản (Email hoặc Số điện thoại)
            const usernameValue = usernameInput.value.trim();
            if (usernameValue === '') {
                showError(usernameInput, 'Vui lòng nhập Email hoặc Số điện thoại đăng nhập.');
                isValid = false;
            } else if (usernameValue.length < 5) {
                showError(usernameInput, 'Tài khoản đăng nhập tối thiểu phải từ 5 ký tự.');
                isValid = false;
            }

            // Kiểm tra trường Mật khẩu
            const passwordValue = passwordInput.value;
            if (passwordValue === '') {
                showError(passwordInput, 'Vui lòng nhập mật khẩu của bạn.');
                isValid = false;
            } else if (passwordValue.length < 6) {
                showError(passwordInput, 'Mật khẩu tối thiểu phải từ 6 ký tự.');
                isValid = false;
            }

            // Nếu thông tin không hợp lệ, ngăn không cho gửi request lên server
            if (!isValid) {
                event.preventDefault();
            }
        });

        // Hàm hiển thị thông báo lỗi dưới input
        function showError(inputElement, errorMessage) {
            inputElement.classList.add('is-invalid');
            
            // Tạo thẻ span chứa lỗi
            const errorSpan = document.createElement('span');
            errorSpan.className = 'validation-error';
            errorSpan.innerText = errorMessage;
            
            // Thêm thông báo lỗi ngay dưới thẻ input-group chứa input đó
            const inputGroup = inputElement.closest('.input-group');
            if (inputGroup) {
                inputGroup.appendChild(errorSpan);
            }
        }

        // Hàm xóa sạch các lỗi hiện hành
        function clearErrors() {
            const invalidInputs = loginForm.querySelectorAll('.is-invalid');
            invalidInputs.forEach(function(input) {
                input.classList.remove('is-invalid');
            });

            const errorMessages = loginForm.querySelectorAll('.validation-error');
            errorMessages.forEach(function(error) {
                error.remove();
            });
        }

        // Tự động xóa lỗi của từng trường khi người dùng bắt đầu nhập lại dữ liệu
        [usernameInput, passwordInput].forEach(function(input) {
            input.addEventListener('input', function() {
                if (this.classList.contains('is-invalid')) {
                    this.classList.remove('is-invalid');
                    const errorSpan = this.closest('.input-group').querySelector('.validation-error');
                    if (errorSpan) {
                        errorSpan.remove();
                    }
                }
            });
        });
    }
});
