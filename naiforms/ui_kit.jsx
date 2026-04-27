// nAI UI kit — shared components
const { useState, useEffect, useRef, useMemo } = React;

function Sidebar({ active, onNav }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">n</div>
        <div>
          <div className="name">nAIForms</div>
          <div className="sub">Admin · Builder</div>
        </div>
      </div>

      <div className="sidebar-section">Main</div>
      <button className={"sidebar-item " + (active==='dashboard'?'active':'')} onClick={()=>onNav('dashboard')}><span className="icon">▦</span> Dashboard</button>
      <button className={"sidebar-item " + (active==='users'?'active':'')} onClick={()=>onNav('users')}><span className="icon">☺</span> User Management</button>
      <button className={"sidebar-item " + (active==='projects'?'active':'')} onClick={()=>onNav('projects')}><span className="icon">▢</span> Project Management</button>

      <div className="sidebar-section">Masters</div>
      <button className={"sidebar-item " + (active==='library'?'active':'')} onClick={()=>onNav('library')}><span className="icon">☑</span> Forms <span className="badge">24</span></button>

      <div style={{ marginTop:'auto', padding: '16px 10px', fontSize: 11, color: 'var(--n-500)' }}>
        <div style={{ opacity: 0.7 }}>Navatech Group</div>
        <div style={{ fontWeight: 500, color: 'var(--n-300)' }}>Qatar Operations</div>
      </div>
    </aside>
  );
}

function FigmaButton() {
  const [state, setState] = useState('idle'); // idle | capturing | done | error

  async function sendToFigma() {
    if (state === 'capturing') return;
    setState('capturing');
    try {
      const api = window.figma?.captureForDesign;
      if (!api) throw new Error('Figma capture script not ready');
      const result = await api({ selector: '.app', delayMs: 150, verbose: false });
      setState(result?.success === false ? 'error' : 'done');
    } catch {
      setState('error');
    }
    setTimeout(() => setState('idle'), 2500);
  }

  const label = state === 'capturing' ? '⏳ Capturing…' : state === 'done' ? '✓ Copied!' : state === 'error' ? '✕ Failed' : '✦ Send to Figma';
  const bg    = state === 'done' ? 'var(--success)' : state === 'error' ? 'var(--danger)' : '#000';

  return (
    <button onClick={sendToFigma} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
      background: bg, color: '#fff', border: 'none', borderRadius: 6,
      fontSize: 12, fontWeight: 600, cursor: state === 'capturing' ? 'default' : 'pointer',
      transition: 'background 0.2s', letterSpacing: '0.01em', fontFamily: 'var(--font-sans)'
    }}>
      {label}
    </button>
  );
}

function TopBar({ crumbs = [], actions }) {
  return (
    <div className="topbar">
      <div className="crumbs">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="sep">›</span>}
            <span className={i === crumbs.length - 1 ? 'current' : ''}>{c}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="spacer" />
      {actions}
      <FigmaButton/>
      <div className="avatar">VM</div>
    </div>
  );
}

function Badge({ children, tone = 'neutral', dot }) {
  return <span className={"badge " + tone + (dot ? ' dot' : '')}>{children}</span>;
}

function Btn({ children, variant = '', size = '', onClick, disabled, style }) {
  return <button className={"btn " + variant + " " + size} onClick={onClick} disabled={disabled} style={style}>{children}</button>;
}

function Sev({ level, children }) {
  return <span className={"sev " + level}>{children || level}</span>;
}

function Switch({ on, onChange, disabled }) {
  return <div className={"switch " + (on ? 'on' : '')} onClick={() => !disabled && onChange(!on)} style={{ opacity: disabled ? 0.35 : 1, cursor: disabled ? 'default' : 'pointer' }} />;
}

function Modal({ title, onClose, children, actions }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="btn ghost icon-only" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {actions && <div className="modal-foot">{actions}</div>}
      </div>
    </div>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2200); return () => clearTimeout(t); }, []);
  return <div className="toast">✓ {message}</div>;
}

// Tiny phone frame — used in builder preview
function PhoneFrame({ children, scale = 1 }) {
  return (
    <div className="iphone" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
      <div className="iphone-screen">
        <div className="iphone-notch"/>
        <div className="status-bar">
          <span>9:41</span>
          <span>●●● 􀋦 􀛨</span>
        </div>
        <div style={{ flex: 1, overflow:'auto' }}>{children}</div>
      </div>
    </div>
  );
}

Object.assign(window, { Sidebar, TopBar, Badge, Btn, Sev, Switch, Modal, Toast, PhoneFrame });
