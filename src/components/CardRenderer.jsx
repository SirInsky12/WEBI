import React, { useState, useEffect, useMemo } from 'react';

/**
 * Card Renderer Components
 * Renders preview versions of dashboard cards
 */

// Base card wrapper styling
const cardWrapper = {
  border: '1px solid #ddd',
  borderRadius: 8,
  background: '#fff'
};


/**
 * SolarCard - Animated solar energy flow diagram
 */
function SolarCard({ card, entities = {}, states = {} }) {
  const canvasRef = React.useRef(null);
  const { title, solar_entity, consumption_entity, grid_entity, theme = 'default' } = card.config || {};

  const resolve = (id) => {
    if (!id) return 0;
    const s = states && states[id];
    if (s === undefined) return (entities && entities[id] && entities[id].state) || 0;
    return typeof s === 'object' ? s.state || 0 : s || 0;
  };

  const solar = Number(resolve(solar_entity)) || 0;
  const house = Number(resolve(consumption_entity)) || 0;
  const grid = Number(resolve(grid_entity)) || 0;

  const getUnit = (id) => {
    if (!id) return '';
    // Prefer attributes on entities, fallback to states entry attributes
    const e = entities && entities[id];
    if (e && e.attributes && e.attributes.unit_of_measurement) return e.attributes.unit_of_measurement;
    const s = states && states[id];
    if (s && s.attributes && s.attributes.unit_of_measurement) return s.attributes.unit_of_measurement;
    return 'W';
  };

  const unitSolar = getUnit(solar_entity);
  const unitHouse = getUnit(consumption_entity);
  const unitGrid = getUnit(grid_entity);

  const themeColors = {
    default: { bg: '#ffffff', surface: '#fbfbfb', text: '#222' },
    light: { bg: '#f7fafc', surface: '#fff', text: '#111' },
    dark: { bg: '#101214', surface: '#1b1d1f', text: '#eaeaea' }
  };
  const colors = themeColors[theme] || themeColors.default;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let dpr = window.devicePixelRatio || 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(300, Math.floor(rect.width * dpr));
      canvas.height = Math.max(180, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    let last = performance.now();

    const fmt = (v, unit = 'W') => {
      if (!unit) return String(Math.round(v));
      const u = String(unit).toLowerCase();
      if (u.includes('w')) {
        return Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)} kW` : `${Math.round(v)} W`;
      }
      return `${Math.round(v)} ${unit}`;
    };

    const roundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const render = (now) => {
      const t = now || performance.now();
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const phase = (t / 1000) % 1;

      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, W, H);

      const pad = 18;
      const boxW = Math.min(180, Math.max(120, W * 0.22));
      const boxH = 72;
      const solarX = pad + boxW / 2;
      const solarY = pad + boxH / 2;
      const gridX = W - pad - boxW / 2;
      const gridY = pad + boxH / 2;
      const houseX = W / 2;
      const houseY = H - pad - boxH / 2;

      // boxes
      const drawBox = (cx, cy, titleText, val, bg) => {
        const x = cx - boxW / 2;
        const y = cy - boxH / 2;
        ctx.fillStyle = 'rgba(0,0,0,0.06)';
        roundRect(x + 2, y + 6, boxW, boxH, 8);
        ctx.fill();

        ctx.fillStyle = bg;
        roundRect(x, y, boxW, boxH, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        roundRect(x, y, boxW, boxH, 8);
        ctx.stroke();

        ctx.fillStyle = colors.text;
        ctx.font = '600 13px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(titleText, cx, y + 16);

        ctx.font = '700 18px Arial';
        // choose unit based on which box we're drawing
        let boxUnit = 'W';
        if (titleText.includes('Solar')) boxUnit = unitSolar;
        else if (titleText.includes('Haus')) boxUnit = unitHouse;
        else if (titleText.includes('Netz')) boxUnit = unitGrid;
        ctx.fillText(fmt(val, boxUnit), cx, y + 42);
      };

      drawBox(solarX, solarY, '☀️ Solar', solar, '#fff9e6');
      drawBox(houseX, houseY, '🏠 Haus', house, '#eef6ff');
      drawBox(gridX, gridY, '🔌 Netz', Math.abs(grid), grid >= 0 ? '#eef9ee' : '#fff3f3');

      const drawFlow = (x1, y1, x2, y2, value, color) => {
        if (!value || value <= 0) return;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const ang = Math.atan2(dy, dx);
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.min(12, Math.max(2, value / 200));
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // arrow
        const head = 8;
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - head * Math.cos(ang - 0.4), y2 - head * Math.sin(ang - 0.4));
        ctx.lineTo(x2 - head * Math.cos(ang + 0.4), y2 - head * Math.sin(ang + 0.4));
        ctx.closePath();
        ctx.fill();

        // particles
        const count = Math.min(6, Math.ceil(value / 200));
        for (let i = 0; i < count; i++) {
          const p = (phase + i / count) % 1;
          const px = x1 + dx * p;
          const py = y1 + dy * p;
          ctx.beginPath();
          ctx.fillStyle = color.replace('1)', '0.95)');
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      // flows
      if (solar > 0) {
        const toHouse = Math.min(solar, house);
        drawFlow(solarX, solarY + 28, houseX, houseY - 28, toHouse, '#4caf50');
        if (solar > house) drawFlow(solarX + 28, solarY + 10, gridX - 28, gridY + 10, solar - house, '#ffb300');
      }
      if (house > solar) drawFlow(gridX - 28, gridY + 10, houseX, houseY - 28, house - solar, '#f44336');

      // footer
      ctx.fillStyle = colors.text;
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Solar ${fmt(solar, unitSolar)} • Haus ${fmt(house, unitHouse)} • Netz ${fmt(grid, unitGrid)}`, 12, H - 10);

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [solar_entity, consumption_entity, grid_entity, solar, house, grid, theme]);

  return (
    <>
      {title && <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: colors.text }}>{title}</div>}
      <div style={{ width: '100%', height: 260 }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', borderRadius: 8, display: 'block' }} />
      </div>
    </>
  );
}

