// Main app shell — interactive prototype
const { useState } = React;

function App() {
  const [screen, setScreen] = useState('library'); // library, inspection, stats, schedule, mobile, admin
  const [form, setForm] = useState(null);
  const [toast, setToast] = useState(null);

  function openForm(f) {
    setForm({ ...window.SAMPLE_STATS, id: f.id, name: f.name, version: f.v, status: f.status });
    setScreen('stats');
  }
  function newForm() {
    setForm({ ...window.SAMPLE_STATS, id: 'new-stats', name: 'Untitled Statistics Form', version: 'v0.1', status: 'draft' });
    setScreen('stats');
  }
  function publish() {
    setToast('Form published — assign it to a project to activate it');
    setScreen('projects');
  }
  // function schedulePublish() { ... } // reserved for future use

  const isBuilder = screen === 'stats';
  // const isBuilder = screen === 'inspection' || screen === 'stats' || screen === 'schedule'; // inspection/audit reserved
  const hasOwnTopBar = screen === 'projects';

  const sidebarActive =
    (screen === 'library' || screen === 'stats') ? 'library' :
    screen === 'projects' ? 'projects' :
    screen;

  return (
    <>
      {screen === 'mobile' ? (
        <MobileHome onExit={() => setScreen('library')}/>
      ) : (
        <div className="app">
          <Sidebar active={sidebarActive} onNav={(s) => {
            if (s === 'library')   setScreen('library');
            if (s === 'projects')  setScreen('projects');
            if (s === 'dashboard') setScreen('dashboard');
            if (s === 'users')     setScreen('users');
          }}/>
          <div className="main">
            {!isBuilder && !hasOwnTopBar && <TopBar crumbs={
              screen === 'library'   ? ['Masters', 'Forms'] :
              screen === 'dashboard' ? ['Main', 'Dashboard'] :
              screen === 'users'     ? ['Main', 'User Management'] :
              ['Main', screen]
            } actions={
              <Btn size="sm" onClick={() => setScreen('mobile')}>📱 Open mobile preview</Btn>
            }/>}

            {screen === 'library'    && <ScreenLibrary onOpen={openForm} onNew={newForm}/>}
            {screen === 'stats'      && <StatsBuilder form={form} onBack={() => setScreen('library')} onPublish={publish}/>}
            {/* screen === 'inspection' — reserved for future use */}
            {/* screen === 'schedule'   — now embedded in Project Management */}
            {screen === 'projects'   && <ScreenAdmin/>}
            {screen === 'dashboard'  && <Dashboard/>}
            {screen === 'users'      && <div className="page"><div className="page-head"><h1>User Management</h1><div className="sub">Coming soon</div></div></div>}
          </div>
        </div>
      )}

      {screen !== 'mobile' && screen !== 'library' && (
        <button className="btn primary" style={{ position:'fixed', bottom: 20, right: 20, boxShadow:'var(--sh-lg)', zIndex: 50 }} onClick={() => setScreen('mobile')}>
          📱 Open on mobile
        </button>
      )}

      <FigmaButton/>

      {toast && <Toast message={toast} onDone={() => setToast(null)}/>}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
