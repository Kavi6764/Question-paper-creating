import React from 'react';
import { Download, Info, FileSpreadsheet, Eye, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import toast from "react-hot-toast";

export default function FilePreview({ file, previewData, previewPage, setPreviewPage, totalPreviewPages, paginatedPreview, downloadTemplate }) {

    // Template download handled by parent component

    const getDifficultyColor = (difficulty) => {
        switch (difficulty.toLowerCase()) {
            case 'easy':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'medium':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'hard':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
                {/* Main Preview Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                                <Eye className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-900">File Preview</h3>
                                {file && (
                                    <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                                        <FileSpreadsheet className="w-3.5 h-3.5" />
                                        <span className="truncate max-w-[200px]">{file.name}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Preview Content */}
                    <div className="p-6">
                        {previewData.length > 0 ? (
                            <>
                                {/* Questions Grid */}
                                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                                    {paginatedPreview.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="group relative p-5 bg-white rounded-xl border-2 border-slate-100 hover:border-blue-200 transition-all hover:shadow-md"
                                        >
                                            {/* Question Number Badge */}
                                            <div className="absolute -top-2 -left-2">
                                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white shadow-md">
                                                    {index + 1 + (previewPage * 5)}
                                                </span>
                                            </div>

                                            <div className="space-y-3">
                                                {/* Header with Question No and Difficulty */}
                                                <div className="flex items-center justify-between pl-4">
                                                    <span className="text-sm font-mono font-medium text-slate-400">
                                                        {item.questionNo}
                                                    </span>
                                                    <span className={`
                                                        px-2.5 py-1 text-xs font-medium rounded-full border
                                                        ${getDifficultyColor(item.difficulty)}
                                                    `}>
                                                        {item.difficulty}
                                                    </span>
                                                </div>

                                                {/* Question Text */}
                                                <p className="text-sm text-slate-600 leading-relaxed pl-4">
                                                    {item.question}
                                                </p>

                                                {/* Footer with Unit and Marks */}
                                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                                        Unit {item.unit}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-medium text-slate-400">Marks:</span>
                                                        <span className="text-sm font-bold text-blue-600">{item.marks}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPreviewPages > 1 && (
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                                        <button
                                            onClick={() => setPreviewPage(prev => Math.max(0, prev - 1))}
                                            disabled={previewPage === 0}
                                            className="
                                                flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                                                text-slate-600 hover:text-slate-900 hover:bg-slate-50 
                                                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
                                                transition-all
                                            "
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Previous
                                        </button>

                                        <div className="flex items-center gap-2">
                                            {[...Array(totalPreviewPages)].map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setPreviewPage(i)}
                                                    className={`
                                                        w-8 h-8 rounded-lg text-sm font-medium transition-all
                                                        ${previewPage === i
                                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                                            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                                        }
                                                    `}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => setPreviewPage(prev => Math.min(totalPreviewPages - 1, prev + 1))}
                                            disabled={previewPage === totalPreviewPages - 1}
                                            className="
                                                flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                                                text-slate-600 hover:text-slate-900 hover:bg-slate-50 
                                                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
                                                transition-all
                                            "
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {/* Preview Stats */}
                                <div className="mt-4 flex items-center justify-between text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
                                    <span>Showing {previewData.length} questions</span>
                                    <span className="flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                        Ready to upload
                                    </span>
                                </div>
                            </>
                        ) : (
                            // Empty State
                            <div className="text-center py-12">
                                <div className="inline-flex p-4 bg-slate-100 rounded-2xl mb-4">
                                    <FileSpreadsheet className="w-12 h-12 text-slate-400" />
                                </div>
                                <h4 className="text-lg font-semibold text-slate-900 mb-1">No file selected</h4>
                                <p className="text-sm text-slate-500 mb-4">
                                    Upload an Excel file to preview your questions
                                </p>
                                <div className="inline-flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-lg">
                                    <Info size={14} />
                                    Supports .xlsx files with question banks
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-6 space-y-3">
                            <button
                                onClick={downloadTemplate}
                                className="
                                    w-full flex items-center justify-center gap-2 py-3.5 
                                    bg-gradient-to-r from-blue-600 to-indigo-600 
                                    hover:from-blue-700 hover:to-indigo-700
                                    text-white rounded-xl font-medium 
                                    transition-all transform hover:scale-[1.02] active:scale-[0.98]
                                    shadow-lg shadow-blue-200
                                "
                            >
                                <Download size={18} />
                                Download Template
                            </button>

                            {/* Info Cards */}
                            <div className="grid grid-cols-1 gap-2 mt-4">
                                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl">
                                    <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-blue-700">Template Format</p>
                                        <p className="text-xs text-blue-600/70">
                                            Includes separate sheets for 2, 4, 6, and 8 marks questions
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl">
                                    <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-amber-700">Limitations</p>
                                        <p className="text-xs text-amber-600/70">
                                            Maximum 100 questions per file • Excel format only
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 p-3 bg-emerald-50 rounded-xl">
                                    <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-medium text-emerald-700">Requirements</p>
                                        <p className="text-xs text-emerald-600/70">
                                            Required columns: QuestionNo, Question, Marks, Difficulty, Unit
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Tips Card */}
                {previewData.length > 0 && (
                    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-5 border border-indigo-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h4 className="text-sm font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                            <Info size={16} />
                            Quick Tips
                        </h4>
                        <ul className="space-y-2 text-xs text-indigo-700/70">
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                                Double-check question difficulty levels
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                                Ensure marks are correctly assigned
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                                Verify unit numbers match selection
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                                Preview shows first 5 questions
                            </li>
                        </ul>
                    </div>
                )}
            </div>

            {/* Custom Scrollbar Styles */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </div>
    );
}