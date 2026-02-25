import React, { useState } from 'react';
import {
    Download,
    Upload,
    Database,
    AlertTriangle,
    RefreshCcw,
    FileJson,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import {
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    writeBatch,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../fireBaseConfig';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../components/ConfirmationModal';

export default function BackupRestore() {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [pendingData, setPendingData] = useState(null);

    const collectionsToBackup = [
        'users',
        'subjects',
        'questionPapers',
        'uploads',
        'activities'
    ];

    const handleExport = async () => {
        try {
            console.log("Starting backup export...");
            setIsExporting(true);
            const backupData = {
                timestamp: new Date().toISOString(),
                collections: {},
                documents: {}
            };

            // 1. Export Collections
            for (const collName of collectionsToBackup) {
                try {
                    console.log(`Exporting collection: ${collName}`);
                    const snapshot = await getDocs(collection(db, collName));
                    backupData.collections[collName] = snapshot.docs.map(doc => ({
                        id: doc.id,
                        data: doc.data()
                    }));
                    console.log(`Successfully exported ${snapshot.size} documents from ${collName}`);
                } catch (collError) {
                    console.error(`Error exporting collection ${collName}:`, collError);
                    toast.error(`Error exporting ${collName}: ${collError.message}`);
                    throw collError;
                }
            }

            // 2. Export specific documents
            try {
                console.log("Exporting college settings...");
                const settingsDoc = await getDoc(doc(db, 'Address', 'college_settings'));
                if (settingsDoc.exists()) {
                    backupData.documents['Address/college_settings'] = settingsDoc.data();
                    console.log("College settings exported");
                }
            } catch (docError) {
                console.error("Error exporting settings:", docError);
                // Don't fail the whole backup for settings
            }

            // 3. Create download
            console.log("Generating JSON blob...");
            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `exam_management_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success("Backup generated successfully!");
            console.log("Backup complete.");
        } catch (error) {
            console.error("Full export error:", error);
            toast.error(`Backup failed: ${error.message || "Unknown error"}`);
        } finally {
            setIsExporting(false);
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (!data.collections || !data.timestamp) {
                    throw new Error("Invalid backup file format");
                }
                setPendingData(data);
                setShowRestoreConfirm(true);
            } catch (error) {
                toast.error("Invalid JSON file");
                console.error("JSON error:", error);
            }
        };
        reader.readAsText(file);
        // Clear input
        e.target.value = '';
    };

    const handleRestore = async () => {
        if (!pendingData) return;

        try {
            console.log("Starting restoration process...");
            setIsImporting(true);
            const { collections, documents } = pendingData;

            // 1. Restore specific documents
            if (documents) {
                console.log("Restoring specific documents...");
                for (const [docPath, data] of Object.entries(documents)) {
                    const [coll, docId] = docPath.split('/');
                    console.log(`Restoring document: ${docPath}`);
                    await setDoc(doc(db, coll, docId), {
                        ...data,
                        restoredAt: serverTimestamp()
                    });
                }
            }

            // 2. Restore collections
            for (const [collName, docs] of Object.entries(collections)) {
                console.log(`Restoring collection: ${collName} (${docs.length} documents)`);
                // We use batches for efficiency (max 500 per batch)
                let batch = writeBatch(db);
                let count = 0;
                let totalRestored = 0;

                for (const item of docs) {
                    const docRef = doc(db, collName, item.id);
                    batch.set(docRef, item.data);
                    count++;
                    totalRestored++;

                    if (count === 400) {
                        console.log(`Committing batch for ${collName}... (${totalRestored}/${docs.length})`);
                        await batch.commit();
                        batch = writeBatch(db);
                        count = 0;
                        // Small delay to avoid hitting rate limits
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
                if (count > 0) {
                    console.log(`Committing final batch for ${collName}...`);
                    await batch.commit();
                }
                console.log(`Successfully restored ${collName}`);
            }

            console.log("Restoration complete!");
            toast.success("System restored successfully!");
            setShowRestoreConfirm(false);
        } catch (error) {
            console.error("Restore error:", error);
            toast.error(`Restoration failed: ${error.message}`);
        } finally {
            setIsImporting(false);
            setPendingData(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 animate-fade-in overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Database className="w-6 h-6 text-blue-600" /> Backup & Restore
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Manage system data and state backups</p>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Backup Section */}
                    <div className="space-y-4 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Download className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-gray-900 text-lg">Export Data</h3>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Generate a full system backup including staff members, subjects, questions, and generated papers. This will download a JSON file to your device.
                        </p>
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="w-full mt-2 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {isExporting ? (
                                <RefreshCcw className="w-5 h-5 animate-spin" />
                            ) : (
                                <FileJson className="w-5 h-5" />
                            )}
                            {isExporting ? "Generating..." : "Generate Backup"}
                        </button>
                    </div>

                    {/* Restore Section */}
                    <div className="space-y-4 p-6 bg-amber-50/50 rounded-2xl border border-amber-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                <Upload className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold text-gray-900 text-lg">Restore Data</h3>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Upload a previously generated backup JSON file to restore the system state. <span className="text-amber-700 font-bold">WARNING: This will overwrite existing data!</span>
                        </p>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileUpload}
                                disabled={isImporting}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div className="w-full py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50">
                                {isImporting ? (
                                    <RefreshCcw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <RefreshCcw className="w-5 h-5" />
                                )}
                                {isImporting ? "Restoring..." : "Restore From File"}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-start gap-4 text-gray-500">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
                        <div className="text-xs space-y-2">
                            <p className="font-semibold text-gray-700 uppercase tracking-wider">Important Notes:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>The backup includes all Firestore collections used by this application.</li>
                                <li>Large question banks may take a few moments to export/import.</li>
                                <li>For security, only administrators should have access to these files.</li>
                                <li>Restoring data is permanent and cannot be undone via this interface.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={showRestoreConfirm}
                onClose={() => setShowRestoreConfirm(false)}
                onConfirm={handleRestore}
                title="Confirm Data Restoration"
                message="Are you absolutely sure? This will overwrite the current system data with the contents of the backup file. This action cannot be undone."
                confirmText="Restore System"
                type="danger"
            />
        </div>
    );
}
