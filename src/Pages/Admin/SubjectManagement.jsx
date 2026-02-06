import React, { useState } from 'react';
import { Book, FolderPlus, Edit, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
    const itemsPerPage = 5;

    // Filter Logic (Prepared for future use, currently passes all)
    const filteredSubjects = allSubjects;

    // Pagination Logic
    const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);
    const displayedSubjects = filteredSubjects.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Subject Management</h2>
                    <p className="text-sm text-gray-500 mt-1">{allSubjects.length} total subjects</p>
                </div>
                <button onClick={() => setShowAddSubject(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <FolderPlus className="w-4 h-4" /> Add Subject
                </button>
            </div>

            {/* Add Subject Modal */}
            {showAddSubject && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">{editingSubjectId ? "Edit Subject" : "Add New Subject"}</h3>
                            <button onClick={() => { setShowAddSubject(false); setEditingSubjectId(null); setNewSubject({ subjectCode: "", subjectName: "", department: "", semester: 1, totalUnits: 5, credits: 3, description: "" }); }} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code *</label>
                                    <input type="text" value={newSubject.subjectCode} onChange={(e) => setNewSubject({ ...newSubject, subjectCode: e.target.value.toUpperCase() })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="CS101" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                                    <input type="number" min="1" max="10" value={newSubject.credits} onChange={(e) => setNewSubject({ ...newSubject, credits: parseInt(e.target.value) || 3 })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
                                <input type="text" value={newSubject.subjectName} onChange={(e) => setNewSubject({ ...newSubject, subjectName: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Introduction to Programming" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <input type="text" value={newSubject.department} onChange={(e) => setNewSubject({ ...newSubject, department: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Computer Science" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                                    <select value={newSubject.semester} onChange={(e) => setNewSubject({ ...newSubject, semester: parseInt(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                            <option key={sem} value={sem}>Semester {sem}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Units</label>
                                <input type="number" min="1" max="10" value={newSubject.totalUnits} onChange={(e) => setNewSubject({ ...newSubject, totalUnits: parseInt(e.target.value) || 5 })} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea value={newSubject.description} onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" rows="2" placeholder="Subject description..."></textarea>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={editingSubjectId ? handleUpdateSubject : handleAddSubject} disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {loading ? (editingSubjectId ? "Updating..." : "Creating...") : (editingSubjectId ? "Update Subject" : "Create Subject")}
                                </button>
                                <button onClick={() => { setShowAddSubject(false); setEditingSubjectId(null); setNewSubject({ subjectCode: "", subjectName: "", department: "", semester: 1, totalUnits: 5, credits: 3, description: "" }); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Subjects List */}
            <div className="space-y-4">
                {displayedSubjects.map((subject) => (
                    <div key={subject.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <Book className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">{subject.subjectCode}</h3>
                                            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                                                {subject.credits || 3} Credits
                                            </span>
                                            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                                                Sem {subject.semester || 1}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">{subject.subjectName}</p>
                                        <p className="text-xs text-gray-500">{subject.department || "General"}</p>
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-gray-700"><strong>Total Units:</strong> {subject.totalUnits || 5}</span>
                                        <span className="text-gray-700"><strong>Created:</strong> {subject.createdAt?.toDate?.().toLocaleDateString() || "N/A"}</span>
                                    </div>

                                    {subject.description && (
                                        <p className="mt-2 text-sm text-gray-600">{subject.description}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={() => handleEditSubject(subject)} className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1">
                                    <Edit className="w-3 h-3" /> Edit
                                </button>
                                <button onClick={() => handleDeleteSubject(subject.id, subject.subjectCode)} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg flex items-center gap-1">
                                    <Trash2 className="w-3 h-3" /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {allSubjects.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Book className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-lg font-medium">No subjects yet</p>
                        <p className="text-sm mt-1">Create your first subject to get started</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, allSubjects.length)} of {allSubjects.length} subjects
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
