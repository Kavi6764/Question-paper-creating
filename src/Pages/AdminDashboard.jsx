import { useState, useEffect } from "react";
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
  GraduationCap
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
  addDoc
} from "firebase/firestore";
import { db, auth } from "../../fireBaseConfig";
import {
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "firebase/auth";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PageContainer from "../components/PageContainer";

// Import Sub-Components
import StaffManagement from "./Admin/StaffManagement";
import SubjectManagement from "./Admin/SubjectManagement";
import PaperGeneration from "./Admin/PaperGeneration";
import ScheduledPapers from "./Admin/ScheduledPapers";
import GeneratedPapers from "./Admin/GeneratedPapers";
import HodDeanAssignment from "./Admin/HodDeanAssignment";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("staff");
  const [loading, setLoading] = useState(false);

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
    examDate: "",
    examTime: "09:30",
    duration: 3,
    twoMarkQuestions: 5,
    fourMarkQuestions: 5,
    sixMarkQuestions: 3,
    eightMarkQuestions: 2,
    totalQuestions: 15,
    totalMarks: 64,
    generationTime: "",
    generationDate: ""
  });

  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState({
    twoMark: [],
    fourMark: [],
    sixMark: [],
    eightMark: []
  });
  const [generatedPaper, setGeneratedPaper] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [scheduledPapers, setScheduledPapers] = useState([]);

  // Stats for available questions
  const [questionStats, setQuestionStats] = useState({
    twoMark: { total: 0, available: 0 },
    fourMark: { total: 0, available: 0 },
    sixMark: { total: 0, available: 0 },
    eightMark: { total: 0, available: 0 }
  });


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
              role: userData.role
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
      });

      // Load all subjects
      const subjectsQuery = query(collection(db, "subjects"));
      const unsubscribeSubjects = onSnapshot(subjectsQuery, (snapshot) => {
        const subjects = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllSubjects(subjects);

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

        const scheduled = papers.filter(paper => paper.status === "scheduled");
        setScheduledPapers(scheduled);

        checkScheduledPapers(scheduled);
      });

      return () => {
        unsubscribeStaff();
        unsubscribeSubjects();
        unsubscribePapers();
      };
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Error loading data");
    }
  };

  // Calculate total questions and marks
  useEffect(() => {
    const totalQuestions = paperForm.twoMarkQuestions + paperForm.fourMarkQuestions + paperForm.sixMarkQuestions + paperForm.eightMarkQuestions;
    const totalMarks = (paperForm.twoMarkQuestions * 2) + (paperForm.fourMarkQuestions * 4) + (paperForm.sixMarkQuestions * 6) + (paperForm.eightMarkQuestions * 8);

    setPaperForm(prev => ({
      ...prev,
      totalQuestions,
      totalMarks
    }));
  }, [paperForm.twoMarkQuestions, paperForm.fourMarkQuestions, paperForm.sixMarkQuestions, paperForm.eightMarkQuestions]);

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
        twoMark: [],
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
                  dbId: doc.id
                };

                const marks = parseInt(q.marks) || 0;
                if (marks === 2) questions.twoMark.push(question);
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
      return { twoMark: [], fourMark: [], sixMark: [], eightMark: [] };
    }
  };

  const autoGeneratePaper = async (scheduledPaper) => {
    try {
      const requirements = {
        twoMarkQuestions: scheduledPaper.twoMarkQuestions || 0,
        fourMarkQuestions: scheduledPaper.fourMarkQuestions || 0,
        sixMarkQuestions: scheduledPaper.sixMarkQuestions || 0,
        eightMarkQuestions: scheduledPaper.eightMarkQuestions || 0
      };

      // 1. Fetch ALL available questions first
      const questionPool = await getQuestionPoolForAutoGeneration(scheduledPaper.subjectCode);

      if (questionPool.twoMark.length === 0 && questionPool.fourMark.length === 0 && questionPool.sixMark.length === 0 && questionPool.eightMark.length === 0) {
        console.error(`No questions found for subject ${scheduledPaper.subjectCode}`);
        return;
      }

      // 2. Helper to generate a single paper update/creation
      const createPaperData = (questions) => {
        const questionsByMarks = {
          twoMark: questions.filter(q => q.marks === 2),
          fourMark: questions.filter(q => q.marks === 4),
          sixMark: questions.filter(q => q.marks === 6),
          eightMark: questions.filter(q => q.marks === 8)
        };
        const totalMarks = questions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0);

        return {
          status: "generated",
          questions: questions,
          totalMarks: totalMarks,
          marksDistribution: {
            twoMark: { count: questionsByMarks.twoMark.length, totalMarks: questionsByMarks.twoMark.reduce((sum, q) => sum + (q.marks || 0), 0) },
            fourMark: { count: questionsByMarks.fourMark.length, totalMarks: questionsByMarks.fourMark.reduce((sum, q) => sum + (q.marks || 0), 0) },
            sixMark: { count: questionsByMarks.sixMark.length, totalMarks: questionsByMarks.sixMark.reduce((sum, q) => sum + (q.marks || 0), 0) },
            eightMark: { count: questionsByMarks.eightMark.length, totalMarks: questionsByMarks.eightMark.reduce((sum, q) => sum + (q.marks || 0), 0) }
          },
          generatedAt: serverTimestamp(),
          visible: true
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

      const usernameQuery = query(collection(db, "users"), where("username", "==", newStaff.username));
      const usernameSnap = await getDocs(usernameQuery);
      if (!usernameSnap.empty) {
        toast.error("Username already taken");
        setLoading(false);
        return;
      }

      const tempPassword = "Password@123";
      const userCredential = await createUserWithEmailAndPassword(auth, newStaff.email, tempPassword);
      await sendEmailVerification(userCredential.user);

      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: newStaff.email,
        fullName: newStaff.fullName,
        username: newStaff.username,
        department: newStaff.department || "General",
        role: "staff",
        status: "active",
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
        username: newStaff.username,
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

      const q = query(collection(db, "users"), where("username", "==", hodDeanAssignment.username));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast.error("User not found!");
        setLoading(false);
        return;
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      const userRef = doc(db, "users", userDoc.id);
      await updateDoc(userRef, {
        role: hodDeanAssignment.role,
        department: hodDeanAssignment.department,
        updatedAt: serverTimestamp()
      });

      toast.success(`Assigned ${hodDeanAssignment.role.toUpperCase()} role to ${userData.fullName}`);
      setShowAssignHodDean(false);
      setHodDeanAssignment({ username: "", role: "hod", department: "" });

    } catch (error) {
      console.error("Error assigning role:", error);
      toast.error("Error assigning role");
    } finally {
      setLoading(false);
    }
  };

  // PAPER GENERATION LOGIC
  const prepareQuestionStats = (questions) => {
    const stats = {
      twoMark: { total: questions.twoMark.length, available: questions.twoMark.length },
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
        twoMark: [],
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
                  dbId: doc.id
                };

                const marks = parseInt(q.marks) || 0;
                if (marks === 2) questions.twoMark.push(question);
                else if (marks === 4) questions.fourMark.push(question);
                else if (marks === 6) questions.sixMark.push(question);
                else if (marks === 8) questions.eightMark.push(question);
              });
            }
          });
        }
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

  const generateRandomQuestions = () => {
    const selected = [];
    let hasError = false;

    // 2-mark questions
    if (availableQuestions.twoMark.length < paperForm.twoMarkQuestions) {
      toast.error(`Not enough 2-mark questions! Need ${paperForm.twoMarkQuestions}, have ${availableQuestions.twoMark.length}`);
      hasError = true;
    } else {
      const shuffled = [...availableQuestions.twoMark].sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, paperForm.twoMarkQuestions));
    }

    // 4-mark questions
    if (availableQuestions.fourMark.length < paperForm.fourMarkQuestions) {
      toast.error(`Not enough 4-mark questions! Need ${paperForm.fourMarkQuestions}, have ${availableQuestions.fourMark.length}`);
      hasError = true;
    } else {
      const shuffled = [...availableQuestions.fourMark].sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, paperForm.fourMarkQuestions));
    }

    // 6-mark questions
    if (availableQuestions.sixMark.length < paperForm.sixMarkQuestions) {
      toast.error(`Not enough 6-mark questions! Need ${paperForm.sixMarkQuestions}, have ${availableQuestions.sixMark.length}`);
      hasError = true;
    } else {
      const shuffled = [...availableQuestions.sixMark].sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, paperForm.sixMarkQuestions));
    }

    // 8-mark questions
    if (availableQuestions.eightMark.length < paperForm.eightMarkQuestions) {
      toast.error(`Not enough 8-mark questions! Need ${paperForm.eightMarkQuestions}, have ${availableQuestions.eightMark.length}`);
      hasError = true;
    } else {
      const shuffled = [...availableQuestions.eightMark].sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, paperForm.eightMarkQuestions));
    }

    if (hasError) {
      return;
    }

    setSelectedQuestions(selected);
    toast.success("Questions selected for paper!");
  };

  const clearAllQuestions = () => {
    setSelectedQuestions([]);
    toast.success("All selected questions cleared");
  };

  const selectRandomQuestions = (requirements, sourceQuestions) => {
    const selected = [];

    // 2-mark
    if (sourceQuestions.twoMark && sourceQuestions.twoMark.length >= requirements.twoMarkQuestions) {
      const shuffled = [...sourceQuestions.twoMark].sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, requirements.twoMarkQuestions));
    }

    // 4-mark
    if (sourceQuestions.fourMark && sourceQuestions.fourMark.length >= requirements.fourMarkQuestions) {
      const shuffled = [...sourceQuestions.fourMark].sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, requirements.fourMarkQuestions));
    }

    // 6-mark
    if (sourceQuestions.sixMark && sourceQuestions.sixMark.length >= requirements.sixMarkQuestions) {
      const shuffled = [...sourceQuestions.sixMark].sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, requirements.sixMarkQuestions));
    }

    // 8-mark
    if (sourceQuestions.eightMark && sourceQuestions.eightMark.length >= requirements.eightMarkQuestions) {
      const shuffled = [...sourceQuestions.eightMark].sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, requirements.eightMarkQuestions));
    }

    return selected;
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
        const twoMarkCount = questions.filter(q => q.marks === 2).length;
        const fourMarkCount = questions.filter(q => q.marks === 4).length;
        const sixMarkCount = questions.filter(q => q.marks === 6).length;
        const eightMarkCount = questions.filter(q => q.marks === 8).length;

        return {
          title: `${paperForm.title} - ${titleSuffix}`,
          subjectCode: paperForm.subjectCode,
          subjectName: availableSubjects.find(s => s.code === paperForm.subjectCode)?.name || paperForm.subjectCode,
          examDate: paperForm.examDate,
          examTime: paperForm.examTime,
          duration: paperForm.duration,
          totalQuestions: questions.length,
          totalMarks: questions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0),
          questions: questions,
          status: "generated",
          isAutoGenerated: false,
          visible: true,
          createdBy: userData.uid || "admin",
          createdAt: serverTimestamp(),
          generatedAt: serverTimestamp(),
          unitsCovered: Array.from(new Set(questions.map(q => q.unit))).sort(),
          marksDistribution: {
            twoMark: { count: twoMarkCount, totalMarks: twoMarkCount * 2 },
            fourMark: { count: fourMarkCount, totalMarks: fourMarkCount * 4 },
            sixMark: { count: sixMarkCount, totalMarks: sixMarkCount * 6 },
            eightMark: { count: eightMarkCount, totalMarks: eightMarkCount * 8 }
          }
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
        examDate: "",
        examTime: "09:30",
        duration: 3,
        twoMarkQuestions: 5,
        fourMarkQuestions: 5,
        sixMarkQuestions: 3,
        eightMarkQuestions: 2,
        totalQuestions: 15,
        totalMarks: 64,
        generationTime: "",
        generationDate: ""
      });
      setSelectedQuestions([]);
      setAvailableQuestions({
        twoMark: [],
        fourMark: [],
        sixMark: [],
        eightMark: []
      });
      setQuestionStats({
        twoMark: { total: 0, available: 0 },
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
        twoMarkQuestions: paperForm.twoMarkQuestions,
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
        createdAt: serverTimestamp()
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

  const previewPaper = (paper) => {
    if (!paper) return;

    // Use jsPDF for PDF generation/printing
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text(paper.title, 105, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.text(`${paper.subjectCode} - ${paper.subjectName}`, 105, 30, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Date: ${paper.examDate || 'N/A'}`, 20, 40);
    doc.text(`Time: ${paper.examTime || 'N/A'}`, 80, 40);
    doc.text(`Duration: ${paper.duration || 3} Hours`, 140, 40);
    doc.text(`Marks: ${paper.totalMarks}`, 180, 40);

    doc.line(20, 45, 190, 45);

    doc.setFontSize(11);
    doc.text('Instructions:', 20, 55);
    doc.setFontSize(10);
    doc.text('1. Answer all questions.', 20, 60);
    doc.text('2. Each question carries marks as indicated.', 20, 65);

    let yPos = 80;

    const sortedQuestions = [...paper.questions].sort((a, b) => a.marks - b.marks);
    let currentMark = null;
    let groupIndex = 0;

    sortedQuestions.forEach((q, i) => {
      // Check for new group
      if (q.marks !== currentMark) {
        currentMark = q.marks;
        const groupLabel = String.fromCharCode(65 + groupIndex); // A, B, C...

        // Calculate count and total for this group
        const groupCount = sortedQuestions.filter(sq => sq.marks === q.marks).length;
        const groupTotal = groupCount * q.marks;

        // Add Group Header
        yPos += 5;
        if (yPos > 270) { doc.addPage(); yPos = 20; }

        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Group-${groupLabel}`, 20, yPos);
        doc.text(`[ ${q.marks} x ${groupCount} = ${groupTotal} ]`, 190, yPos, { align: 'right' });
        yPos += 8;

        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text("Answer the Following Questions", 20, yPos);
        yPos += 10;

        groupIndex++;
      }

      // Calculate total height needed for this question block
      const questionLines = doc.splitTextToSize(q.question || '', 150);
      const textHeight = questionLines.length * 7;
      const optionsHeight = (q.options?.length || 0) * 7;
      const totalQuestionHeight = textHeight + optionsHeight + 15; // +15 for padding/spacing

      // Check if the whole question block fits, otherwise add page
      if (yPos + totalQuestionHeight > 280) {
        doc.addPage();
        yPos = 20; // Reset to top margin
      }

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(`Q${i + 1}.`, 20, yPos);

      doc.setFont(undefined, 'normal');
      doc.text(questionLines, 35, yPos);

      doc.setFontSize(10);
      // Align marks to the right - REMOVED per user request
      // doc.text(`[${q.marks}]`, 180, yPos, { align: 'right' });

      yPos += textHeight + 5;

      if (q.options && q.options.length > 0) {
        doc.setFontSize(10);
        q.options.forEach((opt, optIdx) => {
          // Double check if option fits (though usually handled by block check above, safe to keep as fallback)
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`${String.fromCharCode(65 + optIdx)}) ${opt}`, 40, yPos);
          yPos += 7;
        });
      }

      yPos += 5; // Spacing between questions
    });

    doc.save(`${paper.title.replace(/\s+/g, '_')}.pdf`);
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
              { id: 'schedule', icon: Timer, label: 'Schedule Papers' },
              { id: 'generate', icon: FileText, label: 'Generate Papers' },
              { id: 'papers', icon: BookOpen, label: 'Generated Papers' },
              { id: 'assign', icon: GraduationCap, label: 'HOD/Dean Assign' }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <li key={item.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                  <button
                    onClick={() => setActiveTab(item.id)}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="glass-card rounded-2xl p-5 animate-scale-in" style={{ animationDelay: '0s' }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Staff</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{staffList.length}</h3>
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
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{allSubjects.length}</h3>
                </div>
                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-600">
                  <Book className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Papers</p>
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{scheduledPapers.length}</h3>
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
                  <h3 className="text-2xl font-bold text-gray-900 mt-1">{questionPapers.length}</h3>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden min-h-[600px] animate-slide-up p-1">
            {activeTab === "staff" && (
              <StaffManagement
                staffList={staffList}
                availableSubjects={availableSubjects}
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
              />
            )}

            {activeTab === "subjects" && (
              <SubjectManagement
                allSubjects={allSubjects}
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
              />
            )}

            {activeTab === "schedule" && (
              <ScheduledPapers
                scheduledPapers={scheduledPapers}
                setPaperForm={setPaperForm}
                availableSubjects={availableSubjects}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === "generate" && (
              <PaperGeneration
                paperForm={paperForm}
                setPaperForm={setPaperForm}
                availableSubjects={availableSubjects}
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

            {activeTab === "papers" && (
              <GeneratedPapers
                questionPapers={questionPapers}
                loading={loading}
                setActiveTab={setActiveTab}
                setGeneratedPaper={setGeneratedPaper}
                setShowPreview={setShowPreview}
                previewPaper={previewPaper}
                showPreview={showPreview}
                generatedPaper={generatedPaper}
                formatDateTime={formatDateTime}
              />
            )}

            {activeTab === "assign" && (
              <HodDeanAssignment
                hodDeanAssignment={hodDeanAssignment}
                setHodDeanAssignment={setHodDeanAssignment}
                showAssignHodDean={showAssignHodDean}
                setShowAssignHodDean={setShowAssignHodDean}
                handleAssignHodDean={handleAssignHodDean}
                loading={loading}
                staffList={staffList}
              />
            )}
          </div>
        </PageContainer>
      </div>
    </div>
  );
}
