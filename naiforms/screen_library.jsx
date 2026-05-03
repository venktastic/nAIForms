// Workflow Builder Library
function SortIcon({ col, sortCol, sortDir }) {
  return sortCol === col
    ? <span style={{ marginLeft:4, fontSize:10, opacity:0.7 }}>{sortDir==='asc'?'↑':'↓'}</span>
    : <span style={{ marginLeft:4, fontSize:10, opacity:0.25 }}>↕</span>;
}

function ScreenLibrary({ onOpen, onNew, onNavProjects }) {
  const [q, setQ]                   = useState('');
  const [forms, setForms]           = useState(window.FORM_LIST);
  const [confirmDeact, setConfirmDeact] = useState(null);
  const [confirmActiv, setConfirmActiv] = useState(null);
  const [deactSel, setDeactSel]     = useState(new Set());
  const [manageForm, setManageForm] = useState(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName]       = useState('');
  const [newType, setNewType]       = useState('statistics');
  const [sortCol, setSortCol]       = useState('updated');
  const [sortDir, setSortDir]       = useState('desc');
  const [typeFilter, setTypeFilter] = useState('all');

  function doDeactivate() {
    setForms(fs => fs.map(f => f.id !== confirmDeact.id ? f : { ...f, status: 'draft' }));
    setConfirmDeact(null);
    setDeactSel(new Set());
  }
  function doActivate() {
    setForms(fs => fs.map(f => f.id !== confirmActiv.id ? f : { ...f, status: 'published' }));
    setConfirmActiv(null);
  }
  function handleCreate() {
    const defaultName = newType === 'statistics' ? 'Untitled Statistics Capture' : 'Untitled Inspection';
    const name = newName.trim() || defaultName;
    setShowNewModal(false);
    setNewName('');
    setNewType('statistics');
    onNew(name, newType);
  }
  function doDuplicate(f) {
    const formType = f.type === 'Statistics' ? 'statistics' : 'inspection';
    const copy = {
      ...f,
      id: f.id + '-C' + Date.now().toString().slice(-4),
      name: f.name + ' (Copy)',
      status: 'draft',
      v: 'v0.1',
      updated: 'Just now',
    };
    setForms(fs => [copy, ...fs]);
    onNew(copy.name, formType);
  }

  function getProjectObjectsForForm(formId) {
    const out = [];
    (window.ORG_HIERARCHY || []).forEach(org =>
      org.subsidiaries.forEach(sub =>
        sub.projects.forEach(proj => {
          if (proj.forms.some(a => a.formId === formId))
            out.push({ id: proj.id, name: proj.name, subName: sub.name });
        })
      )
    );
    return out;
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
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  const filtered = forms
    .filter(f => !q || f.name.toLowerCase().includes(q.toLowerCase()))
    .filter(f => typeFilter === 'all' || f.type === typeFilter)
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortCol === 'name')    return dir * a.name.localeCompare(b.name);
      if (sortCol === 'type')    return dir * a.type.localeCompare(b.type);
      if (sortCol === 'status')  return dir * a.status.localeCompare(b.status);
      if (sortCol === 'owner')   return dir * (a.owner||'').localeCompare(b.owner||'');
      if (sortCol === 'updated') return dir * (a.updated||'').localeCompare(b.updated||'');
      return 0;
    });

  const thS = (col, extra={}) => ({
    padding:'10px 14px', textAlign:'left', fontWeight:600, fontSize:12,
    color:'var(--n-600)', cursor: col ? 'pointer' : 'default', userSelect:'none', whiteSpace:'nowrap',
    borderBottom:'2px solid var(--n-200)', borderRight:'1px solid var(--n-100)', background:'var(--n-50)', ...extra
  });
  const tdS = (extra={}) => ({
    padding:'12px 14px', borderBottom:'1px solid var(--n-100)', borderRight:'1px solid var(--n-100)', verticalAlign:'middle', ...extra
  });

  const typeColor = t => t === 'Statistics' ? 'brand' : t === 'Audit' ? 'info' : 'neutral';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

      {/* Header */}
      <div style={{ padding:'20px 28px 16px', borderBottom:'1px solid var(--n-100)', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ margin:0, fontSize:20, fontWeight:700 }}>Workflow Builder</h1>
          <div style={{ fontSize:13, color:'var(--n-500)', marginTop:3 }}>
            Inspections and statistics captures for your organisation
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input className="input" style={{ width:240 }} placeholder="🔍 Search workflows…"
            value={q} onChange={e => setQ(e.target.value)}/>
          <Btn variant="primary" onClick={() => { setNewName(''); setNewType('statistics'); setShowNewModal(true); }}>+ Create New Workflow</Btn>
        </div>
      </div>

      {/* Type filter tabs */}
      <div style={{ padding:'10px 28px 0', borderBottom:'1px solid var(--n-100)', display:'flex', gap:0 }}>
        {[
          { key:'all',         label:'All Workflows',      count: forms.length },
          { key:'Inspection',  label:'Inspection',         count: forms.filter(f=>f.type==='Inspection').length },
          { key:'Statistics',  label:'Statistics Capture', count: forms.filter(f=>f.type==='Statistics').length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setTypeFilter(tab.key)}
            style={{ padding:'8px 18px', fontSize:13, fontWeight:typeFilter===tab.key?600:400, border:'none',
              borderBottom:`2px solid ${typeFilter===tab.key?'var(--brand-500)':'transparent'}`,
              background:'transparent', color:typeFilter===tab.key?'var(--brand-700)':'var(--n-500)',
              cursor:'pointer', display:'flex', alignItems:'center', gap:6, transition:'color 0.1s' }}>
            {tab.label}
            <span style={{ fontSize:11, padding:'1px 7px', borderRadius:10, fontWeight:600,
              background:typeFilter===tab.key?'var(--brand-100)':'var(--n-100)',
              color:typeFilter===tab.key?'var(--brand-700)':'var(--n-500)' }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX:'auto', flex:1 }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr>
              <th style={thS('id')}    onClick={() => sort('id')}>ID <SortIcon col="id" sortCol={sortCol} sortDir={sortDir}/></th>
              <th style={thS('name')}  onClick={() => sort('name')}>Name <SortIcon col="name" sortCol={sortCol} sortDir={sortDir}/></th>
              <th style={thS('type')}  onClick={() => sort('type')}>Type <SortIcon col="type" sortCol={sortCol} sortDir={sortDir}/></th>
              <th style={thS(null)}>Structure</th>
              <th style={thS('status')} onClick={() => sort('status')}>Status <SortIcon col="status" sortCol={sortCol} sortDir={sortDir}/></th>
              <th style={thS('owner')} onClick={() => sort('owner')}>Created By <SortIcon col="owner" sortCol={sortCol} sortDir={sortDir}/></th>
              <th style={thS('updated')} onClick={() => sort('updated')}>Created On <SortIcon col="updated" sortCol={sortCol} sortDir={sortDir}/></th>
              <th style={thS(null)}>Projects Assigned To</th>
              <th style={{...thS(null), textAlign:'center', borderRight:'none'}}>Open</th>
              <th style={{...thS(null), textAlign:'center', borderRight:'none'}}>Duplicate</th>
              <th style={{...thS(null), textAlign:'center', borderRight:'none'}}>Manage</th>
              <th style={{...thS(null), textAlign:'center', borderRight:'none'}}>Deactivate / Activate</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f, i) => {
              const isPublished = f.status === 'published';
              const projects = getProjects(f.id);
              return (
                <tr key={f.id} style={{ background: i % 2 === 0 ? '#fff' : 'var(--n-0)' }}>
                  <td style={tdS({ fontFamily:'var(--font-mono)', fontSize:11.5, color:'var(--n-500)', whiteSpace:'nowrap' })}>{f.id}</td>
                  <td style={tdS()}>
                    <div style={{ fontWeight:500 }}>{f.name}</div>
                    <div style={{ fontSize:11, color:'var(--n-400)', marginTop:2, fontFamily:'var(--font-mono)' }}>{f.v}</div>
                  </td>
                  <td style={tdS()}><Badge tone={typeColor(f.type)}>{f.type}</Badge></td>
                  <td style={tdS({ color:'var(--n-600)' })}>
                    <div style={{ fontSize:12, fontWeight:500 }}>{f.sections} section{f.sections!==1?'s':''}</div>
                    <div style={{ fontSize:11.5, color:'var(--n-400)', marginTop:2 }}>{f.qs} {f.type==='Statistics'?'fields':'questions'}</div>
                  </td>
                  <td style={tdS()}>
                    {isPublished ? <Badge tone="success" dot>Published</Badge> : <Badge tone="warning" dot>Draft</Badge>}
                  </td>
                  <td style={tdS({ color:'var(--n-700)' })}>{f.owner}</td>
                  <td style={tdS({ color:'var(--n-500)', whiteSpace:'nowrap', fontSize:12 })}>{f.updated}</td>
                  <td style={tdS({ minWidth:140 })}>
                    {projects.length
                      ? projects.map((p,pi) => <div key={pi} style={{ fontSize:12, color:'var(--n-700)' }}>• {p}</div>)
                      : <span style={{ color:'var(--n-300)', fontSize:12 }}>—</span>}
                  </td>
                  <td style={{...tdS({ textAlign:'center', borderRight:'none' })}}>
                    <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); onOpen(f); }}>
                      {isPublished ? 'View' : 'Edit'}
                    </Btn>
                  </td>
                  <td style={{...tdS({ textAlign:'center', borderRight:'none' })}}>
                    <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); doDuplicate(f); }}>Duplicate</Btn>
                  </td>
                  <td style={{...tdS({ textAlign:'center', borderRight:'none' })}}>
                    {isPublished
                      ? <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setManageForm(f); }}>Manage</Btn>
                      : <span style={{ color:'var(--n-300)', fontSize:12 }}>—</span>}
                  </td>
                  <td style={{...tdS({ textAlign:'center', borderRight:'none' })}}>
                    {isPublished
                      ? <Btn size="sm" variant="ghost" style={{ color:'var(--danger)' }} onClick={e => {
                          e.stopPropagation();
                          const projs = getProjectObjectsForForm(f.id);
                          setDeactSel(new Set(projs.map(p => p.id)));
                          setConfirmDeact(f);
                        }}>Deactivate</Btn>
                      : <Btn size="sm" variant="ghost" style={{ color:'var(--success)' }} onClick={e => { e.stopPropagation(); setConfirmActiv(f); }}>Activate</Btn>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding:'48px 24px', textAlign:'center', color:'var(--n-400)', fontSize:13 }}>No workflows found</div>
        )}
      </div>

      {/* Footer summary */}
      <div style={{ padding:'12px 28px', borderTop:'1px solid var(--n-100)', display:'flex', gap:24, fontSize:12, color:'var(--n-500)' }}>
        <span><strong style={{ color:'var(--n-800)' }}>{forms.length}</strong> total</span>
        <span><strong style={{ color:'var(--success)' }}>{forms.filter(f=>f.status==='published').length}</strong> published</span>
        <span><strong style={{ color:'var(--n-600)' }}>{forms.filter(f=>f.status!=='published').length}</strong> drafts</span>
      </div>

      {/* Create new workflow modal */}
      {showNewModal && (
        <Modal title="Create new workflow" onClose={() => setShowNewModal(false)} actions={
          <>
            <Btn onClick={() => setShowNewModal(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleCreate}>Create</Btn>
          </>
        }>
          <label className="label" style={{ marginBottom:8 }}>Workflow type</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
            {[
              { key:'inspection', label:'Inspection',         icon:'✓', color:'#6366f1', desc:'Checklists, yes/no, ratings' },
              { key:'statistics', label:'Statistics Capture', icon:'#', color:'#10b981', desc:'KPIs, manhours, incident rates' },
            ].map(t => (
              <button key={t.key} onClick={() => setNewType(t.key)}
                style={{ padding:'12px', border:`2px solid ${newType===t.key?t.color:'var(--n-200)'}`, borderRadius:10,
                  background:newType===t.key?t.color+'12':'var(--n-0)', cursor:'pointer', textAlign:'left' }}>
                <div style={{ fontSize:18, marginBottom:4, color:t.color }}>{t.icon}</div>
                <div style={{ fontWeight:600, fontSize:13, color:'var(--n-800)' }}>{t.label}</div>
                <div style={{ fontSize:11.5, color:'var(--n-500)', marginTop:3 }}>{t.desc}</div>
              </button>
            ))}
          </div>
          <label className="label">Workflow name</label>
          <input className="input" autoFocus value={newName} onChange={e => setNewName(e.target.value)}
            placeholder={newType === 'statistics' ? 'e.g. Weekly KPI Capture' : 'e.g. Daily Site Inspection'}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowNewModal(false); }}/>
        </Modal>
      )}

      {/* Deactivate confirmation — per-project checkboxes */}
      {confirmDeact && (() => {
        const assignedProjs = getProjectObjectsForForm(confirmDeact.id);
        return (
          <Modal title="Deactivate workflow?" onClose={() => { setConfirmDeact(null); setDeactSel(new Set()); }} actions={
            <>
              <Btn onClick={() => { setConfirmDeact(null); setDeactSel(new Set()); }}>Cancel</Btn>
              <Btn variant="primary" style={{ background:'var(--danger)', borderColor:'var(--danger)' }} onClick={doDeactivate}>
                Deactivate{deactSel.size > 0 ? ` (${deactSel.size} project${deactSel.size > 1 ? 's' : ''})` : ''}
              </Btn>
            </>
          }>
            <p style={{ marginTop:0 }}>
              Deactivating <strong>{confirmDeact.name}</strong> will move it to Draft and prevent new submissions.
            </p>
            {assignedProjs.length > 0 ? (
              <>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--n-700)', marginBottom:8 }}>
                  Select projects to remove this workflow from:
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:220, overflowY:'auto' }}>
                  {assignedProjs.map(proj => (
                    <label key={proj.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
                      border:`1px solid ${deactSel.has(proj.id)?'#fde68a':'var(--n-200)'}`, borderRadius:8, cursor:'pointer',
                      background: deactSel.has(proj.id) ? '#fffbeb' : 'var(--n-0)' }}>
                      <input type="checkbox"
                        checked={deactSel.has(proj.id)}
                        onChange={e => setDeactSel(prev => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(proj.id); else next.delete(proj.id);
                          return next;
                        })}/>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:500 }}>{proj.name}</div>
                        <div style={{ fontSize:11, color:'var(--n-400)' }}>{proj.subName}</div>
                      </div>
                    </label>
                  ))}
                </div>
                <div style={{ fontSize:12, color:'var(--n-500)', marginTop:8 }}>In-progress entries will not be lost.</div>
              </>
            ) : (
              <div style={{ padding:12, background:'var(--n-50)', borderRadius:8, fontSize:13, color:'var(--n-600)' }}>
                Not currently assigned to any projects.
              </div>
            )}
          </Modal>
        );
      })()}

      {/* Activate confirmation */}
      {confirmActiv && (
        <Modal title="Activate workflow?" onClose={() => setConfirmActiv(null)} actions={
          <>
            <Btn onClick={() => setConfirmActiv(null)}>Cancel</Btn>
            <Btn variant="primary" onClick={doActivate}>Activate</Btn>
          </>
        }>
          <p style={{ marginTop:0 }}>Activate <strong>{confirmActiv.name}</strong> and make it available for submission?</p>
          <div style={{ padding:12, background:'var(--n-50)', borderRadius:8, fontSize:13, color:'var(--n-600)' }}>
            Go to Project Management to assign it to specific projects.
          </div>
        </Modal>
      )}

      {/* Manage project assignments modal */}
      {manageForm && (() => {
        const assignedProjs = getProjectObjectsForForm(manageForm.id);
        return (
          <Modal title={`Project assignments — ${manageForm.name}`} onClose={() => setManageForm(null)} actions={
            <>
              {onNavProjects && (
                <Btn onClick={() => { setManageForm(null); onNavProjects(); }}>Open Project Management →</Btn>
              )}
              <Btn variant="primary" onClick={() => setManageForm(null)}>Done</Btn>
            </>
          }>
            <div style={{ fontSize:13, color:'var(--n-600)', marginBottom:10 }}>
              {assignedProjs.length > 0
                ? `Assigned to ${assignedProjs.length} project${assignedProjs.length > 1 ? 's' : ''}.`
                : 'Not assigned to any projects yet.'}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:280, overflowY:'auto' }}>
              {assignedProjs.length === 0
                ? <div style={{ padding:'24px 0', textAlign:'center', color:'var(--n-300)', fontSize:13 }}>
                    No project assignments found.
                  </div>
                : assignedProjs.map(proj => (
                  <div key={proj.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px',
                    border:'1px solid var(--brand-200)', borderRadius:8, background:'var(--brand-50)' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--success)', flexShrink:0 }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>{proj.name}</div>
                      <div style={{ fontSize:11, color:'var(--n-500)' }}>{proj.subName}</div>
                    </div>
                    <Badge tone="success">Active</Badge>
                  </div>
                ))
              }
            </div>
            <div style={{ marginTop:12, padding:12, background:'var(--n-50)', borderRadius:8, fontSize:12, color:'var(--n-500)' }}>
              To add or remove assignments, go to Project Management › select a project › Forms tab.
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}

Object.assign(window, { ScreenLibrary });
