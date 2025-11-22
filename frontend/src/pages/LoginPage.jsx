import React, { useState, useEffect, useContext } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import { motion } from "framer-motion";
import LogoLoader from "../components/LogoLoader"; // ✅ Import loader
import UsernameModal from "../components/UsernameModal";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true); // ✅ Page loader state
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const ADMIN_EMAIL = "roshansharma7250@gmail.com, ";

  // ✅ Show logo loader when page first loads
  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // ✅ Redirect logged-in user (only if username is set or modal is closed)
  // This useEffect acts as a backup to catch users who don't have displayName
  // but only if the modal isn't already being shown by handleGoogle/handleAuth
  useEffect(() => {
    if (user && !showUsernameModal && !pendingUser) {
      // Check if user needs to set username (only for non-admin users)
      if (user.email !== ADMIN_EMAIL && !user.displayName) {
        setShowUsernameModal(true);
        setPendingUser(user);
        return;
      }
      if (user.email === ADMIN_EMAIL) navigate("/admin");
      else navigate("/");
    }
  }, [user, navigate, showUsernameModal, pendingUser]);

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
      let userResult;
      if (isLogin) {
        userResult = await signInWithEmailAndPassword(auth, email, password);
        toast.success("✅ Logged in successfully!");
        
        // Check if username is needed (only for non-admin users)
        if (email !== ADMIN_EMAIL && !userResult.user.displayName) {
          setPendingUser(userResult.user);
          setShowUsernameModal(true);
        } else if (email === ADMIN_EMAIL) {
          navigate("/admin");
        } else {
          navigate("/order");
        }
      } else {
        userResult = await createUserWithEmailAndPassword(auth, email, password);
        toast.success("🎉 Account created successfully!");
        
        // Check if username is needed (only for non-admin, new users)
        if (email !== ADMIN_EMAIL && !userResult.user.displayName) {
          setPendingUser(userResult.user);
          setShowUsernameModal(true);
        } else if (email === ADMIN_EMAIL) {
          navigate("/admin");
        } else {
          navigate("/order");
        }
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
      
      // Check if username is needed (only for non-admin users)
      if (email !== ADMIN_EMAIL && !result.user.displayName) {
        setPendingUser(result.user);
        setShowUsernameModal(true);
      } else if (email === ADMIN_EMAIL) {
        navigate("/admin");
      } else {
        navigate("/order");
      }
    } catch {
      toast.error("Google Sign-In failed. Please try again.");
    }
  };

  const handleUsernameModalClose = () => {
    setShowUsernameModal(false);
    setPendingUser(null);
    // Small delay to ensure state updates before navigation
    setTimeout(() => {
      if (user) {
        if (user.email === ADMIN_EMAIL) navigate("/admin");
        else navigate("/order");
      }
    }, 100);
  };

  // ✅ Show loader before page appears
  if (pageLoading) return <LogoLoader />;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-orange-100 via-yellow-50 to-white overflow-hidden">
      <Toaster />
      <UsernameModal
        isOpen={showUsernameModal}
        onClose={handleUsernameModalClose}
        user={pendingUser || user}
      />

      {/* 🍴 Left Section */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="hidden md:flex w-1/2 items-center justify-center bg-gradient-to-br from-orange-500 via-orange-400 to-yellow-300 p-10 relative"
      >
        <div className="text-left max-w-md">
          <h1 className="text-5xl font-extrabold text-white leading-tight drop-shadow-md">
            Food <span className="text-yellow-200">Fantasy</span>
          </h1>
          <p className="text-white text-lg mt-4 opacity-90">
            Order your favorite food with just one tap.  
            Fresh, Fast & Delicious — the Food Fantasy way 🍕
          </p>
          <img
            src="/logo.png"
            alt="Food Illustration"
            className="w-80 mt-10 mx-auto drop-shadow-2xl"
          />
        </div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-yellow-300 opacity-70"></div>
      </motion.div>

      {/* 🔐 Right Section (Login Form) */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="flex w-full md:w-1/2 justify-center items-center bg-white p-6 sm:p-10 relative"
      >
        <div className="bg-white shadow-2xl border border-gray-100 rounded-3xl w-full max-w-sm p-8 sm:p-10">
          <h2 className="text-4xl font-extrabold text-center text-orange-500 mb-8 tracking-tight">
            {isLogin ? "Welcome Back 👋" : "Create Account 🎉"}
          </h2>

          {/* Email Input */}
          <div className="mb-4">
            <label className="block text-gray-600 text-sm mb-1 font-semibold">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Password Input */}
          <div className="mb-5">
            <label className="block text-gray-600 text-sm mb-1 font-semibold">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between mb-6 text-sm text-gray-500">
            <label className="flex items-center">
              <input type="checkbox" className="accent-orange-500 mr-2" />
              Remember me
            </label>
            <span className="text-orange-500 cursor-pointer hover:underline">
              Forgot Password?
            </span>
          </div>

          {/* Login / Register Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAuth}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-all shadow-md"
          >
            {loading ? "Please wait..." : isLogin ? "Log In" : "Register"}
          </motion.button>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="grow border-t border-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm">OR</span>
            <div className="grow border-t border-gray-300"></div>
          </div>

          {/* Google Login */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleGoogle}
            disabled={loading}
            className="border border-gray-300 w-full py-3 rounded-xl flex justify-center items-center gap-3 hover:bg-gray-50 transition text-gray-700 font-medium"
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/0/09/IOS_Google_icon.png"
              alt="Google"
              className="w-6 h-6"
            />
            Continue with Google
          </motion.button>

          {/* Toggle */}
          <p className="text-center text-sm text-gray-500 mt-6">
            {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
            <span
              onClick={toggleMode}
              className="text-orange-500 font-semibold cursor-pointer hover:underline"
            >
              {isLogin ? "Sign Up" : "Login"}
            </span>
          </p>
        </div>

        {/* Decorative Circle Background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-200 rounded-full blur-3xl opacity-40 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-yellow-200 rounded-full blur-3xl opacity-40 -z-10"></div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
