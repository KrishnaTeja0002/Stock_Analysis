import React from 'react';
import { TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';

export interface SectorItem {
  sector_name: string;
  symbol: string;
  price: number;
  change_pct: number;
  advances: number;
  declines: number;
  top_driver: string;
}

export interface MarketOverviewData {
  timestamp: string;
  market_session_status: string;
  nifty50_price: number;
  nifty50_change_pct: number;
  niftybank_price: number;
  niftybank_change_pct: number;
  advances: number;
  declines: number;
  unchanged: number;
  advance_decline_ratio: number;
  fii_net_flow_crores: number;
  dii_net_flow_crores: number;
  fii_dii_date: string;
  sectors: SectorItem[];
}

interface MarketOverviewPanelProps {
  data: MarketOverviewData | null;
  onSelectSector?: (symbol: string) => void;
}

export const MarketOverviewPanel: React.FC<MarketOverviewPanelProps> = ({ data, onSelectSector }) => {
  if (!data) return null;

  const totalBreadth = data.advances + data.declines + data.unchanged;
  const advPct = (data.advances / Math.max(1, totalBreadth)) * 100;
  const decPct = (data.declines / Math.max(1, totalBreadth)) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Top Benchmark & Institutional Flow Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
        {/* NIFTY 50 Card */}
        <div className="glass-panel" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>NIFTY 50 Benchmark</span>
            <span className="badge badge-live">NSE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span className="mono" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff' }}>
              ₹{data.nifty50_price.toLocaleString('en-IN')}
            </span>
            <span
              className="mono"
              style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: data.nifty50_change_pct >= 0 ? '#10b981' : '#f43f5e',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              {data.nifty50_change_pct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {data.nifty50_change_pct >= 0 ? `+${data.nifty50_change_pct.toFixed(2)}%` : `${data.nifty50_change_pct.toFixed(2)}%`}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            India Top 50 Weighted Equities
          </div>
        </div>

        {/* NIFTY BANK Card */}
        <div className="glass-panel" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>NIFTY BANK</span>
            <span className="badge badge-live">BANKING</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <span className="mono" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff' }}>
              ₹{data.niftybank_price.toLocaleString('en-IN')}
            </span>
            <span
              className="mono"
              style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: data.niftybank_change_pct >= 0 ? '#10b981' : '#f43f5e',
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              {data.niftybank_change_pct >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {data.niftybank_change_pct >= 0 ? `+${data.niftybank_change_pct.toFixed(2)}%` : `${data.niftybank_change_pct.toFixed(2)}%`}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Private & PSU Banking Sector
          </div>
        </div>

        {/* Market Breadth Card */}
        <div className="glass-panel" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Market Breadth</span>
            <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: data.advance_decline_ratio >= 1.0 ? '#10b981' : '#f43f5e' }}>
              A/D {data.advance_decline_ratio.toFixed(2)}
            </span>
          </div>
          {/* Progress bar for Advances vs Declines */}
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${advPct}%`, background: '#10b981' }} title={`Advances: ${data.advances}`} />
            <div style={{ width: `${decPct}%`, background: '#f43f5e' }} title={`Declines: ${data.declines}`} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginTop: '6px' }}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>{data.advances} Adv</span>
            <span style={{ color: 'var(--text-dim)' }}>{data.unchanged} Unch</span>
            <span style={{ color: '#f43f5e', fontWeight: 600 }}>{data.declines} Dec</span>
          </div>
        </div>

        {/* FII / DII Institutional Flows Card */}
        <div className="glass-panel" style={{ padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Institutional Flows (NSE/NSDL)</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{data.fii_dii_date}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>FII/FPI Net Cash</div>
              <div className="mono" style={{ fontSize: '0.92rem', fontWeight: 700, color: data.fii_net_flow_crores >= 0 ? '#10b981' : '#f43f5e' }}>
                {data.fii_net_flow_crores >= 0 ? `+₹${data.fii_net_flow_crores.toLocaleString('en-IN')} Cr` : `-₹${Math.abs(data.fii_net_flow_crores).toLocaleString('en-IN')} Cr`}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textAlign: 'right' }}>DII Net Cash</div>
              <div className="mono" style={{ fontSize: '0.92rem', fontWeight: 700, color: data.dii_net_flow_crores >= 0 ? '#10b981' : '#f43f5e', textAlign: 'right' }}>
                {data.dii_net_flow_crores >= 0 ? `+₹${data.dii_net_flow_crores.toLocaleString('en-IN')} Cr` : `-₹${Math.abs(data.dii_net_flow_crores).toLocaleString('en-IN')} Cr`}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Official daily net purchases in Indian Rupees
          </div>
        </div>
      </div>

      {/* Sectoral Performance Heatmap Strip */}
      <div className="glass-panel" style={{ padding: '12px 16px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={15} color="#818cf8" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              NSE Sectoral Performance & Leadership
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
            <Clock size={12} />
            <span>Session: {data.market_session_status}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {data.sectors.map((sec) => {
            const isUp = sec.change_pct >= 0;
            return (
              <div
                key={sec.symbol}
                onClick={() => onSelectSector && onSelectSector(sec.symbol)}
                style={{
                  minWidth: '150px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: isUp ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                  border: isUp ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(244, 63, 94, 0.2)',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'transform 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>{sec.sector_name.replace('NIFTY ', '')}</span>
                  <span className="mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: isUp ? '#10b981' : '#f43f5e' }}>
                    {isUp ? `+${sec.change_pct.toFixed(2)}%` : `${sec.change_pct.toFixed(2)}%`}
                  </span>
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{sec.advances}A / {sec.declines}D</span>
                  <span style={{ color: 'var(--text-muted)' }}>{sec.top_driver}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
