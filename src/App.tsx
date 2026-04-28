import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { useEffect, Suspense, lazy } from "react";
const Home = lazy(() => import("./pages/Home"));
import { WastraContextProvider } from "./context/WastraContextProvider";
import { ThemeProvider } from "./context/ThemeContext";
const GalleryPage = lazy(() => import("./pages/MotifExplorer"));
const About = lazy(() => import("./pages/About"));
const MotifMaps = lazy(() => import("./pages/MotifMaps"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
import MainLayout from "./components/layouts/MainLayout";
import AdminLayout from "./components/layouts/AdminLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import DetectionWrapper from "./pages/DetectionWrapper";
import { setAuthRedirectCallback } from "./api/api";
const AdminMotif = lazy(() => import("./pages/AdminMotif"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminPredictionHistory = lazy(() => import("./pages/AdminPredictionHistory"));
const AdminPredictionReview = lazy(() => import("./pages/AdminPredictionReview"));
const SystemLogs = lazy(() => import("./pages/SystemLogs"));
const Settings = lazy(() => import("./pages/Settings"));
const Statistics = lazy(() => import("./pages/Statistics"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ForbiddenPage = lazy(() => import("./pages/ForbiddenPage"));
import CustomCursor from "./components/common/CustomCursor";
function App() {
  const navigate = useNavigate();

  useEffect(() => {
    setAuthRedirectCallback((path) => navigate(path));
  }, [navigate]);

  return (
    <ThemeProvider>
      <WastraContextProvider>
        <CustomCursor />
        <Suspense fallback={null}>
          <Routes>
            <Route element={<MainLayout />}>
              {/* PUBLIC */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/detection-page" element={<DetectionWrapper />} />
              <Route path="/maps" element={<MotifMaps />} />

              {/* PRIVATE */}
              <Route
                path="/gallery-page"
                element={
                  <ProtectedRoute>
                    <GalleryPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Redirect /admin to /admin/dashboard */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute adminOnly>
                  <Navigate to="/admin/dashboard" replace />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes with Sidebar Layout */}
            <Route
              element={
                <ProtectedRoute adminOnly>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              {/* User Management only for super_admin */}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute superAdminOnly>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route path="/admin/motifs" element={<AdminMotif />} />
              <Route path="/admin/prediction-history" element={<AdminPredictionHistory />} />
              <Route path="/admin/prediction-review" element={<AdminPredictionReview />} />
              <Route path="/admin/statistics" element={<Statistics />} />
              <Route path="/admin/system-logs" element={<ProtectedRoute superAdminOnly><SystemLogs /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute superAdminOnly><Settings /></ProtectedRoute>} />
              <Route path="/admin/profile" element={<Profile />} />
            </Route>

            <Route path="/forbidden" element={<ForbiddenPage />} />

            <Route path="/login" element={<AuthPage />} />
          </Routes>
        </Suspense>
      </WastraContextProvider>
    </ThemeProvider>
  );
}

export default App;