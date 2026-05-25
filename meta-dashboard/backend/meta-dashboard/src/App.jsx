import { useState, useEffect } from "react"
import { Users, TrendingUp, Image, RefreshCw, Heart, MessageCircle, ExternalLink, LayoutDashboard, BarChart2, Settings, ChevronDown, Plus, Check, LogOut, Play, Bookmark, Share2, Sun, Moon, FileText, History } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts"

const API = ""
const COLORS = ['#a855f7', '#3b82f6', '#ec4899', '#10b981', '#f59e0b'];

function TrendBadge({ value, isPercent = true }) {
  if (value === undefined || value === null || isNaN(value)) return null;
  const isPositive = value >= 0;
  const color = isPositive ? "#22c55e" : "#ef4444"; 
  const bg = isPositive ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)";
  return (
    <div style={{display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", background: bg, color: color, borderRadius: "6px", fontSize: "12px", fontWeight: "600"}}>
      {isPositive ? "▲" : "▼"} {Math.abs(value)}{isPercent ? "%" : ""}
    </div>
  )
}

function AdvancedStatCard({ title, value, trend, previousValue, dateRange }) {
  if (Number.isNaN(value) || value === "NaN") value = "0";
  return (
    <div style={{background:"var(--bg-subtle-3)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"16px",padding:"24px",display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
      <p style={{color:"var(--text-300)",fontSize:"14px",fontWeight:"600",marginBottom:"12px"}}>{title}</p>
      {dateRange && <div style={{display:"inline-block", padding:"4px 8px", background:"var(--bg-subtle-5)", borderRadius:"6px", color:"var(--text-500)", fontSize:"11px", marginBottom:"12px", width:"fit-content"}}>📅 {dateRange}</div>}
      <div style={{display:"flex",alignItems:"baseline",gap:"12px",marginBottom:"8px"}}>
        <span style={{color:"var(--text-100)",fontSize:"28px",fontWeight:"800"}}>{value}</span>
        {trend !== undefined && !isNaN(trend) && <TrendBadge value={trend} />}
      </div>
      {previousValue !== undefined && !isNaN(previousValue) && <p style={{color:"var(--text-600)",fontSize:"12px"}}>{previousValue} no período anterior</p>}
    </div>
  )
}

function Toasts({ items, onDismiss }) {
  return (
    <div style={{position:"fixed",top:"16px",right:"16px",display:"grid",gap:"10px",zIndex:400}}>
      {items.map(t => (
        <div key={t.id} style={{minWidth:"280px",maxWidth:"380px",padding:"12px 14px",borderRadius:"10px",background:t.type==="error"?"#3f1d1d":"#1e293b",border:t.type==="error"?"1px solid #ef4444":"1px solid #334155",color:"var(--text-300)",fontSize:"13px",display:"flex",justifyContent:"space-between",gap:"12px"}}>
          <span>{t.message}</span>
          <button onClick={() => onDismiss(t.id)} style={{background:"transparent",border:"none",color:"var(--text-500)",cursor:"pointer"}}>✕</button>
        </div>
      ))}
    </div>
  )
}

function OAuthPagePicker({ open, onClose, pending, onSelect, loading }) {
  const [selectedAd, setSelectedAd] = useState({})
  if (!open) return null
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:210}}>
      <div style={{background:"var(--bg-card)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"20px",padding:"24px",width:"620px"}}>
        <h3 style={{color:"var(--text-200)",fontWeight:"700",fontSize:"18px",marginBottom:"8px"}}>Escolha a página/BM</h3>
        <p style={{color:"var(--text-600)",fontSize:"13px",marginBottom:"16px"}}>Selecione a página e, se desejar, a conta de anúncios para campanhas.</p>
        <div style={{display:"grid",gap:"10px",maxHeight:"360px",overflowY:"auto",marginBottom:"16px"}}>
          {(pending?.pages || []).map(page => (
            <div key={page.page_id} style={{padding:"12px",background:"var(--bg-subtle-4)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px"}}>
              <div style={{fontWeight:"600",color:"var(--text-300)"}}>{page.page_name}</div>
              <div style={{color:"var(--text-500)",fontSize:"12px",marginTop:"4px",marginBottom:"10px"}}>@{page.ig_username} • IG ID {page.ig_id}</div>
              {(page.ad_accounts || []).length > 0 && (
                <select
                  value={selectedAd[page.page_id] ?? ""}
                  onChange={(e) => setSelectedAd(prev => ({ ...prev, [page.page_id]: e.target.value }))}
                  style={{width:"100%",marginBottom:"10px",background:"var(--border-light)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"8px",padding:"8px",color:"var(--text-300)"}}
                >
                  <option value="">Sem conta de anúncio</option>
                  {(page.ad_accounts || []).map(ad => (
                    <option key={ad.id} value={ad.id}>{ad.name} ({ad.id})</option>
                  ))}
                </select>
              )}
              <button
                onClick={() => onSelect(page.page_id, selectedAd[page.page_id] || null)}
                disabled={loading}
                style={{width:"100%",padding:"10px",background:"rgba(124,58,237,0.22)",border:"1px solid rgba(124,58,237,0.4)",borderRadius:"8px",color:"#ddd6fe",cursor:"pointer"}}
              >
                {loading ? "Conectando..." : "Selecionar esta página"}
              </button>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{width:"100%",padding:"12px",background:"var(--bg-subtle-5)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",color:"var(--text-500)",cursor:"pointer",fontSize:"14px"}}>Fechar</button>
      </div>
    </div>
  )
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const submit = async () => {
    setError("")
    setLoading(true)
    try {
      const r = await fetch(`${API}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.detail || "Falha no login")
      onLogin(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div style={{width:"100%",maxWidth:"420px"}}>
        {/* Brand */}
        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <div style={{width:"52px",height:"52px",borderRadius:"14px",background:"linear-gradient(135deg,#7c3aed,#ec4899)",display:"grid",placeItems:"center",margin:"0 auto 16px",boxShadow:"0 8px 24px rgba(124,58,237,0.35)"}}>
            <BarChart2 size={24} color="white" />
          </div>
          <h1 style={{fontSize:"22px",fontWeight:"800",color:"var(--text-primary)",letterSpacing:"-0.5px"}}>UP REPORTS</h1>
          <p style={{fontSize:"14px",color:"var(--text-muted)",marginTop:"4px"}}>Dashboard de Analytics</p>
        </div>

        <div className="login-box">
          <h2 style={{fontSize:"18px",fontWeight:"700",color:"var(--text-primary)",marginBottom:"4px"}}>Bem-vindo de volta</h2>
          <p style={{fontSize:"13.5px",color:"var(--text-muted)",marginBottom:"24px"}}>Entre com sua conta para continuar</p>

          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            <div>
              <label className="form-label">Email</label>
              <input
                className="form-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                onKeyDown={e => e.key === 'Enter' && submit()}
              />
            </div>
            <div>
              <label className="form-label">Senha</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && submit()}
              />
            </div>

            {error && (
              <div style={{padding:"10px 14px",background:"var(--red-soft)",border:"1px solid var(--red)",borderRadius:"var(--radius-md)",color:"var(--red)",fontSize:"13px"}}>
                {error}
              </div>
            )}

            <button
              className="btn-primary"
              onClick={submit}
              disabled={loading}
              style={{width:"100%",padding:"13px",marginTop:"4px",fontSize:"15px"}}
            >
              {loading ? <><RefreshCw size={15} className="spin" /> Entrando...</> : "Entrar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


function ClientSwitcher({ clients, selected, onSelect, onAdd }) {
  const [open, setOpen] = useState(false)
  const current = clients.find(c => c.id === selected)

  return (
    <div style={{position:"relative",marginBottom:"16px"}}>
      <button onClick={() => setOpen(!open)} className="client-switcher-btn">
        {current?.profile_picture_url ? (
          <img src={current.profile_picture_url} style={{width:"26px",height:"26px",borderRadius:"7px",flexShrink:0,objectFit:"cover"}} />
        ) : (
          <div style={{width:"26px",height:"26px",borderRadius:"7px",background:"linear-gradient(135deg,#7c3aed,#ec4899)",flexShrink:0}}/>
        )}
        <span style={{flex:1,textAlign:"left",fontSize:"13px",fontWeight:"600",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          {current?.name ?? "Selecionar cliente"}
        </span>
        <ChevronDown size={13} color="var(--text-muted)" style={{transform: open?"rotate(180deg)":"none", transition:"0.2s",flexShrink:0}}/>
      </button>

      {open && (
        <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:"var(--bg-card)",border:"1px solid var(--border-med)",borderRadius:"var(--radius-md)",overflow:"hidden",zIndex:100,boxShadow:"0 8px 24px rgba(0,0,0,0.2)"}}>
          {clients.map(c => (
            <button key={c.id} onClick={() => { onSelect(c.id); setOpen(false) }}
              style={{width:"100%",display:"flex",alignItems:"center",gap:"10px",padding:"9px 12px",background:"transparent",border:"none",cursor:"pointer",color: selected===c.id ? "var(--accent-light)" : "var(--text-secondary)",fontSize:"13px",fontFamily:"inherit"}}>
              {c.profile_picture_url ? (
                <img src={c.profile_picture_url} style={{width:"22px",height:"22px",borderRadius:"6px",flexShrink:0,objectFit:"cover"}} />
              ) : (
                <div style={{width:"22px",height:"22px",borderRadius:"6px",background:"linear-gradient(135deg,#7c3aed,#ec4899)",flexShrink:0}}/>
              )}
              <span style={{flex:1,textAlign:"left"}}>{c.name}</span>
              {selected === c.id && <Check size={13} color="var(--accent-light)"/>}
            </button>
          ))}
          <div style={{borderTop:"1px solid var(--border)",padding:"4px"}}>
            <button onClick={() => { onAdd(); setOpen(false) }}
              style={{width:"100%",display:"flex",alignItems:"center",gap:"10px",padding:"8px 12px",background:"transparent",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:"13px",borderRadius:"var(--radius-sm)",fontFamily:"inherit"}}>
              <Plus size={14}/> Adicionar cliente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


function AddClientModal({ onClose, authFetch, onToast }) {
  const [clientName, setClientName] = useState("")
  const [loadingProvider, setLoadingProvider] = useState(null)

  const connectMeta = async (provider) => {
    if (!clientName || clientName.trim().length < 2) return
    setLoadingProvider(provider)
    try {
      const query = new URLSearchParams({ provider, client_name: clientName.trim() })
      const r = await authFetch(`${API}/api/v1/oauth/meta/start?${query.toString()}`)
      const data = await r.json()
      if (!r.ok) throw new Error(data?.detail || "Falha ao iniciar conexão")
      window.location.href = data.auth_url
    } catch (e) {
      onToast(e.message, "error")
    } finally {
      setLoadingProvider(null)
    }
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div style={{background:"var(--bg-card)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"20px",padding:"32px",width:"460px"}}>
        <h3 style={{color:"var(--text-200)",fontWeight:"700",fontSize:"18px",marginBottom:"10px"}}>Conectar cliente</h3>
        <p style={{color:"var(--text-600)",fontSize:"13px",marginBottom:"18px"}}>Escolha como conectar: login do Instagram ou login do Facebook (BM).</p>

        <div style={{marginBottom:"18px"}}>
          <p style={{color:"var(--text-600)",fontSize:"12px",marginBottom:"6px"}}>Nome do cliente</p>
          <input value={clientName} onChange={e => setClientName(e.target.value)}
            placeholder="Ex: João Silva"
            style={{width:"100%",background:"var(--bg-subtle-5)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",padding:"10px 14px",color:"var(--text-300)",fontSize:"14px",outline:"none"}}/>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"14px"}}>
          <button onClick={() => connectMeta("instagram")} disabled={loadingProvider!==null}
            style={{padding:"12px",background:"rgba(236,72,153,0.14)",border:"1px solid rgba(236,72,153,0.35)",borderRadius:"10px",color:"#f9a8d4",cursor:"pointer",fontWeight:"600"}}>
            {loadingProvider === "instagram" ? "Conectando..." : "Entrar com Instagram"}
          </button>
          <button onClick={() => connectMeta("facebook")} disabled={loadingProvider!==null}
            style={{padding:"12px",background:"rgba(59,130,246,0.14)",border:"1px solid rgba(59,130,246,0.35)",borderRadius:"10px",color:"#93c5fd",cursor:"pointer",fontWeight:"600"}}>
            {loadingProvider === "facebook" ? "Conectando..." : "Entrar com Facebook"}
          </button>
        </div>

        <p style={{color:"var(--text-700)",fontSize:"12px",lineHeight:1.45,marginBottom:"16px"}}>
          Se preferir conectar usando um token de acesso de longa duração manual, utilize o formulário avançado em configurações.
        </p>
        <button onClick={onClose} style={{width:"100%",padding:"12px",background:"var(--bg-subtle-5)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",color:"var(--text-500)",cursor:"pointer",fontSize:"14px"}}>
          Fechar
        </button>
      </div>
    </div>
  )
}

function ReportMetricCard({ title, value, trend, prevValue, info }) {
  const isPositive = trend >= 0;
  return (
    <div className="report-mcard">
      <div className="report-mcard-header">
        <span className="report-mcard-title">{title}</span>
        {info && <span className="report-mcard-info-icon" title={info}>?</span>}
      </div>
      <div className="report-mcard-body">
        <div className="report-mcard-value">{value}</div>
        {trend !== undefined && (
          <div className={`report-mcard-trend ${isPositive ? 'up' : 'down'}`}>
            {isPositive ? '▲' : '▼'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="report-mcard-footer">
        <span className="report-mcard-prev">{prevValue}</span> no período anterior
      </div>
    </div>
  );
}

const OrganicReport = ({ client, profile, summary, media, stories, audience, snapshots, reportConfig }) => {
  const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  const followers = profile?.followers_count || 0;
  const reach = summary?.totals?.reach || 0;
  const impressions = summary?.totals?.impressions || 0;
  const profileViews = summary?.totals?.profile_views || 0;
  const deltaFollowers = summary?.delta_followers || 0;
  
  const totalClicks = (summary?.totals?.website_clicks || 0) +  
                     (summary?.totals?.phone_call_clicks || 0) + 
                     (summary?.totals?.email_contacts || 0) + 
                     (summary?.totals?.get_directions_clicks || 0);

  const prevTotalClicks = (summary?.totals?.prev_website_clicks || 0) + 
                         (summary?.totals?.prev_phone_call_clicks || 0) + 
                         (summary?.totals?.prev_email_contacts || 0) + 
                         (summary?.totals?.prev_get_directions_clicks || 0);
  
  const clicksDelta = prevTotalClicks > 0 ? (((totalClicks - prevTotalClicks) / prevTotalClicks) * 100).toFixed(1) : 0;

  let genderAgeData = [];
  let genderData = [{name: 'Masculino', value: 0}, {name: 'Feminino', value: 0}];
  let topCities = [];
  
  if (Array.isArray(audience)) {
    const ageGender = audience.find(m => m.name === 'audience_gender_age');
    if (ageGender?.values?.[0]) {
      const vals = ageGender.values[0].value;
      const ages = ['18-24', '25-34', '35-44', '45-54'];
      genderAgeData = ages.map(age => ({
        age,
        Feminino: vals[`F.${age}`] || 0,
        Masculino: vals[`M.${age}`] || 0,
      }));
      
      let f = 0, m = 0;
      Object.entries(vals).forEach(([k, v]) => {
        if (k.startsWith('F.')) f += v;
        else if (k.startsWith('M.')) m += v;
      });
      genderData = [{name: 'Masculino', value: m}, {name: 'Feminino', value: f}];
    }
    
    const cityData = audience.find(m => m.name === 'audience_city');
    if (cityData?.values?.[0]) {
      topCities = Object.entries(cityData.values[0].value)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([city, count]) => ({ city: city.split(',')[0], count }));
    }
  }

  const chartData = snapshots?.map(s => ({
    date: s.date ? s.date.split('-').reverse().slice(0,2).join('/') : '',
    seguidores: s.followers || 0,
    alcance: s.reach || 0,
    impressoes: s.impressions || 0
  })) || [];

  return (
    <div className="modern-report-container">
      <style>{`
        .modern-report-container {
          --bg: #f8fafc;
          --card: #ffffff;
          --ink: #0f172a;
          --ink-soft: #475569;
          --ink-muted: #94a3b8;
          --line: #e2e8f0;
          --primary: #4f46e5;
          --primary-2: #6366f1;
          --primary-soft: #f5f3ff;
          --accent: #ec4899;
          --green: #10b981;
          --radius: 16px;
          --font-display: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-family: var(--font-display);
          background: var(--bg);
          color: var(--ink);
          min-height: 100vh;
          width: 100%;
          padding-bottom: 64px;
        }

        .hero {
          position: relative;
          background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
          color: #fff; padding: 48px; overflow: hidden;
        }
        .hero-top { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1; }
        .brand { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: .12em; }
        .brand-mark { width: 32px; height: 32px; border-radius: 8px; background: #fff; color: var(--primary); display: grid; place-items: center; font-weight: 800; }
        .period-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; background: rgba(255,255,255,0.1); border-radius: 999px; font-size: 12px; }
        .hero-title { margin-top: 32px; font-size: 38px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; }
        .hero-title em { font-style: normal; color: #f472b6; }
        .hero-stats { margin-top: 28px; display: flex; gap: 40px; padding-top: 22px; border-top: 1px solid rgba(255,255,255,0.12); }
        .hero-stat-label { font-size: 11px; text-transform: uppercase; color: rgba(255,255,255,0.5); }
        .hero-stat-value { font-size: 16px; font-weight: 700; }

        .report-main { max-width: 1200px; margin: -48px auto 0; padding: 0 24px; position: relative; z-index: 2; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .kpi { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
        .kpi-label { font-size: 11px; font-weight: 600; color: var(--ink-muted); text-transform: uppercase; letter-spacing: .08em; margin-bottom: 8px; }
        .kpi-value { font-size: 26px; font-weight: 800; color: var(--ink); }
        .kpi-foot { margin-top: 10px; font-size: 11px; color: var(--ink-soft); display: flex; align-items: center; gap: 4px; }
        
        .panel { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 24px; margin-bottom: 24px; }
        .panel-head { margin-bottom: 24px; }
        .panel-title { font-size: 17px; font-weight: 700; margin: 0; }
        .panel-sub { font-size: 12px; color: var(--ink-muted); margin-top: 4px; }

        .report-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        .report-table { width: 100%; border-collapse: collapse; }
        .report-table th { text-align: left; padding: 12px; background: #f8fafc; color: var(--ink-muted); font-size: 11px; text-transform: uppercase; }
        .report-table td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }

        @media (max-width: 900px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .report-grid-2 { grid-template-columns: 1fr; }
        }
      `}</style>

      <header className="hero">
        <div className="hero-top">
          <div className="brand">
            <div className="brand-mark">U</div>
            <span>UP REPORTS · Instagram Organic</span>
          </div>
          <div className="period-badge">{currentMonth} · Últimos 30 dias</div>
        </div>
        <h1 className="hero-title">Análise de <em>Crescimento</em><br/>Performance Orgânica</h1>
        <div className="hero-stats">
          <div><div className="hero-stat-label">Seguidores</div><div className="hero-stat-value">{followers.toLocaleString("pt-BR")}</div></div>
          <div><div className="hero-stat-label">Alcance</div><div className="hero-stat-value">{reach.toLocaleString("pt-BR")}</div></div>
          <div><div className="hero-stat-label">Engajamento</div><div className="hero-stat-value">{impressions.toLocaleString("pt-BR")}</div></div>
        </div>
      </header>

      <main className="report-main">
        <div className="kpi-grid">
          <div className="kpi">
            <div className="kpi-label">Novos Seguidores</div>
            <div className="kpi-value">{(deltaFollowers >= 0 ? "+" : "") + deltaFollowers.toLocaleString("pt-BR")}</div>
            <div className="kpi-foot">Variação no período</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Alcance das Contas</div>
            <div className="kpi-value">{reach.toLocaleString("pt-BR")}</div>
            <div className="kpi-foot">Contas únicas atingidas</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Visitas ao Perfil</div>
            <div className="kpi-value">{profileViews.toLocaleString("pt-BR")}</div>
            <div className="kpi-foot">Visualizações totais</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Cliques Totais</div>
            <div className="kpi-value">{totalClicks.toLocaleString("pt-BR")}</div>
            <div className="kpi-foot">{clicksDelta}% vs período anterior</div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3 className="panel-title">Crescimento de Seguidores</h3>
            <p className="panel-sub">Evolução diária da base de fãs</p>
          </div>
          <div style={{height: "300px"}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="seguidores" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSeg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="report-grid-2">
          <div className="panel">
            <div className="panel-head">
              <h3 className="panel-title">Distribuição por Gênero</h3>
            </div>
            <div style={{height: "260px"}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" label={({percent}) => `${(percent*100).toFixed(0)}%`}>
                    <Cell fill="#6366f1" />
                    <Cell fill="#ec4899" />
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} formatter={(value, entry) => {
                    const total = genderData.reduce((acc, d) => acc + d.value, 0);
                    const percent = total > 0 ? (entry.payload.value / total * 100).toFixed(1) : 0;
                    return `${value} (${percent}%)`;
                  }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3 className="panel-title">Principais Cidades</h3>
            </div>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Cidade</th>
                  <th style={{textAlign: "right"}}>Seguidores</th>
                </tr>
              </thead>
              <tbody>
                {topCities.map((c, i) => (
                  <tr key={i}>
                    <td>{c.city}</td>
                    <td style={{textAlign: "right", fontWeight: "700"}}>{c.count.toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer style={{textAlign: "center", padding: "32px", color: "var(--ink-muted)", fontSize: "12px"}}>
        Relatório Orgânico · UP REPORTS · {currentMonth}
      </footer>
    </div>
  );
};

const PaidTrafficReport = ({ client, ads, creatives }) => {
  const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  const spend = parseFloat(ads?.spend || 0);
  const clicks = parseInt(ads?.clicks || 0);
  const reach = parseInt(ads?.reach || 0);
  const impressions = parseInt(ads?.impressions || 0);
  const frequency = reach > 0 ? (impressions / reach).toFixed(2) : "0,00";
  
  const actions = ads?.actions || [];
  const visits = actions.reduce((sum, a) => {
    const conversionTypes = ['lead', 'contact', 'complete_registration', 'onsite_conversion.messaging_first_reply', 'onsite_conversion.messaging_conversation_started_7d', 'submit_application', 'post_engagement'];
    if (conversionTypes.includes(a.action_type)) return sum + parseInt(a.value || 0);
    return sum;
  }, 0);
  
  const engagement = actions.reduce((sum, a) => sum + parseInt(a.value || 0), 0);
  const followers = actions.find(a => a.action_type === 'follow' || a.action_type === 'page_like')?.value || 0;
  const cpa = visits > 0 ? (spend / visits).toFixed(2) : "0,00";

  const [activeMetric, setActiveMetric] = useState('visits');
  const [sortField, setSortField] = useState('spend');

  const getAdLeads = (cr) => (cr.actions || []).reduce((sum, act) => {
    const type = act.action_type.toLowerCase();
    if (type.includes('lead') || type.includes('contact') || type.includes('registration')) return sum + parseInt(act.value || 0);
    return sum;
  }, 0);

  const getAdConversations = (cr) => (cr.actions || []).reduce((sum, act) => {
    const type = act.action_type.toLowerCase();
    if (type.includes('messaging')) return sum + parseInt(act.value || 0);
    return sum;
  }, 0);

  const sortedCreatives = [...creatives].sort((a, b) => {
    if (sortField === 'spend') return parseFloat(b.spend || 0) - parseFloat(a.spend || 0);
    if (sortField === 'impressions') return parseInt(b.impressions || 0) - parseInt(a.impressions || 0);
    if (sortField === 'leads') return getAdLeads(b) - getAdLeads(a);
    if (sortField === 'conversations') return getAdConversations(b) - getAdConversations(a);
    if (sortField === 'freq') {
      const fA = parseInt(a.reach) > 0 ? (parseInt(a.impressions) / parseInt(a.reach)) : 0;
      const fB = parseInt(b.reach) > 0 ? (parseInt(b.impressions) / parseInt(b.reach)) : 0;
      return fB - fA;
    }
    return 0;
  });

  const chartData = creatives.slice(0, 5).map(c => {
    const c_visits = getAdLeads(c) + getAdConversations(c);
    return {
      name: c.ad_name.split('_')[0],
      fullName: c.ad_name,
      visits: c_visits,
      spend: parseFloat(c.spend || 0),
      impressions: parseInt(c.impressions || 0),
      engagement: (c.actions || []).reduce((sum, a) => sum + parseInt(a.value || 0), 0)
    };
  });

  const COLORS = ['#2563eb', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];

  return (
    <div className="modern-report-container">
      <style>{`
        .modern-report-container {
          --bg: #f5f7fb;
          --card: #ffffff;
          --ink: #0f172a;
          --ink-soft: #475569;
          --ink-muted: #94a3b8;
          --line: #e2e8f0;
          --primary: #1e3a8a;
          --primary-2: #2563eb;
          --primary-soft: #eff4ff;
          --accent: #8b5cf6;
          --green: #10b981;
          --rose: #f43f5e;
          --radius: 14px;
          --font-display: 'Plus Jakarta Sans', system-ui, sans-serif;
          font-family: var(--font-display);
          background: var(--bg);
          color: var(--ink);
          min-height: 100vh;
          width: 100%;
          padding-bottom: 64px;
        }

        .hero {
          position: relative;
          background: linear-gradient(135deg, #0f1e4d 0%, #1e3a8a 50%, #312e81 100%);
          color: #fff; padding: 40px 48px 80px; overflow: hidden;
        }
        .hero-top { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1; }
        .brand { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: .12em; }
        .brand-mark { width: 32px; height: 32px; border-radius: 8px; background: #fff; color: var(--primary); display: grid; place-items: center; font-weight: 800; }
        .period-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; background: rgba(255,255,255,0.1); border-radius: 999px; font-size: 12px; }
        .hero-title { margin-top: 32px; font-size: 38px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; }
        .hero-title em { font-style: normal; color: #fbbf24; }
        .hero-stats { margin-top: 28px; display: flex; gap: 40px; padding-top: 22px; border-top: 1px solid rgba(255,255,255,0.12); }
        .hero-stat-label { font-size: 11px; text-transform: uppercase; color: rgba(255,255,255,0.5); }
        .hero-stat-value { font-size: 16px; font-weight: 700; }

        .report-main { max-width: 1200px; margin: -56px auto 0; padding: 0 24px; position: relative; z-index: 2; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 14px; }
        .kpi { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 20px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
        .kpi-label { font-size: 11px; font-weight: 600; color: var(--ink-muted); text-transform: uppercase; letter-spacing: .08em; margin-bottom: 8px; }
        .kpi-value { font-size: 24px; font-weight: 800; color: var(--ink); }
        .kpi-foot { margin-top: 10px; font-size: 11px; color: var(--ink-soft); display: flex; align-items: center; gap: 4px; }

        .panel { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius); padding: 24px; margin-bottom: 24px; }
        .panel-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .panel-title { font-size: 16px; font-weight: 700; margin: 0; }
        .panel-sub { font-size: 12px; color: var(--ink-muted); }
        
        .toggle-group { display: flex; background: #f1f5f9; padding: 4px; border-radius: 8px; gap: 4px; }
        .toggle-group button { border: none; background: transparent; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; color: var(--ink-soft); }
        .toggle-group button.active { background: #fff; color: var(--primary-2); box-shadow: 0 1px 2px rgba(0,0,0,0.1); }

        .report-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .report-table th { text-align: left; padding: 12px; background: #f8fafc; color: var(--ink-muted); font-size: 11px; text-transform: uppercase; }
        .report-table td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; }
        .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; background: #ecfdf5; color: #047857; }
        
        .report-grid-2 {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        .insights-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .insight-card { background: #fff; border: 1px solid var(--line); border-left: 4px solid var(--primary-2); border-radius: 10px; padding: 16px; }
        .insight-card.good { border-left-color: var(--green); }
        .insight-card.warn { border-left-color: #f59e0b; }

        @media (max-width: 992px) {
          .report-grid-2 { grid-template-columns: 1fr; }
          .kpi-grid { grid-template-columns: repeat(2, 1fr); }
          .hero-stats { gap: 20px; }
          .hero-title { font-size: 32px; }
        }

        @media (max-width: 768px) {
          .hero { padding: 30px 24px 60px; }
          .hero-stats { display: grid; grid-template-columns: 1fr 1fr; }
          .kpi-grid { grid-template-columns: 1fr; }
          .insights-grid { grid-template-columns: 1fr; }
          .panel { overflow-x: auto; }
          .panel-head { flex-direction: column; gap: 12px; }
        }
      `}</style>

      <header className="hero">
        <div className="hero-top">
          <div className="brand">
            <div className="brand-mark">U</div>
            <span>UP REPORTS · Performance Ads</span>
          </div>
          <div className="period-badge">{currentMonth} · Últimos 30 dias</div>
        </div>
        <h1 className="hero-title">Relatório de <em>Desempenho</em><br/>Tráfego Pago · Meta Ads</h1>
        <p style={{marginTop: "12px", color: "rgba(255,255,255,0.7)", fontSize: "15px"}}>
          Análise consolidada de performance para <strong>{client?.name || "Cliente"}</strong>.
        </p>
        <div className="hero-stats">
          <div><div className="hero-stat-label">Investimento</div><div className="hero-stat-value">R$ {spend.toLocaleString("pt-BR")}</div></div>
          <div><div className="hero-stat-label">Alcance</div><div className="hero-stat-value">{reach.toLocaleString("pt-BR")}</div></div>
          <div><div className="hero-stat-label">Conversões</div><div className="hero-stat-value">{visits}</div></div>
          <div><div className="hero-stat-label">Status</div><div className="hero-stat-value">● Ativo</div></div>
        </div>
      </header>

      <main className="report-main">
        <section className="kpi-grid">
          <div className="kpi">
            <div className="kpi-label">Investimento</div>
            <div className="kpi-value">R$ {spend.toLocaleString("pt-BR", {minimumFractionDigits: 2})}</div>
            <div className="kpi-foot">Total no período</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Impressões</div>
            <div className="kpi-value">{impressions.toLocaleString("pt-BR")}</div>
            <div className="kpi-foot">Visualizações totais</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Alcance</div>
            <div className="kpi-value">{reach.toLocaleString("pt-BR")}</div>
            <div className="kpi-foot">Pessoas únicas</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Frequência</div>
            <div className="kpi-value">{frequency}</div>
            <div className="kpi-foot">Vezes por pessoa</div>
          </div>
        </section>

        <section className="kpi-grid">
          <div className="kpi">
            <div className="kpi-label">Visitas/Conversões</div>
            <div className="kpi-value">{visits.toLocaleString("pt-BR")}</div>
            <div className="kpi-foot" style={{color: "var(--green)"}}>+Resultado principal</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Custo por Visita</div>
            <div className="kpi-value">R$ {cpa.toLocaleString("pt-BR")}</div>
            <div className="kpi-foot" style={{color: "var(--green)"}}>CPA Médio</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Engajamento</div>
            <div className="kpi-value">{engagement.toLocaleString("pt-BR")}</div>
            <div className="kpi-foot">Ações totais</div>
          </div>
          <div className="kpi">
            <div className="kpi-label">Novos Seguidores</div>
            <div className="kpi-value">+{followers}</div>
            <div className="kpi-foot">Crescimento</div>
          </div>
        </section>

        <div style={{display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", marginBottom: "24px"}}>
          <div className="panel">
            <div className="panel-head">
              <div>
                <h3 className="panel-title">Comparativo de Anúncios</h3>
                <p className="panel-sub">Performance por criativo</p>
              </div>
              <div className="toggle-group">
                <button className={activeMetric === 'visits' ? 'active' : ''} onClick={() => setActiveMetric('visits')}>Visitas</button>
                <button className={activeMetric === 'spend' ? 'active' : ''} onClick={() => setActiveMetric('spend')}>Investimento</button>
                <button className={activeMetric === 'impressions' ? 'active' : ''} onClick={() => setActiveMetric('impressions')}>Impressões</button>
              </div>
            </div>
            <div style={{height: "300px"}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                  <RechartsTooltip contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey={activeMetric} fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3 className="panel-title">Investimento</h3>
            </div>
            <div style={{height: "300px"}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={chartData} 
                    dataKey="spend" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    innerRadius={60} 
                    outerRadius={80}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry) => {
                      const total = chartData.reduce((acc, d) => acc + d.spend, 0);
                      const percent = total > 0 ? (entry.payload.spend / total * 100).toFixed(1) : 0;
                      return `${value} (${percent}%)`;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3 className="panel-title">Detalhamento por Anúncio</h3>
              <p className="panel-sub">Análise individual por criativo</p>
            </div>
          </div>
          <table className="report-table">
            <thead>
              <tr>
                <th>Anúncio</th>
                <th>Status</th>
                <th onClick={() => setSortField('impressions')} style={{cursor: 'pointer'}}>
                  Impressões {sortField === 'impressions' && '▾'}
                </th>
                <th onClick={() => setSortField('freq')} style={{cursor: 'pointer'}}>
                  Freq. {sortField === 'freq' && '▾'}
                </th>
                <th onClick={() => setSortField('spend')} style={{cursor: 'pointer'}}>
                  Investimento {sortField === 'spend' && '▾'}
                </th>
                <th onClick={() => setSortField('leads')} style={{cursor: 'pointer'}}>
                  Leads {sortField === 'leads' && '▾'}
                </th>
                <th onClick={() => setSortField('conversations')} style={{cursor: 'pointer'}}>
                  Conversas {sortField === 'conversations' && '▾'}
                </th>
                <th>CPA</th>
              </tr>
            </thead>
            <tbody>
              {sortedCreatives.map((c, i) => {
                const c_spend = parseFloat(c.spend || 0);
                const c_impressions = parseInt(c.impressions || 0);
                const c_reach = parseInt(c.reach || 0);
                const c_freq = c_reach > 0 ? (c_impressions / c_reach).toFixed(2) : "0.00";
                const c_leads = getAdLeads(c);
                const c_convs = getAdConversations(c);
                const c_total = c_leads + c_convs;
                const c_cpa = c_total > 0 ? (c_spend / c_total).toFixed(2) : "0.00";

                return (
                  <tr key={c.ad_id}>
                    <td style={{fontWeight: "600"}}>{c.ad_name}</td>
                    <td><span className="status-badge">● Ativo</span></td>
                    <td>{c_impressions.toLocaleString("pt-BR")}</td>
                    <td>{c_freq}</td>
                    <td>R$ {c_spend.toLocaleString("pt-BR")}</td>
                    <td><strong>{c_leads}</strong></td>
                    <td><strong>{c_convs}</strong></td>
                    <td>R$ {c_cpa}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="insights-grid">
          <div className="insight-card good">
            <h4 style={{margin: "0 0 8px", fontSize: "12px", textTransform: "uppercase"}}>Performance Positiva</h4>
            <p style={{margin: 0, fontSize: "13px"}}>O CPA médio de R$ {cpa} está dentro da meta esperada para o período de {currentMonth}.</p>
          </div>
          <div className="insight-card">
            <h4 style={{margin: "0 0 8px", fontSize: "12px", textTransform: "uppercase"}}>Alcance e Frequência</h4>
            <p style={{margin: 0, fontSize: "13px"}}>A frequência de {frequency} indica que o público está sendo impactado mais de duas vezes, ideal para memorização.</p>
          </div>
          <div className="insight-card warn">
            <h4 style={{margin: "0 0 8px", fontSize: "12px", textTransform: "uppercase"}}>Próximos Passos</h4>
            <p style={{margin: 0, fontSize: "13px"}}>Recomendamos otimizar os criativos com CTR abaixo da média para reduzir ainda mais o CPA.</p>
          </div>
        </div>
      </main>

      <footer style={{textAlign: "center", padding: "32px", color: "var(--ink-muted)", fontSize: "12px"}}>
        Relatório gerado via <strong>UP REPORTS</strong> · {currentMonth}
      </footer>
    </div>
  );
}

export default function App() {
  const [auth, setAuth] = useState(() => {
    try {
      const raw = localStorage.getItem("meta_dash_auth")
      return raw ? JSON.parse(raw) : null
    } catch (e) {
      return null
    }
  })

  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  
  // Dashboard Data
  const [profile, setProfile] = useState(null)
  const [media, setMedia] = useState([])
  const [audience, setAudience] = useState(null)
  const [ads, setAds] = useState(null)
  const [summary, setSummary] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [stories, setStories] = useState([])
  const [adAccounts, setAdAccounts] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [adCreatives, setAdCreatives] = useState([])
  const [reportHistory, setReportHistory] = useState([])
  
  const [loading, setLoading] = useState(false)
  const [loadingAdsData, setLoadingAdsData] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [tab, setTab] = useState("dashboard")
  const [showAddModal, setShowAddModal] = useState(false)
  const [toasts, setToasts] = useState([])
  const [oauthPending, setOauthPending] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [completingOauth, setCompletingOauth] = useState(false)

  const [theme, setTheme] = useState(() => localStorage.getItem("meta_dash_theme") || "dark")
  const [reportConfig, setReportConfig] = useState(null)
  
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("meta_dash_theme", theme)
  }, [theme])

  const startReportConfig = (clientId) => {
    setSelectedClient(clientId)
    const client = clients.find(c => c.id === clientId)
    setReportConfig({ 
      active: true, 
      objective: 'all', 
      days: 30, 
      ad_account_id: client?.ad_account_id || null, 
      campaign_ids: [] 
    })
  }

  const loadHistoricalReport = (r) => {
    setReportConfig({
      active: false,
      objective: r.report_type,
      days: r.period_days,
      ad_account_id: r.ad_account_id,
      campaign_ids: r.campaign_ids || [],
      startDate: r.start_date, // assuming backend might store these eventually
      endDate: r.end_date
    });
    
    if (r.report_type === 'paid') setTab("ads");
    else if (r.report_type === 'organic') setTab("report");
    else setTab("dashboard");
    
    // fetchData will be triggered by useEffect [selectedClient] OR we manually call it if selectedClient didn't change
    fetchData();
    pushToast("Relatório histórico carregado.");
  }


  const authFetch = (url, options = {}) => {
    return fetch(url, {
      ...options,
      mode: 'cors',
      credentials: 'omit', // JWT doesn't need cookies, omit is safer for cross-origin if not using them
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${auth?.access_token}`,
      },
    })
  }

  const pushToast = (message, type = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500)
  }

  const dismissToast = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  const openOauthPicker = async (oauthSession, autoPageId = null, autoAdAccountId = null) => {
    try {
      const r = await authFetch(`${API}/api/v1/oauth/meta/pending/${oauthSession}`)
      const data = await r.json()
      if (!r.ok) throw new Error(data?.detail || "Não foi possível carregar páginas")
      setOauthPending(data)
      setShowPicker(true)

      if (autoPageId) {
        await completeOauthSelection(oauthSession, autoPageId, autoAdAccountId)
      }
    } catch (e) {
      pushToast(e.message, "error")
    }
  }

  const completeOauthSelection = async (oauthSession, pageId, adAccountId = null) => {
    setCompletingOauth(true)
    try {
      const r = await authFetch(`${API}/api/v1/oauth/meta/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oauth_session: oauthSession, page_id: pageId, ad_account_id: adAccountId }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.detail || "Falha ao concluir conexão")
      pushToast(`Cliente ${data.client_name} conectado com sucesso.`)
      setShowPicker(false)
      setOauthPending(null)
      loadClients()
    } catch (e) {
      pushToast(e.message, "error")
    } finally {
      setCompletingOauth(false)
    }
  }

  const handleLogin = (payload) => {
    setAuth(payload)
    localStorage.setItem("meta_dash_auth", JSON.stringify(payload))
  }

  const handleLogout = () => {
    localStorage.removeItem("meta_dash_auth")
    setAuth(null)
    setClients([])
    setSelectedClient(null); setReportConfig(null)
    setProfile(null)
    setMedia([])
    setAudience(null)
    setSummary(null)
    setAds(null)
    setStories([])
  }


  const renameClient = async (id, currentName) => {
    const newName = prompt("Digite o novo nome do projeto:", currentName)
    if (!newName || newName.trim() === "" || newName === currentName) return
    try {
      const r = await authFetch(`${API}/api/v1/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() })
      })
      if (!r.ok) throw new Error("Falha ao renomear cliente")
      pushToast("Projeto renomeado com sucesso")
      loadClients()
    } catch(e) {
      pushToast(e.message, "error")
    }
  }

  const loadClients = async () => {
    try {
      const r = await authFetch(`${API}/api/v1/clients/`)
      if (r.status === 401) return handleLogout()
      const data = await r.json()
      setClients(Array.isArray(data) ? data : [])
    } catch (e) {
      setClients([])
    }
  }

  const loadAdAccounts = async () => {
    if (!selectedClient) return
    setLoadingAdsData(true)
    try {
      const r = await authFetch(`${API}/api/v1/ads/accounts?client_id=${selectedClient}`)
      const data = await r.json()
      setAdAccounts(data.data || [])
    } catch (e) {
      pushToast("Erro ao carregar contas de anúncio", "error")
    } finally {
      setLoadingAdsData(false)
    }
  }

  const loadCampaigns = async (accountId) => {
    if (!selectedClient || !accountId) return
    setLoadingAdsData(true)
    try {
      const r = await authFetch(`${API}/api/v1/ads/campaigns?client_id=${selectedClient}&ad_account_id=${accountId}`)
      const data = await r.json()
      setCampaigns(data.data || [])
    } catch (e) {
      pushToast("Erro ao carregar campanhas", "error")
    } finally {
      setLoadingAdsData(false)
    }
  }

  const fetchData = async () => {
    if (!selectedClient || !reportConfig) return
    setLoading(true)
    setFetchError(null)
    const isCustom = reportConfig.days === 'custom'
    const days = isCustom ? 30 : (reportConfig.days || 30)
    const dateParams = isCustom && reportConfig.startDate && reportConfig.endDate 
      ? `&start_date=${reportConfig.startDate}&end_date=${reportConfig.endDate}`
      : `&days=${days}`

    try {
      // Coleta é pesada e pode dar timeout. Tentamos, mas não deixamos travar tudo.
      try {
        await authFetch(`${API}/api/v1/reports/snapshots/collect?client_id=${selectedClient}`, { method: 'POST' })
      } catch (e) {
        console.warn("Coleta expirou ou falhou, prosseguindo com dados existentes", e)
      }
      
      const isOrganic = reportConfig.objective === 'all' || reportConfig.objective === 'organic'
      const isPaid = reportConfig.objective === 'all' || reportConfig.objective === 'paid'

      const reqs = [
        authFetch(`${API}/api/v1/instagram/profile?client_id=${selectedClient}`),
        authFetch(`${API}/api/v1/reports/summary?client_id=${selectedClient}${dateParams}`),
        authFetch(`${API}/api/v1/reports/snapshots?client_id=${selectedClient}${dateParams}`),
      ]

      if (isOrganic) {
        reqs.push(authFetch(`${API}/api/v1/instagram/media?client_id=${selectedClient}${dateParams}`))
        reqs.push(authFetch(`${API}/api/v1/instagram/audience?client_id=${selectedClient}`))
        reqs.push(authFetch(`${API}/api/v1/instagram/stories/history?client_id=${selectedClient}${dateParams}`))
      } else {
        reqs.push(Promise.resolve({ ok: true, json: () => Promise.resolve({data: []}) }))
        reqs.push(Promise.resolve({ ok: true, json: () => Promise.resolve({data: []}) }))
        reqs.push(Promise.resolve({ ok: true, json: () => Promise.resolve({data: []}) }))
      }

      if (isPaid) {
        let adsUrl = `${API}/api/v1/ads/insights?client_id=${selectedClient}${dateParams}`
        let creUrl = `${API}/api/v1/ads/creatives?client_id=${selectedClient}${dateParams}`
        if (reportConfig.ad_account_id) {
          adsUrl += `&ad_account_id=${reportConfig.ad_account_id}`
          creUrl += `&ad_account_id=${reportConfig.ad_account_id}`
        }
        if (reportConfig.campaign_ids?.length > 0) {
          adsUrl += `&campaign_ids=${reportConfig.campaign_ids.join(',')}`
          creUrl += `&campaign_ids=${reportConfig.campaign_ids.join(',')}`
        }
        reqs.push(authFetch(adsUrl))
        reqs.push(authFetch(creUrl))
      } else {
        reqs.push(Promise.resolve({ ok: true, json: () => Promise.resolve({data: [{reach:0, impressions:0}]}) }))
        reqs.push(Promise.resolve({ ok: true, json: () => Promise.resolve({data: []}) }))
      }

      const results = await Promise.all(reqs)
      const [profRes, sumRes, snapRes, medRes, audRes, storiesRes, adsRes, creRes] = results
      
      if (profRes.status === 401) return handleLogout()
      
      setProfile(profRes.ok ? await profRes.json() : null)
      
      const sumData = sumRes.ok ? await sumRes.json() : null
      setSummary(sumData?.detail ? null : sumData)
      
      const snapData = snapRes.ok ? await snapRes.json() : []
      setSnapshots(Array.isArray(snapData) ? snapData : [])
      
      const m = medRes.ok ? await medRes.json() : { data: [] }
      setMedia(Array.isArray(m?.data) ? m.data : [])
      
      const a = audRes.ok ? await audRes.json() : { data: [] }
      setAudience(Array.isArray(a?.data) ? a.data : [])
      
      const sts = storiesRes.ok ? await storiesRes.json() : { data: [] }
      setStories(Array.isArray(sts?.data) ? sts.data : [])

      const ad = adsRes.ok ? await adsRes.json() : { data: [] }
      setAds(Array.isArray(ad?.data) ? (ad.data[0] ?? {reach: 0, impressions: 0}) : {reach: 0, impressions: 0})

      const cre = creRes.ok ? await creRes.json() : { data: [] }
      setAdCreatives(Array.isArray(cre?.data) ? cre.data : [])
      
    } catch(e) {
      console.error(e)
      setFetchError(e.message === 'Failed to fetch' ? 'Erro de conexão com o servidor (Failed to fetch). Verifique se o backend está rodando na porta 8001.' : e.message || "Erro ao carregar métricas. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (auth?.access_token) loadClients() }, [auth?.access_token])
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const oauthStatus = params.get("oauth_status")
    const oauthSession = params.get("oauth_session")
    const autoPageId = params.get("auto_page_id")
    const autoAdAccountId = params.get("auto_ad_account_id")
    if (!oauthStatus) return

    if (oauthStatus === "select" && oauthSession) {
      openOauthPicker(oauthSession, autoPageId, autoAdAccountId)
    } else if (oauthStatus === "error_no_instagram") {
      pushToast("Conta conectada sem Instagram Business vinculado.", "error")
    } else if (oauthStatus === "error_no_pages") {
      pushToast("Nenhuma página encontrada na conta conectada.", "error")
    } else {
      pushToast("Falha ao conectar conta Meta.", "error")
    }

    window.history.replaceState({}, "", window.location.pathname)
  }, [])

  useEffect(() => { if (selectedClient) fetchData() }, [selectedClient])
  useEffect(() => {
    if (selectedClient) {
      authFetch(`${API}/api/v1/reports/history?client_id=${selectedClient}`)
        .then(res => res.json())
        .then(data => setReportHistory(Array.isArray(data) ? data : []))
        .catch(e => console.error("Failed to fetch history", e));
    }
  }, [selectedClient]);

  // Auth check moved below hooks to avoid violation

  const NavItem = ({ icon: Icon, label, active, onClick }) => (
    <button onClick={onClick} className={`nav-item${active ? ' active' : ''}`} style={{fontFamily:'inherit'}}>
      <Icon size={16}/> {label}
    </button>
  )
  
  // -- Data processing for charts --
  
  // Gender/Age processing
  let genderAgeData = [];
  let genderData = [{name: 'Feminino', value: 0}, {name: 'Masculino', value: 0}, {name: 'Desconhecido', value: 0}];
  let topCities = [];
  
  if (Array.isArray(audience)) {
    const ageGender = audience.find(m => m.name === 'audience_gender_age');
    if (ageGender && ageGender.values && ageGender.values[0]) {
      const vals = ageGender.values[0].value;
      const ages = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
      genderAgeData = ages.map(age => {
        return {
          age,
          Feminino: vals[`F.${age}`] || 0,
          Masculino: vals[`M.${age}`] || 0,
          Desconhecido: vals[`U.${age}`] || 0
        }
      });
      
      let f = 0, m = 0, u = 0;
      Object.entries(vals).forEach(([k, v]) => {
        if (k.startsWith('F.')) f += v;
        else if (k.startsWith('M.')) m += v;
        else u += v;
      });
      genderData = [{name: 'Feminino', value: f}, {name: 'Masculino', value: m}, {name: 'Desconhecido', value: u}];
    }
    
    const cityData = audience.find(m => m.name === 'audience_city');
    if (cityData && cityData.values && cityData.values[0]) {
      const vals = cityData.values[0].value;
      topCities = Object.entries(vals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([city, count]) => {
          const parts = city.split(',');
          return { city: parts[0] + (parts[1] ? ', ' + parts[1] : ''), count };
        });
    }
  }
  
  // Snapshot processing for daily reach
  const dailyReachData = Array.isArray(snapshots) ? snapshots.map(s => ({
    date: s.date ? s.date.split('-').reverse().join('/') : '',
    alcance: s.reach || 0
  })) : [];
  
  // Post level aggregations
  let totalSaves = 0;
  let totalShares = 0;
  let totalComments = 0;
  let totalLikes = 0;
  let totalPostReach = 0;
  
  if (Array.isArray(media)) {
    media.forEach(m => {
      totalSaves += m.insights?.saved || 0;
      totalShares += m.insights?.shares || 0;
      totalComments += m.comments_count || 0;
      totalLikes += m.like_count || 0;
      totalPostReach += m.insights?.reach || 0;
    });
  }
  
  const totalInteractions = totalSaves + totalShares + totalComments + totalLikes;
  
  // Stories aggregations
  let totalStoryViews = 0;
  let totalStoryReach = 0;
  let totalStoryInteractions = 0;
  let totalStoryReplies = 0;
  let totalStoryShares = 0;

  if (Array.isArray(stories)) {
    stories.forEach(s => {
      totalStoryViews += s.impressions || 0;
      totalStoryReach += s.reach || 0;
      totalStoryReplies += s.replies || 0;
      totalStoryShares += s.shares || 0;
      totalStoryInteractions += (s.replies || 0) + (s.shares || 0) + (s.profile_visits || 0);
    });
  }
  
  const today = new Date();
  const prior = new Date();
  prior.setDate(today.getDate() - 30);
  const dateRangeLabel = `${prior.toLocaleDateString('pt-BR')} a ${today.toLocaleDateString('pt-BR')}`;

  const reels = Array.isArray(media) ? media.filter(m => m.media_type === 'VIDEO').sort((a,b) => (b.insights?.reach || 0) - (a.insights?.reach || 0)) : [];



  useEffect(() => {
    if (reportConfig?.objective === 'all' || reportConfig?.objective === 'paid') {
      loadAdAccounts();
    }
  }, [reportConfig?.objective]);

  useEffect(() => {
    if (reportConfig?.ad_account_id) {
      loadCampaigns(reportConfig.ad_account_id);
    }
  }, [reportConfig?.ad_account_id]);

  const renderSetup = () => {
    const objectives = [
      { value: 'all',     icon: '📊', label: 'Orgânico + Tráfego Pago', desc: 'Visão completa: Instagram e Ads' },
      { value: 'organic', icon: '🌿', label: 'Apenas Orgânico',          desc: 'Posts, Stories e seguidores' },
      { value: 'paid',    icon: '📣', label: 'Apenas Tráfego Pago',      desc: 'Campanhas e investimento em Ads' },
    ]
    const periods = [
      { days: 7,   label: '7 dias' },
      { days: 30,  label: '30 dias' },
      { days: 90,  label: '90 dias' },
      { days: 180, label: '6 meses' },
      { days: 365, label: '1 ano' },
      { days: 'custom', label: 'Personalizado' },
    ]

    const isPaid = reportConfig.objective === 'all' || reportConfig.objective === 'paid';

    return (
      <div style={{display:"grid", gridTemplateColumns: reportHistory.length > 0 ? "1fr 340px" : "1fr", gap:"40px", padding:"48px 40px", maxWidth: reportHistory.length > 0 ? "1100px" : "620px", margin:"0 auto", width:"100%"}}>
        <div>
          <div style={{marginBottom:"36px"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"4px 12px",background:"var(--accent-soft)",borderRadius:"100px",marginBottom:"12px"}}>
              <span style={{fontSize:"11px",fontWeight:"700",color:"var(--accent-light)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Novo Relatório</span>
            </div>
            <h1 style={{fontSize:"26px",fontWeight:"800",color:"var(--text-primary)",letterSpacing:"-0.5px",marginBottom:"6px"}}>Configurar Relatório</h1>
            <p style={{fontSize:"14px",color:"var(--text-muted)"}}>Escolha o foco e o período para gerar sua análise.</p>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:"24px"}}>
            {loadingAdsData && (
              <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"8px 12px",background:"var(--accent-soft)",borderRadius:"8px",fontSize:"12px",color:"var(--accent-light)"}}>
                <RefreshCw size={12} style={{animation:"spin 1s linear infinite"}}/>
                Carregando dados de anúncios...
              </div>
            )}
            {/* Objetivo */}
            <div>
              <p style={{fontSize:"13px",fontWeight:"700",color:"var(--text-secondary)",marginBottom:"12px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Objetivo</p>
              <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                {objectives.map(obj => (
                  <button
                    key={obj.value}
                    className={`objective-card${reportConfig.objective === obj.value ? ' selected' : ''}`}
                    onClick={() => setReportConfig({...reportConfig, objective: obj.value, ad_account_id: null, campaign_ids: []})}
                    style={{fontFamily:"inherit",width:"100%",border:"none",cursor:"pointer",textAlign:"left"}}
                  >
                    <div style={{fontSize:"22px",lineHeight:1}}>{obj.icon}</div>
                    <div>
                      <div style={{fontSize:"14px",fontWeight:"600",color:reportConfig.objective===obj.value?"var(--accent-light)":"var(--text-primary)",marginBottom:"2px"}}>{obj.label}</div>
                      <div style={{fontSize:"12.5px",color:"var(--text-muted)"}}>{obj.desc}</div>
                    </div>
                    {reportConfig.objective === obj.value && (
                      <div style={{marginLeft:"auto"}}><Check size={16} color="var(--accent-light)"/></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Ad Account Selection (only if paid) */}
            {isPaid && (
              <div>
                <p style={{fontSize:"13px",fontWeight:"700",color:"var(--text-secondary)",marginBottom:"12px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Conta de Anúncios</p>
                <select 
                  value={reportConfig.ad_account_id || ""}
                  onChange={(e) => setReportConfig({...reportConfig, ad_account_id: e.target.value, campaign_ids: []})}
                  className="form-input"
                  style={{width:"100%"}}
                >
                  <option value="">Selecione uma conta</option>
                  {adAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Campaign Selection (only if ad account selected) */}
            {isPaid && reportConfig.ad_account_id && (
              <div>
                <p style={{fontSize:"13px",fontWeight:"700",color:"var(--text-secondary)",marginBottom:"12px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Campanhas</p>
                <div style={{maxHeight:"200px", overflowY:"auto", background:"var(--bg-card)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"8px"}}>
                  <div 
                    onClick={() => {
                      const allIds = campaigns.map(c => c.id);
                      const isAllSelected = reportConfig.campaign_ids?.length === campaigns.length;
                      setReportConfig({...reportConfig, campaign_ids: isAllSelected ? [] : allIds});
                    }}
                    style={{padding:"8px", cursor:"pointer", display:"flex", alignItems:"center", gap:"10px", fontSize:"13px", color:"var(--text-primary)", borderBottom:"1px solid var(--border)"}}
                  >
                     <input type="checkbox" checked={reportConfig.campaign_ids?.length === campaigns.length && campaigns.length > 0} readOnly />
                     <b>Selecionar Todas</b>
                  </div>
                  {campaigns.map(camp => (
                    <div 
                      key={camp.id}
                      onClick={() => {
                        const current = reportConfig.campaign_ids || [];
                        const next = current.includes(camp.id) ? current.filter(id => id !== camp.id) : [...current, camp.id];
                        setReportConfig({...reportConfig, campaign_ids: next});
                      }}
                      style={{padding:"8px", cursor:"pointer", display:"flex", alignItems:"center", gap:"10px", fontSize:"13px", color:"var(--text-primary)"}}
                    >
                      <input type="checkbox" checked={reportConfig.campaign_ids?.includes(camp.id)} readOnly />
                      <span>{camp.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Período */}
            <div>
              <p style={{fontSize:"13px",fontWeight:"700",color:"var(--text-secondary)",marginBottom:"12px",textTransform:"uppercase",letterSpacing:"0.05em"}}>Período</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginBottom: reportConfig.days === 'custom' ? "16px" : "0"}}>
                {periods.map(p => (
                  <button
                    key={p.days}
                    className={`period-chip${reportConfig.days === p.days ? ' selected' : ''}`}
                    onClick={() => setReportConfig({...reportConfig, days: p.days})}
                    style={{fontFamily:"inherit",border:"none",cursor:"pointer"}}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {reportConfig.days === 'custom' && (
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", padding:"16px", background:"var(--bg-subtle-5)", borderRadius:"12px", border:"1px solid var(--border)"}}>
                  <div>
                    <label style={{fontSize:"11px", color:"var(--text-muted)", display:"block", marginBottom:"6px"}}>Data inicial</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={reportConfig.startDate || ""} 
                      onChange={(e) => setReportConfig({...reportConfig, startDate: e.target.value})}
                      style={{width:"100%", background:"var(--bg-card)"}}
                    />
                  </div>
                  <div>
                    <label style={{fontSize:"11px", color:"var(--text-muted)", display:"block", marginBottom:"6px"}}>Data final</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={reportConfig.endDate || ""} 
                      onChange={(e) => setReportConfig({...reportConfig, endDate: e.target.value})}
                      style={{width:"100%", background:"var(--bg-card)"}}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              className="btn-primary"
              disabled={isPaid && !reportConfig.ad_account_id}
              onClick={async () => { 
                const client = clients.find(c => c.id === selectedClient);
                
                // 1. Persist Ad Account if changed
                if (reportConfig.ad_account_id && reportConfig.ad_account_id !== client?.ad_account_id) {
                  try {
                    await authFetch(`${API}/api/v1/clients/${selectedClient}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: client.name, ad_account_id: reportConfig.ad_account_id })
                    });
                    // Update local client state
                    setClients(clients.map(c => c.id === selectedClient ? {...c, ad_account_id: reportConfig.ad_account_id} : c));
                  } catch (e) { console.error("Failed to save ad account", e); }
                }

                // 2. Save to History
                try {
                  const histRes = await authFetch(`${API}/api/v1/reports/history`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      client_id: selectedClient,
                      report_type: reportConfig.objective,
                      period_days: reportConfig.days,
                      objective: reportConfig.objective,
                      ad_account_id: reportConfig.ad_account_id,
                      campaign_ids: reportConfig.campaign_ids
                    })
                  });
                  if (histRes.ok) {
                    // Refresh history list
                    authFetch(`${API}/api/v1/reports/history?client_id=${selectedClient}`)
                      .then(res => res.json())
                      .then(data => setReportHistory(Array.isArray(data) ? data : []))
                      .catch(e => console.error("Failed to fetch history after save", e));
                  }
                } catch (e) { console.error("Failed to save history", e); }

                setReportConfig({...reportConfig, active: false}); 
                if (reportConfig.objective === 'paid') setTab("ads");
                else if (reportConfig.objective === 'organic') setTab("report");
                else setTab("dashboard");
                fetchData(); 
              }}
              style={{width:"100%",padding:"14px",fontSize:"15px",marginTop:"8px", opacity: (isPaid && !reportConfig.ad_account_id) ? 0.5 : 1}}
            >
              Gerar Relatório →
            </button>
          </div>
        </div>

        {reportHistory.length > 0 && (
          <div style={{borderLeft:"1px solid var(--border)", paddingLeft:"40px"}}>
            <div style={{marginBottom:"24px"}}>
              <h2 style={{fontSize:"16px",fontWeight:"700",color:"var(--text-primary)",marginBottom:"4px"}}>Relatórios Recentes</h2>
              <p style={{fontSize:"12.5px",color:"var(--text-muted)"}}>Acesse rapidamente relatórios gerados anteriormente.</p>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              {reportHistory.slice(0, 5).map(r => (
                <div 
                  key={r.id} 
                  className="card" 
                  style={{padding:"14px", cursor:"pointer", transition:"all 0.2s"}}
                  onClick={() => loadHistoricalReport(r)}
                >
                  <div style={{display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px"}}>
                    <div style={{width:"28px",height:"28px",borderRadius:"6px",background:r.report_type==='paid'?'#3b82f620':r.report_type==='organic'?'#a855f720':'#10b98120',display:"grid",placeItems:"center",color:r.report_type==='paid'?'#3b82f6':r.report_type==='organic'?'#a855f7':'#10b981'}}>
                      {r.report_type==='paid' ? <BarChart2 size={14}/> : r.report_type==='organic' ? <FileText size={14}/> : <LayoutDashboard size={14}/>}
                    </div>
                    <span style={{fontSize:"13px",fontWeight:"600",color:"var(--text-primary)"}}>
                      {r.report_type === 'all' ? 'Completo' : r.report_type === 'paid' ? 'Tráfego Pago' : 'Orgânico'}
                    </span>
                  </div>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                    <span style={{fontSize:"11px", color:"var(--text-muted)"}}>Últimos {r.period_days} dias</span>
                    <span style={{fontSize:"11px", color:"var(--text-faint)"}}>
                      {new Date(r.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div style={{display:"flex", gap:"8px", marginTop:"4px"}}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); window.open(`${API}/api/v1/reports/export/pdf?client_id=${selectedClient}&days=${r.period_days}`, '_blank'); }}
                      style={{background:"transparent", border:"none", color:"var(--text-muted)", fontSize:"10px", cursor:"pointer", display:"flex", alignItems:"center", gap:"4px"}}
                    >
                      <Download size={10}/> PDF
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); window.open(`${API}/api/v1/reports/export/csv?client_id=${selectedClient}&days=${r.period_days}`, '_blank'); }}
                      style={{background:"transparent", border:"none", color:"var(--text-muted)", fontSize:"10px", cursor:"pointer", display:"flex", alignItems:"center", gap:"4px"}}
                    >
                      <Download size={10}/> CSV
                    </button>
                  </div>
                </div>
              ))}
              <button 
                onClick={() => { setReportConfig({...reportConfig, active: false}); setTab("history"); }}
                style={{background:"transparent", border:"none", color:"var(--accent-light)", fontSize:"12px", fontWeight:"600", cursor:"pointer", textAlign:"center", padding:"8px"}}
              >
                Ver histórico completo →
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }
    )
  }
  const renderHistory = () => (
    <div style={{padding:"24px 0"}}>
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))", gap:"20px"}}>
        {reportHistory.length === 0 ? (
          <div style={{gridColumn:"1/-1", padding:"80px 20px", textAlign:"center", background:"var(--bg-card)", borderRadius:"16px", border:"1px solid var(--border)"}}>
            <p style={{color:"var(--text-muted)", fontSize:"14px"}}>Nenhum relatório gerado anteriormente.</p>
          </div>
        ) : reportHistory.map(r => (
          <div 
            key={r.id} 
            className="card" 
            style={{display:"flex", flexDirection:"column", gap:"16px", position:"relative", transition: "transform 0.2s, border-color 0.2s"}}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--accent-soft)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
              <div style={{display:"flex", alignItems:"center", gap:"12px"}}>
                <div style={{width:"40px",height:"40px",borderRadius:"10px",background:r.report_type==='paid'?'#3b82f620':r.report_type==='organic'?'#a855f720':'#10b98120',display:"grid",placeItems:"center",color:r.report_type==='paid'?'#3b82f6':r.report_type==='organic'?'#a855f7':'#10b981'}}>
                  {r.report_type==='paid' ? <BarChart2 size={20}/> : r.report_type==='organic' ? <FileText size={20}/> : <LayoutDashboard size={20}/>}
                </div>
                <div>
                  <div style={{fontSize:"14px", fontWeight:"700", color:"var(--text-primary)"}}>
                    {r.report_type === 'all' ? 'Completo (Orgânico + Pago)' : r.report_type === 'paid' ? 'Tráfego Pago' : 'Relatório Orgânico'}
                  </div>
                  <div style={{fontSize:"11px", color:"var(--text-muted)", marginTop:"2px", textTransform:"uppercase", letterSpacing:"0.05em"}}>
                    Gerado em {new Date(r.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              <div style={{display:"flex", gap:"8px"}}>
                <button 
                  className="btn-icon" 
                  title="Exportar PDF"
                  onClick={(e) => { e.stopPropagation(); window.open(`${API}/api/v1/reports/export/pdf?client_id=${selectedClient}&days=${r.period_days}`, '_blank'); }}
                  style={{width:"32px", height:"32px"}}
                >
                  <FileText size={14}/>
                </button>
                <button 
                  className="btn-icon" 
                  title="Exportar CSV"
                  onClick={(e) => { e.stopPropagation(); window.open(`${API}/api/v1/reports/export/csv?client_id=${selectedClient}&days=${r.period_days}`, '_blank'); }}
                  style={{width:"32px", height:"32px"}}
                >
                  <Download size={14}/>
                </button>
              </div>
            </div>

            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", padding:"12px", background:"var(--bg-subtle)", borderRadius:"12px"}}>
              <div>
                <div style={{fontSize:"10px", color:"var(--text-faint)", fontWeight:"700", textTransform:"uppercase", marginBottom:"4px"}}>Período</div>
                <div style={{fontSize:"13px", color:"var(--text-secondary)", fontWeight:"600"}}>Últimos {r.period_days} dias</div>
              </div>
              <div>
                <div style={{fontSize:"10px", color:"var(--text-faint)", fontWeight:"700", textTransform:"uppercase", marginBottom:"4px"}}>Objetivo</div>
                <div style={{fontSize:"13px", color:"var(--text-secondary)", fontWeight:"600", textTransform:"capitalize"}}>{r.objective || 'Visão Geral'}</div>
              </div>
            </div>

            {r.campaign_ids && r.campaign_ids.length > 0 && (
              <div>
                <div style={{fontSize:"10px", color:"var(--text-faint)", fontWeight:"700", textTransform:"uppercase", marginBottom:"6px"}}>Campanhas selecionadas</div>
                <div style={{display:"flex", flexWrap:"wrap", gap:"4px"}}>
                  {r.campaign_ids.length} campanha(s) vinculada(s)
                </div>
              </div>
            )}

            <button 
              className="btn-primary" 
              style={{marginTop:"auto", width:"100%", padding:"10px", fontSize:"13px"}}
              onClick={() => loadHistoricalReport(r)}
            >
              Visualizar Relatório
            </button>
          </div>
        ))}
      </div>
    </div>
  )


  const renderHome = () => (
    <div className="home-shell">
      <div className="home-header">
        <div className="home-badge">Painel Administrativo</div>
        <h1 style={{fontSize:"30px",fontWeight:"800",color:"var(--text-primary)",letterSpacing:"-0.6px",marginBottom:"8px"}}>Meus Projetos</h1>
        <p style={{fontSize:"14px",color:"var(--text-muted)",lineHeight:1.6}}>Gerencie clientes, acesse dashboards e acompanhe as métricas em um único painel.</p>
      </div>
      <div className="project-grid">
        {clients.map(c => (
          <div key={c.id} className="project-card">
            <div className="project-card-head">
              {c.profile_picture_url ? (
                <img 
                  src={c.profile_picture_url} 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'grid';
                  }}
                  style={{width:"46px",height:"46px",borderRadius:"12px",flexShrink:0,objectFit:"cover",boxShadow:"0 4px 14px rgba(0,0,0,0.2)"}} 
                />
              ) : null}
              {(!c.profile_picture_url || c.profile_picture_url) && (
                <div style={{
                  width:"46px",height:"46px",borderRadius:"12px",background:"linear-gradient(135deg,#7c3aed,#ec4899)",
                  flexShrink:0,display: c.profile_picture_url ? "none" : "grid",placeItems:"center",boxShadow:"0 4px 14px rgba(124,58,237,0.3)"
                }}>
                  <BarChart2 size={20} color="white"/>
                </div>
              )}
              <div style={{flex:1,overflow:"hidden"}}>
                <div style={{fontSize:"17px",fontWeight:"700",color:"var(--text-primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</div>
                <div style={{fontSize:"12px",color:"var(--text-muted)",marginTop:"4px"}}>Projeto conectado</div>
              </div>
              <button
                onClick={() => renameClient(c.id, c.name)}
                title="Renomear Projeto"
                className="btn-icon project-edit-btn"
                style={{flexShrink:0,fontFamily:"inherit",fontSize:"13px"}}
              >
                ✏️
              </button>
            </div>
            <div style={{height:"1px",background:"var(--border)"}}/>
            <button
              className="btn-primary project-access-btn"
              onClick={() => startReportConfig(c.id)}
              style={{width:"100%",padding:"11px 12px",fontSize:"14px"}}
            >
              Acessar Painel →
            </button>
          </div>
        ))}
        <div
          onClick={() => setShowAddModal(true)}
          className="add-project-card"
        >
          <div className="add-project-icon">
            <Plus size={22}/>
          </div>
          <span style={{fontSize:"14px",fontWeight:"600"}}>Adicionar Projeto</span>
          <span style={{fontSize:"12px",color:"var(--text-muted)"}}>Conecte uma nova conta para começar</span>
        </div>
      </div>
    </div>
  )

  if (!auth?.access_token) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} />
        <Toasts items={toasts} onDismiss={dismissToast} />
      </>
    )
  }

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"var(--bg-base)",color:"var(--text-secondary)"}}>

      {/* ── Sidebar ── */}
      <div className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <BarChart2 size={16} color="white"/>
          </div>
          <div>
            <div className="sidebar-logo-text">UP REPORTS</div>
            <div className="sidebar-logo-sub">{auth.user?.name}</div>
          </div>
        </div>

        {/* Back button */}
        {selectedClient && (
          <button
            onClick={() => { setSelectedClient(null); setReportConfig(null); }}
            className="btn-ghost"
            style={{width:"100%",marginBottom:"8px",fontFamily:"inherit",fontSize:"13px",justifyContent:"flex-start"}}
          >
            ← Todos os projetos
          </button>
        )}

        <ClientSwitcher clients={clients} selected={selectedClient} onSelect={setSelectedClient} onAdd={() => setShowAddModal(true)}/>

        {/* Nav */}
        {selectedClient && (
          <>
            <span className="nav-section-label">Navegação</span>
            <NavItem icon={LayoutDashboard} label="Dashboard" active={tab==="dashboard"} onClick={()=>setTab("dashboard")}/>
            {(reportConfig?.objective === 'all' || reportConfig?.objective === 'organic') && (
              <>
                <NavItem icon={FileText} label="Relatório Orgânico" active={tab==="report"} onClick={()=>setTab("report")}/>
                <NavItem icon={Image} label="Publicações" active={tab==="media"} onClick={()=>setTab("media")}/>
                <NavItem icon={Play} label="Stories" active={tab==="stories"} onClick={()=>setTab("stories")}/>
            <NavItem icon={History} label="Histórico" active={tab==="history"} onClick={()=>setTab("history")}/>
              </>
            )}
            {(reportConfig?.objective === 'all' || reportConfig?.objective === 'paid') && (
              <NavItem icon={BarChart2} label="Campanhas" active={tab==="ads"} onClick={()=>setTab("ads")}/>
            )}
          </>
        )}

        <div style={{flex:1}}/>

        <div className="sidebar-footer">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="btn-ghost sidebar-footer-btn"
            style={{width:"100%",fontFamily:"inherit",fontSize:"13px",justifyContent:"flex-start"}}
          >
            {theme === 'dark' ? <Sun size={15}/> : <Moon size={15}/>}
            <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>

          <button onClick={handleLogout} className="sidebar-logout-btn">
            <LogOut size={15}/> Sair
          </button>
        </div>
      </div>

      <div style={{flex:1,display:"flex",overflowY:"auto", margin: "0 auto", width:"100%"}}>
        {!selectedClient ? renderHome() : reportConfig?.active ? renderSetup() : (
          <div style={{flex:1,padding:"40px 48px", maxWidth: "1400px", margin: "0 auto", width:"100%"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"32px"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
              <div style={{width:"7px",height:"7px",borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 6px #22c55e"}}/>
              <span style={{color:"var(--text-700)",fontSize:"11px",letterSpacing:"0.12em",textTransform:"uppercase"}}>Ao vivo</span>
            </div>
            <h1 style={{color:"var(--text-100)",fontSize:"28px",fontWeight:"800"}}>
              {tab==="dashboard"?"Visão Geral":tab==="media"?"Métricas de Publicações":tab==="stories"?"Histórico de Stories":tab==="report"?"Relatório de Instagram":tab==="history"?"Histórico de Relatórios":"Relatório de Tráfego Pago"}
            </h1>
          </div>
          <button onClick={fetchData} style={{display:"flex",alignItems:"center",gap:"8px",padding:"10px 16px",background:"var(--bg-subtle-5)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"12px",color:"var(--text-500)",fontSize:"13px",cursor:"pointer"}}>
            <RefreshCw size={14} style={loading?{animation:"spin 1s linear infinite"}:{}}/>
            Atualizar
          </button>
        </div>
        
        {/* ── Loading State ── */}
        {loading && (
          <div style={{padding:"40px 0"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"16px",padding:"60px 20px"}}>
              <div style={{width:"48px",height:"48px",borderRadius:"50%",border:"3px solid var(--border-med)",borderTopColor:"var(--accent)",animation:"spin 0.8s linear infinite"}}/>
              <div style={{textAlign:"center"}}>
                <p style={{fontSize:"15px",fontWeight:"600",color:"var(--text-primary)",marginBottom:"4px"}}>Gerando relatório...</p>
                <p style={{fontSize:"13px",color:"var(--text-muted)"}}>Buscando dados do Instagram e Ads. Isso pode levar alguns segundos.</p>
              </div>
            </div>
            {/* Skeleton cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"16px",marginBottom:"16px"}}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:"var(--radius-lg)",padding:"24px",height:"110px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,transparent,var(--bg-subtle-hi),transparent)",animation:"shimmer 1.4s infinite"}} />
                </div>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"}}>
              {[1,2].map(i => (
                <div key={i} style={{background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:"var(--radius-lg)",padding:"24px",height:"260px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,transparent,var(--bg-subtle-hi),transparent)",animation:"shimmer 1.4s infinite"}} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Error State ── */}
        {!loading && fetchError && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"16px",padding:"80px 20px",textAlign:"center"}}>
            <div style={{width:"56px",height:"56px",borderRadius:"50%",background:"var(--red-soft)",display:"grid",placeItems:"center",fontSize:"24px"}}>⚠️</div>
            <div>
              <p style={{fontSize:"16px",fontWeight:"700",color:"var(--text-primary)",marginBottom:"6px"}}>Não foi possível gerar o relatório</p>
              <p style={{fontSize:"13px",color:"var(--text-muted)",maxWidth:"380px",lineHeight:1.6}}>{fetchError}</p>
              <p style={{fontSize:"11px",color:"var(--text-muted)",marginTop:"12px"}}>Verifique se o servidor está rodando na porta 8001 e se a conexão com a internet está estável.</p>
            </div>
            <button
              className="btn-primary"
              onClick={fetchData}
              style={{marginTop:"8px"}}
            >
              <RefreshCw size={14}/> Tentar novamente
            </button>
          </div>
        )}

        {/* ── Tabs Content ── */}
        {tab === "history" && renderHistory()}
        
        {tab !== "history" && !loading && !fetchError && (
          <div className="tab-content-wrapper">
            {/* ── Dashboard / Reports ── */}

        {/* ── Empty State ── */}
        {!loading && !fetchError && tab==="dashboard" && !summary && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"16px",padding:"80px 20px",textAlign:"center"}}>
            <div style={{width:"64px",height:"64px",borderRadius:"16px",background:"var(--bg-subtle-md)",display:"grid",placeItems:"center",fontSize:"28px"}}>📊</div>
            <div>
              <p style={{fontSize:"16px",fontWeight:"700",color:"var(--text-primary)",marginBottom:"6px"}}>Nenhum dado disponível</p>
              <p style={{fontSize:"13px",color:"var(--text-muted)",maxWidth:"360px",lineHeight:1.6}}>
                Este projeto ainda não possui snapshots registrados. Clique em <b>"Atualizar"</b> para coletar os dados agora ou aguarde a coleta automática.
              </p>
            </div>
            <button className="btn-primary" onClick={fetchData} style={{marginTop:"8px"}}>
              <RefreshCw size={14}/> Coletar dados agora
            </button>
          </div>
        )}

        {!loading && tab==="dashboard" && summary && <>
        
          <p style={{color: '#94a3b8', fontSize: '13px', marginBottom: '24px', lineHeight: 1.5}}>
            A maior parte dos dados do <b>Instagram Business</b> refere-se a resultados <b>orgânicos</b>. Para acessar os dados <b>pagos</b>, consulte as métricas de Ads.
          </p>

          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"16px",marginBottom:"16px"}}>
            <AdvancedStatCard 
              title="Número de seguidores" 
              value={profile?.followers_count?.toLocaleString("pt-BR")} 
              trend={summary.deltas?.followers} 
              previousValue={summary.latest?.followers - summary.delta_followers} 
            />
            <AdvancedStatCard 
              title="Alcance Orgânico" 
              dateRange={dateRangeLabel}
              value={(summary.totals?.reach || 0).toLocaleString("pt-BR")} 
              trend={summary.deltas?.reach} 
              previousValue={summary.totals?.prev_reach} 
            />
            <AdvancedStatCard 
              title="Visualizações totais" 
              value={(summary.totals?.impressions || 0).toLocaleString("pt-BR")} 
              trend={summary.deltas?.impressions} 
              previousValue={summary.totals?.prev_impressions} 
            />
            <AdvancedStatCard 
              title="Alcance Total (Orgânico + Pago)" 
              dateRange={dateRangeLabel}
              value={( (summary?.totals?.reach || 0) + parseInt(ads?.reach || 0) ).toLocaleString("pt-BR")} 
            />
          </div>
          
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"16px",marginBottom:"32px"}}>
            <AdvancedStatCard 
              title="Alcance Pago" 
              dateRange={dateRangeLabel}
              value={parseInt(ads?.reach || 0).toLocaleString("pt-BR")} 
            />
             <AdvancedStatCard 
              title="Visitas do perfil" 
              value={(summary.totals?.profile_views || 0).toLocaleString("pt-BR")} 
              trend={summary.deltas?.profile_views} 
              previousValue={summary.totals?.prev_profile_views} 
            />
            <AdvancedStatCard 
              title="Interações totais" 
              value={totalInteractions.toLocaleString("pt-BR")} 
            />
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"24px",marginBottom:"24px"}}>
            <div style={{background:"var(--bg-subtle-3)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"16px",padding:"24px"}}>
              <p style={{color:"var(--text-100)",fontSize:"14px",marginBottom:"24px",fontWeight:"600", textAlign: "center"}}>Alcance diário</p>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={dailyReachData}>
                  <defs>
                    <linearGradient id="gradReach" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{fill:"var(--text-600)",fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"var(--text-600)",fontSize:11}} axisLine={false} tickLine={false}/>
                  <RechartsTooltip contentStyle={{background:"var(--bg-card)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",color:"var(--text-200)"}}/>
                  <Area type="monotone" dataKey="alcance" stroke="#22c55e" strokeWidth={3} fill="url(#gradReach)"/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{background:"var(--bg-subtle-3)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"16px",padding:"24px"}}>
              <p style={{color:"var(--text-100)",fontSize:"14px",marginBottom:"24px",fontWeight:"600", textAlign: "center"}}>Crescimento de seguidores</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={snapshots.map(s => ({date: s.date.split('-').reverse().join('/'), seguidores: s.followers}))}>
                  <XAxis dataKey="date" tick={{fill:"var(--text-600)",fontSize:11}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"var(--text-600)",fontSize:11}} axisLine={false} tickLine={false} domain={['auto', 'auto']}/>
                  <RechartsTooltip contentStyle={{background:"var(--bg-card)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px"}} cursor={{fill: 'rgba(255,255,255,0.05)'}}/>
                  <Bar dataKey="seguidores" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:"24px",marginBottom:"32px"}}>
             <div style={{background:"var(--bg-subtle-3)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"16px",padding:"24px"}}>
              <p style={{color:"var(--text-100)",fontSize:"14px",marginBottom:"24px",fontWeight:"600", textAlign: "center"}}>Audiência por idade e gênero</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={genderAgeData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                  <XAxis dataKey="age" tick={{fill:"var(--text-600)",fontSize:12}} axisLine={false} tickLine={false}/>
                  <YAxis tick={{fill:"var(--text-600)",fontSize:12}} axisLine={false} tickLine={false}/>
                  <RechartsTooltip contentStyle={{background:"var(--bg-card)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px"}} cursor={{fill: 'rgba(255,255,255,0.05)'}}/>
                  <Legend wrapperStyle={{fontSize: "12px", color: "var(--text-500)"}}/>
                  <Bar dataKey="Masculino" fill="#22c55e" radius={[2, 2, 0, 0]}/>
                  <Bar dataKey="Feminino" fill="#3b82f6" radius={[2, 2, 0, 0]}/>
                  <Bar dataKey="Desconhecido" fill="#0ea5e9" radius={[2, 2, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{background:"var(--bg-subtle-3)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"16px",padding:"24px", display: "flex", flexDirection: "column"}}>
              <p style={{color:"var(--text-100)",fontSize:"14px",marginBottom:"12px",fontWeight:"600", textAlign: "center"}}>Seguidores por gênero</p>
              <div style={{flex: 1}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={genderData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                      {genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.name === 'Feminino' ? '#3b82f6' : entry.name === 'Masculino' ? '#22c55e' : '#64748b'} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{background:"var(--bg-card)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px"}}/>
                    <Legend wrapperStyle={{fontSize: "12px", color: "var(--text-500)"}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={{background:"var(--bg-subtle-3)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"16px",overflow:"hidden"}}>
            <div style={{padding:"20px", borderBottom:"1px solid rgba(255,255,255,0.07)", textAlign: "center"}}>
               <p style={{color:"var(--text-100)",fontSize:"14px",fontWeight:"600"}}>Cidades com o maior número de seguidores</p>
            </div>
            <table style={{width:"100%", borderCollapse:"collapse", textAlign:"left", fontSize:"13px"}}>
              <thead>
                <tr style={{background:"var(--bg-subtle-2)"}}>
                  <th style={{padding:"14px 24px", color:"var(--text-500)", fontWeight:"600", borderBottom:"1px solid rgba(255,255,255,0.07)"}}>Cidade</th>
                  <th style={{padding:"14px 24px", color:"#3b82f6", fontWeight:"600", borderBottom:"1px solid rgba(255,255,255,0.07)", textAlign: "right"}}>Seguidores ↓</th>
                </tr>
              </thead>
              <tbody>
                {topCities.map((c, i) => (
                  <tr key={i} style={{borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                    <td style={{padding:"14px 24px", color:"var(--text-300)"}}>{c.city}</td>
                    <td style={{padding:"14px 24px", color:"var(--text-300)", textAlign: "right"}}>{c.count.toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>}

        {!loading && tab==="media" && <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"16px",marginBottom:"32px"}}>
            <AdvancedStatCard title="Número de postagens" value={media.length} />
            <AdvancedStatCard title="Alcance das postagens" value={totalPostReach.toLocaleString("pt-BR")} dateRange={dateRangeLabel}/>
            <AdvancedStatCard title="Interações nas postagens" value={totalInteractions.toLocaleString("pt-BR")} />
            <AdvancedStatCard title="Curtidas" value={totalLikes.toLocaleString("pt-BR")} />
            <AdvancedStatCard title="Comentários" value={totalComments.toLocaleString("pt-BR")} />
          </div>

          <div style={{background:"var(--bg-subtle-3)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"16px",overflow:"hidden",marginBottom:"32px"}}>
            <div style={{padding:"20px", borderBottom:"1px solid rgba(255,255,255,0.07)", textAlign: "center"}}>
               <p style={{color:"var(--text-100)",fontSize:"14px",fontWeight:"600"}}>Reels em Destaque</p>
            </div>
            <div style={{overflowX: "auto"}}>
              <table style={{width:"100%", borderCollapse:"collapse", textAlign:"left", fontSize:"13px", minWidth: "900px"}}>
                <thead>
                  <tr style={{background:"var(--bg-subtle-2)"}}>
                    <th style={{padding:"14px 20px", color:"var(--text-500)", fontWeight:"600", borderBottom:"1px solid rgba(255,255,255,0.07)"}}>Reel</th>
                    <th style={{padding:"14px", color:"var(--text-500)", fontWeight:"600", borderBottom:"1px solid rgba(255,255,255,0.07)"}}>Visualizações</th>
                    <th style={{padding:"14px", color:"#3b82f6", fontWeight:"600", borderBottom:"1px solid rgba(255,255,255,0.07)"}}>Alcance ↓</th>
                    <th style={{padding:"14px", color:"var(--text-500)", fontWeight:"600", borderBottom:"1px solid rgba(255,255,255,0.07)"}}>Interações</th>
                    <th style={{padding:"14px", color:"var(--text-500)", fontWeight:"600", borderBottom:"1px solid rgba(255,255,255,0.07)"}}>engagement_rate</th>
                    <th style={{padding:"14px", color:"var(--text-500)", fontWeight:"600", borderBottom:"1px solid rgba(255,255,255,0.07)"}}>Curtidas</th>
                    <th style={{padding:"14px", color:"var(--text-500)", fontWeight:"600", borderBottom:"1px solid rgba(255,255,255,0.07)"}}>Comentários</th>
                    <th style={{padding:"14px", color:"var(--text-500)", fontWeight:"600", borderBottom:"1px solid rgba(255,255,255,0.07)"}}>Salvo</th>
                    <th style={{padding:"14px", color:"var(--text-500)", fontWeight:"600", borderBottom:"1px solid rgba(255,255,255,0.07)"}}>Compartilhamentos</th>
                  </tr>
                </thead>
                <tbody>
                  {reels.map(post => {
                    const reach = post.insights?.reach || 0;
                    const views = post.insights?.impressions || post.insights?.plays || reach;
                    const inters = (post.like_count||0) + (post.comments_count||0) + (post.insights?.saved||0) + (post.insights?.shares||0);
                    const rate = reach > 0 ? ((inters / reach) * 100).toFixed(2) + '%' : '0%';
                    return (
                    <tr key={post.id} style={{borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                      <td style={{padding:"14px 20px", display:"flex", alignItems:"center", gap:"12px"}}>
                        <div style={{width:"40px",height:"56px",borderRadius:"6px",background:"var(--bg-card)",overflow:"hidden",flexShrink:0}}>
                          {post.thumbnail_url?<img src={post.thumbnail_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<Play size={20} color="var(--text-800)" style={{margin:"18px 10px"}}/>}
                        </div>
                        <a href={post.permalink} target="_blank" rel="noreferrer" style={{color:"var(--text-300)", textDecoration:"none", maxWidth:"200px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
                          {post.caption || 'Sem legenda'}
                        </a>
                      </td>
                      <td style={{padding:"14px", color:"var(--text-300)"}}>{views.toLocaleString("pt-BR")}</td>
                      <td style={{padding:"14px", color:"var(--text-300)"}}>{reach.toLocaleString("pt-BR")}</td>
                      <td style={{padding:"14px", color:"var(--text-300)"}}>{inters.toLocaleString("pt-BR")}</td>
                      <td style={{padding:"14px", color:"var(--text-300)"}}>{rate}</td>
                      <td style={{padding:"14px", color:"var(--text-300)"}}>{post.like_count || 0}</td>
                      <td style={{padding:"14px", color:"var(--text-300)"}}>{post.comments_count || 0}</td>
                      <td style={{padding:"14px", color:"var(--text-300)"}}>{post.insights?.saved || 0}</td>
                      <td style={{padding:"14px", color:"var(--text-300)"}}>{post.insights?.shares || 0}</td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{background:"var(--bg-subtle-3)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"16px",overflow:"hidden",marginBottom:"32px"}}>
            <div style={{padding:"20px", borderBottom:"1px solid rgba(255,255,255,0.07)", textAlign: "center"}}>
               <p style={{color:"var(--text-100)",fontSize:"14px",fontWeight:"600"}}>Dados orgânicos de postagens</p>
            </div>
            <div style={{overflowX: "auto"}}>
              <table style={{width:"100%", borderCollapse:"collapse", textAlign:"left", fontSize:"13px", minWidth: "900px"}}>
                <thead>
                  <tr style={{background:"var(--bg-subtle-2)"}}>
                    <th style={{padding:"14px 20px", color:"var(--text-500)", fontWeight:"600", borderBottom:"1px solid rgba(255,255,255,0.07)"}}>Postagem</th>
                    <th style={{padding:"14px", color:"var(--text-500)", fontWeight:"600", borderBottom:"1px solid rgba(255,255,255,0.07)"}}>Tipo</th>
                    <th style={{padding:"14px", color:"var(--text-500)", fontWeight:"600", borderBottom:"1px solid rgba(255,255,255,0.07)"}}>Visualizações</th>
                    <th style={{padding:"14px", color:"#3b82f6", fontWeight:"600", borderBottom:"1px solid rgba(255,255,255,0.07)"}}>Alcance ↓</th>
                    <th style={{padding:"14px", color:"var(--text-500)", fontWeight:"600", borderBottom:"1px solid rgba(255,255,255,0.07)"}}>Interações</th>
                    <th style={{padding:"14px", color:"var(--text-500)", fontWeight:"600", borderBottom:"1px solid rgba(255,255,255,0.07)"}}>Taxa</th>
                    <th style={{padding:"14px", color:"var(--text-500)", fontWeight:"600", borderBottom:"1px solid rgba(255,255,255,0.07)"}}>Curtidas</th>
                    <th style={{padding:"14px", color:"var(--text-500)", fontWeight:"600", borderBottom:"1px solid rgba(255,255,255,0.07)"}}>Coments</th>
                    <th style={{padding:"14px", color:"var(--text-500)", fontWeight:"600", borderBottom:"1px solid rgba(255,255,255,0.07)"}}>Salvos</th>
                    <th style={{padding:"14px", color:"var(--text-500)", fontWeight:"600", borderBottom:"1px solid rgba(255,255,255,0.07)"}}>Compart.</th>
                  </tr>
                </thead>
                <tbody>
                  {media.sort((a,b) => (b.insights?.reach || 0) - (a.insights?.reach || 0)).map(post => {
                    const reach = post.insights?.reach || 0;
                    const views = post.insights?.impressions || post.insights?.plays || reach;
                    const inters = (post.like_count||0) + (post.comments_count||0) + (post.insights?.saved||0) + (post.insights?.shares||0);
                    const rate = reach > 0 ? ((inters / reach) * 100).toFixed(2) + '%' : '0%';
                    return (
                    <tr key={post.id} style={{borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                      <td style={{padding:"14px 20px", display:"flex", alignItems:"center", gap:"12px"}}>
                        <div style={{width:"40px",height:"40px",borderRadius:"6px",background:"var(--bg-card)",overflow:"hidden",flexShrink:0}}>
                          {post.thumbnail_url?<img src={post.thumbnail_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<Image size={20} color="var(--text-800)" style={{margin:"10px"}}/>}
                        </div>
                        <a href={post.permalink} target="_blank" rel="noreferrer" style={{color:"var(--text-300)", textDecoration:"none", maxWidth:"200px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>
                          {post.caption || 'Sem legenda'}
                        </a>
                      </td>
                      <td style={{padding:"14px", color:"var(--text-500)"}}>{post.media_type === 'VIDEO' ? 'Reels' : 'Post'}</td>
                      <td style={{padding:"14px", color:"var(--text-300)"}}>{views.toLocaleString("pt-BR")}</td>
                      <td style={{padding:"14px", color:"var(--text-300)"}}>{reach.toLocaleString("pt-BR")}</td>
                      <td style={{padding:"14px", color:"var(--text-300)"}}>{inters.toLocaleString("pt-BR")}</td>
                      <td style={{padding:"14px", color:"var(--text-300)"}}>{rate}</td>
                      <td style={{padding:"14px", color:"var(--text-300)"}}>{post.like_count || 0}</td>
                      <td style={{padding:"14px", color:"var(--text-300)"}}>{post.comments_count || 0}</td>
                      <td style={{padding:"14px", color:"var(--text-300)"}}>{post.insights?.saved || 0}</td>
                      <td style={{padding:"14px", color:"var(--text-300)"}}>{post.insights?.shares || 0}</td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        </>}

        {!loading && tab==="stories" && <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px",marginBottom:"16px"}}>
              <AdvancedStatCard title="Número de stories" value={stories.length} />
              <AdvancedStatCard title="Visualizações Totais dos Stories" value={totalStoryViews.toLocaleString("pt-BR")} />
              <AdvancedStatCard title="Alcance dos stories dos últimos 30 dias" value={totalStoryReach.toLocaleString("pt-BR")} dateRange={dateRangeLabel} />
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px",marginBottom:"32px"}}>
              <AdvancedStatCard title="Total de interações com Stories" value={totalStoryInteractions.toLocaleString("pt-BR")} />
              <AdvancedStatCard title="Total de respostas a stories" value={totalStoryReplies.toLocaleString("pt-BR")} />
              <AdvancedStatCard title="Total de compartilhamentos dos Stories" value={totalStoryShares.toLocaleString("pt-BR")} />
          </div>

          <div style={{textAlign: "center", marginBottom: "24px"}}>
              <p style={{color:"var(--text-100)",fontSize:"14px",fontWeight:"600"}}>Stories</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"24px",marginBottom:"32px"}}>
              {stories.map(s => {
                  const views = s.impressions || 0;
                  const exits = s.exits || 0;
                  const retention = views > 0 ? (((views - exits) / views) * 100).toFixed(2) + '%' : '0%';
                  return (
                      <div key={s.story_id} style={{display:"flex", gap:"16px", background:"var(--bg-subtle-2)", padding:"16px", borderRadius:"12px", border:"1px solid rgba(255,255,255,0.05)"}}>
                          <div style={{width:"120px", height:"213px", borderRadius:"8px", background:"var(--bg-card)", overflow:"hidden", flexShrink:0}}>
                              {s.media_url ? <img src={s.media_url} style={{width:"100%", height:"100%", objectFit:"cover"}}/> : <div style={{display:"grid",placeItems:"center",height:"100%",color:"var(--text-800)"}}><Play size={24}/></div>}
                          </div>
                          <div style={{display:"flex", flexDirection:"column", gap:"6px", fontSize:"12px", color:"var(--text-500)", flex:1}}>
                              <div style={{display:"flex", justifyContent:"space-between"}}><span>Visualizações:</span> <span style={{color:"var(--text-300)",fontWeight:"600"}}>{views}</span></div>
                              <div style={{display:"flex", justifyContent:"space-between"}}><span>Alcance:</span> <span style={{color:"var(--text-300)",fontWeight:"600"}}>{s.reach || 0}</span></div>
                              <div style={{display:"flex", justifyContent:"space-between"}}><span>Interações:</span> <span style={{color:"var(--text-300)",fontWeight:"600"}}>{(s.replies || 0) + (s.shares || 0) + (s.profile_visits || 0)}</span></div>
                              <div style={{display:"flex", justifyContent:"space-between"}}><span>Visitas ao Perfil:</span> <span style={{color:"var(--text-300)",fontWeight:"600"}}>{s.profile_visits || 0}</span></div>
                              <div style={{display:"flex", justifyContent:"space-between"}}><span>Respostas:</span> <span style={{color:"var(--text-300)",fontWeight:"600"}}>{s.replies || 0}</span></div>
                              <div style={{display:"flex", justifyContent:"space-between"}}><span>Compartilhamentos:</span> <span style={{color:"var(--text-300)",fontWeight:"600"}}>{s.shares || 0}</span></div>
                              <div style={{display:"flex", justifyContent:"space-between"}}><span>Retenção:</span> <span style={{color:"var(--text-300)",fontWeight:"600"}}>{retention}</span></div>
                              <div style={{display:"flex", justifyContent:"space-between"}}><span>Avançar:</span> <span style={{color:"var(--text-300)",fontWeight:"600"}}>{s.taps_forward || 0}</span></div>
                              <div style={{display:"flex", justifyContent:"space-between"}}><span>Próximo Story:</span> <span style={{color:"var(--text-300)",fontWeight:"600"}}>0</span></div>
                              <div style={{display:"flex", justifyContent:"space-between"}}><span>Voltar:</span> <span style={{color:"var(--text-300)",fontWeight:"600"}}>{s.taps_back || 0}</span></div>
                              <div style={{display:"flex", justifyContent:"space-between"}}><span>Sair:</span> <span style={{color:"var(--text-300)",fontWeight:"600"}}>{s.exits || 0}</span></div>
                              <div style={{marginTop:"auto", borderTop:"1px solid rgba(255,255,255,0.05)", paddingTop:"8px", display:"flex", justifyContent:"space-between", fontSize: "11px"}}><span>Data:</span> <span>{new Date(s.timestamp).toLocaleDateString('pt-BR')}</span></div>
                          </div>
                      </div>
                  )
              })}
              {stories.length === 0 && <div style={{gridColumn:"1/-1", textAlign:"center", padding:"40px", color:"var(--text-600)"}}>Nenhum story arquivado no banco de dados ainda. Eles começarão a aparecer quando a rotina diária os capturar.</div>}
          </div>
        </>}

        {tab==="report" && (
          <OrganicReport 
            client={clients.find(c => c.id === selectedClient)} 
            profile={profile}
            summary={summary}
            media={media}
            stories={stories}
            audience={audience}
            snapshots={snapshots}
            reportConfig={reportConfig} 
          />
        )}

        {tab==="ads" && (
          <PaidTrafficReport 
            client={clients.find(c => c.id === selectedClient)} 
            ads={ads} 
            creatives={adCreatives} 
            reportConfig={reportConfig} 
          />
        )}
          </div>
        )}
          </div>
        )}
      </div>

      {showAddModal && <AddClientModal authFetch={authFetch} onClose={() => setShowAddModal(false)} onToast={pushToast} />}
      <OAuthPagePicker open={showPicker} pending={oauthPending} loading={completingOauth} onSelect={(pageId, adAccountId) => completeOauthSelection(oauthPending?.oauth_session, pageId, adAccountId)} onClose={() => setShowPicker(false)} />
      <Toasts items={toasts} onDismiss={dismissToast} />      

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}input::placeholder{color:#334155}::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}`}</style>
    </div>
  )
}
