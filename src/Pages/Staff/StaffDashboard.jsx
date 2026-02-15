import { useState, useRef, useEffect } from "react";
import {
    Home,
    Upload,
    BookOpen,
    Database,
    FileText,
    Shield,
    ChevronDown,
    LogOut,
    Loader2
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
    onSnapshot
} from "firebase/firestore";
import { db, auth } from "../../../fireBaseConfig";
import { useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";

// Import Sub-Components
import StatsCards from "./StatsCards";
import SubjectList from "./SubjectList";
import UploadHistory from "./UploadHistory";
import UploadForm from "./UploadForm";
import GeneratedPapers from "./GeneratedPapers";
import FilePreview from "./FilePreview";
import PageContainer from "../../components/PageContainer";

// Helper to get initials
const getInitials = (name) => {
    if (!name) return "";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function StaffDashboard() {
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
    const [previewPage, setPreviewPage] = useState(0);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [uploadedUnits, setUploadedUnits] = useState({}); // Track uploaded units per subject
    const [questionPapers, setQuestionPapers] = useState([]); // Store visible question papers
    const [searchTerm, setSearchTerm] = useState(""); // Only used for File Preview now

    const itemsPerPage = 5;
    const fileInputRef = useRef(null);

    // Helper to generate sample data
    const generateSampleData = (marks, count) => {
        return Array.from({ length: count }, (_, i) => ({
            QuestionNo: `Q${i + 1}`,
            Question: `Sample Question ${i + 1} for ${marks} Marks`,
            Marks: marks,
            Difficulty: i % 3 === 0 ? "Easy" : i % 3 === 1 ? "Medium" : "Hard",
            Unit: 1
        }));
    };

    const downloadTemplate = () => {
        const itemTiers = [2, 4, 6, 8];
        const wb = XLSX.utils.book_new();

        itemTiers.forEach(marks => {
            const data = generateSampleData(marks, 25);
            const ws = XLSX.utils.json_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, `${marks} Marks`);
        });

        XLSX.writeFile(wb, "question_bank_template.xlsx");
        toast.success("Template downloaded successfully!");
    };

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

            let allRows = [];
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const sheetRows = XLSX.utils.sheet_to_json(sheet);
                allRows = [...allRows, ...sheetRows];
            });

            const rows = allRows;

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
            setUploadProgress(50);

            // Read all sheets
            let allRows = [];
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const sheetRows = XLSX.utils.sheet_to_json(sheet);
                allRows = [...allRows, ...sheetRows];
            });

            // Filter questions for selected unit only
            const unitQuestions = allRows
                .filter((row) => Number(row.Unit) === Number(unit))
                .map((row, index) => ({
                    id: `${subjectCode}-U${unit}-Q${index + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    questionNo: row.QuestionNo || `Q${index + 1}`,
                    question: row.Question,
                    marks: Number(row.Marks),
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

            // Validate Marks
            const invalidQuestions = unitQuestions.filter(q => ![2, 4, 6, 8].includes(q.marks));
            if (invalidQuestions.length > 0) {
                clearInterval(progressInterval);
                toast.error(`Found ${invalidQuestions.length} questions with invalid marks. Allowed marks: 2, 4, 6, 8.`);
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center animate-pulse-subtle">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
                    <p className="mt-4 text-gray-600 font-medium">Loading your portal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent">
            {/* Top Navigation */}
            <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-white/20 shadow-sm transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <div className="shrink-0 flex items-center animate-fade-in">
                                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-2 rounded-lg shadow-lg shadow-blue-500/30 mr-3">
                                    <Shield className="h-6 w-6" />
                                </div>
                                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
                                    Staff Portal
                                </span>
                            </div>

                            {/* Navigation Links */}
                            <div className="hidden md:ml-8 md:flex md:space-x-4">
                                {[
                                    { id: 'dashboard', icon: Home, label: 'Dashboard' },
                                    { id: 'upload', icon: Upload, label: 'Upload' },
                                    { id: 'subjects', icon: BookOpen, label: `My Subjects (${mySubjects.length})` },
                                    { id: 'history', icon: Database, label: `History (${myUploads.length})` },
                                    { id: 'papers', icon: FileText, label: 'Papers' }
                                ].map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            className={`relative inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === item.id
                                                ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200/50"
                                                : "text-gray-600 hover:bg-gray-50/80 hover:text-gray-900"
                                                }`}
                                        >
                                            <Icon className={`w-4 h-4 mr-2 ${activeTab === item.id ? "text-blue-600" : "text-gray-400"}`} />
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center space-x-4">
                            {/* Profile Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center space-x-3 p-1.5 rounded-full hover:bg-white/50 transition-colors border border-transparent hover:border-gray-200"
                                >
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-sm shadow-inner">
                                        {getInitials(staffData.name)}
                                    </div>
                                    <div className="hidden md:block text-left mr-2">
                                        <p className="text-sm font-medium text-gray-700 leading-none">{staffData.name}</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5 font-medium">@{staffData.username || staffData.email?.split('@')[0]}</p>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                </button>

                                {showProfileMenu && (
                                    <div className="absolute right-0 mt-2 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 py-2 z-50 animate-scale-in origin-top-right ring-1 ring-black/5">
                                        <div className="px-4 py-3 border-b border-gray-100/50 bg-gray-50/50">
                                            <p className="text-sm font-semibold text-gray-900">{staffData.name}</p>
                                            <p className="text-xs text-gray-500 truncate mt-0.5">{staffData.email}</p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wide">
                                                    {staffData.department}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mt-3 text-xs bg-white p-2 rounded-lg border border-gray-100">
                                                <span className="text-gray-500">Total Uploads</span>
                                                <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">{stats.totalUploads}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50/50 flex items-center gap-2 transition-colors mx-1 rounded-lg mb-1"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <PageContainer className="py-8">
                {/* Welcome Section */}
                <div className="mb-8 animate-slide-up">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{staffData.name}</span>!
                    </h1>
                    <p className="text-gray-600 mt-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-white/60 rounded-md border border-gray-100 text-sm font-medium text-gray-700">
                            {staffData.department} Department
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-600">{stats.totalSubjects} Subjects</span>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-600">{stats.totalQuestions} Questions</span>
                    </p>
                </div>

                <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <StatsCards stats={stats} />
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-8">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {activeTab === "dashboard" && (
                            <div className="animate-fade-in">
                                <UploadHistory
                                    uploads={myUploads}
                                    limit={5}
                                    hideControls={true}
                                    title="Recent Activity"
                                />
                            </div>
                        )}

                        {activeTab === "upload" && (
                            <div className="animate-fade-in">
                                <UploadForm
                                    subjectCode={subjectCode}
                                    setSubjectCode={setSubjectCode}
                                    subjectName={subjectName}
                                    setSubjectName={setSubjectName}
                                    unit={unit}
                                    setUnit={setUnit}
                                    file={file}
                                    setFile={setFile}
                                    mySubjects={mySubjects}
                                    uploadedUnits={uploadedUnits}
                                    handleSubmit={handleSubmit}
                                    loading={loading}
                                    uploadStatus={uploadStatus}
                                    uploadProgress={uploadProgress}
                                    handleFileSelect={handleFileSelect}
                                    clearFile={clearFile}
                                    isDragging={isDragging}
                                    handleDragOver={handleDragOver}
                                    handleDragLeave={handleDragLeave}
                                    handleDrop={handleDrop}
                                    previewData={previewData}
                                    fileInputRef={fileInputRef}
                                    downloadTemplate={downloadTemplate}
                                />
                            </div>
                        )}

                        {activeTab === "subjects" && (
                            <div className="animate-fade-in">
                                <SubjectList
                                    mySubjects={mySubjects}
                                    uploadedUnits={uploadedUnits}
                                    stats={stats}
                                    onUploadClick={(subject) => {
                                        setSubjectCode(subject.subjectCode);
                                        setSubjectName(subject.subjectName);
                                        setActiveTab("upload");
                                    }}
                                />
                            </div>
                        )}

                        {activeTab === "history" && (
                            <div className="animate-fade-in">
                                <UploadHistory
                                    uploads={myUploads}
                                />
                            </div>
                        )}

                        {activeTab === "papers" && (
                            <div className="animate-fade-in">
                                <GeneratedPapers questionPapers={questionPapers} />
                            </div>
                        )}
                    </div>

                    {/* Right Column - Preview Panel */}
                    <div className="lg:col-span-1 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <FilePreview
                            file={file}
                            previewData={previewData}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            paginatedPreview={paginatedPreview}
                            previewPage={previewPage}
                            setPreviewPage={setPreviewPage}
                            totalPreviewPages={totalPreviewPages}
                            clearFile={clearFile}
                            downloadTemplate={downloadTemplate}
                        />
                    </div>
                </div>
            </PageContainer>
        </div>
    );
}
