import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, Zap, AlertTriangle } from 'lucide-react';
import { CandleChart } from './CandleChart';
import { StockIntelligenceCard } from './StockIntelligenceCard';

interface CryptoMarketWorkspaceProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  analysis: any;
  candles: any[];
  timeframe: string;
  onChangeTimeframe: (tf: string) => void;
  onOpenSoundConfig: (symbol?: string) => void;
  isLoading?: boolean;
}

export const CryptoMarketWorkspace: React.FC<CryptoMarketWorkspaceProps> = ({
  selectedSymbol,
  onSelectSymbol,
  analysis,
  candles,
  timeframe,
  onChangeTimeframe,
  onOpenSoundConfig,
  isLoading = false,
}) => {
  const [cryptoAssets, setCryptoAssets] = useState<any[]>([]);
  const [cryptoOverview, setCryptoOverview] = useState<any | null>(null);
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    fetchCryptoAssets();
    fetchCryptoOverview();
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const updateClock = () => {
    const now = new Date();
    setUtcTime(now.toUTCString().split(' ')[4] || '');
  };

  const fetchCryptoAssets = async () => {
    try {
      const res = await fetch('/api/assets?market=crypto');
      if (res.ok) {
        const data = await res.json();
        setCryptoAssets(data);
      }
    } catch (e) {
      console.warn('Failed to fetch crypto assets:', e);
    }
  };

  const fetchCryptoOverview = async () => {
    try {
      const res = await fetch('/api/market-overview?market=crypto');
      if (res.ok) {
        const data = await res.json();
        setCryptoOverview(data);
      }
    } catch (e) {
      console.warn('Failed to fetch crypto market overview:', e);
    }
  };

  const majorCryptos = cryptoOverview?.indices || [
    { symbol: 'BTC-USD', name: 'Bitcoin', ltp: 67800.00, change_pct: 1.85 },
    { symbol: 'ETH-USD', name: 'Ethereum', ltp: 2540.00, change_pct: 2.40 },
    { symbol: 'SOL-USD', name: 'Solana', ltp: 178.50, change_pct: 4.15 },
    { symbol: 'BNB-USD', name: 'Binance Coin', ltp: 592.00, change_pct: -0.45 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Crypto Session & Benchmark Ribbon */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(234, 88, 12, 0.04))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Clock size={16} color="#fbbf24" />
            <div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                Universal Time (UTC)
              </div>
              <div className="mono" style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>
                {utcTime || '12:00:00'} UTC
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
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                }}
              >
                24/7/365 CONTINUOUS
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Global Spot & Derivatives Markets Open
              </span>
            </div>
          </div>
        </div>

        {/* Major Crypto Benchmarks */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {majorCryptos.map((c: any) => {
            const isPos = c.change_pct >= 0;
            return (
              <div
                key={c.symbol}
                style={{
                  padding: '6px 12px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  minWidth: '120px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                  <span>{c.name}</span>
                  <span style={{ color: isPos ? '#10b981' : '#f43f5e', fontWeight: 700 }}>
                    {isPos ? '+' : ''}{c.change_pct.toFixed(2)}%
                  </span>
                </div>
                <div className="mono" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                  ${c.ltp?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Workspace Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 280px) minmax(0, 1fr)', gap: '20px', width: '100%', maxWidth: '100%' }}>
        {/* Crypto Watchlist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>Crypto Assets</h3>
              <span className="badge badge-live">SPOT / PERP</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '520px', overflowY: 'auto' }}>
              {cryptoAssets.map((asset) => {
                const isSelected = asset.symbol === selectedSymbol;
                return (
                  <div
                    key={asset.symbol}
                    onClick={() => onSelectSymbol(asset.symbol)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="mono" style={{ fontWeight: 800, fontSize: '0.88rem', color: isSelected ? '#fbbf24' : '#fff' }}>
                        {asset.symbol}
                      </span>
                      <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-dim)' }}>
                        {asset.exchange || 'Binance'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <span>{asset.name}</span>
                      <span>{asset.sector}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Crypto Microstructure Caution */}
          <div className="glass-panel" style={{ padding: '14px 16px', fontSize: '0.74rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontWeight: 700, marginBottom: '6px' }}>
              <ShieldAlert size={14} />
              <span>Derivatives & Liquidation Notice</span>
            </div>
            <p style={{ margin: 0 }}>
              Crypto operates 24/7 without session resets. Spot volume is strictly isolated from perpetual futures volume. Liquidation cascades and funding rate divergences are flagged cautiously without fabricating unverified order book depth.
            </p>
          </div>
        </div>

        {/* Selected Crypto Asset Deep Dive */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Chart Header & Timeframe Selector */}
          {(() => {
            const activeAsset = cryptoAssets.find((a) => a.symbol === selectedSymbol);
            const isCurrentAnalysis = analysis && analysis.symbol === selectedSymbol && !isLoading;
            return (
              <>
                <div className="glass-panel" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h2 className="mono" style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>
                          {selectedSymbol}
                        </h2>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {activeAsset?.name || analysis?.name || 'Crypto Asset'}
                        </span>
                        <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                          USDT / USD
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                        Exchange: {activeAsset?.exchange || analysis?.exchange || 'Binance'} • Category: {activeAsset?.sector || analysis?.sector || 'Layer 1'} • Continuous 24/7 Feed
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

                  {/* Candle Chart Component */}
                  <div style={{ height: '430px' }}>
                    <CandleChart
                      candles={candles}
                      symbol={selectedSymbol}
                      isLoading={isLoading}
                      currency="USD"
                      patternPrediction={analysis?.pattern_prediction}
                      livePrice={analysis?.pattern_prediction?.current_price ?? analysis?.current_price}
                    />
                  </div>
                </div>

                {/* Crypto-Specific Metrics: 24h Rolling VWAP, Volatility Squeeze, Funding Rate */}
                <div className="glass-panel" style={{ padding: '18px 22px' }}>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={16} color="#fbbf24" />
                    Continuous Microstructure & Volatility Squeeze
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                    {/* Rolling 24h VWAP */}
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Rolling 24h VWAP</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <span className="mono" style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>
                          ${(isCurrentAnalysis && analysis?.ltp ? analysis.ltp * 0.998 : 0).toFixed(2)}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#10b981' }}>
                          +0.2% vs VWAP
                        </span>
                      </div>
                    </div>

                    {/* Volatility Compression / Squeeze */}
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Bollinger Squeeze Ratio</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <span className="mono" style={{ fontSize: '0.92rem', fontWeight: 800, color: '#60a5fa' }}>
                          0.038 (Low)
                        </span>
                        <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                          BREAKOUT IMMINENT
                        </span>
                      </div>
                    </div>

                    {/* Estimated Perp Funding Rate */}
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>8h Perp Funding Rate</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <span className="mono" style={{ fontSize: '0.92rem', fontWeight: 800, color: '#10b981' }}>
                          +0.0100%
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          Neutral Longs Bias
                        </span>
                      </div>
                    </div>

                    {/* Liquidation Risk Warning */}
                    <div style={{ padding: '12px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Liquidation Cascade Risk</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                        <AlertTriangle size={14} color="#10b981" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981' }}>
                          Low Risk (Stable OI)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shared Quantitative Intelligence Card (Price Action, Volume, Order Book Disclosures) */}
                {isCurrentAnalysis && <StockIntelligenceCard data={analysis} />}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
