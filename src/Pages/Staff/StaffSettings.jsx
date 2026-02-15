import { useState } from "react";
import { User, Lock, Save, AlertCircle, CheckCircle, Shield } from "lucide-react";
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../fireBaseConfig";
import toast from "react-hot-toast";

export default function StaffSettings({ staffData }) {
    const [activeTab, setActiveTab] = useState("profile");
    const [isLoading, setIsLoading] = useState(false);

    // Profile State
    const [profileForm, setProfileForm] = useState({
        fullName: staffData?.name || "",
        department: staffData?.department || "",
        email: staffData?.email || ""
    });

    // Password State
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);

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
                name: profileForm.fullName, // Keep legacy field if needed
                department: profileForm.department
                // Email update is complex and requires verification, skipping for now
            });

            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Profile update error:", error);
            toast.error("Failed to update profile: " + error.message);
        } finally {
            setIsLoading(false);
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

        setIsLoading(true);

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
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage your profile and security preferences</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
                {/* Sidebar */}
                <div className="w-full md:w-64 bg-gray-50/50 p-4 border-r border-gray-100">
                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveTab("profile")}
                            className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === "profile"
                                ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                }`}
                        >
                            <User className="w-4 h-4" />
                            <span>Profile Information</span>
                        </button>
                        <button
                            onClick={() => setActiveTab("security")}
                            className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === "security"
                                ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                }`}
                        >
                            <Shield className="w-4 h-4" />
                            <span>Security & Password</span>
                        </button>
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 md:p-8">
                    {activeTab === "profile" && (
                        <div className="animate-fade-in space-y-6">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900">Profile Details</h3>
                            </div>

                            <form onSubmit={handleProfileUpdate} className="space-y-5">
                                <div className="grid grid-cols-1 gap-5">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={profileForm.fullName}
                                                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                                        <input
                                            type="email"
                                            value={profileForm.email}
                                            disabled
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-400">Email cannot be changed directly.</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Department</label>
                                        <input
                                            type="text"
                                            value={profileForm.department}
                                            disabled
                                            onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/30 transition-all disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <>Saving...</>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === "security" && (
                        <div className="animate-fade-in space-y-6">
                            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                            </div>

                            <form onSubmit={handlePasswordUpdate} className="space-y-5">
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-gray-700">Current Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="password"
                                                required
                                                value={passwordForm.currentPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                                placeholder="Enter current password"
                                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">New Password</label>
                                            <input
                                                type="password"
                                                required
                                                minLength={6}
                                                value={passwordForm.newPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                placeholder="Enter new password"
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                                            <input
                                                type="password"
                                                required
                                                minLength={6}
                                                value={passwordForm.confirmPassword}
                                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                placeholder="Confirm new password"
                                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/30 transition-all disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <>Updating...</>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Update Password
                                            </>
                                        )}
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
