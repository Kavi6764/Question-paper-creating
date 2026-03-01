import React, { useState, useEffect } from 'react';
import { Building, MapPin, Phone, Mail, Globe, Save, User, Lock, Shield } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../../fireBaseConfig';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import toast from 'react-hot-toast';

export default function CollegeSettings({ onUpdate, userData }) {
    const [activeTab, setActiveTab] = useState("college");
    const [loading, setLoading] = useState(false);

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
            // Don't show error toast on initial load as it might be empty
        } finally {
            setLoading(false);
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

            // Sanitize data to remove undefined values
            const cleanData = Object.fromEntries(
                Object.entries(formData).map(([key, value]) => [key, value === undefined ? '' : value])
            );

            const dataToSave = {
                ...cleanData,
                updatedAt: serverTimestamp()
            };

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

            // Update Auth Profile
            if (user.displayName !== profileForm.fullName) {
                await updateProfile(user, {
                    displayName: profileForm.fullName
                });
            }

            // Update Firestore Document
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                fullName: profileForm.fullName,
                name: profileForm.fullName // Keep legacy field if needed
            });

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

            // Re-authenticate first
            const credential = EmailAuthProvider.credential(user.email, passwordForm.currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update Password
            await updatePassword(user, passwordForm.newPassword);

            toast.success("Password updated successfully!");
            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error) {
            console.error("Password update error:", error);
            if (error.code === 'auth/wrong-password') {
                toast.error("Incorrect current password");
            } else {
                toast.error("Failed to update password: " + error.message);
            }
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
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === "college"
                                ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                                : "text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-100"
                                }`}
                        >
                            <Building className="w-4 h-4" />
                            <span>College Profile</span>
                        </button>

                        <button
                            onClick={() => setActiveTab("account")}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === "account"
                                ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                                : "text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-100"
                                }`}
                        >
                            <User className="w-4 h-4" />
                            <span>My Account</span>
                        </button>

                        <button
                            onClick={() => setActiveTab("security")}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${activeTab === "security"
                                ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                                : "text-gray-600 hover:bg-white hover:text-gray-900 border border-transparent hover:border-gray-100"
                                }`}
                        >
                            <Lock className="w-4 h-4" />
                            <span>Security</span>
                        </button>
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
                                            <input
                                                type="text"
                                                name="collegeName"
                                                value={formData.collegeName}
                                                onChange={handleChange}
                                                placeholder="Enter college name"
                                                className="w-full pl-11 pr-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-semibold text-gray-800"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 ml-1">Location Address</label>
                                        <div className="space-y-3">
                                            <div className="relative">
                                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    name="addressLine1"
                                                    value={formData.addressLine1}
                                                    onChange={handleChange}
                                                    placeholder="Address Line 1"
                                                    className="w-full pl-11 pr-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-semibold text-gray-800"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    name="addressLine2"
                                                    value={formData.addressLine2}
                                                    onChange={handleChange}
                                                    placeholder="Address Line 2"
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-semibold text-gray-800"
                                                />
                                                <input
                                                    type="text"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleChange}
                                                    placeholder="City"
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-semibold text-gray-800"
                                                />
                                                <input
                                                    type="text"
                                                    name="state"
                                                    value={formData.state}
                                                    onChange={handleChange}
                                                    placeholder="State"
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-semibold text-gray-800"
                                                />
                                                <input
                                                    type="text"
                                                    name="pincode"
                                                    value={formData.pincode}
                                                    onChange={handleChange}
                                                    placeholder="Pincode"
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-semibold text-gray-800"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-4 border-t border-gray-50">
                                        <label className="text-sm font-semibold text-gray-700 ml-1">Contact Information</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    placeholder="Phone"
                                                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-semibold text-gray-800"
                                                />
                                            </div>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    placeholder="Email"
                                                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-semibold text-gray-800"
                                                />
                                            </div>
                                            <div className="relative">
                                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    name="website"
                                                    value={formData.website}
                                                    onChange={handleChange}
                                                    placeholder="Website"
                                                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-semibold text-gray-800"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="inline-flex items-center px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold shadow-lg shadow-gray-200 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                        ) : (
                                            <Save className="w-4 h-4 mr-2.5" />
                                        )}
                                        Save College Profile
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === "account" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-400">
                            <div className="pb-4 border-b border-gray-50">
                                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Account Information</h3>
                                <p className="text-sm text-gray-500 font-medium mt-1">Manage your administrative profile details</p>
                            </div>

                            <form onSubmit={handleProfileUpdate} className="space-y-6 max-w-2xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 ml-1">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={profileForm.fullName}
                                                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                                                className="w-full pl-11 pr-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-semibold text-gray-800"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="email"
                                                value={profileForm.email}
                                                disabled
                                                className="w-full pl-11 pr-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-semibold cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 ml-1">Department</label>
                                        <input
                                            type="text"
                                            value={profileForm.department}
                                            disabled
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 font-semibold cursor-not-allowed"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 ml-1">Access Role</label>
                                        <input
                                            type="text"
                                            value={profileForm.role.toUpperCase()}
                                            disabled
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 font-bold cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="pt-8 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4 mr-2.5" />
                                        Update Details
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === "security" && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-2 duration-400">
                            <div className="pb-4 border-b border-gray-50">
                                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Security & Password</h3>
                                <p className="text-sm text-gray-500 font-medium mt-1">Keep your account secure with regular password updates</p>
                            </div>

                            <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-2xl">
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 ml-1">Current Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="password"
                                                required
                                                value={passwordForm.currentPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                className="w-full pl-11 pr-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-red-500/5 focus:border-red-500 outline-none transition-all font-semibold text-gray-800"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">New Password</label>
                                            <input
                                                type="password"
                                                required
                                                minLength={6}
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-semibold text-gray-800"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-gray-700 ml-1">Confirm New Password</label>
                                            <input
                                                type="password"
                                                required
                                                minLength={6}
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-semibold text-gray-800"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-100 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <Shield className="w-4 h-4 mr-2.5" />
                                        Update Security
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
