import React from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../utils/AuthContext';
import { Building2, Loader2, ArrowLeft, Mail } from 'lucide-react';

const ForgotPassword = () => {
  const { forgotPassword, loading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    await forgotPassword(data.email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-construction-green to-primary-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center">
            <Building2 className="h-10 w-10 text-construction-green" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Forgot Password
          </h2>
          <p className="mt-2 text-sm text-green-100">
            Enter your email address and we'll send you a link to reset your password
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                <Mail className="inline h-4 w-4 mr-1" />
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`form-input ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter your email address"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-construction-green hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-construction-green disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                    Sending reset link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium text-construction-green hover:text-green-700 transition duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>

        {/* Additional Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            <strong>Note:</strong> If you don't receive an email within a few minutes, please check your spam folder or contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
