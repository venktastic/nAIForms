// Pending inspection draft experience — form list sheet, draft picker, resume banner
const { useState, useEffect } = React;

// ── Mock draft store ──────────────────────────────────────────────────────────
// Mutated in place so deletions persist across sheet opens within the session
const _DRAFTS = {
  'INSPFLOW1': [
    { draftId:'d-001', formId:'INSPFLOW1', userId:'vm',
      startedAt:'2026-06-23T08:30:00Z', lastEditedAt:'2026-06-23T09:15:00Z',
      answers:{ q1:'o1', q2:'o2', q3:'o1', q4:'o2', q5:'o1' }, totalQuestions:42 },
    { draftId:'d-002', formId:'INSPFLOW1', userId:'vm',
      startedAt:'2026-06-22T14:00:00Z', lastEditedAt:'2026-06-22T14:05:00Z',
      answers:{ q1:'o1' }, totalQuestions:42 },
  ],
  'AUDITFLOW1': [
    { draftId:'d-003', formId:'AUDITFLOW1', userId:'vm',
      startedAt:'2026-06-21T11:00:00Z', lastEditedAt:'2026-06-24T16:45:00Z',
      answers:{ q1:'o1', q2:'o3', q3:'o1', q4:'o2', q5:'o1', q6:'o1',
                q7:'o2', q8:'o1', q9:'o3', q10:'o1', q11:'o2', q12:'o1',
                q13:'o1', q14:'o3' }, totalQuestions:28 },
  ],
};

function _getDraftCounts() {
  return new Promise(function(resolve) {
    setTimeout(function() {
      const counts = {};
      Object.keys(_DRAFTS).forEach(function(fid) {
        if (_DRAFTS[fid].length > 0) counts[fid] = _DRAFTS[fid].length;
      });
      resolve(counts);
    }, 550);
  });
}

function _getDrafts(formId) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve((_DRAFTS[formId] || []).slice());
    }, 350);
  });
}

function deleteDraft(draftId) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      Object.keys(_DRAFTS).forEach(function(fid) {
        _DRAFTS[fid] = _DRAFTS[fid].filter(function(d) { return d.draftId !== draftId; });
      });
      resolve(true);
    }, 250);
  });
}

// ── Date helpers ──────────────────────────────────────────────────────────────
const _MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function _fmtStarted(iso) {
  const d = new Date(iso);
  const h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  return 'Started ' + d.getDate() + ' ' + _MONTHS[d.getMonth()] +
    ' at ' + (h % 12 || 12) + ':' + m + ' ' + ampm;
}

function _fmtDay(iso) {
  const d = new Date(iso);
  return d.getDate() + ' ' + _MONTHS[d.getMonth()];
}

function _relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  const hr  = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (min < 1)  return 'just now';
  if (min < 60) return min + ' min' + (min !== 1 ? 's' : '') + ' ago';
  if (hr < 24)  return hr  + ' hour' + (hr !== 1 ? 's' : '') + ' ago';
  if (day < 7)  return day + ' day'  + (day !== 1 ? 's' : '') + ' ago';
  const wk = Math.floor(day / 7);
  return wk + ' week' + (wk !== 1 ? 's' : '') + ' ago';
}

function _answeredCount(draft) {
  return Object.values(draft.answers).filter(function(v) { return v !== null && v !== undefined; }).length;
}

function _progressColor(p) {
  if (p >= 1)    return '#22C55E';
  if (p >= 0.5)  return '#3B82F6';
  return '#F59E0B';
}

