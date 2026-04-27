// Statistics Capture Forms listing — MUI-style data table
function ScreenLibrary({ onOpen, onNew }) {
  const [q, setQ]                   = useState('');
  const [forms, setForms]           = useState(window.FORM_LIST.filter(f => f.type === 'Statistics'));
  const [confirmDeact, setConfirmDeact] = useState(null); // form object to deactivate
  const [confirmActiv, setConfirmActiv] = useState(null); // form object to activate
  const [sortCol, setSortCol]       = useState('updated');
  const [sortDir, setSortDir]       = useState('desc');

  function doDeactivate() {
    setForms(fs => fs.map(f => f.id !== confirmDeact.id ? f : { ...f, status: 'draft' }));
    setConfirmDeact(null);
  }
  function doActivate() {
    setForms(fs => fs.map(f => f.id !== confirmActiv.id ? f : { ...f, status: 'published' }));
    setConfirmActiv(null);
  }

  function getProjects(formId) {
    const out = [];
    (window.ORG_HIERARCHY || []).forEach(org =>
      org.subsidiaries.forEach(sub =>
        sub.projects.forEach(proj => {
          if (proj.forms.some(a => a.formId === formId)) out.push(proj.name);
        })
      )
    );
    return out;
  }

  function sort(col) {
    if (sortCol === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }
    else { setSortCol(col); setSortDir('asc'); }
  }

  const filtered = forms
    .filter(f => !q || f.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortCol === 'name')    return dir * a.name.localeCompare(b.name);
      if (sortCol === 'status')  return dir * a.status.localeCompare(b.status);
      if (sortCol === 'owner')   return dir * (a.owner||'').localeCompare(b.owner||'');
      if (sortCol === 'updated') return dir * (a.updated||'').localeCompare(b.updated||'');
      return 0;
    });

  const SortIcon = ({ col }) => sortCol === col
    ? <span style={{ marginLeft:4, fontSize:10, opacity:0.7 }}>{sortDir==='asc'?'↑':'↓'}</span>
    : <span style={{ marginLeft:4, fontSize:10, opacity:0.25 }}>↕</span>;

  const thStyle = (col, extra={}) => ({
    padding: '10px 14px', textAlign:'left', fontWeight:600, fontSize:12,
    color:'var(--n-600)', cursor:'pointer', userSelect:'none', whiteSpace:'nowrap',
    borderBottom:'2px solid var(--n-200)', borderRight:'1px solid var(--n-100)',
    background:'var(--n-50)', ...extra
  });
  const tdStyle = (extra={}) => ({
    padding:'12px 14px', borderBottom:'1px solid var(--n-100)',
    borderRight:'1px solid var(--n-100)', verticalAlign:'middle', ...extra
  });

  // Mock "in-progress" report reference for the deactivate dialog
  function inProgressRef(form) {
    const seed = form.id.replace(/\D/g,'') || '0';
    return form.id.toUpperCase() + '-RPT-' + (parseInt(seed.slice(-3)||0) + 42);
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

      {/* Page header */}
      <div style={{ padding:'20px 28px 0' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <h1 style={{ margin:0, fontSize:20, fontWeight:700 }}>Statistics Capture</h1>
            <div style={{ fontSize:13, color:'var(--n-500)', marginTop:3 }}>
              Manage statistics capture forms for your organisation
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <input className="input" style={{ width:240 }} placeholder="🔍 Search forms…"
              value={q} onChange={e=>setQ(e.target.value)}/>
            <Btn variant="primary" onClick={() => onNew('statistics')}>+ New Statistics Capture</Btn>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX:'auto', flex:1 }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr>
              <th style={thStyle('id',{cursor:'default'})} onClick={()=>sort('id')}>ID <SortIcon col="id"/></th>
              <th style={thStyle('name')} onClick={()=>sort('name')}>Name <SortIcon col="name"/></th>
              <th style={thStyle('structure',{cursor:'default'})}>Structure</th>
              <th style={thStyle('status')} onClick={()=>sort('status')}>Status <SortIcon col="status"/></th>
              <th style={thStyle('owner')} onClick={()=>sort('owner')}>Created By <SortIcon col="owner"/></th>
              <th style={thStyle('updated')} onClick={()=>sort('updated')}>Created On <SortIcon col="updated"/></th>
              <th style={thStyle('projects',{cursor:'default'})}>Projects Assigned To</th>
              <th style={{...thStyle(),cursor:'default',textAlign:'center',borderRight:'none'}}>View</th>
              <th style={{...thStyle(),cursor:'default',textAlign:'center',borderRight:'none'}}>Edit</th>
              <th style={{...thStyle(),cursor:'default',textAlign:'center',borderRight:'none'}}>Deactivate / Activate</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f, i) => {
              const isPublished = f.status === 'published';
              const projects = getProjects(f.id);
              const rowBg = i % 2 === 0 ? '#fff' : 'var(--n-0)';
              return (
                <tr key={f.id} style={{ background: rowBg }}>
                  <td style={tdStyle({ fontFamily:'var(--font-mono)', fontSize:11.5, color:'var(--n-500)', whiteSpace:'nowrap' })}>
                    {f.id.toUpperCase()}
                  </td>
                  <td style={tdStyle()}>
                    <div style={{ fontWeight:500 }}>{f.name}</div>
                    <div style={{ fontSize:11, color:'var(--n-400)', marginTop:2, fontFamily:'var(--font-mono)' }}>{f.v}</div>
                  </td>
                  <td style={tdStyle({ color:'var(--n-600)', whiteSpace:'nowrap' })}>
                    {f.sections} sections · {f.qs} fields
                  </td>
                  <td style={tdStyle()}>
                    {isPublished
                      ? <Badge tone="success" dot>Published</Badge>
                      : <Badge tone="warning" dot>Draft</Badge>}
                  </td>
                  <td style={tdStyle({ color:'var(--n-700)' })}>{f.owner}</td>
                  <td style={tdStyle({ color:'var(--n-500)', whiteSpace:'nowrap' })}>{f.updated}</td>
                  <td style={tdStyle({ minWidth:160 })}>
                    {projects.length
                      ? projects.map((p,pi) => <div key={pi} style={{ fontSize:12, color:'var(--n-700)' }}>• {p}</div>)
                      : <span style={{ color:'var(--n-300)', fontSize:12 }}>—</span>}
                  </td>
                  {/* View */}
                  <td style={{...tdStyle({textAlign:'center',borderRight:'none'})}}>
                    {isPublished
                      ? <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); onOpen(f); }}>View</Btn>
                      : <span style={{ color:'var(--n-300)', fontSize:12 }}>—</span>}
                  </td>
                  {/* Edit */}
                  <td style={{...tdStyle({textAlign:'center',borderRight:'none'})}}>
                    {!isPublished
                      ? <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); onOpen(f); }}>Edit</Btn>
                      : <span style={{ color:'var(--n-300)', fontSize:12 }}>—</span>}
                  </td>
                  {/* Deactivate / Activate */}
                  <td style={{...tdStyle({textAlign:'center',borderRight:'none'})}}>
                    {isPublished
                      ? <Btn size="sm" variant="ghost" style={{ color:'var(--danger)' }}
                          onClick={e => { e.stopPropagation(); setConfirmDeact(f); }}>Deactivate</Btn>
                      : <Btn size="sm" variant="ghost" style={{ color:'var(--success)' }}
                          onClick={e => { e.stopPropagation(); setConfirmActiv(f); }}>Activate</Btn>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding:'48px 24px', textAlign:'center', color:'var(--n-400)', fontSize:13 }}>
            No statistics capture forms found
          </div>
        )}
      </div>

      {/* Summary row */}
      <div style={{ padding:'12px 28px', borderTop:'1px solid var(--n-100)', display:'flex', gap:24, fontSize:12, color:'var(--n-500)' }}>
        <span><strong style={{ color:'var(--n-800)' }}>{forms.length}</strong> total</span>
        <span><strong style={{ color:'var(--success)' }}>{forms.filter(f=>f.status==='published').length}</strong> published</span>
        <span><strong style={{ color:'var(--n-600)' }}>{forms.filter(f=>f.status!=='published').length}</strong> drafts</span>
      </div>

      {/* Deactivate confirmation */}
      {confirmDeact && (
        <Modal title="Deactivate form?" onClose={() => setConfirmDeact(null)} actions={
          <>
            <Btn onClick={() => setConfirmDeact(null)}>Cancel</Btn>
            <Btn variant="primary" style={{ background:'var(--danger)', borderColor:'var(--danger)' }} onClick={doDeactivate}>
              Deactivate
            </Btn>
          </>
        }>
          <p style={{ marginTop:0 }}>
            Are you sure you want to deactivate <strong>{confirmDeact.name}</strong>?
            This will prevent new submissions from being collected.
          </p>
          <div style={{ padding:12, background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, fontSize:13 }}>
            <div style={{ fontWeight:600, color:'#92400e', marginBottom:6 }}>⚠ Currently in progress</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'#78350f' }}>
              Report ID: {inProgressRef(confirmDeact)}
            </div>
            <div style={{ fontSize:12, color:'var(--n-500)', marginTop:4 }}>
              In-progress entries will not be lost. Deactivating prevents new submissions only.
            </div>
          </div>
        </Modal>
      )}

      {/* Activate confirmation */}
      {confirmActiv && (
        <Modal title="Activate form?" onClose={() => setConfirmActiv(null)} actions={
          <>
            <Btn onClick={() => setConfirmActiv(null)}>Cancel</Btn>
            <Btn variant="primary" onClick={doActivate}>Activate</Btn>
          </>
        }>
          <p style={{ marginTop:0 }}>
            Activate <strong>{confirmActiv.name}</strong> and make it available for submission?
          </p>
          <div style={{ padding:12, background:'var(--n-50)', borderRadius:8, fontSize:13, color:'var(--n-600)' }}>
            Once active, users with this form assigned to their project will be able to submit it.
            Go to Project Management to assign it to specific projects.
          </div>
        </Modal>
      )}
    </div>
  );
}

Object.assign(window, { ScreenLibrary });
