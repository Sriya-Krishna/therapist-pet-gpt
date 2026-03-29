import { useState, useRef, useEffect } from "react";

const PATIENTS = [
  { id:"amara", name:"Amara K.", initials:"AK", status:"crisis", statusLabel:"Crisis flag", agent:"Gentle listener", lastMsg:"14 min ago", msgCount:23, tone:{warmth:8,directness:2,verbosity:5}, styles:["Reflective questions","Affirmations"], boundaries:["Never suggest medication","Redirect self-harm language to grounding exercises","Send immediate alert on crisis keyword detection"], summary:"Over the past 3 days, Amara has engaged in 23 messages. Emotional tone has shifted from anxious to withdrawn. Key themes: isolation from friends, sleep disruption (mentions sleeping 3-4 hrs), and repeated references to feeling like a burden. The phrase \"I don't see the point anymore\" was flagged 14 minutes ago. No explicit self-harm language, but semantic pattern suggests escalating hopelessness.", flag:"\"I don't see the point anymore\" — 14 min ago", recommendation:"Review transcript and consider scheduling an early session.", messages:[
    {from:"patient",text:"I couldn't sleep again last night. I just kept staring at the ceiling.",time:"2:41 PM"},
    {from:"agent",text:"That sounds really exhausting. Those sleepless nights can make everything feel heavier. What was going through your mind?",time:"2:41 PM"},
    {from:"patient",text:"Just that nobody would notice if I wasn't around. Like I'm invisible.",time:"2:43 PM"},
    {from:"agent",text:"I hear you, and I want you to know that what you're feeling matters. You're not invisible to me right now. Can you tell me about one small thing that felt real to you today?",time:"2:43 PM"},
    {from:"patient",text:"I don't see the point anymore. Everything just feels the same.",time:"2:55 PM",flagged:true}
  ]},
  { id:"david", name:"David L.", initials:"DL", status:"warning", statusLabel:"Mood shift detected", agent:"Motivational coach", lastMsg:"2 hrs ago", msgCount:11, tone:{warmth:6,directness:7,verbosity:6}, styles:["Goal-setting prompts","Affirmations"], boundaries:["Avoid toxic positivity","If frustration persists 3+ messages, shift to empathetic listening","Do not set goals patient hasn't agreed to"], summary:"David had 11 messages over 2 days. Initially engaged and positive about job search progress, but tone shifted in last 4 messages after mentioning a rejected application. Language moved from confident to defeated. No crisis indicators, but the abrupt tonal shift triggered a mood change alert. He responded well to the agent's redirect toward reviewing his wins list.", flag:null, recommendation:"Sub-agent automatically shifted from goal-setting to empathetic mode per configured boundary rule.", messages:[
    {from:"patient",text:"Got rejected from that company I was really excited about.",time:"10:12 AM"},
    {from:"agent",text:"That's a tough one, especially when you were invested. It's okay to sit with that disappointment for a moment.",time:"10:12 AM"},
    {from:"patient",text:"What's even the point of trying. Same result every time.",time:"10:15 AM"},
    {from:"agent",text:"I get that frustration. Before we go there though — last week you told me about three interviews you landed. That's not \"same result every time.\" Want to look at your wins list together?",time:"10:15 AM"}
  ]},
  { id:"maya", name:"Maya R.", initials:"MR", status:"stable", statusLabel:"Stable", agent:"Reflective mirror", lastMsg:"yesterday", msgCount:6, tone:{warmth:5,directness:4,verbosity:5}, styles:["Open-ended exploration","Emotion labeling"], boundaries:["Do not offer interpretations","Only reflect back what patient says","Avoid leading questions about family unless patient initiates"], summary:"Maya engaged in 6 messages yesterday, continuing her pattern of evening check-ins. Themes were consistent with previous weeks: work-life balance, relationship with manager, and weekend planning as a coping mechanism. Emotional tone remained even throughout. She is showing increasing self-awareness about her avoidance patterns.", flag:null, recommendation:"This may be worth exploring in the next in-person session.", messages:[
    {from:"patient",text:"I think I keep myself busy so I don't have to think. Like if I stop moving, everything catches up.",time:"8:47 PM"},
    {from:"agent",text:"You said \"everything catches up.\" What does that feel like when it does?",time:"8:47 PM"},
    {from:"patient",text:"Heavy. Like a weight I forgot I was carrying. But then I plan something for the weekend and it goes away again.",time:"8:50 PM"}
  ]},
  { id:"james", name:"James T.", initials:"JT", status:"stable", statusLabel:"Stable", agent:"Calm affirmer", lastMsg:"3 days ago", msgCount:2, tone:{warmth:7,directness:3,verbosity:2}, styles:["Brief acknowledgments"], boundaries:["Keep responses under 2 sentences","Do not probe","Patient prefers minimal engagement"], summary:"James sent 2 brief messages over the past 3 days, consistent with his typical low-engagement pattern. Content was routine check-in about his week. No notable emotional shifts. The sub-agent's brief response style continues to match well.", flag:null, recommendation:null, messages:[
    {from:"patient",text:"Had an okay week. Nothing major.",time:"6:30 PM"},
    {from:"agent",text:"Glad you checked in. An okay week counts.",time:"6:30 PM"}
  ]}
];

