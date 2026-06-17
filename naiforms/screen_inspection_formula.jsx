// Formula designer for Inspection / Audit form builder
const { useState, useRef, useLayoutEffect } = React;

// ── Constants ─────────────────────────────────────────────────────────────────
const _SEC_VARS = ['TotalScore','PotentialScore','TotalQuestions','TotalNA','TotalAnswered','TotalPositive'];
const _ALL_VARS = ['TotalScore','PotentialScore','TotalQuestions','TotalNA','TotalAnswered','TotalPositive','TotalSections'];

const _VAR_META = {
  TotalScore:      'Sum of selected weights in scope (weight = -1 excluded)',
  PotentialScore:  'Sum of max weights per question in scope (weight = -1 excluded)',
  TotalQuestions:  'Total questions in scope',
  TotalNA:         'Questions answered with weight = -1',
  TotalAnswered:   'TotalQuestions − TotalNA',
  TotalPositive:   'Questions where selected weight > 0',
  TotalSections:   'Number of sections in the form (overall formula only)',
};

const _DEFAULT_SEC = 'TotalScore ÷ PotentialScore × 100';
const _DEFAULT_ALL = 'TotalScore ÷ PotentialScore × 100';

// ── Tokenizer ─────────────────────────────────────────────────────────────────
function _tokenize(expr) {
  const tokens = [];
  let i = 0;
  const s = expr || '';
  while (i < s.length) {
    const ch = s[i];
    if (' \t\n\r'.includes(ch)) { i++; continue; }
    if (ch === '+') { tokens.push({ type:'OP', value:'+' }); i++; continue; }
    if (ch === '-' || ch === '−') { tokens.push({ type:'OP', value:'-' }); i++; continue; }
    if (ch === '*' || ch === '×' || ch === '×') { tokens.push({ type:'OP', value:'×' }); i++; continue; }
    if (ch === '/' || ch === '÷' || ch === '÷') { tokens.push({ type:'OP', value:'÷' }); i++; continue; }
    if (ch === '(') { tokens.push({ type:'OP', value:'(' }); i++; continue; }
    if (ch === ')') { tokens.push({ type:'OP', value:')' }); i++; continue; }
    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let num = '';
      while (i < s.length && ((s[i] >= '0' && s[i] <= '9') || s[i] === '.')) num += s[i++];
      tokens.push({ type:'NUM', value: parseFloat(num) }); continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let name = '';
      while (i < s.length && /[A-Za-z0-9_]/.test(s[i])) name += s[i++];
      tokens.push({ type:'IDENT', value: name }); continue;
    }
    tokens.push({ type:'UNKNOWN', value: ch }); i++;
  }
  return tokens;
}

