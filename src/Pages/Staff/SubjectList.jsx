import React, { useState, useMemo } from 'react';
import { BookOpen, FileText, Grid3x3, Calendar, Search, ChevronLeft, ChevronRight } from 'lucide-react';

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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-gray-900">My Subjects</h2>
                    <span className="text-sm text-gray-500">{mySubjects.length} subjects • {stats.totalQuestions} total questions</span>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search subjects..."
                        className="text-sm border border-gray-300 rounded-lg pl-9 pr-3 py-2 w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-4">
                {displayedSubjects.map((subject) => {
                    const uploadedUnitCount = uploadedUnits[subject.subjectCode]?.length || 0;
                    const totalQuestions = subject.totalQuestions || 0;

                    return (
                        <div key={subject.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900">{subject.subjectCode}</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-600">{subject.subjectName}</span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <FileText size={14} />
                                            {totalQuestions} questions
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Grid3x3 size={14} />
                                            {uploadedUnitCount}/5 units uploaded
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            Updated: {subject.lastUpdated.toLocaleDateString()}
                                        </span>
                                    </div>
                                    {/* Unit Progress */}
                                    <div className="flex items-center gap-1 mt-2">
                                        {[1, 2, 3, 4, 5].map(u => (
                                            <div
                                                key={u}
                                                className={`h-2 w-10 rounded ${uploadedUnits[subject.subjectCode]?.includes(u.toString())
                                                    ? 'bg-green-500'
                                                    : 'bg-gray-200'
                                                    }`}
                                                title={`Unit ${u} - ${uploadedUnits[subject.subjectCode]?.includes(u.toString()) ? 'Uploaded' : 'Pending'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onUploadClick(subject)}
                                        className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                                    >
                                        Upload Questions
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredSubjects.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p>{searchTerm ? 'No subjects matching search' : 'No subjects assigned yet'}</p>
                        {!searchTerm && <p className="text-sm">Contact HOD to get subjects assigned</p>}
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredSubjects.length)} of {filteredSubjects.length} subjects
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
