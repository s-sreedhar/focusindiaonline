export const uploadToCloudinary = async (file: File, folder: string = 'focusindia') => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error('Cloudinary configuration missing');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
    console.log('[Cloudinary Debug] Uploading to:', url);
    console.log('[Cloudinary Debug] Preset exists:', !!uploadPreset);

    const response = await fetch(
        url,
        {
            method: 'POST',
            body: formData,
        }
    );

    if (!response.ok) {
        const error = await response.json();
        console.error('Cloudinary Upload Error:', error);
        throw new Error(error.error?.message || error.message || 'Image upload failed');
    }

    const data = await response.json();
    return data.secure_url;
};

export const deleteFromCloudinary = async (url: string, resourceType: 'image' | 'raw' | 'video' = 'image') => {
    if (!url) return;

    // Extract public_id from URL
    // Format: https://res.cloudinary.com/[cloud_name]/[resource_type]/upload/v[version]/[folder]/[id].[ext]
    // We need [folder]/[id]

    try {
        const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
        const match = url.match(regex);

        if (match && match[1]) {
            const publicId = match[1]; // This captures 'folder/filename'

            await fetch('/api/cloudinary/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicId, resourceType }),
            });
        }
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
    }
};
