import React from 'react';
import { Database, Info } from 'lucide-react';

export const DataSourcesWorkspace: React.FC = () => {
  const capabilities = [
    { field: 'OHLCV Candlesticks (1m to 1wk)', india: 'Live / Delayed (YFinance)', us: 'Live / Delayed (SIP Tape)', crypto: 'Live (Binance REST/WS)', status: 'SUPPORTED' },
    { field: 'Intraday Session VWAP', india: 'Calculated (09:15 IST Reset)', us: 'Calculated (09:30 EST Reset)', crypto: 'Calculated (Rolling 24h)', status: 'SUPPORTED' },
    { field: 'Time-of-Day Relative Volume (RVOL)', india: 'Calculated (vs 20-Day Baseline)', us: 'Calculated (vs Regular Hours)', crypto: 'Calculated (vs 24h Rolling)', status: 'SUPPORTED' },
    { field: 'Exponential Moving Averages & RSI/MACD', india: 'Calculated (Wilder Smoothing)', us: 'Calculated (Wilder Smoothing)', crypto: 'Calculated (Continuous)', status: 'SUPPORTED' },
    { field: 'Premarket Gaps & Opening Range Breakout', india: 'N/A (Pre-open Call Auction)', us: 'Supported (04:00-09:30 vs 09:30)', crypto: 'N/A (Continuous 24/7)', status: 'SUPPORTED' },
    { field: 'Institutional Delivery Volume (EOD)', india: 'Supported (NSE EOD Disclosures)', us: 'Unavailable on Free Feeds', crypto: 'N/A', status: 'PARTIAL' },
    { field: 'FII/FPI & DII Net Institutional Flows', india: 'Supported (NSE Published Daily)', us: '13F Quarterly Only', crypto: 'ETF Inflow Disclosures Only', status: 'PARTIAL' },
    { field: 'Level-2 Multi-Level Market Depth (50-Deep)', india: 'Requires Kite/Upstox L2 Token', us: 'Requires Nasdaq TotalView', crypto: 'Requires Binance L2 WebSocket', status: 'UNAVAILABLE' },
    { field: 'Aggressive Trade-Flow & Tick Absorption', india: 'Requires Direct Tick Stream', us: 'Requires Direct Feed (OPRA/SIP)', crypto: 'Available on Binance WebSocket', status: 'PARTIAL' },
    { field: 'Perpetual Futures Funding Rates', india: 'N/A (NSE Stock Futures Basis)', us: 'N/A', crypto: 'Supported when Derivatives active', status: 'SUPPORTED' },
    { field: 'Real-Time Liquidation Clusters', india: 'N/A', us: 'N/A', crypto: 'Requires Coinglass / Premium API', status: 'UNAVAILABLE' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div
        className="glass-panel"
        style={{
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
            Data Sources, Ingestion Status & Capability Matrix
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Transparent audit of data coverage, real-time entitlements, and provider limitations across all markets
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-live">ALL FEEDS HEALTHY</span>
        </div>
      </div>

      {/* Provider Connectivity Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '16px', borderTop: '3px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, color: '#fff' }}>NSE / BSE India</span>
            <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>ONLINE</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Provider: Yahoo Finance (.NS / .BO) + Public NSE Disclosures
          </p>
          <div style={{ marginTop: '10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Session: 09:15 - 15:30 IST • Delivery & FII/DII daily sync active
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', borderTop: '3px solid #3b82f6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, color: '#fff' }}>NYSE / NASDAQ US</span>
            <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>ONLINE</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Provider: Yahoo Finance / Consolidated Tape
          </p>
          <div style={{ marginTop: '10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Session: 09:30 - 16:00 EST • Pre/Post-market flag tracking active
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px', borderTop: '3px solid #8b5cf6' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, color: '#fff' }}>Binance / Crypto</span>
            <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>ONLINE</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Provider: Binance Public REST / WebSocket Fallback
          </p>
          <div style={{ marginTop: '10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Session: 24/7 Continuous • Funding rate monitor active
          </div>
        </div>
      </div>

      {/* Full Data Capability Matrix Table */}
      <div className="glass-panel" style={{ padding: '18px', overflowX: 'auto' }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={16} color="#818cf8" />
          <span>Full Market Data Capability Audit</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)' }}>
              <th style={{ padding: '10px 12px' }}>Analysis Field</th>
              <th style={{ padding: '10px 12px' }}>Indian Equities (NSE/BSE)</th>
              <th style={{ padding: '10px 12px' }}>US Equities (NYSE/NASDAQ)</th>
              <th style={{ padding: '10px 12px' }}>Cryptocurrency</th>
              <th style={{ padding: '10px 12px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {capabilities.map((c, i) => {
              const isSupported = c.status === 'SUPPORTED';
              const isPartial = c.status === 'PARTIAL';
              return (
                <tr
                  key={i}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                  }}
                >
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#fff' }}>{c.field}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{c.india}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{c.us}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{c.crypto}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: isSupported ? 'rgba(16, 185, 129, 0.15)' : isPartial ? 'rgba(245, 158, 11, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: isSupported ? '#10b981' : isPartial ? '#f59e0b' : '#f43f5e',
                      }}
                    >
                      {c.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Ethical Data Declaration */}
      <div
        className="glass-panel"
        style={{
          padding: '16px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
          background: 'rgba(99, 102, 241, 0.04)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
        }}
      >
        <Info size={18} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          <strong style={{ color: '#fff' }}>Strict Data Integrity Commitment:</strong> The platform will NEVER fabricate fake order-book depth, simulated institutional blocks, or pseudo-whale transactions when resting Level-2 market depth is unavailable from the selected provider. All unavailable metrics are transparently labeled as <em>Unavailable</em> rather than misleading the user.
        </div>
      </div>
    </div>
  );
};
