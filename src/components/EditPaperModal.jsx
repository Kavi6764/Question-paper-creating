import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Calendar, Clock, Timer, Captions } from 'lucide-react';

export default function EditPaperModal({ paper, onClose, onSave }) {
    const [formData, setFormData] = useState({
        title: '',
        examDate: '',
        examTime: '',
        duration: '',
        section: '',
        generationDate: '',
        generationTime: ''
    });

    useEffect(() => {
        if (paper) {
            setFormData({
                title: paper.title || '',
                examDate: paper.examDate || '',
                examTime: paper.examTime || '',
                duration: paper.duration || '',
                section: paper.section || '',
                generationDate: paper.generationDate || '',
                generationTime: paper.generationTime || ''
            });
        }
    }, [paper]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(paper.id, formData);
    };

    return createPortal(
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md animate-scale-in">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        {paper.status === 'scheduled' ? <Clock className="w-5 h-5 text-amber-500" /> : <EditPaperModal className="w-5 h-5 text-blue-500" />}
                        {paper.status === 'scheduled' ? 'Reschedule Generation' : 'Edit Paper Details'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    {/* Scheduling Section - Only for Scheduled Papers */}
                    {paper.status === 'scheduled' && (
                        <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100 space-y-3 mb-2">
                            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Generation Schedule</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-amber-700 mb-1 uppercase">Generation Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                                        <input
                                            type="date"
                                            value={formData.generationDate}
                                            onChange={(e) => setFormData({ ...formData, generationDate: e.target.value })}
                                            className="w-full pl-9 pr-3 py-2 bg-white border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-amber-700 mb-1 uppercase">Generation Time</label>
                                    <div className="relative">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                                        <input
                                            type="time"
                                            value={formData.generationTime}
                                            onChange={(e) => setFormData({ ...formData, generationTime: e.target.value })}
                                            className="w-full pl-9 pr-3 py-2 bg-white border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Paper Title
                        </label>
                        <div className="relative">
                            <Captions className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="Final Semester Examination"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Exam Date
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="date"
                                    value={formData.examDate}
                                    onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Section
                            </label>
                            <input
                                type="text"
                                value={formData.section}
                                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                placeholder="e.g. A"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Exam Time
                            </label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="time"
                                    value={formData.examTime}
                                    onChange={(e) => setFormData({ ...formData, examTime: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-wrap">
                                Duration (Hours)
                            </label>
                            <div className="relative">
                                <Timer className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    step="0.5"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white pb-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`px-4 py-2 text-sm font-medium text-white rounded-lg flex items-center gap-2 transition-colors ${paper.status === 'scheduled' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            <Save className="w-4 h-4" />
                            {paper.status === 'scheduled' ? 'Update & Reschedule' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
