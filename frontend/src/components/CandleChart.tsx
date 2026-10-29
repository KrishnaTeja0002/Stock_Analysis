import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createSeriesMarkers,
} from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import { Zap, TrendingUp, TrendingDown, Target, ShieldAlert, Activity } from 'lucide-react';

export interface CandleData {
  timestamp: string;
  time?: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  vwap?: number;
}

export interface AlertEvent {
  bar_index?: number;
  timestamp: string;
  time?: number;
  price: number;
  trend_state: string;
  severity: number;
}

interface CandleChartProps {
  candles: CandleData[];
  alerts?: AlertEvent[];
  symbol: string;
  currency?: string;
  isLoading?: boolean;
  patternPrediction?: any;
  livePrice?: number;
}

export const CandleChart: React.FC<CandleChartProps> = ({
  candles,
  alerts = [],
  symbol,
  currency,
  isLoading = false,
  patternPrediction,
  livePrice,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const vwapSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const priceLinesRef = useRef<any[]>([]);
  const previousSymbolRef = useRef<string>(symbol);
  const [tickFlash, setTickFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = useRef<number | null>(null);

  // Determine currency symbol
  const isINR = currency === 'INR' || symbol.endsWith('.NS') || symbol.endsWith('.BO');
  const currPrefix = isINR ? '₹' : '$';

  // Watch for price fluctuations to trigger subtle live pulse
  useEffect(() => {
    if (candles.length > 0) {
      const currentClose = livePrice ?? candles[candles.length - 1].close;
      if (prevPriceRef.current !== null && prevPriceRef.current !== currentClose) {
        setTickFlash(currentClose > prevPriceRef.current ? 'up' : 'down');
        const timer = setTimeout(() => setTickFlash(null), 800);
        prevPriceRef.current = currentClose;
        return () => clearTimeout(timer);
      }
      prevPriceRef.current = currentClose;
    }
  }, [candles, livePrice]);

  // Initialize Lightweight Chart Instance
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Determine market timezone (IST for Indian equities, EST for US equities, UTC for crypto)
    const isUS = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'TSLA', 'META', 'SPY', 'QQQ'].includes(symbol) || (currency === 'USD' && !symbol.includes('-USD'));
    const marketTz = isINR ? 'Asia/Kolkata' : isUS ? 'America/New_York' : 'UTC';
    const marketTzLabel = isINR ? 'IST' : isUS ? 'EST' : 'UTC';

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
        fontFamily: "'JetBrains Mono', 'Inter', monospace",
        fontSize: 12,
      },
      localization: {
        locale: isINR ? 'en-IN' : 'en-US',
        dateFormat: 'dd MMM yyyy',
        timeFormatter: (time: any) => {
          try {
            const numTime = typeof time === 'number' ? time : Number(time);
            if (isNaN(numTime)) return String(time);
            const dt = new Date(numTime * 1000);
            return (
              new Intl.DateTimeFormat('en-IN', {
                timeZone: marketTz,
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }).format(dt) + ` ${marketTzLabel}`
            );
          } catch (e) {
            return String(time);
          }
        },
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)' },
      },
      crosshair: {
        vertLine: { color: '#6366f1', width: 1, style: LineStyle.Dotted },
        horzLine: { color: '#6366f1', width: 1, style: LineStyle.Dotted },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        scaleMargins: {
          top: 0.14,
          bottom: 0.22,
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: number, tickMarkType: number) => {
          try {
            const dt = new Date(time * 1000);
            if (tickMarkType === 0) {
              return new Intl.DateTimeFormat('en-IN', { timeZone: marketTz, year: 'numeric' }).format(dt);
            } else if (tickMarkType === 1) {
              return new Intl.DateTimeFormat('en-IN', { timeZone: marketTz, month: 'short' }).format(dt);
            } else if (tickMarkType === 2) {
              return new Intl.DateTimeFormat('en-IN', { timeZone: marketTz, day: 'numeric', month: 'short' }).format(dt);
            } else {
              return new Intl.DateTimeFormat('en-IN', { timeZone: marketTz, hour: '2-digit', minute: '2-digit', hour12: false }).format(dt);
            }
          } catch (e) {
            return '';
          }
        },
      },
    });

    // Add main candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981',
      downColor: '#f43f5e',
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#f43f5e',
    });

    // Add VWAP line series
    const vwapSeries = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      priceLineVisible: false,
      title: 'VWAP',
    });

    // Add volume histogram series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    vwapSeriesRef.current = vwapSeries;

    // Handle responsive container resize with ResizeObserver
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      if (chartRef.current && width > 0) {
        chartRef.current.applyOptions({
          width: Math.floor(width),
          height: height > 0 ? Math.floor(height) : 430,
        });
      }
    });

    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      vwapSeriesRef.current = null;
      priceLinesRef.current = [];
    };
  }, []);

  // Sync candle data, alerts, and predictive price lines
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !vwapSeriesRef.current || !chartRef.current) return;
    if (!candles || candles.length === 0) {
      candleSeriesRef.current.setData([]);
      volumeSeriesRef.current.setData([]);
      vwapSeriesRef.current.setData([]);
      return;
    }

    try {
      const parsedCandles = candles
        .map((c) => {
          let t: number;
          if (typeof c.time === 'number' && !isNaN(c.time) && c.time > 0) {
            t = c.time;
          } else {
            const parsed = new Date(c.timestamp).getTime();
            t = Math.floor(parsed / 1000);
          }

          return {
            time: t as any,
            open: Number(c.open),
            high: Number(c.high),
            low: Number(c.low),
            close: Number(c.close),
            volume: Number(c.volume || 0),
            vwap: c.vwap !== undefined && c.vwap !== null ? Number(c.vwap) : undefined,
          };
        })
        .filter((c) => typeof c.time === 'number' && !isNaN(c.time) && c.time > 0 && !isNaN(c.close))
        .sort((a, b) => a.time - b.time);

      // Strict deduplication: each timestamp must be strictly greater than preceding
      const formattedCandles: { time: any; open: number; high: number; low: number; close: number }[] = [];
      const formattedVolumes: { time: any; value: number; color: string }[] = [];
      const formattedVwap: { time: any; value: number }[] = [];

      let lastTime = -1;
      for (const c of parsedCandles) {
        if (c.time <= lastTime) continue; // skip duplicates or non-ascending bars
        lastTime = c.time;

        formattedCandles.push({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        });

        formattedVolumes.push({
          time: c.time,
          value: c.volume,
          color: c.close >= c.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)',
        });

        if (c.vwap !== undefined && !isNaN(c.vwap)) {
          formattedVwap.push({
            time: c.time,
            value: c.vwap,
          });
        }
      }

      candleSeriesRef.current.setData(formattedCandles);
      volumeSeriesRef.current.setData(formattedVolumes);
      if (formattedVwap.length > 0) {
        vwapSeriesRef.current.setData(formattedVwap);
      } else {
        vwapSeriesRef.current.setData([]);
      }

      // Add alert markers if provided
      if (alerts.length > 0 && formattedCandles.length > 0) {
        const minTime = formattedCandles[0].time;
        const maxTime = formattedCandles[formattedCandles.length - 1].time;

        const markers = alerts
          .map((a) => {
            let t: number;
            if (typeof a.time === 'number' && !isNaN(a.time) && a.time > 0) {
              t = a.time;
            } else {
              t = Math.floor(new Date(a.timestamp).getTime() / 1000);
            }
            const isUp =
              a.trend_state?.toLowerCase().includes('up') ||
              a.trend_state?.toLowerCase().includes('breakout') ||
              a.trend_state?.toLowerCase().includes('bull');

            return {
              time: t as any,
              position: isUp ? ('belowBar' as const) : ('aboveBar' as const),
              color: isUp ? '#10b981' : '#f43f5e',
              shape: isUp ? ('arrowUp' as const) : ('arrowDown' as const),
              text: `${a.trend_state} (S${a.severity})`,
            };
          })
          .filter((m) => typeof m.time === 'number' && !isNaN(m.time) && m.time >= minTime && m.time <= maxTime)
          .sort((a, b) => a.time - b.time);

        if (markers.length > 0) {
          createSeriesMarkers(candleSeriesRef.current, markers);
        }
      }

      // Add Predictive Target & Stop Lines on Chart
      if (priceLinesRef.current.length > 0) {
        priceLinesRef.current.forEach((line) => {
          try {
            candleSeriesRef.current?.removePriceLine(line);
          } catch (e) {
            // ignore
          }
        });
        priceLinesRef.current = [];
      }

      if (patternPrediction && patternPrediction.active_pattern && patternPrediction.active_pattern !== 'Accumulating Data') {
        const t1 = Number(patternPrediction.target_1);
        const t2 = Number(patternPrediction.target_2);
        const stop = Number(patternPrediction.invalidation_price);

        if (t1 > 0) {
          const l1 = candleSeriesRef.current.createPriceLine({
            price: t1,
            color: '#10b981',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `T1 ${currPrefix}${t1.toFixed(2)}`,
          });
          priceLinesRef.current.push(l1);
        }
        if (t2 > 0) {
          const l2 = candleSeriesRef.current.createPriceLine({
            price: t2,
            color: '#06b6d4',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `T2 ${currPrefix}${t2.toFixed(2)}`,
          });
          priceLinesRef.current.push(l2);
        }
        if (stop > 0) {
          const ls = candleSeriesRef.current.createPriceLine({
            price: stop,
            color: '#f43f5e',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `STOP ${currPrefix}${stop.toFixed(2)}`,
          });
          priceLinesRef.current.push(ls);
        }
      }

      // Only auto-fit chart when symbol changes to avoid jerky scrolling during live ticks
      if (previousSymbolRef.current !== symbol) {
        previousSymbolRef.current = symbol;
        chartRef.current.timeScale().fitContent();
      }
    } catch (e) {
      console.warn('Error rendering candles in chart:', e);
    }
  }, [candles, alerts, symbol, patternPrediction, currPrefix]);

  const latestCandle = candles.length > 0 ? candles[candles.length - 1] : null;
  const currentPriceDisplay = livePrice ?? (latestCandle ? latestCandle.close : 0);
  const bias = patternPrediction?.directional_bias;
  const biasColor = bias === 'BULLISH' ? '#10b981' : bias === 'BEARISH' ? '#f43f5e' : '#f59e0b';

  return (
    <div style={{ position: 'relative', width: '100%', height: '430px' }}>
      {/* Floating Predictive Pattern & Real-Time Tick HUD Overlay */}
      {patternPrediction && patternPrediction.active_pattern && patternPrediction.active_pattern !== 'Accumulating Data' && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '12px',
            right: '12px',
            zIndex: 5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '6px 12px',
            background: 'rgba(11, 15, 25, 0.85)',
            backdropFilter: 'blur(8px)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.75rem',
            pointerEvents: 'none',
          }}
        >
          {/* Pattern Name & Bias */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 700,
                color: '#818cf8',
                background: 'rgba(99, 102, 241, 0.15)',
                padding: '3px 8px',
                borderRadius: '5px',
                border: '1px solid rgba(99, 102, 241, 0.3)',
              }}
            >
              <Zap size={12} color="#818cf8" />
              {patternPrediction.active_pattern}
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 700,
                color: biasColor,
                background: `${biasColor}20`,
                padding: '3px 8px',
                borderRadius: '5px',
                border: `1px solid ${biasColor}40`,
              }}
            >
              {bias === 'BULLISH' ? <TrendingUp size={12} /> : bias === 'BEARISH' ? <TrendingDown size={12} /> : <Activity size={12} />}
              {bias} ({patternPrediction.win_probability_pct}% Win Prob)
            </span>
          </div>

          {/* Targets & Invalidation Stops */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: "'JetBrains Mono', monospace" }}>
            {patternPrediction.target_1 > 0 && (
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Target size={11} /> T1: {currPrefix}{Number(patternPrediction.target_1).toFixed(2)}
              </span>
            )}
            {patternPrediction.target_2 > 0 && (
              <span style={{ color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Target size={11} /> T2: {currPrefix}{Number(patternPrediction.target_2).toFixed(2)}
              </span>
            )}
            {patternPrediction.invalidation_price > 0 && (
              <span style={{ color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <ShieldAlert size={11} /> Stop: {currPrefix}{Number(patternPrediction.invalidation_price).toFixed(2)}
              </span>
            )}
            {patternPrediction.risk_reward_ratio && (
              <span style={{ color: 'var(--text-muted)' }}>
                RRR: 1:{patternPrediction.risk_reward_ratio}
              </span>
            )}

            {/* Live Fluctuation Heartbeat */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 7px',
                borderRadius: '4px',
                background: tickFlash === 'up' ? 'rgba(16, 185, 129, 0.25)' : tickFlash === 'down' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                color: tickFlash === 'up' ? '#10b981' : tickFlash === 'down' ? '#f43f5e' : '#e2e8f0',
                transition: 'background 0.3s ease, color 0.3s ease',
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: tickFlash === 'up' ? '#10b981' : tickFlash === 'down' ? '#f43f5e' : '#6366f1',
                  boxShadow: tickFlash ? `0 0 8px ${tickFlash === 'up' ? '#10b981' : '#f43f5e'}` : 'none',
                }}
              />
              {currPrefix}{Number(currentPriceDisplay).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <div
        ref={chartContainerRef}
        style={{ width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden' }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(11, 15, 25, 0.75)',
            backdropFilter: 'blur(3px)',
            color: '#fff',
            fontSize: '0.9rem',
            gap: '10px',
            zIndex: 10,
          }}
        >
          <div className="pulsing-dot" style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#6366f1' }} />
          <span>Loading market data for {symbol}...</span>
        </div>
      )}

      {/* Empty State Overlay */}
      {!isLoading && candles.length === 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.88rem',
            gap: '6px',
            background: 'rgba(11, 15, 25, 0.6)',
          }}
        >
          <span>No historical candle records returned for {symbol}.</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Select another timeframe or asset.</span>
        </div>
      )}
    </div>
  );
};
