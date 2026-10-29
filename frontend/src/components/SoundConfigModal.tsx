import React, { useState } from 'react';
import { Volume2, Play, Save, X, Upload, Check, Music } from 'lucide-react';
import type { SoundProfile, WaveformType } from '../audio/soundEngine';
import { soundEngine } from '../audio/soundEngine';

interface SoundConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: SoundProfile[];
  onSaveProfile: (profile: SoundProfile) => Promise<void>;
  currentAssetSymbol?: string | null;
}

export const SoundConfigModal: React.FC<SoundConfigModalProps> = ({
  isOpen,
  onClose,
  profiles,
  onSaveProfile,
  currentAssetSymbol,
}) => {
  const [selectedState, setSelectedState] = useState<string>(profiles[0]?.state_name || '');
  const [editProfile, setEditProfile] = useState<SoundProfile | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  React.useEffect(() => {
    const matched = profiles.find((p) => p.state_name === selectedState) || profiles[0];
    if (matched) {
      setEditProfile({ ...matched });
    }
  }, [selectedState, profiles]);

  if (!isOpen || !editProfile) return null;

  const handlePreview = () => {
    soundEngine.preview(editProfile);
  };

  const handleSave = async () => {
    await onSaveProfile(editProfile);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const url = uploadEvent.target?.result as string;
        setEditProfile((prev) => prev ? { ...prev, custom_audio_url: url } : null);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '750px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#121824',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, rgba(99, 102, 241, 0.1), transparent)',
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
              <Volume2 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
                Intelligent Sound Alert Studio
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {currentAssetSymbol ? `Asset-Specific Sound Profile: ${currentAssetSymbol}` : 'Global Master Sound Profile'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              color: 'var(--text-muted)',
              padding: '6px',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body: Left sidebar (States) + Right Panel (Controls) */}
        <div style={{ display: 'flex', flex: 1, minHeight: '400px', overflow: 'hidden' }}>
          {/* Trend State Selector List */}
          <div
            style={{
              width: '260px',
              borderRight: '1px solid var(--border-color)',
              padding: '12px',
              overflowY: 'auto',
              background: 'rgba(10, 14, 23, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', padding: '6px 8px', textTransform: 'uppercase' }}>
              Momentum States ({profiles.length})
            </div>
            {profiles.map((p) => {
              const active = p.state_name === selectedState;
              const isUp = p.state_name.toLowerCase().includes('up') || p.state_name.toLowerCase().includes('breakout');
              const isDown = p.state_name.toLowerCase().includes('down') || p.state_name.toLowerCase().includes('breakdown');
              const isRev = p.state_name.toLowerCase().includes('reversal');

              let dotColor = '#94a3b8';
              if (isUp) dotColor = '#10b981';
              else if (isDown) dotColor = '#f43f5e';
              else if (isRev) dotColor = '#f59e0b';

              return (
                <button
                  key={p.state_name}
                  onClick={() => setSelectedState(p.state_name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    textAlign: 'left',
                    fontSize: '0.82rem',
                    fontWeight: active ? 600 : 400,
                    color: active ? '#fff' : 'var(--text-muted)',
                    background: active ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    border: active ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: dotColor,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.state_name}
                  </span>
                  {!p.enabled && (
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Off</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Configuration Form Controls */}
          <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>{editProfile.state_name}</h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Synthesized acoustic signature for this market condition
                </span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={editProfile.enabled}
                  onChange={(e) => setEditProfile({ ...editProfile, enabled: e.target.checked })}
                  style={{ accentColor: '#6366f1', width: '16px', height: '16px' }}
                />
                <span style={{ color: editProfile.enabled ? '#fff' : 'var(--text-dim)', fontWeight: 500 }}>
                  {editProfile.enabled ? 'Enabled' : 'Muted'}
                </span>
              </label>
            </div>

            {/* Waveform Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Oscillator Tone Waveform
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {(['sine', 'triangle', 'square', 'sawtooth'] as WaveformType[]).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setEditProfile({ ...editProfile, waveform: w })}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      textTransform: 'capitalize',
                      fontWeight: editProfile.waveform === w ? 600 : 400,
                      background: editProfile.waveform === w ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                      color: editProfile.waveform === w ? '#818cf8' : 'var(--text-muted)',
                      border: editProfile.waveform === w ? '1px solid #6366f1' : '1px solid var(--border-color)',
                    }}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Pitch / Frequency Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Base Frequency (Pitch)</span>
                <span className="mono" style={{ color: '#818cf8', fontWeight: 600 }}>{Math.round(editProfile.frequency)} Hz</span>
              </div>
              <input
                type="range"
                min="120"
                max="1600"
                step="10"
                value={editProfile.frequency}
                onChange={(e) => setEditProfile({ ...editProfile, frequency: parseFloat(e.target.value) })}
                style={{ width: '100%', accentColor: '#6366f1' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                <span>120 Hz (Low Bass)</span>
                <span>880 Hz (A5 Treble)</span>
                <span>1600 Hz (Sharp)</span>
              </div>
            </div>

            {/* Beep Duration & Repetitions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Pulse Duration</span>
                  <span className="mono" style={{ color: '#818cf8' }}>{editProfile.beep_duration_ms} ms</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="600"
                  step="10"
                  value={editProfile.beep_duration_ms}
                  onChange={(e) => setEditProfile({ ...editProfile, beep_duration_ms: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: '#6366f1' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Repetitions</span>
                  <span className="mono" style={{ color: '#818cf8' }}>{editProfile.repetition_count}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={editProfile.repetition_count}
                  onChange={(e) => setEditProfile({ ...editProfile, repetition_count: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: '#6366f1' }}
                />
              </div>
            </div>

            {/* Interval & Volume */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Repeat Interval Gap</span>
                  <span className="mono" style={{ color: '#818cf8' }}>{editProfile.interval_ms} ms</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="300"
                  step="10"
                  value={editProfile.interval_ms}
                  onChange={(e) => setEditProfile({ ...editProfile, interval_ms: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: '#6366f1' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Volume Level</span>
                  <span className="mono" style={{ color: '#818cf8' }}>{Math.round(editProfile.volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={editProfile.volume}
                  onChange={(e) => setEditProfile({ ...editProfile, volume: parseFloat(e.target.value) })}
                  style={{ width: '100%', accentColor: '#6366f1' }}
                />
              </div>
            </div>

            {/* Custom Audio Upload Option */}
            <div
              style={{
                border: '1px dashed var(--border-color)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Music size={18} color="#94a3b8" />
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 500 }}>
                    Custom Audio File (.mp3, .wav)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {editProfile.custom_audio_url ? 'Custom audio loaded' : 'Use synthesized tone (default)'}
                  </div>
                </div>
              </div>
              <label className="btn-secondary" style={{ cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={14} />
                <span>Upload</span>
                <input type="file" accept="audio/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10, 14, 23, 0.8)',
          }}
        >
          <button
            onClick={handlePreview}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px' }}
          >
            <Play size={16} fill="currentColor" />
            <span>Test Sound Preview</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {saveSuccess && (
              <span style={{ color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Check size={16} /> Saved!
              </span>
            )}
            <button
              onClick={handleSave}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
            >
              <Save size={16} />
              <span>Save Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
