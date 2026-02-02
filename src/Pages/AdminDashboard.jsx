import { useState, useEffect } from "react";
import {
  User,
  Shield,
  LogOut,
  Book,
  FileText,
  Timer,
  BookOpen,
  Award
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
    oneMarkQuestions: 10,
    threeMarkQuestions: 5,
    fiveMarkQuestions: 5,
    totalQuestions: 20,
    totalMarks: 50,
    generationTime: "",
    generationDate: ""
  });

  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState({
    oneMark: [],
    threeMark: [],
    fiveMark: []
  });
  const [generatedPaper, setGeneratedPaper] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [scheduledPapers, setScheduledPapers] = useState([]);

  // Stats for available questions
  const [questionStats, setQuestionStats] = useState({
    oneMark: { total: 0, available: 0 },
    threeMark: { total: 0, available: 0 },
    fiveMark: { total: 0, available: 0 }
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
          user.role === "staff" ||
          user.role === "hod" ||
          user.role === "dean" ||
          user.username === "hod" ||
          user.username === "dean" ||
          user.username === "admin"
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
    const totalQuestions = paperForm.oneMarkQuestions + paperForm.threeMarkQuestions + paperForm.fiveMarkQuestions;
    const totalMarks = (paperForm.oneMarkQuestions * 1) + (paperForm.threeMarkQuestions * 3) + (paperForm.fiveMarkQuestions * 5);

    setPaperForm(prev => ({
      ...prev,
      totalQuestions,
      totalMarks
    }));
  }, [paperForm.oneMarkQuestions, paperForm.threeMarkQuestions, paperForm.fiveMarkQuestions]);

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

  const autoGeneratePaper = async (scheduledPaper) => {
    try {
      const requirements = {
        oneMarkQuestions: scheduledPaper.oneMarkQuestions || 10,
        threeMarkQuestions: scheduledPaper.threeMarkQuestions || 5,
        fiveMarkQuestions: scheduledPaper.fiveMarkQuestions || 5
      };

      const questions = await loadQuestionsForAutoGeneration(scheduledPaper.subjectCode, requirements);

      if (questions.length === 0) {
        console.error(`No questions found for subject ${scheduledPaper.subjectCode}`);
        return;
      }

      const questionsByMarks = {
        oneMark: questions.filter(q => q.marks === 1),
        threeMark: questions.filter(q => q.marks === 3),
        fiveMark: questions.filter(q => q.marks === 5)
      };

      const totalMarks = questions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0);

      const paperRef = doc(db, "questionPapers", scheduledPaper.id);
      await updateDoc(paperRef, {
        status: "generated",
        questions: questions,
        totalMarks: totalMarks,
        marksDistribution: {
          oneMark: { count: questionsByMarks.oneMark.length, totalMarks: questionsByMarks.oneMark.reduce((sum, q) => sum + (q.marks || 0), 0) },
          threeMark: { count: questionsByMarks.threeMark.length, totalMarks: questionsByMarks.threeMark.reduce((sum, q) => sum + (q.marks || 0), 0) },
          fiveMark: { count: questionsByMarks.fiveMark.length, totalMarks: questionsByMarks.fiveMark.reduce((sum, q) => sum + (q.marks || 0), 0) }
        },
        generatedAt: serverTimestamp(),
        visible: true
      });

      console.log(`Auto-generated paper: ${scheduledPaper.title}`);
      toast.success(`Auto-generated paper: ${scheduledPaper.title}`);

    } catch (error) {
      console.error("Error auto-generating paper:", error);
    }
  };

  const loadQuestionsForAutoGeneration = async (subjectCode, requirements) => {
    try {
      const questions = {
        oneMark: [],
        threeMark: [],
        fiveMark: []
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

                if (q.marks === 1) {
                  questions.oneMark.push(question);
                } else if (q.marks === 3) {
                  questions.threeMark.push(question);
                } else if (q.marks === 5) {
                  questions.fiveMark.push(question);
                } else {
                  questions.oneMark.push({ ...question, marks: 1 });
                }
              });
            }
          });
        }
      });

      const selectedQuestions = [];
      const shuffledOneMark = [...questions.oneMark].sort(() => Math.random() - 0.5);
      selectedQuestions.push(...shuffledOneMark.slice(0, requirements.oneMarkQuestions || 0));

      const shuffledThreeMark = [...questions.threeMark].sort(() => Math.random() - 0.5);
      selectedQuestions.push(...shuffledThreeMark.slice(0, requirements.threeMarkQuestions || 0));

      const shuffledFiveMark = [...questions.fiveMark].sort(() => Math.random() - 0.5);
      selectedQuestions.push(...shuffledFiveMark.slice(0, requirements.fiveMarkQuestions || 0));

      return selectedQuestions;
    } catch (error) {
      console.error("Error loading questions:", error);
      return [];
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
      const emailQuery = query(collection(db, "users"), where("email", "==", newStaff.email));
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty) {
        toast.error("Email already registered");
        setLoading(false);
        return;
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
        toast.error("Email already registered");
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
    if (window.confirm(`Are you sure you want to delete staff with email ${email}?`)) {
      try {
        await deleteDoc(doc(db, "users", staffId));
        toast.success("Staff deleted successfully");
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
      oneMark: { total: questions.oneMark.length, available: questions.oneMark.length },
      threeMark: { total: questions.threeMark.length, available: questions.threeMark.length },
      fiveMark: { total: questions.fiveMark.length, available: questions.fiveMark.length }
    };
    setQuestionStats(stats);
  };

  const loadQuestionsForSubject = async (subjectCode) => {
    try {
      setLoading(true);
      const questions = {
        oneMark: [],
        threeMark: [],
        fiveMark: []
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

                if (q.marks === 1) {
                  questions.oneMark.push(question);
                } else if (q.marks === 3) {
                  questions.threeMark.push(question);
                } else if (q.marks === 5) {
                  questions.fiveMark.push(question);
                } else {
                  questions.oneMark.push({ ...question, marks: 1 });
                }
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

    // 1-mark questions
    if (availableQuestions.oneMark.length < paperForm.oneMarkQuestions) {
      toast.error(`Not enough 1-mark questions! Need ${paperForm.oneMarkQuestions}, have ${availableQuestions.oneMark.length}`);
      hasError = true;
    } else {
      const shuffled = [...availableQuestions.oneMark].sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, paperForm.oneMarkQuestions));
    }

    // 3-mark questions
    if (availableQuestions.threeMark.length < paperForm.threeMarkQuestions) {
      toast.error(`Not enough 3-mark questions! Need ${paperForm.threeMarkQuestions}, have ${availableQuestions.threeMark.length}`);
      hasError = true;
    } else {
      const shuffled = [...availableQuestions.threeMark].sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, paperForm.threeMarkQuestions));
    }

    // 5-mark questions
    if (availableQuestions.fiveMark.length < paperForm.fiveMarkQuestions) {
      toast.error(`Not enough 5-mark questions! Need ${paperForm.fiveMarkQuestions}, have ${availableQuestions.fiveMark.length}`);
      hasError = true;
    } else {
      const shuffled = [...availableQuestions.fiveMark].sort(() => Math.random() - 0.5);
      selected.push(...shuffled.slice(0, paperForm.fiveMarkQuestions));
    }

    if (hasError) {
      return;
    }

    setSelectedQuestions(selected);
    toast.success("Questions selected for paper!");
  };

  const generatePaperImmediately = async () => {
    if (!paperForm.title || !paperForm.subjectCode || selectedQuestions.length === 0) {
      toast.error("Please fill all fields and select questions");
      return;
    }

    try {
      setLoading(true);

      // Calculate mark distribution
      const oneMarkCount = selectedQuestions.filter(q => q.marks === 1).length;
      const threeMarkCount = selectedQuestions.filter(q => q.marks === 3).length;
      const fiveMarkCount = selectedQuestions.filter(q => q.marks === 5).length;

      const newPaper = {
        title: paperForm.title,
        subjectCode: paperForm.subjectCode,
        subjectName: availableSubjects.find(s => s.code === paperForm.subjectCode)?.name || paperForm.subjectCode,
        examDate: paperForm.examDate,
        examTime: paperForm.examTime,
        duration: paperForm.duration,
        totalQuestions: selectedQuestions.length,
        totalMarks: selectedQuestions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0),
        questions: selectedQuestions,
        status: "generated",
        isAutoGenerated: false,
        visible: true,
        createdBy: userData.uid || "admin",
        createdAt: serverTimestamp(),
        generatedAt: serverTimestamp(),
        unitsCovered: Array.from(new Set(selectedQuestions.map(q => q.unit))).sort(),
        marksDistribution: {
          oneMark: { count: oneMarkCount, totalMarks: oneMarkCount * 1 },
          threeMark: { count: threeMarkCount, totalMarks: threeMarkCount * 3 },
          fiveMark: { count: fiveMarkCount, totalMarks: fiveMarkCount * 5 }
        }
      };

      const docRef = await addDoc(collection(db, "questionPapers"), newPaper);

      toast.success("Question paper generated successfully!");
      setActiveTab("papers");
      setGeneratedPaper({ ...newPaper, id: docRef.id });

    } catch (error) {
      console.error("Error generating paper:", error);
      toast.error("Error generating paper");
    } finally {
      setLoading(false);
    }
  };

  const schedulePaperGeneration = async () => {
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
        threeMarkQuestions: paperForm.threeMarkQuestions,
        fiveMarkQuestions: paperForm.fiveMarkQuestions,
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

    paper.questions.forEach((q, i) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(`Q${i + 1}.`, 20, yPos);

      doc.setFont(undefined, 'normal');
      const questionLines = doc.splitTextToSize(q.question, 150);
      doc.text(questionLines, 35, yPos);

      const textHeight = questionLines.length * 7;

      doc.setFontSize(10);
      doc.text(`[${q.marks} Marks]`, 170, yPos);

      yPos += textHeight + 5;

      if (q.options && q.options.length > 0) {
        q.options.forEach((opt, optIdx) => {
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`${String.fromCharCode(65 + optIdx)}. ${opt}`, 40, yPos);
          yPos += 7;
        });
      }

      yPos += 5;
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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Admin Dashboard</span>
              <div className="hidden md:ml-8 md:flex md:space-x-8">
                <button onClick={() => setActiveTab("staff")} className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${activeTab === "staff" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                  <User className="w-4 h-4 mr-2" /> Staff
                </button>
                <button onClick={() => setActiveTab("subjects")} className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${activeTab === "subjects" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                  <Book className="w-4 h-4 mr-2" /> Subjects
                </button>
                <button onClick={() => setActiveTab("generate")} className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${activeTab === "generate" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                  <FileText className="w-4 h-4 mr-2" /> Generate Paper
                </button>
                <button onClick={() => setActiveTab("scheduled")} className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${activeTab === "scheduled" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                  <Timer className="w-4 h-4 mr-2" /> Scheduled
                </button>
                <button onClick={() => setActiveTab("papers")} className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${activeTab === "papers" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                  <BookOpen className="w-4 h-4 mr-2" /> Papers
                </button>
                <button onClick={() => setActiveTab("hod-dean")} className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${activeTab === "hod-dean" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
                  <Award className="w-4 h-4 mr-2" /> HOD/Dean
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-700">{userData.name}</p>
                  <p className="text-xs text-gray-500">{userData.role.toUpperCase()}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-gray-500">
                <LogOut className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "staff" && (
          <StaffManagement
            staffList={staffList}
            availableSubjects={availableSubjects}
            userData={userData}
            showAddStaff={showAddStaff}
            setShowAddStaff={setShowAddStaff}
            newStaff={newStaff}
            setNewStaff={setNewStaff}
            editingStaffId={editingStaffId}
            setEditingStaffId={setEditingStaffId}
            loading={loading}
            handleAddStaff={handleAddStaff}
            handleUpdateStaff={handleUpdateStaff}
            handleDeleteStaff={handleDeleteStaff}
            handleToggleStaffStatus={handleToggleStaffStatus}
            handleAssignSubject={handleAssignSubject}
            handleRemoveSubject={handleRemoveSubject}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === "subjects" && (
          <SubjectManagement
            allSubjects={allSubjects}
            showAddSubject={showAddSubject}
            setShowAddSubject={setShowAddSubject}
            editingSubjectId={editingSubjectId}
            setEditingSubjectId={setEditingSubjectId}
            newSubject={newSubject}
            setNewSubject={setNewSubject}
            loading={loading}
            handleAddSubject={handleAddSubject}
            handleUpdateSubject={handleUpdateSubject}
            handleEditSubject={handleEditSubject}
            handleDeleteSubject={handleDeleteSubject}
          />
        )}

        {activeTab === "generate" && (
          <PaperGeneration
            paperForm={paperForm}
            setPaperForm={setPaperForm}
            selectedQuestions={selectedQuestions}
            setSelectedQuestions={setSelectedQuestions}
            availableQuestions={availableQuestions}
            setAvailableQuestions={setAvailableQuestions}
            questionStats={questionStats}
            setQuestionStats={setQuestionStats}
            availableSubjects={availableSubjects}
            loadQuestionsForSubject={loadQuestionsForSubject}
            generateRandomQuestions={generateRandomQuestions}
            schedulePaperGeneration={schedulePaperGeneration}
            generatePaperImmediately={generatePaperImmediately}
            clearAllQuestions={() => setSelectedQuestions([])}
            loading={loading}
          />
        )}

        {activeTab === "scheduled" && (
          <ScheduledPapers
            scheduledPapers={scheduledPapers}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === "papers" && (
          <GeneratedPapers
            questionPapers={questionPapers}
            setActiveTab={setActiveTab}
            setGeneratedPaper={setGeneratedPaper}
            setShowPreview={setShowPreview}
            previewPaper={previewPaper}
            showPreview={showPreview}
            generatedPaper={generatedPaper}
            formatDateTime={formatDateTime}
          />
        )}

        {activeTab === "hod-dean" && (
          <HodDeanAssignment
            showAssignHodDean={showAssignHodDean}
            setShowAssignHodDean={setShowAssignHodDean}
            hodDeanAssignment={hodDeanAssignment}
            setHodDeanAssignment={setHodDeanAssignment}
            loading={loading}
            handleAssignHodDean={handleAssignHodDean}
            staffList={staffList}
          />
        )}
      </div>
    </div>
  );
}