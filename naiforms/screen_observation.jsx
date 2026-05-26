// Observation Workflow Builder — 15 system fields + custom fields, drag-to-reorder
function ObservationWorkflow() {
  const TAG_COLORS = {
    'User Input':                { bg:'#eff6ff', border:'#bfdbfe', text:'#1d4ed8' },
    'AI Generated':              { bg:'#f5f3ff', border:'#ddd6fe', text:'#6d28d9' },
    'LLM Predicted':             { bg:'#fffbeb', border:'#fde68a', text:'#b45309' },
    'Derived':                   { bg:'#f1f5f9', border:'#cbd5e1', text:'#475569' },
    'Derived / User Input':      { bg:'#f1f5f9', border:'#cbd5e1', text:'#475569' },
    'Editable':                  { bg:'#f0fdf4', border:'#bbf7d0', text:'#15803d' },
    'Non-Editable':              { bg:'#fef2f2', border:'#fecaca', text:'#dc2626' },
    'Hidden on UI':              { bg:'#1e293b', border:'#334155', text:'#e2e8f0' },
    'Saved to DB':               { bg:'#0f172a', border:'#1e293b', text:'#cbd5e1' },
    'Optional':                  { bg:'#f8fafc', border:'#e2e8f0', text:'#94a3b8' },
    'Fallback: Project Location':{ bg:'#f1f5f9', border:'#cbd5e1', text:'#475569' },
    'Project Timezone':          { bg:'#f1f5f9', border:'#cbd5e1', text:'#475569' },
    'Based on document':         { bg:'#fffbeb', border:'#fde68a', text:'#b45309' },
    'From first image':          { bg:'#f5f3ff', border:'#ddd6fe', text:'#6d28d9' },
  };

  const SYSTEM_FIELDS = [
    { id:'obs-1',  name:'User Message',                 isSystem:true, tags:['User Input','Hidden on UI','Saved to DB'],
      inputType:'hidden',   config:['label'] },
    { id:'obs-2',  name:'Observation Details',          isSystem:true, tags:['AI Generated','Editable'],
      inputType:'longtext', config:['label','helpText'] },
    { id:'obs-3',  name:'Images',                       isSystem:true, tags:['User Input','Editable'],
      inputType:'photos',   config:['label','maxImages'], maxImages:5 },
    { id:'obs-4',  name:'Hazard Type',                  isSystem:true, tags:['LLM Predicted','Editable'],
      inputType:'dropdown', config:['label','options'],
      options:['Working at Height','Electrical','Chemical / Hazardous','Fire / Explosion','Manual Handling','Machinery / Equipment','Slip / Trip / Fall','Confined Space','Environmental','Housekeeping'] },
    { id:'obs-5',  name:'Severity',                     isSystem:true, tags:['LLM Predicted','Editable'],
      inputType:'dropdown', config:['label','options'],
      options:['Low','Medium','High','Critical'] },
    { id:'obs-6',  name:'Root Cause',                   isSystem:true, tags:['LLM Predicted','Editable'],
      inputType:'dropdown', config:['label','options'],
      options:['Human Error','Equipment Failure','Process Gap','Environmental Factor','Management Failure','Lack of Training'] },
    { id:'obs-7',  name:'Secondary Root Cause',         isSystem:true, tags:['LLM Predicted','Editable'],
      inputType:'dropdown', config:['label','options'],
      options:['Inadequate PPE','Poor Housekeeping','Fatigue','Communication Failure','Procedure Not Followed','Inadequate Supervision'] },
    { id:'obs-8',  name:'Record Type',                  isSystem:true, tags:['User Input','Editable'],
      inputType:'dropdown', config:['label','options'],
      options:['Near Miss','Unsafe Act','Unsafe Condition','Good Practice'] },
    { id:'obs-9',  name:'Location',                     isSystem:true, tags:['Derived / User Input','Editable','Fallback: Project Location'],
      inputType:'text',     config:['label','helpText'] },
    { id:'obs-10', name:'Location Coordinates',         isSystem:true, tags:['Derived / User Input','Editable'],
      inputType:'latlong',  config:['label'] },
    { id:'obs-11', name:'Observation Time',             isSystem:true, tags:['Derived','Editable','Project Timezone'],
      inputType:'datetime', config:['label'] },
    { id:'obs-12', name:'Suggested Mitigation Actions', isSystem:true, tags:['LLM Predicted','Non-Editable','Based on document'],
      inputType:'readonly', config:['label','document'] },
    { id:'obs-13', name:'Reviewer',                     isSystem:true, tags:['Derived / User Input','Editable'],
      inputType:'userpicker', config:['label','assignRule'], assignRule:'by-role' },
    { id:'obs-14', name:'Image Analysis',               isSystem:true, tags:['AI Generated','Non-Editable','From first image'],
      inputType:'readonly', config:['label','showHide'], showAnalysis:true },
    { id:'obs-15', name:'Did you take any Actions?',    isSystem:true, tags:['User Input','Editable','Optional'],
      inputType:'longtext', config:['label','helpText','required'], required:false },
  ];

  const CUSTOM_TYPES = [
    { type:'single-select', label:'Single Select', icon:'◎' },
    { type:'dropdown',      label:'Dropdown',      icon:'▾' },
    { type:'multi-choice',  label:'Multi-choice',  icon:'☑' },
    { type:'short-text',    label:'Short Text',    icon:'T' },
    { type:'long-text',     label:'Long Text',     icon:'¶' },
    { type:'number',        label:'Number',        icon:'#' },
    { type:'date-time',     label:'Date / Time',   icon:'📅', disabled:true, tooltip:'Date & Time already exists in this workflow and cannot be added again.' },
    { type:'location',      label:'Location',      icon:'📍', disabled:true, tooltip:'Location already exists in this workflow and cannot be added again.' },
  ];

  const [fields,       setFields]       = React.useState(SYSTEM_FIELDS);
  const [saved,        setSaved]        = React.useState(false);
  const [showTypeMenu, setShowTypeMenu] = React.useState(false);
  const [dragIdx,      setDragIdx]      = React.useState(null);
  const [dragOver,     setDragOver]     = React.useState(null);

  function updateField(id, patch) {
    setFields(fs => fs.map(f => f.id !== id ? f : { ...f, ...patch }));
    setSaved(false);
  }

  function addCustomField(type) {
    const f = {
      id: 'custom-' + Date.now(), name: '', isSystem: false,
      tags: ['User Input', 'Editable'],
      inputType: ['single-select','dropdown'].includes(type) ? 'dropdown' : type === 'multi-choice' ? 'multi-choice' : type,
      fieldType: type,
      config: ['label','helpText','required'],
      options: ['single-select','dropdown','multi-choice'].includes(type) ? ['Option 1','Option 2'] : undefined,
      required: false,
    };
    setFields(fs => [...fs, f]);
    setShowTypeMenu(false);
    setSaved(false);
  }

  function removeCustomField(id) {
    setFields(fs => fs.filter(f => f.id !== id));
    setSaved(false);
  }

  function save() { setSaved(true); setTimeout(() => setSaved(false), 2400); }

  // drag-to-reorder
  function onDragStart(i) { setDragIdx(i); }
  function onDragOver(e, i) { e.preventDefault(); setDragOver(i); }
  function onDrop(i) {
    if (dragIdx == null || dragIdx === i) { setDragIdx(null); setDragOver(null); return; }
    setFields(fs => {
      const next = [...fs];
      const [item] = next.splice(dragIdx, 1);
      next.splice(i, 0, item);
      return next;
    });
    setDragIdx(null); setDragOver(null);
    setSaved(false);
  }

  return (
    <>
      <TopBar crumbs={['Masters', 'Observation Workflow']} actions={
        <Btn variant="primary" onClick={save}>{saved ? '✓ Saved' : 'Save Changes'}</Btn>
      }/>
      <div className="page">
        <div className="page-head">
          <div>
            <h1>Observation Workflow</h1>
            <div className="sub">This workflow is used across all projects. Changes apply globally.</div>
          </div>
          <Badge tone="neutral">{fields.length} fields</Badge>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {fields.map((field, idx) => (
            <ObsFieldCard key={field.id} field={field} idx={idx}
              tagColors={TAG_COLORS}
              isDragOver={dragOver === idx}
              onDragStart={() => onDragStart(idx)}
              onDragOver={e => onDragOver(e, idx)}
              onDrop={() => onDrop(idx)}
              onDragEnd={() => { setDragIdx(null); setDragOver(null); }}
              onChange={patch => updateField(field.id, patch)}
              onDelete={field.isSystem ? null : () => removeCustomField(field.id)}/>
          ))}
        </div>

        {/* + New Field */}
        <div style={{ marginTop:12, position:'relative', display:'inline-block' }}>
          <button className="btn"
            style={{ display:'flex', alignItems:'center', gap:6, fontSize:13 }}
            onClick={() => setShowTypeMenu(v => !v)}>
            + New Field
          </button>
          {showTypeMenu && (
            <div style={{ position:'absolute', top:'100%', left:0, marginTop:4, zIndex:100,
              background:'var(--n-0)', border:'1px solid var(--n-200)', borderRadius:8,
              boxShadow:'0 4px 16px rgba(0,0,0,0.12)', minWidth:220, overflow:'hidden' }}>
              {CUSTOM_TYPES.map(t => (
                <button key={t.type}
                  onClick={() => !t.disabled && addCustomField(t.type)}
                  title={t.disabled ? t.tooltip : undefined}
                  style={{ display:'flex', alignItems:'center', gap:10, width:'100%', padding:'9px 14px',
                    background:'none', border:'none', cursor:t.disabled?'default':'pointer', textAlign:'left',
                    opacity:t.disabled?0.4:1, fontSize:13 }}
                  onMouseOver={e => { if (!t.disabled) e.currentTarget.style.background='var(--n-50)'; }}
                  onMouseOut={e => e.currentTarget.style.background='none'}>
                  <span style={{ fontSize:16, width:20, textAlign:'center' }}>{t.icon}</span>
                  <div>
                    <div style={{ fontWeight:500 }}>{t.label}</div>
                    {t.disabled && <div style={{ fontSize:10.5, color:'var(--n-400)', marginTop:1 }}>{t.tooltip}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:24 }}>
          <Btn variant="primary" onClick={save}>{saved ? '✓ Saved' : 'Save Changes'}</Btn>
        </div>
      </div>
      {showTypeMenu && <div style={{ position:'fixed', inset:0, zIndex:99 }} onClick={() => setShowTypeMenu(false)}/>}
    </>
  );
}

function ObsFieldCard({ field, idx, tagColors, isDragOver, onDragStart, onDragOver, onDrop, onDragEnd, onChange, onDelete }) {
  const [expanded, setExpanded] = React.useState(false);

  const inputTypeLabel = {
    hidden:     'Hidden',
    longtext:   'Long Text',
    photos:     'Photo Upload',
    dropdown:   'Dropdown',
    'multi-choice':'Multi-choice',
    text:       'Short Text',
    latlong:    'Lat / Long',
    datetime:   'Date & Time',
    readonly:   'Read-only',
    userpicker: 'User Picker',
    'short-text':'Short Text',
    'long-text': 'Long Text',
    number:     'Number',
  }[field.inputType || field.fieldType] || field.inputType;

  return (
    <div draggable
      onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd}
      style={{
        border: `1.5px solid ${isDragOver ? 'var(--brand-400)' : expanded ? 'var(--brand-300)' : 'var(--n-200)'}`,
        borderRadius:10, background: isDragOver ? 'var(--brand-50)' : expanded ? '#f8faff' : 'var(--n-0)',
        overflow:'hidden', transition:'border-color 0.1s', opacity: isDragOver ? 0.7 : 1,
      }}>

      {/* Card header */}
      <div onClick={() => setExpanded(e => !e)}
        style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', cursor:'pointer', userSelect:'none' }}>

        {/* Drag handle */}
        <span style={{ fontSize:14, color:'var(--n-300)', cursor:'grab', flexShrink:0 }}
          onMouseDown={e => e.stopPropagation()}>⋮⋮</span>

        {/* Number */}
        <span style={{ fontSize:11, fontWeight:700, color:'var(--n-400)', width:20, textAlign:'right', flexShrink:0 }}>{idx + 1}</span>

        {/* Name + tags */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:600, fontSize:13.5, display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
            <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {field.name || <span style={{ color:'var(--n-300)', fontStyle:'italic' }}>Untitled field</span>}
            </span>
            {!field.isSystem && <span style={{ fontSize:10, padding:'1px 6px', borderRadius:4, background:'#f0fdf4', color:'#15803d', fontWeight:600, border:'1px solid #bbf7d0', flexShrink:0 }}>Custom</span>}
          </div>
          <div style={{ display:'flex', gap:4, marginTop:4, flexWrap:'wrap' }}>
            {(field.tags || []).map(tag => {
              const c = tagColors[tag] || { bg:'#f1f5f9', border:'#cbd5e1', text:'#475569' };
              return (
                <span key={tag} style={{ fontSize:10.5, padding:'1px 7px', borderRadius:10, fontWeight:600,
                  background:c.bg, border:`1px solid ${c.border}`, color:c.text, whiteSpace:'nowrap' }}>
                  {tag}
                </span>
              );
            })}
          </div>
        </div>

        {/* Input type badge */}
        <span style={{ fontSize:11, color:'var(--n-500)', fontWeight:500, flexShrink:0 }}>{inputTypeLabel}</span>

        {/* Delete for custom fields */}
        {onDelete && (
          <button className="btn ghost icon-only sm" style={{ flexShrink:0, color:'var(--danger)' }}
            onClick={e => { e.stopPropagation(); onDelete(); }}>✕</button>
        )}

        <span style={{ fontSize:10, color:'var(--n-400)', flexShrink:0 }}>{expanded?'▲':'▼'}</span>
      </div>

      {/* Config body */}
      {expanded && (
        <div style={{ padding:'0 14px 16px', borderTop:'1px solid var(--n-100)' }}>

          {/* Label */}
          <div style={{ marginTop:14, marginBottom:10 }}>
            <label className="label">Label</label>
            <input className="input" style={{ fontSize:12 }} value={field.name} maxLength={80}
              placeholder="Field label (max 80 chars)"
              onChange={e => onChange({ name: e.target.value })}/>
          </div>

          {/* Help text */}
          {(field.config||[]).includes('helpText') && (
            <div style={{ marginBottom:10 }}>
              <label className="label">Help text <span style={{ fontWeight:400, color:'var(--n-400)' }}>(optional)</span></label>
              <input className="input" style={{ fontSize:12 }} value={field.helpText||''} maxLength={200}
                placeholder="Guidance shown under the field…"
                onChange={e => onChange({ helpText: e.target.value })}/>
            </div>
          )}

          {/* Field 1 — hidden info banner */}
          {field.inputType === 'hidden' && (
            <div style={{ padding:'8px 10px', background:'#0f172a', borderRadius:6, fontSize:12, color:'#94a3b8', marginBottom:10 }}>
              This field captures the raw user message. It is <strong style={{ color:'#e2e8f0' }}>never shown in the app UI</strong> and is saved silently to the database.
            </div>
          )}

          {/* Options editor — dropdown/multi-choice fields */}
          {(field.config||[]).includes('options') && (
            <div style={{ marginBottom:10 }}>
              <label className="label">Options</label>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {(field.options||[]).map((opt, i) => (
                  <div key={i} style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <input className="input" style={{ flex:1, fontSize:12 }} value={opt}
                      onChange={e => {
                        const next = (field.options||[]).map((o,j) => j===i?e.target.value:o);
                        onChange({ options: next });
                      }}/>
                    <button className="btn ghost icon-only sm"
                      onClick={() => onChange({ options: (field.options||[]).filter((_,j) => j!==i) })}>✕</button>
                  </div>
                ))}
              </div>
              <button className="btn sm" style={{ marginTop:5 }}
                onClick={() => onChange({ options: [...(field.options||[]), 'New option'] })}>
                + Add option
              </button>
            </div>
          )}

          {/* Max images */}
          {(field.config||[]).includes('maxImages') && (
            <div style={{ marginBottom:10 }}>
              <label className="label">Max images</label>
              <input type="number" className="input" style={{ fontSize:12, width:80 }} min={1} max={20}
                value={field.maxImages||5}
                onChange={e => onChange({ maxImages: +e.target.value })}/>
            </div>
          )}

          {/* Document upload for field 12 */}
          {(field.config||[]).includes('document') && (
            <div style={{ marginBottom:10 }}>
              <label className="label">Reference document</label>
              <div style={{ padding:'12px', border:'1.5px dashed var(--n-300)', borderRadius:6, textAlign:'center', fontSize:12, color:'var(--n-400)' }}>
                {field.documentName
                  ? <span>📄 {field.documentName} <button style={{ background:'none', border:'none', color:'var(--danger)', cursor:'pointer', fontSize:11 }} onClick={() => onChange({ documentName:null })}>Remove</button></span>
                  : <span>Drop PDF or DOCX here, or <label style={{ color:'var(--brand-600)', cursor:'pointer', fontWeight:500 }}>browse</label></span>
                }
              </div>
              {field.documentName && (
                <div style={{ fontSize:11, color:'var(--n-400)', marginTop:4 }}>Based on: {field.documentName}</div>
              )}
            </div>
          )}

          {/* Assign rule for Reviewer */}
          {(field.config||[]).includes('assignRule') && (
            <div style={{ marginBottom:10 }}>
              <label className="label">Default assignment rule</label>
              <div style={{ display:'flex', gap:6 }}>
                {['by-role','by-user','manual'].map(rule => (
                  <button key={rule}
                    onClick={() => onChange({ assignRule: rule })}
                    style={{ padding:'5px 12px', fontSize:12, borderRadius:6, cursor:'pointer',
                      border:`1.5px solid ${(field.assignRule||'by-role')===rule?'var(--brand-500)':'var(--n-200)'}`,
                      background:(field.assignRule||'by-role')===rule?'var(--brand-50)':'var(--n-0)',
                      color:(field.assignRule||'by-role')===rule?'var(--brand-700)':'var(--n-600)',
                      fontWeight:(field.assignRule||'by-role')===rule?600:400 }}>
                    {rule==='by-role'?'By Role':rule==='by-user'?'By User':'Manual'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Show/hide toggle for Image Analysis */}
          {(field.config||[]).includes('showHide') && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <Switch on={field.showAnalysis !== false} onChange={v => onChange({ showAnalysis: v })}/>
              <span style={{ fontSize:12, color:'var(--n-700)' }}>Show Image Analysis on form</span>
            </div>
          )}

          {/* Required toggle */}
          {(field.config||[]).includes('required') && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <Switch on={!!field.required} onChange={v => onChange({ required: v })}/>
              <span style={{ fontSize:12, color:'var(--n-700)' }}>Required</span>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

Object.assign(window, { ObservationWorkflow });
