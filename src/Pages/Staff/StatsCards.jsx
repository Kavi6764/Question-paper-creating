import React from 'react';
import { Upload, BookOpen, FileText, Database } from 'lucide-react';

export default function StatsCards({ stats }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">My Subjects</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalSubjects}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                        <BookOpen className="text-blue-600 w-6 h-6" />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">Total Questions</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalQuestions}</p>
                        <p className="text-xs text-gray-500 mt-1">Across all units</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                        <FileText className="text-green-600 w-6 h-6" />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">Uploaded Today</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stats.uploadedToday}</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {new Date().toLocaleDateString()}
                        </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                        <Upload className="text-purple-600 w-6 h-6" />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600">Total Uploads</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalUploads}</p>
                        <p className="text-xs text-gray-500 mt-1">All time uploads</p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-lg">
                        <Database className="text-orange-600 w-6 h-6" />
                    </div>
                </div>
            </div>
        </div>
    );
}
