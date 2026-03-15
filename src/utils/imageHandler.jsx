import React from 'react';
export const handleGoogleDriveUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    if (url.includes('drive.google.com')) {
        let fileId = '';
        const patterns = [
            /\/file\/d\/([^\/?]+)/,
            /id=([^\&?]+)/,
            /open\?id=([^\&?]+)/
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                fileId = match[1];
                break;
            }
        }
        if (fileId) {
            return `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
    }
    return url;
};

export const highlightUrls = (text) => {
    if (!text || typeof text !== 'string') return text;
    
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlPattern);
    
    return parts.map((part, i) => {
        if (part.match(urlPattern)) {
            return (
                <span key={i} className="text-blue-600 font-medium break-all underline decoration-blue-200 underline-offset-2">
                    {part}
                </span>
            );
        }
        return part;
    });
};
