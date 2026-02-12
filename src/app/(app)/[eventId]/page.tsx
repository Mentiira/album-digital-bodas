'use client';

export const runtime = 'edge';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import GuestAccess from '@/components/GuestAccess';
import LanguageSelector from '@/components/LanguageSelector';
import UploadFab from '@/components/UploadFab';
import ChatView from '@/components/ChatView';
import { db } from '@/lib/firebase';
import { doc, deleteDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Image as ImageIcon, MessageSquare, Calendar, Users, User, X, Download, Play, ChevronLeft, Bell, Trophy, Crown, Plus, Trash2, Loader2, Archive, AlertCircle } from 'lucide-react';
import { use } from 'react';
import { toast } from 'sonner';

type Tab = 'home' | 'chat' | 'guests' | 'profile';

export default function EventPage({ params: paramsPromise }: { params: Promise<{ eventId: string }> }) {
    const params = use(paramsPromise);
    const { user, alias, isAdmin, setIsAdmin, loading } = useAuth();
    const { t } = useLanguage();

    const [activeTab, setActiveTab] = useState<Tab>('home');
    const [photos, setPhotos] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [selected, setSelected] = useState<any | null>(null);
    const [visibleCount, setVisibleCount] = useState(12);
    const [deleting, setDeleting] = useState(false);

    React.useEffect(() => {
        // Asegurar que el cargador inicial desaparezca al montar el acceso
        document.body.classList.add('loaded');
    }, []);
    const [downloadingZip, setDownloadingZip] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [eventData, setEventData] = useState<any>(null);
    const [eventLoading, setEventLoading] = useState(true);

    useEffect(() => {
        // Asegurar que el cargador inicial desaparezca al montar la página
        document.body.classList.add('loaded');
        if (!params.eventId || !user) return;

        // La validación del alias ahora es reactiva en el render

        // Cargar Datos del Evento
        const unsubE = onSnapshot(doc(db, 'events', params.eventId), (doc) => {
            if (doc.exists()) {
                setEventData(doc.data());
            }
            setEventLoading(false);
        });

        const qPhotos = query(collection(db, `events/${params.eventId}/photos`), orderBy('createdAt', 'desc'));
        const unsubP = onSnapshot(qPhotos, s => setPhotos(s.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

        // Cargar Invitados Específicos de este evento
        const qGuests = query(collection(db, `events/${params.eventId}/guests`), orderBy('updatedAt', 'desc'));
        const unsubU = onSnapshot(qGuests, s => {
            const guestsList = s.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(guestsList);

            // Verificar si el usuario actual es ADMIN en ESTE evento
            const currentUserInEvent = guestsList.find(g => g.id === user.uid);
            if (currentUserInEvent) {
                // @ts-ignore
                setIsAdmin(currentUserInEvent.role === 'admin');
            } else {
                setIsAdmin(false);
            }
        });

        return () => { unsubE(); unsubP(); unsubU(); };
    }, [params.eventId, user, setIsAdmin]);

    const handleDownload = (url: string, type: 'photo' | 'video' = 'photo') => {
        const extension = type === 'video' ? 'mp4' : 'webp';
        const filename = `recuerdo-${Date.now()}.${extension}`;
        const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;

        // Creamos un link invisible pero apuntando a nuestra propia API
        const link = document.createElement('a');
        link.href = downloadUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDeletePhoto = async () => {
        if (!selected) return;
        setDeleting(true);
        try {
            await deleteDoc(doc(db, `events/${params.eventId}/photos`, selected.id));
            setSelected(null);
            setShowDeleteModal(false);
            toast.success('Eliminado correctamente');
        } catch (error) {
            console.error(error);
            toast.error('Error al eliminar');
        } finally {
            setDeleting(false);
        }
    };

    const handleDownloadAll = async () => {
        setDownloadingZip(true);
        try {
            const downloadUrl = `/api/download-all?eventId=${params.eventId}`;
            const link = document.createElement('a');
            link.href = downloadUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error(error);
            toast.error('Error al generar ZIP');
        } finally {
            setDownloadingZip(false);
        }
    };

    if (loading || eventLoading) return null;
    if (!eventData) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F7F2', textAlign: 'center', padding: 20 }}>
            <div>
                <AlertCircle size={48} color="#B8860B" style={{ marginBottom: 20 }} />
                <h2 className="serif">{t('weddingOf') === 'Boda de' ? 'Evento no encontrado' : 'Event not found'}</h2>
                <p style={{ opacity: 0.6 }}>Por favor verifica el link.</p>
            </div>
        </div>
    );

    // Alias reactivo: buscamos en el estado global o en el almacenamiento local de este evento
    const eventAlias = alias || (typeof window !== 'undefined' ? localStorage.getItem(`userAlias_${params.eventId}`) : null);

    if (!eventAlias) return <GuestAccess eventId={params.eventId} />;

    // Lógica de Ranking de Invitados (Solo los que han subido algo en ESTE evento)
    const eventUsers = users.filter(u => photos.some(p => p.userId === u.id));

    const sortedUsers = [...eventUsers].sort((a, b) => {
        const countA = photos.filter(p => p.userId === a.id).length;
        const countB = photos.filter(p => p.userId === b.id).length;
        return countB - countA;
    });

    const top3 = sortedUsers.slice(0, 3);
    const restOfGuests = sortedUsers.slice(3, 13); // Mostrar hasta 10 invitados adicionales (del 4 al 13)

    return (
        <div className="app-container">
            {/* 1. VISOR MODAL */}
            {selected && (
                <div className="viewer-fixed" style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column' }}>
                    <div className="viewer-header" style={{ padding: '25px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                            <button onClick={() => handleDownload(selected.url, selected.type)} style={{ background: 'none', border: 'none', color: '#2d3436', cursor: 'pointer' }}><Download size={28} /></button>
                            {(selected.userId === user?.uid || isAdmin) && (
                                <button onClick={() => setShowDeleteModal(true)} disabled={deleting} style={{ background: 'none', border: 'none', color: '#ff7675', cursor: 'pointer' }}>
                                    <Trash2 size={24} />
                                </button>
                            )}
                        </div>
                        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#2d3436', cursor: 'pointer' }}><X size={40} /></button>
                    </div>
                    <div className="viewer-body" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
                        {selected.type === 'video' ? (
                            <video src={selected.url} controls autoPlay playsInline style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 20, boxShadow: '0 25px 60px rgba(0,0,0,0.15)' }} />
                        ) : (
                            <img src={selected.url} alt="Full view" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 20, boxShadow: '0 25px 60px rgba(0,0,0,0.15)', objectFit: 'contain' }} />
                        )}
                    </div>
                    <div style={{ padding: '30px', textAlign: 'center', color: '#2d3436' }}>
                        <p className="serif" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>{selected.userName}</p>
                    </div>
                </div>
            )}

            {/* 2. HERO */}
            <div style={{ height: '35vh', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: "url('https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80') center/cover" }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', padding: 25 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <LanguageSelector />
                        <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', display: 'grid', placeItems: 'center' }}><Bell size={18} /></button>
                    </div>
                    <div style={{ marginTop: 'auto', textAlign: 'center', paddingBottom: 15 }}>
                        <h1 className="serif" style={{ margin: 0, fontSize: '2.2rem', color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                            {eventData.title || 'Nuestra Boda'}
                        </h1>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', margin: '8px 0', fontWeight: '400', letterSpacing: 1 }}>
                            {eventData.date || 'Próximamente'}
                        </p>
                        <div style={{ display: 'inline-block', background: 'rgba(184, 134, 11, 0.25)', backdropFilter: 'blur(10px)', color: 'white', padding: '8px 20px', borderRadius: 25, fontSize: 12, border: '1px solid rgba(184, 134, 11, 0.4)', fontWeight: '500', marginTop: 12 }}>
                            <span style={{ opacity: 0.9 }}>{t('weddingOf') === 'Boda de' ? 'Invitado' : 'Guest'}:</span> {eventAlias}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. NAVEGACIÓN */}
            <div className="tab-nav-wrapper" style={{ background: '#F8F7F2', borderBottom: '1px solid #EFECE5' }}>
                <div className="tabs-row">
                    <button className={`t-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
                        <ImageIcon size={26} color={activeTab === 'home' ? '#B8860B' : '#8E8E8E'} />
                        <span style={{ color: activeTab === 'home' ? '#B8860B' : '#8E8E8E', fontWeight: activeTab === 'home' ? '600' : '400' }}>{t('album')}</span>
                    </button>
                    <button className={`t-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
                        <MessageSquare size={26} color={activeTab === 'chat' ? '#B8860B' : '#8E8E8E'} />
                        <span style={{ color: activeTab === 'chat' ? '#B8860B' : '#8E8E8E', fontWeight: activeTab === 'chat' ? '600' : '400' }}>{t('chat')}</span>
                    </button>
                    <button className={`t-item ${activeTab === 'guests' ? 'active' : ''}`} onClick={() => setActiveTab('guests')}>
                        <Users size={26} color={activeTab === 'guests' ? '#B8860B' : '#8E8E8E'} />
                        <span style={{ color: activeTab === 'guests' ? '#B8860B' : '#8E8E8E', fontWeight: activeTab === 'guests' ? '600' : '400' }}>{t('guests')}</span>
                    </button>
                    <button className={`t-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                        <User size={26} color={activeTab === 'profile' ? '#B8860B' : '#8E8E8E'} />
                        <span style={{ color: activeTab === 'profile' ? '#B8860B' : '#8E8E8E', fontWeight: activeTab === 'profile' ? '600' : '400' }}>{t('profile')}</span>
                    </button>
                </div>
            </div>

            {/* 4. CONTENIDO */}
            <div className="tab-content" style={{ background: '#F8F7F2', minHeight: '65vh' }}>
                {activeTab === 'home' && (
                    <div style={{ padding: 15 }}>
                        <h3 className="serif" style={{ marginBottom: 20, textAlign: 'center', fontSize: '1.5rem' }}>{t('liveGallery')}</h3>
                        <div className="photo-grid">
                            {photos.slice(0, visibleCount).map(p => (
                                <div key={p.id} onClick={() => setSelected(p)} className={p.type === 'video' ? 'vid-card' : 'photo-card'} style={p.type === 'video' ? {} : { backgroundImage: `url(${p.url})` }}>
                                    {p.type === 'video' && (
                                        <>
                                            <video
                                                src={p.url + "#t=0.5"}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                                                muted
                                                playsInline
                                                preload="metadata"
                                            />
                                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', display: 'grid', placeItems: 'center' }}>
                                                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(6px)', display: 'grid', placeItems: 'center', border: '1px solid rgba(255,255,255,0.35)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                                                    <Play fill="white" color="white" size={18} strokeWidth={1.5} style={{ marginLeft: 3 }} />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                    <div style={{ position: 'absolute', bottom: 5, left: 5, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', color: 'white', padding: '2px 8px', borderRadius: 8, fontSize: 10, zIndex: 2, fontWeight: 'bold' }}>
                                        {p.userName || 'Invitado'}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {photos.length > visibleCount && (
                            <button onClick={() => setVisibleCount(prev => prev + 12)} style={{ width: '100%', padding: 18, marginTop: 20, borderRadius: 15, border: '1px solid #e0e0e0', background: '#fff', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#222', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}><Plus size={18} /> {t('loadMore')}</button>
                        )}
                    </div>
                )}

                {activeTab === 'chat' && <ChatView eventId={params.eventId} />}


                {activeTab === 'guests' && (
                    <div style={{ padding: 20 }}>
                        <h2 className="serif" style={{ textAlign: 'center', marginBottom: 25 }}>{t('guests')}</h2>

                        {/* PODIO VISUAL (Top 3) */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 12, marginBottom: 45, padding: '0 10px' }}>
                            {/* Plata (2ndo) */}
                            {top3[1] && <div style={{ textAlign: 'center' }}><div style={{ position: 'relative' }}><div style={{ width: 55, height: 55, borderRadius: 30, background: '#dfe6e9', display: 'grid', placeItems: 'center', fontWeight: 'bold', borderWidth: '2px', borderStyle: 'solid', borderColor: '#b2bec3' }}><span>{top3[1].alias?.[0].toUpperCase()}</span></div><div style={{ position: 'absolute', top: -5, right: -5, background: '#b2bec3', color: 'white', width: 22, height: 22, borderRadius: 11, fontSize: 10, display: 'grid', placeItems: 'center', fontWeight: 'bold' }}>2</div></div><p style={{ fontSize: 11, marginTop: 8, fontWeight: 'bold', color: '#636e72', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{top3[1].alias}</p></div>}

                            {/* Oro (1ero) */}
                            {top3[0] && <div style={{ textAlign: 'center', transform: 'translateY(-15px)' }}><div style={{ position: 'relative' }}><Crown style={{ position: 'absolute', top: -22, left: 0, right: 0, margin: 'auto', color: '#f1c40f' }} size={26} fill="#f1c40f" /><div style={{ width: 80, height: 80, borderRadius: 40, background: '#ffeaa7', display: 'grid', placeItems: 'center', fontWeight: 'bold', borderWidth: '3px', borderStyle: 'solid', borderColor: '#fdcb6e', fontSize: '1.5rem', boxShadow: '0 10px 20px rgba(253, 203, 110, 0.2)' }}><span>{top3[0].alias?.[0].toUpperCase()}</span></div><div style={{ position: 'absolute', top: -8, right: -8, background: '#fdcb6e', color: 'white', width: 30, height: 30, borderRadius: 15, fontSize: 13, display: 'grid', placeItems: 'center', fontWeight: 'bold' }}><Trophy size={18} /></div></div><p style={{ fontSize: 14, marginTop: 10, fontWeight: 'bold', color: '#2d3436', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{top3[0].alias}</p></div>}

                            {/* Bronce (3ero) */}
                            {top3[2] && <div style={{ textAlign: 'center' }}><div style={{ position: 'relative' }}><div style={{ width: 55, height: 55, borderRadius: 30, background: '#fab1a0', display: 'grid', placeItems: 'center', fontWeight: 'bold', borderWidth: '2px', borderStyle: 'solid', borderColor: '#e17055' }}><span>{top3[2].alias?.[0].toUpperCase()}</span></div><div style={{ position: 'absolute', top: -5, right: -5, background: '#e17055', color: 'white', width: 22, height: 22, borderRadius: 11, fontSize: 10, display: 'grid', placeItems: 'center', fontWeight: 'bold' }}>3</div></div><p style={{ fontSize: 11, marginTop: 8, fontWeight: 'bold', color: '#d63031', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{top3[2].alias}</p></div>}
                        </div>

                        {/* LISTA DE SIGUIENTES (Ranking 4-13) */}
                        <div className="guest-list-v2">
                            {restOfGuests.map((u, index) => (
                                <div key={u.id} className="g-card" style={{ display: 'flex', alignItems: 'center', gap: 15, padding: 18, background: 'rgba(255,255,255,0.4)', borderRadius: 20, marginBottom: 12, border: '1px solid #EFECE5', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                                    <div style={{ fontSize: 14, fontWeight: 'bold', color: '#aaa', width: 20 }}>{index + 4}</div>
                                    <div className="g-avatar" style={{ width: 45, height: 45, borderRadius: 25, background: '#2d3436', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 'bold' }}>{u.alias?.[0]?.toUpperCase()}</div>
                                    <div style={{ flex: 1 }}><h4 style={{ margin: 0, fontSize: '1rem' }}>{u.alias}</h4><p style={{ margin: 0, fontSize: 13, color: '#888', marginTop: 2 }}>{photos.filter(p => p.userId === u.id).length} {t('photosShort')}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div style={{ padding: 0 }}>
                        <div style={{ padding: '50px 20px', textAlign: 'center', background: '#F8F7F2', borderBottom: '1px solid #EFECE5' }}>
                            <div style={{ width: 90, height: 90, borderRadius: 45, background: '#2d3436', color: 'white', display: 'grid', placeItems: 'center', fontSize: 35, margin: '0 auto 20px', fontFamily: 'serif', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                                {eventAlias?.[0].toUpperCase() || 'U'}
                            </div>
                            <h1 className="serif" style={{ margin: 0, fontSize: '1.8rem' }}>{eventAlias}</h1>
                            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                                <div style={{ display: 'flex', gap: 30 }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <strong style={{ display: 'block', fontSize: 24, color: '#2d3436' }}>{photos.filter(p => p.userId === user?.uid).length}</strong>
                                        <span style={{ fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>{t('photosUploaded')}</span>
                                    </div>
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={handleDownloadAll}
                                        disabled={downloadingZip}
                                        style={{ background: '#2d3436', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 30, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 'bold', fontSize: 14, boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}
                                    >
                                        {downloadingZip ? <Loader2 className="animate-spin" size={18} /> : <Archive size={18} />}
                                        {t('downloadAll')}
                                    </button>
                                )}
                            </div>
                        </div>
                        <div style={{ padding: 25 }}>
                            <h3 className="serif" style={{ marginBottom: 20 }}>{t('myPhotos')}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                {photos.filter(p => p.userId === user?.uid).map(p => (
                                    <div key={p.id} onClick={() => setSelected(p)} style={{ aspectRatio: 1, borderRadius: 15, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#f1f3f5', backgroundImage: p.type === 'video' ? '' : `url(${p.url})`, display: 'grid', placeItems: 'center', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                                        {p.type === 'video' && (
                                            <>
                                                <video
                                                    src={p.url + "#t=0.5"}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                                                    muted
                                                    playsInline
                                                    preload="metadata"
                                                />
                                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)', display: 'grid', placeItems: 'center' }}>
                                                    <Play size={18} fill="white" color="white" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {photos.filter(p => p.userId === user?.uid).length === 0 && <p style={{ textAlign: 'center', color: '#bbb', padding: '50px 0' }}>{t('noPhotosProfile')}</p>}
                        </div>
                    </div>
                )}
            </div>

            {/* 5. SUBIDA (FAB) - Fuera para persistencia de carga entre pestañas */}
            <UploadFab eventId={params.eventId} activeTab={activeTab} />

            {/* 6. MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
            {showDeleteModal && (
                <div className="confirm-modal-overlay">
                    <div className="confirm-modal-card">
                        <div style={{ marginBottom: 20, color: '#ff7675' }}>
                            <Trash2 size={48} />
                        </div>
                        <h3 className="serif" style={{ fontSize: '1.4rem', marginBottom: 10 }}>¿Eliminar recuerdo?</h3>
                        <p style={{ color: '#636e72', fontSize: 14, lineHeight: 1.6, marginBottom: 30 }}>Esta acción no se puede deshacer. El video o foto desaparecerá del álbum para siempre.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                            <button
                                onClick={handleDeletePhoto}
                                disabled={deleting}
                                style={{ background: '#ff7675', color: 'white', border: 'none', padding: '16px', borderRadius: 15, fontWeight: 'bold', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                            >
                                {deleting ? <Loader2 className="animate-spin" size={18} /> : null}
                                {deleting ? 'Eliminando...' : 'Sí, eliminar permanentemente'}
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={deleting}
                                style={{ background: '#f1f2f6', color: '#2d3436', border: 'none', padding: '16px', borderRadius: 15, fontWeight: 'bold', fontSize: 15 }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .serif { font-family: 'Playfair Display', serif; }
                .shadow-sm { box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .t-item span { font-size: 10px; font-weight: 700; margin-top: 2px; }
                .vid-card { position: relative; background: #000; border-radius: 15px; display: grid; place-items: center; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
                .photo-card { position: relative; border-radius: 15px; background-size: cover; background-position: center; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
                
                .confirm-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.4);
                    backdrop-filter: blur(5px);
                    z-index: 1000000;
                    display: grid;
                    place-items: center;
                    padding: 20px;
                }
                .confirm-modal-card {
                    background: white;
                    width: 100%;
                    max-width: 340px;
                    border-radius: 30px;
                    padding: 35px 25px;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
                    animation: modalIn 0.3s ease-out;
                }
                @keyframes modalIn {
                    from { transform: scale(0.9); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