/**
 * GreenEnergyCard - Full page overview matching the EnergyPack dashboard design
 */
function GreenEnergyCard({ card, entities = {}, states = {} }) {
  const { 
    title, 
    production_entity, 
    consumption_entity, 
    battery_entity, 
    grid_entity, 
    hero_image = '', 
    warning_entity = null,
    theme = 'light' 
  } = card.config || {};

  const resolve = (id) => {
    if (!id) return null;
    const s = states && states[id];
    if (s === undefined) return (entities && entities[id] && entities[id].state) || null;
    return typeof s === 'object' ? s.state : s;
  };

  const getUnit = (id) => {
    if (!id) return '';
    const ent = entities && entities[id];
    return ent?.attributes?.unit_of_measurement || '';
  };

  // Extract values
  const production = resolve(production_entity) || 0;
  const consumption = resolve(consumption_entity) || 0;
  const battery = resolve(battery_entity) || 0;
  const grid = resolve(grid_entity) || 0;
  const warningState = resolve(warning_entity);
  const warningEntityObj = warning_entity ? (entities && entities[warning_entity]) : null;
  const warningLabel = warningEntityObj?.attributes?.friendly_name || warning_entity;
  const isWarning = (() => {
    if (warningState === true) return true;
    if (typeof warningState === 'number' && warningState > 0) return true;
    if (typeof warningState === 'string' && /warn|alert|error|alarm/i.test(warningState)) return true;
    return false;
  })();
  
  const productionUnit = getUnit(production_entity);
  const consumptionUnit = getUnit(consumption_entity);

  // Store historical data for charts
  React.useEffect(() => {
    if (!production_entity && !consumption_entity) return;
    
    const now = new Date();
    const timestamp = now.getTime();
    const storageKey = `green-energy-history-${card.id}`;
    
    // Get existing history
    let history = [];
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        history = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load history:', e);
    }
    
    // Add new data point
    history.push({
      timestamp,
      production: Number(production) || 0,
      consumption: Number(consumption) || 0,
      battery: Number(battery) || 0,
      grid: Number(grid) || 0
    });
    
    // Keep only last 30 days of data (at 5 min intervals = ~8640 points)
    const maxPoints = 8640;
    if (history.length > maxPoints) {
      history = history.slice(history.length - maxPoints);
    }
    
    // Save to localStorage
    try {
      localStorage.setItem(storageKey, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save history:', e);
    }
  }, [production, consumption, battery, grid, production_entity, consumption_entity, card.id]);

  // Calculate today's statistics
  const todayStats = useMemo(() => {
    const storageKey = `green-energy-history-${card.id}`;
    let history = [];
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        history = JSON.parse(stored);
      }
    } catch (e) {
      return { totalProduction: 0, totalConsumption: 0, peakProduction: 0, avgBattery: 0, dataPoints: 0, todayData: [] };
    }
    
    // Filter for today's data
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTimestamp = todayStart.getTime();
    
    const todayData = history.filter(d => d.timestamp >= todayTimestamp);
    
    if (todayData.length === 0) {
      return { totalProduction: 0, totalConsumption: 0, peakProduction: 0, avgBattery: 0, dataPoints: 0, todayData: [] };
    }
    
    const totalProduction = todayData.reduce((sum, d) => sum + (d.production || 0), 0) / todayData.length;
    const totalConsumption = todayData.reduce((sum, d) => sum + (d.consumption || 0), 0) / todayData.length;
    const peakProduction = Math.max(...todayData.map(d => d.production || 0));
    const avgBattery = todayData.reduce((sum, d) => sum + (d.battery || 0), 0) / todayData.length;
    
    return {
      totalProduction: totalProduction.toFixed(2),
      totalConsumption: totalConsumption.toFixed(2),
      peakProduction: peakProduction.toFixed(2),
      avgBattery: avgBattery.toFixed(1),
      dataPoints: todayData.length,
      todayData: todayData
    };
  }, [card.id, production, consumption, battery, grid]);
  
  // Generate chart points from today's data
  const chartPoints = useMemo(() => {
    const { todayData } = todayStats;
    
    if (todayData.length === 0) {
      // Return default dummy data if no data available
      return {
        production: "40,120 120,100 200,60 280,50 360,80 440,100 520,60 600,90 680,60 760,80 840,100 920,80",
        consumption: "40,150 120,140 200,120 280,130 360,110 440,100 520,120 600,100 680,130 760,120 840,110 920,120"
      };
    }
    
    const chartWidth = 880; // 920 - 40 (left margin)
    const chartHeight = 200;
    const maxValue = Math.max(
      ...todayData.map(d => Math.max(d.production || 0, d.consumption || 0)),
      10 // minimum scale in kW
    );
    
    // Use timestamps relative to local start-of-day to calculate exact X positions.
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfDayTs = startOfDay.getTime();

    // Ensure data is sorted by timestamp
    const sortedData = todayData.slice().sort((a, b) => a.timestamp - b.timestamp);

    // Filter out future timestamps (in case of clock skew) and map to points
    const validData = sortedData.filter(d => d.timestamp <= now && d.timestamp >= startOfDayTs);

    // Use current time as the chart end so the latest point appears near the right edge.
    const hoursSinceStartNow = (now - startOfDayTs) / (800 * 60 * 60);
    const denom = Math.max(hoursSinceStartNow, 1); // avoid division by zero early in day

    const productionPoints = validData.map(d => {
      const hoursSinceStart = (d.timestamp - startOfDayTs) / (1000 * 60 * 60); // fractional hours
      const x = 40 + (hoursSinceStart / denom) * chartWidth;
      const y = chartHeight - ((d.production || 0) / maxValue) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    const consumptionPoints = validData.map(d => {
      const hoursSinceStart = (d.timestamp - startOfDayTs) / (1000 * 60 * 60);
      const x = 40 + (hoursSinceStart / denom) * chartWidth;
      const y = chartHeight - ((d.consumption || 0) / maxValue) * chartHeight;
      return `${x},${y}`;
    }).join(' ');
    
    console.log('Production points:', productionPoints);
    console.log('Consumption points:', consumptionPoints);
    console.log('Sample data:', todayData.slice(0, 3));
    
    return {
      production: productionPoints,
      consumption: consumptionPoints
    };
  }, [todayStats]);

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh', 
      padding: 0, 
      margin: 0,
      boxSizing: 'border-box', 
      background: '#e8eef5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Main container */}
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 0, minHeight: '100vh' }}>
        
        {/* Left Sidebar */}
        <div style={{ 
          background: '#fff', 
          padding: '24px 20px',
          boxShadow: '2px 0 12px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}>
          {/* Logo & Title */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                borderRadius: 6,
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 2,
                padding: 6
              }}>
                <div style={{ background: '#fff', borderRadius: 2 }}></div>
                <div style={{ background: '#fff', borderRadius: 2 }}></div>
                <div style={{ background: '#fff', borderRadius: 2 }}></div>
                <div style={{ background: '#fff', borderRadius: 2 }}></div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{title || 'EnergyPack'}</div>
            </div>
            <div style={{ fontSize: 14, color: '#6b7280', marginLeft: 50 }}>Performance Monitoring</div>
          </div>

          {/* Fi-Housing Panel Status */}
          <div style={{ 
            background: '#f9fafb', 
            padding: 12, 
            borderRadius: 8,
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>Fi-Housing Panel</div>
              <div style={{ 
                fontSize: 12, 
                color: '#16a34a', 
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }}></div>
                Active
              </div>
            </div>
          </div>

          {/* Total Charging Card */}
          <div style={{ 
            background: '#ffffff',
            padding: 16,
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: 18, color: '#777777', marginBottom: 8 }}>SOLAR</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{production || 91.87}</div>
            <div style={{ fontSize: 11, color: '#10b981', fontWeight: 500 }}>{productionUnit || 'kWh'}
            </div>
            
            {/* Solar panel image placeholder */}
            <div style={{ 
              marginTop: 12,
              marginBottom: 12,
              height: 140,
              background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: 120, 
                height: 80,
                background: '#1e40af',
                borderRadius: 4,
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gridTemplateRows: 'repeat(3, 1fr)',
                gap: 2,
                padding: 4,
                transform: 'perspective(200px) rotateX(5deg)'
              }}>
                {[...Array(12)].map((_, i) => (
                  <div key={i} style={{ background: '#3b82f6', borderRadius: 1 }}></div>
                ))}
              </div>
            </div>

            {/* Power Usage */}
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Power Usage</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{consumption || 91.87} {consumptionUnit || 'W'}</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>Today consumption</div>

            {/* Stats Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: 8,
              marginTop: 16,
              paddingTop: 16,
              borderTop: '1px solid #e5e7eb'
            }}>
              <div>
                <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>● Production</div>
                <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 700 }}>{production || 0} <span style={{ fontSize: 11, color: '#6b7280' }}>{productionUnit || 'kWh'}</span></div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4 }}>● Battery</div>
                <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 700 }}>{battery || 0} <span style={{ fontSize: 11, color: '#6b7280' }}>%</span></div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#ff0505', marginBottom: 4 }}>● Grid</div>
                <div style={{ fontSize: 14, color: '#6b7280', fontWeight: 700 }}>{grid || 0} <span style={{ fontSize: 11, color: '#6b7280' }}>W</span></div>
              </div>
            </div>
          </div>

          {/* Net Energy Balance */}
          <div style={{ 
            background: '#ffffff',
            padding: 20,
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <div style={{ fontSize: 30, fontWeight: 600, color: '#111827', marginBottom: 24 }}>Net Energy Balance</div>
            
            {/* Circular chart with external labels */}
            <div style={{ position: 'relative', height: 280, marginBottom: 20 }}>
              {/* Top left label - Produced */}
              <div style={{ position: 'absolute', top: 20, left: 0, textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#60a5fa' }}></div>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{production || 0}</span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>kWh</span>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginLeft: 14 }}>Produced</div>
              </div>
              
              {/* Right label - Consumed */}
              <div style={{ position: 'absolute', top: '50%', right: 0, transform: 'translateY(-50%)', textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, justifyContent: 'flex-end' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }}></div>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{consumption || 0}</span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>kWh</span>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginRight: 19 }}>Consumed</div>
              </div>
              
              {/* Bottom left label - Estimate */}
              <div style={{ position: 'absolute', bottom: 20, left: 0, textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6' }}></div>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{battery || 0}</span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>kWh</span>
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginLeft: 14 }}>Estimate</div>
              </div>
              
              {/* Center donut chart */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Background circle */}
                  <circle cx="100" cy="100" r="75" fill="none" stroke="#e5e7eb" strokeWidth="20"/>
                  {/* Produced segment (blue) - calculated based on value */}
                  <circle cx="100" cy="100" r="75" fill="none" stroke="#60a5fa" strokeWidth="20" 
                    strokeDasharray={`${(Number(production || 0) / 20) * 471} 471`} strokeLinecap="round"/>
                  {/* Consumed segment (green) */}
                  <circle cx="100" cy="100" r="75" fill="none" stroke="#22c55e" strokeWidth="20" 
                    strokeDasharray={`${(Number(consumption || 0) / 20) * 471} 471`} 
                    strokeDashoffset={`-${(Number(production || 0) / 20) * 471}`} strokeLinecap="round"/>
                  {/* Estimate segment (purple) */}
                  <circle cx="100" cy="100" r="75" fill="none" stroke="#8b5cf6" strokeWidth="20" 
                    strokeDasharray={`${(Number(battery || 0) / 20) * 471} 471`} 
                    strokeDashoffset={`-${((Number(production || 0) + Number(consumption || 0)) / 20) * 471}`} strokeLinecap="round"/>
                  {/* Inner dashed circle */}
                  <circle cx="100" cy="100" r="60" fill="none" stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 4"/>
                </svg>
                {/* Center text */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{Math.abs(Number(production || 0) - Number(consumption || 0)).toFixed(1)}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>kWh</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>The difference</div>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>between</div>
                </div>
              </div>
            </div>

            {/* More details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>More details</div>
              <div style={{ fontSize: 16, color: '#9ca3af', cursor: 'pointer' }}>...</div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: '#9ca3af', cursor: 'pointer' }}></div>
        </div>

        {/* Right Main Content */}
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Hero Image */}
          <div style={{ 
              width: 1180,
              height: 280,
              borderRadius: 16,
              overflow: 'hidden',
              background: hero_image ? `url(${hero_image})` : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #0ea5e9 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              {/* Warning marquee */}
              {warning_entity && isWarning && (
                <div style={{
                  position: 'absolute',
                  top: 8,
                  left: 0,
                  right: 0,
                  height: 28,
                  overflow: 'hidden',
                  pointerEvents: 'none'
                }}>
                  <div style={{
                    display: 'inline-block',
                    whiteSpace: 'nowrap',
                    paddingLeft: '100%',
                    animation: 'marquee 12s linear infinite',
                    background: 'linear-gradient(90deg, rgba(249,115,22,0.95), rgba(251,191,36,0.95))',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    lineHeight: '28px'
                  }}>
                    {warningLabel}: {String(warningState)}
                  </div>
                  <style>{`@keyframes marquee { from { transform: translateX(0%); } to { transform: translateX(-100%);} }`}</style>
                </div>
              )}
              {!hero_image && (
                <div style={{ 
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  background: 'rgba(255,255,255,0.9)',
                  padding: '8px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600
                }}>
                  <div style={{ color: '#f59e0b' }}>28°C</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>Today's sunny</div>
                </div>
              )}
              <div style={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                right: 16,
                display: 'flex',
                gap: 12
              }}>
                <div style={{
                  background: 'rgba(255,255,255,0.9)',
                  padding: '10px 14px',
                  borderRadius: 10,
                  flex: 1
                }}>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>Daily Weather</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>☀️ 5.4 m/M</div>
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.9)',
                  padding: '10px 14px',
                  borderRadius: 10,
                  flex: 1
                }}>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>Weekly</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>⛅ 5.4 m/M</div>
                </div>
              </div>
            </div>

          {/* Energy Production Chart */}
          <div style={{ 
            background: '#fff',
            padding: 20,
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 30, color: '#6b7280' }}>Energy Production</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>{production || 300} {productionUnit || 'kWh'}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>Live data</div>
              </div>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 3, background: '#22c55e', borderRadius: 2 }}></div>
                  <span style={{ fontSize: 20, color: '#6b7280' }}>Energy Produced: <span style={{ fontWeight: 600, color: '#22c55e' }}>{production || 0} {productionUnit || 'kWh'}</span></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 3, background: '#60a5fa', borderRadius: 2 }}></div>
                  <span style={{ fontSize: 20, color: '#6b7280' }}>Energy Consumption: <span style={{ fontWeight: 600, color: '#60a5fa' }}>{consumption || 0} {consumptionUnit || 'kWh'}</span></span>
                </div>
                <select style={{ 
                  padding: '6px 12px', 
                  borderRadius: 6,
                  border: '1px solid #e5e7eb',
                  fontSize: 12,
                  color: '#ffffff'
                }}>
                  <option>Monthly</option>
                </select>
              </div>
            </div>
            
            {/* Chart area */}
            <div style={{ height: 240, background: '#fafbfc', borderRadius: 8, padding: 16, paddingBottom: 30, position: 'relative' }}>
              <svg viewBox="0 0 1100 240" width="100%" height="100%" style={{ overflow: 'visible' }}>
                {/* Grid lines */}
                {[0, 2, 4, 6, 8, 10].map((y, i) => (
                  <line key={`grid-${i}`} x1="40" y1={200 - y * 20} x2="1090" y2={200 - y * 20} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />
                ))}
                
                {/* Y-axis labels */}
                {[0, 2, 4, 6, 8, 10].map((y, i) => (
                  <text key={`ylabel-${i}`} x="5" y={205 - y * 20} fontSize="10" fill="#9ca3af">{y}</text>
                ))}
                
                {/* Production line (green) */}
                <polyline
                  points={chartPoints.production}
                  fill="none"
                  stroke="#62b800"
                  strokeWidth="2.5"
                />
                {/* Consumption line (blue) */}
                <polyline
                  points={chartPoints.consumption}
                  fill="none"
                  stroke="#a7ccfa"
                  strokeWidth="0.5"
                />
                
                {/* X-axis labels (hours) */}
                {['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'].map((hour, i) => {
                  const chartWidth = 1050;
                  const samplesCount = 12;
                  const x = 40 + (i * (chartWidth / (samplesCount - 1)));
                  return <text key={`hour-${i}`} x={x} y="220" fontSize="10" fill="#6b7280" textAnchor="middle">{hour}</text>;
                })}
              </svg>
            </div>
          </div>

          {/* Bottom Grid - Energy Production & Home Consumption */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            
            {/* Energy Production Details */}
            <div style={{ 
              background: '#fff',
              padding: 18,
              borderRadius: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
              <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 12, color: '#6b7280' }}>Energy Production</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, color: '#6b7280' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Standars Tariffes</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: '#465e8f', borderRadius: 3, width: 100, position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '82%', background: '#22c55e', borderRadius: 3 }}></div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>18.3 kWh</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Meter Energy</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, width: 100, position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '65%', background: '#22c55e', borderRadius: 3 }}></div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>1.29 USD</span>
                  </div>
                </div>
              </div>
              
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #6e6e6e' }}>
                <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 10, color: '#6b7280' }}>Battery Status</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: '#3f5a8f' }}>Load</span>
                  <span style={{ fontWeight: 600 }}>28%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#6b7280' }}>Charge</span>
                  <span style={{ fontWeight: 600 }}>100%</span>
                </div>
              </div>
            </div>

            {/* Home Energy Consumption */}
            <div style={{ 
              background: '#fff',
              padding: 18,
              borderRadius: 12,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
            }}>
              <div style={{ fontSize: 24, fontWeight: 600, marginBottom: 12, color: '#6b7280' }}>Home Energy Consumption (Today)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Avg Production: {todayStats.totalProduction}{productionUnit || 'kWh'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, width: 80, position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min((todayStats.totalProduction / (todayStats.peakProduction || 1)) * 100, 100)}%`, background: '#22c55e', borderRadius: 3 }}></div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{Math.round((todayStats.totalProduction / (todayStats.peakProduction || 1)) * 100)}%</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Avg Consumption: {todayStats.totalConsumption}{consumptionUnit || 'kWh'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, width: 80, position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min((todayStats.totalConsumption / Math.max(todayStats.totalProduction, todayStats.totalConsumption, 1)) * 100, 100)}%`, background: '#60a5fa', borderRadius: 3 }}></div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{Math.round((todayStats.totalConsumption / Math.max(todayStats.totalProduction, todayStats.totalConsumption, 1)) * 100)}%</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Peak Production: {todayStats.peakProduction}{productionUnit || 'kWh'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, width: 80, position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', background: '#f59e0b', borderRadius: 3 }}></div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>100%</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Avg Battery: {todayStats.avgBattery}%</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, width: 80, position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${todayStats.avgBattery}%`, background: '#8b5cf6', borderRadius: 3 }}></div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{Math.round(todayStats.avgBattery)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * BatteryCard - shows battery percentage and charging/discharging values
 * Professional design with modern styling, animations, and visual hierarchy
 */
function BatteryCard({ card, entities = {}, states = {} }) {
  const { title, state_entity, charging_entity, discharging_entity, show_percentage = true, theme = 'default' } = card.config || {};

  const resolveValue = (id) => {
    if (!id) return null;
    const s = states && states[id];
    if (s === undefined) {
      const e = entities && entities[id];
      if (e && (typeof e.state !== 'undefined')) return e.state;
      return null;
    }
    return (typeof s === 'object' ? s.state : s);
  };

  const level = resolveValue(state_entity) ?? 0;
  let charging = resolveValue(charging_entity);
  let discharging = resolveValue(discharging_entity);

  const powerVal = resolveValue(card.config?.power_entity);
  if (powerVal !== null && powerVal !== undefined) {
    const num = Number(powerVal) || 0;
    if (num >= 0) {
      charging = num;
      discharging = 0;
    } else {
      charging = 0;
      discharging = Math.abs(num);
    }
  }

  charging = charging ?? 0;
  discharging = discharging ?? 0;

  const pct = Number(level);
  const fillPct = Math.max(0, Math.min(100, isNaN(pct) ? 0 : pct));

  // Determine status and colors based on battery level
  let statusColor, statusBg, statusText;
  if (fillPct > 75) {
    statusColor = '#10b981';
    statusBg = '#ecfdf5';
    statusText = 'Healthy';
  } else if (fillPct > 40) {
    statusColor = '#f59e0b';
    statusBg = '#fffbeb';
    statusText = 'Good';
  } else if (fillPct > 20) {
    statusColor = '#ef4444';
    statusBg = '#fef2f2';
    statusText = 'Low';
  } else {
    statusColor = '#dc2626';
    statusBg = '#fee2e2';
    statusText = 'Critical';
  }

  React.useEffect(() => {
    console.log('BatteryCard update:', { state_entity, level, charging, discharging });
  }, [state_entity, charging_entity, discharging_entity, level, charging, discharging]);

  return (
    <div style={{ 
      padding: '20px', 
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafb 100%)',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      {title && (
        <div style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          marginBottom: '20px', 
          color: '#1f2937',
          letterSpacing: '-0.3px'
        }}>
          🔋 {title}
        </div>
      )}

      {/* Main Battery Display */}
      <div style={{ 
        display: 'flex', 
        gap: '24px', 
        alignItems: 'flex-start',
        marginBottom: '20px'
      }}>
        {/* Battery Visual */}
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '56px',
            height: '110px',
            borderRadius: '8px',
            border: '3px solid #d1d5db',
            position: 'relative',
            overflow: 'hidden',
            background: '#f9fafb',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            {/* Fill */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${fillPct}%`,
              background: `linear-gradient(180deg, ${statusColor} 0%, ${statusColor}dd 100%)`,
              transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: `inset -2px 0 4px rgba(255, 255, 255, 0.3)`
            }} />
            {/* Terminal */}
            <div style={{
              position: 'absolute',
              right: '-6px',
              top: '20%',
              width: '10px',
              height: '25%',
              background: '#d1d5db',
              borderRadius: '0 3px 3px 0',
              border: '1px solid #9ca3af'
            }} />
            {/* Percentage Text */}
            {show_percentage && (
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: '700',
                color: fillPct > 50 ? '#fff' : '#374151',
                textShadow: fillPct > 50 ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'
              }}>
                {fillPct}%
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div style={{
            padding: '6px 12px',
            borderRadius: '20px',
            background: statusBg,
            border: `1px solid ${statusColor}33`,
            fontSize: '12px',
            fontWeight: '600',
            color: statusColor,
            textAlign: 'center',
            minWidth: '80px'
          }}>
            {statusText}
          </div>
        </div>

        {/* Stats Panel */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Charging */}
          <div style={{
            padding: '12px',
            background: '#ecfdf5',
            borderRadius: '8px',
            border: '1px solid #d1fae5',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              fontSize: '18px',
              width: '28px',
              textAlign: 'center'
            }}>⚡</div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '11px',
                color: '#059669',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Charging</div>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#10b981',
                marginTop: '2px'
              }}>
                {charging !== null && charging !== undefined ? (
                  <>{Math.round(charging)} W</>
                ) : '—'}
              </div>
            </div>
          </div>

          {/* Discharging */}
          <div style={{
            padding: '12px',
            background: '#fef2f2',
            borderRadius: '8px',
            border: '1px solid #fee2e2',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{
              fontSize: '18px',
              width: '28px',
              textAlign: 'center'
            }}>📤</div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '11px',
                color: '#dc2626',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>Discharging</div>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#ef4444',
                marginTop: '2px'
              }}>
                {discharging !== null && discharging !== undefined ? (
                  <>{Math.round(discharging)} W</>
                ) : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ButtonCard Preview
 */
function ButtonCard({ card, entities = {}, onClick = () => {} }) {
  const { title, icon, color = 'primary' } = card.config;

  const colorMap = {
    primary: { bg: '#0b5cff', text: 'white' },
    success: { bg: '#28a745', text: 'white' },
    warning: { bg: '#ffc107', text: '#333' },
    danger: { bg: '#dc3545', text: 'white' }
  };

  const colors = colorMap[color] || colorMap.primary;

  return (
    <div style={cardWrapper}>
      <button
        onClick={onClick}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: colors.bg,
          color: colors.text,
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.opacity = '0.8'}
        onMouseLeave={(e) => e.target.style.opacity = '1'}
      >
        {icon && <span style={{ fontSize: 16 }}>📌</span>}
        {title}
      </button>
    </div>
  );
}

/**
 * GaugeCard Preview - React Canvas Gauge with multiple types
 */
function GaugeCard({ card, entities = {}, states = {} }) {
  const canvasRef = React.useRef(null);
  const { title, entity: entityId, gauge_type = 'semicircle', min = 0, max = 100, severity = {}, unit = '' } = card.config;
  const entity = entities[entityId];
  const state = states[entityId];
  const rawValue = (typeof state === 'object' ? state?.state : state) || entity?.state || 0;
  const value = Math.max(min, Math.min(max, Number(rawValue) || 0));

  // Draw gauge using canvas
  React.useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2.2;
    const radius = 100;

    // Clear canvas
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);

    // Background circle
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Calculate percentage and angle
    const percentage = ((value - min) / (max - min)) * 100;
    
    // Determine thresholds
    const greenThreshold = severity.green || (max * 0.5);
    const yellowThreshold = severity.yellow || (max * 0.75);
    const redThreshold = severity.red || max;

    const greenAngle = (greenThreshold / max);
    const yellowAngle = (yellowThreshold / max);

    // Render based on gauge type
    if (gauge_type === 'semicircle') {
      const angle = percentage / 100; // 0 to 1 for semicircle
      
      // Draw gauge arcs
      const drawArc = (startAngle, endAngle, color) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.stroke();
      };

      // Green arc
      drawArc(Math.PI, Math.PI + greenAngle * Math.PI, '#4caf50');
      // Yellow arc
      if (yellowAngle > greenAngle) {
        drawArc(Math.PI + greenAngle * Math.PI, Math.PI + yellowAngle * Math.PI, '#ff9800');
      }
      // Red arc
      if (yellowAngle < 1) {
        drawArc(Math.PI + yellowAngle * Math.PI, Math.PI * 2, '#f44336');
      }

      // Draw ticks and labels
      for (let i = 0; i <= 10; i++) {
        const tickAngle = Math.PI + (i / 10) * Math.PI;
        const x1 = centerX + (radius - 5) * Math.cos(tickAngle);
        const y1 = centerY + (radius - 5) * Math.sin(tickAngle);
        const x2 = centerX + (radius + 2) * Math.cos(tickAngle);
        const y2 = centerY + (radius + 2) * Math.sin(tickAngle);

        ctx.strokeStyle = '#999';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Label
        const labelX = centerX + (radius + 15) * Math.cos(tickAngle);
        const labelY = centerY + (radius + 15) * Math.sin(tickAngle);
        ctx.fillStyle = '#666';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(i * 10, labelX, labelY);
      }

      // Draw needle
      const needleAngle = Math.PI + angle * Math.PI;
      const needleX = centerX + (radius - 10) * Math.cos(needleAngle);
      const needleY = centerY + (radius - 10) * Math.sin(needleAngle);

      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(needleX, needleY);
      ctx.stroke();

      // Center circle
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fill();

    } else if (gauge_type === 'circle') {
      // Full circle gauge
      const angle = (percentage / 100) * 2 * Math.PI;
      
      // Background circle arc
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 20;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.stroke();

      // Value arc
      const arcColor = percentage > 75 ? '#f44336' : percentage > 50 ? '#ff9800' : '#4caf50';
      ctx.strokeStyle = arcColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + angle);
      ctx.stroke();

    } else if (gauge_type === 'linear') {
      // Linear gauge
      const barWidth = 200;
      const barHeight = 20;
      const barX = centerX - barWidth / 2;
      const barY = centerY - 30;
      
      // Background bar
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      // Value bar
      const valueWidth = (percentage / 100) * barWidth;
      const barColor = percentage > 75 ? '#f44336' : percentage > 50 ? '#ff9800' : '#4caf50';
      ctx.fillStyle = barColor;
      ctx.fillRect(barX, barY, valueWidth, barHeight);
      
      // Border
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
      
      // Percentage text
      ctx.fillStyle = '#333';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${Math.round(percentage)}%`, centerX, barY + barHeight / 2);
    }

    // Value text
    ctx.fillStyle = '#333';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(value), centerX, centerY + 60);

    // Unit text
    ctx.fillStyle = '#999';
    ctx.font = '16px Arial';
    ctx.fillText(unit || entity?.attributes?.unit_of_measurement || '%', centerX, centerY + 90);
  }, [value, min, max, gauge_type, severity, unit, entity]);

  return (
    <>
      {title && (
        <div style={{ 
          fontSize: 14, 
          fontWeight: 600, 
          marginBottom: 16,
          color: '#333'
        }}>
          {title}
        </div>
      )}
      
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <canvas 
          ref={canvasRef} 
          width={320} 
          height={280}
          style={{ borderRadius: 12 }}
        />
      </div>
    </>
  );
}

