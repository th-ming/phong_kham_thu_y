import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { toast } from '@components/ThongBaoNhanh';

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

const TuyenDuongBaoVe: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const userStr = localStorage.getItem('user');

    if (!userStr) {
        return <Navigate to="/dang-nhap" replace />;
    }

    try {
        const user = JSON.parse(userStr);
        let userRole = (user?.loai_tai_khoan?.toLowerCase() || user?.ten_vai_tro?.toLowerCase() || 'guest');
        
        // Chuẩn hóa vai trò tiếng Việt sang mã hệ thống để khớp với App.tsx và ThanhBenAdmin.tsx
        if (userRole.includes('quản trị') || userRole.includes('admin')) userRole = 'admin';
        if (userRole.includes('kế toán') || userRole.includes('ke_toan')) userRole = 'ke_toan';
        if (userRole.includes('bác sĩ') || userRole.includes('bac_si')) userRole = 'bac_si';
        if (userRole.includes('quản lý') || userRole.includes('quan_ly')) userRole = 'quan_ly';
        if (userRole.includes('tiếp tân') || userRole.includes('tiep_tan')) userRole = 'tiep_tan';
        if (userRole.includes('y tá') || userRole.includes('điều dưỡng') || userRole.includes('y_ta')) userRole = 'y_ta';
        if (userRole.includes('nhân viên') || userRole === 'staff') userRole = 'staff';

        const hasPermission = allowedRoles.map(r => r.toLowerCase()).includes(userRole);

        if (!hasPermission) {
            return <RedirectWithToast
                to="/quan-ly/dashboard"
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

export default TuyenDuongBaoVe;