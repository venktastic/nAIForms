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
  if (pct === 100) return '#10b981';
  if (pct >= 50)   return '#f59e0b';
  return '#ef4444';
}
// Fix 3: richer, more saturated pill colours
function _pillStyle(response) {
  const map = {
    'Good Practice':         { bg:'#059669', color:'#fff' },
    'Compliant':             { bg:'#16a34a', color:'#fff' },
    'Yes':                   { bg:'#059669', color:'#fff' },
    'Observation':           { bg:'#d97706', color:'#fff' },
    'Minor Non Conformance': { bg:'#ea580c', color:'#fff' },
    'Major Non Conformance': { bg:'#dc2626', color:'#fff' },
    'No':                    { bg:'#dc2626', color:'#fff' },
    'NA':                    { bg:'#64748b', color:'#fff' },
  };
  return map[response] || { bg:'#64748b', color:'#fff' };
}
function _statusColor(s) {
  return s === 'Open' ? '#ef4444' : s === 'Rectified' ? '#f59e0b' : s === 'Closed' ? '#10b981' : '#94a3b8';
}
function _initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const _ASSIGNEES = ['Prakash Senghani','Surya Tej Kotamreddy','Venkatesh Murthy','Rakesh Hirani','Arun Kumar','Ahmed Al-Rashid'];

