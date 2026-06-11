/**
 * Client-Side Routing Logic
 * =========================
 */

const Router = {
    /**
     * Get current path
     */
    getCurrentPath() {
        const path = window.location.pathname;
        return path.replace(/\/$/, '') || '/';
    },

    /**
     * Navigate to path
     */
    navigate(path) {
        window.location.href = path;
    },

    /**
     * Check if current path is admin
     */
    isAdminPath() {
        return this.getCurrentPath().includes('/admin');
    },

    /**
     * Check if current path is klien
     */
    isKlienPath() {
        return this.getCurrentPath().includes('/klien');
    },

    /**
     * Protect admin routes
     */
    protectAdminRoute() {
        if (this.isAdminPath() && !Auth.isAuthenticated()) {
            // BUG-A FIX: redirect ke login.html (relatif, dari /admin/)
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    /**
     * Redirect based on authentication status
     */
    redirectAfterLogin() {
        if (Auth.isAuthenticated()) {
            // BUG-A FIX: dari /admin/login.html → dashboard.html (relatif)
            window.location.href = 'dashboard.html';
        }
    },

    /**
     * Redirect klien to cek-status
     */
    redirectKlienToDashboard() {
        const currentPath = this.getCurrentPath();
        if (currentPath.includes('/klien') && !currentPath.includes('cek-status')) {
            window.location.href = '/klien/cek-status.html';
        }
    }
};

// Make Router available globally
window.Router = Router;
