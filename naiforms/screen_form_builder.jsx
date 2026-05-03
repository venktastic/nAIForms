const FIELD_TYPES = [
  { type: 'yes-no-na',     label: 'Yes / No / NA',  icon: '◉', color: '#10b981' },
  { type: 'single-select', label: 'Single Select',   icon: '◎', color: '#6366f1' },
  { type: 'multi-choice',  label: 'Multi Choice',    icon: '☑', color: '#8b5cf6' },
  { type: 'number',        label: 'Number',          icon: '#',  color: '#f59e0b' },
  { type: 'text',          label: 'Text',            icon: 'T',  color: '#0ea5e9' },
  { type: 'formula',       label: 'Formula',         icon: 'ƒ',  color: '#ec4899' },
  { type: 'attachment',    label: 'Attachments',     icon: '📎', color: '#64748b' },
];

const INSP_TYPES  = FIELD_TYPES.filter(t => ['yes-no-na','single-select','multi-choice','number','text'].includes(t.type));
const STATS_TYPES = FIELD_TYPES.filter(t => ['number','text'].includes(t.type));

function FormBuilder({ form, onBack, onPublish }) {
  const blank = { id: 's0', title: 'Section 1', fields: [] };
  const [data, setData]              = useState(form || { id: 'new-' + Date.now(), name: 'Untitled Form', formType: 'inspection', sections: [blank] });
  const [activeSection, setActive]   = useState((form?.sections || [blank])[0]?.id || blank.id);
  const [expandedField, setExpanded] = useState(null);
  const [showPublish, setShowPublish]= useState(false);
  const [publishProjects, setPublishProjects] = useState(new Set());
  const [drag, setDrag]              = useState(null);
  const [masterTab, setMasterTab]    = useState('all');
  const [masterSearch, setMasterSearch] = useState('');

  const isInspection = data.formType !== 'statistics';
  const isViewMode   = data.status === 'published';

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
  function addBlankField(sid, type, overrides) {
    const base = { id: 'f' + Date.now(), name: '', fieldType: type, required: false, ...overrides };
    if (type === 'single-select' || type === 'multi-choice') base.options = ['Option 1', 'Option 2'];
    if (type === 'number')     base.unit = '';
    if (type === 'text')       base.placeholder = '';
    if (type === 'formula')    base.formula = '';
    if (type === 'attachment') base.name = 'Attachments';
    setData(d => ({ ...d, sections: d.sections.map(s => s.id !== sid ? s : { ...s, fields: [...s.fields, base] }) }));
    if (type !== 'attachment') setExpanded(base.id);
  }
  function addMasterField(mf, sid) {
    const target = sid || activeSection;
    if (!target) return;
    const f = {
      id: 'f' + Date.now(), name: mf.name, source: mf.source,
      srcModule: mf.srcModule || '', unit: mf.unit || '', formula: mf.formula || '',
      fieldType: mf.source === 'formula' ? 'formula' : 'number', required: mf.source === 'user',
    };
    setData(d => ({ ...d, sections: d.sections.map(s => s.id !== target ? s : { ...s, fields: [...s.fields, f] }) }));
    setExpanded(f.id);
  }
  function updateField(sid, fid, patch) {
    setData(d => ({ ...d, sections: d.sections.map(s => s.id !== sid ? s : { ...s, fields: s.fields.map(f => f.id !== fid ? f : { ...f, ...patch }) }) }));
  }
  function removeField(sid, fid) {
    if (expandedField === fid) setExpanded(null);
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
  const masterFields = (window.MASTER_FIELDS || [])
    .filter(m => {
      if (masterTab === 'user')    return m.source === 'user';
      if (masterTab === 'formula') return m.source === 'formula';
      return m.source !== 'system';
    })
    .filter(m => !masterSearch || m.name.toLowerCase().includes(masterSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const cols = (!isInspection && !isViewMode) ? '240px 1fr 300px' : '1fr 300px';

  return (
    <>
      <TopBar crumbs={['Workflows', data.name || 'Untitled Workflow']} actions={
        isViewMode ? (
          <>
            <Btn variant="ghost" onClick={onBack}>← Library</Btn>
            <span style={{ fontSize:12, color:'var(--n-500)', padding:'4px 12px', borderRadius:6,
              border:'1px solid var(--n-200)', background:'var(--n-50)' }}>View only</span>
          </>
        ) : (
          <>
            <Btn variant="ghost" onClick={onBack}>← Library</Btn>
            {isInspection && (
              <Btn onClick={() => activeSection && addBlankField(activeSection, 'yes-no-na')}>+ New Field</Btn>
            )}
            <Btn>Save draft</Btn>
            <Btn variant="primary" onClick={() => setShowPublish(true)}>Publish →</Btn>
          </>
        )
      }/>

      <div className="builder" style={{ gridTemplateColumns: cols }}>

        {/* ── LEFT PANEL (Statistics only, edit mode only) ── */}
        {!isInspection && !isViewMode && (
          <div className="left">
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:'var(--n-500)', letterSpacing:'0.06em', marginBottom:10 }}>
              Master Fields
            </div>

            <div style={{ display:'flex', gap:3, marginBottom:8 }}>
              {['all','user','formula'].map(t => (
                <button key={t} onClick={() => setMasterTab(t)}
                  style={{ flex:1, padding:'4px 0', fontSize:11, fontWeight:600, border:`1px solid ${masterTab===t?'var(--brand-500)':'var(--n-200)'}`,
                    borderRadius:6, background:masterTab===t?'var(--brand-50)':'var(--n-0)',
                    color:masterTab===t?'var(--brand-700)':'var(--n-600)', cursor:'pointer' }}>
                  {t.charAt(0).toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>

            {/* Add new field / formula CTAs */}
            {masterTab === 'user' && (
              <button className="btn" style={{ width:'100%', marginBottom:6, fontSize:12 }}
                onClick={() => activeSection && addBlankField(activeSection, 'number', { source:'user' })}>
                + New Field
              </button>
            )}
            {masterTab === 'formula' && (
              <button className="btn" style={{ width:'100%', marginBottom:6, fontSize:12, color:'#ec4899', borderColor:'#ec489960' }}
                onClick={() => activeSection && addBlankField(activeSection, 'formula', { source:'formula' })}>
                ƒ New Formula
              </button>
            )}

            {/* Search */}
            <input className="input" style={{ fontSize:12, marginBottom:8, padding:'5px 8px' }}
              placeholder="🔍 Search fields…"
              value={masterSearch} onChange={e => setMasterSearch(e.target.value)}/>

            <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:12, overflowY:'auto', maxHeight:'calc(100vh - 360px)' }}>
              {masterFields.map(mf => (
                <div key={mf.id} className="field-lib-item"
                  draggable onDragStart={() => setDrag({ masterField: mf })} onDragEnd={() => setDrag(null)}>
                  <div className="fi-icon" style={{ background: mf.source==='formula'?'#ec489915':'#10b98115', color: mf.source==='formula'?'#ec4899':'#10b981', fontWeight:700, fontSize:12 }}>
                    {mf.source === 'formula' ? 'ƒ' : '#'}
                  </div>
                  <div className="fi-name">
                    <div style={{ fontWeight:500, fontSize:12 }}>{mf.name}</div>
                    <div style={{ fontSize:10.5, color:'var(--n-400)' }}>{mf.unit}</div>
                  </div>
                  <button className="btn sm" onClick={() => addMasterField(mf)}>+</button>
                </div>
              ))}
              {masterFields.length === 0 && (
                <div style={{ fontSize:12, color:'var(--n-300)', textAlign:'center', padding:12 }}>No fields</div>
              )}
            </div>

          </div>
        )}

        {/* ── CANVAS ── */}
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
              <div style={{ fontSize:13, color:'var(--n-500)', marginTop:6, display:'flex', gap:12, alignItems:'center' }}>
                <span>{data.sections.length} section{data.sections.length!==1?'s':''} · {totalFields} field{totalFields!==1?'s':''}</span>
                <span style={{ padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:600,
                  background:isInspection?'#6366f115':'#10b98115', color:isInspection?'#6366f1':'#10b981' }}>
                  {isInspection ? 'Inspection' : 'Statistics Capture'}
                </span>
              </div>
            </div>

            {data.sections.map(section => (
              <div key={section.id} className="section-card"
                style={{ outline: activeSection===section.id?'2px solid var(--brand-200)':'none' }}
                onClick={() => setActive(section.id)}
                onDragOver={e => { if (drag) e.preventDefault(); }}
                onDrop={e => {
                  if (drag?.masterField) { addMasterField(drag.masterField, section.id); setDrag(null); }
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
                  <Badge>{section.fields.length} {section.fields.length===1?'field':'fields'}</Badge>
                  <button className="btn ghost icon-only sm" style={{ color:'var(--danger)', opacity:0.6 }}
                    onClick={e => { e.stopPropagation(); deleteSection(section.id); }}>✕</button>
                </div>

                <div className="section-body" style={{ padding:14, minHeight:40 }}>
                  {section.fields.map((field, fi) => (
                    <FieldRow key={field.id} field={field}
                      availableTypes={isInspection ? INSP_TYPES : STATS_TYPES}
                      isExpanded={expandedField === field.id}
                      isInspection={isInspection}
                      onToggle={() => setExpanded(expandedField===field.id ? null : field.id)}
                      onUpdate={patch => updateField(section.id, field.id, patch)}
                      onRemove={() => removeField(section.id, field.id)}
                      onDragStart={() => setDrag({ fieldId: field.id, fromSection: section.id })}
                      onDragEnd={() => setDrag(null)}
                      onDragOver={e => { if (drag?.fieldId) e.preventDefault(); }}
                      onDrop={e => {
                        e.stopPropagation();
                        if (drag?.fieldId) { moveField(drag.fieldId, drag.fromSection, section.id, fi); setDrag(null); }
                      }}
                      isDragging={drag?.fieldId === field.id}
                    />
                  ))}

                  {section.fields.length === 0 && (
                    <div style={{ padding:16, textAlign:'center', color:'var(--n-400)', fontSize:12, border:'1px dashed var(--n-300)', borderRadius:8 }}>
                      {isInspection ? 'Click "+ New Field" in the toolbar above' : 'Add fields from the master panel on the left'}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button onClick={addSection}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%',
                margin:'4px 0 24px', padding:'12px 20px', border:'1.5px dashed var(--n-300)', borderRadius:10,
                background:'transparent', color:'var(--n-500)', fontSize:13, fontWeight:500, cursor:'pointer' }}
              onMouseOver={e => e.currentTarget.style.borderColor='var(--brand-400)'}
              onMouseOut={e => e.currentTarget.style.borderColor='var(--n-300)'}>
              + Add Section
            </button>

          </div>
        </div>

        {/* ── MOBILE PREVIEW ── */}
        <div className="right">
          <div style={{ fontSize:11, color:'var(--n-500)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>
            Mobile preview
          </div>
          <PhoneFrame>
            <div style={{ padding:'12px 14px' }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>{data.name || 'Untitled Form'}</div>
              {data.sections.map(s => (
                <div key={s.id} style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11.5, fontWeight:600, color:'var(--n-600)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:8 }}>
                    {s.title}
                  </div>
                  {s.fields.map(f => <FieldPreview key={f.id} field={f}/>)}
                </div>
              ))}
            </div>
          </PhoneFrame>
        </div>

      </div>

      {showPublish && (() => {
        const allProjects = [];
        (window.ORG_HIERARCHY || []).forEach(org =>
          org.subsidiaries.forEach(sub =>
            sub.projects.forEach(proj => allProjects.push({ id: proj.id, name: proj.name, sub: sub.name }))
          )
        );
        function closePublish() { setShowPublish(false); setPublishProjects(new Set()); }
        function confirmPublish() {
          const formId = data.id;
          (window.ORG_HIERARCHY || []).forEach(org =>
            org.subsidiaries.forEach(sub =>
              sub.projects.forEach(proj => {
                if (publishProjects.has(proj.id) && !proj.forms.some(a => a.formId === formId))
                  proj.forms.push({ formId });
              })
            )
          );
          closePublish();
          onPublish();
        }
        function toggleProject(id) {
          setPublishProjects(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
        }
        return (
          <Modal title="Publish workflow" onClose={closePublish} actions={
            <>
              <Btn onClick={closePublish}>Cancel</Btn>
              <Btn variant="primary" onClick={confirmPublish}>
                Publish{publishProjects.size > 0 ? ` on ${publishProjects.size} project${publishProjects.size > 1 ? 's' : ''}` : ''}
              </Btn>
            </>
          }>
            <p style={{ marginTop:0, fontSize:13, color:'var(--n-600)' }}>
              Select the projects where this workflow will be active.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:300, overflowY:'auto' }}>
              {allProjects.length === 0 && (
                <div style={{ fontSize:13, color:'var(--n-400)', textAlign:'center', padding:16 }}>No projects found</div>
              )}
              {allProjects.map(proj => (
                <label key={proj.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                  border:`1px solid ${publishProjects.has(proj.id)?'var(--brand-400)':'var(--n-200)'}`, borderRadius:8, cursor:'pointer',
                  background: publishProjects.has(proj.id) ? 'var(--brand-50)' : 'var(--n-0)' }}>
                  <input type="checkbox" checked={publishProjects.has(proj.id)} onChange={() => toggleProject(proj.id)}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:publishProjects.has(proj.id)?600:400 }}>{proj.name}</div>
                    <div style={{ fontSize:11, color:'var(--n-400)' }}>{proj.sub}</div>
                  </div>
                  {publishProjects.has(proj.id) && <Badge tone="success">Active</Badge>}
                </label>
              ))}
            </div>
            <div style={{ marginTop:8, display:'flex', gap:12 }}>
              <button style={{ fontSize:12, color:'var(--brand-600)', background:'none', border:'none', cursor:'pointer', padding:0 }}
                onClick={() => setPublishProjects(new Set(allProjects.map(p => p.id)))}>Select all</button>
              <button style={{ fontSize:12, color:'var(--n-500)', background:'none', border:'none', cursor:'pointer', padding:0 }}
                onClick={() => setPublishProjects(new Set())}>Clear</button>
            </div>
          </Modal>
        );
      })()}
    </>
  );
}

function FieldRow({ field, availableTypes, isExpanded, isInspection, onToggle, onUpdate, onRemove, onDragStart, onDragEnd, onDragOver, onDrop, isDragging }) {
  const [newOpt, setNewOpt] = useState('');
  const ft = FIELD_TYPES.find(t => t.type === field.fieldType) || FIELD_TYPES[0];
  const isSystem     = field.source === 'system';
  const isFormula    = field.fieldType === 'formula';
  const isAttachment = field.fieldType === 'attachment';
  const isDecimal    = field.numericType === 'decimal';

  function addChoice() {
    const val = newOpt.trim() || `Option ${(field.options||[]).length + 1}`;
    onUpdate({ options: [...(field.options||[]), val] });
    setNewOpt('');
  }

  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver} onDrop={onDrop}
      style={{ opacity:isDragging?0.4:1, marginBottom:8, border:`1.5px solid ${isExpanded?'var(--brand-400)':'var(--n-200)'}`,
        borderRadius:10, background:isSystem?'var(--n-50)':isExpanded?'#f8faff':'var(--n-0)',
        transition:'border-color 0.12s, background 0.12s', overflow:'hidden' }}>

      {/* ── ROW HEADER ── */}
      <div onClick={isAttachment ? undefined : onToggle}
        style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', cursor:isAttachment?'default':'pointer', userSelect:'none' }}>
        <span style={{ color:'var(--n-300)', cursor:'grab', fontSize:14, flexShrink:0 }}
          onMouseDown={e => e.stopPropagation()}>⋮⋮</span>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:500, fontSize:13.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            color:field.name?'var(--n-800)':'var(--n-300)', fontStyle:field.name?'normal':'italic' }}>
            {isSystem && <span style={{ marginRight:4, color:'var(--n-400)' }}>⚙</span>}
            {isFormula && !isSystem && <span style={{ marginRight:4, color:'#ec4899' }}>ƒ</span>}
            {isAttachment && <span style={{ marginRight:4 }}>📎</span>}
            {field.name || 'Untitled field'}
          </div>
          <div style={{ display:'flex', gap:10, marginTop:2, fontSize:11, color:'var(--n-400)', flexWrap:'wrap' }}>
            {isSystem  && <span>Auto from {field.srcModule}</span>}
            {field.unit && <span>{field.unit}</span>}
            {field.required && <span style={{ color:'var(--danger)' }}>Required</span>}
            {isInspection && field.weightage != null && field.weightage !== 0 && <span>{field.weightage > 0 ? '+' : ''}{field.weightage} pts</span>}
            {isInspection && field.allowAttachments && <span>📎 Attachments</span>}
          </div>
        </div>
        <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:4, flexShrink:0,
          background:ft.color+'1a', color:ft.color, whiteSpace:'nowrap' }}>
          {ft.icon} {ft.label}{field.fieldType==='number'&&isDecimal?' (Decimal)':''}
        </span>
        {!isAttachment && <span style={{ fontSize:10, color:'var(--n-400)', flexShrink:0 }}>{isExpanded?'▲':'▼'}</span>}
        <button className="btn ghost icon-only sm" style={{ flexShrink:0 }}
          onClick={e => { e.stopPropagation(); onRemove(); }}>✕</button>
      </div>

      {/* ── INLINE INSPECTOR ── */}
      {isExpanded && (
        <div style={{ padding:'0 14px 14px', borderTop:'1px solid var(--n-100)' }}>

          {/* Label */}
          <div style={{ marginTop:12, marginBottom:10 }}>
            <label className="label">Label</label>
            <input className="input" value={field.name} placeholder="Question or field label"
              onChange={e => onUpdate({ name: e.target.value })} autoFocus/>
          </div>

          {/* Answer type — not for system, formula, or attachment fields */}
          {!isSystem && !isFormula && !isAttachment && (
            <div style={{ marginBottom:12 }}>
              <label className="label">Answer type</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                {availableTypes.map(t => (
                  <button key={t.type} onClick={() => onUpdate({ fieldType: t.type, numericType: undefined })}
                    style={{ padding:'5px 10px', fontSize:12, border:`1.5px solid ${t.type===field.fieldType?t.color:'var(--n-200)'}`,
                      borderRadius:6, background:t.type===field.fieldType?t.color+'18':'var(--n-0)',
                      color:t.type===field.fieldType?t.color:'var(--n-700)', fontWeight:t.type===field.fieldType?600:400, cursor:'pointer' }}>
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Number sub-type: Integer vs Decimal */}
          {field.fieldType === 'number' && (
            <div style={{ marginBottom:10 }}>
              <label className="label">Numeric type</label>
              <div style={{ display:'flex', gap:5 }}>
                {[{ k:'integer', l:'Integer', ex:'1, 2, 3' }, { k:'decimal', l:'Decimal', ex:'1.5, 2.0' }].map(({ k, l, ex }) => {
                  const active = k === 'decimal' ? isDecimal : !isDecimal;
                  return (
                    <button key={k} onClick={() => onUpdate({ numericType: k })}
                      style={{ flex:1, padding:'6px 10px', fontSize:12, border:`1.5px solid ${active?'#f59e0b':'var(--n-200)'}`,
                        borderRadius:6, background:active?'#f59e0b18':'var(--n-0)',
                        color:active?'#b45309':'var(--n-700)', fontWeight:active?600:400, cursor:'pointer', textAlign:'left' }}>
                      <div style={{ fontWeight:600 }}>{l}</div>
                      <div style={{ fontSize:10.5, opacity:0.7, marginTop:1 }}>{ex}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Number / Decimal validation */}
          {field.fieldType === 'number' && (
            <div style={{ display:'grid', gridTemplateColumns: isDecimal ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr', gap:8, marginBottom:12 }}>
              <div>
                <label className="label">Unit</label>
                <input className="input" style={{ fontSize:12 }} value={field.unit||''} placeholder="kg, hrs…"
                  onChange={e => onUpdate({ unit: e.target.value })}/>
              </div>
              <div>
                <label className="label">Min</label>
                <input type="number" className="input" style={{ fontSize:12 }} value={field.min??''}
                  placeholder="—" onChange={e => onUpdate({ min: e.target.value===''?undefined:+e.target.value })}/>
              </div>
              <div>
                <label className="label">Max</label>
                <input type="number" className="input" style={{ fontSize:12 }} value={field.max??''}
                  placeholder="—" onChange={e => onUpdate({ max: e.target.value===''?undefined:+e.target.value })}/>
              </div>
              {isDecimal && (
                <div>
                  <label className="label">Decimals</label>
                  <input type="number" className="input" style={{ fontSize:12 }} value={field.decimals??2}
                    min={0} max={10} onChange={e => onUpdate({ decimals: +e.target.value })}/>
                </div>
              )}
            </div>
          )}

          {/* Text config */}
          {field.fieldType === 'text' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
              <div>
                <label className="label">Placeholder</label>
                <input className="input" style={{ fontSize:12 }} value={field.placeholder||''} placeholder="Hint text…"
                  onChange={e => onUpdate({ placeholder: e.target.value })}/>
              </div>
              <div>
                <label className="label">Max length</label>
                <input type="number" className="input" style={{ fontSize:12 }} value={field.maxLength??''}
                  placeholder="—" onChange={e => onUpdate({ maxLength: e.target.value===''?undefined:+e.target.value })}/>
              </div>
            </div>
          )}

          {/* Choices — with explicit CTA */}
          {(field.fieldType==='single-select'||field.fieldType==='multi-choice') && (
            <div style={{ marginBottom:12 }}>
              <label className="label">Choices</label>
              <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:6 }}>
                {(field.options||[]).map((opt,oi) => (
                  <div key={oi} style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <div style={{ width:16, height:16, borderRadius:field.fieldType==='multi-choice'?3:'50%', border:'1.5px solid var(--n-300)', flexShrink:0 }}/>
                    <input className="input" style={{ flex:1, fontSize:12 }} value={opt}
                      onChange={e => onUpdate({ options: field.options.map((o,i) => i===oi?e.target.value:o) })}/>
                    <button className="btn ghost icon-only sm"
                      onClick={() => onUpdate({ options: field.options.filter((_,i) => i!==oi) })}>✕</button>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <input className="input" style={{ flex:1, fontSize:12 }} placeholder="Type a choice…"
                  value={newOpt} onChange={e => setNewOpt(e.target.value)}
                  onKeyDown={e => { if (e.key==='Enter') addChoice(); }}/>
                <button className="btn sm" onClick={addChoice}>+ Add choice</button>
              </div>
            </div>
          )}

          {/* Formula expression */}
          {isFormula && (
            <div style={{ marginBottom:12 }}>
              <label className="label">Formula expression</label>
              <input className="input" style={{ fontSize:12, fontFamily:'var(--font-mono)' }} value={field.formula||''}
                placeholder="e.g. (LTI Count × 1,000,000) / Total Manhours"
                onChange={e => onUpdate({ formula: e.target.value })}/>
            </div>
          )}

          {/* Bottom row — weightage (inspection only), required, attachments (inspection only) */}
          {!isAttachment && (
            <div style={{ display:'flex', gap:20, alignItems:'center', flexWrap:'wrap', paddingTop:10, borderTop:'1px solid var(--n-100)' }}>
              {isInspection && (
                <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <label className="label" style={{ margin:0, whiteSpace:'nowrap' }}>Weightage</label>
                  <input type="number" className="input" style={{ width:64, fontSize:12 }}
                    value={field.weightage??0} onChange={e => onUpdate({ weightage: +e.target.value })}/>
                  <span style={{ fontSize:12, color:'var(--n-500)' }}>pts</span>
                </div>
              )}
              {!isSystem && (
                <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, userSelect:'none' }}>
                  <Switch on={!!field.required} onChange={v => onUpdate({ required: v })}/> Required
                </label>
              )}
              {isInspection && (
                <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, userSelect:'none' }}>
                  <Switch on={!!field.allowAttachments} onChange={v => onUpdate({ allowAttachments: v })}/> Allow attachments
                </label>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}

function FieldPreview({ field }) {
  const isSystem     = field.source === 'system';
  const isFormula    = field.fieldType === 'formula';
  const isAttachment = field.fieldType === 'attachment';
  const isDecimal    = field.numericType === 'decimal';

  if (isAttachment) return (
    <div style={{ marginBottom:10, padding:'12px', border:'1.5px dashed var(--n-300)', borderRadius:6, textAlign:'center', fontSize:12, color:'var(--n-400)' }}>
      📎 Tap to attach files
    </div>
  );
  if (isSystem) return (
    <div style={{ marginBottom:10, padding:'8px 10px', border:'1px solid var(--n-200)', borderRadius:6, background:'var(--n-50)' }}>
      <div style={{ fontSize:11.5, fontWeight:500, color:'var(--n-500)' }}>⚙ {field.name}</div>
      <div style={{ fontSize:11, color:'var(--n-400)', marginTop:2 }}>Auto from {field.srcModule}</div>
    </div>
  );
  if (isFormula) return (
    <div style={{ marginBottom:10, padding:'8px 10px', border:'1px solid var(--n-100)', borderRadius:6, background:'var(--n-50)' }}>
      <div style={{ fontSize:11.5, fontWeight:500, color:'var(--n-600)' }}>ƒ {field.name}</div>
      <div style={{ fontSize:11, color:'var(--n-400)', marginTop:2, fontFamily:'var(--font-mono)' }}>{field.formula || 'calculated'}</div>
    </div>
  );

  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ fontSize:12, color:'var(--n-700)', marginBottom:4, fontWeight:500 }}>
        {field.name || <span style={{ color:'var(--n-300)', fontStyle:'italic' }}>Untitled field</span>}
        {field.required && <span style={{ color:'var(--danger)', marginLeft:2 }}>*</span>}
      </div>
      {field.fieldType==='yes-no-na' && (
        <div style={{ display:'flex', gap:5 }}>
          {['Yes','No','N/A'].map(o => (
            <div key={o} style={{ padding:'4px 10px', border:'1px solid var(--n-200)', borderRadius:6, fontSize:12, color:'var(--n-600)' }}>{o}</div>
          ))}
        </div>
      )}
      {(field.fieldType==='single-select'||field.fieldType==='multi-choice') && (
        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
          {(field.options||['Option 1']).map((opt,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 8px', border:'1px solid var(--n-200)', borderRadius:6, fontSize:12, color:'var(--n-600)' }}>
              <div style={{ width:11, height:11, borderRadius:field.fieldType==='multi-choice'?2:'50%', border:'1.5px solid var(--n-300)', flexShrink:0 }}/>
              {opt}
            </div>
          ))}
        </div>
      )}
      {field.fieldType==='text' && (
        <div style={{ padding:'6px 10px', border:'1px solid var(--n-200)', borderRadius:6, fontSize:12, color:'var(--n-400)' }}>
          {field.placeholder || 'Enter text…'}
        </div>
      )}
      {field.fieldType==='number' && (
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ padding:'6px 10px', border:'1px solid var(--n-200)', borderRadius:6, fontSize:12, color:'var(--n-400)', flex:1 }}>
            {isDecimal ? (0).toFixed(field.decimals??2) : '0'}
          </div>
          {field.unit && <span style={{ fontSize:11, color:'var(--n-500)' }}>{field.unit}</span>}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { FormBuilder });
