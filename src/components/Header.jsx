import React from 'react';
import { Radio, Moon, Sun, Heart } from 'lucide-react';
import { useRadio } from '../context/RadioContext';

export default function Header({ onOpenTimer, theme, onToggleTheme }) {
  const { timerRemaining } = useRadio();
  const timerMins = Math.ceil(timerRemaining / 60);

  return (
    <header className="top-header">
      <div className="brand">
        <div className="logo-icon">
          <Radio className="radio-svg" />
          <span className="live-pulse"></span>
        </div>
        <div className="brand-text">
          <h1>راديو نرمين <Heart className="heart-badge" fill="#ff4e88" color="#ff4e88" size={18} /></h1>
          <span className="sub-title">إذاعات مصر بث مباشر</span>
        </div>
      </div>

      <div className="header-actions">
        <button 
          className="icon-btn" 
          onClick={onOpenTimer} 
          title="مؤقت النوم"
        >
          <Moon size={20} />
          {timerRemaining > 0 && (
            <span className="badge">{timerMins}m</span>
          )}
        </button>

        <button 
          className="icon-btn" 
          onClick={onToggleTheme} 
          title="تغيير المظهر"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </header>
  );
}
