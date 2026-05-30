import React from 'react';
import {ToggleButton, ToggleButtonGroup, Typography} from '@mui/material';

export const PASSEPARTOUT_STYLES = [
  {id: 'none',     label: 'Keiner'},
  {id: 'gold',     label: 'Gold'},
  {id: 'silber',   label: 'Silber'},
  {id: 'vintage',  label: 'Vintage'},
  {id: 'festlich', label: 'Festlich'},
];

export const PassepartoutSvg = ({styleId}) => {
  const W = 48, H = 68;
  const cfg = {
    none:     {primary: null,               fill: null,                bw: 7,  ol: 2, cs: 2.2, lw: 0,   diamonds: false, squares: false, flowers: 0, midSide: false, doubleInner: false},
    gold:     {primary: 'rgba(189,143,20,', fill: 'rgba(252,247,220,', bw: 7,  ol: 2, cs: 2.2, lw: 1,   diamonds: true,  squares: false, flowers: 0, midSide: false, doubleInner: false},
    silber:   {primary: 'rgba(153,153,163,',fill: 'rgba(235,235,240,', bw: 7,  ol: 2, cs: 2.2, lw: 1.4, diamonds: false, squares: true,  flowers: 0, midSide: false, doubleInner: false},
    vintage:  {primary: 'rgba(140,82,25,',  fill: 'rgba(250,240,222,', bw: 10, ol: 2, cs: 2.8, lw: 0.7, diamonds: false, squares: false, flowers: 4, midSide: true,  doubleInner: true},
    festlich: {primary: 'rgba(110,10,20,',  fill: 'rgba(252,232,234,', bw: 12, ol: 2, cs: 3.2, lw: 1.5, diamonds: false, squares: false, flowers: 5, midSide: true,  doubleInner: false},
  }[styleId] || {};

  const p = (o) => `${cfg.primary}${o})`;
  const f = (o) => `${cfg.fill}${o})`;
  const {bw, ol, cs, lw} = cfg;
  const corners = [[bw, bw], [W - bw, bw], [bw, H - bw], [W - bw, H - bw]];

  const svgFlower = (cx, cy, r, petals, color) => (
    [...Array(petals)].map((_, i) => {
      const angle = (Math.PI * 2 * i) / petals - Math.PI / 2;
      return <circle key={i} cx={cx + Math.cos(angle) * r * 0.72} cy={cy + Math.sin(angle) * r * 0.72} r={r * 0.52} fill={color} />;
    }).concat(<circle key="c" cx={cx} cy={cy} r={r * 0.36} fill={color} />)
  );

  return (
    <svg width={W} height={H} style={{display: 'block', border: '1px solid #ddd', background: 'white'}}>
      {cfg.fill && <>
        <rect x={0} y={H - bw} width={W} height={bw} fill={f('0.55')} />
        <rect x={0} y={0} width={W} height={bw} fill={f('0.55')} />
        <rect x={0} y={bw} width={bw} height={H - 2 * bw} fill={f('0.55')} />
        <rect x={W - bw} y={bw} width={bw} height={H - 2 * bw} fill={f('0.55')} />
      </>}
      {cfg.primary && !cfg.doubleInner && <rect x={ol} y={ol} width={W - 2 * ol} height={H - 2 * ol} fill="none" stroke={p('0.45')} strokeWidth={0.5} />}
      {cfg.primary && <rect x={bw} y={bw} width={W - 2 * bw} height={H - 2 * bw} fill="none" stroke={p('0.75')} strokeWidth={lw} />}
      {cfg.doubleInner && <rect x={bw + 1.5} y={bw + 1.5} width={W - 2 * (bw + 1.5)} height={H - 2 * (bw + 1.5)} fill="none" stroke={p('0.6')} strokeWidth={0.5} />}
      {cfg.diamonds && corners.map(([cx, cy], i) => (
        <polygon key={i} points={`${cx},${cy - cs} ${cx + cs},${cy} ${cx},${cy + cs} ${cx - cs},${cy}`} fill={p('0.75')} />
      ))}
      {cfg.squares && corners.map(([cx, cy], i) => (
        <rect key={i} x={cx - cs * 0.8} y={cy - cs * 0.8} width={cs * 1.6} height={cs * 1.6} fill={p('0.75')} />
      ))}
      {cfg.flowers > 0 && <>
        {corners.map(([cx, cy], i) => <g key={i}>{svgFlower(cx, cy, cs, cfg.flowers, p('0.75'))}</g>)}
        {cfg.midSide && [
          [W/2, bw/2], [W/2, H - bw/2], [bw/2, H/2], [W - bw/2, H/2]
        ].map(([cx, cy], i) => <g key={`m${i}`}>{svgFlower(cx, cy, cs * 0.65, cfg.flowers, p('0.6'))}</g>)}
      </>}
    </svg>
  );
};

export const PassepartoutPicker = ({value, onChange}) => (
  <ToggleButtonGroup
    value={value ?? 'none'}
    exclusive
    onChange={(_, v) => v && onChange(v)}
    size="small"
    sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5, '& .MuiToggleButtonGroup-grouped': {border: '1px solid rgba(0,0,0,0.18) !important', borderRadius: '4px !important', m: 0}}}
  >
    {PASSEPARTOUT_STYLES.map(s => (
      <ToggleButton key={s.id} value={s.id} sx={{flexDirection: 'column', gap: 0.5, p: 0.75, minWidth: 64}}>
        <PassepartoutSvg styleId={s.id} />
        <Typography variant="caption" sx={{lineHeight: 1}}>{s.label}</Typography>
      </ToggleButton>
    ))}
  </ToggleButtonGroup>
);
