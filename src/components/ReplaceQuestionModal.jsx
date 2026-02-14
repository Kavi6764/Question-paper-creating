import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Loader2, Check } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../fireBaseConfig';

export default function ReplaceQuestionModal({
    subjectCode,
    unit,
    marks,
    currentQuestionId,
    existingQuestionIds = [], // Array of IDs to exclude to avoid duplicates
    onReplace,
    onClose
}) {
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [selectedQuestion, setSelectedQuestion] = useState(null);

    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                setLoading(true);
                const q = query(
                    collection(db, "subjects"),
                    where("subjectCode", "==", subjectCode)
                );

                const querySnapshot = await getDocs(q);
                let availableQuestions = [];

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.units) {
                        // Check all units if unit is not strictly enforced, but usually we want same unit
                        // For now, let's enforce same unit
                        Object.values(data.units).forEach(u => {
                            if (Number(u.unitNumber) === Number(unit) && u.questions) {
                                u.questions.forEach((question, index) => {
                                    // Generate a unique ID if not present (simulated based on logic in AdminDashboard)
                                    const qId = question.id || `${doc.id}-${u.unitNumber}-${index}`;

                                    // Filter by marks
                                    if (Number(question.marks) === Number(marks)) {
                                        // Exclude current question and already present questions
                                        if (qId !== currentQuestionId && !existingQuestionIds.includes(qId)) {
                                            availableQuestions.push({
                                                ...question,
                                                id: qId,
                                                unit: u.unitNumber
                                            });
                                        }
                                    }
                                });
                            }
                        });
                    }
                });

                setQuestions(availableQuestions);
            } catch (error) {
                console.error("Error fetching questions:", error);
            } finally {
                setLoading(false);
            }
        };

        if (subjectCode) {
            fetchQuestions();
        }
    }, [subjectCode, unit, marks, currentQuestionId, existingQuestionIds]);

    const handleReplace = () => {
        if (selectedQuestion) {
            onReplace(selectedQuestion);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Replace Question</h3>
                        <p className="text-sm text-gray-500">
                            Select a new {marks}-mark question from Unit {unit}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                            <p className="text-gray-500">Loading available questions...</p>
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <RefreshCw className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="font-medium">No alternative questions found</p>
                            <p className="text-sm mt-1">Try adding more questions to the question bank</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {questions.map((q) => (
                                <div
                                    key={q.id}
                                    onClick={() => setSelectedQuestion(q)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedQuestion?.id === q.id
                                        ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1">
                                            <p className="text-gray-900 font-medium text-sm">{q.question}</p>
                                            <div className="flex gap-2 mt-2">
                                                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                                    {q.difficulty || 'Medium'}
                                                </span>
                                                {q.type && (
                                                    <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700">
                                                        {q.type}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {selectedQuestion?.id === q.id && (
                                            <div className="bg-blue-600 rounded-full p-1 text-white">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
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
                        onClick={handleReplace}
                        disabled={!selectedQuestion}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Replace Question
                    </button>
                </div>
            </div>
        </div>
    );
}
