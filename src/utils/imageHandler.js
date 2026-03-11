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
