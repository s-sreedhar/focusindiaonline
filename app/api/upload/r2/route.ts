import { NextRequest, NextResponse } from 'next/server';
import { r2 } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
    try {
        const { filename, contentType } = await req.json();

        const uniqueFilename = `${uuidv4()}-${filename}`;
        const key = `pdfs/${uniqueFilename}`;

        const command = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });

        const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

        const bucketUrl = process.env.R2_PUBLIC_URL
            ? process.env.R2_PUBLIC_URL
            : `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`; // Fallback (though usually public URL is custom)

        // Ideally we want to fail if public URL is not set because fallback might not be publicly accessible
        if (!process.env.R2_PUBLIC_URL) {
            console.warn("R2_PUBLIC_URL is misting, using fallback which might not work for public access.");
        }

        return NextResponse.json({
            uploadUrl: signedUrl,
            fileUrl: `${bucketUrl}/${key}`
        });
    } catch (error) {
        console.error('Error generating signed URL:', error);
        return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
    }
}
