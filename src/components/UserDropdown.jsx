import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, ExternalLink, Zap, History } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

const UserDropdown = ({ user, role, isOpen, onClose, onLogout, onOpenAdmin, onOpenTopUp, onOpenHistory }) => {
    const { t } = useLanguage();
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    style={dropdownStyle}
                    onMouseLeave={onClose}
                >
                    <div style={headerStyle}>
                        <div style={userNameStyle}>{user?.user_metadata?.full_name || user?.email || 'User'}</div>
                        <div style={userEmailStyle}>{user?.email}</div>
                    </div>

                    <div style={menuStyle}>
                        {(() => {
                            const currentRole = role?.toString().trim().toLowerCase();
                            // Robust check for admin or owner
                            const isAdminOrOwner = ['admin', 'owner'].includes(currentRole);

                            // Debugging log to console
                            console.log('--- UserDropdown Debug ---', {
                                rawRole: role,
                                processedRole: currentRole,
                                isAdminOrOwner,
                                userEmail: user?.email
                            });

                            return isAdminOrOwner && (
                                <div onClick={onOpenAdmin} style={menuItemStyle} className="dropdown-item">
                                    <ExternalLink size={16} />
                                    <span>{t('SYSTEM_CONTROL')}</span>
                                </div>
                            );
                        })()}

                        <div onClick={onOpenTopUp} style={menuItemStyle} className="dropdown-item">
                            <Zap size={16} className="text-yellow" />
                            <span>{t('TOP_UP_CREDITS')}</span>
                        </div>

                        <div onClick={onOpenHistory} style={menuItemStyle} className="dropdown-item">
                            <History size={16} />
                            <span>{t('TRANSACTION_HISTORY')}</span>
                        </div>

                        <div style={dividerStyle}></div>

                        <div onClick={onLogout} style={{ ...menuItemStyle, color: '#ff4444' }} className="dropdown-item">
                            <LogOut size={16} />
                            <span>{t('LOGOUT')}</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const dropdownStyle = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '10px',
    width: '250px',
    background: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
    zIndex: 10000,
};

const headerStyle = {
    padding: '15px',
    borderBottom: '1px solid #222',
    background: 'linear-gradient(to bottom, #111, #0a0a0a)'
};

const userNameStyle = {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '14px',
    marginBottom: '2px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
};

const userEmailStyle = {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '11px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
};

const menuStyle = {
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
};

const menuItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    color: '#ccc',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
};

const dividerStyle = {
    height: '1px',
    background: '#222',
    margin: '5px 0'
};

// Add global styles for hover effects
const styleTag = document.createElement('style');
styleTag.textContent = `
    .dropdown-item:hover {
        background: rgba(255,255,255,0.05);
        color: #fff !important;
    }
    .text-yellow {
        color: var(--arc-yellow);
    }
`;
document.head.appendChild(styleTag);

export default UserDropdown;
