import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../utils/AuthContext';
import { Eye, EyeOff, Building2, Loader2 } from 'lucide-react';

// One button per canonical role. Password convention is <username>123.
// The color palette is applied round-robin — no per-role semantics.
const QUICK_ROLES = [
  { username: 'admin',               label: 'Admin' },
  { username: 'crm',                 label: 'CRM' },
  { username: 'sales',               label: 'Sales' },
  { username: 'architect',           label: 'Architect' },
  { username: 'designer',            label: 'Designer' },
  { username: 'client',              label: 'Client' },
  { username: 'sourcing',            label: 'Sourcing' },
  { username: 'procurement',         label: 'Procurement' },
  { username: 'vendor_onboarding',   label: 'Vendor Onboarding' },
  { username: 'finance',             label: 'Finance' },
  { username: 'finance_assistant',   label: 'Fin. Assistant' },
  { username: 'vendor',              label: 'Vendor' },
  { username: 'manager',             label: 'Manager' },
  { username: 'execution_engineer',  label: 'Exec. Engineer' },
  { username: 'structural_engineer', label: 'Struct. Engineer' },
  { username: 'ep',                  label: 'E&P' },
  { username: 'dispatch',            label: 'Dispatch' },
  { username: 'project_manager',     label: 'Project Manager' },
  { username: 'marketing',           label: 'Marketing' },
  { username: 'inventory',           label: 'Inventory' },
  { username: 'lms',                 label: 'LMS' },
  { username: 'hr',                  label: 'HR' },
];

const CHIP_COLORS = [
  'border-purple-400  text-purple-700  hover:bg-purple-50',
  'border-emerald-400 text-emerald-700 hover:bg-emerald-50',
  'border-sky-400     text-sky-700     hover:bg-sky-50',
  'border-orange-400  text-orange-700  hover:bg-orange-50',
  'border-pink-400    text-pink-700    hover:bg-pink-50',
  'border-teal-400    text-teal-700    hover:bg-teal-50',
  'border-amber-400   text-amber-700   hover:bg-amber-50',
  'border-slate-500   text-slate-800   hover:bg-slate-50',
];

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [quickLoading, setQuickLoading] = useState(null);
  const { login, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // ✅ ALWAYS call useForm at the top level (before any returns)
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const quickLogin = async (username) => {
    setQuickLoading(username);
    setValue('username', username);
    setValue('password', `${username}123`);
    const result = await login({ username, password: `${username}123` });
    if (result.success) {
      navigate(from, { replace: true });
    }
    setQuickLoading(null);
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const onSubmit = async (data) => {
    const result = await login(data);
    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-800 to-blue-600">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-800 to-blue-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center">
            <Building2 className="h-10 w-10 text-blue-800" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Construction Manager
          </h2>
          <p className="mt-2 text-sm text-blue-100">
            Sign in to your account to continue
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  className={`form-input ${errors.username ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter your username"
                  {...register('username', {
                    required: 'Username is required',
                    minLength: {
                      value: 3,
                      message: 'Username must be at least 3 characters',
                    },
                  })}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`form-input pr-10 ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter your password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-800 focus:ring-blue-800 border-gray-300 rounded"
                  {...register('rememberMe')}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-blue-800 hover:text-blue-700 transition duration-200"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-800 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          {/* --- Quick Login (dev/demo shortcut) --- */}
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs uppercase tracking-wide text-slate-400">Quick Login</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {QUICK_ROLES.map((r, i) => {
                const busy = quickLoading === r.username;
                const color = CHIP_COLORS[i % CHIP_COLORS.length];
                return (
                  <button
                    key={r.username}
                    type="button"
                    onClick={() => quickLogin(r.username)}
                    disabled={loading || !!quickLoading}
                    title={`${r.username} / ${r.username}123`}
                    className={`text-xs font-medium py-1.5 px-2 rounded-md border-2 bg-white transition disabled:opacity-40 disabled:cursor-not-allowed ${color}`}
                  >
                    {busy ? <Loader2 className="animate-spin mx-auto h-4 w-4" /> : r.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-4 text-center text-xs text-slate-400">
              Password format: <code className="font-mono text-slate-500">&lt;username&gt;123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
