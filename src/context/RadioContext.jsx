import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { STATIONS } from '../data/stations';
import { getStationScheduleNow } from '../data/schedule';

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

  // Live Track / Show Now Playing info
  const [nowPlaying, setNowPlaying] = useState({ title: '', artist: '', art: '' });

  // Sleep Timer
  const [timerRemaining, setTimerRemaining] = useState(0);
  const timerRef = useRef(null);

  // Audio HTML5 ref
  const audioRef = useRef(null);

  // Store current station in a ref so callbacks access it without stale closures
  const currentStationRef = useRef(null);
  const nowPlayingRef = useRef({ title: '', artist: '', art: '' });

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
  const getAbsoluteLogo = useCallback((logoUrl) => {
    if (!logoUrl) return (typeof window !== 'undefined' ? window.location.origin : '') + '/apple-touch-icon.png';
    if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) return logoUrl;
    return (typeof window !== 'undefined' ? window.location.origin : '') + logoUrl;
  }, []);

  // Forward ref functions for Next/Prev stations
  const playNextStationRef = useRef(null);
  const playPrevStationRef = useRef(null);
  const startLiveStreamRef = useRef(null);

  // MediaSession setup - updates iOS / Browser Lock Screen & CarPlay
  const updateMediaSession = useCallback((station, playing, liveMeta = null) => {
    if (!('mediaSession' in navigator) || !station) return;

    const meta = liveMeta || nowPlayingRef.current;
    const schedule = getStationScheduleNow(station.id);

    let title = station.name;
    let artist = `${station.freq} • بث مباشر`;
    let artworkSrc = getAbsoluteLogo(station.logo);

    if (meta.title && meta.title !== 'Live Broadcast' && meta.title !== station.name) {
      title = meta.title;
      artist = meta.artist ? `${meta.artist} • ${station.name}` : `${station.freq} • بث مباشر`;
      if (meta.art) artworkSrc = meta.art;
    } else if (schedule) {
      title = schedule.title;
      artist = schedule.artist;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: title,
      artist: artist,
      album: station.name || 'راديو نرمين 🌸',
      artwork: [
        { src: artworkSrc, sizes: '512x512', type: 'image/png' },
        { src: artworkSrc, sizes: '192x192', type: 'image/png' },
      ],
    });

    navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';

    // Register Next/Previous Track to replace the 10s skip buttons in iOS Lock Screen & CarPlay
    navigator.mediaSession.setActionHandler('play', () => {
      if (startLiveStreamRef.current && currentStationRef.current) {
        startLiveStreamRef.current(currentStationRef.current);
      }
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'paused';
        }
      }
    });

    navigator.mediaSession.setActionHandler('stop', () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'paused';
        }
      }
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (playNextStationRef.current) playNextStationRef.current();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (playPrevStationRef.current) playPrevStationRef.current();
    });
  }, [getAbsoluteLogo]);

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

  // Next / Previous station for iOS lockscreen & steering wheel
  const playNextStation = useCallback(() => {
    if (!currentStationRef.current) return;
    
    // If user has favorited multiple stations, cycle favorites first!
    const favStations = STATIONS.filter(s => favorites.includes(s.id));
    const stationPool = favStations.length > 1 ? favStations : STATIONS;

    const currentIndex = stationPool.findIndex(s => s.id === currentStationRef.current.id);
    const nextIndex = (currentIndex + 1) % stationPool.length;
    const nextStation = stationPool[nextIndex];

    currentStationRef.current = nextStation;
    setCurrentStation(nextStation);
    startLiveStream(nextStation);
  }, [favorites, startLiveStream]);

  const playPrevStation = useCallback(() => {
    if (!currentStationRef.current) return;

    const favStations = STATIONS.filter(s => favorites.includes(s.id));
    const stationPool = favStations.length > 1 ? favStations : STATIONS;

    const currentIndex = stationPool.findIndex(s => s.id === currentStationRef.current.id);
    const prevIndex = (currentIndex - 1 + stationPool.length) % stationPool.length;
    const prevStation = stationPool[prevIndex];

    currentStationRef.current = prevStation;
    setCurrentStation(prevStation);
    startLiveStream(prevStation);
  }, [favorites, startLiveStream]);

  // Keep refs in sync so MediaSession always invokes latest callbacks
  useEffect(() => {
    playNextStationRef.current = playNextStation;
    playPrevStationRef.current = playPrevStation;
    startLiveStreamRef.current = startLiveStream;
  }, [playNextStation, playPrevStation, startLiveStream]);

  // Network monitor & audio recovery on focus / resume
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

    // Auto-resume live stream if interrupted by phone call / background suspend
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying && audioRef.current?.paused && currentStationRef.current) {
        console.log('[Radio] Page visible, re-attaching live stream head...');
        startLiveStream(currentStationRef.current);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    if (!isOnline) {
      triggerDisconnectBeep();
      beepInterval = setInterval(() => triggerDisconnectBeep(), 2500);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (beepInterval) clearInterval(beepInterval);
    };
  }, [isOnline, isPlaying, triggerDisconnectBeep, startLiveStream]);

  // Live metadata polling for current station (API song info or Cairo schedule)
  useEffect(() => {
    let metaInterval = null;

    const fetchStationMeta = async () => {
      const station = currentStationRef.current;
      if (!station) {
        setNowPlaying({ title: '', artist: '', art: '' });
        nowPlayingRef.current = { title: '', artist: '', art: '' };
        return;
      }

      const schedule = getStationScheduleNow(station.id);
      let resolvedMeta = {
        title: schedule ? schedule.title : station.name,
        artist: schedule ? schedule.artist : `${station.freq} • بث مباشر`,
        art: schedule?.art || ''
      };

      if (station.apiUrl) {
        try {
          const res = await fetch(station.apiUrl);
          if (res.ok) {
            const data = await res.json();
            const rawTitle = data.now_playing?.song?.title || '';
            const rawArtist = data.now_playing?.song?.artist || data.live?.streamer_name || '';
            const rawArt = data.now_playing?.song?.art || '';

            if (rawTitle && rawTitle !== 'Live Broadcast') {
              resolvedMeta = {
                title: rawTitle,
                artist: rawArtist || station.name,
                art: rawArt.startsWith('http') ? rawArt : (schedule?.art || '')
              };
            }
          }
        } catch (err) {
          console.warn('Metadata fetch error:', err);
        }
      }

      setNowPlaying(resolvedMeta);
      nowPlayingRef.current = resolvedMeta;

      if (isPlaying && currentStationRef.current) {
        updateMediaSession(currentStationRef.current, true, resolvedMeta);
      }
    };

    if (currentStation) {
      fetchStationMeta();
      metaInterval = setInterval(fetchStationMeta, 10000);
    } else {
      setNowPlaying({ title: '', artist: '', art: '' });
      nowPlayingRef.current = { title: '', artist: '', art: '' };
    }

    return () => {
      if (metaInterval) clearInterval(metaInterval);
    };
  }, [currentStation, isPlaying, updateMediaSession]);

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
      STATIONS,
      nowPlaying,
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
