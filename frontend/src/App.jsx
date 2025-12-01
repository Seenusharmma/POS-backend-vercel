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


// 🔥 Scroll-To-Top Floating Button
const ScrollTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 200) setVisible(true);
      else setVisible(false);
    };
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <>
      {visible && (
        <button
          onClick={() => scroll.scrollToTop()}
          className="fixed bottom-24 right-4 bg-orange-600 text-white p-3 rounded-full shadow-lg hover:bg-orange-700 transition-all z-50"
        >
          ⬆️
        </button>
      )}
    </>
  );
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

      <Suspense fallback={null}>
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

      {/* 🔥 Add Scroll-To-Top Button */}
      <ScrollTopButton />
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
