import React, { useRef } from 'react';
import { Upload, CheckCircle, FileSpreadsheet, X, Loader2 } from 'lucide-react';

export default function UploadForm({
    subjectCode,
    setSubjectCode,
    subjectName,
    setSubjectName,
    unit,
    setUnit,
    file,
    setFile,
    mySubjects,
    uploadedUnits,
    handleSubmit,
    loading,
    uploadStatus,
    uploadProgress,
    handleFileSelect,
    clearFile,
    isDragging,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    previewData,
    fileInputRef
}) {
    // Helper to check if unit is uploaded
    const isUnitUploaded = (unitNum) => {
        return uploadedUnits[subjectCode]?.includes(unitNum.toString()) || false;
    };

    const getUnitStatus = (unitNum) => {
        if (!subjectCode) return "available";
        return isUnitUploaded(unitNum) ? "uploaded" : "available";
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Upload Questions</h2>
                <p className="text-sm text-gray-600 mt-1">
                    {subjectCode ? `Selected: ${subjectCode} - ${subjectName}` : 'Select a subject to begin'}
                </p>
            </div>

            <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Subject Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Subject Code *
                            </label>
                            <select
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={subjectCode}
                                onChange={(e) => {
                                    const code = e.target.value;
                                    setSubjectCode(code);
                                    const selectedSubject = mySubjects.find(s => s.subjectCode === code);
                                    if (selectedSubject) {
                                        setSubjectName(selectedSubject.subjectName);
                                    } else {
                                        setSubjectName("");
                                    }
                                    setUnit(""); // Reset unit when subject changes
                                }}
                                required
                            >
                                <option value="">Select a subject</option>
                                {mySubjects.map((subject) => (
                                    <option key={subject.id} value={subject.subjectCode}>
                                        {subject.subjectCode} - {subject.subjectName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">
                                Subject Name *
                            </label>
                            <input
                                type="text"
                                placeholder="Subject Name"
                                className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 text-gray-500"
                                value={subjectName}
                                readOnly
                            />
                        </div>
                    </div>

                    {/* Unit Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Select Unit *
                            {subjectCode && uploadedUnits[subjectCode] && (
                                <span className="ml-2 text-xs text-gray-500">
                                    ({uploadedUnits[subjectCode].length}/5 units uploaded)
                                </span>
                            )}
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 4, 5].map((u) => {
                                const status = getUnitStatus(u);
                                return (
                                    <button
                                        key={u}
                                        type="button"
                                        onClick={() => setUnit(u.toString())}
                                        disabled={status === "uploaded"}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${unit === u.toString()
                                            ? 'bg-blue-600 text-white'
                                            : status === "uploaded"
                                                ? 'bg-green-100 text-green-800 cursor-not-allowed'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        title={status === "uploaded" ? "Already uploaded - Click to add more questions" : ""}
                                    >
                                        Unit {u}
                                        {status === "uploaded" && (
                                            <CheckCircle className="inline ml-1 h-3 w-3" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {subjectCode && uploadedUnits[subjectCode] && uploadedUnits[subjectCode].length > 0 && (
                            <p className="text-xs text-gray-500 mt-2">
                                Green units are already uploaded. You can still upload more questions to them.
                            </p>
                        )}
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Excel File *
                        </label>

                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`relative border-2 border-dashed rounded-xl transition cursor-pointer ${isDragging
                                ? 'border-blue-500 bg-blue-50'
                                : file
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-300 hover:border-gray-400'
                                }`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {file && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        clearFile();
                                    }}
                                    className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            <div className="p-8 text-center">
                                {file ? (
                                    <>
                                        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                                        <p className="font-medium text-green-700">{file.name}</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {(file.size / 1024).toFixed(2)} KB • {previewData.length} questions previewed
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                        <p className="font-medium text-gray-700">
                                            {isDragging ? 'Drop file here' : 'Drag & drop or click to upload'}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Only .xlsx files are supported
                                        </p>
                                    </>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx"
                                hidden
                                onChange={handleFileSelect}
                                required
                            />
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {uploadStatus && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium">
                                    {uploadStatus === 'processing' ? 'Uploading...' :
                                        uploadStatus === 'success' ? 'Upload Complete!' : 'Upload Failed'}
                                </span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${uploadStatus === 'success' ? 'bg-green-500' :
                                        uploadStatus === 'error' ? 'bg-red-500' :
                                            'bg-blue-500'
                                        }`}
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || !subjectCode || !subjectName || !unit || !file}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload size={20} />
                                {isUnitUploaded(unit) ? 'Add More Questions' : 'Upload Questions'}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
