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
        //console.error('Cloudinary Upload Error:', error);
        throw new Error(error.error?.message || error.message || 'Image upload failed');
    }

    const data = await response.json();
    return data.secure_url;
};

export const extractPublicId = (url: string): string | null => {
    try {
        if (url.includes('cloudinary.com')) {
            const parts = url.split('/');
            const filenameWithExtension = parts[parts.length - 1];
            const publicId = filenameWithExtension.split('.')[0];
            // Handle versioned URLs (e.g., /v1234567890/folder/image.jpg)
            const regex = /\/v\d+\/(.+)\.[a-zA-Z0-9]+$/i;
            const match = url.match(regex);
            if (match && match[1]) {
                return match[1];
            }
            return publicId;
        }
        return url;
    } catch (e) {
        return null;
    }
};

export const deleteFromCloudinary = async (publicIdOrUrl: string, resourceType: string = 'image') => {
    const publicId = extractPublicId(publicIdOrUrl);
    if (!publicId) {
        throw new Error('Invalid Cloudinary URL or public ID');
    }
    try {
        const response = await fetch('/api/cloudinary/delete', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ publicId, resourceType }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Cloudinary Delete API Error:', errorData);
            throw new Error(errorData.error || 'Failed to delete from Cloudinary');
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};
