import React from 'react';
import {
  Target, AlertCircle, ShieldAlert,
  CheckCircle2, Layers, ArrowRight
} from 'lucide-react';

interface ScenarioForecastProps {
  symbol: string;
  analysis: any;
}

export const ForecastsScenariosWorkspace: React.FC<ScenarioForecastProps> = ({
  symbol,
  analysis,
}) => {
  if (!analysis || !analysis.scenario_forecast) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>No active scenario forecast loaded for {symbol}. Select an asset to evaluate scenarios.</p>
      </div>
    );
  }

  const s = analysis.scenario_forecast;
  const isINR = analysis.currency === 'INR';
  const currSym = isINR ? '₹' : '$';

  const getBiasColor = (bias: string) => {
    if (bias?.toLowerCase().includes('bull')) return '#10b981';
    if (bias?.toLowerCase().includes('bear')) return '#f43f5e';
    return '#f59e0b';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Scenario Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(16, 185, 129, 0.05))',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="mono" style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
              {symbol}
            </span>
            <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-dim)' }}>
              {analysis.market?.toUpperCase()}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              {analysis.timezone}
            </span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Current Classification: <strong style={{ color: '#fff' }}>{s.current_classification}</strong>
          </div>
        </div>

        {/* Current Price & Invalidation Price Box */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Current Price</div>
            <div className="mono" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
              {currSym}{analysis.current_price?.toLocaleString()}
            </div>
          </div>

          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '0.68rem', color: '#fb7185', fontWeight: 600 }}>
              INVALIDATION LEVEL
            </div>
            <div className="mono" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f43f5e' }}>
              {currSym}{s.invalidation_price?.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Short-Term & Medium-Term Scenario Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
        {/* Short-Term Scenario (1-5 Bars) */}
        <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={16} color="#818cf8" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Short-Term Horizon (1 - 5 Bars)</span>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '4px',
                background: `${getBiasColor(s.short_term_bias)}20`,
                color: getBiasColor(s.short_term_bias),
                border: `1px solid ${getBiasColor(s.short_term_bias)}40`,
              }}
            >
              {s.short_term_bias?.toUpperCase()} BIAS
            </span>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
            {s.short_term_scenario}
          </p>
        </div>

        {/* Medium-Term Scenario (5-20 Bars) */}
        <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="#06b6d4" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>Medium-Term Horizon (5 - 20 Bars)</span>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '4px',
                background: `${getBiasColor(s.medium_term_bias)}20`,
                color: getBiasColor(s.medium_term_bias),
                border: `1px solid ${getBiasColor(s.medium_term_bias)}40`,
              }}
            >
              {s.medium_term_bias?.toUpperCase()} BIAS
            </span>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
            {s.medium_term_scenario}
          </p>
        </div>
      </div>

      {/* Invalidation Rules & Support / Resistance Pivots */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
        {/* Invalidation Criteria Card */}
        <div
          className="glass-panel"
          style={{
            padding: '18px',
            borderLeft: '4px solid #f43f5e',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f43f5e' }}>
            <AlertCircle size={18} />
            <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Exact Invalidation Threshold</span>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: 1.5 }}>
            {s.invalidation_criteria}
          </p>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
            Rule: When price violates this level with volume confirmation, all forward continuation targets are immediately negated.
          </div>
        </div>

        {/* Support & Resistance Table */}
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
            Structural Support & Resistance Pivots
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>SUPPORT LEVELS</div>
              {s.support_levels?.map((lvl: number, idx: number) => (
                <div key={idx} className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                  S{idx + 1}: {currSym}{lvl?.toLocaleString()}
                </div>
              ))}
            </div>

            <div style={{ padding: '10px', background: 'rgba(244, 63, 94, 0.05)', borderRadius: '6px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
              <div style={{ fontSize: '0.7rem', color: '#f43f5e', fontWeight: 600 }}>RESISTANCE LEVELS</div>
              {s.resistance_levels?.map((lvl: number, idx: number) => (
                <div key={idx} className="mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', marginTop: '4px' }}>
                  R{idx + 1}: {currSym}{lvl?.toLocaleString()}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Conditions Checklist Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        {/* Bullish Conditions */}
        <div className="glass-panel" style={{ padding: '16px', borderTop: '2px solid #10b981' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10b981', marginBottom: '8px' }}>
            Bullish Continuation Checklist
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {s.bullish_conditions?.map((c: string, idx: number) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <CheckCircle2 size={13} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Neutral Conditions */}
        <div className="glass-panel" style={{ padding: '16px', borderTop: '2px solid #f59e0b' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b', marginBottom: '8px' }}>
            Neutral / Consolidation Checklist
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {s.neutral_conditions?.map((c: string, idx: number) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <ArrowRight size={13} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bearish Conditions */}
        <div className="glass-panel" style={{ padding: '16px', borderTop: '2px solid #f43f5e' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f43f5e', marginBottom: '8px' }}>
            Bearish Breakdown Checklist
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {s.bearish_conditions?.map((c: string, idx: number) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <AlertCircle size={13} color="#f43f5e" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Risk and Missing Data Limitations */}
      <div
        className="glass-panel"
        style={{
          padding: '14px 18px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '0.76rem', fontWeight: 600 }}>
          <ShieldAlert size={14} />
          <span>Transparent Data Limitations & Model Risk Notice</span>
        </div>
        <ul style={{ paddingLeft: '18px', fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
          {s.key_risks_and_missing_data?.map((r: string, idx: number) => (
            <li key={idx}>{r}</li>
          ))}
          <li>The platform calculates statistical scenarios based strictly on historical causal price action. It does not guarantee future financial returns.</li>
        </ul>
      </div>
    </div>
  );
};
