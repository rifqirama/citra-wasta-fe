import { useWastra } from "../../context/WastraContext";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly, superAdminOnly }: ProtectedRouteProps) => {
  const { user, loading } = useWastra();

  // If we have no user and we're not loading, redirect to login
  if (!user && !loading) {
    return <Navigate to="/login" replace />;
  }

  // If we're loading but have a user from localStorage, we can proceed
  // and let verifySession update the state later if needed.
  // This avoids blank screens during session verification on refresh.
  if (loading && !user) {
    return null;
  }

  // If still no user after loading, redirect
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (superAdminOnly && user.role !== "super_admin") {
    return <Navigate to="/forbidden" replace />;
  }

  if (adminOnly && user.role !== "admin" && user.role !== "super_admin") {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;