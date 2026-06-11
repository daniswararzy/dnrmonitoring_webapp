/**
 * Login Page Script
 * =================
 */

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');

    // Toggle Password Visibility
    togglePasswordBtn.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        const icon = this.querySelector('i');
        icon.classList.toggle('bi-eye');
        icon.classList.toggle('bi-eye-slash');
    });

    // Load saved username if "Remember Me" was checked
    if (localStorage.getItem('rememberMe') === 'true') {
        usernameInput.value = localStorage.getItem('savedUsername') || '';
        rememberMeCheckbox.checked = true;
    }

    // Handle Form Submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // Validation
        if (!username || !password) {
            showError('Username dan password wajib diisi');
            return;
        }

        if (username.length < 3) {
            showError('Username minimal 3 karakter');
            return;
        }

        if (password.length < 6) {
            showError('Password minimal 6 karakter');
            return;
        }

        // Disable button during submission
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';

        try {
            // Call API
            const response = await API.client.post('/auth/login', {
                username: username,
                password: password
            });

            // Save token and user data
            localStorage.setItem('authToken', response.data.token);
            localStorage.setItem('currentUser', JSON.stringify(response.data.user));

            // Save username if "Remember Me" is checked
            if (rememberMeCheckbox.checked) {
                localStorage.setItem('rememberMe', 'true');
                localStorage.setItem('savedUsername', username);
            } else {
                localStorage.removeItem('rememberMe');
                localStorage.removeItem('savedUsername');
            }

            // Show success message
            Utils.showAlert('Sukses', 'Login berhasil! Redirecting...', 'success');

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);

        } catch (error) {
            // Handle error
            if (error.response?.status === 401) {
                showError('Username atau password salah');
            } else if (error.response?.data?.message) {
                showError(error.response.data.message);
            } else {
                showError('Terjadi kesalahan. Silakan coba lagi.');
            }

            // Re-enable button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });

    // Show Error Message
    function showError(message) {
        errorMessage.textContent = message;
        errorAlert.classList.remove('d-none');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            errorAlert.classList.add('d-none');
        }, 5000);
    }

    // Clear error when user starts typing
    usernameInput.addEventListener('input', () => {
        if (!errorAlert.classList.contains('d-none')) {
            errorAlert.classList.add('d-none');
        }
    });

    passwordInput.addEventListener('input', () => {
        if (!errorAlert.classList.contains('d-none')) {
            errorAlert.classList.add('d-none');
        }
    });
});
