import { useState, useEffect, useRef } from 'react';
import {
  Activity, Volume2, VolumeX, Play, Square, Settings as SettingsIcon,
  BarChart2, Filter, ChevronDown, ChevronUp, Globe, TrendingUp,
  Target, Bell, History, List, Database, Cpu
} from 'lucide-react';

// Components & Workspaces
import { CandleChart } from './components/CandleChart';
import { WatchlistPanel } from './components/WatchlistPanel';
import type { AssetItem } from './components/WatchlistPanel';
import { SoundConfigModal } from './components/SoundConfigModal';
import { HistoricalBacktestView } from './components/HistoricalBacktestView';
import { MarketOverviewPanel } from './components/MarketOverviewPanel';
import type { MarketOverviewData } from './components/MarketOverviewPanel';
import { StockIntelligenceCard } from './components/StockIntelligenceCard';
import { StockScannerModal } from './components/StockScannerModal';
import { GlobalOverviewWorkspace } from './components/GlobalOverviewWorkspace';
import { USMarketWorkspace } from './components/USMarketWorkspace';
import { CryptoMarketWorkspace } from './components/CryptoMarketWorkspace';
import { GlobalContextWorkspace } from './components/GlobalContextWorkspace';
import { AssetScannerWorkspace } from './components/AssetScannerWorkspace';
import { ForecastsScenariosWorkspace } from './components/ForecastsScenariosWorkspace';
import { DataSourcesWorkspace } from './components/DataSourcesWorkspace';
import { SettingsWorkspace } from './components/SettingsWorkspace';
import { soundEngine } from './audio/soundEngine';
import type { SoundProfile } from './audio/soundEngine';

export type NavigationSection =
  | 'overview'
  | 'india'
  | 'us'
  | 'crypto'
  | 'global_context'
  | 'scanner'
  | 'scenarios'
  | 'alerts'
  | 'backtest'
  | 'watchlists'
  | 'data_sources'
  | 'settings';

