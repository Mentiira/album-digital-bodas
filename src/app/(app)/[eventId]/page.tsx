'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import GuestAccess from '@/components/GuestAccess';
import LanguageSelector from '@/components/LanguageSelector';
import UploadFab from '@/components/UploadFab';
import ChatView from '@/components/ChatView';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Image as ImageIcon, MessageSquare, Calendar, Users, User, X, Download, Play, ChevronLeft, Bell, Trophy, Crown, Plus } from 'lucide-react';
import { use } from 'react';

type Tab = 'home' | 'chat' | 'itinerary' | 'guests' | 'profile';

export default function EventPage({ params: paramsPromise }: { params: Promise<{ eventId: string }> }) {
    const params = use(paramsPromise);
    const { user, alias, loading } = useAuth();
    const { t } = useLanguage();

    const [activeTab, setActiveTab] = useState<Tab>('home');
    const [photos, setPhotos] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [selected, setSelected] = useState<any | null>(null);
    const [visibleCount, setVisibleCount] = useState(12);

    useEffect(() => {
        if (!params.eventId) return;
        const qPhotos = query(collection(db, `events/${params.eventId}/photos`), orderBy('createdAt', 'desc'));
        const unsubP = onSnapshot(qPhotos, s => setPhotos(s.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

        const qUsers = query(collection(db, 'users'), orderBy('updatedAt', 'desc'));
        const unsubU = onSnapshot(qUsers, s => setUsers(s.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

        return () => { unsubP(); unsubU(); };
    }, [params.eventId]);

    const handleDownload = (url: string) => {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('download', 'boda-recuerdo.webp');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="loading-screen">Cargando...</div>;
    if (!alias) return <GuestAccess />;

    return (
        <div className="app-container">
            {/* 1. VISOR MODAL (REFINE: Fondo transparente, blur, botones invertidos) */}
            {selected && (
                <div className="viewer-fixed" style={{ background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column' }}>
                    <div className="viewer-header" style={{ padding: '25px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button onClick={() => handleDownload(selected.url)} style={{ background: 'none', border: 'none', color: '#2d3436', cursor: 'pointer' }}><Download size={28} /></button>
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
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), white)', display: 'flex', flexDirection: 'column', padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <LanguageSelector />
                        <button style={{ width: 40, height: 40, borderRadius: '50%', background: 'white', border: 'none', display: 'grid', placeItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}><Bell size={18} /></button>
                    </div>
                    <div style={{ marginTop: 'auto', textAlign: 'center', paddingBottom: 10 }}>
                        <h1 className="serif" style={{ margin: 0, fontSize: '2rem' }}>{t('eventTitle')}</h1>
                        <p style={{ fontSize: 14, color: '#444', margin: '6px 0' }}>{t('eventDate')}</p>
                        <div style={{ display: 'inline-block', background: '#fff9db', color: '#f08c00', padding: '4px 14px', borderRadius: 20, fontSize: 11, border: '1px solid #ffe066', fontWeight: '600' }}>{t('anonymousMode')}</div>
                    </div>
                </div>
            </div>

            {/* 3. NAVEGACIÓN (STICKY) */}
            <div className="tab-nav-wrapper shadow-sm">
                <div className="tabs-row">
                    <button className={`t-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}><ImageIcon size={20} /> <span>Álbum</span></button>
                    <button className={`t-item ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}><MessageSquare size={20} /> <span>Chat</span></button>
                    <button className={`t-item ${activeTab === 'itinerary' ? 'active' : ''}`} onClick={() => setActiveTab('itinerary')}><Calendar size={20} /> <span>Agenda</span></button>
                    <button className={`t-item ${activeTab === 'guests' ? 'active' : ''}`} onClick={() => setActiveTab('guests')}><Users size={20} /> <span>Invitados</span></button>
                    <button className={`t-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}><User size={20} /> <span>Perfil</span></button>
                </div>
            </div>

            {/* 4. CONTENIDO */}
            <div className="tab-content" style={{ background: 'white' }}>
                {activeTab === 'home' && (
                    <div style={{ padding: 15 }}>
                        <h3 className="serif" style={{ marginBottom: 15 }}>{t('liveGallery')}</h3>
                        <div className="photo-grid">
                            {photos.slice(0, visibleCount).map(p => (
                                <div key={p.id} onClick={() => setSelected(p)} className={p.type === 'video' ? 'vid-card' : 'photo-card'} style={p.type === 'video' ? {} : { backgroundImage: `url(${p.url})` }}>
                                    {p.type === 'video' && <Play fill="white" size={24} />}
                                    <div style={{ position: 'absolute', bottom: 5, left: 5, background: 'rgba(0,0,0,0.3)', color: 'white', padding: '2px 8px', borderRadius: 8, fontSize: 10 }}>{p.userName}</div>
                                </div>
                            ))}
                        </div>

                        {photos.length > visibleCount && (
                            <button
                                onClick={() => setVisibleCount(prev => prev + 12)}
                                style={{ width: '100%', padding: 18, marginTop: 20, borderRadius: 15, border: '1px solid #e0e0e0', background: '#fff', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#222', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                            >
                                <Plus size={18} /> {t('loadMore')}
                            </button>
                        )}
                    </div>
                )}

                {activeTab === 'chat' && <ChatView eventId={params.eventId} />}

                {activeTab === 'itinerary' && (
                    <div style={{ padding: 30 }}>
                        <h2 className="serif" style={{ textAlign: 'center', marginBottom: 25 }}>{t('itinerary')}</h2>
                        <div style={{ borderLeft: '2px solid #f0f0f0', marginLeft: 15, paddingLeft: 25 }}>
                            <div style={{ position: 'relative', marginBottom: 25 }}><div style={{ position: 'absolute', left: -31, top: 6, width: 12, height: 12, background: '#2d3436', borderRadius: 6, border: '2px solid white', boxShadow: '0 0 0 2px #f0f0f0' }} /><span style={{ fontSize: 13, fontWeight: 'bold', color: '#fab1a0' }}>17:00</span><h4 style={{ margin: '4px 0', fontSize: '1.1rem' }}>{t('ceremony')}</h4><p style={{ fontSize: 14, color: '#888' }}>{t('ceremonyVenue')}</p></div>
                            <div style={{ position: 'relative', marginBottom: 25 }}><div style={{ position: 'absolute', left: -31, top: 6, width: 12, height: 12, background: '#2d3436', borderRadius: 6, border: '2px solid white', boxShadow: '0 0 0 2px #f0f0f0' }} /><span style={{ fontSize: 13, fontWeight: 'bold', color: '#fab1a0' }}>19:00</span><h4 style={{ margin: '4px 0', fontSize: '1.1rem' }}>{t('reception')}</h4><p style={{ fontSize: 14, color: '#888' }}>{t('receptionVenue')}</p></div>
                        </div>
                    </div>
                )}

                {activeTab === 'guests' && (
                    <div style={{ padding: 20 }}>
                        <h2 className="serif" style={{ textAlign: 'center', marginBottom: 25 }}>{t('guests')}</h2>

                        {/* TOP 3 INVITADOS (PODIO) */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 12, marginBottom: 45, padding: '0 10px' }}>
                            {(() => {
                                const sorted = [...users].sort((a, b) => photos.filter(p => p.userId === b.id).length - photos.filter(p => p.userId === a.id).length);
                                const top3 = sorted.slice(0, 3);
                                return (
                                    <>
                                        {/* Plata (2ndo) */}
                                        {top3[1] && <div style={{ textAlign: 'center' }}><div style={{ position: 'relative' }}><div style={{ width: 55, height: 55, borderRadius: 30, background: '#dfe6e9', display: 'grid', placeItems: 'center', fontWeight: 'bold', border: '2px solid #b2bec3' }}><span>{top3[1].alias?.[0].toUpperCase()}</span></div><div style={{ position: 'absolute', top: -5, right: -5, background: '#b2bec3', color: 'white', width: 22, height: 22, borderRadius: 11, fontSize: 10, display: 'grid', placeItems: 'center', fontWeight: 'bold' }}>2</div></div><p style={{ fontSize: 11, marginTop: 8, fontWeight: 'bold', color: '#636e72', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{top3[1].alias}</p></div>}

                                        {/* Oro (1ero) */}
                                        {top3[0] && <div style={{ textAlign: 'center', transform: 'translateY(-15px)' }}><div style={{ position: 'relative' }}><Crown style={{ position: 'absolute', top: -22, left: 0, right: 0, margin: 'auto', color: '#f1c40f' }} size={26} fill="#f1c40f" /><div style={{ width: 80, height: 80, borderRadius: 40, background: '#ffeaa7', display: 'grid', placeItems: 'center', fontWeight: 'bold', border: '3px solid #fdcb6e', fontSize: '1.5rem', boxShadow: '0 10px 20px rgba(253, 203, 110, 0.2)' }}><span>{top3[0].alias?.[0].toUpperCase()}</span></div><div style={{ position: 'absolute', top: -8, right: -8, background: '#fdcb6e', color: 'white', width: 30, height: 30, borderRadius: 15, fontSize: 13, display: 'grid', placeItems: 'center', fontWeight: 'bold' }}><Trophy size={18} /></div></div><p style={{ fontSize: 14, marginTop: 10, fontWeight: 'bold', color: '#2d3436', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{top3[0].alias}</p></div>}

                                        {/* Bronce (3ero) */}
                                        {top3[2] && <div style={{ textAlign: 'center' }}><div style={{ position: 'relative' }}><div style={{ width: 55, height: 55, borderRadius: 30, background: '#fab1a0', display: 'grid', placeItems: 'center', fontWeight: 'bold', border: '2px solid #e17055' }}><span>{top3[2].alias?.[0].toUpperCase()}</span></div><div style={{ position: 'absolute', top: -5, right: -5, background: '#e17055', color: 'white', width: 22, height: 22, borderRadius: 11, fontSize: 10, display: 'grid', placeItems: 'center', fontWeight: 'bold' }}>3</div></div><p style={{ fontSize: 11, marginTop: 8, fontWeight: 'bold', color: '#d63031', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{top3[2].alias}</p></div>}
                                    </>
                                );
                            })()}
                        </div>

                        <div className="guest-list-v2">
                            {users.map(u => (
                                <div key={u.id} className="g-card" style={{ display: 'flex', alignItems: 'center', gap: 15, padding: 18, background: '#fcfcfc', borderRadius: 20, marginBottom: 12, border: '1px solid #f0f0f0', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                                    <div className="g-avatar" style={{ width: 50, height: 50, borderRadius: 25, background: '#2d3436', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 'bold', fontSize: '1.1rem' }}>{u.alias?.[0]?.toUpperCase()}</div>
                                    <div style={{ flex: 1 }}><h4 style={{ margin: 0, fontSize: '1rem' }}>{u.alias}</h4><p style={{ margin: 0, fontSize: 13, color: '#888', marginTop: 2 }}>{photos.filter(p => p.userId === u.id).length} {t('photosShort')}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div style={{ padding: 0 }}>
                        <div style={{ padding: '50px 20px', textAlign: 'center', background: '#fcfcfc', borderBottom: '1px solid #f0f0f0' }}>
                            <div style={{ width: 90, height: 90, borderRadius: 45, background: '#2d3436', color: 'white', display: 'grid', placeItems: 'center', fontSize: 35, margin: '0 auto 20px', fontFamily: 'serif', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>{alias?.[0].toUpperCase()}</div>
                            <h1 className="serif" style={{ margin: 0, fontSize: '1.8rem' }}>{alias}</h1>
                            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 30 }}>
                                <div style={{ textAlign: 'center' }}>
                                    <strong style={{ display: 'block', fontSize: 24, color: '#2d3436' }}>{photos.filter(p => p.userId === user?.uid).length}</strong>
                                    <span style={{ fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: 1 }}>{t('photosUploaded')}</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: 25 }}>
                            <h3 className="serif" style={{ marginBottom: 20 }}>{t('myPhotos')}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                {photos.filter(p => p.userId === user?.uid).map(p => (
                                    <div key={p.id} onClick={() => setSelected(p)} style={{ aspectRatio: 1, borderRadius: 15, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#f1f3f5', backgroundImage: p.type === 'video' ? '' : `url(${p.url})`, display: 'grid', placeItems: 'center', position: 'relative', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>{p.type === 'video' && <Play size={18} fill="black" />}</div>
                                ))}
                            </div>
                            {photos.filter(p => p.userId === user?.uid).length === 0 && <p style={{ textAlign: 'center', color: '#bbb', padding: '50px 0' }}>{t('noPhotosProfile')}</p>}
                        </div>
                    </div>
                )}
            </div>

            {/* 5. SUBIDA (FAB) */}
            {(activeTab === 'home' || activeTab === 'profile') && (
                <UploadFab eventId={params.eventId} />
            )}

            <style jsx>{`
                .serif { font-family: 'Playfair Display', serif; }
                .shadow-sm { box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .t-item span { font-size: 10px; font-weight: 700; margin-top: 2px; }
                .vid-card { position: relative; background: #000; border-radius: 15px; display: grid; place-items: center; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
                .photo-card { position: relative; border-radius: 15px; background-size: cover; background-position: center; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
            `}</style>
        </div>
    );
}
