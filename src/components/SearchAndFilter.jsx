import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchAndFilter({ searchQuery, setSearchQuery }) {
  return (
    <section className="controls-section">
      <div className="search-box">
        <Search className="search-icon" size={18} />
        <input
          type="search"
          placeholder="ابحث عن أي إذاعة (مثال: نجوم أف أم، 9090، أم كلثوم...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="clear-btn" onClick={() => setSearchQuery('')}>
            <X size={16} />
          </button>
        )}
      </div>
    </section>
  );
}
