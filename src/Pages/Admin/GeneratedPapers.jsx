import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Calendar, Clock, Eye, Printer, EyeOff, X, ChevronLeft, ChevronRight, Edit2, RefreshCw, PenTool, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../fireBaseConfig';
import EditPaperModal from '../../components/EditPaperModal';
import ReplaceQuestionModal from '../../components/ReplaceQuestionModal';
import EditQuestionModal from '../../components/EditQuestionModal';

export default function GeneratedPapers({
    questionPapers,
    setActiveTab,
    setGeneratedPaper,
    setShowPreview,
    previewPaper,
    showPreview,
    generatedPaper,
    formatDateTime,
    collegeDetails
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const [editingPaper, setEditingPaper] = useState(null);
    const [replacingQuestion, setReplacingQuestion] = useState(null);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const itemsPerPage = 8;

    // Filter logic
    const filteredPapers = questionPapers.filter(paper => paper.status === "generated");

    // Pagination logic
    const totalPages = Math.ceil(filteredPapers.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPapers = filteredPapers.slice(indexOfFirstItem, indexOfLastItem);

    // Reset to page 1 if papers change significantly
    React.useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1);
        }
    }, [filteredPapers.length]);

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

    const handleReplaceQuestion = async (newQuestion) => {
        if (!generatedPaper || !replacingQuestion) return;

        try {
            const updatedQuestions = generatedPaper.questions.map(q =>
                q.id === replacingQuestion.id ? { ...newQuestion } : q
            );

            const paperRef = doc(db, "questionPapers", generatedPaper.id);
            await updateDoc(paperRef, {
                questions: updatedQuestions,
                updatedAt: serverTimestamp()
            });

            setGeneratedPaper(prev => ({
                ...prev,
                questions: updatedQuestions
            }));

            toast.success("Question replaced successfully");
            setReplacingQuestion(null);

        } catch (error) {
            console.error("Error replacing question:", error);
            toast.error("Error replacing question");
        }
    };

    const handleEditQuestion = async (updatedQ) => {
        if (!generatedPaper || !editingQuestion) return;

        try {
            const updatedQuestions = generatedPaper.questions.map(q =>
                q.id === editingQuestion.id ? updatedQ : q
            );

            const paperRef = doc(db, "questionPapers", generatedPaper.id);
            await updateDoc(paperRef, {
                questions: updatedQuestions,
                updatedAt: serverTimestamp()
            });

            setGeneratedPaper(prev => ({
                ...prev,
                questions: updatedQuestions
            }));

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
                <button
                    onClick={() => setActiveTab("generate")}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center gap-2 font-medium"
                >
                    <FileText className="w-4 h-4" /> Generate New
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                            <th className="px-6 py-4">Paper Details</th>
                            <th className="px-6 py-4">Status</th>
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
                                <td className="px-6 py-4">
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
                                </td>
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
                                    <div className="flex items-center gap-3 text-xs text-gray-600">
                                        <div className="text-center">
                                            <span className="block font-bold text-gray-900">{paper.totalQuestions || 0}</span>
                                            <span className="text-[10px] uppercase">Ques</span>
                                        </div>
                                        <div className="w-px h-6 bg-gray-200"></div>
                                        <div className="text-center">
                                            <span className="block font-bold text-gray-900">{paper.totalMarks || 0}</span>
                                            <span className="text-[10px] uppercase">Marks</span>
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
                                                if (paper.questions && paper.questions.length > 0) {
                                                    setGeneratedPaper(paper);
                                                    setTimeout(() => previewPaper(paper), 0);
                                                } else {
                                                    toast.error("No questions available");
                                                }
                                            }}
                                            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors border border-transparent hover:border-purple-100"
                                            title="Print / Save PDF"
                                        >
                                            <Printer className="w-4 h-4" />
                                        </button>
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
                                onClick={() => previewPaper(generatedPaper)}
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:scale-105"
                            >
                                <Printer className="w-5 h-5" /> Print / Save PDF
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

                            sortedQuestions.forEach((q, index) => {
                                // Check if we need to insert a section header
                                if (q.marks !== currentSectionMarks) {
                                    currentSectionMarks = q.marks;
                                    const groupCount = sortedQuestions.filter(sq => sq.marks === q.marks).length;
                                    const groupTotal = groupCount * q.marks;
                                    const label = `Group-${String.fromCharCode(65 + partIndex)}`;
                                    const calculation = `[ ${q.marks} x ${groupCount} = ${groupTotal} ]`;
                                    partIndex++;

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
                                const estHeight = 80 + (qLines * 24) + (optLines * 24);

                                if (currentHeight + estHeight > MAX_PAGE_HEIGHT) {
                                    pages.push(currentPageQuestions);
                                    currentPageQuestions = [];
                                    currentHeight = 100; // Start of new page
                                }

                                currentPageQuestions.push({ ...q, type: 'question', globalIndex: index });
                                currentHeight += estHeight;
                            });
                            if (currentPageQuestions.length > 0) pages.push(currentPageQuestions);

                            return pages.map((pageQuestions, pageIndex) => (
                                <div key={pageIndex} className="bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm] p-[15mm] md:p-[20mm] relative animate-fade-in mx-auto mb-8">

                                    {/* Header (Only on Page 1) */}
                                    {pageIndex === 0 && (
                                        <>
                                            <div className="text-center mb-8 border-b-2 border-gray-900 pb-6">
                                                {/* College Name & Address */}
                                                <h1 className="text-2xl font-serif font-bold text-gray-900 uppercase tracking-wide mb-1">
                                                    {collegeDetails?.collegeName || "EXAM MANAGEMENT SYSTEM"}
                                                </h1>
                                                {collegeDetails && (
                                                    <p className="text-xs font-serif text-gray-600 mb-4">
                                                        {[
                                                            collegeDetails.city,
                                                            collegeDetails.state ? `${collegeDetails.state}${collegeDetails.pincode ? ' - ' + collegeDetails.pincode : ''}` : ''
                                                        ].filter(Boolean).join(', ')}
                                                    </p>
                                                )}

                                                <h2 className="text-xl font-serif font-bold text-gray-900 uppercase tracking-wide mb-2 mt-4">{generatedPaper.title}</h2>
                                                <div className="flex justify-between items-end border-b border-gray-300 pb-2 mb-2">
                                                    <p className="font-serif font-semibold text-lg">{generatedPaper.subjectCode} - {generatedPaper.subjectName}</p>
                                                </div>
                                                <div className="flex justify-between font-serif text-sm">
                                                    <div className="text-left">
                                                        <span className="mr-6">Date: {generatedPaper.examDate || "__________"}</span>
                                                        <span>Time: {generatedPaper.examTime || "__________"}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span>Duration: {generatedPaper.duration || 3} Hours &nbsp;&nbsp; Max. Marks: {generatedPaper.totalMarks}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stats Block (Review only) */}
                                            <div className="mb-6 p-3 bg-blue-50/50 border border-blue-100 rounded text-xs text-gray-600 print:hidden opacity-75 hover:opacity-100 transition-opacity">
                                                <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center text-center">
                                                    {[
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

                                            {/* Instructions */}
                                            <div className="mb-8">
                                                <h4 className="font-bold text-gray-900 mb-2 uppercase text-sm border-b border-gray-300 inline-block pb-0.5">Instructions:</h4>
                                                <ul className="list-decimal list-outside ml-4 space-y-1 text-sm font-serif text-gray-800">
                                                    <li>Answer ALL questions.</li>
                                                    <li>Figures to the right indicate full marks.</li>
                                                    <li>Draw neat diagrams wherever necessary.</li>
                                                </ul>
                                            </div>
                                        </>
                                    )}

                                    {/* Questions & Headers for this page */}
                                    <div>
                                        {pageQuestions.map((item) => {
                                            if (item.type === 'header') {
                                                return (
                                                    <div key={item.id}>
                                                        <h3 className="flex justify-between items-center font-bold text-lg mb-2 uppercase border-t border-b border-gray-200 py-2 mt-4 print:mt-4">
                                                            <span>{item.label}</span>
                                                            <span>{item.calculation}</span>
                                                        </h3>
                                                        <p className="font-bold text-sm mb-6 uppercase">Answer the Following Questions</p>
                                                    </div>
                                                );
                                            }

                                            // Render Question
                                            const question = item;
                                            return (
                                                <div key={question.id || question.globalIndex} className="mb-6 group relative break-inside-avoid px-2 py-1 -mx-2 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200">

                                                    {/* Action Buttons */}
                                                    <div className="absolute right-2 top-2 flex gap-2 print:hidden z-10">
                                                        <button onClick={() => setEditingQuestion(question)} className="flex items-center gap-1 px-2 py-1 bg-white text-blue-600 border border-blue-200 rounded shadow-sm hover:bg-blue-50 text-xs font-medium"><PenTool className="w-3 h-3" /> Edit</button>
                                                        <button onClick={() => setReplacingQuestion(question)} className="flex items-center gap-1 px-2 py-1 bg-white text-orange-600 border border-orange-200 rounded shadow-sm hover:bg-orange-50 text-xs font-medium"><RefreshCw className="w-3 h-3" /> Replace</button>
                                                    </div>

                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="flex gap-3 flex-1">
                                                            <span className="font-bold font-serif text-gray-900 min-w-[20px]">{question.globalIndex + 1}.</span>
                                                            <div className="flex-1">
                                                                <p className="font-serif text-gray-900 text-[15px] leading-relaxed text-justify relative z-0 whitespace-pre-line">{question.question}</p>
                                                                {question.options && question.options.length > 0 && (
                                                                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-2 ml-2">
                                                                        {question.options.map((opt, i) => (
                                                                            <div key={i} className="font-serif text-sm">
                                                                                <span className="font-semibold mr-1">{String.fromCharCode(65 + i)})</span> {opt}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {/* Marks display removed */}
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
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-400 font-serif">
                                        Page {pageIndex + 1} of {pages.length}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>,
                document.body
            )}

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
                        existingQuestionIds={generatedPaper.questions.map(q => q.id)}
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
