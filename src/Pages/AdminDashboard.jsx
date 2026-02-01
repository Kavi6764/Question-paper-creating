import { useState, useEffect } from "react";
import {
  UserPlus,
  BookOpen,
  FileText,
  LogOut,
  User,
  Shield,
  Plus,
  X,
  Lock,
  Unlock,
  Calendar,
  Clock,
  Printer,
  Eye,
  RefreshCw,
  Hash,
  Book,
  Shuffle,
  Trash2,
  Edit,
  AlertCircle,
  Timer,
  FolderPlus,
  Layers,
  GraduationCap,
  Award,
  CheckCircle,
  FileCode,
  Users,
  List,
  Calculator,
  Filter,
  EyeOff
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  Timestamp,
  deleteDoc,
  arrayRemove
} from "firebase/firestore";
import { db, auth } from "../../fireBaseConfig";
import { 
  onAuthStateChanged, 
  signOut, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  deleteUser
} from "firebase/auth";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("staff");
  const [loading, setLoading] = useState(false);

  // Staff Management
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

  // Subject Management
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

  // HOD/Dean Assignment
  const [showAssignHodDean, setShowAssignHodDean] = useState(false);
  const [hodDeanAssignment, setHodDeanAssignment] = useState({
    username: "",
    role: "hod", // "hod" or "dean"
    department: ""
  });

  // Question Paper Generation
  const [questionPapers, setQuestionPapers] = useState([]);
  const [paperForm, setPaperForm] = useState({
    title: "",
    subjectCode: "",
    examDate: "",
    examTime: "09:30",
    duration: 3,
    // Total questions is now calculated from individual mark categories
    oneMarkQuestions: 10,    // Default: 10 questions of 1 mark each
    threeMarkQuestions: 5,   // Default: 5 questions of 3 marks each
    fiveMarkQuestions: 5,    // Default: 5 questions of 5 marks each
    totalQuestions: 20,      // Calculated: 10 + 5 + 5 = 20
    totalMarks: 50,          // Calculated: (10*1) + (5*3) + (5*5) = 50
    generationTime: "",
    generationDate: ""
  });
  
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [availableQuestions, setAvailableQuestions] = useState({
    oneMark: [],    // 1-mark questions
    threeMark: [],  // 3-mark questions
    fiveMark: []    // 5-mark questions
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

  // Calculate total questions and marks based on mark categories
  useEffect(() => {
    const totalQuestions = paperForm.oneMarkQuestions + paperForm.threeMarkQuestions + paperForm.fiveMarkQuestions;
    const totalMarks = (paperForm.oneMarkQuestions * 1) + (paperForm.threeMarkQuestions * 3) + (paperForm.fiveMarkQuestions * 5);
    
    setPaperForm(prev => ({
      ...prev,
      totalQuestions,
      totalMarks
    }));
  }, [paperForm.oneMarkQuestions, paperForm.threeMarkQuestions, paperForm.fiveMarkQuestions]);

  // Check scheduled papers and auto-generate if time has come
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

      // Categorize questions by marks for statistics
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
                  questions.oneMark.push({...question, marks: 1});
                }
              });
            }
          });
        }
      });

      // Randomly select questions based on requirements
      const selectedQuestions = [];
      
      // Shuffle and select 1-mark questions
      const shuffledOneMark = [...questions.oneMark].sort(() => Math.random() - 0.5);
      selectedQuestions.push(...shuffledOneMark.slice(0, requirements.oneMarkQuestions || 0));
      
      // Shuffle and select 3-mark questions
      const shuffledThreeMark = [...questions.threeMark].sort(() => Math.random() - 0.5);
      selectedQuestions.push(...shuffledThreeMark.slice(0, requirements.threeMarkQuestions || 0));
      
      // Shuffle and select 5-mark questions
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
      } else if (error.code === 'auth/weak-password') {
        toast.error("Password is too weak");
      } else if (error.code === 'auth/operation-not-allowed') {
        toast.error("Email/password accounts are not enabled.");
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
    } catch (error) {
      console.error("Error updating staff:", error);
      toast.error("Error updating staff");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId, staffEmail) => {
    if (!window.confirm("Are you sure you want to delete this staff member? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      await deleteDoc(doc(db, "users", staffId));
        const subjectsQuery = query(
      collection(db, "subjects"),
      where("assignedStaff", "array-contains", staffEmail)
    );
    const subjectsSnap = await getDocs(subjectsQuery);
    const updatePromises = [];
    subjectsSnap.forEach((subjectDoc) => {
      updatePromises.push(updateDoc(subjectDoc.ref, {
        assignedStaff: arrayRemove(staffEmail)
      }));
    });
    await Promise.all(updatePromises);
    toast.success("Staff member removed from database and unassigned from all subjects");
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error("Error deleting staff");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubject = async (staffId, subjectCode) => {
    try {
      const staffRef = doc(db, "users", staffId);
      const staffSnap = await getDoc(staffRef);
      
      if (staffSnap.exists()) {
        const staffData = staffSnap.data();
        const assignedSubjects = staffData.assignedSubjects || [];
        
        if (assignedSubjects.includes(subjectCode)) {
          toast.info("Subject already assigned");
          return;
        }

        await updateDoc(staffRef, {
          assignedSubjects: [...assignedSubjects, subjectCode],
          updatedAt: serverTimestamp()
        });

        toast.success("Subject assigned successfully");
      }
    } catch (error) {
      console.error("Error assigning subject:", error);
      toast.error("Error assigning subject");
    }
  };

  const handleRemoveSubject = async (staffId, subjectCode) => {
    try {
      const staffRef = doc(db, "users", staffId);
      const staffSnap = await getDoc(staffRef);
      
      if (staffSnap.exists()) {
        const staffData = staffSnap.data();
        const assignedSubjects = staffData.assignedSubjects || [];
        
        await updateDoc(staffRef, {
          assignedSubjects: assignedSubjects.filter(s => s !== subjectCode),
          updatedAt: serverTimestamp()
        });

        toast.success("Subject removed successfully");
      }
    } catch (error) {
      console.error("Error removing subject:", error);
      toast.error("Error removing subject");
    }
  };

  // SUBJECT MANAGEMENT FUNCTIONS
  const handleAddSubject = async () => {
    if (!newSubject.subjectCode || !newSubject.subjectName) {
      toast.error("Please fill subject code and name");
      return;
    }

    try {
      setLoading(true);

      // Check if subject code already exists
      const subjectQuery = query(collection(db, "subjects"), where("subjectCode", "==", newSubject.subjectCode));
      const subjectSnap = await getDocs(subjectQuery);
      if (!subjectSnap.empty) {
        toast.error("Subject code already exists");
        setLoading(false);
        return;
      }

      // Create initial subject structure with empty units
      const initialUnits = {};
      for (let i = 1; i <= newSubject.totalUnits; i++) {
        initialUnits[`unit${i}`] = {
          unitNumber: i,
          unitName: `Unit ${i}`,
          questions: []
        };
      }

      const subjectData = {
        subjectCode: newSubject.subjectCode.toUpperCase(),
        subjectName: newSubject.subjectName,
        department: newSubject.department || "General",
        semester: newSubject.semester || 1,
        totalUnits: newSubject.totalUnits || 5,
        credits: newSubject.credits || 3,
        description: newSubject.description || "",
        units: initialUnits,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: auth.currentUser.uid,
        createdByName: userData.name
      };

      await addDoc(collection(db, "subjects"), subjectData);

      toast.success(`Subject ${newSubject.subjectCode} - ${newSubject.subjectName} created successfully!`);
      
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
      toast.error("Error adding subject: " + error.message);
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

  const handleUpdateSubject = async () => {
    if (!newSubject.subjectCode || !newSubject.subjectName) {
      toast.error("Please fill subject code and name");
      return;
    }

    try {
      setLoading(true);

      // Check if subject code already exists (exclude current subject)
      const subjectQuery = query(collection(db, "subjects"), where("subjectCode", "==", newSubject.subjectCode));
      const subjectSnap = await getDocs(subjectQuery);
      
      const isDuplicate = subjectSnap.docs.some(doc => doc.id !== editingSubjectId);
      if (isDuplicate) {
        toast.error("Subject code already exists");
        setLoading(false);
        return;
      }

      const subjectRef = doc(db, "subjects", editingSubjectId);
      
      const updateData = {
        subjectCode: newSubject.subjectCode.toUpperCase(),
        subjectName: newSubject.subjectName,
        department: newSubject.department || "General",
        semester: newSubject.semester || 1,
        totalUnits: newSubject.totalUnits || 5,
        credits: newSubject.credits || 3,
        description: newSubject.description || "",
        updatedAt: serverTimestamp()
      };

      await updateDoc(subjectRef, updateData);

      toast.success(`Subject updated successfully!`);
      
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
      toast.error("Error updating subject: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (subjectId, subjectCode) => {
    try {
      setLoading(true);

      const usersQuery = query(collection(db, "users"), where("assignedSubjects", "array-contains", subjectCode));
      const usersSnap = await getDocs(usersQuery);
    
      if (!usersSnap.empty) {
         const assignedStaff = [];
      usersSnap.forEach((doc) => {
        const userData = doc.data();
        assignedStaff.push(userData.fullName || userData.email || `User ${doc.id}`);
      });

      // Show toast with staff names
      toast.error(
        <div>
          <p><strong>Cannot delete subject.</strong></p>
          <p>Assigned to {usersSnap.size} staff member(s):</p>
          <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
            {assignedStaff.map((staff, index) => (
              <li key={index}>{staff}</li>
            ))}
          </ul>
          <p>Please unassign it first.</p>
        </div>,
        {
          duration: 6000, // Longer duration to read
          style: { textAlign: 'left' }
        }
      );
      return;
    }
      

      if (!window.confirm(`Are you sure you want to delete subject ${subjectCode}? This action cannot be undone.`)) {
        return;
      }

      await deleteDoc(doc(db, "subjects", subjectId));
      toast.success(`Subject ${subjectCode} deleted successfully`);
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast.error("Error deleting subject");
    } finally {
      setLoading(false);
    }
  };

  // HOD/DEAN ASSIGNMENT FUNCTIONS
  const handleAssignHodDean = async () => {
    if (!hodDeanAssignment.username || !hodDeanAssignment.department) {
      toast.error("Please fill username and department");
      return;
    }

    try {
      setLoading(true);

      // Check if user exists
      const userQuery = query(collection(db, "users"), where("username", "==", hodDeanAssignment.username));
      const userSnap = await getDocs(userQuery);
      
      if (userSnap.empty) {
        toast.error("User not found. Please create the user first.");
        setLoading(false);
        return;
      }

      const userDoc = userSnap.docs[0];
      const userRef = doc(db, "users", userDoc.id);
      
      await updateDoc(userRef, {
        role: hodDeanAssignment.role,
        department: hodDeanAssignment.department,
        updatedAt: serverTimestamp()
      });

      toast.success(`${hodDeanAssignment.role.toUpperCase()} assigned successfully to ${hodDeanAssignment.username}!`);
      
      setShowAssignHodDean(false);
      setHodDeanAssignment({
        username: "",
        role: "hod",
        department: ""
      });

    } catch (error) {
      console.error("Error assigning HOD/Dean:", error);
      toast.error("Error assigning HOD/Dean: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionsForSubject = async (subjectCode) => {
    try {
      setLoading(true);
      
      const questions = {
        oneMark: [],    // 1-mark questions
        threeMark: [],  // 3-mark questions
        fiveMark: []    // 5-mark questions
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
                  dbId: doc.id,
                  marks: q.marks || 0
                };
                
                // Categorize by marks
                if (q.marks === 1) {
                  questions.oneMark.push(question);
                } else if (q.marks === 3) {
                  questions.threeMark.push(question);
                } else if (q.marks === 5) {
                  questions.fiveMark.push(question);
                } else {
                  // Default to 1 mark if not specified
                  questions.oneMark.push({...question, marks: 1});
                }
              });
            }
          });
        }
      });

      setAvailableQuestions(questions);
      
      // Update stats
      setQuestionStats({
        oneMark: { total: questions.oneMark.length, available: questions.oneMark.length },
        threeMark: { total: questions.threeMark.length, available: questions.threeMark.length },
        fiveMark: { total: questions.fiveMark.length, available: questions.fiveMark.length }
      });
      
      const totalQuestions = questions.oneMark.length + questions.threeMark.length + questions.fiveMark.length;
      
      if (totalQuestions === 0) {
        toast.info("No questions found for this subject");
      } else {
        toast.success(`Loaded ${totalQuestions} questions: ${questions.oneMark.length} (1-mark), ${questions.threeMark.length} (3-mark), ${questions.fiveMark.length} (5-mark)`);
      }
    } catch (error) {
      console.error("Error loading questions:", error);
      toast.error("Error loading questions");
    } finally {
      setLoading(false);
    }
  };

  const generateRandomQuestions = () => {
    const requiredOneMark = paperForm.oneMarkQuestions;
    const requiredThreeMark = paperForm.threeMarkQuestions;
    const requiredFiveMark = paperForm.fiveMarkQuestions;
    
    // Check if we have enough questions in each category
    const errors = [];
    
    if (requiredOneMark > availableQuestions.oneMark.length) {
      errors.push(`Not enough 1-mark questions. Available: ${availableQuestions.oneMark.length}, Required: ${requiredOneMark}`);
    }
    
    if (requiredThreeMark > availableQuestions.threeMark.length) {
      errors.push(`Not enough 3-mark questions. Available: ${availableQuestions.threeMark.length}, Required: ${requiredThreeMark}`);
    }
    
    if (requiredFiveMark > availableQuestions.fiveMark.length) {
      errors.push(`Not enough 5-mark questions. Available: ${availableQuestions.fiveMark.length}, Required: ${requiredFiveMark}`);
    }
    
    if (errors.length > 0) {
      toast.error(errors.join(". "));
      return;
    }
    
    // Generate random questions for each category
    const allSelectedQuestions = [];
    
    // Select 1-mark questions
    const shuffledOneMark = [...availableQuestions.oneMark].sort(() => Math.random() - 0.5);
    const selectedOneMark = shuffledOneMark.slice(0, requiredOneMark);
    allSelectedQuestions.push(...selectedOneMark);
    
    // Select 3-mark questions
    const shuffledThreeMark = [...availableQuestions.threeMark].sort(() => Math.random() - 0.5);
    const selectedThreeMark = shuffledThreeMark.slice(0, requiredThreeMark);
    allSelectedQuestions.push(...selectedThreeMark);
    
    // Select 5-mark questions
    const shuffledFiveMark = [...availableQuestions.fiveMark].sort(() => Math.random() - 0.5);
    const selectedFiveMark = shuffledFiveMark.slice(0, requiredFiveMark);
    allSelectedQuestions.push(...selectedFiveMark);
    
    // Calculate section-wise marks
    const sectionMarks = {
      oneMark: selectedOneMark.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0),
      threeMark: selectedThreeMark.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0),
      fiveMark: selectedFiveMark.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0)
    };
    
    const totalMarks = Object.values(sectionMarks).reduce((a, b) => a + b, 0);
    
    setSelectedQuestions(allSelectedQuestions);
    
    // Update the question stats to show remaining counts
    setQuestionStats({
      oneMark: { 
        total: availableQuestions.oneMark.length, 
        available: availableQuestions.oneMark.length - selectedOneMark.length 
      },
      threeMark: { 
        total: availableQuestions.threeMark.length, 
        available: availableQuestions.threeMark.length - selectedThreeMark.length 
      },
      fiveMark: { 
        total: availableQuestions.fiveMark.length, 
        available: availableQuestions.fiveMark.length - selectedFiveMark.length 
      }
    });
    
    toast.success(`Generated ${allSelectedQuestions.length} questions: ${selectedOneMark.length} (1-mark), ${selectedThreeMark.length} (3-mark), ${selectedFiveMark.length} (5-mark). Total marks: ${totalMarks}`);
  };

  const generatePaperImmediately = async () => {
    if (!paperForm.title || !paperForm.subjectCode || selectedQuestions.length === 0) {
      toast.error("Please fill all fields and generate random questions first");
      return;
    }

    try {
      setLoading(true);

      const subject = allSubjects.find(s => s.subjectCode === paperForm.subjectCode);

      // Organize questions by marks
      const questionsByMarks = {
        oneMark: selectedQuestions.filter(q => q.marks === 1),
        threeMark: selectedQuestions.filter(q => q.marks === 3),
        fiveMark: selectedQuestions.filter(q => q.marks === 5)
      };

      // Count questions by unit
      const questionsByUnit = {};
      selectedQuestions.forEach(question => {
        if (!questionsByUnit[question.unit]) {
          questionsByUnit[question.unit] = {
            oneMark: 0,
            threeMark: 0,
            fiveMark: 0
          };
        }
        if (question.marks === 1) {
          questionsByUnit[question.unit].oneMark++;
        } else if (question.marks === 3) {
          questionsByUnit[question.unit].threeMark++;
        } else if (question.marks === 5) {
          questionsByUnit[question.unit].fiveMark++;
        }
      });

      const paperData = {
        title: paperForm.title,
        subjectCode: paperForm.subjectCode,
        subjectName: subject?.subjectName || paperForm.subjectCode,
        createdBy: auth.currentUser.uid,
        createdByName: userData.name,
        createdAt: serverTimestamp(),
        examDate: paperForm.examDate,
        examTime: paperForm.examTime,
        duration: paperForm.duration,
        status: "generated",
        questions: selectedQuestions,
        
        // Mark-based distribution
        oneMarkQuestions: paperForm.oneMarkQuestions,
        threeMarkQuestions: paperForm.threeMarkQuestions,
        fiveMarkQuestions: paperForm.fiveMarkQuestions,
        
        // Calculated values
        totalQuestions: paperForm.totalQuestions,
        totalMarks: paperForm.totalMarks,
        
        // Detailed statistics
        marksDistribution: {
          oneMark: { count: questionsByMarks.oneMark.length, totalMarks: questionsByMarks.oneMark.reduce((sum, q) => sum + (q.marks || 0), 0) },
          threeMark: { count: questionsByMarks.threeMark.length, totalMarks: questionsByMarks.threeMark.reduce((sum, q) => sum + (q.marks || 0), 0) },
          fiveMark: { count: questionsByMarks.fiveMark.length, totalMarks: questionsByMarks.fiveMark.reduce((sum, q) => sum + (q.marks || 0), 0) }
        },
        
        unitsCovered: Object.keys(questionsByUnit),
        questionsPerUnit: questionsByUnit,
        visible: true,
        isRandom: true,
        isAutoGenerated: false
      };

      const docRef = await addDoc(collection(db, "questionPapers"), paperData);

      setGeneratedPaper({
        id: docRef.id,
        ...paperData
      });

      toast.success(`Question paper generated successfully! Total: ${paperForm.totalQuestions} questions, ${paperForm.totalMarks} marks`);
      setShowPreview(true);

    } catch (error) {
      console.error("Error generating paper:", error);
      toast.error("Error generating paper: " + error.message);
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

      const [hours, minutes] = paperForm.generationTime.split(':').map(Number);
      const generationDate = new Date(paperForm.generationDate);
      generationDate.setHours(hours, minutes, 0, 0);

      const now = new Date();
      if (generationDate <= now) {
        toast.error("Generation time must be in the future");
        return;
      }

      const subject = allSubjects.find(s => s.subjectCode === paperForm.subjectCode);

      const paperData = {
        title: paperForm.title,
        subjectCode: paperForm.subjectCode,
        subjectName: subject?.subjectName || paperForm.subjectCode,
        createdBy: auth.currentUser.uid,
        createdByName: userData.name,
        createdAt: serverTimestamp(),
        generationDate: paperForm.generationDate,
        generationTime: paperForm.generationTime,
        generationAt: Timestamp.fromDate(generationDate),
        examDate: paperForm.examDate,
        examTime: paperForm.examTime,
        duration: paperForm.duration,
        
        // Mark-based requirements
        oneMarkQuestions: paperForm.oneMarkQuestions,
        threeMarkQuestions: paperForm.threeMarkQuestions,
        fiveMarkQuestions: paperForm.fiveMarkQuestions,
        totalQuestions: paperForm.totalQuestions,
        totalMarks: paperForm.totalMarks,
        
        status: "scheduled",
        visible: false,
        isRandom: true,
        isAutoGenerated: true
      };

      const docRef = await addDoc(collection(db, "questionPapers"), paperData);

      toast.success(`Paper generation scheduled for ${paperForm.generationDate} at ${paperForm.generationTime}!`);
      
      // Reset form
      setPaperForm({
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
      setSelectedQuestions([]);
      setAvailableQuestions({
        oneMark: [],
        threeMark: [],
        fiveMark: []
      });
      setActiveTab("scheduled");

    } catch (error) {
      console.error("Error scheduling paper:", error);
      toast.error("Error scheduling paper: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearAllQuestions = () => {
    setSelectedQuestions([]);
    // Reset stats to show all questions as available
    setQuestionStats({
      oneMark: { 
        total: availableQuestions.oneMark.length, 
        available: availableQuestions.oneMark.length 
      },
      threeMark: { 
        total: availableQuestions.threeMark.length, 
        available: availableQuestions.threeMark.length 
      },
      fiveMark: { 
        total: availableQuestions.fiveMark.length, 
        available: availableQuestions.fiveMark.length 
      }
    });
    toast.success("Cleared all selected questions");
  };

  const previewPaper = () => {
    if (!generatedPaper || generatedPaper.questions.length === 0) {
      toast.error("No paper to preview");
      return;
    }
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${generatedPaper.title}</title>
        <style>
          body { font-family: Arial; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .exam-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .instructions { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 30px; }
          .question { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
          .question-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
          .marks { font-weight: bold; color: #1e40af; }
          .unit { background: #e5e7eb; padding: 2px 8px; border-radius: 10px; font-size: 12px; }
          @media print { body { padding: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${generatedPaper.title}</h1>
          <h2>${generatedPaper.subjectCode} - ${generatedPaper.subjectName}</h2>
        </div>
        
        <div class="exam-info">
          <div>
            <p><strong>Date:</strong> ${generatedPaper.examDate || new Date().toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${generatedPaper.examTime || "09:30"} AM</p>
          </div>
          <div>
            <p><strong>Duration:</strong> ${generatedPaper.duration || 3} Hours</p>
            <p><strong>Total Marks:</strong> ${generatedPaper.totalMarks}</p>
          </div>
        </div>
        
        <div class="instructions">
          <h3>Instructions:</h3>
          <ul>
            <li>Answer ALL questions.</li>
            <li>Each question carries marks as indicated.</li>
            <li>Write answers in the answer booklet provided.</li>
            <li>Diagrams should be drawn wherever necessary.</li>
          </ul>
        </div>
        
        <h2>QUESTIONS</h2>
        
        ${generatedPaper.questions.map((question, index) => `
          <div class="question">
            <div class="question-header">
              <h3>Q${index + 1}. ${question.question}</h3>
              <div>
                <span class="marks">[${question.marks || 0} Marks]</span>
                <span class="unit">Unit ${question.unit}</span>
              </div>
            </div>
          </div>
        `).join('')}
        
        <div style="text-align: center; margin-top: 40px; font-style: italic;">
          *** End of Question Paper ***
        </div>
        
        <div class="no-print" style="margin-top: 40px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Paper</button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
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
        {/* STAFF MANAGEMENT TAB */}
        {activeTab === "staff" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
              <div className="flex gap-3">
                <button onClick={() => setActiveTab("hod-dean")} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                  <Award className="w-4 h-4" /> Assign HOD/Dean
                </button>
                <button onClick={() => setShowAddStaff(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> Add Staff
                </button>
              </div>
            </div>

            {/* Add Staff Modal */}
            {showAddStaff && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{editingStaffId ? "Edit Staff" : "Add New Staff"}</h3>
                    <button onClick={() => { setShowAddStaff(false); setEditingStaffId(null); setNewStaff({ email: "", fullName: "", username: "", department: "", subjects: [] }); }} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input type="email" value={newStaff.email} onChange={(e) => setNewStaff({...newStaff, email: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="staff@example.com" disabled={editingStaffId} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input type="text" value={newStaff.fullName} onChange={(e) => setNewStaff({...newStaff, fullName: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                      <input type="text" value={newStaff.username} onChange={(e) => setNewStaff({...newStaff, username: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="johndoe" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <input type="text" value={newStaff.department} onChange={(e) => setNewStaff({...newStaff, department: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Computer Science" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assign Subjects</label>
                      <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                        {availableSubjects.length > 0 ? (
                          availableSubjects.map((subject, idx) => (
                            <label key={idx} className="flex items-center gap-2 p-2 hover:bg-gray-50">
                              <input type="checkbox" checked={newStaff.subjects.includes(subject.code)} onChange={(e) => {
                                if (e.target.checked) {
                                  setNewStaff({...newStaff, subjects: [...newStaff.subjects, subject.code]});
                                } else {
                                  setNewStaff({...newStaff, subjects: newStaff.subjects.filter(s => s !== subject.code)});
                                }
                              }} />
                              <span className="text-sm">{subject.code} - {subject.name}</span>
                            </label>
                          ))
                        ) : (
                          <p className="text-sm text-gray-400 p-2">No subjects available. Create subjects first.</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={editingStaffId ? () => handleUpdateStaff(editingStaffId) : handleAddStaff} disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {loading ? (editingStaffId ? "Updating..." : "Creating...") : (editingStaffId ? "Update Staff" : "Create Staff Account")}
                      </button>
                      <button onClick={() => { setShowAddStaff(false); setEditingStaffId(null); setNewStaff({ email: "", fullName: "", username: "", department: "", subjects: [] }); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Staff List */}
            <div className="space-y-4">
              {staffList.map((staff) => (
                <div key={staff.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{staff.fullName || staff.name || "No Name"}</h3>
                          <p className="text-sm text-gray-600">{staff.email || "No email"}</p>
                          <p className="text-xs text-gray-500">@{staff.username || "No username"}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          staff.role === 'hod' ? 'bg-purple-100 text-purple-800' :
                          staff.role === 'dean' ? 'bg-red-100 text-red-800' :
                          staff.status === 'active' ? 'bg-green-100 text-green-800' : 
                          staff.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {staff.role === 'hod' ? 'HOD' : staff.role === 'dean' ? 'DEAN' : staff.role?.toUpperCase() || 'STAFF'}
                        </span>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-700"><strong>Department:</strong> {staff.department || "Not specified"}</span>
                          <span className="text-gray-700"><strong>Role:</strong> {staff.role?.toUpperCase()}</span>
                          <span className="text-gray-700"><strong>Created:</strong> {staff.createdAt?.toDate?.().toLocaleDateString() || "N/A"}</span>
                        </div>
                        
                        {staff.assignedSubjects && staff.assignedSubjects.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-1">Assigned Subjects:</p>
                            <div className="flex flex-wrap gap-2">
                              {staff.assignedSubjects.map((subjectCode) => (
                                <span key={subjectCode} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1">
                                  {subjectCode}
                                  {staff.role === "staff" && (
                                    <button onClick={() => handleRemoveSubject(staff.id, subjectCode)} className="hover:text-red-600">
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {staff.role === "staff" && (
                      <div className="flex flex-col gap-2">
                        <select onChange={(e) => { if (e.target.value) { handleAssignSubject(staff.id, e.target.value); e.target.value = ""; } }} className="text-sm border border-gray-300 rounded-lg px-3 py-1 mb-2">
                          <option value="">Assign Subject</option>
                          {availableSubjects.filter(s => !staff.assignedSubjects?.includes(s.code)).map((subject, idx) => (
                            <option key={idx} value={subject.code}>{subject.code} - {subject.name}</option>
                          ))}
                        </select>
                        
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingStaffId(staff.id); setNewStaff({ email: staff.email, fullName: staff.fullName, username: staff.username, department: staff.department, subjects: staff.assignedSubjects || [] }); setShowAddStaff(true); }} className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1">
                            <Edit className="w-3 h-3" /> Edit
                          </button>
                          <button onClick={() => handleDeleteStaff(staff.id, staff.email)} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {staffList.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-lg font-medium">No staff members yet</p>
                  <p className="text-sm mt-1">Add your first staff member to get started</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUBJECTS MANAGEMENT TAB */}
        {activeTab === "subjects" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Subject Management</h2>
              <button onClick={() => setShowAddSubject(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <FolderPlus className="w-4 h-4" /> Add Subject
              </button>
            </div>

            {/* Add Subject Modal */}
            {showAddSubject && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{editingSubjectId ? "Edit Subject" : "Add New Subject"}</h3>
                    <button onClick={() => { setShowAddSubject(false); setEditingSubjectId(null); setNewSubject({ subjectCode: "", subjectName: "", department: "", semester: 1, totalUnits: 5, credits: 3, description: "" }); }} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code *</label>
                        <input type="text" value={newSubject.subjectCode} onChange={(e) => setNewSubject({...newSubject, subjectCode: e.target.value.toUpperCase()})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="CS101" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Credits</label>
                        <input type="number" min="1" max="10" value={newSubject.credits} onChange={(e) => setNewSubject({...newSubject, credits: parseInt(e.target.value) || 3})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
                      <input type="text" value={newSubject.subjectName} onChange={(e) => setNewSubject({...newStaff, subjectName: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Introduction to Programming" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <input type="text" value={newSubject.department} onChange={(e) => setNewSubject({...newSubject, department: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Computer Science" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                        <select value={newSubject.semester} onChange={(e) => setNewSubject({...newSubject, semester: parseInt(e.target.value)})} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                          {[1,2,3,4,5,6,7,8].map(sem => (
                            <option key={sem} value={sem}>Semester {sem}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Units</label>
                      <input type="number" min="1" max="10" value={newSubject.totalUnits} onChange={(e) => setNewSubject({...newSubject, totalUnits: parseInt(e.target.value) || 5})} className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea value={newSubject.description} onChange={(e) => setNewSubject({...newSubject, description: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" rows="2" placeholder="Subject description..."></textarea>
                    </div>
                    
                    <div className="flex gap-2">
                      <button onClick={editingSubjectId ? handleUpdateSubject : handleAddSubject} disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {loading ? (editingSubjectId ? "Updating..." : "Creating...") : (editingSubjectId ? "Update Subject" : "Create Subject")}
                      </button>
                      <button onClick={() => { setShowAddSubject(false); setEditingSubjectId(null); setNewSubject({ subjectCode: "", subjectName: "", department: "", semester: 1, totalUnits: 5, credits: 3, description: "" }); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Subjects List */}
            <div className="space-y-4">
              {allSubjects.map((subject) => (
                <div key={subject.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Book className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{subject.subjectCode}</h3>
                            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                              {subject.credits || 3} Credits
                            </span>
                            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                              Sem {subject.semester || 1}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{subject.subjectName}</p>
                          <p className="text-xs text-gray-500">{subject.department || "General"}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-700"><strong>Total Units:</strong> {subject.totalUnits || 5}</span>
                          <span className="text-gray-700"><strong>Created:</strong> {subject.createdAt?.toDate?.().toLocaleDateString() || "N/A"}</span>
                        </div>
                        
                        {subject.description && (
                          <p className="mt-2 text-sm text-gray-600">{subject.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditSubject(subject)} className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1">
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => handleDeleteSubject(subject.id, subject.subjectCode)} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {allSubjects.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Book className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-lg font-medium">No subjects yet</p>
                  <p className="text-sm mt-1">Create your first subject to get started</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HOD/DEAN ASSIGNMENT TAB */}
        {activeTab === "hod-dean" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Assign HOD/Dean Roles</h2>
              <button onClick={() => setShowAssignHodDean(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                <Award className="w-4 h-4" /> Assign Role
              </button>
            </div>

            {/* Assign HOD/Dean Modal */}
            {showAssignHodDean && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Assign HOD/Dean Role</h3>
                    <button onClick={() => { setShowAssignHodDean(false); setHodDeanAssignment({ username: "", role: "hod", department: "" }); }} className="text-gray-400 hover:text-gray-600">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                      <input type="text" value={hodDeanAssignment.username} onChange={(e) => setHodDeanAssignment({...hodDeanAssignment, username: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Enter existing username" />
                      <p className="text-xs text-gray-500 mt-1">User must already exist in the system</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                      <select value={hodDeanAssignment.role} onChange={(e) => setHodDeanAssignment({...hodDeanAssignment, role: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2">
                        <option value="hod">Head of Department (HOD)</option>
                        <option value="dean">Dean</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                      <input type="text" value={hodDeanAssignment.department} onChange={(e) => setHodDeanAssignment({...hodDeanAssignment, department: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="Computer Science" />
                    </div>
                    
                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-sm text-purple-800">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        This will give the user special administrative privileges. They will be able to access the admin dashboard.
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button onClick={handleAssignHodDean} disabled={loading} className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50">
                        {loading ? "Assigning..." : "Assign Role"}
                      </button>
                      <button onClick={() => { setShowAssignHodDean(false); setHodDeanAssignment({ username: "", role: "hod", department: "" }); }} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Current HODs and Deans */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current HODs</h3>
                <div className="space-y-3">
                  {staffList.filter(staff => staff.role === "hod").map((hod) => (
                    <div key={hod.id} className="border border-purple-200 bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-purple-900">{hod.fullName}</h4>
                          <p className="text-sm text-purple-700">@{hod.username} • {hod.email}</p>
                          <p className="text-sm text-purple-600">{hod.department}</p>
                        </div>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium">
                          HOD
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {staffList.filter(staff => staff.role === "hod").length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Award className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium">No HODs assigned yet</p>
                      <p className="text-sm mt-1">Assign HOD role to staff members</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Deans</h3>
                <div className="space-y-3">
                  {staffList.filter(staff => staff.role === "dean").map((dean) => (
                    <div key={dean.id} className="border border-red-200 bg-red-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-red-900">{dean.fullName}</h4>
                          <p className="text-sm text-red-700">@{dean.username} • {dean.email}</p>
                          <p className="text-sm text-red-600">{dean.department}</p>
                        </div>
                        <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium">
                          DEAN
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {staffList.filter(staff => staff.role === "dean").length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Award className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium">No Deans assigned yet</p>
                      <p className="text-sm mt-1">Assign Dean role to staff members</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generate Question Paper Tab - UPDATED */}
        {activeTab === "generate" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Question Paper</h2>
            
            <div className="space-y-6">
              {/* Paper Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Paper Title *</label>
                  <input type="text" value={paperForm.title} onChange={(e) => setPaperForm({...paperForm, title: e.target.value})} placeholder="e.g., Mid-Term Examination - CS101" className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject *</label>
                  <select value={paperForm.subjectCode} onChange={(e) => { 
                    setPaperForm({...paperForm, subjectCode: e.target.value}); 
                    setSelectedQuestions([]); 
                    if (e.target.value) { 
                      loadQuestionsForSubject(e.target.value); 
                    } else {
                      setAvailableQuestions({ oneMark: [], threeMark: [], fiveMark: [] });
                      setQuestionStats({
                        oneMark: { total: 0, available: 0 },
                        threeMark: { total: 0, available: 0 },
                        fiveMark: { total: 0, available: 0 }
                      });
                    }
                  }} className="w-full border border-gray-300 rounded-lg px-4 py-2">
                    <option value="">Choose a subject</option>
                    {availableSubjects.map((subject, idx) => (
                      <option key={idx} value={subject.code}>{subject.code} - {subject.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Exam Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Date</label>
                  <input type="date" value={paperForm.examDate} onChange={(e) => setPaperForm({...paperForm, examDate: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Time</label>
                  <input type="time" value={paperForm.examTime} onChange={(e) => setPaperForm({...paperForm, examTime: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Hours)</label>
                  <input type="number" min="1" max="6" value={paperForm.duration} onChange={(e) => setPaperForm({...paperForm, duration: parseInt(e.target.value) || 3})} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                </div>
              </div>

              {/* MARK-BASED QUESTION CONFIGURATION */}
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Question Configuration by Marks</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1-Mark Questions */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">1-Mark Questions</label>
                      <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">1 mark each</span>
                    </div>
                    <input 
                      type="number" 
                      min="0" 
                      max="50" 
                      value={paperForm.oneMarkQuestions} 
                      onChange={(e) => setPaperForm({...paperForm, oneMarkQuestions: parseInt(e.target.value) || 0})} 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2" 
                    />
                    <div className="text-xs text-gray-600">
                      Available: {questionStats.oneMark.available}/{questionStats.oneMark.total}
                      {questionStats.oneMark.available < paperForm.oneMarkQuestions && (
                        <span className="text-red-600 ml-2">Insufficient!</span>
                      )}
                    </div>
                  </div>
                  
                  {/* 3-Mark Questions */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">3-Mark Questions</label>
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">3 marks each</span>
                    </div>
                    <input 
                      type="number" 
                      min="0" 
                      max="50" 
                      value={paperForm.threeMarkQuestions} 
                      onChange={(e) => setPaperForm({...paperForm, threeMarkQuestions: parseInt(e.target.value) || 0})} 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2" 
                    />
                    <div className="text-xs text-gray-600">
                      Available: {questionStats.threeMark.available}/{questionStats.threeMark.total}
                      {questionStats.threeMark.available < paperForm.threeMarkQuestions && (
                        <span className="text-red-600 ml-2">Insufficient!</span>
                      )}
                    </div>
                  </div>
                  
                  {/* 5-Mark Questions */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">5-Mark Questions</label>
                      <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">5 marks each</span>
                    </div>
                    <input 
                      type="number" 
                      min="0" 
                      max="50" 
                      value={paperForm.fiveMarkQuestions} 
                      onChange={(e) => setPaperForm({...paperForm, fiveMarkQuestions: parseInt(e.target.value) || 0})} 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2" 
                    />
                    <div className="text-xs text-gray-600">
                      Available: {questionStats.fiveMark.available}/{questionStats.fiveMark.total}
                      {questionStats.fiveMark.available < paperForm.fiveMarkQuestions && (
                        <span className="text-red-600 ml-2">Insufficient!</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Summary */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Questions</p>
                      <p className="text-lg font-semibold text-gray-900">{paperForm.totalQuestions}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Marks</p>
                      <p className="text-lg font-semibold text-gray-900">{paperForm.totalMarks}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-blue-700">
                    Calculation: ({paperForm.oneMarkQuestions} × 1) + ({paperForm.threeMarkQuestions} × 3) + ({paperForm.fiveMarkQuestions} × 5) = {paperForm.totalMarks} marks
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={generateRandomQuestions} 
                    disabled={loading || !paperForm.subjectCode || paperForm.totalQuestions === 0}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Shuffle className="w-4 h-4" /> Generate Random Questions
                  </button>
                </div>
              </div>

              {/* Selected Questions Summary */}
              {selectedQuestions.length > 0 && (
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">Selected Questions: {selectedQuestions.length}</h3>
                      <p className="text-sm text-gray-600">
                        Total Marks: {selectedQuestions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0)} 
                        ({selectedQuestions.filter(q => q.marks === 1).length} × 1-mark, 
                        {selectedQuestions.filter(q => q.marks === 3).length} × 3-mark, 
                        {selectedQuestions.filter(q => q.marks === 5).length} × 5-mark)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={clearAllQuestions} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg">Clear All</button>
                      <button onClick={generateRandomQuestions} className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Regenerate</button>
                    </div>
                  </div>

                  {/* <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedQuestions.map((question, index) => (
                      <div key={question.id} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">Q{index + 1}</span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                question.marks === 1 ? 'bg-blue-100 text-blue-800' :
                                question.marks === 3 ? 'bg-green-100 text-green-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {question.marks || 0} Marks
                              </span>
                              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">Unit {question.unit}</span>
                              <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">{question.level || "Medium"}</span>
                            </div>
                            <p className="text-sm text-gray-700">{question.question}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div> */}
                </div>
              )}

              {/* TIME-BASED GENERATION SECTION */}
              <div className="border border-gray-300 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center gap-2 mb-4">
                  <Timer className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Schedule Paper Generation</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Generation Date *</label>
                    <input type="date" value={paperForm.generationDate} onChange={(e) => setPaperForm({...paperForm, generationDate: e.target.value})} min={new Date().toISOString().split('T')[0]} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Generation Time *</label>
                    <input type="time" value={paperForm.generationTime} onChange={(e) => setPaperForm({...paperForm, generationTime: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    The paper will be automatically generated at the specified date and time with random questions.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button onClick={generatePaperImmediately} disabled={loading || !paperForm.title || !paperForm.subjectCode || selectedQuestions.length === 0} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  <FileText className="w-5 h-5" /> Generate Paper Now
                </button>
                
                <button onClick={schedulePaperGeneration} disabled={loading || !paperForm.title || !paperForm.subjectCode || !paperForm.generationDate || !paperForm.generationTime} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                  <Timer className="w-5 h-5" /> Schedule Generation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scheduled Papers Tab */}
        {activeTab === "scheduled" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Scheduled Paper Generation</h2>
              <button onClick={() => setActiveTab("generate")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Schedule New Paper
              </button>
            </div>
            
            <div className="space-y-4">
              {scheduledPapers.map(paper => (
                <div key={paper.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{paper.title}</h3>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Scheduled
                        </span>
                        {paper.isAutoGenerated && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Auto-Generate
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{paper.subjectCode} - {paper.subjectName}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Timer size={12} />
                          Generate: {formatDateTime(paper.generationDate, paper.generationTime)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          Exam: {paper.examDate || "Not set"}
                        </span>
                        <span>•</span>
                        <span>{paper.totalQuestions} questions</span>
                        <span>•</span>
                        <span>{paper.totalMarks} marks</span>
                      </div>
                      {paper.oneMarkQuestions && (
                        <div className="mt-2 text-xs text-gray-600">
                          <span>1-mark: {paper.oneMarkQuestions} • </span>
                          <span>3-mark: {paper.threeMarkQuestions || 0} • </span>
                          <span>5-mark: {paper.fiveMarkQuestions || 0}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {paper.generationAt?.toDate && new Date() > paper.generationAt.toDate() ? "Overdue" : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              {scheduledPapers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Timer className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-lg font-medium">No scheduled papers</p>
                  <p className="text-sm mt-1">Schedule your first paper generation</p>
                  <button onClick={() => setActiveTab("generate")} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Schedule Paper</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Generated Papers Tab */}
        {activeTab === "papers" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Generated Question Papers</h2>
              <button onClick={() => setActiveTab("generate")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Generate New Paper
              </button>
            </div>
            
            <div className="space-y-4">
              {questionPapers.filter(paper => paper.status === "generated").map(paper => (
                <div key={paper.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{paper.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          paper.status === 'generated' ? 'bg-green-100 text-green-800' :
                          paper.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {paper.status?.toUpperCase() || 'DRAFT'}
                        </span>
                        {paper.isAutoGenerated && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            Auto-Generated
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{paper.subjectCode} - {paper.subjectName}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {paper.examDate || "Date not set"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {paper.examTime || "Time not set"}
                        </span>
                        <span>•</span>
                        <span>{paper.duration || 3} hours</span>
                        <span>•</span>
                        <span>{paper.totalQuestions || paper.questions?.length || 0} questions</span>
                        <span>•</span>
                        <span>{paper.totalMarks || 0} marks</span>
                      </div>
                      {paper.marksDistribution && (
                        <div className="mt-2 text-xs text-gray-600">
                          <span className="mr-3">1-mark: {paper.marksDistribution.oneMark?.count || 0}</span>
                          <span className="mr-3">3-mark: {paper.marksDistribution.threeMark?.count || 0}</span>
                          <span>5-mark: {paper.marksDistribution.fiveMark?.count || 0}</span>
                        </div>
                      )}
                      {paper.generatedAt && (
                        <div className="mt-2 text-xs text-gray-400">
                          Generated: {paper.generatedAt.toDate ? paper.generatedAt.toDate().toLocaleString() : "Recently"}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => {
                        setGeneratedPaper(paper);
                        setShowPreview(true);
                      }} className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Preview
                      </button>
                      <button onClick={() => {
                        if (paper.questions && paper.questions.length > 0) {
                          setGeneratedPaper(paper);
                          previewPaper();
                        } else {
                          toast.error("No questions available to print");
                        }
                      }} className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-1">
                        <Printer className="w-3 h-3" /> Print
                      </button>
                      <button onClick={async () => {
                        try {
                          const paperRef = doc(db, "questionPapers", paper.id);
                          await updateDoc(paperRef, {
                            visible: !paper.visible
                          });
                          toast.success(`Paper ${paper.visible ? 'hidden' : 'made visible'} for staff`);
                        } catch (error) {
                          toast.error("Error toggling visibility");
                        }
                      }} className={`px-3 py-1 text-sm rounded-lg flex items-center gap-1 ${
                        paper.visible 
                          ? 'text-green-600 hover:bg-green-50 border border-green-200' 
                          : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
                      }`}>
                        {paper.visible ? (
                          <>
                            <Eye className="w-3 h-3" /> Visible
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3" /> Hidden
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {paper.questions && paper.questions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Units covered: </span>
                          <span className="text-gray-600">
                            {paper.unitsCovered ? paper.unitsCovered.join(', ') : 
                              Array.from(new Set(paper.questions.map(q => q.unit))).join(', ')}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Question types: </span>
                          <span className="text-gray-600">
                            {Array.from(new Set(paper.questions.map(q => q.type || 'Standard'))).join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {questionPapers.filter(paper => paper.status === "generated").length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-lg font-medium">No generated papers yet</p>
                  <p className="text-sm mt-1">Generate your first question paper</p>
                  <button onClick={() => setActiveTab("generate")} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Generate Paper
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PAPER PREVIEW MODAL */}
        {showPreview && generatedPaper && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">{generatedPaper.title}</h3>
                <div className="flex items-center gap-2">
                  <button onClick={previewPaper} className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
                    <Printer className="w-4 h-4" /> Print/PDF
                  </button>
                  <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {/* Paper Header */}
                <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{generatedPaper.title}</h1>
                  <h2 className="text-xl text-gray-700 mb-4">{generatedPaper.subjectCode} - {generatedPaper.subjectName}</h2>
                  
                  <div className="flex flex-wrap justify-center gap-6 mt-4 text-sm text-gray-600">
                    <div className="text-center">
                      <p className="font-semibold">Date</p>
                      <p>{generatedPaper.examDate || new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Time</p>
                      <p>{generatedPaper.examTime || "09:30"} AM</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Duration</p>
                      <p>{generatedPaper.duration || 3} Hours</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Total Marks</p>
                      <p>{generatedPaper.totalMarks}</p>
                    </div>
                  </div>
                </div>

                {/* Mark Distribution Summary */}
                {generatedPaper.marksDistribution && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Mark Distribution</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-600">1-Mark Questions</p>
                        <p className="text-lg font-semibold text-gray-900">{generatedPaper.marksDistribution.oneMark?.count || 0}</p>
                        <p className="text-xs text-gray-500">{generatedPaper.marksDistribution.oneMark?.totalMarks || 0} marks</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">3-Mark Questions</p>
                        <p className="text-lg font-semibold text-gray-900">{generatedPaper.marksDistribution.threeMark?.count || 0}</p>
                        <p className="text-xs text-gray-500">{generatedPaper.marksDistribution.threeMark?.totalMarks || 0} marks</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">5-Mark Questions</p>
                        <p className="text-lg font-semibold text-gray-900">{generatedPaper.marksDistribution.fiveMark?.count || 0}</p>
                        <p className="text-xs text-gray-500">{generatedPaper.marksDistribution.fiveMark?.totalMarks || 0} marks</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Instructions */}
                <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">INSTRUCTIONS TO CANDIDATES</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                    <li>Answer ALL questions.</li>
                    <li>Each question carries marks as indicated.</li>
                    <li>Write answers in the answer booklet provided.</li>
                    <li>Diagrams should be drawn wherever necessary.</li>
                    <li>All questions are compulsory.</li>
                    <li>Read the questions carefully before answering.</li>
                  </ul>
                </div>

                {/* Questions */}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">QUESTIONS</h3>
                  
                  {generatedPaper.questions && generatedPaper.questions.map((question, index) => (
                    <div key={question.id || index} className="mb-6 p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg">Q{index + 1}.</span>
                          <span className={`text-sm px-3 py-1 rounded-full ${
                            question.marks === 1 ? 'bg-blue-100 text-blue-800' :
                            question.marks === 3 ? 'bg-green-100 text-green-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {question.marks || 0} Mark{question.marks !== 1 ? 's' : ''}
                          </span>
                          <span className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-800">
                            Unit {question.unit}
                          </span>
                          {question.type && (
                            <span className="text-sm px-3 py-1 rounded-full bg-purple-100 text-purple-800">
                              {question.type}
                            </span>
                          )}
                          {question.level && (
                            <span className={`text-sm px-3 py-1 rounded-full ${
                              question.level.toLowerCase() === 'hard' ? 'bg-red-100 text-red-800' :
                              question.level.toLowerCase() === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {question.level}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-800 mb-4">{question.question}</p>
                      
                      {question.options && question.options.length > 0 && (
                        <div className="ml-6 space-y-2">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center">
                              <span className="mr-2 font-medium">{String.fromCharCode(65 + optIndex)}.</span>
                              <span>{option}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="text-center mt-12 pt-6 border-t border-gray-300">
                  <p className="text-lg font-bold text-gray-900">*** END OF QUESTION PAPER ***</p>
                  <p className="text-sm text-gray-600 mt-2">Good Luck!</p>
                </div>
              </div>
              
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-center gap-4">
                <button onClick={previewPaper} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Printer className="w-4 h-4" /> Print Paper
                </button>
                <button onClick={() => setShowPreview(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}