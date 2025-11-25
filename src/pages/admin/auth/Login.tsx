import React, { useEffect, useState } from "react";
import { Truck, Eye, EyeOff, Mail, Lock, ArrowRight, MapPin, Users, Shield, AlertCircle } from "lucide-react";
import { login } from "../../../axios/api/auth";
import { getCompany } from "../../../axios/api/admin";
import { useNavigate, useLocation } from "react-router-dom";
import { message } from 'antd';
import { setUserCredentials } from "../../../redux/slices/userSlice";
import { useDispatch } from "react-redux";
import Logo from "../../../assets/FleetGo.png"

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in (only check once on mount)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUserInfo = localStorage.getItem('userInfo');
    
    // Only redirect if we have both token and userInfo, and user is active
    if (location.pathname === '/' && token && storedUserInfo) {
      try {
        const parsed = JSON.parse(storedUserInfo);
        if (parsed && parsed.userData && parsed.userData.role && parsed.userData.status === 'active') {
          // Redirect based on role
          const userRole = parsed.userData.role;
          if (userRole === 'dispatcher') {
            navigate('/dispatch', { replace: true });
          } else if (userRole === 'hr') {
            navigate('/Management', { replace: true });
          } else if (userRole === 'Fleet Maintenance Manager') {
            navigate('/fleetmaintenance', { replace: true });
          } else if (userRole === 'Compliance Manager') {
            navigate('/compliance', { replace: true });
          } else {
            navigate('/admin/dashboard', { replace: true });
          }
        } else if (parsed && parsed.userData && parsed.userData.status !== 'active') {
          // Clear inactive user's data
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');
          message.error('Your account is not active. Please contact administrator.');
        }
      } catch (e) {
        // Invalid userInfo, don't redirect
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  function validate() {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Enter a valid email.";
    if (!password.trim()) e.password = "Password is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validate()) {
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      const response = await login({ email, password });
      
      // Check if response indicates an error - if success is false, show error and stop
      if (!response || response.success !== true) {
        const errorMessage = response?.message || "Invalid credentials. Please try again.";
        
        // Clear any existing tokens if account is inactive
        if (errorMessage.includes('not active') || errorMessage.includes('inactive')) {
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');
        }
        
        setErrors({ submit: errorMessage });
        message.error(errorMessage);
        setLoading(false);
        return; // Stop here - do NOT navigate to dashboard
      }
      
      // Only proceed if response.success is explicitly true
      if (response.success === true) {
        const token = response.token || response.data?.token || response.data?.accessToken;
        const userData = response.data || response.user || response;
        
        if (!token || !userData) {
          const errorMsg = "Invalid response from server. Please try again.";
          setErrors({ submit: errorMsg });
          message.error(errorMsg);
          setLoading(false);
          return; // Stop here - do NOT navigate to dashboard
        }
        
        // Double-check user status before allowing login
        const userStatus = userData.status || userData.userData?.status || 'active';
        if (userStatus !== 'active') {
          setErrors({ submit: "Your account is not active. Please contact administrator." });
          message.error("Your account is not active. Please contact administrator.");
          setLoading(false);
          return;
        }
        
        // Clean up old localStorage keys
        localStorage.removeItem('adminInfo');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userData');

        // Persist the new token immediately so subsequent API calls succeed
        localStorage.setItem("token", token);
        sessionStorage.setItem("tokenSetTime", Date.now().toString());
        
        // Normalize user data
        const rawCompany =
          userData.company ||
          userData.companyId ||
          userData.companyInfo ||
          userData.companyData ||
          userData?.userData?.company;

        let normalizedCompany: any = undefined;
        if (rawCompany) {
          if (typeof rawCompany === 'string') {
            normalizedCompany = { _id: rawCompany };
          } else if (typeof rawCompany === 'object') {
            const companyId = rawCompany._id || rawCompany.id;
            normalizedCompany = {
              _id: companyId,
              companyName: rawCompany.companyName || rawCompany.name,
              ...rawCompany,
            };
          }
        } else if (userData.role && userData.role !== 'superadmin') {
          try {
            const companyResponse = await getCompany();
            if (companyResponse?.success && companyResponse?.data?._id) {
              const companyData = companyResponse.data;
              normalizedCompany = {
                _id: companyData._id,
                companyName: companyData.companyName || companyData.name,
                ...companyData,
              };
            }
          } catch (companyError) {
            console.warn('Unable to fetch company details during login:', companyError);
          }
        }

        const normalizedUserData = {
          _id: userData._id || userData.id,
          name:
            userData.name ||
            `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
            userData.email,
          email: userData.email,
          role: userData.role,
          status: userStatus, // Use the checked status
          company: normalizedCompany,
        };
        
        const userInfoPayload = {
          userData: normalizedUserData,
          role: normalizedUserData.role,
          company: normalizedUserData.company,
        };
        
        // Store authentication data
        localStorage.setItem("userInfo", JSON.stringify(userInfoPayload));
        
        // Update Redux
        dispatch(setUserCredentials(userInfoPayload));
        
        // Clear form and show success
        setEmail("");
        setPassword("");
        setRememberMe(false);
        message.success(response.message || "Login successful");
        
        // Navigate based on user role
        const userRole = normalizedUserData.role || userData.role;
        if (userRole === 'dispatcher') {
          navigate('/dispatch', { replace: true });
        } else if (userRole === 'hr') {
          navigate('/Management', { replace: true });
        } else if (userRole === 'Fleet Maintenance Manager') {
          navigate('/fleetmaintenance', { replace: true });
        } else if (userRole === 'Compliance Manager') {
          navigate('/compliance', { replace: true });
        } else {
          navigate('/admin/dashboard', { replace: true });
        }
        setLoading(false);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Network error. Please check your connection and try again.";
      setErrors({ submit: errorMessage });
      message.error(errorMessage);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-6xl relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Welcome Content */}
          <div className="space-y-8 text-center lg:text-left">
            <div>
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
              <img src={Logo} alt="FleetGo Logo" className="w-40 h-auto" />
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
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
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
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ background: 'linear-gradient(to right, #016ab2, #063f6f)' }}>
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
                      className={`block w-full rounded-xl border pl-12 pr-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                        errors.email ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
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
                    <a href="#" className="text-xs font-medium" style={{ color: '#016ab2' }} onMouseEnter={(e) => e.currentTarget.style.color = '#063f6f'} onMouseLeave={(e) => e.currentTarget.style.color = '#016ab2'}>
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
                      className={`block w-full rounded-xl border pl-12 pr-12 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                        errors.password ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      style={{ '--tw-ring-color': '#016ab2' } as React.CSSProperties & { '--tw-ring-color': string }}
                      onFocus={(e) => { e.target.style.borderColor = '#016ab2'; e.target.style.boxShadow = '0 0 0 2px rgba(1, 106, 178, 0.2)'; }}
                      onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
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
                      className="h-4 w-4 rounded border-gray-300 disabled:opacity-50"
                      style={{ accentColor: '#016ab2' }}
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
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-semibold !text-white shadow-lg transition-all duration-200 ${
                      loading
                        ? "cursor-not-allowed opacity-60"
                        : "hover:shadow-xl transform hover:-translate-y-0.5"
                    }`}
                    style={loading ? {} : { background: 'linear-gradient(to right, #016ab2, #063f6f)' }}
                    onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = '0.9'; }}
                    onMouseLeave={(e) => { if (!loading) e.currentTarget.style.opacity = '1'; }}
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
                    <a href="/admin/register" className="font-medium underline" style={{ color: '#016ab2' }} onMouseEnter={(e) => e.currentTarget.style.color = '#063f6f'} onMouseLeave={(e) => e.currentTarget.style.color = '#016ab2'}>
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
          © 2025 Logistiq Platform. All rights reserved.
        </div>
      </div>
    </div>
  );
}
