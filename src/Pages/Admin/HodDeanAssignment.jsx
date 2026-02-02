import React from 'react';
import { Award, X, AlertCircle } from 'lucide-react';

export default function HodDeanAssignment({
    showAssignHodDean,
    setShowAssignHodDean,
    hodDeanAssignment,
    setHodDeanAssignment,
    loading,
    handleAssignHodDean,
    staffList
}) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Assign HOD/Dean Roles</h2>
                <button onClick={() => setShowAssignHodDean(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                    <Award className="w-4 h-4" /> Assign Role
                </button>
            </div>

            {/* Assign HOD/Dean Modal */}
            {showAssignHodDean && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Assign HOD/Dean Role</h3>
                            <button onClick={() => { setShowAssignHodDean(false); setHodDeanAssignment({ username: "", role: "hod", department: "" }); }} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                                <input type="text" value={hodDeanAssignment.username} onChange={(e) => setHodDeanAssignment({ ...hodDeanAssignment, username: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Enter existing username" />
                                <p className="text-xs text-gray-500 mt-1">User must already exist in the system</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                                <select value={hodDeanAssignment.role} onChange={(e) => setHodDeanAssignment({ ...hodDeanAssignment, role: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                                    <option value="hod">Head of Department (HOD)</option>
                                    <option value="dean">Dean</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                                <input type="text" value={hodDeanAssignment.department} onChange={(e) => setHodDeanAssignment({ ...hodDeanAssignment, department: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Computer Science" />
                            </div>

                            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                <p className="text-sm text-purple-800">
                                    <AlertCircle className="w-4 h-4 inline mr-1" />
                                    This will give the user special administrative privileges. They will be able to access the admin dashboard.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={handleAssignHodDean} disabled={loading} className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50">
                                    {loading ? "Assigning..." : "Assign Role"}
                                </button>
                                <button onClick={() => { setShowAssignHodDean(false); setHodDeanAssignment({ username: "", role: "hod", department: "" }); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Current HODs and Deans */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Current HODs</h3>
                    <div className="space-y-3">
                        {staffList.filter(staff => staff.role === "hod").map((hod) => (
                            <div key={hod.id} className="border border-purple-200 bg-purple-50 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-purple-900">{hod.fullName}</h4>
                                        <p className="text-sm text-purple-700">@{hod.username} • {hod.email}</p>
                                        <p className="text-sm text-purple-600">{hod.department}</p>
                                    </div>
                                    <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium">
                                        HOD
                                    </span>
                                </div>
                            </div>
                        ))}

                        {staffList.filter(staff => staff.role === "hod").length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Award className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-lg font-medium">No HODs assigned yet</p>
                                <p className="text-sm mt-1">Assign HOD role to staff members</p>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Deans</h3>
                    <div className="space-y-3">
                        {staffList.filter(staff => staff.role === "dean").map((dean) => (
                            <div key={dean.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-semibold text-red-900">{dean.fullName}</h4>
                                        <p className="text-sm text-red-700">@{dean.username} • {dean.email}</p>
                                        <p className="text-sm text-red-600">{dean.department}</p>
                                    </div>
                                    <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium">
                                        DEAN
                                    </span>
                                </div>
                            </div>
                        ))}

                        {staffList.filter(staff => staff.role === "dean").length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                <Award className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                                <p className="text-lg font-medium">No Deans assigned yet</p>
                                <p className="text-sm mt-1">Assign Dean role to staff members</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
