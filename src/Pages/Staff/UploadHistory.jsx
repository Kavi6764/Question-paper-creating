import React, { useState, useMemo } from 'react';
import { Search, Loader2, CheckCircle, Eye, Database, ChevronLeft, ChevronRight } from 'lucide-react';

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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                    {title} ({filteredUploads.length})
                </h2>
                {!hideControls && (
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search subject..."
                                className="text-sm border border-gray-300 rounded-lg pl-9 pr-3 py-2 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="space-y-3">
                {displayedUploads.map((upload) => (
                    <div key={upload.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                        <div className="flex items-center space-x-4">
                            <div className={`p-2 rounded-lg ${upload.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'
                                }`}>
                                {upload.status === 'completed' ?
                                    <CheckCircle className="w-5 h-5 text-green-600" /> :
                                    <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
                                }
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    {upload.subjectCode} - Unit {upload.unit}
                                </p>
                                <p className="text-sm text-gray-500">{upload.subjectName}</p>
                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                    <span>{upload.questionCount} questions</span>
                                    <span>•</span>
                                    <span>{upload.timestamp.toLocaleDateString()} {upload.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${upload.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {upload.status}
                            </span>
                            {/* Removed Eye button as view functionality might not be fully implemented yet passed down */}
                        </div>
                    </div>
                ))}

                {filteredUploads.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <Database className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p>No upload history found</p>
                        <p className="text-sm">
                            {searchTerm ? 'Try a different search term' : 'Your uploads will appear here'}
                        </p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {limit === 0 && totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUploads.length)} of {filteredUploads.length} entries
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
