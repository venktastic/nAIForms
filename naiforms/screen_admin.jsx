// Project Management screen — org/sub/project hierarchy + project detail with Forms tab
function ScreenAdmin() {
  const [hier, setHier] = useState(window.ORG_HIERARCHY);
  const [selOrgId, setSelOrgId] = useState(window.ORG_HIERARCHY[0]?.id);
  const [selSubId, setSelSubId] = useState(window.ORG_HIERARCHY[0]?.subsidiaries[0]?.id);
  const [adding, setAdding] = useState(null); // 'org' | 'sub' | 'proj'
  const [newName, setNewName] = useState('');
  const [detailProjId, setDetailProjId] = useState(null); // null = list, id = detail view
  const [detailTab, setDetailTab] = useState('forms');   // 'forms' | 'schedule'

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

          {detailTab === 'forms' && (() => {
            // Read assignments directly from ORG_HIERARCHY (stays in sync with Workflow Builder)
            const assignedIds = new Set();
            (window.ORG_HIERARCHY || []).forEach(org =>
              org.subsidiaries.forEach(sub =>
                sub.projects.forEach(p => {
                  if (p.id === detailProjId) p.forms.forEach(a => assignedIds.add(a.formId));
                })
              )
            );
            const assignedForms = window.FORM_LIST.filter(f => assignedIds.has(f.id));
            return (
              <div>
                <div style={{ marginBottom:16, padding:'10px 14px', background:'var(--n-50)', border:'1px solid var(--n-200)',
                  borderRadius:8, fontSize:13, color:'var(--n-600)' }}>
                  Form assignments are managed from <strong>Workflow Builder</strong>. Open a workflow and click <strong>Manage</strong> to assign or remove it from projects.
                </div>
                {assignedForms.length === 0 ? (
                  <div className="card" style={{ padding:'40px 24px', textAlign:'center', color:'var(--n-400)', fontSize:13 }}>
                    No workflows assigned to this project yet.
                  </div>
                ) : (
                  <div className="card" style={{ padding:0 }}>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Workflow</th>
                          <th>Type</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedForms.map(f => (
                          <tr key={f.id}>
                            <td>
                              <div style={{ fontWeight:500 }}>{f.name}</div>
                              <div style={{ fontSize:11, color:'var(--n-500)', fontFamily:'var(--font-mono)', marginTop:2 }}>{f.id}</div>
                            </td>
                            <td><Badge tone={f.type==='Statistics'?'brand':f.type==='Audit'?'info':'neutral'}>{f.type}</Badge></td>
                            <td>
                              {f.status === 'published'   && <Badge tone="success" dot>Published</Badge>}
                              {f.status === 'deactivated' && <Badge tone="danger"  dot>Deactivated</Badge>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {detailTab === 'schedule' && (() => {
            const assignedForms = (window.ORG_HIERARCHY || []).reduce((acc, org) => {
              org.subsidiaries.forEach(sub => sub.projects.forEach(p => {
                if (p.id === detailProjId) p.forms.forEach(a => {
                  const f = window.FORM_LIST.find(x => x.id === a.formId);
                  if (f) acc.push(f);
                });
              }));
              return acc;
            }, []);
            if (!assignedForms.length) return (
              <div className="card" style={{ padding:'40px 24px', textAlign:'center', color:'var(--n-400)', fontSize:13 }}>
                No workflows assigned yet — go to the <strong>Forms</strong> tab and assign at least one workflow first.
              </div>
            );
            return <StatsScheduleScreen forms={assignedForms} embedded={true} onBack={null} onPublish={null}/>;
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
