import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { STATIONS } from '../data/stations';

const RadioContext = createContext();

export function RadioProvider({ children }) {
  const [currentStation, setCurrentStation] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Favorites state: Nermeen's favorites
  const [favorites, setFavorites] = useState(() => {
    return JSON.parse(localStorage.getItem('nermeen_radio_favs') || '[]');
  });

  // Recently Played
  const [recents, setRecents] = useState(() => {
    return JSON.parse(localStorage.getItem('nermeen_radio_recents') || '[]');
  });

  // Sleep Timer
  const [timerRemaining, setTimerRemaining] = useState(0); // in seconds
  const timerRef = useRef(null);

  // Online / Offline state & Beep alert
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const audioCtxRef = useRef(null);

  // Synthesize warning beep for disconnection using Web Audio API (works 100% offline)
  const triggerDisconnectBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContextClass();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Dual-tone double beep (880Hz / A5 warning)
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
  };

  // Monitor network status & run repeating beep when disconnected
  useEffect(() => {
    let beepInterval = null;

    const handleOnline = () => {
      setIsOnline(true);
      if (beepInterval) clearInterval(beepInterval);
      // Auto reconnect stream if active
      if (currentStation && audioRef.current) {
        audioRef.current.src = currentStation.stream;
        audioRef.current.load();
        audioRef.current.play().then(() => setIsPlaying(true)).catch(console.warn);
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
      beepInterval = setInterval(() => {
        triggerDisconnectBeep();
      }, 2500);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (beepInterval) clearInterval(beepInterval);
    };
  }, [isOnline, currentStation]);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.preload = 'none';
    audioRef.current.crossOrigin = 'anonymous';

    audioRef.current.onwaiting = () => setIsLoading(true);
    audioRef.current.onplaying = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };
    audioRef.current.onpause = () => setIsPlaying(false);
    audioRef.current.onerror = () => {
      setIsLoading(false);
      setIsPlaying(false);
      // Check if error is caused by loss of internet
      if (!navigator.onLine) {
        setIsOnline(false);
      }
    };

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('nermeen_radio_favs', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('nermeen_radio_recents', JSON.stringify(recents));
  }, [recents]);

  // Sleep Timer countdown ticker
  useEffect(() => {
    if (timerRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimerRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            pauseAudio();
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
  const playStation = (station) => {
    if (currentStation?.id === station.id) {
      if (isPlaying) {
        pauseAudio();
      } else {
        resumeAudio();
      }
      return;
    }

    setCurrentStation(station);
    setIsLoading(true);
    
    // Update Recents
    setRecents(prev => [station.id, ...prev.filter(id => id !== station.id)].slice(0, 8));

    if (audioRef.current) {
      audioRef.current.src = station.stream;
      audioRef.current.load();
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      }).catch(err => {
        console.warn('Audio playback error:', err);
        setIsLoading(false);
        setIsPlaying(false);
      });
    }

    // MediaSession iOS lockscreen controls
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: station.name,
        artist: `${station.freq} • بث مباشر`,
        album: 'راديو نرمين 🌸',
        artwork: [{ src: station.logo, sizes: '512x512', type: 'image/png' }]
      });

      navigator.mediaSession.setActionHandler('play', () => resumeAudio());
      navigator.mediaSession.setActionHandler('pause', () => pauseAudio());
    }
  };

  const resumeAudio = () => {
    if (audioRef.current && currentStation) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.warn);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Toggle favorite ❤️
  const toggleFavorite = (stationId) => {
    setFavorites(prev => 
      prev.includes(stationId) ? prev.filter(id => id !== stationId) : [...prev, stationId]
    );
  };

  // Sleep timer setter
  const startSleepTimer = (minutes) => {
    setTimerRemaining(minutes * 60);
  };

  const cancelSleepTimer = () => {
    setTimerRemaining(0);
  };

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
      triggerDisconnectBeep
    }}>
      {children}
    </RadioContext.Provider>
  );
}

export function useRadio() {
  return useContext(RadioContext);
}