// ── Evaluator ─────────────────────────────────────────────────────────────────
function _evalTokens(tokens, vars) {
  let pos = 0;
  function peek() { return tokens[pos]; }
  function consume() { return tokens[pos++]; }

  function parseExpr() { return parseAddSub(); }

  function parseAddSub() {
    let left = parseMulDiv();
    if (left === null) return null;
    while (peek() && (peek().value === '+' || peek().value === '-')) {
      const op = consume().value;
      const right = parseMulDiv();
      if (right === null) return null;
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function parseMulDiv() {
    let left = parseUnary();
    if (left === null) return null;
    while (peek() && (peek().value === '×' || peek().value === '÷')) {
      const op = consume().value;
      const right = parseUnary();
      if (right === null) return null;
      if (op === '÷') {
        if (right === 0) return null;
        left = left / right;
      } else {
        left = left * right;
      }
    }
    return left;
  }

  function parseUnary() {
    if (peek() && peek().value === '-') {
      consume();
      const v = parsePrimary();
      return v === null ? null : -v;
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const t = peek();
    if (!t) throw new Error('Unexpected end of formula');
    if (t.type === 'NUM') { consume(); return t.value; }
    if (t.type === 'IDENT') {
      consume();
      if (!(t.value in vars)) throw new Error('Unknown variable: ' + t.value);
      const v = vars[t.value];
      return typeof v === 'number' ? v : 0;
    }
    if (t.value === '(') {
      consume();
      const v = parseExpr();
      if (!peek() || peek().value !== ')') throw new Error('Missing closing parenthesis');
      consume();
      return v;
    }
    throw new Error('Unexpected token: ' + t.value);
  }

  const result = parseExpr();
  if (pos < tokens.length) throw new Error('Unexpected token: ' + tokens[pos].value);
  return result;
}

function evaluateFormula(expr, vars) {
  if (!expr || !expr.trim()) return null;
  try {
    const tokens = _tokenize(expr);
    const result = _evalTokens(tokens, vars || {});
    if (result === null || result === undefined || isNaN(result) || !isFinite(result)) return null;
    return Math.round(result * 100) / 100;
  } catch (e) {
    return null;
  }
}

// ── Validator ─────────────────────────────────────────────────────────────────
function validateFormula(expr, scope) {
  const errors = [];
  const warnings = [];
  const validVars = scope === 'section' ? _SEC_VARS : _ALL_VARS;
  const trimmed = (expr || '').trim();

  if (!trimmed) {
    errors.push(scope === 'section'
      ? 'Section score formula is required.'
      : 'Overall score formula is required.');
    return { errors, warnings };
  }

  const tokens = _tokenize(trimmed);

  for (const t of tokens) {
    if (t.type === 'UNKNOWN') {
      errors.push(`Invalid character: "${t.value}". Only + − × ÷ and ( ) are allowed.`);
      return { errors, warnings };
    }
  }

  const seen = new Set();
  for (const t of tokens) {
    if (t.type !== 'IDENT') continue;
    if (seen.has(t.value)) continue;
    seen.add(t.value);
    if (_ALL_VARS.includes(t.value)) {
      if (scope === 'section' && t.value === 'TotalSections') {
        errors.push('TotalSections is not available in the section formula.');
      }
    } else {
      errors.push(`Unknown variable: "${t.value}". Use the variable chips to insert valid names.`);
    }
  }

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'OP' && t.value === '-') {
      const prev = tokens[i - 1];
      const isUnary = !prev || prev.type === 'OP';
      if (isUnary && tokens[i + 1]?.type === 'NUM') {
        errors.push('Negative numbers are not allowed as constants.');
        break;
      }
    }
  }

  if (errors.length) return { errors, warnings };

  let depth = 0;
  for (const t of tokens) {
    if (t.value === '(') depth++;
    else if (t.value === ')') depth--;
    if (depth < 0) break;
  }
  if (depth !== 0) {
    errors.push('Check your parentheses — they are not balanced.');
    return { errors, warnings };
  }

  if (!tokens.some(t => t.type === 'IDENT')) {
    warnings.push('This formula has no variables. It will return the same value for every submission. Are you sure?');
  }

  return { errors, warnings };
}

// ── FormulaEditor — one formula block ────────────────────────────────────────
function _FormulaEditor({ label, desc, expr, onChange, scope, onValidate, validationResult }) {
  const taRef = useRef(null);
  const [pendingCursor, setPendingCursor] = useState(null);
  const vars = scope === 'section' ? _SEC_VARS : _ALL_VARS;

  useLayoutEffect(() => {
    if (pendingCursor !== null && taRef.current) {
      taRef.current.focus();
      taRef.current.setSelectionRange(pendingCursor, pendingCursor);
      setPendingCursor(null);
    }
  }, [pendingCursor]);

  function insert(text) {
    const el = taRef.current;
    const start = el ? el.selectionStart : expr.length;
    const end   = el ? el.selectionEnd   : expr.length;
    const before = start > 0 && expr[start - 1] !== ' ' && expr[start - 1] !== '(' ? ' ' : '';
    const after  = end < expr.length && expr[end] !== ' ' && expr[end] !== ')' ? ' ' : '';
    const full   = before + text + after;
    onChange(expr.slice(0, start) + full + expr.slice(end));
    setPendingCursor(start + full.length);
  }

  const hasErrors   = (validationResult?.errors   || []).length > 0;
  const hasWarnings = !hasErrors && (validationResult?.warnings || []).length > 0;
  const borderColor = hasErrors ? '#EF4444' : hasWarnings ? '#F59E0B' : '#D1D5DB';

  const OPS = [
    { lbl:'+',         ins:'+' },
    { lbl:'−',         ins:'-' },
    { lbl:'×',         ins:'×' },
    { lbl:'÷',         ins:'÷' },
    { lbl:'(',         ins:'(' },
    { lbl:')',         ins:')' },
    { lbl:'100',       ins:'100' },
    { lbl:'200,000',   ins:'200000' },
    { lbl:'1,000,000', ins:'1000000' },
  ];

  return (
    <div style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:10, padding:'14px 16px 12px' }}>
      <div style={{ fontSize:13, fontWeight:700, color:'#111827', marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:12, color:'#6B7280', marginBottom:10, lineHeight:1.5 }}>{desc}</div>

      <textarea ref={taRef} rows={3} value={expr} spellCheck={false}
        onChange={e => onChange(e.target.value)}
        onBlur={onValidate}
        style={{ width:'100%', boxSizing:'border-box', resize:'none', outline:'none',
          fontFamily:'JetBrains Mono, Menlo, Consolas, monospace', fontSize:13, lineHeight:1.6,
          padding:'9px 12px', border:`1.5px solid ${borderColor}`, borderRadius:8,
          background:'#fff', color:'#111827' }}/>

      <div style={{ marginTop:8 }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.06em',
          textTransform:'uppercase', marginBottom:5 }}>Variables — click to insert at cursor</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
          {vars.map(v => (
            <button key={v} onClick={() => insert(v)} title={_VAR_META[v]}
              style={{ padding:'3px 9px', fontSize:11.5, fontWeight:600, cursor:'pointer',
                border:'1px solid #BFDBFE', borderRadius:4, background:'#EFF6FF', color:'#1E40AF',
                fontFamily:'JetBrains Mono, Menlo, monospace', lineHeight:1.5 }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginTop:8 }}>
        {OPS.map(({ lbl, ins }) => (
          <button key={ins} onClick={() => insert(ins)}
            style={{ padding:'3px 9px', fontSize:12, fontWeight:600, cursor:'pointer',
              border:'1px solid #E5E7EB', borderRadius:4, background:'#fff', color:'#374151',
              fontFamily: ins.length <= 1 ? 'JetBrains Mono, Menlo, monospace' : 'inherit' }}>
            {lbl}
          </button>
        ))}
      </div>

      {hasErrors && (
        <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:3 }}>
          {validationResult.errors.map((e, i) => (
            <div key={i} style={{ fontSize:12, color:'#DC2626', display:'flex', gap:5, alignItems:'flex-start' }}>
              <span style={{ flexShrink:0 }}>⚠</span><span>{e}</span>
            </div>
          ))}
        </div>
      )}
      {hasWarnings && (
        <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:3 }}>
          {validationResult.warnings.map((w, i) => (
            <div key={i} style={{ fontSize:12, color:'#D97706', display:'flex', gap:5, alignItems:'flex-start' }}>
              <span style={{ flexShrink:0 }}>⚠</span><span>{w}</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => { onChange(scope === 'section' ? _DEFAULT_SEC : _DEFAULT_ALL); onValidate(); }}
        style={{ marginTop:8, background:'none', border:'none', padding:0, cursor:'pointer',
          fontSize:12, color:'#6B7280', textDecoration:'underline' }}>
        Reset to default
      </button>
    </div>
  );
}