// ── ScoreBar ─────────────────────────────────────────────────────────────────
// Fix 6: macro section health bar below the header
function _ScoreBar({ sections }) {
  const n = sections.length;
  return (
    <div style={{ padding:'10px 24px 8px', background:'#fff', borderBottom:'1px solid #e2e8f0' }}>
      <div style={{ display:'flex', gap:2, height:7, borderRadius:4 }}>
        {sections.map((s, i) => (
          <div key={s.id} title={`${s.name}: ${s.score}%`}
            style={{ flex:1, background:_scoreColor(s.score),
              borderRadius: i===0 ? '4px 0 0 4px' : i===n-1 ? '0 4px 4px 0' : '0',
              transition:'opacity 0.15s' }}/>
        ))}
      </div>
      <div style={{ display:'flex', gap:2, marginTop:5 }}>
        {sections.map(s => (
          <div key={s.id} title={`${s.name}: ${s.score}%`}
            style={{ flex:1, fontSize:9, color:'#94a3b8', overflow:'hidden',
              textOverflow:'ellipsis', whiteSpace:'nowrap', textAlign:'center' }}>
            {s.name}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── QuestionCard ──────────────────────────────────────────────────────────────
// Fix 3+4: prominent response pill, clear internal zones, shadow on grey bg
function _QuestionCard({ q }) {
  const pill = _pillStyle(q.response);
  const imgs = q.images || [];
  const hasComment = q.comment && q.comment.trim().length > 0;

  return (
    <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:10,
      padding:16, boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>

      {/* Zone 1: question identifier + text */}
      <div style={{ marginBottom:14 }}>
        {q.num != null && (
          <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.08em',
            textTransform:'uppercase', marginBottom:5 }}>Question {q.num}</div>
        )}
        <div style={{ fontSize:15, fontWeight:500, color:'#0f172a', lineHeight:1.6 }}>{q.text}</div>
      </div>

      {/* Zone 2: response pill — fix 3, most prominent element */}
      <div style={{ marginBottom:14, paddingBottom:14, borderBottom:'1px solid #f1f5f9' }}>
        <div style={{ display:'inline-block', padding:'7px 20px', borderRadius:8, fontSize:14,
          fontWeight:700, background:pill.bg, color:pill.color,
          boxShadow:`0 2px 6px ${pill.bg}55`, letterSpacing:'0.01em' }}>
          {q.response}
        </div>
      </div>

      {/* Zone 3: comment + photos */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.08em',
            textTransform:'uppercase', marginBottom:6 }}>Comment</div>
          <div style={{ fontSize:13, color: hasComment ? '#334155' : '#c8d0da',
            background: hasComment ? '#f8fafc' : 'transparent',
            padding: hasComment ? '8px 12px' : 0,
            borderRadius:6, border: hasComment ? '1px solid #eef0f4' : 'none',
            lineHeight:1.6, fontStyle: hasComment ? 'normal' : 'italic' }}>
            {hasComment ? q.comment : 'No comment added'}
          </div>
        </div>

        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.08em',
            textTransform:'uppercase', marginBottom:6 }}>Photos</div>
          {imgs.length > 0 ? (
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {imgs.slice(0, 3).map((src, i) => (
                <div key={i} style={{ width:72, height:72, borderRadius:8, flexShrink:0,
                  background: src.startsWith('#') ? src : '#e2e8f0',
                  border:'1px solid rgba(0,0,0,0.08)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  boxShadow:'0 1px 3px rgba(0,0,0,0.10)', overflow:'hidden' }}>
                  {src.startsWith('#')
                    ? <span style={{ fontSize:24, opacity:0.45 }}>📷</span>
                    : <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>}
                </div>
              ))}
              {imgs.length > 3 && (
                <div style={{ width:72, height:72, borderRadius:8, background:'#f1f5f9',
                  border:'1px solid #e2e8f0', display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:13, color:'#64748b', fontWeight:700, flexShrink:0 }}>
                  +{imgs.length - 3}
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize:12, color:'#c8d0da', fontStyle:'italic' }}>No photos added</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SectionView ───────────────────────────────────────────────────────────────
function _SectionView({ section, tab, setTab }) {
  if (!section) return (
    <div style={{ padding:48, textAlign:'center', color:'#94a3b8', fontSize:13 }}>No section selected.</div>
  );

  const additionalTypes = ['text','long-text','number','date-time'];
  const additionalQs = section.questions.filter(q => additionalTypes.includes(q.fieldType));

  return (
    <div>
      {/* Per-section location */}
      {section.location && (
        <div style={{ padding:'10px 20px', background:'#eff6ff', borderBottom:'1px solid #bfdbfe',
          display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#1d4ed8', fontWeight:500 }}>
          📍 <span>{section.location}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', padding:'0 20px', borderBottom:'1px solid #e2e8f0', background:'#fff' }}>
        {[['responses','Responses'],['additional','Additional Data']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding:'11px 16px', border:'none', background:'transparent',
              borderBottom:`2px solid ${tab === key ? '#3b82f6' : 'transparent'}`,
              color: tab === key ? '#1d4ed8' : '#64748b', fontSize:13,
              fontWeight: tab === key ? 600 : 400, cursor:'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Fix 1: grey background, cards float */}
      <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12, background:'#f8f9fa', minHeight:'100%' }}>
        {tab === 'responses' ? (
          section.questions.length === 0
            ? <div style={{ padding:40, textAlign:'center', color:'#94a3b8', fontSize:13 }}>No questions in this section.</div>
            : section.questions.map(q => <_QuestionCard key={q.id} q={q}/>)
        ) : (
          additionalQs.length === 0
            ? <div style={{ padding:40, textAlign:'center', color:'#94a3b8', fontSize:13 }}>No additional data for this section.</div>
            : <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:10, overflow:'hidden',
                boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
                {additionalQs.map((q, i) => (
                  <div key={q.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                    padding:'11px 16px', borderBottom: i < additionalQs.length-1 ? '1px solid #f1f5f9' : 'none', fontSize:13 }}>
                    <span style={{ color:'#64748b' }}>{q.text}</span>
                    <span style={{ fontWeight:500, color:'#1e293b', maxWidth:'50%', textAlign:'right' }}>{q.value || '—'}</span>
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
    <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12, background:'#f8f9fa', minHeight:'100%' }}>
      {allNCs.length === 0 && (
        <div style={{ padding:48, textAlign:'center', color:'#94a3b8', fontSize:13 }}>No non-conformances recorded.</div>
      )}

      {allNCs.map(q => {
        const live = ncData[q.id] || {};
        const pillBg = q.response === 'Major Non Conformance' ? '#ef4444' : '#f97316';
        const instr = live.hseInstructions || '';
        const isLong = instr.length > 80;
        const expanded = expandedInstr.has(q.id);

        return (
          <div key={q.id} style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:10,
            padding:'14px 16px', display:'flex', gap:10, position:'relative',
            boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
            <input type="checkbox" checked={checked.has(q.id)} onChange={() => toggle(q.id)}
              style={{ marginTop:4, cursor:'pointer', flexShrink:0 }}/>
            <div style={{ flex:1, minWidth:0, paddingRight:32 }}>
              {/* Meta */}
              <div style={{ fontSize:11, color:'#94a3b8', marginBottom:4 }}>
                Q{q.num} · <span style={{ color:'#64748b' }}>{q.sectionName}</span>
              </div>
              {/* Question text */}
              <div style={{ fontSize:14, fontWeight:500, color:'#0f172a', lineHeight:1.5, marginBottom:10 }}>{q.text}</div>
              {/* Compliance + assignee row */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, alignItems:'center' }}>
                <span style={{ padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:700,
                  background:pillBg, color:'#fff' }}>{q.response}</span>
                {live.assignedTo ? (
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:26, height:26, borderRadius:'50%', background:'#dbeafe',
                      color:'#1d4ed8', fontSize:10, fontWeight:700,
                      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      {_initials(live.assignedTo)}
                    </div>
                    <span style={{ fontSize:12, color:'#334155' }}>{live.assignedTo}</span>
                    {live.status && (
                      <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, fontWeight:600,
                        background: _statusColor(live.status) + '20', color: _statusColor(live.status) }}>
                        {live.status}
                      </span>
                    )}
                  </div>
                ) : (
                  <span style={{ fontSize:12, color:'#94a3b8', fontStyle:'italic' }}>Unassigned</span>
                )}
              </div>
              {/* HSE Instructions */}
              {instr ? (
                <div style={{ marginTop:8, fontSize:12, color:'#475569', background:'#f8fafc',
                  padding:'8px 10px', borderRadius:6, borderLeft:'3px solid #e2e8f0', lineHeight:1.5 }}>
                  {isLong && !expanded ? instr.slice(0, 80) + '…' : instr}
                  {isLong && (
                    <button onClick={() => setExpandedInstr(p => {
                        const n = new Set(p); if (n.has(q.id)) n.delete(q.id); else n.add(q.id); return n;
                      })}
                      style={{ background:'none', border:'none', color:'#2563eb', fontSize:11,
                        cursor:'pointer', marginLeft:4, padding:0, fontWeight:600 }}>
                      {expanded ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>
              ) : (
                live.assignedTo ? null :
                <div style={{ marginTop:8 }}>
                  <button onClick={() => onEditSingle(q.id, live)}
                    style={{ background:'none', border:'none', fontSize:12, color:'#2563eb',
                      cursor:'pointer', padding:0, textDecoration:'underline' }}>
                    + Add instructions
                  </button>
                </div>
              )}
            </div>
            {/* Edit button */}
            <button onClick={() => onEditSingle(q.id, live)}
              style={{ position:'absolute', top:12, right:12, background:'none',
                border:'1px solid #e2e8f0', borderRadius:6, cursor:'pointer',
                padding:'4px 7px', fontSize:13, color:'#2563eb', lineHeight:1 }}
              title="Edit NC assignment">
              ✏
            </button>
          </div>
        );
      })}

      {/* Bulk action bar */}
      {checked.size > 0 && (
        <div style={{ marginTop:4, padding:'12px 16px', background:'#fff',
          border:'1px solid #93c5fd', borderRadius:10, display:'flex', alignItems:'center', gap:12,
          boxShadow:'0 2px 8px rgba(37,99,235,0.10)' }}>
          <span style={{ fontSize:13, color:'#334155', fontWeight:500 }}>{checked.size} selected</span>
          <Btn variant="primary" size="sm" onClick={onBulkAssign}>Bulk assign</Btn>
          <button onClick={() => setChecked(new Set())}
            style={{ background:'none', border:'none', fontSize:12, color:'#64748b',
              cursor:'pointer', textDecoration:'underline', padding:0 }}>
            Clear selection
          </button>
        </div>
      )}
    </div>
  );
}

// ── AssignDrawer ──────────────────────────────────────────────────────────────
function _AssignDrawer({ mode, ncId, ncCount, ncText, initial, onSave, onClose }) {
  const [form, setForm] = useState({
    assignedTo: initial?.assignedTo || '',
    status:     initial?.status     || 'Open',
    hseInstructions: initial?.hseInstructions || '',
  });

  const canSave = mode === 'bulk'
    ? true
    : !!form.hseInstructions.trim();

  return (
    <>
      <div onClick={onClose}
        style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', zIndex:200 }}/>
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:400,
        background:'#fff', boxShadow:'-4px 0 32px rgba(0,0,0,0.14)', zIndex:201,
        display:'flex', flexDirection:'column', fontFamily:'var(--font-sans)' }}>

        {/* Header */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #e2e8f0' }}>
          <div style={{ fontSize:16, fontWeight:700, color:'#0f172a' }}>
            {mode === 'bulk' ? `Bulk assign — ${ncCount} non-conformances` : 'Assign NC'}
          </div>
          {mode === 'single' && ncText && (
            <div style={{ fontSize:12, color:'#64748b', marginTop:4,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {ncText}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#334155', marginBottom:6 }}>Assign To</label>
            <select className="input" value={form.assignedTo}
              onChange={e => setForm(f => ({ ...f, assignedTo:e.target.value }))}
              style={{ fontSize:13 }}>
              <option value="">— Select assignee —</option>
              {_ASSIGNEES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#334155', marginBottom:6 }}>Status</label>
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
              <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#334155', marginBottom:6 }}>
                HSE Instructions <span style={{ color:'#ef4444' }}>*</span>
              </label>
              <textarea className="input" rows={5}
                value={form.hseInstructions}
                onChange={e => setForm(f => ({ ...f, hseInstructions:e.target.value }))}
                placeholder="Enter HSE instructions…"
                style={{ fontSize:13, resize:'vertical', minHeight:100 }}/>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 24px', borderTop:'1px solid #e2e8f0',
          display:'flex', gap:8, justifyContent:'flex-end' }}>
          <Btn onClick={onClose}>Discard</Btn>
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

  const currentSec = sub.sections.find(s => s.id === activeSection);
  const circleColor = _scoreColor(sub.score);

  function openDrawerSingle(ncId, existingNcr) {
    setDrawer({ mode:'single', ncId, text: allNCs.find(q => q.id === ncId)?.text || '' });
  }
  function openDrawerBulk() {
    setDrawer({ mode:'bulk' });
  }
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
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100%', fontFamily:'var(--font-sans)', position:'relative' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ padding:'14px 24px', background:'#fff',
        display:'flex', alignItems:'flex-start', gap:12, flexShrink:0 }}>
        <button onClick={onBack}
          style={{ background:'none', border:'none', cursor:'pointer', fontSize:22, color:'#94a3b8',
            padding:'0 6px', borderRadius:6, lineHeight:1, marginTop:3, flexShrink:0 }}>
          ‹
        </button>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4, flexWrap:'wrap' }}>
            <span style={{ fontSize:18, fontWeight:600, color:'#0f172a' }}>{sub.topic}</span>
            <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:12,
              background:'#f1f5f9', color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>
              {sub.type}
            </span>
          </div>
          {/* Fix 5: no labels — context makes it obvious */}
          <div style={{ fontSize:13, color:'#94a3b8', display:'flex', flexWrap:'wrap', alignItems:'center', gap:0 }}>
            <span>{sub.conductedBy}</span>
            <span style={{ margin:'0 8px', color:'#e2e8f0' }}>·</span>
            <span>{sub.conductedOn}</span>
            {sub.conductedAt && <>
              <span style={{ margin:'0 8px', color:'#e2e8f0' }}>·</span>
              <span>📍 {sub.conductedAt}</span>
            </>}
            {!sub.conductedAt && <>
              <span style={{ margin:'0 8px', color:'#e2e8f0' }}>·</span>
              <span style={{ fontStyle:'italic' }}>Location not recorded</span>
            </>}
          </div>
        </div>
        {/* Score circle */}
        <div style={{ width:58, height:58, borderRadius:'50%', border:`4px solid ${circleColor}`,
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          boxShadow:`0 0 0 3px ${circleColor}22` }}>
          <span style={{ fontSize:14, fontWeight:800, color:circleColor }}>{sub.score}%</span>
        </div>
      </div>

      {/* Fix 6: section score bar — macro before micro */}
      <_ScoreBar sections={sub.sections}/>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0 }}>

        {/* Fix 2: sidebar with left accent bar + score pills */}
        <div style={{ width:256, borderRight:'1px solid #e2e8f0', background:'#fff',
          overflowY:'auto', flexShrink:0 }}>
          {sub.sections.map(s => {
            const isActive = !ncView && activeSection === s.id;
            const sc = _scoreColor(s.score);
            return (
              <button key={s.id}
                onClick={() => { setNcView(false); setActive(s.id); setTab('responses'); }}
                style={{ width:'100%', padding:'10px 14px 10px 16px', border:'none',
                  borderBottom:'1px solid #f1f5f9',
                  borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
                  background: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#1d4ed8' : '#374151',
                  cursor:'pointer', display:'flex', justifyContent:'space-between',
                  alignItems:'center', textAlign:'left', fontSize:13,
                  fontWeight: isActive ? 600 : 400 }}>
                <span style={{ flex:1, lineHeight:1.4, marginRight:8 }}>{s.name}</span>
                {/* Score pill */}
                <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:10,
                  flexShrink:0,
                  background: isActive ? sc + '20' : sc + '15',
                  color: sc }}>
                  {s.score}%
                </span>
              </button>
            );
          })}
          {/* NC tab */}
          <button onClick={() => { setNcView(true); setChecked(new Set()); }}
            style={{ width:'100%', padding:'10px 14px 10px 16px', border:'none',
              borderBottom:'1px solid #f1f5f9',
              borderLeft: ncView ? '3px solid #dc2626' : '3px solid transparent',
              background: ncView ? '#fef2f2' : 'transparent',
              color: ncView ? '#dc2626' : '#6b7280',
              cursor:'pointer', display:'flex', justifyContent:'space-between',
              alignItems:'center', textAlign:'left', fontSize:13, fontWeight:600 }}>
            <span>Non Conformance</span>
            <span style={{ fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:10,
              background:'#fee2e2', color:'#dc2626' }}>
              {allNCs.length}
            </span>
          </button>
        </div>

        {/* Fix 1: grey page background, cards float on it */}
        <div style={{ flex:1, overflowY:'auto', background:'#f8f9fa' }}>
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
