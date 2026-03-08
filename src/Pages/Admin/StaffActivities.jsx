import React, { useState, useMemo } from 'react';
import {
    Users, Book, Download, Search, Filter,
    ChevronLeft, ChevronRight, BarChart3,
    CheckCircle2, Clock, Eye, X, FileText, Layers, Tag
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export default function StaffActivities({ allSubjects, staffList }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filterDepartment, setFilterDepartment] = useState('all');
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [activeSubjectTab, setActiveSubjectTab] = useState('all');
    const itemsPerPage = 8;

    const staffActivities = useMemo(() => {
        const aggregation = {};

        staffList.forEach(staff => {
            aggregation[staff.id] = {
                id: staff.id,
                name: staff.fullName || staff.name || 'Unknown',
                username: staff.username || '',
                department: staff.department || 'General',
                role: staff.role || 'staff',
                totalQuestions: 0,
                subjects: {},
                uploadDetails: [],
                summaryStats: {}
            };
        });

        allSubjects.forEach(subject => {
            if (subject.units) {
                Object.keys(subject.units).forEach(unitKey => {
                    const unit = subject.units[unitKey];
                    const unitNum = unit.unitNumber || unitKey.replace('unit', '');
                    const questions = unit.questions || [];

                    questions.forEach(q => {
                        const staffId = q.staffId;
                        if (staffId && aggregation[staffId]) {
                            const staff = aggregation[staffId];
                            staff.totalQuestions++;

                            if (!staff.subjects[subject.subjectCode]) {
                                staff.subjects[subject.subjectCode] = {
                                    name: subject.subjectName,
                                    count: 0
                                };
                            }
                            staff.subjects[subject.subjectCode].count++;

                            if (!staff.summaryStats[subject.subjectCode]) {
                                staff.summaryStats[subject.subjectCode] = {
                                    name: subject.subjectName,
                                    units: {}
                                };
                            }

                            if (!staff.summaryStats[subject.subjectCode].units[unitNum]) {
                                staff.summaryStats[subject.subjectCode].units[unitNum] = {
                                    mark1: 0,
                                    mark4: 0,
                                    mark6: 0,
                                    total: 0
                                };
                            }

                            const stats = staff.summaryStats[subject.subjectCode].units[unitNum];
                            const marks = parseInt(q.marks);
                            if (marks === 1 || marks === 2) stats.mark1++;
                            else if (marks === 4) stats.mark4++;
                            else if (marks === 6) stats.mark6++;
                            stats.total++;

                            staff.uploadDetails.push({
                                'Question No': q.questionNo || 'N/A',
                                'Question': q.question || 'N/A',
                                'Marks': q.marks,
                                'Subject Code': subject.subjectCode,
                                'Subject Name': subject.subjectName,
                                'Unit': unitNum,
                                'Bloom Level': q.bloomLevel || 'RE',
                                'Uploaded At': q.uploadedAt ? new Date(q.uploadedAt).toLocaleString() : 'N/A'
                            });
                        }
                    });
                });
            }
        });

        return Object.values(aggregation).sort((a, b) => b.totalQuestions - a.totalQuestions);
    }, [allSubjects, staffList]);

    const filteredActivities = staffActivities.filter(activity => {
        const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.username.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = filterDepartment === 'all' || activity.department === filterDepartment;
        return matchesSearch && matchesDept;
    });

    const departments = useMemo(() => {
        const depts = new Set(staffList.map(s => s.department).filter(Boolean));
        return Array.from(depts).sort();
    }, [staffList]);

    const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
    const displayedActivities = filteredActivities.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const downloadExcel = (data = staffActivities, fileName = "Staff_Upload_Report") => {
        const summaryData = [];
        data.forEach(staff => {
            Object.keys(staff.summaryStats).forEach(subCode => {
                const sub = staff.summaryStats[subCode];
                Object.keys(sub.units).forEach(unitNum => {
                    const stats = sub.units[unitNum];
                    summaryData.push({
                        'Staff Name': staff.name,
                        'Department': staff.department,
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

            if (staff.totalQuestions === 0) {
                summaryData.push({
                    'Staff Name': staff.name,
                    'Department': staff.department,
                    'Subject Code': 'N/A',
                    'Subject Name': 'No uploads yet',
                    'Unit': '-',
                    '1 Mark Count': 0,
                    '4 Mark Count': 0,
                    '6 Mark Count': 0,
                    'Unit Total': 0
                });
            }
        });

        const granularData = [];
        data.forEach(staff => {
            granularData.push(...staff.uploadDetails.map(d => ({
                'Staff Name': staff.name,
                ...d
            })));
        });

        const workbook = XLSX.utils.book_new();
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, wsSummary, 'Activity Summary');

        if (granularData.length > 0) {
            const wsDetails = XLSX.utils.json_to_sheet(granularData);
            XLSX.utils.book_append_sheet(workbook, wsDetails, 'Question Details');
        }

        XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Detailed report generated!");
    };

    const downloadSubjectExcel = () => {
        if (!selectedStaff) return;

        let filteredDetails = selectedStaff.uploadDetails;
        let fileName = `${selectedStaff.name}_All_Subjects`;

        if (activeSubjectTab !== 'all') {
            filteredDetails = selectedStaff.uploadDetails.filter(q => q['Subject Code'] === activeSubjectTab);
            fileName = `${selectedStaff.name}_${activeSubjectTab}`;
        }

        // For this specific export, we just export the filtered granular details
        const workbook = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(filteredDetails);
        XLSX.utils.book_append_sheet(workbook, ws, 'Questions');
        XLSX.writeFile(workbook, `${fileName}_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Subject-wise report generated!");
    };

    const handleViewDetails = (staff) => {
        setSelectedStaff(staff);
        setActiveSubjectTab('all');
    };

    const filteredModalQuestions = useMemo(() => {
        if (!selectedStaff) return [];
        if (activeSubjectTab === 'all') return selectedStaff.uploadDetails;
        return selectedStaff.uploadDetails.filter(q => q['Subject Code'] === activeSubjectTab);
    }, [selectedStaff, activeSubjectTab]);

    return (
        <div className="space-y-6 animate-fade-in text-gray-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="p-2 bg-slate-100 rounded-lg text-slate-600">
                            <Users className="w-5 h-5" />
                        </span>
                        Staff Upload Analysis
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">Track individual staff question contributions</p>
                </div>
                <button
                    onClick={() => downloadExcel()}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-sm active:scale-95"
                >
                    <Download className="w-4 h-4" />
                    Download Full Report
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Staff', value: staffList.length, color: 'slate', icon: Users },
                    { label: 'Active Today', value: staffActivities.filter(s => s.totalQuestions > 0).length, color: 'emerald', icon: CheckCircle2 },
                    { label: 'Total Bank', value: staffActivities.reduce((sum, s) => sum + s.totalQuestions, 0), color: 'blue', icon: Layers },
                    { label: 'Avg Uploads', value: (staffList.length > 0 ? (staffActivities.reduce((sum, s) => sum + s.totalQuestions, 0) / staffList.length).toFixed(1) : 0), color: 'indigo', icon: BarChart3 }
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                        <div className={`p-2 bg-${stat.color}-50 rounded-lg text-${stat.color}-600`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{stat.label}</p>
                            <p className="text-lg font-bold text-gray-800">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or username..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500/10 text-sm transition-all"
                    />
                </div>
                <div className="w-full sm:w-56 relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500/10 text-sm cursor-pointer appearance-none"
                    >
                        <option value="all">All Departments</option>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                <th className="px-6 py-3">Staff Member</th>
                                <th className="px-6 py-3">Department</th>
                                <th className="px-6 py-3">Questions</th>
                                <th className="px-6 py-3">Contributions</th>
                                <th className="px-6 py-3 text-right">View</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {displayedActivities.length > 0 ? displayedActivities.map((staff) => (
                                <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                {staff.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-800 text-sm leading-tight">{staff.name}</div>
                                                <div className="text-[10px] text-gray-400 font-medium tracking-tight">@{staff.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-gray-500">{staff.department}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-sm font-bold ${staff.totalQuestions > 0 ? 'text-indigo-600' : 'text-gray-300'}`}>
                                                {staff.totalQuestions}
                                            </span>
                                            <div className="w-20 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-400 transition-all duration-700"
                                                    style={{ width: `${Math.min(100, (staff.totalQuestions / 50) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {Object.keys(staff.subjects).length > 0 ? (
                                                Object.keys(staff.subjects).slice(0, 2).map((code) => (
                                                    <span key={code} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold">
                                                        {code}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-[10px] text-gray-300 italic">None yet</span>
                                            )}
                                            {Object.keys(staff.subjects).length > 2 && (
                                                <span className="text-[9px] text-gray-400 font-bold">+{Object.keys(staff.subjects).length - 2}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleViewDetails(staff)}
                                            disabled={staff.totalQuestions === 0}
                                            className="p-1.5 bg-white border border-gray-200 text-gray-400 rounded-lg hover:text-indigo-600 hover:border-indigo-100 disabled:opacity-20 transition-all"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400 text-xs italic tracking-wide">
                                        No matches found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100 bg-slate-50/20">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Page {currentPage} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-1 px-3 bg-white border border-gray-200 rounded-lg text-gray-500 hover:border-indigo-200 disabled:opacity-30 transition-all"
                            >
                                <ChevronLeft className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1 px-3 bg-white border border-gray-200 rounded-lg text-gray-500 hover:border-indigo-200 disabled:opacity-30 transition-all"
                            >
                                <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Simplified Modal */}
            {selectedStaff && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white z-20">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                                    {selectedStaff.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">{selectedStaff.name}</h3>
                                    <p className="text-xs text-gray-400">Activity Report • {selectedStaff.totalQuestions} Questions</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedStaff(null)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-gray-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Subject Tabs */}
                        <div className="px-6 py-4 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-gray-50 bg-slate-50/50">
                            <button
                                onClick={() => setActiveSubjectTab('all')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${activeSubjectTab === 'all'
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-100'
                                    }`}
                            >
                                All Subjects
                            </button>
                            {Object.keys(selectedStaff.subjects).map(subCode => (
                                <button
                                    key={subCode}
                                    onClick={() => setActiveSubjectTab(subCode)}
                                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${activeSubjectTab === subCode
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-100'
                                        }`}
                                >
                                    {subCode}
                                </button>
                            ))}
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-auto p-6 bg-white min-h-[400px]">
                            <div className="rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm shadow-sm z-10">
                                        <tr className="text-[9px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                            <th className="px-6 py-3">Unit</th>
                                            <th className="px-6 py-3">Context</th>
                                            <th className="px-6 py-3">Question Content</th>
                                            <th className="px-6 py-3">Marks</th>
                                            <th className="px-6 py-3">Bloom</th>
                                            <th className="px-6 py-3">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredModalQuestions.map((q, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">UNIT {q.Unit}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-[10px] font-bold text-gray-700">{q['Subject Code']}</div>
                                                    <div className="text-[8px] text-gray-400 uppercase tracking-tight truncate max-w-[100px]">{q['Subject Name']}</div>
                                                </td>
                                                <td className="px-6 py-4 max-w-md">
                                                    <div className="text-xs text-gray-600 leading-relaxed line-clamp-2">{q.Question}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-bold underline decoration-2 underline-offset-2 ${q.Marks === 1 ? 'decoration-blue-400 text-blue-600' :
                                                        q.Marks === 4 ? 'decoration-indigo-400 text-indigo-600' :
                                                            'decoration-amber-400 text-amber-600'
                                                        }`}>
                                                        {q.Marks}M
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-[10px] font-bold text-gray-500">{q['Bloom Level']}</td>
                                                <td className="px-6 py-4 text-[10px] text-gray-400">{q['Uploaded At'].split(',')[0]}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Footer with Subject Download */}
                        <div className="p-4 px-6 border-t border-gray-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <p className="text-[10px] font-semibold text-gray-400 flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                Analysis for {activeSubjectTab === 'all' ? 'All Portfolio' : activeSubjectTab}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={downloadSubjectExcel}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-[10px] uppercase tracking-wide hover:bg-emerald-700 transition-colors shadow-sm active:scale-95"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download Subject Sheet
                                </button>
                                <button
                                    onClick={() => setSelectedStaff(null)}
                                    className="px-6 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-[10px] font-bold uppercase tracking-wide hover:bg-slate-50 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
}
