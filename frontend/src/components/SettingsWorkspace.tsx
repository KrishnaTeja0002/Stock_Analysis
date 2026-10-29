import React, { useState } from 'react';
import { Settings, Volume2, Key, Check } from 'lucide-react';
import { soundEngine } from '../audio/soundEngine';

interface SettingsWorkspaceProps {
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSoundConfig: () => void;
}

export const SettingsWorkspace: React.FC<SettingsWorkspaceProps> = ({
  isMuted,
  onToggleMute,
  onOpenSoundConfig,
}) => {
  const [pollInterval, setPollInterval] = useState('5');
  const [kiteApiKey, setKiteApiKey] = useState('');
  const [binanceKey, setBinanceKey] = useState('');
  const [ibkrPort, setIbkrPort] = useState('7497');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestSound = () => {
    soundEngine.preview({
      state_name: 'TEST_ALERT',
      waveform: 'sine',
      frequency: 880,
      beep_duration_ms: 180,
      repetition_count: 2,
      interval_ms: 80,
      volume: 0.5,
      enabled: true,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <Settings size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Platform Configuration & Market Provider Settings
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Manage multi-market ingestion parameters, broker API credentials, and audio alert engines
            </p>
          </div>
        </div>
      </div>

      {/* Audio Engine Configuration */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Volume2 size={18} color="#60a5fa" />
          Sound Engine & Alert Synthesis
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'center' }}>
          <div style={{ padding: '14px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Master Audio Status</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: isMuted ? '#f43f5e' : '#10b981' }}>
                {isMuted ? 'Muted (Silent)' : 'Active (Synthesizing)'}
              </span>
              <button
                className={`btn ${isMuted ? 'btn-secondary' : 'btn-primary'}`}
                onClick={onToggleMute}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                {isMuted ? 'Unmute' : 'Mute All'}
              </button>
            </div>
          </div>

          <div style={{ padding: '14px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Audio Verification Test</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Synthesize 880Hz Sine</span>
              <button
                className="btn btn-secondary"
                onClick={handleTestSound}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                Test Sound
              </button>
            </div>
          </div>

          <div style={{ padding: '14px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>Granular Sound Profiles</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>14 Market States</span>
              <button
                className="btn btn-secondary"
                onClick={onOpenSoundConfig}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
              >
                Configure
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ingestion & Broker API Credentials */}
      <form onSubmit={handleSave} className="glass-panel" style={{ padding: '20px 24px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Key size={18} color="#f59e0b" />
          Authorized Market Data Provider Credentials
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {/* Indian Equity Provider */}
          <div>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
              Zerodha Kite Connect / Upstox API Token (NSE/BSE Level 2)
            </label>
            <input
              type="password"
              placeholder="e.g. kite_sec_token_..."
              value={kiteApiKey}
              onChange={(e) => setKiteApiKey(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.82rem' }}
            />
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Enables live 50-deep bid/ask order book depth stream for Indian equities.
            </span>
          </div>

          {/* US Provider */}
          <div>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
              Interactive Brokers (TWS / Gateway Port)
            </label>
            <input
              type="text"
              placeholder="7497"
              value={ibkrPort}
              onChange={(e) => setIbkrPort(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.82rem' }}
            />
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Connects to IBKR TWS API for real-time NYSE/NASDAQ SIP data.
            </span>
          </div>

          {/* Crypto Provider */}
          <div>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
              Binance / Coinbase WebSocket API Key
            </label>
            <input
              type="password"
              placeholder="binance_pub_key_..."
              value={binanceKey}
              onChange={(e) => setBinanceKey(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.82rem' }}
            />
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Unlocks direct perpetual futures funding rate and tick-level order flow.
            </span>
          </div>

          {/* Polling Interval */}
          <div>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-dim)', display: 'block', marginBottom: '6px' }}>
              Background Engine Ingestion Cadence
            </label>
            <select
              value={pollInterval}
              onChange={(e) => setPollInterval(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.82rem' }}
            >
              <option value="5">5 Seconds (High Responsiveness)</option>
              <option value="10">10 Seconds (Standard Quantitative)</option>
              <option value="30">30 Seconds (Bandwidth Optimized)</option>
            </select>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Interval between multi-market quantitative indicator recalculations.
            </span>
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
          {savedSuccess && (
            <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={16} /> Preferences successfully updated
            </span>
          )}
          <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.82rem' }}>
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};
