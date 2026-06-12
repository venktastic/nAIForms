// Inspection submission detail screen
const { useState } = React;

// ── Embedded sample submission ────────────────────────────────────────────────
// images: array of hex colour strings = placeholder thumbnails (no real URLs needed)
const _INSP_SAMPLE = {
  id: 'DEMINS21', topic: 'Fire Surveillance', type: 'Adhoc',
  conductedBy: 'Rakesh Hirani', conductedOn: '20 Apr 2026, 10:10 AM',
  conductedAt: 'Dubai', score: 72,
  sections: [
    { id:'s1', name:'Fire', score:100, location:'Block A, Ground Floor',
      questions:[
        { id:'q1', num:1, text:'Is a suitable and sufficient Fire Risk Assessment available for the area which is approved and remains valid for the current tasks and environment?',
          response:'Good Practice', comment:'Fire Risk Assessment dated March 2026 is available and signed off by the site HSE manager.', images:['#4ade80','#86efac'] },
        { id:'q2', num:2, text:'Are sufficient fire escape routes, exits and assembly points provided?',
          response:'Good Practice', comment:'Three clearly marked exit routes confirmed. Assembly point at north gate.', images:['#4ade80'] },
        { id:'q3', num:3, text:'Have an appropriate number and type of fire/smoke/heat detection systems been installed in areas identified via the fire risk assessment?',
          response:'Good Practice', comment:'', images:['#4ade80','#86efac','#6ee7b7'] },
        { id:'q4', num:4, text:'Are there appropriate arrangements for raising an effective audible alarm in the event of a fire event?',
          response:'Good Practice', comment:'Alarm tested last week, all zones operational.', images:[] },
        { id:'q5', num:5, text:'Is there evidence that quantities of flammable materials held on site are kept at a minimum?',
          response:'Good Practice', comment:'', images:[] },
        { id:'q6', num:6, text:'Are flammable chemicals stored in appropriately sealable labelled container types?',
          response:'Good Practice', comment:'Containers labelled with GHS symbols. Storage log maintained.', images:['#4ade80'] },
        { id:'q7', num:7, text:'Are inventories of flammable materials held and maintained with Safety Data Sheets available?',
          response:'Good Practice', comment:'SDS binder available at store entrance. Last updated 01 Apr 2026.', images:[] },
        { id:'q8', num:8, text:'Is there evidence of fire prevention training being given to all workers?',
          response:'Good Practice', comment:'Training register reviewed — 97% completion rate.', images:['#4ade80','#86efac'] },
      ]},
    { id:'s2', name:'Hot Works', score:100,
      questions:[
        { id:'q9',  num:1, text:'Are hot work permits required and in use for all hot works on site?',
          response:'Good Practice', comment:'Hot work permit #HW-0421 active in welding bay.', images:['#fbbf24'] },
        { id:'q10', num:2, text:'Are workers carrying out hot works competent and certified?',
          response:'Compliant', comment:'Certification cards sighted for all 4 welders on shift.', images:[] },
      ]},
    { id:'s3', name:'Gas Cylinders', score:100,
      questions:[
        { id:'q11', num:1, text:'Are gas cylinders (full and empty) stored in a secured compound/area that provides protection from the weather?',
          response:'Major Non Conformance',
          comment:'Cylinders found stored outdoors without cover, chained together but no weather protection. Immediate corrective action required.',
          images:['#f87171','#fca5a5'],
          ncr:{ assignedTo:'Prakash Senghani', status:'Open', hseInstructions:'Please fix' } },
      ]},
    { id:'s4', name:'Welding', score:60,
      questions:[
        { id:'q12', num:1, text:'Are welders and those working in their immediate vicinity provided with appropriate flame retardant PPE?',
          response:'Major Non Conformance',
          comment:'Two workers observed without flame-retardant jackets. Standard overalls only.',
          images:['#f87171'],
          ncr:{ assignedTo:'Surya Tej Kotamreddy', status:'Open', hseInstructions:'' } },
        { id:'q13', num:2, text:'Is appropriate local or general ventilation provided in areas where welding activities are being undertaken?',
          response:'Major Non Conformance',
          comment:'Extraction fan unit in welding bay found non-operational. Area has no natural ventilation.',
          images:['#f87171','#fca5a5','#fecaca'],
          ncr:{ assignedTo:'Venkatesh Murthy', status:'Open', hseInstructions:'' } },
        { id:'q14', num:3, text:'Are screens or other devices provided to prevent individuals working in close proximity being subject to arc radiation?',
          response:'Major Non Conformance',
          comment:'No arc screens or curtains in place around active welding stations.',
          images:['#f87171'],
          ncr:{ assignedTo:null, status:null, hseInstructions:'' } },
        { id:'q15', num:4, text:'Is there evidence that welding equipment is being inspected at least every 3 months by a competent person?',
          response:'Major Non Conformance',
          comment:'Last inspection record dated November 2025 — overdue by approximately 5 months.',
          images:[],
          ncr:{ assignedTo:null, status:null, hseInstructions:'' } },
        { id:'q16', num:5, text:'Have all welding leads, electrode holders and return clamps been checked prior to use?',
          response:'Observation',
          comment:'Minor fraying observed on one cable — flagged for replacement. Work can continue with replacement cable.',
          images:['#fb923c'] },
      ]},
    { id:'s5', name:'Smoking', score:100,
      questions:[
        { id:'q17', num:1, text:'Are designated smoking areas clearly marked and located away from flammable materials?',
          response:'Compliant', comment:'Smoking shelter located 40m from storage area. Signage visible and maintained.', images:['#4ade80'] },
      ]},
    { id:'s6', name:'Emergency Preparedness & Response', score:0,
      questions:[
        { id:'q18', num:1, text:'Are emergency response procedures documented and communicated to all site personnel?',
          response:'Major Non Conformance',
          comment:'Emergency response plan not displayed at site. Site supervisor unaware of current muster point.',
          images:['#f87171'],
          ncr:{ assignedTo:null, status:null, hseInstructions:'' } },
      ]},
  ]
};
window.SAMPLE_INSP_SUBMISSION = _INSP_SAMPLE;

