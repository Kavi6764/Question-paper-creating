import { useState, useRef, useEffect } from "react";
import {
  Upload,
  FileSpreadsheet,
  BookOpen,
  CheckCircle,
  Loader2,
  Download,
  Info,
  Grid3x3,
  FileText,
  Clock,
  User,
  Search,
  Eye,
  LogOut,
  Home,
  Filter,
  Calendar,
  Shield,
  Bell,
  Settings,
  ChevronDown,
  Database,
  X
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot,
  arrayUnion
} from "firebase/firestore";
import { db, auth } from "../../fireBaseConfig";
import { useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";

// Helper to get initials
const getInitials = (name) => {
  if (!name) return "";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function StaffPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [staffData, setStaffData] = useState(null);
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [unit, setUnit] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [myUploads, setMyUploads] = useState([]);
  const [mySubjects, setMySubjects] = useState([]);
  const [stats, setStats] = useState({
    totalSubjects: 0,
    totalQuestions: 0,
    uploadedToday: 0,
    totalUploads: 0
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [previewPage, setPreviewPage] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [filter, setFilter] = useState("all");
  const [uploadedUnits, setUploadedUnits] = useState({}); // Track uploaded units per subject
  const [questionPapers, setQuestionPapers] = useState([]); // Store visible question papers

  const itemsPerPage = 5;
  const fileInputRef = useRef(null);

  // Load staff data and setup real-time listeners
  useEffect(() => {
    let unsubscribeUser;
    let unsubscribeUploads;
    let unsubscribeSubjects;
    let unsubscribeToday;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // 1. Real-time listener for User Profile
          const userRef = doc(db, "users", user.uid);
          unsubscribeUser = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const newStaffData = {
                id: user.uid,
                email: user.email,
                name: data.fullName || data.name || user.displayName || "Staff Member",
                username: data.username || "",
                department: data.department || "Staff",
                assignedSubjects: data.assignedSubjects || [],
                status: data.status || "active"
              };
              setStaffData(newStaffData);

              const staffId = user.uid;

              // CLEANUP previous data listeners
              if (unsubscribeUploads) unsubscribeUploads();
              if (unsubscribeSubjects) unsubscribeSubjects();
              if (unsubscribeToday) unsubscribeToday();

              // 2. SETUP Uploads Listener
              const uploadsQuery = query(
                collection(db, "uploads"),
                where("staffId", "==", staffId)
              );

              unsubscribeUploads = onSnapshot(uploadsQuery, (snapshot) => {
                const uploads = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data(),
                  timestamp: doc.data().createdAt?.toDate() || new Date()
                })).sort((a, b) => b.timestamp - a.timestamp);
                setMyUploads(uploads);

                const unitsMap = {};
                uploads.forEach(upload => {
                  if (upload.subjectCode && upload.unit) {
                    if (!unitsMap[upload.subjectCode]) {
                      unitsMap[upload.subjectCode] = new Set();
                    }
                    unitsMap[upload.subjectCode].add(upload.unit.toString());
                  }
                });

                const uploadedUnitsObj = {};
                Object.keys(unitsMap).forEach(subjectCode => {
                  uploadedUnitsObj[subjectCode] = Array.from(unitsMap[subjectCode]);
                });
                setUploadedUnits(uploadedUnitsObj);
              });

              // 3. SETUP Subjects Listener (Filter by assignedSubjects)
              const subjectsRef = collection(db, "subjects");
              unsubscribeSubjects = onSnapshot(subjectsRef, (snapshot) => {
                const allSubjects = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data(),
                  lastUpdated: doc.data().lastUpdated?.toDate() || doc.data().createdAt?.toDate() || new Date()
                }));

                const assigned = allSubjects.filter(subject =>
                  (newStaffData.assignedSubjects?.includes(subject.subjectCode) ||
                    subject.staffId === staffId) &&
                  subject.subjectCode // Ensure subjectCode exists
                );

                // Deduplicate by subjectCode
                const uniqueAssigned = [];
                const seenCodes = new Set();

                assigned.forEach(subject => {
                  if (!seenCodes.has(subject.subjectCode)) {
                    uniqueAssigned.push(subject);
                    seenCodes.add(subject.subjectCode);
                  }
                });

                setMySubjects(uniqueAssigned);

                const totalQuestions = assigned.reduce((sum, subject) => {
                  if (subject.units) {
                    return sum + Object.values(subject.units).reduce((uSum, unit) =>
                      uSum + (unit.questions?.length || 0), 0
                    );
                  }
                  return sum;
                }, 0);

                setStats(prev => ({
                  ...prev,
                  totalSubjects: uniqueAssigned.length,
                  totalQuestions: totalQuestions
                }));
              });

              // 4. SETUP Today's Uploads Listener
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              const todayUploadsQuery = query(
                collection(db, "uploads"),
                where("staffId", "==", staffId),
                where("createdAt", ">=", today)
              );

              unsubscribeToday = onSnapshot(todayUploadsQuery, (snapshot) => {
                setStats(prev => ({
                  ...prev,
                  uploadedToday: snapshot.size
                }));
              });

            } else {
              // Handle new user creation...
              const username = location.state?.username || "";
              setDoc(userRef, {
                email: user.email,
                fullName: user.displayName || "Staff Member",
                username: username,
                department: "Computer Science",
                role: "staff",
                joinDate: serverTimestamp(),
                lastLogin: serverTimestamp(),
                status: "active",
                createdAt: serverTimestamp()
              });
            }
          });

        } catch (error) {
          console.error("Error loading staff data:", error);
          toast.error("Error loading your data");
        }
      } else {
        navigate("/");
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeUploads) unsubscribeUploads();
      if (unsubscribeSubjects) unsubscribeSubjects();
      if (unsubscribeToday) unsubscribeToday();
    };
  }, [navigate, location]);


  // Update stats when myUploads changes
  useEffect(() => {
    if (staffData && myUploads.length > 0) {
      setStats(prev => ({
        ...prev,
        totalUploads: myUploads.length
      }));
    }
  }, [myUploads, staffData]);

  // Fetch visible question papers
  useEffect(() => {
    if (!staffData) return;

    const fetchPapers = async () => {
      try {
        const q = query(
          collection(db, "questionPapers"),
          where("visible", "==", true),
          orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const papers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          }));
          setQuestionPapers(papers);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching papers:", error);
      }
    };

    fetchPapers();
  }, [staffData]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.xlsx')) {
      setFile(droppedFile);
      parseFileForPreview(droppedFile);
    } else {
      toast.error("Please upload only .xlsx files");
    }
  };

  const parseFileForPreview = async (file) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const previewRows = rows.slice(0, 10).map((row, index) => ({
        id: index + 1,
        questionNo: row.QuestionNo || `Q${index + 1}`,
        question: row.Question || "",
        marks: row.Marks || 0,
        difficulty: row.Difficulty || "Medium",
        unit: row.Unit || 1
      }));

      setPreviewData(previewRows);
      toast.success(`Preview loaded: ${previewRows.length} questions found`);
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error("Error reading file for preview");
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFileForPreview(selectedFile);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        QuestionNo: "Q1",
        Question: "What is React?",
        Marks: 5,
        Difficulty: "Medium",
        Unit: 1
      },
      {
        QuestionNo: "Q2",
        Question: "Explain component lifecycle",
        Marks: 10,
        Difficulty: "Hard",
        Unit: 1
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "question_template.xlsx");
    toast.success("Template downloaded!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!staffData) {
      toast.error("Please login to upload");
      return;
    }

    if (!subjectCode || !subjectName || !unit || !file) {
      toast.error("All fields are required");
      return;
    }

    // Check if this unit is already uploaded for this subject
    if (uploadedUnits[subjectCode]?.includes(unit)) {
      const confirm = window.confirm(
        `Unit ${unit} for ${subjectCode} already has uploaded questions.\n` +
        `Uploading again will add new questions without removing existing ones.\n\n` +
        `Do you want to continue?`
      );
      if (!confirm) return;
    }

    try {
      setLoading(true);
      setUploadStatus("processing");
      setUploadProgress(30);

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      setUploadProgress(50);

      // Filter questions for selected unit only
      const unitQuestions = rows
        .filter((row) => Number(row.Unit) === Number(unit))
        .map((row, index) => ({
          id: `${subjectCode}-U${unit}-Q${index + 1}-${Date.now()}`,
          questionNo: row.QuestionNo || `Q${index + 1}`,
          question: row.Question,
          marks: row.Marks,
          difficulty: row.Difficulty || "Medium",
          unit: Number(unit),
          uploadedAt: Date.now(),
          staffId: staffData.id,
          staffName: staffData.name,
          staffEmail: staffData.email,
        }));

      setUploadProgress(70);

      if (unitQuestions.length === 0) {
        clearInterval(progressInterval);
        toast.error(`No questions found for Unit ${unit} in the uploaded file`);
        setUploadStatus("error");
        return;
      }

      // 1. Create upload record
      const uploadRef = doc(collection(db, "uploads"));
      await setDoc(uploadRef, {
        uploadId: uploadRef.id,
        staffId: staffData.id,
        staffName: staffData.name,
        staffEmail: staffData.email,
        staffUsername: staffData.username,
        subjectCode,
        subjectName,
        unit: Number(unit),
        questionCount: unitQuestions.length,
        questions: unitQuestions,
        status: "completed",
        action: "question_upload",
        createdAt: serverTimestamp(),
      });

      setUploadProgress(85);

      // 2. Create activity log
      const activityRef = doc(collection(db, "activities"));
      await setDoc(activityRef, {
        activityId: activityRef.id,
        staffId: staffData.id,
        staffName: staffData.name,
        staffEmail: staffData.email,
        username: staffData.username,
        subjectCode,
        subjectName,
        unit: Number(unit),
        message: `${unitQuestions.length} questions uploaded to ${subjectCode} - Unit ${unit}`,
        questionCount: unitQuestions.length,
        type: "UPLOAD",
        role: "staff",
        createdAt: serverTimestamp(),
      });

      // 3. Update or create subject document
      let subjectRef;
      let subjectSnap;

      // Try to find existing subject by code first (including Admin created ones)
      const q = query(collection(db, "subjects"), where("subjectCode", "==", subjectCode));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Use existing subject
        subjectRef = querySnapshot.docs[0].ref;
        subjectSnap = await getDoc(subjectRef);
      } else {
        // Fallback: Create new subject with staff-specific ID
        const subjectDocId = `${staffData.id}_${subjectCode}`;
        subjectRef = doc(db, "subjects", subjectDocId);
        subjectSnap = await getDoc(subjectRef);
      }

      const unitKey = `unit${unit}`;

      if (!subjectSnap.exists()) {
        // Create new subject
        await setDoc(subjectRef, {
          subjectCode,
          subjectName,
          staffId: staffData.id,
          staffName: staffData.name,
          staffEmail: staffData.email,
          units: {
            [unitKey]: {
              unitNumber: Number(unit),
              unitName: `Unit ${unit}`,
              questions: unitQuestions,
              questionCount: unitQuestions.length,
              createdAt: serverTimestamp(),
              lastUpdated: serverTimestamp(),
            }
          },
          totalQuestions: unitQuestions.length,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        });
      } else {
        // Update existing subject
        const existing = subjectSnap.data();
        const existingUnit = existing.units?.[unitKey];
        const existingQuestions = existingUnit?.questions || [];

        // Merge questions (avoid duplicates by questionNo)
        const existingQuestionNos = new Set(existingQuestions.map(q => q.questionNo));
        const newQuestions = unitQuestions.filter(q => !existingQuestionNos.has(q.questionNo));

        const mergedQuestions = [...existingQuestions, ...newQuestions];

        await updateDoc(subjectRef, {
          [`units.${unitKey}`]: {
            unitNumber: Number(unit),
            unitName: `Unit ${unit}`,
            questions: mergedQuestions,
            questionCount: mergedQuestions.length,
            createdAt: existingUnit?.createdAt || serverTimestamp(),
            lastUpdated: serverTimestamp(),
          },
          totalQuestions: (existing.totalQuestions || 0) + newQuestions.length,
          lastUpdated: serverTimestamp(),
        });
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus("success");

      setTimeout(() => {
        toast.success(
          `✅ ${unitQuestions.length} questions uploaded to ${subjectCode} - Unit ${unit}`
        );
        resetForm();
      }, 500);

    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload failed. Please try again.");
      setUploadStatus("error");
    } finally {
      setLoading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStatus(null);
      }, 2000);
    }
  };

  const resetForm = () => {
    setSubjectCode("");
    setSubjectName("");
    setUnit("");
    setFile(null);
    setPreviewData([]);
    setPreviewPage(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Clear file selection
  const clearFile = () => {
    setFile(null);
    setPreviewData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Check if a unit is already uploaded for the selected subject
  const isUnitUploaded = (unitNum) => {
    return uploadedUnits[subjectCode]?.includes(unitNum.toString()) || false;
  };

  // Get unit status (uploaded or not)
  const getUnitStatus = (unitNum) => {
    if (!subjectCode) return "available";
    return isUnitUploaded(unitNum) ? "uploaded" : "available";
  };

  const filteredUploads = myUploads.filter(upload => {
    const matchesSearch = upload.subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      upload.subjectName.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === "today") {
      const today = new Date();
      const uploadDate = upload.timestamp;
      return matchesSearch &&
        uploadDate.getDate() === today.getDate() &&
        uploadDate.getMonth() === today.getMonth() &&
        uploadDate.getFullYear() === today.getFullYear();
    }

    if (filter === "week") {
      const today = new Date();
      const lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
      return matchesSearch && upload.timestamp >= lastWeek;
    }

    if (filter === "month") {
      const today = new Date();
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
      return matchesSearch && upload.timestamp >= lastMonth;
    }

    return matchesSearch;
  });

  const filteredPreview = previewData.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.difficulty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPreviewPages = Math.ceil(filteredPreview.length / itemsPerPage);
  const paginatedPreview = filteredPreview.slice(
    previewPage * itemsPerPage,
    (previewPage + 1) * itemsPerPage
  );

  if (!staffData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="shrink-0 flex items-center">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Staff Portal</span>
              </div>

              {/* Navigation Links */}
              <div className="hidden md:ml-8 md:flex md:space-x-8">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${activeTab === "dashboard"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab("upload")}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${activeTab === "upload"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </button>
                <button
                  onClick={() => setActiveTab("subjects")}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${activeTab === "subjects"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  My Subjects ({mySubjects.length})
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${activeTab === "history"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Upload History ({myUploads.length})
                </button>
                <button
                  onClick={() => setActiveTab("papers")}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${activeTab === "papers"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Question Papers
                </button>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Stats Badge */}
              {/* <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-lg">
                <Upload className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {stats.totalUploads} uploads
                </span>
              </div>

              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Settings className="h-6 w-6" />
              </button> */}

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {getInitials(staffData.name)}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-700">{staffData.name}</p>
                    <p className="text-xs text-gray-500">@{staffData.username || staffData.email?.split('@')[0]}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{staffData.name}</p>
                      <p className="text-xs text-gray-500 truncate">{staffData.email}</p>
                      <p className="text-xs text-blue-600 mt-1">{staffData.department}</p>
                      <div className="flex items-center justify-between mt-2 text-xs">
                        <span className="text-gray-500">Uploads:</span>
                        <span className="font-medium">{stats.totalUploads}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {staffData.name}!
          </h1>
          <p className="text-gray-600 mt-1">
            {staffData.department} Department • {stats.totalSubjects} Subjects • {stats.totalQuestions} Questions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">My Subjects</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalSubjects}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {(() => {
                    const validCodes = mySubjects
                      .map(s => s.subjectCode)
                      .filter(code => code && code.trim().length > 0);

                    if (validCodes.length === 0) return 'No subjects';
                    if (validCodes.length <= 3) return validCodes.join(', ');
                    return `${validCodes.slice(0, 3).join(', ')} +${validCodes.length - 3} more`;
                  })()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="text-blue-600 w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Questions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalQuestions}</p>
                <p className="text-xs text-gray-500 mt-1">Across all units</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="text-green-600 w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Uploaded Today</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.uploadedToday}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Upload className="text-purple-600 w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Uploads</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUploads}</p>
                <p className="text-xs text-gray-500 mt-1">All time uploads</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Database className="text-orange-600 w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {activeTab === "dashboard" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-1"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredUploads.slice(0, 5).map((upload) => (
                    <div key={upload.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Upload className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {upload.subjectCode} - Unit {upload.unit}
                          </p>
                          <p className="text-sm text-gray-500">{upload.subjectName}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <FileText size={12} />
                              {upload.questionCount} questions
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {upload.timestamp.toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-blue-600">
                        <Eye size={18} />
                      </button>
                    </div>
                  ))}

                  {filteredUploads.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Upload className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p>No uploads yet</p>
                      <p className="text-sm">Start by uploading your first question bank</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "upload" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Upload Questions</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {subjectCode ? `Selected: ${subjectCode} - ${subjectName}` : 'Select a subject to begin'}
                  </p>
                </div>

                <div className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Subject Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Subject Code *
                        </label>
                        <select
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={subjectCode}
                          onChange={(e) => {
                            const code = e.target.value;
                            setSubjectCode(code);
                            const selectedSubject = mySubjects.find(s => s.subjectCode === code);
                            if (selectedSubject) {
                              setSubjectName(selectedSubject.subjectName);
                            } else {
                              setSubjectName("");
                            }
                            setUnit(""); // Reset unit when subject changes
                          }}
                          required
                        >
                          <option value="">Select a subject</option>
                          {mySubjects.map((subject) => (
                            <option key={subject.id} value={subject.subjectCode}>
                              {subject.subjectCode} - {subject.subjectName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Subject Name *
                        </label>
                        <input
                          type="text"
                          placeholder="Subject Name"
                          className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-500"
                          value={subjectName}
                          readOnly
                        />
                      </div>
                    </div>

                    {/* Unit Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Select Unit *
                        {subjectCode && uploadedUnits[subjectCode] && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({uploadedUnits[subjectCode].length}/5 units uploaded)
                          </span>
                        )}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5].map((u) => {
                          const status = getUnitStatus(u);
                          return (
                            <button
                              key={u}
                              type="button"
                              onClick={() => setUnit(u.toString())}
                              disabled={status === "uploaded"}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${unit === u.toString()
                                ? 'bg-blue-600 text-white'
                                : status === "uploaded"
                                  ? 'bg-green-100 text-green-800 cursor-not-allowed'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              title={status === "uploaded" ? "Already uploaded - Click to add more questions" : ""}
                            >
                              Unit {u}
                              {status === "uploaded" && (
                                <CheckCircle className="inline ml-1 h-3 w-3" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {subjectCode && uploadedUnits[subjectCode] && uploadedUnits[subjectCode].length > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          Green units are already uploaded. You can still upload more questions to them.
                        </p>
                      )}
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Excel File *
                      </label>

                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative border-2 border-dashed rounded-xl transition cursor-pointer ${isDragging
                          ? 'border-blue-500 bg-blue-50'
                          : file
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 hover:border-gray-400'
                          }`}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {file && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearFile();
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <div className="p-8 text-center">
                          {file ? (
                            <>
                              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                              <p className="font-medium text-green-700">{file.name}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                {(file.size / 1024).toFixed(2)} KB • {previewData.length} questions previewed
                              </p>
                            </>
                          ) : (
                            <>
                              <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                              <p className="font-medium text-gray-700">
                                {isDragging ? 'Drop file here' : 'Drag & drop or click to upload'}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Only .xlsx files are supported
                              </p>
                            </>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx"
                          hidden
                          onChange={handleFileSelect}
                          required
                        />
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {uploadStatus && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">
                            {uploadStatus === 'processing' ? 'Uploading...' :
                              uploadStatus === 'success' ? 'Upload Complete!' : 'Upload Failed'}
                          </span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${uploadStatus === 'success' ? 'bg-green-500' :
                              uploadStatus === 'error' ? 'bg-red-500' :
                                'bg-blue-500'
                              }`}
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading || !subjectCode || !subjectName || !unit || !file}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload size={20} />
                          {isUnitUploaded(unit) ? 'Add More Questions' : 'Upload Questions'}
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === "subjects" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">My Subjects</h2>
                  <span className="text-sm text-gray-500">{mySubjects.length} subjects • {stats.totalQuestions} total questions</span>
                </div>

                <div className="space-y-4">
                  {mySubjects.map((subject) => {
                    const uploadedUnitCount = uploadedUnits[subject.subjectCode]?.length || 0;
                    const totalQuestions = subject.totalQuestions || 0;

                    return (
                      <div key={subject.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{subject.subjectCode}</span>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-600">{subject.subjectName}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <FileText size={14} />
                                {totalQuestions} questions
                              </span>
                              <span className="flex items-center gap-1">
                                <Grid3x3 size={14} />
                                {uploadedUnitCount}/5 units uploaded
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                Updated: {subject.lastUpdated.toLocaleDateString()}
                              </span>
                            </div>
                            {/* Unit Progress */}
                            <div className="flex items-center gap-1 mt-2">
                              {[1, 2, 3, 4, 5].map(u => (
                                <div
                                  key={u}
                                  className={`h-2 w-10 rounded ${uploadedUnits[subject.subjectCode]?.includes(u.toString())
                                    ? 'bg-green-500'
                                    : 'bg-gray-200'
                                    }`}
                                  title={`Unit ${u} - ${uploadedUnits[subject.subjectCode]?.includes(u.toString()) ? 'Uploaded' : 'Pending'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSubjectCode(subject.subjectCode);
                                setSubjectName(subject.subjectName);
                                setActiveTab("upload");
                              }}
                              className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                            >
                              Upload Questions
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {mySubjects.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p>No subjects assigned yet</p>
                      <p className="text-sm">Contact HOD to get subjects assigned</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Upload History ({filteredUploads.length})
                  </h2>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by subject code or name..."
                      className="text-sm border border-gray-300 rounded-lg px-3 py-2 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredUploads.map((upload) => (
                    <div key={upload.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${upload.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'
                          }`}>
                          {upload.status === 'completed' ?
                            <CheckCircle className="w-5 h-5 text-green-600" /> :
                            <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {upload.subjectCode} - Unit {upload.unit}
                          </p>
                          <p className="text-sm text-gray-500">{upload.subjectName}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span>{upload.questionCount} questions</span>
                            <span>•</span>
                            <span>Staff: {upload.staffName}</span>
                            <span>•</span>
                            <span>{upload.timestamp.toLocaleDateString()} {upload.timestamp.toLocaleTimeString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${upload.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {upload.status}
                        </span>
                        <button className="text-gray-400 hover:text-blue-600">
                          <Eye size={18} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredUploads.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Database className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p>No upload history found</p>
                      <p className="text-sm">
                        {searchTerm ? 'Try a different search term' : 'Your uploads will appear here'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "papers" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Generated Question Papers</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Shield className="w-4 h-4" />
                    <span>Secure View</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {questionPapers.length > 0 ? (
                    questionPapers.map((paper) => (
                      <div key={paper.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 text-lg">{paper.title}</h3>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${!paper.generatedAt ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                }`}>
                                {paper.status ? paper.status.toUpperCase() : "GENERATED"}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span><strong>Subject:</strong> {paper.subjectCode}</span>
                              <span><strong>Date:</strong> {paper.examDate || "N/A"}</span>
                              <span><strong>Marks:</strong> {paper.totalMarks}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => window.open(`/view-paper/${paper.id}`, '_blank')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" /> View Paper
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                      <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="font-medium">No question papers released yet</p>
                      <p className="text-sm mt-1">Check back later for generated papers</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Preview Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">File Preview</h3>
                  {file && (
                    <p className="text-sm text-gray-500 mt-1">
                      Previewing: {file.name}
                    </p>
                  )}
                </div>

                <div className="p-6">
                  {previewData.length > 0 ? (
                    <>
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {paginatedPreview.map((item) => (
                          <div key={item.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-gray-900">{item.questionNo}</span>
                              <span className={`px-2 py-1 text-xs rounded-full ${item.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                                item.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                {item.difficulty}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.question}</p>
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>Unit {item.unit}</span>
                              <span className="font-medium">{item.marks} marks</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {totalPreviewPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => setPreviewPage(prev => Math.max(0, prev - 1))}
                            disabled={previewPage === 0}
                            className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                          >
                            ← Previous
                          </button>
                          <span className="text-sm text-gray-600">
                            {previewPage + 1} / {totalPreviewPages}
                          </span>
                          <button
                            onClick={() => setPreviewPage(prev => Math.min(totalPreviewPages - 1, prev + 1))}
                            disabled={previewPage === totalPreviewPages - 1}
                            className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No file selected</p>
                      <p className="text-sm text-gray-400 mt-1">Upload a file to see preview</p>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={downloadTemplate}
                      className="w-full flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                    >
                      <Download size={18} />
                      Download Template
                    </button>

                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                      <p className="flex items-center gap-1">
                        <Info size={12} />
                        Template includes all required columns
                      </p>
                      <p className="flex items-center gap-1">
                        <Info size={12} />
                        Maximum 100 questions per file
                      </p>
                      <p className="flex items-center gap-1">
                        <Info size={12} />
                        Green units are already uploaded
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff Info Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{staffData.name}</h4>
                    <p className="text-sm text-gray-500">{staffData.department}</p>
                    <p className="text-xs text-gray-400 mt-1">{staffData.email}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.totalSubjects}</p>
                      <p className="text-xs text-gray-500">Subjects</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.totalQuestions}</p>
                      <p className="text-xs text-gray-500">Questions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{stats.uploadedToday}</p>
                      <p className="text-xs text-gray-500">Today</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{stats.totalUploads}</p>
                      <p className="text-xs text-gray-500">Uploads</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}