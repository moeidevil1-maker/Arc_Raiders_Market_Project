import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogOut, User, Shield, Zap, Award } from 'lucide-react';
import ArcButton from './ArcButton';
import { supabase } from '../lib/supabase';
import CreditTopupModal from './CreditTopupModal';

const ProfileOverlay = ({ user, role, isOpen, onClose, onCreditsUpdate }) => {
    if (!isOpen) return null;

    const [isTopupOpen, setIsTopupOpen] = React.useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        onClose();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={overlayWrapperStyle}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    style={modalStyle}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={headerStyle}>
                        <h2 style={{ letterSpacing: '2px' }}>PLAYER PROFILE</h2>
                        <X size={24} onClick={onClose} style={{ cursor: 'pointer' }} className="hover-cyan" />
                    </div>

                    <div style={contentStyle}>
                        <div style={avatarSectionStyle}>
                            <img
                                src={user?.user_metadata?.avatar_url || 'https://via.placeholder.com/150'}
                                alt="Avatar"
                                style={avatarStyle}
                            />
                            <div style={statusBadgeStyle}>ONLINE</div>
                        </div>

                        <div style={infoSectionStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                <h3 style={userNameStyle}>{user?.user_metadata?.full_name || 'RAIDER'}</h3>
                                {role?.toLowerCase() === 'admin' && (
                                    <span style={{
                                        backgroundColor: '#ff4444',
                                        color: '#fff',
                                        fontSize: '10px',
                                        padding: '2px 6px',
                                        borderRadius: '3px',
                                        fontWeight: '900',
                                        border: '1px solid rgba(255,255,255,0.2)'
                                    }}>ADMIN</span>
                                )}
                            </div>
                            <p style={userEmailStyle}>{user?.email}</p>

                            <div style={statsGridStyle}>
                                <div style={statItemStyle}>
                                    <Award size={16} className="text-cyan" />
                                    <div>
                                        <p style={statLabelStyle}>RANK</p>
                                        <p style={statValueStyle}>{role?.toLowerCase() === 'admin' ? 'ADMINISTRATOR' : 'USER ทั่วไป'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={footerStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                            <ArcButton
                                color="yellow"
                                onClick={() => setIsTopupOpen(true)}
                                style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--arc-yellow)' }}
                            >
                                <Zap size={18} /> TOP UP CREDITS
                            </ArcButton>

                            <ArcButton color="red" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center' }}>
                                <LogOut size={18} /> SIGN OUT
                            </ArcButton>
                        </div>
                    </div>

                    <CreditTopupModal
                        isOpen={isTopupOpen}
                        onClose={() => setIsTopupOpen(false)}
                        user={user}
                        onTopupSuccess={onCreditsUpdate}
                    />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const overlayWrapperStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(10px)',
    zIndex: 10000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
};

const modalStyle = {
    width: '100%',
    maxWidth: '450px',
    background: 'var(--bg-secondary)',
    border: '1px solid #333',
    borderRadius: '8px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 0 50px rgba(0, 255, 255, 0.1)',
};

const headerStyle = {
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #222',
};

const contentStyle = {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
};

const avatarSectionStyle = {
    position: 'relative',
};

const avatarStyle = {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    border: '3px solid var(--arc-cyan)',
    padding: '4px',
    objectFit: 'cover',
};

const statusBadgeStyle = {
    position: 'absolute',
    bottom: '5px',
    right: '5px',
    backgroundColor: 'var(--arc-green)',
    color: '#000',
    fontSize: '10px',
    fontWeight: 'bold',
    padding: '2px 8px',
    borderRadius: '20px',
    boxShadow: '0 0 10px var(--arc-green)',
};

const infoSectionStyle = {
    textAlign: 'center',
    width: '100%',
};

const userNameStyle = {
    fontSize: '24px',
    fontWeight: '900',
    letterSpacing: '1px',
    marginBottom: '5px',
};

const userEmailStyle = {
    color: 'var(--text-secondary)',
    fontSize: '14px',
    marginBottom: '20px',
};

const statsGridStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    marginTop: '10px',
};

const statItemStyle = {
    background: '#151515',
    padding: '10px',
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px',
    border: '1px solid #222',
};

const statLabelStyle = {
    fontSize: '9px',
    color: 'var(--text-secondary)',
    letterSpacing: '1px',
};

const statValueStyle = {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#fff',
};

const footerStyle = {
    padding: '20px',
    borderTop: '1px solid #222',
};

export default ProfileOverlay;
