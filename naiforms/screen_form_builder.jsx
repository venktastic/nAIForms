const FIELD_TYPES = [
  { type: 'yes-no',        label: 'Yes / No',        icon: '◉', color: '#10b981', desc: 'Pass / Fail' },
  { type: 'single-select', label: 'Single Select',   icon: '◎', color: '#6366f1', desc: 'One from list' },
  { type: 'multi-choice',  label: 'Multiple Choice', icon: '☑', color: '#8b5cf6', desc: 'Many from list' },
  { type: 'text',          label: 'Short Text',      icon: 'T',  color: '#0ea5e9', desc: 'Free text' },
  { type: 'number',        label: 'Number',          icon: '#',  color: '#f59e0b', desc: 'Numeric + unit' },
  { type: 'formula',       label: 'Formula',         icon: 'ƒ',  color: '#ec4899', desc: 'Calculated' },
];

function FormBuilder({ form, onBack, onPublish }) {
  const blank = { id: 's0', title: 'Section 1', fields: [] };
  const [data, setData]            = useState(form || { id: 'new-' + Date.now(), name: 'Untitled Form', formType: 'inspection', sections: [blank] });
  const [activeSection, setActive] = useState((form?.sections || [blank])[0]?.id || blank.id);
  const [selectedField, setSelectedField] = useState(null); // { sectionId, fieldId } — inspection only
  const [showPublish, setShowPublish] = useState(false);
  const [drag, setDrag]            = useState(null);
  const [masterTab, setMasterTab]  = useState('all'); // statistics left panel tab

  const isInspection = data.formType !== 'statistics';

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
    const f = buildField(type);
    setData(d => ({ ...d, sections: d.sections.map(s => s.id !== sid ? s : { ...s, fields: [...s.fields, f] }) }));
    return f.id;
  }
  function updateField(sid, fid, patch) {
    setData(d => ({ ...d, sections: d.sections.map(s => s.id !== sid ? s : { ...s, fields: s.fields.map(f => f.id !== fid ? f : { ...f, ...patch }) }) }));
  }
  function removeField(sid, fid) {
    setData(d => ({ ...d, sections: d.sections.map(s => s.id !== sid ? s : { ...s, fields: s.fields.filter(f => f.id !== fid) }) }));
    if (selectedField?.fieldId === fid) setSelectedField(null);
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
        if (s.id === toSid) { const n = [...s.fields]; n.splice(toIdx, 0, field); return { ...s, fields: n }; }
        return s;
      })};
    });
  }

  function addInspectionField() {
    if (!activeSection) return;
    const fid = addField(activeSection, 'yes-no');
    setSelectedField({ sectionId: activeSection, fieldId: fid });
  }
  function addMasterField(mf) {
    if (!activeSection) return;
    const f = {
      id: 'f' + Date.now(),
      name: mf.name,
      source: mf.source,
      srcModule: mf.srcModule || '',
      unit: mf.unit || '',
      formula: mf.formula || '',
      fieldType: mf.source === 'formula' ? 'formula' : 'number',
      required: mf.source === 'user',
    };
    setData(d => ({ ...d, sections: d.sections.map(s => s.id !== activeSection ? s : { ...s, fields: [...s.fields, f] }) }));
  }
  function getSelectedField() {
    if (!selectedField) return null;
    const sec = data.sections.find(s => s.id === selectedField.sectionId);
    return sec?.fields.find(f => f.id === selectedField.fieldId) || null;
  }
  function updateSelectedField(patch) {
    if (!selectedField) return;
    updateField(selectedField.sectionId, selectedField.fieldId, patch);
  }

  const totalFields = data.sections.reduce((n, s) => n + s.fields.length, 0);
  const masterFields = (window.MASTER_FIELDS || []).filter(m => {
    if (masterTab === 'user')    return m.source === 'user';
    if (masterTab === 'formula') return m.source === 'formula';
    return m.source !== 'system';
  });
  const sfData = isInspection ? getSelectedField() : null;

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

        {/* LEFT */}
        <div className="left">
          {isInspection ? (
            <>
              <button className="btn primary" style={{ width:'100%', marginBottom:16, justifyContent:'center' }}
                onClick={addInspectionField}>+ New Field</button>
              <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--n-500)', letterSpacing:'0.06em', marginBottom:6 }}>Field Types</div>
              <div style={{ fontSize:12, color:'var(--n-400)', marginBottom:10 }}>Drag onto a section, or click + to add.</div>
              <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                {FIELD_TYPES.map(ft => (
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
            </>
          ) : (
            <>
              <div style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', color:'var(--n-500)', letterSpacing:'0.06em', marginBottom:8 }}>Master Fields</div>
              <div style={{ display:'flex', gap:4, marginBottom:10 }}>
                {['all','user','formula'].map(t => (
                  <button key={t} onClick={() => setMasterTab(t)}
                    style={{ flex:1, padding:'4px 0', fontSize:11, fontWeight:600, border:`1px solid ${masterTab===t?'var(--brand-500)':'var(--n-200)'}`,
                      borderRadius:6, background: masterTab===t?'var(--brand-50)':'var(--n-0)', color: masterTab===t?'var(--brand-700)':'var(--n-600)', cursor:'pointer' }}>
                    {t.charAt(0).toUpperCase()+t.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {masterFields.map(mf => (
                  <div key={mf.id} className="field-lib-item" style={{ cursor:'pointer' }}
                    draggable onDragStart={() => setDrag({ masterField: mf })} onDragEnd={() => setDrag(null)}>
                    <div className="fi-icon" style={{ background: mf.source==='formula'?'#ec489915':'#10b98115', color: mf.source==='formula'?'#ec4899':'#10b981', fontWeight:700, fontSize:13 }}>
                      {mf.source === 'formula' ? 'ƒ' : '#'}
                    </div>
                    <div className="fi-name">
                      <div style={{ fontWeight:500, fontSize:12 }}>{mf.name}</div>
                      <div style={{ fontSize:10.5, color:'var(--n-400)' }}>{mf.unit}</div>
                    </div>
                    <button className="btn sm" onClick={() => addMasterField(mf)}>+</button>
                  </div>
                ))}
              </div>
            </>
          )}
          <hr className="hr"/>
          <Btn size="sm" style={{ width:'100%' }} onClick={addSection}>+ Add section</Btn>
        </div>

        {/* CENTER */}
        <div className="center">
          <div style={{ maxWidth:720, margin:'0 auto' }}>
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
              <div style={{ fontSize:13, color:'var(--n-500)', marginTop:6, display:'flex', gap:12 }}>
                <span>{data.sections.length} section{data.sections.length !== 1 ? 's' : ''} · {totalFields} field{totalFields !== 1 ? 's' : ''}</span>
                <span style={{ padding:'1px 8px', background: isInspection ? '#6366f115' : '#10b98115', color: isInspection ? '#6366f1' : '#10b981', borderRadius:4, fontSize:11, fontWeight:600 }}>
                  {isInspection ? 'Inspection' : 'Statistics Capture'}
                </span>
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
                  else if (drag?.masterField) { const mf = drag.masterField; setActive(section.id); addMasterField({ ...mf }); setDrag(null); }
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
                      {isInspection ? 'Click "New Field" or drag a field type here' : 'Click + on a master field to add it here'}
                    </div>
                  )}
                  {section.fields.map((field, fi) => isInspection ? (
                    <InspectionFieldRow key={field.id} field={field} FIELD_TYPES={FIELD_TYPES}
                      isSelected={selectedField?.fieldId === field.id}
                      onSelect={() => { setActive(section.id); setSelectedField({ sectionId: section.id, fieldId: field.id }); }}
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
                  ) : (
                    <StatsFieldRow key={field.id} field={field}
                      onUpdate={patch => updateField(section.id, field.id, patch)}
                      onRemove={() => removeField(section.id, field.id)}
                      onDragStart={() => setDrag({ fieldId: field.id, fromSection: section.id })}
                      onDragEnd={() => setDrag(null)}
                      onDragOver={e => { if (drag) e.preventDefault(); }}
                      onDrop={e => {
                        e.stopPropagation();
                        if (drag?.masterField) { addMasterField(drag.masterField); setDrag(null); }
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

        {/* RIGHT */}
        <div className="right">
          {isInspection ? (
            sfData ? (
              <InspectionFieldInspector field={sfData} FIELD_TYPES={FIELD_TYPES}
                onUpdate={updateSelectedField}
                onClose={() => setSelectedField(null)}/>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--n-400)', gap:8, fontSize:13, textAlign:'center', padding:24 }}>
                <div style={{ fontSize:32, opacity:0.3 }}>◎</div>
                <div>Click a field to configure it</div>
                <div style={{ fontSize:11, color:'var(--n-300)' }}>Or click "New Field" to add one</div>
              </div>
            )
          ) : (
            <>
              <div style={{ fontSize:11, color:'var(--n-500)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Mobile preview</div>
              <PhoneFrame>
                <div style={{ padding:'12px 14px' }}>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>{data.name || 'Untitled Form'}</div>
                  {data.sections.map(s => (
                    <div key={s.id} style={{ marginBottom:16 }}>
                      <div style={{ fontSize:11.5, fontWeight:600, color:'var(--n-600)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:8 }}>{s.title}</div>
                      {s.fields.map(f => <StatsFieldPreview key={f.id} field={f}/>)}
                    </div>
                  ))}
                </div>
              </PhoneFrame>
            </>
          )}
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

function InspectionFieldRow({ field, FIELD_TYPES, isSelected, onSelect, onRemove, onDragStart, onDragEnd, onDragOver, onDrop, isDragging }) {
  const ft = FIELD_TYPES.find(t => t.type === field.fieldType) || FIELD_TYPES[0];
  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver} onDrop={onDrop}
      onClick={onSelect}
      style={{ opacity: isDragging ? 0.4 : 1, marginBottom:8, border:`1.5px solid ${isSelected ? 'var(--brand-400)' : 'var(--n-200)'}`,
        borderRadius:8, background: isSelected ? '#eff6ff' : 'var(--n-0)', padding:'10px 12px', cursor:'pointer',
        transition:'border-color 0.1s, background 0.1s' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ color:'var(--n-300)', cursor:'grab', userSelect:'none', fontSize:14 }}
          onMouseDown={e => e.stopPropagation()}>⋮⋮</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:500, fontSize:13.5, color: field.name ? 'var(--n-800)' : 'var(--n-300)', fontStyle: field.name ? 'normal' : 'italic', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {field.name || 'Untitled field'}
          </div>
          <div style={{ display:'flex', gap:8, marginTop:3, alignItems:'center' }}>
            {field.weightage != null && field.weightage > 0 && <span style={{ fontSize:11, color:'var(--n-400)' }}>{field.weightage} pts</span>}
            {field.required && <span style={{ fontSize:11, color:'var(--danger)' }}>Required</span>}
            {field.allowAttachments && <span style={{ fontSize:11, color:'var(--n-400)' }}>📎 Attachments</span>}
          </div>
        </div>
        <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:4, background: ft.color + '1a', color: ft.color, whiteSpace:'nowrap', flexShrink:0 }}>
          {ft.icon} {ft.label}
        </span>
        <button className="btn ghost icon-only sm" style={{ flexShrink:0 }}
          onClick={e => { e.stopPropagation(); onRemove(); }}>✕</button>
      </div>
    </div>
  );
}

function StatsFieldRow({ field, onUpdate, onRemove, onDragStart, onDragEnd, onDragOver, onDrop, isDragging }) {
  const isSystem  = field.source === 'system';
  const isFormula = field.source === 'formula';
  const iconColor = isFormula ? '#ec4899' : isSystem ? 'var(--n-400)' : '#10b981';
  const icon      = isFormula ? 'ƒ' : isSystem ? '⚙' : '#';

  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver} onDrop={onDrop}
      style={{ opacity: isDragging ? 0.4 : 1, marginBottom:8, border:'1px solid var(--n-200)', borderRadius:8,
        background: isSystem ? 'var(--n-50)' : 'var(--n-0)', padding:'10px 12px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ color: isSystem ? 'var(--n-300)' : 'var(--n-400)', cursor: isSystem ? 'not-allowed' : 'grab', userSelect:'none', fontSize:14 }}>⋮⋮</span>
        <div style={{ width:26, height:26, display:'flex', alignItems:'center', justifyContent:'center', background: iconColor + '18', color: iconColor, borderRadius:6, fontSize:13, fontWeight:700, flexShrink:0 }}>
          {icon}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:500, fontSize:13, color: isSystem ? 'var(--n-500)' : 'var(--n-800)' }}>{field.name}</div>
          {isSystem  && <div style={{ fontSize:11, color:'var(--n-400)', marginTop:1 }}>Auto from {field.srcModule}</div>}
          {isFormula && field.formula && <div style={{ fontSize:11, color:'var(--n-400)', marginTop:1, fontFamily:'var(--font-mono)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{field.formula}</div>}
        </div>
        {field.unit && <span style={{ fontSize:11, color:'var(--n-500)', whiteSpace:'nowrap', flexShrink:0 }}>{field.unit}</span>}
        {!isSystem && !isFormula && (
          <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, whiteSpace:'nowrap', userSelect:'none', flexShrink:0 }}>
            <Switch on={field.required} onChange={v => onUpdate({ required: v })}/> Req.
          </label>
        )}
        {(isSystem || isFormula) && (
          <span style={{ fontSize:11, padding:'2px 8px', borderRadius:4, background: isSystem ? 'var(--n-100)' : '#ec489915', color: isSystem ? 'var(--n-500)' : '#ec4899', whiteSpace:'nowrap', flexShrink:0 }}>
            {isSystem ? 'system' : 'formula'}
          </span>
        )}
        <button className="btn ghost icon-only sm" style={{ flexShrink:0, opacity: isSystem ? 0.4 : 1 }}
          title={isSystem ? 'Remove system field' : 'Remove'} onClick={onRemove}>✕</button>
      </div>
    </div>
  );
}

function InspectionFieldInspector({ field, FIELD_TYPES, onUpdate, onClose }) {
  const { useState: useLocalState } = React;
  const [newOpt, setNewOpt] = useLocalState('');
  const ft = FIELD_TYPES.find(t => t.type === field.fieldType) || FIELD_TYPES[0];

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexShrink:0 }}>
        <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:'var(--n-500)', letterSpacing:'0.05em' }}>Field Inspector</div>
        <button className="btn ghost icon-only sm" onClick={onClose} title="Close inspector">✕</button>
      </div>
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:16 }}>

        <div>
          <label className="label">Label</label>
          <input className="input" value={field.name} placeholder="Question / field label"
            onChange={e => onUpdate({ name: e.target.value })}/>
        </div>

        <div>
          <label className="label">Field type</label>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
            {FIELD_TYPES.map(t => (
              <button key={t.type} onClick={() => onUpdate({ fieldType: t.type })}
                style={{ padding:'7px 8px', border:`1.5px solid ${t.type === field.fieldType ? t.color : 'var(--n-200)'}`,
                  borderRadius:8, background: t.type === field.fieldType ? t.color + '18' : 'var(--n-0)',
                  cursor:'pointer', textAlign:'left', display:'flex', alignItems:'center', gap:7 }}>
                <span style={{ width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center',
                  background: t.color + '20', color: t.color, borderRadius:5, fontSize:12, fontWeight:700, flexShrink:0 }}>{t.icon}</span>
                <span style={{ fontSize:11.5, fontWeight:500, color:'var(--n-700)' }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {(field.fieldType === 'single-select' || field.fieldType === 'multi-choice') && (
          <div>
            <label className="label">Choices</label>
            <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:6 }}>
              {(field.options || []).map((opt, oi) => (
                <div key={oi} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <input className="input" style={{ flex:1, fontSize:12 }} value={opt}
                    onChange={e => onUpdate({ options: field.options.map((o, i) => i === oi ? e.target.value : o) })}/>
                  <button className="btn ghost icon-only sm" onClick={() => onUpdate({ options: field.options.filter((_, i) => i !== oi) })}>✕</button>
                </div>
              ))}
            </div>
            <input className="input" style={{ fontSize:12 }} placeholder="Type a choice, press Enter"
              value={newOpt} onChange={e => setNewOpt(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newOpt.trim()) {
                  onUpdate({ options: [...(field.options || []), newOpt.trim()] });
                  setNewOpt('');
                }
              }}/>
          </div>
        )}

        {field.fieldType === 'number' && (
          <div>
            <label className="label">Unit</label>
            <input className="input" style={{ fontSize:12 }} value={field.unit || ''}
              onChange={e => onUpdate({ unit: e.target.value })} placeholder="e.g. kg, hrs, persons"/>
          </div>
        )}

        {field.fieldType === 'text' && (
          <div>
            <label className="label">Placeholder text</label>
            <input className="input" style={{ fontSize:12 }} value={field.placeholder || ''}
              onChange={e => onUpdate({ placeholder: e.target.value })} placeholder="Optional hint text"/>
          </div>
        )}

        {field.fieldType === 'formula' && (
          <div>
            <label className="label">Formula</label>
            <input className="input" style={{ fontSize:12, fontFamily:'var(--font-mono)' }} value={field.formula || ''}
              onChange={e => onUpdate({ formula: e.target.value })}
              placeholder="e.g. (Near Misses × 1,000,000) / Total Manhours"/>
          </div>
        )}

        <div>
          <label className="label">Weightage (pts)</label>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="number" className="input" style={{ width:80 }} min={0} max={100}
              value={field.weightage ?? 0} onChange={e => onUpdate({ weightage: parseInt(e.target.value) || 0 })}/>
            <span style={{ fontSize:12, color:'var(--n-500)' }}>out of 100</span>
          </div>
        </div>

        <div style={{ borderTop:'1px solid var(--n-100)', paddingTop:14, display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:13, fontWeight:500 }}>Required</div>
              <div style={{ fontSize:11, color:'var(--n-400)', marginTop:1 }}>Submitter must answer</div>
            </div>
            <Switch on={!!field.required} onChange={v => onUpdate({ required: v })}/>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontSize:13, fontWeight:500 }}>Allow attachments</div>
              <div style={{ fontSize:11, color:'var(--n-400)', marginTop:1 }}>Photos &amp; documents</div>
            </div>
            <Switch on={!!field.allowAttachments} onChange={v => onUpdate({ allowAttachments: v })}/>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatsFieldPreview({ field }) {
  const isSystem  = field.source === 'system';
  const isFormula = field.source === 'formula';
  return (
    <div style={{ marginBottom:10, padding:'8px 10px', border:'1px solid var(--n-200)', borderRadius:6, background: isSystem ? 'var(--n-50)' : 'var(--n-0)' }}>
      <div style={{ fontSize:11.5, color: isSystem ? 'var(--n-500)' : 'var(--n-700)', marginBottom:4, fontWeight:500 }}>
        {isSystem ? '⚙ ' : isFormula ? 'ƒ ' : ''}{field.name}
        {field.required && !isSystem && <span style={{ color:'var(--danger)', marginLeft:2 }}>*</span>}
      </div>
      {isSystem  && <div style={{ fontSize:11, color:'var(--n-400)' }}>Auto from {field.srcModule}</div>}
      {isFormula && <div style={{ fontSize:11, color:'var(--n-400)', fontFamily:'var(--font-mono)' }}>{field.formula || '—'}</div>}
      {!isSystem && !isFormula && <div style={{ fontSize:12, color:'var(--n-300)' }}>0 {field.unit}</div>}
    </div>
  );
}

Object.assign(window, { FormBuilder });
