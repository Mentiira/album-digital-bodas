'use client';

import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSelector() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="language-selector">
            <button
                className={language === 'es' ? 'active' : ''}
                onClick={() => setLanguage('es')}
            >
                🇪🇸 Español
            </button>
            <button
                className={language === 'en' ? 'active' : ''}
                onClick={() => setLanguage('en')}
            >
                🇺🇸 English
            </button>

            <style jsx>{`
        .language-selector {
          display: flex;
          gap: 10px;
          padding: 10px;
          justify-content: center;
        }
        button {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 8px 16px;
          border-radius: 20px;
          color: white;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          backdrop-filter: blur(5px);
        }
        button.active {
          background: white;
          color: #333;
          font-weight: bold;
        }
      `}</style>
        </div>
    );
}
