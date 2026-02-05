import React, { useEffect, useState } from "react";
import { Shield, Eye, EyeOff, CheckCircle, Mail, Lock, ArrowRight, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { loginSuperAdmin } from "../../../axios/api/auth";
import { message } from "antd";
import { useDispatch } from "react-redux";
import { setSuperAdminCredentials } from "../../../redux/slices/superAdminSlice";
import { useSelector } from "react-redux";
import { type RootState } from "../../../redux/store";

export default function SuperAdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { superAdminInfo } = useSelector((state: RootState) => state.superAdminAuth);

    useEffect(() => {
        // Check if user is already logged in and active
        const token = localStorage.getItem("token");
        if (token && superAdminInfo && superAdminInfo.userData?.status === 'active') {
            navigate("/superadmin/dashboard");
        } else if (token && superAdminInfo && superAdminInfo.userData?.status !== 'active') {
            // Clear inactive user's data
            localStorage.removeItem('token');
            message.error('Your account is not active. Please contact administrator.');
        }
    }, [navigate, superAdminInfo]);

    useEffect(() => {
        if (success) {
            const t = window.setTimeout(() => {
                setSuccess(false);
                navigate("/superadmin/dashboard");
            }, 1500);
            return () => window.clearTimeout(t);
        }
    }, [success, navigate]);

    function validate() {
        const e: Record<string, string> = {};
        if (!email.trim()) e.email = "Email is required.";
        else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Enter a valid email.";
        if (!password.trim()) e.password = "Password is required.";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    // Store token and superadmin info
    const storeSuperAdminCredentials = (token: string, userData: any) => {
        localStorage.setItem("token", token);
        // Store in Redux
        dispatch(setSuperAdminCredentials({ userData }));
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;
        
        setLoading(true);
        setErrors({});
        
        try {
            const payload = { email, password };
            const response = await loginSuperAdmin(payload);
            
            console.log("SuperAdmin login response:", response);
            
            // Check if response indicates an error - if success is false, show error and stop
            if (!response || response.success !== true) {
                const errorMessage = response?.message || "Invalid super admin credentials. Access denied.";
                
                // Clear any existing tokens if account is inactive
                if (errorMessage.includes('not active') || errorMessage.includes('inactive')) {
                    localStorage.removeItem('token');
                }
                
                setErrors({ submit: errorMessage });
                message.error(errorMessage);
                setLoading(false);
                return; // Stop here - do NOT navigate to dashboard
            }
            
            // Only proceed if response.success is explicitly true
            if (response.success === true) {
                // Double-check user status before allowing login
                const userStatus = response.data?.status || 'active';
                if (userStatus !== 'active') {
                    const errorMsg = "Your account is not active. Please contact administrator.";
                    setErrors({ submit: errorMsg });
                    message.error(errorMsg);
                    setLoading(false);
                    return; // Stop here - do NOT navigate to dashboard
                }
                
                // Store token and superadmin data
                if (response.data?.token && response.data) {
                    storeSuperAdminCredentials(response.data.token, response.data);
                }
                
                // Clear form
                setEmail("");
                setPassword("");
                
                setSuccess(true);
                message.success(response.message || "Login successful! Redirecting to dashboard...");
                
                // Navigate will be handled by useEffect when success is true
            }
        } catch (err: any) {
            console.error("SuperAdmin login error:", err);
            
            // Handle different types of errors
            if (err?.response?.data?.message) {
                setErrors({ submit: err.response.data.message });
                message.error(err.response.data.message);
            } else if (err?.message) {
                setErrors({ submit: err.message });
                message.error(err.message);
            } else {
                setErrors({ submit: "Network error. Please check your connection and try again." });
                message.error("Network error. Please check your connection and try again.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-indigo-50 flex items-center justify-center px-4 py-8">
            {/* Floating Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-purple-400/5 to-indigo-400/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-indigo-400/5 to-purple-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="w-full max-w-md relative">
                {/* Success Message */}
                {success && (
                    <div className="fixed top-6 right-6 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in z-50">
                        <CheckCircle className="w-5 h-5" />
                        Super Admin access granted!
                    </div>
                )}

                <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl ring-1 ring-gray-200/50 overflow-hidden">
                    {/* Header */}
                    <div className="relative bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-8 text-center">
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="relative">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <Shield className="w-10 h-10 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-white mb-2">Super Administrator</h1>
                            <p className="text-purple-100">
                                Secure access to Logistics platform
                            </p>
                        </div>
                    </div>

                    {/* Login Form */}
                    <div className="p-8 space-y-6">
                     
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Super Administrator Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`block w-full rounded-xl border pl-12 pr-4 py-4 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.email ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
                                        }`}
                                    placeholder="superadmin@logistics.com"
                                />
                            </div>
                            {errors.email && <div className="text-xs text-red-500 flex items-center gap-1">{errors.email}</div>}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-gray-700">Super Administrator Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`block w-full rounded-xl border pl-12 pr-12 py-4 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.password ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
                                        }`}
                                    placeholder="Enter your secure password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && <div className="text-xs text-red-500">{errors.password}</div>}
                        </div>

                        {/* Error Message */}
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                <div className="text-sm text-red-700">{errors.submit}</div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`w-full inline-flex items-center justify-center gap-3 rounded-xl px-6 py-4 text-sm font-bold !text-white shadow-xl transition-all duration-200 ${loading
                                    ? "bg-purple-400 cursor-not-allowed"
                                    : "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 hover:shadow-2xl transform hover:-translate-y-1"
                                }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    <Shield className="w-5 h-5" />
                                    Login
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>



                    </div>
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