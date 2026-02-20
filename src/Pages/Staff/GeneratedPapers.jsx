import React from 'react';
import { Eye, FileText, Shield, Calendar, BookOpen, Award, Clock, Info } from 'lucide-react';

export default function GeneratedPapers({ questionPapers }) {

    const getStatusBadge = (paper) => {
        if (!paper.generatedAt) {
            return {
                label: 'Draft',
                color: 'bg-amber-50 text-amber-700 border-amber-200',
                icon: Clock
            };
        }

        return {
            label: 'Published',
            color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            icon: Shield
        };
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not scheduled';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
            {/* Header with Staff Badge */}
            <div className="px-8 py-6 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                                Question Papers
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">
                                View published question papers (Read-only access)
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
                        <Shield className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-600">Staff View • Read Only</span>
                    </div>
                </div>
            </div>

            {/* Papers List */}
            <div className="p-8">
                {questionPapers.length > 0 ? (
                    <div className="space-y-4">
                        {questionPapers.map((paper) => {
                            const status = getStatusBadge(paper);
                            const StatusIcon = status.icon;

                            return (
                                <div
                                    key={paper.id}
                                    className="group relative bg-white rounded-xl border border-slate-200 hover:border-blue-200 transition-all hover:shadow-md overflow-hidden"
                                >
                                    {/* Status color strip */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${status.label === 'Published'
                                            ? 'bg-gradient-to-b from-emerald-500 to-emerald-400'
                                            : 'bg-gradient-to-b from-amber-500 to-amber-400'
                                        }`}></div>

                                    <div className="p-6 pl-8">
                                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                            {/* Paper Info */}
                                            <div className="space-y-3 flex-1">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h3 className="text-xl font-bold text-slate-900">
                                                        {paper.title}
                                                    </h3>
                                                    <span className={`
                                                        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border
                                                        ${status.color}
                                                    `}>
                                                        <StatusIcon className="w-3.5 h-3.5" />
                                                        {status.label}
                                                    </span>
                                                </div>

                                                {/* Details Grid */}
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                            <BookOpen className="w-3.5 h-3.5" />
                                                            <span>Subject</span>
                                                        </div>
                                                        <p className="font-medium text-slate-700 text-sm">{paper.subjectCode}</p>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            <span>Exam Date</span>
                                                        </div>
                                                        <p className="font-medium text-slate-700 text-sm">{formatDate(paper.examDate)}</p>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                            <Award className="w-3.5 h-3.5" />
                                                            <span>Total Marks</span>
                                                        </div>
                                                        <p className="font-medium text-slate-700 text-sm">{paper.totalMarks}</p>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            <span>Duration</span>
                                                        </div>
                                                        <p className="font-medium text-slate-700 text-sm">{paper.duration || '3 Hours'}</p>
                                                    </div>
                                                </div>

                                                {/* Units Covered */}
                                                {paper.units && paper.units.length > 0 && (
                                                    <div className="flex items-center gap-2 pt-2">
                                                        <span className="text-xs text-slate-400">Units covered:</span>
                                                        <div className="flex gap-1">
                                                            {paper.units.map((unit) => (
                                                                <span
                                                                    key={unit}
                                                                    className="px-2 py-0.5 bg-slate-100 rounded-md text-xs text-slate-600"
                                                                >
                                                                    Unit {unit}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* View Only Button */}
                                            <div className="lg:ml-4">
                                                <button
                                                    onClick={() => window.open(`/view-paper/${paper.id}`, '_blank')}
                                                    className="
                                                        inline-flex items-center justify-center gap-2 
                        bg-blue-50 hover:bg-blue-100
                                                        text-blue-700 px-5 py-2.5 rounded-xl font-medium 
                                                        transition-all border border-blue-200
                                                        min-w-[120px] group
                                                    "
                                                    title="View paper (read-only)"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View Paper
                                                    <span className="text-xs text-blue-400 group-hover:text-blue-500 ml-1">↗</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* View Only Notice */}
                        <div className="mt-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-semibold text-blue-900 mb-1">Staff Access Only</h4>
                                    <p className="text-xs text-blue-700/70">
                                        You have read-only access to view question papers. For modifications or to generate new papers,
                                        please contact the examination department or coordinator.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="flex items-center justify-between text-sm text-slate-500 pt-2">
                            <span>Showing {questionPapers.length} question papers</span>
                            <span>Last updated: {new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                ) : (
                    // Empty State - Staff View
                    <div className="text-center py-16">
                        <div className="inline-flex p-6 bg-slate-100 rounded-3xl mb-6">
                            <FileText className="w-16 h-16 text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">
                            No Question Papers Available
                        </h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-4">
                            There are no published question papers to display at this moment.
                        </p>

                        {/* Staff Info Card */}
                        <div className="max-w-lg mx-auto mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="flex items-start gap-3 text-left">
                                <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-blue-800">
                                        <span className="font-semibold">Staff members</span> can only view published papers.
                                        Check back later when papers are released by the examination department.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto mt-8">
                            <div className="p-4 bg-slate-50 rounded-xl text-left">
                                <Eye className="w-5 h-5 text-slate-500 mb-2" />
                                <h4 className="text-sm font-semibold text-slate-900 mb-1">View Only Access</h4>
                                <p className="text-xs text-slate-500">You can view and download papers but cannot edit or generate new ones</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl text-left">
                                <Clock className="w-5 h-5 text-slate-500 mb-2" />
                                <h4 className="text-sm font-semibold text-slate-900 mb-1">Paper Release Schedule</h4>
                                <p className="text-xs text-slate-500">Papers are typically released 1 week before examination date</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Note for Staff */}
            {questionPapers.length > 0 && (
                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        You're viewing in <span className="font-medium text-slate-500">staff mode</span> - No editing permissions
                    </p>
                </div>
            )}
        </div>
    );
}