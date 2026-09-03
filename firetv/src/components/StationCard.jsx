import React from 'react';
import { Heart } from 'lucide-react';
import { useRadio } from '../context/RadioContext';

export default function StationCard({ station }) {
  const { currentStation, isPlaying, playStation, favorites, toggleFavorite } = useRadio();

  const isCurrent = currentStation?.id === station.id;
  const isActivelyPlaying = isCurrent && isPlaying;
  const isFav = favorites.includes(station.id);

  return (
    <div
      className={`station-card ${isCurrent ? 'is-selected' : ''} ${isActivelyPlaying ? 'is-playing' : ''}`}
      onClick={() => playStation(station)}
      role="button"
      tabIndex={0}
      aria-label={`تشغيل ${station.name}`}
    >
      {/* Favorite button — stops propagation so it doesn't trigger play */}
      <div className="fav-buttons-group" onClick={(e) => e.stopPropagation()}>
        <button
          className={`card-fav-btn ${isFav ? 'active' : ''}`}
          onClick={() => toggleFavorite(station.id)}
          title={isFav ? 'إزالة من المفضلة 💔' : 'إضافة للمفضلة ❤️'}
          aria-label="المفضلة"
        >
          <Heart size={16} fill={isFav ? '#ff4e88' : 'none'} color={isFav ? '#ff4e88' : '#9aa3c0'} />
        </button>
      </div>

      {/* Logo — no play overlay, just a glow ring when playing */}
      <div className="station-logo-wrapper">
        <img className="station-logo" src={station.logo} alt={station.name} loading="lazy" />
        {/* Animated equalizer bars shown only on the active playing card */}
        {isActivelyPlaying && (
          <div className="playing-indicator">
            <span /><span /><span /><span /><span />
          </div>
        )}
      </div>

      <h4 className="station-name">{station.name}</h4>
      <p className="station-desc">{station.freq} • {station.desc}</p>
    </div>
  );
}
