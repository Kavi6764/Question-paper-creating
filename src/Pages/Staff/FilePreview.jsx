import React from 'react';
import { Download, Info, FileSpreadsheet } from 'lucide-react';
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

export default function FilePreview({ file, previewData, previewPage, setPreviewPage, totalPreviewPages, paginatedPreview }) {

    const downloadTemplate = () => {
        const templateData = [
            {
                QuestionNo: "Q1",
                Question: "What is React?",
                Marks: 5,
                Difficulty: "Medium",
                Unit: 1
            },
            {
                QuestionNo: "Q2",
                Question: "Explain component lifecycle",
                Marks: 10,
                Difficulty: "Hard",
                Unit: 1
            }
        ];

        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Questions");
        XLSX.writeFile(wb, "question_template.xlsx");
        toast.success("Template downloaded!");
    };

    return (
        <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">File Preview</h3>
                        {file && (
                            <p className="text-sm text-gray-500 mt-1">
                                Previewing: {file.name}
                            </p>
                        )}
                    </div>

                    <div className="p-6">
                        {previewData.length > 0 ? (
                            <>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                    {paginatedPreview.map((item) => (
                                        <div key={item.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-medium text-gray-900">{item.questionNo}</span>
                                                <span className={`px-2 py-1 text-xs rounded-full ${item.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                                                    item.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {item.difficulty}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.question}</p>
                                            <div className="flex justify-between text-sm text-gray-500">
                                                <span>Unit {item.unit}</span>
                                                <span className="font-medium">{item.marks} marks</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {totalPreviewPages > 1 && (
                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => setPreviewPage(prev => Math.max(0, prev - 1))}
                                            disabled={previewPage === 0}
                                            className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                                        >
                                            ← Previous
                                        </button>
                                        <span className="text-sm text-gray-600">
                                            {previewPage + 1} / {totalPreviewPages}
                                        </span>
                                        <button
                                            onClick={() => setPreviewPage(prev => Math.min(totalPreviewPages - 1, prev + 1))}
                                            disabled={previewPage === totalPreviewPages - 1}
                                            className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                                        >
                                            Next →
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No file selected</p>
                                <p className="text-sm text-gray-400 mt-1">Upload a file to see preview</p>
                            </div>
                        )}

                        <div className="mt-6 space-y-3">
                            <button
                                onClick={downloadTemplate}
                                className="w-full flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition font-medium"
                            >
                                <Download size={18} />
                                Download Template
                            </button>

                            <div className="text-xs text-gray-500 mt-2 space-y-1">
                                <p className="flex items-center gap-1">
                                    <Info size={12} />
                                    Template includes all required columns
                                </p>
                                <p className="flex items-center gap-1">
                                    <Info size={12} />
                                    Maximum 100 questions per file
                                </p>
                                <p className="flex items-center gap-1">
                                    <Info size={12} />
                                    Green units are already uploaded
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
