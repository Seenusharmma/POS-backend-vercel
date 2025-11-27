import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { AuthProvider } from "./store/AuthProvider";
import Navbar from "./components/common/Navbar";
import Home from "./pages/Home";
import Menu from "./features/menu/Menu";
import OrderPage from "./features/orders/OrderPage";
import OrderHistory from "./pages/OrderHistory";
import AdminPage from "./features/admin/AdminPage";
import LoginPage from "./pages/LoginPage";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Footer from "./components/common/Footer";
import TotalSales from "./features/admin/TotalSales";
import BottomNav from "./components/common/BottomNav";
import WebUIOverlay from "./components/overlay/WebUIOverlay";


const AppContent = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <>
      <Navbar />
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

          {/* Protected Admin Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Route */}
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
