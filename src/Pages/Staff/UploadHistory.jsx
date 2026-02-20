import React, { useState, useMemo } from 'react';
import { Search, Loader2, CheckCircle, Database, ChevronLeft, ChevronRight, Clock, FileText, Calendar } from 'lucide-react';

export default function UploadHistory({ uploads, limit = 0, hideControls = false, title = "Upload History" }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Filter and Search Logic
    const filteredUploads = useMemo(() => {
        let result = uploads;

        // Search
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(upload =>
                upload.subjectCode.toLowerCase().includes(lowerTerm) ||
                upload.subjectName.toLowerCase().includes(lowerTerm)
            );
        }

        // Filter by Date
        if (filter !== "all") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            result = result.filter(upload => {
                const uploadDate = new Date(upload.timestamp);
                uploadDate.setHours(0, 0, 0, 0);

                if (filter === "today") {
                    return uploadDate.getTime() === today.getTime();
                }
                if (filter === "week") {
                    const lastWeek = new Date(today);
                    lastWeek.setDate(lastWeek.getDate() - 7);
                    return uploadDate >= lastWeek;
                }
                if (filter === "month") {
                    const lastMonth = new Date(today);
                    lastMonth.setMonth(lastMonth.getMonth() - 1);
                    return uploadDate >= lastMonth;
                }
                return true;
            });
        }

        return result;
    }, [uploads, searchTerm, filter]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredUploads.length / itemsPerPage);

    // If limit is set (e.g., for dashboard widget), just take top N and ignore pagination
    const displayedUploads = limit > 0
        ? filteredUploads.slice(0, limit)
        : filteredUploads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Reset page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filter]);

    return (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 animate-fade-in overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" /> {title}
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-medium ml-2">{filteredUploads.length}</span>
                </h2>
                {!hideControls && (
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm w-40 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 cursor-pointer"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                            <th className="px-6 py-4">Subject</th>
                            <th className="px-6 py-4">Unit Info</th>
                            <th className="px-6 py-4">Questions</th>
                            <th className="px-6 py-4">Date & Time</th>
                            <th className="px-6 py-4 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {displayedUploads.map((upload) => (
                            <tr key={upload.id} className="group hover:bg-purple-50/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">{upload.subjectCode}</p>
                                        <p className="text-xs text-gray-500">{upload.subjectName}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
                                        <Database className="w-3 h-3" /> Unit {upload.unit}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                        <FileText className="w-4 h-4 text-gray-400" />
                                        {upload.questionCount}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col text-sm text-gray-500">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" /> {upload.timestamp.toLocaleDateString()}
                                        </span>
                                        <span className="text-xs text-gray-400 ml-5">
                                            {upload.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${upload.status === 'completed'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                        : 'bg-amber-50 text-amber-700 border-amber-100'
                                        }`}>
                                        {upload.status === 'completed' ? (
                                            <>
                                                <CheckCircle className="w-3 h-3" /> Success
                                            </>
                                        ) : (
                                            <>
                                                <Loader2 className="w-3 h-3 animate-spin" /> Processing
                                            </>
                                        )}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredUploads.length === 0 && (
                    <div className="text-center py-10">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-100">
                            <Clock className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">No upload history found</p>
                        <p className="text-xs text-gray-500 mt-1">
                            {searchTerm ? 'Try adjusting your search filters' : 'Your recent uploads will appear here'}
                        </p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {limit === 0 && totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                    <p className="text-sm text-gray-500">
                        Page <span className="font-medium text-gray-900">{currentPage}</span> of <span className="font-medium text-gray-900">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
