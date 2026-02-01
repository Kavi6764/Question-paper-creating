import { useState } from "react";
import {
  User,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  UserCircle,
  LogIn,
  AlertCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  auth, 
  db 
} from "../../fireBaseConfig";
import { 
  sendEmailVerification,
  createUserWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  serverTimestamp 
} from "firebase/firestore";

export default function Register() {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({
    fullName: "",
    sureName: "",
    phone: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [registrationStep, setRegistrationStep] = useState(1);
  const [firebaseError, setFirebaseError] = useState("");

  const fields = [
    {
      name: "fullName",
      label: "Full Name",
      type: "text",
      icon: User,
      colSpan: 1,
      placeholder: "Enter your full name",
    },
    {
      name: "sureName",
      label: "Sure Name",
      type: "text",
      icon: User,
      colSpan: 1,
      placeholder: "Enter your surname",
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "tel",
      icon: Phone,
      colSpan: 1,
      placeholder: "10-digit mobile number",
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      icon: Mail,
      colSpan: 1,
      placeholder: "Enter email address",
    },
    {
      name: "username",
      label: "Username",
      type: "text",
      icon: User,
      colSpan: 2,
      placeholder: "Choose a username",
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      icon: Lock,
      colSpan: 1,
      showToggle: true,
      placeholder: "Minimum 6 characters",
    },
    {
      name: "confirmPassword",
      label: "Confirm Password",
      type: "password",
      icon: Lock,
      colSpan: 1,
      showToggle: true,
      placeholder: "Re-enter password",
    },
  ];

  const handleChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    if (firebaseError) {
      setFirebaseError("");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formValues.fullName.trim())
      newErrors.fullName = "Full name is required";
    else if (formValues.fullName.length < 2)
      newErrors.fullName = "Name must be at least 2 characters";
    
    if (!formValues.sureName.trim())
      newErrors.sureName = "Surname is required";
    
    if (!formValues.phone.trim())
      newErrors.phone = "Phone number is required";
    else if (!/^[6-9]\d{9}$/.test(formValues.phone))
      newErrors.phone = "Enter valid 10-digit Indian number";
    
    if (!formValues.email.trim())
      newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email))
      newErrors.email = "Enter valid email address";
    
    if (!formValues.username.trim())
      newErrors.username = "Username is required";
    else if (formValues.username.length < 3)
      newErrors.username = "Username must be at least 3 characters";
    
    if (!formValues.password)
      newErrors.password = "Password is required";
    else if (formValues.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    
    if (!formValues.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    else if (formValues.confirmPassword !== formValues.password)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create User Account with Firestore Storage
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setFirebaseError("");
    
    try {
  
      
      // 1. Create user in Firebase Authentication
      const credential = await createUserWithEmailAndPassword(
        auth,
        formValues.email,
        formValues.password
      );
      
    
      // 2. Update user profile
      await updateProfile(credential.user, {
        displayName: formValues.fullName,
        photoURL: null // No profile photo
      });
 
    
      // 3. Send email verification
      await sendEmailVerification(credential.user, {
        url: window.location.origin + '/login', // Redirect to login after verification
        handleCodeInApp: false
      });
    
      
      // 4. Store user data in Firestore
      const userId = credential.user.uid;
      const userData = {
        uid: userId,
        fullName: formValues.fullName,
        sureName: formValues.sureName,
        phone: "+91" + formValues.phone,
        email: formValues.email,
        username: formValues.username,
        phoneVerified: true, // We trust the phone number
        emailVerified: false, // Will be true after verification
        role: "staff",
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        metadata: {
          registeredVia: "web",
          registrationDate: new Date().toISOString()
        }
      };
      
     
    
      // Try to store in Firestore
      try {
        const userDocRef = doc(db, "users", userId);
        await setDoc(userDocRef, userData);
        console.log("Successfully stored in Firestore");
      } catch (firestoreError) {
        console.error("Firestore error:", firestoreError);
    
        setFirebaseError("User account created but data storage failed. Please contact support.");
      }
      toast.success("Account created! Verification email sent.");
      // 5. Move to success step
      setRegistrationStep(2);

      localStorage.setItem('pendingVerification', JSON.stringify({
        email: formValues.email,
        uid: userId,
        timestamp: Date.now()
      }));
      
    } catch (error) {
  
      
      let errorMessage = "Account creation failed. ";
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "This email is already registered. Please use a different email or login.";
          setErrors(prev => ({ ...prev, email: "Email already in use" }));
          break;
          
        case 'auth/weak-password':
          errorMessage = "Password is too weak. Please use a stronger password.";
          setErrors(prev => ({ ...prev, password: "Password is too weak" }));
          break;
          
        case 'auth/invalid-email':
          errorMessage = "Invalid email address format.";
          setErrors(prev => ({ ...prev, email: "Invalid email address" }));
          break;
          
        case 'auth/operation-not-allowed':
          errorMessage = "Email/password accounts are not enabled. Please contact support.";
          break;
          
        case 'permission-denied':
          errorMessage = "Database permission denied. Please check Firestore rules.";
          break;
          
        default:
          errorMessage += error.message || "Please try again.";
      }
      
      setFirebaseError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle email verification check
  const handleEmailVerificationCheck = async () => {
    setIsLoading(true);
    
    try {
      // Get current user
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        // Try to get from localStorage
        const pending = localStorage.getItem('pendingVerification');
        if (pending) {
          const { email } = JSON.parse(pending);
          setFirebaseError(`Please login with ${email} to verify your account.`);
          setRegistrationStep(3); // Go to login prompt
        } else {
          setFirebaseError("No user session found. Please login first.");
        }
        return toast.success("Email verified! Account activated.");

      }
      
      // Reload user to get latest verification status
      await currentUser.reload();
      
      if (currentUser.emailVerified) {
        setRegistrationStep(3); // Success
        
        // Update Firestore with verified status
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          await setDoc(userDocRef, {
            emailVerified: true,
            status: "active",
            updatedAt: serverTimestamp(),
          }, { merge: true });
          
          // Clear pending verification
          localStorage.removeItem('pendingVerification');
          
        } catch (error) {
          console.error("Error updating verification status:", error);
          // Continue anyway - the user is verified in auth
        }
      } else {
        setFirebaseError("Email not verified yet. Please check your inbox.");
      }
      
    } catch (error) {
      console.error("Verification check error:", error);
      setFirebaseError("Failed to check verification status.");
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerificationEmail = async () => {
    setIsLoading(true);
    
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setFirebaseError("Please login first to resend verification.");
        return;
      }
      
      await sendEmailVerification(currentUser, {
        url: window.location.origin + '/login',
        handleCodeInApp: false
      });
      
      setFirebaseError("Verification email resent! Please check your inbox.");
      toast.success("Verification email resent successfully!");

    } catch (error) {
      setFirebaseError(`Failed to resend: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
 
  return (
    <div className="min-h-screen flex items-center justify-center  bg-linear-to-br from-blue-50 to-gray-100 px-4 py-8">
      <div className="w-full max-w-2xl bg-white shadow-xl rounded-xl p-8 border border-gray-200">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-linear-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <UserCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-grey-900 bg-linear-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Staff Registration
          </h1>
          <p className="text-gray-600 mt-2">
            Join our team and get started with your new account
          </p>
          
          {/* Progress Steps */}
          <div className="flex justify-center mt-8 mb-6">
            <div className="flex items-center">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${registrationStep >= step ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 text-gray-400'}`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`w-16 h-1 ${registrationStep > step ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between text-sm font-medium px-4">
            <span className={registrationStep >= 1 ? "text-blue-600" : "text-gray-500"}>Details</span>
            <span className={registrationStep >= 2 ? "text-blue-600" : "text-gray-500"}>Verify Email</span>
            <span className={registrationStep >= 3 ? "text-blue-600" : "text-gray-500"}>Complete</span>
          </div>
        </div>

        {/* Firebase Error Message */}
        {firebaseError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{firebaseError}</p>
              {firebaseError.includes("permission") && (
                <p className="text-xs text-red-700 mt-1">
                  Please update Firestore security rules to allow writes.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 1: Registration Form */}
        {registrationStep === 1 && (
          <form onSubmit={handleCreateAccount} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {fields.map((field) => {
                const Icon = field.icon;
                const isPassword = field.type === "password";
                const show = field.name === "password" ? showPassword : showConfirmPassword;
                const setShow = field.name === "password" ? setShowPassword : setShowConfirmPassword;

                return (
                  <div 
                    key={field.name} 
                    className={field.colSpan === 2 ? "col-span-2" : "col-span-1"}
                  >
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      {field.label}
                      <span className="text-red-500 ml-1">*</span>
                    </label>

                    <div className="relative group">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500" />
                      
                      <input
                        type={isPassword ? (show ? "text" : "password") : field.type}
                        className="w-full rounded-lg border border-gray-300 bg-white pl-11 pr-10 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all hover:border-gray-400"
                        placeholder={field.placeholder}
                        value={formValues[field.name]}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        disabled={isLoading}
                      />

                      {field.showToggle && (
                        <button
                          type="button"
                          onClick={() => setShow(!show)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          disabled={isLoading}
                        >
                          {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      )}
                    </div>

                    {errors[field.name] && (
                      <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors[field.name]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <input 
                type="checkbox" 
                id="terms" 
                className="mt-1" 
                required 
              />
              <label htmlFor="terms" className="text-sm text-gray-700">
                I agree to the Terms of Service and Privacy Policy. I understand that my data will be stored securely.
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <LogIn className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-gray-600 text-sm pt-4">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-blue-600 font-semibold hover:text-blue-700 hover:underline"
                >
                  Login here
                </Link>
              </p>
            </div>
          </form>
        )}

        {/* Step 2: Email Verification */}
        {registrationStep === 2 && (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-linear-to-r from-blue-100 to-blue-200 flex items-center justify-center">
              <Mail className="w-12 h-12 text-blue-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verify Your Email
              </h2>
              <p className="text-gray-600">
                We've sent a verification link to:
              </p>
              <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-lg font-semibold text-blue-800">{formValues.email}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleEmailVerificationCheck}
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    I've Verified My Email
                  </>
                )}
              </button>
              
              <button
                onClick={resendVerificationEmail}
                disabled={isLoading}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-medium transition-all"
              >
                Resend Verification Email
              </button>
              
              <button
                onClick={() => setRegistrationStep(1)}
                className="w-full text-blue-600 hover:text-blue-700 py-2 text-sm"
              >
                ← Back to Edit Details
              </button>
            </div>
            
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Important:</strong> Check your spam folder if you don't see the email.
                The verification link expires in 24 hours.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Registration Complete */}
        {registrationStep === 3 && (
          <div className="text-center space-y-8">
            <div className="w-24 h-24 mx-auto rounded-full bg-linear-to-r from-green-100 to-green-200 flex items-center justify-center animate-pulse">
              <Check className="w-12 h-12 text-green-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                🎉 Registration Complete!
              </h2>
              <p className="text-gray-600 mb-6">
                Your account has been successfully verified and activated.
              </p>
              
              <div className="bg-linear-to-r from-blue-50 to-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-semibold">{formValues.fullName} {formValues.sureName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold">{formValues.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-semibold">+91 {formValues.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Username</p>
                    <p className="font-semibold">@{formValues.username}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
              >
                Go to Dashboard
              </button>
              
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 py-3 rounded-lg font-medium transition-all"
              >
                Login to Another Account
              </button>
            </div>
            
            <div className="pt-4">
              <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                Redirecting to dashboard...
              </div>
            </div>
          </div>
        )}

        {/* Debug Info (Remove in production)
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Debug Info:</strong> If you see permission errors, update Firestore rules to:
              <code className="block mt-2 p-2 bg-gray-800 text-gray-100 rounded text-xs">
                allow read, write: if true;
              </code>
            </p>
          </div>
        )} */}
      </div>
    </div>
  );
}