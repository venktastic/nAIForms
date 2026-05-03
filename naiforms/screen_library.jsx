// Workflow Builder Library
function SortIcon({ col, sortCol, sortDir }) {
  return sortCol === col
    ? <span style={{ marginLeft:4, fontSize:10, opacity:0.7 }}>{sortDir==='asc'?'↑':'↓'}</span>
    : <span style={{ marginLeft:4, fontSize:10, opacity:0.25 }}>↕</span>;
}

function ScreenLibrary({ onOpen, onNew }) {
  const [q, setQ]             = useState('');
  const [forms, setForms]     = useState(window.FORM_LIST);
  // Publish / Re-publish modal (draft + deactivated forms)
  const [publishForm, setPublishForm] = useState(null);
  const [publishSel,  setPublishSel]  = useState(new Set());
  // Active-on-projects modal (published forms only)
  const [projectsForm, setProjectsForm] = useState(null);
  const [projectsSel,  setProjectsSel]  = useState(new Set());
  // Deactivate confirmation
  const [deactForm, setDeactForm] = useState(null);
  // Create new workflow modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName]   = useState('');
  const [newType, setNewType]   = useState('statistics');
  // Sort / filter
  const [sortCol, setSortCol]   = useState('updated');
  const [sortDir, setSortDir]   = useState('desc');
  const [typeFilter, setTypeFilter] = useState('all');

  // ── helpers ────────────────────────────────────────────────────────────────
  function getProjectObjects(formId) {
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
  function getProjectNames(formId) { return getProjectObjects(formId).map(p => p.name); }
  function getAllProjects() {
    const out = [];
    (window.ORG_HIERARCHY || []).forEach(org =>
      org.subsidiaries.forEach(sub =>
        sub.projects.forEach(proj => out.push({ id: proj.id, name: proj.name, subName: sub.name }))
      )
    );
    return out;
  }
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

  // ── publish / re-publish ───────────────────────────────────────────────────
  function openPublish(f) {
    setPublishSel(new Set(getProjectObjects(f.id).map(p => p.id)));
    setPublishForm(f);
  }
  function closePublish() { setPublishForm(null); setPublishSel(new Set()); }
  function doPublish() {
    applyAssignments(publishForm.id, publishSel);
    setForms(fs => fs.map(f => f.id !== publishForm.id ? f : { ...f, status: 'published' }));
    closePublish();
  }

  // ── active-on-projects (published forms) ──────────────────────────────────
  function openProjects(f) {
    setProjectsSel(new Set(getProjectObjects(f.id).map(p => p.id)));
    setProjectsForm(f);
  }
  function closeProjects() { setProjectsForm(null); setProjectsSel(new Set()); }
  function doSaveProjects() {
    applyAssignments(projectsForm.id, projectsSel);
    closeProjects();
  }

  // ── deactivate ─────────────────────────────────────────────────────────────
  function doDeactivate() {
    // clear all project associations and move to Deactivated
    const formId = deactForm.id;
    (window.ORG_HIERARCHY || []).forEach(org =>
      org.subsidiaries.forEach(sub =>
        sub.projects.forEach(proj => {
          proj.forms = proj.forms.filter(a => a.formId !== formId);
        })
      )
    );
    setForms(fs => fs.map(f => f.id !== deactForm.id ? f : { ...f, status: 'deactivated' }));
    setDeactForm(null);
  }

  // ── create / duplicate ─────────────────────────────────────────────────────
  function handleCreate() {
    const defaultName = newType === 'statistics' ? 'Untitled Statistics Capture' : 'Untitled Inspection';
    const name = newName.trim() || defaultName;
    setShowNewModal(false); setNewName(''); setNewType('statistics');
    onNew(name, newType);
  }
  function doDuplicate(f) {
    const formType = f.type === 'Statistics' ? 'statistics' : 'inspection';
    const copy = { ...f, id: f.id + '-C' + Date.now().toString().slice(-4),
      name: 'Copy of ' + f.name, status: 'draft', v: 'v0.1', updated: 'Just now' };
    setForms(fs => [copy, ...fs]);
    onNew(copy.name, formType);
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

  const allProjects = getAllProjects();

  // reusable project checklist (used in both publish and active-on-projects modals)
  function ProjectChecklist({ sel, setSel, caption }) {
    return (
      <>
        {caption && <p style={{ marginTop:0, fontSize:13, color:'var(--n-600)' }}>{caption}</p>}
        <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:260, overflowY:'auto' }}>
          {allProjects.length === 0 && (
            <div style={{ fontSize:13, color:'var(--n-400)', textAlign:'center', padding:16 }}>No projects found</div>
          )}
          {allProjects.map(proj => (
            <label key={proj.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px',
              border:`1px solid ${sel.has(proj.id)?'var(--brand-400)':'var(--n-200)'}`, borderRadius:8, cursor:'pointer',
              background: sel.has(proj.id) ? 'var(--brand-50)' : 'var(--n-0)' }}>
              <input type="checkbox" checked={sel.has(proj.id)} onChange={e => setSel(prev => {
                const next = new Set(prev);
                if (e.target.checked) next.add(proj.id); else next.delete(proj.id);
                return next;
              })}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight: sel.has(proj.id) ? 600 : 400 }}>{proj.name}</div>
                <div style={{ fontSize:11, color:'var(--n-400)' }}>{proj.subName}</div>
              </div>
              {sel.has(proj.id) && <Badge tone="success">Active</Badge>}
            </label>
          ))}
        </div>
        <div style={{ marginTop:8, display:'flex', gap:12 }}>
          <button style={{ fontSize:12, color:'var(--brand-600)', background:'none', border:'none', cursor:'pointer', padding:0 }}
            onClick={() => setSel(new Set(allProjects.map(p => p.id)))}>Select all</button>
          <button style={{ fontSize:12, color:'var(--n-500)', background:'none', border:'none', cursor:'pointer', padding:0 }}
            onClick={() => setSel(new Set())}>Clear all</button>
        </div>
      </>
    );
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

      {/* Header */}
      <div style={{ padding:'20px 28px 16px', borderBottom:'1px solid var(--n-100)', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ margin:0, fontSize:20, fontWeight:700 }}>Workflow Builder</h1>
          <div style={{ fontSize:13, color:'var(--n-500)', marginTop:3 }}>Inspections and statistics captures for your organisation</div>
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
          { key:'all',        label:'All Workflows',      count: forms.length },
          { key:'Inspection', label:'Inspection',         count: forms.filter(f=>f.type==='Inspection').length },
          { key:'Statistics', label:'Statistics Capture', count: forms.filter(f=>f.type==='Statistics').length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setTypeFilter(tab.key)}
            style={{ padding:'8px 18px', fontSize:13, fontWeight:typeFilter===tab.key?600:400, border:'none',
              borderBottom:`2px solid ${typeFilter===tab.key?'var(--brand-500)':'transparent'}`,
              background:'transparent', color:typeFilter===tab.key?'var(--brand-700)':'var(--n-500)',
              cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
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
              <th style={thS(null)}>Active on</th>
              <th style={{...thS(null), textAlign:'center', borderRight:'none'}}>Open</th>
              <th style={{...thS(null), textAlign:'center', borderRight:'none'}}></th>
              <th style={{...thS(null), textAlign:'center', borderRight:'none'}}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f, i) => {
              const projects = getProjectNames(f.id);
              return (
                <tr key={f.id} style={{ background: i % 2 === 0 ? '#fff' : 'var(--n-0)' }}>
                  <td style={tdS({ fontFamily:'var(--font-mono)', fontSize:11.5, color:'var(--n-500)', whiteSpace:'nowrap' })}>{f.id}</td>
                  <td style={tdS()}>
                    <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                      <span style={{ fontWeight:500 }}>{f.name}</span>
                      <button title="Duplicate" onClick={e => { e.stopPropagation(); doDuplicate(f); }}
                        style={{ background:'none', border:'none', cursor:'pointer', color:'var(--n-300)', fontSize:13,
                          padding:'1px 4px', borderRadius:4, lineHeight:1, flexShrink:0 }}
                        onMouseOver={e => e.currentTarget.style.color='var(--n-600)'}
                        onMouseOut={e => e.currentTarget.style.color='var(--n-300)'}>⎘</button>
                    </div>
                  </td>
                  <td style={tdS()}><Badge tone={typeColor(f.type)}>{f.type}</Badge></td>
                  <td style={tdS({ color:'var(--n-600)' })}>
                    <div style={{ fontSize:12, fontWeight:500 }}>{f.sections} section{f.sections!==1?'s':''}</div>
                    <div style={{ fontSize:11.5, color:'var(--n-400)', marginTop:2 }}>{f.qs} {f.type==='Statistics'?'fields':'questions'}</div>
                  </td>
                  <td style={tdS()}>
                    {f.status === 'published'   && <Badge tone="success" dot>Published</Badge>}
                    {f.status === 'draft'       && <Badge tone="warning" dot>Draft</Badge>}
                    {f.status === 'deactivated' && <Badge tone="danger"  dot>Deactivated</Badge>}
                  </td>
                  <td style={tdS({ color:'var(--n-700)' })}>{f.owner}</td>
                  <td style={tdS({ color:'var(--n-500)', whiteSpace:'nowrap', fontSize:12 })}>{f.updated}</td>
                  <td style={tdS({ minWidth:130 })}>
                    {projects.length
                      ? projects.map((p,pi) => <div key={pi} style={{ fontSize:12, color:'var(--n-700)' }}>• {p}</div>)
                      : <span style={{ color:'var(--n-300)', fontSize:12 }}>—</span>}
                  </td>
                  {/* Open */}
                  <td style={{...tdS({ textAlign:'center', borderRight:'none' })}}>
                    <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); onOpen(f); }}>
                      {f.status === 'published' ? 'View' : 'Edit'}
                    </Btn>
                  </td>
                  {/* Project action — context-sensitive */}
                  <td style={{...tdS({ textAlign:'center', borderRight:'none' })}}>
                    {f.status === 'published' && (
                      <Btn size="sm" variant="ghost" onClick={e => { e.stopPropagation(); openProjects(f); }}>
                        Active on projects
                      </Btn>
                    )}
                    {f.status === 'draft' && (
                      <Btn size="sm" variant="primary" onClick={e => { e.stopPropagation(); openPublish(f); }}>
                        Publish →
                      </Btn>
                    )}
                    {f.status === 'deactivated' && (
                      <Btn size="sm" variant="ghost" style={{ color:'var(--success)' }}
                        onClick={e => { e.stopPropagation(); openPublish(f); }}>
                        Re-publish →
                      </Btn>
                    )}
                  </td>
                  {/* Deactivate — published only */}
                  <td style={{...tdS({ textAlign:'center', borderRight:'none' })}}>
                    {f.status === 'published' && (
                      <Btn size="sm" variant="ghost" style={{ color:'var(--danger)' }}
                        onClick={e => { e.stopPropagation(); setDeactForm(f); }}>
                        Deactivate
                      </Btn>
                    )}
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
          <><Btn onClick={() => setShowNewModal(false)}>Cancel</Btn><Btn variant="primary" onClick={handleCreate}>Create</Btn></>
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
            onKeyDown={e => { if (e.key==='Enter') handleCreate(); if (e.key==='Escape') setShowNewModal(false); }}/>
        </Modal>
      )}

      {/* Publish / Re-publish modal */}
      {publishForm && (
        <Modal
          title={publishForm.status === 'deactivated' ? `Re-publish — ${publishForm.name}` : `Publish — ${publishForm.name}`}
          onClose={closePublish}
          actions={
            <><Btn onClick={closePublish}>Cancel</Btn>
            <Btn variant="primary" onClick={doPublish}>
              {publishForm.status === 'deactivated' ? 'Re-publish' : 'Publish'}
              {publishSel.size > 0 ? ` on ${publishSel.size} project${publishSel.size>1?'s':''}` : ' — no projects selected'}
            </Btn></>
          }
        >
          <ProjectChecklist
            sel={publishSel} setSel={setPublishSel}
            caption="Select the projects where this workflow will be active."
          />
        </Modal>
      )}

      {/* Active on projects modal (published forms) */}
      {projectsForm && (
        <Modal title={`Active on projects — ${projectsForm.name}`} onClose={closeProjects} actions={
          <><Btn onClick={closeProjects}>Cancel</Btn><Btn variant="primary" onClick={doSaveProjects}>Save changes</Btn></>
        }>
          <ProjectChecklist
            sel={projectsSel} setSel={setProjectsSel}
            caption="Checked projects are where this workflow is currently active. Uncheck to remove it from a project."
          />
        </Modal>
      )}

      {/* Deactivate confirmation */}
      {deactForm && (() => {
        const affected = getProjectObjects(deactForm.id);
        return (
          <Modal title="Deactivate workflow?" onClose={() => setDeactForm(null)} actions={
            <><Btn onClick={() => setDeactForm(null)}>Cancel</Btn>
            <Btn variant="primary" style={{ background:'var(--danger)', borderColor:'var(--danger)' }} onClick={doDeactivate}>
              Deactivate
            </Btn></>
          }>
            <p style={{ marginTop:0 }}>
              <strong>{deactForm.name}</strong> will be moved to Deactivated and removed from all projects. No new submissions will be accepted.
            </p>
            {affected.length > 0 && (
              <div style={{ padding:12, background:'var(--n-50)', borderRadius:8, fontSize:13 }}>
                <div style={{ fontWeight:600, color:'var(--n-700)', marginBottom:6 }}>Will be removed from:</div>
                {affected.map(p => (
                  <div key={p.id} style={{ fontSize:12, color:'var(--n-600)', marginBottom:3 }}>
                    • {p.name} <span style={{ color:'var(--n-400)' }}>({p.subName})</span>
                  </div>
                ))}
              </div>
            )}
          </Modal>
        );
      })()}
    </div>
  );
}

Object.assign(window, { ScreenLibrary });
