// Inspection Builder — split pane with real state
const OPTION_COLORS = ['#22c55e','#ef4444','#f59e0b','#3b82f6','#8b5cf6','#ec4899','#06b6d4'];

function InspectionBuilder({ form, onBack, onPublish }) {
  const [data, setData] = useState(form || window.SAMPLE_INSPECTION);
  const [selSectionId, setSelSectionId] = useState(data.sections[0].id);
  const [selQId, setSelQId] = useState(data.sections[0].questions[0]?.id);
  const [showPublish, setShowPublish] = useState(false);
  const [showFormSettings, setShowFormSettings] = useState(false);
  const [drag, setDrag] = useState(null); // {qId, fromSection}

  const selSection = data.sections.find(s => s.id === selSectionId);
  const selQ = selSection?.questions.find(q => q.id === selQId);

  function updateQ(patch) {
    setData(d => ({
      ...d,
      sections: d.sections.map(s => s.id !== selSectionId ? s : ({
        ...s,
        questions: s.questions.map(q => q.id !== selQId ? q : { ...q, ...patch })
      }))
    }));
  }
  function updateOption(oid, patch) {
    updateQ({ options: selQ.options.map(o => o.id !== oid ? o : { ...o, ...patch }) });
  }
  function addOption() {
    const nextColor = OPTION_COLORS[(selQ.options||[]).length % OPTION_COLORS.length];
    updateQ({ options: [...(selQ.options||[]), { id: 'o'+Date.now(), label: 'New option', score: 0, color: nextColor }] });
  }
  function removeOption(oid) {
    updateQ({ options: selQ.options.filter(o => o.id !== oid) });
  }
  function addQuestion(sid) {
    const nq = { id: 'q'+Date.now(), text: 'New question', type:'yes_no_na', required: true, weight: 1, attach:[],
      options:[
        {id:'n1',label:'Yes',score:1,color:'#22c55e'},
        {id:'n2',label:'No',score:0,color:'#ef4444'},
        {id:'n3',label:'N/A',score:null,color:'#94a3b8'},
      ]};
    setData(d => ({ ...d, sections: d.sections.map(s => s.id !== sid ? s : { ...s, questions: [...s.questions, nq] })}));
    setSelSectionId(sid); setSelQId(nq.id);
  }
  function addSection() {
    const ns = { id: 's'+Date.now(), title: 'New section', weight: 10, questions: [] };
    setData(d => ({ ...d, sections: [...d.sections, ns] }));
    setSelSectionId(ns.id); setSelQId(null);
  }
  function updateSection(sid, patch) {
    setData(d => ({ ...d, sections: d.sections.map(s => s.id !== sid ? s : { ...s, ...patch })}));
  }
  function deleteQuestion() {
    setData(d => ({
      ...d,
      sections: d.sections.map(s => s.id !== selSectionId ? s : {
        ...s, questions: s.questions.filter(q => q.id !== selQId)
      })
    }));
    setSelQId(null);
  }
  function deleteSection(sid) {
    setData(d => ({ ...d, sections: d.sections.filter(s => s.id !== sid) }));
    if (selSectionId === sid) {
      const remaining = data.sections.filter(s => s.id !== sid);
      setSelSectionId(remaining[0]?.id ?? null);
      setSelQId(null);
    }
  }
  function moveQuestion(qId, fromSectionId, toSectionId, toIdx) {
    setData(d => {
      const fromSec = d.sections.find(s => s.id === fromSectionId);
      const q = fromSec.questions.find(x => x.id === qId);
      if (!q) return d;
      return {
        ...d,
        sections: d.sections.map(s => {
          if (s.id === fromSectionId && s.id === toSectionId) {
            const remaining = s.questions.filter(x => x.id !== qId);
            const insertAt = Math.min(toIdx, remaining.length);
            remaining.splice(insertAt, 0, q);
            return { ...s, questions: remaining };
          }
          if (s.id === fromSectionId) return { ...s, questions: s.questions.filter(x => x.id !== qId) };
          if (s.id === toSectionId) {
            const ns = [...s.questions];
            ns.splice(Math.min(toIdx, ns.length), 0, q);
            return { ...s, questions: ns };
          }
          return s;
        })
      };
    });
  }

  return (
    <>
      <TopBar crumbs={['Tools','Forms Library', data.name]} actions={
        <>
          <Btn variant="ghost" onClick={onBack}>← Library</Btn>
          <Btn onClick={() => setShowFormSettings(true)}>⚙ Form settings</Btn>
          <Btn>Save draft</Btn>
          <Btn variant="primary" onClick={() => setShowPublish(true)}>Publish →</Btn>
        </>
      }/>

      <div className="builder">
        {/* LEFT — structure tree */}
        <div className="left">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight:600, textTransform:'uppercase', color:'var(--n-500)', letterSpacing:'0.06em' }}>Structure</div>
            <Btn size="sm" onClick={addSection}>+ Section</Btn>
          </div>
          <div style={{ padding: '10px 12px', background: 'var(--n-0)', border:'1px solid var(--n-200)', borderRadius:'var(--r-md)', marginBottom:12 }}>
            <div style={{ fontSize:11, color:'var(--n-500)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Topic</div>
            <input className="input" style={{ border:'none', padding:'4px 0', fontWeight:600, fontSize:14 }} value={data.name} onChange={e=>setData(d=>({...d, name:e.target.value}))}/>
            <div style={{ display:'flex', gap:6, marginTop: 6 }}>
              <Badge tone="neutral">{data.version}</Badge>
              <Badge tone="warning" dot>Draft</Badge>
            </div>
          </div>

          {data.sections.map((s, i) => (
            <div key={s.id} style={{ marginBottom: 6 }}>
              <div className={"tree-row " + (s.id === selSectionId && !selQId ? 'selected' : '')} onClick={() => { setSelSectionId(s.id); setSelQId(null); }}>
                <span className="chev">▾</span>
                <span style={{ flex:1 }}>{i+1}. {s.title}</span>
                <span className="count">{s.questions.length}Q</span>
              </div>
              <div className="tree-children">
                {s.questions.map((q, qi) => (
                  <div key={q.id} className={"tree-row " + (q.id === selQId ? 'selected' : '')} onClick={() => { setSelSectionId(s.id); setSelQId(q.id); }}>
                    <span className="chev" style={{ fontSize: 9 }}>○</span>
                    <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Q{qi+1}. {q.text}</span>
                  </div>
                ))}
                <div className="tree-row" style={{ color:'var(--brand-700)', fontSize:12 }} onClick={()=>addQuestion(s.id)}>+ Add question</div>
              </div>
            </div>
          ))}
        </div>

        {/* CENTER — section canvas */}
        <div className="center">
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            {data.sections.map(s => (
              <div key={s.id} className="section-card" style={{ outline: s.id === selSectionId && !selQId ? '2px solid var(--brand-500)' : 'none' }}>
                <div className="section-head">
                  <span className="grip">⋮⋮</span>
                  <input className="input" style={{ border:'none', padding:'4px 0', fontSize:15, fontWeight:600, flex:1 }} value={s.title} onChange={e=>updateSection(s.id, { title: e.target.value })}/>
                  <button className="btn ghost icon-only sm" style={{ color:'var(--danger)', opacity:0.6 }} title="Delete section"
                    onClick={e=>{ e.stopPropagation(); deleteSection(s.id); }}>✕</button>
                </div>
                <div className="section-body"
                  onDragOver={(e)=>{ if (drag) e.preventDefault(); }}
                  onDrop={(e)=>{ if (drag) { moveQuestion(drag.qId, drag.fromSection, s.id, s.questions.length); setDrag(null); } }}>
                  {s.questions.map((q, qi) => (
                    <div key={q.id}
                      draggable
                      onDragStart={()=>setDrag({ qId: q.id, fromSection: s.id })}
                      onDragEnd={()=>setDrag(null)}
                      onDragOver={(e)=>{ if (drag && drag.qId !== q.id) e.preventDefault(); }}
                      onDrop={(e)=>{ e.stopPropagation(); if (drag) { moveQuestion(drag.qId, drag.fromSection, s.id, qi); setDrag(null); } }}
                      className={"qrow " + (q.id === selQId ? 'selected' : '') + (drag?.qId === q.id ? ' dragging' : '')}
                      onClick={() => { setSelSectionId(s.id); setSelQId(q.id); }}>
                      <div className="qnum">Q{qi+1}</div>
                      <div className="qbody">
                        <div className="qtext">{q.text}</div>
                        <div className="qmeta">
                          <Badge tone="brand">{window.QUESTION_TYPES.find(t=>t.id===q.type)?.label || q.type}</Badge>
                          {q.required && <Badge tone="danger">Required</Badge>}
                          {q.attach?.includes('photo') && <Badge tone="info">📷 Photo</Badge>}
                          {q.attach?.includes('file') && <Badge tone="info">📎 File</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="qrow" style={{ color:'var(--brand-700)', borderStyle:'dashed', borderColor:'var(--n-300)', border:'1px dashed var(--n-300)' }} onClick={()=>addQuestion(s.id)}>
                    <div className="qnum"></div>
                    <div className="qbody"><div className="qtext">+ Add question</div></div>
                  </div>
                </div>
              </div>
            ))}
            <div className="qrow" style={{ justifyContent:'center', color:'var(--brand-700)', background:'var(--n-0)', border:'1px dashed var(--n-300)', cursor:'pointer' }} onClick={addSection}>
              + Add section
            </div>
          </div>
        </div>

        {/* RIGHT — inspector */}
        <div className="right">
          {selQ ? (
            <QuestionInspector q={selQ} onUpdate={updateQ} onAddOption={addOption} onUpdateOption={updateOption} onRemoveOption={removeOption} onDelete={deleteQuestion}/>
          ) : selSection ? (
            <SectionInspector section={selSection} onUpdate={(patch) => updateSection(selSection.id, patch)} onDelete={() => deleteSection(selSection.id)}/>
          ) : (
            <div className="empty">Select a question to edit</div>
          )}
        </div>
      </div>

      {showPublish && <PublishModal form={data} onClose={() => setShowPublish(false)} onDone={() => { setShowPublish(false); onPublish(); }}/>}
      {showFormSettings && <FormSettingsModal data={data} onUpdate={(patch) => setData(d => ({ ...d, ...patch }))} onClose={() => setShowFormSettings(false)}/>}
    </>
  );
}

function SectionInspector({ section, onUpdate, onDelete }) {
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 2 }}>
        <div style={{ fontSize: 11, color:'var(--n-500)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Section</div>
      </div>
      <h3 style={{ margin: '2px 0 16px', fontSize: 16 }}>{section.title}</h3>
      <label className="label">Section title</label>
      <input className="input" value={section.title} onChange={e=>onUpdate({ title: e.target.value })}/>
      <hr className="hr"/>
      <div style={{ fontSize: 12, color:'var(--n-600)', marginBottom: 14 }}>{section.questions.length} questions in this section</div>
      <button className="btn sm" style={{ color:'var(--danger)', border:'1px solid var(--danger)', width:'100%', justifyContent:'center' }} onClick={onDelete}>
        Delete section
      </button>
    </div>
  );
}

function QuestionInspector({ q, onUpdate, onAddOption, onUpdateOption, onRemoveOption, onDelete }) {
  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 11, color:'var(--n-500)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Edit question</div>
        <button className="btn ghost sm" style={{ color:'var(--danger)', padding:'4px 8px', fontSize:12 }} onClick={onDelete}>Delete</button>
      </div>

      <label className="label">Question text</label>
      <textarea className="textarea" rows="2" value={q.text} onChange={e=>onUpdate({ text: e.target.value })}/>

      <div style={{ marginTop: 14 }}>
        <label className="label">Answer type</label>
        <select className="select" value={q.type} onChange={e=>onUpdate({ type: e.target.value })}>
          {window.QUESTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>

      <div style={{ marginTop: 14 }}>
        <label className="label">Required</label>
        <div style={{ padding:'7px 0' }}><Switch on={q.required} onChange={v=>onUpdate({ required: v })}/></div>
      </div>

      {(q.type === 'yes_no_na' || q.type === 'single' || q.type === 'multi') && (
        <div style={{ marginTop: 18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 8 }}>
            <label className="label" style={{ margin: 0 }}>Options &amp; scores</label>
            <Btn size="sm" onClick={onAddOption}>+ Option</Btn>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 70px 28px', gap: 6, fontSize: 10.5, color:'var(--n-500)', textTransform:'uppercase', letterSpacing:'0.05em', padding: '0 4px', marginBottom: 4 }}>
            <span>Colour · Answer</span><span style={{ textAlign:'right' }}>Score</span><span></span>
          </div>
          {q.options?.map(o => (
            <div key={o.id} className="opt-row">
              <div style={{ display:'flex', alignItems:'center', gap: 5 }}>
                <input type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(o.color||'') ? o.color : '#94a3b8'}
                  onChange={e=>onUpdateOption(o.id, { color: e.target.value })}
                  style={{ width:22, height:22, padding:2, border:'1px solid var(--n-300)', borderRadius:4, cursor:'pointer', flexShrink:0 }}
                  title="Choose colour"/>
                <input value={o.color || ''} maxLength={7} placeholder="#hex"
                  onChange={e=>onUpdateOption(o.id, { color: e.target.value })}
                  style={{ width:52, fontFamily:'var(--font-mono)', fontSize:11, padding:'3px 5px', border:'1px solid var(--n-200)', borderRadius:4 }}/>
                <input value={o.label} placeholder="Answer" onChange={e=>onUpdateOption(o.id, { label: e.target.value })} style={{ flex:1, minWidth:0 }}/>
              </div>
              <input type="number" className="score-in" value={o.score ?? ''} placeholder="0" onChange={e=>onUpdateOption(o.id, { score: e.target.value === '' ? null : +e.target.value })}/>
              <button className="btn ghost icon-only sm" onClick={()=>onRemoveOption(o.id)}>✕</button>
            </div>
          ))}
        </div>
      )}

      <hr className="hr"/>

      <label className="label">Attachments frontline can add</label>
      <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
        {[
          { id:'photo', label:'📷 Photo' },
          { id:'file',  label:'📎 File' },
        ].map(a => {
          const on = q.attach?.includes(a.id);
          return <button key={a.id} className={"btn sm " + (on ? 'primary' : '')} onClick={()=>{
            const next = on ? q.attach.filter(x=>x!==a.id) : [...(q.attach||[]), a.id];
            onUpdate({ attach: next });
          }}>{a.label}</button>;
        })}
      </div>

      <hr className="hr"/>
      <label className="label">Mobile preview</label>
      <div style={{ transform: 'scale(0.85)', transformOrigin:'top center', marginTop: -20 }}>
        <PhoneFrame>
          <div style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 11, color:'var(--n-500)' }}>Q · Question</div>
            <div style={{ fontWeight: 600, fontSize: 14, marginTop: 4, marginBottom: 12 }}>{q.text}</div>
            {q.options?.map(o => (
              <div key={o.id} style={{ padding: '10px 12px', border: '1px solid var(--n-200)', borderRadius: 8, marginBottom: 6, display:'flex', alignItems:'center', gap: 8, fontSize: 13 }}>
                <span style={{ width: 14, height: 14, border:'1.5px solid ' + (o.color || 'var(--n-400)'), borderRadius:'50%', background: o.color ? o.color + '33' : 'transparent', flexShrink:0 }}/>
                {o.label}
              </div>
            ))}
            {q.type === 'rating_5' && (
              <div style={{ display:'flex', gap: 6, fontSize: 22, color:'var(--n-300)' }}>{'★★★★★'.split('').map((s,i)=><span key={i}>☆</span>)}</div>
            )}
            {q.attach?.length > 0 && (
              <div style={{ marginTop: 10, padding: 10, border:'1.5px dashed var(--n-300)', borderRadius: 8, textAlign:'center', fontSize: 12, color:'var(--n-500)' }}>
                {q.attach.includes('photo') ? '📷 Tap to add photo' : '📎 Attach file'}
              </div>
            )}
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
}

function PublishModal({ form, onClose, onDone }) {
  return (
    <Modal title="Publish form" onClose={onClose} actions={
      <>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={onDone}>Publish & Map to Project</Btn>
      </>
    }>
      <p style={{ marginTop: 0 }}>Publishing creates v{(parseFloat(form.version.slice(1)) + 0.1).toFixed(1)}. Go to Project Management to assign and enable this form for specific projects.</p>
      <div style={{ display:'grid', gap: 12, marginTop: 12 }}>
        <div>
          <label className="label">Changelog</label>
          <textarea className="textarea" rows="3" placeholder="What changed?"></textarea>
        </div>
        <div>
          <label className="label">Notify</label>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            <Badge tone="brand" dot>HSE Managers</Badge>
            <Badge tone="brand" dot>Site Supervisors</Badge>
            <Badge>+ add group</Badge>
          </div>
        </div>
      </div>
    </Modal>
  );
}

Object.assign(window, { InspectionBuilder });

function FormSettingsModal({ data, onUpdate, onClose }) {
  const captures = data.formCaptures || { timestamp: true, weather: false, deviceId: true };
  function toggle(k) { onUpdate({ formCaptures: { ...captures, [k]: !captures[k] } }); }
  return (
    <Modal title="Form settings" onClose={onClose} actions={<Btn variant="primary" onClick={onClose}>Done</Btn>}>
      <div style={{ marginTop: 0 }}>
        <label className="label">Form metadata</label>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10 }}>
          <div><div className="hint" style={{ marginBottom: 2 }}>Code</div><input className="input" defaultValue={data.code}/></div>
          <div><div className="hint" style={{ marginBottom: 2 }}>Version</div><input className="input" value={data.version} disabled/></div>
        </div>
      </div>
      <hr className="hr"/>
      <label className="label">Automatic captures</label>
      <div className="hint" style={{ marginBottom: 10 }}>These are captured silently on every submission — no per-question toggle needed.</div>
      {[
        { k:'timestamp', icon:'🕑', label:'Timestamp',       desc:'Submit time + time spent filling' },
        { k:'deviceId',  icon:'📱', label:'Device identity', desc:'App version, OS, network state' },
        { k:'weather',   icon:'⛅', label:'Weather snapshot', desc:'Pulled from site weather API' },
      ].map(c => (
        <label key={c.k} style={{ display:'flex', alignItems:'center', gap: 12, padding:'10px 12px', border:'1px solid var(--n-200)', borderRadius: 8, marginBottom: 6, cursor:'pointer' }}>
          <Switch on={captures[c.k]} onChange={() => toggle(c.k)}/>
          <span style={{ fontSize: 18 }}>{c.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{c.label}</div>
            <div style={{ fontSize: 11.5, color:'var(--n-500)' }}>{c.desc}</div>
          </div>
        </label>
      ))}
      <hr className="hr"/>
      <label className="label">Cover & sign-off</label>
      <label style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 6 }}><Switch on={true} onChange={()=>{}}/> Require photo of site before start</label>
      <label style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 6 }}><Switch on={true} onChange={()=>{}}/> Inspector signature on submit</label>
      <label style={{ display:'flex', alignItems:'center', gap: 10 }}><Switch on={false} onChange={()=>{}}/> Counter-sign by Supervisor</label>
    </Modal>
  );
}

Object.assign(window, { FormSettingsModal });
