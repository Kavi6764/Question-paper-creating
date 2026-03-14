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
    Loader2,
    BarChart3
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
import StaffSettings from "./StaffSettings";
import UploadPreview from "./UploadPreview";
import PageContainer from "../../components/PageContainer";
import ConfirmationModal from "../../components/ConfirmationModal";
import MyActivities from "./MyActivities";

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
    const [showSwitchModal, setShowSwitchModal] = useState(false);
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
    const [activeTab, setActiveTab] = useState(() => {
        return localStorage.getItem("staffActiveTab") || "dashboard";
    });
    const [showPreviewMode, setShowPreviewMode] = useState(false);

    useEffect(() => {
        localStorage.setItem("staffActiveTab", activeTab);
    }, [activeTab]);
    const [previewPage, setPreviewPage] = useState(0);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [uploadedUnits, setUploadedUnits] = useState({}); // Track uploaded units per subject
    const [questionPapers, setQuestionPapers] = useState([]); // Store visible question papers
    const [loadingPapers, setLoadingPapers] = useState(true);
    const [searchTerm, setSearchTerm] = useState(""); // Only used for File Preview now

    const itemsPerPage = 5;
    const fileInputRef = useRef(null);

    // Helper to generate sample data
    const generateSampleData = (marks, count) => {
        return Array.from({ length: count }, (_, i) => ({
            QuestionNo: `Q${i + 1}`,
            Question: i === 0 ? "Design a Deterministic Finite Automaton (DFA) for the language L = {w ∈ {0,1,2,3,4,5}* | w mod 5 ≥ 3}, where w is interpreted as a base-6 number." : `Sample Question ${i + 1} for ${marks} Marks`,
            Marks: marks,
            Difficulty: i % 3 === 0 ? "Easy" : i % 3 === 1 ? "Medium" : "Hard",
            BloomLevel: i % 6 === 0 ? "RE" : i % 6 === 1 ? "UN" : i % 6 === 2 ? "AP" : i % 6 === 3 ? "AN" : i % 6 === 4 ? "CR" : "EV",
            Unit: 1,
            CO: `CO${(i % 3) + 1}`,
            ImageURL: i === 0 ? "https://picsum.photos/400/300" : ""
        }));
    };

    const downloadTemplate = () => {
        const itemTiers = [
            { marks: 1, limit: 20 },
            { marks: 4, limit: 15 },
            { marks: 6, limit: 10 }
        ];
        const wb = XLSX.utils.book_new();

        itemTiers.forEach(({ marks, limit }) => {
            const data = generateSampleData(marks, limit);
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
                    unsubscribeUser = onSnapshot(userRef, async (docSnap) => {
                        if (docSnap.exists()) {
                            const data = docSnap.data();
                            const newStaffData = {
                                id: user.uid,
                                email: user.email,
                                name: data.fullName || data.name || user.displayName || "Staff Member",
                                username: data.username || "",
                                department: data.department || "Staff",
                                assignedSubjects: data.assignedSubjects || [],
                                status: data.status || "active",
                                role: data.role || "staff"
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

                                const uploadedToday = uploads.filter(u => {
                                    const uploadDate = u.timestamp;
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    return uploadDate >= today;
                                }).length;

                                setStats(prev => ({
                                    ...prev,
                                    uploadedToday: uploadedToday
                                }));
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

                                const staffEmail = (newStaffData.email || "").toLowerCase().trim();
                                const staffName = (newStaffData.name || "").toLowerCase().trim();
                                const groupedSubjects = new Map();

                                const getStaffCount = (s) => {
                                    if (!s) return 0;
                                    const allQuestions = [];

                                    // 1. Collect from nested units
                                    if (s.units) {
                                        Object.values(s.units).forEach(u => {
                                            if (u && Array.isArray(u.questions)) allQuestions.push(...u.questions);
                                        });
                                    }
                                    // 2. Collect from flattened unit keys (units.unit1)
                                    Object.keys(s).forEach(key => {
                                        if (key.startsWith('units.') && s[key] && Array.isArray(s[key].questions)) {
                                            allQuestions.push(...s[key].questions);
                                        }
                                    });

                                    // 2.5. Collect from top-level unit keys (unit1, unit2...) which happens on first upload
                                    Object.keys(s).forEach(key => {
                                        if (key.startsWith('unit') && !key.startsWith('units') && s[key] && Array.isArray(s[key].questions)) {
                                            allQuestions.push(...s[key].questions);
                                        }
                                    });

                                    // 3. Robust filter (ID, Email, or Name)
                                    return allQuestions.filter(q => {
                                        if (!q) return false;
                                        const qId = String(q.staffId || q.userId || "").trim();
                                        const qEmail = (q.staffEmail || q.email || "").toLowerCase().trim();
                                        const qName = (q.staffName || q.name || "").toLowerCase().trim();

                                        return (qId && qId === staffId) ||
                                            (qEmail && qEmail === staffEmail) ||
                                            (qName && staffName.length > 3 && qName.includes(staffName));
                                    }).length;
                                };

                                // Group and Merge subjects by Code
                                assigned.forEach(subject => {
                                    const code = (subject.subjectCode || "").trim().toUpperCase();
                                    const staffCount = getStaffCount(subject);

                                    // Normalize top-level units to subject.units
                                    if (!subject.units) subject.units = {};
                                    Object.keys(subject).forEach(key => {
                                        if (key.startsWith('unit') && !key.startsWith('units') && subject[key]) {
                                            subject.units[key] = subject.units[key] || subject[key];
                                        }
                                    });

                                    if (!groupedSubjects.has(code)) {
                                        groupedSubjects.set(code, {
                                            ...subject,
                                            totalQuestions: staffCount, // Set to THIS staff's count
                                            _docs: [subject]
                                        });
                                    } else {
                                        const existing = groupedSubjects.get(code);
                                        existing._docs.push(subject);
                                        existing.totalQuestions += staffCount;

                                        // Merge units for display/stats if needed
                                        if (subject.units) {
                                            existing.units = existing.units || {};
                                            Object.keys(subject.units).forEach(uKey => {
                                                if (!existing.units[uKey]) {
                                                    existing.units[uKey] = subject.units[uKey];
                                                } else {
                                                    const existingQuestions = existing.units[uKey].questions || [];
                                                    const newQuestions = subject.units[uKey].questions || [];
                                                    const qTexts = new Set(existingQuestions.map(q => q.question?.trim().toLowerCase()));
                                                    const uniqueNew = newQuestions.filter(q => !qTexts.has(q.question?.trim().toLowerCase()));
                                                    existing.units[uKey].questions = [...existingQuestions, ...uniqueNew];
                                                    existing.units[uKey].questionCount = existing.units[uKey].questions.length;
                                                }
                                            });
                                        }
                                    }
                                });

                                const mergedSubjects = Array.from(groupedSubjects.values());
                                setMySubjects(mergedSubjects);

                                // Total questions is the sum of staff-specific questions across all merged docs
                                const totalQuestions = assigned.reduce((sum, subject) => {
                                    return sum + getStaffCount(subject);
                                }, 0);

                                setStats(prev => ({
                                    ...prev,
                                    totalSubjects: mergedSubjects.length,
                                    totalQuestions: totalQuestions
                                }));
                            });
                        } else {
                            // Handle new user creation...
                            const username = location.state?.username || "";
                            await setDoc(userRef, {
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

        const q = query(
            collection(db, "questionPapers"),
            where("visible", "==", true)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const papers = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date()
            })).sort((a, b) => b.createdAt - a.createdAt);
            setQuestionPapers(papers);
            setLoadingPapers(false);
        }, (error) => {
            console.error("Error fetching papers:", error);
            toast.error("Error loading question papers");
            setLoadingPapers(false);
        });

        return () => unsubscribe();
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

            if (allRows.length === 0) {
                toast.error("The uploaded file is empty.");
                return;
            }

            const previewRows = [];

            allRows.forEach((row, index) => {
                // If the entire row is empty, skip it
                if (Object.keys(row).length === 0) return;

                const missingFields = [];
                if (!row.Question || row.Question.toString().trim() === "") missingFields.push("Question");

                const marksVal = row.Marks !== undefined ? Number(row.Marks) : null;
                if (marksVal === null || ![1, 2, 4, 6].includes(marksVal)) {
                    missingFields.push("Marks (must be 1, 2, 4, or 6)");
                }

                if (!row.Unit) missingFields.push("Unit");

                const coVal = row.CO || row.co || row.C0 || row.c0;
                if (!coVal) missingFields.push("CO");

                const bloomVal = row.BloomLevel || row.bloomLevel;
                if (!bloomVal) missingFields.push("BloomLevel");

                previewRows.push({
                    id: previewRows.length + 1,
                    questionNo: row.QuestionNo || `Q${previewRows.length + 1}`,
                    question: row.Question ? String(row.Question).trim() : "",
                    marks: marksVal,
                    questionType: marksVal <= 2 ? 'MCQ' : marksVal <= 4 ? 'Short' : 'Long',
                    difficulty: row.Difficulty || "Medium",
                    bloomLevel: bloomVal || "",
                    unit: row.Unit || "",
                    co: coVal || "",
                    imageURL: row.ImageURL || row.imageURL || "",
                    hasError: missingFields.length > 0,
                    missingFields: missingFields,
                    orQuestion: row.OrQuestion ? {
                        question: String(row.OrQuestion).trim(),
                        unit: row.OrUnit || row.Unit || "",
                        bloomLevel: row.OrBloomLevel || bloomVal || "",
                        co: row.OrCO || row.orCo || row.OrC0 || row.orc0 || coVal || "",
                        imageURL: row.OrImageURL || ""
                    } : null
                });
            });

            setPreviewData(previewRows);

            const errorCount = previewRows.filter(r => r.hasError).length;
            if (errorCount > 0) {
                toast.error(`${errorCount} rows have missing or invalid data. Please fix them in the preview before uploading.`);
            } else {
                toast.success(`Check preview: ${previewRows.length} questions ready`);
            }
        } catch (error) {
            console.error("Error parsing file:", error);
            toast.error("Failed to process Excel file. Please use the provided template.");
        }
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseFileForPreview(selectedFile);
        }
    };

    const handlePreviewClick = async (e) => {
        e.preventDefault();

        if (!staffData) {
            toast.error("Please login to upload");
            return;
        }

        if (!subjectCode || !subjectName || !unit || !file) {
            toast.error("All fields are required");
            return;
        }

        // Check for 225-question limit across all units (per-staff)
        const currentSubject = mySubjects.find(s => s.subjectCode === subjectCode);
        const allUnits = currentSubject?.units || {};
        const currentStaffTotalCount = Object.values(allUnits).reduce((total, unitData) => {
            const staffQuestions = (unitData.questions || []).filter(q => q.staffId === staffData.id);
            return total + staffQuestions.length;
        }, 0);

        if (currentStaffTotalCount >= 225) {
            toast.error(`You have already uploaded the maximum limit of 225 questions for ${subjectCode}.`);
            return;
        }

        // Check if this unit is already uploaded (per-staff)
        const currentUnitKey = `unit${unit}`;
        const currentUnitQuestions = allUnits[currentUnitKey]?.questions || [];
        const currentUnitStaffCount = currentUnitQuestions.filter(q => q.staffId === staffData.id).length;

        if (uploadedUnits[subjectCode]?.includes(unit)) {
            const confirm = window.confirm(
                `Unit ${unit} for ${subjectCode} already has ${currentUnitStaffCount} of your questions.\n` +
                `Your total questions for this subject is ${currentStaffTotalCount}/225.\n\n` +
                `Do you want to continue?`
            );
            if (!confirm) return;
        }

        if (previewData.length === 0) {
            toast.error("No valid questions found to preview.");
            return;
        }

        setShowPreviewMode(true);
    };

    const handleConfirmUpload = async () => {
        if (loading) return; // Prevent double submission
        
        try {
            setLoading(true);
            setUploadStatus("processing");
            setUploadProgress(10);

            const progressInterval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 200);

            let allRows = previewData;
            const REQ = { 1: 20, 4: 15, 6: 10 };
            const UNIT_TOTAL = 45;

            // Helper to find existing questions
            const getExistingUnitQuestions = (data, u) => {
                if (!data) return [];
                if (data.units && data.units[`unit${u}`]) return data.units[`unit${u}`].questions || [];
                const flatKey = `units.unit${u}`;
                if (data[flatKey]) return data[flatKey].questions || [];
                if (data[`unit${u}`]) return data[`unit${u}`].questions || [];
                return [];
            };

            const countMark = (qs, m) => {
                if (!Array.isArray(qs)) return 0;
                return qs.filter(q => Number(q.marks) === m).length;
            };

            const validateUnitCompleteness = (uNum, existing, incoming) => {
                const results = { ok: true, errors: [] };
                const merged = [...existing, ...incoming];
                
                [1, 4, 6].forEach(m => {
                    const count = countMark(merged, m);
                    if (count !== REQ[m]) {
                        results.ok = false;
                        results.errors.push(`${m} Mark: Have ${count}, need exactly ${REQ[m]}`);
                    }
                });

                if (merged.length !== UNIT_TOTAL) {
                    results.ok = false;
                    results.errors.push(`Total: Have ${merged.length}, need exactly ${UNIT_TOTAL}`);
                }
                
                // Fail-safe: Check for invalid marks that shouldn't be there
                const invalidMarks = merged.filter(q => ![1, 4, 6].includes(Number(q.marks)));
                if (invalidMarks.length > 0) {
                    results.ok = false;
                    results.errors.push(`${invalidMarks.length} questions have invalid marks (only 1, 4, 6 allowed)`);
                }
                
                return results;
            };

            // 1. Basic empty check
            const emptyQuestions = allRows.filter(r => !r.question || r.question.toString().trim() === "");
            if (emptyQuestions.length > 0) {
                clearInterval(progressInterval);
                toast.error(`Error: ${emptyQuestions.length} questions are empty.`);
                setLoading(false);
                return;
            }

            // 2. Fetch Existing Subject Data
            let subjectRef = null;
            const qSub = query(collection(db, "subjects"), where("subjectCode", "==", subjectCode));
            const querySnapshot = await getDocs(qSub);
            let existingData = { units: {}, totalQuestions: 0 };
            
            if (!querySnapshot.empty) {
                const myDocs = querySnapshot.docs.filter(d => d.data().staffId === staffData.id);
                subjectRef = myDocs.length > 0 ? myDocs[0].ref : querySnapshot.docs[0].ref;
                const snap = await getDoc(subjectRef);
                if (snap.exists()) existingData = snap.data();
            } else {
                subjectRef = doc(db, "subjects", `${staffData.id}_${subjectCode}`);
            }

            // 3. Group New Questions by Unit
            const newQuestionsByUnit = {};
            if (unit === "multi") {
                [1, 2, 3, 4, 5].forEach(u => {
                    const rows = allRows.filter(row => Number(row.unit) === u);
                    if (rows.length > 0) newQuestionsByUnit[u] = rows;
                });
            } else {
                newQuestionsByUnit[unit] = allRows.filter(row => Number(row.unit) === Number(unit));
            }

            if (Object.keys(newQuestionsByUnit).length === 0) {
                clearInterval(progressInterval);
                toast.error("No questions found for the selected unit(s).");
                setLoading(false);
                return;
            }

            // 4. PRE-CALCULATE AND VALIDATE COMPLETENESS
            const updates = { lastUpdated: serverTimestamp(), subjectCode, subjectName };
            const validationErrors = [];
            const finalState = {};

            Object.keys(newQuestionsByUnit).forEach(u => {
                const unitKey = `unit${u}`;
                const existingQs = getExistingUnitQuestions(existingData, u);
                const existingTexts = new Set(existingQs.map(q => (q.question || "").trim().toLowerCase()));

                const mappedNew = newQuestionsByUnit[u].map((row, idx) => ({
                    id: `${subjectCode}-U${u}-Q${idx}-${Date.now()}-${Math.random().toString(36).substr(2,4)}`,
                    ...row,
                    uploadedAt: Date.now(),
                    staffId: staffData.id,
                    staffName: staffData.name,
                    staffEmail: staffData.email
                }));

                const uniqueNew = mappedNew.filter(q => !existingTexts.has((q.question || "").trim().toLowerCase()));
                const merged = [...existingQs, ...uniqueNew];

                const v = validateUnitCompleteness(u, [], merged);
                if (!v.ok) {
                    validationErrors.push(`Unit ${u}:\n• ${v.errors.join('\n• ')}`);
                }

                finalState[u] = {
                    metadata: {
                        unitNumber: Number(u),
                        unitName: `Unit ${u}`,
                        questions: merged,
                        questionCount: merged.length,
                        createdAt: (existingData.units?.[unitKey]?.createdAt || existingData[unitKey]?.createdAt || serverTimestamp()),
                        lastUpdated: serverTimestamp(),
                    },
                    uniqueNewCount: uniqueNew.length,
                    newQuestions: uniqueNew
                };
            });

            if (validationErrors.length > 0) {
                clearInterval(progressInterval);
                window.alert(`❌ UPLOAD REJECTED - INCOMPLETE UNIT DATA\n\nEach unit must contain exactly:\n- 20 questions (1 Mark)\n- 15 questions (4 Marks)\n- 10 questions (6 Marks)\n\nDiscrepancies found:\n\n${validationErrors.join('\n\n')}`);
                setLoading(false);
                setUploadStatus("error");
                throw new Error("Validation failed - blocking upload"); // Fail-safe to prevent any DB writes
            }

            // 5. IF VALID, PROCEED TO DATABASE WRITES
            setUploadProgress(70);

            // A. Update Subject
            if (!existingData.staffId) {
                updates.staffId = staffData.id;
                updates.staffName = staffData.name;
                updates.staffEmail = staffData.email;
            }

            let totalAdded = 0;
            let finalSubjectTotalCount = 0;
            
            // Temporary construction of the final units object to count total questions
            const finalUnits = existingData.units || {};

            Object.keys(finalState).forEach(u => {
                const unitKey = `unit${u}`;
                finalUnits[unitKey] = finalState[u].metadata;
                
                if (existingData.units) updates[`units.${unitKey}`] = finalState[u].metadata;
                else updates[unitKey] = finalState[u].metadata;
                
                totalAdded += finalState[u].uniqueNewCount;
            });

            // Calculate total subject questions across ALL units
            finalSubjectTotalCount = Object.values(finalUnits).reduce((acc, unit) => acc + (unit.questions?.length || 0), 0);
            updates.totalQuestions = finalSubjectTotalCount;

            if (querySnapshot.empty) {
                updates.createdAt = serverTimestamp();
                await setDoc(subjectRef, updates);
            }
            else await updateDoc(subjectRef, updates);

            // B. Log Individual Upload Records
            for (const u of Object.keys(finalState)) {
                if (finalState[u].uniqueNewCount > 0) { // Only log if new questions were actually added
                    const uploadRef = doc(collection(db, "uploads"));
                    await setDoc(uploadRef, {
                        uploadId: uploadRef.id,
                        staffId: staffData.id,
                        staffName: staffData.name,
                        staffEmail: staffData.email,
                        subjectCode,
                        subjectName,
                        unit: Number(u),
                        questionCount: finalState[u].uniqueNewCount,
                        questions: finalState[u].newQuestions,
                        status: "completed",
                        createdAt: serverTimestamp(),
                    });
                }
            }

            // C. Log One Activity Record
            const activityRef = doc(collection(db, "activities"));
            await setDoc(activityRef, {
                activityId: activityRef.id,
                staffId: staffData.id,
                staffName: staffData.name,
                username: staffData.username,
                subjectCode,
                subjectName,
                message: `Uploaded ${totalAdded} questions to ${subjectCode} (Units: ${Object.keys(finalState).join(', ')})`,
                type: "UPLOAD",
                role: "staff",
                createdAt: serverTimestamp(),
            });

            clearInterval(progressInterval);
            setUploadProgress(100);
            setUploadStatus("success");
            setTimeout(() => {
                toast.success(`✅ Successfully uploaded ${totalAdded} questions.`);
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
        setShowPreviewMode(false);
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
        item.difficulty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.bloomLevel?.toLowerCase().includes(searchTerm.toLowerCase())
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
                                    { id: 'activities', icon: BarChart3, label: 'Activities' }
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
                                            onClick={() => {
                                                setActiveTab("settings");
                                                setShowProfileMenu(false);
                                            }}
                                            className="w-full px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 flex items-center gap-2.5 transition-all duration-300 mx-1 rounded-lg hover:bg-white hover:border-slate-200 border border-transparent hover:shadow-sm group"
                                        >
                                            <Shield className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                            <span>Settings</span>
                                        </button>

                                        {(staffData?.role === "hod" || staffData?.role === "dean" || staffData?.role === "admin") && (
                                            <button
                                                onClick={() => setShowSwitchModal(true)}
                                                className="w-full px-4 py-2.5 text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2.5 transition-all duration-300 mx-1 rounded-lg hover:bg-blue-50/50 group border border-transparent hover:border-blue-100"
                                            >
                                                <Shield className="h-4 w-4 text-blue-500 group-hover:text-blue-600" />
                                                <span>Switch to Admin Portal</span>
                                            </button>
                                        )}
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

                {activeTab !== "settings" && (
                    <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <StatsCards stats={stats} />
                    </div>
                )}

                {/* Main Content */}
                {activeTab === "upload" && showPreviewMode ? (
                    <div className="mt-8">
                        <UploadPreview
                            previewData={previewData}
                            setPreviewData={setPreviewData}
                            unit={unit}
                            subjectName={subjectName}
                            onConfirm={handleConfirmUpload}
                            onCancel={() => setShowPreviewMode(false)}
                            loading={loading}
                        />
                    </div>
                ) : (
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

                            {activeTab === "settings" && (
                                <div className="animate-fade-in">
                                    <StaffSettings staffData={staffData} />
                                </div>
                            )}

                            {activeTab === "upload" && (
                                <div className="animate-fade-in">
                                    <UploadForm
                                        staffId={staffData.id}
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
                                        handleSubmit={handlePreviewClick}
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

                            {activeTab === "activities" && (
                                <div className="animate-fade-in">
                                    <MyActivities
                                        mySubjects={mySubjects}
                                        staffData={staffData}
                                    />
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
                )}
            </PageContainer>

            <ConfirmationModal
                isOpen={showSwitchModal}
                onClose={() => setShowSwitchModal(false)}
                onConfirm={() => {
                    localStorage.setItem("username", staffData.username || staffData.role);
                    navigate("/admin-dashboard");
                }}
                title="Switch to Admin Portal"
                message="You are about to switch to the Admin Dashboard. Do you want to continue?"
                confirmText="Switch Portal"
                type="info"
            />
        </div>
    );
}
