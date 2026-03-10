import React, { useState, useMemo } from 'react';
import {
    Activity, Book, Download, BarChart3,
    FileText, Layers, Tag, Clock, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export default function MyActivities({ mySubjects, staffData }) {
    const [activeSubjectTab, setActiveSubjectTab] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const activityData = useMemo(() => {
        if (!staffData || !mySubjects) return { totalQuestions: 0, summaryStats: {}, uploadDetails: [], subjects: {} };

        const stats = {
            totalQuestions: 0,
            summaryStats: {},
            uploadDetails: [],
            subjects: {}
        };

        mySubjects.forEach(subject => {
            if (subject.units) {
                Object.keys(subject.units).forEach(unitKey => {
                    const unit = subject.units[unitKey];
                    const unitNum = unit.unitNumber || unitKey.replace('unit', '');
                    const questions = (unit.questions || []).filter(q => q.staffId === staffData.id);

                    questions.forEach(q => {
                        stats.totalQuestions++;

                        if (!stats.subjects[subject.subjectCode]) {
                            stats.subjects[subject.subjectCode] = {
                                name: subject.subjectName,
                                count: 0
                            };
                        }
                        stats.subjects[subject.subjectCode].count++;

                        if (!stats.summaryStats[subject.subjectCode]) {
                            stats.summaryStats[subject.subjectCode] = {
                                name: subject.subjectName,
                                units: {}
                            };
                        }

                        if (!stats.summaryStats[subject.subjectCode].units[unitNum]) {
                            stats.summaryStats[subject.subjectCode].units[unitNum] = {
                                mark1: 0,
                                mark4: 0,
                                mark6: 0,
                                total: 0
                            };
                        }

                        const unitStats = stats.summaryStats[subject.subjectCode].units[unitNum];
                        const marks = parseInt(q.marks);
                        if (marks === 1 || marks === 2) unitStats.mark1++;
                        else if (marks === 4) unitStats.mark4++;
                        else if (marks === 6) unitStats.mark6++;
                        unitStats.total++;

                        stats.uploadDetails.push({
                            'Question No': q.questionNo || 'N/A',
                            'Question': q.question || 'N/A',
                            'Marks': q.marks,
                            'Subject Code': subject.subjectCode,
                            'Subject Name': subject.subjectName,
                            'Unit': unitNum,
                            'Bloom Level': q.bloomLevel || 'RE',
                            'Uploaded At': q.uploadedAt ? new Date(q.uploadedAt).toLocaleString() : 'N/A'
                        });
                    });
                });
            }
        });

        // Sort uploads by date descending
        stats.uploadDetails.sort((a, b) => new Date(b['Uploaded At']) - new Date(a['Uploaded At']));

        return stats;
    }, [mySubjects, staffData]);

    const downloadExcel = () => {
        const summaryData = [];
        Object.keys(activityData.summaryStats).forEach(subCode => {
            const sub = activityData.summaryStats[subCode];
            Object.keys(sub.units).forEach(unitNum => {
                const stats = sub.units[unitNum];
                summaryData.push({
                    'Subject Code': subCode,
                    'Subject Name': sub.name,
                    'Unit': unitNum,
                    '1 Mark Count': stats.mark1,
                    '4 Mark Count': stats.mark4,
                    '6 Mark Count': stats.mark6,
                    'Unit Total': stats.total
                });
            });
        });

        const granularData = activityData.uploadDetails;

        const workbook = XLSX.utils.book_new();
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, wsSummary, 'My Summary');

        if (granularData.length > 0) {
            const wsDetails = XLSX.utils.json_to_sheet(granularData);
            XLSX.utils.book_append_sheet(workbook, wsDetails, 'Question Details');
        }

        XLSX.writeFile(workbook, `My_Upload_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Activity report downloaded!");
    };

    const downloadSubjectExcel = () => {
        if (activeSubjectTab === 'all') {
            downloadExcel();
            return;
        }

        const filteredDetails = activityData.uploadDetails.filter(q => q['Subject Code'] === activeSubjectTab);
        const workbook = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(filteredDetails);
        XLSX.utils.book_append_sheet(workbook, ws, 'Questions');
        XLSX.writeFile(workbook, `My_${activeSubjectTab}_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success(`${activeSubjectTab} report generated!`);
    };

    const filteredQuestions = useMemo(() => {
        if (activeSubjectTab === 'all') return activityData.uploadDetails;
        return activityData.uploadDetails.filter(q => q['Subject Code'] === activeSubjectTab);
    }, [activityData.uploadDetails, activeSubjectTab]);

    const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
    const paginatedQuestions = filteredQuestions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset pagination when tab changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [activeSubjectTab]);

    return (
        <div className="space-y-6 animate-fade-in text-gray-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Activity className="w-5 h-5" />
                        </span>
                        My Activity Analysis
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Track and export your question contributions</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={downloadExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        Full Report
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: 'Total Questions', value: activityData.totalQuestions, color: 'blue', icon: Layers },
                    { label: 'Subjects Covered', value: Object.keys(activityData.subjects).length, color: 'indigo', icon: Book },
                    { label: 'Ready Units', value: Object.values(activityData.summaryStats).reduce((sum, sub) => sum + Object.keys(sub.units).length, 0), color: 'emerald', icon: BarChart3 }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className={`p-3 bg-${stat.color}-50 rounded-xl text-${stat.color}-600`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                            <p className="text-2xl font-black text-gray-800">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Subject Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                <button
                    onClick={() => setActiveSubjectTab('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${activeSubjectTab === 'all'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                        : 'bg-white text-gray-500 border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30'
                        }`}
                >
                    All Subjects
                </button>
                {Object.keys(activityData.subjects).map(subCode => (
                    <button
                        key={subCode}
                        onClick={() => setActiveSubjectTab(subCode)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all whitespace-nowrap ${activeSubjectTab === subCode
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                            : 'bg-white text-gray-500 border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30'
                            }`}
                    >
                        {subCode} ({activityData.subjects[subCode].count})
                    </button>
                ))}
            </div>

            {/* Main Content Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left table-fixed">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr className="text-[10px] uppercase font-black text-gray-400 tracking-widest leading-none">
                                <th className="px-6 py-4 w-28 whitespace-nowrap">Unit</th>
                                <th className="px-6 py-4 w-40 whitespace-nowrap">Subject</th>
                                <th className="px-6 py-4">Question Details</th>
                                <th className="px-6 py-4 w-24 text-center whitespace-nowrap">Marks</th>
                                <th className="px-6 py-4 w-32 text-center whitespace-nowrap">Bloom Level</th>
                                <th className="px-6 py-4 w-32 text-right whitespace-nowrap">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {paginatedQuestions.length > 0 ? paginatedQuestions.map((q, idx) => (
                                <tr key={idx} className="hover:bg-blue-50/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center justify-center whitespace-nowrap px-2 py-1 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100 uppercase tracking-tighter min-w-[60px]">
                                            Unit {q.Unit}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 text-sm tracking-tight truncate">{q['Subject Code']}</div>
                                        <div className="text-[10px] text-gray-400 font-medium truncate">{q['Subject Name']}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 max-w-sm group-hover:text-gray-900 transition-colors">
                                            {q.Question}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border ${q.Marks === 1 ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                            q.Marks === 4 ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                                                'bg-amber-50 border-amber-200 text-amber-700'
                                            }`}>
                                            {q.Marks}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center justify-center min-w-[60px] text-[10px] font-black text-gray-500 bg-gray-100 px-2 py-1 rounded uppercase tracking-widest whitespace-nowrap">
                                            {q['Bloom Level']}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5 text-[10px] font-medium text-gray-400 whitespace-nowrap">
                                            <Clock className="w-3 h-3" />
                                            {q['Uploaded At'].split(',')[0]}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                            <FileText className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">No data available</h3>
                                        <p className="text-xs text-gray-400 mt-1">Start uploading questions to see your analysis here.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="p-4 px-6 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Showing {paginatedQuestions.length} of {filteredQuestions.length} entries
                        </p>
                        <button
                            onClick={downloadSubjectExcel}
                            disabled={filteredQuestions.length === 0}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                            <Download className="w-3 h-3" />
                            Excel Export
                        </button>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-1 px-3 bg-white border border-gray-200 rounded-lg text-gray-500 hover:border-blue-200 disabled:opacity-30 transition-all shadow-sm"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1 px-3 bg-white border border-gray-200 rounded-lg text-gray-500 hover:border-blue-200 disabled:opacity-30 transition-all shadow-sm"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
}
