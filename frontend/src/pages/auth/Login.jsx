import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Facebook, Google } from "../../components/SocialIcons";
import Modal from "../../components/Modal";

export default function LoginScreen() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("error");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showModal("Please enter your credentials.", "error");
      return;
    }
    
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      showModal("Login successful!", "success");
      setTimeout(() => {
        setModalVisible(false);
        navigate("/dashboard");
      }, 1200);
    } else {
      showModal(res.error || "Invalid email or password.", "error");
    }
  };

  const showModal = (message, type = "error") => {
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black rounded-b-3xl py-12 px-4 text-center">
        <h1 className="text-orange-500 text-2xl font-bold">Welcome</h1>
      </div>

      {/* Form */}
      <div className="px-6 pt-8 pb-12 max-w-md mx-auto">
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">
              Username or Email
            </label>
            <input
              type="email"
              placeholder="example@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-200 rounded-full px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
              autoCapitalize="none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={secure ? "password" : "text"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-200 rounded-full px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black pr-12"
              />
              <button
                type="button"
                onClick={() => setSecure(!secure)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {secure ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-[83%] mx-auto block bg-black text-white rounded-full py-3 font-semibold text-lg hover:bg-gray-800 transition-colors ${
              loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Logging In..." : "Log In"}
          </button>

          <Link
            to="/forgot-password"
            className="block text-center text-gray-600 font-medium mt-3 hover:text-gray-800"
          >
            Forgot Password?
          </Link>

          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="w-[83%] mx-auto block bg-gray-200 text-gray-900 rounded-full py-3 font-semibold text-lg mt-4 hover:bg-gray-300 transition-colors"
          >
            Sign Up
          </button>

          <p className="text-center text-gray-600 mt-6">
            Use <span className="text-orange-500 font-semibold">Fingerprint</span> To Access
          </p>

          <p className="text-center text-gray-500 mt-4">or sign up with</p>
          
          <div className="flex justify-center gap-6 mt-3">
            <button
              type="button"
              className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
            >
              <Facebook className="w-5 h-5 text-blue-600" />
            </button>
            <button
              type="button"
              className="p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
            >
              <Google className="w-5 h-5 text-red-500" />
            </button>
          </div>

          <div className="flex justify-center mt-6">
            <p className="text-gray-600">Don't have an account? </p>
            <Link
              to="/signup"
              className="text-orange-500 font-semibold ml-1 hover:text-orange-600"
            >
              Sign Up
            </Link>
          </div>
        </form>
      </div>

      {/* Modal Component */}
      <Modal
        isOpen={modalVisible}
        onClose={() => setModalVisible(false)}
        type={modalType}
        message={modalMessage}
      />
    </div>
  );
}