// ── Utilities ─────────────────────────────────────────────────────────────────
function _scoreColor(pct) {
  if (pct >= 100) return '#22C55E';
  if (pct >= 50)  return '#F59E0B';
  return '#EF4444';
}
// Pastel pills per spec — soft bg, dark text for legibility
function _pillStyle(response) {
  const map = {
    'Good Practice':         { bg:'#DCFCE7', color:'#166534' },
    'Compliant':             { bg:'#DBEAFE', color:'#1E40AF' },
    'Yes':                   { bg:'#DCFCE7', color:'#166534' },
    'Observation':           { bg:'#FEF9C3', color:'#854D0E' },
    'Minor Non Conformance': { bg:'#FFEDD5', color:'#9A3412' },
    'Major Non Conformance': { bg:'#FEE2E2', color:'#991B1B' },
    'No':                    { bg:'#FEE2E2', color:'#991B1B' },
    'NA':                    { bg:'#F3F4F6', color:'#6B7280' },
  };
  return map[response] || { bg:'#F3F4F6', color:'#6B7280' };
}
function _statusPill(s) {
  if (s === 'Open')      return { bg:'#FEE2E2', color:'#991B1B' };
  if (s === 'Rectified') return { bg:'#FEF9C3', color:'#854D0E' };
  if (s === 'Closed')    return { bg:'#DCFCE7', color:'#166534' };
  return { bg:'#F3F4F6', color:'#6B7280' };
}
function _initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const _ASSIGNEES = ['Prakash Senghani','Surya Tej Kotamreddy','Venkatesh Murthy','Rakesh Hirani','Arun Kumar','Ahmed Al-Rashid'];

// ── ScoreBar ─────────────────────────────────────────────────────────────────
// ── CSS injected once for hover-only states ───────────────────────────────────
const _NID_STYLES = `
  ._nid-nc-card .nid-edit-btn { opacity: 0; transition: opacity 0.12s; }
  ._nid-nc-card:hover .nid-edit-btn { opacity: 1; }
  ._nid-sec-btn:hover { background: #F9FAFB !important; }
  ._nid-sec-btn.active:hover { background: #EFF6FF !important; }
`;

