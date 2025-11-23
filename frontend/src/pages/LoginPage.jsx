import React, { useState, useEffect } from "react";
import { auth } from "../services/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import LogoLoader from "../components/ui/LogoLoader"; // ✅ Import loader
import { checkAdminStatus } from "../services/adminApi";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true); // ✅ Page loader state
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  // ✅ Show logo loader when page first loads
  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // ✅ Redirect logged-in user based on admin status
  useEffect(() => {
    const redirectUser = async () => {
      if (user?.email) {
        try {
          // Check if user is admin via API
          const adminResult = await checkAdminStatus(user.email);
          if (adminResult.isAdmin) {
            navigate("/admin");
          } else {
            navigate("/");
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          // On error, redirect to home (safer default)
          navigate("/");
        }
      }
    };

    if (user) {
      redirectUser();
    }
  }, [user, navigate]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const toggleMode = () => setIsLogin(!isLogin);

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleAuth = async () => {
    const email = form.email.trim();
    const password = form.password.trim();

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }
    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success("✅ Logged in successfully!");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success("🎉 Account created successfully!");
      }

      // Check admin status and redirect accordingly
      try {
        const adminResult = await checkAdminStatus(email);
        if (adminResult.isAdmin) {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } catch (adminError) {
        console.error("Error checking admin status:", adminError);
        // On error, redirect to home
        navigate("/");
      }
    } catch (err) {
      const code = err.code || "";
      if (code === "auth/user-not-found") toast.error("User not found.");
      else if (code === "auth/wrong-password") toast.error("Incorrect password.");
      else if (code === "auth/email-already-in-use")
        toast.error("Email already registered.");
      else toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;
      toast.success("✅ Google Sign-In successful!");
      
      // Check admin status and redirect accordingly
      try {
        const adminResult = await checkAdminStatus(email);
        if (adminResult.isAdmin) {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } catch (adminError) {
        console.error("Error checking admin status:", adminError);
        // On error, redirect to home
        navigate("/");
      }
    } catch {
      toast.error("Google Sign-In failed. Please try again.");
    }
  };

  // ✅ Show loader before page appears
  if (pageLoading) return <LogoLoader />;

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-white overflow-hidden">
      <Toaster />

      {/* 🔐 Login Form (Centered) */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex justify-center items-center w-full p-4 sm:p-6 md:p-10 relative"
      >
        <div className="bg-white shadow-2xl border border-gray-100 rounded-2xl md:rounded-3xl w-full max-w-sm p-6 sm:p-8 md:p-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center text-orange-500 mb-6 sm:mb-8 tracking-tight">
            {isLogin ? "Welcome Back 👋" : "Create Account 🎉"}
          </h2>

          {/* Email Input */}
          <div className="mb-3 sm:mb-4">
            <label className="block text-gray-600 text-xs sm:text-sm mb-1 font-semibold">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Password Input */}
          <div className="mb-4 sm:mb-5">
            <label className="block text-gray-600 text-xs sm:text-sm mb-1 font-semibold">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 text-xs sm:text-sm text-gray-500">
            <label className="flex items-center">
              <input type="checkbox" className="accent-orange-500 mr-2" />
              <span className="hidden sm:inline">Remember me</span>
              <span className="sm:hidden">Remember</span>
            </label>
            <span className="text-orange-500 cursor-pointer hover:underline text-xs sm:text-sm">
              Forgot Password?
            </span>
          </div>

          {/* Login / Register Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all shadow-md text-sm sm:text-base"
          >
            {loading ? "Please wait..." : isLogin ? "Log In" : "Register"}
          </motion.button>

          {/* Divider */}
          <div className="flex items-center my-4 sm:my-6">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="px-2 sm:px-3 text-gray-500 text-xs sm:text-sm">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          {/* Google Login */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleGoogle}
            disabled={loading}
            className="border border-gray-300 w-full py-2.5 sm:py-3 rounded-lg sm:rounded-xl flex justify-center items-center gap-2 sm:gap-3 hover:bg-gray-50 transition text-gray-700 font-medium text-sm sm:text-base"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/09/IOS_Google_icon.png"
              alt="Google"
              className="w-5 h-5 sm:w-6 sm:h-6"
            />
            <span className="hidden sm:inline">Continue with Google</span>
            <span className="sm:hidden">Google</span>
          </motion.button>

          {/* Toggle */}
          <p className="text-center text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <span
              onClick={toggleMode}
              className="text-orange-500 font-semibold cursor-pointer hover:underline"
            >
              {isLogin ? "Sign Up" : "Login"}
            </span>
          </p>
        </div>

        {/* Decorative Circle Background */}
        <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 bg-orange-200 rounded-full blur-3xl opacity-40 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 sm:w-56 sm:h-56 bg-yellow-200 rounded-full blur-3xl opacity-40 -z-10"></div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
