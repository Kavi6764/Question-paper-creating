import React from 'react';
import { User, UserPlus, X, Edit, Trash2, Lock, Unlock, Award } from 'lucide-react';

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
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
                <div className="flex gap-3">
                    <button onClick={() => setActiveTab("hod-dean")} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                        <Award className="w-4 h-4" /> Assign HOD/Dean
                    </button>
                    <button onClick={() => setShowAddStaff(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                        <UserPlus className="w-4 h-4" /> Add Staff
                    </button>
                </div>
            </div>

            {/* Add Staff Modal */}
            {showAddStaff && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">{editingStaffId ? "Edit Staff" : "Add New Staff"}</h3>
                            <button onClick={() => { setShowAddStaff(false); setEditingStaffId(null); setNewStaff({ email: "", fullName: "", username: "", department: "", subjects: [] }); }} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input type="email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="staff@example.com" disabled={editingStaffId} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input type="text" value={newStaff.fullName} onChange={(e) => setNewStaff({ ...newStaff, fullName: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                                <input type="text" value={newStaff.username} onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="johndoe" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                <input type="text" value={newStaff.department} onChange={(e) => setNewStaff({ ...newStaff, department: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Computer Science" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Subjects</label>
                                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                                    {availableSubjects.length > 0 ? (
                                        availableSubjects.map((subject, idx) => (
                                            <label key={idx} className="flex items-center gap-2 p-2 hover:bg-gray-50">
                                                <input type="checkbox" checked={newStaff.subjects.includes(subject.code)} onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setNewStaff({ ...newStaff, subjects: [...newStaff.subjects, subject.code] });
                                                    } else {
                                                        setNewStaff({ ...newStaff, subjects: newStaff.subjects.filter(s => s !== subject.code) });
                                                    }
                                                }} />
                                                <span className="text-sm">{subject.code} - {subject.name}</span>
                                            </label>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400 p-2">No subjects available. Create subjects first.</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={editingStaffId ? () => handleUpdateStaff(editingStaffId) : handleAddStaff} disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                    {loading ? (editingStaffId ? "Updating..." : "Creating...") : (editingStaffId ? "Update Staff" : "Create Staff Account")}
                                </button>
                                <button onClick={() => { setShowAddStaff(false); setEditingStaffId(null); setNewStaff({ email: "", fullName: "", username: "", department: "", subjects: [] }); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Staff List */}
            <div className="space-y-4">
                {staffList.map((staff) => (
                    <div key={staff.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <User className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{staff.fullName || staff.name || "No Name"}</h3>
                                        <p className="text-sm text-gray-600">{staff.email || "No email"}</p>
                                        <p className="text-xs text-gray-500">@{staff.username || "No username"}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${staff.role === 'hod' ? 'bg-purple-100 text-purple-800' :
                                            staff.role === 'dean' ? 'bg-red-100 text-red-800' :
                                                staff.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    staff.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {staff.role === 'hod' ? 'HOD' : staff.role === 'dean' ? 'DEAN' : staff.role?.toUpperCase() || 'STAFF'}
                                    </span>
                                </div>

                                <div className="mt-3">
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="text-gray-700"><strong>Department:</strong> {staff.department || "Not specified"}</span>
                                        <span className="text-gray-700"><strong>Role:</strong> {staff.role?.toUpperCase()}</span>
                                        <span className="text-gray-700"><strong>Created:</strong> {staff.createdAt?.toDate?.().toLocaleDateString() || "N/A"}</span>
                                    </div>

                                    {staff.assignedSubjects && staff.assignedSubjects.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-sm font-medium text-gray-700 mb-1">Assigned Subjects:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {staff.assignedSubjects.map((subjectCode) => (
                                                    <span key={subjectCode} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1">
                                                        {subjectCode}
                                                        {staff.role === "staff" && (
                                                            <button onClick={() => handleRemoveSubject(staff.id, subjectCode)} className="hover:text-red-600">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {staff.role === "staff" && (
                                <div className="flex flex-col gap-2">
                                    <select onChange={(e) => { if (e.target.value) { handleAssignSubject(staff.id, e.target.value); e.target.value = ""; } }} className="text-sm border border-gray-300 rounded-lg px-3 py-1 mb-2">
                                        <option value="">Assign Subject</option>
                                        {availableSubjects.filter(s => !staff.assignedSubjects?.includes(s.code)).map((subject, idx) => (
                                            <option key={idx} value={subject.code}>{subject.code} - {subject.name}</option>
                                        ))}
                                    </select>

                                    <div className="flex gap-2">
                                        <button onClick={() => { setEditingStaffId(staff.id); setNewStaff({ email: staff.email, fullName: staff.fullName, username: staff.username, department: staff.department, subjects: staff.assignedSubjects || [] }); setShowAddStaff(true); }} className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1">
                                            <Edit className="w-3 h-3" /> Edit
                                        </button>
                                        <button onClick={() => handleDeleteStaff(staff.id, staff.email)} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg flex items-center gap-1">
                                            <Trash2 className="w-3 h-3" /> Delete
                                        </button>

                                        {/* Check for self-deactivation and ensure user has permissions */}
                                        {(userData.username !== staff.username) && (
                                            <button
                                                onClick={() => handleToggleStaffStatus(staff.id, staff.status || "active")}
                                                className={`px-3 py-1 text-sm border rounded-lg flex items-center gap-1 ${(staff.status === "active" || !staff.status)
                                                    ? "text-orange-600 hover:bg-orange-50 border-orange-200"
                                                    : "text-green-600 hover:bg-green-50 border-green-200"
                                                    }`}
                                            >
                                                {(staff.status === "active" || !staff.status) ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                                                {(staff.status === "active" || !staff.status) ? "Deactivate" : "Activate"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {staffList.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-lg font-medium">No staff members yet</p>
                        <p className="text-sm mt-1">Add your first staff member to get started</p>
                    </div>
                )}
            </div>
        </div>
    );
}
