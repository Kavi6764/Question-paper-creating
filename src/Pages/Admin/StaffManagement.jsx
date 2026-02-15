import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { User, UserPlus, X, Edit, Trash2, Lock, Unlock, Award, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function StaffManagement({
    staffList,
    availableSubjects,
    userData,
    showAddStaff,
    setShowAddStaff,
    newStaff,
    setNewStaff,
    editingStaffId,
    setEditingStaffId,
    loading,
    handleAddStaff,
    handleUpdateStaff,
    handleDeleteStaff,
    handleToggleStaffStatus,
    handleAssignSubject,
    handleRemoveSubject,
    setActiveTab
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Filter Logic
    const filteredStaff = useMemo(() => {
        if (!searchTerm) return staffList;
        const lowerTerm = searchTerm.toLowerCase();
        return staffList.filter(staff =>
            (staff.fullName || "").toLowerCase().includes(lowerTerm) ||
            (staff.email || "").toLowerCase().includes(lowerTerm) ||
            (staff.username || "").toLowerCase().includes(lowerTerm) ||
            (staff.department || "").toLowerCase().includes(lowerTerm)
        );
    }, [staffList, searchTerm]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
    const displayedStaff = filteredStaff.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Color Mappings
    const roleColors = {
        hod: "bg-purple-100 text-purple-700 border-purple-200",
        dean: "bg-pink-100 text-pink-700 border-pink-200",
        staff: "bg-blue-100 text-blue-700 border-blue-200",
        admin: "bg-gray-800 text-white border-gray-700"
    };

    const statusColors = {
        active: "bg-emerald-100 text-emerald-700 border-emerald-200",
        pending: "bg-amber-100 text-amber-700 border-amber-200",
        inactive: "bg-rose-100 text-rose-700 border-rose-200"
    };

    const getRandomGradient = (name) => {
        const gradients = [
            "from-blue-400 to-indigo-500",
            "from-purple-400 to-pink-500",
            "from-emerald-400 to-teal-500",
            "from-orange-400 to-red-500",
            "from-cyan-400 to-blue-500"
        ];
        const index = name.length % gradients.length;
        return gradients[index];
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <span className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <UserPlus className="w-5 h-5" />
                        </span>
                        Staff Management
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 ml-11">{filteredStaff.length} active staff members</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search Bar */}
                    <div className="relative group">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name, role..."
                            className="text-sm border border-gray-200 bg-gray-50 rounded-xl pl-10 pr-4 py-2.5 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2">
                        <button onClick={() => setActiveTab("hod-dean")} className="px-4 py-2.5 bg-white text-purple-700 border border-purple-200 rounded-xl hover:bg-purple-50 hover:border-purple-300 flex items-center gap-2 transition-all shadow-sm font-medium">
                            <Award className="w-4 h-4" /> Assign HOD/Dean
                        </button>
                        <button onClick={() => setShowAddStaff(true)} className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all font-medium">
                            <UserPlus className="w-4 h-4" /> Add Staff
                        </button>
                    </div>
                </div>
            </div>

            {/* Add Staff Modal */}
            {showAddStaff && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-100 transform transition-all scale-100 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">{editingStaffId ? "Edit Staff Details" : "Add New Staff"}</h3>
                            <button onClick={() => { setShowAddStaff(false); setEditingStaffId(null); setNewStaff({ email: "", fullName: "", username: "", department: "", subjects: [] }); }} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
                                <input type="email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="staff@example.com" disabled={editingStaffId} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                                <input type="text" value={newStaff.fullName} onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="e.g. Dr. John Doe" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Username <span className="text-red-500">*</span></label>
                                    <input type="text" value={newStaff.username} onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="johndoe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                                    <input type="text" value={newStaff.department} onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="CSE" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Subjects</label>
                                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-2 bg-gray-50/50 custom-scrollbar">
                                    {availableSubjects.length > 0 ? (
                                        availableSubjects.map((subject, idx) => (
                                            <label key={idx} className="flex items-center gap-3 p-2.5 hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-200">
                                                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={newStaff.subjects.includes(subject.code)} onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setNewStaff({ ...newStaff, subjects: [...newStaff.subjects, subject.code] });
                                                    } else {
                                                        setNewStaff({ ...newStaff, subjects: newStaff.subjects.filter(s => s !== subject.code) });
                                                    }
                                                }} />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900">{subject.code}</span>
                                                    <span className="text-xs text-gray-500">{subject.name}</span>
                                                </div>
                                            </label>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 text-gray-500 text-sm">
                                            No subjects found. Add subjects first.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => { setShowAddStaff(false); setEditingStaffId(null); setNewStaff({ email: "", fullName: "", username: "", department: "", subjects: [] }); }} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                                <button onClick={editingStaffId ? () => handleUpdateStaff(editingStaffId) : handleAddStaff} disabled={loading} className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-70 font-medium shadow-md transition-all">
                                    {loading ? (editingStaffId ? "Updating..." : "Creating...") : (editingStaffId ? "Update Staff Member" : "Create Account")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Staff Table */}
            <div className="overflow-x-auto border border-gray-100 rounded-xl mb-6 bg-white shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                            <th className="px-6 py-4">Staff Member</th>
                            <th className="px-6 py-4">Role & Dept</th>
                            <th className="px-6 py-4">Contact</th>
                            <th className="px-6 py-4">Assigned Subjects</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {displayedStaff.map((staff) => (
                            <tr key={staff.id} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getRandomGradient(staff.fullName || staff.username || "")} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                                            {(staff.fullName || staff.username || "?").charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">{staff.fullName || "No Name"}</p>
                                            <p className="text-xs text-gray-500">@{staff.username}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${roleColors[staff.role] || roleColors.staff}`}>
                                            {staff.role === 'hod' ? 'HOD' : staff.role === 'dean' ? 'DEAN' : 'STAFF'}
                                        </span>
                                        <span className="text-sm text-gray-600 ml-1">{staff.department || "-"}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-sm text-gray-600 truncate max-w-[150px]" title={staff.email}>{staff.email}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-2">
                                        {staff.assignedSubjects && staff.assignedSubjects.length > 0 ? (
                                            <div className="flex flex-wrap gap-1">
                                                {staff.assignedSubjects.map((subjectCode) => (
                                                    <span key={subjectCode} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100 group-hover:border-blue-200 transition-colors">
                                                        {subjectCode}
                                                        {staff.role === "staff" && (
                                                            <button onClick={() => handleRemoveSubject(staff.id, subjectCode)} className="hover:text-red-500 rounded-full p-0.5">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">No subjects</span>
                                        )}
                                        {staff.role === "staff" && (
                                            <select
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        handleAssignSubject(staff.id, e.target.value);
                                                        e.target.value = "";
                                                    }
                                                }}
                                                className="text-xs border border-gray-200 bg-white rounded-lg px-2 py-1 w-full max-w-[140px] focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer text-gray-600"
                                            >
                                                <option value="">+ Assign</option>
                                                {availableSubjects.filter(s => !staff.assignedSubjects?.includes(s.code)).map((subject, idx) => (
                                                    <option key={idx} value={subject.code}>{subject.code}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[staff.status || 'active']}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${staff.status === 'inactive' ? 'bg-rose-500' : staff.status === 'pending' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                        {staff.status || 'Active'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            onClick={() => {
                                                setEditingStaffId(staff.id);
                                                setNewStaff({ email: staff.email, fullName: staff.fullName, username: staff.username, department: staff.department, subjects: staff.assignedSubjects || [] });
                                                setShowAddStaff(true);
                                            }}
                                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>

                                        {(userData?.username && userData.username !== staff.username) && (
                                            <button
                                                onClick={() => handleToggleStaffStatus(staff.id, staff.status || "active")}
                                                className={`p-1.5 rounded-lg transition-colors ${(staff.status === "active" || !staff.status)
                                                    ? "text-gray-500 hover:text-orange-600 hover:bg-orange-50"
                                                    : "text-gray-500 hover:text-green-600 hover:bg-green-50"
                                                    }`}
                                                title={staff.status === "active" || !staff.status ? "Deactivate" : "Activate"}
                                            >
                                                {(staff.status === "active" || !staff.status) ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDeleteStaff(staff.id, staff.email)}
                                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {filteredStaff.length === 0 && (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500 border-t border-gray-50">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                            <Search className="w-6 h-6 text-gray-300" />
                                        </div>
                                        <p className="text-base font-medium text-gray-900">No staff found</p>
                                        <p className="text-sm mt-1 max-w-xs">{searchTerm ? `No results matching "${searchTerm}"` : "Get started by adding a new staff member."}</p>
                                        {!searchTerm && (
                                            <button onClick={() => setShowAddStaff(true)} className="mt-4 text-blue-600 font-medium hover:underline text-sm">
                                                + Add New Staff
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                        Showing <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, filteredStaff.length)}</span> of <span className="font-medium text-gray-900">{filteredStaff.length}</span> staff
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                // Simple logic to show first few pages, can be enhanced
                                const pageNum = i + 1;
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                            : "text-gray-600 hover:bg-gray-50 bg-white border border-gray-200"
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
