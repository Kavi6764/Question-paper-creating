import { useState, useEffect, useMemo } from "react";
import logo from "../assets/logo.png";
import {
  User,
  Shield,
  LogOut,
  Book,
  FileText,
  Timer,
  BookOpen,
  Award,
  Users,
  GraduationCap,
  Building,
  FileDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  deleteDoc,
  arrayRemove,
  addDoc,
  writeBatch,
  deleteField
} from "firebase/firestore";
import { db, auth, firebaseConfig } from "../../fireBaseConfig";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  onAuthStateChanged,
  signOut,
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  setPersistence,
  inMemoryPersistence
} from "firebase/auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { downloadPaperAsWord } from "../utils/wordGenerator";
import { downloadPaperAsPDF } from "../utils/pdfGenerator";
import PageContainer from "../components/PageContainer";

// Import Sub-Components
import StaffManagement from "./Admin/StaffManagement";
import SubjectManagement from "./Admin/SubjectManagement";
import PaperGeneration from "./Admin/PaperGeneration";
import ScheduledPapers from "./Admin/ScheduledPapers";
import GeneratedPapers from "./Admin/GeneratedPapers";
import HodDeanAssignment from "./Admin/HodDeanAssignment";
import CollegeSettings from "./Admin/CollegeSettings";
import ConfirmationModal from "../components/ConfirmationModal";
import BackupRestore from "./Admin/BackupRestore";
import StaffActivities from "./Admin/StaffActivities";
import DepartmentManagement from "./Admin/DepartmentManagement";
import QuestionBank from "./Admin/QuestionBank";
import { Database as DatabaseIcon, BarChart3, Building2, Layers } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("staff");
  const [loading, setLoading] = useState(false);

  // Dashboard Stats State
  const [stats, setStats] = useState({
    totalStaff: 0,
    totalSubjects: 0,
    totalDepartments: 0,
    scheduledPapers: 0,
    generatedPapers: 0
  });

  // Portal Switch State
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  // Staff Management State
  const [staffList, setStaffList] = useState([]);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({
    email: "",
    fullName: "",
    username: "",
    department: "",
    subjects: []
  });
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);
  const [editingStaffId, setEditingStaffId] = useState(null);

  // Subject Management State
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({
    subjectCode: "",
    subjectName: "",
    department: "",
    semester: 1,
    totalUnits: 5,
    credits: 3,
    description: ""
  });
  const [editingSubjectId, setEditingSubjectId] = useState(null);

  // HOD/Dean Assignment State
  const [showAssignHodDean, setShowAssignHodDean] = useState(false);
  const [hodDeanAssignment, setHodDeanAssignment] = useState({
    username: "",
    role: "hod", // "hod" or "dean"
    department: ""
  });

  // Question Paper Generation State
  const [questionPapers, setQuestionPapers] = useState([]);
  const [paperForm, setPaperForm] = useState({
    title: "",
    subjectCode: "",
    semester: "",
    examDate: "",
    examTime: "09:30",
    duration: 3,
    oneMarkQuestions: 5,
    fourMarkQuestions: 5,
    sixMarkQuestions: 3,
    eightMarkQuestions: 0, // Temporarily 0 (Prev: 2)
    totalQuestions: 13, // Prev: 15
    totalMarks: 43, // Prev: 64
    generationTime: "",
    generationDate: "",
    department: "",
    section: ""
  });

  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState({
    oneMark: [],
    fourMark: [],
    sixMark: [],
    eightMark: []
  });
  const [generatedPaper, setGeneratedPaper] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [scheduledPapers, setScheduledPapers] = useState([]);

  // Stats for available questions
  const [questionStats, setQuestionStats] = useState({
    oneMark: { total: 0, available: 0 },
    fourMark: { total: 0, available: 0 },
    sixMark: { total: 0, available: 0 },
    eightMark: { total: 0, available: 0 }
  });

  const [collegeDetails, setCollegeDetails] = useState(null);

  // Department Management State
  const [departments, setDepartments] = useState([]);


  // Check authentication and role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const username = localStorage.getItem("username") || sessionStorage.getItem("username");

          if (username === "hod" || username === "dean" || username === "admin") {
            setUserData({
              id: user.uid,
              email: user.email,
              name: username.toUpperCase(),
              username: username,
              role: username
            });
            loadData();
            return;
          }

          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.role !== "hod" && userData.role !== "dean" && userData.role !== "admin") {
              toast.error("Access denied. Admin access required.");
              navigate("/uploadQuestions");
              return;
            }
            setUserData({
              id: user.uid,
              email: user.email,
              name: userData.fullName || userData.name,
              username: userData.username,
              role: userData.role,
              department: userData.department || ""
            });
            loadData();
          } else {
            navigate("/");
          }
        } catch (error) {
          console.error("Error loading user:", error);
          navigate("/");
        }
      } else {
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const loadData = async () => {
    try {
      // Load all staff
      const staffQuery = query(collection(db, "users"));
      const unsubscribeStaff = onSnapshot(staffQuery, (snapshot) => {
        const staff = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).filter(user =>
          (user.role === "staff" ||
            user.role === "hod" ||
            user.role === "dean" ||
            user.username === "hod" ||
            user.username === "dean" ||
            user.username === "admin") &&
          user.status !== "deleted"
        );
        setStaffList(staff);
        setStats(prev => ({ ...prev, totalStaff: staff.length }));
      });

      // Load all subjects
      const subjectsQuery = query(collection(db, "subjects"));
      const unsubscribeSubjects = onSnapshot(subjectsQuery, (snapshot) => {
        const subjects = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllSubjects(subjects);
        setStats(prev => ({ ...prev, totalSubjects: subjects.length }));

        const uniqueSubjectsMap = new Map();
        subjects.forEach(s => {
          if (s.subjectCode && s.subjectName) {
            uniqueSubjectsMap.set(s.subjectCode, {
              code: s.subjectCode,
              name: s.subjectName,
              department: s.department,
              semester: s.semester,
              totalUnits: s.totalUnits || 5,
              credits: s.credits || 3
            });
          }
        });
        setAvailableSubjects(Array.from(uniqueSubjectsMap.values()));
      });

      // Load question papers
      const papersQuery = query(collection(db, "questionPapers"));
      const unsubscribePapers = onSnapshot(papersQuery, (snapshot) => {
        const papers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setQuestionPapers(papers);
        setStats(prev => ({ ...prev, generatedPapers: papers.length }));

        const scheduled = papers.filter(paper => paper.status === "scheduled");
        setScheduledPapers(scheduled);
        setStats(prev => ({ ...prev, scheduledPapers: scheduled.length }));

        checkScheduledPapers(scheduled);
      });

      // Load departments
      const deptQuery = query(collection(db, "departments"));
      const unsubscribeDepts = onSnapshot(deptQuery, (snapshot) => {
        const depts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDepartments(depts);
        setStats(prev => ({ ...prev, totalDepartments: depts.length }));
      });

      return () => {
        unsubscribeStaff();
        unsubscribeSubjects();
        unsubscribePapers();
        unsubscribeDepts();
      };
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error loading data");
    }
  };

  // Filtered staff list based on user role
  const filteredStaffForRole = useMemo(() => {
    if (!staffList || !userData) return [];
    if (userData.role === 'hod') {
      const dept = userData.department;
      // HODs see staff in their department and cannot see Dean
      return staffList.filter(s =>
        s.role !== 'dean' &&
        s.username !== 'dean' &&
        (s.department === dept)
      );
    }
    return staffList;
  }, [staffList, userData]);

  const filteredSubjectsForRole = useMemo(() => {
    if (!allSubjects || !userData) return [];
    if (userData.role === 'hod') {
      const dept = userData.department;
      return allSubjects.filter(sub => sub.department === dept);
    }
    return allSubjects;
  }, [allSubjects, userData]);

  const filteredAvailableSubjectsForRole = useMemo(() => {
    if (!availableSubjects || !userData) return [];
    if (userData.role === 'hod') {
      const dept = userData.department;
      return availableSubjects.filter(sub => sub.department === dept);
    }
    return availableSubjects;
  }, [availableSubjects, userData]);

  const filteredPapersForRole = useMemo(() => {
    if (!questionPapers || !userData) return [];
    if (userData.role === 'hod') {
      const dept = userData.department;
      return questionPapers.filter(paper => paper.department === dept);
    }
    return questionPapers;
  }, [questionPapers, userData]);

  const filteredScheduledPapersForRole = useMemo(() => {
    if (!scheduledPapers || !userData) return [];
    if (userData.role === 'hod') {
      const dept = userData.department;
      return scheduledPapers.filter(paper => paper.department === dept);
    }
    return scheduledPapers;
  }, [scheduledPapers, userData]);

  // Calculate total questions and marks
  useEffect(() => {
    const totalQuestions = paperForm.oneMarkQuestions + paperForm.fourMarkQuestions + paperForm.sixMarkQuestions + paperForm.eightMarkQuestions;
    const totalMarks = (paperForm.oneMarkQuestions * 1) + (paperForm.fourMarkQuestions * 4) + (paperForm.sixMarkQuestions * 6) + (paperForm.eightMarkQuestions * 8);

    setPaperForm(prev => ({
      ...prev,
      totalQuestions,
      totalMarks
    }));
  }, [paperForm.oneMarkQuestions, paperForm.fourMarkQuestions, paperForm.sixMarkQuestions, paperForm.eightMarkQuestions]);

  // Check scheduled papers
  const checkScheduledPapers = (scheduledPapers) => {
    const now = new Date();

    scheduledPapers.forEach(paper => {
      if (paper.generationDate && paper.generationTime) {
        const [hours, minutes] = paper.generationTime.split(':').map(Number);
        const generationDate = new Date(paper.generationDate);
        generationDate.setHours(hours, minutes, 0, 0);

        if (now >= generationDate && paper.status === "scheduled") {
          autoGeneratePaper(paper);
        }
      }
    });
  };

  const getQuestionPoolForAutoGeneration = async (subjectCode) => {
    try {
      const questions = {
        oneMark: [],
        fourMark: [],
        sixMark: [],
        eightMark: []
      };

      const subjectsQuery = query(
        collection(db, "subjects"),
        where("subjectCode", "==", subjectCode)
      );
      const subjectsSnapshot = await getDocs(subjectsQuery);

      subjectsSnapshot.forEach((doc) => {
        const subjectData = doc.data();
        if (subjectData.units) {
          Object.keys(subjectData.units).forEach(unitKey => {
            const unit = subjectData.units[unitKey];
            const unitNumber = unit.unitNumber || unitKey.replace("unit-", "").replace("unit", "") || "1";

            if (unit.questions && Array.isArray(unit.questions)) {
              unit.questions.forEach((q, index) => {
                const question = {
                  ...q,
                  id: `${doc.id}-${unitNumber}-${index}`,
                  unit: unitNumber,
                  subjectCode: subjectCode,
                  subjectName: subjectData.subjectName,
                  unitName: unit.unitName || `Unit ${unitNumber}`,
                  bloomLevel: q.bloomLevel || "RE",
                  dbId: doc.id
                };

                const marks = parseInt(q.marks) || 0;
                if (marks === 1 || marks === 2) questions.oneMark.push({ ...question, marks: 1 });
                else if (marks === 4) questions.fourMark.push(question);
                else if (marks === 6) questions.sixMark.push(question);
                else if (marks === 8) questions.eightMark.push(question);
              });
            }
          });
        }
      });
      return questions;
    } catch (error) {
      console.error("Error loading question pool:", error);
      return { oneMark: [], fourMark: [], sixMark: [], eightMark: [] };
    }
  };

  const autoGeneratePaper = async (scheduledPaper) => {
    try {
      const requirements = {
        oneMarkQuestions: scheduledPaper.oneMarkQuestions || scheduledPaper.twoMarkQuestions || 0,
        fourMarkQuestions: scheduledPaper.fourMarkQuestions || 0,
        sixMarkQuestions: scheduledPaper.sixMarkQuestions || 0,
        eightMarkQuestions: scheduledPaper.eightMarkQuestions || 0
      };

      // 1. Fetch ALL available questions first
      const questionPool = await getQuestionPoolForAutoGeneration(scheduledPaper.subjectCode);

      if (questionPool.oneMark.length === 0 && questionPool.fourMark.length === 0 && questionPool.sixMark.length === 0 && questionPool.eightMark.length === 0) {
        console.error(`No questions found for subject ${scheduledPaper.subjectCode}`);
        return;
      }

      // 2. Helper to generate a single paper update/creation
      const createPaperData = (questions) => {
        const questionsByMarks = {
          oneMark: questions.filter(q => q.marks === 1 || q.marks === 2),
          fourMark: questions.filter(q => q.marks === 4),
          sixMark: questions.filter(q => q.marks === 6),
          eightMark: questions.filter(q => q.marks === 8)
        };
        const totalMarks = questions.reduce((sum, q) => sum + (parseInt(q.marks === 2 ? 1 : q.marks) || 0), 0);

        return {
          status: "generated",
          questions: questions.map(q => q.marks === 2 ? { ...q, marks: 1 } : q),
          totalMarks: totalMarks,
          marksDistribution: {
            oneMark: { count: questionsByMarks.oneMark.length, totalMarks: questionsByMarks.oneMark.length * 1 },
            fourMark: { count: questionsByMarks.fourMark.length, totalMarks: questionsByMarks.fourMark.reduce((sum, q) => sum + (q.marks || 0), 0) },
            sixMark: { count: questionsByMarks.sixMark.length, totalMarks: questionsByMarks.sixMark.reduce((sum, q) => sum + (q.marks || 0), 0) },
            eightMark: { count: questionsByMarks.eightMark.length, totalMarks: questionsByMarks.eightMark.reduce((sum, q) => sum + (q.marks || 0), 0) }
          },
          generatedAt: serverTimestamp(),
          visible: true,
          department: scheduledPaper.department || ""
        };
      };

      // 3. Generate Set A (Update the existing scheduled doc)
      const questionsA = selectRandomQuestions(requirements, questionPool);
      const dataA = createPaperData(questionsA);

      const paperRefA = doc(db, "questionPapers", scheduledPaper.id);
      // Update title to include Set A if not present
      const titleA = scheduledPaper.title.includes("Set A") ? scheduledPaper.title : `${scheduledPaper.title} - Set A`;

      await updateDoc(paperRefA, {
        ...dataA,
        title: titleA
      });

      // 4. Generate Set B (Create a NEW doc)
      const questionsB = selectRandomQuestions(requirements, questionPool);
      const dataB = createPaperData(questionsB);

      const paperB = {
        ...scheduledPaper,
        ...dataB,
        title: scheduledPaper.title.includes("Set A") ? scheduledPaper.title.replace("Set A", "Set B") : `${scheduledPaper.title} - Set B`,
        status: "generated",
        createdAt: serverTimestamp() // Set B is created now
      };
      // Remove id from spread if it exists, addDoc will generate new one
      delete paperB.id;

      await addDoc(collection(db, "questionPapers"), paperB);

      console.log(`Auto-generated paper: ${scheduledPaper.title} (Set A & Set B)`);
      toast.success(`Auto-generated paper: ${scheduledPaper.title} (Set A & Set B)`);

    } catch (error) {
      console.error("Error auto-generating paper:", error);
    }
  };

  // STAFF MANAGEMENT FUNCTIONS
  const handleAddStaff = async () => {
    if (!newStaff.email || !newStaff.fullName || !newStaff.username) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);

      // Create or get secondary app safely
      const secondaryAppName = "SecondaryAuthApp";
      const secondaryApp = getApps().find(app => app.name === secondaryAppName)
        || initializeApp(firebaseConfig, secondaryAppName);

      const secondaryAuth = getAuth(secondaryApp);

      // CRITICAL: Set persistence to in-memory to prevent clobbering the main admin session
      await setPersistence(secondaryAuth, inMemoryPersistence);

      // 1. Check if email exists in Firestore (Active or Deleted)
      const emailQuery = query(collection(db, "users"), where("email", "==", newStaff.email));
      const emailSnap = await getDocs(emailQuery);

      if (!emailSnap.empty) {
        const existingUser = emailSnap.docs[0].data();
        const existingUserId = emailSnap.docs[0].id;

        if (existingUser.status === "deleted") {
          // Offer to RESTORE
          if (window.confirm(`This email belongs to a deleted staff member (${existingUser.fullName}). Do you want to restore them?`)) {
            await updateDoc(doc(db, "users", existingUserId), {
              status: "active",
              fullName: newStaff.fullName,
              username: newStaff.username, // Update username if changed
              department: newStaff.department || existingUser.department,
              assignedSubjects: newStaff.subjects || existingUser.assignedSubjects || [],
              deletedAt: null,
              updatedAt: serverTimestamp()
            });

            toast.success(`Staff member restored successfully!`);
            setShowAddStaff(false);
            setNewStaff({
              email: "",
              fullName: "",
              username: "",
              department: "",
              subjects: []
            });
            setLoading(false);
            return;
          } else {
            setLoading(false);
            return; // User cancelled restore
          }
        } else {
          toast.error("Email already registered and active.");
          setLoading(false);
          return;
        }
      }

      const usernameQuery = query(collection(db, "users"), where("username", "==", newStaff.username.toLowerCase()));
      const usernameSnap = await getDocs(usernameQuery);
      if (!usernameSnap.empty) {
        toast.error("Username already taken");
        setLoading(false);
        return;
      }

      const tempPassword = "Password@123";

      // Use secondaryAuth to prevent logging out the current admin
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newStaff.email, tempPassword);
      await sendEmailVerification(userCredential.user);

      // Note: We don't delete the app here to reuse it for the next staff creation.
      // The inMemoryPersistence ensures it doesn't affect the main login.

      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: newStaff.email,
        fullName: newStaff.fullName,
        username: newStaff.username.toLowerCase(),
        department: newStaff.department || "General",
        role: "staff",
        status: "active", // Set to active by default as requested
        emailVerified: false,
        assignedSubjects: newStaff.subjects || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success(`Staff added successfully! Username: ${newStaff.username}, Password: ${tempPassword}. Verification email sent.`);
      setShowAddStaff(false);
      setNewStaff({
        email: "",
        fullName: "",
        username: "",
        department: "",
        subjects: []
      });

    } catch (error) {
      console.error("Error adding staff:", error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error(
          "This email is associated with an existing account in Firebase Authentication but not in the database. Please contact the developer to remove the old login manually from the Firebase Console.",
          { duration: 8000 }
        );
      } else if (error.code === 'auth/invalid-email') {
        toast.error("Invalid email format");
      } else {
        toast.error(error.message || "Error adding staff");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStaff = async (staffId) => {
    try {
      setLoading(true);
      const staffRef = doc(db, "users", staffId);
      await updateDoc(staffRef, {
        fullName: newStaff.fullName,
        username: (newStaff.username || "").toLowerCase().trim(),
        department: newStaff.department || "General",
        assignedSubjects: newStaff.subjects || [],
        updatedAt: serverTimestamp()
      });

      toast.success("Staff updated successfully!");
      setEditingStaffId(null);
      setNewStaff({
        email: "",
        fullName: "",
        username: "",
        department: "",
        subjects: []
      });
      setShowAddStaff(false);
      setEditingStaffId(null);
    } catch (error) {
      console.error("Error updating staff:", error);
      toast.error("Error updating staff");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId, email) => {
    if (window.confirm(`Are you sure you want to delete staff with email ${email}? They can be restored later.`)) {
      try {
        const staffRef = doc(db, "users", staffId);
        await updateDoc(staffRef, {
          status: "deleted",
          deletedAt: serverTimestamp()
        });
        toast.success("Staff deleted successfully (Soft Delete)");
      } catch (error) {
        console.error("Error deleting staff:", error);
        toast.error("Error deleting staff");
      }
    }
  };

  const handleAssignSubject = async (staffId, subjectCode) => {
    try {
      const staffRef = doc(db, "users", staffId);
      const staffDoc = await getDoc(staffRef);
      if (staffDoc.exists()) {
        const currentSubjects = staffDoc.data().assignedSubjects || [];
        if (!currentSubjects.includes(subjectCode)) {
          await updateDoc(staffRef, {
            assignedSubjects: [...currentSubjects, subjectCode]
          });
          toast.success(`Assigned ${subjectCode} successfully`);
        }
      }
    } catch (error) {
      console.error("Error assigning subject:", error);
      toast.error("Error assigning subject");
    }
  };

  const handleRemoveSubject = async (staffId, subjectCode) => {
    if (window.confirm(`Remove ${subjectCode} from this staff member?`)) {
      try {
        const staffRef = doc(db, "users", staffId);
        await updateDoc(staffRef, {
          assignedSubjects: arrayRemove(subjectCode)
        });
        toast.success(`Removed ${subjectCode} successfully`);
      } catch (error) {
        console.error("Error removing subject:", error);
        toast.error("Error removing subject");
      }
    }
  };

  const handleToggleStaffStatus = async (staffId, currentStatus) => {
    try {
      const newStatus = (currentStatus === "active" || !currentStatus) ? "inactive" : "active";
      const action = newStatus === "active" ? "activate" : "deactivate";

      if (!window.confirm(`Are you sure you want to ${action} this staff member?`)) {
        return;
      }

      const staffRef = doc(db, "users", staffId);
      await updateDoc(staffRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      toast.success(`Staff member ${newStatus === "active" ? "activated" : "deactivated"} successfully`);
    } catch (error) {
      console.error("Error updating staff status:", error);
      toast.error("Error updating staff status");
    }
  };

  // SUBJECT MANAGEMENT FUNCTIONS
  const handleAddSubject = async () => {
    if (!newSubject.subjectCode || !newSubject.subjectName) {
      toast.error("Please fill required fields");
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, "subjects"), {
        ...newSubject,
        subjectCode: newSubject.subjectCode.toUpperCase(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success("Subject added successfully!");
      setShowAddSubject(false);
      setNewSubject({
        subjectCode: "",
        subjectName: "",
        department: "",
        semester: 1,
        totalUnits: 5,
        credits: 3,
        description: ""
      });
    } catch (error) {
      console.error("Error adding subject:", error);
      toast.error("Error adding subject");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubject = async () => {
    if (!editingSubjectId) return;

    try {
      setLoading(true);
      const subjectRef = doc(db, "subjects", editingSubjectId);
      await updateDoc(subjectRef, {
        ...newSubject,
        subjectCode: newSubject.subjectCode.toUpperCase(),
        updatedAt: serverTimestamp()
      });

      toast.success("Subject updated successfully!");
      setShowAddSubject(false);
      setEditingSubjectId(null);
      setNewSubject({
        subjectCode: "",
        subjectName: "",
        department: "",
        semester: 1,
        totalUnits: 5,
        credits: 3,
        description: ""
      });
    } catch (error) {
      console.error("Error updating subject:", error);
      toast.error("Error updating subject");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubject = (subject) => {
    setEditingSubjectId(subject.id);
    setNewSubject({
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      department: subject.department || "",
      semester: subject.semester || 1,
      totalUnits: subject.totalUnits || 5,
      credits: subject.credits || 3,
      description: subject.description || ""
    });
    setShowAddSubject(true);
  };

  const handleDeleteSubject = async (subjectId, subjectCode) => {
    // Check if subject is assigned to any staff
    const assignedStaff = staffList.filter(staff =>
      staff.assignedSubjects && staff.assignedSubjects.includes(subjectCode)
    );

    if (assignedStaff.length > 0) {
      toast.error(`Cannot delete ${subjectCode}. It is assigned to ${assignedStaff.length} staff member(s).`);
      return;
    }

    // Check if subject has generated or scheduled papers
    const relatedPapers = questionPapers.filter(paper => paper.subjectCode === subjectCode);

    if (relatedPapers.length > 0) {
      toast.error(`Cannot delete ${subjectCode}. There are ${relatedPapers.length} question paper(s) associated with it.`);
      return;
    }

    if (window.confirm(`Delete subject ${subjectCode}? This cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, "subjects", subjectId));
        toast.success("Subject deleted successfully");
      } catch (error) {
        console.error("Error deleting subject:", error);
        toast.error("Error deleting subject");
      }
    }
  };

  // HOD/DEAN ASSIGNMENT
  const handleAssignHodDean = async () => {
    if (!hodDeanAssignment.username || !hodDeanAssignment.department) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      const searchInput = hodDeanAssignment.username.trim();
      const searchInputLower = searchInput.toLowerCase();

      // Attempt to find user by username or email
      let userSnap;

      // 1. Try Username (exact or lowercase)
      const qUsername = query(collection(db, "users"), where("username", "==", searchInputLower));
      const usernameSnap = await getDocs(qUsername);

      if (!usernameSnap.empty) {
        userSnap = usernameSnap.docs[0];
      } else {
        // 2. Try Username (lowercase - for common errors)
        const qUsernameLower = query(collection(db, "users"), where("username", "==", searchInputLower));
        const usernameLowerSnap = await getDocs(qUsernameLower);

        if (!usernameLowerSnap.empty) {
          userSnap = usernameLowerSnap.docs[0];
        } else {
          // 3. Try Email
          const qEmail = query(collection(db, "users"), where("email", "==", searchInput));
          const emailSnap = await getDocs(qEmail);

          if (!emailSnap.empty) {
            userSnap = emailSnap.docs[0];
          } else {
            // 4. Try Email (lowercase)
            const qEmailLower = query(collection(db, "users"), where("email", "==", searchInputLower));
            const emailLowerSnap = await getDocs(qEmailLower);
            if (!emailLowerSnap.empty) {
              userSnap = emailLowerSnap.docs[0];
            }
          }
        }
      }

      if (!userSnap) {
        toast.error(`User with identifier "${searchInput}" not found. Please check the spelling.`);
        setLoading(false);
        return;
      }

      const userData = userSnap.data();
      const userRef = doc(db, "users", userSnap.id);

      await updateDoc(userRef, {
        role: hodDeanAssignment.role,
        department: hodDeanAssignment.department,
        updatedAt: serverTimestamp()
      });

      toast.success(`Assigned ${hodDeanAssignment.role.toUpperCase()} role to ${userData.fullName || userData.name || userData.username}`);
      setShowAssignHodDean(false);
      setHodDeanAssignment({ username: "", role: "hod", department: "" });

    } catch (error) {
      console.error("Error assigning role:", error);
      toast.error(`Error: ${error.message || "Failed to assign role"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (staffId, role) => {
    if (!window.confirm(`Are you sure you want to remove the ${role.toUpperCase()} role? They will be demoted to regular staff.`)) {
      return;
    }

    try {
      setLoading(true);
      const userRef = doc(db, "users", staffId);
      await updateDoc(userRef, {
        role: "staff",
        updatedAt: serverTimestamp()
      });
      toast.success(`Removed ${role.toUpperCase()} role and demoted to staff.`);
    } catch (error) {
      console.error("Error removing role:", error);
      toast.error("Error removing role");
    } finally {
      setLoading(false);
    }
  };

  // DEPARTMENT MANAGEMENT FUNCTIONS
  const handleAddDepartment = async (name) => {
    if (!name) return;
    try {
      setLoading(true);
      await addDoc(collection(db, "departments"), {
        name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success("Department created successfully");
    } catch (error) {
      console.error("Error adding department:", error);
      toast.error("Error adding department");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDepartment = async (id, name) => {
    if (!name) return;
    try {
      setLoading(true);
      await updateDoc(doc(db, "departments", id), {
        name,
        updatedAt: serverTimestamp()
      });
      toast.success("Department updated successfully");
    } catch (error) {
      console.error("Error updating department:", error);
      toast.error("Error updating department");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete the department "${name}"? This will NOT delete staff members, but they will be unassigned.`)) {
      try {
        setLoading(true);
        await deleteDoc(doc(db, "departments", id));
        toast.success("Department deleted successfully");
      } catch (error) {
        console.error("Error deleting department:", error);
        toast.error("Error deleting department");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAssignStaffToDept = async (staffId, deptName) => {
    try {
      setLoading(true);
      const staffRef = doc(db, "users", staffId);
      await updateDoc(staffRef, {
        department: deptName,
        updatedAt: serverTimestamp()
      });
      toast.success("Staff assigned to department successfully");
    } catch (error) {
      console.error("Error assigning staff to dept:", error);
      toast.error("Error assigning staff to dept");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStaffFromDept = async (staffId) => {
    try {
      setLoading(true);
      const staffRef = doc(db, "users", staffId);
      await updateDoc(staffRef, {
        department: "",
        updatedAt: serverTimestamp()
      });
      toast.success("Staff removed from department successfully");
    } catch (error) {
      console.error("Error removing staff from dept:", error);
      toast.error("Error removing staff from dept");
    } finally {
      setLoading(false);
    }
  };

  // PAPER GENERATION LOGIC
  const prepareQuestionStats = (questions) => {
    const stats = {
      oneMark: { total: questions.oneMark.length, available: questions.oneMark.length },
      fourMark: { total: questions.fourMark.length, available: questions.fourMark.length },
      sixMark: { total: questions.sixMark.length, available: questions.sixMark.length },
      eightMark: { total: questions.eightMark.length, available: questions.eightMark.length }
    };
    setQuestionStats(stats);
  };

  const loadQuestionsForSubject = async (subjectCode) => {
    try {
      setLoading(true);
      const questions = {
        oneMark: [],
        fourMark: [],
        sixMark: [],
        eightMark: []
      };

      const subjectsQuery = query(
        collection(db, "subjects"),
        where("subjectCode", "==", subjectCode)
      );
      const subjectsSnapshot = await getDocs(subjectsQuery);

      subjectsSnapshot.forEach((doc) => {
        const subjectData = doc.data();
        const unitMaps = new Map(); // Deduplicate units by number

        // 1. Legacy top-level units (unit1)
        Object.keys(subjectData).forEach(key => {
            if (key.startsWith('unit') && !key.startsWith('units') && subjectData[key]) {
                const num = parseInt(key.replace('unit', ''));
                if (!isNaN(num)) unitMaps.set(num, subjectData[key]);
            }
        });

        // 2. Flattened units (units.unit1)
        Object.keys(subjectData).forEach(key => {
            if (key.startsWith('units.')) {
                const num = parseInt(key.replace('units.unit', ''));
                if (!isNaN(num) && subjectData[key]) unitMaps.set(num, subjectData[key]);
            }
        });

        // 3. Nested units object (units: { unit1: ... })
        if (subjectData.units) {
          Object.keys(subjectData.units).forEach(unitKey => {
            const num = parseInt(unitKey.replace('unit', ''));
            if (!isNaN(num) && subjectData.units[unitKey]) unitMaps.set(num, subjectData.units[unitKey]);
          });
        }

        unitMaps.forEach((unit, unitNumber) => {
          if (unit.questions && Array.isArray(unit.questions)) {
            unit.questions.forEach((q, index) => {
              const question = {
                ...q,
                id: `${doc.id}-${unitNumber}-${index}-${Math.random().toString(36).substr(2, 4)}`,
                unit: unitNumber,
                subjectCode: subjectCode,
                subjectName: subjectData.subjectName,
                unitName: unit.unitName || `Unit ${unitNumber}`,
                dbId: doc.id
              };

              const marks = parseInt(q.marks) || 0;
              if (marks === 1 || marks === 2) questions.oneMark.push({ ...question, marks: 1 });
              else if (marks === 4) questions.fourMark.push(question);
              else if (marks === 6) questions.sixMark.push(question);
              else if (marks === 8) questions.eightMark.push(question);
            });
          }
        });
      });

      setAvailableQuestions(questions);
      prepareQuestionStats(questions);
      toast.success(`Loaded questions for ${subjectCode}`);

    } catch (error) {
      console.error("Error loading questions:", error);
      toast.error("Error loading questions");
    } finally {
      setLoading(false);
    }
  };

  const clearAllQuestions = () => {
    setSelectedQuestions([]);
    toast.success("All selected questions cleared");
  };

  const getBalancedRandomSelection = (form, source) => {
    const bloomLevels = ['RE', 'UN', 'AP', 'AN', 'EV'];
    const units = [1, 2, 3, 4, 5];
    const selected = [];
    const levelCounts = { RE: 0, UN: 0, AP: 0, AN: 0, EV: 0 };

    const pool = { 1: {}, 4: {}, 6: {}, 8: {} };
    [...source.oneMark, ...source.fourMark, ...source.sixMark, ...source.eightMark].forEach(q => {
      const marks = q.marks === 2 ? 1 : q.marks;
      const unit = q.unit || 1;
      const bl = (q.bloomLevel || 'RE').toUpperCase().replace('BL-', '');
      const cleanBL = bloomLevels.includes(bl) ? bl : 'RE';
      if (!pool[marks][unit]) pool[marks][unit] = {};
      if (!pool[marks][unit][cleanBL]) pool[marks][unit][cleanBL] = [];
      pool[marks][unit][cleanBL].push({ ...q });
    });

    const getOptimalQuestion = (m, preferredUnit, preferredBL) => {
      // Priority 1: Exact Match (Unit + BL)
      if (pool[m][preferredUnit]?.[preferredBL]?.length > 0) {
        return pool[m][preferredUnit][preferredBL].pop();
      }
      // Priority 2: Bloom Level Match (Any Unit)
      for (const u of units) {
        if (pool[m][u]?.[preferredBL]?.length > 0) return pool[m][u][preferredBL].pop();
      }
      // Priority 3: Unit Match (Least used BL)
      const sortedLevels = [...bloomLevels].sort((a, b) => levelCounts[a] - levelCounts[b]);
      for (const bl of sortedLevels) {
        if (pool[m][preferredUnit]?.[bl]?.length > 0) return pool[m][preferredUnit][bl].pop();
      }
      // Priority 4: Any Match
      for (const u of units) {
        for (const bl of bloomLevels) {
          if (pool[m][u]?.[bl]?.length > 0) return pool[m][u][bl].pop();
        }
      }
      return null;
    };

    // 1-Mark
    for (let i = 0; i < form.oneMarkQuestions; i++) {
      const q = getOptimalQuestion(1, units[i % units.length], bloomLevels[i % bloomLevels.length]);
      if (q) {
        selected.push(q);
        levelCounts[(q.bloomLevel || 'RE').toUpperCase().replace('BL-', '')]++;
      }
    }

    // 4, 6, 8 Mark Paired
    [4, 6, 8].forEach(m => {
      let count = 0;
      if (m === 4) count = form.fourMarkQuestions;
      else if (m === 6) count = form.sixMarkQuestions;
      else if (m === 8) count = form.eightMarkQuestions || 0;

      for (let i = 0; i < count; i++) {
        const u = units[i % units.length];
        const q1 = getOptimalQuestion(m, u, bloomLevels[(i * 2) % bloomLevels.length]);
        const q2 = getOptimalQuestion(m, u, bloomLevels[(i * 2 + 1) % bloomLevels.length]);
        if (q1 && q2) {
          selected.push({ ...q1, orQuestion: q2 });
          levelCounts[(q1.bloomLevel || 'RE').toUpperCase().replace('BL-', '')]++;
          levelCounts[(q2.bloomLevel || 'RE').toUpperCase().replace('BL-', '')]++;
        } else if (q1 || q2) {
          selected.push(q1 || q2);
        }
      }
    });

    return selected;
  };

  const generateRandomQuestions = () => {
    if (!paperForm.subjectCode) {
      toast.error("Please select a subject first");
      return;
    }
    const selected = getBalancedRandomSelection(paperForm, availableQuestions);
    if (selected.length === 0) {
      toast.error("Not enough suitable questions found in question bank");
      return;
    }
    setSelectedQuestions(selected);
    toast.success("Random selection complete (Balanced Units & Bloom Levels)");
  };

  const selectRandomQuestions = (form, source) => {
    return getBalancedRandomSelection(form, source);
  };

  const handleGeneratePaper = async () => {
    if (!paperForm.title || !paperForm.subjectCode || selectedQuestions.length === 0) {
      toast.error("Please fill all fields and select questions");
      return;
    }

    try {
      setLoading(true);

      // Helper to create paper object
      const createPaperObject = (titleSuffix, questions) => {
        const oneMarkCount = questions.filter(q => q.marks === 1 || q.marks === 2).length;
        const fourMarkCount = questions.filter(q => q.marks === 4).length;
        const sixMarkCount = questions.filter(q => q.marks === 6).length;
        const eightMarkCount = questions.filter(q => q.marks === 8).length;

        return {
          title: `${paperForm.title} - ${titleSuffix}`,
          subjectCode: paperForm.subjectCode,
          subjectName: availableSubjects.find(s => s.code === paperForm.subjectCode)?.name || paperForm.subjectCode,
          semester: paperForm.semester,
          examDate: paperForm.examDate,
          examTime: paperForm.examTime,
          duration: paperForm.duration,
          totalQuestions: questions.length,
          totalMarks: questions.reduce((sum, q) => sum + (parseInt(q.marks === 2 ? 1 : q.marks) || 0), 0),
          questions: questions.map(q => q.marks === 2 ? { ...q, marks: 1 } : q),
          status: "generated",
          isAutoGenerated: false,
          visible: true,
          createdBy: userData.uid || "admin",
          createdAt: serverTimestamp(),
          generatedAt: serverTimestamp(),
          unitsCovered: Array.from(new Set(questions.map(q => q.unit))).sort(),
          marksDistribution: {
            oneMark: { count: oneMarkCount, totalMarks: oneMarkCount * 1 },
            fourMark: { count: fourMarkCount, totalMarks: fourMarkCount * 4 },
            sixMark: { count: sixMarkCount, totalMarks: sixMarkCount * 6 },
            eightMark: { count: eightMarkCount, totalMarks: eightMarkCount * 8 }
          },
          department: paperForm.department || "",
          section: paperForm.section || ""
        };
      };

      // Set A (Using currently selected questions)
      const paperA = createPaperObject("Set A", selectedQuestions);

      // Set B (Generate new random set)
      const questionsB = selectRandomQuestions(paperForm, availableQuestions);
      const paperB = createPaperObject("Set B", questionsB);

      // Save both
      await addDoc(collection(db, "questionPapers"), paperA);
      const docRefB = await addDoc(collection(db, "questionPapers"), paperB);

      toast.success("Question papers (Set A & Set B) generated successfully!");

      // Reset form
      setPaperForm({
        title: "",
        subjectCode: "",
        semester: "",
        examDate: "",
        examTime: "09:30",
        duration: 3,
        oneMarkQuestions: 5,
        fourMarkQuestions: 5,
        sixMarkQuestions: 3,
        eightMarkQuestions: 0, // Prev: 2
        totalQuestions: 13, // Prev: 15
        totalMarks: 43, // 5*1 + 5*4 + 3*6 + 0*8 = 43 (Prev: 59)
        generationTime: "",
        generationDate: "",
        department: "",
        section: ""
      });
      setSelectedQuestions([]);
      setAvailableQuestions({
        oneMark: [],
        fourMark: [],
        sixMark: [],
        eightMark: []
      });
      setQuestionStats({
        oneMark: { total: 0, available: 0 },
        fourMark: { total: 0, available: 0 },
        sixMark: { total: 0, available: 0 },
        eightMark: { total: 0, available: 0 }
      });

      setActiveTab("papers");
      setGeneratedPaper({ ...paperB, id: docRefB.id });

    } catch (error) {
      console.error("Error generating paper:", error);
      toast.error("Error generating paper");
    } finally {
      setLoading(false);
    }
  };

  const handleSchedulePaper = async () => {
    if (!paperForm.title || !paperForm.subjectCode || !paperForm.generationDate || !paperForm.generationTime) {
      toast.error("Please fill all fields including generation date and time");
      return;
    }

    try {
      setLoading(true);

      const scheduledPaper = {
        title: paperForm.title,
        subjectCode: paperForm.subjectCode,
        subjectName: availableSubjects.find(s => s.code === paperForm.subjectCode)?.name || paperForm.subjectCode,
        examDate: paperForm.examDate,
        examTime: paperForm.examTime,
        duration: paperForm.duration,
        oneMarkQuestions: paperForm.oneMarkQuestions,
        fourMarkQuestions: paperForm.fourMarkQuestions,
        sixMarkQuestions: paperForm.sixMarkQuestions,
        eightMarkQuestions: paperForm.eightMarkQuestions,
        totalQuestions: paperForm.totalQuestions,
        totalMarks: paperForm.totalMarks,
        generationDate: paperForm.generationDate,
        generationTime: paperForm.generationTime,
        status: "scheduled",
        isAutoGenerated: true,
        visible: false,
        createdBy: userData.uid || "admin",
        createdAt: serverTimestamp(),
        department: paperForm.department || "",
        section: paperForm.section || ""
      };

      await addDoc(collection(db, "questionPapers"), scheduledPaper);

      toast.success("Paper generation scheduled successfully!");
      setActiveTab("scheduled");

    } catch (error) {
      console.error("Error scheduling paper:", error);
      toast.error("Error scheduling paper");
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteUnitQuestions = async (subjectCode, unitNumber) => {
    if (!window.confirm(`⚠️ PERMANENT ACTION\n\nAre you sure you want to delete ALL questions for Unit ${unitNumber} of subject ${subjectCode}?\n\nThis cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const matchingSubjects = allSubjects.filter(s => s.subjectCode === subjectCode);
      if (matchingSubjects.length === 0) {
        toast.error("Subject not found");
        return;
      }

      const unitKey = `unit${unitNumber}`;
      const batch = writeBatch(db);

      for (const subject of matchingSubjects) {
          const subjectRef = doc(db, "subjects", subject.id);
          const subjectDoc = await getDoc(subjectRef);
          
          if (!subjectDoc.exists()) continue;

        const subjectData = subjectDoc.data();
        let questionsInUnit = 0;
        const updateData = {};

        // 1. Check Legacy (unit1)
        if (subjectData[unitKey]) {
            questionsInUnit += (subjectData[unitKey].questions?.length || 0);
            updateData[unitKey] = deleteField();
        }

        // 2. Check Flattened (units.unit1)
        const flattenedKey = `units.${unitKey}`;
        if (subjectData[flattenedKey]) {
            questionsInUnit += (subjectData[flattenedKey].questions?.length || 0);
            updateData[flattenedKey] = deleteField();
        }

        // 3. Check Nested (units: { unit1: ... })
        if (subjectData.units && subjectData.units[unitKey]) {
            questionsInUnit += (subjectData.units[unitKey].questions?.length || 0);
            updateData[`units.${unitKey}`] = deleteField();
        }

        if (questionsInUnit > 0 || Object.keys(updateData).length > 0) {
            updateData.totalQuestions = Math.max(0, (subjectData.totalQuestions || 0) - questionsInUnit);
            batch.update(subjectRef, updateData);
        }
      }

      // 2. Clear from Uploads History
      const uploadsQuery = query(
        collection(db, "uploads"),
        where("subjectCode", "==", subjectCode)
      );
      const uploadSnaps = await getDocs(uploadsQuery);
      uploadSnaps.forEach((doc) => {
        const data = doc.data();
        // Check unit with loose equality/Number conversion to handle string vs number issues
        if (data.unit !== undefined && Number(data.unit) === Number(unitNumber)) {
          batch.delete(doc.ref);
        }
      });

      // 3. Clear from Activities feed
      const activityQuery = query(
        collection(db, "activities"),
        where("subjectCode", "==", subjectCode)
      );
      const activitySnaps = await getDocs(activityQuery);
      activitySnaps.forEach((doc) => {
        const data = doc.data();
        if (data.unit !== undefined && Number(data.unit) === Number(unitNumber)) {
          batch.delete(doc.ref);
        }
      });

      await batch.commit();

      toast.success(`Successfully deleted questions and history for Unit ${unitNumber} of ${subjectCode}`);
    } catch (error) {
      console.error("Error deleting questions:", error);
      toast.error("An error occurred while deleting questions");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("username");
      sessionStorage.removeItem("username");
      localStorage.removeItem("userInfo");
      sessionStorage.removeItem("userInfo");
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const formatDateTime = (date, time) => {
    if (!date || !time) return "Not scheduled";
    const dateObj = new Date(date);
    return `${dateObj.toLocaleDateString()} at ${time}`;
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0 bg-white/50 backdrop-blur-xl border-r border-white/20">
        <div className="h-full px-3 py-4 overflow-y-auto">
          <div className="flex items-center pl-2.5 mb-8 mt-2 animate-fade-in">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-blue-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <span className="self-center text-xl font-bold whitespace-nowrap ml-3 text-gray-800">
              Admin Portal
            </span>
          </div>

          <ul className="space-y-2 font-medium">
            {[
              { id: 'staff', icon: Users, label: 'Staff Management' },
              { id: 'subjects', icon: Book, label: 'Subject Management' },
              { id: 'question-bank', icon: Layers, label: 'Question Bank' },
              ...(userData?.role === 'dean' ? [
                { id: 'departments', icon: Building2, label: 'Dept Management' },
                { id: 'schedule', icon: Timer, label: 'Schedule Papers' },
                { id: 'generate', icon: FileText, label: 'Generate Papers' },
                { id: 'assign', icon: GraduationCap, label: 'HOD/Dean Assign' },
              ] : []),
              ...(userData?.role === 'dean' || userData?.role === 'hod' ? [
                { id: 'papers', icon: BookOpen, label: 'Generated Papers' },
              ] : []),
              { id: 'activities', icon: BarChart3, label: 'Staff Activities' },
              { id: 'settings', icon: Building, label: 'Settings' },
              // { id: 'backup', icon: DatabaseIcon, label: 'Backup & Restore' },
              ...(userData?.role === 'hod' || userData?.role === 'dean' ? [{ id: 'staff-view', icon: User, label: 'Switch to Staff Portal' }] : [])
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <li key={item.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <button
                    onClick={() => {
                      if (item.id === 'staff-view') {
                        setShowSwitchModal(true);
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    className={`relative flex items-center p-3 w-full rounded-xl transition-all duration-300 group overflow-hidden ${activeTab === item.id
                      ? "bg-gradient-to-r from-blue-600/10 to-indigo-600/10 text-blue-700 shadow-sm ring-1 ring-blue-100"
                      : "text-gray-600 hover:bg-gray-50/80 hover:text-gray-900"
                      }`}
                  >
                    {activeTab === item.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
                    )}
                    <Icon className={`w-5 h-5 transition-colors relative z-10 ${activeTab === item.id ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`} />
                    <span className="ml-3 relative z-10 font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="absolute bottom-0 left-0 w-full p-4 border-t border-white/20 bg-white/30 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-sm shadow-sm border border-white/50">
                {userData?.name?.substring(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userData?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {userData?.role}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full p-2 text-sm text-red-600 rounded-xl hover:bg-red-50/80 transition-all duration-200"
            >
              <LogOut className="flex-shrink-0 w-4 h-4" />
              <span className="ml-3">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="p-4 sm:ml-64">
        <PageContainer className="p-4 mt-2">
          {/* Header Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="glass-card rounded-2xl p-5 animate-scale-in" style={{ animationDelay: '0s' }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Staff</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{filteredStaffForRole.length}</h3>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600">
                  <User className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Subjects</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{filteredSubjectsForRole.length}</h3>
                </div>
                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-600">
                  <Book className="w-5 h-5" />
                </div>
              </div>
            </div>

            {userData?.role === 'dean' && (
              <div className="glass-card rounded-2xl p-5 animate-scale-in" style={{ animationDelay: '0.15s' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Departments</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{departments.length}</h3>
                  </div>
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-600">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
              </div>
            )}

            <div className="glass-card rounded-2xl p-5 animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Papers</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{filteredScheduledPapersForRole.length}</h3>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600">
                  <Timer className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Generated Papers</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{filteredPapersForRole.length}</h3>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-[600px] animate-slide-up">
            {activeTab === "staff" && (
              <StaffManagement
                staffList={filteredStaffForRole}
                availableSubjects={filteredAvailableSubjectsForRole}
                showAddStaff={showAddStaff}
                setShowAddStaff={setShowAddStaff}
                newStaff={newStaff}
                setNewStaff={setNewStaff}
                editingStaffId={editingStaffId}
                setEditingStaffId={setEditingStaffId}
                handleAddStaff={handleAddStaff}
                handleUpdateStaff={handleUpdateStaff}
                handleDeleteStaff={handleDeleteStaff}
                handleAssignSubject={handleAssignSubject}
                handleRemoveSubject={handleRemoveSubject}
                handleToggleStaffStatus={handleToggleStaffStatus}
                loading={loading}
                userData={userData}
                departments={departments}
              />
            )}

            {activeTab === "subjects" && (
              <SubjectManagement
                allSubjects={filteredSubjectsForRole}
                showAddSubject={showAddSubject}
                setShowAddSubject={setShowAddSubject}
                newSubject={newSubject}
                setNewSubject={setNewSubject}
                editingSubjectId={editingSubjectId}
                setEditingSubjectId={setEditingSubjectId}
                handleAddSubject={handleAddSubject}
                handleUpdateSubject={handleUpdateSubject}
                handleDeleteSubject={handleDeleteSubject}
                handleEditSubject={handleEditSubject}
                loading={loading}
                departments={departments}
              />
            )}

            {activeTab === "departments" && userData?.role === 'dean' && (
              <DepartmentManagement
                departments={departments}
                staffList={staffList}
                loading={loading}
                handleAddDepartment={handleAddDepartment}
                handleUpdateDepartment={handleUpdateDepartment}
                handleDeleteDepartment={handleDeleteDepartment}
                handleAssignStaffToDept={handleAssignStaffToDept}
                handleRemoveStaffFromDept={handleRemoveStaffFromDept}
              />
            )}

            {activeTab === "schedule" && userData?.role === 'dean' && (
              <ScheduledPapers
                scheduledPapers={filteredScheduledPapersForRole}
                setPaperForm={setPaperForm}
                availableSubjects={filteredAvailableSubjectsForRole}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === "generate" && userData?.role === 'dean' && (
              <PaperGeneration
                paperForm={paperForm}
                setPaperForm={setPaperForm}
                availableSubjects={filteredAvailableSubjectsForRole}
                questionStats={questionStats}
                setQuestionStats={setQuestionStats}
                selectedQuestions={selectedQuestions}
                setSelectedQuestions={setSelectedQuestions}
                availableQuestions={availableQuestions}
                setAvailableQuestions={setAvailableQuestions}
                loadQuestionsForSubject={loadQuestionsForSubject}
                generateRandomQuestions={generateRandomQuestions}
                clearAllQuestions={clearAllQuestions}
                loading={loading}
                handleGeneratePaper={handleGeneratePaper}
                handleSchedulePaper={handleSchedulePaper}
              />
            )}

            {activeTab === "papers" && (userData?.role === 'dean' || userData?.role === 'hod') && (
              <GeneratedPapers
                questionPapers={filteredPapersForRole}
                loading={loading}
                setActiveTab={setActiveTab}
                setGeneratedPaper={setGeneratedPaper}
                setShowPreview={setShowPreview}
                downloadPaperAsWord={downloadPaperAsWord}
                downloadPaperAsPDF={downloadPaperAsPDF}
                showPreview={showPreview}
                generatedPaper={generatedPaper}
                formatDateTime={formatDateTime}
                collegeDetails={collegeDetails}
                userData={userData}
              />
            )}

            {activeTab === "settings" && (
              <CollegeSettings
                onUpdate={setCollegeDetails}
                userData={userData}
              />
            )}

            {activeTab === "activities" && (
              <StaffActivities
                allSubjects={filteredSubjectsForRole}
                staffList={filteredStaffForRole}
              />
            )}

            {activeTab === "assign" && (
              <HodDeanAssignment
                hodDeanAssignment={hodDeanAssignment}
                setHodDeanAssignment={setHodDeanAssignment}
                showAssignHodDean={showAssignHodDean}
                setShowAssignHodDean={setShowAssignHodDean}
                handleAssignHodDean={handleAssignHodDean}
                handleRemoveRole={handleRemoveRole}
                currentUser={userData}
                loading={loading}
                staffList={staffList}
                departments={departments}
              />
            )}

            {activeTab === "question-bank" && (
              <QuestionBank
                allSubjects={allSubjects}
                userData={userData}
                onDeleteUnit={handleDeleteUnitQuestions}
              />
            )}

            {activeTab === "backup" && (
              <BackupRestore />
            )}
          </div>
        </PageContainer>
      </div>

      <ConfirmationModal
        isOpen={showSwitchModal}
        onClose={() => setShowSwitchModal(false)}
        onConfirm={() => navigate("/staff-portal")}
        title="Switch to Staff Portal"
        message="You are about to switch to the Staff Portal. All unsaved changes in the Admin Dashboard might be lost. Do you want to continue?"
        confirmText="Switch Portal"
        type="info"
      />
    </div>
  );
}
