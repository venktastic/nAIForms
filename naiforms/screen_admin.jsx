// Project Management screen — org/sub/project hierarchy + project detail with Forms tab
function ScreenAdmin() {
  const [hier, setHier] = useState(window.ORG_HIERARCHY);
  const [selOrgId, setSelOrgId] = useState(window.ORG_HIERARCHY[0]?.id);
  const [selSubId, setSelSubId] = useState(window.ORG_HIERARCHY[0]?.subsidiaries[0]?.id);
  const [adding, setAdding] = useState(null); // 'org' | 'sub' | 'proj'
  const [newName, setNewName] = useState('');
  const [detailProjId, setDetailProjId] = useState(null); // null = list, id = detail view
  const [detailTab, setDetailTab] = useState('forms');   // 'forms' | 'schedule'
  const [schedFormId, setSchedFormId] = useState(null);  // which assigned form to configure

  const selOrg = hier.find(o => o.id === selOrgId);
  const selSub = selOrg?.subsidiaries.find(s => s.id === selSubId);
  const totalProjects = hier.reduce((n, o) => n + o.subsidiaries.reduce((m, s) => m + s.projects.length, 0), 0);

  // Detail-view derived state
  const detailOrg = detailProjId ? hier.find(o => o.subsidiaries.some(s => s.projects.some(p => p.id === detailProjId))) : null;
  const detailSub = detailOrg ? detailOrg.subsidiaries.find(s => s.projects.some(p => p.id === detailProjId)) : null;
  const detailProj = detailSub ? detailSub.projects.find(p => p.id === detailProjId) : null;

  function startAdding(type) { setAdding(type); setNewName(''); }

  function commit() {
    const name = newName.trim();
    if (!name) { setAdding(null); return; }
    const id = adding[0] + Date.now();
    if (adding === 'org') {
      setHier(h => [...h, { id, name, subsidiaries: [] }]);
      setSelOrgId(id); setSelSubId(null);
    } else if (adding === 'sub') {
      setHier(h => h.map(o => o.id !== selOrgId ? o : { ...o, subsidiaries: [...o.subsidiaries, { id, name, projects: [] }] }));
      setSelSubId(id);
    } else if (adding === 'proj') {
      setHier(h => h.map(o => o.id !== selOrgId ? o : {
        ...o, subsidiaries: o.subsidiaries.map(s => s.id !== selSubId ? s : { ...s, projects: [...s.projects, { id, name, forms: [] }] })
      }));
    }
    setAdding(null); setNewName('');
  }

  function patchDetailProj(patch) {
    setHier(h => h.map(o => ({
      ...o, subsidiaries: o.subsidiaries.map(s => ({
        ...s, projects: s.projects.map(p => p.id !== detailProjId ? p : { ...p, ...patch })
      }))
    })));
  }

  function toggleAssign(formId) {
    const form = window.FORM_LIST.find(f => f.id === formId);
    if (form.status !== 'published') return;
    const cur = detailProj.forms;
    const isAssigned = cur.some(f => f.formId === formId);
    patchDetailProj({ forms: isAssigned ? cur.filter(f => f.formId !== formId) : [...cur, { formId }] });
  }

  function selectOrg(org) {
    setSelOrgId(org.id);
    const firstSub = org.subsidiaries[0];
    setSelSubId(firstSub?.id ?? null);
  }

  // ── PROJECT DETAIL VIEW ──────────────────────────────────────────────────
  if (detailProjId && detailProj) {
    const assignedCount = detailProj.forms.length;
    return (
      <>
        <TopBar crumbs={['Project Management', detailOrg?.name, detailSub?.name, detailProj.name]} actions={
          <Btn variant="ghost" onClick={() => setDetailProjId(null)}>← Projects</Btn>
        }/>
        <div className="page">
          <div className="page-head">
            <div>
              <h1 style={{ fontWeight: 700, marginBottom: 2 }}>{detailProj.name}</h1>
              <div className="sub">{detailOrg?.name} › {detailSub?.name}</div>
            </div>
            <div style={{ display:'flex', gap: 6, alignItems:'center' }}>
              <Badge tone="success" dot>{assignedCount} ASSIGNED</Badge>
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display:'flex', borderBottom: '2px solid var(--n-200)', marginBottom: 20 }}>
            {[['forms','Forms'],['schedule','Schedule & Assign']].map(([id, label]) => (
              <button key={id} onClick={() => setDetailTab(id)} style={{
                padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: detailTab === id ? '2px solid var(--brand-600)' : '2px solid transparent',
                marginBottom: -2, fontWeight: detailTab === id ? 600 : 400, fontSize: 13,
                color: detailTab === id ? 'var(--brand-700)' : 'var(--n-500)'
              }}>{label}</button>
            ))}
          </div>

          {detailTab === 'forms' && (
            <div className="card" style={{ padding: 0 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Form</th>
                    <th>Type</th>
                    <th>Version</th>
                    <th>Library Status</th>
                    <th style={{ textAlign:'center', width: 120 }}>Assign to Project</th>
                  </tr>
                </thead>
                <tbody>
                  {window.FORM_LIST.map(f => {
                    const assigned = !!detailProj.forms.find(x => x.formId === f.id);
                    const isDraft = f.status !== 'published';
                    return (
                      <tr key={f.id} style={{ opacity: assigned ? 1 : 0.5 }}>
                        <td>
                          <div style={{ fontWeight: assigned ? 600 : 400 }}>{f.name}</div>
                          <div style={{ fontSize: 11, color:'var(--n-500)', fontFamily:'var(--font-mono)', marginTop: 2 }}>{f.id.toUpperCase()} · {f.sections}s · {f.qs}q</div>
                        </td>
                        <td>
                          <Badge tone={assigned ? (f.type==='Statistics'?'brand':f.type==='Audit'?'info':'neutral') : 'neutral'}>{f.type}</Badge>
                        </td>
                        <td style={{ fontFamily:'var(--font-mono)', fontSize: 12, color:'var(--n-500)' }}>{f.v}</td>
                        <td>{f.status === 'published' ? <Badge tone="success" dot>Published</Badge> : <Badge tone="warning" dot>Draft</Badge>}</td>
                        <td style={{ textAlign:'center' }}>
                          <Switch on={assigned} onChange={() => toggleAssign(f.id)} disabled={isDraft}/>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {detailTab === 'schedule' && (() => {
            const assignedForms = detailProj.forms
              .map(a => window.FORM_LIST.find(f => f.id === a.formId))
              .filter(Boolean);
            const schedForm = assignedForms.find(f => f.id === schedFormId) || assignedForms[0] || null;
            if (!assignedForms.length) return (
              <div className="card" style={{ padding: '40px 24px', textAlign:'center', color:'var(--n-400)', fontSize:13 }}>
                No forms assigned yet — go to the <strong>Forms</strong> tab and toggle on at least one form first.
              </div>
            );
            return (
              <div>
                <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color:'var(--n-600)', fontWeight: 500 }}>Configure schedule for:</span>
                  <select className="input" style={{ width: 'auto', minWidth: 260 }}
                    value={schedForm?.id || ''}
                    onChange={e => setSchedFormId(e.target.value)}>
                    {assignedForms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                {schedForm && <ScheduleScreen form={schedForm} onBack={null} onPublish={null} embedded={true}/>}
              </div>
            );
          })()}
        </div>
      </>
    );
  }

  // ── PROJECT LIST VIEW ────────────────────────────────────────────────────
  return (
    <>
      <TopBar crumbs={['Main', 'Project Management']} actions={
        <Badge tone="neutral">{totalProjects} projects</Badge>
      }/>
      <div className="page">
        <div className="page-head">
          <div>
            <h1>Project Management</h1>
            <div className="sub">Manage your organisation, subsidiary and project structure</div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'210px 210px 1fr', gap:16, alignItems:'start' }}>

          {/* ORGANISATIONS */}
          <div className="hier-panel">
            <div className="hier-panel-head">
              <span>Organisations</span>
              <button className="hier-add" onClick={() => startAdding('org')}>+ New</button>
            </div>
            {hier.map(org => (
              <div key={org.id} className={"hier-row " + (selOrgId === org.id ? 'active' : '')} onClick={() => selectOrg(org)}>
                <span className="hier-row-name">{org.name}</span>
                <span className="hier-count">{org.subsidiaries.length}</span>
              </div>
            ))}
            {adding === 'org' && (
              <div style={{ padding:'6px 10px' }}>
                <input className="input" autoFocus placeholder="Organisation name" value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setAdding(null); }}/>
                <div className="hint" style={{ marginTop:4 }}>Enter to save · Esc to cancel</div>
              </div>
            )}
          </div>

          {/* SUBSIDIARIES */}
          <div className="hier-panel">
            <div className="hier-panel-head">
              <span>Subsidiaries</span>
              {selOrg && <button className="hier-add" onClick={() => startAdding('sub')}>+ New</button>}
            </div>
            {selOrg?.subsidiaries.map(sub => (
              <div key={sub.id} className={"hier-row " + (selSubId === sub.id ? 'active' : '')} onClick={() => setSelSubId(sub.id)}>
                <span className="hier-row-name">{sub.name}</span>
                <span className="hier-count">{sub.projects.length}</span>
              </div>
            ))}
            {!selOrg?.subsidiaries.length && adding !== 'sub' && <div className="hier-empty">No subsidiaries yet</div>}
            {adding === 'sub' && (
              <div style={{ padding:'6px 10px' }}>
                <input className="input" autoFocus placeholder="Subsidiary name" value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setAdding(null); }}/>
                <div className="hint" style={{ marginTop:4 }}>Enter to save · Esc to cancel</div>
              </div>
            )}
          </div>

          {/* PROJECTS */}
          <div className="hier-panel">
            <div className="hier-panel-head">
              <span>Projects{selSub ? ` — ${selSub.name}` : ''}</span>
              {selSub && <button className="hier-add" onClick={() => startAdding('proj')}>+ New Project</button>}
            </div>
            {selSub?.projects.map(proj => {
              return (
                <div key={proj.id} className="hier-row" style={{ cursor:'pointer' }} onClick={() => setDetailProjId(proj.id)}>
                  <span className="hier-row-name">{proj.name}</span>
                  {proj.forms.length > 0 && <span className="hier-count">{proj.forms.length}</span>}
                </div>
              );
            })}
            {!selSub && <div style={{ padding:'12px 14px', fontSize:13, color:'var(--n-400)' }}>Select a subsidiary first</div>}
            {selSub && !selSub.projects.length && adding !== 'proj' && <div className="hier-empty">No projects yet</div>}
            {adding === 'proj' && (
              <div style={{ padding:'6px 10px' }}>
                <input className="input" autoFocus placeholder="Project name" value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setAdding(null); }}/>
                <div className="hint" style={{ marginTop:4 }}>Enter to save · Esc to cancel</div>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}

Object.assign(window, { ScreenAdmin });
