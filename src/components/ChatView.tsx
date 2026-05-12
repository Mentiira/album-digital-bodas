'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { Send } from 'lucide-react';
import { format } from 'date-fns';
import type { Timestamp } from 'firebase/firestore';

interface ChatMessage {
    id: string;
    text: string;
    userId: string;
    userName: string;
    createdAt?: Timestamp;
}

export default function ChatView({ eventId }: { eventId: string }) {
    const { user, alias: contextAlias } = useAuth();
    const { t } = useLanguage();

    // REFUERZO: Si el alias del contexto está vacío (ej. al recargar), lo buscamos en el localStorage de este evento
    const alias = contextAlias || (typeof window !== 'undefined' ? localStorage.getItem(`userAlias_${eventId}`) : '');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [text, setText] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const q = query(
            collection(db, `events/${eventId}/chat`),
            orderBy('createdAt', 'asc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: ChatMessage[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as Omit<ChatMessage, 'id'>),
            }));
            setMessages(msgs);
            setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        return () => unsubscribe();
    }, [eventId]);

    const send = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !user) return;

        await addDoc(collection(db, `events/${eventId}/chat`), {
            text: text.trim(),
            userId: user.uid,
            userName: alias || t('guestDefault'),
            createdAt: serverTimestamp()
        });
        setText('');
    };

    return (
        <div className="chat-container">
            <div className="messages">
                {messages.map((msg) => (
                    <div key={msg.id} className={`msg ${msg.userId === user?.uid ? 'mine' : ''}`}>
                        <span className="user">{msg.userName}</span>
                        <div className="bubble">{msg.text}</div>
                        <span className="time">
                            {msg.createdAt ? format(msg.createdAt.toDate(), 'HH:mm') : ''}
                        </span>
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            <form onSubmit={send} className="input-area glass-card">
                <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={t('realTimeChat')}
                />
                <button type="submit"><Send size={20} /></button>
            </form>

            <style jsx>{`
        .chat-container { height: calc(100vh - 70px); display: flex; flex-direction: column; }
        .messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 15px; padding-bottom: 100px; }
        .msg { max-width: 80%; }
        .mine { align-self: flex-end; }
        .user { font-size: 0.7rem; color: #888; margin-bottom: 4px; display: block; }
        .bubble { 
          padding: 12px 16px; 
          border-radius: 18px; 
          background: #f1f3f5; 
          font-size: 0.95rem;
        }
        .mine .bubble { background: #2d3436; color: white; border-bottom-right-radius: 4px; }
        .mine .user { text-align: right; }
        .time { font-size: 0.6rem; color: #bbb; margin-top: 4px; display: block; }
        .mine .time { text-align: right; }
        
        .input-area { 
          position: fixed;
          bottom: 30px;
          left: 15px;
          right: 15px;
          padding: 12px 18px; 
          display: flex; 
          gap: 12px; 
          border-radius: 25px;
          z-index: 100;
          height: 55px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #e0e0e0;
          box-shadow: 0 8px 25px rgba(0,0,0,0.08);
        }
        input { 
          flex: 1; 
          border: none; 
          background: transparent; 
          outline: none; 
          font-size: 0.95rem;
        }
        button { background: none; border: none; color: #2d3436; cursor: pointer; }
      `}</style>
        </div>
    );
}
