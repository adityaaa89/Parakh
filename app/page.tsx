'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Activity, AlertTriangle, ArrowRight, BadgeCheck, Bell, Building2, Check, ChevronDown, Clock3, Download, FileSearch, Fingerprint, Globe2, Landmark, LockKeyhole, MapPin, Network, Search, ShieldCheck, Sparkles, UserCheck, Users, X, Zap } from 'lucide-react'

type Role = 'investigator' | 'bank' | 'field'
type Status = 'new' | 'review' | 'high' | 'frozen' | 'dispatched' | 'en-route' | 'arrived' | 'action-taken'
export type CaseItem = { id: string; title: string; city: string; state: string; amount: number; risk: number; status: Status; updated: string; account: string; bank: string; location: string; fraud: string; lat: number; lng: number }
type AlertItem = { id: string; caseId: string; account: string; amount: number; risk: number; status: 'pending' | 'acknowledged' | 'frozen'; bank: string; officer?: string }

export const seedCases: CaseItem[] = [
    { id: 'CYB-26-0417', title: 'ATM cash-out mule ring', fraud: 'UPI Fraud', city: 'Noida', state: 'UP', amount: 1840000, risk: 96, status: 'high', updated: '2m ago', account: 'XXXX-XXXX-8124', bank: 'Axis Bank', location: 'Sector 18 ATM cluster', lat: 28.5355, lng: 77.3910 },
    { id: 'CYB-26-0416', title: 'Layered UPI withdrawal', fraud: 'UPI Fraud', city: 'Bengaluru', state: 'KA', amount: 672500, risk: 88, status: 'review', updated: '8m ago', account: 'XXXX-XXXX-2941', bank: 'HDFC Bank', location: 'Koramangala, Bengaluru', lat: 12.9716, lng: 77.5946 },
    { id: 'CYB-26-0414', title: 'Synthetic identity cash-out', fraud: 'Loan App Fraud', city: 'Gurugram', state: 'HR', amount: 928000, risk: 79, status: 'dispatched', updated: '17m ago', account: 'XXXX-XXXX-7110', bank: 'ICICI Bank', location: 'Golf Course Road', lat: 28.4595, lng: 77.0266 },
    { id: 'CYB-26-0412', title: 'Coordinated ATM skimming', fraud: 'Investment Scam', city: 'Mumbai', state: 'MH', amount: 241000, risk: 61, status: 'new', updated: '31m ago', account: 'XXXX-XXXX-0098', bank: 'SBI', location: 'Andheri East', lat: 19.0760, lng: 72.8777 },
    { id: 'CYB-26-0409', title: 'Recruitment scam proceeds', fraud: 'Job Fraud', city: 'Hyderabad', state: 'TS', amount: 386000, risk: 54, status: 'review', updated: '44m ago', account: 'XXXX-XXXX-4752', bank: 'Kotak Mahindra', location: 'Madhapur', lat: 17.3850, lng: 78.4867 },
    { id: 'CYB-26-0408', title: 'High-velocity crypto bridge', fraud: 'Investment Scam', city: 'Pune', state: 'MH', amount: 1450000, risk: 85, status: 'review', updated: '1h ago', account: 'XXXX-XXXX-1123', bank: 'Yes Bank', location: 'Viman Nagar', lat: 18.5679, lng: 73.9143 },
    { id: 'CYB-26-0407', title: 'Deepfake voice extortion', fraud: 'Extortion', city: 'Chennai', state: 'TN', amount: 450000, risk: 72, status: 'new', updated: '2h ago', account: 'XXXX-XXXX-8831', bank: 'SBI', location: 'T Nagar', lat: 13.0418, lng: 80.2341 },
    { id: 'CYB-26-0406', title: 'Corporate bulk phishing', fraud: 'Phishing', city: 'Ahmedabad', state: 'GJ', amount: 2800000, risk: 91, status: 'high', updated: '3h ago', account: 'XXXX-XXXX-9902', bank: 'HDFC Bank', location: 'SG Highway', lat: 23.0225, lng: 72.5714 },
]
const seedAlerts: AlertItem[] = [
    { id: 'ALT-0091', caseId: 'CYB-26-0417', account: 'XXXX-XXXX-8124', amount: 1840000, risk: 96, status: 'pending', bank: 'Axis Bank' },
    { id: 'ALT-0089', caseId: 'CYB-26-0416', account: 'XXXX-XXXX-2941', amount: 672500, risk: 88, status: 'acknowledged', bank: 'Axis Bank', officer: 'S. Kumar' },
    { id: 'ALT-0084', caseId: 'CYB-26-0414', account: 'XXXX-XXXX-7110', amount: 928000, risk: 79, status: 'frozen', bank: 'Axis Bank', officer: 'R. Mehta' }
]
const rings = [
    { id: 'RING-NCR-07', complaints: 12, places: 'Noida · Gurugram · Delhi', states: 2, amount: 4820000, risk: 97, first: '04 Sep 2026', accounts: ['XXXX-4471', 'XXXX-8124', 'XXXX-9206'] },
    { id: 'RING-SOUTH-03', complaints: 8, places: 'Bengaluru · Hyderabad · Chennai', states: 3, amount: 2190000, risk: 84, first: '29 Aug 2026', accounts: ['XXXX-2941', 'XXXX-1182'] },
    { id: 'RING-WEST-11', complaints: 5, places: 'Mumbai · Pune · Surat', states: 2, amount: 970000, risk: 68, first: '31 Aug 2026', accounts: ['XXXX-0098'] },
]
const riskData = [{ name: 'Velocity', value: 94 }, { name: 'Mule link', value: 91 }, { name: 'Geo drift', value: 86 }, { name: 'Device', value: 78 }, { name: 'History', value: 72 }, { name: 'Text match', value: 65 }]
const money = (n: number) => `₹${(n / 100000).toFixed(n >= 1000000 ? 1 : 2)}L`
const tone = (n: number) => n >= 90 ? 'critical' : n >= 70 ? 'high' : n >= 50 ? 'watch' : 'safe'
const label = (s: string) => s.replace('-', ' ').toUpperCase()

const OverviewMap = dynamic(() => import('@/components/ui/Maps').then(m => m.OverviewMap), { ssr: false })
const LocationPredictionPanel = dynamic(() => import('@/components/ui/Maps').then(m => m.LocationPredictionPanel), { ssr: false })
const FieldMap = dynamic(() => import('@/components/ui/Maps').then(m => m.FieldMap), { ssr: false })

export default function Page() {
    const [role, setRole] = useState<Role | null>(null); 
    const [_cases, _setCases] = useState(seedCases); 
    const [_alerts, _setAlerts] = useState(seedAlerts); 
    const [selectedId, setSelectedId] = useState('CYB-26-0417'); 
    const [query, setQuery] = useState(''); 
    const [view, setView] = useState('home'); 
    const [toast, setToast] = useState(''); 
    const [detail, setDetail] = useState<CaseItem | null>(null);

    const channelRef = useRef<BroadcastChannel | null>(null);
    useEffect(() => {
        const channel = new BroadcastChannel('cybercrime-sync');
        channelRef.current = channel;
        channel.onmessage = (e) => {
            if (e.data.type === 'SYNC_CASES') _setCases(e.data.payload);
            if (e.data.type === 'SYNC_ALERTS') _setAlerts(e.data.payload);
        };
        return () => channel.close();
    }, []);

    const cases = _cases;
    const setCases = (valOrFn: any) => {
        _setCases(prev => {
            const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
            channelRef.current?.postMessage({ type: 'SYNC_CASES', payload: next });
            return next;
        });
    };

    const alerts = _alerts;
    const setAlerts = (valOrFn: any) => {
        _setAlerts(prev => {
            const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
            channelRef.current?.postMessage({ type: 'SYNC_ALERTS', payload: next });
            return next;
        });
    };
    const selected = cases.find(c => c.id === selectedId) || cases[0]
    const notify = (m: string) => { setToast(m); window.setTimeout(() => setToast(''), 2600) }
    const updateCase = (status: Status, msg: string) => { setCases((cs: CaseItem[]) => cs.map((c: CaseItem) => c.id === selected.id ? { ...c, status, updated: 'just now' } : c)); notify(msg) }
    const updateCaseById = (id: string, status: Status, msg: string) => { setCases((cs: CaseItem[]) => cs.map((c: CaseItem) => c.id === id ? { ...c, status, updated: 'just now' } : c)); notify(msg) }
    const confirmRisk = () => { setAlerts((as: AlertItem[]) => as.some((a: AlertItem) => a.caseId === selected.id) ? as : [{ id: `ALT-00${92 + as.length}`, caseId: selected.id, account: selected.account, amount: selected.amount, risk: selected.risk, status: 'pending', bank: selected.bank }, ...as]); notify('High-risk alert sent to bank fraud desk') }
    if (!role) return <Landing onSelect={setRole} activeCases={cases.length} />
    if (role === 'bank') return <><Topbar role={role} setRole={setRole} /><BankShell alerts={alerts} onAcknowledge={id => { setAlerts((as: AlertItem[]) => as.map((a: AlertItem) => a.id === id ? { ...a, status: 'acknowledged', officer: 'R. Mehta' } : a)); notify('Alert acknowledged by Axis Bank') }} onFreeze={(id, officerName) => { const a = alerts.find(x => x.id === id); setAlerts((as: AlertItem[]) => as.map((x: AlertItem) => x.id === id ? { ...x, status: 'frozen', officer: officerName } : x)); if (a) setCases((cs: CaseItem[]) => cs.map((c: CaseItem) => c.id === a.caseId ? { ...c, status: 'frozen', updated: 'just now' } : c)); notify('Investigator notified — action logged') }} /></>
    if (role === 'field') return <><Topbar role={role} setRole={setRole} /><FieldShell cases={cases} updateCaseById={updateCaseById} /></>
    const filtered = cases.filter(c => `${c.id} ${c.title} ${c.city} ${c.account}`.toLowerCase().includes(query.toLowerCase()))
    return <div className="min-h-screen bg-background text-foreground pb-16 lg:pb-0"><Topbar role={role} setRole={r => { setRole(r); setView('home') }} /><div className="flex min-h-[calc(100vh-56px)]"><Rail active={view} onNavigate={setView} /><main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">{view === 'intake' ? <Intake onCreated={c => { setCases((cs: CaseItem[]) => [c, ...cs]); setSelectedId(c.id); setView('home'); notify('New case created and added to queue') }} /> : view === 'dashboard' ? <Coordination alerts={alerts} /> : view === 'rings' ? <Rings cases={cases} /> : <Home allCases={cases} cases={filtered} selected={selected} selectedId={selectedId} setSelectedId={id => { setSelectedId(id); setDetail(cases.find(c => c.id === id) || null) }} query={query} setQuery={setQuery} openDetail={c => setDetail(c)} openIntake={() => setView('intake')} alerts={alerts} confirmRisk={confirmRisk} updateCase={updateCase} />}</main></div><MobileNav active={view} onNavigate={setView} />{detail && <CaseModal selected={detail} close={() => setDetail(null)} alerts={alerts} confirmRisk={confirmRisk} updateCase={updateCase} />} {toast && <div role="status" className="fixed bottom-[80px] right-5 z-50 flex items-center gap-2 border border-teal/50 bg-panel px-4 py-3 text-sm text-teal shadow-2xl lg:bottom-5"><Check size={16} />{toast}</div>}</div>
}