const ALERTS = [
  { id:1, patient:"Amara K.", patientId:"amara", severity:"critical", text:"\"I don't see the point anymore\"", time:"14 min ago", context:"Message during evening check-in after 3 days of declining engagement", resolved:false },
  { id:2, patient:"David L.", patientId:"david", severity:"moderate", text:"Abrupt mood shift detected", time:"2 hrs ago", context:"Tone changed from confident to defeated after job rejection", resolved:false },
  { id:3, patient:"Amara K.", patientId:"amara", severity:"moderate", text:"\"Nobody would notice if I wasn't around\"", time:"26 min ago", context:"Followed sleep disruption discussion", resolved:false },
  { id:4, patient:"Maya R.", patientId:"maya", severity:"low", text:"Avoidance pattern identified", time:"yesterday", context:"3rd consecutive session mentioning busyness as coping mechanism", resolved:true }
];

const TEMPLATES = [
  { id:"gentle", label:"Gentle listener", desc:"Soft, validating, reflective", defaults:{warmth:8,directness:2,verbosity:5}, styles:["Reflective questions","Affirmations"] },
  { id:"motivator", label:"Motivational coach", desc:"Encouraging, action-oriented", defaults:{warmth:6,directness:7,verbosity:6}, styles:["Goal-setting prompts","Affirmations"] },
  { id:"mirror", label:"Reflective mirror", desc:"Socratic, neutral, pattern-surfacing", defaults:{warmth:5,directness:4,verbosity:5}, styles:["Open-ended exploration","Emotion labeling"] },
  { id:"affirmer", label:"Calm affirmer", desc:"Brief, warm, grounding", defaults:{warmth:7,directness:3,verbosity:2}, styles:["Brief acknowledgments"] }
];

const ALL_STYLES = ["Reflective questions","Affirmations","Goal-setting prompts","Grounding exercises","Gentle redirects","Open-ended exploration","Brief acknowledgments","Emotion labeling"];
const ALL_BOUNDARIES = ["Never suggest medication or dosage changes","Redirect self-harm language to grounding exercises","Do not probe into family topics unless patient initiates","Keep responses under 2 sentences","Avoid leading questions","Do not set goals patient hasn't agreed to","If frustration persists 3+ messages, shift to empathetic listening","Send immediate alert on crisis keyword detection"];

const statusColor = (s) => s==="crisis"?"#E24B4A":s==="warning"?"#D98A0B":"#1D9E75";
const statusBg = (s) => s==="crisis"?"#FCEBEB":s==="warning"?"#FAEEDA":"#E1F5EE";
const sevColor = (s) => s==="critical"?"#E24B4A":s==="moderate"?"#D98A0B":"#888780";
const sevBg = (s) => s==="critical"?"#FCEBEB":s==="moderate"?"#FAEEDA":"#F1EFE8";

