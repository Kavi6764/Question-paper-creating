import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Award, X, AlertCircle, Shield, User, Search, ChevronDown, Check } from 'lucide-react';

export default function HodDeanAssignment({
    showAssignHodDean,
    setShowAssignHodDean,
    hodDeanAssignment,
    setHodDeanAssignment,
    loading,
    handleAssignHodDean,
    staffList
}) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef(null);

    // Helper for gradient avatars
    const getRandomGradient = (name) => {
        const gradients = [
            "from-purple-400 to-pink-500",
            "from-blue-400 to-indigo-500",
            "from-emerald-400 to-teal-500",
            "from-orange-400 to-red-500",
        ];
        const index = name.length % gradients.length;
        return gradients[index];
    };

    // Filter staff who are NOT already Admins (HOD/Dean) and match search
    const selectableStaff = staffList.filter(staff => {
        const isNotAdmin = staff.role === "staff" || (!staff.role && staff.username !== "admin");
        const matchesSearch = (staff.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (staff.username || "").toLowerCase().includes(searchTerm.toLowerCase());
        return isNotAdmin && matchesSearch;
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectStaff = (staff) => {
        setHodDeanAssignment({ ...hodDeanAssignment, username: staff.username });
        setSearchTerm(staff.fullName || staff.username);
        setIsDropdownOpen(false);
    };

    const RoleTable = ({ title, role, color, icon: Icon }) => {
        const staffWithRole = staffList.filter(staff => staff.role === role);

        return (
            <div className={`overflow-hidden rounded-2xl border border-${color}-100 bg-white shadow-sm mb-8`}>
                <div className={`bg-${color}-50/50 px-6 py-4 border-b border-${color}-100 flex items-center justify-between`}>
                    <h3 className={`font-bold text-${color}-900 flex items-center gap-2`}>
                        <Icon className={`w-5 h-5 text-${color}-600`} /> {title}
                    </h3>
                    <span className={`bg-${color}-100 text-${color}-700 px-2.5 py-0.5 rounded-full text-xs font-bold`}>
                        {staffWithRole.length} Assigned
                    </span>
                </div>

                {staffWithRole.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold bg-gray-50/30">
                                    <th className="px-6 py-3">Staff Member</th>
                                    <th className="px-6 py-3">Department</th>
                                    <th className="px-6 py-3">Contact Info</th>
                                    <th className="px-6 py-3 text-right">Role</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {staffWithRole.map((staff) => (
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
                                            <span className="text-sm text-gray-700 font-medium">{staff.department || "-"}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-500">{staff.email}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wide bg-${role === 'hod' ? 'purple' : 'pink'}-50 text-${role === 'hod' ? 'purple' : 'pink'}-700 border-${role === 'hod' ? 'purple' : 'pink'}-100`}>
                                                {role}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-50/30">
                        <div className={`w-12 h-12 bg-${color}-50 rounded-full flex items-center justify-center mx-auto mb-3`}>
                            <Icon className={`w-6 h-6 text-${color}-300`} />
                        </div>
                        <p className="text-sm font-medium">No {role === 'hod' ? 'HODs' : 'Deans'} assigned yet</p>
                        <p className="text-xs mt-1 text-gray-400">Use the 'Assign Role' button to add one.</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                            <Award className="w-5 h-5" />
                        </div>
                        Admin Roles
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 ml-12">Manage Head of Departments and Deans</p>
                </div>

                <button
                    onClick={() => setShowAssignHodDean(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 flex items-center gap-2 shadow-lg shadow-purple-500/30 transition-all font-medium"
                >
                    <Award className="w-4 h-4" /> Assign New Role
                </button>
            </div>

            <RoleTable title="Head of Departments" role="hod" color="purple" icon={User} />
            <RoleTable title="Deans" role="dean" color="pink" icon={Shield} />

            {/* Assign HOD/Dean Modal */}
            {showAssignHodDean && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-100 transform transition-all scale-100 animate-scale-in">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Assign Administrative Role</h3>
                            <button onClick={() => { setShowAssignHodDean(false); setHodDeanAssignment({ username: "", role: "hod", department: "" }); setSearchTerm(""); }} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="relative" ref={dropdownRef}>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                                    <span>Select Staff Member <span className="text-red-500">*</span></span>
                                    {hodDeanAssignment.username && (
                                        <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-1.5 py-0.5 rounded">
                                            UID: {hodDeanAssignment.username}
                                        </span>
                                    )}
                                </label>

                                <div
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 flex items-center justify-between cursor-pointer transition-all hover:bg-gray-50 ${isDropdownOpen ? 'ring-2 ring-purple-500/20 border-purple-500 bg-white' : 'bg-white'}`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <User className="w-4 h-4 text-gray-400 shrink-0" />
                                        <span className={`truncate ${searchTerm ? 'text-gray-900' : 'text-gray-400'}`}>
                                            {searchTerm || "Search and select a staff member..."}
                                        </span>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                </div>

                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-100 shadow-xl z-50 overflow-hidden animate-slide-up">
                                        <div className="p-2 border-b border-gray-50">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="w-full pl-9 pr-4 py-2 text-sm border-0 focus:ring-0 outline-none"
                                                    placeholder="Search by name or username..."
                                                />
                                            </div>
                                        </div>

                                        <div className="max-h-60 overflow-y-auto">
                                            {selectableStaff.length > 0 ? (
                                                selectableStaff.map((staff) => (
                                                    <div
                                                        key={staff.id}
                                                        onClick={() => handleSelectStaff(staff)}
                                                        className="px-4 py-3 hover:bg-purple-50 cursor-pointer flex items-center justify-between group transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getRandomGradient(staff.fullName || staff.username || "")} flex items-center justify-center text-white font-bold text-xs`}>
                                                                {(staff.fullName || staff.username || "?").charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-900 group-hover:text-purple-700">{staff.fullName || staff.username}</p>
                                                                <p className="text-[10px] text-gray-500 italic">@{staff.username}</p>
                                                            </div>
                                                        </div>
                                                        {hodDeanAssignment.username === staff.username && (
                                                            <Check className="w-4 h-4 text-purple-600" />
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-8 text-center">
                                                    <p className="text-sm text-gray-500">No staff found</p>
                                                    <p className="text-[10px] text-gray-400 mt-1">Try a different search term</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <p className="text-[10px] text-gray-500 mt-1.5 flex items-center gap-1 px-1">
                                    <AlertCircle className="w-3 h-3" /> Select a regular staff member to promote
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Role <span className="text-red-500">*</span></label>
                                <select
                                    value={hodDeanAssignment.role}
                                    onChange={(e) => setHodDeanAssignment({ ...hodDeanAssignment, role: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all appearance-none cursor-pointer bg-white"
                                >
                                    <option value="hod">Head of Department (HOD)</option>
                                    <option value="dean">Dean</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Department <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={hodDeanAssignment.department}
                                    onChange={(e) => setHodDeanAssignment({ ...hodDeanAssignment, department: e.target.value })}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                    placeholder="e.g. Computer Science"
                                />
                            </div>

                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    <strong>Important:</strong> Assigning this role will grant the user extended administrative privileges, including access to the Admin Dashboard and staff management tools.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => { setShowAssignHodDean(false); setHodDeanAssignment({ username: "", role: "hod", department: "" }); setSearchTerm(""); }} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                                <button
                                    onClick={handleAssignHodDean}
                                    disabled={loading}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-70 font-medium shadow-md transition-all"
                                >
                                    {loading ? "Assigning..." : "Confirm Assignment"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
