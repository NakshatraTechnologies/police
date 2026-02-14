import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FormRenderer from "../components/FormRenderer";
import logo from '../assets/policelogo.png';
import { useTranslation } from 'react-i18next';
import API_BASE from '../utils/api';

export default function PublicForm() {
    const { t } = useTranslation();
    const { slug } = useParams();
    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState(null);
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const { user, logout } = useAuth();

    useEffect(() => {
        if (user && user.email) {
            setEmail(user.email);
        }
    }, [user]);

    useEffect(() => {
        axios.get(`${API_BASE}/api/public/forms/${slug}`)
            .then(res => {
                setForm(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                if (err.response && err.response.status === 403) {
                    setError(t('publicForm.inactiveMessage'));
                } else if (err.response && err.response.status === 404) {
                    setError(t('publicForm.notFound'));
                } else {
                    setError(t('publicForm.errorLoad'));
                }
                setLoading(false);
            });
    }, [slug, t]);

    useEffect(() => {
        const hasSubmitted = localStorage.getItem(`submitted_${form?._id}`);
        if (hasSubmitted && form?.limitOneResponse) {
            // We can check this here if form is loaded, or rely on backend error
        }
    }, [form]);

    const handleFormSubmit = async (answers) => {
        if (form.collectEmails && !email) {
            alert(t('publicForm.emailRequired'));
            return;
        }

        // Optimistic check
        // If we collect emails, do NOT block using local storage immediately on submit attempt of a DIFFERENT email.
        // We only block if we are NOT collecting emails (IP/Device mode) OR if we want to be strict.
        // But since we want to allow "switch account", we shouldn't block purely based on device flag if the email might be different.
        if (form.limitOneResponse && !form.collectEmails && localStorage.getItem(`submitted_${form._id}`)) {
            setError(t('publicForm.alreadySubmitted'));
            return;
        }

        try {
            const formData = new FormData();
            if (form.collectEmails) {
                formData.append('email', email);
                formData.append('name', name);
            }

            const answersPayload = { ...answers };
            Object.keys(answers).forEach(key => {
                if (answers[key] instanceof File) {
                    formData.append(key, answers[key]);
                    delete answersPayload[key];
                }
            });

            formData.append('answers', JSON.stringify(answersPayload));

            await axios.post(`${API_BASE}/api/public/forms/${slug}/submit`, formData);

            if (form.limitOneResponse) {
                localStorage.setItem(`submitted_${form._id}`, 'true');
            }
            setSubmitted(true);
        } catch (err) {
            if (err.response && err.response.status === 409) {
                setError(err.response.data.message || t('publicForm.alreadySubmitted'));
                if (form?._id && form?.limitOneResponse) localStorage.setItem(`submitted_${form._id}`, 'true');
            } else {
                alert(t('publicForm.errorSubmit'));
            }
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center border-t-4 border-red-500">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">{t('publicForm.unavailable')}</h3>
                <p className="text-gray-600">{error}</p>
            </div>
        </div>
    );

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-indigo-600/5 blur-[100px]" />
                    <div className="absolute bottom-[0%] right-[0%] w-[40%] h-[40%] rounded-full bg-green-600/5 blur-[100px]" />
                </div>

                <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl p-10 text-center relative z-10 border border-white/50 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
                    <div className="flex flex-col items-center">
                        <div className="mb-6 p-3 bg-white rounded-full shadow-lg ring-1 ring-gray-100">
                            <img className="h-20 w-auto object-contain" src={logo} alt="Logo" />
                        </div>

                        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6 animate-bounce-slow">
                            <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h2 className="text-3xl font-extrabold text-gray-900 mb-3 tracking-tight">{t('publicForm.thankYou')}</h2>
                        <p className="text-gray-600 text-lg leading-relaxed">{t('publicForm.recorded')}</p>


                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto bg-white shadow sm:rounded-lg overflow-hidden">
                <div className="px-6 py-8 sm:px-10 bg-indigo-600 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="bg-white p-2 rounded-xl mb-4 shadow-lg">
                            <img className="h-14 w-auto object-contain" src={logo} alt="Maharashtra Police Logo" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">{t(form.title)}</h1>
                        {form.description && (
                            <p className="mt-2 max-w-xl text-sm text-indigo-100">{t(form.description)}</p>
                        )}
                    </div>
                    {form.isAnonymous && (
                        <div className="mt-4 flex justify-center">
                            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white border border-white/20">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                                {t('publicForm.anonymous')}
                            </div>
                        </div>
                    )}
                </div>
                <div className="px-4 py-5 sm:p-6">
                    {form.collectEmails && (
                        <div className="mb-6 space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('publicForm.fullName')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder={t('publicForm.namePlaceholder')}
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('publicForm.email')} <span className="text-red-500">*</span>
                                </label>
                                {user && user.email === email ? (
                                    <div className="text-sm text-gray-600 mb-2">
                                        {t('publicForm.submittingAs')} <span className="font-medium text-gray-900">{email}</span>.
                                        <button
                                            onClick={() => { logout(); setEmail(""); }}
                                            className="ml-2 text-indigo-600 hover:text-indigo-500 underline"
                                        >
                                            {t('publicForm.switchAccount')}
                                        </button>
                                    </div>
                                ) : (
                                    <input
                                        type="email"
                                        id="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder={t('publicForm.emailPlaceholder')}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                    <FormRenderer formData={form} onSubmit={handleFormSubmit} />
                </div>
            </div>

            {/* Footer Section */}
            <div className="text-center mt-8 pb-6">
                <p className="text-sm text-gray-500 font-medium opacity-80">
                    &copy; {new Date().getFullYear()} {t('publicForm.footer')}
                </p>
            </div>
        </div>
    );
}