// ── Bottom sheet shell ────────────────────────────────────────────────────────
function BottomSheet({ children, onBackdropClick, zIndex }) {
  return (
    <div style={{ position:'absolute', inset:0, zIndex: zIndex || 20,
      display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
      <div onClick={onBackdropClick}
        style={{ position:'absolute', inset:0, background:'rgba(15,23,42,0.42)' }}/>
      <div style={{ position:'relative', background:'#fff',
        borderRadius:'16px 16px 0 0', maxHeight:'80%',
        display:'flex', flexDirection:'column',
        boxShadow:'0 -6px 32px rgba(0,0,0,0.18)' }}>
        <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 2px' }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'var(--n-200)' }}/>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Screen 1 — Form list sheet ────────────────────────────────────────────────
function FormListSheet({ formType, onClose, onSelectForm }) {
  const [counts, setCounts] = useState(null); // null = loading

  const forms = (window.FORM_LIST || []).filter(function(f) {
    return f.type === formType && f.status === 'published';
  });

  useEffect(function() {
    _getDraftCounts()
      .then(function(c) { setCounts(c); })
      .catch(function() { setCounts({}); }); // fail silently
  }, []);

  return (
    <BottomSheet onBackdropClick={onClose} zIndex={20}>
      <div style={{ padding:'12px 18px 8px', borderBottom:'1px solid var(--n-100)' }}>
        <div style={{ fontSize:15, fontWeight:700, color:'var(--n-900)' }}>{formType} Forms</div>
        <div style={{ fontSize:12, color:'var(--n-400)', marginTop:2 }}>
          Tap a form to start or continue
        </div>
      </div>

      <div style={{ overflowY:'auto', flex:1, paddingBottom:12 }}>
        {forms.map(function(form) {
          const count = counts ? (counts[form.id] || 0) : null; // null = loading
          return (
            <button key={form.id}
              onClick={function() { onSelectForm(form, count || 0); }}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:12,
                padding:'12px 18px', background:'none', border:'none', cursor:'pointer',
                textAlign:'left', borderBottom:'1px solid var(--n-50)' }}>
              <div style={{ width:38, height:38, borderRadius:10, background:'var(--brand-50)',
                color:'var(--brand-700)', display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:18, flexShrink:0 }}>
                {formType === 'Audit' ? '📋' : '🔍'}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:600, fontSize:13, overflow:'hidden',
                  textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{form.name}</div>
                <div style={{ fontSize:11, color:'var(--n-400)', marginTop:2 }}>
                  {form.sections} sections · {form.qs} questions
                </div>
              </div>
              {/* badge / skeleton */}
              {count === null ? (
                <div style={{ width:22, height:22, borderRadius:'50%',
                  background:'var(--n-200)', flexShrink:0 }}/>
              ) : count > 0 ? (
                <div style={{ minWidth:22, height:22, borderRadius:'50%',
                  background:'#F59E0B', color:'#fff', display:'flex',
                  alignItems:'center', justifyContent:'center',
                  fontSize:11, fontWeight:700, padding:'0 5px', flexShrink:0 }}>
                  {count}
                </div>
              ) : null}
              <span style={{ color:'var(--n-300)', fontSize:18, flexShrink:0 }}>›</span>
            </button>
          );
        })}
        {forms.length === 0 && (
          <div style={{ padding:24, textAlign:'center', fontSize:13, color:'var(--n-400)' }}>
            No {formType.toLowerCase()} forms available.
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

// ── Screen 2 — Draft picker sheet ─────────────────────────────────────────────
function DraftPickerSheet({ form, onClose, onResume, onStartNew }) {
  const [drafts, setDrafts] = useState(null); // null = loading
  const [swipedId, setSwipedId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  useEffect(function() {
    _getDrafts(form.id)
      .then(function(data) { setDrafts(data); })
      .catch(function() { setDrafts([]); });
  }, [form.id]);

  function handleDeleteConfirmed() {
    const id = confirmId;
    setConfirmId(null);
    setRemovingId(id);
    deleteDraft(id).then(function() {
      setRemovingId(null);
      const next = (drafts || []).filter(function(d) { return d.draftId !== id; });
      setDrafts(next);
      if (next.length === 0) onClose(); // auto-dismiss when last draft deleted
    });
  }

  return (
    <>
      <BottomSheet onBackdropClick={onClose} zIndex={30}>
        <div style={{ padding:'12px 18px 8px', borderBottom:'1px solid var(--n-100)' }}>
          <div style={{ fontSize:15, fontWeight:700, color:'var(--n-900)',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {form.name}
          </div>
          <div style={{ fontSize:12, color:'var(--n-400)', marginTop:2 }}>
            {drafts === null ? 'Loading…' : drafts.length + ' in progress'}
          </div>
        </div>

        <div style={{ overflowY:'auto', flex:1 }}>
          {/* loading skeletons */}
          {drafts === null && (
            <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ height:70, borderRadius:10, background:'var(--n-100)' }}/>
              <div style={{ height:70, borderRadius:10, background:'var(--n-100)' }}/>
            </div>
          )}

          {drafts !== null && drafts.map(function(d) {
            const ac = _answeredCount(d);
            const p  = d.totalQuestions > 0 ? ac / d.totalQuestions : 0;
            const isSwipe    = swipedId === d.draftId;
            const isRemoving = removingId === d.draftId;
            return (
              <div key={d.draftId} style={{ position:'relative', overflow:'hidden',
                borderBottom:'1px solid var(--n-50)',
                opacity: isRemoving ? 0.35 : 1, transition:'opacity 0.2s' }}>

                {/* delete button revealed by slide */}
                <div
                  onClick={function() { setConfirmId(d.draftId); setSwipedId(null); }}
                  style={{ position:'absolute', right:0, top:0, bottom:0, width:72,
                    background:'#EF4444', display:'flex', alignItems:'center',
                    justifyContent:'center', cursor:'pointer',
                    opacity: isSwipe ? 1 : 0, pointerEvents: isSwipe ? 'auto' : 'none',
                    transition:'opacity 0.2s' }}>
                  <span style={{ color:'#fff', fontSize:12, fontWeight:700 }}>Delete</span>
                </div>

                {/* row */}
                <div
                  onClick={function() { if (!isSwipe) onResume(d); else setSwipedId(null); }}
                  style={{ display:'flex', alignItems:'center', gap:12,
                    padding:'12px 16px', background:'#fff', cursor:'pointer',
                    transform: isSwipe ? 'translateX(-72px)' : 'translateX(0)',
                    transition:'transform 0.25s' }}>

                  <div style={{ width:36, height:36, borderRadius:9,
                    background:'var(--brand-50)', color:'var(--brand-700)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:16, flexShrink:0 }}>🔍</div>

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:500, color:'var(--n-700)' }}>
                      {_fmtStarted(d.startedAt)}
                    </div>
                    <div style={{ fontSize:11, color:'var(--n-400)', marginTop:2 }}>
                      Last edited {_relTime(d.lastEditedAt)}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:7, marginTop:5 }}>
                      <div style={{ flex:1, height:4, background:'var(--n-100)',
                        borderRadius:2, overflow:'hidden' }}>
                        <div style={{ height:'100%', borderRadius:2,
                          width: Math.round(p * 100) + '%',
                          background: _progressColor(p) }}/>
                      </div>
                      <span style={{ fontSize:10, color:'var(--n-400)', whiteSpace:'nowrap' }}>
                        {ac} of {d.totalQuestions}
                      </span>
                    </div>
                  </div>

                  {/* swipe affordance */}
                  <button
                    onClick={function(e) {
                      e.stopPropagation();
                      setSwipedId(isSwipe ? null : d.draftId);
                    }}
                    style={{ background:'none', border:'none', cursor:'pointer',
                      color:'var(--n-300)', fontSize:18, padding:'4px 2px', flexShrink:0,
                      transform: isSwipe ? 'rotate(180deg)' : 'none',
                      transition:'transform 0.25s', lineHeight:1 }}>
                    ‹
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding:'12px 18px 18px', borderTop:'1px solid var(--n-100)', flexShrink:0 }}>
          <button onClick={onStartNew}
            style={{ width:'100%', padding:'13px 0', border:'none', borderRadius:12,
              background:'var(--brand-700)', color:'#fff', fontWeight:700,
              fontSize:14, cursor:'pointer' }}>
            + Start New Inspection
          </button>
        </div>
      </BottomSheet>

      {/* delete confirmation — floats above sheet */}
      {confirmId && (
        <div style={{ position:'absolute', inset:0, zIndex:50,
          background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'flex-end' }}>
          <div style={{ background:'#fff', borderRadius:'16px 16px 0 0',
            padding:'20px 18px 28px', width:'100%',
            boxShadow:'0 -4px 24px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:5 }}>Delete this draft?</div>
            <div style={{ fontSize:13, color:'var(--n-500)', marginBottom:18 }}>Your progress will be lost.</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={function() { setConfirmId(null); }}
                style={{ flex:1, padding:'11px 0', border:'1px solid var(--n-200)',
                  borderRadius:10, background:'#fff', fontWeight:600,
                  fontSize:13, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={handleDeleteConfirmed}
                style={{ flex:1, padding:'11px 0', border:'none', borderRadius:10,
                  background:'#EF4444', color:'#fff', fontWeight:600,
                  fontSize:13, cursor:'pointer' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Resume banner (shown inside MobileFill when resuming a draft) ──────────────
function ResumeBanner({ startedAt, onDiscard }) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      {showConfirm && (
        <div style={{ position:'absolute', inset:0, zIndex:50,
          background:'rgba(15,23,42,0.5)', display:'flex', alignItems:'flex-end' }}>
          <div style={{ background:'#fff', borderRadius:'16px 16px 0 0',
            padding:'20px 18px 28px', width:'100%' }}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:5 }}>Discard this draft?</div>
            <div style={{ fontSize:13, color:'var(--n-500)', marginBottom:18 }}>Your progress will be lost.</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={function() { setShowConfirm(false); }}
                style={{ flex:1, padding:'11px 0', border:'1px solid var(--n-200)',
                  borderRadius:10, background:'#fff', fontWeight:600,
                  fontSize:13, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={onDiscard}
                style={{ flex:1, padding:'11px 0', border:'none', borderRadius:10,
                  background:'#EF4444', color:'#fff', fontWeight:600,
                  fontSize:13, cursor:'pointer' }}>
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ background:'#FEF3C7', borderBottom:'1px solid #FDE68A',
        padding:'8px 16px', display:'flex', alignItems:'center',
        justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ fontSize:12, color:'#92400E', fontWeight:500 }}>
          Resuming draft · Started {_fmtDay(startedAt)}
        </div>
        <button onClick={function() { setShowConfirm(true); }}
          style={{ background:'none', border:'none', fontSize:11,
            color:'#DC2626', fontWeight:600, cursor:'pointer', padding:'2px 0', flexShrink:0 }}>
          Discard draft
        </button>
      </div>
    </>
  );
}

Object.assign(window, { FormListSheet, DraftPickerSheet, ResumeBanner, deleteDraft });
