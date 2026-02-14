import React from 'react';

const QUESTION_TYPES = [
    { value: 'text', label: 'Short Text' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio Button' },
    { value: 'rating', label: 'Rating (1-5 Stars)' },
    { value: 'file', label: 'File Upload' },
    { value: 'section', label: 'Section Header' },
];

export default function FormBuilder({ form, setForm }) {

    const addQuestion = () => {
        setForm({
            ...form,
            questions: [
                ...form.questions,
                {
                    id: crypto.randomUUID(),
                    label: "New Question",
                    type: "text",
                    required: false,
                    placeholder: "",
                    options: ["Option 1", "Option 2"]
                }
            ]
        });
    };

    const updateQuestion = (index, field, value) => {
        const copy = [...form.questions];
        copy[index][field] = value;
        setForm({ ...form, questions: copy });
    };

    const removeQuestion = (index) => {
        if (!window.confirm("Delete this question?")) return;
        const copy = [...form.questions];
        copy.splice(index, 1);
        setForm({ ...form, questions: copy });
    };

    const moveQuestion = (index, direction) => {
        const copy = [...form.questions];
        if (direction === -1 && index > 0) {
            [copy[index], copy[index - 1]] = [copy[index - 1], copy[index]];
        } else if (direction === 1 && index < copy.length - 1) {
            [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
        }
        setForm({ ...form, questions: copy });
    };

    const addOption = (qIndex) => {
        const copy = [...form.questions];
        copy[qIndex].options.push(`Option ${copy[qIndex].options.length + 1}`);
        setForm({ ...form, questions: copy });
    };

    const updateOption = (qIndex, oIndex, value) => {
        const copy = [...form.questions];
        copy[qIndex].options[oIndex] = value;
        setForm({ ...form, questions: copy });
    };

    const removeOption = (qIndex, oIndex) => {
        const copy = [...form.questions];
        copy[qIndex].options.splice(oIndex, 1);
        setForm({ ...form, questions: copy });
    };

    return (
        <div className="space-y-6">
            {form.questions.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-gray-500">Your form is empty. Add a question to get started!</p>
                </div>
            )}

            {form.questions.map((q, i) => (
                <div key={q.id} className="bg-white border rounded-lg shadow-sm p-6 relative group transition hover:shadow-md">
                    {/* Header: Label & Type */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                {q.type === 'section' ? 'Section Title' : 'Question Label'}
                            </label>
                            <input
                                type="text"
                                className="w-full text-lg font-medium border-b border-gray-300 focus:border-indigo-600 focus:outline-none py-1 transition"
                                value={q.label}
                                onChange={(e) => updateQuestion(i, 'label', e.target.value)}
                                placeholder="Enter your question here..."
                            />
                        </div>
                        <div className="w-1/4 min-w-[150px]">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                Type
                            </label>
                            <select
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={q.type}
                                onChange={(e) => updateQuestion(i, 'type', e.target.value)}
                            >
                                {QUESTION_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Settings: Placeholder & Required (or Description for Sections) */}
                    {q.type === 'section' ? (
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Section Description (Optional)</label>
                            <textarea
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={q.placeholder || ''}
                                onChange={(e) => updateQuestion(i, 'placeholder', e.target.value)}
                                placeholder="Enter a description for this section..."
                                rows={2}
                            />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Placeholder (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={q.placeholder || ''}
                                    onChange={(e) => updateQuestion(i, 'placeholder', e.target.value)}
                                    placeholder="Example value..."
                                />
                            </div>
                            <div className="flex items-end pb-2">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                        checked={q.required}
                                        onChange={(e) => updateQuestion(i, 'required', e.target.checked)}
                                    />
                                    <span className="text-sm text-gray-700 font-medium">Required Response</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Options Editor (for relevant types) */}
                    {['select', 'checkbox', 'radio'].includes(q.type) && (
                        <div className="bg-gray-50 p-4 rounded-md mb-4">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                Options
                            </label>
                            <div className="space-y-2">
                                {q.options.map((opt, oIndex) => (
                                    <div key={oIndex} className="flex items-center gap-2">
                                        <div className="bg-gray-400 rounded-full w-2 h-2"></div>
                                        <input
                                            type="text"
                                            className="flex-1 bg-transparent border-b border-transparent focus:border-gray-400 focus:outline-none text-sm"
                                            value={opt}
                                            onChange={(e) => updateOption(i, oIndex, e.target.value)}
                                        />
                                        <button
                                            onClick={() => removeOption(i, oIndex)}
                                            className="text-gray-400 hover:text-red-500"
                                            title="Remove Option"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => addOption(i)}
                                    className="text-sm text-indigo-600 font-medium hover:underline mt-2 inline-block"
                                >
                                    + Add Option
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Actions Footer */}
                    <div className="flex justify-end items-center border-t pt-4 space-x-2">
                        <button
                            onClick={() => moveQuestion(i, -1)}
                            disabled={i === 0}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            title="Move Up"
                        >
                            &#8593;
                        </button>
                        <button
                            onClick={() => moveQuestion(i, 1)}
                            disabled={i === form.questions.length - 1}
                            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            title="Move Down"
                        >
                            &#8595;
                        </button>
                        <div className="h-4 w-px bg-gray-300 mx-2"></div>
                        <button
                            onClick={() => removeQuestion(i)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center"
                        >
                            <span className="mr-1">&times;</span> Delete
                        </button>
                    </div>
                </div>
            ))}

            <button
                onClick={addQuestion}
                className="w-full py-3 border-2 border-dashed border-indigo-300 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 hover:border-indigo-400 transition text-center"
            >
                + Add New Question
            </button>
        </div>
    );
}
