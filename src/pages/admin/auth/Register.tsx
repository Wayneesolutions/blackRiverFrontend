import React, { useEffect, useState } from "react";
import { Truck, MapPin, Users, Shield, CheckCircle, Eye, EyeOff } from "lucide-react";
import { registerAdmin } from "../../../axios/api/auth";
import { useNavigate, Link } from "react-router-dom";
import { message } from 'antd';
import Logo from "../../../assets/FleetGo.png"

export default function RegistrationPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const navigate = useNavigate();

  useEffect(() => {
    if (saved) {
      const t = window.setTimeout(() => {
        setSaved(false);
        navigate('/');
      }, 2000);
      return () => window.clearTimeout(t);
    }
  }, [saved, navigate]);

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Full name is required.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Enter a valid email.";
    if (password.length < 8) e.password = "Password must be at least 8 characters.";
    if (confirm !== password) e.confirm = "Passwords do not match.";
    if (!agree) e.agree = "You must accept the terms.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function passwordStrength() {
    if (password.length >= 12 && /[A-Z]/.test(password) && /[^A-Za-z0-9]/.test(password))
      return { label: "Strong", color: "bg-emerald-500", width: "w-full" };
    if (password.length >= 9) return { label: "Medium", color: "bg-yellow-400", width: "w-2/3" };
    if (password.length > 0) return { label: "Weak", color: "bg-red-400", width: "w-1/3" };
    return { label: "", color: "", width: "w-0" };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const payload = {
        name,
        email,
        password,
        phone: phone || undefined,
        country: country || undefined,
        state: state || undefined,
        city: city || undefined,
        address: address || undefined,
      };

      const response = await registerAdmin(payload);
      
      if (response && response.success === true) {
        setSaved(true);
        message.success({
          content: response.message || 'Account created successfully! Your 7-day free trial has started.',
          duration: 5,
        });
      } else {
        const errorMessage = response?.message || "Registration failed. Please try again.";
        setErrors({ submit: errorMessage });
        message.error(errorMessage);
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err?.response?.data?.message || err?.message || "Unexpected error, try again.";
      setErrors({ submit: errorMessage });
      message.error(errorMessage);
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

      <div className="w-full max-w-4xl relative">
        {/* Success Message */}
        {saved && (
          <div className="fixed top-6 right-6 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in z-50">
            <CheckCircle className="w-5 h-5" />
            Account created successfully! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="rounded-3xl shadow-2xl bg-white overflow-hidden">
            {/* Header */}
            <div className="relative bg-white p-8 text-center">
              <div className="relative">
                <div className="flex items-center justify-center gap-3 mb-4">
               
                  <img src={Logo} alt="Logo" className="w-40 h-auto" />
              
                </div>
                <p className="text-black max-w-md mx-auto">
                  Create your admin account and start your 7-day free trial
                </p>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`block w-full rounded-xl border px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        errors.name ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && <div className="text-xs text-red-500 flex items-center gap-1">{errors.name}</div>}
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                  Contact Details
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Email Address *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`block w-full rounded-xl border px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                        errors.email ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                      placeholder="you@company.com"
                    />
                    {errors.email && <div className="text-xs text-red-500">{errors.email}</div>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                {/* Location Fields */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300"
                      placeholder="Country (optional)"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <input
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300"
                      placeholder="State (optional)"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300"
                      placeholder="City (optional)"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-gray-300"
                    placeholder="Street address (optional)"
                  />
                </div>
              </div>

              {/* Security Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  Security
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`block w-full rounded-xl border px-4 py-3 pr-12 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                          errors.password ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"
                        }`}
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {password && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full transition-all duration-300 ${passwordStrength().color} ${passwordStrength().width}`}></div>
                          </div>
                          <span className="text-xs font-medium text-gray-600">{passwordStrength().label}</span>
                        </div>
                      </div>
                    )}
                    {errors.password && <div className="text-xs text-red-500">{errors.password}</div>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className={`block w-full rounded-xl border px-4 py-3 pr-12 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                          errors.confirm ? "border-red-400 bg-red-50" : "border-gray-200 hover:border-gray-300"
                        }`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirm && <div className="text-xs text-red-500">{errors.confirm}</div>}
                  </div>
                </div>
              </div>

              {/* Terms and Submit */}
              <div className="space-y-6 pt-4 border-t border-gray-100">
                <div className="flex items-start gap-3">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className={`mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 ${
                      errors.agree ? "border-red-400" : ""
                    }`}
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                    I agree to the{" "}
                    <a className="text-indigo-600 hover:text-indigo-700 underline font-medium" href="#">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a className="text-indigo-600 hover:text-indigo-700 underline font-medium" href="#">
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {errors.agree && <div className="text-xs text-red-500 ml-7">{errors.agree}</div>}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-500">
                    Already have an account?{" "}
                    <Link to="/" className="text-indigo-600 hover:text-indigo-700 underline font-medium">
                      Sign in here
                    </Link>
                  </div>

                  <div className="flex items-center gap-4">
                    {errors.submit && <div className="text-sm text-red-500">{errors.submit}</div>}
                    <button
                      type="submit"
                      disabled={loading}
                      className={`inline-flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold !text-white shadow-lg transition-all duration-200 ${
                        loading 
                          ? "bg-indigo-400 cursor-not-allowed" 
                          : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transform hover:-translate-y-0.5"
                      }`}
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <Truck className="w-4 h-4" />
                          Create Admin Account
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          © 2025 Logistiq Platform. All rights reserved.
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