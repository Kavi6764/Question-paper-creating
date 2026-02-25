import React from 'react';
import { createPortal } from 'react-dom';
import { Shield, AlertCircle, X } from 'lucide-react';

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "info" // info, warning, danger
}) {
    if (!isOpen) return null;

    const iconColor = type === 'danger' ? 'text-red-600' : type === 'warning' ? 'text-amber-600' : 'text-blue-600';
    const bgColor = type === 'danger' ? 'bg-red-50' : type === 'warning' ? 'bg-amber-50' : 'bg-blue-50';
    const btnColor = type === 'danger' ? 'bg-red-600 hover:bg-red-700' : type === 'warning' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700';

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-scale-in">
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl ${bgColor} ${iconColor}`}>
                            <Shield className="w-6 h-6" />
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex items-center gap-3 mt-8">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all duration-200"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`flex-1 px-4 py-2.5 text-sm font-semibold text-white ${btnColor} rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-200 active:scale-95`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
