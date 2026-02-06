'use client';

import React from 'react';
import { MessageSquare, Calendar, Users, User, ImageIcon } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

type Tab = 'home' | 'chat' | 'itinerary' | 'guests' | 'profile';

interface BottomNavProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
    const { t, language } = useLanguage();

    return (
        <nav className="bottom-nav glass-card">
            <NavItem
                icon={<ImageIcon size={20} />}
                label={language === 'es' ? 'Álbum' : 'Album'}
                active={activeTab === 'home'}
                onClick={() => setActiveTab('home')}
            />
            <NavItem
                icon={<MessageSquare size={20} />}
                label={t('chat')}
                active={activeTab === 'chat'}
                onClick={() => setActiveTab('chat')}
            />
            <NavItem
                icon={<Calendar size={20} />}
                label={t('itinerary')}
                active={activeTab === 'itinerary'}
                onClick={() => setActiveTab('itinerary')}
            />
            <NavItem
                icon={<Users size={20} />}
                label={t('guests')}
                active={activeTab === 'guests'}
                onClick={() => setActiveTab('guests')}
            />
            <NavItem
                icon={<User size={20} />}
                label={t('myProfile')}
                active={activeTab === 'profile'}
                onClick={() => setActiveTab('profile')}
            />

            <style jsx>{`
        .bottom-nav {
          border-radius: 25px 25px 0 0;
          box-shadow: 0 -5px 20px rgba(0,0,0,0.05);
        }
      `}</style>
        </nav>
    );
}

function NavItem({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
        <div className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
            {icon}
            <span>{label}</span>
            <style jsx>{`
        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.3s;
          padding: 8px;
          border-radius: 12px;
        }
        .nav-item.active {
          color: #fab1a0;
          transform: translateY(-2px);
        }
        span { font-size: 0.65rem; font-weight: 500; }
      `}</style>
        </div>
    );
}
