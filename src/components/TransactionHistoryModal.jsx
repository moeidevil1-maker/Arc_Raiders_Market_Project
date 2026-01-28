import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';

const TransactionHistoryModal = ({ isOpen, onClose, user }) => {
    const { lang, t } = useLanguage();
    const [activeTab, setActiveTab] = useState('topup');
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        totalItems: 0,
        totalReceived: 0,
        totalSpent: 0,
        currentBalance: 0
    });

    useEffect(() => {
        if (isOpen && user) {
            fetchTransactions();
        }
    }, [isOpen, user]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            // Fetch transactions
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setTransactions(data || []);

            // Calculate stats
            let received = 0;
            const spent = 0; // Placeholder until we have spending logic
            (data || []).forEach(tx => {
                if (tx.credits > 0) received += tx.credits;
            });

            // Get current balance from profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', user.id)
                .single();

            setStats({
                totalItems: (data || []).length,
                totalReceived: received,
                totalSpent: spent,
                currentBalance: profile?.credits || 0
            });

        } catch (error) {
            console.error('Error fetching transactions:', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={overlayStyle}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    style={modalStyle}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div style={headerStyle}>
                        <div>
                            <h2 style={titleStyle}>{t('HISTORY_TITLE')}</h2>
                            <p style={subtitleStyle}>{t('HISTORY_SUB')}</p>
                        </div>
                        <div onClick={onClose} style={closeButtonStyle}>
                            <X size={24} color="#fff" />
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div style={statsGridStyle}>
                        <StatCard label={t('TOTAL')} value={`${stats.totalItems} ${t('ITEMS')}`} color="gray" />
                        <StatCard label={t('TOTAL_RECEIVED')} value={`+${stats.totalReceived}`} color="green" />
                        <StatCard label={t('TOTAL_SPENT')} value={`-${stats.totalSpent}`} color="red" />
                        <StatCard label={t('CURRENT')} value={stats.currentBalance} color="yellow" />
                    </div>

                    {/* Tabs */}
                    <div style={tabsContainerStyle}>
                        <Tab
                            isActive={activeTab === 'topup'}
                            onClick={() => setActiveTab('topup')}
                            icon={<Wallet size={16} />}
                            label={t('TOPUP_HISTORY')}
                        />
                        <Tab
                            isActive={activeTab === 'activity'}
                            onClick={() => setActiveTab('activity')}
                            icon={<ArrowUpRight size={16} />}
                            label={t('ACTIVITY_HISTORY')}
                        />
                        <Tab
                            isActive={activeTab === 'warehouse'}
                            onClick={() => setActiveTab('warehouse')}
                            icon={<Clock size={16} />}
                            label={t('WAREHOUSE_HISTORY')}
                        />
                    </div>

                    {/* Content / Table */}
                    <div style={contentAreaStyle}>
                        {activeTab === 'topup' && (
                            <>
                                <h3 style={sectionTitleStyle}>{t('TOPUP_HISTORY')} (Top-up History)</h3>
                                <div style={tableContainerStyle}>
                                    <div style={tableHeaderStyle}>
                                        <div style={{ flex: 2 }}>{t('DATE_TIME')}</div>
                                        <div style={{ flex: 2 }}>{t('ORDER_ID')}</div>
                                        <div style={{ flex: 1, textAlign: 'right' }}>{t('AMOUNT')}</div>
                                        <div style={{ flex: 1, textAlign: 'right' }}>{t('HISTORY_CREDITS')}</div>
                                    </div>

                                    {loading ? (
                                        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>{t('LOADING_DATA')}</div>
                                    ) : transactions.length > 0 ? (
                                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {transactions.map((tx) => (
                                                <div key={tx.id} style={rowStyle}>
                                                    <div style={{ flex: 2, fontSize: '12px', color: '#aaa' }}>
                                                        {new Date(tx.created_at).toLocaleString(lang === 'TH' ? 'th-TH' : 'en-US')}
                                                    </div>
                                                    <div style={{ flex: 2, fontSize: '12px', fontFamily: 'monospace', color: 'var(--arc-yellow)' }}>
                                                        {tx.order_no || tx.ref_no || '-'}
                                                    </div>
                                                    <div style={{ flex: 1, textAlign: 'right', color: '#fff' }}>
                                                        ฿{tx.amount}
                                                    </div>
                                                    <div style={{ flex: 1, textAlign: 'right', color: 'var(--arc-yellow)', fontWeight: 'bold' }}>
                                                        +{tx.credits}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        /* Empty State */
                                        <div style={emptyStateStyle}>
                                            <p>{t('NO_HISTORY')}</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                        {activeTab !== 'topup' && (
                            <div style={emptyStateStyle}>
                                <p>{t('NO_DATA')}</p>
                            </div>
                        )}
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// Sub-components
const StatCard = ({ label, value, color }) => {
    const getColor = (c) => {
        switch (c) {
            case 'green': return '#00ffaa';
            case 'red': return '#ff4444';
            case 'yellow': return '#ffcc00';
            default: return '#fff';
        }
    };

    return (
        <div style={statCardStyle}>
            <div style={statLabelStyle}>{label}</div>
            <div style={{ ...statValueStyle, color: getColor(color) }}>{value}</div>
        </div>
    );
};

const Tab = ({ isActive, onClick, icon, label }) => (
    <div
        onClick={onClick}
        style={{
            ...tabStyle,
            color: isActive ? 'var(--arc-yellow)' : '#888',
            borderBottom: isActive ? '2px solid var(--arc-yellow)' : '2px solid transparent'
        }}
    >
        {icon}
        <span>{label}</span>
    </div>
);

// Styles
const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.85)',
    zIndex: 20000, // Higher than topbar
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(5px)'
};

const modalStyle = {
    width: '90%',
    maxWidth: '850px',
    background: '#0a0a0a',
    borderRadius: '16px',
    padding: '30px',
    position: 'relative',
    border: '1px solid #333',
    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
};

const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '25px'
};

const titleStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '5px'
};

const subtitleStyle = {
    fontSize: '14px',
    color: '#888',
};

const closeButtonStyle = {
    cursor: 'pointer',
    padding: '5px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)',
    transition: '0.2s'
};

const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '30px'
};

const statCardStyle = {
    background: '#000',
    border: '1px solid #222',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
};

const statLabelStyle = {
    color: '#666',
    fontSize: '12px'
};

const statValueStyle = {
    fontSize: '20px',
    fontWeight: 'bold'
};

const tabsContainerStyle = {
    display: 'flex',
    gap: '30px',
    borderBottom: '1px solid #222',
    marginBottom: '20px'
};

const tabStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    paddingBottom: '15px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: '0.2s'
};

const contentAreaStyle = {
    minHeight: '200px'
};

const sectionTitleStyle = {
    color: '#00ffaa',
    fontSize: '16px',
    marginBottom: '15px'
};

const tableContainerStyle = {
    background: '#111',
    borderRadius: '8px',
    overflow: 'hidden'
};

const tableHeaderStyle = {
    display: 'flex',
    padding: '15px',
    background: '#1a1a1a',
    color: '#ccc',
    fontSize: '13px',
    fontWeight: 'bold',
    borderBottom: '1px solid #333'
};

const rowStyle = {
    display: 'flex',
    padding: '12px 15px',
    borderBottom: '1px solid #222',
    alignItems: 'center'
};

const emptyStateStyle = {
    padding: '60px',
    textAlign: 'center',
    color: '#555',
    fontSize: '14px'
};

export default TransactionHistoryModal;
