import React from 'react';
import { FileText, Calculator, Shuffle, RefreshCw, Timer, AlertCircle } from 'lucide-react';

export default function PaperGeneration({
    paperForm,
    setPaperForm,
    selectedQuestions,
    setSelectedQuestions,
    availableQuestions,
    setAvailableQuestions,
    questionStats,
    setQuestionStats,
    availableSubjects,
    loadQuestionsForSubject,
    generateRandomQuestions,
    schedulePaperGeneration,
    generatePaperImmediately,
    clearAllQuestions,
    loading
}) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate Question Paper</h2>

            <div className="space-y-6">
                {/* Paper Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Paper Title *</label>
                        <input type="text" value={paperForm.title} onChange={(e) => setPaperForm({ ...paperForm, title: e.target.value })} placeholder="e.g., Mid-Term Examination - CS101" className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject *</label>
                        <select value={paperForm.subjectCode} onChange={(e) => {
                            setPaperForm({ ...paperForm, subjectCode: e.target.value });
                            setSelectedQuestions([]);
                            if (e.target.value) {
                                loadQuestionsForSubject(e.target.value);
                            } else {
                                setAvailableQuestions({ twoMark: [], fourMark: [], sixMark: [], eightMark: [] });
                                setQuestionStats({
                                    twoMark: { total: 0, available: 0 },
                                    fourMark: { total: 0, available: 0 },
                                    sixMark: { total: 0, available: 0 },
                                    eightMark: { total: 0, available: 0 }
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
                        <input type="date" value={paperForm.examDate} onChange={(e) => setPaperForm({ ...paperForm, examDate: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Exam Time</label>
                        <input type="time" value={paperForm.examTime} onChange={(e) => setPaperForm({ ...paperForm, examTime: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Duration (Hours)</label>
                        <input type="number" min="1" max="6" value={paperForm.duration} onChange={(e) => setPaperForm({ ...paperForm, duration: parseInt(e.target.value) || 3 })} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                    </div>
                </div>

                {/* MARK-BASED QUESTION CONFIGURATION */}
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-4">
                        <Calculator className="w-5 h-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">Question Configuration by Marks</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 2-Mark Questions */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">2-Mark Questions</label>
                                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">2 marks each</span>
                            </div>
                            <input
                                type="number"
                                min="0"
                                max="50"
                                value={paperForm.twoMarkQuestions}
                                onChange={(e) => setPaperForm({ ...paperForm, twoMarkQuestions: parseInt(e.target.value) || 0 })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
                            />
                            <div className="text-xs text-gray-600">
                                Available: {questionStats.twoMark.available}/{questionStats.twoMark.total}
                                {questionStats.twoMark.available < paperForm.twoMarkQuestions && (
                                    <span className="text-red-600 ml-2">Insufficient!</span>
                                )}
                            </div>
                        </div>

                        {/* 4-Mark Questions */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">4-Mark Questions</label>
                                <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">4 marks each</span>
                            </div>
                            <input
                                type="number"
                                min="0"
                                max="50"
                                value={paperForm.fourMarkQuestions}
                                onChange={(e) => setPaperForm({ ...paperForm, fourMarkQuestions: parseInt(e.target.value) || 0 })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
                            />
                            <div className="text-xs text-gray-600">
                                Available: {questionStats.fourMark.available}/{questionStats.fourMark.total}
                                {questionStats.fourMark.available < paperForm.fourMarkQuestions && (
                                    <span className="text-red-600 ml-2">Insufficient!</span>
                                )}
                            </div>
                        </div>

                        {/* 6-Mark Questions */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">6-Mark Questions</label>
                                <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-800">6 marks each</span>
                            </div>
                            <input
                                type="number"
                                min="0"
                                max="50"
                                value={paperForm.sixMarkQuestions}
                                onChange={(e) => setPaperForm({ ...paperForm, sixMarkQuestions: parseInt(e.target.value) || 0 })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
                            />
                            <div className="text-xs text-gray-600">
                                Available: {questionStats.sixMark.available}/{questionStats.sixMark.total}
                                {questionStats.sixMark.available < paperForm.sixMarkQuestions && (
                                    <span className="text-red-600 ml-2">Insufficient!</span>
                                )}
                            </div>
                        </div>

                        {/* 8-Mark Questions */}
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">8-Mark Questions</label>
                                <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-800">8 marks each</span>
                            </div>
                            <input
                                type="number"
                                min="0"
                                max="50"
                                value={paperForm.eightMarkQuestions}
                                onChange={(e) => setPaperForm({ ...paperForm, eightMarkQuestions: parseInt(e.target.value) || 0 })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-2"
                            />
                            <div className="text-xs text-gray-600">
                                Available: {questionStats.eightMark.available}/{questionStats.eightMark.total}
                                {questionStats.eightMark.available < paperForm.eightMarkQuestions && (
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
                            Calculation: ({paperForm.twoMarkQuestions} × 2) + ({paperForm.fourMarkQuestions} × 4) + ({paperForm.sixMarkQuestions} × 6) + ({paperForm.eightMarkQuestions} × 8) = {paperForm.totalMarks} marks
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
                                    ({selectedQuestions.filter(q => q.marks === 2).length} × 2-mark,
                                    {selectedQuestions.filter(q => q.marks === 4).length} × 4-mark,
                                    {selectedQuestions.filter(q => q.marks === 6).length} × 6-mark,
                                    {selectedQuestions.filter(q => q.marks === 8).length} × 8-mark)
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={clearAllQuestions} className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg">Clear All</button>
                                <button onClick={generateRandomQuestions} className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Regenerate</button>
                            </div>
                        </div>
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
                            <input type="date" value={paperForm.generationDate} onChange={(e) => setPaperForm({ ...paperForm, generationDate: e.target.value })} min={new Date().toISOString().split('T')[0]} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Generation Time *</label>
                            <input type="time" value={paperForm.generationTime} onChange={(e) => setPaperForm({ ...paperForm, generationTime: e.target.value })} className="w-full border border-gray-300 rounded-lg px-4 py-2" />
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
    );
}
