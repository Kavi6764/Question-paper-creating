import React, { useState, useEffect } from 'react';
import { 
    Building, 
    MapPin, 
    Phone, 
    Mail, 
    Globe, 
    Save, 
    User, 
    Lock, 
    Shield, 
    Users, 
    Book, 
    Layers, 
    Building2, 
    Timer, 
    FileText, 
    GraduationCap, 
    BookOpen, 
    BarChart3 
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../../fireBaseConfig';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import toast from 'react-hot-toast';

export default function CollegeSettings({ onUpdate, userData }) {
    const [activeTab, setActiveTab] = useState("college");
    const [loading, setLoading] = useState(false);
    const [modulesState, setModulesState] = useState({});
    const [examConfig, setExamConfig] = useState({ isEndTerm: false });

    // College Settings State
    const [formData, setFormData] = useState({
        collegeName: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '',
        website: ''
    });

    // Profile State
    const [profileForm, setProfileForm] = useState({
        fullName: userData?.fullName || userData?.name || "",
        department: userData?.department || "Admin Office",
        email: userData?.email || "",
        role: userData?.role || ""
    });

    // Password State
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (activeTab === 'controls') {
            const docRef = doc(db, 'settings', 'moduleVisibility');
            const unsub = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    setModulesState(docSnap.data());
                }
            });
            const examRef = doc(db, 'settings', 'examConfig');
            const unsubExam = onSnapshot(examRef, (docSnap) => {
                if (docSnap.exists()) {
                    setExamConfig(docSnap.data());
                }
            });
            return () => {
                unsub();
                unsubExam();
            };
        }
    }, [activeTab]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const docRef = doc(db, 'Address', 'college_settings');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setFormData(prev => ({
                    ...prev,
                    ...docSnap.data()
                }));
                if (onUpdate) onUpdate(docSnap.data());
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleVisibilityToggle = async (moduleId, value) => {
        try {
            const docRef = doc(db, 'settings', 'moduleVisibility');
            await setDoc(docRef, { [moduleId]: value }, { merge: true });
            toast.success(`Visibility updated for ${moduleId}`);
        } catch (error) {
            console.error("Error updating visibility:", error);
            toast.error("Failed to update visibility");
        }
    };

    const handleExamConfigToggle = async (isEndTerm) => {
        try {
            const docRef = doc(db, 'settings', 'examConfig');
            await setDoc(docRef, { isEndTerm }, { merge: true });
            toast.success(`Exam Type set to ${isEndTerm ? 'End Term' : 'Mid Term'}`);
        } catch (error) {
            console.error("Error updating exam config:", error);
            toast.error("Failed to update exam configuration");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCollegeSubmit = async (e) => {
        e.preventDefault();
        if (!formData.collegeName) {
            toast.error("College Name is required");
            return;
        }

        try {
            setLoading(true);
            const docRef = doc(db, 'Address', 'college_settings');
            const cleanData = Object.fromEntries(
                Object.entries(formData).map(([key, value]) => [key, value === undefined ? '' : value])
            );
            const dataToSave = { ...cleanData, updatedAt: serverTimestamp() };
            await setDoc(docRef, dataToSave);
            toast.success("College details saved successfully");
            if (onUpdate) onUpdate(dataToSave);
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Error saving settings");
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("No user logged in");
            if (user.displayName !== profileForm.fullName) {
                await updateProfile(user, { displayName: profileForm.fullName });
            }
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { fullName: profileForm.fullName, name: profileForm.fullName });
            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Profile update error:", error);
            toast.error("Failed to update profile: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("No user logged in");
            const credential = EmailAuthProvider.credential(user.email, passwordForm.currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, passwordForm.newPassword);
            toast.success("Password updated successfully!");
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error) {
            console.error("Password update error:", error);
            toast.error("Failed to update password: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row min-h-[600px]">
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 bg-gray-50/50 p-6 border-r border-gray-100">
                    <div className="mb-8 px-2">
                        <h2 className="text-xl font-bold text-gray-900">Settings</h2>
                        <p className="text-[10px] text-gray-500 mt-1 font-semibold uppercase tracking-wider">Configuration Panel</p>
                    </div>

                    <nav className="space-y-1.5">
                        <button
                            onClick={() => setActiveTab("college")}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === "college" ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-100"}`}
                        >
                            <Building className="w-4 h-4" />
                            <span>College Profile</span>
                        </button>

                        <button
                            onClick={() => setActiveTab("account")}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === "account" ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-100"}`}
                        >
                            <User className="w-4 h-4" />
                            <span>My Account</span>
                        </button>

                        <button
                            onClick={() => setActiveTab("security")}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === "security" ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-100"}`}
                        >
                            <Lock className="w-4 h-4" />
                            <span>Security</span>
                        </button>

                        {userData?.role === 'dean' && (
                            <button
                                onClick={() => setActiveTab("controls")}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === "controls" ? "bg-purple-600 text-white shadow-md shadow-purple-100" : "text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-100"}`}
                            >
                                <Shield className="w-4 h-4" />
                                <span>Role Controls</span>
                            </button>
                        )}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white p-6 md:p-10">
                    {activeTab === "college" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-400">
                            <div className="pb-4 border-b border-gray-50">
                                <h3 className="text-xl font-bold text-gray-900 tracking-tight">College Profile</h3>
                                <p className="text-sm text-gray-500 font-medium mt-1">Configure institutional details for official documents</p>
                            </div>
                            <form onSubmit={handleCollegeSubmit} className="space-y-6 max-w-3xl">
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 ml-1">Full College Name</label>
                                        <div className="relative">
                                            <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input type="text" name="collegeName" value={formData.collegeName} onChange={handleChange} placeholder="Enter college name" className="w-full pl-11 pr-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-semibold text-gray-800" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 ml-1">Location Address</label>
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} placeholder="Address Line 1" className="w-full pl-11 pr-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-semibold text-gray-800" />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} placeholder="Address Line 2" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-semibold text-gray-800" />
                                                <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-semibold text-gray-800" />
                                                <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="State" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-semibold text-gray-800" />
                                                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} placeholder="Pincode" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-semibold text-gray-800" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl font-semibold outline-none" />
                                        </div>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl font-semibold outline-none" />
                                        </div>
                                        <div className="relative">
                                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input type="text" name="website" value={formData.website} onChange={handleChange} placeholder="Website" className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl font-semibold outline-none" />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-8 flex justify-end">
                                    <button type="submit" disabled={loading} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold shadow-lg">Save Profile</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === "account" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-400">
                            <div className="pb-4 border-b border-gray-50">
                                <h3 className="text-xl font-bold text-gray-900">Account Information</h3>
                                <p className="text-sm text-gray-500">Manage your administrative profile details</p>
                            </div>
                            <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-2xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Full Name</label>
                                        <input type="text" value={profileForm.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-semibold outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Email Address</label>
                                        <input type="email" value={profileForm.email} disabled className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-semibold cursor-not-allowed" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Department</label>
                                        <input type="text" value={profileForm.department} disabled className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Access Role</label>
                                        <input type="text" value={profileForm.role.toUpperCase()} disabled className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-bold" />
                                    </div>
                                </div>
                                <div className="pt-8 flex justify-end">
                                    <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">Update Details</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === "security" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-400">
                            <div className="pb-4 border-b border-gray-50">
                                <h3 className="text-xl font-bold text-gray-900">Security & Password</h3>
                                <p className="text-sm text-gray-500">Keep your account secure with regular password updates</p>
                            </div>
                            <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-2xl">
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Current Password</label>
                                        <input type="password" required value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-semibold outline-none" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">New Password</label>
                                            <input type="password" required minLength={6} value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700">Confirm Password</label>
                                            <input type="password" required minLength={6} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl outline-none" />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-8 flex justify-end">
                                    <button type="submit" disabled={loading} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold">Update Security</button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === "controls" && userData?.role === 'dean' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-400">
                            <div className="pb-4 border-b border-gray-50 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">Role-Based Visibility Controls</h3>
                                    <p className="text-sm text-gray-500 font-medium mt-1">Control which modules are visible to HOD and other roles</p>
                                </div>
                                <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold border border-purple-100 italic">Dean Access Only</div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { id: 'staff', label: 'Staff Management', icon: Users },
                                    { id: 'subjects', label: 'Subject Management', icon: Book },
                                    { id: 'question-bank', label: 'Question Bank', icon: Layers },
                                    { id: 'departments', label: 'Dept Management', icon: Building2 },
                                    { id: 'schedule', label: 'Schedule Papers', icon: Timer },
                                    { id: 'generate', label: 'Generate Papers', icon: FileText },
                                    { id: 'assign', label: 'HOD/Dean Assign', icon: GraduationCap },
                                    { id: 'papers', label: 'Generated Papers', icon: BookOpen },
                                    { id: 'activities', label: 'Staff Activities', icon: BarChart3 },
                                    { id: 'settings', label: 'Settings Panel', icon: Building },
                                ].map((mod) => (
                                    <div key={mod.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${modulesState[mod.id] !== false ? 'bg-white border-purple-100 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${modulesState[mod.id] !== false ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-400'}`}>
                                                <mod.icon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-bold ${modulesState[mod.id] !== false ? 'text-gray-900' : 'text-gray-400'}`}>{mod.label}</p>
                                                <p className="text-[10px] text-gray-500">Visible to roles: HOD, Admin</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={modulesState[mod.id] !== false} onChange={(e) => handleVisibilityToggle(mod.id, e.target.checked)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none ring-0 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                                <Shield className="w-5 h-5 text-amber-600 shrink-0" />
                                    <div className="text-xs text-amber-800 leading-relaxed font-medium"><strong>Important:</strong> These settings control if the module tabs appear in the sidebar for other users. As a Dean, you will always see all modules.</div>
                                </div>

                                {/* Exam Type Section */}
                                <div className="mt-8">
                                    <div className="pb-4 border-b border-gray-50 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">Global Exam Configuration</h3>
                                            <p className="text-sm text-gray-500 font-medium mt-1">Dean Decision: Set the active exam type for the entire system</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex flex-col gap-4">
                                        <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all hover:bg-gray-50 data-[active=true]:border-purple-500 data-[active=true]:bg-purple-50" data-active={!examConfig.isEndTerm}>
                                            <input type="radio" name="examType" checked={!examConfig.isEndTerm} onChange={() => handleExamConfigToggle(false)} className="w-5 h-5 text-purple-600 focus:ring-purple-500" />
                                            <div>
                                                <div className="font-bold text-gray-900">Mid Term Examination</div>
                                                <div className="text-xs text-gray-500">Template download excludes 8-mark questions. Generation defaults to Mid Term pattern.</div>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all hover:bg-gray-50 data-[active=true]:border-purple-500 data-[active=true]:bg-purple-50" data-active={examConfig.isEndTerm}>
                                            <input type="radio" name="examType" checked={examConfig.isEndTerm} onChange={() => handleExamConfigToggle(true)} className="w-5 h-5 text-purple-600 focus:ring-purple-500" />
                                            <div>
                                                <div className="font-bold text-gray-900">End Term Examination</div>
                                                <div className="text-xs text-gray-500">Template download includes 8-mark questions. Generation defaults to End Term pattern.</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
        </div>
    );
}