// ── Score bar ─────────────────────────────────────────────────────────────────
function _ScoreBar({ sections }) {
  const n = sections.length;
  return (
    <div style={{ padding:'12px 24px 10px', background:'#fff', borderBottom:'1px solid #E5E7EB' }}>
      <div style={{ display:'flex', gap:2, height:8 }}>
        {sections.map((s, i) => (
          <div key={s.id} title={`${s.name}: ${s.score}%`}
            style={{ flex:1, background:_scoreColor(s.score),
              borderRadius: i===0 ? '4px 0 0 4px' : i===n-1 ? '0 4px 4px 0' : '0' }}/>
        ))}
      </div>
      <div style={{ display:'flex', gap:2, marginTop:5 }}>
        {sections.map(s => (
          <div key={s.id} title={`${s.name}: ${s.score}%`}
            style={{ flex:1, fontSize:10, color:'#9CA3AF', overflow:'hidden',
              textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'center' }}>
            {s.name}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── QuestionCard ──────────────────────────────────────────────────────────────
function _QuestionCard({ q }) {
  const pill = _pillStyle(q.response);
  const imgs = (q.images || []).filter(Boolean);
  const hasComment = q.comment && q.comment.trim().length > 0;
  const hasPhotos  = imgs.length > 0;

  return (
    <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12,
      padding:16, display:'flex', flexDirection:'column', gap:10 }}>

      {/* Zone 1 — question ref + text */}
      <div>
        {q.num != null && (
          <div style={{ fontSize:11, fontWeight:600, color:'#9CA3AF', letterSpacing:'0.08em',
            textTransform:'uppercase', marginBottom:5 }}>Question {q.num}</div>
        )}
        <div style={{ fontSize:15, fontWeight:500, color:'#111827', lineHeight:1.6 }}>{q.text}</div>
      </div>

      {/* Zone 2 — response pill: most prominent element */}
      <div>
        <span style={{ display:'inline-block', padding:'8px 16px', borderRadius:9999, fontSize:13,
          fontWeight:600, background:pill.bg, color:pill.color }}>
          {q.response}
        </span>
      </div>

      {/* Zone 3 — comment (only if present) */}
      {hasComment && (
        <div style={{ fontSize:13, color:'#6B7280', lineHeight:1.6, marginTop:4 }}>
          {q.comment}
        </div>
      )}

      {/* Zone 4 — photos (only if present) */}
      {hasPhotos && (
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:4 }}>
          {imgs.slice(0, 4).map((src, i) => (
            <div key={i} style={{ width:56, height:56, borderRadius:6, flexShrink:0,
              background: src.startsWith('#') ? src : '#E5E7EB', overflow:'hidden',
              display:'flex', alignItems:'center', justifyContent:'center',
              border:'1px solid rgba(0,0,0,0.06)' }}>
              {src.startsWith('#')
                ? <span style={{ fontSize:20, opacity:0.4 }}>📷</span>
                : <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>}
            </div>
          ))}
          {imgs.length > 4 && (
            <div style={{ width:56, height:56, borderRadius:6, background:'#F3F4F6',
              border:'1px solid #E5E7EB', display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:12, color:'#6B7280', fontWeight:600, flexShrink:0 }}>
              +{imgs.length - 4}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── SectionView ───────────────────────────────────────────────────────────────
function _SectionView({ section, tab, setTab }) {
  if (!section) return (
    <div style={{ padding:48, textAlign:'center', color:'#9CA3AF', fontSize:13 }}>No section selected.</div>
  );

  const additionalTypes = ['text','long-text','number','date-time'];
  const additionalQs = section.questions.filter(q => additionalTypes.includes(q.fieldType));

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100%' }}>
      {/* Per-section location */}
      {section.location && (
        <div style={{ padding:'8px 20px', background:'#EFF6FF', borderBottom:'1px solid #BFDBFE',
          display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#1D4ED8' }}>
          📍 <span>{section.location}</span>
        </div>
      )}

      {/* Minimal underline tabs */}
      <div style={{ display:'flex', padding:'0 20px', borderBottom:'1px solid #E5E7EB', background:'#fff', flexShrink:0 }}>
        {[['responses','Responses'],['additional','Additional Data']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding:'10px 16px', border:'none', background:'transparent',
              borderBottom:`2px solid ${tab === key ? '#2563EB' : 'transparent'}`,
              color: tab === key ? '#1D4ED8' : '#6B7280', fontSize:13,
              fontWeight: tab === key ? 600 : 400, cursor:'pointer', marginBottom:-1 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Content on #F4F6F8 */}
      <div style={{ flex:1, padding:20, display:'flex', flexDirection:'column', gap:12, background:'#F4F6F8' }}>
        {tab === 'responses' ? (
          section.questions.length === 0
            ? <div style={{ padding:40, textAlign:'center', color:'#9CA3AF', fontSize:13 }}>No questions in this section.</div>
            : section.questions.map(q => <_QuestionCard key={q.id} q={q}/>)
        ) : (
          additionalQs.length === 0
            ? <div style={{ padding:40, textAlign:'center', color:'#9CA3AF', fontSize:13 }}>No additional data for this section.</div>
            : <div style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12, overflow:'hidden' }}>
                {additionalQs.map((q, i) => (
                  <div key={q.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'11px 16px', borderBottom: i < additionalQs.length-1 ? '1px solid #F3F4F6' : 'none', fontSize:13 }}>
                    <span style={{ color:'#6B7280' }}>{q.text}</span>
                    <span style={{ fontWeight:500, color:'#111827', maxWidth:'50%', textAlign:'right' }}>{q.value || '—'}</span>
                  </div>
                ))}
              </div>
        )}
      </div>
    </div>
  );
}

// ── NCView ────────────────────────────────────────────────────────────────────
function _NCView({ allNCs, ncData, checked, setChecked, onEditSingle, onBulkAssign }) {
  const [expandedInstr, setExpandedInstr] = useState(new Set());

  function toggle(id) {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div style={{ flex:1, padding:20, display:'flex', flexDirection:'column', gap:12, background:'#F4F6F8', minHeight:'100%' }}>
      {allNCs.length === 0 && (
        <div style={{ padding:48, textAlign:'center', color:'#9CA3AF', fontSize:13 }}>No non-conformances recorded.</div>
      )}

      {allNCs.map(q => {
        const live    = ncData[q.id] || {};
        const resPill = _pillStyle(q.response);
        const instr   = live.hseInstructions || '';
        const isLong  = instr.length > 120;
        const expanded = expandedInstr.has(q.id);
        const sp = live.status ? _statusPill(live.status) : null;

        return (
          <div key={q.id} className="_nid-nc-card"
            style={{ background:'#fff', border:'1px solid #E5E7EB', borderRadius:12,
              padding:16, position:'relative' }}>

            {/* Top row: checkbox + ref */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <input type="checkbox" checked={checked.has(q.id)} onChange={() => toggle(q.id)}
                style={{ cursor:'pointer', flexShrink:0 }}/>
              <span style={{ fontSize:11, color:'#9CA3AF', flex:1 }}>
                Q{q.num} · {q.sectionName}
              </span>
              {/* Hover-reveal edit icon via CSS class */}
              <button className="nid-edit-btn" onClick={() => onEditSingle(q.id, live)}
                style={{ background:'none', border:'1px solid #E5E7EB', borderRadius:6,
                  cursor:'pointer', padding:'3px 8px', fontSize:12, color:'#6B7280',
                  lineHeight:1, display:'flex', alignItems:'center', gap:4 }}
                title="Edit assignment">
                ✏ Edit
              </button>
            </div>

            {/* Question text */}
            <div style={{ fontSize:15, fontWeight:500, color:'#111827', lineHeight:1.5, marginBottom:12 }}>
              {q.text}
            </div>

            {/* Response + assignee row */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center', marginBottom: instr ? 10 : 0 }}>
              <span style={{ padding:'5px 12px', borderRadius:9999, fontSize:12, fontWeight:600,
                background:resPill.bg, color:resPill.color }}>{q.response}</span>

              {live.assignedTo ? (
                <>
                  <div style={{ width:24, height:24, borderRadius:'50%', background:'#DBEAFE',
                    color:'#1E40AF', fontSize:9, fontWeight:700, flexShrink:0,
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {_initials(live.assignedTo)}
                  </div>
                  <span style={{ fontSize:12, color:'#374151' }}>{live.assignedTo}</span>
                  {sp && (
                    <span style={{ fontSize:11, padding:'3px 9px', borderRadius:9999, fontWeight:600,
                      background:sp.bg, color:sp.color }}>{live.status}</span>
                  )}
                </>
              ) : (
                <span style={{ fontSize:12, padding:'3px 10px', borderRadius:9999, fontWeight:500,
                  background:'#F3F4F6', color:'#6B7280' }}>Unassigned</span>
              )}
            </div>

            {/* HSE instructions */}
            {instr && (
              <div style={{ marginTop:8, fontSize:13, color:'#6B7280', lineHeight:1.6 }}>
                {isLong && !expanded ? instr.slice(0, 120) + '…' : instr}
                {isLong && (
                  <button onClick={() => setExpandedInstr(p => {
                      const n = new Set(p); if (n.has(q.id)) n.delete(q.id); else n.add(q.id); return n;
                    })}
                    style={{ background:'none', border:'none', color:'#2563EB', fontSize:12,
                      cursor:'pointer', marginLeft:4, padding:0, fontWeight:600 }}>
                    {expanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            )}

            {/* Add instructions link — only if unassigned AND no instructions */}
            {!instr && !live.assignedTo && (
              <button onClick={() => onEditSingle(q.id, live)}
                style={{ background:'none', border:'none', fontSize:13, color:'#2563EB',
                  cursor:'pointer', padding:0, marginTop:8, display:'block' }}>
                + Add instructions
              </button>
            )}
          </div>
        );
      })}

      {/* Bulk action bar — normal flow, not fixed */}
      {checked.size > 0 && (
        <div style={{ padding:'12px 16px', background:'#fff', border:'1px solid #E5E7EB',
          borderRadius:12, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:13, color:'#6B7280' }}>{checked.size} selected</span>
          <Btn variant="primary" size="sm" onClick={onBulkAssign}>Bulk assign</Btn>
          <button onClick={() => setChecked(new Set())}
            style={{ background:'none', border:'none', fontSize:13, color:'#6B7280',
              cursor:'pointer', padding:0 }}>
            Clear selection
          </button>
        </div>
      )}
    </div>
  );
}

// ── AssignDrawer ──────────────────────────────────────────────────────────────
function _AssignDrawer({ mode, ncCount, ncText, initial, onSave, onClose }) {
  const [form, setForm] = useState({
    assignedTo:      initial?.assignedTo      || '',
    status:          initial?.status          || 'Open',
    hseInstructions: initial?.hseInstructions || '',
  });

  const canSave = mode === 'bulk' ? true : !!form.hseInstructions.trim();

  const lbl = (text, required) => (
    <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:6 }}>
      {text}{required && <span style={{ color:'#EF4444', marginLeft:2 }}>*</span>}
    </label>
  );

  return (
    <>
      {/* Scrim */}
      <div onClick={onClose}
        style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.18)', zIndex:200 }}/>
      {/* Panel — slides from right */}
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:380,
        background:'#fff', borderLeft:'1px solid #E5E7EB',
        boxShadow:'-8px 0 24px rgba(0,0,0,0.08)', zIndex:201,
        display:'flex', flexDirection:'column', fontFamily:'var(--font-sans)' }}>

        {/* Header */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #E5E7EB' }}>
          <div style={{ fontSize:15, fontWeight:700, color:'#111827', marginBottom:2 }}>
            {mode === 'bulk' ? `Assign ${ncCount} NCs` : 'Assign NC'}
          </div>
          {mode === 'single' && ncText && (
            <div style={{ fontSize:12, color:'#6B7280', marginTop:4, lineHeight:1.4,
              display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
              {ncText}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px',
          display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            {lbl('Assign To')}
            <select className="input" value={form.assignedTo}
              onChange={e => setForm(f => ({ ...f, assignedTo:e.target.value }))}
              style={{ fontSize:13 }}>
              <option value="">— Select person —</option>
              {_ASSIGNEES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            {lbl('Status')}
            <select className="input" value={form.status}
              onChange={e => setForm(f => ({ ...f, status:e.target.value }))}
              style={{ fontSize:13 }}>
              <option value="Open">Open</option>
              <option value="Rectified">Rectified</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          {mode === 'single' && (
            <div>
              {lbl('HSE Instructions', true)}
              <textarea className="input" rows={5}
                value={form.hseInstructions}
                onChange={e => setForm(f => ({ ...f, hseInstructions:e.target.value }))}
                placeholder="Describe the corrective action required…"
                style={{ fontSize:13, resize:'vertical', minHeight:96 }}/>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 24px', borderTop:'1px solid #E5E7EB',
          display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button onClick={onClose}
            style={{ background:'none', border:'none', fontSize:13, color:'#6B7280',
              cursor:'pointer', padding:'8px 12px', fontWeight:500 }}>
            Discard
          </button>
          <Btn variant="primary" disabled={!canSave} onClick={() => onSave(form)}>
            {mode === 'bulk' ? `Assign ${ncCount} NCs` : 'Save'}
          </Btn>
        </div>
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function InspectionDetailScreen({ submission, onBack }) {
  const sub = submission || _INSP_SAMPLE;

  const allNCs = sub.sections.flatMap(s =>
    s.questions.filter(q => q.ncr).map(q => ({ ...q, sectionName: s.name }))
  );

  const [activeSection, setActive] = useState(sub.sections[0]?.id || null);
  const [ncView,  setNcView]       = useState(false);
  const [tab,     setTab]          = useState('responses');
  const [checked, setChecked]      = useState(new Set());
  const [drawer,  setDrawer]       = useState(null);
  const [ncData,  setNcData]       = useState(() => {
    const m = {};
    allNCs.forEach(q => { m[q.id] = { ...(q.ncr || {}) }; });
    return m;
  });

  const currentSec   = sub.sections.find(s => s.id === activeSection);
  const circleColor  = _scoreColor(sub.score);

  function openDrawerSingle(ncId) {
    setDrawer({ mode:'single', ncId, text: allNCs.find(q => q.id === ncId)?.text || '' });
  }
  function openDrawerBulk() { setDrawer({ mode:'bulk' }); }
  function saveDrawer(form) {
    if (drawer.mode === 'single') {
      setNcData(d => ({ ...d, [drawer.ncId]: { ...(d[drawer.ncId]||{}), ...form } }));
    } else {
      setNcData(d => {
        const next = { ...d };
        checked.forEach(id => { next[id] = { ...(next[id]||{}), assignedTo: form.assignedTo, status: form.status }; });
        return next;
      });
      setChecked(new Set());
    }
    setDrawer(null);
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', fontFamily:'var(--font-sans)', position:'relative', background:'#F4F6F8' }}>
      {/* Inject CSS for hover-reveal and sidebar hover states */}
      <style dangerouslySetInnerHTML={{ __html: _NID_STYLES }}/>

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div style={{ padding:'16px 24px', background:'#fff', borderBottom:'1px solid #E5E7EB',
        display:'flex', alignItems:'flex-start', gap:12, flexShrink:0 }}>
        <button onClick={onBack}
          style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#9CA3AF',
            padding:'2px 4px', lineHeight:1, marginTop:4, flexShrink:0 }}
          title="Back to Workflows">
          ←
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
            <span style={{ fontSize:18, fontWeight:600, color:'#111827', letterSpacing:'-0.01em' }}>{sub.topic}</span>
            <span style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:9999,
              background:'#F3F4F6', color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.06em' }}>
              {sub.type}
            </span>
          </div>
          <div style={{ fontSize:13, color:'#9CA3AF', display:'flex', flexWrap:'wrap', alignItems:'center' }}>
            <span>{sub.conductedBy}</span>
            <span style={{ margin:'0 6px' }}>·</span>
            <span>{sub.conductedOn}</span>
            {sub.conductedAt && <>
              <span style={{ margin:'0 6px' }}>·</span>
              <span>📍 {sub.conductedAt}</span>
            </>}
          </div>
        </div>
        {/* Score circle */}
        <div style={{ width:56, height:56, borderRadius:'50%', flexShrink:0,
          border:`3px solid ${circleColor}`,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:13, fontWeight:800, color:circleColor }}>{sub.score}%</span>
        </div>
      </div>

      {/* ── Section score bar ─────────────────────────────────────────────────── */}
      <_ScoreBar sections={sub.sections}/>

      {/* ── Two-column body ───────────────────────────────────────────────────── */}
      <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0 }}>

        {/* Left nav — 220px */}
        <div style={{ width:220, background:'#fff', borderRight:'1px solid #E5E7EB',
          overflowY:'auto', flexShrink:0 }}>
          {sub.sections.map(s => {
            const isActive = !ncView && activeSection === s.id;
            const sc = _scoreColor(s.score);
            return (
              <button key={s.id} className={`_nid-sec-btn${isActive?' active':''}`}
                onClick={() => { setNcView(false); setActive(s.id); setTab('responses'); }}
                style={{ width:'100%', padding:'10px 12px 10px 16px', border:'none',
                  borderBottom:'1px solid #F3F4F6',
                  borderLeft: isActive ? '3px solid #2563EB' : '3px solid transparent',
                  background: isActive ? '#EFF6FF' : 'transparent',
                  color: isActive ? '#1D4ED8' : '#374151',
                  cursor:'pointer', display:'flex', justifyContent:'space-between',
                  alignItems:'center', textAlign:'left', fontSize:13,
                  fontWeight: isActive ? 600 : 400, transition:'background 0.1s' }}>
                <span style={{ flex:1, lineHeight:1.4, marginRight:8 }}>{s.name}</span>
                <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:9999,
                  flexShrink:0, background: sc + '18', color: sc }}>
                  {s.score}%
                </span>
              </button>
            );
          })}
          {/* NC row */}
          <button className="_nid-sec-btn"
            onClick={() => { setNcView(true); setChecked(new Set()); }}
            style={{ width:'100%', padding:'10px 12px 10px 16px', border:'none',
              borderBottom:'1px solid #F3F4F6',
              borderLeft: ncView ? '3px solid #DC2626' : '3px solid transparent',
              background: ncView ? '#FEF2F2' : 'transparent',
              color: ncView ? '#DC2626' : '#6B7280',
              cursor:'pointer', display:'flex', justifyContent:'space-between',
              alignItems:'center', textAlign:'left', fontSize:13, fontWeight:600,
              transition:'background 0.1s' }}>
            <span>Non Conformance</span>
            <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:9999,
              background:'#FEE2E2', color:'#991B1B' }}>
              {allNCs.length}
            </span>
          </button>
        </div>

        {/* Right content area */}
        <div style={{ flex:1, overflowY:'auto', background:'#F4F6F8' }}>
          {ncView
            ? <_NCView
                allNCs={allNCs}
                ncData={ncData}
                checked={checked}
                setChecked={setChecked}
                onEditSingle={openDrawerSingle}
                onBulkAssign={openDrawerBulk}/>
            : <_SectionView
                section={currentSec}
                tab={tab}
                setTab={setTab}/>}
        </div>
      </div>

      {/* ── Assign Drawer ──────────────────────────────────────────────────── */}
      {drawer && (
        <_AssignDrawer
          mode={drawer.mode}
          ncId={drawer.ncId}
          ncCount={checked.size}
          ncText={drawer.text}
          initial={drawer.mode === 'single' ? ncData[drawer.ncId] : null}
          onSave={saveDrawer}
          onClose={() => setDrawer(null)}/>
      )}
    </div>
  );
}

Object.assign(window, { InspectionDetailScreen });
