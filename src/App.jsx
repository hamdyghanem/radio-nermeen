import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { RadioProvider } from './context/RadioContext';
import Header from './components/Header';
import LoveTicker from './components/LoveTicker';
import FavoritesShelf from './components/FavoritesShelf';
import StationGrid from './components/StationGrid';
import PlayerBar from './components/PlayerBar';
import SleepTimerModal from './components/SleepTimerModal';
import PwaBanner from './components/PwaBanner';
import OfflineNotice from './components/OfflineNotice';
import { STATIONS } from './data/stations';

export default function App() {
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('hn_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hn_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <RadioProvider>
      <div className="bg-lights">
        <div className="light-blob blob-1"></div>
        <div className="light-blob blob-2"></div>
        <div className="light-blob blob-3"></div>
      </div>

      <PwaBanner />
      <OfflineNotice />

      <div className="app-container">
        <Header 
          onOpenTimer={() => setIsTimerOpen(true)} 
          theme={theme} 
          onToggleTheme={toggleTheme} 
        />

        <LoveTicker />

        <main className="main-content">
          <FavoritesShelf />

          <StationGrid stations={STATIONS} />

          <footer className="app-footer">
            <p>With my love <Heart className="footer-heart" size={16} fill="#ff4e88" color="#ff4e88" /> , Hamdi</p>
          </footer>
        </main>

        <PlayerBar />

        <SleepTimerModal 
          isOpen={isTimerOpen} 
          onClose={() => setIsTimerOpen(false)} 
        />
      </div>
    </RadioProvider>
  );
}
