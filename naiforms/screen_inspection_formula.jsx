// Formula designer for Inspection / Audit form builder
const { useState, useRef, useEffect } = React;

// ── Constants ─────────────────────────────────────────────────────────────────
const _SEC_VARS = ['TotalScore','PotentialScore','TotalQuestions','TotalNA','TotalAnswered','TotalPositive'];
const _ALL_VARS = ['TotalScore','PotentialScore','TotalQuestions','TotalNA','TotalAnswered','TotalPositive','TotalSections'];

const _VAR_META = {
  TotalScore:      'Sum of selected weights in scope (weight = −1 excluded)',
  PotentialScore:  'Sum of max weights per question in scope (weight = −1 excluded)',
  TotalQuestions:  'Total questions in scope',
  TotalNA:         'Questions answered with weight = −1',
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
    if (ch === '+')                                    { tokens.push({ type:'OP', value:'+' }); i++; continue; }
    if (ch === '-' || ch === '−')                 { tokens.push({ type:'OP', value:'-' }); i++; continue; }
    if (ch === '*' || ch === '×')                 { tokens.push({ type:'OP', value:'×' }); i++; continue; }
    if (ch === '/' || ch === '÷')                 { tokens.push({ type:'OP', value:'÷' }); i++; continue; }
    if (ch === '(')                                    { tokens.push({ type:'OP', value:'(' }); i++; continue; }
    if (ch === ')')                                    { tokens.push({ type:'OP', value:')' }); i++; continue; }
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
    errors.push(scope === 'section' ? 'Section score formula is required.' : 'Overall score formula is required.');
    return { errors, warnings };
  }

  const tokens = _tokenize(trimmed);

  for (let ti = 0; ti < tokens.length; ti++) {
    if (tokens[ti].type === 'UNKNOWN') {
      errors.push('Invalid character: "' + tokens[ti].value + '". Only + − × ÷ and ( ) are allowed.');
      return { errors, warnings };
    }
  }

  const seen = new Set();
  for (let ti = 0; ti < tokens.length; ti++) {
    const t = tokens[ti];
    if (t.type !== 'IDENT') continue;
    if (seen.has(t.value)) continue;
    seen.add(t.value);
    if (_ALL_VARS.indexOf(t.value) >= 0) {
      if (scope === 'section' && t.value === 'TotalSections') {
        errors.push('TotalSections is not available in the section formula.');
      }
    } else {
      errors.push('Unknown variable: "' + t.value + '". Use the variable chips to insert valid names.');
    }
  }

  for (let ti = 0; ti < tokens.length; ti++) {
    const t = tokens[ti];
    if (t.type === 'OP' && t.value === '-') {
      const prev = tokens[ti - 1];
      const isUnary = !prev || prev.type === 'OP';
      if (isUnary && tokens[ti + 1] && tokens[ti + 1].type === 'NUM') {
        errors.push('Negative numbers are not allowed as constants.');
        break;
      }
    }
  }

  if (errors.length) return { errors, warnings };

  let depth = 0;
  for (let ti = 0; ti < tokens.length; ti++) {
    if (tokens[ti].value === '(') depth++;
    else if (tokens[ti].value === ')') depth--;
    if (depth < 0) break;
  }
  if (depth !== 0) {
    errors.push('Check your parentheses — they are not balanced.');
    return { errors, warnings };
  }

  let hasIdent = false;
  for (let ti = 0; ti < tokens.length; ti++) {
    if (tokens[ti].type === 'IDENT') { hasIdent = true; break; }
  }
  if (!hasIdent) {
    warnings.push('This formula has no variables. It will return the same value for every submission. Are you sure?');
  }

  return { errors, warnings };
}

// ── CSS (injected once) ───────────────────────────────────────────────────────
const _NIF_CSS = [
  '._nif-chip{position:relative;display:inline-flex;}',
  '._nif-chip:hover ._nif-tip{display:block;}',
  '._nif-tip{display:none;position:absolute;bottom:calc(100% + 5px);left:50%;',
  'transform:translateX(-50%);max-width:260px;min-width:120px;',
  'background:#1F2937;color:#F9FAFB;font-size:11px;line-height:1.45;',
  'padding:6px 9px;border-radius:6px;pointer-events:none;z-index:999;',
  'box-shadow:0 4px 12px rgba(0,0,0,0.25);font-family:var(--font-sans);}',
  '._nif-tip::after{content:"";position:absolute;top:100%;left:50%;',
  'transform:translateX(-50%);border:5px solid transparent;border-top-color:#1F2937;}',
].join('');

