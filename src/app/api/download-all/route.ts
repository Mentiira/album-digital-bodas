import { NextRequest, NextResponse } from 'next/server';
import { dbEdge } from '@/lib/firebase-edge';
import { collection, getDocs } from 'firebase/firestore/lite';
import JSZip from 'jszip';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
        return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    try {
        // 1. Obtener todas las fotos/videos del evento desde Firestore
        const photosRef = collection(dbEdge, `events/${eventId}/photos`);
        const snapshot = await getDocs(photosRef);
        const files = snapshot.docs.map(doc => doc.data());

        if (files.length === 0) {
            return NextResponse.json({ error: 'No files to download' }, { status: 404 });
        }

        // 2. Crear el ZIP
        const zip = new JSZip();

        // Descargar cada archivo y añadirlo al ZIP
        const downloadPromises = files.map(async (file: any, index: number) => {
            try {
                const response = await fetch(file.url);
                if (!response.ok) return;

                const blob = await response.arrayBuffer();
                const extension = file.type === 'video' ? 'mp4' : 'webp';
                const filename = `${file.userName || 'invitado'}-${index}.${extension}`;

                zip.file(filename, blob);
            } catch (err) {
                console.error("Error downloading file for zip:", err);
            }
        });

        await Promise.all(downloadPromises);

        // 3. Generar el archivo ZIP final
        const zipContent = await zip.generateAsync({ type: 'arraybuffer' });

        return new NextResponse(zipContent, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="album-${eventId}.zip"`,
            },
        });
    } catch (error) {
        console.error('Download All Error:', error);
        return NextResponse.json({ error: 'Failed to generate zip' }, { status: 500 });
    }
}
