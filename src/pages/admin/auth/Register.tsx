import React, { useEffect, useState } from "react";
import { Truck, MapPin, Users, Shield, CheckCircle, Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, Phone, Building2, FileCheck, HeartPulse, ChevronDown, ChevronUp } from "lucide-react";
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
  const [showMoreFeatures, setShowMoreFeatures] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4 py-8" style={{ fontFamily: 'var(--font-poppins)', fontSize: 'calc(1rem * 0.98)' }}>
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-6xl relative">
        {/* Success Notification */}
        {saved && (
          <div className="fixed top-6 right-6 bg-white border-l-4 border-emerald-500 text-gray-800 px-5 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-slide-in z-50">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">Success!</p>
              <p className="text-xs text-gray-600">Account created. Redirecting...</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Left Side - Branding & Features (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Logo & Header */}
            <div className="text-center lg:text-left">
              <img src={Logo} alt="FleetGo Logo" className="w-32 h-auto mb-6 mx-auto lg:mx-0" style={{ width: 'calc(8rem * 0.98)', marginBottom: 'calc(1.5rem * 0.98)' }} />
              
              {/* Highlighted 7-day free trial badge */}
              <div className="mb-4 flex items-center justify-center lg:justify-start">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white shadow-md" style={{ backgroundColor: '#42aeec', fontSize: 'calc(0.875rem * 0.98)' }}>
                  <CheckCircle className="w-4 h-4" style={{ width: 'calc(1rem * 0.98)', height: 'calc(1rem * 0.98)' }} />
                  7-Day Free Trial
                </span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold mb-3 leading-tight" style={{ 
                fontFamily: 'sans-serif', 
                fontSize: 'calc(1.875rem * 0.98)',
                background: 'linear-gradient(135deg, #1e3a5f 0%, #42aeec 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Start Your Free Trial
              </h1>
              <p className="text-base text-gray-600 leading-relaxed" style={{ fontSize: 'calc(1rem * 0.98)' }}>
                Join thousands of companies managing their fleet operations efficiently with Logistiq Platform.
              </p>
            </div>

            {/* Key Benefits */}
            <div className="space-y-4 bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50" style={{ padding: 'calc(1.5rem * 0.98)' }}>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4" style={{ fontSize: 'calc(0.875rem * 0.98)' }}>What's Included</h3>
              
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#42aeec', width: 'calc(2.5rem * 0.98)', height: 'calc(2.5rem * 0.98)' }}>
                  <Truck className="w-5 h-5 text-white" style={{ width: 'calc(1.25rem * 0.98)', height: 'calc(1.25rem * 0.98)' }} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1" style={{ fontSize: 'calc(0.875rem * 0.98)' }}>Fleet Management</h4>
                  <p className="text-xs text-gray-600 leading-relaxed" style={{ fontSize: 'calc(0.75rem * 0.98)' }}>Real-time vehicle tracking and comprehensive fleet oversight</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#42aeec', width: 'calc(2.5rem * 0.98)', height: 'calc(2.5rem * 0.98)' }}>
                  <MapPin className="w-5 h-5 text-white" style={{ width: 'calc(1.25rem * 0.98)', height: 'calc(1.25rem * 0.98)' }} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1" style={{ fontSize: 'calc(0.875rem * 0.98)' }}>Route Optimization</h4>
                  <p className="text-xs text-gray-600 leading-relaxed" style={{ fontSize: 'calc(0.75rem * 0.98)' }}>AI-powered route planning to reduce costs and improve efficiency</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#42aeec', width: 'calc(2.5rem * 0.98)', height: 'calc(2.5rem * 0.98)' }}>
                  <Users className="w-5 h-5 text-white" style={{ width: 'calc(1.25rem * 0.98)', height: 'calc(1.25rem * 0.98)' }} />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-1" style={{ fontSize: 'calc(0.875rem * 0.98)' }}>Team Collaboration</h4>
                  <p className="text-xs text-gray-600 leading-relaxed" style={{ fontSize: 'calc(0.75rem * 0.98)' }}>Seamless communication and coordination across your organization</p>
                </div>
              </div>

              {/* Additional Features - Shown when "View More" is clicked */}
              {showMoreFeatures && (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#42aeec', width: 'calc(2.5rem * 0.98)', height: 'calc(2.5rem * 0.98)' }}>
                      <FileCheck className="w-5 h-5 text-white" style={{ width: 'calc(1.25rem * 0.98)', height: 'calc(1.25rem * 0.98)' }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1" style={{ fontSize: 'calc(0.875rem * 0.98)' }}>Compliance Management</h4>
                      <p className="text-xs text-gray-600 leading-relaxed" style={{ fontSize: 'calc(0.75rem * 0.98)' }}>Track regulatory compliance, certifications, and audit requirements</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#42aeec', width: 'calc(2.5rem * 0.98)', height: 'calc(2.5rem * 0.98)' }}>
                      <HeartPulse className="w-5 h-5 text-white" style={{ width: 'calc(1.25rem * 0.98)', height: 'calc(1.25rem * 0.98)' }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1" style={{ fontSize: 'calc(0.875rem * 0.98)' }}>Health & Safety Management</h4>
                      <p className="text-xs text-gray-600 leading-relaxed" style={{ fontSize: 'calc(0.75rem * 0.98)' }}>Manage safety protocols, incident reporting, and health compliance</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#42aeec', width: 'calc(2.5rem * 0.98)', height: 'calc(2.5rem * 0.98)' }}>
                      <Shield className="w-5 h-5 text-white" style={{ width: 'calc(1.25rem * 0.98)', height: 'calc(1.25rem * 0.98)' }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1" style={{ fontSize: 'calc(0.875rem * 0.98)' }}>Security & Access Control</h4>
                      <p className="text-xs text-gray-600 leading-relaxed" style={{ fontSize: 'calc(0.75rem * 0.98)' }}>Enterprise-grade security with role-based access control</p>
                    </div>
                  </div>
                </>
              )}

              {/* View More Button */}
              <button
                type="button"
                onClick={() => setShowMoreFeatures(!showMoreFeatures)}
                className="w-full flex items-center justify-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors pt-2 border-t border-gray-200"
                style={{ fontSize: 'calc(0.875rem * 0.98)', color: '#42aeec' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#2e9cd9'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#42aeec'}
              >
                {showMoreFeatures ? (
                  <>
                    View Less
                    <ChevronUp className="w-4 h-4" style={{ width: 'calc(1rem * 0.98)', height: 'calc(1rem * 0.98)' }} />
                  </>
                ) : (
                  <>
                    View More
                    <ChevronDown className="w-4 h-4" style={{ width: 'calc(1rem * 0.98)', height: 'calc(1rem * 0.98)' }} />
                  </>
                )}
              </button>
            </div>

            {/* Trial Info */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100" style={{ padding: 'calc(1rem * 0.98)' }}>
              <p className="text-xs text-gray-700 leading-relaxed flex items-center gap-2" style={{ fontSize: 'calc(0.75rem * 0.98)' }}>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-white" style={{ backgroundColor: '#42aeec', fontSize: 'calc(0.75rem * 0.98)' }}>
                
                  <span>7-Day Free Trial</span>
                </span>
                <span className="text-gray-600">No credit card required</span>
              </p>
            </div>
          </div>

          {/* Right Side - Registration Form (3 columns) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
              {/* Form Header */}
              <div className="px-8 pt-6 border-b border-gray-100" style={{ paddingLeft: 'calc(2rem * 0.98)', paddingRight: 'calc(2rem * 0.98)', paddingTop: 'calc(1.5rem * 0.98)' }}>
                <h2 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'sans-serif', fontSize: 'calc(1.5rem * 0.98)' }}>Create Account</h2>
                <p className="text-sm text-gray-600" style={{ fontSize: 'calc(0.875rem * 0.98)' }}>Set up your admin profile to get started</p>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="p-8" style={{ padding: 'calc(2rem * 0.98)' }}>
                <div className="space-y-6" style={{ gap: 'calc(1.5rem * 0.98)' }}>
                  {/* Personal Information Section */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4" style={{ fontSize: 'calc(0.75rem * 0.98)', marginBottom: 'calc(1rem * 0.98)' }}>Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700" style={{ fontSize: 'calc(0.875rem * 1.005)' }}>Full Name *</label>
                        <div className="relative">
                          <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" style={{ width: 'calc(1rem * 1.005)', height: 'calc(1rem * 1.005)' }} />
                          <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`block w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent ${
                              errors.name ? "border-red-400 bg-red-50 focus:ring-red-200" : "border-gray-300 hover:border-gray-400 focus:ring-blue-200"
                            }`}
                            style={{ '--tw-ring-color': 'rgba(66, 174, 236, 0.3)', fontSize: 'calc(0.875rem * 1.005)', paddingTop: 'calc(0.625rem * 1.005)', paddingBottom: 'calc(0.625rem * 1.005)' } as React.CSSProperties}
                            placeholder="John Doe"
                          />
                        </div>
                        {errors.name && <p className="text-xs text-red-600 mt-1" style={{ fontSize: 'calc(0.75rem * 1.005)' }}>{errors.name}</p>}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700" style={{ fontSize: 'calc(0.875rem * 1.005)' }}>Email Address *</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" style={{ width: 'calc(1rem * 1.005)', height: 'calc(1rem * 1.005)' }} />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`block w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent ${
                              errors.email ? "border-red-400 bg-red-50 focus:ring-red-200" : "border-gray-300 hover:border-gray-400 focus:ring-blue-200"
                            }`}
                            style={{ '--tw-ring-color': 'rgba(66, 174, 236, 0.3)', fontSize: 'calc(0.875rem * 1.005)', paddingTop: 'calc(0.625rem * 1.005)', paddingBottom: 'calc(0.625rem * 1.005)' } as React.CSSProperties}
                            placeholder="john@company.com"
                          />
                        </div>
                        {errors.email && <p className="text-xs text-red-600 mt-1" style={{ fontSize: 'calc(0.75rem * 1.005)' }}>{errors.email}</p>}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <label className="block text-sm font-medium text-gray-700" style={{ fontSize: 'calc(0.875rem * 1.005)' }}>Phone Number (Optional)</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" style={{ width: 'calc(1rem * 1.005)', height: 'calc(1rem * 1.005)' }} />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="block w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent hover:border-gray-400 focus:ring-blue-200"
                          style={{ '--tw-ring-color': 'rgba(66, 174, 236, 0.3)', fontSize: 'calc(0.875rem * 1.005)', paddingTop: 'calc(0.625rem * 1.005)', paddingBottom: 'calc(0.625rem * 1.005)' } as React.CSSProperties}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location Information Section */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4" style={{ fontSize: 'calc(0.75rem * 0.98)', marginBottom: 'calc(1rem * 0.98)' }}>Location (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700" style={{ fontSize: 'calc(0.875rem * 1.005)' }}>Country</label>
                        <input
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent hover:border-gray-400 focus:ring-blue-200"
                          style={{ '--tw-ring-color': 'rgba(66, 174, 236, 0.3)', fontSize: 'calc(0.875rem * 1.005)', paddingTop: 'calc(0.625rem * 1.005)', paddingBottom: 'calc(0.625rem * 1.005)' } as React.CSSProperties}
                          placeholder="United States"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700" style={{ fontSize: 'calc(0.875rem * 1.005)' }}>State</label>
                        <input
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                          className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent hover:border-gray-400 focus:ring-blue-200"
                          style={{ '--tw-ring-color': 'rgba(66, 174, 236, 0.3)', fontSize: 'calc(0.875rem * 1.005)', paddingTop: 'calc(0.625rem * 1.005)', paddingBottom: 'calc(0.625rem * 1.005)' } as React.CSSProperties}
                          placeholder="California"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700" style={{ fontSize: 'calc(0.875rem * 1.005)' }}>City</label>
                        <input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent hover:border-gray-400 focus:ring-blue-200"
                          style={{ '--tw-ring-color': 'rgba(66, 174, 236, 0.3)', fontSize: 'calc(0.875rem * 1.005)', paddingTop: 'calc(0.625rem * 1.005)', paddingBottom: 'calc(0.625rem * 1.005)' } as React.CSSProperties}
                          placeholder="Los Angeles"
                        />
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <label className="block text-sm font-medium text-gray-700" style={{ fontSize: 'calc(0.875rem * 1.005)' }}>Street Address</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" style={{ width: 'calc(1rem * 1.005)', height: 'calc(1rem * 1.005)' }} />
                        <input
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="block w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent hover:border-gray-400 focus:ring-blue-200"
                          style={{ '--tw-ring-color': 'rgba(66, 174, 236, 0.3)', fontSize: 'calc(0.875rem * 1.005)', paddingTop: 'calc(0.625rem * 1.005)', paddingBottom: 'calc(0.625rem * 1.005)' } as React.CSSProperties}
                          placeholder="123 Main Street"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Security Section */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4" style={{ fontSize: 'calc(0.75rem * 0.98)', marginBottom: 'calc(1rem * 0.98)' }}>Security</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700" style={{ fontSize: 'calc(0.875rem * 1.005)' }}>Password *</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" style={{ width: 'calc(1rem * 1.005)', height: 'calc(1rem * 1.005)' }} />
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`block w-full rounded-lg border pl-10 pr-10 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent ${
                              errors.password ? "border-red-400 bg-red-50 focus:ring-red-200" : "border-gray-300 hover:border-gray-400 focus:ring-blue-200"
                            }`}
                            style={{ '--tw-ring-color': 'rgba(66, 174, 236, 0.3)', fontSize: 'calc(0.875rem * 1.005)', paddingTop: 'calc(0.625rem * 1.005)', paddingBottom: 'calc(0.625rem * 1.005)' } as React.CSSProperties}
                            placeholder="Create strong password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" style={{ width: 'calc(1rem * 1.005)', height: 'calc(1rem * 1.005)' }} /> : <Eye className="w-4 h-4" style={{ width: 'calc(1rem * 1.005)', height: 'calc(1rem * 1.005)' }} />}
                          </button>
                        </div>
                        
                        {/* Password Strength */}
                        {password && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength().color} ${passwordStrength().width}`}></div>
                              </div>
                              <span className="text-xs font-medium text-gray-600 min-w-[60px] text-right" style={{ fontSize: 'calc(0.75rem * 1.005)' }}>{passwordStrength().label}</span>
                            </div>
                            <p className="text-xs text-gray-500" style={{ fontSize: 'calc(0.75rem * 1.005)' }}>Use 12+ characters with uppercase, numbers, and symbols</p>
                          </div>
                        )}
                        {errors.password && <p className="text-xs text-red-600 mt-1" style={{ fontSize: 'calc(0.75rem * 1.005)' }}>{errors.password}</p>}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700" style={{ fontSize: 'calc(0.875rem * 1.005)' }}>Confirm Password *</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" style={{ width: 'calc(1rem * 1.005)', height: 'calc(1rem * 1.005)' }} />
                          <input
                            type={showConfirm ? "text" : "password"}
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            className={`block w-full rounded-lg border pl-10 pr-10 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:border-transparent ${
                              errors.confirm ? "border-red-400 bg-red-50 focus:ring-red-200" : "border-gray-300 hover:border-gray-400 focus:ring-blue-200"
                            }`}
                            style={{ '--tw-ring-color': 'rgba(66, 174, 236, 0.3)', fontSize: 'calc(0.875rem * 1.005)', paddingTop: 'calc(0.625rem * 1.005)', paddingBottom: 'calc(0.625rem * 1.005)' } as React.CSSProperties}
                            placeholder="Re-enter password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirm ? <EyeOff className="w-4 h-4" style={{ width: 'calc(1rem * 1.005)', height: 'calc(1rem * 1.005)' }} /> : <Eye className="w-4 h-4" style={{ width: 'calc(1rem * 1.005)', height: 'calc(1rem * 1.005)' }} />}
                          </button>
                        </div>
                        {errors.confirm && <p className="text-xs text-red-600 mt-1" style={{ fontSize: 'calc(0.75rem * 1.005)' }}>{errors.confirm}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Terms & Submit */}
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <div className="flex items-start gap-3">
                      <input
                        id="terms"
                        type="checkbox"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                        className={`mt-1 h-4 w-4 rounded border-gray-300 ${
                          errors.agree ? "border-red-400" : ""
                        }`}
                        style={{ accentColor: '#42aeec' }}
                      />
                      <label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed" style={{ fontSize: 'calc(0.875rem * 1.005)' }}>
                        I agree to the{" "}
                        <a className="font-medium underline hover:no-underline" href="#" style={{ color: '#42aeec' }}>
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a className="font-medium underline hover:no-underline" href="#" style={{ color: '#42aeec' }}>
                          Privacy Policy
                        </a>
                      </label>
                    </div>
                    {errors.agree && <p className="text-xs text-red-600 ml-7" style={{ fontSize: 'calc(0.75rem * 1.005)' }}>{errors.agree}</p>}

                    {errors.submit && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2" style={{ padding: 'calc(0.75rem * 0.98)' }}>
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" style={{ width: 'calc(1rem * 0.98)', height: 'calc(1rem * 0.98)' }} />
                        <p className="text-sm text-red-600" style={{ fontSize: 'calc(0.875rem * 0.98)' }}>{errors.submit}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold !text-white shadow-md transition-all duration-200 ${
                        loading 
                          ? "cursor-not-allowed opacity-60" 
                          : "hover:shadow-lg transform hover:-translate-y-0.5"
                      }`}
                      style={loading ? { backgroundColor: '#42aeec', opacity: 0.6, fontSize: 'calc(0.875rem * 0.98)', paddingTop: 'calc(0.75rem * 0.98)', paddingBottom: 'calc(0.75rem * 0.98)' } : { backgroundColor: '#42aeec', fontSize: 'calc(0.875rem * 0.98)', paddingTop: 'calc(0.75rem * 0.98)', paddingBottom: 'calc(0.75rem * 0.98)' }}
                      onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#2e9cd9'; }}
                      onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#42aeec'; }}
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" style={{ width: 'calc(1.25rem * 0.98)', height: 'calc(1.25rem * 0.98)' }}></div>
                          Creating Your Account...
                        </>
                      ) : (
                        <>
                          Create Account & Start Trial
                          <ArrowRight className="w-4 h-4" style={{ width: 'calc(1rem * 0.98)', height: 'calc(1rem * 0.98)' }} />
                        </>
                      )}
                    </button>

                    <p className="text-center text-sm text-gray-600 !mt-2" style={{ fontSize: 'calc(0.875rem * 0.98)' }}>
                      Already have an account?{" "}
                      <Link to="/" className="font-semibold underline hover:no-underline" style={{ color: '#42aeec' }}>
                        Sign in
                      </Link>
                    </p>
                  </div>
                </div>
              </form>
            </div>

        
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500" style={{ marginTop: 'calc(3rem * 0.98)', fontSize: 'calc(0.875rem * 0.98)' }}>
          <p>© {new Date().getFullYear()} Logistiq Innovation Platform. All rights reserved.</p>
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