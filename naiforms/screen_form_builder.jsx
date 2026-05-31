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

const OPTION_COLORS = [
  'rgba(22,166,77,1)',
  'rgba(142,217,115,1)',
  'rgba(255,255,255,1)',
  'rgba(255,252,56,1)',
  'rgba(253,0,19,1)',
  'rgba(0,112,192,1)',
];
function rgbaToHex(c) {
  const m = (c||'').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return '#ffffff';
  return '#' + [m[1],m[2],m[3]].map(n => parseInt(n).toString(16).padStart(2,'0')).join('');
}
function hexToRgba(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},1)`;
}

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
  const [showFill, setShowFill]      = useState(false);
  const [addFieldModal, setAddFieldModal] = useState(null); // null | sectionId

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
    const base = { id: 'f' + Date.now(), name: '', fieldType: type, required: true, allowPhotoAttachment: true, allowComment: true, showOnApp: true, ...overrides };
    if (type === 'yes-no-na') base.options = [
      { label: 'Yes', weight: 1,  triggersNCR: false },
      { label: 'No',  weight: 0,  triggersNCR: false },
      { label: 'NA',  weight: -1, triggersNCR: false },
    ];
    if (type === 'single-select') base.options = [
      { label: 'Good Practice',         weight: 1,  triggersNCR: false },
      { label: 'Compliant',             weight: 1,  triggersNCR: false },
      { label: 'Observation',           weight: 1,  triggersNCR: false },
      { label: 'Minor Non Conformance', weight: 1,  triggersNCR: false },
      { label: 'Major Non Conformance', weight: 1,  triggersNCR: false },
      { label: 'N/A',                   weight: -1, triggersNCR: false },
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
      const eligible = opts.filter(o => (o.weight ?? 0) !== -1);
      if (!eligible.length) return;
      const m = Math.max(0, ...eligible.map(o => o.weight || 0));
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
            {isInspection && <Btn onClick={() => setShowFill(true)}>▶ Try form</Btn>}
            <Btn>Save draft</Btn>
            <Btn variant="primary" title="Once published, existing fields cannot be edited or deleted." onClick={() => setShowPublish(true)}>Publish →</Btn>
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
                  background: data.formType==='statistics' ? '#10b98115' : data.formType==='audit' ? '#0ea5e915' : '#6366f115',
                  color: data.formType==='statistics' ? '#10b981' : data.formType==='audit' ? '#0284c7' : '#6366f1' }}>
                  {data.formType === 'statistics' ? 'Statistics Capture' : data.formType === 'audit' ? 'Audit' : 'Inspection'}
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
                      style={{ border:'1.5px solid transparent', borderRadius:6, padding:'4px 8px', fontSize:14, fontWeight:600, flex:1, background:'transparent' }}
                      value={section.title}
                      readOnly={isViewMode}
                      onChange={e => updateSection(section.id, { title: e.target.value })}
                      onFocus={e => { e.target.style.background='var(--n-0)'; e.target.style.borderColor='var(--brand-400)'; }}
                      onBlur={e => { e.target.style.background='transparent'; e.target.style.borderColor='transparent'; }}
                      onMouseOver={e => { if (document.activeElement !== e.target) e.target.style.background='var(--n-50)'; }}
                      onMouseOut={e => { if (document.activeElement !== e.target) e.target.style.background='transparent'; }}
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

                  {section.fields.length === 0 && !isInspection && (
                    <div style={{ padding:16, textAlign:'center', color:'var(--n-400)', fontSize:12, border:'1px dashed var(--n-300)', borderRadius:8 }}>
                      Add fields from the master panel on the left
                    </div>
                  )}

                  {isInspection && !isViewMode && section.fields.length === 0 && (
                    <div style={{ textAlign:'center', fontSize:11.5, color:'var(--n-400)', padding:'8px 0 6px' }}>
                      Click '+ Add Field' or drag a type from the left panel.
                    </div>
                  )}
                  {isInspection && !isViewMode && (
                    <button onClick={e => { e.stopPropagation(); setAddFieldModal(section.id); }}
                      style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, width:'100%',
                        marginTop: section.fields.length ? 8 : 0,
                        padding:'10px 16px', border:'1.5px dashed var(--n-300)', borderRadius:8,
                        background:'transparent', color:'var(--n-500)', fontSize:13, fontWeight:500, cursor:'pointer' }}
                      onMouseOver={e => { e.currentTarget.style.borderColor='var(--brand-400)'; e.currentTarget.style.color='var(--brand-600)'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor='var(--n-300)'; e.currentTarget.style.color='var(--n-500)'; }}>
                      + Add Field
                    </button>
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
          {isInspection && (
            <button onClick={() => setShowFill(true)}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, width:'100%', marginBottom:10,
                padding:'8px 12px', border:'1.5px solid var(--brand-400)', borderRadius:8,
                background:'var(--brand-50)', color:'var(--brand-700)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              ▶ Try filling form
            </button>
          )}
          <PhoneFrame>
            <div style={{ padding:'12px 14px' }}>
              <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>{data.name || 'Untitled Form'}</div>
              {isInspection && data.sections.some(s => sectionMaxScore(s) > 0) && (
                <div title="Average of all section scores." style={{ fontSize:11, color:'var(--n-500)', marginBottom:12, padding:'4px 8px', background:'var(--n-50)', borderRadius:4 }}>
                  Overall Score: <strong>—</strong>
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
                        <div title="Score = sum of selected weights ÷ max possible weights in this section." style={{ fontSize:10, color:'var(--n-400)', fontWeight:500 }}>
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

      {showFill && isInspection && (
        <InspectionFillScreen form={data} onClose={() => setShowFill(false)}/>
      )}

      {addFieldModal && (
        <AddFieldModal
          sectionId={addFieldModal}
          onAdd={(sid, type) => { addBlankField(sid, type); setAddFieldModal(null); }}
          onClose={() => setAddFieldModal(null)}
        />
      )}

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

const FIELD_TYPE_DESCS = {
  'yes-no-na':     'Scored pass/fail questions',
  'single-select': 'Choose one from a list',
  'number':        'Numeric entry with unit',
  'text':          'Single-line text answer',
  'long-text':     'Multi-line notes',
  'date-time':     'Date and time picker',
  'photo':         'Camera or file attachment',
  'location':      'GPS pin or map location',
};

function AddFieldModal({ sectionId, onAdd, onClose }) {
  return (
    <div className="scrim" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width:520, maxWidth:'90vw' }}>
        <div className="modal-head">
          <h3>Add a field</h3>
          <button className="btn ghost icon-only" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10 }}>
            {INSP_TYPES.map(t => (
              <button key={t.type} onClick={() => onAdd(sectionId, t.type)}
                style={{ display:'flex', flexDirection:'column', gap:5, padding:'14px 10px',
                  border:'1.5px solid var(--n-200)', borderRadius:10, cursor:'pointer',
                  background:'var(--n-0)', textAlign:'left', transition:'border-color 0.1s, background 0.1s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = t.color; e.currentTarget.style.background = t.color + '12'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--n-200)'; e.currentTarget.style.background = 'var(--n-0)'; }}>
                <span style={{ fontSize:22, lineHeight:1 }}>{t.icon}</span>
                <div style={{ fontSize:12, fontWeight:600, color:'var(--n-800)', marginTop:2 }}>{t.label}</div>
                <div style={{ fontSize:10.5, color:'var(--n-500)', lineHeight:1.4 }}>{FIELD_TYPE_DESCS[t.type]}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldRow({ field, availableTypes, isExpanded, isInspection, questionNumber, onToggle, onUpdate, onRemove, onDragStart, onDragEnd, onDragOver, onDrop, isDragging }) {
  const [newOpt, setNewOpt]                 = useState('');
  const [savedToLib, setSavedToLib]         = useState(false);
  const [labelTouched, setLabelTouched]     = useState(false);
  const [formulaTouched, setFormulaTouched] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(null); // null | option index
  const [weightErrors, setWeightErrors]     = useState({});

  function checkWeight(key, val) {
    const n = parseFloat(val);
    setWeightErrors(e => ({ ...e, [key]: !isNaN(n) && n < 0 && n !== -1 }));
  }
  const ft = FIELD_TYPES.find(t => t.type === field.fieldType) || FIELD_TYPES[0];
  const isSystem     = field.source === 'system';
  const isMasterRef  = !isSystem && !!field.fromMaster;
  const isFormula    = field.fieldType === 'formula';
  const isAttachment = field.fieldType === 'attachment';
  const isDecimal    = field.numericType === 'decimal';
  const isLocked     = isSystem || isMasterRef;

  // inspection-specific derived state
  const opts = (field.options || []).map(normalizeOpt);
  const hasNCR             = isInspection && opts.some(o => o.triggersNCR);
  const hasPhotoAttachment = isInspection && !!field.allowPhotoAttachment && field.fieldType !== 'photo';
  const hasComment         = isInspection && !!field.allowComment;

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
            {hasComment && <span style={{ fontSize:12, flexShrink:0 }}>💬</span>}
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
          <span style={{ fontSize:11, color:'var(--danger)', flexShrink:0 }}>⚠ {isInspection ? 'Question' : 'Label'} missing</span>
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

          {/* Question / Label */}
          <div style={{ marginTop:12, marginBottom:10 }}>
            <label className="label">{isInspection ? 'Question' : 'Label'}</label>
            <input className="input" value={field.name} placeholder={isInspection ? 'Enter question…' : 'Field label'}
              style={{ borderColor: labelTouched && !field.name ? 'var(--danger)' : undefined }}
              onChange={e => onUpdate({ name: e.target.value })}
              onBlur={() => setLabelTouched(true)}
              autoFocus/>
            {labelTouched && !field.name && (
              <div style={{ fontSize:11, color:'var(--danger)', marginTop:3 }}>{isInspection ? 'Question' : 'Label'} is required</div>
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
              {opts.map((opt, oi) => {
                const icon  = opt.label === 'Yes' ? '✓' : opt.label === 'No' ? '✗' : 'NA';
                const color = opt.label === 'Yes' ? '#16a34a' : opt.label === 'No' ? '#dc2626' : '#d97706';
                const bg    = opt.label === 'Yes' ? '#f0fdf4' : opt.label === 'No' ? '#fef2f2' : '#fffbeb';
                return (
                  <div key={opt.label} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', marginBottom:4,
                    background: opt.triggersNCR ? '#fef2f2' : 'var(--n-50)', borderRadius:6,
                    border: `1px solid ${opt.triggersNCR ? '#fecaca' : 'var(--n-200)'}` }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minWidth:38, height:28,
                      borderRadius:6, background:bg, border:`1.5px solid ${color}40`, flexShrink:0 }}>
                      <span style={{ fontSize:13, fontWeight:800, color }}>{icon}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <input type="number" className="input" style={{ fontSize:12, width:72 }}
                        title="Score awarded when this option is selected. Higher = better."
                        step="any" value={opt.weight ?? 0}
                        onChange={e => {
                          const next = opts.map((o,i) => i===oi ? { ...o, weight: parseFloat(e.target.value)||0 } : o);
                          onUpdate({ options: next });
                          setWeightErrors(er => ({ ...er, ['ynn_'+oi]: false }));
                        }}
                        onBlur={e => checkWeight('ynn_'+oi, e.target.value)}/>
                      {weightErrors['ynn_'+oi] && (
                        <div style={{ fontSize:10.5, color:'var(--danger)', marginTop:2 }}>Only -1 is allowed as a negative value.</div>
                      )}
                    </div>
                    <label title="When selected, this response will trigger a Non-Conformance Report." style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, userSelect:'none', whiteSpace:'nowrap' }}>
                      <Switch on={!!opt.triggersNCR} onChange={v => {
                        const next = opts.map((o,i) => i===oi ? { ...o, triggersNCR: v } : o);
                        onUpdate({ options: next });
                      }}/> ⚠
                    </label>
                  </div>
                );
              })}
            </div>
          )}

          {/* Single Select — options with colour, weight + NCR toggle */}
          {field.fieldType === 'single-select' && isInspection && (
            <div style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <label className="label" style={{ margin:0 }}>Options & Scoring</label>
                <div style={{ fontSize:11, color:'var(--n-400)' }}>Colour · Label · Weight · ⚠</div>
              </div>
              {opts.map((opt, oi) => (
                <div key={oi} style={{ display:'flex', gap:6, alignItems:'center', marginBottom:4, position:'relative' }}>

                  {/* Colour swatch */}
                  {colorPickerOpen === oi && (
                    <div style={{ position:'fixed', inset:0, zIndex:99 }} onClick={() => setColorPickerOpen(null)}/>
                  )}
                  <div style={{ position:'relative', flexShrink:0 }}>
                    <button title="Pick colour" onClick={() => setColorPickerOpen(colorPickerOpen===oi ? null : oi)}
                      style={{ width:24, height:24, borderRadius:'50%', cursor:'pointer', flexShrink:0,
                        border: opt.color ? '2px solid rgba(0,0,0,0.15)' : '1.5px dashed var(--n-400)',
                        background: opt.color || 'transparent',
                        backgroundImage: opt.color ? 'none' : 'repeating-linear-gradient(45deg,var(--n-200) 0,var(--n-200) 2px,transparent 0,transparent 50%)',
                        backgroundSize:'6px 6px' }}/>
                    {colorPickerOpen === oi && (
                      <div style={{ position:'absolute', zIndex:100, top:30, left:0, background:'var(--n-0)',
                        border:'1px solid var(--n-200)', borderRadius:10, padding:10,
                        boxShadow:'0 4px 16px rgba(0,0,0,0.14)', width:188 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:'var(--n-500)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:6 }}>Preset</div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:8 }}>
                          <button title="No colour" onClick={() => { onUpdate({ options: opts.map((o,i) => i===oi?{...o,color:null}:o) }); setColorPickerOpen(null); }}
                            style={{ width:26, height:26, borderRadius:'50%', border:`2px solid ${!opt.color?'var(--brand-400)':'var(--n-200)'}`,
                              background:'white', cursor:'pointer', fontSize:12, color:'var(--n-400)', lineHeight:'22px' }}>∅</button>
                          {OPTION_COLORS.map(c => (
                            <button key={c} title={c} onClick={() => { onUpdate({ options: opts.map((o,i) => i===oi?{...o,color:c}:o) }); setColorPickerOpen(null); }}
                              style={{ width:26, height:26, borderRadius:'50%', cursor:'pointer',
                                border:`2px solid ${opt.color===c?'var(--brand-400)':'rgba(0,0,0,0.12)'}`,
                                background:c, outline: c==='rgba(255,255,255,1)'?'1px solid var(--n-200)':undefined }}/>
                          ))}
                        </div>
                        <div style={{ fontSize:10, fontWeight:700, color:'var(--n-500)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:5 }}>Custom</div>
                        <input type="color" value={rgbaToHex(opt.color)}
                          onChange={e => onUpdate({ options: opts.map((o,i) => i===oi?{...o,color:hexToRgba(e.target.value)}:o) })}
                          style={{ width:'100%', height:32, border:'1px solid var(--n-200)', borderRadius:6, cursor:'pointer', padding:2 }}/>
                      </div>
                    )}
                  </div>

                  <input className="input" style={{ flex:1, fontSize:12 }} placeholder="Option label" value={opt.label}
                    onChange={e => {
                      const next = opts.map((o,i) => i===oi ? { ...o, label: e.target.value } : o);
                      onUpdate({ options: next });
                    }}/>
                  <div style={{ flexShrink:0 }}>
                    <input type="number" className="input" style={{ width:64, fontSize:12 }}
                      title="Score awarded when this option is selected. Higher = better."
                      step="any" placeholder="Wt" value={opt.weight ?? 0}
                      onChange={e => {
                        const next = opts.map((o,i) => i===oi ? { ...o, weight: parseFloat(e.target.value)||0 } : o);
                        onUpdate({ options: next });
                        setWeightErrors(er => ({ ...er, ['ss_'+oi]: false }));
                      }}
                      onBlur={e => checkWeight('ss_'+oi, e.target.value)}/>
                    {weightErrors['ss_'+oi] && (
                      <div style={{ fontSize:10, color:'var(--danger)', marginTop:2, width:64 }}>Only -1 allowed as negative.</div>
                    )}
                  </div>
                  <label style={{ display:'flex', alignItems:'center', gap:3, fontSize:12, userSelect:'none', flexShrink:0 }}
                    title="When selected, this response will trigger a Non-Conformance Report.">
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

          {/* Number / Decimal validation — statistics only */}
          {field.fieldType === 'number' && !isInspection && (
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
                <label title="If on, this question must be answered before the form can be submitted." style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, userSelect:'none' }}>
                  <Switch on={!!field.required} onChange={v => onUpdate({ required: v })}/> Required
                </label>
              )}
              {isInspection && field.fieldType !== 'photo' && (
                <label title="Let the user attach a photo alongside their answer." style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, userSelect:'none' }}>
                  <Switch on={!!field.allowPhotoAttachment} onChange={v => onUpdate({ allowPhotoAttachment: v })}/> 📷 Allow photo attachment
                </label>
              )}
              {isInspection && (
                <label style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, userSelect:'none' }}>
                  <Switch on={!!field.allowComment} onChange={v => onUpdate({ allowComment: v })}/> 💬 Allow comment
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
          {opts.map(o => {
            const icon  = o.label === 'Yes' ? '✓' : o.label === 'No' ? '✗' : 'NA';
            const color = o.label === 'Yes' ? '#16a34a' : o.label === 'No' ? '#dc2626' : '#d97706';
            const bg    = o.label === 'Yes' ? '#f0fdf4' : o.label === 'No' ? '#fef2f2' : '#fffbeb';
            return (
              <div key={o.label} style={{ flex:1, padding:'6px 8px', border:`1.5px solid ${color}40`, borderRadius:8,
                background:bg, display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                <span style={{ fontSize:13, fontWeight:800, color }}>{icon}</span>
                {o.triggersNCR && <span style={{ fontSize:8, color:'#dc2626', fontWeight:700 }}>⚠</span>}
              </div>
            );
          })}
        </div>
      )}
      {field.fieldType === 'single-select' && (
        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
          {(opts.length ? opts : [{ label:'Option 1', weight:0, triggersNCR:false }]).map((opt, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 8px',
              border:`1px solid ${opt.color ? opt.color : 'var(--n-200)'}`,
              borderRadius:6, fontSize:12, color:'var(--n-600)',
              background: opt.color ? opt.color.replace(',1)',',.08)').replace(',1.0)',',.08)') : 'transparent' }}>
              <div style={{ width:11, height:11, borderRadius:'50%', flexShrink:0,
                background: opt.color || 'transparent',
                border: opt.color ? '1px solid rgba(0,0,0,0.15)' : '1.5px solid var(--n-300)' }}/>
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
      {field.allowComment && (
        <div style={{ marginTop:6, padding:'6px 10px', border:'1px solid var(--n-200)', borderRadius:6,
          fontSize:11, color:'var(--n-400)', display:'flex', alignItems:'center', gap:6 }}>
          💬 <span>Add comment (optional)</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fill-form + Score screen (Inspection only)
// ─────────────────────────────────────────────────────────────────────────────

function scoreColor(pct) {
  if (pct === null || pct === undefined)
    return { bg: 'rgba(255,255,255,1)', text: '#6b7280', border: '#e5e7eb' };
  const r = Math.round(pct);
  if (r < 50)  return { bg: 'rgba(253,0,19,1)',   text: '#fff',    border: 'rgba(253,0,19,0.25)' };
  if (r < 100) return { bg: 'rgba(254,182,43,1)', text: '#7c4200', border: 'rgba(254,182,43,0.4)' };
  return             { bg: 'rgba(0,107,68,1)',     text: '#fff',    border: 'rgba(0,107,68,0.25)' };
}

function FillQuestion({ field, questionNumber, answer, onAnswer, hasError, comment, onComment }) {
  const opts = (field.options || []).map(normalizeOpt);
  const isDecimal = field.numericType === 'decimal';

  const cardStyle = {
    background: '#fff', borderRadius: 14, padding: '14px 16px',
    border: `1.5px solid ${hasError ? 'rgba(253,0,19,0.5)' : '#e9ecef'}`,
    boxShadow: hasError ? '0 0 0 3px rgba(253,0,19,0.08)' : '0 1px 3px rgba(0,0,0,0.06)',
  };

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#111', marginBottom: field.helpText ? 4 : 10, display: 'flex', gap: 6, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#9ca3af', flexShrink: 0 }}>Q{questionNumber}</span>
        <span style={{ flex: 1 }}>{field.name || <span style={{ color: '#d1d5db', fontStyle: 'italic' }}>Untitled question</span>}</span>
        {field.required && <span style={{ color: 'rgba(253,0,19,1)', fontSize: 14, flexShrink: 0 }}>*</span>}
      </div>
      {field.helpText && (
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10, fontStyle: 'italic', lineHeight: 1.4 }}>{field.helpText}</div>
      )}
      {hasError && (
        <div style={{ fontSize: 11.5, color: 'rgba(253,0,19,1)', marginBottom: 8, fontWeight: 500 }}>This question is required</div>
      )}

      {field.fieldType === 'yes-no-na' && (
        <div style={{ display: 'flex', gap: 8 }}>
          {opts.map(opt => {
            const sel   = answer === opt.label;
            const icon  = opt.label === 'Yes' ? '✓' : opt.label === 'No' ? '✗' : 'NA';
            const color = opt.label === 'Yes' ? '#16a34a' : opt.label === 'No' ? '#dc2626' : '#d97706';
            const bg    = opt.label === 'Yes' ? '#f0fdf4' : opt.label === 'No' ? '#fef2f2' : '#fffbeb';
            return (
              <button key={opt.label} onClick={() => onAnswer(sel ? null : opt.label)}
                style={{ flex: 1, padding: '12px 6px', border: `2px solid ${sel ? color : '#e5e7eb'}`,
                  borderRadius: 12, background: sel ? color : bg,
                  color: sel ? '#fff' : color,
                  fontSize: 16, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  transition: 'all 0.12s' }}>
                {icon}
                {opt.triggersNCR && <span style={{ fontSize: 9, opacity: 0.8 }}>⚠</span>}
              </button>
            );
          })}
        </div>
      )}

      {field.fieldType === 'single-select' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {opts.map((opt, i) => {
            const sel = answer === opt.label;
            const c   = opt.color || null;
            const dotColor   = sel ? (c || '#111') : (c || '#d1d5db');
            const dotBg      = sel ? (c || '#111') : 'transparent';
            const btnBorder  = sel ? (c || '#111') : (c ? c.replace(',1)',',.35)').replace(',1.0)',',.35)') : '#e5e7eb');
            const btnBg      = sel ? (c ? c.replace(',1)',',.18)').replace(',1.0)',',.18)') : '#f8f9fa') : '#fafafa';
            return (
              <button key={i} onClick={() => onAnswer(sel ? null : opt.label)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                  border: `1.5px solid ${btnBorder}`,
                  borderRadius: 11, background: btnBg, cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${dotColor}`,
                  background: dotBg, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {sel && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }}/>}
                </div>
                <span style={{ fontSize: 13.5, color: '#111', fontWeight: sel ? 600 : 400, flex: 1 }}>{opt.label}</span>
                {opt.triggersNCR && <span style={{ fontSize: 10, color: 'rgba(253,0,19,1)', fontWeight: 700 }}>⚠ NCR</span>}
              </button>
            );
          })}
        </div>
      )}

      {field.fieldType === 'text' && (
        <input className="input" style={{ fontSize: 13, borderRadius: 10 }}
          value={answer || ''} placeholder={field.placeholder || 'Enter answer…'}
          onChange={e => onAnswer(e.target.value || null)}/>
      )}

      {field.fieldType === 'long-text' && (
        <textarea className="input" rows={3}
          style={{ fontSize: 13, borderRadius: 10, resize: 'none' }}
          value={answer || ''} placeholder={field.placeholder || 'Enter details…'}
          onChange={e => onAnswer(e.target.value || null)}/>
      )}

      {field.fieldType === 'number' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="number" className="input" style={{ fontSize: 13, borderRadius: 10, flex: 1 }}
            value={answer || ''} placeholder="0"
            step={isDecimal ? 'any' : '1'}
            min={field.min != null ? field.min : undefined}
            max={field.max != null ? field.max : undefined}
            onChange={e => onAnswer(e.target.value || null)}/>
          {field.unit && <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500, flexShrink: 0 }}>{field.unit}</span>}
        </div>
      )}

      {field.fieldType === 'date-time' && (
        <input type={field.dtMode === 'time' ? 'time' : field.dtMode === 'date' ? 'date' : 'datetime-local'}
          className="input" style={{ fontSize: 13, borderRadius: 10 }}
          value={answer || ''}
          onChange={e => onAnswer(e.target.value || null)}/>
      )}

      {field.fieldType === 'photo' && (
        <button onClick={() => onAnswer(answer ? null : 'captured')}
          style={{ width: '100%', padding: '20px 12px', border: `1.5px dashed ${answer ? 'rgba(0,107,68,1)' : '#d1d5db'}`,
            borderRadius: 12, background: answer ? 'rgba(0,107,68,0.05)' : '#fafafa', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 26 }}>{answer ? '✓' : '📷'}</span>
          <span style={{ fontSize: 12, color: answer ? 'rgba(0,107,68,1)' : '#6b7280', fontWeight: 500 }}>
            {answer ? 'Photo captured — tap to remove' : `Tap to add photo${field.allowVideo !== false ? ' / video' : ''}`}
          </span>
          {!answer && field.maxPhotos && <span style={{ fontSize: 11, color: '#9ca3af' }}>Max {field.maxPhotos} files</span>}
        </button>
      )}

      {field.fieldType === 'location' && (
        <button onClick={() => onAnswer(answer ? null : '25.2854° N, 51.5310° E')}
          style={{ width: '100%', padding: '13px', border: `1.5px solid ${answer ? 'rgba(0,107,68,1)' : '#e5e7eb'}`,
            borderRadius: 11, background: answer ? 'rgba(0,107,68,0.05)' : '#fafafa', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <span style={{ fontSize: 16 }}>📍</span>
          <span style={{ fontSize: 13, color: answer ? 'rgba(0,107,68,1)' : '#374151', fontWeight: 500 }}>
            {answer ? answer : 'Tap to capture location'}
          </span>
        </button>
      )}

      {field.allowPhotoAttachment && field.fieldType !== 'photo' && (
        <div style={{ marginTop: 10, padding: '8px 12px', border: '1px dashed #d1d5db', borderRadius: 10,
          fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6 }}>
          📷 <span>Optional — attach photo or video evidence</span>
        </div>
      )}
      {field.allowComment && (
        <div style={{ marginTop: 10 }}>
          <textarea className="input" rows={2}
            style={{ fontSize: 12, borderRadius: 10, resize: 'none', padding: '8px 12px' }}
            value={comment || ''}
            placeholder="💬 Add a comment (optional)…"
            onChange={e => onComment(e.target.value || null)}/>
        </div>
      )}
    </div>
  );
}

