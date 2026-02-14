import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/policelogo.png';
import API_BASE from '../utils/api';

const UserIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const LockIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const AlertCircleIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
);

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Reset Password States
    const [isResetting, setIsResetting] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [recoveryCode, setRecoveryCode] = useState('');
    const [resetSuccess, setResetSuccess] = useState('');

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login, user } = useAuth();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate('/admin/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const minLoadTime = new Promise(resolve => setTimeout(resolve, 800));

        try {
            const [response] = await Promise.all([
                axios.post(`${API_BASE}/api/auth/login`, { email, password }),
                minLoadTime
            ]);

            const { data } = response;
            login(data.token, email);
            navigate('/admin/dashboard');
        } catch (error) {
            console.error("Login Error:", error);
            setError(error.response?.data?.message || 'Invalid email or password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setError('');
        setResetSuccess('');
        setIsLoading(true);

        try {
            await axios.post(`${API_BASE}/api/auth/reset-password`, {
                email,
                newPassword,
                secretKey: recoveryCode
            });
            setResetSuccess('Password reset successfully! You can now login.');

            // Switch back to login after a delay
            setTimeout(() => {
                setIsResetting(false);
                setPassword('');
                setResetSuccess('');
            }, 2000);

        } catch (error) {
            setError(error.response?.data?.message || 'Reset failed. Check your recovery code.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-rose-50 to-pink-100">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]" />
                <div className="absolute bottom-[0%] right-[0%] w-[40%] h-[60%] rounded-full bg-purple-600/10 blur-[100px]" />
            </div>

            {/* Main Card */}
            <div className="relative z-10 w-full max-w-md mx-4">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/20 backdrop-blur-xl">

                    {/* Header Section */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 pt-10 text-center relative">
                        <div className="inline-flex p-3 bg-white rounded-2xl shadow-lg mb-4">
                            <img className="h-12 w-12 object-contain" src={logo} alt="Logo" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                            {isResetting ? 'Reset Password' : 'Admin Portal'}
                        </h2>
                        <p className="text-indigo-100/80 text-sm font-medium">
                            {isResetting ? 'Use your master recovery code' : 'Secure Access Required'}
                        </p>

                        {/* Decorative curve at bottom of header */}
                        <div className="absolute bottom-0 left-0 right-0 h-6 bg-white rounded-t-[24px] translate-y-4"></div>
                    </div>

                    {/* Form Section */}
                    <div className="px-8 pb-8 pt-6 bg-white">
                        <form className="space-y-5" onSubmit={isResetting ? handleReset : handleSubmit}>
                            {error && (
                                <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100 animate-slidedown">
                                    <AlertCircleIcon className="w-5 h-5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}
                            {resetSuccess && (
                                <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 rounded-lg border border-green-100 animate-slidedown">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                    <span>{resetSuccess}</span>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700 ml-1">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                        <UserIcon className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {!isResetting ? (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700 ml-1">
                                            Password
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                                <LockIcon className="h-5 w-5" />
                                            </div>
                                            <input
                                                type="password"
                                                required
                                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                                                placeholder="Enter your password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:-translate-y-0.5 ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}`}
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                <span>Signing in...</span>
                                            </div>
                                        ) : (
                                            'Sign In'
                                        )}
                                    </button>
                                    <div className="text-center mt-4">
                                        <a href="#" onClick={(e) => { e.preventDefault(); setIsResetting(true); setError(''); }} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                                            Forgot password?
                                        </a>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700 ml-1">
                                            New Password
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                                <LockIcon className="h-5 w-5" />
                                            </div>
                                            <input
                                                type="password"
                                                required
                                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                                                placeholder="New Password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-semibold text-gray-700 ml-1">
                                            Master Recovery Code
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                                                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                                                </svg>
                                            </div>
                                            <input
                                                type="password"
                                                required
                                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
                                                placeholder="admin_reset_code_123"
                                                value={recoveryCode}
                                                onChange={(e) => setRecoveryCode(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:-translate-y-0.5 ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}`}
                                    >
                                        {isLoading ? 'Resetting...' : 'Reset Password'}
                                    </button>
                                    <div className="text-center mt-4">
                                        <button onClick={(e) => { e.preventDefault(); setIsResetting(false); setError(''); }} className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>

                    {/* Footer Section */}

                </div>
            </div>

            <style jsx>{`
                @keyframes slidedown {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slidedown {
                    animation: slidedown 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
