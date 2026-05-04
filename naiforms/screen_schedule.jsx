// Statistics Capture — Schedule & Assign screen (MUI v5)
function StatsScheduleScreen({ forms = [], embedded = false, onBack, onPublish }) {
  const {
    Box, TextField, FormControl, InputLabel, Select, MenuItem,
    FormControlLabel, Checkbox, Button, FormGroup, Typography,
    Paper, Grid, ListSubheader, Chip, Divider
  } = window.MaterialUI;

  const DAYS  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const FREQS = ['Daily','Weekly','Monthly','Custom'];
  const ROLES = ['HSE Officer','Site Supervisor','Safety Manager','Project Manager'];
  const USERS = ['Ahmed Al-Rashid','Sanjay Raman','Jai Patel','Arun Kumar','Ahmed Khalil'];

  const [selForm,    setSelForm]    = useState(forms[0]?.id || '');
  const [frequency,  setFrequency]  = useState('Weekly');
  const [startDate,  setStartDate]  = useState('');
  const [endDate,    setEndDate]    = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [days,       setDays]       = useState([]);

  function toggleDay(d) {
    setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }

  function getScheduledSet() {
    const ref = startDate ? new Date(startDate) : new Date();
    const year = ref.getFullYear(), month = ref.getMonth();
    const total = new Date(year, month + 1, 0).getDate();
    const hit = new Set();
    for (let d = 1; d <= total; d++) {
      const date = new Date(year, month, d);
      const dayName = DAYS[date.getDay()];
      const afterStart = !startDate || date >= new Date(startDate);
      const beforeEnd  = !endDate   || date <= new Date(endDate);
      if (!afterStart || !beforeEnd) continue;
      if      (frequency === 'Daily')   hit.add(d);
      else if (frequency === 'Weekly'  && days.includes(dayName)) hit.add(d);
      else if (frequency === 'Monthly' && startDate && d === new Date(startDate).getDate()) hit.add(d);
    }
    return hit;
  }

  function renderCalendar() {
    const ref = startDate ? new Date(startDate) : new Date();
    const year = ref.getFullYear(), month = ref.getMonth();
    const monthLabel  = ref.toLocaleString('default', { month:'long' });
    const firstDOW    = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const hit = getScheduledSet();

    const cells = [...Array(firstDOW).fill(null), ...Array.from({length:daysInMonth}, (_,i) => i + 1)];
    while (cells.length % 7) cells.push(null);

    return (
      <Box>
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:1.5 }}>
          <Typography variant="subtitle2" fontWeight={600}>{monthLabel} {year}</Typography>
          <Chip label="Preview only — not editable" size="small" variant="outlined"
            sx={{ fontSize:11, color:'text.secondary', borderColor:'divider' }}/>
        </Box>

        {/* Day-of-week headers */}
        <Box sx={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px', mb:'4px' }}>
          {DAYS.map(d => (
            <Typography key={d} variant="caption" align="center"
              sx={{ fontWeight:700, color:'text.secondary', textTransform:'uppercase', fontSize:'10px', py:0.5 }}>
              {d[0]}
            </Typography>
          ))}
        </Box>

        {/* Date cells */}
        <Box sx={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px' }}>
          {cells.map((d, i) => (
            <Box key={i} sx={{
              border:'1px solid',
              borderColor: d && hit.has(d) ? 'primary.light' : 'divider',
              bgcolor:      d && hit.has(d) ? '#EEF4FF' : 'transparent',
              borderRadius: 1, minHeight:44, p:0.75,
              visibility: d ? 'visible' : 'hidden'
            }}>
              {d && <>
                <Typography variant="caption" sx={{
                  fontFamily:'monospace', fontSize:'11px', display:'block',
                  fontWeight: hit.has(d) ? 700 : 400,
                  color:      hit.has(d) ? 'primary.main' : 'text.secondary'
                }}>
                  {d}
                </Typography>
                {hit.has(d) && (
                  <Typography variant="caption" sx={{ fontSize:'9px', color:'primary.main', fontWeight:600, lineHeight:1.2 }}>
                    Due
                  </Typography>
                )}
              </>}
            </Box>
          ))}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt:1.5, display:'block' }}>
          {hit.size} instance{hit.size !== 1 ? 's' : ''} scheduled this month
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: embedded ? 0 : 3 }}>
      <Grid container spacing={3}>

        {/* ── LEFT 3/4: form fields ── */}
        <Grid item xs={9}>
          <Grid container spacing={3}>

            {/* Row 1 — Stats form selector + Frequency */}
            <Grid item xs={7}>
              <FormControl fullWidth required variant="outlined">
                <InputLabel>Statistics Capture Form</InputLabel>
                <Select value={selForm} label="Statistics Capture Form"
                  onChange={e => setSelForm(e.target.value)}>
                  {forms.length === 0
                    ? <MenuItem disabled value="">No Statistics forms assigned</MenuItem>
                    : forms.map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)
                  }
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={5}>
              <FormControl fullWidth required variant="outlined">
                <InputLabel>Frequency</InputLabel>
                <Select value={frequency} label="Frequency"
                  onChange={e => { setFrequency(e.target.value); if (e.target.value !== 'Weekly') setDays([]); }}>
                  {FREQS.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

            {/* Row 2 — Dates */}
            <Grid item xs={6}>
              <TextField fullWidth required label="Start Date" type="date" variant="outlined"
                value={startDate} onChange={e => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}/>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth required label="End Date" type="date" variant="outlined"
                value={endDate} onChange={e => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}/>
            </Grid>

            {/* Row 3 — Assigned To (roles + users grouped) */}
            <Grid item xs={12}>
              <FormControl fullWidth required variant="outlined">
                <InputLabel>Assigned To</InputLabel>
                <Select value={assignedTo} label="Assigned To"
                  onChange={e => setAssignedTo(e.target.value)}>
                  <ListSubheader>Roles</ListSubheader>
                  {ROLES.map(r => <MenuItem key={r} value={'role:' + r}>{r}</MenuItem>)}
                  <ListSubheader>Users</ListSubheader>
                  {USERS.map(u => <MenuItem key={u} value={'user:' + u}>{u}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>

          </Grid>
        </Grid>

        {/* ── RIGHT 1/4: Day of Week ── */}
        <Grid item xs={3}>
          <Paper variant="outlined" sx={{ p:2, height:'100%', boxSizing:'border-box' }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Day of Week{frequency === 'Weekly' ? ' *' : ''}
            </Typography>
            <FormGroup>
              {DAYS.map((day, i) => (
                <FormControlLabel key={day}
                  sx={{
                    mx:0, py:0.5,
                    borderBottom: i < DAYS.length - 1 ? '1px solid' : 'none',
                    borderColor:'divider'
                  }}
                  control={
                    <Checkbox size="small"
                      checked={days.includes(day)}
                      onChange={() => toggleDay(day)}
                      disabled={frequency !== 'Weekly'}/>
                  }
                  label={<Typography variant="body2">{day}</Typography>}/>
              ))}
            </FormGroup>
          </Paper>
        </Grid>

        {/* ── CALENDAR PREVIEW (full width) ── */}
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p:2 }}>
            {renderCalendar()}
          </Paper>
        </Grid>

      </Grid>

      {/* ── ACTION BUTTONS ── */}
      <Box sx={{ display:'flex', justifyContent:'flex-end', gap:1, mt:3 }}>
        <Button variant="outlined" color="inherit" onClick={onBack || (() => {})}>Discard</Button>
        <Button variant="contained" disableElevation
          sx={{ bgcolor:'grey.200', color:'text.primary', '&:hover':{ bgcolor:'grey.300' } }}>
          Save
        </Button>
        <Button variant="contained" disableElevation color="primary"
          onClick={onPublish || (() => {})}>
          Publish
        </Button>
      </Box>
    </Box>
  );
}

Object.assign(window, { StatsScheduleScreen });
