import React from 'react';
import { Heart } from 'lucide-react';
import { useRadio } from '../context/RadioContext';
import { STATIONS } from '../data/stations';
import StationCard from './StationCard';

export default function FavoritesShelf() {
  const { favorites } = useRadio();

  const favStations = STATIONS.filter(s => favorites.includes(s.id));

  if (favStations.length === 0) return null;

  return (
    <div className="favorites-shelves-wrapper">
      <section className="section-container">
        <div className="section-header">
          <h3><Heart fill="#ff4e88" color="#ff4e88" size={18} /> إذاعاتكِ المفضلة 🌸</h3>
          <span className="count-tag">{favStations.length} إذاعات</span>
        </div>
        <div className="stations-grid horizontal-scroll custom-scroll">
          {favStations.map(station => (
            <StationCard key={`fav-${station.id}`} station={station} />
          ))}
        </div>
      </section>
    </div>
  );
}
