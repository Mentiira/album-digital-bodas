'use client';

import React, { useRef, useState } from 'react';
import { Camera, Loader2, Upload } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, writeBatch, increment } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';

export default function UploadFab({ eventId }: { eventId: string }) {
    const { user, alias } = useAuth();
    const { t } = useLanguage();
    const [uploading, setUploading] = useState(false);

    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setUploading(true);
        const isVideo = file.type.startsWith('video/');

        try {
            let fileToUpload = file;
            let contentType = file.type;
            let extension = isVideo ? (file.name.split('.').pop() || 'mp4') : 'webp';

            if (!isVideo) {
                const options = {
                    maxSizeMB: 1,
                    maxWidthOrHeight: 2048,
                    useWebWorker: true,
                    fileType: 'image/webp'
                };
                try {
                    fileToUpload = (await imageCompression(file, options)) as File;
                    contentType = 'image/webp';
                    extension = 'webp';
                } catch (err) {
                    console.error("Compression failed, using original", err);
                }
            }

            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: `${Date.now()}-${file.name.replace(/\.[^/.]+$/, "")}.${extension}`,
                    contentType: contentType,
                    eventId,
                    type: isVideo ? 'video' : 'photo'
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                toast.error(errData.message || 'Error en el servidor');
                return;
            }

            const { url, key } = await res.json();

            await fetch(url, {
                method: 'PUT',
                body: fileToUpload,
                headers: { 'Content-Type': contentType }
            });

            const batch = writeBatch(db);
            const contentRef = doc(collection(db, `events/${eventId}/photos`));

            batch.set(contentRef, {
                url: `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`,
                key,
                userId: user.uid,
                userName: alias,
                createdAt: serverTimestamp(),
                type: isVideo ? 'video' : 'photo'
            });

            const eventRef = doc(db, 'events', eventId);
            batch.set(eventRef, {
                [isVideo ? 'videoCount' : 'photoCount']: increment(1)
            }, { merge: true });

            await batch.commit();
            toast.success(t('uploadSuccess'));
        } catch (error) {
            console.error(error);
            toast.error(t('errorUpload'));
        } finally {
            setUploading(false);
            if (cameraInputRef.current) cameraInputRef.current.value = '';
            if (galleryInputRef.current) galleryInputRef.current.value = '';
        }
    };

    return (
        <div className="upload-fab-group">
            {/* Input para CÁMARA (Forzado por capture) */}
            <input
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                ref={cameraInputRef}
                onChange={handleUpload}
            />
            {/* Input para GALERÍA (Imágenes y Videos) */}
            <input
                type="file"
                accept="image/*,video/*"
                hidden
                ref={galleryInputRef}
                onChange={handleUpload}
            />

            <div className="fab-container">
                <button
                    className="fab-mini shadow"
                    title="Subir desde galería"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={uploading}
                >
                    <Upload size={20} />
                </button>

                <button
                    className="fab-main premium-shadow"
                    title="Usar cámara"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={uploading}
                >
                    {uploading ? <Loader2 className="animate-spin" /> : <Camera size={28} />}
                </button>
            </div>

            <style jsx>{`
        .upload-fab-group {
          position: fixed;
          bottom: 25px;
          right: 25px;
          z-index: 2000;
        }
        .fab-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }
        .fab-main {
          width: 65px;
          height: 65px;
          border-radius: 50%;
          background: #2d3436;
          color: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 15px 35px rgba(0,0,0,0.2);
        }
        .fab-mini {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: white;
          color: #2d3436;
          border: 1px solid #eee;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}
