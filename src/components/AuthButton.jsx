import React from 'react';
import { LogIn, LogOut, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ArcButton from './ArcButton';
import { useLanguage } from '../lib/LanguageContext';

const AuthButton = ({ user }) => {
    const { t } = useLanguage();
    const handleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    queryParams: {
                        prompt: 'select_account',
                        access_type: 'offline'
                    }
                }
            });
            if (error) throw error;
        } catch (error) {
            console.error('Login error:', error.message);
            alert(`Login Error: ${error.message}`);
        }
    };

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
        } catch (error) {
            console.error('Logout error:', error.message);
        }
    };

    if (user) {
        return null;
    }

    return (
        <ArcButton color="cyan" onClick={handleLogin}>
            <LogIn size={18} /> {t('LOGIN')}
        </ArcButton>
    );
};

const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: 'white',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '6px 12px',
    borderRadius: '4px',
    border: '1px solid rgba(0, 255, 255, 0.1)',
    letterSpacing: '1px',
    textTransform: 'uppercase'
};

export default AuthButton;
