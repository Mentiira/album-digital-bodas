'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function GuestAccess({ eventId }: { eventId: string }) {
  const { setAlias } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    document.body.classList.add('loaded');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !loading) {
      setLoading(true);
      try {
        await setAlias(name.trim(), eventId);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="entry-screen"
    >
      <div className="content glass-card premium-shadow">
        <h2 className="serif">{t('welcome')}</h2>
        <p>{t('enterName')}</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('namePlaceholder')}
            autoFocus
            required
            disabled={loading}
          />
          <button type="submit" className="premium-btn" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : t('start')}
          </button>
        </form>
      </div>

      <style jsx>{`
        .entry-screen {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: #F8F7F2;
        }
        .content {
          padding: 40px 30px;
          border-radius: 30px;
          text-align: center;
          width: 100%;
          max-width: 400px;
        }
        h2 { margin-bottom: 10px; font-size: 2rem; }
        p { margin-bottom: 30px; color: #666; }
        input {
          width: 100%;
          padding: 15px;
          border-radius: 15px;
          border: 1px solid #ddd;
          margin-bottom: 20px;
          font-size: 1rem;
          outline: none;
        }
        .premium-btn {
          width: 100%;
          padding: 15px;
          border-radius: 15px;
          border: none;
          background: #2d3436;
          color: white;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .premium-btn:active { transform: scale(0.98); }
      `}</style>
    </motion.div>
  );
}
