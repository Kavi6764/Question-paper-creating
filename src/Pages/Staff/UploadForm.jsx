import React, { useRef } from 'react';
import {
    Upload,
    CheckCircle,
    FileSpreadsheet,
    X,
    Loader2,
    Book,
    Layers,
    FileUp,
    ChevronRight,
    AlertCircle
} from 'lucide-react';

export default function UploadForm({
    subjectCode,
    setSubjectCode,
    subjectName,
    setSubjectName,
    unit,
    setUnit,
    file,
    setFile,
    mySubjects,
    uploadedUnits,
    handleSubmit,
    loading,
    uploadStatus,
    uploadProgress,
    handleFileSelect,
    clearFile,
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    previewData,
    fileInputRef,
    downloadTemplate,
    staffId
}) {
    // Helper to check if unit is uploaded
    const isUnitUploaded = (unitNum) => {
        return uploadedUnits[subjectCode]?.includes(unitNum.toString()) || false;
    };

    const getUnitStatus = (unitNum) => {
        if (!subjectCode) return "available";
        return isUnitUploaded(unitNum) ? "uploaded" : "available";
    };

    const getProgressColor = () => {
        if (uploadStatus === 'success') return 'bg-emerald-500';
        if (uploadStatus === 'error') return 'bg-rose-500';
        return 'bg-blue-600';
    };

    const getStatusMessage = () => {
        if (uploadStatus === 'processing') return 'Uploading your questions...';
        if (uploadStatus === 'success') return 'Questions uploaded successfully!';
        if (uploadStatus === 'error') return 'Upload failed. Please try again.';
        return '';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200 mb-4">
                        <Upload className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        Upload Question Bank
                    </h1>
                    <p className="text-slate-500 mt-2 max-w-md mx-auto">
                        Add new questions to your subject units. Support for Excel files with bulk upload.
                    </p>
                </div>

                {/* Main Form Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
                    {/* Progress Steps */}
                    <div className="px-8 pt-8 pb-4 border-b border-slate-100">
                        <div className="flex items-center justify-between max-w-2xl mx-auto">
                            {[
                                { icon: Book, label: 'Subject', active: subjectCode },
                                { icon: Layers, label: 'Unit', active: unit },
                                { icon: FileUp, label: 'File', active: file }
                            ].map((step, index) => (
                                <React.Fragment key={step.label}>
                                    <div className="flex flex-col items-center">
                                        <div className={`
                                            w-12 h-12 rounded-xl flex items-center justify-center transition-all
                                            ${step.active
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                                                : 'bg-slate-100 text-slate-400'
                                            }
                                        `}>
                                            <step.icon className="w-5 h-5" />
                                        </div>
                                        <span className={`
                                            text-xs font-medium mt-2
                                            ${step.active ? 'text-slate-900' : 'text-slate-400'}
                                        `}>
                                            {step.label}
                                        </span>
                                    </div>
                                    {index < 2 && (
                                        <ChevronRight className="w-5 h-5 text-slate-300" />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Subject Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Book className="w-4 h-4 text-blue-600" />
                                    Select Subject
                                    <span className="text-xs font-normal text-slate-400 ml-auto">
                                        {mySubjects.length} available
                                    </span>
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {mySubjects.map((subject) => (
                                        <button
                                            key={subject.id}
                                            type="button"
                                            onClick={() => {
                                                setSubjectCode(subject.subjectCode);
                                                setSubjectName(subject.subjectName);
                                                setUnit("");
                                            }}
                                            className={`
                                                relative p-4 rounded-xl border-2 text-left transition-all
                                                ${subjectCode === subject.subjectCode
                                                    ? 'border-blue-600 bg-blue-50 shadow-md'
                                                    : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                                                }
                                            `}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="font-semibold text-slate-900">
                                                        {subject.subjectCode}
                                                    </p>
                                                    <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                                                        {subject.subjectName}
                                                    </p>
                                                </div>
                                                {subjectCode === subject.subjectCode && (
                                                    <CheckCircle className="w-5 h-5 text-blue-600" />
                                                )}
                                            </div>
                                            {uploadedUnits[subject.subjectCode]?.length > 0 && (
                                                <div className="mt-3 flex items-center gap-1">
                                                    <div className="flex -space-x-1">
                                                        {uploadedUnits[subject.subjectCode].map((u) => (
                                                            <span key={u} className="w-5 h-5 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center">
                                                                <span className="text-[10px] font-bold text-emerald-700">{u}</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-slate-400 ml-1">
                                                        units uploaded
                                                    </span>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Unit Selection */}
                            {subjectCode && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <Layers className="w-4 h-4 text-blue-600" />
                                        Choose Unit
                                        {uploadedUnits[subjectCode] && (
                                            <div className="ml-auto flex items-center gap-3">
                                                <span className="text-xs font-normal text-slate-400">
                                                    {uploadedUnits[subjectCode].length}/5 units
                                                </span>
                                                <div className="h-4 w-px bg-slate-200"></div>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${(() => {
                                                    const currentSub = mySubjects.find(s => s.subjectCode === subjectCode);
                                                    const total = Object.values(currentSub?.units || {}).reduce((acc, u) => {
                                                        const staffQuestions = (u.questions || []).filter(q => q.staffId === staffId);
                                                        return acc + staffQuestions.length;
                                                    }, 0);
                                                    return total >= 225 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700';
                                                })()
                                                    }`}>
                                                    My Questions: {(() => {
                                                        const currentSub = mySubjects.find(s => s.subjectCode === subjectCode);
                                                        return Object.values(currentSub?.units || {}).reduce((acc, u) => {
                                                            const staffQuestions = (u.questions || []).filter(q => q.staffId === staffId);
                                                            return acc + staffQuestions.length;
                                                        }, 0);
                                                    })()}/225
                                                </span>
                                            </div>
                                        )}
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setUnit("multi")}
                                            className={`
                                                relative py-4 rounded-xl font-medium transition-all flex flex-col items-center justify-center
                                                ${unit === "multi"
                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105'
                                                    : 'bg-indigo-50 text-indigo-700 border-2 border-indigo-200 hover:bg-indigo-100'
                                                }
                                            `}
                                        >
                                            <span className="text-sm font-bold">Bulk</span>
                                            <span className="text-[10px] mt-1 opacity-80">All Units</span>
                                        </button>
                                        {[1, 2, 3, 4, 5].map((u) => {
                                            const uploaded = isUnitUploaded(u);
                                            const selected = unit === u.toString();

                                            // Get question counts from mySubjects (per-staff)
                                            const currentSubject = mySubjects.find(s => s.subjectCode === subjectCode);
                                            const unitData = currentSubject?.units?.[`unit${u}`];
                                            const staffQuestions = (unitData?.questions || []).filter(q => q.staffId === staffId);
                                            const qCount = staffQuestions.length;

                                            // Staff-specific limit logic
                                            const staffTotalQuestions = Object.values(currentSubject?.units || {}).reduce((acc, unit) => {
                                                const sq = (unit.questions || []).filter(q => q.staffId === staffId);
                                                return acc + sq.length;
                                            }, 0);
                                            const isStaffFull = staffTotalQuestions >= 225;

                                            return (
                                                <button
                                                    key={u}
                                                    type="button"
                                                    onClick={() => setUnit(u.toString())}
                                                    className={`
                                                        relative py-4 rounded-xl font-medium transition-all flex flex-col items-center justify-center
                                                        ${selected
                                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105'
                                                            : isStaffFull
                                                                ? 'bg-amber-50 text-amber-700 border-2 border-amber-200 opacity-80'
                                                                : uploaded
                                                                    ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100'
                                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                        }
                                                    `}
                                                >
                                                    <span className="text-lg font-bold">{u}</span>
                                                    <span className={`text-[10px] mt-1 ${selected ? 'text-blue-100' : 'text-slate-500'}`}>
                                                        {qCount} Your Ques.
                                                    </span>
                                                    {isStaffFull && (
                                                        <div className="absolute -top-1 -right-1">
                                                            <span className="flex h-4 w-4">
                                                                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-white"></span>
                                                            </span>
                                                        </div>
                                                    )}
                                                    {uploaded && !isStaffFull && (
                                                        <div className="absolute -top-1 -right-1">
                                                            <span className="flex h-4 w-4">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                                                            </span>
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <p className="text-xs text-slate-400 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Green units have questions. Amber units indicate you have reached your 225-question total limit for this subject.
                                        </p>
                                        {(() => {
                                            const currentSub = mySubjects.find(s => s.subjectCode === subjectCode);
                                            const total = Object.values(currentSub?.units || {}).reduce((acc, u) => {
                                                const sq = (u.questions || []).filter(q => q.staffId === staffId);
                                                return acc + sq.length;
                                            }, 0);
                                            return total >= 225;
                                        })() && (
                                                <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" />
                                                    Your subject limit reached (225/225). You cannot add more questions to any unit.
                                                </p>
                                            )}
                                    </div>
                                </div>
                            )}

                            {/* File Upload */}
                            {(subjectCode && unit) && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                        <FileUp className="w-4 h-4 text-blue-600" />
                                        Upload Excel File
                                    </label>

                                    <div
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`
                                            relative rounded-2xl transition-all cursor-pointer
                                            ${isDragging
                                                ? 'border-2 border-blue-400 bg-blue-50'
                                                : file
                                                    ? 'border-2 border-emerald-400 bg-emerald-50'
                                                    : 'border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                            }
                                        `}
                                    >
                                        {file && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    clearFile();
                                                }}
                                                className="absolute top-4 right-4 p-1.5 bg-white rounded-lg shadow-sm hover:shadow transition-all z-10"
                                            >
                                                <X className="w-4 h-4 text-slate-400" />
                                            </button>
                                        )}

                                        <div className="p-8">
                                            {file ? (
                                                <div className="flex items-center gap-4">
                                                    <div className="p-4 bg-emerald-100 rounded-2xl">
                                                        <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-slate-900 truncate">
                                                            {file.name}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-2 text-sm">
                                                            <span className="text-slate-500">
                                                                {(file.size / 1024).toFixed(2)} KB
                                                            </span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                            <span className="text-slate-500">
                                                                {previewData.length} questions
                                                            </span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                            <span className="text-emerald-600 font-medium">
                                                                Ready to upload
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <div className="inline-flex p-4 bg-blue-100 rounded-2xl mb-4">
                                                        <Upload className="w-8 h-8 text-blue-600" />
                                                    </div>
                                                    <p className="text-slate-900 font-semibold">
                                                        {isDragging ? 'Drop to upload' : 'Drag & drop or click to browse'}
                                                    </p>
                                                    <p className="text-sm text-slate-400 mt-1">
                                                        Supports .xlsx files up to 10MB
                                                    </p>
                                                    <button
                                                        type="button"
                                                        className="mt-4 text-sm text-blue-600 font-medium hover:text-blue-700"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            downloadTemplate();
                                                        }}
                                                    >
                                                        Download template →
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".xlsx"
                                            hidden
                                            onChange={handleFileSelect}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Progress Bar */}
                            {uploadStatus && (
                                <div className="bg-slate-50 rounded-xl p-4 space-y-3 animate-in fade-in duration-300">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {uploadStatus === 'processing' && (
                                                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                                            )}
                                            {uploadStatus === 'success' && (
                                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                            )}
                                            <span className="text-sm font-medium text-slate-700">
                                                {getStatusMessage()}
                                            </span>
                                        </div>
                                        <span className="text-sm font-mono font-medium text-slate-900">
                                            {uploadProgress}%
                                        </span>
                                    </div>

                                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-300 ${getProgressColor()}`}
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>

                                    {uploadStatus === 'success' && (
                                        <p className="text-sm text-emerald-600 text-center pt-2">
                                            Your questions have been added to {subjectCode} - Unit {unit}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Submit Button */}
                            {(subjectCode && unit && file) && (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="
                                        w-full bg-gradient-to-r from-blue-600 to-indigo-600 
                                        hover:from-blue-700 hover:to-indigo-700
                                        text-white py-4 rounded-xl font-semibold 
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                        transition-all transform hover:scale-[1.02] active:scale-[0.98]
                                        flex items-center justify-center gap-2
                                        shadow-lg shadow-blue-200
                                        animate-in fade-in slide-in-from-bottom-2 duration-300
                                    "
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Uploading {previewData.length} Questions...
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={20} />
                                            {isUnitUploaded(unit)
                                                ? `Add More Questions to Unit ${unit}`
                                                : `Upload Unit ${unit} Questions`}
                                        </>
                                    )}
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>© 2024 Question Bank System</span>
                            <div className="flex items-center gap-4">
                                <span>Need help?</span>
                                <span>Format guide</span>
                                <span>Support</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}