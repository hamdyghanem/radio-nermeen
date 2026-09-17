import React from 'react';
import { X, Calendar, Clock, Radio, Play, CheckCircle2 } from 'lucide-react';
import { useRadio } from '../context/RadioContext';
import { getStationDailySchedule, getCairoNow } from '../data/schedule';

export default function ScheduleModal({ isOpen, onClose }) {
  const { currentStation, STATIONS, playStation, isPlaying } = useRadio();

  if (!isOpen) return null;

  const station = currentStation || (STATIONS && STATIONS[0]) || { id: 'nogoum-fm', name: 'نجوم إف إم' };
  const dailyShows = getStationDailySchedule(station.id);
  const { day, hour, minute } = getCairoNow();

  const dayNames = {
    Sun: 'الأحد',
    Mon: 'الإثنين',
    Tue: 'الثلاثاء',
    Wed: 'الأربعاء',
    Thu: 'الخميس',
    Fri: 'الجمعة',
    Sat: 'السبت'
  };

  const formattedTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content schedule-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="schedule-header-title">
            <Calendar size={22} color="#ff4e88" />
            <h3>جدول برامج {station.name}</h3>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </div>

        <div className="schedule-meta-bar">
          <span className="cairo-clock">
            <Clock size={16} /> بتوقيت القاهرة: <strong>{dayNames[day] || day} {formattedTime}</strong>
          </span>
          <span className="station-tag">{station.freq || 'بث مباشر'}</span>
        </div>

        <div className="shows-list">
          {dailyShows.map((show, idx) => (
            <div 
              key={idx} 
              className={`show-card ${show.isCurrent ? 'is-on-air' : ''}`}
            >
              <div className="show-art-wrap">
                <img 
                  src={show.art || station.logo} 
                  alt={show.title} 
                  onError={(e) => { e.target.src = station.logo; }}
                />
                {show.isCurrent && (
                  <span className="on-air-badge">
                    <span className="pulse-circle"></span> الآن
                  </span>
                )}
              </div>

              <div className="show-details">
                <div className="show-time">
                  <Clock size={14} /> {show.start} — {show.end}
                </div>
                <h4 className="show-title">{show.title}</h4>
                <p className="show-host">تقديم: {show.host}</p>
                {show.desc && <p className="show-desc">{show.desc}</p>}
              </div>

              {show.isCurrent && (
                <div className="show-action">
                  <button 
                    className="tune-in-btn"
                    onClick={() => playStation(station)}
                    title="استماع الآن"
                  >
                    <Radio size={18} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="primary-btn" onClick={onClose}>
            إغلاق الجدول
          </button>
        </div>
      </div>
    </div>
  );
}
