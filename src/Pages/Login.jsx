import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, User, Lock, LogIn, Search, ChevronDown } from "lucide-react";
import { auth, db } from "../../fireBaseConfig";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

export default function Login() {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userList, setUserList] = useState([]);
  const [firebaseError, setFirebaseError] = useState("");

  // Fetch users from Firestore for dropdown
  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("status", "==", "active"));
      const querySnapshot = await getDocs(q);

      const users = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          username: data.username,
          name: data.fullName,
          email: data.email // Store email for login
        });
      });
      setUserList(users);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };
  const ADMIN_ACCOUNTS = {
    "hod": {
      email: "hod@exam.com",
      role: "hod",
      bypassEmailVerification: true
    },
    "dean": {
      email: "dean@exam.com",
      role: "dean",
      bypassEmailVerification: true
    },
    "admin": {
      email: "admin@exam.com",
      role: "admin",
      bypassEmailVerification: true
    }
  };
  // Open dropdown and fetch users
  const handleUsernameFocus = () => {
    setShowDropdown(true);
    if (userList.length === 0) {
      fetchUsers();
    }
  };

  const filteredUsers = userList.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fields = [
    {
      name: "username",
      label: "Username",
      type: "text",
      icon: User,
      placeholder: "Enter or search username",
      dropdown: true,
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      icon: Lock,
      placeholder: "Enter your password",
      showToggle: true,
    },
  ];

  const handleChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (name === "username") {
      setSearchQuery(value);
      setShowDropdown(true);
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    if (firebaseError) {
      setFirebaseError("");
    }
  };

  const handleSelectUser = (username, email) => {
    setFormValues((prev) => ({ ...prev, username }));
    // Store the email for login, but don't show it to user
    setFormValues(prev => ({ ...prev, _email: email })); // Hidden field for email
    setSearchQuery("");
    setShowDropdown(false);
    if (errors.username) setErrors((prev) => ({ ...prev, username: undefined }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formValues.username.trim()) newErrors.username = "Username is required";
    if (!formValues.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Find user's email by username
  const findUserEmailByUsername = async (username) => {
    const lowercaseUsername = username.toLowerCase();

    // Check for admin accounts first
    if (ADMIN_ACCOUNTS[lowercaseUsername]) {
      return ADMIN_ACCOUNTS[lowercaseUsername].email;
    }
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        // Check if user is active
        if (userData.status !== "active") {
          throw new Error("Account is not active. Please contact administrator.");
        }

        // Check if email is verified
        // if (!userData.emailVerified) {
        //   throw new Error("Please verify your email before logging in.");
        // }

        return userData.email;
      } else {
        throw new Error("Username not found.");
      }
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setFirebaseError("");

    try {
      // 1. Find the email associated with the username
      // This function also validates user status and email verification
      const userEmail = await findUserEmailByUsername(formValues.username);

      // 2. Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(
        auth,
        userEmail,
        formValues.password
      );

      // 3. Check if email is verified
      const lowercaseUsername = formValues.username.toLowerCase();
      const isAdminAccount = ADMIN_ACCOUNTS[lowercaseUsername];

      if (!isAdminAccount && !userCredential.user.emailVerified) {
        await signOut(auth);
        throw new Error("Please verify your email before logging in.");
      }

      // 4. Fetch user role from Firestore
      let role = "staff";

      if (formValues.username.toLowerCase() === "hod") {
        role = "hod";
      } else if (formValues.username.toLowerCase() === "dean") {
        role = "dean";
      } else {
        const userRef = doc(db, "users", userCredential.user.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();
        role = userData?.role || "staff";

        // Also check if status is active (duplicate check but safe)
        if (userData?.status !== "active") {
          throw new Error("Account is not active. Please contact administrator.");
        }
      }

      // 5. Success - navigate based on role
      toast.success("Login successful!");

      if (role === "hod" || role === "dean" || role === "admin") {
        navigate("/admin-dashboard", {
          state: {
            username: formValues.username,
            userId: userCredential.user.uid,
            role: role
          }
        });
      } else {
        navigate("/staff-portal", {
          state: {
            username: formValues.username,
            userId: userCredential.user.uid
          }
        });
      }

    } catch (error) {
      console.error("Login error:", error);

      let errorMessage = "Login failed. ";

      switch (error.code || error.message) {
        case 'auth/user-not-found':
        case 'Username not found.':
          errorMessage = "Username not found. Please check your username.";
          setErrors(prev => ({ ...prev, username: "Username not found" }));
          break;

        case 'auth/wrong-password':
          errorMessage = "Incorrect password. Please try again.";
          setErrors(prev => ({ ...prev, password: "Incorrect password" }));
          break;

        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later.";
          break;

        case 'auth/user-disabled':
          errorMessage = "Account has been disabled. Please contact administrator.";
          break;

        case 'Please verify your email before logging in.':
          errorMessage = "Email not verified. Please check your inbox for the verification link.";
          break;

        case 'Account is not active. Please contact administrator.':
          errorMessage = "Account exists but is not active in the system. Contact Admin.";
          break;

        default:
          if (error.message.includes("verify your email")) {
            errorMessage = "Please verify your email before logging in.";
          } else {
            errorMessage = error.message;
          }
      }

      setFirebaseError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-blue-100 flex items-center justify-center">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-1">Sign in to your staff account</p>
        </div>

        {/* Firebase Error Message */}
        {firebaseError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {firebaseError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {fields.map((field) => {
            const Icon = field.icon;
            const isPassword = field.type === "password";
            const show = field.name === "password" && showPassword;

            return (
              <div key={field.name} className="relative">
                <label className="block text-sm font-medium text-gray-900 mb-1.5">
                  {field.label}
                </label>

                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={isPassword ? (show ? "text" : "password") : field.type}
                    placeholder={field.placeholder}
                    value={formValues[field.name]}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    onFocus={() => field.dropdown && handleUsernameFocus()}
                    onBlur={() => field.dropdown && setTimeout(() => setShowDropdown(false), 150)}
                    className={`w-full rounded-md border border-gray-300 bg-white pl-11 pr-11 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-none ${errors[field.name] ? "border-red-500" : "border-gray-300"
                      }`}
                    disabled={isLoading}
                  />

                  {/* Password toggle */}
                  {field.showToggle && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      disabled={isLoading}
                    >
                      {show ? <EyeOff /> : <Eye />}
                    </button>
                  )}

                  {/* Username dropdown */}
                  {field.dropdown && showDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-md z-50">
                      <div className="p-2 border-b border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                          <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-gray-50 rounded-md pl-9 pr-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredUsers.length ? (
                          filteredUsers.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => handleSelectUser(user.username, user.email)}
                              className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3"
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {user.name}
                                </p>
                                <p className="text-sm font-medium text-gray-900">@{user.username}</p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-sm text-gray-500">
                            {isLoading ? "Loading users..." : "No users found"}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {errors[field.name] && (
                  <p className="text-sm text-red-600 mt-1">{errors[field.name]}</p>
                )}
              </div>
            );
          })}

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 border-gray-300" disabled={isLoading} />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <button type="button" className="text-sm text-blue-600 hover:underline disabled:text-gray-400" disabled={isLoading}>
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                Sign In <LogIn className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Contact administrator for account access.
        </p>
      </div>
    </div>
  );
}