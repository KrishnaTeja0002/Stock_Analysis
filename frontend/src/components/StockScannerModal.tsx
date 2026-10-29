import React, { useState } from 'react';
import { Filter, X, ArrowUpRight, RefreshCw } from 'lucide-react';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStock: (symbol: string) => void;
}

export const StockScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectStock,
}) => {
  const [sector, setSector] = useState<string>('all');
  const [marketCap, setMarketCap] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [hypothesisFilter, setHypothesisFilter] = useState<string>('all');
  const [minRvol, setMinRvol] = useState<number>(1.0);
  const [aboveVwapOnly, setAboveVwapOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('momentum_score');

  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleScan = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector: sector === 'all' ? null : sector,
          market_cap: marketCap === 'all' ? null : marketCap,
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

  React.useEffect(() => {
    if (isOpen) {
      handleScan();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '1060px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#111724',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, rgba(99, 102, 241, 0.12), transparent)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
              }}
            >
              <Filter size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                Indian Equities Quantitative Scanner
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Filter & rank NSE equities by momentum acceleration, VWAP distance, and volume confirmation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              color: 'var(--text-muted)',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(255, 255, 255, 0.02)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '12px',
            alignItems: 'end',
          }}
        >
          {/* Sector Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
              Sector
            </label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              style={{
                width: '100%',
                background: '#1a2333',
                color: '#fff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '6px 8px',
                fontSize: '0.76rem',
              }}
            >
              <option value="all">All Sectors</option>
              <option value="financial">Financial Services</option>
              <option value="information technology">Information Technology</option>
              <option value="automobile">Automobile</option>
              <option value="energy">Energy & Oil/Gas</option>
              <option value="healthcare">Healthcare / Pharma</option>
              <option value="metals">Metals & Mining</option>
              <option value="consumer">Consumer Goods / FMCG</option>
            </select>
          </div>

          {/* Market Cap Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
              Market Cap
            </label>
            <select
              value={marketCap}
              onChange={(e) => setMarketCap(e.target.value)}
              style={{
                width: '100%',
                background: '#1a2333',
                color: '#fff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '6px 8px',
                fontSize: '0.76rem',
              }}
            >
              <option value="all">All Caps</option>
              <option value="Large Cap">Large Cap</option>
              <option value="Mid Cap">Mid Cap</option>
              <option value="Small Cap">Small Cap</option>
            </select>
          </div>

          {/* Momentum State Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
              Momentum State
            </label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              style={{
                width: '100%',
                background: '#1a2333',
                color: '#fff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '6px 8px',
                fontSize: '0.76rem',
              }}
            >
              <option value="all">All States</option>
              <option value="upward">Upward (Any)</option>
              <option value="Accelerating upward">Accelerating Up</option>
              <option value="breakout">Breakout</option>
              <option value="downward">Downward (Any)</option>
              <option value="breakdown">Breakdown</option>
              <option value="reversal">Reversal</option>
            </select>
          </div>

          {/* Structural Hypothesis Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
              Hypothesis
            </label>
            <select
              value={hypothesisFilter}
              onChange={(e) => setHypothesisFilter(e.target.value)}
              style={{
                width: '100%',
                background: '#1a2333',
                color: '#fff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '6px 8px',
                fontSize: '0.76rem',
              }}
            >
              <option value="all">All Hypotheses</option>
              <option value="Accumulation">Accumulation</option>
              <option value="Distribution">Distribution</option>
              <option value="profit-booking">Profit Booking</option>
              <option value="Breakout without">Unconfirmed Breakout</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
              Rank By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                background: '#1a2333',
                color: '#fff',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '6px 8px',
                fontSize: '0.76rem',
              }}
            >
              <option value="momentum_score">Momentum Score</option>
              <option value="rvol">RVOL (Volume)</option>
              <option value="price_change">Price Change %</option>
            </select>
          </div>

          {/* RVOL Threshold Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
              <span>Min RVOL</span>
              <span className="mono" style={{ color: '#818cf8', fontWeight: 600 }}>{minRvol}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={minRvol}
              onChange={(e) => setMinRvol(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#6366f1' }}
            />
          </div>

          {/* Above VWAP Toggle & Run Action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={aboveVwapOnly}
                onChange={(e) => setAboveVwapOnly(e.target.checked)}
                style={{ accentColor: '#10b981' }}
              />
              <span>Price &gt; VWAP Only</span>
            </label>
            <button
              onClick={handleScan}
              disabled={isLoading}
              className="btn-primary"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '6px 10px', fontSize: '0.76rem' }}
            >
              <RefreshCw size={13} className={isLoading ? 'pulsing-dot' : ''} />
              <span>{isLoading ? 'Scanning...' : 'Scan Market'}</span>
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Found <strong style={{ color: '#fff' }}>{results.length}</strong> equities matching criteria
            </span>
          </div>

          {results.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              No equities match the selected combination of filters. Try lowering the RVOL threshold or selecting All Sectors.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)' }}>
                    <th style={{ padding: '8px 12px' }}>Symbol</th>
                    <th style={{ padding: '8px 12px' }}>Price (₹)</th>
                    <th style={{ padding: '8px 12px' }}>Change</th>
                    <th style={{ padding: '8px 12px' }}>Momentum State</th>
                    <th style={{ padding: '8px 12px' }}>Structural Hypothesis</th>
                    <th style={{ padding: '8px 12px' }}>RVOL</th>
                    <th style={{ padding: '8px 12px' }}>VWAP Dist</th>
                    <th style={{ padding: '8px 12px' }}>Confidence</th>
                    <th style={{ padding: '8px 12px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => {
                    const isUp = r.momentum_state?.toLowerCase().includes('up') || r.momentum_state?.toLowerCase().includes('breakout');
                    const isDown = r.momentum_state?.toLowerCase().includes('down') || r.momentum_state?.toLowerCase().includes('breakdown');
                    return (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                          backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                        }}
                      >
                        <td style={{ padding: '10px 12px' }}>
                          <div className="mono" style={{ fontWeight: 700, color: '#fff' }}>{r.nse_symbol}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{r.sector}</div>
                        </td>
                        <td className="mono" style={{ padding: '10px 12px', fontWeight: 600, color: '#fff' }}>
                          ₹{r.current_price?.toFixed(2)}
                        </td>
                        <td className="mono" style={{ padding: '10px 12px', fontWeight: 700, color: r.price_change_pct >= 0 ? '#10b981' : '#f43f5e' }}>
                          {r.price_change_pct >= 0 ? `+${r.price_change_pct.toFixed(2)}%` : `${r.price_change_pct.toFixed(2)}%`}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ color: isUp ? '#10b981' : isDown ? '#f43f5e' : '#f59e0b', fontWeight: 600 }}>
                            {r.momentum_state}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                          {r.structural_hypothesis}
                        </td>
                        <td className="mono" style={{ padding: '10px 12px', fontWeight: 600, color: r.trade_flow?.relative_volume_tod >= 1.3 ? '#10b981' : 'var(--text-dim)' }}>
                          {r.trade_flow?.relative_volume_tod}x
                        </td>
                        <td className="mono" style={{ padding: '10px 12px', color: r.trade_flow?.distance_from_vwap_pct >= 0 ? '#10b981' : '#f43f5e' }}>
                          {r.trade_flow?.distance_from_vwap_pct >= 0 ? `+${r.trade_flow?.distance_from_vwap_pct}%` : `${r.trade_flow?.distance_from_vwap_pct}%`}
                        </td>
                        <td className="mono" style={{ padding: '10px 12px', fontWeight: 700, color: '#818cf8' }}>
                          {r.signal_scores?.overall_confidence}%
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <button
                            onClick={() => {
                              onSelectStock(r.symbol);
                              onClose();
                            }}
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <span>Open</span>
                            <ArrowUpRight size={12} />
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
    </div>
  );
};
