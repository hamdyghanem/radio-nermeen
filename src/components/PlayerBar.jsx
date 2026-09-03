import React from 'react';
import { Play, Pause, Heart } from 'lucide-react';
import { useRadio } from '../context/RadioContext';
import { STATIONS } from '../data/stations';

export default function PlayerBar() {
  const { currentStation, isPlaying, isLoading, playStation, pauseAudio, resumeAudio, favorites, toggleFavorite } = useRadio();

  const station = currentStation || STATIONS[0];
  const isFav = favorites.includes(station.id);

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
        <div className="player-thumb">
          <img src={station.logo} alt={station.name} />
          {isPlaying && <span className="live-dot"></span>}
        </div>

        <div className="player-info">
          <h4>{currentStation ? station.name : 'اختر إذاعة للتشغيل'}</h4>
          <p>{station.freq} • بث مباشر</p>
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
