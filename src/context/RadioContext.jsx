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

  // MediaSession setup - call after user gesture for iOS to register
  const updateMediaSession = useCallback((station, playing) => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: station.name,
      artist: `${station.freq} • بث مباشر`,
      album: 'راديو نرمين 🌸',
      artwork: [
        { src: station.logo, sizes: '512x512', type: 'image/png' },
        { src: station.logo, sizes: '192x192', type: 'image/png' },
      ],
    });

    // Update playback state so lock screen shows correct icon
    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
  }, []);

  // Audio element creation (once on mount)
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    // NOTE: Do NOT set crossOrigin = 'anonymous' - it breaks many radio streams on iOS
    // and prevents background audio from continuing when screen locks.

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
          audio.src = currentStationRef.current.stream;
          audio.load();
          audio.play().catch(console.warn);
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
            audio.src = currentStationRef.current.stream;
            audio.load();
            audio.play().catch(console.warn);
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
  }, [updateMediaSession]);

  // MediaSession action handlers (registered once)
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const resume = () => {
      if (audioRef.current && currentStationRef.current) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(console.warn);
      }
    };

    const pause = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    navigator.mediaSession.setActionHandler('play', resume);
    navigator.mediaSession.setActionHandler('pause', pause);
    navigator.mediaSession.setActionHandler('stop', pause);
    // Remove seek handlers - don't apply to live radio
    try {
      navigator.mediaSession.setActionHandler('seekto', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
    } catch (_) {}
  }, []);

  // Network monitor
  useEffect(() => {
    let beepInterval = null;

    const handleOnline = () => {
      setIsOnline(true);
      if (beepInterval) clearInterval(beepInterval);
      if (currentStationRef.current && audioRef.current) {
        audioRef.current.src = currentStationRef.current.stream;
        audioRef.current.load();
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(console.warn);
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
  }, [isOnline, triggerDisconnectBeep]);

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
      } else {
        audioRef.current?.play()
          .then(() => setIsPlaying(true))
          .catch(console.warn);
      }
      return;
    }

    currentStationRef.current = station;
    setCurrentStation(station);
    setIsLoading(true);

    if (reconnectRef.current) clearTimeout(reconnectRef.current);
    if (stallTimerRef.current) clearTimeout(stallTimerRef.current);

    setRecents(prev =>
      [station.id, ...prev.filter(id => id !== station.id)].slice(0, 8)
    );

    if (audioRef.current) {
      audioRef.current.src = station.stream;
      audioRef.current.load();
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
          updateMediaSession(station, true);
        })
        .catch(err => {
          console.warn('Audio playback error:', err);
          setIsLoading(false);
          setIsPlaying(false);
        });
    }

    updateMediaSession(station, true);
  }, [isPlaying, updateMediaSession]);

  const resumeAudio = useCallback(() => {
    if (audioRef.current && currentStationRef.current) {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(console.warn);
    }
  }, []);

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
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
    }}>
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio() {
  return useContext(RadioContext);
}
