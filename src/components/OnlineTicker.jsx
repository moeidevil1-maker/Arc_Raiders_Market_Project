import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, Activity } from 'lucide-react';

const OnlineTicker = () => {
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        const fetchActivities = async () => {
            // 1. Fetch real users from profiles
            const { data: users } = await supabase
                .from('profiles')
                .select('email')
                .limit(10);

            if (users && users.length > 0) {
                // 2. Generate mixed "fake" live activities using real usernames
                const actions = [
                    'is online',
                    'is online',
                    'is online',
                    'just listed a Mission',
                    'is browsing Market',
                    'is looking for a team',
                    'updated their profile'
                ];

                const generatedActivities = users.map(user => {
                    const name = user.email.split('@')[0];
                    const randomAction = actions[Math.floor(Math.random() * actions.length)];
                    return { name, action: randomAction };
                });

                // Duplicate list to ensure smooth infinite scroll
                setActivities([...generatedActivities, ...generatedActivities]);
            }
        };

        fetchActivities();

        // Optional: Set up an interval to shuffle/refresh data every few minutes
        const interval = setInterval(fetchActivities, 60000);
        return () => clearInterval(interval);
    }, []);

    if (activities.length === 0) return null;

    return (
        <div style={{
            width: '100%',
            overflow: 'hidden',
            background: 'rgba(0, 20, 0, 0.9)',
            borderTop: '1px solid rgba(0, 255, 0, 0.2)',
            borderBottom: '1px solid rgba(0, 255, 0, 0.2)',
            padding: '10px 0',
            marginTop: '20px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            fontFamily: '"Courier New", Courier, monospace', // Terminal font
            whiteSpace: 'nowrap'
        }}>
            {/* Gradient Masks for fade effect */}
            <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: '50px',
                background: 'linear-gradient(90deg, rgba(0,0,0,1) 0%, transparent 100%)',
                zIndex: 2
            }} />
            <div style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: '50px',
                background: 'linear-gradient(-90deg, rgba(0,0,0,1) 0%, transparent 100%)',
                zIndex: 2
            }} />

            {/* Scrolling Content */}
            <div className="ticker-track" style={{
                display: 'inline-flex',
                animation: 'ticker 40s linear infinite',
                paddingLeft: '100%', // Start from right
            }}>
                {activities.map((item, index) => (
                    <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginRight: '50px',
                        color: '#0f0', // Terminal Green
                        fontSize: '14px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        textShadow: '0 0 5px rgba(0, 255, 0, 0.5)'
                    }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            background: '#0f0',
                            borderRadius: '50%',
                            marginRight: '10px',
                            boxShadow: '0 0 5px #0f0'
                        }} />
                        <span style={{ fontWeight: 'bold', marginRight: '6px' }}>{item.name}</span>
                        <span style={{ opacity: 0.8 }}>{item.action}</span>
                    </div>
                ))}
            </div>

            {/* Inject CSS Animation */}
            <style>{`
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-100%); }
                }
                .ticker-track:hover {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
};

export default OnlineTicker;
