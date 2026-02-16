'use client';

import React, { useRef, useState } from 'react';
import { Camera, Loader2, Upload } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, writeBatch, increment } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';

export default function UploadFab({ eventId, activeTab }: { eventId: string, activeTab: string }) {
    const { user, alias: contextAlias } = useAuth();
    const { t } = useLanguage();

    // BACKEND SÓLIDO: Si el alias del contexto no ha cargado, intentamos sacarlo de localStorage directamente
    // Esto previene que el autor aparezca como "Invitado" si el usuario sube algo justo después de recargar.
    const alias = contextAlias || (typeof window !== 'undefined' ? localStorage.getItem(`userAlias_${eventId}`) : null);

    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploadSource, setUploadSource] = useState<'camera' | 'gallery' | null>(null);
    const [currentFileIndex, setCurrentFileIndex] = useState(0);
    const [totalFiles, setTotalFiles] = useState(0);

    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, source: 'camera' | 'gallery') => {
        const files = e.target.files;
        if (!files || files.length === 0 || !user) return;

        setUploading(true);
        setUploadSource(source);
        setTotalFiles(files.length);
        setCurrentFileIndex(0);

        try {
            // Iteramos sobre cada archivo seleccionado
            for (let i = 0; i < files.length; i++) {
                setCurrentFileIndex(i + 1); // Empezamos en 1 para la UI (1/5)
                setProgress(0);

                const file = files[i];
                const isVideo = file.type.startsWith('video/');

                // --- VALIDACIÓN DE DURACIÓN DE VIDEO (30s) ---
                if (isVideo) {
                    try {
                        const duration = await new Promise<number>((resolve, reject) => {
                            const video = document.createElement('video');
                            video.preload = 'metadata';
                            video.onloadedmetadata = () => {
                                window.URL.revokeObjectURL(video.src);
                                resolve(video.duration);
                            };
                            video.onerror = () => reject('Error loading video metadata');
                            video.src = URL.createObjectURL(file);
                        });

                        if (duration > 31) { // 31 para dar un pequeño margen de error
                            toast.error(`${file.name}: ${t('videoTooLong')}`);
                            continue; // Saltamos a la siguiente foto/video
                        }
                    } catch (err) {
                        console.error("Duration check failed", err);
                    }
                }

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
                    setProgress(10);
                    try {
                        // Importación corregida para SSR seguro - aunque browser-image-compression se importó arriba,
                        // para consistencia y seguridad en algunos entornos lo cargamos asíncronamente si falla el tree-shaking
                        // Pero dado que ya tenemos el import arriba y estamos en client component, podemos usarlo directo,
                        // manteniendo el catch por si acaso.
                        // Para evitar el error de "document is not defined" que a veces ocurre con esta librería incluso en cliente al hidratar:
                        const imageCompressionLib = (await import('browser-image-compression')).default;
                        fileToUpload = (await imageCompressionLib(file, options)) as File;
                        contentType = 'image/webp';
                        extension = 'webp';
                    } catch (err) {
                        console.error("Compression failed, using original", err);
                    }
                }

                // 1. Obtener URL firmada
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
                    const contentType = res.headers.get('content-type');
                    let errorMessage = 'Error en el servidor';
                    if (contentType && contentType.includes('application/json')) {
                        const errData = await res.json();
                        errorMessage = errData.message || errorMessage;
                    }
                    toast.error(`Error con archivo ${i + 1}: ${errorMessage}`);
                    continue; // Intentamos con el siguiente archivo
                }

                const { url, key } = await res.json();

                // 2. Subida con XMLHttpRequest para tener PROGRESO REAL
                await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('PUT', url);
                    xhr.setRequestHeader('Content-Type', contentType);

                    xhr.upload.onprogress = (event) => {
                        if (event.lengthComputable) {
                            const percentComplete = Math.round((event.loaded / event.total) * 90);
                            setProgress(10 + percentComplete);
                        }
                    };

                    xhr.onload = () => {
                        if (xhr.status === 200) resolve(xhr.response);
                        else reject(new Error('Upload failed'));
                    };

                    xhr.onerror = () => reject(new Error('Network error'));
                    xhr.send(fileToUpload);
                });

                // 3. Registro en Firestore
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
                setProgress(100);
            }

            toast.success(t('uploadSuccess')); // Mensaje final global
        } catch (error) {
            console.error(error);
            toast.error(t('errorUpload'));
        } finally {
            setTimeout(() => {
                setUploading(false);
                setUploadSource(null);
                setProgress(0);
                setCurrentFileIndex(0);
            }, 500);
            if (cameraInputRef.current) cameraInputRef.current.value = '';
            if (galleryInputRef.current) galleryInputRef.current.value = '';
        }
    };

    const isVisible = activeTab === 'home' || activeTab === 'profile';

    return (
        <div className="upload-fab-group">
            {/* Inputs invisibles siempre presentes */}
            <input
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                ref={cameraInputRef}
                onChange={(e) => handleUpload(e, 'camera')}
            />
            {/* AÑADIDO: Atributo 'multiple' en la galería */}
            <input
                type="file"
                accept="image/*,video/*"
                multiple
                hidden
                ref={galleryInputRef}
                onChange={(e) => handleUpload(e, 'gallery')}
            />

            {/* Indicador de progreso flotante cuando estamos en Chat o Guests */}
            {!isVisible && uploading && (
                <div className="upload-indicator-mini shadow-lg">
                    <Loader2 className="animate-spin" size={16} />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
                        <span style={{ fontSize: 10, fontWeight: 'bold' }}>{progress}%</span>
                        <span style={{ fontSize: 8, opacity: 0.8 }}>File {currentFileIndex}/{totalFiles}</span>
                    </div>
                </div>
            )}

            {/* Los botones reales solo se ven en Album y Perfil */}
            {isVisible && (
                <div className="fab-container">
                    <button
                        className="fab-mini shadow"
                        title="Subir desde galería"
                        onClick={() => galleryInputRef.current?.click()}
                        disabled={uploading}
                    >
                        {uploading && uploadSource === 'gallery' ? (
                            <div className="progress-circle" style={{ flexDirection: 'column', lineHeight: 1 }}>
                                <span>{progress}%</span>
                                <span style={{ fontSize: 7, marginTop: 2 }}>{currentFileIndex}/{totalFiles}</span>
                            </div>
                        ) : (
                            <Upload size={28} />
                        )}
                    </button>

                    <button
                        className="fab-main premium-shadow"
                        title="Usar cámara"
                        onClick={() => cameraInputRef.current?.click()}
                        disabled={uploading}
                    >
                        {uploading && uploadSource === 'camera' ? (
                            <div className="progress-circle main-loader">
                                <Loader2 className="animate-spin" size={24} />
                                <span style={{ fontSize: 10, fontWeight: 'bold' }}>{progress}%</span>
                            </div>
                        ) : (
                            <Camera size={28} />
                        )}
                    </button>
                </div>
            )}

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
          box-shadow: 0 15px 35px rgba(0,0,0,0.15);
        }
        .upload-indicator-mini {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(45, 52, 54, 0.9);
          backdrop-filter: blur(10px);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          z-index: 3000;
          border: 1px solid rgba(255,255,255,0.1);
          animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn {
          from { transform: translateX(50px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .progress-circle {
          font-size: 11px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .main-loader {
          flex-direction: column;
          gap: 2px;
        }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}
