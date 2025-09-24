import React, { useEffect, useState } from "react";
import { Truck, Eye, EyeOff, CheckCircle, Mail, Lock, ArrowRight, MapPin, Users, Shield, AlertCircle } from "lucide-react";
import { login } from "../../../axios/api/auth";
import { useNavigate } from "react-router-dom"; // Assuming you're using React Router
import {message} from 'antd'
import { setUserCredentials, type UserInfo } from "../../../redux/slices/userSlice";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import  { type RootState } from "../../../redux/store";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const dispatch = useDispatch()
   const { userInfo } = useSelector((state: RootState) => state.userAuth);
  const navigate = useNavigate(); // For navigation

  
  useEffect(() => {
        if (userInfo) {
            navigate('/admin/dashboard')
        }
    }, [])

  function validate() {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Enter a valid email.";
    if (!password.trim()) e.password = "Password is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // Store token in localStorage (or you can use a context/state management)
  const storeToken = (token: string, userData: UserInfo) => {
    localStorage.setItem("token", token);
    dispatch(setUserCredentials({ userData }))
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      const payload = { email, password };
      const response = await login(payload);
      
      console.log("Login response:", response);
      
      if (response?.success) {
        // // Success case
        // setSuccess(true);
        // setAlertType("success");
        // setAlertMessage(response.message || "Login successful! Redirecting to dashboard...");
        
        // Store token and user data
        if (response.token && response.data) {
          storeToken(response.token, response.data);
        }
        
        // Clear form
        setEmail("");
        setPassword("");
        setRememberMe(false);
        message.success(response.message)
        navigate('/admin/dashboard')
      } else {
        // Error case - API returned success: false
        // setSuccess(false);
        // setAlertType("error");
        // setAlertMessage(response?.message || "Login failed. Please try again.");
        setErrors({ submit: response?.message || "Invalid credentials. Please try again." });
        return
      }
      
    } catch (error) {
      console.error("Login error:", error);
      setSuccess(false);
      setAlertType("error");
      
      // Handle different types of errors
      if (error?.response?.data?.message) {
        setAlertMessage(error.response.data.message);
        setErrors({ submit: error.response.data.message });
      } else if (error?.message) {
        setAlertMessage(error.message);
        setErrors({ submit: error.message });
      } else {
        setAlertMessage("Network error. Please check your connection and try again.");
        setErrors({ submit: "Network error. Please check your connection and try again." });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-6xl relative">
        {/* Alert Messages */}
        {alertMessage && (
          <div className={`fixed top-6 right-6 px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in z-50 max-w-md ${
            alertType === "success" 
              ? "bg-emerald-500 text-white" 
              : "bg-red-500 text-white"
          }`}>
            {alertType === "success" ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{alertMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Welcome Content */}
          <div className="space-y-8 text-center lg:text-left">
            <div>
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg">
                  <Truck className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Logistics
                </h1>
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Welcome Back
              </h2>
              <p className="text-lg text-gray-600 max-w-md mx-auto lg:mx-0">
                Sign in to access your logistics dashboard and manage your operations efficiently.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Fleet Tracking</h4>
                <p className="text-sm text-gray-600">Real-time vehicle monitoring</p>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Route Planning</h4>
                <p className="text-sm text-gray-600">Optimized delivery routes</p>
              </div>

              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">Team Management</h4>
                <p className="text-sm text-gray-600">Driver & staff coordination</p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl ring-1 ring-gray-200/50 overflow-hidden">
              {/* Form Header */}
              <div className="p-8 text-center border-b border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h3>
                <p className="text-sm text-gray-500">Access your logistics dashboard</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className={`block w-full rounded-xl border pl-12 pr-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                        errors.email ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      placeholder="Enter your email"
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    <a href="#" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className={`block w-full rounded-xl border pl-12 pr-12 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                        errors.password ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <div className="text-xs text-red-500 mt-1">{errors.password}</div>}
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                    />
                    <label htmlFor="remember" className="text-sm text-gray-600">
                      Remember me
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="space-y-4">
                  {errors.submit && (
                    <div className="text-sm text-red-600 text-center bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {errors.submit}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-semibold text-white shadow-lg transition-all duration-200 ${
                      loading
                        ? "bg-indigo-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transform hover:-translate-y-0.5"
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Signing In...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                {/* Sign Up Link */}
                <div className="text-center pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{" "}
                    <a href="/admin/register" className="text-indigo-600 hover:text-indigo-700 font-medium underline">
                      Create one now
                    </a>
                  </p>
                </div>
              </form>
            </div>

            {/* Security Badge */}
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span>Secured with enterprise-grade encryption</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          © 2025 Logistics Platform. All rights reserved.
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}