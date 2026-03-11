export const uploadToR2 = async (file: File): Promise<string> => {
    try {
        const response = await fetch('/api/upload/r2', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filename: file.name,
                contentType: file.type
            })
        });

        if (!response.ok) throw new Error('Failed to get upload URL');

        const { uploadUrl, fileUrl } = await response.json();

        const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type }
        });

        if (!uploadRes.ok) {
            throw new Error(`R2 Upload failed: ${uploadRes.statusText}`);
        }

        return fileUrl;
    } catch (error) {
        console.error("Upload Error:", error);
        throw error;
    }
};

export const deleteFromR2 = async (fileUrl: string): Promise<void> => {
    try {
        const response = await fetch('/api/upload/r2/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileUrl }),
        });

        if (!response.ok) {
            throw new Error('Failed to delete from R2');
        }
    } catch (error) {
        console.error("Delete Error:", error);
        throw error;
    }
};
