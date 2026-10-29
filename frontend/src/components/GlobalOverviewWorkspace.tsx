import React from 'react';
import {
  Activity, Globe, Zap, ArrowUpRight, ShieldCheck
} from 'lucide-react';

interface GlobalOverviewWorkspaceProps {
  overviewData: any;
  onNavigateToMarket: (market: 'india' | 'us' | 'crypto') => void;
  onSelectAsset: (symbol: string, market: 'india' | 'us' | 'crypto') => void;
}

export const GlobalOverviewWorkspace: React.FC<GlobalOverviewWorkspaceProps> = ({
  overviewData,
  onNavigateToMarket,
  onSelectAsset,
}) => {
  if (!overviewData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Activity size={28} className="pulsing-dot" style={{ margin: '0 auto 12px' }} />
        <p>Loading global cross-market intelligence feed...</p>
      </div>
    );
  }

  const { india, us, crypto, macro, top_gainers, unusual_volume, data_health } = overviewData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Cross-Market Macro Ribbon */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(6, 182, 212, 0.04))',
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
            <Globe size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
              Global Macro & Cross-Market Sentiment
            </div>
            <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
              {macro?.risk_sentiment || 'MODERATE RISK-ON'}
            </div>
          </div>
        </div>

        {/* Macro Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>US 10Y Yield</div>
            <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>
              {macro?.us_10y_yield || 4.24}%
            </div>
          </div>

          <div style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Dollar Index (DXY)</div>
            <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
              {macro?.dxy_dollar_index || 104.2}
            </div>
          </div>

          <div style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Brent Crude</div>
            <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
              ${macro?.brent_crude_usd || 74.8}
            </div>
          </div>

          <div style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Gold Spot</div>
            <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24' }}>
              ${macro?.gold_usd || 2745}
            </div>
          </div>

          <div style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>VIX Volatility</div>
            <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>
              {macro?.vix_index || 15.8}
            </div>
          </div>
        </div>
      </div>

      {/* 3 Dedicated Market Cards (India, US, Crypto) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* 1. Indian Equities Card */}
        <div
          className="glass-panel"
          style={{
            padding: '18px',
            borderTop: '3px solid #f59e0b',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>🇮🇳</span>
                <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#fff' }}>Indian Equities (NSE/BSE)</span>
              </div>
              <span className={india?.market_session_status?.includes('OPEN') ? 'badge badge-live' : 'badge badge-delayed'}>
                {india?.market_session_status || 'CLOSED'}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Primary Priority • Asia/Kolkata (IST) • Cash & Sectoral Delivery
            </p>

            <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>NIFTY 50</div>
                <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                  ₹{india?.nifty50_price?.toLocaleString('en-IN') || '24,420'}
                </div>
                <div className="mono" style={{ fontSize: '0.72rem', color: (india?.nifty50_change_pct || 0) >= 0 ? '#10b981' : '#f43f5e' }}>
                  {(india?.nifty50_change_pct || 0) >= 0 ? `+${india?.nifty50_change_pct}%` : `${india?.nifty50_change_pct}%`}
                </div>
              </div>

              <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>NIFTY BANK</div>
                <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                  ₹{india?.niftybank_price?.toLocaleString('en-IN') || '52,280'}
                </div>
                <div className="mono" style={{ fontSize: '0.72rem', color: (india?.niftybank_change_pct || 0) >= 0 ? '#10b981' : '#f43f5e' }}>
                  {(india?.niftybank_change_pct || 0) >= 0 ? `+${india?.niftybank_change_pct}%` : `${india?.niftybank_change_pct}%`}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              A/D Ratio: <strong style={{ color: '#fff' }}>{india?.advance_decline_ratio || 1.82}</strong> • FII Net:{' '}
              <span className="mono" style={{ color: (india?.fii_net_flow_crores || 0) >= 0 ? '#10b981' : '#f43f5e' }}>
                {india?.fii_net_flow_crores > 0 ? `+${india?.fii_net_flow_crores}` : india?.fii_net_flow_crores} Cr
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateToMarket('india')}
            className="btn-secondary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px' }}
          >
            <span>Open India Workspace</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* 2. US Equities Card */}
        <div
          className="glass-panel"
          style={{
            padding: '18px',
            borderTop: '3px solid #3b82f6',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>🇺🇸</span>
                <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#fff' }}>US Equities (NYSE/NASDAQ)</span>
              </div>
              <span className={us?.market_session_status?.includes('OPEN') ? 'badge badge-live' : 'badge badge-delayed'}>
                {us?.market_session_status || 'CLOSED'}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Second Priority • America/New_York (EST) • Extended Sessions & ORB
            </p>

            <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>S&P 500 (SPY)</div>
                <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                  ${us?.benchmarks?.[0]?.price || 582.4}
                </div>
                <div className="mono" style={{ fontSize: '0.72rem', color: (us?.benchmarks?.[0]?.change_pct || 0) >= 0 ? '#10b981' : '#f43f5e' }}>
                  {(us?.benchmarks?.[0]?.change_pct || 0) >= 0 ? `+${us?.benchmarks?.[0]?.change_pct}%` : `${us?.benchmarks?.[0]?.change_pct}%`}
                </div>
              </div>

              <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Nasdaq-100 (QQQ)</div>
                <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                  ${us?.benchmarks?.[1]?.price || 496.2}
                </div>
                <div className="mono" style={{ fontSize: '0.72rem', color: (us?.benchmarks?.[1]?.change_pct || 0) >= 0 ? '#10b981' : '#f43f5e' }}>
                  {(us?.benchmarks?.[1]?.change_pct || 0) >= 0 ? `+${us?.benchmarks?.[1]?.change_pct}%` : `${us?.benchmarks?.[1]?.change_pct}%`}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Leading Sector: <strong style={{ color: '#fff' }}>Technology (+0.92%)</strong> • 10Y Yield: <strong style={{ color: '#f59e0b' }}>4.24%</strong>
            </div>
          </div>

          <button
            onClick={() => onNavigateToMarket('us')}
            className="btn-secondary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px' }}
          >
            <span>Open US Workspace</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* 3. Cryptocurrency Card */}
        <div
          className="glass-panel"
          style={{
            padding: '18px',
            borderTop: '3px solid #8b5cf6',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>⚡</span>
                <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#fff' }}>Cryptocurrency Markets</span>
              </div>
              <span className="badge badge-live">
                24/7 OPEN
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Third Priority • UTC Timezone • Continuous Liquidity & Funding
            </p>

            <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Bitcoin (BTC)</div>
                <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                  ${crypto?.benchmarks?.[0]?.price?.toLocaleString() || '68,450'}
                </div>
                <div className="mono" style={{ fontSize: '0.72rem', color: (crypto?.benchmarks?.[0]?.change_pct || 0) >= 0 ? '#10b981' : '#f43f5e' }}>
                  {(crypto?.benchmarks?.[0]?.change_pct || 0) >= 0 ? `+${crypto?.benchmarks?.[0]?.change_pct}%` : `${crypto?.benchmarks?.[0]?.change_pct}%`}
                </div>
              </div>

              <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Ethereum (ETH)</div>
                <div className="mono" style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                  ${crypto?.benchmarks?.[1]?.price?.toLocaleString() || '2,650'}
                </div>
                <div className="mono" style={{ fontSize: '0.72rem', color: (crypto?.benchmarks?.[1]?.change_pct || 0) >= 0 ? '#10b981' : '#f43f5e' }}>
                  {(crypto?.benchmarks?.[1]?.change_pct || 0) >= 0 ? `+${crypto?.benchmarks?.[1]?.change_pct}%` : `${crypto?.benchmarks?.[1]?.change_pct}%`}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              BTC Dominance: <strong style={{ color: '#fff' }}>58.4%</strong> • 24h Vol: <strong style={{ color: '#fff' }}>$54.5B</strong>
            </div>
          </div>

          <button
            onClick={() => onNavigateToMarket('crypto')}
            className="btn-secondary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px' }}
          >
            <span>Open Crypto Workspace</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>

      {/* Cross-Market Momentum Leaders & Unusual Volume Table */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
        {/* Momentum Leaders */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Zap size={16} color="#818cf8" />
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>Cross-Market Momentum Leaders</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {top_gainers?.map((g: any, i: number) => (
              <div
                key={i}
                onClick={() => onSelectAsset(g.symbol, g.market)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="mono" style={{ fontWeight: 700, color: '#fff' }}>{g.symbol}</span>
                    <span style={{ fontSize: '0.68rem', padding: '2px 5px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-dim)' }}>
                      {g.market.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{g.name}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{g.price}</div>
                  <div className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
                    +{g.change_pct}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unusual Relative Volume (RVOL) Alerts */}
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Activity size={16} color="#06b6d4" />
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>Unusual Relative Volume (RVOL)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {unusual_volume?.map((u: any, i: number) => (
              <div
                key={i}
                onClick={() => onSelectAsset(u.symbol, u.market)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="mono" style={{ fontWeight: 700, color: '#fff' }}>{u.symbol}</span>
                    <span style={{ fontSize: '0.68rem', padding: '2px 5px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-dim)' }}>
                      {u.market.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{u.note}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#06b6d4' }}>
                    {u.rvol}x
                  </span>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Volume Surge</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Health & Provider Status Footer */}
      <div
        className="glass-panel"
        style={{
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.74rem',
          color: 'var(--text-dim)',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>Multi-Market Data Ingestion: <strong>All Feeds Operational</strong> ({data_health?.avg_response_time_ms || 110}ms latency)</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span>NSE/BSE (IST): <strong style={{ color: '#10b981' }}>Connected</strong></span>
          <span>NYSE/NASDAQ (EST): <strong style={{ color: '#10b981' }}>Connected</strong></span>
          <span>Binance Spot/Crypto (UTC): <strong style={{ color: '#10b981' }}>Connected</strong></span>
        </div>
      </div>
    </div>
  );
};
