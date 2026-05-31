// Main app shell — interactive prototype
const { useState } = React;

const _AU = { e: 'test@navatech.ai', p: '0987' };

function LoginScreen({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  function submit(ev) {
    ev.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (email.trim().toLowerCase() === _AU.e && password === _AU.p) {
        sessionStorage.setItem('nai_auth', '1');
        onLogin();
      } else {
        setError('Invalid email or password.');
        setLoading(false);
      }
    }, 400);
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--n-50)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-sans)' }}>
      <div style={{ width:380, background:'#fff', borderRadius:16, boxShadow:'0 4px 32px rgba(0,0,0,0.10)', padding:'40px 36px' }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:32 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'var(--brand-700)', color:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:800, letterSpacing:'-0.02em' }}>n</div>
          <div>
            <div style={{ fontSize:17, fontWeight:700, color:'var(--n-900)', letterSpacing:'-0.01em' }}>nAIForms</div>
            <div style={{ fontSize:11.5, color:'var(--n-400)' }}>HSE Workflow Builder · Prototype</div>
          </div>
        </div>

        <div style={{ fontSize:20, fontWeight:700, color:'var(--n-900)', marginBottom:4 }}>Sign in</div>
        <div style={{ fontSize:13, color:'var(--n-500)', marginBottom:28 }}>Enter your credentials to continue</div>

        <form onSubmit={submit} autoComplete="off">
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--n-700)', marginBottom:6 }}>Email address</label>
            <input className="input" type="email" autoFocus
              value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="you@example.com"
              style={{ fontSize:14, padding:'10px 12px' }}/>
          </div>

          <div style={{ marginBottom:24 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--n-700)', marginBottom:6 }}>Password</label>
            <input className="input" type="password"
              value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="••••••••"
              style={{ fontSize:14, padding:'10px 12px' }}/>
          </div>

          {error && (
            <div style={{ marginBottom:16, padding:'10px 12px', background:'#fef2f2', border:'1px solid #fecaca',
              borderRadius:8, fontSize:13, color:'var(--danger)', fontWeight:500 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !email || !password}
            style={{ width:'100%', padding:'12px', border:'none', borderRadius:10,
              background: loading || !email || !password ? 'var(--n-300)' : 'var(--brand-700)',
              color:'#fff', fontSize:14, fontWeight:700, cursor: loading || !email || !password ? 'default' : 'pointer',
              transition:'background 0.15s' }}>
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <div style={{ marginTop:28, paddingTop:20, borderTop:'1px solid var(--n-100)',
          fontSize:11.5, color:'var(--n-400)', textAlign:'center' }}>
          Navatech Group · Qatar Operations
        </div>
      </div>
    </div>
  );
}

function App() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('nai_auth') === '1');
  const [screen, setScreen] = useState('library');
  const [form, setForm]     = useState(null);
  const [toast, setToast]   = useState(null);

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)}/>;

  function openForm(f) {
    const formType = f.type === 'Statistics' ? 'statistics' : f.type === 'Audit' ? 'audit' : 'inspection';
    setForm({ id: f.id, name: f.name, formType, status: f.status, sections: [{ id: 's0', title: 'Section 1', fields: [] }] });
    setScreen('form');
  }
  function newForm(name = 'Untitled Form', formType = 'inspection') {
    setForm({ id: 'new-' + Date.now(), name, formType, sections: [{ id: 's0', title: 'Section 1', fields: [] }] });
    setScreen('form');
  }
  function publish() {
    setToast('Workflow published');
    setScreen('library');
  }

  const isBuilder   = screen === 'form';
  const hasOwnTopBar = screen === 'projects';

  const sidebarActive =
    (screen === 'library' || screen === 'form') ? 'library' :
    screen === 'projects' ? 'projects' :
    screen === 'observation' ? 'observation' : screen;

  return (
    <>
      {screen === 'mobile' ? (
        <MobileHome onExit={() => setScreen('library')}/>
      ) : (
        <div className="app">
          <Sidebar active={sidebarActive} onNav={s => {
            if (s === 'library')   setScreen('library');
            if (s === 'projects')  setScreen('projects');
            if (s === 'dashboard')    setScreen('dashboard');
            if (s === 'users')        setScreen('users');
            if (s === 'observation')  setScreen('observation');
          }}/>
          <div className="main">
            {!isBuilder && !hasOwnTopBar && <TopBar crumbs={
              screen === 'library'   ? ['Masters', 'Workflows'] :
              screen === 'dashboard' ? ['Main', 'Dashboard'] :
              screen === 'users'     ? ['Main', 'User Management'] :
              ['Main', screen]
            } actions={
              <Btn size="sm" onClick={() => setScreen('mobile')}>📱 Open mobile preview</Btn>
            }/>}

            {screen === 'library'  && <ScreenLibrary onOpen={openForm} onNew={newForm}/>}
            {screen === 'form'     && <FormBuilder form={form} onBack={() => setScreen('library')} onPublish={publish}/>}
            {screen === 'projects' && <ScreenAdmin/>}
            {screen === 'dashboard'&& <Dashboard/>}
            {screen === 'users'       && <div className="page"><div className="page-head"><h1>User Management</h1><div className="sub">Coming soon</div></div></div>}
            {screen === 'observation' && <ObservationWorkflow/>}
          </div>
        </div>
      )}

      {screen !== 'mobile' && screen !== 'library' && (
        <button className="btn primary" style={{ position:'fixed', bottom:20, right:20, boxShadow:'var(--sh-lg)', zIndex:50 }}
          onClick={() => setScreen('mobile')}>
          📱 Open on mobile
        </button>
      )}

      <FigmaButton/>

      {toast && <Toast message={toast} onDone={() => setToast(null)}/>}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
