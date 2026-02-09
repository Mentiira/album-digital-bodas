'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
    user: User | null;
    alias: string;
    isAdmin: boolean;
    setAlias: (name: string) => Promise<void>;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [alias, setAliasState] = useState<string>('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                // Try to load alias from localStorage first
                const savedAlias = localStorage.getItem('userAlias');
                if (savedAlias) {
                    setAliasState(savedAlias);
                }

                // Fetch latest data from Firestore for role/isAdmin
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setAliasState(data.alias || '');
                    localStorage.setItem('userAlias', data.alias || '');
                    setIsAdmin(data.role === 'admin');
                }
            } else {
                // Automatically sign in anonymously if no user
                try {
                    await signInAnonymously(auth);
                } catch (error) {
                    console.error("Auth error:", error);
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const setAlias = async (name: string) => {
        if (!user) return;
        setAliasState(name);
        localStorage.setItem('userAlias', name);
        // Persist to Firestore
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            alias: name,
            updatedAt: serverTimestamp()
        }, { merge: true });
    };

    return (
        <AuthContext.Provider value={{ user, alias, isAdmin, setAlias, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
