import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Users as UsersIcon, MessageCircle, Volume2, Trash2, Search, Menu } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';

const ChatOverlay = ({ isOpen, onClose, currentUser, onUnreadCountChange }) => {
    const { lang, t } = useLanguage();
    const [selectedChat, setSelectedChat] = useState(null);
    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [unreadMessages, setUnreadMessages] = useState({});
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true); // For mobile drawer

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const styles = getStyles(isMobile, isMobileMenuOpen);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen]);

    // Play notification sound
    const playNotificationSound = () => {
        if (!isSoundEnabled) return;

        // Create a simple notification sound using Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    };

    // Fetch messages when a chat is selected
    useEffect(() => {
        if (selectedChat && currentUser) {
            fetchMessages();
            subscribeToMessages();
            // Close mobile menu when chat is selected
            if (isMobile) {
                setIsMobileMenuOpen(false);
            }
        }

        return () => {
            // Cleanup subscription when chat changes
            const channelName = `messages-${currentUser?.id}`;
            supabase.channel(channelName).unsubscribe();
        };
    }, [selectedChat, currentUser, isMobile]);

    // Global listener for all incoming messages (for notifications)
    useEffect(() => {
        if (!currentUser || !isOpen) return;

        const globalChannel = supabase
            .channel(`global-messages-${currentUser.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                (payload) => {
                    // Only count messages received by current user
                    if (payload.new.receiver_id === currentUser.id && payload.new.sender_id !== selectedChat?.id) {
                        // Play notification sound
                        playNotificationSound();

                        setUnreadMessages(prev => {
                            const newUnread = {
                                ...prev,
                                [payload.new.sender_id]: (prev[payload.new.sender_id] || 0) + 1
                            };
                            // Update total unread count for navbar
                            const total = Object.values(newUnread).reduce((sum, count) => sum + count, 0);
                            onUnreadCountChange?.(total);
                            return newUnread;
                        });

                        // Move sender to top of user list
                        setUsers(prevUsers => {
                            const senderIndex = prevUsers.findIndex(u => u.id === payload.new.sender_id);
                            if (senderIndex > 0) {
                                const sender = prevUsers[senderIndex];
                                const newUsers = [...prevUsers];
                                newUsers.splice(senderIndex, 1);
                                newUsers.unshift(sender);
                                return newUsers;
                            }
                            return prevUsers;
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            globalChannel.unsubscribe();
        };
    }, [currentUser, isOpen, selectedChat, onUnreadCountChange]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('email', { ascending: true });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        if (!selectedChat || !currentUser) return;

        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedChat.id}),and(sender_id.eq.${selectedChat.id},receiver_id.eq.${currentUser.id})`)
                .order('created_at', { ascending: true });

            if (error) throw error;

            const formattedMessages = data.map(msg => ({
                id: msg.id,
                sender: msg.sender_id === currentUser.id ? currentUser.email : selectedChat.email,
                text: msg.message,
                timestamp: msg.created_at,
                isCurrentUser: msg.sender_id === currentUser.id
            }));

            setMessages(formattedMessages);
        } catch (error) {
            console.error('Error fetching messages:', error.message);
        }
    };

    const subscribeToMessages = () => {
        if (!selectedChat || !currentUser) return;

        // Create a unique channel name for this chat session
        const channelName = `messages-${currentUser.id}`;

        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                (payload) => {
                    console.log('New message received:', payload);

                    // Check if message is part of current conversation
                    const isInCurrentChat =
                        (payload.new.sender_id === selectedChat.id && payload.new.receiver_id === currentUser.id) ||
                        (payload.new.sender_id === currentUser.id && payload.new.receiver_id === selectedChat.id);

                    if (isInCurrentChat && payload.new.sender_id === selectedChat.id) {
                        // Play notification sound for messages in current chat
                        playNotificationSound();

                        // Message from the person we're chatting with
                        const newMessage = {
                            id: payload.new.id,
                            sender: selectedChat.email,
                            text: payload.new.message,
                            timestamp: payload.new.created_at,
                            isCurrentUser: false
                        };
                        setMessages(prev => [...prev, newMessage]);
                    } else if (payload.new.sender_id !== currentUser.id && payload.new.receiver_id === currentUser.id) {
                        // Message from someone else (not in current chat)
                        setUnreadMessages(prev => ({
                            ...prev,
                            [payload.new.sender_id]: (prev[payload.new.sender_id] || 0) + 1
                        }));
                    }
                }
            )
            .subscribe((status) => {
                console.log('Subscription status:', status);
            });

        return () => {
            channel.unsubscribe();
        };
    };

    const handleSelectChat = (user) => {
        setSelectedChat(user);
        // Clear unread count for this user
        setUnreadMessages(prev => {
            const newUnread = { ...prev, [user.id]: 0 };
            // Update total unread count
            const total = Object.values(newUnread).reduce((sum, count) => sum + count, 0);
            onUnreadCountChange?.(total);
            return newUnread;
        });
        setMessages([]);
    };

    const handleDeleteChatHistory = async () => {
        if (!selectedChat || !currentUser) return;

        const confirmDelete = window.confirm(
            `${t('DELETE_CHAT_CONFIRM')} (${selectedChat.email})`
        );

        if (!confirmDelete) return;

        try {
            // Delete all messages between current user and selected chat
            const { error } = await supabase
                .from('messages')
                .delete()
                .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedChat.id}),and(sender_id.eq.${selectedChat.id},receiver_id.eq.${currentUser.id})`);

            if (error) throw error;

            // Clear local messages
            setMessages([]);
            alert(t('CHAT_DELETED'));
        } catch (error) {
            console.error('Error deleting chat history:', error.message);
            alert(t('CANT_DELETE'));
        }
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedChat || !currentUser) return;

        const messageText = messageInput;
        setMessageInput(''); // Clear input immediately for better UX

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert([
                    {
                        sender_id: currentUser.id,
                        receiver_id: selectedChat.id,
                        message: messageText
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            // Add message to local state
            const newMessage = {
                id: data.id,
                sender: currentUser.email,
                text: data.message,
                timestamp: data.created_at,
                isCurrentUser: true
            };

            setMessages(prev => [...prev, newMessage]);
        } catch (error) {
            console.error('Error sending message:', error.message);
            alert(t('CANT_SEND'));
            setMessageInput(messageText); // Restore message on error
        }
    };

    const filteredUsers = users.filter(user =>
        user.id !== currentUser?.id &&
        (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.id?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={styles.overlayBackdrop}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25 }}
                    style={styles.chatContainer}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div style={styles.headerStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* Mobile Menu Toggle */}
                            <div
                                className="hide-desktop"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                style={{ ...styles.iconButton, marginRight: '5px' }}
                            >
                                <Menu size={20} />
                            </div>
                            <MessageCircle size={20} color="var(--arc-yellow)" />
                            <span style={styles.headerTitle}>{t('MESSAGES')}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <div
                                onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                                style={{ ...styles.iconButton, color: isSoundEnabled ? 'var(--arc-yellow)' : 'rgba(255,255,255,0.3)' }}
                                title={isSoundEnabled ? t('MUTE_NOTIF') : t('UNMUTE_NOTIF')}
                            >
                                <Volume2 size={18} />
                            </div>
                            {selectedChat && (
                                <div
                                    onClick={handleDeleteChatHistory}
                                    style={{ ...styles.iconButton, color: '#ff4444' }}
                                    title={t('DELETE_CHAT_HIST')}
                                >
                                    <Trash2 size={18} />
                                </div>
                            )}
                            <X size={20} style={styles.iconButton} onClick={onClose} />
                        </div>
                    </div>

                    {/* Main Content - Split Panel */}
                    <div style={styles.mainContent}>
                        {/* Left Panel - User List */}
                        <div style={styles.leftPanel}>
                            <div style={styles.searchContainer}>
                                <Search size={16} color="rgba(255,255,255,0.4)" />
                                <input
                                    type="text"
                                    placeholder={t('SEARCH_USER')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={styles.searchInput}
                                />
                            </div>

                            <div style={styles.userListContainer}>
                                {loading ? (
                                    <div style={styles.centerText}>{t('LOADING_DATA')}</div>
                                ) : filteredUsers.length === 0 ? (
                                    <div style={styles.centerText}>{t('NO_DATA')}</div>
                                ) : (
                                    filteredUsers.map(user => (
                                        <div
                                            key={user.id}
                                            onClick={() => handleSelectChat(user)}
                                            style={{
                                                ...styles.userItem,
                                                background: selectedChat?.id === user.id ? 'rgba(255, 200, 0, 0.1)' : '#111',
                                                borderLeft: selectedChat?.id === user.id ? '3px solid var(--arc-yellow)' : '3px solid transparent'
                                            }}
                                        >
                                            <div style={styles.userAvatar}>
                                                {user.email?.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <p style={styles.userName}>{user.email}</p>
                                                <p style={styles.userStatus}>
                                                    <span style={styles.onlineDot}></span>
                                                    {t('ONLINE')}
                                                </p>
                                            </div>
                                            {unreadMessages[user.id] > 0 && (
                                                <div style={styles.unreadBadge}>{unreadMessages[user.id]}</div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Right Panel - Chat Area */}
                        <div style={styles.rightPanel}>
                            {selectedChat ? (
                                <>
                                    {/* Chat Header */}
                                    <div style={styles.chatHeader}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={styles.userAvatar}>
                                                {selectedChat.email?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p style={styles.chatHeaderName}>{selectedChat.email}</p>
                                                <p style={styles.chatHeaderStatus}>
                                                    <span style={styles.onlineDot}></span>
                                                    {t('ONLINE')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    <div style={styles.messagesContainer}>
                                        {messages.length === 0 ? (
                                            <div style={styles.centerText}>
                                                <MessageCircle size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: '15px' }} />
                                                <p>{t('START_CONVO')}</p>
                                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                                                    {t('SEND_FIRST_MSG')} {selectedChat.email}
                                                </p>
                                            </div>
                                        ) : (
                                            messages.map(msg => (
                                                <div
                                                    key={msg.id}
                                                    style={{
                                                        ...styles.messageBubble,
                                                        alignSelf: msg.isCurrentUser ? 'flex-end' : 'flex-start',
                                                        background: msg.isCurrentUser ? 'var(--arc-yellow)' : '#1a1a1a',
                                                        color: msg.isCurrentUser ? '#000' : '#fff'
                                                    }}
                                                >
                                                    {!msg.isCurrentUser && <p style={styles.messageSender}>{msg.sender}</p>}
                                                    <p style={styles.messageText}>{msg.text}</p>
                                                    <p style={{
                                                        ...styles.messageTime,
                                                        color: msg.isCurrentUser ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'
                                                    }}>
                                                        {new Date(msg.timestamp).toLocaleTimeString(lang === 'TH' ? 'th-TH' : 'en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Input */}
                                    <div style={styles.inputContainer}>
                                        <input
                                            type="text"
                                            placeholder={t('TYPE_MSG')}
                                            value={messageInput}
                                            onChange={(e) => {
                                                console.log('Input changed:', e.target.value);
                                                setMessageInput(e.target.value);
                                            }}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            onFocus={() => console.log('Input focused')}
                                            onBlur={() => console.log('Input blurred')}
                                            style={styles.messageInputStyle}
                                            autoComplete="off"
                                        />
                                        <button style={styles.sendButton} onClick={handleSendMessage}>
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div style={styles.emptyState}>
                                    <MessageCircle size={64} color="rgba(255,255,255,0.1)" style={{ marginBottom: '20px' }} />
                                    <p style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                                        {t('START_CONVO')}
                                    </p>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                                        {t('SEARCH_USER')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// Function to generate styles based on current state
const getStyles = (isMobile, isMobileMenuOpen) => {
    return {
        overlayBackdrop: {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: isMobile ? '0' : '10px' // Remove padding on mobile for full screen
        },
        chatContainer: {
            width: '100%',
            maxWidth: isMobile ? '100%' : '1100px',
            height: isMobile ? '100%' : '700px',
            background: '#0a0a0a',
            border: isMobile ? 'none' : '1px solid #222', // Remove border on mobile
            borderRadius: isMobile ? '0' : '12px', // Remove radius on mobile
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
        },
        headerStyle: {
            padding: isMobile ? '15px 15px' : '20px 25px',
            borderBottom: '1px solid #222',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#050505',
            paddingTop: isMobile ? '45px' : '20px' // Add top padding for mobile (status bar area)
        },
        headerTitle: {
            fontSize: isMobile ? '14px' : '16px',
            fontWeight: 'bold',
            color: '#fff',
            letterSpacing: '0.5px'
        },
        iconButton: {
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)',
            transition: 'color 0.2s'
        },
        mainContent: {
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
            position: 'relative'
        },
        leftPanel: {
            width: isMobile ? '280px' : '320px',
            borderRight: '1px solid #222',
            display: 'flex',
            flexDirection: 'column',
            background: '#050505',
            position: isMobile ? 'absolute' : 'relative',
            height: '100%',
            zIndex: 10,
            transition: 'transform 0.3s ease',
            transform: !isMobile ? 'none' : (isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)'),
            boxShadow: isMobile && isMobileMenuOpen ? '5px 0 15px rgba(0,0,0,0.5)' : 'none'
        },
        searchContainer: {
            padding: '15px',
            borderBottom: '1px solid #222',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#0a0a0a'
        },
        searchInput: {
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: '13px',
            outline: 'none'
        },
        userListContainer: {
            flex: 1,
            overflowY: 'auto',
            padding: '10px'
        },
        userItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            marginBottom: '5px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s'
        },
        userAvatar: {
            width: '40px',
            height: '40px',
            minWidth: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--arc-cyan), var(--arc-yellow))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#000'
        },
        userName: {
            margin: 0,
            fontSize: isMobile ? '12px' : '13px',
            fontWeight: 'bold',
            color: '#fff',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },
        userStatus: {
            margin: 0,
            fontSize: '11px',
            color: 'rgba(255,255,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
        },
        onlineDot: {
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#00ff00'
        },
        unreadBadge: {
            minWidth: '20px',
            height: '20px',
            borderRadius: '10px',
            background: 'var(--arc-yellow)',
            color: '#000',
            fontSize: '10px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 6px'
        },
        rightPanel: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#0a0a0a',
            width: '100%' // Ensure full width
        },
        chatHeader: {
            padding: isMobile ? '12px 15px' : '15px 20px',
            borderBottom: '1px solid #222',
            background: '#050505'
        },
        chatHeaderName: {
            margin: 0,
            fontSize: isMobile ? '13px' : '14px',
            fontWeight: 'bold',
            color: '#fff'
        },
        chatHeaderStatus: {
            margin: 0,
            fontSize: '11px',
            color: 'rgba(255,255,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginTop: '3px'
        },
        messagesContainer: {
            flex: 1,
            overflowY: 'auto',
            padding: isMobile ? '15px' : '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
        },
        centerText: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'rgba(255,255,255,0.3)',
            fontSize: isMobile ? '13px' : '14px',
            padding: '20px',
            textAlign: 'center'
        },
        emptyState: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'rgba(255,255,255,0.3)'
        },
        messageBubble: {
            maxWidth: isMobile ? '85%' : '70%',
            padding: isMobile ? '8px 12px' : '10px 15px',
            borderRadius: '12px',
            marginBottom: '5px'
        },
        messageSender: {
            margin: 0,
            fontSize: '10px',
            fontWeight: 'bold',
            marginBottom: '5px',
            opacity: 0.7
        },
        messageText: {
            margin: 0,
            fontSize: isMobile ? '12px' : '13px',
            lineHeight: '1.4',
            wordWrap: 'break-word'
        },
        messageTime: {
            margin: 0,
            fontSize: '9px',
            marginTop: '5px'
        },
        inputContainer: {
            padding: isMobile ? '12px' : '20px',
            borderTop: '1px solid #222',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#050505',
            position: 'relative',
            zIndex: 20,
            paddingBottom: isMobile ? '20px' : '20px' // Add padding for mobile bottom safe area if needed
        },
        messageInputStyle: {
            flex: 1,
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '25px',
            padding: isMobile ? '12px 16px' : '14px 20px',
            color: '#fff',
            fontSize: isMobile ? '14px' : '14px',
            outline: 'none',
            transition: 'border-color 0.2s',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
        },
        sendButton: {
            background: 'var(--arc-yellow)',
            border: 'none',
            borderRadius: '50%',
            width: isMobile ? '40px' : '48px',
            height: isMobile ? '40px' : '48px',
            color: '#000',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(255, 200, 0, 0.2)'
        }
    };
};

export default ChatOverlay;