export function App() {
  const [activeSection, setActiveSection] = useState<NavigationSection>('overview');
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('RELIANCE.NS');
  const [selectedIndiaSymbol, setSelectedIndiaSymbol] = useState<string>('RELIANCE.NS');
  const [selectedUSSymbol, setSelectedUSSymbol] = useState<string>('AAPL');
  const [selectedCryptoSymbol, setSelectedCryptoSymbol] = useState<string>('BTC-USD');
  const [timeframe, setTimeframe] = useState<string>('5m');
  const [candles, setCandles] = useState<any[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<any | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState<boolean>(false);
  const [allLatestResults, setAllLatestResults] = useState<Record<string, any>>({});
  const [alertsHistory, setAlertsHistory] = useState<any[]>([]);
  const [globalOverview, setGlobalOverview] = useState<any | null>(null);
  const [marketOverview, setMarketOverview] = useState<MarketOverviewData | null>(null);
  const [showIndiaOverviewStrip, setShowIndiaOverviewStrip] = useState<boolean>(true);

  // Sequential request token to prevent stale out-of-order race conditions
  const fetchIdRef = useRef<number>(0);

  // Sound Config & Audio State
  const [isSoundModalOpen, setIsSoundModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [soundModalAsset, setSoundModalAsset] = useState<string | null>(null);
  const [soundProfiles, setSoundProfiles] = useState<SoundProfile[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [lastSoundAlert, setLastSoundAlert] = useState<{ state: string; time: string } | null>(null);

  // Historical Backtesting State
  const [backtestMetrics, setBacktestMetrics] = useState<any | null>(null);
  const [backtestTimeline, setBacktestTimeline] = useState<any[]>([]);
  const [isBacktestLoading, setIsBacktestLoading] = useState(false);

  // Monitor Global Status
  const [isMonitoringRunning, setIsMonitoringRunning] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetchAssets();
    fetchSoundProfiles();
    fetchRecentAlerts();
    fetchGlobalOverview();
    fetchIndiaMarketOverview();
  }, []);

  // When switching market navigation sections, auto-align selectedSymbol
  useEffect(() => {
    if (activeSection === 'india') {
      if (!selectedSymbol.includes('.NS') && !assets.some(a => a.symbol === selectedSymbol && !a.symbol.includes('-USD') && !['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'TSLA', 'META', 'SPY', 'QQQ'].includes(a.symbol))) {
        setSelectedSymbol(selectedIndiaSymbol);
      }
    } else if (activeSection === 'us') {
      if (selectedSymbol.includes('.NS') || selectedSymbol.includes('-USD')) {
        setSelectedSymbol(selectedUSSymbol);
      }
    } else if (activeSection === 'crypto') {
      if (!selectedSymbol.includes('-USD')) {
        setSelectedSymbol(selectedCryptoSymbol);
      }
    }
  }, [activeSection]);

  useEffect(() => {
    fetchAssetAnalysis(selectedSymbol, timeframe);
    if (activeSection === 'backtest') {
      runHistoricalBacktest(selectedSymbol, timeframe, '1mo');
    }
  }, [selectedSymbol, timeframe, activeSection]);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: any = null;
    let isUnmounted = false;

    const connectWs = () => {
      if (isUnmounted) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const port = window.location.port === '5173' ? '8000' : (window.location.port || '');
      const wsUrl = `${protocol}//${window.location.hostname}${port ? `:${port}` : ''}/ws`;
      
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setWsConnected(true);
        try {
          socket?.send(JSON.stringify({ action: 'subscribe', symbol: selectedSymbol }));
        } catch (e) {
          // ignore
        }
      };

      socket.onclose = () => {
        setWsConnected(false);
        if (!isUnmounted) {
          reconnectTimer = setTimeout(connectWs, 2000);
        }
      };

      socket.onerror = () => {
        setWsConnected(false);
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'INITIAL_STATE') {
            if (msg.latest_results) setAllLatestResults(msg.latest_results);
            setIsMonitoringRunning(msg.is_running);
          } else if (msg.type === 'TICK_UPDATE') {
            const update = msg.data;
            const tickSymbol = msg.symbol || update?.symbol;
            if (tickSymbol) {
              setAllLatestResults((prev) => ({ ...prev, [tickSymbol]: update }));
            }

            if (tickSymbol === selectedSymbol) {
              setLatestAnalysis(update);

              // Incrementally update current candle or append new candle
              if (msg.latest_candle) {
                const liveCandle = msg.latest_candle;
                setCandles((prevCandles) => {
                  if (!prevCandles || prevCandles.length === 0) {
                    return [liveCandle];
                  }
                  const lastIdx = prevCandles.length - 1;
                  const lastCandle = prevCandles[lastIdx];
                  if (lastCandle.time === liveCandle.time) {
                    const updated = [...prevCandles];
                    updated[lastIdx] = liveCandle;
                    return updated;
                  } else if (liveCandle.time > lastCandle.time) {
                    return [...prevCandles, liveCandle];
                  }
                  return prevCandles;
                });
              }
            }

            if (msg.alert_triggered && update?.sound_profile) {
              setLastSoundAlert({
                state: update.momentum_state || update.trend_state,
                time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
              });
              soundEngine.playProfile(update.sound_profile);
              fetchRecentAlerts();
            }
          }
        } catch (e) {
          console.error('WebSocket parse error:', e);
        }
      };
    };

    connectWs();

    return () => {
      isUnmounted = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, [selectedSymbol]);

  // Send subscribe command to backend monitoring engine when symbol changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'subscribe', symbol: selectedSymbol }));
    }
  }, [selectedSymbol, wsConnected]);

  const handleUnlockAudio = async () => {
    const ok = await soundEngine.unlockAudio();
    if (ok) {
      setAudioUnlocked(true);
    }
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
  };

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/assets');
      if (res.ok) {
        const data = await res.json();
        setAssets(data);
        if (data.length > 0 && !selectedSymbol) {
          setSelectedSymbol(data[0].symbol);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch assets:', e);
    }
  };

  const fetchGlobalOverview = async () => {
    try {
      const res = await fetch('/api/overview');
      if (res.ok) {
        const data = await res.json();
        setGlobalOverview(data);
      }
    } catch (e) {
      console.warn('Failed to fetch global overview:', e);
    }
  };

  const fetchIndiaMarketOverview = async () => {
    try {
      const res = await fetch('/api/market-overview?market=india');
      if (res.ok) {
        const data = await res.json();
        setMarketOverview(data);
      }
    } catch (e) {
      console.warn('Failed to fetch Indian market overview:', e);
    }
  };

  const fetchSoundProfiles = async (symbol?: string) => {
    try {
      const url = symbol ? `/api/sound-profiles?symbol=${symbol}` : '/api/sound-profiles';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSoundProfiles(data);
      }
    } catch (e) {
      console.warn('Failed to fetch sound profiles:', e);
    }
  };

  const fetchRecentAlerts = async () => {
    try {
      const res = await fetch('/api/alerts?limit=50');
      if (res.ok) {
        const data = await res.json();
        setAlertsHistory(data);
      }
    } catch (e) {
      console.warn('Failed to fetch alerts:', e);
    }
  };

  const fetchAssetAnalysis = async (symbol: string, tf: string) => {
    const currentFetchId = ++fetchIdRef.current;
    setIsLoadingAnalysis(true);
    // Immediately clear candles so previous stock's chart is wiped out instantly
    setCandles([]);

    try {
      const res = await fetch(`/api/analysis/${symbol}?timeframe=${tf}&period=5d`);
      if (res.ok) {
        const data = await res.json();
        // Only apply if this request is still the most current selection
        if (currentFetchId === fetchIdRef.current) {
          setCandles(data.candles || []);
          setLatestAnalysis(data.analysis);
          setIsLoadingAnalysis(false);
        }
      } else {
        if (currentFetchId === fetchIdRef.current) {
          setIsLoadingAnalysis(false);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch asset analysis:', e);
      if (currentFetchId === fetchIdRef.current) {
        setIsLoadingAnalysis(false);
      }
    }
  };

  const runHistoricalBacktest = async (symbol: string, tf: string, period: string) => {
    setIsBacktestLoading(true);
    try {
      const res = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, timeframe: tf, period }),
      });
      if (res.ok) {
        const data = await res.json();
        setBacktestMetrics(data.metrics);
        setBacktestTimeline(data.timeline_alerts || []);
        if (data.candles) setCandles(data.candles);
      }
    } catch (e) {
      console.warn('Historical backtest error:', e);
    } finally {
      setIsBacktestLoading(false);
    }
  };

  const handleSaveProfile = async (profile: SoundProfile) => {
    await fetch('/api/sound-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    await fetchSoundProfiles(soundModalAsset || undefined);
  };

  const handleToggleMonitoring = async (symbol: string, monitored: boolean) => {
    await fetch(`/api/assets/${symbol}/toggle?monitored=${monitored}`, { method: 'POST' });
    await fetchAssets();
  };

  const handleRemoveAsset = async (symbol: string) => {
    await fetch(`/api/assets/${symbol}`, { method: 'DELETE' });
    await fetchAssets();
    if (selectedSymbol === symbol && assets.length > 1) {
      setSelectedSymbol(assets.find((a) => a.symbol !== symbol)?.symbol || 'RELIANCE.NS');
    }
  };

  const handleAddAsset = async (
    symbol: string, name: string, nseSymbol: string, sector: string, mcap: string, provider: string, tf: string
  ) => {
    let market = 'india';
    let currency = 'INR';
    let timezone = 'Asia/Kolkata';
    let exchange = 'NSE';

    if (symbol.endsWith('-USD') || symbol.endsWith('USDT') || symbol.startsWith('BTC') || symbol.startsWith('ETH')) {
      market = 'crypto';
      currency = 'USD';
      timezone = 'UTC';
      exchange = 'Crypto';
    } else if (!symbol.endsWith('.NS') && !symbol.endsWith('.BO')) {
      market = 'us';
      currency = 'USD';
      timezone = 'America/New_York';
      exchange = 'US Equities';
    }

    try {
      await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          name: name || symbol,
          market,
          currency,
          timezone,
          exchange,
          nse_symbol: nseSymbol || symbol.replace('.NS', ''),
          sector: sector || 'Equities',
          industry: sector || 'Equities',
          index_membership: market === 'india' ? 'NSE Cash' : market === 'us' ? 'US Equities' : 'Crypto',
          market_cap_category: mcap || 'Large Cap',
          provider: provider || 'yfinance',
          timeframe: tf || '5m',
          is_monitored: true,
          cooldown_seconds: 120,
        }),
      });
      await fetchAssets();
      setSelectedSymbol(symbol);
      if (market === 'india') setSelectedIndiaSymbol(symbol);
      else if (market === 'us') setSelectedUSSymbol(symbol);
      else if (market === 'crypto') setSelectedCryptoSymbol(symbol);
    } catch (e) {
      console.warn('Failed to add asset:', e);
    }
  };

  const handleToggleMasterMonitor = async () => {
    const endpoint = isMonitoringRunning ? '/api/monitor/stop' : '/api/monitor/start';
    await fetch(endpoint, { method: 'POST' });
    setIsMonitoringRunning(!isMonitoringRunning);
  };

  const handleSelectAssetCrossMarket = (symbol: string, market: 'india' | 'us' | 'crypto') => {
    if (market === 'india') {
      setSelectedIndiaSymbol(symbol);
      setSelectedSymbol(symbol);
      setActiveSection('india');
    } else if (market === 'us') {
      setSelectedUSSymbol(symbol);
      setSelectedSymbol(symbol);
      setActiveSection('us');
    } else if (market === 'crypto') {
      setSelectedCryptoSymbol(symbol);
      setSelectedSymbol(symbol);
      setActiveSection('crypto');
    }
  };

  const getTrendColor = (state?: string) => {
    if (!state) return '#94a3b8';
    const s = state.toLowerCase();
    if (s.includes('breakout') || s.includes('strong bullish') || s.includes('confirmed upward') || s.includes('early bullish')) return '#10b981';
    if (s.includes('breakdown') || s.includes('strong bearish') || s.includes('confirmed downward') || s.includes('early bearish')) return '#f43f5e';
    if (s.includes('reversal') || s.includes('profit') || s.includes('liquidation')) return '#f59e0b';
    return '#94a3b8';
  };

  const trendColor = getTrendColor(latestAnalysis?.momentum_state || latestAnalysis?.trend_state);

  // 12 Navigation Items
  const navItems: { id: NavigationSection; label: string; icon: any; badge?: string }[] = [
    { id: 'overview', label: 'Overview', icon: Globe },
    { id: 'india', label: 'India Markets', icon: TrendingUp, badge: 'Priority 1' },
    { id: 'us', label: 'US Markets', icon: TrendingUp, badge: 'Priority 2' },
    { id: 'crypto', label: 'Crypto Markets', icon: Activity, badge: 'Priority 3' },
    { id: 'global_context', label: 'Global Market Context', icon: BarChart2 },
    { id: 'scanner', label: 'Stock & Asset Scanner', icon: Filter },
    { id: 'scenarios', label: 'Forecasts & Scenarios', icon: Target },
    { id: 'alerts', label: 'Alerts & Notifications', icon: Bell },
    { id: 'backtest', label: 'Historical Analysis & Backtest', icon: History },
    { id: 'watchlists', label: 'Watchlists', icon: List },
    { id: 'data_sources', label: 'Data Sources & Health', icon: Database },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '16px', gap: '16px', width: '100%', maxWidth: '100vw', boxSizing: 'border-box', overflowX: 'hidden' }}>
      {/* Top Application Header */}
      <header
        className="glass-panel"
        style={{
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Cpu size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff', margin: 0 }}>
                MULTI-MARKET INTELLIGENCE PLATFORM
              </h1>
              <span className="badge badge-live">PRO QUANT</span>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-dim)', margin: '2px 0 0' }}>
              Indian Equities (NSE/BSE) → US Equities (NYSE/NASDAQ) → Cryptocurrency (24/7 Spot/Perp)
            </p>
          </div>
        </div>

        {/* Global Sound & Ingestion Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {!audioUnlocked ? (
            <button
              onClick={handleUnlockAudio}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              }}
            >
              <Volume2 size={15} />
              <span>Enable Audio Alerts</span>
            </button>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '0.74rem',
                color: '#10b981',
                fontWeight: 600,
              }}
            >
              <Volume2 size={14} />
              <span>Audio Active</span>
              {lastSoundAlert && (
                <span style={{ fontSize: '0.7rem', color: '#fbbf24', marginLeft: '4px' }}>
                  ({lastSoundAlert.state} @ {lastSoundAlert.time})
                </span>
              )}
            </div>
          )}

          <button
            onClick={handleToggleMute}
            className="btn-secondary"
            title={isMuted ? 'Unmute Audio Alerts' : 'Mute Audio Alerts'}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px' }}
          >
            {isMuted ? <VolumeX size={15} color="#f43f5e" /> : <Volume2 size={15} color="#10b981" />}
            <span style={{ fontSize: '0.76rem' }}>{isMuted ? 'Muted' : 'Sound On'}</span>
          </button>

          <button
            onClick={handleToggleMasterMonitor}
            className={isMonitoringRunning ? 'btn-secondary' : 'btn-primary'}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px' }}
          >
            {isMonitoringRunning ? <Square size={13} color="#f43f5e" /> : <Play size={13} />}
            <span style={{ fontSize: '0.76rem' }}>{isMonitoringRunning ? 'Pause Engine' : 'Resume'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: wsConnected ? '#10b981' : '#f43f5e' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: wsConnected ? '#10b981' : '#f43f5e' }} />
            <span>{wsConnected ? 'FEED ONLINE' : 'OFFLINE'}</span>
          </div>
        </div>
      </header>

      {/* 12-Section Main Navigation Bar */}
      <nav
        className="glass-panel"
        style={{
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: isActive ? 700 : 500,
                border: isActive ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid transparent',
                background: isActive ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} color={isActive ? '#818cf8' : 'var(--text-dim)'} />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    fontSize: '0.65rem',
                    padding: '2px 5px',
                    borderRadius: '4px',
                    background: item.badge.includes('1') ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: item.badge.includes('1') ? '#fbbf24' : 'var(--text-dim)',
                    fontWeight: 700,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Main Workspace Router */}
      <div style={{ flex: 1, minWidth: 0, width: '100%', maxWidth: '100%' }}>
        {/* Section 1: Overview */}
        {activeSection === 'overview' && (
          <GlobalOverviewWorkspace
            overviewData={globalOverview}
            onNavigateToMarket={(mkt) => setActiveSection(mkt)}
            onSelectAsset={handleSelectAssetCrossMarket}
          />
        )}

        {/* Section 2: Indian Stock Market Workspace (Priority 1) */}
        {activeSection === 'india' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Indian Market Overview Collapsible Strip */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  NSE/BSE Market Pulse & Institutional Disclosures (IST)
                </span>
                <button
                  onClick={() => setShowIndiaOverviewStrip(!showIndiaOverviewStrip)}
                  style={{ background: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>{showIndiaOverviewStrip ? 'Hide Overview' : 'Show Overview'}</span>
                  {showIndiaOverviewStrip ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
              {showIndiaOverviewStrip && (
                <MarketOverviewPanel
                  data={marketOverview}
                  onSelectSector={(sym) => setSelectedSymbol(sym)}
                />
              )}
            </div>

            {/* Indian Grid: Watchlist + Analysis Main View */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) minmax(0, 1fr)', gap: '16px', minHeight: '600px', width: '100%', maxWidth: '100%' }}>
              <aside style={{ height: '100%' }}>
                <WatchlistPanel
                  assets={assets.filter((a) => !a.symbol.includes('-USD') && !['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'TSLA', 'META', 'SPY', 'QQQ'].includes(a.symbol))}
                  selectedSymbol={selectedSymbol}
                  onSelectSymbol={(sym) => {
                    setSelectedIndiaSymbol(sym);
                    setSelectedSymbol(sym);
                  }}
                  onToggleMonitoring={handleToggleMonitoring}
                  onRemoveAsset={handleRemoveAsset}
                  onAddAsset={handleAddAsset}
                  onOpenSoundConfig={(sym) => {
                    setSoundModalAsset(sym || null);
                    setIsSoundModalOpen(true);
                  }}
                  latestResults={allLatestResults}
                />
              </aside>

              <main style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0, width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
                {(() => {
                  const activeAsset = assets.find((a) => a.symbol === selectedSymbol);
                  const isCurrentAnalysis = latestAnalysis && latestAnalysis.symbol === selectedSymbol && !isLoadingAnalysis;
                  return (
                    <>
                      {/* Indian Asset Hero Banner */}
                      <div
                        className="glass-panel"
                        style={{
                          padding: '18px 22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '14px',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h2 className="mono" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                              {isCurrentAnalysis
                                ? (latestAnalysis.nse_symbol || selectedSymbol.replace('.NS', ''))
                                : (activeAsset?.nse_symbol || selectedSymbol.replace('.NS', ''))}
                            </h2>
                            <span className={isCurrentAnalysis && latestAnalysis.source_type === 'live' ? 'badge badge-live' : 'badge badge-delayed'}>
                              {isCurrentAnalysis ? latestAnalysis.source_type.toUpperCase() : 'SYNCING'} (NSE/BSE)
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
                              {isCurrentAnalysis ? latestAnalysis?.sector : (activeAsset?.sector || 'Equities')} • {timeframe}
                            </span>
                          </div>

                          {isCurrentAnalysis ? (
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '4px' }}>
                              <span className="mono" style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff' }}>
                                ₹{latestAnalysis.current_price?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span
                                className="mono"
                                style={{
                                  fontSize: '0.95rem',
                                  fontWeight: 700,
                                  color: latestAnalysis.price_change_pct >= 0 ? '#10b981' : '#f43f5e',
                                }}
                              >
                                {latestAnalysis.price_change_pct >= 0
                                  ? `+${latestAnalysis.price_change_pct.toFixed(2)}%`
                                  : `${latestAnalysis.price_change_pct.toFixed(2)}%`}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                IST: {latestAnalysis.timestamp}
                              </span>
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                              {isLoadingAnalysis ? 'Updating live prices & technical metrics...' : 'Awaiting market feed data...'}
                            </div>
                          )}
                        </div>

                        {isCurrentAnalysis && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '2px' }}>
                              Momentum State
                            </div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: trendColor }}>
                              {latestAnalysis.momentum_state || latestAnalysis.trend_state}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {latestAnalysis.structural_hypothesis} • S{latestAnalysis.severity}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Candlestick Chart */}
                      <div className="glass-panel" style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>
                              {isCurrentAnalysis ? (latestAnalysis?.name || selectedSymbol) : (activeAsset?.name || selectedSymbol)} (₹)
                            </span>
                            <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>
                              — Intraday VWAP (09:15 IST Reset)
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '2px', borderRadius: '6px' }}>
                            {['1m', '3m', '5m', '15m', '30m', '1h', '1d'].map((tf) => (
                              <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  background: timeframe === tf ? 'var(--accent-indigo)' : 'transparent',
                                  color: timeframe === tf ? '#fff' : 'var(--text-dim)',
                                }}
                              >
                                {tf}
                              </button>
                            ))}
                          </div>
                        </div>

                        <CandleChart
                          candles={candles}
                          alerts={alertsHistory.filter((a) => a.symbol === selectedSymbol)}
                          symbol={selectedSymbol}
                          isLoading={isLoadingAnalysis}
                          currency="INR"
                          patternPrediction={isCurrentAnalysis ? latestAnalysis?.pattern_prediction : null}
                          livePrice={isCurrentAnalysis ? (latestAnalysis?.pattern_prediction?.current_price ?? latestAnalysis?.current_price) : undefined}
                        />
                      </div>

                      {/* Stock Intelligence Evidence Card */}
                      {isCurrentAnalysis && <StockIntelligenceCard data={latestAnalysis} />}
                    </>
                  );
                })()}
              </main>
            </div>
          </div>
        )}

        {/* Section 3: US Stock Market Workspace (Priority 2) */}
        {activeSection === 'us' && (
          <USMarketWorkspace
            selectedSymbol={selectedSymbol}
            onSelectSymbol={(sym) => {
              setSelectedUSSymbol(sym);
              setSelectedSymbol(sym);
            }}
            analysis={latestAnalysis?.symbol === selectedSymbol && !isLoadingAnalysis ? latestAnalysis : null}
            candles={candles}
            timeframe={timeframe}
            onChangeTimeframe={setTimeframe}
            onOpenSoundConfig={(sym) => {
              setSoundModalAsset(sym || null);
              setIsSoundModalOpen(true);
            }}
            isLoading={isLoadingAnalysis}
          />
        )}

        {/* Section 4: Crypto Market Workspace (Priority 3) */}
        {activeSection === 'crypto' && (
          <CryptoMarketWorkspace
            selectedSymbol={selectedSymbol}
            onSelectSymbol={(sym) => {
              setSelectedCryptoSymbol(sym);
              setSelectedSymbol(sym);
            }}
            analysis={latestAnalysis?.symbol === selectedSymbol && !isLoadingAnalysis ? latestAnalysis : null}
            candles={candles}
            timeframe={timeframe}
            onChangeTimeframe={setTimeframe}
            onOpenSoundConfig={(sym) => {
              setSoundModalAsset(sym || null);
              setIsSoundModalOpen(true);
            }}
            isLoading={isLoadingAnalysis}
          />
        )}

        {/* Section 5: Global Market Context */}
        {activeSection === 'global_context' && <GlobalContextWorkspace />}

        {/* Section 6: Stock & Asset Scanner */}
        {activeSection === 'scanner' && (
          <AssetScannerWorkspace onSelectAsset={handleSelectAssetCrossMarket} />
        )}

        {/* Section 7: Forecasts and Scenarios */}
        {activeSection === 'scenarios' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="glass-panel" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>Asset Under Forecast:</span>
                <span className="mono" style={{ fontSize: '1rem', fontWeight: 800, color: '#818cf8' }}>{selectedSymbol}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {assets.slice(0, 8).map((a) => (
                  <button
                    key={a.symbol}
                    className="btn btn-secondary"
                    onClick={() => setSelectedSymbol(a.symbol)}
                    style={{ fontSize: '0.72rem', padding: '4px 8px', background: selectedSymbol === a.symbol ? 'rgba(99, 102, 241, 0.25)' : undefined }}
                  >
                    {a.symbol}
                  </button>
                ))}
              </div>
            </div>
            <ForecastsScenariosWorkspace symbol={selectedSymbol} analysis={latestAnalysis} />
          </div>
        )}

        {/* Section 8: Alerts & Notifications */}
        {activeSection === 'alerts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Alerts, Audio Notifications & State Audits
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Chronological log of synthesized sound events, cooldown enforcements, and state transitions
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSoundModalAsset(null);
                  setIsSoundModalOpen(true);
                }}
              >
                Configure Sound Studio
              </button>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff', marginBottom: '14px' }}>
                Recent Alert History ({alertsHistory.length} Events)
              </h3>
              {alertsHistory.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  No alerts recorded yet in this session. Alerts trigger when market state shifts occur.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px' }}>Timestamp</th>
                        <th style={{ padding: '10px 12px' }}>Symbol</th>
                        <th style={{ padding: '10px 12px' }}>Momentum State</th>
                        <th style={{ padding: '10px 12px' }}>Trigger Price</th>
                        <th style={{ padding: '10px 12px' }}>Severity</th>
                        <th style={{ padding: '10px 12px' }}>Sound Profile</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alertsHistory.map((al, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{al.timestamp}</td>
                          <td className="mono" style={{ padding: '10px 12px', fontWeight: 800, color: '#fff' }}>{al.symbol}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                              {al.momentum_state || al.trend_state}
                            </span>
                          </td>
                          <td className="mono" style={{ padding: '10px 12px', fontWeight: 700, color: '#fff' }}>{al.current_price?.toFixed(2)}</td>
                          <td style={{ padding: '10px 12px' }}>S{al.severity}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-dim)' }}>{al.sound_profile?.profile_name || 'Standard'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 9: Historical Analysis and Backtesting */}
        {activeSection === 'backtest' && (
          <HistoricalBacktestView
            symbol={selectedSymbol}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            metrics={backtestMetrics}
            timeline={backtestTimeline}
            isLoading={isBacktestLoading}
            onRunBacktest={(period) => runHistoricalBacktest(selectedSymbol, timeframe, period)}
          />
        )}

        {/* Section 10: Watchlists */}
        {activeSection === 'watchlists' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* India Equities Watchlist Card */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>🇮🇳 Indian Equities (NSE/BSE)</h3>
                <span className="badge badge-live">15 Assets</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {assets.filter((a) => a.symbol.endsWith('.NS') || a.symbol.endsWith('.BO')).map((a) => (
                  <div
                    key={a.symbol}
                    onClick={() => handleSelectAssetCrossMarket(a.symbol, 'india')}
                    style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div className="mono" style={{ fontWeight: 800, color: '#fff', fontSize: '0.88rem' }}>{a.symbol}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.name} • {a.sector}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#818cf8' }}>Analyze →</span>
                  </div>
                ))}
              </div>
            </div>

            {/* US Equities Watchlist Card */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>🇺🇸 US Equities (NYSE/NASDAQ)</h3>
                <span className="badge badge-live">9 Assets</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {assets.filter((a) => ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'TSLA', 'META', 'SPY', 'QQQ'].includes(a.symbol)).map((a) => (
                  <div
                    key={a.symbol}
                    onClick={() => handleSelectAssetCrossMarket(a.symbol, 'us')}
                    style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div className="mono" style={{ fontWeight: 800, color: '#fff', fontSize: '0.88rem' }}>{a.symbol}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.name} • {a.sector}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#60a5fa' }}>Analyze →</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Crypto Watchlist Card */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff' }}>🌐 Cryptocurrencies (24/7)</h3>
                <span className="badge badge-live">4 Assets</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {assets.filter((a) => a.symbol.includes('-USD')).map((a) => (
                  <div
                    key={a.symbol}
                    onClick={() => handleSelectAssetCrossMarket(a.symbol, 'crypto')}
                    style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div>
                      <div className="mono" style={{ fontWeight: 800, color: '#fff', fontSize: '0.88rem' }}>{a.symbol}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{a.name} • {a.sector}</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>Analyze →</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Section 11: Data Sources and System Health */}
        {activeSection === 'data_sources' && <DataSourcesWorkspace />}

        {/* Section 12: Settings */}
        {activeSection === 'settings' && (
          <SettingsWorkspace
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onOpenSoundConfig={() => {
              setSoundModalAsset(null);
              setIsSoundModalOpen(true);
            }}
          />
        )}
      </div>

      {/* Sound Configuration Modal */}
      <SoundConfigModal
        isOpen={isSoundModalOpen}
        onClose={() => setIsSoundModalOpen(false)}
        profiles={soundProfiles}
        onSaveProfile={handleSaveProfile}
        currentAssetSymbol={soundModalAsset}
      />

      {/* Multi-Stock Scanner Modal */}
      <StockScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectStock={(sym) => setSelectedSymbol(sym)}
      />
    </div>
  );
}

export default App;
