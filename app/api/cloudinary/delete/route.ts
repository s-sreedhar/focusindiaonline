import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
    try {
        const { publicId, resourceType } = await req.json();

        if (!publicId) {
            return NextResponse.json({ error: 'Public ID is required' }, { status: 400 });
        }

        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType || 'image',
        });

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error('Cloudinary Delete Error:', error);
        return NextResponse.json({ error: error.message || 'Deletion failed' }, { status: 500 });
    }
}
