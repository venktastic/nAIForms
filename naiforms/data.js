// Shared form data — used by builder, preview, and fill flow
window.SAMPLE_INSPECTION = {
  id: 'insp-daily-safety',
  name: 'Daily Site Safety Inspection',
  type: 'Inspection',
  version: 'v3.3',
  status: 'draft',
  code: 'NAV-INSP-001',
  passThreshold: 85,
  sections: [
    {
      id: 's1', title: 'Housekeeping', weight: 10,
      questions: [
        { id: 'q1', text: 'Are walkways clear of debris and obstructions?', type: 'yes_no_na',
          required: true, weight: 2, attach: ['photo'], photoRequiredIf: 'No',
          options: [
            { id:'o1', label: 'Yes', score: 2 },
            { id:'o2', label: 'No',  score: 0, flag: true },
            { id:'o3', label: 'N/A', score: null },
          ]},
        { id: 'q2', text: 'Is waste segregated correctly (general vs hazardous)?', type: 'yes_no_na',
          required: true, weight: 2, attach: ['photo'],
          options: [
            { id:'o1', label: 'Yes', score: 2 },
            { id:'o2', label: 'No',  score: 0 },
            { id:'o3', label: 'N/A', score: null },
          ]},
        { id: 'q3', text: 'Materials stored at designated areas only?', type: 'yes_no_na',
          required: true, weight: 1, attach: [],
          options: [
            { id:'o1', label: 'Yes', score: 1 },
            { id:'o2', label: 'No',  score: 0 },
            { id:'o3', label: 'N/A', score: null },
          ]},
      ]
    },
    {
      id: 's2', title: 'PPE Compliance', weight: 20,
      questions: [
        { id: 'q4', text: 'All workers wearing hard hats?', type: 'yes_no_na',
          required: true, weight: 3, attach: ['photo'],
          options: [
            { id:'o1', label: 'Yes', score: 3 },
            { id:'o2', label: 'No',  score: 0, flag: true },
            { id:'o3', label: 'N/A', score: null },
          ]},
        { id: 'q5', text: 'Rate overall PPE compliance', type: 'rating_5',
          required: true, weight: 2, attach: [] },
      ]
    },
    {
      id: 's3', title: 'Work at Height', weight: 25,
      questions: [
        { id: 'q6', text: 'Fall arrest systems anchored and inspected?', type: 'yes_no_na',
          required: true, weight: 3, attach: ['photo','file'],
          options: [
            { id:'o1', label: 'Yes', score: 3 },
            { id:'o2', label: 'No',  score: -1, flag: true },
            { id:'o3', label: 'N/A', score: null },
          ]},
      ]
    },
    { id: 's4', title: 'Electrical Safety', weight: 15, questions: [] },
    { id: 's5', title: 'Fire & Emergency', weight: 20, questions: [] },
    { id: 's6', title: 'Welfare Facilities', weight: 10, questions: [] },
  ]
};

window.SAMPLE_STATS = {
  id: 'stats-weekly',
  name: 'Weekly Stats — Manhours & Safety KPIs',
  type: 'Statistics',
  version: 'v2.1',
  status: 'draft',
  code: 'NAV-STAT-001',
  sections: [
    {
      id: 'eff', title: 'Effort',
      fields: [
        { id:'f1', name:'Total Manhours',      source:'user',   unit:'hours', type:'number', required:true },
        { id:'f2', name:'Subcontractor Hours', source:'user',   unit:'hours', type:'number', required:false },
        { id:'f3', name:'Total Workers',       source:'user',   unit:'count', type:'number', required:true },
      ]
    },
    {
      id: 'out', title: 'Safety Outcomes',
      fields: [
        { id:'f4', name:'Total Observations',  source:'system', srcModule:'Observations', unit:'count', type:'number', required:true },
        { id:'f5', name:'Unsafe Acts',         source:'system', srcModule:'Observations', unit:'count', type:'number', required:true },
        { id:'f6', name:'Near Misses',         source:'system', srcModule:'Incidents',    unit:'count', type:'number', required:true },
        { id:'f7', name:'First-Aid Cases',     source:'user',   unit:'count', type:'number', required:true },
        { id:'f8', name:'LTI Count',           source:'system', srcModule:'Incidents',    unit:'count', type:'number', required:true },
        { id:'f9', name:'Toolbox Talks',       source:'system', srcModule:'Toolbox',      unit:'count', type:'number', required:false },
      ]
    },
    {
      id: 'calc', title: 'Calculated KPIs',
      fields: [
        { id:'c1', name:'LTIFR', source:'formula', formula:'(LTI Count × 1,000,000) / Total Manhours', unit:'per 1M', type:'number', required:false },
        { id:'c2', name:'TRIR',  source:'formula', formula:'(Recordables × 200,000) / Total Manhours', unit:'per 200k', type:'number', required:false },
      ]
    }
  ]
};

