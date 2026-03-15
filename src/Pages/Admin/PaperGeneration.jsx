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
    const isPatternFulfilled = React.useMemo(() => {
        if (!paperForm.subjectCode) return false;
        const reqOne = paperForm.oneMarkQuestions;
        const reqFour = paperForm.fourMarkQuestions * 2; // Need 2 for OR
        const reqSix = paperForm.sixMarkQuestions * 2;   // Need 2 for OR
        const reqEight = (paperForm.eightMarkQuestions || 0) * 2;

        return questionStats.oneMark.available >= reqOne &&
               questionStats.fourMark.available >= reqFour &&
               questionStats.sixMark.available >= reqSix &&
               questionStats.eightMark.available >= reqEight;
    }, [paperForm, questionStats]);

    const [subjectSearch, setSubjectSearch] = React.useState('');
    const [showSubjectDropdown, setShowSubjectDropdown] = React.useState(false);
    const dropdownRef = React.useRef(null);
    
    // Refs for smooth scrolling
    const configSectionRef = React.useRef(null);
    const generationSectionRef = React.useRef(null);

    const isPaperDetailsFilled = React.useMemo(() => {
        return !!(paperForm.title && paperForm.subjectCode && paperForm.section && paperForm.program);
    }, [paperForm.title, paperForm.subjectCode, paperForm.section, paperForm.program]);

    // Initialize default program
    React.useEffect(() => {
        if (!paperForm.program) {
            setPaperForm(prev => ({ ...prev, program: 'B.Tech' }));
        }
    }, [paperForm.program, setPaperForm]);

    // Filter subjects based on search
    const filteredSubjects = availableSubjects.filter(sub =>
        sub.name.toLowerCase().includes(subjectSearch.toLowerCase()) ||
        sub.code.toLowerCase().includes(subjectSearch.toLowerCase())
    );

    // Handle clicks outside dropdown to close it
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowSubjectDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-scroll to configuration when details are filled
    React.useEffect(() => {
        if (isPaperDetailsFilled && configSectionRef.current) {
            configSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [isPaperDetailsFilled]);

    // Auto-scroll to generation when pattern is fulfilled
    React.useEffect(() => {
        if (isPatternFulfilled && generationSectionRef.current) {
            generationSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [isPatternFulfilled]);

    const selectedSubject = availableSubjects.find(s => s.code === paperForm.subjectCode);

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

            {/* Color Mapping to ensure Tailwind classes are generated */}
            <div className="hidden bg-blue-500 bg-green-500 bg-purple-500 bg-orange-500 bg-blue-50 bg-green-50 bg-purple-50 bg-orange-50 text-blue-700 text-green-700 text-purple-700 text-orange-700 border-blue-100 border-green-100 border-purple-100 border-orange-100 hover:border-blue-200 hover:border-green-200 hover:border-purple-200 hover:border-orange-200"></div>

            <div className="space-y-8">
                {/* 1. Paper Configuration Section */}
                <div className="space-y-8">
                    {/* 1.1 Paper Details Section */}
                    <section className="bg-white/50 rounded-2xl p-6 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-blue-500" /> Paper Details
                            </h3>
                            {isPaperDetailsFilled && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 uppercase tracking-tighter animate-bounce-short">
                                    <CheckCircle2 className="w-3 h-3" /> Details Ready
                                </span>
                            )}
                        </div>

                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Paper Title <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={paperForm.title}
                                        required
                                        onChange={(e) => setPaperForm({ ...paperForm, title: e.target.value })}
                                        placeholder="e.g., Mid-Term Examination - CS101"
                                        className="w-full border border-gray-200 bg-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5 relative" ref={dropdownRef}>
                                    <label className="block text-sm font-medium text-gray-700">Select Subject <span className="text-red-500">*</span></label>
                                    <div className="relative group/search">
                                        <input
                                            type="text"
                                            placeholder="Search & Select Subject..."
                                            value={subjectSearch || (selectedSubject ? `${selectedSubject.code} - ${selectedSubject.name}` : '')}
                                            onChange={(e) => {
                                                setSubjectSearch(e.target.value);
                                                setShowSubjectDropdown(true);
                                                if (selectedSubject) {
                                                    setPaperForm({ ...paperForm, subjectCode: '' });
                                                }
                                            }}
                                            onFocus={() => setShowSubjectDropdown(true)}
                                            className={`w-full border rounded-xl pl-10 pr-10 py-2.5 text-sm transition-all outline-none ${selectedSubject && !subjectSearch
                                                ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                                                : 'bg-white border-gray-200 text-gray-900 font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500'
                                                }`}
                                        />
                                        <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors ${selectedSubject && !subjectSearch ? 'text-blue-500' : 'text-gray-400 group-focus-within/search:text-blue-500'
                                            }`}>
                                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        </div>

                                        {/* Status Icon/Clear Button */}
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            {selectedSubject && !subjectSearch ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPaperForm({ ...paperForm, subjectCode: '' });
                                                        setSubjectSearch('');
                                                        setSelectedQuestions([]);
                                                    }}
                                                    className="p-1.5 hover:bg-blue-100 rounded-full text-blue-500 transition-colors"
                                                    title="Clear selection"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            ) : (
                                                <div className="text-gray-300">
                                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                                </div>
                                            )}
                                        </div>

                                        {/* Dropdown Results */}
                                        {showSubjectDropdown && (
                                            <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-[1000] max-h-[280px] overflow-y-auto animate-scale-in origin-top">
                                                {filteredSubjects.length > 0 ? (
                                                    <div className="p-1">
                                                        {filteredSubjects.map((subject, idx) => (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => {
                                                                    setPaperForm({
                                                                        ...paperForm,
                                                                        subjectCode: subject.code,
                                                                        department: subject.department || ""
                                                                    });
                                                                    setSubjectSearch('');
                                                                    setShowSubjectDropdown(false);
                                                                    setSelectedQuestions([]);
                                                                    loadQuestionsForSubject(subject.code);
                                                                }}
                                                                className={`w-full text-left px-4 py-3 rounded-lg flex flex-col gap-0.5 transition-all hover:bg-blue-50 group/item ${paperForm.subjectCode === subject.code ? 'bg-blue-50/50' : ''}`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className={`text-sm font-bold ${paperForm.subjectCode === subject.code ? 'text-blue-700' : 'text-gray-900'}`}>{subject.code}</span>
                                                                    {paperForm.subjectCode === subject.code && <div className="w-2 h-2 bg-blue-500 rounded-full shadow-sm"></div>}
                                                                </div>
                                                                <span className="text-xs text-gray-500 group-hover/item:text-blue-600 transition-colors uppercase tracking-tight">{subject.name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="p-8 text-center">
                                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        </div>
                                                        <p className="text-sm text-gray-500">No matching subjects found</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Program <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={paperForm.program || "B.Tech"}
                                        required
                                        onChange={(e) => setPaperForm({ ...paperForm, program: e.target.value })}
                                        placeholder="e.g. B.Tech"
                                        className="w-full border border-gray-200 bg-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                                    <input
                                        type="text"
                                        value={paperForm.department}
                                        required
                                        readOnly
                                        placeholder="Auto-filled"
                                        className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-gray-500 font-medium outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Semester</label>
                                    <div className="relative">
                                        <select
                                            value={paperForm.semester}
                                            onChange={(e) => setPaperForm({ ...paperForm, semester: e.target.value })}
                                            className="w-full border border-gray-200 bg-white rounded-xl px-4 py-2.5 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer hover:border-blue-300"
                                        >
                                            <option value="">Select Semester...</option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => {
                                                const label = `${sem}${sem === 1 ? 'st' : sem === 2 ? 'nd' : sem === 3 ? 'rd' : 'th'} Semester`;
                                                return <option key={sem} value={label}>{label}</option>;
                                            })}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Section <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={paperForm.section}
                                        required
                                        onChange={(e) => setPaperForm({ ...paperForm, section: e.target.value })}
                                        placeholder="Sec-1,2,3"
                                        className="w-full border border-gray-200 bg-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    />
                                </div>
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
                                    <input type="number" step="any" min="0" max="10" value={paperForm.duration} onChange={(e) => setPaperForm({ ...paperForm, duration: e.target.value })} className="w-full border border-gray-200 bg-white rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* 1.2 Question Configuration Section */}
                <div 
                    ref={configSectionRef}
                    className={`transition-all duration-700 ${!isPaperDetailsFilled ? 'opacity-40 grayscale pointer-events-none scale-[0.98]' : 'opacity-100 scale-100'}`}
                >
                    <section className="bg-white/50 rounded-2xl p-6 border border-gray-100 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                    <Calculator className="w-5 h-5 text-purple-500" /> Question Configuration
                                </h3>
                                {isPatternFulfilled && (
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100 uppercase tracking-tighter animate-bounce-short">
                                        <CheckCircle2 className="w-3 h-3" /> Pattern Ready
                                    </span>
                                )}
                            </div>
                            {paperForm.subjectCode && (
                                <div className="flex flex-col items-end gap-1">
                                    <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full border border-purple-100 font-medium tracking-tight">
                                        Pool: {
                                            questionStats.oneMark.available +
                                            questionStats.fourMark.available +
                                            questionStats.sixMark.available
                                        } Questions
                                    </span>
                                </div>
                            )}
                        </div>

                        {!isPatternFulfilled && paperForm.subjectCode && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-pulse">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-red-800">Pattern Not Fulfilled</p>
                                    <p className="text-xs text-red-600 mt-0.5 leading-relaxed">
                                        Question paper cannot be scheduled because required questions are not added yet. 
                                        Note: 4, 6, and 8-mark slots require 2 available questions each for OR pairing.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-5 bg-gray-50/50 border border-gray-100 rounded-2xl mb-8">
                            <div className="flex items-center gap-10">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total Questions</p>
                                    <p className="text-3xl font-black text-gray-900">{paperForm.totalQuestions}</p>
                                </div>
                                <div className="h-10 w-px bg-gray-200"></div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total Marks</p>
                                    <p className="text-3xl font-black text-blue-600">{paperForm.totalMarks}</p>
                                </div>
                            </div>

                            <button
                                onClick={generateRandomQuestions}
                                disabled={loading || !paperForm.subjectCode || paperForm.totalQuestions === 0 || !isPatternFulfilled}
                                className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-8 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]"
                            >
                                <Shuffle className="w-5 h-5" /> Generate Random Selection
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[
                                { label: "1-Mark", key: "oneMarkQuestions", statsKey: "oneMark", color: "blue", multiplier: 1 },
                                { label: "4-Mark", key: "fourMarkQuestions", statsKey: "fourMark", color: "green", multiplier: 4 },
                                { label: "6-Mark", key: "sixMarkQuestions", statsKey: "sixMark", color: "purple", multiplier: 6 },
                            ].map((item) => (
                                <div key={item.key} className={`bg-white p-6 rounded-2xl border border-gray-100 hover:border-${item.color}-300 transition-all shadow-sm hover:shadow-md group flex flex-col gap-5`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="block text-sm font-black text-gray-800">{item.label}</label>
                                            <span className={`text-[10px] font-bold text-${item.color}-600 uppercase tracking-tight`}>
                                                {item.multiplier} mark{item.multiplier > 1 ? 's' : ''} each
                                            </span>
                                        </div>
                                        <div className={`p-2 bg-${item.color}-50 rounded-lg`}>
                                            <Calculator className={`w-4 h-4 text-${item.color}-500`} />
                                        </div>
                                    </div>

                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="50"
                                            value={paperForm[item.key]}
                                            onChange={(e) => setPaperForm({ ...paperForm, [item.key]: parseInt(e.target.value) || 0 })}
                                            className="w-full border-2 border-gray-100 bg-gray-50/30 rounded-xl px-4 py-3 text-center font-black text-gray-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-xl"
                                        />
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                            Qty
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[11px]">
                                            <span className="text-gray-500 font-bold">Availability</span>
                                            <span className="font-black text-gray-900">{questionStats[item.statsKey].available} / {(paperForm[item.key] * (item.statsKey === 'oneMark' ? 1 : 2))}</span>
                                        </div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ease-out ${questionStats[item.statsKey].available < (paperForm[item.key] * (item.statsKey === 'oneMark' ? 1 : 2)) ? 'bg-red-500' : `bg-${item.color}-500`
                                                    }`}
                                                style={{ width: `${Math.min(100, (questionStats[item.statsKey].available / (Math.max(1, paperForm[item.key] * (item.statsKey === 'oneMark' ? 1 : 2)))) * 100)}%` }}
                                            ></div>
                                        </div>
                                        {questionStats[item.statsKey].available < (paperForm[item.key] * (item.statsKey === 'oneMark' ? 1 : 2)) && (
                                            <div className="flex items-center gap-1.5 text-red-500">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-bold animate-pulse">Insufficient available for pattern</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            {/* 2. Actions & Scheduling Section */}
            <div 
                ref={generationSectionRef}
                className={`grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-gray-100 transition-all duration-700 ${!isPatternFulfilled ? 'opacity-40 grayscale pointer-events-none scale-[0.98]' : 'opacity-100 scale-100'}`}
            >
                {/* 2.1 Time-Based Scheduling */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-8 border border-indigo-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 text-indigo-900">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Timer className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-xl font-bold">Schedule Generation</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-semibold text-indigo-800 uppercase tracking-wide mb-1.5">Date</label>
                            <input type="date" value={paperForm.generationDate} onChange={(e) => setPaperForm({ ...paperForm, generationDate: e.target.value })} min={new Date().toISOString().split('T')[0]} className="w-full border border-indigo-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-indigo-800 uppercase tracking-wide mb-1.5">Time</label>
                            <input type="time" value={paperForm.generationTime} onChange={(e) => setPaperForm({ ...paperForm, generationTime: e.target.value })} className="w-full border border-indigo-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" />
                        </div>
                    </div>

                    <div className="mt-6 flex items-start gap-3 p-4 bg-white/60 rounded-xl border border-indigo-100 text-sm text-indigo-700">
                        <AlertCircle className="w-5 h-5 shrink-0 text-indigo-500" />
                        <p>Paper will be auto-generated at the scheduled time using a random selection of questions meeting your criteria.</p>
                    </div>

                    <button
                        onClick={handleSchedulePaper}
                        disabled={loading || !paperForm.title || !paperForm.subjectCode || !paperForm.program || !paperForm.generationDate || !paperForm.generationTime || !isPatternFulfilled}
                        className="mt-8 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transform active:scale-[0.98]"
                    >
                        <Timer className="w-5 h-5" /> Schedule Automatic Generation
                    </button>
                </div>

                {/* 2.2 Instant Generation */}
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm h-full flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <RefreshCw className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Instant Generation</h3>
                    </div>
                    <p className="text-gray-500 mb-8">Download your question paper immediately. Ensure you have selected or generated questions before proceeding.</p>

                    <div className="mt-auto space-y-4">
                        {selectedQuestions.length > 0 && (
                            <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-xl border border-emerald-100 mb-4">
                                <div className="flex items-center gap-2 text-emerald-700">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="font-medium">{selectedQuestions.length} Questions Ready</span>
                                </div>
                                <button onClick={clearAllQuestions} className="text-xs font-bold text-emerald-600 hover:text-emerald-800 uppercase tracking-wider">Clear All</button>
                            </div>
                        )}
                        <button
                            onClick={handleGeneratePaper}
                            disabled={loading || !paperForm.title || !paperForm.subjectCode || !paperForm.program || (!isPatternFulfilled && selectedQuestions.length === 0)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-bold disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transform active:scale-[0.98]"
                        >
                            <FileText className="w-5 h-5" /> {selectedQuestions.length === 0 ? "Instant Automatic Generation" : "Generate & Download PDF"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
