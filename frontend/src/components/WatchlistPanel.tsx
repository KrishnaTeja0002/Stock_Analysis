import React, { useState } from 'react';
import { Search, Plus, Trash2, Volume2, Power } from 'lucide-react';

export interface AssetItem {
  symbol: string;
  name: string;
  nse_symbol: string;
  bse_code?: string;
  asset_class: string;
  sector: string;
  industry: string;
  index_membership: string;
  market_cap_category: string;
  provider: string;
  timeframe: string;
  is_monitored: boolean;
  cooldown_seconds: number;
}

interface WatchlistPanelProps {
  assets: AssetItem[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onToggleMonitoring: (symbol: string, monitored: boolean) => void;
  onRemoveAsset: (symbol: string) => void;
  onAddAsset: (symbol: string, name: string, nseSymbol: string, sector: string, mcap: string, provider: string, timeframe: string) => void;
  onOpenSoundConfig: (symbol?: string) => void;
  latestResults: Record<string, any>;
}

export const WatchlistPanel: React.FC<WatchlistPanelProps> = ({
  assets,
  selectedSymbol,
  onSelectSymbol,
  onToggleMonitoring,
  onRemoveAsset,
  onAddAsset,
  onOpenSoundConfig,
  latestResults,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (e) {
      console.warn('Search error:', e);
    }
  };

  const handleAddDirect = () => {
    const raw = searchQuery.trim().toUpperCase();
    if (!raw) return;
    if (searchResults.length > 0) {
      handleSelectSearchResult(searchResults[0]);
    } else {
      const sym = raw.includes('.') || raw.includes('-') ? raw : `${raw}.NS`;
      onAddAsset(sym, raw, raw.replace('.NS', ''), 'Equities', 'Large Cap', 'yfinance', '5m');
      setSearchQuery('');
      setSearchResults([]);
      onSelectSymbol(sym);
    }
  };

  const handleSelectSearchResult = (item: any) => {
    onAddAsset(
      item.symbol, item.name, item.nse_symbol || item.symbol.replace('.NS', ''),
      item.sector || 'Indian Equities', item.market_cap_category || 'Large Cap',
      'yfinance', '5m'
    );
    setSearchQuery('');
    setSearchResults([]);
    onSelectSymbol(item.symbol);
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header & Search */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>NSE/BSE Watchlist</h3>
          <span className="badge badge-live">{assets.filter((a) => a.is_monitored).length} Active</span>
        </div>

        {/* Search Bar Input */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
          >
            <Search size={16} color="var(--text-dim)" />
            <input
              type="text"
              placeholder="Search or type company/ticker (Press Enter)..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddDirect();
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '0.82rem',
                outline: 'none',
                width: '100%',
              }}
            />
            {searchQuery.trim().length > 0 && (
              <button
                onClick={handleAddDirect}
                title="Add to Watchlist"
                style={{
                  background: 'var(--accent-primary)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={12} />
                <span>Add</span>
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                background: '#161e2e',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                zIndex: 50,
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                maxHeight: '260px',
                overflowY: 'auto',
              }}
            >
              {searchResults.map((item) => (
                <div
                  key={item.symbol}
                  onClick={() => handleSelectSearchResult(item)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="mono" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                        {item.nse_symbol || item.symbol}
                      </span>
                      {item.bse_code && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                          BSE: {item.bse_code}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      {item.name} • {item.sector}
                    </div>
                  </div>
                  <Plus size={14} color="#818cf8" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Asset Items List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {assets.map((asset) => {
          const isSelected = asset.symbol === selectedSymbol;
          const liveData = latestResults[asset.symbol];
          const price = liveData?.current_price;
          const pct = liveData?.price_change_pct;
          const state = liveData?.momentum_state || liveData?.trend_state;

          const isUp = state && (state.toLowerCase().includes('up') || state.toLowerCase().includes('breakout'));
          const isDown = state && (state.toLowerCase().includes('down') || state.toLowerCase().includes('breakdown'));

          return (
            <div
              key={asset.symbol}
              onClick={() => onSelectSymbol(asset.symbol)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '6px',
                cursor: 'pointer',
                background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="mono" style={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff' }}>
                      {asset.nse_symbol || asset.symbol.replace('.NS', '')}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: '4px' }}>
                      {asset.sector}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', maxWidth: '170px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {asset.name}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  {price !== undefined && (
                    <>
                      <div className="mono" style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>
                        ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div
                        className="mono"
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: pct >= 0 ? '#10b981' : '#f43f5e',
                        }}
                      >
                        {pct >= 0 ? `+${pct.toFixed(2)}%` : `${pct.toFixed(2)}%`}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* State Pill & Action Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: isUp ? '#10b981' : isDown ? '#f43f5e' : 'var(--text-dim)',
                    background: isUp ? 'rgba(16, 185, 129, 0.1)' : isDown ? 'rgba(244, 63, 94, 0.1)' : 'rgba(255,255,255,0.03)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {state || 'Monitoring...'}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    title="Asset Sound Profile"
                    onClick={() => onOpenSoundConfig(asset.symbol)}
                    style={{ background: 'none', color: 'var(--text-dim)', padding: '4px' }}
                  >
                    <Volume2 size={14} />
                  </button>
                  <button
                    title={asset.is_monitored ? 'Pause Monitoring' : 'Resume Monitoring'}
                    onClick={() => onToggleMonitoring(asset.symbol, !asset.is_monitored)}
                    style={{ background: 'none', color: asset.is_monitored ? '#10b981' : 'var(--text-dim)', padding: '4px' }}
                  >
                    <Power size={14} />
                  </button>
                  <button
                    title="Remove Asset"
                    onClick={() => onRemoveAsset(asset.symbol)}
                    style={{ background: 'none', color: 'var(--text-dim)', padding: '4px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
