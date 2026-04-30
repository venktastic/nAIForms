// Universal Form Builder — covers inspections, statistics, audits in one builder
function FormBuilder({ form, onBack, onPublish }) {
  const blank = { id: 's0', title: 'Section 1', fields: [] };
  const [data, setData]           = useState(form || { id: 'new-' + Date.now(), name: 'Untitled Form', sections: [blank] });
  const [activeSection, setActive] = useState((form?.sections || [blank])[0]?.id || blank.id);
  const [showPublish, setShowPublish] = useState(false);
  const [drag, setDrag]           = useState(null);

  const TYPES = [
    { type: 'yes-no',        label: 'Yes / No',        icon: '◉', color: '#10b981', desc: 'Pass / Fail' },
    { type: 'single-select', label: 'Single Select',   icon: '◎', color: '#6366f1', desc: 'One from list' },
    { type: 'multi-choice',  label: 'Multiple Choice', icon: '☑', color: '#8b5cf6', desc: 'Many from list' },
    { type: 'text',          label: 'Short Text',      icon: 'T',  color: '#0ea5e9', desc: 'Free text' },
    { type: 'number',        label: 'Number',          icon: '#',  color: '#f59e0b', desc: 'Numeric + unit' },
    { type: 'formula',       label: 'Formula',         icon: 'ƒ',  color: '#ec4899', desc: 'Calculated' },
  ];

  function updateData(patch) { setData(d => ({ ...d, ...patch })); }

  function addSection() {
    const s = { id: 's' + Date.now(), title: 'New Section', fields: [] };
    setData(d => ({ ...d, sections: [...d.sections, s] }));
    setActive(s.id);
  }
  function updateSection(sid, patch) {
    setData(d => ({ ...d, sections: d.sections.map(s => s.id !== sid ? s : { ...s, ...patch }) }));
  }
  function deleteSection(sid) {
    setData(d => {
      const rem = d.sections.filter(s => s.id !== sid);
      if (activeSection === sid) setActive(rem[0]?.id || null);
      return { ...d, sections: rem };
    });
  }

  function buildField(type) {
    const base = { id: 'f' + Date.now(), name: '', fieldType: type, required: false };
    if (type === 'single-select' || type === 'multi-choice') return { ...base, options: ['Option 1', 'Option 2'] };
    if (type === 'number')  return { ...base, unit: '' };
    if (type === 'text')    return { ...base, placeholder: '' };
    if (type === 'formula') return { ...base, formula: '' };
    return base;
  }
  function addField(sid, type) {
    setData(d => ({ ...d, sections: d.sections.map(s => s.id !== sid ? s : { ...s, fields: [...s.fields, buildField(type)] }) }));
  }
  function updateField(sid, fid, patch) {
    setData(d => ({ ...d, sections: d.sections.map(s => s.id !== sid ? s : { ...s, fields: s.fields.map(f => f.id !== fid ? f : { ...f, ...patch }) }) }));
  }
  function removeField(sid, fid) {
    setData(d => ({ ...d, sections: d.sections.map(s => s.id !== sid ? s : { ...s, fields: s.fields.filter(f => f.id !== fid) }) }));
  }
  function moveField(fid, fromSid, toSid, toIdx) {
    setData(d => {
      const field = d.sections.find(s => s.id === fromSid)?.fields.find(f => f.id === fid);
      if (!field) return d;
      return { ...d, sections: d.sections.map(s => {
        if (s.id === fromSid && s.id === toSid) {
          const r = s.fields.filter(f => f.id !== fid); r.splice(toIdx, 0, field); return { ...s, fields: r };
        }
        if (s.id === fromSid) return { ...s, fields: s.fields.filter(f => f.id !== fid) };
        if (s.id === toSid)   { const n = [...s.fields]; n.splice(toIdx, 0, field); return { ...s, fields: n }; }
        return s;
      })};
    });
  }

  const totalFields = data.sections.reduce((n, s) => n + s.fields.length, 0);

  return (
    <>
      <TopBar crumbs={['Forms', data.name || 'Untitled Form']} actions={
        <>
          <Btn variant="ghost" onClick={onBack}>← Library</Btn>
          <Btn>Save draft</Btn>
          <Btn variant="primary" onClick={() => setShowPublish(true)}>Publish →</Btn>
        </>
      }/>

      <div className="builder" style={{ gridTemplateColumns: '240px 1fr 300px' }}>

        {/* LEFT — type picker */}
        <div className="left">
          <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--n-500)', letterSpacing:'0.06em', marginBottom:8 }}>Field Types</div>
          <div style={{ fontSize:12, color:'var(--n-400)', marginBottom:12 }}>Click + or drag onto a section.</div>

          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--n-600)', marginBottom:4 }}>Target section</div>
            <select className="input" style={{ fontSize:12 }} value={activeSection || ''} onChange={e => setActive(e.target.value)}>
              {data.sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {TYPES.map(ft => (
              <div key={ft.type} className="field-lib-item"
                draggable onDragStart={() => setDrag({ fieldType: ft.type })} onDragEnd={() => setDrag(null)}>
                <div className="fi-icon" style={{ background: ft.color + '1a', color: ft.color, fontWeight:700, fontSize:13 }}>{ft.icon}</div>
                <div className="fi-name">
                  <div style={{ fontWeight:500, fontSize:13 }}>{ft.label}</div>
                  <div style={{ fontSize:10.5, color:'var(--n-400)', fontWeight:400 }}>{ft.desc}</div>
                </div>
                <button className="btn sm" onClick={() => activeSection && addField(activeSection, ft.type)}>+</button>
              </div>
            ))}
          </div>

          <hr className="hr"/>
          <Btn size="sm" style={{ width:'100%' }} onClick={addSection}>+ Add section</Btn>
        </div>

        {/* CENTER — canvas */}
        <div className="center">
          <div style={{ maxWidth:720, margin:'0 auto' }}>

            {/* Form name */}
            <div className="section-card" style={{ padding:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <input className="input lg"
                  style={{ border:'none', borderBottom:'1.5px dashed var(--n-300)', padding:'4px 0', fontSize:22, fontWeight:700, flex:1, background:'transparent', outline:'none' }}
                  value={data.name} placeholder="Form name"
                  onChange={e => updateData({ name: e.target.value })}
                  onFocus={e => e.target.style.borderBottomColor='var(--brand-500)'}
                  onBlur={e => e.target.style.borderBottomColor='var(--n-300)'}/>
                <span style={{ fontSize:13, color:'var(--n-400)' }}>✏</span>
              </div>
              <div style={{ fontSize:13, color:'var(--n-500)', marginTop:6 }}>
                {data.sections.length} section{data.sections.length !== 1 ? 's' : ''} · {totalFields} field{totalFields !== 1 ? 's' : ''}
              </div>
            </div>

            {data.sections.length === 0 && (
              <div className="qrow" style={{ justifyContent:'center', color:'var(--n-400)', background:'var(--n-0)', border:'1px dashed var(--n-300)', cursor:'pointer' }} onClick={addSection}>
                + Add your first section
              </div>
            )}

            {data.sections.map(section => (
              <div key={section.id} className="section-card"
                style={{ outline: activeSection === section.id ? '2px solid var(--brand-200)' : 'none', cursor:'default' }}
                onClick={() => setActive(section.id)}
                onDragOver={e => { if (drag) e.preventDefault(); }}
                onDrop={e => {
                  if (drag?.fieldType) { addField(section.id, drag.fieldType); setDrag(null); }
                  else if (drag?.fieldId) { moveField(drag.fieldId, drag.fromSection, section.id, section.fields.length); setDrag(null); }
                }}>

                <div className="section-head" style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
                    <input className="input"
                      style={{ border:'none', borderBottom:'1px dashed var(--n-300)', padding:'2px 0', fontSize:14, fontWeight:600, flex:1, background:'transparent', outline:'none' }}
                      value={section.title}
                      onChange={e => updateSection(section.id, { title: e.target.value })}
                      onFocus={e => e.target.style.borderBottomColor='var(--brand-500)'}
                      onBlur={e => e.target.style.borderBottomColor='var(--n-300)'}
                      onClick={e => e.stopPropagation()}/>
                    <span style={{ fontSize:11, color:'var(--n-400)' }}>✏</span>
                  </div>
                  <Badge>{section.fields.length} {section.fields.length === 1 ? 'field' : 'fields'}</Badge>
                  <button className="btn ghost icon-only sm" style={{ color:'var(--danger)', opacity:0.6 }}
                    title="Delete section" onClick={e => { e.stopPropagation(); deleteSection(section.id); }}>✕</button>
                </div>

                <div className="section-body" style={{ padding:14, minHeight:56 }}>
                  {section.fields.length === 0 && (
                    <div style={{ padding:20, textAlign:'center', color:'var(--n-400)', fontSize:13, border:'1px dashed var(--n-300)', borderRadius:8 }}>
                      Drag a field type here, or select this section and click + on any type
                    </div>
                  )}
                  {section.fields.map((field, fi) => (
                    <UniversalFieldRow key={field.id} field={field} TYPES={TYPES}
                      onUpdate={patch => updateField(section.id, field.id, patch)}
                      onRemove={() => removeField(section.id, field.id)}
                      onDragStart={() => setDrag({ fieldId: field.id, fromSection: section.id })}
                      onDragEnd={() => setDrag(null)}
                      onDragOver={e => { if (drag) e.preventDefault(); }}
                      onDrop={e => {
                        e.stopPropagation();
                        if (drag?.fieldType) { addField(section.id, drag.fieldType); setDrag(null); }
                        else if (drag?.fieldId) { moveField(drag.fieldId, drag.fromSection, section.id, fi); setDrag(null); }
                      }}
                      isDragging={drag?.fieldId === field.id}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — mobile preview */}
        <div className="right">
          <div style={{ fontSize:11, color:'var(--n-500)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Mobile preview</div>
          <PhoneFrame>
            <div style={{ padding:'12px 14px' }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>{data.name || 'Untitled Form'}</div>
              {data.sections.map(s => (
                <div key={s.id} style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11.5, fontWeight:600, color:'var(--n-600)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:8 }}>{s.title}</div>
                  {s.fields.map(f => <FormFieldPreview key={f.id} field={f}/>)}
                </div>
              ))}
            </div>
          </PhoneFrame>
        </div>
      </div>

      {showPublish && (
        <Modal title="Publish form" onClose={() => setShowPublish(false)} actions={
          <>
            <Btn onClick={() => setShowPublish(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={() => { setShowPublish(false); onPublish(); }}>Publish & Map to Project</Btn>
          </>
        }>
          <p style={{ marginTop:0 }}>Publishing makes this form available in the library. Go to Project Management to assign it to specific projects.</p>
          <div style={{ padding:12, background:'var(--n-50)', borderRadius:8, fontSize:13, color:'var(--n-600)' }}>
            <strong>{totalFields} fields</strong> across <strong>{data.sections.length} sections</strong>
          </div>
        </Modal>
      )}
    </>
  );
}

function UniversalFieldRow({ field, TYPES, onUpdate, onRemove, onDragStart, onDragEnd, onDragOver, onDrop, isDragging }) {
  const [newOpt, setNewOpt] = useState('');
  const ft = TYPES.find(t => t.type === field.fieldType) || TYPES[0];

  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver} onDrop={onDrop}
      style={{ opacity: isDragging ? 0.4 : 1, marginBottom:8, border:'1px solid var(--n-200)', borderRadius:8, background:'var(--n-0)', padding:'10px 12px' }}>

      {/* Name row */}
      <div style={{ display:'grid', gridTemplateColumns:'20px 1fr auto auto 30px', gap:10, alignItems:'center' }}>
        <span style={{ color:'var(--n-400)', cursor:'grab', userSelect:'none' }}>⋮⋮</span>
        <input className="input"
          style={{ border:'none', borderBottom:'1px dashed var(--n-200)', padding:'2px 0', fontSize:13.5, fontWeight:500, background:'transparent', outline:'none' }}
          value={field.name} placeholder="Question / field label"
          onChange={e => onUpdate({ name: e.target.value })}
          onFocus={e => e.target.style.borderBottomColor='var(--brand-500)'}
          onBlur={e => e.target.style.borderBottomColor='var(--n-200)'}/>
        <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:4, background: ft.color + '1a', color: ft.color, whiteSpace:'nowrap' }}>
          {ft.icon} {ft.label}
        </span>
        <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, whiteSpace:'nowrap', userSelect:'none' }}>
          <Switch on={field.required} onChange={v => onUpdate({ required: v })}/> Req.
        </label>
        <button className="btn ghost icon-only sm" onClick={onRemove}>✕</button>
      </div>

      {/* Type-specific config */}
      {(field.fieldType === 'single-select' || field.fieldType === 'multi-choice') && (
        <div style={{ marginTop:8, paddingLeft:30, display:'flex', flexWrap:'wrap', gap:5, alignItems:'center' }}>
          {(field.options || []).map((opt, oi) => (
            <span key={oi} style={{ display:'flex', alignItems:'center', gap:4, background:'var(--n-100)', borderRadius:4, padding:'2px 8px', fontSize:12 }}>
              {opt}
              <button style={{ border:'none', background:'none', cursor:'pointer', color:'var(--n-400)', fontSize:11, padding:'0 1px', lineHeight:1 }}
                onClick={() => onUpdate({ options: field.options.filter((_, i) => i !== oi) })}>✕</button>
            </span>
          ))}
          <input className="input" style={{ width:110, fontSize:12, padding:'2px 6px' }}
            placeholder="+ Add option" value={newOpt} onChange={e => setNewOpt(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newOpt.trim()) {
                onUpdate({ options: [...(field.options || []), newOpt.trim()] });
                setNewOpt('');
              }
            }}/>
        </div>
      )}

      {field.fieldType === 'number' && (
        <div style={{ marginTop:8, paddingLeft:30, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:12, color:'var(--n-500)' }}>Unit:</span>
          <input className="input" style={{ width:110, fontSize:12, padding:'2px 6px' }}
            value={field.unit || ''} onChange={e => onUpdate({ unit: e.target.value })} placeholder="e.g. kg, hrs, persons"/>
        </div>
      )}

      {field.fieldType === 'text' && (
        <div style={{ marginTop:8, paddingLeft:30 }}>
          <input className="input" style={{ fontSize:12, padding:'2px 6px' }}
            value={field.placeholder || ''} onChange={e => onUpdate({ placeholder: e.target.value })} placeholder="Placeholder text (optional)"/>
        </div>
      )}

      {field.fieldType === 'formula' && (
        <div style={{ marginTop:8, paddingLeft:30 }}>
          <input className="input" style={{ fontSize:12, fontFamily:'var(--font-mono)', padding:'2px 6px' }}
            value={field.formula || ''} onChange={e => onUpdate({ formula: e.target.value })}
            placeholder="e.g. (Near Misses × 1,000,000) / Total Manhours"/>
        </div>
      )}
    </div>
  );
}

function FormFieldPreview({ field }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontSize:12, color:'var(--n-700)', marginBottom:4 }}>
        {field.name || <span style={{ color:'var(--n-300)', fontStyle:'italic' }}>Untitled field</span>}
        {field.required && <span style={{ color:'var(--danger)', marginLeft:2 }}>*</span>}
      </div>
      {field.fieldType === 'yes-no' && (
        <div style={{ display:'flex', gap:6 }}>
          {['Yes','No','N/A'].map(o => (
            <div key={o} style={{ padding:'4px 12px', border:'1px solid var(--n-200)', borderRadius:6, fontSize:12, color:'var(--n-600)' }}>{o}</div>
          ))}
        </div>
      )}
      {(field.fieldType === 'single-select' || field.fieldType === 'multi-choice') && (
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {(field.options || ['Option 1']).map((opt, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 8px', border:'1px solid var(--n-200)', borderRadius:6, fontSize:12, color:'var(--n-600)' }}>
              <div style={{ width:12, height:12, borderRadius: field.fieldType === 'multi-choice' ? 2 : '50%', border:'1.5px solid var(--n-300)', flexShrink:0 }}/>
              {opt}
            </div>
          ))}
        </div>
      )}
      {field.fieldType === 'text' && (
        <div style={{ padding:'6px 10px', border:'1px solid var(--n-200)', borderRadius:6, fontSize:12, color:'var(--n-400)' }}>
          {field.placeholder || 'Enter text…'}
        </div>
      )}
      {field.fieldType === 'number' && (
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ padding:'6px 10px', border:'1px solid var(--n-200)', borderRadius:6, fontSize:12, color:'var(--n-400)', flex:1 }}>0</div>
          {field.unit && <span style={{ fontSize:11, color:'var(--n-500)' }}>{field.unit}</span>}
        </div>
      )}
      {field.fieldType === 'formula' && (
        <div style={{ padding:'6px 10px', border:'1px solid var(--n-100)', borderRadius:6, fontSize:12, color:'var(--n-400)', background:'var(--n-50)', fontFamily:'var(--font-mono)' }}>
          ƒ {field.formula || 'calculated'}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { FormBuilder });
