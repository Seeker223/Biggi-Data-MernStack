import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Facebook, Google } from "../../components/SocialIcons";
import Modal from "../../components/Modal";

export default function SignupScreen() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    birthDate: "",
    password: "",
    confirmPassword: "",
  });

  const [secure, setSecure] = useState(true);
  const [confirmSecure, setConfirmSecure] = useState(true);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("success");
  const [modalMessage, setModalMessage] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    const { username, email, password, phoneNumber, birthDate, confirmPassword } = form;

    // Validation
    if (!username || !email || !password || !confirmPassword) {
      showModal("Please fill all required fields.", "error");
      return;
    }

    if (password !== confirmPassword) {
      showModal("Passwords do not match.", "error");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showModal("Please enter a valid email address.", "error");
      return;
    }

    // Password strength validation
    if (password.length < 6) {
      showModal("Password must be at least 6 characters long.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await register(username, email, password, phoneNumber, birthDate);
      
      if (res.success) {
        showModal("Registration successful! Welcome to Biggi Data.", "success");
        
        setTimeout(() => {
          setModalVisible(false);
          navigate("/dashboard"); // Direct to home, no verification
        }, 1500);
      } else {
        showModal(res.error || "Registration failed. Please try again.", "error");
      }
    } catch (error) {
      console.error("Registration error:", error);
      showModal("An unexpected error occurred. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const showModal = (message, type = "error") => {
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const formatDate = (text) => {
    let cleaned = text.replace(/\D/g, '');
    
    if (cleaned.length >= 4) {
      cleaned = cleaned.substring(0, 4) + '-' + cleaned.substring(4);
    }
    if (cleaned.length >= 7) {
      cleaned = cleaned.substring(0, 7) + '-' + cleaned.substring(7, 9);
    }
    
    setForm({ ...form, birthDate: cleaned });
  };

  const formatPhoneNumber = (text) => {
    let cleaned = text.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = '+234' + cleaned.substring(1);
    } else if (cleaned.startsWith('234')) {
      cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    setForm({ ...form, phoneNumber: cleaned });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-black rounded-b-[60px] py-16 px-4 text-center">
        <h1 className="text-orange-500 text-2xl font-bold">Create Account</h1>
        <p className="text-white opacity-80 mt-2">Join Biggi Data today</p>
      </div>

      {/* Form */}
      <div className="px-6 pt-8 pb-12 max-w-md mx-auto">
        <form onSubmit={handleRegister}>
          {/* Full Name */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">
              Full Name *
            </label>
            <input
              type="text"
              placeholder="John Doe"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              autoCapitalize="words"
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">
              Email *
            </label>
            <input
              type="email"
              placeholder="example@example.com"
              autoCapitalize="none"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value.toLowerCase() })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          {/* Phone Number */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              placeholder="+2348012345678"
              value={form.phoneNumber}
              onChange={(e) => formatPhoneNumber(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          {/* Birth Date */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">
              Date of Birth *
            </label>
            <input
              type="text"
              placeholder="YYYY-MM-DD"
              value={form.birthDate}
              onChange={(e) => formatDate(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              maxLength={10}
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-1">
              Password *
            </label>
            <div className="relative">
              <input
                type={secure ? "password" : "text"}
                placeholder="At least 6 characters"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent pr-12"
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
            <p className="text-gray-500 text-sm mt-1 ml-1">Minimum 6 characters</p>
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                type={confirmSecure ? "password" : "text"}
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent pr-12"
              />
              <button
                type="button"
                onClick={() => setConfirmSecure(!confirmSecure)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {confirmSecure ? (
                  <EyeSlashIcon className="w-5 h-5" />
                ) : (
                  <EyeIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Terms */}
          <p className="text-gray-600 text-sm text-center mt-4">
            By continuing, you agree to{" "}
            <span className="font-semibold text-black">Terms of Use</span> and{" "}
            <span className="font-semibold text-black">Privacy Policy</span>.
          </p>

          {/* Sign Up Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-black text-white rounded-xl py-4 font-semibold text-lg mt-6 hover:bg-gray-800 transition-colors shadow-md ${
              loading ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Signing Up..." : "Create Account"}
          </button>

          {/* Alternative Options */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="px-4 text-gray-500 text-sm">or sign up with</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 rounded-xl py-3 hover:bg-gray-100 transition-colors"
            >
              <Google className="w-5 h-5 text-red-500" />
              <span className="text-gray-700 font-medium">Google</span>
            </button>
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 bg-gray-50 border border-gray-200 rounded-xl py-3 hover:bg-gray-100 transition-colors"
            >
              <Facebook className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700 font-medium">Facebook</span>
            </button>
          </div>

          {/* Footer */}
          <div className="flex justify-center">
            <p className="text-gray-600">Already have an account? </p>
            <Link
              to="/login"
              className="text-orange-500 font-semibold ml-1 hover:text-orange-600"
            >
              Log In
            </Link>
          </div>
        </form>
      </div>

      {/* Modal Component */}
      <Modal
        isOpen={modalVisible}
        onClose={closeModal}
        type={modalType}
        message={modalMessage}
      />
    </div>
  );
}