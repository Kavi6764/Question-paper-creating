import React, { useState } from 'react';
import { CheckCircle2, XCircle, FileText, AlertCircle, Trash2, Edit3, Save, Info } from 'lucide-react';
import { handleGoogleDriveUrl, highlightUrls } from '../../utils/imageHandler.jsx';
import toast from 'react-hot-toast';

export default function UploadPreview({ previewData, setPreviewData, unit, subjectName, onConfirm, onCancel, loading }) {
    const totalQuestions = previewData.length;
    const [editingId, setEditingId] = useState(null);

    // Group by Question Type
    const mcqCount = previewData.filter(q => Number(q.marks) === 1).length;
    const shortCount = previewData.filter(q => Number(q.marks) === 4).length;
    const longCount = previewData.filter(q => Number(q.marks) === 6).length;

    const hasGlobalErrors = previewData.some(q => q.hasError);

    const handleUpdateRow = (id, field, value) => {
        const newData = previewData.map(q => {
            if (q.id === id) {
                const updated = { ...q, [field]: value };

                // Re-validate this row
                const missingFields = [];
                if (!updated.question || updated.question.toString().trim() === "") missingFields.push("Question");

                const marksVal = updated.marks !== undefined ? Number(updated.marks) : null;
                if (marksVal === null || ![1, 4, 6].includes(marksVal)) {
                    missingFields.push("Marks (must be 1, 4, or 6)");
                }

                if (!updated.unit) missingFields.push("Unit");
                if (!updated.co) missingFields.push("CO");
                if (!updated.bloomLevel) missingFields.push("BloomLevel");

                updated.hasError = missingFields.length > 0;
                updated.missingFields = missingFields;

                // Update questionType based on marks
                if (marksVal === 1) updated.questionType = 'MCQ';
                else if (marksVal === 4) updated.questionType = 'Short';
                else if (marksVal === 6) updated.questionType = 'Long';
                else updated.questionType = 'Unknown';

                return updated;
            }
            return q;
        });
        setPreviewData(newData);
    };

    const handleDeleteRow = (id) => {
        if (window.confirm("Are you sure you want to remove this question from the upload?")) {
            setPreviewData(previewData.filter(q => q.id !== id));
            toast.success("Question removed from preview");
        }
    };

    const validateAndConfirm = () => {
        if (hasGlobalErrors) {
            const errorCount = previewData.filter(q => q.hasError).length;
            toast.error(`Please fix ${errorCount} questions with errors before confirming.`);
            return;
        }
        onConfirm();
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 max-w-6xl mx-auto animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-100 pb-6 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <FileText className="text-blue-600" size={28} />
                        Upload Preview & Edit
                    </h2>
                    <p className="text-slate-500 mt-1">
                        Review, edit, or remove questions before final upload for <span className="font-semibold text-slate-700">{subjectName}</span>.
                    </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all disabled:opacity-50"
                    >
                        <XCircle size={20} />
                        Cancel
                    </button>
                    <button
                        onClick={validateAndConfirm}
                        disabled={loading || hasGlobalErrors}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold transition-all shadow-md 
                            ${hasGlobalErrors
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 hover:scale-[1.02] active:scale-[0.98]'}`}
                    >
                        {loading ? <div className="animate-spin w-5 h-5 border-2 border-white rounded-full border-t-transparent" /> : <CheckCircle2 size={20} />}
                        Confirm & Upload
                    </button>
                </div>
            </div>

            {hasGlobalErrors && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-shake">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="text-sm font-bold text-red-800">Errors found in some rows!</p>
                        <p className="text-xs text-red-600 mt-0.5">Some questions have missing or invalid data. You can edit them directly in the table below or remove them using the trash icon.</p>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className={`p-4 rounded-2xl text-center border ${totalQuestions === 45 ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Questions</p>
                    <p className={`text-2xl font-bold mt-1 ${totalQuestions === 45 ? 'text-blue-700' : 'text-slate-900'}`}>{totalQuestions} / 45</p>
                </div>
                <div className={`p-4 rounded-2xl text-center border ${mcqCount === 20 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">1 Mark</p>
                    <p className={`text-2xl font-bold mt-1 ${mcqCount === 20 ? 'text-emerald-700' : 'text-slate-900'}`}>{mcqCount} / 20</p>
                </div>
                <div className={`p-4 rounded-2xl text-center border ${shortCount === 15 ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">4 Marks</p>
                    <p className={`text-2xl font-bold mt-1 ${shortCount === 15 ? 'text-amber-700' : 'text-slate-900'}`}>{shortCount} / 15</p>
                </div>
                <div className={`p-4 rounded-2xl text-center border ${longCount === 10 ? 'bg-purple-50 border-purple-100' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">6 Marks</p>
                    <p className={`text-2xl font-bold mt-1 ${longCount === 10 ? 'text-purple-700' : 'text-slate-900'}`}>{longCount} / 10</p>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 sticky top-0 z-20">
                            <tr>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 w-12 text-center">No.</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 w-24">Unit / CO</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">Question Content</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 w-28 text-center">Type / BT</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 w-20 text-center">Marks</th>
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 w-20 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {previewData.length > 0 ? previewData.map((item, idx) => {
                                const isEditing = editingId === item.id;
                                const isUnitMismatch = unit !== "multi" && Number(item.unit) !== Number(unit);

                                return (
                                    <tr key={item.id} className={`group transition-colors ${item.hasError ? 'bg-red-50/30 hover:bg-red-50/50' : isUnitMismatch ? 'opacity-60 bg-slate-50/30' : 'hover:bg-slate-50/50'}`}>
                                        <td className="px-4 py-5 text-sm font-medium text-slate-400 text-center">
                                            {idx + 1}
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="space-y-2">
                                                <div>
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase block leading-none">Unit</span>
                                                        {isUnitMismatch && (
                                                            <div className="group/tip relative flex items-center">
                                                                <AlertCircle size={10} className="text-amber-500 cursor-help" />
                                                                <div className="absolute left-full ml-1 hidden group-hover/tip:block bg-amber-600 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap z-30">
                                                                    Will be skipped (Target: Unit {unit})
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {isEditing ? (
                                                        <select
                                                            value={item.unit}
                                                            onChange={(e) => handleUpdateRow(item.id, 'unit', e.target.value)}
                                                            className={`w-full text-xs font-bold p-1 rounded border ${item.missingFields?.includes('Unit') ? 'border-red-300' : 'border-slate-200'}`}
                                                        >
                                                            <option value="">Select</option>
                                                            {[1, 2, 3, 4, 5].map(u => <option key={u} value={u}>{u}</option>)}
                                                        </select>
                                                    ) : (
                                                        <span className={`text-sm font-bold ${item.missingFields?.includes('Unit') ? 'text-red-500' : isUnitMismatch ? 'text-amber-600 underline decoration-dotted' : 'text-slate-700'}`}>
                                                            {item.unit || '---'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase block leading-none mb-1">CO</span>
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={item.co}
                                                            onChange={(e) => handleUpdateRow(item.id, 'co', e.target.value)}
                                                            placeholder="CO1"
                                                            className={`w-full text-xs font-bold p-1 rounded border ${item.missingFields?.includes('CO') ? 'border-red-300' : 'border-slate-200'}`}
                                                        />
                                                    ) : (
                                                        <span className={`text-sm font-bold ${item.missingFields?.includes('CO') ? 'text-red-500' : 'text-blue-600'}`}>
                                                            {item.co || '---'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="relative">
                                                {isEditing ? (
                                                    <textarea
                                                        value={item.question}
                                                        onChange={(e) => handleUpdateRow(item.id, 'question', e.target.value)}
                                                        className={`w-full text-sm p-3 rounded-xl border min-h-[80px] focus:ring-2 focus:ring-blue-500 outline-none transition-all ${item.missingFields?.includes('Question') ? 'border-red-300 bg-red-50/20' : 'border-slate-200 bg-white'}`}
                                                        placeholder="Enter question content..."
                                                    />
                                                ) : (
                                                    <div className="space-y-2">
                                                        <p className={`text-sm leading-relaxed ${item.missingFields?.includes('Question') ? 'text-red-500 italic' : 'text-slate-700'}`}>
                                                            {highlightUrls(item.question) || '(No question text provided)'}
                                                        </p>
                                                        {item.imageURL && (
                                                            <div className="pt-2">
                                                                <img
                                                                    src={handleGoogleDriveUrl(item.imageURL)}
                                                                    alt="Preview"
                                                                    className="max-h-24 rounded-lg border border-slate-200 shadow-sm"
                                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {item.orQuestion && (
                                                    <div className="mt-4 pl-4 border-l-4 border-amber-200 bg-amber-50/30 p-3 rounded-r-xl">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">OR Question</span>
                                                            <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-bold">{item.orQuestion.co}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 italic leading-relaxed">
                                                            {item.orQuestion.question}
                                                        </p>
                                                    </div>
                                                )}

                                                {item.hasError && !isEditing && (
                                                    <div className="mt-2 flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase">
                                                        <Info size={12} />
                                                        Missing: {item.missingFields?.join(', ')}
                                                    </div>
                                                )}

                                                {isUnitMismatch && !item.hasError && !isEditing && (
                                                    <div className="mt-2 flex items-center gap-2 text-amber-600 text-[10px] font-bold uppercase">
                                                        <AlertCircle size={12} />
                                                        Unit mismatch: This will not be uploaded to Unit {unit}. Change to Unit {unit} to include it.
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-5 text-center">
                                            <div className="space-y-3">
                                                <div>
                                                    <span className={`inline-flex px-2 py-1 rounded-lg text-[10px] uppercase font-black tracking-tighter 
                                                        ${item.questionType === 'MCQ' ? 'bg-emerald-100 text-emerald-700' :
                                                            item.questionType === 'Short' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}
                                                    `}>
                                                        {item.questionType}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase block leading-none mb-1">BT Level</span>
                                                    {isEditing ? (
                                                        <select
                                                            value={item.bloomLevel}
                                                            onChange={(e) => handleUpdateRow(item.id, 'bloomLevel', e.target.value)}
                                                            className={`w-full text-xs font-bold p-1 rounded border ${item.missingFields?.includes('BloomLevel') ? 'border-red-300' : 'border-slate-200'}`}
                                                        >
                                                            <option value="">--</option>
                                                            {['RE', 'UN', 'AP', 'AN', 'EV', 'CR'].map(l => <option key={l} value={l}>{l}</option>)}
                                                        </select>
                                                    ) : (
                                                        <span className={`text-[11px] font-bold px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 ${item.missingFields?.includes('BloomLevel') ? 'bg-red-100 text-red-600' : ''}`}>
                                                            {item.bloomLevel || '??'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-5 text-center">
                                            {isEditing ? (
                                                <select
                                                    value={item.marks}
                                                    onChange={(e) => handleUpdateRow(item.id, 'marks', e.target.value)}
                                                    className={`w-full text-xs font-bold p-1 rounded border ${item.missingFields?.includes('Marks (must be 1, 4, or 6)') ? 'border-red-300' : 'border-slate-200'}`}
                                                >
                                                    <option value="">Marks</option>
                                                    {[1, 4, 6].map(m => <option key={m} value={m}>{m}</option>)}
                                                </select>
                                            ) : (
                                                <span className={`text-lg font-black ${item.hasError && (item.marks === null || ![1, 4, 6].includes(Number(item.marks))) ? 'text-red-500' : 'text-slate-800'}`}>
                                                    {item.marks || '!!'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-5">
                                            <div className="flex flex-col gap-2">
                                                {isEditing ? (
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all flex items-center justify-center shadow-sm shadow-emerald-100"
                                                        title="Save Changes"
                                                    >
                                                        <Save size={16} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => setEditingId(item.id)}
                                                        className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center"
                                                        title="Edit Question"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteRow(item.id)}
                                                    className="p-2 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                                    title="Delete Question"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="6" className="p-20 text-center text-slate-400 italic">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-4 bg-slate-50 rounded-full">
                                                <Info size={32} className="text-slate-300" />
                                            </div>
                                            <p className="text-sm font-medium">No questions found to preview.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    <span>Scroll to see more content</span>
                    <span>{previewData.length} items total</span>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
                    20%, 40%, 60%, 80% { transform: translateX(2px); }
                }
                .animate-shake {
                    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f5f9;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}} />
        </div>
    );
}
