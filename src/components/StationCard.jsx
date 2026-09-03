import React from 'react';
import { Heart, Play } from 'lucide-react';
import { useRadio } from '../context/RadioContext';

export default function StationCard({ station }) {
  const { currentStation, isPlaying, playStation, favorites, toggleFavorite } = useRadio();

  const isCurrent = currentStation?.id === station.id && isPlaying;
  const isFav = favorites.includes(station.id);

  return (
    <div 
      className={`station-card ${isCurrent ? 'playing' : ''}`}
      onClick={() => playStation(station)}
    >
      {/* Favorite button */}
      <div className="fav-buttons-group" onClick={(e) => e.stopPropagation()}>
        <button 
          className={`card-fav-btn ${isFav ? 'active' : ''}`}
          onClick={() => toggleFavorite(station.id)}
          title={isFav ? "إزالة من المفضلة 💔" : "إضافة للمفضلة ❤️"}
          aria-label="المفضلة"
        >
          <Heart size={16} fill={isFav ? '#ff4e88' : 'none'} color={isFav ? '#ff4e88' : '#9aa3c0'} />
        </button>
      </div>

      <div className="station-logo-wrapper">
        <img className="station-logo" src={station.logo} alt={station.name} loading="lazy" />
        <div className="play-overlay">
          <div className="play-circle">
            <Play size={20} fill="#fff" />
          </div>
        </div>
      </div>

      <h4 className="station-name">{station.name}</h4>
      <p className="station-desc">{station.freq} • {station.desc}</p>
    </div>
  );
}
