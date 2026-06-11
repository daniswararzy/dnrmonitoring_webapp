/**
 * Centralized Authentication & Authorization
 * ==========================================
 */

const Auth = {
    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('currentUser');
        return !!(token && user);
    },

    /**
     * Get current user
     */
    getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },

    /**
     * Get auth token
     */
    getToken() {
        return localStorage.getItem('authToken');
    },

    /**
     * Set authentication data
     */
    setAuth(token, user) {
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify(user));
    },

    /**
     * Clear authentication data
     */
    clearAuth() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('savedUsername');
    },

    /**
     * Check if user is admin
     */
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    },

    /**
     * Logout user
     */
    logout() {
        this.clearAuth();
        // BUG-A FIX: path relatif dari /admin/
        const currentPath = window.location.pathname;
        window.location.href = currentPath.includes('/admin/')
            ? 'login.html'
            : 'admin/login.html';
    },

    /**
     * Require authentication - redirect to login if not authenticated
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            // BUG-A FIX: path relatif dari /admin/
            const currentPath = window.location.pathname;
            window.location.href = currentPath.includes('/admin/')
                ? 'login.html'
                : 'admin/login.html';
            return false;
        }
        return true;
    },

    /**
     * Require admin role
     */
    requireAdmin() {
        if (!this.isAdmin()) {
            // BUG-A FIX: path relatif dari /admin/
            const currentPath = window.location.pathname;
            window.location.href = currentPath.includes('/admin/')
                ? 'login.html'
                : 'admin/login.html';
            return false;
        }
        return true;
    }
};

// Make Auth available globally
window.Auth = Auth;
