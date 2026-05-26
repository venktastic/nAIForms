const FIELD_TYPES = [
  { type: 'yes-no-na',     label: 'Yes / No / NA', icon: '◉',  color: '#10b981' },
  { type: 'single-select', label: 'Single Select',  icon: '◎',  color: '#6366f1' },
  { type: 'number',        label: 'Number',         icon: '#',  color: '#f59e0b' },
  { type: 'text',          label: 'Short Text',     icon: 'T',  color: '#0ea5e9' },
  { type: 'long-text',     label: 'Long Text',      icon: '¶',  color: '#0284c7' },
  { type: 'date-time',     label: 'Date / Time',    icon: '📅', color: '#7c3aed' },
  { type: 'photo',         label: 'Photo / Video',  icon: '📷', color: '#475569' },
  { type: 'location',      label: 'Location',       icon: '📍', color: '#ef4444' },
  { type: 'formula',       label: 'Formula',        icon: 'ƒ',  color: '#ec4899' },
  { type: 'attachment',    label: 'Attachments',    icon: '📎', color: '#64748b' },
];

// Helper — normalize option to {label, weight, triggersNCR} format
function normalizeOpt(o) {
  return typeof o === 'string' ? { label: o, weight: 0, triggersNCR: false } : o;
}

const INSP_TYPES  = FIELD_TYPES.filter(t => ['yes-no-na','single-select','number','text','long-text','date-time','photo','location'].includes(t.type));
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
    const base = { id: 'f' + Date.now(), name: '', fieldType: type, required: false, showOnApp: true, ...overrides };
    if (type === 'yes-no-na') base.options = [
      { label: 'Yes', weight: 1.0, triggersNCR: false },
      { label: 'No',  weight: 0.0, triggersNCR: false },
      { label: 'NA',  weight: 0.0, triggersNCR: false },
    ];
    if (type === 'single-select') base.options = [
      { label: 'Option 1', weight: 0.0, triggersNCR: false },
      { label: 'Option 2', weight: 0.0, triggersNCR: false },
    ];
    if (type === 'number')     base.unit = '';
    if (type === 'text')       base.placeholder = '';
    if (type === 'long-text')  base.placeholder = '';
    if (type === 'formula')    base.formula = '';
    if (type === 'attachment') base.name = 'Attachments';
    setData(d => ({ ...d, sections: d.sections.map(s => s.id !== sid ? s : { ...s, fields: [...s.fields, base] }) }));
    if (type !== 'attachment') setExpanded(base.id);
  }
  function addMasterField(mf, sid) {
    const target = sid || activeSection;
    if (!target) return;
    const f = {
      id: 'f' + Date.now(), name: mf.name, source: mf.source, fromMaster: true,
      srcModule: mf.srcModule || '', unit: mf.unit || '', formula: mf.formula || '',
      fieldType: mf.source === 'formula' ? 'formula' : 'number', required: true, showOnApp: true,
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

  function sectionMaxScore(section) {
    let max = 0;
    section.fields.forEach(f => {
      const opts = (f.options || []).map(normalizeOpt);
      if (!opts.length) return;
      const nonNA = opts.filter(o => o.label !== 'NA');
      const m = Math.max(0, ...nonNA.map(o => o.weight || 0));
      max += m;
    });
    return Math.round(max * 100) / 100;
  }
  const masterFields = (window.MASTER_FIELDS || [])
    .filter(m => {
      if (masterTab === 'user')    return m.source === 'user';
      if (masterTab === 'formula') return m.source === 'formula';
      return m.source !== 'system';
    })
    .filter(m => !masterSearch || m.name.toLowerCase().includes(masterSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const cols = !isViewMode ? '240px 1fr 300px' : '1fr 300px';

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
            <Btn>Save draft</Btn>
            <Btn variant="primary" onClick={() => setShowPublish(true)}>Publish →</Btn>
          </>
        )
      }/>

      <div className="builder" style={{ gridTemplateColumns: cols }}>

        {/* ── LEFT PANEL ── */}
        {!isViewMode && (
          <div className="left">
            {isInspection ? (
              /* ── Inspection: field type palette ── */
              <>
                <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', color:'var(--n-500)', letterSpacing:'0.06em', marginBottom:10 }}>
                  Field Types
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5, overflowY:'auto', maxHeight:'calc(100vh - 180px)' }}>
                  {INSP_TYPES.map(t => (
                    <button key={t.type}
                      onClick={() => activeSection && addBlankField(activeSection, t.type)}
                      style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:4,
                        padding:'10px 6px', border:'1.5px solid var(--n-200)', borderRadius:8, cursor:'pointer',
                        background:'var(--n-0)', color:'var(--n-700)', fontSize:11, fontWeight:500, lineHeight:1.3,
                        textAlign:'center', transition:'border-color 0.1s, background 0.1s' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = t.color; e.currentTarget.style.background = t.color + '10'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--n-200)'; e.currentTarget.style.background = 'var(--n-0)'; }}>
                      <span style={{ fontSize:18, lineHeight:1 }}>{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              /* ── Statistics: master fields panel ── */
              <>
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
              </>
            )}
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
                      questionNumber={isInspection ? fi + 1 : undefined}
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
                      {isInspection ? 'Click a field type in the left panel to add it here' : 'Add fields from the master panel on the left'}
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
              <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{data.name || 'Untitled Form'}</div>
              {isInspection && data.sections.some(s => sectionMaxScore(s) > 0) && (
                <div style={{ fontSize:11, color:'var(--n-500)', marginBottom:12, padding:'4px 8px', background:'var(--n-50)', borderRadius:4 }}>
                  Overall Score: <strong>—</strong>
                  <span style={{ marginLeft:8, color:'var(--n-400)' }}>
                    Max: {data.sections.reduce((t, s) => t + sectionMaxScore(s), 0).toFixed(1)} pts
                  </span>
                </div>
              )}
              {!isInspection && <div style={{ marginBottom:14 }}/>}
              {data.sections.map((s, si) => {
                const maxScore = isInspection ? sectionMaxScore(s) : 0;
                return (
                  <div key={s.id} style={{ marginBottom:16 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <div style={{ fontSize:11.5, fontWeight:600, color:'var(--n-600)', textTransform:'uppercase', letterSpacing:'0.04em' }}>
                        {s.title}
                      </div>
                      {isInspection && maxScore > 0 && (
                        <div style={{ fontSize:10, color:'var(--n-400)', fontWeight:500 }}>
                          — / {maxScore.toFixed(1)} pts
                        </div>
                      )}
                    </div>
                    {s.fields.map((f, fi) => <FieldPreview key={f.id} field={f} questionNumber={isInspection ? fi + 1 : undefined}/>)}
                  </div>
                );
              })}
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
          <Modal title="Publish Form" onClose={closePublish} actions={
            <>
              <Btn onClick={closePublish}>Cancel</Btn>
              <Btn variant="primary" disabled={publishProjects.size === 0} onClick={confirmPublish}>
                Publish to Selected Projects
              </Btn>
            </>
          }>
            <p style={{ marginTop:0, fontSize:13, color:'var(--n-600)' }}>
              Select the projects where this form will be available. At least one project is required.
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
                  {publishProjects.has(proj.id) && <Badge tone="success">Assigned</Badge>}
                </label>
              ))}
            </div>
            {publishProjects.size === 0 && (
              <div style={{ marginTop:8, fontSize:12, color:'var(--danger)' }}>Select at least one project to publish.</div>
            )}
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

function FieldRow({ field, availableTypes, isExpanded, isInspection, questionNumber, onToggle, onUpdate, onRemove, onDragStart, onDragEnd, onDragOver, onDrop, isDragging }) {
  const [newOpt, setNewOpt]                 = useState('');
  const [savedToLib, setSavedToLib]         = useState(false);
  const [labelTouched, setLabelTouched]     = useState(false);
  const [formulaTouched, setFormulaTouched] = useState(false);
  const ft = FIELD_TYPES.find(t => t.type === field.fieldType) || FIELD_TYPES[0];
  const isSystem     = field.source === 'system';
  const isMasterRef  = !isSystem && !!field.fromMaster;
  const isFormula    = field.fieldType === 'formula';
  const isAttachment = field.fieldType === 'attachment';
  const isDecimal    = field.numericType === 'decimal';
  const isLocked     = isSystem || isMasterRef;

  // inspection-specific derived state
  const opts = (field.options || []).map(normalizeOpt);
  const hasNCR = isInspection && opts.some(o => o.triggersNCR);
  const hasPhotoAttachment = isInspection && !!field.allowPhotoAttachment && field.fieldType !== 'photo';

  function saveToLibrary() {
    if (!field.name) { setLabelTouched(true); return; }
    const exists = (window.MASTER_FIELDS || []).some(m => m.name === field.name);
    if (!exists) {
      window.MASTER_FIELDS = [...(window.MASTER_FIELDS || []), {
        id: 'u' + Date.now(), name: field.name, source: 'user', unit: field.unit || ''
      }];
    }
    setSavedToLib(true);
  }

  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver} onDrop={onDrop}
      style={{ opacity:isDragging?0.4:1, marginBottom:8, border:`1.5px solid ${isExpanded?'var(--brand-400)':'var(--n-200)'}`,
        borderRadius:10, background:isLocked?'var(--n-50)':isExpanded?'#f8faff':'var(--n-0)',
        transition:'border-color 0.12s, background 0.12s', overflow:'hidden' }}>

      {/* ── ROW HEADER ── */}
      <div onClick={isAttachment ? undefined : onToggle}
        style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', cursor:isAttachment?'default':'pointer', userSelect:'none' }}>
        <span style={{ color:'var(--n-300)', cursor:'grab', fontSize:14, flexShrink:0 }}
          onMouseDown={e => e.stopPropagation()}>⋮⋮</span>
        {isInspection && questionNumber != null && (
          <span style={{ fontSize:11, fontWeight:700, color:'var(--n-400)', minWidth:18, textAlign:'right', flexShrink:0 }}>
            {questionNumber}
          </span>
        )}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:500, fontSize:13.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            color:field.name?'var(--n-800)':'var(--n-300)', fontStyle:field.name?'normal':'italic', display:'flex', alignItems:'center', gap:4 }}>
            {isSystem && <span style={{ color:'var(--n-400)' }}>⚙</span>}
            {isFormula && !isSystem && <span style={{ color:'#ec4899' }}>ƒ</span>}
            {isAttachment && <span>📎</span>}
            <span style={{ overflow:'hidden', textOverflow:'ellipsis' }}>{field.name || 'Untitled field'}</span>
            {hasNCR && <span style={{ fontSize:10, color:'#dc2626', fontWeight:700, flexShrink:0 }}>⚠ NCR</span>}
            {hasPhotoAttachment && <span style={{ fontSize:12, flexShrink:0 }}>📷</span>}
          </div>
          <div style={{ display:'flex', gap:10, marginTop:2, fontSize:11, color:'var(--n-400)', flexWrap:'wrap' }}>
            {isSystem && <span>Auto from {field.srcModule}</span>}
            {field.unit && <span>{field.unit}</span>}
            {field.required && <span style={{ color:'var(--danger)' }}>Required</span>}
          </div>
        </div>
        <span style={{ fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:4, flexShrink:0,
          background:ft.color+'1a', color:ft.color, whiteSpace:'nowrap' }}>
          {ft.icon} {ft.label}{field.fieldType==='number'&&isDecimal?' (Decimal)':''}
        </span>
        {!isLocked && !isAttachment && !field.name && (
          <span style={{ fontSize:11, color:'var(--danger)', flexShrink:0 }}>⚠ Label missing</span>
        )}
        {!isLocked && isFormula && !field.formula && (
          <span style={{ fontSize:11, color:'var(--danger)', flexShrink:0 }}>⚠ Formula empty</span>
        )}
        {!isInspection && (
          <>
            <div onClick={e => e.stopPropagation()}
              style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--n-700)', userSelect:'none', whiteSpace:'nowrap', flexShrink:0 }}>
              Required
              <Switch on={!!field.required} onChange={v => onUpdate({ required: v })}/>
            </div>
            <div onClick={e => e.stopPropagation()}
              style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--n-700)', userSelect:'none', whiteSpace:'nowrap', flexShrink:0 }}>
              Show on app?
              <Switch on={field.showOnApp !== false} onChange={v => onUpdate({ showOnApp: v })}/>
            </div>
          </>
        )}
        {!isAttachment && <span style={{ fontSize:10, color:'var(--n-400)', flexShrink:0 }}>{isExpanded?'▲':'▼'}</span>}
        <button className="btn ghost icon-only sm" style={{ flexShrink:0 }}
          onClick={e => { e.stopPropagation(); onRemove(); }}>✕</button>
      </div>

      {/* ── INLINE INSPECTOR (locked: system + master fields — required toggle only) ── */}
      {isExpanded && isLocked && (
        <div style={{ padding:'0 14px 14px', borderTop:'1px solid var(--n-100)' }}>
          <div style={{ marginTop:10, padding:'8px 10px', background:'var(--n-100)', borderRadius:6, fontSize:12, color:'var(--n-500)' }}>
            {isSystem
              ? <span>⚙ Auto-populated from <strong>{field.srcModule}</strong>. Cannot be edited.</span>
              : <span>From master library. Cannot be edited.</span>
            }
          </div>
          {isInspection && (
            <div style={{ display:'flex', alignItems:'center', paddingTop:10, marginTop:10, borderTop:'1px solid var(--n-100)' }}>
              <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, userSelect:'none' }}>
                <Switch on={!!field.required} onChange={v => onUpdate({ required: v })}/> Required
              </label>
            </div>
          )}
        </div>
      )}

      {/* ── INLINE INSPECTOR (editable: new user fields + new formulas) ── */}
      {isExpanded && !isLocked && (
        <div style={{ padding:'0 14px 14px', borderTop:'1px solid var(--n-100)' }}>

          {/* Label */}
          <div style={{ marginTop:12, marginBottom:10 }}>
            <label className="label">Label</label>
            <input className="input" value={field.name} placeholder="Field label"
              style={{ borderColor: labelTouched && !field.name ? 'var(--danger)' : undefined }}
              onChange={e => onUpdate({ name: e.target.value })}
              onBlur={() => setLabelTouched(true)}
              autoFocus/>
            {labelTouched && !field.name && (
              <div style={{ fontSize:11, color:'var(--danger)', marginTop:3 }}>Label is required</div>
            )}
          </div>

          {/* Help text — inspection only */}
          {isInspection && (
            <div style={{ marginBottom:10 }}>
              <label className="label">Help text <span style={{ fontWeight:400, color:'var(--n-400)' }}>(optional)</span></label>
              <input className="input" value={field.helpText||''} placeholder="Guidance shown below the question…" maxLength={200}
                onChange={e => onUpdate({ helpText: e.target.value })}/>
            </div>
          )}

          {/* Answer type selector — not for system/formula/attachment and only in stats (inspection has fixed types) */}
          {!isSystem && !isFormula && !isAttachment && !isInspection && (
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

          {/* Yes / No / NA — fixed options with weight + NCR toggle */}
          {field.fieldType === 'yes-no-na' && isInspection && (
            <div style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <label className="label" style={{ margin:0 }}>Options & Scoring</label>
                <div style={{ fontSize:11, color:'var(--n-400)' }}>Weight · ⚠ Triggers NCR</div>
              </div>
              {opts.map((opt, oi) => (
                <div key={opt.label} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', marginBottom:4,
                  background: opt.triggersNCR ? '#fef2f2' : 'var(--n-50)', borderRadius:6,
                  border: `1px solid ${opt.triggersNCR ? '#fecaca' : 'var(--n-200)'}` }}>
                  <span style={{ fontSize:13, fontWeight:600, minWidth:28, color:'var(--n-700)' }}>{opt.label}</span>
                  <div style={{ flex:1 }}>
                    <input type="number" className="input" style={{ fontSize:12, width:72 }}
                      step="0.1" value={opt.weight ?? 0}
                      onChange={e => {
                        const next = opts.map((o,i) => i===oi ? { ...o, weight: parseFloat(e.target.value)||0 } : o);
                        onUpdate({ options: next });
                      }}/>
                  </div>
                  <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, userSelect:'none', whiteSpace:'nowrap' }}>
                    <Switch on={!!opt.triggersNCR} onChange={v => {
                      const next = opts.map((o,i) => i===oi ? { ...o, triggersNCR: v } : o);
                      onUpdate({ options: next });
                    }}/> ⚠
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Single Select — options with weight + NCR toggle */}
          {field.fieldType === 'single-select' && isInspection && (
            <div style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <label className="label" style={{ margin:0 }}>Options & Scoring</label>
                <div style={{ fontSize:11, color:'var(--n-400)' }}>Label · Weight · ⚠</div>
              </div>
              {opts.map((opt, oi) => (
                <div key={oi} style={{ display:'flex', gap:6, alignItems:'center', marginBottom:4 }}>
                  <div style={{ width:12, height:12, borderRadius:'50%', border:'1.5px solid var(--n-300)', flexShrink:0 }}/>
                  <input className="input" style={{ flex:1, fontSize:12 }} placeholder="Option label" value={opt.label}
                    onChange={e => {
                      const next = opts.map((o,i) => i===oi ? { ...o, label: e.target.value } : o);
                      onUpdate({ options: next });
                    }}/>
                  <input type="number" className="input" style={{ width:64, fontSize:12 }}
                    step="0.1" placeholder="Wt" value={opt.weight ?? 0}
                    onChange={e => {
                      const next = opts.map((o,i) => i===oi ? { ...o, weight: parseFloat(e.target.value)||0 } : o);
                      onUpdate({ options: next });
                    }}/>
                  <label style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, userSelect:'none', flexShrink:0 }}
                    title="Triggers NCR">
                    <Switch on={!!opt.triggersNCR} onChange={v => {
                      const next = opts.map((o,i) => i===oi ? { ...o, triggersNCR: v } : o);
                      onUpdate({ options: next });
                    }}/> ⚠
                  </label>
                  <button className="btn ghost icon-only sm"
                    onClick={() => onUpdate({ options: opts.filter((_,i) => i!==oi) })}>✕</button>
                </div>
              ))}
              <div style={{ display:'flex', gap:6, marginTop:4 }}>
                <input className="input" style={{ flex:1, fontSize:12 }} placeholder="New option…"
                  value={newOpt} onChange={e => setNewOpt(e.target.value)}
                  onKeyDown={e => {
                    if (e.key==='Enter') {
                      const label = newOpt.trim() || `Option ${opts.length+1}`;
                      onUpdate({ options: [...opts, { label, weight:0.0, triggersNCR:false }] });
                      setNewOpt('');
                    }
                  }}/>
                <button className="btn sm" onClick={() => {
                  const label = newOpt.trim() || `Option ${opts.length+1}`;
                  onUpdate({ options: [...opts, { label, weight:0.0, triggersNCR:false }] });
                  setNewOpt('');
                }}>+ Add</button>
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

          {/* Text / Long Text config */}
          {(field.fieldType === 'text' || field.fieldType === 'long-text') && (
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

          {/* Date/Time config */}
          {field.fieldType === 'date-time' && (
            <div style={{ marginBottom:12 }}>
              <label className="label">Date/time mode</label>
              <div style={{ display:'flex', gap:6 }}>
                {[{ k:'date', l:'Date only' }, { k:'time', l:'Time only' }, { k:'datetime', l:'Date & Time' }].map(({ k, l }) => {
                  const active = (field.dtMode || 'datetime') === k;
                  return (
                    <button key={k} onClick={() => onUpdate({ dtMode: k })}
                      style={{ padding:'5px 10px', fontSize:12, border:`1.5px solid ${active?'#7c3aed':'var(--n-200)'}`,
                        borderRadius:6, background:active?'#7c3aed18':'var(--n-0)',
                        color:active?'#7c3aed':'var(--n-700)', fontWeight:active?600:400, cursor:'pointer' }}>
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Photo/Video config */}
          {field.fieldType === 'photo' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
              <div>
                <label className="label">Max files</label>
                <input type="number" className="input" style={{ fontSize:12 }} min={1} max={20}
                  value={field.maxPhotos||5} onChange={e => onUpdate({ maxPhotos: +e.target.value })}/>
              </div>
              <div style={{ display:'flex', alignItems:'flex-end', paddingBottom:2 }}>
                <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, userSelect:'none' }}>
                  <Switch on={field.allowVideo !== false} onChange={v => onUpdate({ allowVideo: v })}/> Allow video
                </label>
              </div>
            </div>
          )}

          {/* Formula expression + operators + reference picker */}
          {isFormula && (
            <div style={{ marginBottom:12 }}>
              <label className="label">Formula expression</label>
              <textarea className="input" rows={2}
                style={{ fontSize:12, fontFamily:'var(--font-mono)', resize:'vertical', lineHeight:1.5,
                  borderColor: formulaTouched && !field.formula ? 'var(--danger)' : undefined }}
                value={field.formula||''}
                placeholder="e.g. (LTI Count × 1,000,000) / Total Manhours"
                onChange={e => onUpdate({ formula: e.target.value })}
                onBlur={() => setFormulaTouched(true)}/>
              {formulaTouched && !field.formula && (
                <div style={{ fontSize:11, color:'var(--danger)', marginTop:3 }}>Formula expression is required</div>
              )}

              {/* Operators */}
              <div style={{ display:'flex', gap:4, marginTop:8, flexWrap:'wrap' }}>
                {['+', '−', '×', '÷', '(', ')', '1,000,000', '200,000'].map(op => (
                  <button key={op}
                    onClick={() => onUpdate({ formula: (field.formula||'').trimEnd() + (field.formula ? ' ' : '') + op })}
                    style={{ padding:'3px 10px', fontSize:12, fontFamily: op.length > 2 ? 'inherit' : 'var(--font-mono)',
                      fontWeight:600, border:'1px solid var(--n-300)', borderRadius:4, cursor:'pointer',
                      background:'var(--n-0)', color:'var(--n-700)' }}>
                    {op}
                  </button>
                ))}
              </div>

              {/* Reference picker */}
              <div style={{ marginTop:8 }}>
                <label className="label" style={{ marginBottom:5 }}>Insert field reference</label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4, maxHeight:110, overflowY:'auto',
                  padding:'6px 8px', background:'var(--n-50)', border:'1px solid var(--n-200)', borderRadius:6 }}>
                  {(window.MASTER_FIELDS||[]).filter(m => m.source !== 'formula').map(m => (
                    <button key={m.id}
                      onClick={() => onUpdate({ formula: (field.formula||'').trimEnd() + (field.formula ? ' ' : '') + m.name })}
                      style={{ padding:'2px 8px', fontSize:11, border:`1px solid ${m.source==='system'?'var(--n-300)':'var(--n-200)'}`,
                        borderRadius:4, cursor:'pointer', whiteSpace:'nowrap',
                        background: m.source==='system' ? 'var(--n-100)' : 'var(--n-0)',
                        color: m.source==='system' ? 'var(--n-600)' : 'var(--n-700)' }}>
                      {m.source==='system' ? '⚙ ' : ''}{m.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bottom row */}
          {!isAttachment && (
            <div style={{ display:'flex', gap:20, alignItems:'center', flexWrap:'wrap', paddingTop:10, borderTop:'1px solid var(--n-100)' }}>
              {isInspection && (
                <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, userSelect:'none' }}>
                  <Switch on={!!field.required} onChange={v => onUpdate({ required: v })}/> Required
                </label>
              )}
              {isInspection && field.fieldType !== 'photo' && (
                <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, userSelect:'none' }}>
                  <Switch on={!!field.allowPhotoAttachment} onChange={v => onUpdate({ allowPhotoAttachment: v })}/> 📷 Allow photo/video attachment
                </label>
              )}
              {!isInspection && !isFormula && (
                savedToLib
                  ? <span style={{ fontSize:12, color:'#10b981', fontWeight:500 }}>✓ Saved to library</span>
                  : <button className="btn sm" style={{ marginLeft:'auto' }} onClick={saveToLibrary}>+ Save to library</button>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}

function FieldPreview({ field, questionNumber }) {
  const isSystem     = field.source === 'system';
  const isFormula    = field.fieldType === 'formula';
  const isAttachment = field.fieldType === 'attachment';
  const isDecimal    = field.numericType === 'decimal';
  const opts         = (field.options || []).map(normalizeOpt);

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
    <div style={{ marginBottom:12 }}>
      {/* Question label */}
      <div style={{ fontSize:12, color:'var(--n-700)', marginBottom:4, fontWeight:500, display:'flex', gap:6, alignItems:'baseline' }}>
        {questionNumber != null && (
          <span style={{ fontSize:10.5, fontWeight:600, color:'var(--n-400)', flexShrink:0 }}>Q{questionNumber}</span>
        )}
        <span>{field.name || <span style={{ color:'var(--n-300)', fontStyle:'italic' }}>Untitled field</span>}</span>
        {field.required && <span style={{ color:'var(--danger)' }}>*</span>}
      </div>
      {field.helpText && (
        <div style={{ fontSize:10.5, color:'var(--n-400)', marginBottom:5, fontStyle:'italic' }}>{field.helpText}</div>
      )}

      {/* Primary response control */}
      {field.fieldType === 'yes-no-na' && (
        <div style={{ display:'flex', gap:5 }}>
          {opts.map(o => (
            <div key={o.label} style={{ padding:'5px 10px', border:'1px solid var(--n-200)', borderRadius:6, fontSize:12, color:'var(--n-600)',
              display:'flex', alignItems:'center', gap:4 }}>
              {o.label}
              {o.triggersNCR && <span style={{ fontSize:9, color:'#dc2626', fontWeight:700 }}>⚠</span>}
            </div>
          ))}
        </div>
      )}
      {field.fieldType === 'single-select' && (
        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
          {(opts.length ? opts : [{ label:'Option 1', weight:0, triggersNCR:false }]).map((opt, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 8px', border:'1px solid var(--n-200)', borderRadius:6, fontSize:12, color:'var(--n-600)' }}>
              <div style={{ width:11, height:11, borderRadius:'50%', border:'1.5px solid var(--n-300)', flexShrink:0 }}/>
              <span style={{ flex:1 }}>{opt.label}</span>
              {opt.triggersNCR && <span style={{ fontSize:9, color:'#dc2626', fontWeight:700 }}>⚠</span>}
            </div>
          ))}
        </div>
      )}
      {(field.fieldType==='text'||field.fieldType==='long-text') && (
        <div style={{ padding:'6px 10px', border:'1px solid var(--n-200)', borderRadius:6, fontSize:12, color:'var(--n-400)',
          minHeight: field.fieldType==='long-text' ? 52 : undefined }}>
          {field.placeholder || (field.fieldType==='long-text' ? 'Enter long text…' : 'Enter text…')}
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
      {field.fieldType==='date-time' && (
        <div style={{ padding:'6px 10px', border:'1px solid var(--n-200)', borderRadius:6, fontSize:12, color:'var(--n-400)', display:'flex', gap:8, alignItems:'center' }}>
          📅 {field.dtMode==='time' ? 'HH:MM' : field.dtMode==='date' ? 'DD/MM/YYYY' : 'DD/MM/YYYY HH:MM'}
        </div>
      )}
      {field.fieldType==='photo' && (
        <div style={{ padding:'14px 10px', border:'1.5px dashed var(--n-300)', borderRadius:6, textAlign:'center', fontSize:12, color:'var(--n-400)' }}>
          📷 Tap to add photo{field.allowVideo!==false?' / video':''}
          {field.maxPhotos && <span style={{ fontSize:10, display:'block', marginTop:2 }}>Max {field.maxPhotos}</span>}
        </div>
      )}
      {field.fieldType==='location' && (
        <div style={{ padding:'6px 10px', border:'1px solid var(--n-200)', borderRadius:6, fontSize:12, color:'var(--n-400)', display:'flex', gap:6, alignItems:'center' }}>
          📍 <span style={{ fontSize:11 }}>Tap to capture GPS location</span>
        </div>
      )}

      {/* Supplementary photo attachment (when allowPhotoAttachment = ON and not the photo type itself) */}
      {field.allowPhotoAttachment && field.fieldType !== 'photo' && (
        <div style={{ marginTop:6, padding:'7px 10px', border:'1.5px dashed var(--n-300)', borderRadius:6,
          fontSize:11, color:'var(--n-400)', display:'flex', alignItems:'center', gap:6 }}>
          📷 <span>Add photo / video (optional)</span>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { FormBuilder });
