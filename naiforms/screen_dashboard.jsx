// Dashboard — HSE Manager overview
function Dashboard() {
  const projects = [
    { name: 'Lusail Tower',         forms: 5, onTime: 98, overdue: 0 },
    { name: 'North Wharf Dev',      forms: 3, onTime: 72, overdue: 2 },
    { name: 'Dubai Creek Tower',    forms: 4, onTime: 85, overdue: 1 },
    { name: 'Abu Dhabi HQ',         forms: 2, onTime: 100, overdue: 0 },
    { name: 'Hamad Port Expansion', forms: 0, onTime: null, overdue: 0 },
  ];

  const activity = [
    { icon: '✓', tone: 'success', who: 'J. Patel',    action: 'submitted Daily Site Inspection',    where: 'Lusail Tower',      when: '2h ago' },
    { icon: '✓', tone: 'success', who: 'A. Kumar',    action: 'submitted Weekly Stats — KPIs',      where: 'North Wharf Dev',   when: '5h ago' },
    { icon: '⚠', tone: 'warning', who: 'System',      action: 'Scaffold Pre-Use Checklist overdue', where: 'Hamad Port',        when: '1d ago' },
    { icon: '✓', tone: 'success', who: 'S. Raman',    action: 'submitted Monthly Fire Safety Audit',where: 'Dubai Creek Tower', when: '1d ago' },
    { icon: '✓', tone: 'success', who: 'HSE Manager', action: 'published Weekly Stats — KPIs v2.1', where: 'Library',           when: '2d ago' },
    { icon: '⚠', tone: 'warning', who: 'System',      action: 'Monthly TRIR Reporting overdue',    where: 'North Wharf Dev',   when: '2d ago' },
  ];

  const kpis = [
    { label: 'LTIFR this month',  value: '0.42', sub: 'per 1M manhours', trend: '↓ 0.08 vs last month', good: true },
    { label: 'TRIR this month',   value: '1.8',  sub: 'per 200k manhours', trend: '↑ 0.3 vs last month', good: false },
    { label: 'Near Misses (MTD)', value: '14',   sub: 'incidents reported', trend: '↓ 3 vs last month', good: true },
    { label: 'Toolbox Talks',     value: '38',   sub: 'completed this month', trend: '↑ 6 vs last month', good: true },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <div className="sub">Navatech Group · Qatar Operations · April 2026</div>
        </div>
      </div>

      {/* Row 1 — summary tiles */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { n: '24',  label: 'Total forms',          sub: 'in library' },
          { n: '18',  label: 'Published',             sub: 'active in library' },
          { n: '342', label: 'Submissions',           sub: 'last 30 days' },
          { n: '91%', label: 'On-time rate',          sub: 'across all projects' },
        ].map(t => (
          <div key={t.label} className="card" style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--n-900)' }}>{t.n}</div>
            <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>{t.label}</div>
            <div style={{ fontSize: 11.5, color: 'var(--n-500)', marginTop: 1 }}>{t.sub}</div>
          </div>
        ))}
      </div>

      {/* Row 2 — compliance table + activity */}
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap: 16, marginBottom: 20 }}>

        {/* Project compliance */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--n-100)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Project Compliance</div>
            <Badge tone="neutral">This month</Badge>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>Project</th>
                <th style={{ textAlign:'center' }}>Forms</th>
                <th style={{ textAlign:'center' }}>On-time</th>
                <th style={{ textAlign:'center' }}>Overdue</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.name}>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</td>
                  <td style={{ textAlign:'center', color: 'var(--n-500)', fontSize: 12 }}>{p.forms || '—'}</td>
                  <td style={{ textAlign:'center' }}>
                    {p.onTime === null ? <span style={{ color:'var(--n-400)', fontSize:12 }}>—</span>
                      : <span style={{ fontSize: 12, fontWeight: 600, color: p.onTime >= 90 ? 'var(--success)' : p.onTime >= 75 ? 'var(--warning)' : 'var(--danger)' }}>{p.onTime}%</span>}
                  </td>
                  <td style={{ textAlign:'center' }}>
                    {p.overdue > 0
                      ? <Badge tone="danger">{p.overdue} ⚠</Badge>
                      : <span style={{ color:'var(--n-300)', fontSize:12 }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Activity feed */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--n-100)', fontWeight: 600, fontSize: 13 }}>Recent Activity</div>
          <div style={{ padding: '8px 0' }}>
            {activity.map((a, i) => (
              <div key={i} style={{ display:'flex', gap: 10, padding: '9px 18px', borderBottom: i < activity.length-1 ? '1px solid var(--n-50)' : 'none', alignItems:'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: a.tone === 'success' ? 'var(--success-bg)' : 'var(--warning-bg)', color: a.tone === 'success' ? 'var(--success)' : 'var(--warning)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: 11, flexShrink: 0, marginTop: 1 }}>{a.icon}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: 'var(--n-800)' }}>
                    <span style={{ fontWeight: 500 }}>{a.who}</span> {a.action}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--n-400)', marginTop: 2 }}>{a.where} · {a.when}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3 — KPI stat cards */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--n-500)', letterSpacing: '0.06em', marginBottom: 10 }}>Safety KPIs — Month to Date</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 12 }}>
          {kpis.map(k => (
            <div key={k.label} className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--n-500)', marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--n-900)' }}>{k.value}</div>
              <div style={{ fontSize: 11, color: 'var(--n-400)', marginTop: 1 }}>{k.sub}</div>
              <div style={{ marginTop: 8, fontSize: 11, fontWeight: 500, color: k.good ? 'var(--success)' : 'var(--danger)' }}>{k.trend}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard });
