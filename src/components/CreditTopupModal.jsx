import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, CreditCard, QrCode, AlertCircle } from 'lucide-react';
import ArcButton from './ArcButton';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';

const CreditTopupModal = ({ isOpen, onClose, user, onTopupSuccess }) => {
    const { t } = useLanguage();
    const [step, setStep] = useState(1); // 1: Selection, 2: Confirmation, 3: QR Code
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [qrImageUrl, setQrImageUrl] = useState('');
    const [omiseChargeId, setOmiseChargeId] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, verifying, success, failed
    const [errorMsg, setErrorMsg] = useState('');
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [orderId, setOrderId] = useState('');

    // Lock body scroll when modal is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const packages = [
        { id: 1, price: 50, credits: 55, label: 'STARTER PACK' },
        { id: 2, price: 100, credits: 125, label: 'BOOSTER PACK' },
        { id: 3, price: 200, credits: 270, label: 'ELITE PACK' }
    ];

    const handleSelect = (pkg) => {
        setSelectedPackage(pkg);
        setStep(2);
    };

    const handleConfirm = async () => {
        setIsProcessing(true);
        setErrorMsg('');

        // 1. Generate local Order ID first so we can send it to metadata
        const timestamp = new Date().getTime().toString().slice(-4);
        const generatedOrderId = `ORD${new Date().getFullYear()}${new Date().getMonth() + 1}${new Date().getDate()}${timestamp}U${user.id.slice(0, 4).toUpperCase()}`;

        try {
            const { data, error } = await supabase.functions.invoke('create-omise-charge', {
                body: {
                    amount: selectedPackage.price,
                    userId: user.id,
                    email: user.email,
                    packageLabel: selectedPackage.label,
                    orderId: generatedOrderId
                }
            });

            if (error) throw error;

            if (data.qr_code) {
                setQrImageUrl(data.qr_code);
                setOmiseChargeId(data.id);
                setOrderId(generatedOrderId); // Update state for UI display
                setStep(3);
                setPaymentStatus('idle');
            } else {
                throw new Error('Failed to generate QR Code');
            }
        } catch (error) {
            console.error('Payment initialization failed:', error);
            setErrorMsg(error.message || t('CANT_SEND')); // Reusing CANT_SEND or similar
        } finally {
            setIsProcessing(false);
        }
    };

    const verifyPayment = async () => {
        if (!omiseChargeId || !user) return;

        setPaymentStatus('verifying');
        setErrorMsg('');

        try {
            // Wait 2 seconds for webhook to potentially process first
            await new Promise(resolve => setTimeout(resolve, 2000));

            const { data, error } = await supabase.functions.invoke('check-omise-charge', {
                body: { chargeId: omiseChargeId, userId: user.id }
            });

            if (error) throw error;

            if (data.status === 'successful' || data.localStatus === 'recorded') {
                setPaymentStatus('success');
                // Give a small delay for the animation
                setTimeout(() => {
                    onTopupSuccess(data.credits);
                    handleClose();
                }, 3000);
            } else if (data.status === 'failed' || data.status === 'expired') {
                setPaymentStatus('failed');
                setErrorMsg(data.failure_message || t('NO_DATA')); // Fallback
            } else {
                // Still pending
                setPaymentStatus('idle');
                setErrorMsg(t('NO_HISTORY')); // Using existing key for 'not yet detected' or adding specific ones if needed
            }
        } catch (error) {
            console.error('Verification failed:', error.message);
            setPaymentStatus('idle');
            setErrorMsg(t('CANT_DELETE')); // Fallback for busy
        }
    };

    const handleCancelOrder = () => {
        handleClose();
        window.location.href = '/';
    };

    const handleClose = () => {
        onClose();
        // Reset state after closure
        setTimeout(() => {
            setStep(1);
            setSelectedPackage(null);
            setQrImageUrl('');
            setOmiseChargeId('');
            setOrderId('');
            setPaymentStatus('idle');
            setErrorMsg('');
            setIsProcessing(false);
            setShowCancelConfirm(false);
        }, 300);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={overlayStyle}
                onClick={handleClose}
            >
                <style>{`
                    .pkg-card { transition: all 0.2s ease-in-out !important; }
                    .pkg-card:hover { 
                        border-color: var(--arc-yellow) !important; 
                        background: rgba(255, 200, 0, 0.05) !important;
                        transform: translateY(-2px);
                    }
                    .status-glow { filter: drop-shadow(0 0 15px var(--arc-yellow)); }
                    @keyframes spin { 
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .spinner {
                        animation: spin 1s linear infinite;
                        border: 2px solid rgba(255,255,255,0.1);
                        border-top-color: var(--arc-yellow);
                        border-radius: 50%;
                        width: 16px;
                        height: 16px;
                    }
                `}</style>

                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    style={modalStyle}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div style={headerStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <CreditCard size={20} className="text-yellow" />
                            <h2 style={{ letterSpacing: '2px', fontSize: '18px', margin: 0 }}>{t('TOPUP_TITLE')}</h2>
                        </div>
                        <X size={24} onClick={handleClose} style={{ cursor: 'pointer' }} className="hover-cyan" />
                    </div>

                    <div style={contentStyle}>
                        {/* Error Notification */}
                        {errorMsg && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={errorNotifyStyle}
                            >
                                <AlertCircle size={16} />
                                <span>{errorMsg}</span>
                            </motion.div>
                        )}

                        {step === 1 && (
                            <div style={selectionContainer}>
                                <p style={subTitleStyle}>{t('SELECT_PACKAGE')}</p>
                                <div style={packageGrid}>
                                    {packages.map((pkg) => (
                                        <div
                                            key={pkg.id}
                                            className="pkg-card"
                                            style={packageCard}
                                            onClick={() => handleSelect(pkg)}
                                        >
                                            <p style={pkgLabelStyle}>{pkg.label}</p>
                                            <h3 style={pkgCreditStyle}>{pkg.credits}</h3>
                                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>{t('CREDITS')}</p>
                                            <div style={pkgPriceStyle}>฿{pkg.price.toFixed(2)}</div>
                                            <ArcButton color="yellow" style={{ width: '100%', marginTop: 'auto' }}>{t('SELECT')}</ArcButton>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 2 && selectedPackage && (
                            <div style={confirmationContainer}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '300px' }}>
                                    <AlertCircle size={48} className="text-yellow" style={{ marginBottom: '20px' }} />
                                    <h3 style={{ fontSize: '20px', marginBottom: '10px', letterSpacing: '1px' }}>{t('CONFIRM_ORDER')}</h3>
                                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '25px', lineHeight: '1.6' }}>
                                        {t('PURCHASING')} <span style={{ color: '#fff', fontWeight: 'bold' }}>{selectedPackage.credits} {t('CREDITS')}</span> <br />
                                        {t('FOR')} <span style={{ color: 'var(--arc-yellow)', fontWeight: 'bold' }}>฿{selectedPackage.price.toFixed(2)}</span>
                                    </p>
                                    <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
                                        <ArcButton color="white" onClick={() => setStep(1)} style={{ flex: 1 }} disabled={isProcessing}>{t('CANCEL')}</ArcButton>
                                        <ArcButton color="yellow" onClick={handleConfirm} style={{ flex: 1 }} disabled={isProcessing}>
                                            {isProcessing ? t('INITIATING') : t('CONFIRM')}
                                        </ArcButton>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && selectedPackage && (
                            <div style={qrContainer}>
                                <AnimatePresence mode="wait">
                                    {paymentStatus === 'success' ? (
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            style={statusResultStyle}
                                        >
                                            <div style={successIconStyle}>
                                                <Check size={48} />
                                            </div>
                                            <h3 style={{ fontSize: '24px', margin: '20px 0 10px', color: 'var(--arc-yellow)' }}>{t('PAYMENT_SUCCESSFUL')}</h3>
                                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
                                                {t('ADDING_CREDITS').replace('{credits}', selectedPackage.credits)}
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="qr"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                                        >
                                            <p style={{ ...qrTitleStyle, marginBottom: '15px', fontSize: '20px' }}>{t('SCAN_TO_PAY')}</p>

                                            <div style={{ ...newWarningBoxStyle, marginBottom: '15px', padding: '8px 12px' }}>
                                                <AlertCircle size={14} />
                                                <span style={{ fontWeight: 'bold' }}>
                                                    {t('WARNING_ONCE')}
                                                </span>
                                            </div>
                                            <div style={{ ...newQrBox, padding: '10px', marginBottom: '10px' }}>
                                                <img
                                                    src={qrImageUrl || 'https://via.placeholder.com/180?text=Generating+QR'}
                                                    alt="PromptPay QR"
                                                    style={{ width: '160px', height: '160px', borderRadius: '10px' }}
                                                />
                                            </div>

                                            <div style={{ ...amountDisplayStyle, marginBottom: '15px' }}>
                                                <span style={{ fontSize: '28px', fontWeight: '900' }}>฿{selectedPackage.price.toFixed(2)}</span>
                                                <p style={{ ...amountSubText, marginTop: '2px' }}>{t('DECIMAL_MSG')}</p>
                                            </div>

                                            <div style={{ ...orderStatusBox, padding: '10px', marginBottom: '12px' }}>
                                                <div style={{ color: 'var(--arc-yellow)', marginBottom: '3px', fontSize: '12px' }}>
                                                    {t('ORDER')}: <span style={{ color: '#fff' }}>{orderId}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '11px', color: '#aaa' }}>
                                                    {t('VERIFYING')}
                                                    <div className="spinner" />
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '5px', width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <button
                                                    onClick={verifyPayment}
                                                    style={{ ...newConfirmButtonStyle, height: '48px' }}
                                                    disabled={paymentStatus === 'verifying'}
                                                >
                                                    <Check size={18} />
                                                    {paymentStatus === 'verifying' ? t('VERIFYING') : t('I_HAVE_PAID')}
                                                </button>

                                                <button
                                                    onClick={() => setShowCancelConfirm(true)}
                                                    style={{ ...newCancelButtonStyle, height: '38px' }}
                                                >
                                                    <X size={16} />
                                                    {t('CANCEL_ORDER')}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {/* Cancel Confirmation Popup */}
                    <AnimatePresence>
                        {showCancelConfirm && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={cancelConfirmOverlay}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.9, y: 20 }}
                                    style={cancelConfirmBox}
                                >
                                    <AlertCircle size={40} style={{ color: '#ff4444', marginBottom: '15px' }} />
                                    <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '10px' }}>{t('CANCEL_ASK')}</h3>
                                    <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '25px', color: '#aaa', textAlign: 'center' }}>
                                        {t('CANCEL_DESC')} <br />
                                        <p style={{ color: '#ff4444', fontWeight: 'bold', border: '1px dashed #ff4444', padding: '10px', borderRadius: '8px', marginTop: '10px' }}>
                                            {t('CANCEL_WARNING')}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                                        <button onClick={handleCancelOrder} style={confirmCancelBtn}>{t('YES_CANCEL')}</button>
                                        <button onClick={() => setShowCancelConfirm(false)} style={backToPaymentBtn}>{t('BACK_TO_PAYMENT')}</button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// Styles
