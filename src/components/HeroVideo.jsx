import React, { useEffect, useRef } from 'react';

const HeroVideo = ({ videoId, start, end, style }) => {
    const playerRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        // Function to initialize the player
        const initPlayer = () => {
            // Check if YT is available
            if (!window.YT) return;

            // Destroy existing player if any to prevent duplicates
            if (playerRef.current) {
                playerRef.current.destroy();
            }

            playerRef.current = new window.YT.Player(containerRef.current, {
                videoId: videoId,
                height: '100%',
                width: '100%',
                playerVars: {
                    autoplay: 1,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    iv_load_policy: 3,
                    loop: 1,
                    modestbranding: 1,
                    playsinline: 1,
                    rel: 0,
                    showinfo: 0,
                    mute: 1,
                    playlist: videoId, // Important for looping, though we handle seeking manually too
                    start: start,
                    end: end
                },
                events: {
                    onReady: (event) => {
                        event.target.mute();
                        event.target.playVideo();
                    },
                    onStateChange: (event) => {
                        // When video ends (0), seek back to start time manually
                        // This fixes the issue where standard loop ignores 'start' parameter
                        if (event.data === window.YT.PlayerState.ENDED) {
                            event.target.seekTo(start);
                            event.target.playVideo();
                        }
                    }
                }
            });
        };

        // Check if API script is already loaded
        if (window.YT && window.YT.Player) {
            initPlayer();
        } else {
            // Load API if not present
            if (!document.getElementById('yt-api-script')) {
                const tag = document.createElement('script');
                tag.id = 'yt-api-script';
                tag.src = "https://www.youtube.com/iframe_api";
                const firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            }

            // Setup global callback
            const previousOnReady = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (previousOnReady) previousOnReady();
                initPlayer();
            };
        }

        return () => {
            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch (e) {
                    console.error('Error destroying player', e);
                }
            }
        };
    }, [videoId, start, end]);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                pointerEvents: 'none', // Prevent user interaction
                ...style // Merge passed styles
            }}
        />
    );
};

export default HeroVideo;
