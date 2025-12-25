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
        // Handle Cloudinary URLs
        // Format: https://res.cloudinary.com/[cloud_name]/[resource_type]/[type]/[version]/[public_id].[format]
        if (url.includes('cloudinary.com')) {
            const parts = url.split('/');
            const filenameWithExtension = parts[parts.length - 1];
            const publicId = filenameWithExtension.split('.')[0];

            // If there are folders, we might need to handle them. 
            // A safer way is to regex but let's stick to simple split for now if we use flat structure.
            // Cloudinary standard: .../upload/v12345678/folder/public_id.jpg

            // Better regex approach for Cloudinary
            const regex = /\/v\d+\/(.+)\.[a-z]+$/;
            const match = url.match(regex);
            if (match && match[1]) {
                return match[1];
            }

            // Fallback for no versioning or simple structure
            return publicId;
        }
        return url; // Assume it is already a public ID if not a URL
    } catch (e) {
        return null;
    }
};

export const deleteFromCloudinary = async (publicIdOrUrl: string, resourceType: string = 'image') => {
    const publicId = extractPublicId(publicIdOrUrl);

    if (!publicId) {
        //console.error('Invalid public ID or URL for deletion');
        return;
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
            throw new Error('Failed to delete from Cloudinary');
        }

        return await response.json();
    } catch (error) {
        //console.error('Error deleting from Cloudinary:', error);
        throw error;
    }
};
