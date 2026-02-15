import React from 'react';
import { Upload, BookOpen, FileText, Database } from 'lucide-react';

export default function StatsCards({ stats }) {
    const cards = [
        {
            label: "My Subjects",
            value: stats.totalSubjects,
            subtext: "Assigned to you",
            icon: BookOpen,
            color: "blue",
            gradient: "from-blue-500 to-indigo-600"
        },
        {
            label: "Total Questions",
            value: stats.totalQuestions,
            subtext: "Across all units",
            icon: FileText,
            color: "green",
            gradient: "from-emerald-500 to-teal-600"
        },
        {
            label: "Uploaded Today",
            value: stats.uploadedToday,
            subtext: new Date().toLocaleDateString(),
            icon: Upload,
            color: "purple",
            gradient: "from-purple-500 to-pink-600"
        },
        {
            label: "Total Uploads",
            value: stats.totalUploads,
            subtext: "All time uploads",
            icon: Database,
            color: "orange",
            gradient: "from-orange-500 to-red-600"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <div key={index} className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-sm border border-white/50 hover:shadow-md transition-all duration-300 group">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                                <p className="text-3xl font-bold text-gray-900 mt-2 group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-gray-900 group-hover:to-gray-700 transition-all">
                                    {card.value}
                                </p>
                                <p className="text-xs text-gray-400 mt-1 font-medium">
                                    {card.subtext}
                                </p>
                            </div>
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg shadow-${card.color}-500/20 text-white transform group-hover:scale-110 transition-transform duration-300`}>
                                <Icon className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
