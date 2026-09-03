import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { STATIONS } from '../data/stations';

const RadioContext = createContext();

export function RadioProvider({ children }) {
  const [currentStation, setCurrentStation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Favorites state
  const [favorites, setFavorites] = useState(() => {
    return JSON.parse(localStorage.getItem('nermeen_radio_favs') || '[]');
  });

  // Recently Played
  const [recents, setRecents] = useState(() => {
    return JSON.parse(localStorage.getItem('nermeen_radio_recents') || '[]');
  });

  // Sleep Timer
  const [timerRemaining, setTimerRemaining] = useState(0);
  const timerRef = useRef(null);

  // Audio HTML5 ref
  const audioRef = useRef(null);

  // Store current station in a ref so callbacks access it without stale closures
  const currentStationRef = useRef(null);

  // Online / Offline state
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const audioCtxRef = useRef(null);

  // Auto-reconnect tracking
  const reconnectRef = useRef(null);
  const stallTimerRef = useRef(null);

  // Synthesize warning beep for disconnection using Web Audio API (works offline)
  const triggerDisconnectBeep = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContextClass();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } catch (err) {
      console.warn('Web Audio beep error:', err);
    }
  }, []);

  // Helper to ensure logo URL is absolute (critical for iOS Lockscreen MediaMetadata)
  const getAbsoluteLogo = (logoUrl) => {
    if (!logoUrl) return (typeof window !== 'undefined' ? window.location.origin : '') + '/apple-touch-icon.png';
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) return logoUrl;
    return (typeof window !== 'undefined' ? window.location.origin : '') + logoUrl;
  };

  // MediaSession setup - call after user gesture for iOS to register lockscreen controls
  const updateMediaSession = useCallback((station, playing) => {
    if (!('mediaSession' in navigator)) return;

    const absoluteLogo = getAbsoluteLogo(station.logo);

    navigator.mediaSession.metadata = new MediaMetadata({
      title: station.name,
      artist: `${station.freq} • بث مباشر`,
      album: 'راديو نرمين 🌸',
      artwork: [
        { src: absoluteLogo, sizes: '512x512', type: 'image/png' },
        { src: absoluteLogo, sizes: '192x192', type: 'image/png' },
      ],
    });

    // Update playback state so lock screen shows correct icon
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  }, []);

  // Central method to start / reconnect live stream cleanly (handles iOS background resume)
  const startLiveStream = useCallback((station) => {
    if (!audioRef.current || !station) return;

    setIsLoading(true);

    // Always re-assign src and load to attach to the live edge (avoids iOS stale buffer on screen off)
    audioRef.current.src = station.stream;
    audioRef.current.load();

    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
          updateMediaSession(station, true);
        })
        .catch(err => {
          console.warn('Live playback error:', err);
          setIsLoading(false);
          setIsPlaying(false);
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
          }
        });
    }

    updateMediaSession(station, true);
  }, [updateMediaSession]);

  // Audio element creation (once on mount)
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';

    audio.onwaiting = () => setIsLoading(true);

    audio.onplaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
      if (currentStationRef.current) {
        updateMediaSession(currentStationRef.current, true);
      }
    };

    audio.onpause = () => {
      setIsPlaying(false);
      if (currentStationRef.current) {
        updateMediaSession(currentStationRef.current, false);
      }
    };

    audio.onstalled = () => {
      // Stalled: stream froze. Wait 5s then try reconnecting
      setIsLoading(true);
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
      stallTimerRef.current = setTimeout(() => {
        if (currentStationRef.current && navigator.onLine) {
          console.log('[Radio] Stream stalled, reconnecting...');
          startLiveStream(currentStationRef.current);
        }
      }, 5000);
    };

    audio.onerror = () => {
      setIsLoading(false);
      setIsPlaying(false);
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }
      // Auto-reconnect after 3 seconds on stream error
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (currentStationRef.current) {
        reconnectRef.current = setTimeout(() => {
          if (currentStationRef.current && navigator.onLine) {
            console.log('[Radio] Stream error, reconnecting...');
            startLiveStream(currentStationRef.current);
          }
        }, 3000);
      }
    };

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
    };
  }, [updateMediaSession, startLiveStream]);

  // Next / Previous station for iOS lockscreen & controls
  const playNextStation = useCallback(() => {
    if (!currentStationRef.current) return;
    const currentIndex = STATIONS.findIndex(s => s.id === currentStationRef.current.id);
    const nextIndex = (currentIndex + 1) % STATIONS.length;
    const nextStation = STATIONS[nextIndex];
    currentStationRef.current = nextStation;
    setCurrentStation(nextStation);
    startLiveStream(nextStation);
  }, [startLiveStream]);

  const playPrevStation = useCallback(() => {
    if (!currentStationRef.current) return;
    const currentIndex = STATIONS.findIndex(s => s.id === currentStationRef.current.id);
    const prevIndex = (currentIndex - 1 + STATIONS.length) % STATIONS.length;
    const prevStation = STATIONS[prevIndex];
    currentStationRef.current = prevStation;
    setCurrentStation(prevStation);
    startLiveStream(prevStation);
  }, [startLiveStream]);

  // MediaSession action handlers (registered for iOS lockscreen / headphones)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    // Resuming from lockscreen: re-attach live stream head fresh!
    const handleResume = () => {
      if (currentStationRef.current) {
        startLiveStream(currentStationRef.current);
      }
    };

    const handlePause = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'paused';
        }
      }
    };

    navigator.mediaSession.setActionHandler('play', handleResume);
    navigator.mediaSession.setActionHandler('pause', handlePause);
    navigator.mediaSession.setActionHandler('stop', handlePause);
    navigator.mediaSession.setActionHandler('nexttrack', playNextStation);
    navigator.mediaSession.setActionHandler('previoustrack', playPrevStation);

    try {
      navigator.mediaSession.setActionHandler('seekto', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
    } catch (_) {}
  }, [startLiveStream, playNextStation, playPrevStation]);

  // Network monitor
  useEffect(() => {
    let beepInterval = null;

    const handleOnline = () => {
      setIsOnline(true);
      if (beepInterval) clearInterval(beepInterval);
      if (currentStationRef.current && audioRef.current) {
        startLiveStream(currentStationRef.current);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsPlaying(false);
      triggerDisconnectBeep();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!isOnline) {
      triggerDisconnectBeep();
      beepInterval = setInterval(() => triggerDisconnectBeep(), 2500);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (beepInterval) clearInterval(beepInterval);
    };
  }, [isOnline, triggerDisconnectBeep, startLiveStream]);

  // Persist state
  useEffect(() => {
    localStorage.setItem('nermeen_radio_favs', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('nermeen_radio_recents', JSON.stringify(recents));
  }, [recents]);

  // Sleep Timer countdown
  useEffect(() => {
    if (timerRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimerRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            if (audioRef.current) audioRef.current.pause();
            setIsPlaying(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRemaining > 0]);

  // Play a specific station
  const playStation = useCallback((station) => {
    if (currentStationRef.current?.id === station.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'paused';
        }
      } else {
        startLiveStream(station);
      }
      return;
    }

    currentStationRef.current = station;
    setCurrentStation(station);

    if (reconnectRef.current) clearTimeout(reconnectRef.current);
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current);

    setRecents(prev =>
      [station.id, ...prev.filter(id => id !== station.id)].slice(0, 8)
    );

    startLiveStream(station);
  }, [isPlaying, startLiveStream]);

  const resumeAudio = useCallback(() => {
    if (currentStationRef.current) {
      startLiveStream(currentStationRef.current);
    }
  }, [startLiveStream]);

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    }
  }, []);

  const toggleFavorite = useCallback((stationId) => {
    setFavorites(prev =>
      prev.includes(stationId)
        ? prev.filter(id => id !== stationId)
        : [...prev, stationId]
    );
  }, []);

  const startSleepTimer = useCallback((minutes) => {
    setTimerRemaining(minutes * 60);
  }, []);

  const cancelSleepTimer = useCallback(() => {
    setTimerRemaining(0);
  }, []);

  return (
    <RadioContext.Provider value={{
      currentStation,
      isPlaying,
      isLoading,
      isOnline,
      favorites,
      recents,
      timerRemaining,
      playStation,
      resumeAudio,
      pauseAudio,
      toggleFavorite,
      startSleepTimer,
      cancelSleepTimer,
      triggerDisconnectBeep,
      playNextStation,
      playPrevStation
    }}>
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio() {
  return useContext(RadioContext);
}
