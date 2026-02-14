import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../utils/api';
import QRCode from "react-qr-code";
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { token, logout } = useAuth();
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showShareModal, setShowShareModal] = useState(null);
    const [filter, setFilter] = useState(localStorage.getItem('dashboardFilter') || 'all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        localStorage.setItem('dashboardFilter', filter);
    }, [filter]);

    useEffect(() => {
        fetchForms();
    }, []);

    const fetchForms = async () => {
        try {
            if (!token) return navigate('/login');

            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get(`${API_BASE}/api/forms`, config);
            setForms(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching forms", error);
            setLoading(false);
        }
    };

    const deleteForm = async (id) => {
        if (!window.confirm(t('dashboard.confirmAction'))) return;
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`${API_BASE}/api/forms/${id}`, config);
            fetchForms();
        } catch (error) {
            alert(t('dashboard.errorDelete'));
        }
    }

    const duplicateForm = async (id) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`${API_BASE}/api/forms/${id}/duplicate`, {}, config);
            fetchForms();
            alert(t('dashboard.duplicateSuccess'));
        } catch (error) {
            console.error("Error duplicating form", error);
            alert(t('dashboard.errorDuplicate'));
        }
    };

    const toggleStatus = async (form) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const updatedForm = { ...form, isActive: !form.isActive };
            await axios.put(`${API_BASE}/api/forms/${form._id}`, updatedForm, config);
            fetchForms();
        } catch (error) {
            console.error("Error updating form status", error);
            alert(t('dashboard.errorStatus'));
        }
    };

    const toggleFavorite = async (form) => {
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const newStatus = !form.isFavorite;

            // Optimistic update
            setForms(currentForms =>
                currentForms.map(f => f._id === form._id ? { ...f, isFavorite: newStatus } : f)
            );

            await axios.put(`${API_BASE}/api/forms/${form._id}`, { isFavorite: newStatus }, config);
            // No need to fetchForms() immediately if optimistic update works, 
            // but fetching ensures consistency. We can debounce it or leave it.
            // fetchForms(); 
        } catch (error) {
            console.error("Error updating favorite status", error);
            alert(t('dashboard.errorFavorite'));
            fetchForms(); // Revert on error
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toMarathiDigits = (num) => {
        if (num === undefined || num === null) return '';
        if (i18n.language !== 'mr') return num.toString();
        const marathiMap = { '0': '०', '1': '१', '2': '२', '3': '३', '4': '४', '5': '५', '6': '६', '7': '७', '8': '८', '9': '९' };
        return num.toString().split('').map(char => marathiMap[char] || char).join('');
    };

    const getPublicUrl = (slug) => {
        return `${window.location.origin}/forms/${slug}`;
    };

    const confirmEdit = (id) => {
        if (window.confirm(t('dashboard.confirmEdit'))) {
            navigate(`/admin/forms/${id}/edit`);
        }
    };

    const filteredForms = forms.filter(form => {
        // Category filter
        let matchesCategory = true;
        if (filter === 'draft') matchesCategory = !form.isPublished;
        else if (filter === 'favorites') matchesCategory = form.isFavorite;
        else matchesCategory = form.isPublished; // 'all' shows only published

        // Search filter
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            form.title?.toLowerCase().includes(query) ||
            form.description?.toLowerCase().includes(query);

        return matchesCategory && matchesSearch;
    });

    return (
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 relative">
            {/* Header */}
            <div className="px-4 py-6 sm:px-0 flex flex-col md:flex-row justify-between items-center border-b pb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
                    <p className="mt-1 text-sm text-gray-500">{t('dashboard.subtitle')}</p>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <Link
                        to="/admin/forms/new"
                        className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition flex items-center gap-2"
                    >
                        <span>+</span> {t('dashboard.createForm')}
                    </Link>

                    <div className="relative group">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder={t('dashboard.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all w-full sm:w-64 text-sm"
                        />
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {t('dashboard.all')}
                        </button>
                        <button
                            onClick={() => setFilter('draft')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'draft' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {t('dashboard.drafts')}
                        </button>
                        <button
                            onClick={() => setFilter('favorites')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'favorites' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {t('dashboard.favorites')}
                        </button>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="bg-red-50 text-red-600 px-4 py-2 rounded border border-red-200 hover:bg-red-100 transition"
                    >
                        {t('navbar.logout')}
                    </button>
                </div>
            </div>

            {/* Form List */}
            <div className="mt-8">
                {loading ? (
                    <p>{t('dashboard.loading')}</p>
                ) : filteredForms.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <p className="text-gray-500">
                            {t('dashboard.noForms')}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredForms.map(form => (
                            <div key={form._id} className="bg-white relative overflow-hidden shadow rounded-lg border border-gray-100 hover:shadow-md transition">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleFavorite(form);
                                    }}
                                    className={`absolute top-4 right-4 z-10 p-1.5 rounded-full transition-all duration-200 transform hover:scale-110 ${form.isFavorite ? 'text-pink-500 bg-pink-50 shadow-sm' : 'text-gray-300 hover:text-pink-300 bg-gray-50/50'}`}
                                    title={form.isFavorite ? t('dashboard.removeFromFavorites') : t('dashboard.addToFavorites')}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                <div className="px-4 py-5 sm:p-6">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900 truncate">
                                        {t(form.title) || t('dashboard.untitledForm')}
                                    </h3>
                                    <p className="mt-1 max-w-2xl text-sm text-gray-500 truncate">
                                        {t(form.description) || t('dashboard.noDescription')}
                                    </p>
                                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                                        <span>{toMarathiDigits(form.questions?.length || 0)} {t('dashboard.questions')}</span>
                                        {form.isPublished && (
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => toggleStatus(form)}
                                                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${form.isActive ? 'bg-green-600' : 'bg-gray-200'}`}
                                                >
                                                    <span className="sr-only">{t('dashboard.useSetting')}</span>
                                                    <span
                                                        aria-hidden="true"
                                                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`}
                                                    />
                                                </button>
                                                <span className={`text-xs font-semibold ${form.isActive ? "text-green-600" : "text-gray-500"}`}>
                                                    {form.isActive ? t('dashboard.active') : t('dashboard.inactive')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                                        <span className={form.isPublished ? "text-green-600 font-semibold" : "text-yellow-600"}>
                                            {form.isPublished ? t('dashboard.published') : t('dashboard.draft')}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-between items-center">
                                    <div className="flex space-x-3 text-sm">
                                        <button onClick={() => confirmEdit(form._id)} className="text-indigo-600 hover:text-indigo-900 font-medium">{t('dashboard.edit')}</button>
                                        <Link to={`/admin/forms/${form._id}/responses`} className="text-blue-600 hover:text-blue-900 font-medium">{t('dashboard.responses')} ({toMarathiDigits(form.responseCount || 0)})</Link>
                                        <button
                                            onClick={() => setShowShareModal(form)}
                                            className="text-purple-600 hover:text-purple-900 font-medium"
                                        >
                                            {t('dashboard.share')}
                                        </button>
                                        <button
                                            onClick={() => duplicateForm(form._id)}
                                            className="text-gray-600 hover:text-gray-900 font-medium"
                                        >
                                            {t('dashboard.duplicate')}
                                        </button>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => deleteForm(form._id)} className="text-red-600 hover:text-red-900 text-sm">{t('dashboard.delete')}</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">{t('dashboard.shareForm')}</h3>
                            <button
                                onClick={() => setShowShareModal(null)}
                                className="text-gray-400 hover:text-gray-500 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 mb-6 line-clamp-2 px-2">{showShareModal.title}</p>

                        <div className="flex justify-center mb-8">
                            <div className="p-4 bg-white rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.1)] border border-gray-100">
                                <QRCode
                                    value={getPublicUrl(showShareModal.slug)}
                                    size={180}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    viewBox={`0 0 256 256`}
                                />
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            {/* WhatsApp Share Button */}
                            <button
                                onClick={() => {
                                    const url = getPublicUrl(showShareModal.slug);
                                    const text = encodeURIComponent(`Please fill out this form: ${showShareModal.title}\n${url}`);
                                    window.open(`https://wa.me/?text=${text}`, '_blank');
                                }}
                                className="w-full flex items-center justify-center space-x-2 bg-[#25D366] text-white px-4 py-3 rounded-xl hover:bg-[#128C7E] transition-all duration-200 font-bold shadow-md hover:shadow-lg transform active:scale-95"
                            >
                                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                <span>{t('dashboard.shareWhatsApp')}</span>
                            </button>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(getPublicUrl(showShareModal.slug));
                                    alert(t('dashboard.linkCopied'));
                                }}
                                className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-3 rounded-xl hover:bg-indigo-700 transition-all duration-200 font-bold shadow-md hover:shadow-lg transform active:scale-95"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span>{t('dashboard.copyLink')}</span>
                            </button>
                        </div>



                        <button
                            onClick={() => setShowShareModal(null)}
                            className="mt-6 w-full text-gray-500 hover:text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
                        >
                            {t('dashboard.close')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