const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    backdropFilter: 'blur(10px)',
    zIndex: 11000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    overflowY: 'auto', // Allow overlay to scroll if modal is too tall
};

const modalStyle = {
    width: '100%',
    maxWidth: '580px', // Increased for comfortable 3-column layout
    background: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 0 60px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 200, 0, 0.05)',
    maxHeight: '90vh', // Prevent overflow on small screens
    display: 'flex',
    flexDirection: 'column',
};

const headerStyle = {
    padding: '18px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #222',
};

const contentStyle = {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflowY: 'auto', // Allow vertical scroll
    overflowX: 'hidden', // Prevent horizontal scroll
    flex: 1,
};

const subTitleStyle = {
    fontSize: '11px',
    letterSpacing: '3px',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    marginBottom: '20px',
    fontWeight: 'bold',
};

const selectionContainer = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
};

const packageGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    width: '100%',
};

const packageCard = {
    background: '#151515',
    border: '1px solid #222',
    padding: '20px 15px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
};

const pkgLabelStyle = {
    fontSize: '9px',
    color: 'var(--text-secondary)',
    marginBottom: '8px',
    letterSpacing: '1px',
};

const pkgCreditStyle = {
    fontSize: '28px',
    fontWeight: '900',
    marginBottom: '0px',
    color: '#fff',
};

