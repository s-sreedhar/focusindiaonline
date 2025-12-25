import { NextRequest, NextResponse } from 'next/server';
import { r2 } from '@/lib/r2';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

export async function POST(req: NextRequest) {
    try {
        const { fileUrl } = await req.json();

        if (!fileUrl) {
            return NextResponse.json({ error: 'File URL is required' }, { status: 400 });
        }

        // Extract key from URL
        // URL format: https://[pub-domain]/pdfs/[filename]
        // or https://[bucket].[account].r2.cloudflarestorage.com/pdfs/[filename]
        // We fundamentally need everything after the domain/ path, assuming 'pdfs/' is part of the key.

        let key = '';
        try {
            const urlObj = new URL(fileUrl);
            // pathname includes leading slash, e.g. /pdfs/file.pdf
            // S3 key should usually not have leading slash for R2 if uploaded with 'pdfs/...' key?
            // In upload route: key = `pdfs/${uniqueFilename}`
            // URL constructed as: `${bucketUrl}/${key}`
            // So pathname is `/${key}`. We need to strip the leading slash.
            key = urlObj.pathname.substring(1);
        } catch (e) {
            console.error("Error parsing URL:", e);
            // If it's not a valid URL, maybe it's just the key?
            key = fileUrl;
        }

        if (!key) {
            return NextResponse.json({ error: 'Could not extract key from URL' }, { status: 400 });
        }

        console.log(`[R2 Delete] Deleting key: ${key}`);

        const command = new DeleteObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
        });

        await r2.send(command);

        return NextResponse.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file from R2:', error);
        return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }
}
