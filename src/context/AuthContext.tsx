'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
    user: User | null;
    alias: string;
    isAdmin: boolean;
    setAlias: (name: string, eventId: string) => Promise<void>;
    setIsAdmin: (val: boolean) => void;
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
                // La lógica de isAdmin y alias ahora se maneja por evento en la página
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

    const setAlias = async (name: string, eventId: string) => {
        if (!user) return;
        setAliasState(name);
        localStorage.setItem(`userAlias_${eventId}`, name);
        // Persistencia dentro del EVENTO (Nueva Lógica)
        await setDoc(doc(db, 'events', eventId, 'guests', user.uid), {
            uid: user.uid,
            alias: name,
            updatedAt: serverTimestamp()
        }, { merge: true });
    };

    return (
        <AuthContext.Provider value={{ user, alias, isAdmin, setAlias, setIsAdmin, loading }}>
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
