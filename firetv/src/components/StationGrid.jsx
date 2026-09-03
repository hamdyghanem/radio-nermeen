import React from 'react';
import { Search } from 'lucide-react';
import StationCard from './StationCard';

export default function StationGrid({ stations }) {
  return (
    <section className="section-container">
      <div className="section-header">
        <h3>📻 جميع الإذاعات المصرية المباشرة</h3>
        <span className="count-tag">{stations.length} إذاعة</span>
      </div>

      {stations.length === 0 ? (
        <div className="no-results">
          <div className="no-res-icon"><Search size={40} /></div>
          <h4>لم نجد إذاعة بهذا الاسم</h4>
          <p>جربي البحث بكلمة أخرى مثل: 9090، نجوم، أم كلثوم، التسعينات...</p>
        </div>
      ) : (
        <div className="stations-grid">
          {stations.map(station => (
            <StationCard key={station.id} station={station} />
          ))}
        </div>
      )}
    </section>
  );
}