window.MASTER_FIELDS = [
  { id:'m1', name:'Total Manhours',         source:'user',   unit:'hours' },
  { id:'m2', name:'Total Workers',          source:'user',   unit:'count' },
  { id:'m3', name:'Subcontractor Hours',    source:'user',   unit:'hours' },
  { id:'m4', name:'Total Observations',     source:'system', srcModule:'Observations', unit:'count' },
  { id:'m5', name:'Unsafe Acts',            source:'system', srcModule:'Observations', unit:'count' },
  { id:'m6', name:'Near Misses',            source:'system', srcModule:'Incidents', unit:'count' },
  { id:'m7', name:'LTI Count',              source:'system', srcModule:'Incidents', unit:'count' },
  { id:'m8', name:'First-Aid Cases',        source:'user',   unit:'count' },
  { id:'m9', name:'Permits Issued',         source:'system', srcModule:'Permits', unit:'count' },
  { id:'m10',name:'Toolbox Talks',          source:'system', srcModule:'Toolbox', unit:'count' },
  { id:'m11',name:'Training Hours',         source:'user',   unit:'hours' },
  { id:'m12',name:'Audits Completed',       source:'system', srcModule:'Audits', unit:'count' },
  { id:'m13',name:'TRIR',                   source:'formula', unit:'rate' },
  { id:'m14',name:'LTIFR',                  source:'formula', unit:'rate' },
  { id:'m15',name:'Notes',                  source:'user',   unit:'text' },
];

window.FORM_LIST = [
  { id:'f1', name:'Daily Site Safety Inspection',   type:'Inspection', sections:6, qs:42, status:'published', v:'v3.2', owner:'HSE Manager', updated:'2d ago', scheduled:true },
  { id:'f2', name:'Monthly Fire Safety Audit',      type:'Audit',      sections:4, qs:28, status:'published', v:'v1.4', owner:'S. Raman',     updated:'2w ago', scheduled:true },
  { id:'f3', name:'Scaffold Pre-Use Checklist',     type:'Inspection', sections:3, qs:14, status:'draft',     v:'v0.3', owner:'J. Patel',     updated:'3h ago', scheduled:false },
  { id:'f4', name:'Weekly Stats — Manhours & KPIs', type:'Statistics', sections:3, qs:11, status:'published', v:'v2.0', owner:'HSE Manager', updated:'1w ago', scheduled:true },
  { id:'f5', name:'Monthly TRIR / LTIFR Reporting', type:'Statistics', sections:3, qs:18, status:'published', v:'v4.1', owner:'A. Kumar',    updated:'5d ago', scheduled:true },
  { id:'f6', name:'Crane Pre-Op Check',             type:'Inspection', sections:2, qs:9,  status:'draft',     v:'v0.1', owner:'Ahmed K.',     updated:'1h ago', scheduled:false },
];

window.ORG_HIERARCHY = [
  {
    id: 'org1', name: 'Navatech Group',
    subsidiaries: [
      {
        id: 'sub1', name: 'Qatar Operations',
        projects: [
          { id: 'prj1', name: 'Lusail Tower', forms: [{ formId:'f1', enabled:true }, { formId:'f4', enabled:true }] },
          { id: 'prj2', name: 'North Wharf Development', forms: [{ formId:'f2', enabled:true }, { formId:'f1', enabled:false }] },
          { id: 'prj3', name: 'Hamad Port Expansion', forms: [] },
        ]
      },
      {
        id: 'sub2', name: 'UAE Operations',
        projects: [
          { id: 'prj4', name: 'Dubai Creek Tower', forms: [{ formId:'f1', enabled:true }] },
          { id: 'prj5', name: 'Abu Dhabi HQ', forms: [] },
        ]
      },
      {
        id: 'sub3', name: 'KSA Operations',
        projects: []
      }
    ]
  }
];

window.QUESTION_TYPES = [
  { id:'yes_no_na', label:'Yes / No / N/A', icon:'◉', desc:'Three-way scored answer' },
  { id:'single',    label:'Single choice',  icon:'○', desc:'Pick one option' },
  { id:'multi',     label:'Multi select',   icon:'☑', desc:'Pick many' },
  { id:'rating_5',  label:'Rating 1–5',     icon:'★', desc:'Star rating' },
  { id:'text',      label:'Text',           icon:'Aa', desc:'Free-form comment' },
  { id:'number',    label:'Numeric',        icon:'#', desc:'Any number' },
  { id:'date',      label:'Date / Time',    icon:'📅', desc:'Timestamp' },
  { id:'photo',     label:'Photo only',     icon:'📷', desc:'Frontline captures image' },
  { id:'signature', label:'Signature',      icon:'✍︎', desc:'Sign on mobile' },
];