/**
 * MarkdownCard Preview
 */
function MarkdownCard({ card }) {
  const { title, content = '' } = card.config;

  // Simple markdown to HTML (basic support)
  const renderMarkdown = (text) => {
    if (!text) return null;

    let html = text;
    // Headers
    html = html.replace(/^### (.*?)$/gm, '<h3 style="margin: 12px 0 6px 0; font-size: 14px; font-weight: 600;">$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2 style="margin: 16px 0 8px 0; font-size: 16px; font-weight: 600;">$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1 style="margin: 20px 0 10px 0; font-size: 18px; font-weight: 600;">$1</h1>');
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>');
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Lists
    html = html.replace(/^\- (.*?)$/gm, '<li style="margin-left: 16px;">$1</li>');
    html = html.replace(/(<li[^>]*>.*?<\/li>)/s, '<ul style="margin: 8px 0; padding: 0;">$1</ul>');
    // Line breaks
    html = html.replace(/\n\n/g, '</p><p style="margin: 8px 0;">');
    html = '<p style="margin: 8px 0;">' + html + '</p>';

    return html;
  };

  return (
    <div style={cardWrapper}>
      {title && (
        <div style={{ 
          fontSize: 12, 
          fontWeight: 600, 
          marginBottom: 8,
          paddingBottom: 8,
          borderBottom: '1px solid #eee'
        }}>
          {title}
        </div>
      )}
      
      <div style={{ fontSize: 12, lineHeight: 1.5 }}>
        {typeof content === 'string' ? (
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
        ) : (
          <pre style={{ background: '#f9f9f9', padding: 8, borderRadius: 4, overflow: 'auto' }}>
            {JSON.stringify(content, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

/**
 * VerticalStack Preview
 */
function VerticalStackCard({ card, entities = {}, states = {}, renderCard = () => {} }) {
  return (
    <div style={{ ...cardWrapper, padding: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {(card.config.cards || []).map((childCard, idx) => (
          <div key={idx} style={{ borderBottom: idx < (card.config.cards || []).length - 1 ? '1px solid #eee' : 'none' }}>
            {renderCard(childCard, { entities, states })}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * HorizontalStack Preview
 */
function HorizontalStackCard({ card, entities = {}, states = {}, renderCard = () => {} }) {
  return (
    <div style={{ ...cardWrapper, padding: 0 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {(card.config.cards || []).map((childCard, idx) => (
          <div key={idx} style={{ flex: 1 }}>
            {renderCard(childCard, { entities, states })}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * GridCard Preview
 */
function GridCard({ card, entities = {}, states = {}, renderCard = () => {} }) {
  const columns = card.config.columns || 2;
  return (
    <div style={{ ...cardWrapper, padding: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 8 }}>
        {(card.config.cards || []).map((childCard, idx) => (
          <div key={idx}>
            {renderCard(childCard, { entities, states })}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * EntityCard Preview - simple list of entities and their current state
 */
function EntityCard({ card, entities = {}, states = {} }) {
  const list = (card.config && card.config.entities) || [];

  return (
    <div style={cardWrapper}>
      {card.config?.title && <div style={{ fontSize: 14, fontWeight: 600, margin: 8 }}>{card.config.title}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8 }}>
        {list.length === 0 && <div style={{ color: '#666' }}>No entities configured</div>}
        {list.map((item, idx) => {
          const entityId = typeof item === 'string' ? item : (item && (item.entity_id || item.entity || item.id));
          const ent = entityId ? (entities && entities[entityId]) : null;
          const st = entityId ? (states && states[entityId]) : null;
          const rawValue = (typeof st === 'object' ? st?.state : st) ?? ent?.state ?? '—';
          const value = (rawValue === null || typeof rawValue === 'object') ? '—' : rawValue;
          const name = ent?.attributes?.friendly_name || (item && item.name) || entityId || '—';
          const unit = ent?.attributes?.unit_of_measurement || '';
          return (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: '#fff', borderRadius: 6, border: '1px solid #eee' }}>
              <div style={{ fontSize: 13 }}>{name}</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{String(value)}{unit ? ` ${unit}` : ''}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Main Card Renderer
 */
export function CardRenderer({ card, entities = {}, states = {}, onCardAction = () => {} }) {
  const renderCard = (cardItem, context) => {
    const { entities: ctxEntities = entities, states: ctxStates = states } = context || {};

    switch (cardItem.type) {
      case 'entities':
        return <EntityCard card={cardItem} entities={ctxEntities} states={ctxStates} />;
      
      case 'solar':
        return <SolarCard card={cardItem} entities={ctxEntities} states={ctxStates} />;

      case 'green-energy':
        return <GreenEnergyCard card={cardItem} entities={ctxEntities} states={ctxStates} />;

      case 'battery':
        return <BatteryCard card={cardItem} entities={ctxEntities} states={ctxStates} />;
      
      case 'button':
        return <ButtonCard card={cardItem} entities={ctxEntities} onClick={() => onCardAction(cardItem)} />;
      
      case 'gauge':
        return <GaugeCard card={cardItem} entities={ctxEntities} states={ctxStates} />;
      
      case 'markdown':
        return <MarkdownCard card={cardItem} />;
      
      case 'vertical-stack':
        return <VerticalStackCard card={cardItem} entities={ctxEntities} states={ctxStates} renderCard={renderCard} />;
      
      case 'horizontal-stack':
        return <HorizontalStackCard card={cardItem} entities={ctxEntities} states={ctxStates} renderCard={renderCard} />;
      
      case 'grid':
        return <GridCard card={cardItem} entities={ctxEntities} states={ctxStates} renderCard={renderCard} />;
      
      default:
        return (
          <div style={{ ...cardWrapper, background: '#fff3cd', color: '#856404' }}>
            Unknown card type: <strong>{cardItem.type}</strong>
          </div>
        );
    }
  };

  return renderCard(card);
}

/**
 * CardPreview - displays live preview of a card with live state updates
 */
export function CardPreview({ card, entities = {}, onCardAction = () => {} }) {
  const [states, setStates] = React.useState({});

  // Initialize states from entities
  React.useEffect(() => {
    const newStates = {};
    Object.entries(entities).forEach(([id, entity]) => {
      newStates[id] = { state: entity.state };
    });
    setStates(newStates);
  }, [entities]);

  return (
    <CardRenderer 
      card={card} 
      entities={entities} 
      states={states} 
      onCardAction={onCardAction}
    />
  );
}

export default CardRenderer;
