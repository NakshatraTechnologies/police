import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../utils/api';
import FormBuilder from '../components/FormBuilder';

export default function FormEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = !id;

    const [form, setForm] = useState({
        title: '',
        description: '',
        slug: '',
        limitOneResponse: false,
        collectEmails: false,
        isAnonymous: false,
        questions: [],
        isPublished: false,
        reportSettings: {
            startDate: '',
            endDate: '',
            totalDays: '',
            trainingDay: '',
            presentCount: '',
            signatureName: ''
        }
    });
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isNew) {
            fetchForm();
        } else {
            // Default ID for new form questions
            setForm(f => ({ ...f, questions: [] }));
        }
    }, [id]);

    const fetchForm = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get(`${API_BASE}/api/forms/${id}`, config);
            setForm(data);
            setLoading(false);
        } catch (error) {
            alert("Error fetching form");
            navigate('/admin/dashboard');
        }
    };

    const handleSave = async (publish = false) => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const payload = {
                ...form,
                isPublished: publish ? true : form.isPublished,
                reportSettings: {
                    ...form.reportSettings,
                    startDate: form.reportSettings?.startDate || null,
                    endDate: form.reportSettings?.endDate || null
                }
            };

            // Generate slug if empty
            if (!payload.slug) {
                payload.slug = payload.title.toLowerCase().replace(/ /g, '-') + '-' + Date.now();
            }

            if (isNew) {
                const { data } = await axios.post(`${API_BASE}/api/forms`, payload, config);
                if (publish) {
                    alert("Form Published!");
                    navigate('/admin/dashboard');
                } else {
                    navigate(`/admin/forms/${data._id}/edit`);
                }
            } else {
                await axios.put(`${API_BASE}/api/forms/${id}`, payload, config);
                if (publish) {
                    setForm(f => ({ ...f, isPublished: true }));
                    alert("Form Published!");
                    navigate('/admin/dashboard');
                }
            }
        } catch (error) {
            console.error(error);
            alert("Error saving form");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate('/admin/dashboard')} className="text-gray-500 hover:text-gray-700">&larr; Back</button>
                        <h1 className="text-2xl font-bold text-gray-900">{isNew ? 'Create Form' : 'Edit Form'}</h1>
                    </div>
                    <div className="space-x-3">
                        <button
                            onClick={() => handleSave(false)}
                            disabled={saving}
                            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
                        >
                            {saving ? 'Saving...' : 'Save Draft'}
                        </button>
                        <button
                            onClick={() => handleSave(true)}
                            disabled={saving}
                            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                        >
                            Publish
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Main Sidebar - Settings */}
                    <div className="w-full md:w-1/4 space-y-6 order-2 md:order-1">
                        <div className="bg-white shadow rounded-lg p-4 border-t-8 border-b-4 border-orange-500">
                            <h3 className="font-medium text-gray-900 mb-4">Form Settings</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Form Title</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                        placeholder="My Awesome Form"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        rows={3}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                        placeholder="Describe your form..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Slug (URL) <span className="text-gray-400 font-normal">(Optional)</span></label>
                                    <input
                                        type="text"
                                        value={form.slug}
                                        onChange={e => setForm({ ...form, slug: e.target.value })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                        placeholder="custom-url-slug"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="limitOneResponse"
                                        name="limitOneResponse"
                                        type="checkbox"
                                        checked={form.limitOneResponse || false}
                                        onChange={e => setForm({ ...form, limitOneResponse: e.target.checked })}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="limitOneResponse" className="ml-2 block text-sm text-gray-900">
                                        Limit to 1 response per person
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="collectEmails"
                                        name="collectEmails"
                                        type="checkbox"
                                        checked={form.collectEmails || false}
                                        onChange={e => {
                                            setForm({
                                                ...form,
                                                collectEmails: e.target.checked,
                                                isAnonymous: !e.target.checked
                                            });
                                        }}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="collectEmails" className="ml-2 block text-sm text-gray-900">
                                        Collect Name & Email
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Report Settings Sidebar Section */}
                        <div className="bg-white shadow rounded-lg p-4 border-t-8 border-b-4 border-green-500">
                            <h3 className="font-medium text-gray-900 mb-4">Report Display Settings</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                                    <input
                                        type="date"
                                        value={form.reportSettings?.startDate ? new Date(form.reportSettings.startDate).toISOString().split('T')[0] : ''}
                                        onChange={e => setForm({ ...form, reportSettings: { ...form.reportSettings, startDate: e.target.value } })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2 border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                                    <input
                                        type="date"
                                        value={form.reportSettings?.endDate ? new Date(form.reportSettings.endDate).toISOString().split('T')[0] : ''}
                                        onChange={e => setForm({ ...form, reportSettings: { ...form.reportSettings, endDate: e.target.value } })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2 border"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Total Days</label>
                                        <input
                                            type="number"
                                            value={form.reportSettings?.totalDays || ''}
                                            onChange={e => setForm({ ...form, reportSettings: { ...form.reportSettings, totalDays: e.target.value } })}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2 border"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700">Training Day</label>
                                        <input
                                            type="text"
                                            value={form.reportSettings?.trainingDay || ''}
                                            onChange={e => setForm({ ...form, reportSettings: { ...form.reportSettings, trainingDay: e.target.value } })}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2 border"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Present Trainees</label>
                                    <input
                                        type="number"
                                        value={form.reportSettings?.presentCount || ''}
                                        onChange={e => setForm({ ...form, reportSettings: { ...form.reportSettings, presentCount: e.target.value } })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2 border"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Signature Name</label>
                                    <input
                                        type="text"
                                        value={form.reportSettings?.signatureName || ''}
                                        onChange={e => setForm({ ...form, reportSettings: { ...form.reportSettings, signatureName: e.target.value } })}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm p-2 border"
                                        placeholder="e.g. (रश्मी युवराज सावंत)"
                                    />
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="w-full md:w-3/4 order-1 md:order-2">
                        <div className="bg-white shadow rounded-lg p-6 min-h-[500px] border-t-8 border-b-4 border-indigo-600">
                            <FormBuilder form={form} setForm={setForm} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
