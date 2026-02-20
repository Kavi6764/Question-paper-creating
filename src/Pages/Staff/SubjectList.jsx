import React, { useState, useMemo } from 'react';
import { BookOpen, Search, ChevronLeft, ChevronRight, Upload, Calendar, Grid3x3, FileText } from 'lucide-react';

export default function SubjectList({ mySubjects, uploadedUnits, stats, onUploadClick }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Search Logic
    const filteredSubjects = useMemo(() => {
        if (!searchTerm) return mySubjects;
        const lowerTerm = searchTerm.toLowerCase();
        return mySubjects.filter(sub =>
            sub.subjectCode.toLowerCase().includes(lowerTerm) ||
            sub.subjectName.toLowerCase().includes(lowerTerm)
        );
    }, [mySubjects, searchTerm]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);
    const displayedSubjects = filteredSubjects.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-600" /> My Subjects
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your assigned subjects and question uploads</p>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search subjects..."
                        className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm w-full md:w-64 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                            <th className="px-6 py-4">Subject Info</th>
                            <th className="px-6 py-4">Questions</th>
                            <th className="px-6 py-4">Unit Progress</th>
                            <th className="px-6 py-4">Last Updated</th>
                            <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {displayedSubjects.map((subject) => {
                            const uploadedUnitCount = uploadedUnits[subject.subjectCode]?.length || 0;
                            const totalQuestions = subject.totalQuestions || 0;

                            return (
                                <tr key={subject.id} className="group hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-100">
                                                {subject.subjectCode.slice(0, 2)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{subject.subjectName}</p>
                                                <p className="text-xs text-gray-500 font-mono">{subject.subjectCode}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                            <FileText className="w-4 h-4 text-gray-400" />
                                            <span className="font-medium">{totalQuestions}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                                <span>{uploadedUnitCount}/5 Units</span>
                                                <span className="font-medium">{Math.round((uploadedUnitCount / 5) * 100)}%</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(u => (
                                                    <div
                                                        key={u}
                                                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${uploadedUnits[subject.subjectCode]?.includes(u.toString())
                                                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                                                : 'bg-gray-100'
                                                            }`}
                                                        title={`Unit ${u}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            {subject.lastUpdated.toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => onUploadClick(subject)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-100"
                                        >
                                            <Upload className="w-3.5 h-3.5" /> Upload
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filteredSubjects.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                            <BookOpen className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No subjects found</h3>
                        <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                            {searchTerm ? `No results matching "${searchTerm}"` : 'You haven\'t been assigned any subjects yet.'}
                        </p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                    <p className="text-sm text-gray-500">
                        Page <span className="font-medium text-gray-900">{currentPage}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
