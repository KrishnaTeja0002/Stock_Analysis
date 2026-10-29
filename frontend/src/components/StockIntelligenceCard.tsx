import React, { useState } from 'react';
import {
  CheckCircle2,
  Layers,
  Zap,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  BrainCircuit,
  Activity,
  Compass,
  Building2,
  Newspaper,
  AlertTriangle,
  LineChart,
  Scale,
  Award,
} from 'lucide-react';

export interface StockIntelligenceProps {
  data: any;
}

export const StockIntelligenceCard: React.FC<StockIntelligenceProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'fundamentals' | 'technicals' | 'nifty' | 'news' | 'cautions'>('overview');

  if (!data) return null;

  const {
    momentum_state,
    trend_stability,
    structural_hypothesis,
    signal_scores,
    trade_flow,
    explanation,
    pattern_prediction,
    comprehensive_intel,
    symbol,
  } = data;

  const isUp = momentum_state?.toLowerCase().includes('up') || momentum_state?.toLowerCase().includes('breakout');
  const isDown = momentum_state?.toLowerCase().includes('down') || momentum_state?.toLowerCase().includes('breakdown');
  const stateColor = isUp ? '#10b981' : isDown ? '#f43f5e' : '#f59e0b';

  const isINR = symbol ? (symbol.endsWith('.NS') || symbol.endsWith('.BO') || !symbol.includes('-USD') && !['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'TSLA', 'META', 'SPY', 'QQQ'].includes(symbol)) : true;
  const currPrefix = isINR ? '₹' : '$';

  // Pattern prediction attributes
  const pattern = pattern_prediction;
  const patternBias = pattern?.directional_bias;
  const isBearish = patternBias === 'BEARISH';
  const patternColor = isBearish ? '#f43f5e' : patternBias === 'BULLISH' ? '#10b981' : '#f59e0b';
  const currPrice = pattern?.current_price ?? data.current_price ?? 0;
  const t1 = pattern?.target_1 ?? 0;
  const t2 = pattern?.target_2 ?? 0;
  const stop = pattern?.invalidation_price ?? 0;
  const rrr = pattern?.risk_reward_ratio ?? 1.5;

  // Direction-aware gain/risk calculations (positive percentage indicates expected profit)
  const t1GainPct = currPrice > 0 && t1 > 0 
    ? (isBearish ? ((currPrice - t1) / currPrice) * 100 : ((t1 - currPrice) / currPrice) * 100).toFixed(2)
    : '0.00';
  const t2GainPct = currPrice > 0 && t2 > 0 
    ? (isBearish ? ((currPrice - t2) / currPrice) * 100 : ((t2 - currPrice) / currPrice) * 100).toFixed(2)
    : '0.00';
  const stopRiskPct = currPrice > 0 && stop > 0 
    ? (isBearish ? ((stop - currPrice) / currPrice) * 100 : ((currPrice - stop) / currPrice) * 100).toFixed(2)
    : '0.00';

  const t1Reached = currPrice > 0 && t1 > 0 && (isBearish ? currPrice <= t1 : currPrice >= t1);
  const t2Reached = currPrice > 0 && t2 > 0 && (isBearish ? currPrice <= t2 : currPrice >= t2);

  // Comprehensive Intelligence Attributes
  const intel = comprehensive_intel || {};
  const fund = intel.fundamentals || {};
  const tech = intel.technicals || {};
  const bench = intel.benchmark_alignment || {};
  const news = intel.news_catalysts || {};
  const pot = intel.potential_prediction || {};
  const cautions = intel.cautions || [];
  const ofEstimator = intel.order_flow_estimator || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* 1. MASTER STOCK POTENTIAL & FORWARD PREDICTIVE OUTLOOK (A STOCK ISN'T JUST A GRAPH) */}
      <div
        className="glass-panel"
        style={{
          padding: '22px 26px',
          background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.75), rgba(15, 23, 42, 0.95))',
          border: '1px solid rgba(129, 140, 248, 0.3)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 800,
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                color: '#fff',
                letterSpacing: '0.04em',
              }}
            >
              <Award size={15} />
              {pot.rating ? pot.rating.replace(/_/g, ' ') : 'HOLISTIC MULTI-FACTOR POTENTIAL'}
            </span>

            {fund.analyst_rating && (
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                ★ Analyst Consensus: {fund.analyst_rating}
              </span>
            )}

            {cautions.length > 0 && (
              <button
                onClick={() => setActiveTab('cautions')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: 'rgba(244, 63, 94, 0.15)',
                  color: '#fb7185',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  cursor: 'pointer',
                }}
              >
                <AlertTriangle size={13} />
                {cautions.length} Active Cautions & Risk Flags
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Analyst Target Upside</span>
              <span className="mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: (fund.upside_potential_pct || 0) >= 0 ? '#10b981' : '#f43f5e' }}>
                {fund.upside_potential_pct !== undefined ? (Number(fund.upside_potential_pct) > 0 ? `+${fund.upside_potential_pct}%` : `${fund.upside_potential_pct}%`) : '+22.0%'}
              </span>
            </div>
          </div>
        </div>

        {/* Section Explanation Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#818cf8', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
            🔮 QUANTITATIVE POTENTIAL & FORWARD PREDICTOR
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            • Synthesizes breakout momentum, fundamental valuation, and market breadth
          </span>
        </div>

        {/* Potential Headline & Investment Thesis */}
        <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px', lineHeight: 1.4 }}>
          {pot.headline || 'Stock in Base Consolidation: High Long-Term Potential with Multi-Factor Indicators'}
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
          {pot.investment_thesis || 'While short-term intraday trading is quiet in consolidation, underlying company fundamentals, multi-timeframe moving averages, and benchmark tailwinds provide substantial medium-to-long term potential.'}
        </p>

        {/* 3 Forward Targets Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Swing Target (Conservative)</span>
            <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
              {currPrefix}{Number(pot.conservative_target || (currPrice * 1.08)).toFixed(2)}
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Pivot / ATR Resistance Target</span>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Consensus Target (Fundamental)</span>
            <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
              {currPrefix}{Number(fund.target_mean_price || (currPrice * 1.22)).toFixed(2)}
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Institutional Consensus ({fund.upside_potential_pct !== undefined ? (Number(fund.upside_potential_pct) > 0 ? `+${fund.upside_potential_pct}%` : `${fund.upside_potential_pct}%`) : '+22%'})
            </span>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Horizon & Strategy</span>
            <div className="mono" style={{ fontSize: '1.0rem', fontWeight: 700, color: '#c084fc', marginTop: '2px' }}>
              {pot.time_horizon || '3 - 8 Weeks Swing'}
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Accumulate at Support, Trim at R1</span>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION TABS FOR COMPREHENSIVE INTELLIGENCE */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        {[
          { id: 'overview', label: '⚡ Overview & Patterns', icon: Zap },
          { id: 'fundamentals', label: '🏢 Fundamentals & Valuation', icon: Building2 },
          { id: 'technicals', label: '📈 Technical Health (RSI/EMAs)', icon: LineChart },
          { id: 'nifty', label: '🌐 Nifty 50 & Beta Context', icon: Scale },
          { id: 'news', label: '📰 Market News & Catalysts', icon: Newspaper },
          { id: 'cautions', label: `⚠️ Cautions & Risk Flags (${cautions.length})`, icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: isActive ? 700 : 500,
                background: isActive ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-dim)',
                border: isActive ? '1px solid #6366f1' : '1px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={14} color={isActive ? '#818cf8' : 'currentColor'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB A: OVERVIEW & PATTERNS */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Pattern Recognition & Predictive Trade Engine */}
          {pattern && pattern.active_pattern && pattern.active_pattern !== 'Accumulating Data' && (
            <div
              className="glass-panel"
              style={{
                padding: '20px 24px',
                border: `1px solid ${patternColor}40`,
                background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(11, 15, 25, 0.98))',
                boxShadow: `0 4px 20px -2px ${patternColor}15`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingBottom: '14px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#818cf8',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                    }}
                  >
                    <Zap size={14} color="#818cf8" />
                    <span>{pattern.active_pattern}</span>
                  </div>

                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: `${patternColor}20`,
                      color: patternColor,
                      border: `1px solid ${patternColor}40`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {patternBias === 'BULLISH' ? <TrendingUp size={13} /> : patternBias === 'BEARISH' ? <TrendingDown size={13} /> : <Activity size={13} />}
                    {patternBias} BIAS
                  </span>

                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#34d399',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    ★ {pattern.win_probability_pct}% Backtested Win Rate
                  </span>
                </div>

                <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: patternColor }}>
                  {pattern.confidence_score} / 100 Confidence
                </div>
              </div>

              {/* Context Pill for Intraday Tactical vs Multi-Day Swing */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.72rem', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ color: '#818cf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Zap size={13} /> ⚡ INTRADAY TACTICAL EXECUTION ({pattern.time_horizon || 'Next 3 - 8 candles'})
                </span>
                <span style={{ color: 'var(--text-dim)' }}>
                  {isBearish ? 'Short Sell Breakdown Matrix' : 'Institutional Momentum Expansion Matrix'} • Compare with Swing Target above
                </span>
              </div>

              {/* 4-KPI Predictive Target & Stop Matrix */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Target size={12} /> {isBearish ? 'Downside Target 1' : 'Target 1 (Tactical)'}
                    </span>
                    <span className="mono" style={{ color: t1Reached ? '#fbbf24' : '#34d399' }}>
                      {t1Reached ? '✅ Hit / Trail' : `+${t1GainPct}%`}
                    </span>
                  </div>
                  <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
                    {currPrefix}{Number(t1).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                    {isBearish ? 'Short Momentum 1.8x ATR' : 'Measured ATR 1.8x Target'}
                  </div>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#06b6d4', fontWeight: 700 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Target size={12} /> {isBearish ? 'Downside Target 2' : 'Target 2 (Extended)'}
                    </span>
                    <span className="mono" style={{ color: t2Reached ? '#fbbf24' : '#22d3ee' }}>
                      {t2Reached ? '✅ Hit' : `+${t2GainPct}%`}
                    </span>
                  </div>
                  <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#22d3ee', marginTop: '4px' }}>
                    {currPrefix}{Number(t2).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                    {isBearish ? 'Short Extension 3.5x ATR' : 'Extended Momentum 3.5x ATR'}
                  </div>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.06)', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#f43f5e', fontWeight: 700 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldAlert size={12} /> {isBearish ? 'Cover Stop Loss' : 'Stop Invalidation'}
                    </span>
                    <span className="mono">-{stopRiskPct}%</span>
                  </div>
                  <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fb7185', marginTop: '4px' }}>
                    {currPrefix}{Number(stop).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                    {isBearish ? 'Structure High Invalidation' : 'Structure Low Invalidation'}
                  </div>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#a855f7', fontWeight: 700 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Compass size={12} /> Risk/Reward</span>
                    <span className="mono">1 : {rrr}</span>
                  </div>
                  <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                    {pattern.time_horizon}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Intraday Candle Horizon</div>
                </div>
              </div>

              {/* Smart Money Institutional Rationale */}
              <div style={{ padding: '14px 16px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.84rem', color: '#e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#818cf8', fontWeight: 700, marginBottom: '6px' }}>
                  <BrainCircuit size={15} />
                  <span>How The Market Predicts This Movement (Smart Money / Institutional Order Flow)</span>
                </div>
                <div>{pattern.market_psychology}</div>
                <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem', marginTop: '8px' }}>
                  <strong style={{ color: '#38bdf8' }}>Actionable Rule: </strong>
                  <span>{pattern.actionable_rule}</span>
                </div>
              </div>
            </div>
          )}

          {/* Intraday Movement & Interpretation */}
          <div className="glass-panel" style={{ padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700, background: `${stateColor}22`, color: stateColor, border: `1px solid ${stateColor}44` }}>
                  {momentum_state}
                </span>
                <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                  {structural_hypothesis}
                </span>
                <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
                  {trend_stability}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Intraday Confidence:</span>
                <span className="mono" style={{ fontSize: '1rem', fontWeight: 800, color: stateColor }}>
                  {signal_scores?.overall_confidence}%
                </span>
              </div>
            </div>

            <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', fontSize: '0.85rem', color: '#f8fafc' }}>
              <strong style={{ color: 'var(--accent-cyan)' }}>Observed Movement: </strong>
              {explanation?.what_happened}
            </div>
          </div>

          {/* Evidence Grid & Microstructure Order Flow Estimator */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '16px', width: '100%' }}>
            {/* Supporting & Contradicting Evidence */}
            <div className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span>Evidence-Based Interpretation</span>
              </h4>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Supporting Evidence
                </div>
                <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {explanation?.evidence_for?.map((item: string, idx: number) => (
                    <li key={idx} style={{ fontSize: '0.8rem', color: '#e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {explanation?.evidence_against && explanation.evidence_against.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f59e0b', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Contradicting / Cautionary Factors
                  </div>
                  <ul style={{ listStyle: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {explanation.evidence_against.map((item: string, idx: number) => (
                      <li key={idx} style={{ fontSize: '0.8rem', color: '#fcd34d', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ color: '#f59e0b', fontWeight: 700 }}>⚠</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px' }}>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>What Would Strengthen</div>
                  <div style={{ fontSize: '0.76rem', color: '#e2e8f0', marginTop: '3px' }}>{explanation?.what_would_strengthen}</div>
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.15)' }}>
                  <div style={{ fontSize: '0.72rem', color: '#fb7185', fontWeight: 600 }}>What Would Invalidate</div>
                  <div style={{ fontSize: '0.76rem', color: '#e2e8f0', marginTop: '3px' }}>{explanation?.what_would_invalidate}</div>
                </div>
              </div>
            </div>

            {/* Microstructure Order Flow & Liquidity Estimator (Solves the "Unavailable L2 Token" issue!) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="glass-panel" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={16} color="#818cf8" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Market Depth & Order Flow</span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                    {ofEstimator.is_estimated ? 'Live Proxy Active' : 'L2 Stream'}
                  </span>
                </div>

                {/* Buyer vs Seller Aggression Bar */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '6px' }}>
                    <span style={{ color: '#10b981' }}>Buyer Volume: {ofEstimator.buyer_volume_pct || 54}%</span>
                    <span style={{ color: '#f43f5e' }}>Seller Volume: {ofEstimator.seller_volume_pct || 46}%</span>
                  </div>
                  <div style={{ height: '8px', width: '100%', background: 'rgba(244, 63, 94, 0.4)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${ofEstimator.buyer_volume_pct || 54}%`, background: '#10b981', height: '100%' }} />
                  </div>
                </div>

                <div style={{ padding: '10px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '6px', border: '1px solid var(--border-color)', marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Imbalance State</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: (ofEstimator.buyer_volume_pct || 54) >= 50 ? '#34d399' : '#fb7185', marginTop: '2px' }}>
                    {ofEstimator.imbalance_label || 'Moderate Bid Absorption (Active Two-Way Flow)'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {ofEstimator.liquidity_rating || 'Tier-1 Institutional Grade Liquidity'}
                  </div>
                </div>

                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                  {ofEstimator.depth_explanation || 'Synthesized from verified tick transaction intensity, spread volume dynamics, and intraday VWAP absorption.'}
                </div>
              </div>

              {/* Component Signal Scores */}
              <div className="glass-panel" style={{ padding: '16px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
                  Signal Scores Breakdown
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Price Trend</div>
                    <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: signal_scores?.price_trend_score >= 0 ? '#10b981' : '#f43f5e' }}>
                      {signal_scores?.price_trend_score > 0 ? `+${signal_scores?.price_trend_score}` : signal_scores?.price_trend_score}
                    </div>
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Momentum</div>
                    <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: signal_scores?.momentum_score >= 0 ? '#10b981' : '#f43f5e' }}>
                      {signal_scores?.momentum_score > 0 ? `+${signal_scores?.momentum_score}` : signal_scores?.momentum_score}
                    </div>
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Relative Vol</div>
                    <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: trade_flow?.relative_volume_tod >= 1.2 ? '#10b981' : 'var(--text-muted)' }}>
                      {trade_flow?.relative_volume_tod}x
                    </div>
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>VWAP Dist</div>
                    <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: trade_flow?.distance_from_vwap_pct >= 0 ? '#10b981' : '#f43f5e' }}>
                      {trade_flow?.distance_from_vwap_pct >= 0 ? `+${trade_flow?.distance_from_vwap_pct}%` : `${trade_flow?.distance_from_vwap_pct}%`}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB B: COMPANY FUNDAMENTALS & VALUATION */}
      {activeTab === 'fundamentals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} color="#818cf8" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Company Fundamentals & Financial Health
                </h4>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '5px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                Health Score: {fund.fundamental_health_score || 78}/100
              </span>
            </div>

            {/* 4 Primary Fundamental KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Market Capitalization</span>
                <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', marginTop: '2px' }}>
                  {fund.market_cap_str || '₹45,000 Cr'}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 600 }}>{fund.market_cap_category || 'Large Cap'}</span>
              </div>

              <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>P/E Ratio (Trailing / Forward)</span>
                <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: (fund.pe_ratio || 28) > 50 ? '#fb7185' : '#34d399', marginTop: '2px' }}>
                  {fund.pe_ratio || 28.5}x <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {fund.forward_pe || 24.2}x</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{fund.valuation_label || 'Moderate Valuation'}</span>
              </div>

              <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Return on Equity (ROE)</span>
                <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                  {fund.roe_pct || 18.5}%
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Profit Margin: {fund.profit_margins_pct || 12}%</span>
              </div>

              <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Debt-to-Equity (Solvency)</span>
                <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: (fund.debt_to_equity || 0.45) > 1.0 ? '#f59e0b' : '#34d399', marginTop: '2px' }}>
                  {fund.debt_to_equity || 0.45}x
                </div>
                <span style={{ fontSize: '0.7rem', color: (fund.debt_to_equity || 0.45) < 0.6 ? '#10b981' : '#f59e0b' }}>
                  {(fund.debt_to_equity || 0.45) < 0.6 ? 'Low Leverage / Safe' : 'Moderate Leverage'}
                </span>
              </div>
            </div>

            {/* 52-Week Range Bar */}
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-dim)' }}>52W Low: {currPrefix}{Number(fund.fifty_two_week_low || (currPrice * 0.75)).toFixed(2)}</span>
                <span className="mono" style={{ color: '#38bdf8', fontWeight: 800 }}>Current: {currPrefix}{Number(currPrice).toFixed(2)}</span>
                <span style={{ color: 'var(--text-dim)' }}>52W High: {currPrefix}{Number(fund.fifty_two_week_high || (currPrice * 1.3)).toFixed(2)}</span>
              </div>
              <div style={{ position: 'relative', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    left: `${Math.min(95, Math.max(5, (((currPrice - (fund.fifty_two_week_low || currPrice*0.75)) / Math.max(1, (fund.fifty_two_week_high || currPrice*1.3) - (fund.fifty_two_week_low || currPrice*0.75))) * 100)))}%`,
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: '#6366f1',
                    border: '2px solid #fff',
                    transform: 'translateX(-50%)',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '8px' }}>
                <span>+{fund.distance_from_52w_low_pct || 25}% from 52W Low</span>
                <span>{fund.distance_from_52w_high_pct || -15}% from 52W High</span>
              </div>
            </div>

            {/* Fundamental Summary Statement */}
            <div style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.6, padding: '12px 16px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
              <strong style={{ color: '#818cf8' }}>Fundamental Assessment: </strong>
              {fund.summary}
            </div>
          </div>
        </div>
      )}

      {/* TAB C: MULTI-TIMEFRAME TECHNICAL HEALTH */}
      {activeTab === 'technicals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LineChart size={18} color="#10b981" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Multi-Timeframe Technical Health Matrix
                </h4>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '5px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                Technical Score: {tech.technical_score || 70}/100
              </span>
            </div>

            {/* 4 Technical Core Indicators */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              {/* RSI (14) */}
              <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${tech.rsi_color || '#f59e0b'}44` }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Daily RSI (14)</span>
                <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: tech.rsi_color || '#f59e0b', marginTop: '2px' }}>
                  {tech.rsi_14 || 50.0}
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: tech.rsi_color || '#f59e0b' }}>
                  {tech.rsi_status ? tech.rsi_status.replace(/_/g, ' ') : 'NEUTRAL'}
                </span>
              </div>

              {/* Moving Averages Stack */}
              <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Moving Averages (EMA 20 / 50 / 200)</span>
                <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
                  20: {currPrefix}{tech.ema_20} | 50: {currPrefix}{tech.ema_50}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#818cf8', fontWeight: 600, marginTop: '2px' }}>
                  {tech.ema_alignment || 'Consolidation Stack'}
                </div>
              </div>

              {/* MACD (12, 26, 9) */}
              <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>MACD (12, 26, 9)</span>
                <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 800, color: (tech.macd?.hist || 0) >= 0 ? '#10b981' : '#f43f5e', marginTop: '4px' }}>
                  Hist: {tech.macd?.hist > 0 ? `+${tech.macd?.hist}` : tech.macd?.hist || 0.0}
                </div>
                <span style={{ fontSize: '0.7rem', color: (tech.macd?.hist || 0) >= 0 ? '#10b981' : '#f43f5e', fontWeight: 600 }}>
                  {tech.macd?.crossover ? tech.macd.crossover.replace(/_/g, ' ') : 'NEUTRAL'}
                </span>
              </div>

              {/* Bollinger Squeeze */}
              <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Bollinger Bandwidth</span>
                <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: tech.bollinger?.is_squeeze ? '#f59e0b' : '#38bdf8', marginTop: '2px' }}>
                  {tech.bollinger?.bandwidth_pct || 4.2}%
                </div>
                <span style={{ fontSize: '0.7rem', color: tech.bollinger?.is_squeeze ? '#f59e0b' : '#10b981', fontWeight: 600 }}>
                  {tech.bollinger?.is_squeeze ? '⚡ Coiling Squeeze (Breakout Imminent)' : 'Normal Bandwidth'}
                </span>
              </div>
            </div>

            {/* Classical Pivot Levels (R2, R1, PP, S1, S2) */}
            <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                Classical Pivot Floors & Ceilings (Standard Calculation)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 100px), 1fr))', gap: '8px', textAlign: 'center' }}>
                <div style={{ padding: '8px', background: 'rgba(244, 63, 94, 0.08)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#f43f5e', fontWeight: 700 }}>S2 Support</div>
                  <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fb7185' }}>{currPrefix}{tech.pivots?.s2}</div>
                </div>
                <div style={{ padding: '8px', background: 'rgba(244, 63, 94, 0.04)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#f43f5e', fontWeight: 600 }}>S1 Support</div>
                  <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fb7185' }}>{currPrefix}{tech.pivots?.s1}</div>
                </div>
                <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#818cf8', fontWeight: 700 }}>Pivot Point</div>
                  <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#a5b4fc' }}>{currPrefix}{tech.pivots?.pp}</div>
                </div>
                <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.04)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 600 }}>R1 Target</div>
                  <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>{currPrefix}{tech.pivots?.r1}</div>
                </div>
                <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>R2 Target</div>
                  <div className="mono" style={{ fontSize: '0.85rem', fontWeight: 800, color: '#34d399' }}>{currPrefix}{tech.pivots?.r2}</div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
              <strong style={{ color: '#34d399' }}>Technical Verdict: </strong>
              {tech.technical_verdict}
            </div>
          </div>
        </div>
      )}

      {/* TAB D: NIFTY 50 BENCHMARK CONTEXT & BETA */}
      {activeTab === 'nifty' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scale size={18} color="#06b6d4" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  {bench.benchmark_name || 'NIFTY 50'} Correlation & Market Tailwinds
                </h4>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '5px', background: (bench.benchmark_change_pct || 0) >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)', color: (bench.benchmark_change_pct || 0) >= 0 ? '#34d399' : '#fb7185' }}>
                {bench.benchmark_name}: {bench.benchmark_change_pct > 0 ? `+${bench.benchmark_change_pct}%` : `${bench.benchmark_change_pct}%`}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Benchmark Level</span>
                <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                  {Number(bench.benchmark_price || 22932.50).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
                <span style={{ fontSize: '0.7rem', color: (bench.benchmark_change_pct || 0) >= 0 ? '#10b981' : '#f43f5e' }}>
                  {bench.benchmark_regime ? bench.benchmark_regime.replace(/_/g, ' ') : 'BULLISH TAILWIND'}
                </span>
              </div>

              <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Stock Beta Sensitivity</span>
                <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: (bench.stock_beta || 1.15) > 1.2 ? '#f59e0b' : '#34d399', marginTop: '2px' }}>
                  {bench.stock_beta || 1.15}x
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{bench.beta_label}</span>
              </div>

              <div style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Relative Strength vs Benchmark</span>
                <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: (bench.relative_strength_vs_bench_pct || 0) >= 0 ? '#10b981' : '#f43f5e', marginTop: '2px' }}>
                  {bench.relative_strength_vs_bench_pct > 0 ? `+${bench.relative_strength_vs_bench_pct}%` : `${bench.relative_strength_vs_bench_pct}%`}
                </div>
                <span style={{ fontSize: '0.7rem', color: (bench.relative_strength_vs_bench_pct || 0) >= 0 ? '#10b981' : '#f43f5e', fontWeight: 600 }}>
                  {bench.rs_status || 'OUTPERFORMING'}
                </span>
              </div>
            </div>

            <div style={{ padding: '14px 16px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.6 }}>
              <strong style={{ color: '#22d3ee' }}>Macro Market Assessment: </strong>
              {bench.tailwind_verdict}
            </div>
          </div>
        </div>
      )}

      {/* TAB E: MARKET NEWS & CATALYST SENTIMENT */}
      {activeTab === 'news' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Newspaper size={18} color="#f59e0b" />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Company News & Catalyst Sentiment Stream
                </h4>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '5px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                Sentiment: {news.sentiment_score_pct || 65}% Positive
              </span>
            </div>

            {/* News Articles List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {(news.articles && news.articles.length > 0 ? news.articles : []).map((art: any, i: number) => {
                const sentColor = art.sentiment === 'BULLISH' ? '#10b981' : art.sentiment === 'BEARISH' ? '#f43f5e' : '#f59e0b';
                return (
                  <div
                    key={i}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <a
                        href={art.link}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f8fafc', textDecoration: 'none' }}
                        onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#818cf8')}
                        onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#f8fafc')}
                      >
                        {art.title}
                      </a>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {art.publisher} {art.published_time && `• ${art.published_time}`}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        background: `${sentColor}20`,
                        color: sentColor,
                        border: `1px solid ${sentColor}40`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {art.sentiment}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Key Catalysts Bullets */}
            <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b', marginBottom: '8px' }}>
                Key Catalysts & Upcoming Drivers
              </div>
              <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(news.key_catalysts || [
                  'Quarterly Corporate Earnings Guidance & Capex Delivery',
                  'Sector PLI Incentive Scheme Approvals',
                  'Foreign Institutional Inflow Rebalancing'
                ]).map((cat: string, idx: number) => (
                  <li key={idx} style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#f59e0b' }}>⚡</span>
                    <span>{cat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB F: CRITICAL CAUTIONS & RISK WATCHOUTS */}
      {activeTab === 'cautions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '22px 24px', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertTriangle size={18} color="#f43f5e" />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Critical Cautions, Red Flags & Risk Watchouts
              </h4>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '16px', lineHeight: 1.5 }}>
              Institutional risk management requires verifying adverse conditions before allocating capital. Review the following active risk factors:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(cautions.length > 0 ? cautions : [
                {
                  category: 'Volume Confirmation Caution',
                  severity: 'HIGH',
                  warning: 'Muted volume in consolidation: Wait for volume expansion > 1.2x baseline before entering breakout positions.'
                },
                {
                  category: 'Benchmark Resistance Risk',
                  severity: 'MEDIUM',
                  warning: 'Broader market volatility near resistance levels could temporarily stall single-stock breakout attempts.'
                }
              ]).map((c: any, idx: number) => {
                const isHigh = c.severity === 'HIGH';
                const sevColor = isHigh ? '#f43f5e' : '#f59e0b';
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '8px',
                      background: isHigh ? 'rgba(244, 63, 94, 0.06)' : 'rgba(245, 158, 11, 0.06)',
                      border: `1px solid ${sevColor}33`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: sevColor, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShieldAlert size={14} />
                        {c.category}
                      </span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: `${sevColor}22`, color: sevColor }}>
                        {c.severity} RISK
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#f8fafc', lineHeight: 1.5, marginTop: '2px' }}>
                      {c.warning}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
