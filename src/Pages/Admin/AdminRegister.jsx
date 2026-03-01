import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
    Eye,
    EyeOff,
    Mail,
    Lock,
    User,
    BookOpen,
    ArrowLeft,
    UserCheck,
    ShieldCheck,
    Check,
    RefreshCcw,
    AlertCircle
} from "lucide-react";
import { auth, db } from "../../../fireBaseConfig";
import {
    createUserWithEmailAndPassword,
    updateProfile,
    sendEmailVerification
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";

export default function AdminRegister() {
    const navigate = useNavigate();
    const [formValues, setFormValues] = useState({
        fullName: "",
        email: "",
        role: "hod", // Default to HOD
        password: "",
        confirmPassword: "",
        username: ""
    });
    const [registrationStep, setRegistrationStep] = useState(1); // 1: Details, 2: Verify, 3: Success
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [firebaseError, setFirebaseError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormValues((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
        if (firebaseError) setFirebaseError("");
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formValues.fullName.trim()) newErrors.fullName = "Full Name is required";
        if (!formValues.username.trim()) newErrors.username = "Username is required";
        if (!formValues.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formValues.email)) {
            newErrors.email = "Invalid email format";
        }
        if (!formValues.password) {
            newErrors.password = "Password is required";
        } else if (formValues.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }
        if (formValues.password !== formValues.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        setFirebaseError("");

        try {
            // 1. Create user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formValues.email,
                formValues.password
            );

            // 2. Update Firebase profile
            await updateProfile(userCredential.user, {
                displayName: formValues.fullName
            });

            // 3. Send email verification
            await sendEmailVerification(userCredential.user);

            // 4. Store user data in Firestore
            const userId = userCredential.user.uid;
            const userData = {
                uid: userId,
                fullName: formValues.fullName,
                email: formValues.email,
                username: formValues.username.toLowerCase(),
                role: formValues.role,
                status: "active", // Set to active immediately as per user requirement
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                emailVerified: false,
            };

            await setDoc(doc(db, "users", userId), userData);

            // 5. Success
            toast.success("Account created successfully! You can now log in.");
            navigate("/");

        } catch (error) {
            console.error("Admin registration error:", error);
            let errorMessage = error.message;

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "This email is already registered.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "The password is too weak.";
            }

            setFirebaseError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckVerification = async () => {
        setIsLoading(true);
        try {
            const user = auth.currentUser;
            if (user) {
                await user.reload();
                if (user.emailVerified) {
                    // Update status to active in Firestore
                    const userRef = doc(db, "users", user.uid);
                    await updateDoc(userRef, {
                        status: "active",
                        emailVerified: true,
                        updatedAt: serverTimestamp()
                    });

                    toast.success("Email verified! Your account is now active.");
                    setRegistrationStep(3);
                } else {
                    toast.error("Email not verified yet. Please check your inbox.");
                }
            } else {
                toast.error("User session not found. Please try logging in.");
            }
        } catch (error) {
            console.error("Verification check error:", error);
            toast.error("Failed to check verification status.");
        } finally {
            setIsLoading(false);
        }
    };

    const resendVerification = async () => {
        setIsLoading(true);
        try {
            const user = auth.currentUser;
            if (user) {
                await sendEmailVerification(user);
                toast.success("Verification email resent!");
            }
        } catch (error) {
            toast.error("Failed to resend email.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden font-sans">
            {/* Decorative Background Elements */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

            <div className="w-full max-w-lg relative z-10">
                {/* Back Link */}
                {registrationStep === 1 && (
                    <Link
                        to="/"
                        className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 mb-6 transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Login
                    </Link>
                )}

                <div className="bg-white border border-gray-100 shadow-2xl rounded-3xl p-8 sm:p-10">

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200 transition-colors ${registrationStep === 3 ? "bg-green-600" : "bg-blue-600"
                            }`}>
                            {registrationStep === 1 && <ShieldCheck className="w-8 h-8 text-white" />}
                            {registrationStep === 2 && <Mail className="w-8 h-8 text-white animate-bounce" />}
                            {registrationStep === 3 && <Check className="w-8 h-8 text-white" />}
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            {registrationStep === 1 && "Admin Registration"}
                            {registrationStep === 2 && "Verify Your Email"}
                            {registrationStep === 3 && "Registration Successful!"}
                        </h1>
                        <p className="text-gray-500 mt-2 text-sm font-medium">
                            {registrationStep === 1 && "Request access to the administrative portal"}
                            {registrationStep === 2 && `We've sent a link to ${formValues.email}`}
                            {registrationStep === 3 && "Your account is now active and ready to use"}
                        </p>
                    </div>

                    {firebaseError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 animate-shake">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-xs font-semibold">{firebaseError}</p>
                        </div>
                    )}

                    {/* Step 1: Details */}
                    {registrationStep === 1 && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 ml-1">Full Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            name="fullName"
                                            placeholder="John Doe"
                                            value={formValues.fullName}
                                            onChange={handleChange}
                                            className={`block w-full pl-11 pr-4 py-2.5 bg-gray-50 border rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 ${errors.fullName ? "border-red-500" : "border-gray-200"}`}
                                        />
                                    </div>
                                    {errors.fullName && <p className="text-xs text-red-600 ml-1 font-medium">{errors.fullName}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 ml-1">Username</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <UserCheck className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            name="username"
                                            placeholder="johndoe"
                                            value={formValues.username}
                                            onChange={handleChange}
                                            className={`block w-full pl-11 pr-4 py-2.5 bg-gray-50 border rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 ${errors.username ? "border-red-500" : "border-gray-200"}`}
                                        />
                                    </div>
                                    {errors.username && <p className="text-xs text-red-600 ml-1 font-medium">{errors.username}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="admin@college.com"
                                        value={formValues.email}
                                        onChange={handleChange}
                                        className={`block w-full pl-11 pr-4 py-2.5 bg-gray-50 border rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 ${errors.email ? "border-red-500" : "border-gray-200"}`}
                                    />
                                </div>
                                {errors.email && <p className="text-xs text-red-600 ml-1 font-medium">{errors.email}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 ml-1">Requested Role</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormValues(prev => ({ ...prev, role: "hod" }))}
                                        className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all border ${formValues.role === "hod" ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}
                                    >HOD</button>
                                    <button
                                        type="button"
                                        onClick={() => setFormValues(prev => ({ ...prev, role: "dean" }))}
                                        className={`py-2.5 px-4 rounded-xl text-sm font-semibold transition-all border ${formValues.role === "dean" ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}
                                    >Dean</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        </div>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            placeholder="••••••••"
                                            value={formValues.password}
                                            onChange={handleChange}
                                            className={`block w-full pl-11 pr-11 py-2.5 bg-gray-50 border rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 ${errors.password ? "border-red-500" : "border-gray-200"}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-xs text-red-600 ml-1 font-medium">{errors.password}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 ml-1">Confirm</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        placeholder="••••••••"
                                        value={formValues.confirmPassword}
                                        onChange={handleChange}
                                        className={`block w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-200 ${errors.confirmPassword ? "border-red-500" : "border-gray-200"}`}
                                    />
                                    {errors.confirmPassword && <p className="text-xs text-red-600 ml-1 font-medium">{errors.confirmPassword}</p>}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-200 mt-4 disabled:opacity-50"
                            >
                                {isLoading ? <RefreshCcw className="w-5 h-5 animate-spin mr-2" /> : "Request Admin Account"}
                            </button>
                        </form>
                    )}

                    {/* Step 2: Verification Flow */}
                    {registrationStep === 2 && (
                        <div className="space-y-6 animate-fade-in text-center">
                            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 flex flex-col items-center">
                                <p className="text-sm text-blue-800 font-medium mb-2">Verification Checklist:</p>
                                <ul className="text-xs text-blue-600 text-left space-y-2">
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div> Check your inbox and spam folder</li>
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div> Click the verification link</li>
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div> Return here to activate your account</li>
                                </ul>
                            </div>

                            <div className="space-y-3 pt-2">
                                <button
                                    onClick={handleCheckVerification}
                                    disabled={isLoading}
                                    className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50"
                                >
                                    {isLoading ? <RefreshCcw className="w-5 h-5 animate-spin mr-2" /> : <div className="flex items-center gap-2"><Check className="w-5 h-5" /> I've Verified My Email</div>}
                                </button>

                                <button
                                    onClick={resendVerification}
                                    disabled={isLoading}
                                    className="w-full py-3 rounded-xl text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-all"
                                >
                                    Resend Verification Email
                                </button>
                            </div>

                            <button
                                onClick={() => setRegistrationStep(1)}
                                className="text-xs text-gray-400 hover:text-blue-600 font-medium transition-colors"
                            >
                                ← Back to edit details
                            </button>
                        </div>
                    )}

                    {/* Step 3: Success */}
                    {registrationStep === 3 && (
                        <div className="space-y-8 animate-scale-in text-center pt-4">
                            <div className="grid grid-cols-2 gap-4 text-left bg-blue-50/50 p-6 rounded-2xl border border-blue-50">
                                <div><p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Email</p><p className="text-sm font-bold text-gray-700 truncate">{formValues.email}</p></div>
                                <div><p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Username</p><p className="text-sm font-bold text-gray-700">@{formValues.username}</p></div>
                                <div className="col-span-2"><p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Assigned Role</p><p className="text-sm font-bold text-blue-600">{formValues.role === 'dean' ? 'College Dean' : 'Head of Department'}</p></div>
                            </div>

                            <button
                                onClick={() => navigate("/")}
                                className="w-full py-4 rounded-2xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Go to Login
                            </button>
                        </div>
                    )}

                    {registrationStep === 1 && (
                        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                            <p className="text-sm text-gray-500 font-medium">
                                Already have an admin account?{" "}
                                <Link to="/" className="text-blue-600 font-bold hover:underline ml-1">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
