import React, { useState, useEffect } from 'react';
import { X, Save, Check } from 'lucide-react';

export default function EditQuestionModal({
    question,
    onSave,
    onClose
}) {
    const [editedQuestion, setEditedQuestion] = useState({ ...question });
    const [options, setOptions] = useState(question.options || []);

    useEffect(() => {
        setEditedQuestion({ ...question });
        setOptions(question.options || []);
    }, [question]);

    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
        setEditedQuestion(prev => ({ ...prev, options: newOptions }));
    };

    const handleSave = () => {
        if (!editedQuestion.question.trim()) {
            return; // Add proper validation/toast if needed
        }
        onSave(editedQuestion);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Edit Question</h3>
                        <p className="text-sm text-gray-500">
                            Modify the question text and options
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Question Text
                        </label>
                        <textarea
                            value={editedQuestion.question}
                            onChange={(e) => setEditedQuestion(prev => ({ ...prev, question: e.target.value }))}
                            className="w-full h-32 px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all resize-none"
                            placeholder="Enter the question text here..."
                        />
                    </div>

                    {options.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Options
                            </label>
                            <div className="space-y-3">
                                {options.map((option, index) => (
                                    <div key={index} className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-500 w-6">
                                            {String.fromCharCode(65 + index)}.
                                        </span>
                                        <input
                                            type="text"
                                            value={option}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                            placeholder={`Option ${index + 1}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white border border-transparent hover:border-gray-300 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