export default function App() {
  const [view, setView] = useState("therapist");
  const [subView, setSubView] = useState("dashboard");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detailTab, setDetailTab] = useState("summary");
  const [builderStep, setBuilderStep] = useState(1);
  const [builderState, setBuilderState] = useState({ template:"", tone:{warmth:5,directness:5,verbosity:5}, styles:[], boundaries:[], customBoundary:"" });
  const [chatMessages, setChatMessages] = useState([
    { from:"agent", text:"Hi there. How are you feeling today?", time:"now" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [testInput, setTestInput] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [alerts, setAlerts] = useState(ALERTS);
  const chatEndRef = useRef(null);
  const [builderPatient, setBuilderPatient] = useState(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [chatMessages]);

  const navTo = (v, sv) => { setView(v); setSubView(sv || "dashboard"); setSelectedPatient(null); setDetailTab("summary"); };

  const openPatient = (p) => { setSelectedPatient(p); setSubView("detail"); setDetailTab("summary"); };

  const openBuilder = (p) => {
    setBuilderPatient(p);
    if (p) {
      setBuilderState({ template: TEMPLATES.find(t=>t.styles.some(s=>p.styles.includes(s)))?.id || "", tone:{...p.tone}, styles:[...p.styles], boundaries:[...p.boundaries], customBoundary:"" });
    } else {
      setBuilderState({ template:"", tone:{warmth:5,directness:5,verbosity:5}, styles:[], boundaries:[], customBoundary:"" });
    }
    setBuilderStep(1);
    setTestInput("");
    setTestResult(null);
    setSubView("builder");
  };

  const selectTemplate = (id) => {
    const t = TEMPLATES.find(x=>x.id===id);
    setBuilderState(prev => ({...prev, template:id, tone:{...t.defaults}, styles:[...t.styles]}));
  };

  const toggleStyle = (s) => {
    setBuilderState(prev => ({...prev, styles: prev.styles.includes(s) ? prev.styles.filter(x=>x!==s) : [...prev.styles, s]}));
  };

  const toggleBoundary = (b) => {
    setBuilderState(prev => ({...prev, boundaries: prev.boundaries.includes(b) ? prev.boundaries.filter(x=>x!==b) : [...prev.boundaries, b]}));
  };

  const addCustomBoundary = () => {
    if (builderState.customBoundary.trim()) {
      setBuilderState(prev => ({...prev, boundaries:[...prev.boundaries, prev.customBoundary.trim()], customBoundary:""}));
    }
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = { from:"patient", text:chatInput, time:"now" };
    const replies = [
      "Thank you for sharing that with me. Can you tell me more about what that felt like?",
      "I hear you. That sounds like a lot to carry right now.",
      "It makes sense you'd feel that way. What do you think is at the core of it?",
      "I'm here with you. Take your time.",
      "That's a really honest reflection. What would feel supportive right now?"
    ];
    const reply = { from:"agent", text:replies[Math.floor(Math.random()*replies.length)], time:"now" };
    setChatMessages(prev => [...prev, userMsg, reply]);
    setChatInput("");
  };

  const runPreview = () => {
    if (!testInput.trim()) return;
    const tmpl = TEMPLATES.find(t=>t.id===builderState.template);
    let response;
    if (tmpl?.id==="gentle") {
      response = { text:"That sounds really difficult. Thank you for sharing that with me. What feels most heavy about it right now?" };
    } else if (tmpl?.id==="motivator") {
      response = { text:"I hear you. Let's take a step back — what's one small thing that went well today, even if it feels minor?" };
    } else if (tmpl?.id==="mirror") {
      response = { text:"You mentioned feeling stuck. What does \"stuck\" look like for you in this moment?" };
    } else if (tmpl?.id==="affirmer") {
      response = { text:"That makes sense. I'm here." };
    } else {
      response = { text:"I hear you. That sounds like a lot to carry right now." };
    }
    setTestResult(response);
  };

  const resolveAlert = (id) => {
    setAlerts(prev => prev.map(a => a.id===id ? {...a, resolved:true} : a));
  };

  // ── Sidebar ──
  const Sidebar = () => (
    <div style={styles.sidebar}>
      <div style={styles.logo}>
        <div style={{width:32,height:32,borderRadius:8,background:"linear-gradient(135deg,#5DCAA5,#378ADD)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{color:"#fff",fontSize:14,fontWeight:600}}>M</span>
        </div>
        <span style={styles.logoText}>MindBridge</span>
      </div>
      <div style={styles.navSection}>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.08em",color:"#888780",marginBottom:12,textTransform:"uppercase"}}>Therapist</div>
        <NavItem label="Dashboard" active={view==="therapist"&&subView==="dashboard"} onClick={()=>navTo("therapist","dashboard")} icon="◉" />
        <NavItem label="Alerts" active={view==="therapist"&&subView==="alerts"} onClick={()=>{setView("therapist");setSubView("alerts");}} icon="⚠" badge={alerts.filter(a=>!a.resolved).length} />
        <NavItem label="Prompt builder" active={view==="therapist"&&subView==="builder"} onClick={()=>openBuilder(null)} icon="✦" />
      </div>
      <div style={styles.navSection}>
        <div style={{fontSize:10,fontWeight:600,letterSpacing:"0.08em",color:"#888780",marginBottom:12,textTransform:"uppercase"}}>Patient view</div>
        <NavItem label="Chat" active={view==="patient"} onClick={()=>navTo("patient","chat")} icon="◦" />
      </div>
    </div>
  );

  const NavItem = ({label,active,onClick,icon,badge}) => (
    <div onClick={onClick} style={{...styles.navItem, background:active?"rgba(93,202,165,0.1)":"transparent", color:active?"#1D9E75":"#5F5E5A"}}>
      <span style={{fontSize:14,width:20,textAlign:"center"}}>{icon}</span>
      <span style={{flex:1}}>{label}</span>
      {badge > 0 && <span style={{fontSize:10,background:"#E24B4A",color:"#fff",borderRadius:10,padding:"1px 6px",fontWeight:600}}>{badge}</span>}
    </div>
  );

  // ── Therapist Dashboard ──
  const Dashboard = () => (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.h1}>Dashboard</h1>
        <p style={styles.subtitle}>Overview of your patients and recent activity</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:32}}>
        <MetricCard label="Active patients" value="12" />
        <MetricCard label="Unread sessions" value="7" />
        <MetricCard label="Active alerts" value={alerts.filter(a=>!a.resolved).length.toString()} accent />
        <MetricCard label="Sub-agents live" value="9" />
      </div>
      <div style={{fontSize:12,fontWeight:600,letterSpacing:"0.05em",color:"#888780",textTransform:"uppercase",marginBottom:12}}>Patients — sorted by priority</div>
      {PATIENTS.map(p => (
        <div key={p.id} onClick={()=>openPatient(p)} style={styles.patientRow}>
          <div style={{...styles.avatar, background:statusBg(p.status), color:statusColor(p.status)}}>{p.initials}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
              <span style={{fontWeight:500,fontSize:14,color:"#2C2C2A"}}>{p.name}</span>
              <span style={{...styles.badge, background:statusBg(p.status), color:statusColor(p.status)}}>{p.statusLabel}</span>
            </div>
            <div style={{fontSize:12,color:"#888780",marginTop:2}}>Last message {p.lastMsg} · {p.msgCount} messages · Sub-agent: {p.agent}</div>
          </div>
          <div style={{color:"#B4B2A9",fontSize:18,marginLeft:8}}>›</div>
        </div>
      ))}
    </div>
  );

  const MetricCard = ({label,value,accent}) => (
    <div style={styles.metricCard}>
      <div style={{fontSize:11,color:"#888780",marginBottom:4}}>{label}</div>
      <div style={{fontSize:24,fontWeight:500,color:accent?"#E24B4A":"#2C2C2A"}}>{value}</div>
    </div>
  );

  // ── Patient Detail ──
  const PatientDetail = () => {
    const p = selectedPatient;
    if (!p) return null;
    return (
      <div>
        <div onClick={()=>setSubView("dashboard")} style={styles.backLink}>← Back to patients</div>
        <div style={styles.detailHeader}>
          <div style={{...styles.avatarLg, background:statusBg(p.status), color:statusColor(p.status)}}>{p.initials}</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:18,fontWeight:500,color:"#2C2C2A"}}>{p.name}</span>
              <span style={{...styles.badge, background:statusBg(p.status), color:statusColor(p.status)}}>{p.statusLabel}</span>
            </div>
            <div style={{fontSize:13,color:"#888780",marginTop:2}}>Sub-agent: {p.agent} · {p.msgCount} messages since last session</div>
          </div>
          <button onClick={()=>openBuilder(p)} style={styles.btnPrimary}>Edit sub-agent</button>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:20}}>
          {["summary","config","transcript"].map(t => (
            <button key={t} onClick={()=>setDetailTab(t)} style={{...styles.tab, ...(detailTab===t?styles.tabActive:{})}}>
              {t==="summary"?"AI summary":t==="config"?"Sub-agent config":"Transcript"}
            </button>
          ))}
        </div>
        <div style={styles.card}>
          {detailTab==="summary" && <SummaryTab p={p} />}
          {detailTab==="config" && <ConfigTab p={p} />}
          {detailTab==="transcript" && <TranscriptTab p={p} />}
        </div>
      </div>
    );
  };

  const SummaryTab = ({p}) => (
    <div>
      {p.flag && <div style={{...styles.alertInline,marginBottom:16}}>
        <span style={{fontSize:12,fontWeight:500}}>Flagged:</span> {p.flag}
      </div>}
      <p style={{fontSize:14,lineHeight:1.7,color:"#2C2C2A",margin:0}}>{p.summary}</p>
      {p.recommendation && <div style={{marginTop:16,padding:"10px 14px",background:"#E6F1FB",borderRadius:8,fontSize:13,color:"#0C447C"}}>{p.recommendation}</div>}
    </div>
  );

  const ConfigTab = ({p}) => (
    <div>
      <div style={styles.configRow}><span style={styles.configLabel}>Agent template</span><span style={{fontWeight:500}}>{p.agent}</span></div>
      <div style={styles.configRow}><span style={styles.configLabel}>Tone</span><span>Warmth: {p.tone.warmth}/10 · Directness: {p.tone.directness}/10 · Verbosity: {p.tone.verbosity}/10</span></div>
      <div style={styles.configRow}><span style={styles.configLabel}>Response styles</span><span>{p.styles.join(", ")}</span></div>
      <div style={styles.configRow}><span style={styles.configLabel}>Boundaries</span>
        <div>{p.boundaries.map((b,i) => <div key={i} style={{marginBottom:4}}>· {b}</div>)}</div>
      </div>
      <button onClick={()=>openBuilder(p)} style={{...styles.btnPrimary,marginTop:16}}>Edit in prompt builder</button>
    </div>
  );

  const TranscriptTab = ({p}) => (
    <div>
      {p.messages.map((m,i) => (
        <div key={i} style={{...styles.msgRow, ...(m.flagged?{background:"#FCEBEB",borderRadius:8,padding:"8px 12px",margin:"4px -12px"}:{})}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:12,color:m.from==="agent"?"#185FA5":"#888780"}}>{m.from==="agent"?"AI Agent":"Patient"}, {m.time}</span>
            {m.flagged && <span style={{fontSize:10,color:"#E24B4A",border:"1px solid #F09595",borderRadius:4,padding:"0 5px"}}>Flagged</span>}
          </div>
          <div style={{fontSize:13,color:"#2C2C2A",lineHeight:1.6,marginTop:2}}>{m.text}</div>
        </div>
      ))}
    </div>
  );

  // ── Alert Center ──
  const AlertCenter = () => (
    <div>
      <div style={styles.pageHeader}>
        <h1 style={styles.h1}>Alert center</h1>
        <p style={styles.subtitle}>Review and triage flagged patient interactions</p>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:20}}>
        <span style={{...styles.filterPill,background:"#FCEBEB",color:"#E24B4A"}}>Critical ({alerts.filter(a=>a.severity==="critical"&&!a.resolved).length})</span>
        <span style={{...styles.filterPill,background:"#FAEEDA",color:"#D98A0B"}}>Moderate ({alerts.filter(a=>a.severity==="moderate"&&!a.resolved).length})</span>
        <span style={{...styles.filterPill,background:"#F1EFE8",color:"#888780"}}>Resolved ({alerts.filter(a=>a.resolved).length})</span>
      </div>
      {alerts.map(a => (
        <div key={a.id} style={{...styles.alertRow, opacity:a.resolved?0.5:1, borderLeftColor:sevColor(a.severity)}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <span style={{...styles.badge,background:sevBg(a.severity),color:sevColor(a.severity)}}>{a.severity}</span>
                <span style={{fontWeight:500,fontSize:14,color:"#2C2C2A"}}>{a.patient}</span>
                <span style={{fontSize:12,color:"#888780"}}>{a.time}</span>
              </div>
              <div style={{fontSize:13,color:"#2C2C2A",marginBottom:4}}>{a.text}</div>
              <div style={{fontSize:12,color:"#888780"}}>{a.context}</div>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              {!a.resolved && <>
                <button onClick={()=>{const p=PATIENTS.find(x=>x.id===a.patientId);if(p)openPatient(p);}} style={styles.btnSmall}>View transcript</button>
                <button onClick={()=>resolveAlert(a.id)} style={{...styles.btnSmall,background:"#E1F5EE",color:"#1D9E75",borderColor:"#5DCAA5"}}>Resolve</button>
              </>}
              {a.resolved && <span style={{fontSize:12,color:"#1D9E75",fontWeight:500}}>Resolved</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ── Prompt Builder ──
  const PromptBuilder = () => (
    <div>
      <div style={styles.pageHeader}>
        <div onClick={()=>{ if(selectedPatient){setSubView("detail");}else{setSubView("dashboard");} }} style={styles.backLink}>← Back</div>
        <h1 style={styles.h1}>Prompt builder{builderPatient ? ` — ${builderPatient.name}` : ""}</h1>
        <p style={styles.subtitle}>Configure a sub-agent in 5 steps</p>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:28}}>
        {["Template","Tone","Style","Boundaries","Review"].map((l,i) => (
          <div key={l} style={{flex:1,textAlign:"center"}}>
            <div style={{height:3,borderRadius:2,background:i+1<=builderStep?"#1D9E75":"#D3D1C7",marginBottom:6,transition:"background 0.2s"}} />
            <span style={{fontSize:11,color:i+1===builderStep?"#2C2C2A":"#888780",fontWeight:i+1===builderStep?500:400}}>{l}</span>
          </div>
        ))}
      </div>

      {builderStep===1 && <div>
        <h2 style={styles.stepTitle}>Choose a base template</h2>
        <p style={styles.stepDesc}>Start with a personality profile, then customize.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {TEMPLATES.map(t => (
            <div key={t.id} onClick={()=>selectTemplate(t.id)} style={{...styles.templateCard, border:builderState.template===t.id?"2px solid #378ADD":"1px solid #D3D1C7"}}>
              <div style={{fontWeight:500,fontSize:14,color:"#2C2C2A"}}>{t.label}</div>
              <div style={{fontSize:12,color:"#888780",marginTop:2}}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>}

      {builderStep===2 && <div>
        <h2 style={styles.stepTitle}>Adjust tone</h2>
        <p style={styles.stepDesc}>Fine-tune how the agent sounds.</p>
        {[["Warmth","warmth","Clinical","Compassionate"],["Directness","directness","Indirect","Direct"],["Verbosity","verbosity","Brief","Detailed"]].map(([label,key,low,high]) => (
          <div key={key} style={{marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:500,color:"#2C2C2A",marginBottom:8}}>{label}</div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:12,color:"#888780",minWidth:70}}>{low}</span>
              <input type="range" min="1" max="10" step="1" value={builderState.tone[key]} onChange={e=>setBuilderState(prev=>({...prev,tone:{...prev.tone,[key]:parseInt(e.target.value)}}))} style={{flex:1,accentColor:"#1D9E75"}} />
              <span style={{fontSize:12,color:"#888780",minWidth:80,textAlign:"right"}}>{high}</span>
              <span style={{fontSize:14,fontWeight:500,color:"#2C2C2A",minWidth:24,textAlign:"center"}}>{builderState.tone[key]}</span>
            </div>
          </div>
        ))}
      </div>}

      {builderStep===3 && <div>
        <h2 style={styles.stepTitle}>Response style</h2>
        <p style={styles.stepDesc}>Select techniques the agent should use.</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {ALL_STYLES.map(s => (
            <span key={s} onClick={()=>toggleStyle(s)} style={{...styles.chip, background:builderState.styles.includes(s)?"#E6F1FB":"#fff", border:builderState.styles.includes(s)?"1px solid #85B7EB":"1px solid #D3D1C7", color:builderState.styles.includes(s)?"#185FA5":"#2C2C2A"}}>{s}</span>
          ))}
        </div>
      </div>}

      {builderStep===4 && <div>
        <h2 style={styles.stepTitle}>Boundaries and safety rules</h2>
        <p style={styles.stepDesc}>Select rules the agent must always follow.</p>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
          {ALL_BOUNDARIES.map(b => (
            <label key={b} onClick={()=>toggleBoundary(b)} style={styles.checkRow}>
              <span style={{...styles.checkbox, background:builderState.boundaries.includes(b)?"#E6F1FB":"#fff", borderColor:builderState.boundaries.includes(b)?"#85B7EB":"#B4B2A9"}}>
                {builderState.boundaries.includes(b) && "✓"}
              </span>
              <span style={{fontSize:13,color:"#2C2C2A"}}>{b}</span>
            </label>
          ))}
          {builderState.boundaries.filter(b => !ALL_BOUNDARIES.includes(b)).map(b => (
            <label key={b} style={styles.checkRow}>
              <span style={{...styles.checkbox, background:"#E6F1FB", borderColor:"#85B7EB"}}>✓</span>
              <span style={{fontSize:13,color:"#2C2C2A"}}>{b}</span>
              <span onClick={()=>toggleBoundary(b)} style={{fontSize:11,color:"#E24B4A",cursor:"pointer",marginLeft:4}}>remove</span>
            </label>
          ))}
        </div>
        <div style={{fontSize:12,color:"#888780",marginBottom:6}}>Add a custom rule:</div>
        <div style={{display:"flex",gap:8}}>
          <input value={builderState.customBoundary} onChange={e=>setBuilderState(prev=>({...prev,customBoundary:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addCustomBoundary()} placeholder="e.g. Always validate before challenging" style={styles.input} />
          <button onClick={addCustomBoundary} style={styles.btnSmall}>Add</button>
        </div>
      </div>}

      {builderStep===5 && <div>
        <h2 style={styles.stepTitle}>Review and preview</h2>
        <p style={styles.stepDesc}>Test your configuration with a sample message.</p>
        <div style={{...styles.card,marginBottom:20}}>
          <div style={styles.configRow}><span style={styles.configLabel}>Template</span><span style={{fontWeight:500}}>{TEMPLATES.find(t=>t.id===builderState.template)?.label || "Custom"}</span></div>
          <div style={styles.configRow}><span style={styles.configLabel}>Tone</span><span>Warmth: {builderState.tone.warmth}/10 · Directness: {builderState.tone.directness}/10 · Verbosity: {builderState.tone.verbosity}/10</span></div>
          <div style={styles.configRow}><span style={styles.configLabel}>Styles</span><span>{builderState.styles.join(", ") || "None"}</span></div>
          <div style={styles.configRow}><span style={styles.configLabel}>Boundaries</span>
            <div>{builderState.boundaries.length ? builderState.boundaries.map((b,i)=><div key={i} style={{marginBottom:2}}>· {b}</div>) : "None"}</div>
          </div>
        </div>
        <div style={{fontSize:13,fontWeight:500,color:"#2C2C2A",marginBottom:8}}>Test with a sample message</div>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <input value={testInput} onChange={e=>setTestInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&runPreview()} placeholder="Type a patient message..." style={styles.input} />
          <button onClick={runPreview} style={styles.btnPrimary}>Preview</button>
        </div>
        {testResult && <div style={styles.card}>
          <div style={{...styles.msgRow,borderBottom:"1px solid #F1EFE8",paddingBottom:8,marginBottom:8}}>
            <span style={{fontSize:12,color:"#888780"}}>Patient</span>
            <div style={{fontSize:13,color:"#2C2C2A",marginTop:2}}>{testInput}</div>
          </div>
          <div style={styles.msgRow}>
            <span style={{fontSize:12,color:"#185FA5"}}>AI Agent ({TEMPLATES.find(t=>t.id===builderState.template)?.label || "Custom"})</span>
            <div style={{fontSize:13,color:"#2C2C2A",marginTop:2}}>{testResult.text}</div>
          </div>
        </div>}
      </div>}

      <div style={{display:"flex",justifyContent:builderStep>1?"space-between":"flex-end",marginTop:28}}>
        {builderStep>1 && <button onClick={()=>setBuilderStep(s=>s-1)} style={styles.btnOutline}>← Back</button>}
        {builderStep<5 && <button onClick={()=>setBuilderStep(s=>s+1)} disabled={builderStep===1&&!builderState.template} style={{...styles.btnPrimary, opacity:builderStep===1&&!builderState.template?0.4:1}}>Next →</button>}
        {builderStep===5 && <button onClick={()=>{ if(selectedPatient){setSubView("detail");}else{setSubView("dashboard");} }} style={{...styles.btnPrimary,background:"#1D9E75",borderColor:"#1D9E75",color:"#fff"}}>Deploy sub-agent</button>}
      </div>
    </div>
  );

  // ── Patient Chat ──
  const PatientChat = () => (
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      <div style={{padding:"16px 0",borderBottom:"1px solid #F1EFE8",marginBottom:16}}>
        <div style={{fontSize:16,fontWeight:500,color:"#2C2C2A"}}>Your safe space</div>
        <div style={{fontSize:12,color:"#888780",marginTop:2}}>Everything here is between you and your care team</div>
      </div>
      <div style={{flex:1,overflowY:"auto",marginBottom:16,paddingRight:8}}>
        {chatMessages.map((m,i) => (
          <div key={i} style={{marginBottom:12}}>
            {m.alert && <div style={{...styles.alertInline,marginBottom:8,fontSize:11}}>Your therapist has been notified and may reach out to you</div>}
            <div style={{display:"flex",justifyContent:m.from==="patient"?"flex-end":"flex-start"}}>
              <div style={{maxWidth:"80%",padding:"10px 14px",borderRadius:16, background:m.from==="patient"?"#E6F1FB":"#F1EFE8", color:"#2C2C2A",fontSize:14,lineHeight:1.6, borderBottomRightRadius:m.from==="patient"?4:16, borderBottomLeftRadius:m.from==="agent"?4:16}}>
                {m.text}
              </div>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <div style={{display:"flex",gap:8,paddingTop:12,borderTop:"1px solid #F1EFE8"}}>
        <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder="Type what's on your mind..." style={{...styles.input,flex:1,borderRadius:20,padding:"10px 16px"}} />
        <button onClick={sendChat} style={{...styles.btnPrimary,borderRadius:20,padding:"10px 20px"}}>Send</button>
      </div>
    </div>
  );

  // ── Main Layout ──
  return (
    <div style={styles.layout}>
      <Sidebar />
      <div style={styles.main}>
        {view==="therapist" && subView==="dashboard" && <Dashboard />}
        {view==="therapist" && subView==="detail" && <PatientDetail />}
        {view==="therapist" && subView==="alerts" && <AlertCenter />}
        {view==="therapist" && subView==="builder" && <PromptBuilder />}
        {view==="patient" && <PatientChat />}
      </div>
    </div>
  );
}

const styles = {
  layout: { display:"flex", height:"100vh", fontFamily:"'DM Sans',system-ui,sans-serif", background:"#FAFAF7", color:"#2C2C2A" },
  sidebar: { width:220, background:"#fff", borderRight:"1px solid #EEEDEC", padding:"20px 14px", display:"flex", flexDirection:"column", flexShrink:0 },
  logo: { display:"flex", alignItems:"center", gap:10, marginBottom:32, paddingLeft:4 },
  logoText: { fontSize:16, fontWeight:600, color:"#2C2C2A", letterSpacing:"-0.02em" },
  navSection: { marginBottom:24 },
  navItem: { display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:400, transition:"all 0.15s", marginBottom:2 },
  main: { flex:1, padding:"28px 40px", overflowY:"auto", maxWidth:820 },
  pageHeader: { marginBottom:28 },
  h1: { fontSize:22, fontWeight:500, color:"#2C2C2A", margin:0, letterSpacing:"-0.01em" },
  subtitle: { fontSize:13, color:"#888780", margin:"4px 0 0" },
  metricCard: { background:"#fff", border:"1px solid #EEEDEC", borderRadius:10, padding:"14px 16px" },
  patientRow: { display:"flex", alignItems:"center", gap:12, padding:"12px 16px", marginBottom:6, background:"#fff", border:"1px solid #EEEDEC", borderRadius:10, cursor:"pointer", transition:"all 0.15s" },
  avatar: { width:38, height:38, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:500, fontSize:13, flexShrink:0 },
  avatarLg: { width:48, height:48, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:500, fontSize:15, flexShrink:0 },
  badge: { fontSize:11, padding:"2px 8px", borderRadius:6, fontWeight:500, whiteSpace:"nowrap" },
  card: { background:"#fff", border:"1px solid #EEEDEC", borderRadius:10, padding:"16px 20px" },
  detailHeader: { display:"flex", alignItems:"center", gap:14, padding:"16px 20px", background:"#fff", border:"1px solid #EEEDEC", borderRadius:10, marginBottom:16 },
  tab: { flex:1, padding:"8px 12px", fontSize:13, cursor:"pointer", borderRadius:8, border:"1px solid #EEEDEC", background:"#FAFAF7", color:"#888780", fontWeight:400, textAlign:"center" },
  tabActive: { background:"#fff", borderColor:"#B4B2A9", color:"#2C2C2A", fontWeight:500 },
  backLink: { fontSize:13, color:"#378ADD", cursor:"pointer", marginBottom:12, display:"inline-block" },
  configRow: { marginBottom:14, fontSize:13, color:"#2C2C2A", lineHeight:1.6 },
  configLabel: { display:"block", fontSize:11, color:"#888780", marginBottom:2, textTransform:"uppercase", letterSpacing:"0.04em" },
  msgRow: { padding:"8px 0", borderBottom:"0.5px solid #F1EFE8" },
  alertInline: { background:"#FCEBEB", borderRadius:8, padding:"8px 12px", fontSize:12, color:"#A32D2D" },
  alertRow: { background:"#fff", border:"1px solid #EEEDEC", borderLeft:"3px solid", borderRadius:10, padding:"14px 18px", marginBottom:8 },
  filterPill: { fontSize:12, padding:"4px 12px", borderRadius:6, fontWeight:500 },
  stepTitle: { fontSize:16, fontWeight:500, color:"#2C2C2A", margin:"0 0 4px" },
  stepDesc: { fontSize:13, color:"#888780", margin:"0 0 20px" },
  templateCard: { background:"#fff", borderRadius:10, padding:"14px 16px", cursor:"pointer", transition:"border 0.15s" },
  chip: { fontSize:13, padding:"6px 14px", borderRadius:8, cursor:"pointer", transition:"all 0.15s" },
  checkRow: { display:"flex", alignItems:"flex-start", gap:8, cursor:"pointer" },
  checkbox: { width:18, height:18, borderRadius:4, border:"1px solid", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#185FA5", flexShrink:0, marginTop:1 },
  input: { fontSize:13, padding:"8px 12px", border:"1px solid #D3D1C7", borderRadius:8, background:"#fff", color:"#2C2C2A", outline:"none", flex:1 },
  btnPrimary: { fontSize:13, fontWeight:500, padding:"8px 18px", borderRadius:8, border:"1px solid #85B7EB", background:"#E6F1FB", color:"#185FA5", cursor:"pointer" },
  btnOutline: { fontSize:13, padding:"8px 18px", borderRadius:8, border:"1px solid #D3D1C7", background:"#fff", color:"#2C2C2A", cursor:"pointer" },
  btnSmall: { fontSize:12, padding:"4px 12px", borderRadius:6, border:"1px solid #D3D1C7", background:"#fff", color:"#2C2C2A", cursor:"pointer", whiteSpace:"nowrap" }
};
