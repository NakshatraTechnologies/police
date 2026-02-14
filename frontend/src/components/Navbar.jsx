import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import logo from '../assets/policelogo.png';

export default function Navbar() {
    const { user } = useAuth();
    const { t, i18n } = useTranslation();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const toggleLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <nav className="bg-white shadow print:hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="flex items-center text-lg sm:text-xl font-bold text-indigo-600">
                            <img className="h-10 w-auto mr-2" src={logo} alt="Logo" />
                            {t('navbar.title')}
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-8">
                        <div className="flex items-center bg-gray-100 rounded-lg p-1 mr-4">
                            <button
                                onClick={() => toggleLanguage('en')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${i18n.language === 'en' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => toggleLanguage('mr')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${i18n.language === 'mr' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                मराठी
                            </button>
                        </div>
                        {user && (
                            <span className="text-gray-700 font-medium px-3 py-2 text-sm">
                                Welcome, <span className="text-indigo-600 font-bold">{user.email?.split('@')[0] || 'User'}</span>
                            </span>
                        )}

                    </div>

                    {/* Mobile Menu Button */}
                    <div className="-mr-2 flex items-center sm:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            type="button"
                            className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            aria-controls="mobile-menu"
                            aria-expanded="false"
                        >
                            <span className="sr-only">Open main menu</span>
                            {!isMobileMenuOpen ? (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            ) : (
                                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="sm:hidden" id="mobile-menu">
                    <div className="pt-2 pb-3 space-y-1">
                        {user && (
                            <div className="bg-indigo-50 border-indigo-500 text-indigo-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
                                Welcome, {user.email?.split('@')[0] || 'User'}
                            </div>
                        )}

                    </div>
                </div>
            )}
        </nav>
    );
}
