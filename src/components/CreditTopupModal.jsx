import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, CreditCard, QrCode, AlertCircle } from 'lucide-react';
import ArcButton from './ArcButton';
import { supabase } from '../lib/supabase';

const CreditTopupModal = ({ isOpen, onClose, user, onTopupSuccess }) => {
    const [step, setStep] = useState(1); // 1: Selection, 2: Confirmation, 3: QR Code
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [qrImageUrl, setQrImageUrl] = useState('');
    const [omiseChargeId, setOmiseChargeId] = useState('');

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
        console.log('Initiating Omise charge with:', {
            amount: selectedPackage.price,
            userId: user?.id,
            email: user?.email,
            packageLabel: selectedPackage.label
        });

        try {
            // Call our Edge Function to create an Omise Charge
            const { data, error } = await supabase.functions.invoke('create-omise-charge', {
                body: {
                    amount: selectedPackage.price,
                    userId: user.id,
                    email: user.email,
                    packageLabel: selectedPackage.label
                }
            });

            if (error) throw error;

            if (data.qr_code) {
                setQrImageUrl(data.qr_code);
                setOmiseChargeId(data.id);
                setStep(3);
            } else {
                throw new Error('Failed to generate QR Code');
            }
        } catch (error) {
            console.error('Payment initialization failed details:', error);
            // If the error has a response body with an error property
            let errorMsg = error.message;
            if (error.context && error.context.json) {
                const jsonErr = await error.context.json();
                errorMsg = jsonErr.error || errorMsg;
            }
            alert(`Payment system error: ${errorMsg}. Please try again later.`);
        } finally {
            setIsProcessing(false);
        }
    };

    const checkPaymentStatus = async () => {
        if (!user) return;
        setIsProcessing(true);

        try {
            // Refresh credits from database to see if webhook already processed it
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            // In a real app, you might want to specifically check the Omise charge status
            // but for this flow, checking the incremented credits is a good confirmation.
            onTopupSuccess(profile.credits);
            alert(`Payment confirmed! Your new balance is ${profile.credits} Credits.`);
            onClose();
            setStep(1);
            setSelectedPackage(null);
            setQrImageUrl('');
        } catch (error) {
            console.error('Verification failed:', error.message);
            alert('Payment not yet detected. If you have paid, please wait a moment and try again.');
        } finally {
            setIsProcessing(false);
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
                {/* Global Style Injection for Hover Effects */}
                <style>{`
                    .pkg-card {
                        transition: all 0.2s ease-in-out !important;
                    }
                    .pkg-card:hover {
                        border-color: var(--arc-yellow) !important;
                        background: rgba(255, 200, 0, 0.05) !important;
                        transform: translateY(-2px);
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
                            <h2 style={{ letterSpacing: '2px', fontSize: '18px', margin: 0 }}>TOP-UP CREDITS</h2>
                        </div>
                        <X size={24} onClick={onClose} style={{ cursor: 'pointer' }} className="hover-cyan" />
                    </div>

                    <div style={contentStyle}>
                        {step === 1 && (
                            <div style={selectionContainer}>
                                <p style={subTitleStyle}>SELECT YOUR PACKAGE</p>
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
                                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>Credits</p>
                                            <div style={pkgPriceStyle}>฿{pkg.price.toFixed(2)}</div>
                                            <ArcButton color="yellow" style={{ width: '100%', marginTop: 'auto' }}>SELECT</ArcButton>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 2 && selectedPackage && (
                            <div style={confirmationContainer}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '300px' }}>
                                    <AlertCircle size={48} className="text-yellow" style={{ marginBottom: '20px' }} />
                                    <h3 style={{ fontSize: '20px', marginBottom: '10px', letterSpacing: '1px' }}>CONFIRM ORDER</h3>
                                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '25px', lineHeight: '1.6' }}>
                                        You are purchasing <span style={{ color: '#fff', fontWeight: 'bold' }}>{selectedPackage.credits} Credits</span> <br />
                                        for <span style={{ color: 'var(--arc-yellow)', fontWeight: 'bold' }}>฿{selectedPackage.price.toFixed(2)}</span>
                                    </p>
                                    <div style={{ display: 'flex', gap: '15px', width: '100%' }}>
                                        <ArcButton color="white" onClick={() => setStep(1)} style={{ flex: 1 }}>CANCEL</ArcButton>
                                        <ArcButton color="yellow" onClick={handleConfirm} style={{ flex: 1 }}>CONFIRM</ArcButton>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && selectedPackage && (
                            <div style={qrContainer}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '320px' }}>
                                    <p style={subTitleStyle}>SCAN TO PAY</p>
                                    <div style={qrBox}>
                                        <div style={qrOverlay}>
                                            <img
                                                src={qrImageUrl || 'https://via.placeholder.com/180?text=Generating+QR'}
                                                alt="PromptPay QR"
                                                style={{ width: '200px', height: 'auto' }}
                                            />
                                            <p style={{ color: '#000', fontSize: '10px', fontWeight: 'bold', marginTop: '10px', letterSpacing: '1px' }}>Thai QR Payment</p>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '15px', textAlign: 'center' }}>
                                        Recipient: <span style={{ color: '#fff' }}>ARC RAIDERS TH</span> <br />
                                        Amount: <span style={{ color: 'var(--arc-yellow)', fontWeight: 'bold' }}>฿{selectedPackage.price.toFixed(2)}</span>
                                    </p>

                                    <div style={{ marginTop: '20px', width: '100%' }}>
                                        <ArcButton
                                            color="cyan"
                                            onClick={checkPaymentStatus}
                                            style={{ width: '100%', justifyContent: 'center' }}
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? 'VERIFYING...' : 'I HAVE PAID'}
                                        </ArcButton>
                                        <p
                                            onClick={() => setStep(2)}
                                            style={backToConfirmStyle}
                                        >
                                            BACK TO CONFIRMATION
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
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
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    backdropFilter: 'blur(10px)',
    zIndex: 11000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
};

const modalStyle = {
    width: '100%',
    maxWidth: '550px',
    background: '#0a0a0a',
    border: '1px solid #333',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 0 60px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 200, 0, 0.05)',
};

const headerStyle = {
    padding: '18px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #222',
};

const contentStyle = {
    padding: '35px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '15px',
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

export default CreditTopupModal;