function Landing({ onSelect, activeCases }: { onSelect: (r: Role) => void; activeCases: number }) { 
  const [showLogin, setShowLogin] = useState<Role | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      if (gridRef.current) {
        rafId = requestAnimationFrame(() => {
          if (!gridRef.current) return;
          const x = e.clientX;
          const y = e.clientY;
          gridRef.current.style.maskImage = `radial-gradient(250px circle at ${x}px ${y}px, black, transparent)`;
          gridRef.current.style.webkitMaskImage = `radial-gradient(250px circle at ${x}px ${y}px, black, transparent)`;
        });
      }
    };
    if (window.matchMedia('(pointer: fine)').matches) {
      window.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <main className="landing min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col">
      {/* Base static faint grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      <div className="absolute inset-0 pointer-events-none animate-scanline z-0"></div>
      
      {/* Interactive bright grid (mouse-tracked) */}
      <div 
        ref={gridRef}
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 hidden md:block z-0 ${hoveredCard ? 'opacity-100' : 'opacity-60'}`} 
        style={{ 
          backgroundImage: 'radial-gradient(circle, #14b8a6 1.5px, transparent 1.5px)', 
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(0px circle at 0px 0px, black, transparent)',
          WebkitMaskImage: 'radial-gradient(0px circle at 0px 0px, black, transparent)'
        }} 
      ></div>

      <div className="relative z-10 mx-auto flex w-full flex-1 max-w-6xl flex-col px-5 py-8 lg:px-8">
        <header className="flex items-center justify-between border-b border-steel pb-6">
          <div className="flex items-center gap-4">
            <div className="grid size-10 place-items-center border border-blue/50 bg-blue/10 text-blue"><ShieldCheck size={22} /></div>
            <button onClick={() => window.location.reload()} className="text-left group">
              <div><div className="text-2xl font-black tracking-[0.3em] text-foreground border-b-[3px] border-blue pb-0.5 inline-block group-hover:text-blue transition-colors">PARAKH</div><div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">National cybercrime intelligence fabric</div></div>
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="live-dot" />
            <span className="font-mono uppercase">OPERATIONAL — {activeCases} ACTIVE CASES</span>
          </div>
        </header>
        
        <div className="flex-1 flex flex-col justify-center max-w-5xl py-12">
          {/* Heading Block & Live Ticker */}
          <div className="mb-10 flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div className="max-w-2xl">
              <div className="eyebrow text-blue mb-2">OPERATIONS GATEWAY</div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Predictive Intelligence for Cybercrime Cash-Out Interception</h1>
              <p className="mt-2 text-sm text-muted">Real-time fraud-ring detection, withdrawal prediction, and coordinated response across investigation, banking, and field units.</p>
            </div>
            {/* Live Ticker */}
            <div className="hidden md:flex flex-col gap-2 border-l border-steel pl-5 h-20 justify-center">
              <div className="eyebrow text-muted">LIVE INCIDENT FEED</div>
              <div className="font-mono text-[11px] text-critical animate-pulse">CYB-26-0417 · Noida · 2m ago</div>
              <div className="font-mono text-[11px] text-muted">CYB-26-0416 · Bengaluru · 8m ago</div>
              <div className="font-mono text-[11px] text-muted opacity-60">CYB-26-0414 · Gurugram · 17m ago</div>
            </div>
          </div>

          {/* Activity Strip */}
          <div className="flex flex-wrap items-center gap-4 mb-12 pb-10 border-b border-steel/50">
            <div className="flex flex-col px-4 py-3 rounded border border-blue/20 bg-blue/5">
              <span className="font-mono text-2xl text-blue flex items-center gap-2">{activeCases} <span className="text-[10px] text-blue/70">↗</span></span>
              <span className="text-[10px] uppercase tracking-wider text-muted mt-1">Active Cases</span>
            </div>
            <div className="flex flex-col px-4 py-3 rounded border border-critical/20 bg-critical/5">
              <span className="font-mono text-2xl text-critical flex items-center gap-2">14 <span className="text-[10px] text-critical/70">↗</span></span>
              <span className="text-[10px] uppercase tracking-wider text-muted mt-1">Critical Alerts</span>
            </div>
            <div className="flex flex-col px-4 py-3 rounded border border-amber/20 bg-amber/5">
              <span className="font-mono text-2xl text-amber flex items-center gap-2">3 <span className="text-[10px] text-amber/70">—</span></span>
              <span className="text-[10px] uppercase tracking-wider text-muted mt-1">Rings Detected</span>
            </div>
            <div className="flex flex-col px-4 py-3 rounded border border-teal/20 bg-teal/5">
              <span className="font-mono text-2xl text-teal flex items-center gap-2">08:42 <span className="text-[10px] text-teal/70">↘</span></span>
              <span className="text-[10px] uppercase tracking-wider text-muted mt-1">Avg Response</span>
            </div>
            <div className="flex flex-col px-4 py-3 rounded border border-steel bg-panel">
              <span className="font-mono text-2xl text-foreground flex items-center gap-2">18 <span className="text-[10px] text-muted">↗</span></span>
              <span className="text-[10px] uppercase tracking-wider text-muted mt-1">Resolved Today</span>
            </div>
          </div>

          <p className="text-sm text-foreground mb-4">Select your role to continue.</p>
          
          <div className="grid gap-4 md:grid-cols-3">
            {([{ r: 'investigator', code: 'INV-01', icon: Activity, title: 'Investigator', desc: 'Complaint intake, case queue, risk assessment, coordination' }, { r: 'bank', code: 'BNK-02', icon: Building2, title: 'Bank Fraud Desk', desc: 'Incoming alerts, account history, freeze actions' }, { r: 'field', code: 'LEA-03', icon: MapPin, title: 'Field Unit', desc: 'Dispatch route, response window, outcome confirmation' }] as const).map(({ r, code, icon: Icon, title, desc }) => {
              const isHero = r === 'investigator';
              return (
              <div 
                key={r} 
                onMouseEnter={() => setHoveredCard(r)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`flex flex-col border bg-panel/60 p-5 transition-all group relative overflow-hidden backdrop-blur-md ${isHero ? 'border-blue shadow-[0_0_15px_rgba(59,130,246,0.1)] scale-[1.02] z-10' : 'border-steel hover:border-blue/50 opacity-90 hover:opacity-100'}`}
              >
                {isHero && <div className="absolute top-0 right-0 bg-blue px-2 py-0.5 text-[8px] font-bold tracking-widest text-white uppercase">PRIMARY ROLE</div>}
                <div className="absolute inset-0 bg-blue/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4"><div className={`grid size-8 place-items-center border ${isHero ? 'border-blue/50 bg-blue/10 text-blue' : 'border-steel bg-background text-blue group-hover:text-teal'} transition-colors`}><Icon size={16} /></div><div><div className="font-semibold">{title}</div><div className="font-mono text-[10px] text-muted uppercase group-hover:text-foreground transition-colors">{code}</div></div></div>
                  <p className="text-xs leading-5 text-muted mb-6 flex-1">{desc}</p>
                  <button onClick={() => setShowLogin(r)} className={`mt-auto border py-2.5 text-[10px] font-semibold uppercase tracking-widest transition-all ${isHero ? 'w-full bg-blue border-blue text-white hover:bg-blue/80' : 'w-full bg-background/80 border-steel text-foreground hover:bg-steel/50'}`}>SIGN IN</button>
                </div>
              </div>
            )})}
          </div>
        </div>
        
        <footer className="mt-auto border-t border-steel pt-6 text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted/60">AUTHORIZED PERSONNEL ONLY — ALL ACCESS IS LOGGED AND AUDITED</div>
        </footer>
      </div>

      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm border border-steel bg-panel p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div><div className="font-semibold">Authentication Required</div><div className="font-mono text-[10px] text-muted uppercase mt-1">Terminal access: {showLogin}</div></div>
              <button onClick={() => setShowLogin(null)} className="text-muted hover:text-foreground"><X size={16} /></button>
            </div>
            <div className="mb-4 flex items-start gap-2 rounded border border-blue/30 bg-blue/10 px-3 py-2 text-xs text-blue">
              <Sparkles size={14} className="mt-0.5 shrink-0" />
              <span><strong>Prototype Mode:</strong> The system accepts any credentials to proceed.</span>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); onSelect(showLogin); }} className="space-y-4">
              <div><label className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">Badge / Officer ID</label><input required type="text" placeholder="e.g. ID-8492" className="w-full border border-steel bg-background px-3 py-2 text-sm font-mono focus:border-blue focus:outline-none" /></div>
              <div><label className="block text-[10px] uppercase tracking-wider text-muted mb-1.5">Passcode</label><input required type="password" placeholder="••••••••" className="w-full border border-steel bg-background px-3 py-2 text-sm focus:border-blue focus:outline-none" /></div>
              <button type="submit" className="w-full bg-blue py-2.5 text-xs font-semibold text-white mt-2">AUTHENTICATE</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
function Topbar({ role, setRole }: { role: Role; setRole: (r: Role | null) => void }) { return <header className="flex h-14 items-center justify-between border-b border-steel bg-panel px-4 lg:px-6"><div className="flex items-center gap-3"><div className="grid size-8 place-items-center border border-blue/40 bg-blue/10 text-blue"><ShieldCheck size={19} /></div><button onClick={() => setRole(null)} className="text-left group"><div><div className="text-xl font-black tracking-widest text-foreground group-hover:text-blue transition-colors">PARAKH</div><div className="hidden font-mono text-[10px] uppercase tracking-[.22em] text-muted sm:block">Predictive cybercrime intelligence</div></div></button></div><div className="hidden items-center gap-2 text-xs text-muted lg:flex"><span className="live-dot" /> LIVE FABRIC <span className="mx-2 text-steel">|</span><span className="font-mono">06 SEP 2026 · 14:32 IST</span></div><div className="flex flex-1 items-center justify-end gap-2 overflow-x-auto sm:flex-none"><div className="flex shrink-0 border border-steel bg-background p-0.5">{(['investigator', 'bank', 'field'] as Role[]).map(r => <button key={r} onClick={() => setRole(r)} className={`px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${role === r ? 'bg-blue text-white' : 'text-muted hover:text-foreground'}`}>{r === 'field' ? 'LEA field' : r}</button>)}</div><button aria-label="Notifications" className="hidden icon-button sm:block"><Bell size={17} /></button><div className="hidden size-7 rounded-full bg-blue/20 text-center text-xs leading-7 text-blue sm:block">AS</div></div></header> }
function Rail({ active, onNavigate }: { active: string; onNavigate: (v: string) => void }) { const items = [['home', Activity, 'Overview'], ['dashboard', Network, 'Coordination'], ['intake', FileSearch, 'Intake'], ['rings', Fingerprint, 'Rings']]; return <aside className="hidden w-56 shrink-0 border-r border-steel bg-panel/70 p-3 lg:block"><div className="mb-5 px-2 text-[10px] font-semibold uppercase tracking-[.2em] text-muted">Investigator workspace</div>{items.map(([key, Icon, label]) => <button key={key as string} onClick={() => onNavigate(key as string)} className={`rail-link ${active === key ? 'active' : ''}`}><Icon size={16} />{label as string}</button>)}<div className="mt-8 border-t border-steel pt-4"><div className="px-2 text-[10px] uppercase tracking-[.18em] text-muted">System health</div><div className="mt-3 space-y-2 px-2 text-xs"><div className="flex justify-between"><span className="text-muted">Event stream</span><span className="text-teal">99.98%</span></div><div className="flex justify-between"><span className="text-muted">Bank fabric</span><span className="text-teal">ONLINE</span></div><div className="flex justify-between"><span className="text-muted">LEA mesh</span><span className="text-amber">DEGRADED</span></div><div className="flex justify-between"><span className="text-muted">Predict. Acc.</span><span className="text-teal">91.4%</span></div><div className="flex justify-between"><span className="text-muted">Model Sync</span><span className="text-blue">STANDBY</span></div></div></div></aside> }
function MobileNav({ active, onNavigate }: { active: string; onNavigate: (v: string) => void }) { const items = [['home', Activity, 'Overview'], ['dashboard', Network, 'Coordination'], ['intake', FileSearch, 'Intake'], ['rings', Fingerprint, 'Rings']]; return <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-steel bg-panel/95 p-2 pb-safe backdrop-blur lg:hidden">{items.map(([key, Icon, label]) => <button key={key as string} onClick={() => onNavigate(key as string)} className={`flex flex-col items-center gap-1 rounded p-2 text-[10px] ${active === key ? 'text-blue' : 'text-muted hover:text-foreground'}`}><Icon size={18} /><span>{label as string}</span></button>)}</nav> }
function Home({ allCases, cases, selected, selectedId, setSelectedId, query, setQuery, openDetail, openIntake, alerts, confirmRisk, updateCase }: { allCases: CaseItem[]; cases: CaseItem[]; selected: CaseItem; selectedId: string; setSelectedId: (id: string) => void; query: string; setQuery: (v: string) => void; openDetail: (c: CaseItem) => void; openIntake: () => void; alerts: AlertItem[]; confirmRisk: () => void; updateCase: (s: Status, m: string) => void }) { return <div className="p-4 lg:p-6"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><div className="eyebrow">Mission control / investigator</div><h1 className="mt-1 text-xl font-semibold">National cash-out intelligence</h1></div><div className="flex gap-2"><button className="secondary-button"><Download size={14} /> Export brief</button><button className="primary-button" onClick={openIntake}><Zap size={14} /> New intake</button></div></div><div className="grid grid-cols-2 gap-px border border-steel bg-steel md:grid-cols-5">{[['ACTIVE CASES', cases.length, 'blue'], ['CRITICAL / HIGH', cases.filter(c => c.risk >= 90).length, 'critical'], ['AMOUNT AT RISK', money(cases.reduce((a, c) => a + c.amount, 0)), 'amber'], ['ACTIVE RINGS', '3', 'teal'], ['RESOLVED TODAY', '18', 'blue']].map(([l, v, t]) => <div key={l as string} className="bg-panel px-4 py-3"><div className="eyebrow">{l as string}</div><div className={`mt-2 font-mono text-xl text-${t}`}>{v as string}</div></div>)}</div><div className="mt-4 grid gap-4 xl:grid-cols-[1.15fr_.85fr]"><Heatmap cases={allCases} onSelectCase={(id: string) => { setSelectedId(id); openDetail(allCases.find(c => c.id === id) || selected) }} /><Queue cases={cases} selectedId={selectedId} setSelectedId={(id: string) => { setSelectedId(id); openDetail(cases.find(c => c.id === id) || selected) }} query={query} setQuery={setQuery} /></div><CasePreview selected={selected} alerts={alerts} confirmRisk={confirmRisk} updateCase={updateCase} onOpen={() => openDetail(selected)} /></div> }
function Heatmap({ cases, onSelectCase }: { cases: CaseItem[], onSelectCase: (id: string) => void }) { return <section className="panel min-h-[450px] flex flex-col"><div className="panel-heading"><div><div className="eyebrow">Spatial risk fabric</div><h2 className="mt-1 font-semibold">Active cash-out clusters</h2></div><Globe2 size={16} className="text-muted" /></div><div className="relative flex-1 m-3 overflow-hidden border border-steel"><OverviewMap cases={cases} onSelectCase={onSelectCase} /></div><div className="flex justify-between border-t border-steel px-3 pt-3 pb-3 text-[11px] text-muted"><span><span className="font-mono text-foreground">5</span> linked locations</span><span>Last refresh 14:31:48 IST</span></div></section> }
function Queue({ cases, selectedId, setSelectedId, query, setQuery }: { cases: CaseItem[]; selectedId: string; setSelectedId: (id: string) => void; query: string; setQuery: (v: string) => void }) { return <section className="panel"><div className="panel-heading"><div><div className="eyebrow">Live queue</div><h2 className="mt-1 font-semibold">Priority cases</h2></div><span className="status-chip teal"><span className="live-dot" /> auto-refresh</span></div><div className="border-b border-steel p-3"><div className="relative"><Search className="absolute left-3 top-2.5 text-muted" size={15} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search case, location, account" className="console-input pl-9" /></div></div><div className="overflow-auto"><table className="data-table"><thead><tr><th>Case</th><th>Risk</th><th>Amount</th><th>Status</th></tr></thead><tbody>{cases.map(c => <tr key={c.id} onClick={() => setSelectedId(c.id)} className={selectedId === c.id ? 'selected-row' : ''}><td><div className="font-mono text-xs text-blue">{c.id}</div><div className="mt-1 max-w-[175px] truncate text-xs">{c.title}</div><div className="mt-1 text-[10px] text-muted">{c.city}, {c.state} · {c.updated}</div></td><td><span className={`risk-number ${tone(c.risk)}`}>{c.risk}</span></td><td className="font-mono text-xs">{money(c.amount)}</td><td><span className={`status-chip ${tone(c.risk)}`}>{label(c.status)}</span></td></tr>)}</tbody></table></div></section> }
function CasePreview({ selected, onOpen, alerts, confirmRisk, updateCase }: { selected: CaseItem; onOpen: () => void; alerts: AlertItem[]; confirmRisk: () => void; updateCase: (s: Status, m: string) => void }) {
  return (
    <section className="mt-4 border border-steel bg-panel">
      <div className="panel-heading">
        <div>
          <div className="eyebrow flex items-center gap-2">Selected case / {selected.id} <span className="flex items-center gap-1 text-[9px] text-teal border border-teal/30 bg-teal/10 px-1 rounded"><BadgeCheck size={10}/> SHA-256: 0x7b9c...e41a8</span></div>
          <h2 className="mt-1 text-lg font-semibold">{selected.title}</h2>
          <div className="mt-1 text-xs text-muted">{selected.bank} · {selected.location} · {selected.updated}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`status-chip ${tone(selected.risk)}`}><AlertTriangle size={13} /> {selected.risk} / HIGH RISK</span>
          <div className="text-[9px] text-muted font-mono uppercase tracking-widest mt-1">SHAP Factors</div>
          <div className="text-[10px] text-critical font-medium">+15 Ring Match · +12 Velocity</div>
        </div>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-3">
        <Evidence label="Exposure" value={money(selected.amount)} detail="5 linked withdrawals" />
        <Evidence label="Account" value={selected.account} detail="Mule probability 0.91" />
        <Evidence label="Ring match" value="RING-NCR-07" detail="3 exact identifiers" />
      </div>
      <div className="flex flex-wrap gap-2 border-t border-steel p-4">
        <button className="primary-button" onClick={onOpen}>Open full case detail <ArrowRight size={14} /></button>
        {!alerts.some(a => a.caseId === selected.id) && <button className="secondary-button" onClick={confirmRisk}>Send bank alert</button>}
        <button className="secondary-button" onClick={() => updateCase('dispatched', 'Recommended LEA dispatch accepted')}>Accept dispatch</button>
      </div>
    </section>
  )
}
function Evidence({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="subpanel"><Landmark size={15} className="text-blue" /><div className="eyebrow mt-3">{label}</div><div className="mt-1 font-mono text-lg">{value}</div><div className="mt-1 text-[11px] text-muted">{detail}</div></div> }
function TransactionGraph({selected}:{selected:CaseItem}){
  const [activeNode, setActiveNode] = useState<string|null>(null);

  // Layer 2 consists of 6 accounts.
  const l2Accounts = [
    { id: 'm2', name: 'M2', account: 'XXXX-1122', bank: 'SBI', location: 'Delhi', amount: 3.2, role: 'Layer 2' },
    { id: 'm3', name: 'M3', account: 'XXXX-3344', bank: 'HDFC', location: 'Noida', amount: 4.1, role: 'Layer 2' },
    { id: 'm4', name: 'M4', account: 'XXXX-5566', bank: 'ICICI', location: 'Gurugram', amount: 2.8, role: 'Layer 2' },
    { id: 'term', name: 'TERM', account: 'XXXX-9900', bank: 'Axis Bank', location: selected.city, amount: 6.1, role: 'Terminal' },
    { id: 'm5', name: 'M5', account: 'XXXX-7788', bank: 'Kotak', location: 'Meerut', amount: 1.5, role: 'Layer 2' },
    { id: 'm6', name: 'M6', account: 'XXXX-8899', bank: 'Yes Bank', location: 'Faridabad', amount: 0.7, role: 'Layer 2' }
  ];

  const graphData = {
    victim: { id: 'vic', name: 'Victim', account: 'XXXX-0000', bank: 'Victim Bank', location: selected.city, role: 'Victim', amount: selected.amount/100000 },
    mule1: { id: 'm1', name: 'Mule 1', account: selected.account, bank: selected.bank, location: 'Unknown', role: 'Layer 1 Mule', amount: selected.amount/100000 },
    layer2: l2Accounts
  };

  const width = 600;
  const height = 400;
  const xCol1 = 50;
  const xCol2 = 250;
  const xCol3 = 450;
  const yCenter = height / 2;
  
  const drawPath = (x1:number, y1:number, x2:number, y2:number) => {
    const cp1x = x1 + (x2 - x1) / 2;
    const cp1y = y1;
    const cp2x = x1 + (x2 - x1) / 2;
    const cp2y = y2;
    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
  };

  const NodeEl = ({node, x, y, isTerm=false, isVic=false}:any) => {
    const isSelected = activeNode === node.id;
    return (
      <div 
        onClick={(e)=>{e.stopPropagation(); setActiveNode(node.id);}}
        className={`absolute flex items-center justify-center cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f1115]' : ''} ${isTerm ? 'animate-pulse-glow z-10' : 'z-10'}`}
        style={{
          left: x, 
          top: y,
          width: isTerm ? 50 : 36,
          height: isTerm ? 50 : 36,
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          backgroundColor: isTerm ? '#ef4444' : isVic ? '#3b82f6' : '#14b8a6',
          border: '2px solid rgba(255,255,255,0.1)',
          color: '#fff',
          fontSize: '10px',
          fontWeight: 'bold'
        }}
      >
        {node.name}
      </div>
    );
  };

  const activeData = activeNode === 'vic' ? graphData.victim : activeNode === 'm1' ? graphData.mule1 : graphData.layer2.find(n => n.id === activeNode);

  return (
    <div className="subpanel relative" onClick={()=>setActiveNode(null)}>
      <div className="flex items-center justify-between mb-4">
        <div className="eyebrow">Transaction graph / directional flow</div>
        <span className="text-[10px] text-muted">click nodes for intelligence</span>
      </div>

      <div className="relative w-full overflow-x-auto overflow-y-hidden border border-steel/50 bg-background/20 rounded">
        <div className="relative min-w-[600px]" style={{height: height}}>
          
          <svg className="absolute inset-0 pointer-events-none" width="100%" height={height}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#14b8a6" />
              </marker>
              <marker id="arrow-term" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
              </marker>
            </defs>

            <path 
              d={drawPath(xCol1 + 18, yCenter, xCol2 - 18, yCenter)} 
              stroke="#14b8a6" strokeWidth="2" fill="none" markerEnd="url(#arrow)" opacity="0.6"
            />
            
            {graphData.layer2.map((n, i) => {
              const yNode = 40 + i * ((height - 80) / (graphData.layer2.length - 1));
              const isTerm = n.id === 'term';
              return (
                <path 
                  key={'edge-'+n.id}
                  d={drawPath(xCol2 + 18, yCenter, xCol3 - (isTerm ? 25 : 18), yNode)} 
                  stroke={isTerm ? '#ef4444' : '#14b8a6'} 
                  strokeWidth={isTerm ? '3' : '1.5'} 
                  fill="none" 
                  markerEnd={isTerm ? 'url(#arrow-term)' : 'url(#arrow)'} 
                  opacity={isTerm ? '0.8' : '0.4'}
                />
              )
            })}
          </svg>

          <div className="absolute pointer-events-none" style={{left: xCol1 + (xCol2 - xCol1)/2, top: yCenter, transform: 'translate(-50%, -50%)'}}>
             <div className="bg-panel border border-steel text-teal text-[9px] px-1.5 py-0.5 rounded shadow-lg font-mono">
               ₹{graphData.victim.amount.toFixed(1)}L
             </div>
          </div>

          {graphData.layer2.map((n, i) => {
             const yNode = 40 + i * ((height - 80) / (graphData.layer2.length - 1));
             const isTerm = n.id === 'term';
             const midX = xCol2 + (xCol3 - xCol2)/2;
             const midY = yCenter + (yNode - yCenter)/2;
             return (
               <div key={'label-'+n.id} className="absolute pointer-events-none" style={{left: midX, top: midY, transform: 'translate(-50%, -50%)'}}>
                 <div className={`bg-panel border border-steel text-[9px] px-1.5 py-0.5 rounded shadow-lg font-mono ${isTerm ? 'text-critical font-bold border-critical/30' : 'text-teal'}`}>
                   ₹{n.amount.toFixed(1)}L
                 </div>
               </div>
             )
          })}

          <NodeEl node={graphData.victim} x={xCol1} y={yCenter} isVic />
          <NodeEl node={graphData.mule1} x={xCol2} y={yCenter} />
          
          {graphData.layer2.map((n, i) => {
            const yNode = 40 + i * ((height - 80) / (graphData.layer2.length - 1));
            return <NodeEl key={'node-'+n.id} node={n} x={xCol3} y={yNode} isTerm={n.id==='term'} />
          })}

          {activeData && (
            <div 
              className="absolute bg-panel border border-steel shadow-2xl p-3 z-20 w-[200px] text-xs transition-opacity"
              style={{ top: 20, right: 20 }}
              onClick={e=>e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-2 border-b border-steel/50 pb-2">
                <div className="font-semibold">{activeData.name}</div>
                <div className={`text-[9px] uppercase tracking-wider px-1 py-0.5 rounded ${activeData.id==='term'?'bg-critical/20 text-critical':activeData.id==='vic'?'bg-blue/20 text-blue':'bg-teal/20 text-teal'}`}>
                  {activeData.role}
                </div>
              </div>
              <div className="space-y-1.5 text-muted">
                <div className="flex justify-between"><span>Acc:</span> <span className="font-mono text-foreground">{activeData.account}</span></div>
                <div className="flex justify-between"><span>Bank:</span> <span className="text-foreground">{activeData.bank}</span></div>
                <div className="flex justify-between"><span>Loc:</span> <span className="text-foreground">{activeData.location}</span></div>
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-muted border-t border-steel pt-3">
        <span className="flex items-center gap-1.5"><i className="block w-2.5 h-2.5 rounded-full bg-blue"/> Victim</span>
        <span className="flex items-center gap-1.5"><i className="block w-2.5 h-2.5 rounded-full bg-teal"/> Mule Account</span>
        <span className="flex items-center gap-1.5"><i className="block w-2.5 h-2.5 rounded-full bg-critical"/> Terminal Node</span>
      </div>
    </div>
  );
}
function CaseModal({ selected, close, alerts, confirmRisk, updateCase }: { selected: CaseItem; close: () => void; alerts: AlertItem[]; confirmRisk: () => void; updateCase: (s: Status, m: string) => void }) { const [verifyState, setVerifyState] = useState<'idle'|'loading'|'success'|'error'>('idle'); const handleVerify = (tamper = false) => { setVerifyState('loading'); setTimeout(() => setVerifyState(tamper ? 'error' : 'success'), 1500) }; return <div className="fixed inset-0 z-40 bg-background/85 p-3 backdrop-blur-sm md:p-6"><div className="case-modal mx-auto flex h-full max-w-7xl flex-col overflow-hidden border border-steel bg-panel"><div className="flex shrink-0 items-start justify-between border-b border-steel p-4"><div><button onClick={close} className="ghost-button mb-3">← Queue</button><div className="eyebrow">Case detail / {selected.id}</div><div className="mt-1 flex flex-wrap items-center gap-3"><h2 className="text-xl font-semibold">{selected.title}</h2><span className={`status-chip ${tone(selected.risk)}`}>{selected.fraud}</span></div><div className="mt-1 text-xs text-muted">{money(selected.amount)} · {selected.city}, {selected.state} · filed 06 Sep 2026 14:29 IST</div></div><div className="flex items-center gap-3"><div className="text-right"><div className={`font-mono text-3xl font-semibold text-${tone(selected.risk) === 'critical' ? 'critical' : 'amber'}`}>{selected.risk}</div><div className="font-mono text-[10px] text-muted">LIVE 08:42</div></div><button onClick={close} className="icon-button" aria-label="Close case detail"><X size={20} /></button></div></div><div className="min-h-0 flex-1 overflow-auto"><div className="grid lg:grid-cols-[1fr_330px]"><div className="space-y-4 p-4 lg:p-5"><div className="grid gap-3 md:grid-cols-3"><Evidence label="Victim" value="Aarav Sharma" detail="ID VICT-8841 · Noida, UP" /><Evidence label="Destination" value={selected.account} detail={`${selected.bank} · suspected mule`} /><Evidence label="Incident time" value="14:11 IST" detail="6 Sep 2026 · 19 min velocity" /></div><section className="subpanel"><div className="eyebrow">Bank info</div><button className="secondary-button mt-3">Request account history <ArrowRight size={14} /></button><div className="mt-3 overflow-auto"><table className="data-table"><thead><tr><th>Time</th><th>Channel</th><th>Amount</th><th>Terminal</th></tr></thead><tbody>{[['14:11', 'ATM withdrawal', '₹4.2L', 'NOI-18'], ['14:16', 'UPI transfer', '₹6.1L', 'UPI-4471'], ['14:30', 'ATM withdrawal', '₹8.1L', 'GGM-04']].map(r => <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td className="font-mono">{r[2]}</td><td className="font-mono">{r[3]}</td></tr>)}</tbody></table></div></section><section className="subpanel"><div className="eyebrow">Terminal node identification</div><div className="mt-4 flex flex-wrap items-center gap-2 text-xs"><span className="tag">Victim</span><ArrowRight size={14} /><span className="tag">Acc A</span><ArrowRight size={14} /><span className="tag">Acc B</span><ArrowRight size={14} /><span className="tag terminal-tag">Terminal · confidence 94%</span></div></section><section className="subpanel"><div className="eyebrow">Location prediction</div><LocationPredictionPanel selected={selected} /></section><TransactionGraph selected={selected} /><section className="subpanel"><div className="eyebrow">Mule intelligence / anomaly status</div><div className="mt-3 grid gap-3 sm:grid-cols-3"><Finding label="Fingerprint" value="Device reuse · 0.88" /><Finding label="Similarity" value="91% to NCR ring" /><Finding label="Anomaly" value="ALERT · 96/100" /></div></section><section className="subpanel"><div className="eyebrow">Ring analysis</div><div className="mt-2 flex flex-wrap items-center gap-3"><span className="font-mono text-blue">RING-NCR-07</span><span className="status-chip critical">97 RISK</span><span className="text-xs text-muted">12 linked complaints · UP + HR + DL</span></div><button className="ghost-button mt-3">Open full ring analysis <ArrowRight size={14} /></button></section></div><aside className="border-t border-steel bg-background/40 p-4 lg:sticky lg:top-0 lg:border-l lg:border-t-0 lg:p-5"><div className="eyebrow">Decision panel</div><div className="mt-4 border border-critical/50 bg-critical/5 p-4"><div className="eyebrow text-critical">Risk verdict</div><div className="mt-2 text-3xl font-semibold text-critical">HIGH RISK</div><div className="mt-1 text-xs text-muted">Score {selected.risk}/100 · ring-linked cash-out</div></div><div className="mt-5"><div className="eyebrow">Risk fusion</div><div className="mt-3 space-y-2">{riskData.map(x => <div key={x.name}><div className="mb-1 flex justify-between text-[11px]"><span>{x.name}</span><span className="font-mono">{x.value}</span></div><div className="h-1 bg-steel"><div className={`h-full ${x.value > 90 ? 'bg-critical' : 'bg-blue'}`} style={{ width: `${x.value}%` }} /></div></div>)}</div></div><div className="mt-5 border-t border-steel pt-4"><div className="eyebrow">SHAP factors</div><ul className="mt-3 space-y-2 text-xs text-muted"><li className="flex justify-between"><span>Ring membership</span><b className="text-critical">+15</b></li><li className="flex justify-between"><span>Velocity anomaly</span><b className="text-critical">+12</b></li><li className="flex justify-between"><span>Device reuse</span><b className="text-amber">+9</b></li></ul></div><div className="mt-5 border-t border-steel pt-4"><div className="eyebrow">Team dispatch</div><p className="mt-2 text-xs text-muted">Recommended: UP Cyber Cell Team 04 · closest to terminal cluster.</p><div className="mt-3 flex gap-2"><button className="primary-button" onClick={() => updateCase('dispatched', 'Dispatch accepted from case detail')}>Accept</button><button className="secondary-button">Override</button></div></div><div className="mt-5 border-t border-steel pt-4"><div className="eyebrow flex justify-between">Blockchain verification <span onClick={() => handleVerify(true)} className="opacity-0 cursor-pointer select-none">T</span></div><div className="mt-2 font-mono text-[10px] text-muted space-y-1"><div>Root: 0x7b9c9f28e41a8</div><div>Prev: 0x3a1c8f92b412c</div></div><div className="mt-3">{verifyState === 'idle' && <button className="secondary-button" onClick={() => handleVerify(false)}><BadgeCheck size={14} /> Verify chain integrity</button>}{verifyState === 'loading' && <div className="text-xs text-amber flex items-center gap-2"><Clock3 size={14} className="animate-spin" /> Verifying against testnet...</div>}{verifyState === 'success' && <div className="text-xs text-teal flex items-center gap-2 border border-teal/30 bg-teal/10 p-2"><Check size={14} /> Cryptographically verified</div>}{verifyState === 'error' && <div className="text-xs text-critical flex items-center gap-2 border border-critical/30 bg-critical/10 p-2"><X size={14} /> Hash mismatch! Data tampered.</div>}</div></div></aside></div></div></div></div> }
function Finding({ label, value }: { label: string; value: string }) { return <div className="border border-steel bg-background/40 p-2.5"><div className="text-[10px] uppercase tracking-wide text-muted">{label}</div><div className="mt-1 font-mono text-xs">{value}</div></div> }
function Intake({ onCreated }: { onCreated: (c: CaseItem) => void }) { const [stage, setStage] = useState(0); const [submitted, setSubmitted] = useState(false); const [form, setForm] = useState({ name: 'Aarav Sharma', id: 'VICT-8841', phone: '+91 98765 43210', city: 'Noida', state: 'Uttar Pradesh', fraud: 'UPI Fraud', amount: '1840000', account: 'XXXX-XXXX-8124', upi: 'aarav@upi', fraudPhone: '+91 98111 22001', desc: 'Complainant reports repeated ATM withdrawals after a phishing event. Three terminals were used across Noida and Gurugram within 19 minutes.', time: '2026-09-06T14:11' }); const change = (k: string, v: string) => setForm(f => ({ ...f, [k]: v })); const run = () => { setSubmitted(true); setStage(1); window.setTimeout(() => setStage(2), 1000); window.setTimeout(() => setStage(3), 4000); window.setTimeout(() => onCreated({ id: 'CYB-26-0418', title: 'New complaint · ' + form.fraud, fraud: form.fraud, city: form.city, state: 'UP', amount: Number(form.amount), risk: 92, status: 'high', updated: 'just now', account: form.account, bank: 'Axis Bank', location: form.city + ' intake zone', lat: 28.5355, lng: 77.3910 }), 4300) }; const Field = ({ k, label, type = 'text' }: { k: string; label: string; type?: string }) => <label className="field-label">{label}<input type={type} value={form[k as keyof typeof form]} onChange={e => change(k, e.target.value)} className="console-input" /></label>; return <div className="p-4 lg:p-6"><div className="mb-5"><div className="eyebrow">Intake lab / complaint processing</div><h1 className="mt-1 text-xl font-semibold">Create intelligence case</h1><p className="mt-1 text-xs text-muted">Prefilled demo payload · source tagged as 1930 Call</p></div><div className="grid max-w-6xl gap-4 lg:grid-cols-[1fr_320px]"><div className="panel p-4"><div className="eyebrow">Victim and incident details</div><div className="grid gap-x-3 sm:grid-cols-2"><Field k="name" label="Victim name" /><Field k="id" label="Victim ID" /><Field k="phone" label="Phone" /><Field k="city" label="City" /><Field k="state" label="State" /><label className="field-label">Source indicator<select className="console-input" defaultValue="1930 Call"><option>1930 Call</option><option>Web Portal Submission</option></select></label><label className="field-label">Fraud type<select value={form.fraud} onChange={e => change('fraud', e.target.value)} className="console-input"><option>Investment Scam</option><option>UPI Fraud</option><option>Loan App Fraud</option><option>Job Fraud</option><option>ATM Fraud</option></select></label><Field k="amount" label="Amount (₹)" type="number" /><Field k="time" label="Timestamp of incident" type="datetime-local" /></div><div className="eyebrow mt-6">Destination details</div><div className="grid gap-x-3 sm:grid-cols-2"><Field k="account" label="Account number" /><Field k="upi" label="UPI ID" /><Field k="fraudPhone" label="Fraudster phone number" /></div><label className="field-label">Complaint description<textarea value={form.desc} onChange={e => change('desc', e.target.value)} className="console-textarea" /></label><label className="field-label">Supporting evidence <input type="file" className="console-input" /><span className="text-[10px] text-muted">Optional demo upload · screenshots or transaction proof</span></label><button onClick={run} disabled={submitted} className="primary-button mt-5">{submitted ? <><Clock3 size={15} /> Processing...</> : <><Sparkles size={15} /> Submit complaint</>}</button></div><div className="panel p-4"><div className="eyebrow">Two-stage processing</div><div className="mt-5 space-y-5">{[['Hot Path', 'Fast structured-field extraction · ~1s'], ['Cold Path', 'Deep NLP, ring matching, location analysis · ~3s'], ['Case ready', 'Redirect to new case in investigator queue']].map(([n, d], i) => <div className={`flex gap-3 ${stage >= i + 1 ? 'text-foreground' : 'text-muted'}`} key={n}><div className={`grid size-7 shrink-0 place-items-center border ${stage >= i + 1 ? 'border-teal bg-teal/10 text-teal' : 'border-steel'}`}>{stage >= i + 1 ? <Check size={14} /> : i + 1}</div><div><div className="text-sm font-medium">{n}</div><div className="mt-1 text-xs leading-5 text-muted">{d}</div></div></div>)}</div>{stage === 3 && <div className="mt-6 border border-teal/50 bg-teal/5 p-3 text-xs text-teal">Case CYB-26-0418 ready. Added to queue and heatmap.</div>}</div></div></div> }
function Coordination({ alerts }: { alerts: AlertItem[] }) { const rows = [['CYB-26-0417', 'XXXX-8124', 'Freeze', '14:30', 'Acknowledged'], ['CYB-26-0416', 'XXXX-2941', 'History', '14:28', 'Pending'], ['CYB-26-0414', 'XXXX-7110', 'Freeze', '14:21', 'Action Taken']]; return <div className="p-4 lg:p-6"><div className="eyebrow">Mission coordination / shared state</div><h1 className="mt-1 text-xl font-semibold">Cross-agency response board</h1><div className="mt-5 grid gap-4 xl:grid-cols-2"><Board title="Bank Communication" subtitle="Requests sent"><div className="overflow-x-auto w-full"><table className="data-table"><thead><tr><th>Case ID</th><th>Account ID</th><th>Request</th><th>Sent</th><th>Status</th></tr></thead><tbody>{rows.map(r => <tr key={r[0]}><td className="font-mono text-blue">{r[0]}</td><td className="font-mono">{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td><span className="status-chip teal">{r[4]}</span></td></tr>)}</tbody></table></div><div className="mt-4 border-t border-steel pt-4"><div className="eyebrow">Responses received / expandable</div><details className="mt-3 border border-steel p-3 text-xs"><summary className="cursor-pointer">CYB-26-0417 · freeze confirmation · R. Mehta</summary><div className="mt-3 grid gap-2 text-muted sm:grid-cols-3"><span>Officer: R. Mehta</span><span>Timestamp: 14:31:48</span><span>Hash: 0x7b9c...e41a</span></div></details></div><div className="mt-4 border-t border-steel pt-4"><div className="eyebrow">Freeze chain overview</div><div className="overflow-x-auto w-full"><table className="data-table mt-2"><tbody>{[['XXXX-8124', 'Layer 1', 'frozen'], ['XXXX-2941', 'Layer 2', 'pending'], ['XXXX-7110', 'Terminal', 'failed']].map(r => <tr key={r[0]}><td className="font-mono">{r[0]}</td><td>{r[1]}</td><td><span className={`status-chip ${r[2] === 'frozen' ? 'teal' : r[2] === 'failed' ? 'critical' : 'watch'}`}>{r[2]}</span></td><td>{r[2] === 'failed' && <button className="ghost-button">Retry / escalate</button>}</td></tr>)}</tbody></table></div></div></Board><Board title="LEA Field Communication" subtitle="Dispatch mesh"><div className="eyebrow">Active dispatches</div><div className="overflow-x-auto w-full"><table className="data-table mt-2"><thead><tr><th>Case</th><th>Team</th><th>Location</th><th>Status</th></tr></thead><tbody>{[['CYB-26-0417', 'UP-04', 'Sector 18', 'En Route'], ['CYB-26-0414', 'HR-02', 'Golf Course', 'Assigned']].map(r => <tr key={r[0]}><td className="font-mono text-blue">{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td><span className="status-chip high">{r[3]}</span></td></tr>)}</tbody></table></div><div className="mt-4 border-t border-steel pt-4"><div className="eyebrow">Pending decisions</div><div className="mt-3 border border-amber/40 bg-amber/5 p-3 text-xs"><div className="font-medium">Accept dispatch recommendation · CYB-26-0417</div><div className="mt-1 text-muted">Closest team to predicted terminal cluster.</div><div className="mt-3 flex gap-2"><button className="primary-button">Accept</button><button className="secondary-button">Override</button></div></div></div><div className="mt-4 border-t border-steel pt-4"><div className="eyebrow">Outcome confirmations</div><div className="mt-3 space-y-2 text-xs text-muted"><div>14:31 · arrival confirmed · CYB-26-0409</div><div>14:12 · action taken · CYB-26-0414</div></div></div><div className="mt-4 border-t border-steel pt-4"><div className="eyebrow">Team availability</div><div className="mt-3 grid gap-2 sm:grid-cols-2">{[['UP-04', 'Dispatched', 'Noida Sector 18'], ['HR-02', 'Available', 'Gurugram HQ'], ['DL-07', 'Available', 'South Delhi']].map(r => <div key={r[0]} className="border border-steel p-2 text-xs"><div className="flex justify-between"><span className="font-mono">{r[0]}</span><span className={r[1] === 'Available' ? 'text-teal' : 'text-amber'}>{r[1]}</span></div><div className="mt-1 text-muted">{r[2]}</div></div>)}</div></div></Board></div><div className="panel mt-4 p-4"><div className="eyebrow">Alert delivery log</div><div className="mt-3 space-y-3">{alerts.slice(0, 3).map(a => <div key={a.id} className="border border-steel p-3"><div className="flex justify-between text-xs"><span className="font-mono text-blue">{a.id} · {a.caseId}</span><span className="text-muted">{a.status}</span></div><div className="mt-3 flex items-center gap-2 text-[10px] text-muted"><span className="progress-step done">Sent · 14:30</span><ArrowRight size={12} /><span className={`progress-step ${a.status !== 'pending' ? 'done' : ''}`}>Acknowledged · {a.status !== 'pending' ? '14:31' : '—'}</span><ArrowRight size={12} /><span className={`progress-step ${a.status === 'frozen' ? 'done' : ''}`}>Action Taken · {a.status === 'frozen' ? '14:32' : '—'}</span></div></div>)}</div></div></div> }
function Board({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) { return <section className="panel"><div className="panel-heading"><div><h2 className="font-semibold">{title}</h2><div className="mt-1 text-xs text-muted">{subtitle}</div></div><Network size={16} className="text-blue" /></div><div className="p-4">{children}</div></section> }
function Rings({ cases }: { cases: CaseItem[] }) { const [open, setOpen] = useState(rings[0]); return <div className="p-4 lg:p-6"><div className="eyebrow">Network intelligence</div><h1 className="mt-1 text-xl font-semibold">Fraud ring analysis</h1><p className="mt-1 max-w-2xl text-xs text-muted">Make the stitch explicit: shared accounts, UPI IDs, phone numbers, and fuzzy complaint similarity are shown beside every linked complaint.</p><div className="mt-5 grid gap-4 xl:grid-cols-[1fr_380px]"><section className="panel"><div className="panel-heading"><div><div className="eyebrow">Detected rings</div><h2 className="mt-1 font-semibold">Sortable ring summary</h2></div><span className="status-chip critical">3 active</span></div><div className="overflow-x-auto w-full"><table className="data-table"><thead><tr><th>Ring ID</th><th>Complaints</th><th>States / cities</th><th>At risk</th><th>Risk</th><th>First detected</th></tr></thead><tbody>{rings.map(r => <tr key={r.id} onClick={() => setOpen(r)} className={open.id === r.id ? 'selected-row' : ''}><td className="font-mono text-blue">{r.id}</td><td>{r.complaints}</td><td className="max-w-[180px] text-xs">{r.places}</td><td className="font-mono text-amber">{money(r.amount)}</td><td><span className={`status-chip ${tone(r.risk)}`}>{r.risk}</span></td><td className="text-xs text-muted">{r.first}</td></tr>)}</tbody></table></div></section><section className="panel"><div className="panel-heading"><div><div className="eyebrow">Ring detail</div><h2 className="mt-1 font-mono text-blue">{open.id}</h2></div><span className="status-chip critical">{open.risk} RISK</span></div><div className="space-y-4 p-4"><div className="text-xs text-muted">{open.states} states · {open.places} · {money(open.amount)} at risk</div><div><div className="eyebrow">Linked complaints + match basis</div><div className="mt-2 space-y-2">{cases.slice(0, 3).map((c, i) => <div className="border border-steel p-2 text-xs" key={c.id}><div className="flex justify-between"><span className="font-mono text-blue">{c.id}</span><span className="font-mono text-amber">{c.risk} risk</span></div><div className="mt-1 text-muted">{c.city}, {c.state} · {c.fraud} · {money(c.amount)}</div><div className="mt-2 text-[10px] text-teal">{i === 0 ? 'Exact match · shared account + phone' : i === 1 ? 'Exact match · shared UPI identifier' : 'Fuzzy match · complaint text similarity 86%'}</div></div>)}</div></div><div><div className="eyebrow">Mule accounts</div><div className="mt-2 flex flex-wrap gap-2">{open.accounts.map(a => <span className="tag font-mono" key={a}>{a} · rep {open.risk - 4}</span>)}</div></div><div><div className="eyebrow">Ring graph</div><div className="overflow-x-auto w-full"><div className="ring-graph mt-2 min-w-[340px]"><span className="ring-node rn1">C1</span><span className="ring-node rn2">C2</span><span className="ring-node rn3">C3</span><span className="ring-node rn4">MULE</span><span className="ring-node rn5">MULE</span><span className="ring-edge re1" /><span className="ring-edge re2" /><span className="ring-edge re3" /><span className="ring-edge re4" /></div></div></div><div className="flex gap-2"><button className="primary-button">Escalate to I4C</button><button className="secondary-button">Flag cross-state</button></div></div></section></div></div> }
function BankShell({ alerts, onAcknowledge, onFreeze }: { alerts: AlertItem[]; onAcknowledge: (id: string) => void; onFreeze: (id: string, officer: string) => void }) {
  const queue = [...alerts].sort((a, b) => { const aPrio = a.status === 'frozen' ? 0 : 1; const bPrio = b.status === 'frozen' ? 0 : 1; if (aPrio !== bPrio) return bPrio - aPrio; return b.risk - a.risk; });
  const [activeAlertId, setActiveAlertId] = useState<string>(queue.find(a => a.status !== 'frozen')?.id || queue[0]?.id);
  const [freezeOfficer, setFreezeOfficer] = useState('');
  const [confirmingFreezeId, setConfirmingFreezeId] = useState<string | null>(null);
  const [historyTab, setHistoryTab] = useState(false);
  const [providedHistory, setProvidedHistory] = useState<Record<string, boolean>>({});

  return (
    <main className="w-full p-4 lg:p-6 pb-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 grid gap-4 grid-cols-1 md:grid-cols-3">
           <div className="border border-steel bg-panel p-4"><div className="text-xs text-muted">Alerts Today</div><div className="mt-1 text-2xl font-mono">{alerts.length + 14}</div></div>
           <div className="border border-steel bg-panel p-4"><div className="text-xs text-muted">Avg. Acknowledgment</div><div className="mt-1 text-2xl font-mono">42s</div></div>
           <div className="border border-steel bg-panel p-4"><div className="text-xs text-muted">Accounts Frozen This Week</div><div className="mt-1 text-2xl font-mono">128</div></div>
        </div>

        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div><div className="eyebrow">Partner workspace / bank fraud desk</div><h1 className="mt-1 text-xl font-semibold">Axis Bank intervention queue</h1><p className="mt-1 text-xs text-muted">Procedural response surface · secure investigator channel</p></div>
          <div className="status-chip teal"><span className="live-dot" /> core banking connected</div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_.55fr]">
          <section className="panel">
            <div className="panel-heading border-b border-steel flex gap-4 p-0">
               <button className={`p-4 text-sm font-medium border-b-2 ${!historyTab ? 'border-foreground text-foreground' : 'border-transparent text-muted'}`} onClick={() => setHistoryTab(false)}>Intervention Alerts</button>
               <button className={`p-4 text-sm font-medium border-b-2 ${historyTab ? 'border-foreground text-foreground' : 'border-transparent text-muted'}`} onClick={() => setHistoryTab(true)}>History Requests</button>
            </div>
            
            {!historyTab ? (
              <div className="flex flex-col divide-y divide-steel">
                <div className="p-4 flex justify-between bg-background/50"><div className="font-semibold">Priority intervention packets</div><span className="font-mono text-xs text-muted">{alerts.length} total</span></div>
                {queue.map(a => {
                  if (a.id === activeAlertId) {
                    return (
                      <div className="p-4 bg-blue/5 border-l-2 border-l-blue shadow-inner" key={a.id}>
                        <div className="flex flex-wrap justify-between gap-3">
                          <div>
                            <div className="font-mono text-xs text-blue">{a.id} · {a.caseId}</div>
                            <div className="mt-2 text-sm font-medium">Immediate withdrawal intervention</div>
                            <div className="mt-1 text-xs text-muted">Account {a.account} · exposure <span className="font-mono text-amber">{money(a.amount)}</span></div>
                          </div>
                          <span className={`status-chip ${a.status === 'frozen' ? 'teal' : a.status === 'acknowledged' ? 'watch' : 'critical'}`}>{label(a.status)}</span>
                        </div>
                        <div className="mt-4 grid gap-3 border border-steel bg-background/40 p-3 text-xs sm:grid-cols-3">
                          <div><div className="eyebrow">Risk score</div><div className="mt-1 font-mono text-critical">{a.risk}/100</div></div>
                          <div><div className="eyebrow">Requested action</div><div className="mt-1">Freeze debit + ATM cash</div></div>
                          <div><div className="eyebrow">Receiving officer</div><div className="mt-1 font-medium">{a.officer || 'Unassigned'}</div></div>
                        </div>
                        <div className="mt-4 flex flex-col gap-3">
                          {a.status === 'pending' && <button className="secondary-button self-start" onClick={() => onAcknowledge(a.id)}><BadgeCheck size={14} /> Acknowledge packet</button>}
                          {a.status === 'acknowledged' && confirmingFreezeId !== a.id && <button className="primary-button self-start" onClick={() => setConfirmingFreezeId(a.id)}><LockKeyhole size={14} /> Freeze account</button>}
                          {confirmingFreezeId === a.id && (
                            <div className="border border-blue p-3 bg-background flex flex-wrap gap-2 items-center rounded">
                              <input autoFocus type="text" placeholder="Officer Name / Badge ID" className="console-input w-48 text-xs" value={freezeOfficer} onChange={e => setFreezeOfficer(e.target.value)} />
                              <button className="primary-button text-xs py-1.5" onClick={() => { if(freezeOfficer) { const formattedOfficer = freezeOfficer.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '); onFreeze(a.id, formattedOfficer); setConfirmingFreezeId(null); setFreezeOfficer(''); }}}>Confirm Freeze</button>
                              <button className="ghost-button text-xs py-1.5" onClick={() => setConfirmingFreezeId(null)}>Cancel</button>
                            </div>
                          )}
                          {a.status === 'frozen' && <span className="flex items-center gap-2 text-xs text-teal bg-teal/10 p-2 border border-teal/20 rounded w-fit"><Check size={14} /> Freeze chain cryptographically sealed by {a.officer}</span>}
                        </div>
                      </div>
                    );
                  } else {
                     return (
                        <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-background/50 transition-colors" key={a.id} onClick={() => setActiveAlertId(a.id)}>
                           <div>
                              <div className="font-mono text-xs text-blue">{a.id}</div>
                              <div className="text-[10px] text-muted mt-1">{a.account} · {money(a.amount)}</div>
                           </div>
                           <div className="flex items-center gap-4">
                              <span className="font-mono text-[10px] text-muted">{a.risk} RISK</span>
                              <span className={`status-chip ${a.status === 'frozen' ? 'teal' : a.status === 'acknowledged' ? 'watch' : 'critical'}`}>{label(a.status)}</span>
                           </div>
                        </div>
                     )
                  }
                })}
              </div>
            ) : (
              <div className="p-4">
                <div className="space-y-3">
                   {[{ id: 'REQ-101', case: 'CYB-26-0416', account: 'XXXX-2941', time: '14:28' }].map(req => (
                     <div key={req.id} className="border border-steel p-4 text-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                           <div><div className="font-mono text-blue text-xs">{req.case}</div><div className="mt-1 font-medium">History Request for Account {req.account}</div><div className="text-muted text-xs mt-1">Requested at {req.time}</div></div>
                        </div>
                        {providedHistory[req.id] ? <span className="text-teal flex items-center gap-2 text-xs bg-teal/10 p-2 w-fit"><Check size={14}/> Statement data transmitted securely</span> : (
                           <div className="mt-2 border border-steel p-3 bg-background/50">
                             <div className="text-xs text-muted mb-2">Mock Statement Upload</div>
                             <table className="w-full text-xs text-left mb-3">
                               <thead><tr className="text-muted border-b border-steel"><th>Date</th><th>Type</th><th>Amount</th><th>Bal</th></tr></thead>
                               <tbody>
                                 <tr className="border-b border-steel/50"><td>Sep 6</td><td>UPI IN</td><td className="text-teal">+₹40,000</td><td className="font-mono">₹42,100</td></tr>
                                 <tr><td>Sep 6</td><td>ATM WDL</td><td className="text-amber">-₹40,000</td><td className="font-mono">₹2,100</td></tr>
                               </tbody>
                             </table>
                             <button className="primary-button text-xs py-1.5" onClick={() => setProvidedHistory(p => ({ ...p, [req.id]: true }))}>Upload & Provide History</button>
                           </div>
                        )}
                     </div>
                   ))}
                </div>
              </div>
            )}
          </section>

          <section className="panel p-4 h-fit">
            <div className="eyebrow">Active alert action log</div>
            <div className="mt-4 space-y-3 text-xs">
              {['14:32:09 · alert received', '14:31:48 · investigator signature verified', '14:30:22 · velocity rule crossed', '14:28:51 · account session observed'].map(x => <div className="border-l border-steel pl-3 text-muted" key={x}>{x}</div>)}
              {queue.find(a => a.id === activeAlertId)?.status === 'acknowledged' && <div className="border-l border-blue pl-3 text-foreground">14:33:01 · alert acknowledged</div>}
              {queue.find(a => a.id === activeAlertId)?.status === 'frozen' && (
                <>
                  <div className="border-l border-teal pl-3 text-teal">14:33:02 · account frozen · officer verified</div>
                  <div className="border-l border-blue pl-3 text-blue">14:33:05 · notification sent to investigator</div>
                </>
              )}
            </div>
          </section>
        </div>

        <GlobalAccountStatusLog />
      </div>
    </main>
  );
}

function GlobalAccountStatusLog() {
  const [logFilter, setLogFilter] = useState('');
  const globalLogs = [
    { acc: 'XXXX-1142', case: 'CYB-26-0391', action: 'FROZEN', officer: 'R. Mehta', time: 'Today 11:43', style: 'teal' },
    { acc: 'XXXX-8819', case: 'CYB-26-0311', action: 'HISTORY PROVIDED', officer: 'S. Kumar', time: 'Today 08:05', style: 'watch' },
    { acc: 'XXXX-0941', case: 'CYB-26-0294', action: 'FROZEN', officer: 'R. Mehta', time: 'Yesterday 18:22', style: 'teal' },
    { acc: 'XXXX-4412', case: 'CYB-26-0281', action: 'FROZEN', officer: 'A. Sharma', time: 'Yesterday 14:10', style: 'teal' },
  ];
  const filteredLogs = globalLogs.filter(l => logFilter === '' || l.acc.includes(logFilter) || l.action.toLowerCase().includes(logFilter.toLowerCase()));

  return (
    <section className="mt-6 panel p-4">
       <div className="flex flex-wrap gap-3 justify-between items-center mb-3">
         <div className="eyebrow">Global Account Status Log</div>
         <div className="relative">
           <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted" />
           <input type="text" placeholder="Filter by Account or Action..." className="console-input pl-8 text-xs w-64 py-1.5" value={logFilter} onChange={e => setLogFilter(e.target.value)} />
         </div>
       </div>
       <div className="overflow-x-auto w-full">
          <table className="data-table">
             <thead><tr><th>Account ID</th><th>Case ID</th><th>Action Taken</th><th>Officer</th><th>Timestamp</th></tr></thead>
             <tbody>
                {filteredLogs.slice(0, 3).map((l, i) => (
                  <tr key={i}><td className="font-mono">{l.acc}</td><td className="font-mono text-blue">{l.case}</td><td><span className={`status-chip ${l.style}`}>{l.action}</span></td><td>{l.officer}</td><td className="text-muted">{l.time}</td></tr>
                ))}
             </tbody>
          </table>
          {filteredLogs.length > 3 && <button className="ghost-button w-full mt-2 justify-center text-xs">Load more ({filteredLogs.length - 3}) <ChevronDown size={14}/></button>}
       </div>
    </section>
  );
}
function FieldShell({ cases, updateCaseById }: { cases: CaseItem[]; updateCaseById: (id: string, s: Status, m: string) => void }) {
  const queue = [...cases].sort((a, b) => {
    const aPrio = ['dispatched', 'en-route', 'arrived'].includes(a.status) ? 1 : 0;
    const bPrio = ['dispatched', 'en-route', 'arrived'].includes(b.status) ? 1 : 0;
    if (aPrio !== bPrio) return bPrio - aPrio;
    return b.risk - a.risk;
  });
  const [activeId, setActiveId] = useState<string>(queue.find(c => c.status !== 'action-taken')?.id || queue[0]?.id);
  const activeCase = queue.find(c => c.id === activeId) || queue[0];
  const activeIndex = queue.findIndex(c => c.id === activeId);
  const nextCase = queue.slice(activeIndex + 1).find(c => c.status !== 'action-taken');

  const advance = () => {
    if (!activeCase) return;
    const step = activeCase.status;
    const nextStep = step === 'dispatched' ? 'en-route' : step === 'en-route' ? 'arrived' : 'action-taken' as Status;
    updateCaseById(activeCase.id, nextStep, `Field status updated: ${label(nextStep)}`);
    
    if (nextStep === 'action-taken' && nextCase) {
      setTimeout(() => setActiveId(nextCase.id), 1200);
    }
  };

  const getDistance = (c: CaseItem) => ((c.risk % 10) + 1.2).toFixed(1);

  return (
    <main className="w-full bg-background p-4 sm:p-6 min-h-screen pb-safe">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <div><div className="eyebrow">LEA field mesh</div><h1 className="mt-1 text-lg font-semibold">Assignment console</h1></div>
          <div className="text-right"><div className="text-sm font-medium">Const. R. Sharma</div><div className="font-mono text-[10px] tracking-wider text-muted uppercase mt-0.5">UP-04-119</div></div>
        </div>

        <div className="space-y-3">
          {queue.map((c, i) => {
            const isActive = c.id === activeId;
            const distance = getDistance(c);
            
            if (isActive) {
              return (
                <div key={c.id} className="border border-blue/40 bg-blue/5 p-4 shadow-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono text-xs text-blue flex items-center gap-2">
                        <span className="bg-blue text-white px-1 py-0.5 rounded-sm text-[10px]">#{i + 1}</span> DISPATCH · {c.id}
                      </div>
                      <div className="mt-2 text-lg font-semibold">Cash-out intervention</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                        <span>{c.fraud}</span><span>·</span><span className="font-mono text-foreground">{money(c.amount)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <span className={`status-chip ${tone(c.risk)}`}>{c.risk} RISK</span>
                      <button className="flex items-center gap-1.5 border border-steel bg-background/50 px-2 py-1 text-[10px] font-medium text-muted hover:text-foreground hover:border-blue transition-colors"><AlertTriangle size={12} /> Report Issue</button>
                    </div>
                  </div>
                  
                  <div className="mt-3 inline-flex border border-teal/40 bg-teal/10 px-2 py-1 text-[10px] text-teal items-center gap-1.5">
                    <Check size={12}/> Prioritized: High severity + nearest unit
                  </div>

                  <div className="mt-5 flex items-center gap-3 border-y border-steel py-4">
                    <Clock3 className="text-amber" size={22} />
                    <div>
                      <div className="font-mono text-2xl text-amber">08:42</div>
                      <div className="text-[10px] uppercase tracking-widest text-muted">response window remaining</div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-3 text-sm">
                    <MapPin className="text-blue" size={17} />
                    <div>
                      <div className="font-medium">{c.location}</div>
                      <div className="mt-1 text-xs text-muted">{c.city}, {c.state} · ATM cluster</div>
                    </div>
                  </div>

                  <div className="mt-4"><FieldMap selected={c} /></div>
                  
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-muted"><MapPin size={13} /> {distance} km · approx. {Math.round(Number(distance)*4)} min</div>
                    <button className="text-blue font-medium hover:underline">Navigate with Google Maps</button>
                  </div>

                  <button onClick={advance} disabled={c.status === 'action-taken'} className={`mt-5 w-full justify-center py-3 text-sm ${c.status === 'action-taken' ? 'secondary-button opacity-50 cursor-not-allowed' : 'primary-button'}`}>
                    {c.status === 'dispatched' ? 'Mark En-Route' : c.status === 'en-route' ? 'Confirm arrival' : c.status === 'arrived' ? 'Confirm action taken' : 'Action Logged'} <ArrowRight size={14} />
                  </button>
                  
                  <div className="mt-6 space-y-3">
                    {[['Assigned', 'Team UP-04 assigned'], ['En Route', 'Officer movement detected'], ['Arrived', 'On-site confirmation'], ['Action Taken', 'Outcome logged']].map(([n, d], stepIdx) => {
                      const currentIdx = (['dispatched', 'en-route', 'arrived', 'action-taken'] as Status[]).indexOf(c.status);
                      const isPast = stepIdx <= currentIdx;
                      return (
                        <div className={`flex gap-3 text-sm ${isPast ? 'text-foreground' : 'text-muted'}`} key={n}>
                          <div className={`grid size-6 shrink-0 place-items-center rounded-full border text-[10px] ${isPast ? 'border-blue bg-blue/10 text-blue' : 'border-steel'}`}>{stepIdx + 1}</div>
                          <div><div className="font-medium">{n}</div><div className="text-[11px] text-muted">{d}</div></div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {nextCase && (
                    <div className="mt-6 p-3 border border-steel bg-background/50 hover:border-blue/50 transition-colors flex items-center justify-between cursor-pointer" onClick={() => setActiveId(nextCase.id)}>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted mb-1">Next up</div>
                        <div className="text-xs font-mono">{nextCase.id} · {nextCase.location}</div>
                      </div>
                      <div className="text-right">
                        <span className={`status-chip ${tone(nextCase.risk)}`}>{nextCase.risk}</span>
                        <div className="text-[10px] text-muted mt-1">{getDistance(nextCase)} km</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            } else {
              return (
                <div key={c.id} onClick={() => setActiveId(c.id)} className={`border p-3 flex justify-between items-center cursor-pointer transition-colors ${c.status === 'action-taken' ? 'border-steel/50 bg-background/50 opacity-60' : 'border-steel bg-panel hover:border-blue/50'}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] bg-steel/50 text-muted px-1.5 py-0.5 rounded-sm">#{i + 1}</span>
                    <div>
                      <div className={`font-mono text-xs ${c.status === 'action-taken' ? 'text-muted' : 'text-blue'}`}>{c.id}</div>
                      <div className="text-[10px] text-muted mt-0.5">{c.fraud} · {distance} km</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    {c.status !== 'action-taken' && <div className="text-[10px] text-amber font-mono">08:42</div>}
                    <span className={`status-chip ${tone(c.risk)}`}>{c.status === 'action-taken' ? 'Done' : c.risk}</span>
                  </div>
                </div>
              );
            }
          })}
        </div>

        <div className="mt-6 border-t border-steel pt-4">
          <details className="group cursor-pointer text-xs text-muted">
            <summary className="flex items-center justify-between font-medium outline-none hover:text-foreground transition-colors">
              <span>Past shift assignments (3)</span>
              <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-3 space-y-2 border-l-2 border-steel pl-3">
              <div className="flex justify-between"><span className="font-mono text-[10px]">CYB-26-0391</span><span className="text-teal">Action Taken · 11:42</span></div>
              <div className="flex justify-between"><span className="font-mono text-[10px]">CYB-26-0342</span><span className="text-amber">Subject fled · 09:15</span></div>
              <div className="flex justify-between"><span className="font-mono text-[10px]">CYB-26-0311</span><span className="text-teal">Action Taken · 08:04</span></div>
            </div>
          </details>
        </div>
      </div>
    </main>
  );
}
