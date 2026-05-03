// Main app shell — interactive prototype
const { useState } = React;

function App() {
  const [screen, setScreen] = useState('library');
  const [form, setForm]     = useState(null);
  const [toast, setToast]   = useState(null);

  function openForm(f) {
    const formType = f.type === 'Statistics' ? 'statistics' : 'inspection';
    setForm({ id: f.id, name: f.name, formType, sections: [{ id: 's0', title: 'Section 1', fields: [] }] });
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
    screen === 'projects' ? 'projects' : screen;

  return (
    <>
      {screen === 'mobile' ? (
        <MobileHome onExit={() => setScreen('library')}/>
      ) : (
        <div className="app">
          <Sidebar active={sidebarActive} onNav={s => {
            if (s === 'library')   setScreen('library');
            if (s === 'projects')  setScreen('projects');
            if (s === 'dashboard') setScreen('dashboard');
            if (s === 'users')     setScreen('users');
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
            {screen === 'users'    && <div className="page"><div className="page-head"><h1>User Management</h1><div className="sub">Coming soon</div></div></div>}

            {/* reserved for future use:
            {screen === 'inspection' && <InspectionBuilder .../>}
            {screen === 'stats'      && <StatsBuilder .../>}
            {screen === 'schedule'   && <ScheduleScreen .../>}
            */}
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
