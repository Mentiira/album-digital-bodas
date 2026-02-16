export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { dbEdge } from '@/lib/firebase-edge';
import { doc, getDoc } from 'firebase/firestore/lite';

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

// Validación preventiva para debug
if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    console.error('CRITICAL ERROR: Missing R2 environment variables:', {
        endpoint: !!R2_ENDPOINT,
        keyId: !!R2_ACCESS_KEY_ID,
        secret: !!R2_SECRET_ACCESS_KEY,
        bucket: !!R2_BUCKET_NAME
    });
}

const s3 = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT || '',
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || '',
        secretAccessKey: R2_SECRET_ACCESS_KEY || '',
    },
});


export async function POST(req: NextRequest) {
    try {
        const { filename, contentType, eventId, type = 'photo' } = await req.json();

        if (!filename || !contentType || !eventId) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // --- SEGURIDAD: Verificar límites en Firestore ---
        const eventRef = doc(dbEdge, 'events', eventId);
        const eventSnap = await getDoc(eventRef);

        if (eventSnap.exists()) {
            const data = eventSnap.data();
            const currentCount = type === 'video' ? (data.videoCount || 0) : (data.photoCount || 0);

            // LÓGICA DINÁMICA: Usa el límite de Firestore si existe, de lo contrario usa el default.
            const defaultLimit = type === 'video' ? 300 : 5000;
            const maxLimit = type === 'video' ? (data.maxVideos || defaultLimit) : (data.maxPhotos || defaultLimit);

            if (currentCount >= maxLimit) {
                return NextResponse.json({
                    error: 'Limit reached',
                    message: `Has alcanzado el límite de ${maxLimit} ${type === 'video' ? 'videos' : 'fotos'} para este evento.`
                }, { status: 403 });
            }
        }

        const key = `events/${eventId}/photos/${Date.now()}-${filename}`;

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });

        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

        return NextResponse.json({ url: signedUrl, key });
    } catch (error) {
        console.error('R2 Error:', error);
        return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 });
    }
}
