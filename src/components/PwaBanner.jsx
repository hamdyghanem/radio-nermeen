import React, { useState, useEffect } from 'react';
import { Share, PlusSquare, X } from 'lucide-react';

export default function PwaBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show on iOS Safari that hasn't installed as PWA yet
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    // Also show for non-iOS browsers that support install (Chrome Android, etc)
    const isAndroid = /Android/.test(navigator.userAgent);
    const isStandalone =
      window.navigator.standalone ||
      window.matchMedia('(display-mode: standalone)').matches;
    const dismissed = localStorage.getItem('nermeen_pwa_dismissed');

    if (!isStandalone && !dismissed && (isIOS || isAndroid)) {
      // Small delay so page renders first
      const t = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('nermeen_pwa_dismissed', 'true');
  };

  if (!show) return null;

  return (
    <div className="pwa-banner">
      <div className="pwa-content">
        <span className="pwa-icon">📲</span>
        <div className="pwa-text">
          <strong>ثبّتي "راديو نرمين" على آيفون كتطبيق!</strong>
          <p>
            اضغطي زر{' '}
            <span>مشاركة <Share size={13} /></span>{' '}
            في Safari ثم اختري{' '}
            <span>إضافة إلى الشاشة الرئيسية <PlusSquare size={13} /></span>
          </p>
        </div>
        <button className="close-pwa" onClick={handleDismiss} aria-label="إغلاق">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
