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

                <StatsCards stats={stats} />

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    {/* Left Column - Main Content */}
                    <div className="lg:col-span-2">
                        {activeTab === "dashboard" && (
                            <UploadHistory
                                uploads={myUploads}
                                limit={5}
                                hideControls={true}
                                title="Recent Activity"
                            />
                        )}

                        {activeTab === "upload" && (
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
                            />
                        )}

                        {activeTab === "subjects" && (
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
                        )}

                        {activeTab === "history" && (
                            <UploadHistory
                                uploads={myUploads}
                            />
                        )}

                        {activeTab === "papers" && (
                            <GeneratedPapers questionPapers={questionPapers} />
                        )}
                    </div>

                    {/* Right Column - Preview Panel */}
                    <FilePreview
                        file={file}
                        previewData={previewData}
                        previewPage={previewPage}
                        setPreviewPage={setPreviewPage}
                        totalPreviewPages={totalPreviewPages}
                        paginatedPreview={paginatedPreview}
                    />
                </div>
            </div>
        </div>
    );
}
