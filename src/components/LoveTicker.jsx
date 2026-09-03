import React from 'react';
import { Heart, Sparkles } from 'lucide-react';

export default function LoveTicker() {
  return (
    <div className="love-ticker">
      <div className="love-ticker-content">
        <Sparkles size={16} className="ticker-sparkle" />
        <span>تطبيق الإذاعة الخاص بنرمين 🌸 استمعي لأجمل الإذاعات والأغاني المصرية في أي وقت!</span>
        <Heart size={16} fill="#ff4e88" color="#ff4e88" />
      </div>
    </div>
  );
}