const pkgPriceStyle = {
    fontSize: '14px',
    color: 'var(--arc-yellow)',
    fontWeight: 'bold',
    marginBottom: '20px',
};

const confirmationContainer = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
};

const qrContainer = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
};

const qrBox = {
    background: '#fff',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '10px',
    boxShadow: '0 0 20px rgba(255, 255, 255, 0.1)',
};

const qrOverlay = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
};

const backToConfirmStyle = {
    fontSize: '10px',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    marginTop: '20px',
    cursor: 'pointer',
    textDecoration: 'underline',
    letterSpacing: '1px',
    opacity: 0.7,
    transition: 'opacity 0.2s',
};

const errorNotifyStyle = {
    background: 'rgba(255, 68, 68, 0.1)',
    border: '1px solid #ff4444',
    padding: '12px 16px',
    borderRadius: '8px',
    color: '#ff4444',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '25px',
    width: '100%',
};

const statusResultStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    width: '100%',
};

const successIconStyle = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'var(--arc-yellow)',
    color: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 30px rgba(255, 200, 0, 0.3)',
};

const qrTitleStyle = {
    fontSize: '22px',
    color: '#fff',
    textAlign: 'center',
    marginBottom: '20px',
    fontWeight: 'bold',
};

const newWarningBoxStyle = {
    background: 'rgba(255, 68, 68, 0.05)',
    border: '1px solid rgba(255, 68, 68, 0.2)',
    borderRadius: '8px',
    padding: '10px 15px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '12px',
    marginBottom: '20px',
    width: '100%',
    maxWidth: '430px',
    color: '#ff6666',
};

