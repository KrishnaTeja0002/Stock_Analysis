import React, { useState, useEffect } from 'react';
import { Filter, ArrowUpRight, RefreshCw } from 'lucide-react';

interface AssetScannerWorkspaceProps {
  onSelectAsset: (symbol: string, market: 'india' | 'us' | 'crypto') => void;
}

export const AssetScannerWorkspace: React.FC<AssetScannerWorkspaceProps> = ({
  onSelectAsset,
}) => {
  const [activeMarket, setActiveMarket] = useState<string>('all');
  const [sector, setSector] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [hypothesisFilter, setHypothesisFilter] = useState<string>('all');
  const [minRvol, setMinRvol] = useState<number>(1.0);
  const [aboveVwapOnly, setAboveVwapOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('momentum_score');

  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    handleScan();
  }, [activeMarket]);

  const handleScan = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          market: activeMarket === 'all' ? null : activeMarket,
          sector: sector === 'all' ? null : sector,
          momentum_state: stateFilter === 'all' ? null : stateFilter,
          structural_hypothesis: hypothesisFilter === 'all' ? null : hypothesisFilter,
          min_relative_volume: minRvol > 0 ? minRvol : null,
          above_vwap_only: aboveVwapOnly ? true : null,
          sort_by: sortBy,
          sort_order: 'desc',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (e) {
      console.warn('Scanner query failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getMarketFromSymbol = (symbol: string, rawMarket?: string): 'india' | 'us' | 'crypto' => {
    if (rawMarket) return rawMarket as any;
    if (symbol.endsWith('.NS') || symbol.endsWith('.BO')) return 'india';
    if (symbol.includes('-USD') || symbol.includes('-USDT')) return 'crypto';
    return 'us';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(59, 130, 246, 0.05))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(6, 182, 212, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#06b6d4',
            }}
          >
            <Filter size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Multi-Market Stock & Asset Scanner
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Filter 28+ pre-seeded assets across Indian Equities, US Equities, and Cryptocurrencies
            </p>
          </div>
        </div>

        {/* Market Category Selector Tabs */}
        <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-color)' }}>
          {[
            { id: 'all', label: 'All Markets' },
            { id: 'india', label: '🇮🇳 India Equities' },
            { id: 'us', label: '🇺🇸 US Equities' },
            { id: 'crypto', label: '🌐 Crypto' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveMarket(m.id)}
              style={{
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                background: activeMarket === m.id ? 'var(--accent-primary)' : 'transparent',
                color: activeMarket === m.id ? '#fff' : 'var(--text-dim)',
                transition: 'all 0.15s ease',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="glass-panel" style={{ padding: '18px 22px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', alignItems: 'end' }}>
          {/* Sector Filter */}
          <div>
            <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
              Sector / Industry
            </label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
            >
              <option value="all">All Sectors</option>
              <option value="Technology">Technology</option>
              <option value="Financial">Financials / Banking</option>
              <option value="Energy">Energy / Oil & Gas</option>
              <option value="Layer 1">Crypto Layer 1</option>
              <option value="Consumer">Consumer Goods</option>
            </select>
          </div>

          {/* Momentum State Filter */}
          <div>
            <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
              Momentum State
            </label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="select-input"
              style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
            >
              <option value="all">All States</option>
              <option value="BULLISH">Bullish Momentum</option>
              <option value="BEARISH">Bearish Momentum</option>
              <option value="BREAKOUT">Breakout Setups</option>
              <option value="UPTREND">Stable Uptrend</option>
              <option value="SIDEWAYS">Sideways / Consolidation</option>
              <option value="PROFIT_BOOKING">Possible Profit Booking</option>
            </select>
          </div>

          {/* Structural Hypothesis */}
          <div>
            <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
              Structural Hypothesis
            </label>
            <select
              value={hypothesisFilter}
              onChange={(e) => setHypothesisFilter(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
            >
              <option value="all">All Hypotheses</option>
              <option value="MARKUP">Markup Phase</option>
              <option value="ACCUMULATION">Accumulation</option>
              <option value="DISTRIBUTION">Distribution</option>
              <option value="BREAKOUT">Breakout Expansion</option>
              <option value="PULLBACK">Healthy Pullback</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
              Sort Results By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
            >
              <option value="momentum_score">Momentum Score</option>
              <option value="rvol">Relative Volume (RVOL)</option>
              <option value="price_change">Price Change %</option>
            </select>
          </div>

          {/* Relative Volume */}
          <div>
            <label style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
              Min RVOL: {minRvol}x
            </label>
            <input
              type="range"
              min="0.5"
              max="4.0"
              step="0.5"
              value={minRvol}
              onChange={(e) => setMinRvol(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Above VWAP Checkbox */}
          <div style={{ paddingBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: '#fff' }}>
              <input
                type="checkbox"
                checked={aboveVwapOnly}
                onChange={(e) => setAboveVwapOnly(e.target.checked)}
              />
              Above Session VWAP
            </label>
          </div>

          {/* Run Scan Button */}
          <div>
            <button
              className="btn btn-primary"
              onClick={handleScan}
              disabled={isLoading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <RefreshCw size={15} className={isLoading ? 'pulsing-dot' : ''} />
              {isLoading ? 'Scanning...' : 'Execute Scan'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
            Scan Results ({results.length} Matches)
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Sorted by {sortBy.replace(/_/g, ' ')}
          </span>
        </div>

        {results.length === 0 && !isLoading && (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No assets match the current filter criteria. Adjust minimum RVOL or state filters and re-run.
          </div>
        )}

        {results.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px' }}>Asset</th>
                  <th style={{ padding: '10px 12px' }}>Market / Sector</th>
                  <th style={{ padding: '10px 12px' }}>Price</th>
                  <th style={{ padding: '10px 12px' }}>Change %</th>
                  <th style={{ padding: '10px 12px' }}>Momentum State</th>
                  <th style={{ padding: '10px 12px' }}>Hypothesis</th>
                  <th style={{ padding: '10px 12px' }}>RVOL</th>
                  <th style={{ padding: '10px 12px' }}>Score</th>
                  <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => {
                  const isUp = r.price_change_pct >= 0;
                  const mkt = getMarketFromSymbol(r.symbol, r.market);
                  const currSym = r.currency === 'INR' ? '₹' : '$';

                  return (
                    <tr
                      key={r.symbol}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.15s ease' }}
                    >
                      <td style={{ padding: '12px' }}>
                        <div className="mono" style={{ fontWeight: 800, color: '#fff', fontSize: '0.9rem' }}>
                          {r.symbol}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.name}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-dim)', marginRight: '6px' }}>
                          {mkt.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.sector}</span>
                      </td>
                      <td className="mono" style={{ padding: '12px', fontWeight: 700, color: '#fff' }}>
                        {currSym}{r.ltp?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="mono" style={{ padding: '12px', fontWeight: 700, color: isUp ? '#10b981' : '#f43f5e' }}>
                        {isUp ? '+' : ''}{r.price_change_pct?.toFixed(2)}%
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: isUp ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                            color: isUp ? '#10b981' : '#f43f5e',
                          }}
                        >
                          {r.momentum_state}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontSize: '0.76rem', color: '#818cf8' }}>
                        {r.structural_hypothesis}
                      </td>
                      <td className="mono" style={{ padding: '12px', fontWeight: 700, color: (r.trade_flow?.relative_volume_tod || 1) > 1.5 ? '#f59e0b' : '#fff' }}>
                        {(r.trade_flow?.relative_volume_tod || 1).toFixed(2)}x
                      </td>
                      <td className="mono" style={{ padding: '12px', fontWeight: 800, color: '#60a5fa' }}>
                        {r.signal_scores?.momentum_score || 0}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => onSelectAsset(r.symbol, mkt)}
                          style={{ fontSize: '0.74rem', padding: '5px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          Analyze <ArrowUpRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
