import React, { useState } from 'react';
import { History, TrendingUp, AlertTriangle, ShieldCheck, Activity, RefreshCw } from 'lucide-react';

interface BacktestMetrics {
  total_bars: number;
  total_alerts: number;
  alerts_by_state: Record<string, number>;
  alerts_by_severity: Record<number, number>;
  trend_continuation_rate_5bar: number;
  trend_continuation_rate_15bar: number;
  false_alert_rate: number;
  avg_trend_duration_bars: number;
  volatility_regime_changes: number;
  evaluated_horizon_bars: number;
  slippage_and_cost_drag_pct?: number;
  limitations_note: string;
}

interface AlertTimelineItem {
  bar_index: number;
  timestamp: string;
  price: number;
  trend_state: string;
  trend_score: number;
  severity: number;
  rule: string;
  reason: string;
  forward_return_5bar?: number;
  forward_return_15bar?: number;
}

interface HistoricalBacktestViewProps {
  symbol: string;
  timeframe: string;
  onTimeframeChange: (tf: string) => void;
  metrics: BacktestMetrics | null;
  timeline: AlertTimelineItem[];
  isLoading: boolean;
  onRunBacktest: (period: string) => void;
}

export const HistoricalBacktestView: React.FC<HistoricalBacktestViewProps> = ({
  symbol,
  timeframe,
  onTimeframeChange,
  metrics,
  timeline,
  isLoading,
  onRunBacktest,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('1mo');

  const handlePeriodChange = (p: string) => {
    setSelectedPeriod(p);
    onRunBacktest(p);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Controls Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} color="#818cf8" />
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>
              Historical Walk-Forward Evaluation: <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{symbol}</span>
            </span>
          </div>

          {/* Timeframe Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '6px' }}>
            {['1m', '3m', '5m', '15m', '30m', '1h', '1d'].map((tf) => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  background: timeframe === tf ? 'var(--accent-indigo)' : 'transparent',
                  color: timeframe === tf ? '#fff' : 'var(--text-muted)',
                }}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Period Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '6px' }}>
            {['5d', '1mo', '3mo', '6mo', '1y'].map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  background: selectedPeriod === p ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  color: selectedPeriod === p ? '#fff' : 'var(--text-dim)',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onRunBacktest(selectedPeriod)}
          disabled={isLoading}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}
        >
          <RefreshCw size={14} className={isLoading ? 'pulsing-dot' : ''} />
          <span>{isLoading ? 'Simulating...' : 'Run Walk-Forward Backtest'}</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          {/* Card 1: Continuation Rate */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
              <span>5-Bar Continuation Rate</span>
              <TrendingUp size={16} color="#10b981" />
            </div>
            <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#10b981' }}>
              {metrics.trend_continuation_rate_5bar}%
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Confirmed moves net of {metrics.slippage_and_cost_drag_pct || 0.08}% Indian tax/slippage
            </div>
          </div>

          {/* Card 2: False Alert Rate */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
              <span>False Signal Rate</span>
              <AlertTriangle size={16} color="#f59e0b" />
            </div>
            <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: metrics.false_alert_rate > 35 ? '#f43f5e' : '#f59e0b' }}>
              {metrics.false_alert_rate}%
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Adverse move within forward 5 bars
            </div>
          </div>

          {/* Card 3: Avg Duration */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
              <span>Avg Regime Duration</span>
              <Activity size={16} color="#6366f1" />
            </div>
            <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#818cf8' }}>
              {metrics.avg_trend_duration_bars} <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>bars</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Mean continuous bars per momentum regime
            </div>
          </div>

          {/* Card 4: Total Alerts */}
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>
              <span>Total Alerts Evaluated</span>
              <ShieldCheck size={16} color="#06b6d4" />
            </div>
            <div className="mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#f8fafc' }}>
              {metrics.total_alerts} <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>/ {metrics.total_bars} bars</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              {metrics.volatility_regime_changes} volatility shocks detected
            </div>
          </div>
        </div>
      )}

      {/* Historical Alerts Timeline Table */}
      <div className="glass-panel" style={{ padding: '20px', overflow: 'hidden' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
          Historical Signal & Sound Alert Timeline ({timeline.length} Confirmed Events)
        </h4>

        {timeline.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            No alerts triggered in this historical window with current confirmation rules.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', maxHeight: '350px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)' }}>
                  <th style={{ padding: '8px 12px' }}>Timestamp (IST)</th>
                  <th style={{ padding: '8px 12px' }}>Price (₹)</th>
                  <th style={{ padding: '8px 12px' }}>Momentum State</th>
                  <th style={{ padding: '8px 12px' }}>Score</th>
                  <th style={{ padding: '8px 12px' }}>Severity</th>
                  <th style={{ padding: '8px 12px' }}>5-Bar Fwd Ret</th>
                  <th style={{ padding: '8px 12px' }}>Reason & Evidence</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((item, idx) => {
                  const isUp = item.trend_state.toLowerCase().includes('up') || item.trend_state.toLowerCase().includes('breakout');
                  const isDown = item.trend_state.toLowerCase().includes('down') || item.trend_state.toLowerCase().includes('breakdown');
                  return (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                      }}
                    >
                      <td className="mono" style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                        {item.timestamp.replace('T', ' ').slice(0, 19)}
                      </td>
                      <td className="mono" style={{ padding: '8px 12px', fontWeight: 700, color: '#fff' }}>
                        ₹{item.price.toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span
                          style={{
                            color: isUp ? '#10b981' : isDown ? '#f43f5e' : '#f59e0b',
                            fontWeight: 600,
                          }}
                        >
                          {item.trend_state}
                        </span>
                      </td>
                      <td className="mono" style={{ padding: '8px 12px' }}>
                        {item.trend_score > 0 ? `+${item.trend_score}` : item.trend_score}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background:
                              item.severity === 4
                                ? 'rgba(244, 63, 94, 0.2)'
                                : item.severity === 3
                                ? 'rgba(245, 158, 11, 0.2)'
                                : 'rgba(99, 102, 241, 0.2)',
                            color:
                              item.severity === 4
                                ? '#fb7185'
                                : item.severity === 3
                                ? '#fbbf24'
                                : '#818cf8',
                          }}
                        >
                          S{item.severity}
                        </span>
                      </td>
                      <td className="mono" style={{ padding: '8px 12px' }}>
                        {item.forward_return_5bar !== undefined ? (
                          <span style={{ color: item.forward_return_5bar >= 0 ? '#10b981' : '#f43f5e', fontWeight: 600 }}>
                            {item.forward_return_5bar >= 0 ? `+${item.forward_return_5bar}%` : `${item.forward_return_5bar}%`}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-muted)', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.reason}>
                        {item.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Limitations Notice */}
        {metrics?.limitations_note && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              fontSize: '0.75rem',
              color: 'var(--text-dim)',
            }}
          >
            <strong>Indian Market Backtest Notice:</strong> {metrics.limitations_note}
          </div>
        )}
      </div>
    </div>
  );
};
