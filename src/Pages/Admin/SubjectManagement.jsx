import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Book, FolderPlus, Edit, Trash2, X, ChevronLeft, ChevronRight,
    GraduationCap, Calendar, Award, Users, Clock,
    Layers, Search, Filter, MoreVertical,
    CheckCircle, AlertCircle
} from 'lucide-react';

export default function SubjectManagement({
    allSubjects,
    showAddSubject,
    setShowAddSubject,
    editingSubjectId,
    setEditingSubjectId,
    newSubject,
    setNewSubject,
    loading,
    handleAddSubject,
    handleUpdateSubject,
    handleEditSubject,
    handleDeleteSubject
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSemester, setFilterSemester] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const itemsPerPage = 7; // Increased for table view

    // Filter Logic
    const filteredSubjects = allSubjects.filter(subject => {
        const matchesSearch = searchTerm === '' ||
            subject.subjectCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subject.subjectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subject.department?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSemester = filterSemester === 'all' ||
            subject.semester?.toString() === filterSemester;

        return matchesSearch && matchesSemester;
    });

    // Sort by recently added
    const sortedSubjects = [...filteredSubjects].sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
    });

    // Pagination Logic
    const totalPages = Math.ceil(sortedSubjects.length / itemsPerPage);
    const displayedSubjects = sortedSubjects.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterSemester]);

    // Color Helpers
    const getRandomGradient = (code) => {
        const gradients = [
            "from-blue-600 to-cyan-500",
            "from-purple-600 to-pink-500",
            "from-orange-600 to-red-500",
            "from-emerald-600 to-teal-500",
            "from-indigo-600 to-purple-500",
            "from-rose-600 to-orange-500"
        ];
        const index = code.length % gradients.length;
        return gradients[index];
    };

    const getSemesterColor = (sem) => {
        if (sem <= 2) return "bg-emerald-100 text-emerald-700 border-emerald-200";
        if (sem <= 4) return "bg-blue-100 text-blue-700 border-blue-200";
        if (sem <= 6) return "bg-purple-100 text-purple-700 border-purple-200";
        return "bg-amber-100 text-amber-700 border-amber-200";
    };

    const getStats = () => {
        const totalUnits = allSubjects.reduce((acc, sub) => acc + (sub.totalUnits || 5), 0);
        const totalCredits = allSubjects.reduce((acc, sub) => acc + (sub.credits || 3), 0);
        return { totalUnits, totalCredits };
    };

    const stats = getStats();

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <Book className="w-5 h-5" />
                        </span>
                        Subject Management
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 ml-9">
                        Manage academic subjects and curriculum
                    </p>
                </div>
                <button
                    onClick={() => setShowAddSubject(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:scale-[1.02] active:scale-95"
                >
                    <FolderPlus className="w-4 h-4" />
                    Add New Subject
                </button>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white/50 p-4 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Book className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase">Total Subjects</p>
                            <p className="text-xl font-bold text-gray-900">{allSubjects.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white/50 p-4 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <Layers className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase">Total Units</p>
                            <p className="text-xl font-bold text-gray-900">{stats.totalUnits}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white/50 p-4 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <Award className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase">Total Credits</p>
                            <p className="text-xl font-bold text-gray-900">{stats.totalCredits}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white/50 p-4 rounded-xl border border-white/50 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase">Semesters</p>
                            <p className="text-xl font-bold text-gray-900">1-8</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white/50 rounded-xl border border-gray-100 overflow-hidden">
                {/* Filters */}
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between bg-white/30">
                    <div className="relative group flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by code, name or department..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm shadow-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={filterSemester}
                            onChange={(e) => setFilterSemester(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white cursor-pointer"
                        >
                            <option value="all">All Semesters</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                <option key={sem} value={sem}>Semester {sem}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-3 py-2 border rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${showFilters
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                        </button>
                    </div>
                </div>

                {/* Table Layout */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-100">
                                <th className="px-6 py-4">Subject Info</th>
                                <th className="px-6 py-4">Credits & Units</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 bg-white/30">
                            {displayedSubjects.map((subject) => (
                                <tr key={subject.id} className="group hover:bg-indigo-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getRandomGradient(subject.subjectCode)} flex items-center justify-center text-white font-bold shadow-sm text-xs`}>
                                                {subject.subjectCode.substring(0, 2)}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{subject.subjectName}</div>
                                                <div className="text-xs text-gray-500 font-mono">{subject.subjectCode} • {subject.department || 'General'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                <Award className="w-3.5 h-3.5 text-purple-500" />
                                                {subject.credits} Credits
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                                                {subject.totalUnits} Units
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${getSemesterColor(subject.semester)}`}>
                                                Semester {subject.semester}
                                            </span>
                                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(subject.createdAt?.toDate?.() || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <p className="text-sm text-gray-600 truncate" title={subject.description}>
                                            {subject.description || 'No description provided'}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditSubject(subject)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSubject(subject.id, subject.subjectCode)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {sortedSubjects.length === 0 && (
                        <div className="py-16 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                <Book className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No subjects found</h3>
                            <p className="text-gray-500 mt-1">
                                {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding a new subject'}
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={() => setShowAddSubject(true)}
                                    className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                                >
                                    + Add Subject
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
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

            {/* Add/Edit Subject Modal */}
            {showAddSubject && createPortal(
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 sm:p-6 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[75vh] overflow-hidden flex flex-col animate-scale-in">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                    {editingSubjectId ? <Edit className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
                                </div>
                                {editingSubjectId ? 'Edit Subject' : 'Add New Subject'}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowAddSubject(false);
                                    setEditingSubjectId(null);
                                    setNewSubject({
                                        subjectCode: "",
                                        subjectName: "",
                                        department: "",
                                        semester: 1,
                                        totalUnits: 5,
                                        credits: 3,
                                        description: ""
                                    });
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <div className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                            Subject Code <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newSubject.subjectCode}
                                            onChange={(e) => setNewSubject({ ...newSubject, subjectCode: e.target.value.toUpperCase() })}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                                            placeholder="e.g. CS101"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Credits</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={newSubject.credits}
                                            onChange={(e) => setNewSubject({ ...newSubject, credits: parseInt(e.target.value) || 3 })}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        Subject Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newSubject.subjectName}
                                        onChange={(e) => setNewSubject({ ...newSubject, subjectName: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                                        placeholder="e.g. Introduction to Programming"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Department</label>
                                        <input
                                            type="text"
                                            value={newSubject.department}
                                            onChange={(e) => setNewSubject({ ...newSubject, department: e.target.value })}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                                            placeholder="e.g. CSE"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Semester</label>
                                        <select
                                            value={newSubject.semester}
                                            onChange={(e) => setNewSubject({ ...newSubject, semester: parseInt(e.target.value) })}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-white cursor-pointer text-sm"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                                <option key={sem} value={sem}>Semester {sem}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Total Units</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={newSubject.totalUnits}
                                            onChange={(e) => setNewSubject({ ...newSubject, totalUnits: parseInt(e.target.value) || 5 })}
                                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Description</label>
                                    <textarea
                                        value={newSubject.description}
                                        onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                                        rows="3"
                                        placeholder="Brief description of the subject and its objectives..."
                                    />
                                </div>

                                {/* Info Box */}
                                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-xs font-bold text-blue-900 mb-0.5 uppercase tracking-wide">Important</h4>
                                        <p className="text-xs text-blue-700/80 leading-relaxed">
                                            Subject code must be unique. Updating credits or units will affect new question papers generated for this subject.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex gap-3 flex-shrink-0">
                            <button
                                onClick={() => {
                                    setShowAddSubject(false);
                                    setEditingSubjectId(null);
                                    setNewSubject({
                                        subjectCode: "",
                                        subjectName: "",
                                        department: "",
                                        semester: 1,
                                        totalUnits: 5,
                                        credits: 3,
                                        description: ""
                                    });
                                }}
                                className="flex-1 px-4 py-2.5 border border-gray-200 bg-white text-gray-600 rounded-xl hover:bg-gray-50 font-medium transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={editingSubjectId ? handleUpdateSubject : handleAddSubject}
                                disabled={loading}
                                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-70 font-medium shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        {editingSubjectId ? <Edit className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                        {editingSubjectId ? "Update Subject" : "Create Subject"}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}