import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { AuthProvider } from "./store/AuthProvider";
import Navbar from "./components/Navbar";
import Home from "./components/HomePage/Home";
import Menu from "./components/Menu";
import OrderPage from "./components/OrderPage";
import OrderHistory from "./components/OrderHistory";
import AdminPage from "./components/Admin/AdminPage";
import LoginPage from "./components/LoginPage";
import Profile from "./components/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import Footer from "./components/Footer";
import TotalSales from "./components/Admin/TotalSales";
import BottomNav from "./components/BottomNav";

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
