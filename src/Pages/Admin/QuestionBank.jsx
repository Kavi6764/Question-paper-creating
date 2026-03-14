import React, { useState, useMemo } from 'react';
import {
    Search, Layers,
    Download, ChevronLeft, ChevronRight, Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export default function QuestionBank({ allSubjects, userData, onDeleteUnit }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('all');
    const [selectedUnit, setSelectedUnit] = useState('all');
    const [selectedMarks, setSelectedMarks] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filter subjects by HOD department if applicable
    const filteredSubjectsByDept = useMemo(() => {
        if (userData?.role === 'hod') {
            const dept = userData.department;
            return allSubjects.filter(sub => sub.department === dept);
        }
        return allSubjects;
    }, [allSubjects, userData]);

    // Flatten all questions from units
    const allQuestions = useMemo(() => {
        const pool = [];
        filteredSubjectsByDept.forEach(subject => {
            const mergedUnits = subject.units ? { ...subject.units } : {};
            Object.keys(subject).forEach(key => {
                 if (key.startsWith('unit') && !key.startsWith('units') && subject[key]) {
                     mergedUnits[key] = subject[key];
                 }
            });

            Object.keys(mergedUnits).forEach(unitKey => {
                const unit = mergedUnits[unitKey];
                const unitNum = unit.unitNumber || unitKey.replace('unit', '');
                const questions = unit.questions || [];

                questions.forEach((q, idx) => {
                    pool.push({
                        ...q,
                        subjectCode: subject.subjectCode,
                        subjectName: subject.subjectName,
                        unit: unitNum,
                        id: `${subject.id}-${unitKey}-${idx}-${Math.random().toString(36).substr(2, 9)}`
                    });
                });
            });
        });
        return pool;
    }, [filteredSubjectsByDept]);

    // Apply Filters
    const filteredQuestions = useMemo(() => {
        return allQuestions.filter(q => {
            const matchesSearch = searchTerm === '' ||
                (q.question || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (q.subjectCode || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchesSubject = selectedSubject === 'all' || q.subjectCode === selectedSubject;
            const matchesUnit = selectedUnit === 'all' || q.unit.toString() === selectedUnit;
            const matchesMarks = selectedMarks === 'all' || (q.marks && q.marks.toString() === selectedMarks);

            return matchesSearch && matchesSubject && matchesUnit && matchesMarks;
        });
    }, [allQuestions, searchTerm, selectedSubject, selectedUnit, selectedMarks]);

    // Pagination
    const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
    const displayedQuestions = filteredQuestions.slice(
        (currentPage - 1) * itemsPerPage,
        (currentPage) * itemsPerPage
    );

    // Reset page on filter change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedSubject, selectedUnit, selectedMarks]);

    const downloadExcel = () => {
        if (filteredQuestions.length === 0) {
            toast.error("No questions to export");
            return;
        }

        const data = filteredQuestions.map(q => ({
            'Subject Code': q.subjectCode,
            'Subject Name': q.subjectName,
            'Unit': q.unit,
            'Question': q.question,
            'Marks': q.marks,
            'CO': q.co || 'N/A',
            'Bloom Level': q.bloomLevel || 'N/A',
            'Difficulty': q.difficulty || 'Medium',
            'Staff Name': q.staffName || 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Question Bank");
        XLSX.writeFile(wb, `Question_Bank_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success("Question bank exported!");
    };

    const handleDeleteClick = () => {
        if (selectedSubject !== 'all' && selectedUnit !== 'all') {
            onDeleteUnit(selectedSubject, selectedUnit);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in text-gray-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <Layers className="w-5 h-5" />
                        </span>
                        Question Bank
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {userData?.role === 'hod' ? `${userData.department} Department • ` : ''}
                        {filteredQuestions.length} Questions Found
                    </p>
                </div>
                <button
                    onClick={downloadExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-sm active:scale-95"
                >
                    <Download className="w-4 h-4" />
                    Export Bank
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search questions or subject codes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 text-sm transition-all"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none cursor-pointer hover:border-gray-300"
                        >
                            <option value="all">All Subjects</option>
                            {[...new Set(filteredSubjectsByDept.map(s => s.subjectCode))].sort().map(code => (
                                <option key={code} value={code}>{code}</option>
                            ))}
                        </select>
                        <select
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none cursor-pointer hover:border-gray-300"
                        >
                            <option value="all">All Units</option>
                            {[1, 2, 3, 4, 5].map(u => (
                                <option key={u} value={u.toString()}>Unit {u}</option>
                            ))}
                        </select>
                        {/* <select
                            value={selectedMarks}
                            onChange={(e) => setSelectedMarks(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white outline-none cursor-pointer hover:border-gray-300"
                        >
                            <option value="all">All Marks</option>
                            {[1, 4, 6].map(m => (
                                <option key={m} value={m.toString()}>{m} Marks</option>
                            ))}
                        </select> */}

                        {selectedSubject !== 'all' && selectedUnit !== 'all' && (
                            <button
                                onClick={handleDeleteClick}
                                className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-xs hover:bg-red-100 transition-colors border border-red-200 shadow-sm animate-fade-in"
                                title={`Delete all questions for Unit ${selectedUnit} of ${selectedSubject}`}
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Clear Unit
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Questions Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                <th className="px-6 py-4">Subject & Unit</th>
                                <th className="px-6 py-4">Question</th>
                                <th className="px-6 py-4">Attributes</th>
                                <th className="px-6 py-4">Staff</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {displayedQuestions.length > 0 ? displayedQuestions.map((q, idx) => (
                                <tr key={idx} className="hover:bg-blue-50/10 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800 text-sm">{q.subjectCode}</div>
                                        <div className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded inline-block mt-1">UNIT {q.unit}</div>
                                    </td>
                                    <td className="px-6 py-4 max-w-xl">
                                        <div className="text-xs text-gray-700 leading-relaxed font-medium">{q.question}</div>
                                        {q.orQuestion && (
                                            <div className="mt-2 p-2 bg-gray-50/50 rounded border border-dashed border-gray-200">
                                                <span className="text-[9px] font-bold text-amber-600 block mb-1 uppercase tracking-wider">Alt Question (OR):</span>
                                                <p className="text-[11px] text-gray-500 italic">{q.orQuestion.question}</p>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-bold rounded border border-indigo-100">
                                                {q.marks}M
                                            </span>
                                            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded border border-emerald-100">
                                                {q.bloomLevel || 'RE'}
                                            </span>
                                            <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 text-[9px] font-bold rounded border border-purple-100">
                                                {q.co || 'CO1'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 flex items-center justify-center text-[10px] font-bold shadow-inner">
                                                {(q.staffName || 'S').charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                                <div className="text-[11px] font-semibold text-gray-700 truncate max-w-[120px]">{q.staffName || 'Staff'}</div>
                                                <div className="text-[9px] text-gray-400 uppercase tracking-tight font-medium">Contributor</div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Layers className="w-10 h-10 text-gray-200" />
                                            <p className="text-gray-400 text-sm italic">No matching questions found</p>
                                        </div>
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
                                className="p-1.5 border border-gray-200 rounded-lg bg-white disabled:opacity-30 hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                <ChevronLeft className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 border border-gray-200 rounded-lg bg-white disabled:opacity-30 hover:bg-gray-50 transition-colors shadow-sm"
                            >
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
