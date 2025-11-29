import React, { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import { Provider } from "react-redux";
import { store } from "./store/store";
import { AuthProvider } from "./store/AuthProvider";
import Navbar from "./components/common/Navbar";
import Home from "./pages/Home";
import Menu from "./features/menu/Menu";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Footer from "./components/common/Footer";
import BottomNav from "./components/common/BottomNav";
import WebUIOverlay from "./components/overlay/WebUIOverlay";
import PushNotificationManager from "./components/notifications/PushNotificationManager";

// ⚡ Lazy load heavy components for better performance
const OrderPage = lazy(() => import("./features/orders/OrderPage"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminPage = lazy(() => import("./features/admin/AdminPage"));
const TotalSales = lazy(() => import("./features/admin/TotalSales"));
import TopProgressBar from "./components/ui/TopProgressBar";
import "./components/ui/nprogress.css";

// Top Scroller
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const AppContent = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <>
      {/* Top Progress Bar for YouTube-like loading */}
      <TopProgressBar />
      
      {/* Top Scroller */}
      <ScrollToTop />

      {/* Push Notification Manager - Initializes notifications for logged-in users */}
      <PushNotificationManager />
      
      <Navbar />

      {/* ⚡ Suspense wrapper for lazy loaded routes - no loader for instant feel */}
      <Suspense fallback={null}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected User Routes */}
          <Route
            path="/order"
            element={
              <ProtectedRoute>
                <OrderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <OrderHistory />
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

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sales"
            element={
              <ProtectedRoute adminOnly={true}>
                <TotalSales />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {!isLoginPage && <Footer />}
      <BottomNav />
      <WebUIOverlay />
    </>
  );
};

const App = () => (
  <Provider store={store}>
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  </Provider>
);

export default App;