// ── FormulaEditorBlock ────────────────────────────────────────────────────────
function FormulaEditorBlock({ label, desc, expr, onChange, scope, onValidate, validationResult }) {
  const taRef = useRef(null);
  const [pendingCursor, setPendingCursor] = useState(null);
  const vars = scope === 'section' ? _SEC_VARS : _ALL_VARS;

  useEffect(function() {
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

  const vErrors   = (validationResult && validationResult.errors)   || [];
  const vWarnings = (validationResult && validationResult.warnings) || [];
  const hasErrors   = vErrors.length > 0;
  const hasWarnings = !hasErrors && vWarnings.length > 0;
  const borderColor = hasErrors ? '#EF4444' : hasWarnings ? '#F59E0B' : '#D1D5DB';

  const OPS = [
    { lbl:'+', ins:'+' }, { lbl:'−', ins:'-' },
    { lbl:'×', ins:'×' }, { lbl:'÷', ins:'÷' },
    { lbl:'(', ins:'(' }, { lbl:')', ins:')' }, { lbl:'100', ins:'100' },
  ];

  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:11.5, fontWeight:700, color:'#111827', marginBottom:2 }}>{label}</div>
      <div style={{ fontSize:10.5, color:'#6B7280', marginBottom:5, lineHeight:1.4 }}>{desc}</div>

      <textarea ref={taRef} rows={2} value={expr} spellCheck={false}
        onChange={function(e) { onChange(e.target.value); }}
        onBlur={function() { onValidate(expr); }}
        style={{ width:'100%', boxSizing:'border-box', resize:'none', outline:'none',
          fontFamily:'JetBrains Mono, Menlo, Consolas, monospace', fontSize:11, lineHeight:1.5,
          padding:'5px 7px', border:'1.5px solid ' + borderColor, borderRadius:6,
          background:'#fff', color:'#111827' }} />

      <div style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', letterSpacing:'0.06em',
        textTransform:'uppercase', margin:'5px 0 4px' }}>Variables</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:3 }}>
        {vars.map(function(v) {
          return (
            <span key={v} className="_nif-chip">
              <button
                onClick={function() { insert(v); }}
                style={{ padding:'2px 7px', fontSize:10.5, fontWeight:600, cursor:'pointer',
                  border:'1px solid #BFDBFE', borderRadius:4, background:'#EFF6FF', color:'#1E40AF',
                  fontFamily:'JetBrains Mono, Menlo, monospace', lineHeight:1.5 }}>
                {v}
              </button>
              <span className="_nif-tip">{_VAR_META[v]}</span>
            </span>
          );
        })}
      </div>

      <div style={{ display:'flex', flexWrap:'wrap', gap:3, marginTop:4 }}>
        {OPS.map(function(op) {
          return (
            <button key={op.ins}
              onClick={function() { insert(op.ins); }}
              style={{ padding:'2px 7px', fontSize:11, fontWeight:600, cursor:'pointer',
                border:'1px solid #E5E7EB', borderRadius:4, background:'#fff', color:'#374151',
                fontFamily:'JetBrains Mono, Menlo, monospace', lineHeight:1.5 }}>
              {op.lbl}
            </button>
          );
        })}
      </div>

      {hasErrors && (
        <div style={{ marginTop:5 }}>
          {vErrors.map(function(e, i) {
            return (
              <div key={i} style={{ fontSize:10.5, color:'#DC2626', display:'flex', gap:4,
                alignItems:'flex-start', marginBottom:2 }}>
                <span style={{ flexShrink:0 }}>⚠</span><span>{e}</span>
              </div>
            );
          })}
        </div>
      )}
      {hasWarnings && (
        <div style={{ marginTop:5 }}>
          {vWarnings.map(function(w, i) {
            return (
              <div key={i} style={{ fontSize:10.5, color:'#D97706', display:'flex', gap:4,
                alignItems:'flex-start', marginBottom:2 }}>
                <span style={{ flexShrink:0 }}>⚠</span><span>{w}</span>
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={function() {
          const def = scope === 'section' ? _DEFAULT_SEC : _DEFAULT_ALL;
          onChange(def);
          onValidate(def);
        }}
        style={{ marginTop:4, background:'none', border:'none', padding:0, cursor:'pointer',
          fontSize:10.5, color:'#6B7280', textDecoration:'underline' }}>
        Reset to default
      </button>
    </div>
  );
}

// ── InspectionFormulaPanel ────────────────────────────────────────────────────
function InspectionFormulaPanel({ formulas, onSave }) {
  const init = formulas || {};
  const [open, setOpen] = useState(false);
  const [secExpr, setSecExpr] = useState(init.section || _DEFAULT_SEC);
  const [allExpr, setAllExpr] = useState(init.overall || _DEFAULT_ALL);
  const [secV, setSecV] = useState({ errors:[], warnings:[] });
  const [allV, setAllV] = useState({ errors:[], warnings:[] });
  const [saved, setSaved] = useState(init);

  function validateSec(expr) {
    setSecV(validateFormula(typeof expr === 'string' ? expr : secExpr, 'section'));
  }
  function validateAll(expr) {
    setAllV(validateFormula(typeof expr === 'string' ? expr : allExpr, 'overall'));
  }

  function handleSave() {
    const sv = validateFormula(secExpr, 'section');
    const av = validateFormula(allExpr, 'overall');
    setSecV(sv);
    setAllV(av);
    if (sv.errors.length > 0 || av.errors.length > 0) return;
    const result = { section: secExpr.trim(), overall: allExpr.trim() };
    setSaved(result);
    if (onSave) onSave(result);
    setOpen(false);
  }

  function handleDiscard() {
    setSecExpr(saved.section || _DEFAULT_SEC);
    setAllExpr(saved.overall || _DEFAULT_ALL);
    setSecV({ errors:[], warnings:[] });
    setAllV({ errors:[], warnings:[] });
    setOpen(false);
  }

  return (
    <div style={{ marginTop:14, borderTop:'1px solid var(--n-200)', paddingTop:10 }}>
      <style dangerouslySetInnerHTML={{ __html: _NIF_CSS }} />

      <button
        onClick={function() { setOpen(function(o) { return !o; }); }}
        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%',
          background:'none', border:'none', padding:0, cursor:'pointer',
          fontSize:11, fontWeight:700, color:'var(--n-700)',
          textTransform:'uppercase', letterSpacing:'0.06em' }}>
        <span>ƒ Score Formula</span>
        <span style={{ fontSize:12, color:'var(--n-400)', fontWeight:400, marginLeft:6 }}>
          {open ? '▾' : '▸'}
        </span>
      </button>

      {open && (
        <div style={{ marginTop:10, maxHeight:'calc(100vh - 460px)', overflowY:'auto', paddingRight:2 }}>
          <FormulaEditorBlock
            label="Section Score"
            desc="Applied to each section. Section-scoped variables only."
            expr={secExpr}
            onChange={setSecExpr}
            scope="section"
            onValidate={validateSec}
            validationResult={secV}
          />
          <FormulaEditorBlock
            label="Overall Score"
            desc="Applied to the whole form. TotalSections also available."
            expr={allExpr}
            onChange={setAllExpr}
            scope="overall"
            onValidate={validateAll}
            validationResult={allV}
          />
          <div style={{ display:'flex', gap:6, paddingBottom:8 }}>
            <button
              onClick={handleDiscard}
              style={{ flex:1, padding:'6px 0', fontSize:11.5, fontWeight:500, cursor:'pointer',
                border:'1px solid #D1D5DB', borderRadius:6, background:'#fff', color:'#374151' }}>
              Discard
            </button>
            <button
              onClick={handleSave}
              style={{ flex:2, padding:'6px 0', fontSize:11.5, fontWeight:600, cursor:'pointer',
                border:'none', borderRadius:6, background:'#2563EB', color:'#fff' }}>
              Save Formula
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { InspectionFormulaPanel, evaluateFormula, validateFormula });
