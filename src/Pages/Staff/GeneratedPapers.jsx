import React from 'react';
import { Eye, FileText, Shield } from 'lucide-react';

export default function GeneratedPapers({ questionPapers }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Generated Question Papers</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Shield className="w-4 h-4" />
                    <span>Secure View</span>
                </div>
            </div>

            <div className="space-y-4">
                {questionPapers.length > 0 ? (
                    questionPapers.map((paper) => (
                        <div key={paper.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-gray-900 text-lg">{paper.title}</h3>
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${!paper.generatedAt ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                            {paper.status ? paper.status.toUpperCase() : "GENERATED"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span><strong>Subject:</strong> {paper.subjectCode}</span>
                                        <span><strong>Date:</strong> {paper.examDate || "N/A"}</span>
                                        <span><strong>Marks:</strong> {paper.totalMarks}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => window.open(`/view-paper/${paper.id}`, '_blank')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                                >
                                    <Eye className="w-4 h-4" /> View Paper
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                        <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="font-medium">No question papers released yet</p>
                        <p className="text-sm mt-1">Check back later for generated papers</p>
                    </div>
                )}
            </div>
        </div>
    );
}
