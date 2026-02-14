import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../utils/api';
import * as XLSX from 'xlsx';

export default function FormResponses() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState(null);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [formRes, responsesRes] = await Promise.all([
                axios.get(`${API_BASE}/api/forms/${id}`, config),
                axios.get(`${API_BASE}/api/forms/${id}/responses`, config)
            ]);

            setForm(formRes.data);
            setResponses(responsesRes.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            alert("Error fetching data");
            navigate('/admin/dashboard');
        }
    };

    const exportToExcel = () => {
        if (!form || !responses.length) return;

        const data = responses.map(r => {
            const row = { "Submission Date": new Date(r.createdAt).toLocaleString() };
            form.questions.forEach(q => {
                let answer = r.answers[q.id];
                if (Array.isArray(answer)) answer = answer.join(", ");
                row[q.label] = answer || "";
            });
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Responses");
        XLSX.writeFile(wb, `${form.title}_responses.xlsx`);
    };

    if (loading) return <div className="p-8">Loading data...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center space-x-4 w-full md:w-auto">
                        <button onClick={() => navigate('/admin/dashboard')} className="text-gray-500 hover:text-gray-700">&larr; Back</button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
                            <p className="text-sm text-gray-500">{responses.length} responses</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <button
                            onClick={() => navigate(`/admin/forms/${id}/report?view=short`)}
                            className="flex-1 md:flex-none bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 flex items-center justify-center text-sm"
                        >
                            Short Report
                        </button>
                        <button
                            onClick={() => navigate(`/admin/forms/${id}/report`)}
                            className="flex-1 md:flex-none bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 flex items-center justify-center text-sm"
                        >
                            Detailed Report
                        </button>
                        <button
                            onClick={() => navigate(`/admin/forms/${id}/report?view=formatted`)}
                            className="flex-1 md:flex-none bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center justify-center text-sm"
                        >
                            Formatted Report
                        </button>
                        <button
                            onClick={exportToExcel}
                            className="flex-1 md:flex-none bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 flex items-center justify-center text-sm"
                        >
                            Export to Excel
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col">
                    <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                            <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            {form.collectEmails && (
                                                <>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                                </>
                                            )}
                                            {form.questions.filter(q => q.type !== 'section').map(q => (
                                                <th key={q.id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    {q.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {responses.map((r, idx) => (
                                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(r.createdAt).toLocaleString()}
                                                </td>
                                                {form.collectEmails && (
                                                    <>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.name || '-'}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.email || '-'}</td>
                                                    </>
                                                )}
                                                {form.questions.filter(q => q.type !== 'section').map(q => {
                                                    let answer = r.answers[q.id];
                                                    if (Array.isArray(answer)) answer = answer.join(", ");
                                                    return (
                                                        <td key={q.id} className="px-6 py-4 text-sm text-gray-900">
                                                            {q.type === 'rating' ? (
                                                                <div className="flex text-yellow-400">
                                                                    {[1, 2, 3, 4, 5].map(star => (
                                                                        <span key={star} className={answer >= star ? "text-yellow-400" : "text-gray-300"}>★</span>
                                                                    ))}
                                                                    <span className="ml-2 text-gray-500 text-xs">({answer || 0})</span>
                                                                </div>
                                                            ) : q.type === 'file' && answer ? (
                                                                <a
                                                                    href={`${API_BASE}${answer}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:text-blue-800 underline"
                                                                >
                                                                    View File
                                                                </a>
                                                            ) : (
                                                                answer ? String(answer) : '-'
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