function InspectionFillScreen({ form, onClose }) {
  const [sectionIdx, setSectionIdx] = useState(0);
  const [answers, setAnswers]       = useState({});
  const [errors, setErrors]         = useState({});
  const [submitted, setSubmitted]   = useState(false);

  const sections = (form.sections || []).filter(s => s.fields.length > 0);

  function setAnswer(fid, val) {
    setAnswers(a => ({ ...a, [fid]: val }));
    if (errors[fid]) setErrors(e => { const n = { ...e }; delete n[fid]; return n; });
  }

  function bulkApply(value, fieldType) {
    const updates = {};
    sections[sectionIdx].fields.forEach(f => {
      if (f.fieldType !== fieldType) return;
      if (fieldType === 'single-select') {
        const opts = (f.options || []).map(normalizeOpt);
        if (!opts.some(o => o.label === value)) return;
      }
      updates[f.id] = value;
    });
    setAnswers(a => ({ ...a, ...updates }));
    setErrors(e => { const n = { ...e }; Object.keys(updates).forEach(k => delete n[k]); return n; });
  }

  function validate(sec) {
    const errs = {};
    (sec.fields || []).forEach(f => {
      if (!f.required) return;
      const v = answers[f.id];
      if (v === undefined || v === null || v === '') errs[f.id] = true;
    });
    return errs;
  }

  function goNext() {
    const errs = validate(sections[sectionIdx]);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSectionIdx(i => i + 1);
    window.scrollTo && window.scrollTo(0, 0);
  }

  function goBack() {
    setErrors({});
    setSectionIdx(i => i - 1);
  }

  function submit() {
    const errs = validate(sections[sectionIdx]);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitted(true);
  }

  function calcScore(fields) {
    let result = 0, total = 0, hasWeighted = false;
    fields.forEach(f => {
      const opts = (f.options || []).map(normalizeOpt);
      const eligible = opts.filter(o => (o.weight ?? 0) !== -1);
      const maxW = eligible.length ? Math.max(0, ...eligible.map(o => o.weight || 0)) : 0;
      if (maxW <= 0) return;
      const ans = answers[f.id];
      const chosen = ans ? opts.find(o => o.label === ans) : null;
      if (chosen && (chosen.weight ?? 0) === -1) return; // excluded from score
      hasWeighted = true;
      total += maxW;
      if (chosen) result += chosen.weight || 0;
    });
    if (!hasWeighted || total === 0) return null;
    return Math.min(100, (result / total) * 100);
  }

  function calcOverall() {
    let result = 0, total = 0, has = false;
    sections.forEach(s => s.fields.forEach(f => {
      const opts = (f.options || []).map(normalizeOpt);
      const eligible = opts.filter(o => (o.weight ?? 0) !== -1);
      const maxW = eligible.length ? Math.max(0, ...eligible.map(o => o.weight || 0)) : 0;
      if (maxW <= 0) return;
      const ans = answers[f.id];
      const chosen = ans ? opts.find(o => o.label === ans) : null;
      if (chosen && (chosen.weight ?? 0) === -1) return;
      has = true; total += maxW;
      if (chosen) result += chosen.weight || 0;
    }));
    if (!has || total === 0) return null;
    return Math.min(100, (result / total) * 100);
  }

  const phoneShell = {
    width: 390, height: 750, background: '#f5f5f7', borderRadius: 50, overflow: 'hidden',
    boxShadow: '0 0 0 10px #1c1c1e, 0 0 0 12px #3a3a3c, 0 32px 64px rgba(0,0,0,0.55)',
    display: 'flex', flexDirection: 'column', position: 'relative',
  };

  if (submitted) {
    return (
      <ScoreScreen
        form={form} sections={sections}
        sectionScores={sections.map(s => calcScore(s.fields))}
        overallScore={calcOverall()}
        onClose={onClose}
      />
    );
  }

  if (!sections.length) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', textAlign: 'center', maxWidth: 320 }}
          onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 6 }}>No questions yet</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>Add some fields to the form sections first.</div>
          <button className="btn primary" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  const section = sections[sectionIdx];
  const isFirst = sectionIdx === 0;
  const isLast  = sectionIdx === sections.length - 1;
  const errorCount = Object.keys(errors).length;

  // Bulk bar: uniform-options check — returns opts array if all fields of type share identical options, else null
  function uniformOpts(fields, type) {
    const matching = fields.filter(f => f.fieldType === type);
    if (!matching.length) return null;
    const ref = (matching[0].options || []).map(normalizeOpt).map(o => o.label).join('|');
    for (const f of matching.slice(1)) {
      if ((f.options || []).map(normalizeOpt).map(o => o.label).join('|') !== ref) return null;
    }
    return (matching[0].options || []).map(normalizeOpt);
  }

  const secYNN      = uniformOpts(section.fields, 'yes-no-na');
  const secSS       = uniformOpts(section.fields, 'single-select');
  const showBulkBar = !!(secYNN || secSS);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={phoneShell} onClick={e => e.stopPropagation()}>

        {/* Status bar */}
        <div style={{ background: '#fff', padding: '14px 28px 6px', display: 'flex', justifyContent: 'space-between',
          fontSize: 12, fontWeight: 600, color: '#111', flexShrink: 0, position: 'relative' }}>
          <span>9:41</span>
          <div style={{ width: 88, height: 22, background: '#000', borderRadius: 14,
            position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 10 }}/>
          <span style={{ fontSize: 11 }}>●●● 87%</span>
        </div>

        {/* App header */}
        <div style={{ background: '#fff', padding: '8px 18px 14px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <button style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#374151', padding: '0 4px', lineHeight: 1 }}
              onClick={onClose}>‹</button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15.5, fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {form.name || 'Inspection'}
              </div>
              <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 1 }}>
                Section {sectionIdx + 1} of {sections.length}
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div style={{ height: 5, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${((sectionIdx + 1) / sections.length) * 100}%`,
              background: 'rgba(0,107,68,1)', borderRadius: 4, transition: 'width 0.3s ease' }}/>
          </div>
        </div>

        {/* Section label */}
        <div style={{ background: '#fff', padding: '12px 18px 10px', borderBottom: '1px solid #f5f5f7', flexShrink: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#111' }}>{section.title}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
            {section.fields.length} question{section.fields.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Bulk fill bar — section-level only */}
        {showBulkBar && (
          <div style={{ background: '#fff', padding: '10px 16px 8px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
            <div style={{ fontSize: 10.5, color: '#9ca3af', marginBottom: 6 }}>Apply one answer to all questions in this section</div>

            {/* Yes/No/NA row */}
            {secYNN && (
              <div style={{ display: 'flex', gap: 6, marginBottom: secSS ? 6 : 0 }}>
                {[{l:'Yes',i:'✓',c:'#16a34a',bg:'#f0fdf4'},{l:'No',i:'✗',c:'#dc2626',bg:'#fef2f2'},{l:'NA',i:'NA',c:'#d97706',bg:'#fffbeb'}].map(opt => (
                  <button key={opt.l} onClick={() => bulkApply(opt.l, 'yes-no-na')}
                    style={{ flex: 1, padding: '7px 4px', border: `1.5px solid ${opt.c}35`,
                      borderRadius: 10, background: opt.bg, color: opt.c,
                      fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
                    {opt.i}
                  </button>
                ))}
              </div>
            )}

            {/* Single Select row */}
            {secSS && (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {secSS.map(opt => (
                  <button key={opt.label} onClick={() => bulkApply(opt.label, 'single-select')}
                    style={{ padding: '4px 11px', border: '1.5px solid #e5e7eb', borderRadius: 20,
                      background: '#f9fafb', color: '#374151', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

          </div>
        )}

        {/* Questions — scrollable */}
        <div style={{ flex: 1, overflow: 'auto', padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {section.fields.map((f, fi) => (
            <FillQuestion key={f.id} field={f} questionNumber={fi + 1}
              answer={answers[f.id]} onAnswer={v => setAnswer(f.id, v)} hasError={!!errors[f.id]}
              comment={answers[f.id + '_comment']} onComment={v => setAnswer(f.id + '_comment', v)}/>
          ))}
          <div style={{ height: 4 }}/>
        </div>

        {/* Bottom CTA */}
        <div style={{ background: '#fff', borderTop: '1px solid #f0f0f0', padding: '12px 18px 28px', flexShrink: 0 }}>
          {errorCount > 0 && (
            <div style={{ fontSize: 12, color: 'rgba(253,0,19,1)', marginBottom: 8, textAlign: 'center', fontWeight: 500 }}>
              {errorCount} required question{errorCount !== 1 ? 's' : ''} need{errorCount === 1 ? 's' : ''} an answer
            </div>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            {!isFirst && (
              <button onClick={goBack}
                style={{ flex: 1, padding: '13px', border: '1.5px solid #e5e7eb', borderRadius: 12,
                  background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                ← Back
              </button>
            )}
            <button onClick={isLast ? submit : goNext}
              style={{ flex: isFirst ? 1 : 2, padding: '13px', border: 'none', borderRadius: 12,
                background: isLast ? 'rgba(0,107,68,1)' : '#111',
                color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {isLast ? '✓ Submit' : 'Next →'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function ScoreScreen({ form, sections, sectionScores, overallScore, onClose }) {
  const oC = scoreColor(overallScore);
  const pctLabel = p => p === null ? 'N/A' : Math.round(p) + '%';
  const verdict = p => {
    if (p === null) return 'Not Scored';
    if (p === 100)  return 'Excellent';
    if (p >= 75)    return 'Acceptable';
    if (p >= 50)    return 'Needs Improvement';
    return 'Critical';
  };

  const phoneShell = {
    width: 390, height: 750, background: '#f5f5f7', borderRadius: 50, overflow: 'hidden',
    boxShadow: '0 0 0 10px #1c1c1e, 0 0 0 12px #3a3a3c, 0 32px 64px rgba(0,0,0,0.55)',
    display: 'flex', flexDirection: 'column',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,0.72)',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={phoneShell} onClick={e => e.stopPropagation()}>

        {/* Status bar */}
        <div style={{ background: '#fff', padding: '14px 28px 6px', display: 'flex', justifyContent: 'space-between',
          fontSize: 12, fontWeight: 600, color: '#111', flexShrink: 0, position: 'relative' }}>
          <span>9:41</span>
          <div style={{ width: 88, height: 22, background: '#000', borderRadius: 14,
            position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 10 }}/>
          <span style={{ fontSize: 11 }}>●●● 87%</span>
        </div>

        {/* Header */}
        <div style={{ background: '#fff', padding: '10px 18px 16px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Inspection Results</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{form.name}</div>
        </div>

        {/* Overall score hero */}
        <div style={{ padding: '22px 20px 18px', background: '#fff', borderBottom: '1px solid #f5f5f7', flexShrink: 0 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 14 }}>
            OVERALL SCORE
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{
              width: 90, height: 90, borderRadius: '50%',
              background: oC.bg, border: `3px solid ${oC.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: overallScore !== null ? `0 6px 20px ${oC.bg}70` : '0 2px 8px rgba(0,0,0,0.07)',
            }}>
              <span style={{ fontSize: overallScore !== null ? 22 : 14, fontWeight: 800, color: oC.text, lineHeight: 1 }}>
                {pctLabel(overallScore)}
              </span>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#111', lineHeight: 1.1 }}>
                {verdict(overallScore)}
              </div>
              <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 6 }}>
                {sections.length} section{sections.length !== 1 ? 's' : ''} completed
              </div>
            </div>
          </div>
        </div>

        {/* Section scores */}
        <div style={{ flex: 1, overflow: 'auto', padding: '16px 14px' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 10 }}>
            SECTION SCORES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sections.map((sec, i) => {
              const pct = sectionScores[i];
              const c = scoreColor(pct);
              return (
                <div key={sec.id} style={{ background: '#fff', borderRadius: 14, padding: '14px 16px',
                  border: '1px solid #e9ecef', display: 'flex', alignItems: 'center', gap: 14,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 14, background: c.bg,
                    border: `2px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: pct !== null ? `0 3px 10px ${c.bg}55` : '0 1px 4px rgba(0,0,0,0.06)',
                  }}>
                    <span style={{ fontSize: pct !== null ? 13 : 11, fontWeight: 800, color: c.text }}>
                      {pctLabel(pct)}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sec.title}</div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 3 }}>
                      {sec.fields.length} question{sec.fields.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>
                    {pct === null ? '—' : pct === 100 ? '✓' : pct >= 50 ? '~' : '✕'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Close button */}
        <div style={{ background: '#fff', borderTop: '1px solid #f0f0f0', padding: '14px 18px 30px', flexShrink: 0 }}>
          <button onClick={onClose}
            style={{ width: '100%', padding: '14px', border: 'none', borderRadius: 13,
              background: '#111', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

Object.assign(window, { FormBuilder });
