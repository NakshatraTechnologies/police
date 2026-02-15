import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../utils/api';
import { reportTemplate } from '../utils/ReportTemplate';
import logo from '../assets/policelogo.png';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useTranslation } from 'react-i18next';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts';

export default function FormReport() {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isShortView = searchParams.get('view') === 'short';
    const isFormattedView = searchParams.get('view') === 'formatted';
    const [form, setForm] = useState(null);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const reportRef = useRef();
    const [showFormattedReport, setShowFormattedReport] = useState(isFormattedView);

    useEffect(() => {
        setShowFormattedReport(isFormattedView);
    }, [isFormattedView]);
    const [reportSettings, setReportSettings] = useState({
        startDate: '',
        endDate: '',
        totalDays: '',
        trainingDay: '',
        presentCount: '',
        signatureName: ''
    });
    const [showSettings, setShowSettings] = useState(false);

    const handleSettingChange = (e) => {
        const { name, value } = e.target;
        setReportSettings(prev => ({ ...prev, [name]: value }));
    };

    const formatDate = (dateString) => {
        if (!dateString) return '--/--/----';
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return toMarathiDigits(`${day}/${month}/${year}`);
    };

    const toMarathiDigits = (num) => {
        if (num === undefined || num === null) return '';
        if (i18n.language !== 'mr') return num.toString();
        const marathiMap = { '0': '०', '1': '१', '2': '२', '3': '३', '4': '४', '5': '५', '6': '६', '7': '७', '8': '८', '9': '९' };
        return num.toString().split('').map(char => marathiMap[char] || char).join('');
    };

    const formatCount = (num) => {
        const padded = num.toString().padStart(2, '0');
        return toMarathiDigits(padded);
    };

    const getMarathiOrdinal = (numStr) => {
        if (!numStr) return '_____';
        const num = parseInt(numStr);
        if (isNaN(num)) return numStr; // Return as-is if not a valid number

        const ordinals = {
            1: 'पहिला',
            2: 'दुसरा',
            3: 'तिसरा',
            4: 'चौथा',
            5: 'पाचवा',
            6: 'सहावा',
            7: 'सातवा',
            8: 'आठवा',
            9: 'नववा',
            10: 'दहावा',
            11: 'अकरावा',
            12: 'बारावा',
            13: 'तेरावा',
            14: 'चौदावा',
            15: 'पंधरावा',
            16: 'सोळावा',
            17: 'सतरावा',
            18: 'अठरावा',
            19: 'एकोणिसावा',
            20: 'विसावा',
            21: 'एकविसावा'
        };

        return ordinals[num] || `${toMarathiDigits(num)} वा`;
    };

    // Group questions by section headers for formatted report
    const groupQuestionsBySections = () => {

        if (!form) return [];
        const sections = [];
        let currentSection = { title: 'General', questions: [] };

        form.questions.forEach(q => {
            if (q.type === 'section') {
                if (currentSection.questions.length > 0) {
                    sections.push(currentSection);
                }
                currentSection = { title: q.label, questions: [] };
            } else {
                currentSection.questions.push(q);
            }
        });

        if (currentSection.questions.length > 0) {
            sections.push(currentSection);
        }

        return sections;
    };

    // Calculate section stats for formatted report
    const calculateSectionStats = (questions) => {
        const stats = { veryGood: 0, good: 0, medium: 0, normal: 0, total: 0 };

        questions.forEach(q => {
            if (q.type === 'rating') {
                responses.forEach(r => {
                    const val = parseInt(r.answers[q.id]);
                    if (val === 5) stats.veryGood++;
                    else if (val === 4) stats.good++;
                    else if (val === 3) stats.medium++;
                    else if (val === 2) stats.normal++;
                    if (val >= 1 && val <= 5) stats.total++;
                });
            }
        });

        return stats;
    };

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

            if (formRes.data.reportSettings) {
                setReportSettings({
                    startDate: formRes.data.reportSettings.startDate ? formRes.data.reportSettings.startDate.split('T')[0] : '',
                    endDate: formRes.data.reportSettings.endDate ? formRes.data.reportSettings.endDate.split('T')[0] : '',
                    totalDays: formRes.data.reportSettings.totalDays || '',
                    trainingDay: formRes.data.reportSettings.trainingDay || '',
                    presentCount: formRes.data.reportSettings.presentCount || '',
                    signatureName: formRes.data.reportSettings.signatureName || ''
                });
            }

            setForm(formRes.data);
            setResponses(responsesRes.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            alert(t('formReport.errorFetch'));
        }
    };

    const saveReportSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // Explicitly handle empty date strings to prevent Mongoose cast errors
            const cleanedSettings = {
                ...reportSettings,
                startDate: reportSettings.startDate || null,
                endDate: reportSettings.endDate || null
            };

            // Strip _id to avoid Mongoose update conflicts
            const { _id, ...formDataNoId } = form;

            const updatedData = {
                ...formDataNoId,
                reportSettings: cleanedSettings
            };

            await axios.put(`${API_BASE}/api/forms/${id}`, updatedData, config);

            // Update local state to keep UI in sync
            setReportSettings(cleanedSettings);
            // Re-attach _id for local state consistency
            setForm({ ...updatedData, _id });

            alert(t('formReport.settingsSaved'));
            setShowSettings(false);
        } catch (error) {
            console.error(error);
            alert(t('formReport.errorSave'));
        }
    };

    const calculateStats = (question) => {
        const stats = { total: 0, breakdown: {} };

        responses.forEach(r => {
            const answer = r.answers[question.id];
            if (answer !== undefined && answer !== null && answer !== '') {
                stats.total++;

                if (question.type === 'rating') {
                    const rating = parseInt(answer);
                    if (rating === 5) stats.breakdown[t('formReport.excellent')] = (stats.breakdown[t('formReport.excellent')] || 0) + 1;
                    else if (rating === 4) stats.breakdown[t('formReport.good')] = (stats.breakdown[t('formReport.good')] || 0) + 1;
                    else if (rating === 3) stats.breakdown[t('formReport.medium')] = (stats.breakdown[t('formReport.medium')] || 0) + 1;
                    else if (rating === 2) stats.breakdown[t('formReport.poor')] = (stats.breakdown[t('formReport.poor')] || 0) + 1;
                    else if (rating === 1) stats.breakdown[t('formReport.veryPoor')] = (stats.breakdown[t('formReport.veryPoor')] || 0) + 1;
                } else if (Array.isArray(answer)) {
                    answer.forEach(opt => {
                        stats.breakdown[opt] = (stats.breakdown[opt] || 0) + 1;
                    });
                } else {
                    stats.breakdown[answer] = (stats.breakdown[answer] || 0) + 1;
                }
            }
        });

        // Ensure keys exist for ratings
        if (question.type === 'rating') {
            [t('formReport.excellent'), t('formReport.good'), t('formReport.medium'), t('formReport.poor'), t('formReport.veryPoor')].forEach(key => {
                if (!stats.breakdown[key]) stats.breakdown[key] = 0;
            });
        }

        return stats;
    };

    const downloadPDF = () => {
        const input = reportRef.current;
        html2canvas(input, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${form.title}_${isShortView ? 'short' : 'full'}_report.pdf`);
        });
    };

    if (loading) return <div className="p-8">{t('formReport.loading')}</div>;

    return (
        <div className="min-h-screen p-8" style={{ background: 'linear-gradient(135deg, #fff1f2 0%, #fce7f3 100%)' }}>
            <div className="max-w-5xl mx-auto mb-4 flex flex-wrap justify-between items-center gap-2">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">&larr; {t('formReport.back')}</button>
                <div className="flex flex-wrap gap-2 no-print">
                    <button
                        onClick={() => setShowFormattedReport(true)}
                        className={`px-6 py-2 rounded-lg shadow-md font-medium transition-colors ${showFormattedReport
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50'
                            }`}
                    >
                        {t('formReport.formatReport')}
                    </button>
                    <button
                        onClick={() => setShowFormattedReport(false)}
                        className={`px-6 py-2 rounded-lg shadow-md font-medium transition-colors ${!showFormattedReport
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50'
                            }`}
                    >
                        {t('formReport.detailedReport')}
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-indigo-700 font-medium transition-colors"
                    >
                        {t('formReport.printReport')}
                    </button>
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className={`px-4 py-2 rounded-lg shadow-md font-medium transition-colors flex items-center gap-2 ${showSettings
                            ? 'bg-gray-700 text-white'
                            : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        <span>⚙️</span>
                        {showSettings ? t('formReport.hideSettings') : t('formReport.settings')}
                    </button>
                </div>
            </div>

            {/* Admin Controls for Report Settings - Hidden during print */}
            {showSettings && (
                <div className="max-w-5xl mx-auto mb-8 bg-white p-6 rounded-xl shadow-md border border-gray-200 no-print">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">{t('formReport.reportSettingsAdmin')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('formReport.startDate')}</label>
                            <input
                                type="date"
                                name="startDate"
                                value={reportSettings.startDate}
                                onChange={handleSettingChange}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('formReport.endDate')}</label>
                            <input
                                type="date"
                                name="endDate"
                                value={reportSettings.endDate}
                                onChange={handleSettingChange}
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('formReport.totalDays')}</label>
                            <input
                                type="number"
                                name="totalDays"
                                value={reportSettings.totalDays}
                                onChange={handleSettingChange}
                                placeholder="e.g. 5"
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('formReport.trainingDay')}</label>
                            <input
                                type="text"
                                name="trainingDay"
                                value={reportSettings.trainingDay}
                                onChange={handleSettingChange}
                                placeholder="e.g. 1st Day"
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('formReport.presentCount')}</label>
                            <input
                                type="number"
                                name="presentCount"
                                value={reportSettings.presentCount}
                                onChange={handleSettingChange}
                                placeholder="e.g. 45"
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('formReport.signatureName')}</label>
                            <input
                                type="text"
                                name="signatureName"
                                value={reportSettings.signatureName}
                                onChange={handleSettingChange}
                                placeholder="e.g. (रश्मी युवराज सावंत)"
                                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={saveReportSettings}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-green-700 font-medium transition-colors"
                        >
                            {t('formReport.saveSettings')}
                        </button>
                    </div>
                </div>
            )}

            <div ref={reportRef} className="max-w-5xl mx-auto bg-white p-4 sm:p-8 lg:p-12 shadow-lg rounded-xl border border-gray-100">
                <div className="mb-8 border-b-2 border-gray-200 pb-4">
                    <div className="flex justify-center mb-4">
                        <img src={logo} alt="Maharashtra Police Logo" className="h-24 w-auto" />
                    </div>
                    <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">{t(form.title)}</h1>
                    <div className="flex justify-between text-md text-gray-600 px-2 font-medium">
                        <p>{t('formReport.creationDate')}: {new Date(form.createdAt).toLocaleDateString()}</p>
                        <p>{t('formReport.courseEndDate')}: {new Date(form.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>

                {showFormattedReport ? (
                    /* Formatted Table Report View */
                    <div className="formatted-report">
                        {/* Dynamic Header Content from Template */}
                        <div className="mb-6 report-header text-center">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">विश्लेषणात्मक आढावा</h2>

                            <div className="text-gray-800 text-md font-medium space-y-2 mt-4 text-left mx-auto max-w-4xl no-print-padding">
                                <p>
                                    पोलीस दळणवळण व माहिती तंत्रज्ञान प्रशिक्षण केंद्र पुणे येथे {form.title} करिता आलेले पोलीस अधिकारी व अंमलदार हे दिनांक <span className="font-bold underline px-1">{formatDate(reportSettings.startDate)}</span> ते <span className="font-bold underline px-1">{formatDate(reportSettings.endDate)}</span> रोजी एकुण <span className="font-bold underline px-1">{toMarathiDigits(reportSettings.totalDays || '0')}</span> दिवस उपस्थित आहेत.
                                </p>
                                <p>
                                    प्रशिक्षणाचा दिवस: <span className="font-bold underline px-1">{toMarathiDigits(reportSettings.trainingDay) || '-----'}</span>
                                </p>
                                <p>
                                    हजर प्रशिक्षणार्थी: <span className="font-bold underline px-1">{toMarathiDigits(reportSettings.presentCount || '0')}</span>
                                </p>
                                <p className="mt-2">
                                    प्रशिक्षण सत्राचा <span className="font-bold px-1">{getMarathiOrdinal(reportSettings.trainingDay)}</span> दिवस संपन्न झाल्यानंतर प्रशिक्षणार्थी यांच्याकडून फीडबॅक घेण्यात आले, त्याचा विश्लेषणात्मक आढावा खालीलप्रमाणे
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-gray-900 mt-4 text-sm">
                            <thead>
                                <tr className="bg-white font-bold text-center">
                                    <th className="border border-gray-900 px-2 py-2 w-12">{reportTemplate.tableColumns.srNo}</th>
                                    <th className="border border-gray-900 px-2 py-2 w-64">{reportTemplate.tableColumns.subject}</th>
                                    <th className="border border-gray-900 px-2 py-2 w-48">{reportTemplate.tableColumns.process}</th>
                                    <th className="border border-gray-900 px-2 py-2 w-20">{reportTemplate.tableColumns.ratings.veryGood}</th>
                                    <th className="border border-gray-900 px-2 py-2 w-20">{reportTemplate.tableColumns.ratings.good}</th>
                                    <th className="border border-gray-900 px-2 py-2 w-20">{reportTemplate.tableColumns.ratings.medium}</th>
                                    <th className="border border-gray-900 px-2 py-2 w-20">{reportTemplate.tableColumns.ratings.normal}</th>
                                    <th className="border border-gray-900 px-2 py-2 w-20">{reportTemplate.tableColumns.total}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupQuestionsBySections().map((section, idx) => {
                                    const ratingQuestions = section.questions.filter(q => q.type === 'rating');
                                    if (ratingQuestions.length === 0) return null;

                                    return ratingQuestions.map((q, qIdx) => {
                                        const stats = calculateStats(q);
                                        const veryGood = stats.breakdown['Very Good'] || 0;
                                        const good = stats.breakdown['Good'] || 0;
                                        const medium = stats.breakdown['Medium'] || 0;
                                        const normal = (stats.breakdown['Poor'] || 0) + (stats.breakdown['Very Poor'] || 0) + (stats.breakdown['Normal'] || 0); // Grouping lower ratings as 'Normal' based on header

                                        return (
                                            <tr key={q.id} className="text-center align-middle">
                                                {qIdx === 0 && (
                                                    <>
                                                        <td className="border border-gray-900 px-2 py-2 font-medium number-cell" rowSpan={ratingQuestions.length}>
                                                            {toMarathiDigits(idx + 1)}
                                                        </td>
                                                        <td className="border border-gray-900 px-2 py-2 font-bold text-left whitespace-pre-wrap" rowSpan={ratingQuestions.length}>
                                                            {section.title}
                                                        </td>
                                                    </>
                                                )}
                                                <td className="border border-gray-900 px-2 py-2 text-left">{q.label}</td>
                                                <td className="border border-gray-900 px-2 py-2 number-cell">{formatCount(veryGood)}</td>
                                                <td className="border border-gray-900 px-2 py-2 number-cell">{formatCount(good)}</td>
                                                <td className="border border-gray-900 px-2 py-2 number-cell">{formatCount(medium)}</td>
                                                <td className="border border-gray-900 px-2 py-2 number-cell">{formatCount(normal)}</td>
                                                <td className="border border-gray-900 px-2 py-2 font-bold number-cell">{formatCount(stats.total)}</td>
                                            </tr>
                                        );
                                    });
                                })}

                                {/* Feedback Section Row */}
                                {(() => {
                                    // Collect all text/textarea responses
                                    const feedbackQuestions = form.questions.filter(q => q.type === 'text' || q.type === 'textarea');
                                    let allFeedbacks = [];
                                    feedbackQuestions.forEach(q => {
                                        responses.forEach(r => {
                                            if (r.answers[q.id]) {
                                                allFeedbacks.push(r.answers[q.id]);
                                            }
                                        });
                                    });

                                    // Deduplicate and filter empty
                                    allFeedbacks = [...new Set(allFeedbacks)].filter(f => f && f.trim() !== '');

                                    if (allFeedbacks.length > 0 || feedbackQuestions.length > 0) {
                                        const nextSrNo = groupQuestionsBySections().filter(s => s.questions.some(q => q.type === 'rating')).length + 1;
                                        return (
                                            <tr>
                                                <td className="border border-gray-900 px-2 py-2 font-medium text-center align-top number-cell">
                                                    {toMarathiDigits(nextSrNo)}
                                                </td>
                                                <td className="border border-gray-900 px-2 py-2 font-bold text-left align-top">
                                                    इतर महत्वाच्या सुचना व अभिप्राय
                                                </td>
                                                <td className="border border-gray-900 px-2 py-2 text-left font-medium" colSpan={6}>
                                                    {allFeedbacks.length > 0 ? (
                                                        <ul className="list-none space-y-2">
                                                            {allFeedbacks.map((fb, i) => (
                                                                <li key={i} className="flex gap-2">
                                                                    <span>{toMarathiDigits(i + 1)}.</span>
                                                                    <span>{fb}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <span className="text-gray-500 italic">{t('formReport.noFeedback')}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    }
                                    return null;
                                })()}
                            </tbody>
                        </table>
                        </div>
                    </div>
                ) : (
                    /* Detailed Report View (Original) */
                    <div className="space-y-6">
                        {/* Overall Performance Summary for Short View */}
                        {isShortView && (
                            <div className="mb-10 bg-indigo-50 p-8 rounded-2xl border border-indigo-100 shadow-sm">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t('formReport.overallSatisfaction')}</h3>

                                {(() => {
                                    const ratingQuestions = form.questions.filter(q => q.type === 'rating');
                                    const combinedRatingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                                    let totalResponses = 0;
                                    let grandTotalScore = 0;

                                    ratingQuestions.forEach(q => {
                                        responses.forEach(r => {
                                            const val = parseInt(r.answers[q.id]);
                                            if (val >= 1 && val <= 5) {
                                                combinedRatingCounts[val]++;
                                                grandTotalScore += val;
                                                totalResponses++;
                                            }
                                        });
                                    });

                                    const grandAverage = totalResponses > 0 ? (grandTotalScore / totalResponses).toFixed(2) : '0.00';

                                    return (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                            {/* Grand Average Card */}
                                            <div className="bg-white p-6 rounded-xl shadow-inner border border-indigo-50 text-center">
                                                <p className="text-indigo-500 text-sm uppercase font-bold tracking-widest mb-2">{t('formReport.grandTotalRating')}</p>
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-6xl font-black text-indigo-600">{toMarathiDigits(grandAverage)}</span>
                                                    <span className="text-2xl text-gray-300 font-bold">/ 5</span>
                                                </div>
                                                <div className="mt-4 flex justify-center text-yellow-400 text-2xl">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <span key={star}>{parseFloat(grandAverage) >= star ? '★' : (parseFloat(grandAverage) >= star - 0.5 ? '½' : '☆')}</span>
                                                    ))}
                                                </div>
                                                <p className="mt-4 text-gray-500 font-medium">{t('formReport.basedOn')} {toMarathiDigits(responses.length)} {t('formReport.totalResponses')}</p>
                                            </div>

                                            {/* Combined Pie Chart */}
                                            <div className="h-80 w-full">
                                                <p className="text-gray-700 text-sm font-bold mb-2 text-center">{t('formReport.overallSatisfactionDist')}</p>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
                                                        <Pie
                                                            data={[
                                                                { name: `${t('formReport.excellent')} (5)`, value: combinedRatingCounts[5], color: '#166534' },
                                                                { name: `${t('formReport.good')} (4)`, value: combinedRatingCounts[4], color: '#15803d' },
                                                                { name: `${t('formReport.medium')} (3)`, value: combinedRatingCounts[3], color: '#facc15' },
                                                                { name: `${t('formReport.poor')} (2)`, value: combinedRatingCounts[2], color: '#f97316' },
                                                                { name: `${t('formReport.veryPoor')} (1)`, value: combinedRatingCounts[1], color: '#ef4444' },
                                                            ].filter(d => d.value > 0)}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={50}
                                                            outerRadius={80}
                                                            paddingAngle={5}
                                                            dataKey="value"
                                                            labelLine={true}
                                                            label={({ percent }) => `${toMarathiDigits((percent * 100).toFixed(0))}%`}
                                                        >
                                                            {[
                                                                { color: '#166534' },
                                                                { color: '#15803d' },
                                                                { color: '#facc15' },
                                                                { color: '#f97316' },
                                                                { color: '#ef4444' },
                                                            ].map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}



                        {!isShortView && form.questions.map((q, idx) => {
                            const stats = calculateStats(q);

                            // Calculate rating breakdown for histogram (1-5 stars)
                            const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                            if (q.type === 'rating') {
                                responses.forEach(r => {
                                    const val = parseInt(r.answers[q.id]);
                                    if (val >= 1 && val <= 5) ratingCounts[val]++;
                                });
                            }

                            return (
                                <div key={q.id} className="p-6 border-2 border-gray-300 rounded-lg break-inside-avoid">
                                    <h3 className="font-bold text-xl text-gray-900 mb-4">
                                        {t('dashboard.questions')} {toMarathiDigits(idx + 1)}: {q.label}
                                    </h3>

                                    {q.type === 'rating' ? (
                                        <div className="space-y-6">
                                            {/* Summary Stats */}
                                            <div className="flex flex-col sm:flex-row items-center justify-around gap-4 sm:gap-0 bg-blue-50 p-4 rounded-lg">
                                                <div className="text-center">
                                                    <p className="text-gray-500 text-sm uppercase font-semibold">{t('formReport.averageRating')}</p>
                                                    <p className="text-4xl font-bold text-blue-600">
                                                        {(
                                                            (ratingCounts[5] * 5 + ratingCounts[4] * 4 + ratingCounts[3] * 3 + ratingCounts[2] * 2 + ratingCounts[1] * 1) /
                                                            (stats.total || 1)
                                                        ).toFixed(1)}
                                                        <span className="text-lg text-gray-400">/5</span>
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-gray-500 text-sm uppercase font-semibold">{t('formReport.totalResponses')}</p>
                                                    <p className="text-4xl font-bold text-gray-700">{toMarathiDigits(stats.total)}</p>
                                                </div>
                                            </div>

                                            {/* Recharts Bar Chart - Visible in All Views */}
                                            <div className="h-64 w-full flex justify-center">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={[
                                                                { name: t('formReport.stars5'), value: ratingCounts[5], color: '#166534' },
                                                                { name: t('formReport.stars4'), value: ratingCounts[4], color: '#15803d' },
                                                                { name: t('formReport.stars3'), value: ratingCounts[3], color: '#facc15' },
                                                                { name: t('formReport.stars2'), value: ratingCounts[2], color: '#f97316' },
                                                                { name: t('formReport.stars1'), value: ratingCounts[1], color: '#ef4444' },
                                                            ].filter(d => d.value > 0)}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={50}
                                                            outerRadius={80}
                                                            paddingAngle={2}
                                                            dataKey="value"
                                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                        >
                                                            {[
                                                                { name: '5 Stars', color: '#166534' },
                                                                { name: '4 Stars', color: '#15803d' },
                                                                { name: '3 Stars', color: '#facc15' },
                                                                { name: '2 Stars', color: '#f97316' },
                                                                { name: '1 Star', color: '#ef4444' },
                                                            ]
                                                                .filter(d => ratingCounts[parseInt(d.name.split(' ')[0])] > 0)
                                                                .map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                                ))
                                                            }
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend verticalAlign="bottom" align="center" layout="horizontal" />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    ) : (
                                        isShortView ? (
                                            <div className="text-gray-500 italic mt-2">
                                                {t('formReport.hiddenShortReport')} <span className="font-bold text-gray-700">{t('formReport.totalResponses')}: {toMarathiDigits(stats.total)}</span>
                                            </div>
                                        ) : (
                                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                                {Object.entries(stats.breakdown).map(([key, count]) => (
                                                    <li key={key} className="text-gray-800 text-lg">
                                                        {key}: <span className="font-bold">{count}</span>
                                                    </li>
                                                ))}
                                                {Object.keys(stats.breakdown).length === 0 && <li className="text-gray-500 italic">{t('formReport.noResponsesYet')}</li>}
                                            </ul>
                                        )
                                    )}
                                </div>
                            );
                        })}

                        {/* Conclusion Section */}
                        {!isShortView && (() => {
                            let poorestQuestion = null;
                            let minAverage = Infinity;

                            form.questions.forEach(q => {
                                if (q.type === 'rating') {
                                    let totalScore = 0;
                                    let count = 0;
                                    responses.forEach(r => {
                                        const val = parseInt(r.answers[q.id]);
                                        if (val >= 1 && val <= 5) {
                                            totalScore += val;
                                            count++;
                                        }
                                    });

                                    if (count > 0) {
                                        const avg = totalScore / count;
                                        if (avg < minAverage) {
                                            minAverage = avg;
                                            poorestQuestion = { ...q, average: avg };
                                        }
                                    }
                                }
                            });

                            if (poorestQuestion) {
                                return (
                                    <div className="mt-8 p-8 bg-red-50 border border-red-100 rounded-xl shadow-sm break-inside-avoid">
                                        <div className="flex items-start space-x-4">
                                            <div className="bg-red-100 p-3 rounded-full">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('formReport.conclusion')}</h3>
                                                <div className="text-gray-700 text-lg">
                                                    {t('formReport.areaAttention')}
                                                    <div className="mt-3 p-4 bg-white border-l-4 border-red-500 rounded shadow-sm">
                                                        <p className="font-bold text-xl text-gray-800">"{poorestQuestion.label}"</p>
                                                        <p className="text-gray-500 mt-1">{t('formReport.averageRating')}: <span className="font-bold text-red-600">{toMarathiDigits(poorestQuestion.average.toFixed(1))}/5</span></p>
                                                    </div>
                                                    <p className="mt-4 text-gray-600">
                                                        {t('formReport.addressingFocus', { label: poorestQuestion.label })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>
                )}

                {showFormattedReport && (
                    <div className="mt-12 flex justify-end">
                        <div className="text-center pr-4 space-y-1">
                            <div className="text-gray-900 font-bold text-md leading-tight">
                                <p>{reportSettings.signatureName || form?.reportSettings?.signatureName || '--------------------------'}</p>
                                <p>पोलीस उपाधीक्षक</p>
                                <p>पोलीस दळणवळण व माहिती तंत्रज्ञान,</p>
                                <p>प्रशिक्षण केंद्र, पुणे</p>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 15mm !important; }
                    button { display: none !important; }
                    .min-h-screen { padding: 0 !important; background: none !important; }
                    .max-w-5xl { max-width: 100% !important; box-shadow: none !important; border: none !important; padding: 0 !important; }
                    .break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
                    .recharts-responsive-container { width: 100% !important; height: 300px !important; }
                    .formatted-report table { width: 100% !important; font-size: 12px; }
                    .formatted-report th, .formatted-report td { padding: 8px !important; }
                    .no-print { display: none !important; }
                }
            `}</style>
        </div>
    );
}
