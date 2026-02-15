import React from 'react';
import { FileText, Calculator, Shuffle, RefreshCw, Timer, AlertCircle, CheckCircle2, BookOpen } from 'lucide-react';

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

    handleSchedulePaper,
    handleGeneratePaper,
    clearAllQuestions,
    loading
}) {
    // Helper to calculate percentage for progress bars
    const getAvailabilityPercentage = (available, required) => {
        if (!required) return 0;
        return Math.min(100, (available / required) * 100);
    };

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-8 animate-fade-in space-y-8">
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30 text-white">
                            <FileText className="w-6 h-6" />
                        </div>
                        Generate Question Paper
                    </h2>
                    <p className="text-gray-500 mt-1 ml-14">Configure and generate exam papers automatically</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Configuration */}
                <div className="lg:col-span-2 space-y-8">

                    {/* 1. Paper Details Section */}
                    <section className="bg-white/50 rounded-2xl p-6 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-blue-500" /> Paper Details
                        </h3>

                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Paper Title <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={paperForm.title}
                                        onChange={(e) => setPaperForm({ ...paperForm, title: e.target.value })}
                                        placeholder="e.g., Mid-Term Examination - CS101"
                                        className="w-full border border-gray-200 bg-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Subject <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            value={paperForm.subjectCode}
                                            onChange={(e) => {
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
                                            }}
                                            className="w-full border border-gray-200 bg-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Choose a subject...</option>
                                            {availableSubjects.map((subject, idx) => (
                                                <option key={idx} value={subject.code}>{subject.code} - {subject.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Exam Date</label>
                                    <input type="date" value={paperForm.examDate} onChange={(e) => setPaperForm({ ...paperForm, examDate: e.target.value })} className="w-full border border-gray-200 bg-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Exam Time</label>
                                    <input type="time" value={paperForm.examTime} onChange={(e) => setPaperForm({ ...paperForm, examTime: e.target.value })} className="w-full border border-gray-200 bg-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Duration (Hours)</label>
                                    <input type="number" min="1" max="6" value={paperForm.duration} onChange={(e) => setPaperForm({ ...paperForm, duration: parseInt(e.target.value) || 3 })} className="w-full border border-gray-200 bg-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2. Question Configuration Section */}
                    <section className="bg-white/50 rounded-2xl p-6 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Calculator className="w-5 h-5 text-purple-500" /> Question Configuration
                            </h3>
                            {paperForm.subjectCode && (
                                <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-100 font-medium">
                                    Total Available: {
                                        questionStats.twoMark.available +
                                        questionStats.fourMark.available +
                                        questionStats.sixMark.available +
                                        questionStats.eightMark.available
                                    }
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { label: "2-Mark", key: "twoMarkQuestions", statsKey: "twoMark", color: "blue", multiplier: 2 },
                                { label: "4-Mark", key: "fourMarkQuestions", statsKey: "fourMark", color: "green", multiplier: 4 },
                                { label: "6-Mark", key: "sixMarkQuestions", statsKey: "sixMark", color: "purple", multiplier: 6 },
                                { label: "8-Mark", key: "eightMarkQuestions", statsKey: "eightMark", color: "orange", multiplier: 8 }
                            ].map((item) => (
                                <div key={item.key} className={`bg-white p-4 rounded-xl border border-gray-100 hover:border-${item.color}-200 transition-all shadow-sm group`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-sm font-bold text-gray-700">{item.label}</label>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${item.color}-50 text-${item.color}-700 font-medium border border-${item.color}-100`}>
                                            {item.multiplier} marks
                                        </span>
                                    </div>

                                    <input
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={paperForm[item.key]}
                                        onChange={(e) => setPaperForm({ ...paperForm, [item.key]: parseInt(e.target.value) || 0 })}
                                        className="w-full border border-gray-200 bg-gray-50/50 rounded-lg px-3 py-2 mb-3 text-center font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    />

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>Available</span>
                                            <span className="font-medium">{questionStats[item.statsKey].available}</span>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${questionStats[item.statsKey].available < paperForm[item.key] ? 'bg-red-500' : `bg-${item.color}-500`
                                                    }`}
                                                style={{ width: `${Math.min(100, (questionStats[item.statsKey].available / (Math.max(1, questionStats[item.statsKey].total))) * 100)}%` }}
                                            ></div>
                                        </div>
                                        {questionStats[item.statsKey].available < paperForm[item.key] && (
                                            <p className="text-[10px] text-red-500 font-medium flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> Insufficient questions
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                            <div className="flex items-center gap-8">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Total Questions</p>
                                    <p className="text-2xl font-bold text-gray-900">{paperForm.totalQuestions}</p>
                                </div>
                                <div className="h-8 w-px bg-gray-300"></div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Total Marks</p>
                                    <p className="text-2xl font-bold text-blue-600">{paperForm.totalMarks}</p>
                                </div>
                            </div>

                            <button
                                onClick={generateRandomQuestions}
                                disabled={loading || !paperForm.subjectCode || paperForm.totalQuestions === 0}
                                className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2.5 px-6 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                <Shuffle className="w-4 h-4" /> Generate Random Selection
                            </button>
                        </div>
                    </section>
                </div>

                {/* Right Column: Scheduling & Actions */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Time-Based Scheduling */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-indigo-900">
                            <Timer className="w-5 h-5" />
                            <h3 className="font-bold">Schedule Generation</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-indigo-800 uppercase tracking-wide mb-1.5">Date</label>
                                <input type="date" value={paperForm.generationDate} onChange={(e) => setPaperForm({ ...paperForm, generationDate: e.target.value })} min={new Date().toISOString().split('T')[0]} className="w-full border border-indigo-200 bg-white/80 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-indigo-800 uppercase tracking-wide mb-1.5">Time</label>
                                <input type="time" value={paperForm.generationTime} onChange={(e) => setPaperForm({ ...paperForm, generationTime: e.target.value })} className="w-full border border-indigo-200 bg-white/80 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/30 outline-none" />
                            </div>
                        </div>

                        <div className="mt-4 flex items-start gap-2 p-3 bg-white/60 rounded-lg border border-indigo-100 text-xs text-indigo-700">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>Paper will be auto-generated at this time with random questions.</p>
                        </div>

                        <button
                            onClick={handleSchedulePaper}
                            disabled={loading || !paperForm.title || !paperForm.subjectCode || !paperForm.generationDate || !paperForm.generationTime}
                            className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium disabled:opacity-50 transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
                        >
                            <Timer className="w-4 h-4" /> Schedule Now
                        </button>
                    </div>

                    {/* Instant Generation */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="font-semibold text-gray-900 mb-2">Instant Generation</h3>
                        <p className="text-sm text-gray-500 mb-4">Generate and download the paper immediately based on current configuration.</p>

                        <button
                            onClick={handleGeneratePaper}
                            disabled={loading || !paperForm.title || !paperForm.subjectCode || selectedQuestions.length === 0}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium disabled:opacity-50 transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
                        >
                            <FileText className="w-4 h-4" /> Generate & Download
                        </button>
                    </div>

                    {/* Selected Summary */}
                    {selectedQuestions.length > 0 && (
                        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-gray-800">Selected Questions</h4>
                                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full font-medium">{selectedQuestions.length}</span>
                            </div>
                            <div className="space-y-2 text-xs text-gray-600 mb-4">
                                <div className="flex justify-between"><span>2-Mark:</span> <span className="font-medium text-gray-900">{selectedQuestions.filter(q => q.marks === 2).length}</span></div>
                                <div className="flex justify-between"><span>4-Mark:</span> <span className="font-medium text-gray-900">{selectedQuestions.filter(q => q.marks === 4).length}</span></div>
                                <div className="flex justify-between"><span>6-Mark:</span> <span className="font-medium text-gray-900">{selectedQuestions.filter(q => q.marks === 6).length}</span></div>
                                <div className="flex justify-between"><span>8-Mark:</span> <span className="font-medium text-gray-900">{selectedQuestions.filter(q => q.marks === 8).length}</span></div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={generateRandomQuestions} className="flex-1 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium hover:bg-gray-50 text-gray-700">Regenerate</button>
                                <button onClick={clearAllQuestions} className="flex-1 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 text-red-600">Clear</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
