// Workflow Builder Library
function SortIcon({ col, sortCol, sortDir }) {
  return sortCol === col
    ? <span style={{ marginLeft:4, fontSize:10, opacity:0.7 }}>{sortDir==='asc'?'↑':'↓'}</span>
    : <span style={{ marginLeft:4, fontSize:10, opacity:0.25 }}>↕</span>;
}

function ScreenLibrary({ onOpen, onNew }) {
  const [q, setQ]               = useState('');
  const [forms, setForms]       = useState(window.FORM_LIST);
  const [manageForm, setManageForm] = useState(null);
  const [manageSel, setManageSel]   = useState(new Set());
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName]   = useState('');
  const [newType, setNewType]   = useState('statistics');
  const [sortCol, setSortCol]   = useState('updated');
  const [sortDir, setSortDir]   = useState('desc');
  const [typeFilter, setTypeFilter] = useState('all');

  function openManage(f) {
    const assigned = getProjectObjectsForForm(f.id);
    setManageSel(new Set(assigned.map(p => p.id)));
    setManageForm(f);
  }
  function closeManage() { setManageForm(null); setManageSel(new Set()); }

  function applyAssignments(formId, sel) {
    (window.ORG_HIERARCHY || []).forEach(org =>
      org.subsidiaries.forEach(sub =>
        sub.projects.forEach(proj => {
          const want = sel.has(proj.id);
          const has  = proj.forms.some(a => a.formId === formId);
          if (want && !has) proj.forms.push({ formId });
          if (!want && has) proj.forms = proj.forms.filter(a => a.formId !== formId);
        })
      )
    );
    setForms(fs => [...fs]);
  }
  function doActivate() {
    applyAssignments(manageForm.id, manageSel);
    setForms(fs => fs.map(f => f.id !== manageForm.id ? f : { ...f, status: 'published' }));
    closeManage();
  }
  function doDeactivate() {
    applyAssignments(manageForm.id, manageSel);
    setForms(fs => fs.map(f => f.id !== manageForm.id ? f : { ...f, status: 'deactivated' }));
    closeManage();
  }
  function doSaveAssignments() {
    applyAssignments(manageForm.id, manageSel);
    closeManage();
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
      name: 'Copy of ' + f.name,
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

  const allProjectsFlat = [];
  (window.ORG_HIERARCHY || []).forEach(org =>
    org.subsidiaries.forEach(sub =>
      sub.projects.forEach(proj => allProjectsFlat.push({ id: proj.id, name: proj.name, subName: sub.name }))
    )
  );

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
              <th style={thS('id')}      onClick={() => sort('id')}>ID <SortIcon col="id" sortCol={sortCol} sortDir={sortDir}/></th>
              <th style={thS('name')}    onClick={() => sort('name')}>Name <SortIcon col="name" sortCol={sortCol} sortDir={sortDir}/></th>
              <th style={thS('type')}    onClick={() => sort('type')}>Type <SortIcon col="type" sortCol={sortCol} sortDir={sortDir}/></th>
              <th style={thS(null)}>Structure</th>
              <th style={thS('status')}  onClick={() => sort('status')}>Status <SortIcon col="status" sortCol={sortCol} sortDir={sortDir}/></th>
              <th style={thS('owner')}   onClick={() => sort('owner')}>Created By <SortIcon col="owner" sortCol={sortCol} sortDir={sortDir}/></th>
              <th style={thS('updated')} onClick={() => sort('updated')}>Created On <SortIcon col="updated" sortCol={sortCol} sortDir={sortDir}/></th>
              <th style={thS(null)}>Projects Assigned To</th>
              <th style={{...thS(null), textAlign:'center', borderRight:'none'}}>Open</th>
              <th style={{...thS(null), textAlign:'center', borderRight:'none'}}>Duplicate</th>
              <th style={{...thS(null), textAlign:'center', borderRight:'none'}}>Manage</th>
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
                    {f.status === 'published'   && <Badge tone="success" dot>Published</Badge>}
                    {f.status === 'draft'       && <Badge tone="warning" dot>Draft</Badge>}
                    {f.status === 'deactivated' && <Badge tone="danger" dot>Deactivated</Badge>}
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
                      {f.status === 'published' ? 'View' : 'Edit'}
                    </Btn>
                  </td>
                  <td style={{...tdS({ textAlign:'center', borderRight:'none' })}}>
                    <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); doDuplicate(f); }}>Duplicate</Btn>
                  </td>
                  <td style={{...tdS({ textAlign:'center', borderRight:'none' })}}>
                    <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); openManage(f); }}>
                      {f.status === 'published' ? 'Manage' : 'Activate'}
                    </Btn>
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
        <span><strong style={{ color:'var(--n-600)' }}>{forms.filter(f=>f.status==='draft').length}</strong> drafts</span>
        <span><strong style={{ color:'var(--danger)' }}>{forms.filter(f=>f.status==='deactivated').length}</strong> deactivated</span>
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

      {/* Unified Manage modal — project assignment + activate / deactivate */}
      {manageForm && (() => {
        const isPublished = manageForm.status === 'published';
        return (
          <Modal
            title={isPublished ? `Manage — ${manageForm.name}` : `Activate — ${manageForm.name}`}
            onClose={closeManage}
            actions={
              <div style={{ display:'flex', gap:8, width:'100%', alignItems:'center' }}>
                {isPublished && (
                  <Btn style={{ color:'var(--danger)', marginRight:'auto' }} onClick={doDeactivate}>Deactivate</Btn>
                )}
                <Btn onClick={closeManage}>Cancel</Btn>
                {isPublished
                  ? <Btn variant="primary" onClick={doSaveAssignments}>Save assignments</Btn>
                  : <Btn variant="primary"
                      style={{ background:'var(--success)', borderColor:'var(--success)' }}
                      onClick={doActivate}>
                      Activate{manageSel.size > 0 ? ` & assign to ${manageSel.size} project${manageSel.size > 1 ? 's' : ''}` : ''}
                    </Btn>
                }
              </div>
            }
          >
            <p style={{ marginTop:0, fontSize:13, color:'var(--n-600)' }}>
              {isPublished
                ? 'Update which projects this workflow is active on. Use Deactivate to move it back to Draft.'
                : 'Select projects to assign this workflow to, then activate it.'}
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:280, overflowY:'auto' }}>
              {allProjectsFlat.length === 0 && (
                <div style={{ fontSize:13, color:'var(--n-400)', textAlign:'center', padding:16 }}>No projects found</div>
              )}
              {allProjectsFlat.map(proj => (
                <label key={proj.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
                  border:`1px solid ${manageSel.has(proj.id) ? 'var(--brand-400)' : 'var(--n-200)'}`, borderRadius:8, cursor:'pointer',
                  background: manageSel.has(proj.id) ? 'var(--brand-50)' : 'var(--n-0)' }}>
                  <input type="checkbox"
                    checked={manageSel.has(proj.id)}
                    onChange={e => setManageSel(prev => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(proj.id); else next.delete(proj.id);
                      return next;
                    })}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight: manageSel.has(proj.id) ? 600 : 400 }}>{proj.name}</div>
                    <div style={{ fontSize:11, color:'var(--n-400)' }}>{proj.subName}</div>
                  </div>
                  {manageSel.has(proj.id) && <Badge tone="success">Assigned</Badge>}
                </label>
              ))}
            </div>
            <div style={{ marginTop:8, display:'flex', gap:12 }}>
              <button style={{ fontSize:12, color:'var(--brand-600)', background:'none', border:'none', cursor:'pointer', padding:0 }}
                onClick={() => setManageSel(new Set(allProjectsFlat.map(p => p.id)))}>Select all</button>
              <button style={{ fontSize:12, color:'var(--n-500)', background:'none', border:'none', cursor:'pointer', padding:0 }}
                onClick={() => setManageSel(new Set())}>Clear all</button>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}

Object.assign(window, { ScreenLibrary });
