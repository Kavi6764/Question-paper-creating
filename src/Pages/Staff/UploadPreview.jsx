import React from 'react';
import { CheckCircle2, XCircle, FileText, AlertCircle } from 'lucide-react';

export default function UploadPreview({ previewData, unit, subjectName, onConfirm, onCancel, loading }) {
    const totalQuestions = previewData.length;

    // Group by Question Type
    const mcqCount = previewData.filter(q => q.questionType === 'MCQ').length;
    const shortCount = previewData.filter(q => q.questionType === 'Short').length;
    const longCount = previewData.filter(q => q.questionType === 'Long').length;

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 max-w-5xl mx-auto animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-100 pb-6 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                        <FileText className="text-blue-600" size={28} />
                        Upload Preview
                    </h2>
                    <p className="text-slate-500 mt-1">
                        Please review the questions before confirming your upload for <span className="font-semibold text-slate-700">{subjectName}</span> (Unit {unit === 'multi' ? 'All' : unit}).
                    </p>
                </div>
                <div className="mt-4 md:mt-0 flex items-center gap-4">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 hover:text-slate-900 transition-all disabled:opacity-50"
                    >
                        <XCircle size={20} />
                        Cancel Upload
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-200 disabled:opacity-50"
                    >
                        {loading ? <div className="animate-spin w-5 h-5 border-2 border-white rounded-full border-t-transparent" /> : <CheckCircle2 size={20} />}
                        Confirm & Upload
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-center">
                    <p className="text-sm font-medium text-slate-500">Total Valid</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{totalQuestions}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
                    <p className="text-sm font-medium text-emerald-600">MCQ / 1 Mark</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">{mcqCount}</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-center">
                    <p className="text-sm font-medium text-amber-600">Short / 4 Marks</p>
                    <p className="text-2xl font-bold text-amber-700 mt-1">{shortCount}</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl text-center">
                    <p className="text-sm font-medium text-purple-600">Long / &gt;4 Marks</p>
                    <p className="text-2xl font-bold text-purple-700 mt-1">{longCount}</p>
                </div>
            </div>

            {/* Data Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 sticky top-0 z-10 box-border">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 w-16 text-center">No.</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 w-24 text-center">Unit</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 w-24 text-center">CO</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Question Text</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 w-32 border-l border-slate-200 text-center">Type / BT</th>
                                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 w-24 text-center">Marks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {previewData.length > 0 ? previewData.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-4 text-sm font-medium text-slate-500 text-center">{idx + 1}</td>
                                    <td className="px-4 py-4 text-sm font-bold text-slate-600 text-center bg-slate-50/50">Unit {item.unit}</td>
                                    <td className="px-4 py-4 text-sm font-bold text-blue-600 text-center">{item.co || <span className="text-slate-300 font-normal italic">No CO</span>}</td>
                                    <td className="px-4 py-4">
                                        <p className="text-sm text-slate-800 break-words line-clamp-2">{item.question}</p>
                                        {item.orQuestion && (
                                            <div className="mt-2 pl-3 border-l-2 border-amber-400">
                                                <span className="text-[10px] font-bold text-amber-600 uppercase block mb-0.5">Alternative (OR) - {item.orQuestion.co || <span className="text-slate-300 font-normal italic">No CO</span>}</span>
                                                <p className="text-xs text-slate-500 italic break-words line-clamp-2">{item.orQuestion.question}</p>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-4 text-center border-l border-slate-100">
                                        <span className={`inline-block px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider 
                                            ${item.questionType === 'MCQ' ? 'bg-emerald-100 text-emerald-700' :
                                                item.questionType === 'Short' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'}
                                        `}>
                                            {item.questionType}
                                        </span>
                                        <div className="text-[10px] text-slate-400 font-medium mt-1">BT: {item.bloomLevel}</div>
                                    </td>
                                    <td className="px-4 py-4 text-center font-bold text-slate-700">
                                        {item.marks}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500 flex items-center justify-center gap-2">
                                        <AlertCircle size={18} /> No valid questions found to preview.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