const newQrBox = {
    background: '#fff',
    padding: '15px',
    borderRadius: '16px',
    boxShadow: '0 0 40px rgba(255, 255, 255, 0.05)',
    marginBottom: '15px',
};

const amountDisplayStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '25px',
    color: 'var(--arc-yellow)',
    fontWeight: '900',
};

const amountSubText = {
    fontSize: '11px',
    color: '#555',
    marginTop: '5px',
};

const orderStatusBox = {
    width: '100%',
    maxWidth: '320px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 200, 0, 0.3)',
    borderRadius: '8px',
    padding: '15px',
    textAlign: 'center',
    marginBottom: '15px',
};

const newConfirmButtonStyle = {
    width: '100%',
    height: '52px',
    background: 'var(--arc-yellow)',
    border: 'none',
    borderRadius: '8px',
    color: '#000',
    fontWeight: 'bold',
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    cursor: 'pointer',
    transition: 'all 0.2s',
};

const newCancelButtonStyle = {
    width: '100%',
    height: '42px',
    background: 'transparent',
    border: '1px solid #ff4444',
    borderRadius: '8px',
    color: '#ff4444',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
};

const cancelConfirmOverlay = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    borderRadius: '12px',
};

const cancelConfirmBox = {
    width: '90%',
    maxWidth: '320px',
    background: '#111',
    border: '1px solid #333',
    borderRadius: '16px',
    padding: '25px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
};

const confirmCancelBtn = {
    width: '100%',
    height: '40px',
    background: '#ff4444',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer',
};

const backToPaymentBtn = {
    width: '100%',
    height: '40px',
    background: 'transparent',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#999',
    cursor: 'pointer',
};

export default CreditTopupModal;

