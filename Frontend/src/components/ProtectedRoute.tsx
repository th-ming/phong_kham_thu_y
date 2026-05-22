import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { toast } from '@components/Toast';
import { normalizeUserRole } from '@utils/index';

interface ProtectedRouteProps {
    allowedRoles: string[];
}

// Component phụ để hiển thị Toast trước khi chuyển hướng
const RedirectWithToast: React.FC<{ to: string; message: string }> = ({ to, message }) => {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        toast.error(message);
        setReady(true);
    }, [message]);

    if (!ready) return null; // Chờ toast được gọi xong mới redirect
    return <Navigate to={to} replace />;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const userStr = localStorage.getItem('user');

    if (!userStr) {
        return <Navigate to="/dang-nhap" replace />;
    }

    try {
        const user = JSON.parse(userStr);
        const userRole = normalizeUserRole(user);

        const hasPermission = allowedRoles.map(r => r.toLowerCase()).includes(userRole);

        if (!hasPermission) {
            const fallbackRoute = (userRole === 'khach_hang' || userRole === 'guest') ? '/khach-hang/dashboard' : '/quan-ly/dashboard';
            return <RedirectWithToast
                to={fallbackRoute}
                message="Cảnh báo bảo mật: Bạn không có quyền truy cập vào chức năng này!"
            />;
        }

        return <Outlet />;
    } catch (error) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        return <Navigate to="/dang-nhap" replace />;
    }
};

export default ProtectedRoute;
