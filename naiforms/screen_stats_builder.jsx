// Statistics Capture Builder — field library + sections with drag-drop, new field, new formula
function StatsBuilder({ form, onBack, onPublish }) {
  const [data, setData] = useState(form || window.SAMPLE_STATS);
  const [filter, setFilter] = useState('all');
  const [showPublish, setShowPublish] = useState(false);
  const [showNewFormula, setShowNewFormula] = useState(false);
  const [showNewField, setShowNewField] = useState(false);
  const [masterLibrary, setMasterLibrary] = useState(window.MASTER_FIELDS);
  const [targetSection, setTargetSection] = useState(data.sections[0].id);
  const [drag, setDrag] = useState(null); // {fieldId, fromSection} OR {masterId, master}

  const masterFiltered = masterLibrary.filter(m => {
    if (m.source === 'system') return false;
    if (filter === 'all') return true;
    return m.source === filter;
  });

  const usedIds = new Set(data.sections.flatMap(s => s.fields.map(f => f.masterId)));

  function addFieldToSection(sectionId, master) {
    if ([...usedIds].includes(master.id)) return;
    const newField = { ...master, masterId: master.id, id: master.id + '-' + Date.now(), required: false };
    setData(d => ({ ...d, sections: d.sections.map(s => s.id !== sectionId ? s : { ...s, fields: [...s.fields, newField] })}));
  }
  function removeField(sectionId, fieldId) {
    setData(d => ({ ...d, sections: d.sections.map(s => s.id !== sectionId ? s : { ...s, fields: s.fields.filter(f => f.id !== fieldId) })}));
  }
  function updateField(sectionId, fieldId, patch) {
    setData(d => ({ ...d, sections: d.sections.map(s => s.id !== sectionId ? s : { ...s, fields: s.fields.map(f => f.id !== fieldId ? f : { ...f, ...patch }) })}));
  }
  function moveField(fieldId, fromSection, toSection, toIdx) {
    setData(d => {
      const from = d.sections.find(s => s.id === fromSection);
      const f = from.fields.find(x => x.id === fieldId);
      if (!f) return d;
      return { ...d, sections: d.sections.map(s => {
        if (s.id === fromSection && s.id === toSection) {
          const rem = s.fields.filter(x => x.id !== fieldId);
          rem.splice(Math.min(toIdx, rem.length), 0, f);
          return { ...s, fields: rem };
        }
        if (s.id === fromSection) return { ...s, fields: s.fields.filter(x => x.id !== fieldId) };
        if (s.id === toSection) {
          const ns = [...s.fields];
          ns.splice(Math.min(toIdx, ns.length), 0, f);
          return { ...s, fields: ns };
        }
        return s;
      })};
    });
  }
  function addSection() {
    setData(d => ({ ...d, sections: [...d.sections, { id: 's'+Date.now(), title:'New section', fields: [] }] }));
  }
  function deleteSection(sid) {
    setData(d => ({ ...d, sections: d.sections.filter(s => s.id !== sid) }));
  }
  function addNewFormula(formula) {
    const newMaster = { id: 'm'+Date.now(), name: formula.name, source:'formula', formula: formula.expr };
    setMasterLibrary(l => [...l, newMaster]);
    addFieldToSection(targetSection, newMaster);
  }
  function addNewField(field) {
    const newMaster = { id: 'm'+Date.now(), name: field.name, source: 'user', placeholder: field.placeholder };
    setMasterLibrary(l => [...l, newMaster]);
    addFieldToSection(targetSection, newMaster);
  }

  return (
    <>
      <TopBar crumbs={['Tools','Forms Library', data.name]} actions={
        <>
          <Btn variant="ghost" onClick={onBack}>← Library</Btn>
          <Btn>Save draft</Btn>
          <Btn variant="primary" onClick={()=>setShowPublish(true)}>Publish →</Btn>
        </>
      }/>

      <div className="builder" style={{ gridTemplateColumns: '300px 1fr 320px' }}>
        {/* LEFT — field library */}
        <div className="left">
          <div style={{ fontSize: 11, fontWeight:600, textTransform:'uppercase', color:'var(--n-500)', letterSpacing:'0.06em', marginBottom: 6 }}>Master data fields</div>
          <div className="hint" style={{ marginBottom: 8 }}>Click + to add to selected section, or drag onto canvas.</div>

          <div style={{ display:'flex', gap: 4, marginBottom: 8 }}>
            {[{id:'all',l:'All'},{id:'user',l:'User'},{id:'formula',l:'ƒ Formula'}].map(t => (
              <button key={t.id} className={"btn sm " + (filter===t.id?'primary':'')} onClick={()=>setFilter(t.id)}>{t.l}</button>
            ))}
          </div>
          <input className="input" placeholder="🔍 Search fields…" style={{ marginBottom: 10 }}/>
          <div>
            {masterFiltered.map(m => {
              const isUsed = usedIds.has(m.id);
              return (
                <div key={m.id} className="field-lib-item" style={{ opacity: isUsed ? 0.5 : 1, cursor: isUsed ? 'not-allowed' : 'grab' }}
                  draggable={!isUsed}
                  onDragStart={()=>setDrag({ masterId: m.id, master: m })}
                  onDragEnd={()=>setDrag(null)}>
                  <div className="fi-icon" style={{ background: m.source==='system' ? '#fef3c7' : m.source==='formula' ? '#e0e7ff' : 'var(--brand-50)', color: m.source==='system' ? '#78350f' : m.source==='formula' ? '#4338ca' : 'var(--brand-700)' }}>
                    {m.source==='system' ? '⚙' : m.source==='formula' ? 'ƒ' : '✎'}
                  </div>
                  <div className="fi-name" style={{ minWidth: 0, overflow:'hidden' }}>
                    <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.name}</div>
                    <div style={{ fontSize: 10.5, color:'var(--n-500)', fontWeight:400 }}>
                      {m.source==='system' ? `from ${m.srcModule}` : m.source==='formula' ? 'calculated' : 'user input'} · {m.unit}
                    </div>
                  </div>
                  <button className="btn sm" disabled={isUsed} onClick={() => addFieldToSection(targetSection, m)}>{isUsed ? '✓' : '+'}</button>
                </div>
              );
            })}
          </div>
          <hr className="hr"/>
          <Btn size="sm" style={{ width:'100%', marginBottom: 6 }} onClick={()=>setShowNewField(true)}>+ New data field</Btn>
          <Btn size="sm" style={{ width:'100%' }} onClick={()=>setShowNewFormula(true)}>ƒ New formula</Btn>
        </div>

        {/* CENTER — form canvas */}
        <div className="center">
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div className="section-card" style={{ padding: 20 }}>
              <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                <Badge tone="brand">Statistics</Badge>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                <input className="input lg" style={{ border:'none', borderBottom:'1.5px dashed var(--n-300)', padding:'4px 0', fontSize:20, fontWeight:600, flex:1, background:'transparent', outline:'none' }}
                  value={data.name} onChange={e=>setData(d=>({...d,name:e.target.value}))}
                  onFocus={e=>e.target.style.borderBottomColor='var(--brand-500)'}
                  onBlur={e=>e.target.style.borderBottomColor='var(--n-300)'}/>
                <span style={{ fontSize:14, color:'var(--n-400)', userSelect:'none' }} title="Click name to edit">✏</span>
              </div>
              <div style={{ color:'var(--n-500)', fontSize: 13 }}>Drag fields from the library, or click + on any field to add to the selected section.</div>
            </div>

            {data.sections.map(s => (
              <div key={s.id} className="section-card"
                onDragOver={(e)=>{ if (drag) e.preventDefault(); }}
                onDrop={(e)=>{
                  if (drag?.master) { addFieldToSection(s.id, drag.master); setDrag(null); }
                  else if (drag?.fieldId) { moveField(drag.fieldId, drag.fromSection, s.id, s.fields.length); setDrag(null); }
                }}>
                <div className="section-head" style={{ display:'flex', alignItems:'center', gap: 10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
                    <input className="input" style={{ border:'none', borderBottom:'1px dashed var(--n-300)', padding:'2px 0', fontSize:14, fontWeight:600, flex:1, background:'transparent', outline:'none' }}
                      value={s.title}
                      onChange={e=>setData(d=>({...d,sections:d.sections.map(x=>x.id===s.id?{...x,title:e.target.value}:x)}))}
                      onFocus={e=>e.target.style.borderBottomColor='var(--brand-500)'}
                      onBlur={e=>e.target.style.borderBottomColor='var(--n-300)'}/>
                    <span style={{ fontSize:11, color:'var(--n-400)', userSelect:'none' }}>✏</span>
                  </div>
                  <Badge>{s.fields.length} {s.fields.length === 1 ? 'field' : 'fields'}</Badge>
                  <button className="btn ghost icon-only sm" style={{ color:'var(--danger)', opacity:0.6 }} title="Delete section"
                    onClick={()=>deleteSection(s.id)}>✕</button>
                </div>
                <div className="section-body" style={{ padding: 14, minHeight: 48 }}>
                  {s.fields.length === 0 && (
                    <div style={{ padding: 20, textAlign:'center', color:'var(--n-400)', fontSize: 13, border:'1px dashed var(--n-300)', borderRadius: 8 }}>
                      Drag fields here, or use "+ Field" / "ƒ Formula" above
                    </div>
                  )}
                  {s.fields.map((f, fi) => (
                    <div key={f.id}
                      draggable
                      onDragStart={()=>setDrag({ fieldId: f.id, fromSection: s.id })}
                      onDragEnd={()=>setDrag(null)}
                      onDragOver={(e)=>{ if (drag) e.preventDefault(); }}
                      onDrop={(e)=>{
                        e.stopPropagation();
                        if (drag?.master) { addFieldToSection(s.id, drag.master); setDrag(null); }
                        else if (drag?.fieldId) { moveField(drag.fieldId, drag.fromSection, s.id, fi); setDrag(null); }
                      }}
                      style={{ opacity: drag?.fieldId === f.id ? 0.4 : 1 }}>
                      <StatsFieldRow field={f} onRemove={() => removeField(s.id, f.id)} onUpdate={(patch) => updateField(s.id, f.id, patch)}/>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="qrow" style={{ justifyContent:'center', color:'var(--brand-700)', background:'var(--n-0)', border:'1px dashed var(--n-300)', cursor:'pointer' }} onClick={addSection}>
              + Add section
            </div>
          </div>
        </div>

        {/* RIGHT — preview */}
        <div className="right">
          <div style={{ fontSize: 11, color:'var(--n-500)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom: 8 }}>Mobile preview</div>
          <PhoneFrame>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color:'var(--n-500)' }}>Statistics · Weekly</div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>{data.name}</div>
              {data.sections.map(s => (
                <div key={s.id} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color:'var(--n-600)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom: 8 }}>{s.title}</div>
                  {s.fields.map(f => (
                    <div key={f.id} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color:'var(--n-700)', marginBottom: 4, display:'flex', justifyContent:'space-between' }}>
                        <span>{f.name} {f.required && <span style={{ color:'var(--danger)' }}>*</span>}</span>
                        <span style={{ fontSize: 10, color:'var(--n-500)', fontFamily:'var(--font-mono)' }}>{f.unit}</span>
                      </div>
                      <div style={{ padding: '7px 10px', border:'1px solid var(--n-200)', borderRadius: 6, fontSize: 13, background: f.source !== 'user' ? 'var(--n-50)' : '#fff', color: f.source !== 'user' ? 'var(--n-500)' : 'var(--n-900)' }}>
                        {f.source === 'system' ? `⚙ Auto from ${f.srcModule}` : f.source === 'formula' ? `ƒ ${f.formula || 'calculated'}` : 'Enter value'}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </PhoneFrame>
          <div style={{ marginTop: 14, fontSize: 11.5, color:'var(--n-500)', textAlign:'center' }}>System fields are read-only at fill time</div>
        </div>
      </div>

      {showPublish && <Modal title="Publish statistics form" onClose={()=>setShowPublish(false)} actions={
        <><Btn onClick={()=>setShowPublish(false)}>Cancel</Btn><Btn variant="primary" onClick={()=>{setShowPublish(false); onPublish();}}>Publish & Map to Project</Btn></>
      }>
        <p style={{ marginTop: 0 }}>Publishing makes this form available in the Forms library. Go to Project Management to assign and enable it for specific projects.</p>
      </Modal>}

      {showNewField && <NewFieldModal onClose={()=>setShowNewField(false)} onCreate={(f)=>{ addNewField(f); setShowNewField(false); }} targetName={data.sections.find(s=>s.id===targetSection)?.title}/>}
      {showNewFormula && <NewFormulaModal masterLibrary={masterLibrary} onClose={()=>setShowNewFormula(false)} onCreate={(f)=>{ addNewFormula(f); setShowNewFormula(false); }}/>}
    </>
  );
}

function StatsFieldRow({ field, onRemove, onUpdate }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'20px 1fr auto 100px 30px', gap: 12, alignItems:'center', padding: '10px 8px', border:'1px solid var(--n-200)', borderRadius: 8, marginBottom: 6, background:'var(--n-0)', cursor:'grab' }}>
      <span style={{ color:'var(--n-400)' }}>⋮⋮</span>
      <div>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{field.name}</div>
        {field.source === 'formula' && field.formula && <div style={{ fontSize: 11, color:'var(--n-500)', fontFamily:'var(--font-mono)', marginTop: 2 }}>= {field.formula}</div>}
      </div>
      <div>{field.source === 'formula' && <Badge tone="info">ƒ Formula</Badge>}</div>
      <label style={{ display:'flex', alignItems:'center', gap: 6, fontSize: 12 }}>
        <Switch on={field.required} onChange={v => onUpdate({ required: v })}/>
        Required
      </label>
      <button className="btn ghost icon-only sm" onClick={onRemove}>✕</button>
    </div>
  );
}

function NewFieldModal({ onClose, onCreate, targetName }) {
  const [name, setName] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  return (
    <Modal title="New data field" onClose={onClose} actions={
      <>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" disabled={!name} onClick={()=>onCreate({ name, placeholder })}>Create</Btn>
      </>
    }>
      <label className="label">Field name</label>
      <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Overtime hours" autoFocus/>
      <div style={{ marginTop: 10 }}>
        <label className="label">Placeholder text <span style={{ fontWeight:400, color:'var(--n-400)' }}>(optional)</span></label>
        <input className="input" value={placeholder} onChange={e=>setPlaceholder(e.target.value)} placeholder="e.g. Enter value"/>
      </div>
      <div style={{ marginTop: 10, padding: 10, background:'var(--n-50)', borderRadius: 8, fontSize: 12, color:'var(--n-600)' }}>
        Adds to the master library and drops into section <strong>{targetName}</strong>.
      </div>
    </Modal>
  );
}

function NewFormulaModal({ masterLibrary, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [expr, setExpr] = useState('');
  const numericFields = masterLibrary.filter(m => m.source !== 'formula' && m.unit !== 'text');

  function insert(ref) { setExpr(e => e + (e && !e.endsWith(' ') ? ' ' : '') + ref + ' '); }

  return (
    <Modal title="New formula" onClose={onClose} actions={
      <>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" disabled={!name || !expr} onClick={()=>onCreate({ name, expr })}>Create</Btn>
      </>
    }>
      <label className="label">Formula name</label>
      <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Near-Miss Ratio" autoFocus/>

      <div style={{ marginTop: 14 }}>
        <label className="label">Expression</label>
        <textarea className="textarea" rows="2" style={{ fontFamily:'var(--font-mono)', fontSize: 13 }} value={expr} onChange={e=>setExpr(e.target.value)} placeholder="e.g. (Near Misses × 1,000,000) / Total Manhours"/>
        <div className="hint">Use field names exactly as they appear in the library. Supports + − × ÷ ( ) and constants.</div>
      </div>

      <div style={{ marginTop: 14 }}>
        <label className="label">Insert field</label>
        <div style={{ display:'flex', flexWrap:'wrap', gap: 6, maxHeight: 120, overflow:'auto', padding: 8, background:'var(--n-50)', borderRadius: 8 }}>
          {numericFields.map(m => (
            <button key={m.id} className="btn sm ghost" style={{ background:'#fff', border:'1px solid var(--n-200)' }} onClick={()=>insert(m.name)}>
              {m.source==='system' ? '⚙' : '✎'} {m.name}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap: 6, marginTop: 8 }}>
          {['+','−','×','÷','(',')','1,000,000','200,000'].map(op => (
            <button key={op} className="btn sm" onClick={()=>insert(op)}>{op}</button>
          ))}
        </div>
      </div>

      {expr && (
        <div style={{ marginTop: 14, padding: 12, background:'#eef2ff', borderRadius: 8, fontSize: 12, color:'#3730a3', fontFamily:'var(--font-mono)' }}>
          <div style={{ fontWeight: 600, marginBottom: 4, fontFamily:'var(--font-sans)' }}>Preview</div>
          {name || 'New formula'} = {expr}
        </div>
      )}
    </Modal>
  );
}

Object.assign(window, { StatsBuilder });
