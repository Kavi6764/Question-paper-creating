import React, { useState, useMemo } from 'react';
import logo from '../../assets/logo.png';
import { createPortal } from 'react-dom';
import { FileText, Calendar, Clock, Eye, Printer, EyeOff, X, ChevronLeft, ChevronRight, Edit2, RefreshCw, PenTool, CheckCircle, AlertCircle, Search, Trash2, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../../../fireBaseConfig';
import EditPaperModal from '../../components/EditPaperModal';
import ReplaceQuestionModal from '../../components/ReplaceQuestionModal';
import EditQuestionModal from '../../components/EditQuestionModal';
import { handleGoogleDriveUrl, highlightUrls } from '../../utils/imageHandler.jsx';


export default function GeneratedPapers({
    questionPapers,
    setActiveTab,
    setGeneratedPaper,
    setShowPreview,
    downloadPaperAsWord,
    downloadPaperAsPDF,
    showPreview,
    generatedPaper,
    formatDateTime,
    collegeDetails,
    userData
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [selectedSemester, setSelectedSemester] = useState("");
    const [editingPaper, setEditingPaper] = useState(null);
    const [replacingQuestion, setReplacingQuestion] = useState(null);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const itemsPerPage = 8;
    
    // Auto-set department for HOD
    React.useEffect(() => {
        if (userData?.role === 'hod' && userData?.department) {
            setSelectedDepartment(userData.department);
        }
    }, [userData]);

    // Filter logic
    const filteredPapers = useMemo(() => {
        return questionPapers
            .filter(paper => paper.status === "generated")
            .filter(paper => {
                // If user is HOD, they only see papers from their department
                if (userData?.role === 'hod' && userData?.department) {
                    return paper.department === userData.department;
                }
                if (selectedDepartment) {
                    return paper.department === selectedDepartment;
                }
                return true;
            })
            .filter(paper => {
                if (selectedSemester) {
                    return paper.semester === selectedSemester;
                }
                return true;
            })
            .filter(paper => {
                if (!searchTerm) return true;
                const search = searchTerm.toLowerCase();
                return (
                    paper.subjectCode?.toLowerCase().includes(search) ||
                    paper.subjectName?.toLowerCase().includes(search) ||
                    paper.title?.toLowerCase().includes(search)
                );
            })
            .sort((a, b) => {
                const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt || 0);
                const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt || 0);
                return timeB - timeA;
            });
    }, [questionPapers, searchTerm, selectedDepartment, selectedSemester, userData]);

    const departmentsList = useMemo(() => {
        const depts = new Set();
        questionPapers.forEach(p => {
            if (p.department && p.status === "generated") {
                // If user is HOD, they only see their department
                if (userData?.role === 'hod' && userData?.department) {
                    if (p.department === userData.department) depts.add(p.department);
                } else {
                    depts.add(p.department);
                }
            }
        });
        return Array.from(depts).sort();
    }, [questionPapers, userData]);

    const semestersList = useMemo(() => {
        const sems = new Set();
        questionPapers.forEach(p => {
            if (p.semester && p.status === "generated") {
                // Filter by department if one is selected or if user is HOD
                if (userData?.role === 'hod' && userData?.department) {
                    if (p.department === userData.department) sems.add(p.semester.toString());
                } else if (selectedDepartment) {
                    if (p.department === selectedDepartment) sems.add(p.semester.toString());
                } else {
                    sems.add(p.semester.toString());
                }
            }
        });
        return Array.from(sems).sort((a, b) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.localeCompare(b);
        });
    }, [questionPapers, selectedDepartment, userData]);

    // Pagination logic
    const totalPages = Math.ceil(filteredPapers.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPapers = filteredPapers.slice(indexOfFirstItem, indexOfLastItem);

    // Reset to page 1 if filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [filteredPapers.length, searchTerm, selectedDepartment, selectedSemester]);

    const handleUpdatePaper = async (paperId, updatedData) => {
        try {
            const paperRef = doc(db, "questionPapers", paperId);
            await updateDoc(paperRef, {
                ...updatedData,
                updatedAt: serverTimestamp()
            });

            toast.success("Paper updated successfully");
            setEditingPaper(null);
        } catch (error) {
            console.error("Error updating paper:", error);
            toast.error("Error updating paper details");
        }
    };

    const handleDeletePaper = async (paperId) => {
        if (!userData || userData.role !== 'dean') {
            toast.error("Only Dean can delete papers.");
            return;
        }

        if (window.confirm("Are you sure you want to delete this paper? This action cannot be undone.")) {
            try {
                const paperRef = doc(db, "questionPapers", paperId);
                await deleteDoc(paperRef);
                toast.success("Paper deleted successfully");
            } catch (error) {
                console.error("Error deleting paper:", error);
                toast.error("Error deleting paper");
            }
        }
    };

    // Fix IDs for older papers to make Replace/Edit work
    React.useEffect(() => {
        if (showPreview && generatedPaper && generatedPaper.questions) {
            let needsUpdate = false;
            const updatedQuestions = generatedPaper.questions.map((q, idx) => {
                let currentQ = { ...q };
                if (!currentQ.id) {
                    currentQ.id = `prev-q-${idx}-${Date.now()}`;
                    needsUpdate = true;
                }
                if (currentQ.orQuestion && !currentQ.orQuestion.id) {
                    currentQ.orQuestion = {
                        ...currentQ.orQuestion,
                        id: `prev-or-q-${idx}-${Date.now()}`
                    };
                    needsUpdate = true;
                }
                return currentQ;
            });

            if (needsUpdate) {
                setGeneratedPaper(prev => ({ ...prev, questions: updatedQuestions }));
                const updateDb = async () => {
                    try {
                        await updateDoc(doc(db, "questionPapers", generatedPaper.id), { questions: updatedQuestions });
                    } catch (e) { console.error("ID migration error:", e); }
                };
                updateDb();
            }
        }
    }, [showPreview, generatedPaper?.id]);

    const handleReplaceQuestion = async (newQuestion) => {
        console.log("Replace function called with:", newQuestion);
        console.log("Current replacingQuestion:", replacingQuestion);
        console.log("Current generatedPaper:", generatedPaper);

        if (!generatedPaper || !replacingQuestion) return;

        try {
            const updatedQuestions = generatedPaper.questions.map(q => {
                if (q.id === replacingQuestion.id) {
                    return { ...newQuestion, orQuestion: q.orQuestion, id: replacingQuestion.id };
                }
                if (q.orQuestion && q.orQuestion.id === replacingQuestion.id) {
                    return { ...q, orQuestion: { ...newQuestion, id: replacingQuestion.id } };
                }
                return q;
            });

            const paperRef = doc(db, "questionPapers", generatedPaper.id);
            await updateDoc(paperRef, { questions: updatedQuestions, updatedAt: serverTimestamp() });
            setGeneratedPaper(prev => ({ ...prev, questions: updatedQuestions }));
            toast.success("Question replaced successfully");
            setReplacingQuestion(null);
        } catch (error) {
            console.error("Error replacing question:", error);
            toast.error("Error replacing question");
        }
    };

    const handleEditQuestion = async (updatedQ) => {
        console.log("Edit function called with:", updatedQ);
        if (!generatedPaper || !editingQuestion) return;

        try {
            const updatedQuestions = generatedPaper.questions.map(q => {
                if (q.id === editingQuestion.id) {
                    return { ...updatedQ, orQuestion: q.orQuestion, id: q.id };
                }
                if (q.orQuestion && q.orQuestion.id === editingQuestion.id) {
                    return { ...q, orQuestion: { ...updatedQ, id: q.orQuestion.id } };
                }
                return q;
            });

            const paperRef = doc(db, "questionPapers", generatedPaper.id);
            await updateDoc(paperRef, { questions: updatedQuestions, updatedAt: serverTimestamp() });
            setGeneratedPaper(prev => ({ ...prev, questions: updatedQuestions }));
            toast.success("Question updated successfully");
            setEditingQuestion(null);
        } catch (error) {
            console.error("Error updating question:", error);
            toast.error("Error updating question");
        }
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 animate-fade-in overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-6 h-6 text-emerald-600" /> Generated Papers
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Manage and preview generated question papers</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search papers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none w-full sm:w-48"
                        />
                    </div>

                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        disabled={userData?.role === 'hod'}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none min-w-[140px]"
                    >
                        <option value="">All Departments</option>
                        {departmentsList.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>

                    <select
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none min-w-[140px]"
                    >
                        <option value="">All Semesters</option>
                        {semestersList.map(sem => (
                            <option key={sem} value={sem}>{sem}</option>
                        ))}
                    </select>
                    {userData?.role === 'dean' && (
                        <button
                            onClick={() => setActiveTab("generate")}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2 font-medium"
                        >
                            <FileText className="w-4 h-4" /> Generate New
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                            <th className="px-6 py-4">Paper Details</th>
                            {/* <th className="px-6 py-4">Status</th> */}
                            <th className="px-6 py-4">Exam Info</th>
                            <th className="px-6 py-4">Stats</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {currentPapers.map(paper => (
                            <tr key={paper.id} className="group hover:bg-emerald-50/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                                            {paper.title}
                                            {paper.isAutoGenerated && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 uppercase tracking-wide">
                                                    Auto
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1 font-mono">
                                            {paper.subjectCode} • {paper.subjectName}
                                        </div>
                                    </div>
                                </td>
                                {/* <td className="px-6 py-4">
                                    <button
                                        onClick={async () => {
                                            try {
                                                const paperRef = doc(db, "questionPapers", paper.id);
                                                await updateDoc(paperRef, {
                                                    visible: !paper.visible
                                                });
                                                toast.success(`Paper ${paper.visible ? 'hidden' : 'made visible'} for staff`);
                                            } catch (error) {
                                                toast.error("Error toggling visibility");
                                            }
                                        }}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${paper.visible
                                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200'
                                            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                                            }`}
                                    >
                                        {paper.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                        {paper.visible ? 'Visible' : 'Hidden'}
                                    </button>
                                </td> */}
                                <td className="px-6 py-4">
                                    <div className="text-xs text-gray-500 space-y-1">
                                        <span className="block flex items-center gap-1.5">
                                            <Calendar className="w-3 h-3" />
                                            {paper.examDate || "N/A"}
                                        </span>
                                        <span className="block flex items-center gap-1.5">
                                            <Clock className="w-3 h-3" />
                                            {paper.examTime || "N/A"}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4 text-xs font-medium">
                                        <div className="bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 transition-all group-hover:bg-emerald-100">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-sm font-bold text-emerald-700 leading-none">{paper.totalQuestions || 0}</span>
                                                <span className="text-[10px] text-emerald-600 uppercase font-semibold">Ques</span>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-all group-hover:bg-blue-100">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-sm font-bold text-blue-700 leading-none">{paper.totalMarks || 0}</span>
                                                <span className="text-[10px] text-blue-600 uppercase font-semibold">Marks</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => setEditingPaper(paper)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                            title="Edit Details"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setGeneratedPaper(paper);
                                                setShowPreview(true);
                                            }}
                                            className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                                            title="Preview Paper"
                                        >
                                            <FileText className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (paper.questions?.length > 0) {
                                                    downloadPaperAsWord(paper);
                                                } else {
                                                    toast.error("No questions available");
                                                }
                                            }}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                            title="Download DOC"
                                        >
                                            <FileText className="w-4 h-4 text-blue-500" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (paper.questions?.length > 0) {
                                                    downloadPaperAsPDF(paper);
                                                } else {
                                                    toast.error("No questions available");
                                                }
                                            }}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                            title="Download PDF"
                                        >
                                            <FileDown className="w-4 h-4 text-red-500" />
                                        </button>
                                        {userData?.role === 'dean' && (
                                            <button
                                                onClick={() => handleDeletePaper(paper.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                title="Delete Paper"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredPapers.length === 0 && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                            <FileText className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No generated papers</h3>
                        <p className="text-gray-500 mt-1">Generate a paper to see it listed here</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                    <p className="text-sm text-gray-500">
                        Page <span className="font-medium text-gray-900">{currentPage}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                </div>
            )}

            {/* PAPER PREVIEW MODAL */}
            {showPreview && generatedPaper && createPortal(
                <div className="fixed inset-0 z-[9999] bg-gray-100 w-screen h-screen flex flex-col overflow-hidden">
                    {/* Modal Header */}
                    <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0 shadow-sm z-10">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setShowPreview(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6 text-gray-500" />
                            </button>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{generatedPaper.title}</h3>
                                <p className="text-sm text-gray-500">{generatedPaper.subjectCode} - {generatedPaper.subjectName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => downloadPaperAsWord(generatedPaper)}
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                            >
                                <FileText className="w-5 h-5" /> Word Doc
                            </button>
                            <button
                                onClick={() => downloadPaperAsPDF(generatedPaper)}
                                className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium flex items-center gap-2 shadow-lg shadow-red-500/30 transition-all hover:scale-105"
                            >
                                <FileDown className="w-5 h-5" /> PDF
                            </button>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Preview Content (Scrollable with Pages) */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-200/50 flex flex-col items-center">
                        {/* Page Logic */}
                        {(() => {
                            const MAX_PAGE_HEIGHT = 1000; // px
                            const headerHeight = 500;

                            let pages = [];
                            let currentPageQuestions = [];
                            let currentHeight = headerHeight;

                            // Sort questions by marks to ensure grouping
                            const sortedQuestions = [...generatedPaper.questions].sort((a, b) => a.marks - b.marks);

                            let currentSectionMarks = null;
                            let partIndex = 0;
                            let questionIndex = 0;

                            sortedQuestions.forEach((q, index) => {
                                // Check if we need to insert a section header
                                if (q.marks !== currentSectionMarks) {
                                    currentSectionMarks = q.marks;
                                    const groupCount = sortedQuestions.filter(sq => sq.marks === q.marks).length;
                                    const groupTotal = groupCount * q.marks;
                                    const groupChar = String.fromCharCode(65 + partIndex);
                                    let typeDesc = "Questions";
                                    if (q.marks <= 2) typeDesc = "Very Short Answer Type Questions";
                                    else if (q.marks <= 5) typeDesc = "Short Answer Type Questions";
                                    else typeDesc = "Long Answer Type Questions";

                                    const label = `Section- ${groupChar} (${typeDesc})`;
                                    const calculation = `(${q.marks} marks each)`;
                                    partIndex++;
                                    questionIndex = 0;

                                    const headerHeightPx = 60;

                                    // Check if header fits
                                    if (currentHeight + headerHeightPx > MAX_PAGE_HEIGHT) {
                                        pages.push(currentPageQuestions);
                                        currentPageQuestions = [];
                                        currentHeight = 100;
                                    }

                                    currentPageQuestions.push({
                                        type: 'header',
                                        label: label,
                                        calculation: calculation,
                                        id: `header-${partIndex}`
                                    });
                                    currentHeight += headerHeightPx;
                                }

                                // Estimate Question Height
                                const qLen = q.question?.length || 0;
                                const qLines = Math.ceil(qLen / 85) || 1;
                                const optLines = q.options?.length || 0;
                                let estHeight = 80 + (qLines * 24) + (optLines * 24);

                                // Add height for image
                                if (q.imageURL) estHeight += 60;

                                // Add height for OR question
                                if (q.orQuestion) {
                                    estHeight += 40; // OR separator
                                    const orLen = q.orQuestion.question?.length || 0;
                                    const orLines = Math.ceil(orLen / 85) || 1;
                                    const orOptLines = q.orQuestion.options?.length || 0;
                                    estHeight += 60 + (orLines * 24) + (orOptLines * 24);
                                    if (q.orQuestion.imageURL) estHeight += 60;
                                }

                                if (currentHeight + estHeight > MAX_PAGE_HEIGHT) {
                                    pages.push(currentPageQuestions);
                                    currentPageQuestions = [];
                                    currentHeight = 100; // Start of new page
                                }

                                currentPageQuestions.push({ ...q, type: 'question', globalIndex: index, sectionIndex: questionIndex++ });
                                currentHeight += estHeight;
                            });
                            if (currentPageQuestions.length > 0) pages.push(currentPageQuestions);

                            return pages.map((pageQuestions, pageIndex) => (
                                <div key={pageIndex} className="bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] p-[15mm] md:p-[20mm] relative animate-fade-in mx-auto mb-8">

                                    {/* Header (Only on Page 1) */}
                                    {pageIndex === 0 && (
                                        <>
                                            <div className="text-center mb-6">
                                                <div className="border border-gray-900 rounded p-4 mb-4 font-serif text-[15px] font-bold">
                                                    <h1 className="text-xl uppercase tracking-wider mb-1"> Uttaranchal University</h1>
                                                    <h2 className="text-lg font-normal mb-1">Uttaranchal Institute of Technology</h2>
                                                    <h3 className="text-base font-bold mb-1">
                                                        {(generatedPaper.title || "Examination Paper").replace(/ - Set [A-Z]/gi, "") || (generatedPaper.semester || "Semester")}
                                                    </h3>
                                                    <h3 className="text-base font-bold uppercase mb-3">{generatedPaper.department || ""}</h3>

                                                    <div className="text-left w-full mt-2 font-normal">
                                                        <div className="flex justify-between mb-1">
                                                            <div className="flex gap-2 w-1/2">
                                                                <span className="italic font-bold">Programme:</span>
                                                                <span>{generatedPaper.program || "B.Tech"}</span>
                                                            </div>
                                                            <div className="flex gap-2 w-1/2">
                                                                <span className="italic font-bold">Course Code:</span>
                                                                <span className="uppercase">{generatedPaper.subjectCode || ""}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between mb-1">
                                                            <div className="flex gap-2 w-1/2">
                                                                <span className="italic font-bold">Course:</span>
                                                                <span className="uppercase">{generatedPaper.subjectName || ""}</span>
                                                            </div>
                                                            <div className="flex gap-2 w-1/2">
                                                                <span className="italic font-bold">Section:</span>
                                                                <span className="uppercase">{generatedPaper.section || "A/B/C"}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between mb-1">
                                                            <div className="flex gap-2 w-1/2">
                                                                <span className="italic font-bold">Roll No:</span>
                                                                <span>........................................................................</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="font-serif text-[14px] font-bold text-left mb-2">
                                                    <p>Note: Question Paper has {partIndex || 3} sections. Read carefully before answering.</p>
                                                </div>

                                                {/* Formatting Function */}
                                                {(() => {
                                                    const formatDurationInMinutes = (duration) => {
                                                        const val = parseFloat(duration) || 0;
                                                        return Math.round(val * 60).toString();
                                                    };
                                                    return (
                                                        <div className="flex justify-between font-serif text-[15px] font-bold mb-4">
                                                            <span>Time: {formatDurationInMinutes(generatedPaper.duration)} Minutes</span>
                                                            <span>Max Marks: {generatedPaper.totalMarks || 30}</span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            {/* Stats Block (Review only) */}
                                            <div className="mb-6 p-3 bg-blue-50/50 border border-blue-100 rounded text-xs text-gray-600 print:hidden opacity-75 hover:opacity-100 transition-opacity">
                                                <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center text-center">
                                                    {[
                                                        { key: 'oneMark', label: '1-Mark' },
                                                        { key: 'twoMark', label: '2-Mark' },
                                                        { key: 'threeMark', label: '3-Mark' },
                                                        { key: 'fourMark', label: '4-Mark' },
                                                        { key: 'fiveMark', label: '5-Mark' },
                                                        { key: 'sixMark', label: '6-Mark' },
                                                        { key: 'eightMark', label: '8-Mark' },
                                                        { key: 'tenMark', label: '10-Mark' }
                                                    ].map(type => {
                                                        const count = generatedPaper.marksDistribution?.[type.key]?.count || 0;
                                                        if (count === 0) return null;
                                                        return (
                                                            <div key={type.key}>
                                                                <span className="block font-bold text-blue-700">{count}</span> {type.label}
                                                            </div>
                                                        );
                                                    })}
                                                    {(!generatedPaper.marksDistribution || Object.values(generatedPaper.marksDistribution).every(v => !v.count)) && (
                                                        <span className="text-gray-400 italic">No structure defined</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Removed duplicated Instructions to match your exact pattern */}
                                        </>
                                    )}

                                    {/* Questions & Headers for this page */}
                                    <div>
                                        {pageQuestions.map((item) => {
                                            if (item.type === 'header') {
                                                return (
                                                    <div key={`header-${pageIndex}-${item.id}`}>
                                                        <h3 className="font-bold text-lg mb-2 uppercase pt-8 text-center w-full border-b-2 border-gray-900 pb-2">
                                                            {item.label}
                                                        </h3>
                                                        <div className="flex items-center font-bold text-sm mb-4">
                                                            <span className="flex-1">Q. {item.id.split('-')[1]}: Attempt all Questions {item.calculation}</span>
                                                            <div className="flex items-center">
                                                                <span className="w-24 text-center">Course Outcome</span>
                                                                <span className="w-16 text-center">BT</span>
                                                                <div className="w-24 print:hidden ml-4"></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            // Render Question
                                            const question = item;
                                            const questionNumber = question.globalIndex + 1;

                                            return (
                                                <div key={`q-${pageIndex}-${question.globalIndex}-${question.id}`} className="mb-8 group relative break-inside-avoid">
                                                    {/* Main Question Container */}
                                                    <div className="relative space-y-4">
                                                        {/* Main Question Part */}
                                                        <div className="flex gap-4 items-start">
                                                            {/* Question Number */}
                                                            <span className="font-bold font-serif text-gray-900 w-10 text-[15px] pt-1 shrink-0">
                                                                {questionNumber}.
                                                            </span>

                                                            {/* Question Text & Metadata */}
                                                            <div className="flex-1 flex items-start gap-4">
                                                                <div className="flex-1">
                                                                    <p className="font-serif text-gray-900 text-[15px] leading-relaxed text-left whitespace-pre-line">
                                                                        {highlightUrls(question.question)}
                                                                    </p>

                                                                    {/* Options (if any) */}
                                                                    {question.options && question.options.length > 0 && (
                                                                        <div className="grid grid-cols-2 gap-x-12 gap-y-2 mt-4 ml-2">
                                                                            {question.options.map((opt, i) => (
                                                                                <div key={i} className="font-serif text-[14px] text-gray-800">
                                                                                    <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}

                                                                    {/* Image (if any) */}
                                                                    {question.imageURL && (
                                                                        <div className="mt-4 relative max-w-lg">
                                                                            <img
                                                                                src={handleGoogleDriveUrl(question.imageURL)}
                                                                                alt="Question diagram"
                                                                                className="max-h-64 rounded-lg border border-gray-200 shadow-sm object-contain"
                                                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Metadata Columns */}
                                                                <div className="flex items-start font-serif text-[14px] text-gray-800 font-bold shrink-0">
                                                                    <span className="w-24 text-center">{question.co || 'CO1'}</span>
                                                                    <span className="w-16 text-center uppercase">{question.bloomLevel || 'RE'}</span>
                                                                </div>

                                                                {/* Action Buttons */}
                                                                <div className="w-24 ml-4 flex flex-col gap-1 print:hidden opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setEditingQuestion(question); }}
                                                                        className="flex items-center justify-center gap-1.5 px-2 py-1 bg-white text-blue-600 border border-blue-200 rounded-lg text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-colors shadow-sm"
                                                                    >
                                                                        <PenTool className="w-3 h-3" /> Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setReplacingQuestion(question); }}
                                                                        className="flex items-center justify-center gap-1.5 px-2 py-1 bg-white text-orange-600 border border-orange-200 rounded-lg text-[10px] font-bold hover:bg-orange-600 hover:text-white transition-colors shadow-sm"
                                                                    >
                                                                        <RefreshCw className="w-3 h-3" /> Replace
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* OR Question */}
                                                        {question.orQuestion && (
                                                            <div className="space-y-4">
                                                                {/* OR Separator */}
                                                                <div className="relative flex items-center justify-center my-6 ml-14">
                                                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                                                        <div className="w-full border-t border-gray-200"></div>
                                                                    </div>
                                                                    <div className="relative bg-white px-8">
                                                                        <span className="text-sm font-bold text-gray-800 tracking-widest uppercase">OR</span>
                                                                    </div>
                                                                </div>

                                                                {/* OR Question Content */}
                                                                <div className="flex gap-4 items-start">
                                                                    {/* Repeated Question Number */}
                                                                    <span className="font-bold font-serif text-gray-900 w-10 text-[15px] pt-1 shrink-0">
                                                                        {questionNumber}.
                                                                    </span>

                                                                    <div className="flex-1 flex items-start gap-4">
                                                                        <div className="flex-1">
                                                                            <p className="font-serif text-gray-900 text-[15px] leading-relaxed text-left italic whitespace-pre-line">
                                                                                {highlightUrls(question.orQuestion.question)}
                                                                            </p>

                                                                            {/* OR Options (if any) */}
                                                                            {question.orQuestion.options && question.orQuestion.options.length > 0 && (
                                                                                <div className="grid grid-cols-2 gap-x-12 gap-y-2 mt-4 ml-2">
                                                                                    {question.orQuestion.options.map((opt, i) => (
                                                                                        <div key={i} className="font-serif text-[14px] text-gray-800">
                                                                                            <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}

                                                                            {/* OR Image (if any) */}
                                                                            {question.orQuestion.imageURL && (
                                                                                <div className="mt-4 relative max-w-lg">
                                                                                    <img
                                                                                        src={handleGoogleDriveUrl(question.orQuestion.imageURL)}
                                                                                        alt="OR Question diagram"
                                                                                        className="max-h-64 rounded-lg border border-gray-200 shadow-sm object-contain"
                                                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* OR Metadata Columns */}
                                                                        <div className="flex items-start font-serif text-[14px] text-gray-800 font-bold shrink-0">
                                                                            <span className="w-24 text-center">{question.orQuestion.co || 'CO1'}</span>
                                                                            <span className="w-16 text-center uppercase">{question.orQuestion.bloomLevel || 'RE'}</span>
                                                                        </div>

                                                                        {/* OR Action Buttons */}
                                                                        <div className="w-24 ml-4 flex flex-col gap-1 print:hidden opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); setEditingQuestion({ ...question.orQuestion, parentId: question.id, isOrQuestion: true }); }}
                                                                                className="flex items-center justify-center gap-1.5 px-2 py-1 bg-white text-blue-600 border border-blue-200 rounded-lg text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-colors shadow-sm"
                                                                            >
                                                                                <PenTool className="w-3 h-3" /> Edit
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); setReplacingQuestion({ ...question.orQuestion, parentId: question.id, isOrQuestion: true }); }}
                                                                                className="flex items-center justify-center gap-1.5 px-2 py-1 bg-white text-orange-600 border border-orange-200 rounded-lg text-[10px] font-bold hover:bg-orange-600 hover:text-white transition-colors shadow-sm"
                                                                            >
                                                                                <RefreshCw className="w-3 h-3" /> Replace
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Footer (Only on Last Page) */}
                                    {pageIndex === pages.length - 1 && (
                                        <div className="mt-12 pt-8 text-center text-sm font-serif text-gray-500 border-t border-gray-200">
                                            *** ALL THE BEST ***
                                        </div>
                                    )}

                                    {/* Page Number */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-400 font-serif z-10">
                                        Page {pageIndex + 1} of {pages.length}
                                    </div>

                                    {/* Watermark Logo */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] select-none">
                                        <img
                                            src={logo}
                                            alt=""
                                            className="w-1/2 h-auto grayscale"
                                        />
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>,
                document.body
            )
            }

            {/* Edit Modal */}
            {
                editingPaper && (
                    <EditPaperModal
                        paper={editingPaper}
                        onClose={() => setEditingPaper(null)}
                        onSave={handleUpdatePaper}
                    />
                )
            }

            {/* Replace Question Modal */}
            {
                replacingQuestion && generatedPaper && (
                    <ReplaceQuestionModal
                        subjectCode={generatedPaper.subjectCode}
                        unit={replacingQuestion.unit}
                        marks={replacingQuestion.marks}
                        currentQuestionId={replacingQuestion.id}
                        existingQuestionIds={generatedPaper.questions.reduce((ids, q) => {
                            if (q.id) ids.push(q.id);
                            if (q.orQuestion && q.orQuestion.id) ids.push(q.orQuestion.id);
                            return ids;
                        }, [])}
                       onReplace={handleReplaceQuestion}
                        onClose={() => setReplacingQuestion(null)}
                    />
                )
            }

            {/* Edit Question Text Modal */}
            {
                editingQuestion && (
                    <EditQuestionModal
                        question={editingQuestion}
                        onSave={handleEditQuestion}
                        onClose={() => setEditingQuestion(null)}
                    />
                )
            }
        </div >
    );
}
