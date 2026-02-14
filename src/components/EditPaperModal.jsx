import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Clock, Timer, Captions } from 'lucide-react';

export default function EditPaperModal({ paper, onClose, onSave }) {
    const [formData, setFormData] = useState({
        title: '',
        examDate: '',
        examTime: '',
        duration: ''
    });

    useEffect(() => {
        if (paper) {
            setFormData({
                title: paper.title || '',
                examDate: paper.examDate || '',
                examTime: paper.examTime || '',
                duration: paper.duration || ''
            });
        }
    }, [paper]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(paper.id, formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900">Edit Paper Details</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Final Semester Examination"
                                required
                            />
                        </div>
                    </div>

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
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
