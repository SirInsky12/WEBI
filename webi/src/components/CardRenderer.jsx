import React from 'react';

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

    const fmt = (v) => (Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)} kW` : `${Math.round(v)} W`);

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
        ctx.fillText(fmt(val), cx, y + 42);
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
      ctx.fillText(`Solar ${fmt(solar)} • Haus ${fmt(house)} • Netz ${fmt(grid)}`, 12, H - 10);

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
 * BatteryCard - shows battery percentage and charging/discharging values
 */
function BatteryCard({ card, entities = {}, states = {} }) {
  const { title, state_entity, charging_entity, discharging_entity, show_percentage = true, theme = 'default' } = card.config || {};

  const resolveValue = (id) => {
    if (!id) return null;
    const s = states && states[id];
    if (s === undefined) {
      // Try entities fallback
      const e = entities && entities[id];
      if (e && (typeof e.state !== 'undefined')) return e.state;
      return null;
    }
    return (typeof s === 'object' ? s.state : s);
  };

  const level = resolveValue(state_entity) ?? 0;
  let charging = resolveValue(charging_entity);
  let discharging = resolveValue(discharging_entity);

  // Support a combined power_entity: positive = charging, negative = discharging
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

  React.useEffect(() => {
    console.log('BatteryCard update:', { state_entity, level, charging, discharging });
  }, [state_entity, charging_entity, discharging_entity, level, charging, discharging]);

  const colors = {
    default: { bg: '#fff', text: '#333', accent: '#0b5cff' },
    light: { bg: '#f5f5f5', text: '#1a1a1a', accent: '#0b5cff' },
    dark: { bg: '#2d2d2d', text: '#fff', accent: '#4caf50' }
  };
  const c = colors[theme] || colors.default;

  const batteryStyle = {
    width: 160,
    height: 80,
    borderRadius: 8,
    border: '2px solid #ccc',
    position: 'relative',
    overflow: 'hidden'
  };

  const innerStyle = {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: `${fillPct}%`,
    background: fillPct > 75 ? '#4caf50' : fillPct > 40 ? '#ff9800' : '#f44336',
    transition: 'width 0.4s ease'
  };

  return (
    <div style={{ padding: 8 }}>
      {title && <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: c.text }}>{title}</div>}

      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={batteryStyle}>
          <div style={innerStyle} />
          <div style={{ position: 'absolute', right: -12, top: '30%', width: 12, height: '40%', background: '#ccc', borderRadius: 2 }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {show_percentage && (
              <div style={{ fontSize: 20, fontWeight: 800, color: '#000' }}>{fillPct}%</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, color: c.text }}>Laden: <strong style={{ color: charging >= 0 ? '#4caf50' : c.text }}>{charging ?? '—'} W</strong></div>
          <div style={{ fontSize: 12, color: c.text }}>Entladen: <strong style={{ color: discharging >= 0 ? '#f44336' : c.text }}>{discharging ?? '—'} W</strong></div>
          <div style={{ fontSize: 12, color: '#666' }}>State: {state_entity || '—'}</div>
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
