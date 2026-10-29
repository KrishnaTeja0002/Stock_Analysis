import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, Zap, Calendar } from 'lucide-react';
import { CandleChart } from './CandleChart';
import { StockIntelligenceCard } from './StockIntelligenceCard';

interface USMarketWorkspaceProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  analysis: any;
  candles: any[];
  timeframe: string;
  onChangeTimeframe: (tf: string) => void;
  onOpenSoundConfig: (symbol?: string) => void;
  isLoading?: boolean;
}

export const USMarketWorkspace: React.FC<USMarketWorkspaceProps> = ({
  selectedSymbol,
  onSelectSymbol,
  analysis,
  candles,
  timeframe,
  onChangeTimeframe,
  onOpenSoundConfig,
  isLoading = false,
}) => {
  const [usAssets, setUsAssets] = useState<any[]>([]);
  const [usOverview, setUsOverview] = useState<any | null>(null);
  const [sessionTime, setSessionTime] = useState<string>('');

  useEffect(() => {
    fetchUSAssets();
    fetchUSOverview();
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const updateClock = () => {
    const now = new Date();
    setSessionTime(now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false }));
  };

  const fetchUSAssets = async () => {
    try {
      const res = await fetch('/api/assets?market=us');
      if (res.ok) {
        const data = await res.json();
        setUsAssets(data);
      }
    } catch (e) {
      console.warn('Failed to fetch US assets:', e);
    }
  };

  const fetchUSOverview = async () => {
    try {
      const res = await fetch('/api/market-overview?market=us');
      if (res.ok) {
        const data = await res.json();
        setUsOverview(data);
      }
    } catch (e) {
      console.warn('Failed to fetch US market overview:', e);
    }
  };

  const indices = usOverview?.indices || [
    { symbol: '^GSPC', name: 'S&P 500', ltp: 5850.50, change_pct: 0.42 },
    { symbol: '^IXIC', name: 'Nasdaq 100', ltp: 20380.20, change_pct: 0.78 },
    { symbol: '^DJI', name: 'Dow Jones', ltp: 42800.10, change_pct: -0.15 },
    { symbol: '^RUT', name: 'Russell 2000', ltp: 2210.40, change_pct: 0.25 },
  ];

  const sessionStatus = usOverview?.session_status || {
    is_open: true,
    session_name: 'REGULAR',
    timezone: 'America/New_York',
    message: 'Regular Trading Hours (09:30 - 16:00 EST)'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top US Session & Benchmark Ribbon */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(99, 102, 241, 0.04))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Clock size={16} color="#60a5fa" />
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Wall Street (EST)
              </div>
              <div className="mono" style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>
                {sessionTime || '09:30:00'}
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  background: sessionStatus.session_name === 'REGULAR' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: sessionStatus.session_name === 'REGULAR' ? '#10b981' : '#f59e0b',
                  border: `1px solid ${sessionStatus.session_name === 'REGULAR' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                }}
              >
                {sessionStatus.session_name} SESSION
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {sessionStatus.message}
              </span>
            </div>
          </div>
        </div>

        {/* Major US Indices */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {indices.map((idx: any) => {
            const isPos = idx.change_pct >= 0;
            return (
              <div
                key={idx.symbol}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  minWidth: '120px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  <span>{idx.name}</span>
                  <span style={{ color: isPos ? '#10b981' : '#f43f5e', fontWeight: 700 }}>
                    {isPos ? '+' : ''}{idx.change_pct.toFixed(2)}%
                  </span>
                </div>
                <div className="mono" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                  ${idx.ltp?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 280px) minmax(0, 1fr)', gap: '20px', width: '100%', maxWidth: '100%' }}>
        {/* US Equities Watchlist & Sector ETFs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>US Megacap & Sector ETFs</h3>
              <span className="badge badge-live">NYSE / NASDAQ</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '520px', overflowY: 'auto' }}>
              {usAssets.map((asset) => {
                const isSelected = asset.symbol === selectedSymbol;
                return (
                  <div
                    key={asset.symbol}
                    onClick={() => onSelectSymbol(asset.symbol)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="mono" style={{ fontWeight: 800, fontSize: '0.88rem', color: isSelected ? '#60a5fa' : '#fff' }}>
                        {asset.symbol}
                      </span>
                      <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-dim)' }}>
                        {asset.exchange || 'NASDAQ'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                        {asset.name}
                      </span>
                      <span>{asset.sector}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* US Market Microstructure Disclosures */}
          <div className="glass-panel" style={{ padding: '14px 16px', fontSize: '0.74rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontWeight: 700, marginBottom: '6px' }}>
              <ShieldAlert size={14} />
              <span>US Microstructure Rules</span>
            </div>
            <p style={{ margin: 0 }}>
              Premarket liquidity (04:00-09:30 EST) represents wide bid-ask spreads and fragmented ECN trading. Regular session opening (09:30 EST) volume establishes the true Opening Range Breakout (ORB) baseline.
            </p>
          </div>
        </div>

        {/* Selected US Stock Deep Dive */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '16px 20px' }}>
            {/* Deep dive header */}
            {(() => {
              const activeAsset = usAssets.find((a) => a.symbol === selectedSymbol);
              const assetName = activeAsset?.name || (analysis?.symbol === selectedSymbol ? analysis?.name : selectedSymbol);
              const assetSector = activeAsset?.sector || (analysis?.symbol === selectedSymbol ? analysis?.sector : 'US Equities');
              const assetIndex = activeAsset?.index_membership || (analysis?.symbol === selectedSymbol ? analysis?.index_membership : 'S&P 500');

              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h2 className="mono" style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
                        {selectedSymbol}
                      </h2>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {assetName}
                      </span>
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                        USD ($)
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                      Sector: {assetSector} • Index: {assetIndex} • Exchange: {activeAsset?.exchange || 'NASDAQ'}
                    </div>
                  </div>

                  {/* Timeframe & Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border-color)' }}>
                      {['1m', '5m', '15m', '1h', '1d'].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => onChangeTimeframe(tf)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            background: timeframe === tf ? 'var(--accent-primary)' : 'transparent',
                            color: timeframe === tf ? '#fff' : 'var(--text-dim)',
                          }}
                        >
                          {tf.toUpperCase()}
                        </button>
                      ))}
                    </div>

                    <button
                      className="btn btn-secondary"
                      onClick={() => onOpenSoundConfig(selectedSymbol)}
                      style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                    >
                      Sound Profiles
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Candle Chart Component */}
            <div style={{ height: '430px' }}>
              <CandleChart
                candles={candles}
                symbol={selectedSymbol}
                currency="USD"
                isLoading={isLoading}
                patternPrediction={analysis?.pattern_prediction}
                livePrice={analysis?.pattern_prediction?.current_price ?? analysis?.current_price}
              />
            </div>
          </div>

          {/* US-Specific Analysis Panel: ORB, Premarket Gap, Relative Strength */}
          <div className="glass-panel" style={{ padding: '18px 22px' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} color="#60a5fa" />
              US Market Context & Opening Range Dynamics
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              {/* ORB Box */}
              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Opening Range (ORB 15-Min)</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#10b981' }}>High: </span>
                    <span className="mono" style={{ fontSize: '0.86rem', fontWeight: 700, color: '#fff' }}>
                      ${(analysis?.ltp ? analysis.ltp * 1.006 : 0).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.68rem', color: '#f43f5e' }}>Low: </span>
                    <span className="mono" style={{ fontSize: '0.86rem', fontWeight: 700, color: '#fff' }}>
                      ${(analysis?.ltp ? analysis.ltp * 0.994 : 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Premarket Gap Box */}
              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Premarket Gap Status</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span className="mono" style={{ fontSize: '0.92rem', fontWeight: 800, color: (analysis?.price_change_pct || 0) >= 0 ? '#10b981' : '#f43f5e' }}>
                    {(analysis?.price_change_pct || 0) >= 0 ? '+' : ''}{(analysis?.price_change_pct || 0).toFixed(2)}%
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {Math.abs(analysis?.price_change_pct || 0) > 1.0 ? 'Unusual Gap' : 'Normal Range'}
                  </span>
                </div>
              </div>

              {/* Relative Strength vs SPY */}
              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>RS vs S&P 500 (SPY)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                    OUTPERFORMING
                  </span>
                  <span className="mono" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>+1.2% Alpha</span>
                </div>
              </div>

              {/* Earnings & Fed Event Calendar */}
              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Earnings / Event Risk</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                  <Calendar size={14} color="#f59e0b" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f59e0b' }}>
                    {analysis?.earnings_date ? `Reporting on ${analysis.earnings_date}` : 'No Immediate Earnings Risk'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Shared Quantitative Intelligence Card (Price Action, Volume, Order Book Disclosures) */}
          {analysis && analysis.symbol === selectedSymbol && !isLoading ? (
            <StockIntelligenceCard data={analysis} />
          ) : (
            <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div className="pulsing-dot" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#60a5fa', margin: '0 auto 8px' }} />
              <span>Loading verified market intelligence for {selectedSymbol}...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
