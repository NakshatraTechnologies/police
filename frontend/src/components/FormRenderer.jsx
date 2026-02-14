import React, { useState } from 'react';

export default function FormRenderer({ formData, onSubmit }) {
    const [answers, setAnswers] = useState({});

    const handleChange = (questionId, value) => {
        setAnswers({
            ...answers,
            [questionId]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(answers);
    };

    if (!formData || !formData.questions) return null;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {formData.questions.map((q) => (
                q.type === 'section' ? (
                    <div key={q.id} className="pt-6 pb-2 border-b border-gray-200 mb-4 first:pt-0">
                        <h2 className="text-xl font-bold text-gray-800">{q.label}</h2>
                        {q.placeholder && <p className="text-gray-600 mt-1">{q.placeholder}</p>}
                    </div>
                ) : (
                    <div key={q.id} className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                            {q.label}
                            {q.required && <span className="text-red-500 ml-1">*</span>}
                        </label>

                        {/* Render Input Based on Type */}
                        {['text', 'email', 'number', 'date'].includes(q.type) && (
                            <input
                                type={q.type}
                                required={q.required}
                                placeholder={q.placeholder}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                onChange={(e) => handleChange(q.id, e.target.value)}
                            />
                        )}

                        {q.type === 'textarea' && (
                            <textarea
                                required={q.required}
                                placeholder={q.placeholder}
                                rows={3}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                onChange={(e) => handleChange(q.id, e.target.value)}
                            />
                        )}

                        {q.type === 'select' && (
                            <select
                                required={q.required}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
                                defaultValue=""
                                onChange={(e) => handleChange(q.id, e.target.value)}
                            >
                                <option value="" disabled>Select an option</option>
                                {q.options.map((opt, idx) => (
                                    <option key={idx} value={opt}>{opt}</option>
                                ))}
                            </select>
                        )}

                        {q.type === 'radio' && (
                            <div className="space-y-2 mt-2">
                                {q.options.map((opt, idx) => (
                                    <div key={idx} className="flex items-center">
                                        <input
                                            id={`${q.id}-${idx}`}
                                            name={q.id}
                                            type="radio"
                                            required={q.required}
                                            value={opt}
                                            onChange={(e) => handleChange(q.id, e.target.value)}
                                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                                        />
                                        <label htmlFor={`${q.id}-${idx}`} className="ml-3 block text-sm font-medium text-gray-700">
                                            {opt}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}

                        {q.type === 'checkbox' && (
                            <div className="space-y-2 mt-2">
                                {q.options.map((opt, idx) => (
                                    <div key={idx} className="flex items-center">
                                        <input
                                            id={`${q.id}-${idx}`}
                                            type="checkbox"
                                            value={opt}
                                            onChange={(e) => {
                                                const current = answers[q.id] || [];
                                                const updated = e.target.checked
                                                    ? [...current, opt]
                                                    : current.filter(item => item !== opt);
                                                handleChange(q.id, updated);
                                            }}
                                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                        />
                                        <label htmlFor={`${q.id}-${idx}`} className="ml-3 block text-sm font-medium text-gray-700">
                                            {opt}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}

                        {q.type === 'file' && (
                            <div className="mt-1">
                                <input
                                    type="file"
                                    required={q.required}
                                    onChange={(e) => handleChange(q.id, e.target.files[0])}
                                    className="block w-full text-sm text-gray-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-full file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-indigo-50 file:text-indigo-700
                                  hover:file:bg-indigo-100"
                                />
                                <p className="mt-1 text-xs text-gray-500">Max size 25MB.</p>
                            </div>
                        )}

                        {q.type === 'rating' && (
                            <div className="flex items-center space-x-1 mt-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => handleChange(q.id, star)}
                                        className={`focus:outline-none transition-transform hover:scale-110 ${(answers[q.id] || 0) >= star ? 'text-yellow-400' : 'text-gray-300'
                                            }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )
            ))}

            <div className="pt-4">
                <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition"
                >
                    Submit Response
                </button>
            </div>
        </form>
    );
}
