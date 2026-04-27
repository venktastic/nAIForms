// ── Mobile Home — frontline task list ────────────────────────────────────────
function MobileHome({ onExit }) {
  const [activeTask, setActiveTask] = useState(null);

  const tasks = {
    today: [
      { id:'t1', form:'Daily Site Safety Inspection', type:'Inspection', due:'17:00',     project:'Lusail Tower',    status:'pending'  },
      { id:'t2', form:'Weekly Stats — Manhours & KPIs', type:'Statistics', due:'End of day', project:'Lusail Tower', status:'pending'  },
    ],
    overdue: [
      { id:'t3', form:'Monthly Fire Safety Audit',    type:'Audit',      due:'2h ago',   project:'North Wharf Dev', status:'overdue'  },
    ],
    upcoming: [
      { id:'t4', form:'Scaffold Pre-Use Checklist',   type:'Inspection', due:'Tomorrow', project:'Hamad Port',      status:'upcoming' },
    ],
  };

  if (activeTask?.type === 'Statistics') {
    return <StatsFill onExit={() => setActiveTask(null)}/>;
  }
  if (activeTask) {
    return <MobileFill onExit={() => setActiveTask(null)}/>;
  }

  return (
    <div className="phone-stage">
      <div style={{ position:'fixed', top: 16, left: 16 }}>
        <Btn onClick={onExit} variant="ghost">← Back to prototype</Btn>
      </div>
      <div className="phone-big">
        <div className="iphone-screen">
          <div className="iphone-notch"/>
          <div className="status-bar" style={{ height: 42 }}>
            <span>9:41</span><span>●●●● 􀛨</span>
          </div>

          {/* App header */}
          <div style={{ padding:'14px 20px 10px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--n-100)' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, letterSpacing:'-0.02em' }}>nAIForms</div>
              <div style={{ fontSize: 11, color:'var(--n-500)' }}>VM · Lusail Tower</div>
            </div>
            <div style={{ width: 34, height: 34, borderRadius:'50%', background:'var(--brand-700)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight: 600, fontSize: 13 }}>VM</div>
          </div>

          <div style={{ flex: 1, overflow:'auto' }}>
            {[
              { label:'Today',    color:'var(--n-500)',  items: tasks.today   },
              { label:'Overdue',  color:'var(--danger)', items: tasks.overdue },
              { label:'Upcoming', color:'var(--n-500)',  items: tasks.upcoming },
            ].map(group => (
              <React.Fragment key={group.label}>
                <div style={{ padding:'12px 20px 4px', fontSize: 11, fontWeight: 700, textTransform:'uppercase', letterSpacing:'0.06em', color: group.color }}>{group.label}</div>
                {group.items.map(t => (
                  <div key={t.id} onClick={() => setActiveTask(t)}
                    style={{ margin:'0 14px 8px', padding:'12px 14px', background:'#fff', border:'1px solid '+(t.status==='overdue'?'#fee2e2':'var(--n-200)'), borderRadius: 12, cursor:'pointer', display:'flex', alignItems:'center', gap: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius:'50%', background: t.status==='overdue'?'var(--danger)':t.status==='upcoming'?'var(--n-300)':'var(--brand-700)', flexShrink:0 }}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.form}</div>
                      <div style={{ fontSize: 11, color:'var(--n-500)' }}>{t.project} · <span style={{ color: t.type==='Statistics'?'var(--brand-700)':t.type==='Audit'?'var(--info)':'var(--n-600)' }}>{t.type}</span></div>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: t.status==='overdue'?'var(--danger)':'var(--n-700)' }}>{t.due}</div>
                      <div style={{ fontSize: 16, color:'var(--n-300)', marginTop: 2 }}>›</div>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>

          {/* Bottom tab bar */}
          <div style={{ display:'flex', borderTop:'1px solid var(--n-100)', background:'#fff', padding:'8px 0 10px' }}>
            {[{icon:'☑',label:'Tasks',active:true},{icon:'📋',label:'History',active:false},{icon:'👤',label:'Profile',active:false}].map(tab => (
              <div key={tab.label} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap: 3, fontSize: 10, color: tab.active?'var(--brand-700)':'var(--n-400)', fontWeight: tab.active?600:400 }}>
                <span style={{ fontSize: 18 }}>{tab.icon}</span>{tab.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Stats Fill — section-by-section numeric entry ─────────────────────────────
function StatsFill({ onExit }) {
  const form = window.SAMPLE_STATS;
  const [sIdx, setSIdx] = useState(0);
  const [values, setValues] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const section = form.sections[sIdx];
  const isLast = sIdx === form.sections.length - 1;

  function computeValue(f) {
    const manhours = parseFloat(values['f1'] || 0);
    const lti = parseFloat(values['f8'] || 0);
    const recordables = parseFloat(values['f7'] || 0);
    if (f.id === 'c1') return manhours > 0 ? ((lti * 1000000) / manhours).toFixed(2) : '—';
    if (f.id === 'c2') return manhours > 0 ? ((recordables * 200000) / manhours).toFixed(2) : '—';
    return '—';
  }

  if (submitted) {
    return (
      <div className="phone-stage">
        <div style={{ position:'fixed', top: 16, left: 16 }}><Btn onClick={onExit} variant="ghost">← Back</Btn></div>
        <div className="phone-big">
          <div className="iphone-screen">
            <div className="iphone-notch"/>
            <div className="status-bar" style={{ height:42 }}><span>9:41</span><span>●●●● 􀛨</span></div>
            <div style={{ flex:1, padding:'28px 22px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
              <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--success-bg)', color:'var(--success)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, margin:'20px 0 18px' }}>✓</div>
              <h2 style={{ margin:'0 0 8px', fontSize: 22 }}>Stats submitted</h2>
              <div style={{ color:'var(--n-500)', fontSize: 14, marginBottom: 20 }}>KPIs updated in the dashboard.</div>
              <div style={{ background:'var(--n-50)', padding:16, borderRadius:10, width:'100%', marginBottom:14, textAlign:'left' }}>
                <div style={{ fontSize:12, color:'var(--n-500)', marginBottom:8, fontWeight:600 }}>Calculated this submission</div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:13 }}>LTIFR</span>
                  <span style={{ fontWeight:700, fontSize:15, fontFamily:'var(--font-mono)' }}>{computeValue({id:'c1'})}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:13 }}>TRIR</span>
                  <span style={{ fontWeight:700, fontSize:15, fontFamily:'var(--font-mono)' }}>{computeValue({id:'c2'})}</span>
                </div>
              </div>
              <div style={{ flex:1 }}/>
              <button className="btn primary lg" style={{ width:'100%', justifyContent:'center' }} onClick={onExit}>Done</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="phone-stage">
      <div style={{ position:'fixed', top: 16, left: 16 }}><Btn onClick={onExit} variant="ghost">← Back</Btn></div>
      <div className="phone-big">
        <div className="iphone-screen">
          <div className="iphone-notch"/>
          <div className="status-bar" style={{ height:42 }}><span>9:41</span><span>●●●● 􀛨</span></div>

          {/* Section header */}
          <div style={{ padding:'10px 18px', borderBottom:'1px solid var(--n-100)', display:'flex', alignItems:'center', gap:10 }}>
            <button className="btn ghost sm" onClick={() => sIdx > 0 ? setSIdx(sIdx-1) : onExit()}>←</button>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{form.name}</div>
              <div style={{ fontSize:11, color:'var(--n-500)' }}>Section {sIdx+1} of {form.sections.length}</div>
            </div>
            <div style={{ display:'flex', gap: 4 }}>
              {form.sections.map((_,i) => (
                <div key={i} style={{ width:6, height:6, borderRadius:'50%', background: i<=sIdx?'var(--brand-700)':'var(--n-200)' }}/>
              ))}
            </div>
          </div>

          <div style={{ flex:1, overflow:'auto', padding:'14px 18px' }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--n-500)', marginBottom:14 }}>{section.title}</div>
            {section.fields.map(f => {
              const isSystem  = f.source === 'system';
              const isFormula = f.source === 'formula';
              return (
                <div key={f.id} style={{ marginBottom:16 }}>
                  <div style={{ fontSize:12, fontWeight:500, color: isSystem?'var(--n-400)':'var(--n-700)', marginBottom:4, display:'flex', alignItems:'center', gap:5 }}>
                    {isSystem  && <span style={{ fontSize:10 }}>⚙</span>}
                    {isFormula && <span style={{ fontSize:10, color:'var(--brand-700)' }}>ƒ</span>}
                    {f.name}{f.required && <span style={{ color:'var(--danger)' }}>*</span>}
                  </div>
                  {isSystem ? (
                    <div style={{ padding:'10px 12px', background:'var(--n-50)', border:'1px solid var(--n-200)', borderRadius:8, fontSize:13, color:'var(--n-400)', fontStyle:'italic' }}>
                      ⚙ Auto-fetched from {f.srcModule}
                    </div>
                  ) : isFormula ? (
                    <div style={{ padding:'10px 12px', background:'#eef2ff', border:'1px solid #c7d2fe', borderRadius:8, fontSize:16, fontWeight:700, fontFamily:'var(--font-mono)', color:'#3730a3' }}>
                      {computeValue(f)}
                    </div>
                  ) : (
                    <input type="number" className="input" style={{ fontSize:16, padding:'10px 12px' }} placeholder="0"
                      value={values[f.id] || ''}
                      onChange={e => setValues(v => ({ ...v, [f.id]: e.target.value }))}/>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ padding:'12px 18px 18px', borderTop:'1px solid var(--n-100)' }}>
            {isLast
              ? <button className="btn primary lg" style={{ width:'100%', justifyContent:'center' }} onClick={() => setSubmitted(true)}>Submit stats →</button>
              : <button className="btn primary lg" style={{ width:'100%', justifyContent:'center' }} onClick={() => setSIdx(sIdx+1)}>Next section →</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Inspection fill flow — frontline worker ───────────────────────────────────
function MobileFill({ onExit }) {
  const form = window.SAMPLE_INSPECTION;
  const [sIdx, setSIdx] = useState(0);
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [screen, setScreen] = useState('intro'); // intro, question, done

  const section = form.sections[sIdx];
  const question = section?.questions[qIdx];
  const totalQs = form.sections.reduce((a,s) => a + s.questions.length, 0);
  const answered = Object.keys(answers).length;

  function answer(oid) {
    setAnswers(a => ({ ...a, [question.id]: oid }));
  }
  function next() {
    if (qIdx + 1 < section.questions.length) setQIdx(qIdx + 1);
    else if (sIdx + 1 < form.sections.length) {
      let ns = sIdx + 1;
      while (ns < form.sections.length && form.sections[ns].questions.length === 0) ns++;
      if (ns < form.sections.length) { setSIdx(ns); setQIdx(0); }
      else setScreen('done');
    }
    else setScreen('done');
  }
  function prev() {
    if (qIdx > 0) setQIdx(qIdx - 1);
    else if (sIdx > 0) {
      let ps = sIdx - 1;
      while (ps >= 0 && form.sections[ps].questions.length === 0) ps--;
      if (ps >= 0) { setSIdx(ps); setQIdx(form.sections[ps].questions.length - 1); }
    }
  }

  return (
    <div className="phone-stage">
      <div style={{ position: 'fixed', top: 16, left: 16 }}>
        <Btn onClick={onExit} variant="ghost">← Back to prototype</Btn>
      </div>
      <div className="phone-big">
        <div className="iphone-screen">
          <div className="iphone-notch"/>
          <div className="status-bar" style={{ height: 42 }}>
            <span>9:41</span>
            <span>●●●● 􀛨</span>
          </div>

          {screen === 'intro' && (
            <div style={{ flex: 1, padding: '20px 22px', display:'flex', flexDirection:'column' }}>
              <div style={{ fontSize: 11, color: 'var(--n-500)' }}>Assigned inspection</div>
              <h2 style={{ fontSize: 22, margin: '4px 0 10px', letterSpacing:'-0.02em' }}>{form.name}</h2>
              <div style={{ display:'flex', gap: 6, marginBottom: 18 }}>
                <Badge tone="warning" dot>Due today</Badge>
                <Badge tone="brand">{form.version}</Badge>
              </div>
              <div style={{ background:'var(--n-50)', borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 13 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 6 }}><span>Sections</span><span style={{ fontWeight:600 }}>{form.sections.length}</span></div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 6 }}><span>Questions</span><span style={{ fontWeight:600 }}>{totalQs}</span></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span>Est. time</span><span style={{ fontWeight:600 }}>8–12 min</span></div>
              </div>
              <div style={{ fontSize: 12, color:'var(--n-500)', marginBottom: 16 }}>Project · Marina Bay Tower · Zone C</div>
              <div style={{ flex: 1 }}/>
              <button className="btn primary lg" style={{ width:'100%', justifyContent:'center' }} onClick={()=>setScreen('question')}>Start inspection</button>
            </div>
          )}

          {screen === 'question' && question && (
            <>
              <div style={{ padding: '8px 20px', borderBottom:'1px solid var(--n-100)', display:'flex', alignItems:'center', gap: 10 }}>
                <button className="btn ghost sm" onClick={()=>setScreen('intro')}>✕</button>
                <div style={{ flex: 1, height: 4, background:'var(--n-100)', borderRadius: 4, overflow:'hidden' }}>
                  <div style={{ height:'100%', width: `${(answered/totalQs)*100}%`, background:'var(--brand-700)' }}/>
                </div>
                <span style={{ fontSize: 12, color:'var(--n-500)', fontFamily:'var(--font-mono)' }}>{answered}/{totalQs}</span>
              </div>
              <div style={{ flex: 1, padding: '16px 20px', overflow:'auto' }}>
                <div style={{ fontSize: 11, color:'var(--brand-700)', fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Section {sIdx+1} · {section.title}</div>
                <div style={{ fontSize: 18, fontWeight: 600, margin: '8px 0 16px', lineHeight: 1.4 }}>
                  {question.text}
                  {question.required && <span style={{ color:'var(--danger)' }}> *</span>}
                </div>

                {question.options && question.options.map(o => {
                  const selected = answers[question.id] === o.id;
                  return (
                    <button key={o.id} onClick={() => answer(o.id)} style={{
                      width:'100%',
                      padding: '14px 16px',
                      border: '2px solid ' + (selected ? 'var(--brand-700)' : 'var(--n-200)'),
                      background: selected ? 'var(--brand-50)' : 'var(--n-0)',
                      borderRadius: 10,
                      marginBottom: 8,
                      display:'flex',
                      alignItems:'center',
                      gap: 12,
                      fontSize: 15,
                      cursor:'pointer',
                      textAlign:'left'
                    }}>
                      <span style={{ width: 20, height: 20, borderRadius:'50%', border:'2px solid ' + (selected ? 'var(--brand-700)' : 'var(--n-400)'), background: selected ? 'var(--brand-700)' : '#fff', flexShrink:0 }}/>
                      <span style={{ flex:1, fontWeight: selected ? 600 : 400 }}>{o.label}</span>
                      {o.flag && selected && <Badge tone="warning">⚑ Finding</Badge>}
                    </button>
                  );
                })}

                {question.type === 'rating_5' && (
                  <div style={{ display:'flex', gap: 10, justifyContent:'center', padding: 16 }}>
                    {[1,2,3,4,5].map(n => {
                      const sel = answers[question.id] >= n;
                      return <button key={n} onClick={()=>answer(n)} style={{ border:'none', background:'transparent', fontSize: 36, color: sel ? '#eab308' : 'var(--n-300)', cursor:'pointer' }}>★</button>;
                    })}
                  </div>
                )}

                {question.attach?.includes('photo') && (
                  <button style={{ width:'100%', padding: 14, border:'1.5px dashed var(--n-300)', borderRadius: 10, background:'var(--n-50)', color: 'var(--n-600)', fontSize: 13, marginTop: 8 }}>
                    📷 Add photo {question.photoRequiredIf && answers[question.id] && question.options?.find(o => o.id === answers[question.id])?.label === question.photoRequiredIf ? <span style={{ color:'var(--danger)' }}>*required</span> : ''}
                  </button>
                )}
              </div>
              <div style={{ padding: '12px 20px 18px', display:'flex', gap: 8, borderTop:'1px solid var(--n-100)' }}>
                <button className="btn" style={{ flex: 1, justifyContent:'center' }} onClick={prev} disabled={sIdx===0 && qIdx===0}>← Previous</button>
                <button className="btn primary" style={{ flex: 2, justifyContent:'center' }} onClick={next} disabled={!answers[question.id] && question.required}>Next →</button>
              </div>
            </>
          )}

          {screen === 'done' && (
            <div style={{ flex: 1, padding: '28px 22px', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
              <div style={{ width: 72, height: 72, borderRadius:'50%', background:'var(--success-bg)', color:'var(--success)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 40, margin: '20px 0 18px' }}>✓</div>
              <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>Inspection submitted</h2>
              <div style={{ color:'var(--n-500)', fontSize: 14, marginBottom: 20 }}>Score will appear in the HSE dashboard within seconds.</div>
              <div style={{ background:'var(--n-50)', padding: 16, borderRadius: 10, width:'100%', marginBottom: 14 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color:'var(--success)' }}>92%</div>
                <div style={{ fontSize: 12, color:'var(--n-600)' }}>Pass · 1 finding flagged</div>
              </div>
              <div style={{ flex: 1 }}/>
              <button className="btn primary lg" style={{ width:'100%', justifyContent:'center' }} onClick={onExit}>Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Schedule & Assign — a simpler inline modal-like screen
function ScheduleScreen({ form, onBack, onPublish }) {
  const [recurrence, setRecurrence] = useState('weekly');
  const [adhoc, setAdhoc] = useState(false);
  const isStats = form?.type === 'Statistics';

  return (
    <>
      <TopBar crumbs={['Tools','Forms Library', form?.name || 'Form', 'Schedule']} actions={
        <>
          <Btn variant="ghost" onClick={onBack}>← Builder</Btn>
          <Btn variant="primary" onClick={onPublish}>Publish schedule</Btn>
        </>
      }/>
      <div className="page">
        <div className="page-head">
          <div>
            <h1>Schedule & Assign</h1>
            <div className="sub">{form?.name || 'Form'} · {form?.version || 'v1.0'}</div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap: 20 }}>
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-head"><h3>Assignment</h3></div>
              <div className="card-body">
                <label className="label">Assign to roles / users</label>
                <div style={{ display:'flex', gap: 6, flexWrap:'wrap', padding: '10px 12px', border:'1px solid var(--n-200)', borderRadius: 8 }}>
                  <Badge tone="brand" dot>Site Supervisor</Badge>
                  <Badge tone="brand" dot>HSE Officer</Badge>
                  <button className="btn sm ghost">+ Add</button>
                </div>

                <div style={{ marginTop: 14 }}>
                  <label className="label">Sites / Projects</label>
                  <div style={{ display:'flex', gap: 6, flexWrap:'wrap', padding: '10px 12px', border:'1px solid var(--n-200)', borderRadius: 8 }}>
                    <Badge tone="brand" dot>Marina Bay Tower</Badge>
                    <Badge tone="brand" dot>Al Maryah Central</Badge>
                    <button className="btn sm ghost">+ Add site</button>
                  </div>
                </div>

              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-head">
                <h3>Recurrence</h3>
                {isStats && <Badge tone="warning">Scheduled only · no adhoc</Badge>}
              </div>
              <div className="card-body">
                {!isStats && (
                  <div style={{ display:'flex', gap: 8, marginBottom: 14 }}>
                    <button className={"btn " + (!adhoc?'primary':'')} onClick={()=>setAdhoc(false)}>Scheduled</button>
                    <button className={"btn " + (adhoc?'primary':'')} onClick={()=>setAdhoc(true)}>Adhoc (fill anytime)</button>
                  </div>
                )}
                {!adhoc && (
                  <>
                    <label className="label">Frequency</label>
                    <div style={{ display:'flex', gap: 6, flexWrap:'wrap' }}>
                      {['daily','weekly','monthly','custom'].map(r => (
                        <button key={r} className={"btn sm " + (recurrence===r?'primary':'')} onClick={()=>setRecurrence(r)}>{r}</button>
                      ))}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap: 10, marginTop: 14 }}>
                      <div><label className="label">Start date</label><input className="input" defaultValue="2026-05-01" type="date"/></div>
                      <div><label className="label">End date</label><input className="input" placeholder="Ongoing" type="date"/></div>
                      <div><label className="label">Due by</label><select className="select"><option>End of shift</option><option>End of day</option><option>Custom</option></select></div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-head"><h3>Reminders & escalation</h3></div>
              <div className="card-body" style={{ display:'flex', flexDirection:'column', gap: 10 }}>
                <label style={{ display:'flex', alignItems:'center', gap: 10 }}><Switch on={true} onChange={()=>{}}/> Notify assignee 2h before due</label>
                <label style={{ display:'flex', alignItems:'center', gap: 10 }}><Switch on={true} onChange={()=>{}}/> Escalate to Supervisor if overdue 1h</label>
                <label style={{ display:'flex', alignItems:'center', gap: 10 }}><Switch on={false} onChange={()=>{}}/> Lock submission after due + 24h</label>
              </div>
            </div>
          </div>

          <div>
            <div className="card">
              <div className="card-head"><h3>Preview · next 4 weeks</h3></div>
              <div className="card-body">
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap: 4, fontSize: 10, fontWeight: 600, textTransform:'uppercase', color:'var(--n-500)', letterSpacing:'0.04em', marginBottom: 6 }}>
                  {['M','T','W','T','F','S','S'].map((d,i)=><div key={i} style={{ textAlign:'center' }}>{d}</div>)}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap: 4 }}>
                  {Array.from({length:28}).map((_,i) => {
                    const day = i+1;
                    const hit = recurrence==='daily' || (recurrence==='weekly' && [0,2,4,7,9,11,14,16,18,21,23,25].includes(i)) || (recurrence==='monthly' && day===1);
                    return (
                      <div key={i} style={{ border:'1px solid var(--n-200)', borderRadius: 6, padding: 6, minHeight: 52, background: hit ? 'var(--brand-50)' : '#fff', fontSize: 11 }}>
                        <div style={{ fontFamily:'var(--font-mono)', color:'var(--n-600)' }}>{day}</div>
                        {hit && <div style={{ fontSize: 10, color:'var(--brand-700)', fontWeight: 500, marginTop: 2 }}>Due</div>}
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 14, fontSize: 12, color:'var(--n-500)' }}>12 instances will be generated</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { MobileHome, StatsFill, MobileFill, ScheduleScreen });
