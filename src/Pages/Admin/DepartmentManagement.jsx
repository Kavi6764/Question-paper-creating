import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
    Building2, 
    Plus, 
    Search, 
    Edit, 
    Trash2, 
    X, 
    Users, 
    UserPlus, 
    UserMinus,
    ChevronLeft,
    ChevronRight,
    Info,
    LayoutGrid,
    List
} from 'lucide-react';

export default function DepartmentManagement({
    departments,
    staffList,
    loading,
    handleAddDepartment,
    handleUpdateDepartment,
    handleDeleteDepartment,
    handleAssignStaffToDept,
    handleRemoveStaffFromDept
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
    const [showAddModal, setShowAddModal] = useState(false);
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [selectedDept, setSelectedDept] = useState(null);
    const [newDept, setNewDept] = useState({ name: "" });
    const [editingDeptId, setEditingDeptId] = useState(null);
    
    const itemsPerPage = viewMode === "grid" ? 6 : 8;

    // Filter Logic
    const filteredDepts = useMemo(() => {
        let list = [...(departments || [])];
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            list = list.filter(dept =>
                (dept.name || "").toLowerCase().includes(lowerTerm)
            );
        }
        return list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }, [departments, searchTerm]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredDepts.length / itemsPerPage);
    const displayedDepts = filteredDepts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when search changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, viewMode]);

    const handleOpenAdd = () => {
        setEditingDeptId(null);
        setNewDept({ name: "" });
        setShowAddModal(true);
    };

    const handleOpenEdit = (dept) => {
        setEditingDeptId(dept.id);
        setNewDept({ name: dept.name });
        setShowAddModal(true);
    };

    const handleOpenStaff = (dept) => {
        setSelectedDept(dept);
        setShowStaffModal(true);
    };

    const getStaffCount = (deptId) => {
        return staffList.filter(s => s.departmentId === deptId || s.department === departments.find(d => d.id === deptId)?.name).length;
    };

    const getDeptStaff = (dept) => {
        return staffList.filter(s => s.departmentId === dept.id || s.department === dept.name);
    };

    const getAvailableStaff = (dept) => {
        return staffList.filter(s => s.departmentId !== dept.id && s.department !== dept.name);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header Section */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                <Building2 className="w-5 h-5" />
                            </span>
                            Department Management
                        </h2>
                        <p className="text-sm text-gray-500 mt-1 ml-11">{departments.length} departments registered</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        {/* Search */}
                        <div className="relative group">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search departments..."
                                className="text-sm border border-gray-200 bg-gray-50 rounded-xl pl-10 pr-4 py-2.5 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white transition-all shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                            <button 
                                onClick={() => setViewMode("grid")}
                                className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setViewMode("list")}
                                className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>

                        <button 
                            onClick={handleOpenAdd}
                            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all font-medium"
                        >
                            <Plus className="w-4 h-4" /> Add Department
                        </button>
                    </div>
                </div>
            </div>

            {/* Department Grid/List */}
            {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedDepts.map((dept) => (
                        <div key={dept.id} className="glass-card rounded-2xl p-6 group hover:shadow-xl transition-all duration-300 border border-white/50 hover:border-indigo-200">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenEdit(dept)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDeleteDepartment(dept.id, dept.name)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{dept.name}</h3>
                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-6">
                                <Users className="w-4 h-4" />
                                <span>{getStaffCount(dept.id)} Staff Members</span>
                            </div>
                            <button 
                                onClick={() => handleOpenStaff(dept)}
                                className="w-full py-2.5 bg-gray-50 text-gray-700 rounded-xl hover:bg-indigo-50 hover:text-indigo-700 border border-gray-100 font-medium transition-all flex items-center justify-center gap-2"
                            >
                                <Info className="w-4 h-4" /> View Details & Staff
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                <th className="px-6 py-4">Department Name</th>
                                <th className="px-6 py-4">Staff Count</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {displayedDepts.map((dept) => (
                                <tr key={dept.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                <Building2 className="w-4 h-4" />
                                            </div>
                                            <span className="font-semibold text-gray-900">{dept.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                                            <Users className="w-3 h-3" />
                                            {getStaffCount(dept.id)} Staff
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handleOpenStaff(dept)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View Staff">
                                                <Info className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleOpenEdit(dept)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteDepartment(dept.id, dept.name)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {filteredDepts.length === 0 && (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No departments found</h3>
                    <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                        {searchTerm ? `No results matching "${searchTerm}"` : "Get started by creating your first department."}
                    </p>
                    {!searchTerm && (
                        <button onClick={handleOpenAdd} className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium shadow-lg shadow-indigo-500/20">
                            Create Department
                        </button>
                    )}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                        Showing <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, filteredDepts.length)}</span> of <span className="font-medium text-gray-900">{filteredDepts.length}</span> departments
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
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                                        : "text-gray-600 hover:bg-gray-50 bg-white border border-gray-200"
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
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

            {/* Add/Edit Modal */}
            {showAddModal && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-100 transform transition-all scale-100 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">{editingDeptId ? "Edit Department" : "Create New Department"}</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Department Name <span className="text-red-500">*</span></label>
                                <input 
                                    type="text" 
                                    value={newDept.name} 
                                    onChange={(e) => setNewDept({ name: e.target.value })} 
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" 
                                    placeholder="e.g. Computer Science & Engineering" 
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                                <button 
                                    onClick={() => {
                                        if (editingDeptId) handleUpdateDepartment(editingDeptId, newDept.name);
                                        else handleAddDepartment(newDept.name);
                                        setShowAddModal(false);
                                    }} 
                                    disabled={loading || !newDept.name}
                                    className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 rounded-xl hover:from-indigo-700 hover:to-blue-700 disabled:opacity-70 font-medium shadow-md transition-all"
                                >
                                    {loading ? "Processing..." : editingDeptId ? "Update Department" : "Create Department"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Department Details & Staff Modal */}
            {showStaffModal && selectedDept && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-4xl w-full mx-4 shadow-2xl border border-gray-100 transform transition-all scale-100 animate-scale-in max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">{selectedDept.name}</h3>
                                    <p className="text-sm text-gray-500">Manage staff members for this department</p>
                                </div>
                            </div>
                            <button onClick={() => setShowStaffModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 overflow-hidden">
                            {/* Currently Assigned */}
                            <div className="flex flex-col bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-white/50 backdrop-blur-sm flex justify-between items-center">
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                        Assigned Staff
                                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                                            {getDeptStaff(selectedDept).length}
                                        </span>
                                    </h4>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    {getDeptStaff(selectedDept).length > 0 ? (
                                        getDeptStaff(selectedDept).map((staff) => (
                                            <div key={staff.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm group hover:border-red-100 hover:shadow-md transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                                        {(staff.fullName || staff.username).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{staff.fullName || staff.username}</p>
                                                        <p className="text-xs text-gray-500 uppercase font-medium">{staff.role}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleRemoveStaffFromDept(staff.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Remove from Department"
                                                >
                                                    <UserMinus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                                            <Users className="w-8 h-8 mb-2 opacity-20" />
                                            <p className="text-sm">No staff assigned</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Available to Assign */}
                            <div className="flex flex-col bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 bg-white/50 backdrop-blur-sm">
                                    <h4 className="font-bold text-gray-800">Available Staff</h4>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                    {getAvailableStaff(selectedDept).length > 0 ? (
                                        getAvailableStaff(selectedDept).map((staff) => (
                                            <div key={staff.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm group hover:border-indigo-100 hover:shadow-md transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-sm">
                                                        {(staff.fullName || staff.username).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{staff.fullName || staff.username}</p>
                                                        <p className="text-xs text-gray-500 uppercase font-medium">{staff.role} • {staff.department || "No Dept"}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleAssignStaffToDept(staff.id, selectedDept.name)}
                                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Assign to Department"
                                                >
                                                    <UserPlus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                                            <p className="text-sm">No available staff members</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                            <button 
                                onClick={() => setShowStaffModal(false)}
                                className="px-8 py-3 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all font-bold shadow-lg shadow-gray-200"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
