import React from 'react';
import { WifiOff, Volume2 } from 'lucide-react';
import { useRadio } from '../context/RadioContext';

export default function OfflineNotice() {
  const { isOnline } = useRadio();

  if (isOnline) return null;

  return (
    <div className="offline-notice">
      <div className="offline-content">
        <div className="offline-icon-pulse">
          <WifiOff size={20} className="wifi-off-icon" />
        </div>
        <div className="offline-text">
          <strong>انقطع الاتصال بالإنترنت ⚠️</strong>
          <p>يصدر التطبيق تنبيهاً صوتياً (Beep) متكرراً لحين عودة الاتصال واستئناف البث تلقائياً.</p>
        </div>
        <div className="beep-indicator">
          <Volume2 size={18} className="beep-sound-wave" />
        </div>
      </div>
    </div>
  );
}
