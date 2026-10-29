import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

export const GlobalContextWorkspace: React.FC = () => {
  const [indiaRegime, setIndiaRegime] = useState<any | null>(null);
  const [usRegime, setUsRegime] = useState<any | null>(null);
  const [cryptoRegime, setCryptoRegime] = useState<any | null>(null);
  const [overview, setOverview] = useState<any | null>(null);

  useEffect(() => {
    fetchGlobalContext();
  }, []);

  const fetchGlobalContext = async () => {
    try {
      const [indRes, usRes, cryRes, ovRes] = await Promise.all([
        fetch('/api/regime/india'),
        fetch('/api/regime/us'),
        fetch('/api/regime/crypto'),
        fetch('/api/overview')
      ]);

      if (indRes.ok) setIndiaRegime(await indRes.json());
      if (usRes.ok) setUsRegime(await usRes.json());
      if (cryRes.ok) setCryptoRegime(await cryRes.json());
      if (ovRes.ok) setOverview(await ovRes.json());
    } catch (e) {
      console.warn('Failed to fetch global context:', e);
    }
  };

  const getRegimeColor = (regime: string) => {
    if (!regime) return '#94a3b8';
    if (regime.includes('UPWARD') || regime.includes('BULL')) return '#10b981';
    if (regime.includes('DOWNWARD') || regime.includes('STRESS')) return '#f43f5e';
    if (regime.includes('HIGH_VOLATILITY')) return '#f59e0b';
    return '#818cf8';
  };

  const macro = overview?.macro || [
    { name: 'US 10Y Yield', value: '4.24%', change: '+0.03', bias: 'BEARISH_EQUITIES' },
    { name: 'US Dollar (DXY)', value: '104.15', change: '-0.12%', bias: 'NEUTRAL' },
    { name: 'Brent Crude', value: '$74.50', change: '+1.10%', bias: 'INFLATION_WATCH' },
    { name: 'Gold (XAU/USD)', value: '$2,735', change: '+0.45%', bias: 'RISK_OFF_HEDGE' },
    { name: 'CBOE VIX', value: '19.20', change: '-1.40%', bias: 'STABLE' },
  ];

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
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.05))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
            }}
          >
            <Globe size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Global Market Context & Macro Regimes
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Systemic intermarket conditions, volatility regimes, and cross-market behavioral governance
            </p>
          </div>
        </div>

        <button
          className="btn btn-secondary"
          onClick={fetchGlobalContext}
          style={{ fontSize: '0.8rem', padding: '8px 16px' }}
        >
          Refresh Regimes
        </button>
      </div>

      {/* Global Macro Ribbon */}
      <div className="glass-panel" style={{ padding: '16px 20px' }}>
        <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
          Global Macro & Yield Indicators
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {macro.map((m: any) => (
            <div
              key={m.name}
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{m.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
                <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                  {m.value}
                </span>
                <span className="mono" style={{ fontSize: '0.76rem', color: m.change.startsWith('+') ? '#10b981' : '#f43f5e', fontWeight: 700 }}>
                  {m.change}
                </span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {m.bias.replace(/_/g, ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3 Regional Market Regimes Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* India Equity Regime */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🇮🇳</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>Indian Equity Regime</h3>
            </div>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: `${getRegimeColor(indiaRegime?.regime)}22`,
                color: getRegimeColor(indiaRegime?.regime),
                border: `1px solid ${getRegimeColor(indiaRegime?.regime)}44`,
              }}
            >
              {indiaRegime?.regime?.replace(/_/g, ' ') || 'TRENDING UPWARD'}
            </span>
          </div>

          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.3)', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {indiaRegime?.interpretation_guidance ||
              'NIFTY 50 trading above 20 & 50 EMA with constructive market breadth. Individual stock breakouts have high systemic confirmation.'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Benchmark (NIFTY 50)</div>
              <div className="mono" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                ₹{indiaRegime?.benchmark_close?.toLocaleString('en-IN') || '24,350'}
              </div>
            </div>
            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Confidence Score</div>
              <div className="mono" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                {indiaRegime?.confidence || 85}%
              </div>
            </div>
          </div>
        </div>

        {/* US Equity Regime */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🇺🇸</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>US Equity Regime</h3>
            </div>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: `${getRegimeColor(usRegime?.regime)}22`,
                color: getRegimeColor(usRegime?.regime),
                border: `1px solid ${getRegimeColor(usRegime?.regime)}44`,
              }}
            >
              {usRegime?.regime?.replace(/_/g, ' ') || 'TRENDING UPWARD'}
            </span>
          </div>

          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.3)', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {usRegime?.interpretation_guidance ||
              'S&P 500 exhibiting stable low-volatility uptrend. Momentum runners carry sustained follow-through while opening range breakouts show high win rates.'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Benchmark (SPY)</div>
              <div className="mono" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                ${usRegime?.benchmark_close?.toFixed(2) || '582.50'}
              </div>
            </div>
            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Confidence Score</div>
              <div className="mono" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                {usRegime?.confidence || 80}%
              </div>
            </div>
          </div>
        </div>

        {/* Crypto Market Regime */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🌐</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>Crypto Market Regime</h3>
            </div>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: `${getRegimeColor(cryptoRegime?.regime)}22`,
                color: getRegimeColor(cryptoRegime?.regime),
                border: `1px solid ${getRegimeColor(cryptoRegime?.regime)}44`,
              }}
            >
              {cryptoRegime?.regime?.replace(/_/g, ' ') || 'RANGE BOUND'}
            </span>
          </div>

          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.3)', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {cryptoRegime?.interpretation_guidance ||
              'Bitcoin consolidating inside a volatility compression squeeze corridor. Avoid over-leveraged breakout entries until volume expansion confirms.'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Benchmark (BTC-USD)</div>
              <div className="mono" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                ${cryptoRegime?.benchmark_close?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '67,800.00'}
              </div>
            </div>
            <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Confidence Score</div>
              <div className="mono" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>
                {cryptoRegime?.confidence || 75}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Behavioral Governance Explanation */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
          Intermarket Governance Rules (Master Prompt Section 13)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <div style={{ padding: '14px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
            <div style={{ fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Bull Breakout in Strong Market</div>
            When broader indices are trending upward with positive breadth, individual stock breakouts enjoy tailwinds and exhibit lower failure rates. Position sizing can follow standard risk protocols.
          </div>
          <div style={{ padding: '14px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '3px solid #f59e0b' }}>
            <div style={{ fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Breakout during Market Divergence</div>
            When a stock attempts to break out while broader market indices are weakening or range-bound, the engine flags divergence caution. Volume confirmation must exceed 1.5x RVOL before confirming.
          </div>
          <div style={{ padding: '14px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '3px solid #f43f5e' }}>
            <div style={{ fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Broad Market Stress Condition</div>
            Under high volatility or systemic selloffs (e.g. VIX &gt; 25), individual long signals have high invalidation risk. Cash preservation and stop-loss tightening are enforced.
          </div>
        </div>
      </div>
    </div>
  );
};
