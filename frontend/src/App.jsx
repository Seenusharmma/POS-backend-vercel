import React, { lazy, Suspense, useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { animateScroll as scroll } from "react-scroll"; // Scroll Top
import { Provider } from "react-redux";
import { store } from "./store/store";
import { AuthProvider } from "./store/AuthProvider";
import Navbar from "./components/common/Navbar";
import Home from "./pages/Home";
import Menu from "./features/menu/Menu";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import BottomNav from "./components/common/BottomNav";
import WebUIOverlay from "./components/overlay/WebUIOverlay";
import PushNotificationManager from "./components/notifications/PushNotificationManager";
import ErrorBoundary from "./components/common/ErrorBoundary";
import PageLoader from "./components/common/PageLoader";

// Lazy imports
const OrderPage = lazy(() => import("./features/orders/OrderPage"));
const OrderHistory = lazy(() => import("./pages/OrderHistory"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminPage = lazy(() => import("./features/admin/AdminPage"));
const TotalSales = lazy(() => import("./features/admin/TotalSales"));

import TopProgressBar from "./components/ui/TopProgressBar";
import "./components/ui/nprogress.css";


// Top Scroller on route change
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
      <TopProgressBar />
      <ScrollToTop />

      <PushNotificationManager />
      <Navbar />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/login" element={<LoginPage />} />

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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* Bottom UI */}
      <BottomNav />
      <WebUIOverlay />
    </>
  );
};


const App = () => (
  <Provider store={store}>
    <AuthProvider>
      <BrowserRouter>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  </Provider>
);

export default App;
