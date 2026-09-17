import React from 'react';
import { Play, Pause, Heart } from 'lucide-react';
import { useRadio } from '../context/RadioContext';
import { STATIONS } from '../data/stations';

export default function PlayerBar({ onOpenSchedule }) {
  const { currentStation, nowPlaying, isPlaying, isLoading, playStation, pauseAudio, resumeAudio, favorites, toggleFavorite } = useRadio();

  const station = currentStation || STATIONS[0];
  const isFav = favorites.includes(station.id);

  const displayTitle = currentStation
    ? (nowPlaying?.title && nowPlaying.title !== 'Live Broadcast' ? nowPlaying.title : station.name)
    : 'اختر إذاعة للتشغيل';

  const displaySubtitle = currentStation
    ? (nowPlaying?.artist ? `${nowPlaying.artist} • ${station.name}` : `${station.freq} • بث مباشر`)
    : (station.freq + ' • بث مباشر');

  const displayLogo = (nowPlaying?.art && isPlaying) ? nowPlaying.art : station.logo;

  const handleTogglePlay = () => {
    if (!currentStation) {
      playStation(STATIONS[0]);
    } else if (isPlaying) {
      pauseAudio();
    } else {
      resumeAudio();
    }
  };

  return (
    <div className={`player-bar ${isPlaying ? 'is-playing' : ''}`}>
      {/* Equalizer Top Wave */}
      <div className="player-wave">
        <div className="visualizer-container">
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
          <div className="bar"></div>
        </div>
      </div>

      <div className="player-inner">
        <div className="player-thumb" onClick={onOpenSchedule} title="عرض جدول البرامج" style={{ cursor: 'pointer' }}>
          <img src={displayLogo} alt={station.name} onError={(e) => { e.target.src = station.logo; }} />
          {isPlaying && <span className="live-dot"></span>}
        </div>

        <div className="player-info" onClick={onOpenSchedule} title="عرض جدول البرامج" style={{ cursor: 'pointer' }}>
          <h4>{displayTitle}</h4>
          <p>{displaySubtitle}</p>
        </div>

        <div className="player-controls">
          {/* Favorite button */}
          <button 
            className={`fav-toggle-btn ${isFav ? 'is-fav' : ''}`}
            onClick={() => toggleFavorite(station.id)}
            title={isFav ? "إزالة من المفضلة 💔" : "إضافة للمفضلة ❤️"}
            aria-label="المفضلة"
          >
            <Heart size={22} fill={isFav ? '#ff4e88' : 'none'} color={isFav ? '#ff4e88' : '#646f90'} />
          </button>

          <button className="play-btn" onClick={handleTogglePlay} aria-label="تشغيل">
            {isLoading ? (
              <div className="spinner"></div>
            ) : isPlaying ? (
              <Pause size={22} fill="#fff" />
            ) : (
              <Play size={22} fill="#fff" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