// ── InspectionFormulaPanel ────────────────────────────────────────────────────
function InspectionFormulaPanel({ formulas, onSave, onClose }) {
  const init = formulas || {};
  const [secExpr, setSecExpr] = useState(init.section || _DEFAULT_SEC);
  const [allExpr, setAllExpr] = useState(init.overall || _DEFAULT_ALL);
  const [secV, setSecV] = useState({ errors:[], warnings:[] });
  const [allV, setAllV] = useState({ errors:[], warnings:[] });

  function validateSec() { setSecV(validateFormula(secExpr, 'section')); }
  function validateAll() { setAllV(validateFormula(allExpr, 'overall')); }

  function handleSave() {
    const sv = validateFormula(secExpr, 'section');
    const av = validateFormula(allExpr, 'overall');
    setSecV(sv);
    setAllV(av);
    if (sv.errors.length > 0 || av.errors.length > 0) return;
    onSave({ section: secExpr.trim(), overall: allExpr.trim() });
  }

  return (
    <div onClick={onClose}
      style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,0.45)',
        display:'flex', alignItems:'flex-start', justifyContent:'center',
        padding:'40px 16px 40px', overflowY:'auto' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background:'#fff', borderRadius:12, width:'100%', maxWidth:680,
          boxShadow:'0 24px 64px rgba(0,0,0,0.22)', fontFamily:'var(--font-sans)', flexShrink:0 }}>

        <div style={{ padding:'18px 20px', borderBottom:'1px solid #E5E7EB',
          display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'#111827' }}>Score Formula</div>
            <div style={{ fontSize:12, color:'#6B7280', marginTop:2 }}>
              Configure how section and overall scores are calculated for this form
            </div>
          </div>
          <button onClick={onClose}
            style={{ background:'none', border:'none', fontSize:20, color:'#9CA3AF',
              cursor:'pointer', padding:'2px 6px', lineHeight:1, marginLeft:16, flexShrink:0 }}>
            ✕
          </button>
        </div>

        <div style={{ padding:'16px 20px', display:'flex', flexDirection:'column', gap:14 }}>
          <_FormulaEditor
            label="Section Score Formula"
            desc="Applied independently to each section. Use section-scoped variables only."
            expr={secExpr}
            onChange={setSecExpr}
            scope="section"
            onValidate={validateSec}
            validationResult={secV}
          />
          <_FormulaEditor
            label="Overall Score Formula"
            desc="Applied to the whole form. TotalSections is also available here."
            expr={allExpr}
            onChange={setAllExpr}
            scope="overall"
            onValidate={validateAll}
            validationResult={allV}
          />
        </div>

        <div style={{ padding:'14px 20px', borderTop:'1px solid #E5E7EB',
          display:'flex', justifyContent:'flex-end', gap:10 }}>
          <button onClick={onClose}
            style={{ padding:'8px 18px', border:'1px solid #D1D5DB', borderRadius:8,
              background:'#fff', color:'#374151', fontSize:13, fontWeight:500, cursor:'pointer' }}>
            Discard
          </button>
          <button onClick={handleSave}
            style={{ padding:'8px 18px', border:'none', borderRadius:8,
              background:'#2563EB', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            Save Formula
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { InspectionFormulaPanel, evaluateFormula, validateFormula });
