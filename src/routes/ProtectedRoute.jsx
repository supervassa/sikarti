// src/routes/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { currentUser, loading } = useAuth();

    if (loading) return <div>Loading...</div>; // Loading state
    if (!currentUser) return <Navigate to="/login" replace />;

    if (!allowedRoles.includes(currentUser.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    if (currentUser.status === false) {
        return <div>Akun Anda dinonaktifkan. Hubungi Admin.</div>;
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;
