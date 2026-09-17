import React, { useState } from 'react';
import { Radio, Moon, Sun, Heart, Calendar, RotateCw } from 'lucide-react';
import { useRadio } from '../context/RadioContext';

export default function Header({ onOpenTimer, onOpenSchedule, theme, onToggleTheme }) {
  const { timerRemaining } = useRadio();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timerMins = Math.ceil(timerRemaining / 60);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 250);
  };

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
          onClick={onOpenSchedule} 
          title="جدول البرامج اليومي"
          aria-label="جدول البرامج"
        >
          <Calendar size={20} />
        </button>

        <button 
          className={`icon-btn ${isRefreshing ? 'is-spinning' : ''}`}
          onClick={handleRefresh} 
          title="تحديث الصفحة"
          aria-label="تحديث الصفحة"
        >
          <RotateCw size={19} />
        </button>

        <button 
          className="icon-btn" 
          onClick={onOpenTimer} 
          title="مؤقت النوم"
          aria-label="مؤقت النوم"
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
          aria-label="تغيير المظهر"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>
    </header>
  );
}
