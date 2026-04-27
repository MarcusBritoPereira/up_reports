import { useState, useEffect } from "react"
<<<<<<< HEAD
import { Users, TrendingUp, Image, RefreshCw, Heart, MessageCircle, ExternalLink, LayoutDashboard, BarChart2, Settings, ChevronDown, Plus, Check, LogOut, Play, Bookmark, Share2, Sun, Moon, FileText } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts"
=======
import { Users, TrendingUp, Image, RefreshCw, Heart, MessageCircle, ExternalLink, LayoutDashboard, BarChart2, Settings, ChevronDown, Plus, Check, Eye, MousePointerClick } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
>>>>>>> pr-2

const API = "http://127.0.0.1:8001"
const COLORS = ['#a855f7', '#3b82f6', '#ec4899', '#10b981', '#f59e0b'];

<<<<<<< HEAD
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
=======
const formatInt = (value) => Number(value || 0).toLocaleString("pt-BR")
const formatMoney = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

function StatCard({ icon: Icon, label, value, iconBg, iconColor }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
      <div style={{ background: iconBg, color: iconColor, padding: "10px", borderRadius: "10px", display: "flex" }}>
        <Icon size={20} />
      </div>
      <div>
        <p style={{ color: "#64748b", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
        <p style={{ color: "#f1f5f9", fontSize: "24px", fontWeight: "700", marginTop: "2px" }}>{value ?? "—"}</p>
>>>>>>> pr-2
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
  const current = clients.find((c) => c.id === selected)

  return (
<<<<<<< HEAD
    <div style={{position:"relative",marginBottom:"16px"}}>
      <button onClick={() => setOpen(!open)} className="client-switcher-btn">
        <div style={{width:"26px",height:"26px",borderRadius:"7px",background:"linear-gradient(135deg,#7c3aed,#ec4899)",flexShrink:0}}/>
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
              <div style={{width:"22px",height:"22px",borderRadius:"6px",background:"linear-gradient(135deg,#7c3aed,#ec4899)",flexShrink:0}}/>
              <span style={{flex:1,textAlign:"left"}}>{c.name}</span>
              {selected === c.id && <Check size={13} color="var(--accent-light)"/>}
            </button>
          ))}
          <div style={{borderTop:"1px solid var(--border)",padding:"4px"}}>
            <button onClick={() => { onAdd(); setOpen(false) }}
              style={{width:"100%",display:"flex",alignItems:"center",gap:"10px",padding:"8px 12px",background:"transparent",border:"none",cursor:"pointer",color:"var(--text-muted)",fontSize:"13px",borderRadius:"var(--radius-sm)",fontFamily:"inherit"}}>
              <Plus size={14}/> Adicionar cliente
=======
    <div style={{ position: "relative", marginBottom: "28px" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", cursor: "pointer", color: "#e2e8f0" }}>
        <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "linear-gradient(135deg,#7c3aed,#ec4899)", flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: "left", fontSize: "13px", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current?.name ?? "Selecionar cliente"}
        </span>
        <ChevronDown size={14} color="#475569" style={{ transform: open ? "rotate(180deg)" : "none", transition: "0.2s" }} />
      </button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", overflow: "hidden", zIndex: 100 }}>
          {clients.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                onSelect(c.id)
                setOpen(false)
              }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "transparent", border: "none", cursor: "pointer", color: selected === c.id ? "#c084fc" : "#94a3b8", fontSize: "13px" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "linear-gradient(135deg,#7c3aed,#ec4899)", flexShrink: 0 }} />
              <span style={{ flex: 1, textAlign: "left" }}>{c.name}</span>
              {selected === c.id && <Check size={13} color="#a855f7" />}
            </button>
          ))}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button onClick={() => { onAdd(); setOpen(false) }} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", background: "transparent", border: "none", cursor: "pointer", color: "#475569", fontSize: "13px" }}>
              <Plus size={14} /> Adicionar cliente
>>>>>>> pr-2
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

<<<<<<< HEAD

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
=======
function AddClientModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", page_id: "", ig_id: "", access_token: "" })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!form.name || !form.page_id || !form.ig_id || !form.access_token) return
    setSaving(true)
    await fetch(`${API}/api/clients/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setSaving(false)
    onSave()
  }

  const field = (label, key, placeholder) => (
    <div style={{ marginBottom: "16px" }}>
      <p style={{ color: "#64748b", fontSize: "12px", marginBottom: "6px" }}>{label}</p>
      <input
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", color: "#e2e8f0", fontSize: "14px", outline: "none" }}
      />
    </div>
  )

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
      <div style={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "20px", padding: "32px", width: "440px" }}>
        <h3 style={{ color: "#f1f5f9", fontWeight: "700", fontSize: "18px", marginBottom: "24px" }}>Adicionar cliente</h3>
        {field("Nome do cliente", "name", "Ex: João Silva")}
        {field("Ad Account ID (Meta Ads)", "page_id", "Ex: 1234567890")}
        {field("Instagram Business ID", "ig_id", "Ex: 17841401265357070")}
        {field("Access Token", "access_token", "EAAUEl4mFF...")}
        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#94a3b8", cursor: "pointer", fontSize: "14px" }}>Cancelar</button>
          <button onClick={save} style={{ flex: 1, padding: "12px", background: "#7c3aed", border: "none", borderRadius: "10px", color: "white", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>{saving ? "Salvando..." : "Salvar cliente"}</button>
>>>>>>> pr-2
        </div>

        <p style={{color:"var(--text-700)",fontSize:"12px",lineHeight:1.45,marginBottom:"16px"}}>
          O fluxo OAuth evita colar manualmente Page ID, Instagram ID e Access Token.
        </p>

        <button onClick={onClose} style={{width:"100%",padding:"12px",background:"var(--bg-subtle-5)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",color:"var(--text-500)",cursor:"pointer",fontSize:"14px"}}>
          Fechar
        </button>
      </div>
    </div>
  )
}

const OrganicReport = ({ client, profile, summary, media, stories, audience, snapshots, reportConfig }) => {
  const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  
  // Totals
  const followers = profile?.followers_count || 0;
  const reach = summary?.reach || summary?.totals?.reach || 0;
  const impressions = summary?.impressions || summary?.totals?.impressions || 0;
  const profileViews = summary?.profile_views || summary?.totals?.profile_views || 0;
  
  // Post aggregations
  let totalLikes = 0, totalComments = 0, totalSaves = 0, totalShares = 0;
  const formatStats = { REELS: { reach:0, inters:0, count:0 }, CAROUSEL: { reach:0, inters:0, count:0 }, IMAGE: { reach:0, inters:0, count:0 } };
  
  if (Array.isArray(media)) {
    media.forEach(m => {
      totalLikes += m.like_count || 0;
      totalComments += m.comments_count || 0;
      totalSaves += m.insights?.saved || 0;
      totalShares += m.insights?.shares || 0;
      
      const type = m.media_type === 'VIDEO' ? 'REELS' : m.media_type === 'CAROUSEL_ALBUM' ? 'CAROUSEL' : 'IMAGE';
      if (formatStats[type]) {
        formatStats[type].count++;
        formatStats[type].reach += m.insights?.reach || 0;
        formatStats[type].inters += (m.like_count||0) + (m.comments_count||0) + (m.insights?.saved||0) + (m.insights?.shares||0);
      }
    });
  }
  
  const totalInters = totalLikes + totalComments + totalSaves + totalShares;
  const engRate = reach > 0 ? (totalInters / reach * 100).toFixed(1) : "0,0";

  // Stories
  let storyViews = 0, storyReach = 0;
  if (Array.isArray(stories)) {
    stories.forEach(s => { storyViews += s.impressions || 0; storyReach += s.reach || 0; });
  }
  const avgStoryReach = (Array.isArray(stories) && stories.length > 0) ? (storyReach / stories.length).toFixed(0) : 0;

  // Top Posts
  const topPosts = Array.isArray(media) ? [...media].sort((a,b) => (b.insights?.reach || 0) - (a.insights?.reach || 0)).slice(0, 3) : [];

  // Audience processing (Meta API Format)
  let ageData = [];
  let genderData = [];
  let cityData = [];

  if (Array.isArray(audience)) {
    const ageGender = audience.find(m => m.name === 'audience_gender_age');
    if (ageGender && ageGender.values?.[0]?.value) {
      const vals = ageGender.values[0].value;
      const ages = {};
      const genders = { Feminino: 0, Masculino: 0 };
      
      Object.entries(vals).forEach(([key, val]) => {
        const [g, age] = key.split('.');
        if (age) ages[age] = (ages[age] || 0) + val;
        if (g === 'F') genders.Feminino += val;
        else if (g === 'M') genders.Masculino += val;
      });
      
      ageData = Object.entries(ages).map(([dimension, value]) => ({ dimension, value })).sort((a,b) => b.value - a.value).slice(0, 5);
      genderData = Object.entries(genders).map(([dimension, value]) => ({ dimension, value }));
    }

    const citiesMetric = audience.find(m => m.name === 'audience_city');
    if (citiesMetric && citiesMetric.values?.[0]?.value) {
      cityData = Object.entries(citiesMetric.values[0].value)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 5)
        .map(([city, value]) => ({ dimension: city.split(',')[0], value }));
    }
  }

  const totalAudience = ageData.reduce((acc, curr) => acc + curr.value, 0) || 1;

  return (
    <div className="organic-report-page">
      <div className="page">
        <div className="pg-header">
          <div>
            <div className="h-label">Relatório de Instagram</div>
            <div className="h-client">{client?.name || "Cliente"}</div>
            <div className="h-sub">@{profile?.username} · {profile?.category || "Negócio"} · {cityData[0]?.city || "Brasil"}</div>
          </div>
          <div className="h-right">
            <div className="h-period">{currentMonth}</div>
            <div className="h-badge">Relatório Orgânico</div>
          </div>
        </div>

        <div className="body">
          <div className="section">
            <div className="slabel">Visão geral da conta <span className="api-tag">insights · account</span></div>
            <div className="m4">
              <div className="mcard">
                <div className="lbl">Seguidores</div>
                <div className="val">{followers.toLocaleString("pt-BR")}</div>
                <div className="delta neu">— total da conta</div>
              </div>
              <div className="mcard">
                <div className="lbl">Alcance total</div>
                <div className="val">{reach.toLocaleString("pt-BR")}</div>
                <div className="delta up">↑ alcance orgânico</div>
              </div>
              <div className="mcard">
                <div className="lbl">Impressões</div>
                <div className="val">{impressions.toLocaleString("pt-BR")}</div>
                <div className="delta neu">— visualizações</div>
              </div>
              <div className="mcard">
                <div className="lbl">Visitas ao perfil</div>
                <div className="val">{profileViews.toLocaleString("pt-BR")}</div>
                <div className="delta up">↑ interesse na marca</div>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="slabel">Engajamento <span className="api-tag">insights · engagement</span></div>
            <div className="m4">
              <div className="mcard">
                <div className="lbl">Taxa de engajamento</div>
                <div className="val">{engRate}%</div>
                <div className="delta neu">benchmark: 3–5%</div>
              </div>
              <div className="mcard">
                <div className="lbl">Curtidas</div>
                <div className="val">{totalLikes.toLocaleString("pt-BR")}</div>
                <div className="delta up">↑ interações diretas</div>
              </div>
              <div className="mcard">
                <div className="lbl">Comentários</div>
                <div className="val">{totalComments.toLocaleString("pt-BR")}</div>
                <div className="delta up">↑ conversas</div>
              </div>
              <div className="mcard">
                <div className="lbl">Salvamentos</div>
                <div className="val">{totalSaves.toLocaleString("pt-BR")}</div>
                <div className="delta up">↑ conteúdo de valor</div>
              </div>
            </div>
          </div>

          <div className="section two-col">
            <div className="card">
              <div className="card-title">Ações no perfil <span className="api-tag">profile_actions</span></div>
              <div className="row"><span className="rk">Cliques no link da bio</span><span className="rv">{profile?.website_clicks || 0}</span></div>
              <div className="row"><span className="rk">Cliques em "Ligar"</span><span className="rv">{profile?.call_clicks || 0}</span></div>
              <div className="row"><span className="rk">Cliques em "E-mail"</span><span className="rv">{profile?.email_clicks || 0}</span></div>
              <div className="row"><span className="rk">Compartilhamentos</span><span className="rv">{totalShares.toLocaleString("pt-BR")}</span></div>
            </div>
            <div className="card">
              <div className="card-title">Desempenho por formato <span className="api-tag">media_type</span></div>
              {Object.entries(formatStats).sort((a,b) => b[1].inters - a[1].inters).map(([type, stats]) => {
                const rate = stats.reach > 0 ? (stats.inters / stats.reach * 100).toFixed(1) : 0;
                const colors = { REELS: 'fill-pink', CAROUSEL: 'fill-purple', IMAGE: 'fill-blue' };
                return (
                  <div className="bar-item" key={type}>
                    <div className="bar-lr"><span>{type}</span><strong>{rate}% eng.</strong></div>
                    <div className="track"><div className={colors[type]} style={{width:`${Math.min(rate * 10, 100)}%`}}></div></div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="section">
            <div className="slabel">Top publicações do mês <span className="api-tag">media · insights</span></div>
            <div className="card" style={{flex: 'none'}}>
              {topPosts.map(post => (
                <div className="post-row" key={post.id}>
                  <div className="post-thumb">{post.media_type === 'VIDEO' ? '▶' : '■'}</div>
                  <div className="post-info">
                    <div className="post-desc">{post.caption || "Sem legenda"}</div>
                    <div className="post-type">
                      <span className={`pill pill-${post.media_type === 'VIDEO' ? 'reels' : post.media_type === 'CAROUSEL_ALBUM' ? 'carrou' : 'feed'}`}>
                        {post.media_type.replace('_ALBUM', '')}
                      </span> &middot; {new Date(post.timestamp).toLocaleDateString('pt-BR', {day:'numeric', month:'short'})}
                    </div>
                  </div>
                  <div className="post-stats">
                    <div className="pstat"><div className="pv">{post.insights?.reach?.toLocaleString("pt-BR")}</div><div className="pk">alcance</div></div>
                    <div className="pstat"><div className="pv">{(post.insights?.engagement || 0).toLocaleString("pt-BR")}</div><div className="pk">inters.</div></div>
                    <div className="pstat"><div className="pv">{post.insights?.saved || 0}</div><div className="pk">salvos</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <div className="slabel">Stories <span className="api-tag">stories · insights</span></div>
            <div className="m3">
              <div className="mcard">
                <div className="lbl">Stories publicados</div>
                <div className="val">{stories.length}</div>
                <div className="delta neu">{(stories.length / 4).toFixed(0)} por semana</div>
              </div>
              <div className="mcard">
                <div className="lbl">Alcance médio por story</div>
                <div className="val">{avgStoryReach}</div>
                <div className="delta up">↑ visualizações únicas</div>
              </div>
              <div className="mcard">
                <div className="lbl">Retenção média</div>
                <div className="val">72%</div>
                <div className="delta neu">— engajamento</div>
              </div>
            </div>
          </div>

          <div className="section two-col">
            <div className="card">
              <div className="card-title">Audiência <span className="api-tag">audience_demographics</span></div>
              <div className="dem-grid">
                <div className="dem-item">
                  <div className="dem-label">Faixa etária</div>
                  {ageData.slice(0, 4).map(a => (
                    <div className="age-row" key={a.dimension}>
                      <span className="age-key">{a.dimension}</span>
                      <div className="age-bar"><div className="age-fill" style={{width:`${(a.value/totalAudience*100)}%`}}></div></div>
                      <span className="age-val">{(a.value/totalAudience*100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
                <div className="dem-item">
                  <div className="dem-label">Gênero</div>
                  {genderData.map(g => (
                    <div className="age-row" key={g.dimension}>
                      <span className="age-key">{g.dimension}</span>
                      <div className="age-bar"><div className="age-fill" style={{width:`${(g.value/totalAudience*100)}%`}}></div></div>
                      <span className="age-val">{(g.value/totalAudience*100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="dem-divider"></div>
              <div className="dem-label">Cidades com maior alcance</div>
              {cityData.map(c => (
                <div className="row" key={c.dimension}><span className="rk">{c.dimension}</span><span className="rv">{(c.value/totalAudience*100).toFixed(0)}%</span></div>
              ))}
            </div>
            <div className="card">
              <div className="card-title">Melhores horários <span className="api-tag">online_followers</span></div>
              <div className="bar-item">
                <div className="bar-lr"><span>Seg–Sex · 11h–13h</span><strong>pico alto</strong></div>
                <div className="track"><div className="fill-pink" style={{width:'88%'}}></div></div>
              </div>
              <div className="bar-item">
                <div className="bar-lr"><span>Seg–Sex · 18h–21h</span><strong>pico alto</strong></div>
                <div className="track"><div className="fill-pink" style={{width:'82%'}}></div></div>
              </div>
              <div className="bar-item">
                <div className="bar-lr"><span>Sábado · 09h–12h</span><strong>pico médio</strong></div>
                <div className="track"><div className="fill-purple" style={{width:'55%'}}></div></div>
              </div>
              <div className="dem-divider"></div>
              <div className="dem-label">Destaques do período</div>
              <div className="row"><span className="rk">Alcance total</span><span className="rv">{reach.toLocaleString("pt-BR")}</span></div>
              <div className="row"><span className="rk">Novos seguidores</span><span className="rv">{followers > snapshots[0]?.followers ? followers - snapshots[0]?.followers : 0}</span></div>
            </div>
          </div>

          <div className="section">
            <div className="slabel">Observações e próximos passos</div>
            <div className="insight-box">
              <div className="ititle">Análise do período</div>
              <ul className="insight-list">
                <li><span className="arr">→</span> {formatStats.REELS.count > 0 ? `Reels têm ${(formatStats.REELS.inters/formatStats.REELS.reach*100).toFixed(1)}% de engajamento — manter a frequência.` : "Começar a produzir Reels para aumentar o alcance."}</li>
                <li><span className="arr">→</span> O conteúdo gerou {totalInters} interações totais, um CTR de {engRate}% sobre o alcance.</li>
                <li><span className="arr">→</span> {cityData[0]?.dimension || "Sua cidade"} representa a maior fatia da audiência local.</li>
                <li><span className="arr">→</span> {profile?.website_clicks || 0} cliques no link da bio indicam boa conversão de tráfego.</li>
              </ul>
            </div>
          </div>

          <div className="pg-footer">
            <span className="fl">Relatório gerado via UP REPORTS · {currentMonth}</span>
            <span className="fr">Dados via Instagram Graph API</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const PaidTrafficReport = ({ client, ads, creatives, reportConfig }) => {
  const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  const spend = parseFloat(ads?.spend || 0);
  const clicks = parseInt(ads?.clicks || 0);
  const reach = parseInt(ads?.reach || 0);
  const impressions = parseInt(ads?.impressions || 0);
  const ctr = (parseFloat(ads?.ctr || 0)).toFixed(2);
  
  const actions = ads?.actions || [];
  const leads = actions.find(a => a.action_type === 'lead')?.value || 
                actions.find(a => a.action_type === 'contact')?.value || 
                actions.find(a => a.action_type === 'complete_registration')?.value || 
                actions.find(a => a.action_type === 'onsite_conversion.messaging_first_reply')?.value || 0;
  
  const cpl = leads > 0 ? (spend / leads).toFixed(2) : "0,00";

  const countAmplificar = creatives.filter(c => parseFloat(c.ctr) > 1.5).length;
  const countAjustar = creatives.filter(c => parseFloat(c.ctr) >= 0.8 && parseFloat(c.ctr) <= 1.5).length;
  const countPausar = creatives.filter(c => parseFloat(c.ctr) < 0.8).length;

  return (
    <div className="report-page">
      <div className="page">
        <div className="header">
          <div className="header-left">
            <div className="agency">UP REPORTS · Relatório de Tráfego Pago</div>
            <div className="client-name">{client?.name || "Cliente"}</div>
            <div className="client-sub">Segmento do negócio · Relatório gerado via UP REPORTS</div>
          </div>
          <div className="header-right">
            <div className="period-label">Período</div>
            <div className="period">{currentMonth}</div>
            <div className="badge">Relatório Automático</div>
          </div>
        </div>

        <div className="section-label">Visão geral do mês</div>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-label">Investimento total</div>
            <div className="metric-value">R$ {spend.toLocaleString("pt-BR", {minimumFractionDigits: 2})}</div>
            <div className="metric-delta delta-neutral">— dentro do planejado</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Cliques totais</div>
            <div className="metric-value">{clicks.toLocaleString("pt-BR")}</div>
            <div className="metric-delta delta-neutral">— cliques únicos</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Conversões</div>
            <div className="metric-value">{leads}</div>
            <div className="metric-delta delta-neutral">— contatos novos</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Custo por lead</div>
            <div className="metric-value">R$ {cpl}</div>
            <div className="metric-delta delta-neutral">— custo médio</div>
          </div>
        </div>

        <div className="section-label">Desempenho por canal</div>
        <div className="channels-grid">
          <div className="channel-card">
            <div className="channel-header">
              <span className="channel-name">Meta Ads</span>
              <span className="ch-badge badge-meta">Feed + Stories + Reels</span>
            </div>
            <div className="ch-rows">
              <div className="ch-row"><span className="rk">Alcance</span><span className="rv">{reach.toLocaleString("pt-BR")} pessoas</span></div>
              <div className="ch-row"><span className="rk">Cliques no link</span><span className="rv">{clicks.toLocaleString("pt-BR")}</span></div>
              <div className="ch-row"><span className="rk">CTR</span><span className="rv">{ctr}%</span></div>
              <div className="ch-row"><span className="rk">Investimento</span><span className="rv">R$ {spend.toLocaleString("pt-BR", {minimumFractionDigits: 2})}</span></div>
              <div className="ch-row"><span className="rk">Conversões</span><span className="rv">{leads} contatos</span></div>
              <div className="ch-row"><span className="rk">CPL</span><span className="rv">R$ {cpl}</span></div>
            </div>
          </div>
          <div className="channel-card" style={{opacity: 0.4}}>
            <div className="channel-header">
              <span className="channel-name">Google Ads</span>
              <span className="ch-badge badge-google">Pesquisa + Maps</span>
            </div>
            <div className="ch-rows">
              <div className="ch-row"><span className="rk">Impressões</span><span className="rv">0</span></div>
              <div className="ch-row"><span className="rk">Cliques</span><span className="rv">0</span></div>
              <div className="ch-row"><span className="rk">CTR</span><span className="rv">0,0%</span></div>
              <div className="ch-row"><span className="rk">Investimento</span><span className="rv">R$ 0,00</span></div>
              <div className="ch-row"><span className="rk">Conversões</span><span className="rv">0 contatos</span></div>
              <div className="ch-row"><span className="rk">CPL</span><span className="rv">R$ 0,00</span></div>
            </div>
          </div>
        </div>

        <div className="section-label">Distribuição de ações</div>
        <div className="bars-section">
          {actions.length === 0 ? (
             <p style={{fontSize:"9px", color:"#999", textAlign:"center", padding:"20px"}}>Nenhuma ação de conversão registrada no período.</p>
          ) : actions.slice(0, 4).sort((a,b)=>b.value-a.value).map((action, idx) => {
            const pct = (action.value / leads * 100) || 0;
            const colors = ["fill-navy", "fill-gold", "fill-navy2", "fill-gold2"];
            return (
              <div className="bar-item" key={action.action_type}>
                <div className="bar-label-row">
                  <span className="bar-lbl">{action.action_type.replace(/_/g, ' ')}</span>
                  <span className="bar-val">{action.value} ações</span>
                </div>
                <div className="bar-track"><div className={`bar-fill ${colors[idx % 4]}`} style={{width:`${pct}%`}}></div></div>
              </div>
            )
          })}
        </div>

        <div className="spacer-12"></div>

        <div className="section-label">Análise e próximos passos</div>
        <div className="two-col">
          <div className="col-left">
            <div className="insight-box">
              <div className="insight-title">Observações do período</div>
              <ul className="insight-list">
                <li><span className="arrow">→</span> Meta Ads gerou {leads} contatos diretos com CTR médio de {ctr}%.</li>
                <li><span className="arrow">→</span> {reach.toLocaleString("pt-BR")} pessoas foram alcançadas pela marca no período.</li>
                <li><span className="arrow">→</span> {countAmplificar} criativos estão com performance acima da média e devem ser priorizados.</li>
                <li><span className="arrow">→</span> Recomendamos testar novas variações de público para diminuir o CPL de R$ {cpl}.</li>
              </ul>
            </div>
          </div>
          <div className="col-right">
            <div className="metas-box">
              <div className="metas-title">Metas Sugeridas</div>
              <div className="meta-row"><span className="meta-k">Investimento</span><span className="meta-v">R$ {spend.toLocaleString("pt-BR", {minimumFractionDigits: 2})}</span></div>
              <div className="meta-row"><span className="meta-k">Conversões mín.</span><span className="meta-v">{(leads * 1.1).toFixed(0)} contatos</span></div>
              <div className="meta-row"><span className="meta-k">CPL máximo</span><span className="meta-v">R$ {(parseFloat(cpl) * 0.95).toFixed(2)}</span></div>
              <div className="meta-row"><span className="meta-k">CTR Meta mín.</span><span className="meta-v">1,0%</span></div>
              <div className="meta-row"><span className="meta-k">Próximo envio</span><span className="meta-v">Próximo mês</span></div>
            </div>
          </div>
        </div>

        <div style={{flex: 1}}></div>

        <div className="footer">
          <div className="footer-left">Elaborado por <strong>UP REPORTS</strong></div>
          <div className="footer-right">Relatório confidencial · {currentMonth} · Página 1 de 2</div>
        </div>
      </div>

      <div className="page">
        <div className="header-p2">
          <div>
            <div className="p2-title">Análise de criativos</div>
            <div className="p2-sub">Decisões baseadas em performance de CTR e CPL</div>
          </div>
          <div className="p2-right">
            <div className="p2-client">{client?.name}</div>
            <div className="p2-period">{currentMonth} · Página 2 de 2</div>
          </div>
        </div>

        <div className="status-legend">
          <span><span className="dot dot-green"></span> Amplificar — performance acima da média</span>
          <span><span class="dot dot-yellow"></span> Ajustar — potencial identificado</span>
          <span><span class="dot dot-red"></span> Pausar — abaixo do aceitável</span>
        </div>

        <div className="section-label">Resumo dos criativos ativos</div>
        <div className="resumo-grid">
          <div className="resumo-card verde">
            <div className="resumo-header">
              <div className="resumo-icon icon-verde">+</div>
              <div className="resumo-titulo">Para amplificar</div>
            </div>
            <div className="resumo-count">{countAmplificar}</div>
            <div className="resumo-desc">criativos performando bem</div>
          </div>
          <div className="resumo-card amarelo">
            <div className="resumo-header">
              <div className="resumo-icon icon-amarelo">~</div>
              <div className="resumo-titulo">Para ajustar</div>
            </div>
            <div className="resumo-count">{countAjustar}</div>
            <div className="resumo-desc">com potencial a explorar</div>
          </div>
          <div className="resumo-card vermelho">
            <div className="resumo-header">
              <div className="resumo-icon icon-vermelho">x</div>
              <div className="resumo-titulo">Para pausar</div>
            </div>
            <div className="resumo-count">{countPausar}</div>
            <div className="resumo-desc">abaixo do mínimo</div>
          </div>
        </div>

        <div className="section-label">Detalhamento por criativo</div>
        <table className="creatives-table">
          <thead>
            <tr>
              <th style={{width:"25%"}}>Criativo</th>
              <th style={{width:"10%"}}>Canal</th>
              <th style={{width:"12%"}}>Impressões</th>
              <th style={{width:"10%"}}>CTR</th>
              <th style={{width:"12%"}}>Conversões</th>
              <th style={{width:"10%"}}>Status</th>
              <th>Recomendação</th>
            </tr>
          </thead>
          <tbody>
            {creatives.sort((a,b)=>b.ctr-a.ctr).slice(0, 10).map(c => {
              const c_ctr = parseFloat(c.ctr);
              const c_leads = c.actions?.find(a => a.action_type.includes('lead') || a.action_type.includes('contact'))?.value || 0;
              let status = "Ajustar";
              let pillClass = "pill-testar";
              let actionText = "Acompanhar performance e testar pequenas variações de copy.";
              let actionClass = "yellow";
              let rowBg = "#fefdf5";

              if (c_ctr > 1.5) {
                status = "Amplificar";
                pillClass = "pill-ampliar";
                actionText = "Excelente performance. Aumentar investimento gradualmente.";
                actionClass = "green";
                rowBg = "#f8fcf9";
              } else if (c_ctr < 0.8) {
                status = "Pausar";
                pillClass = "pill-pausar";
                actionText = "Performance baixa. Recomendamos pausar e substituir criativo.";
                actionClass = "red";
                rowBg = "#fef8f8";
              }

              return (
                <tr key={c.ad_id} style={{background: rowBg}}>
                  <td>
                    <div className="creative-name">{c.ad_name}</div>
                    <div className="creative-desc">ID: {c.ad_id}</div>
                  </td>
                  <td><span className="canal-pill cp-meta">Meta</span></td>
                  <td><span className="metric-num">{parseInt(c.impressions).toLocaleString("pt-BR")}</span></td>
                  <td><span className="metric-num" style={{color: actionClass==='green'?'#2d7a4f':actionClass==='red'?'#b03030':'#b07a10'}}>{c_ctr.toFixed(2)}%</span></td>
                  <td><span className="metric-num">{c_leads}</span></td>
                  <td><span className={`status-pill ${pillClass}`}>{status}</span></td>
                  <td><span className={`action-text ${actionClass}`}>{actionText}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div style={{flex: 1}}></div>

        <div className="footer">
          <div className="footer-left">Elaborado por <strong>UP REPORTS</strong></div>
          <div className="footer-right">Página 2 de 2</div>
        </div>
      </div>
    </div>
  )
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
<<<<<<< HEAD
  
  // Dashboard Data
  const [profile, setProfile] = useState(null)
=======
  const [igReport, setIgReport] = useState(null)
  const [adsReport, setAdsReport] = useState(null)
>>>>>>> pr-2
  const [media, setMedia] = useState([])
  const [audience, setAudience] = useState(null)
  const [ads, setAds] = useState(null)
  const [summary, setSummary] = useState(null)
  const [snapshots, setSnapshots] = useState([])
  const [stories, setStories] = useState([])
  const [adAccounts, setAdAccounts] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [adCreatives, setAdCreatives] = useState([])
  
  const [loading, setLoading] = useState(false)
  const [loadingAdsData, setLoadingAdsData] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [tab, setTab] = useState("dashboard")
  const [showAddModal, setShowAddModal] = useState(false)
<<<<<<< HEAD
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
    setReportConfig({ active: true, objective: 'all', days: 30, ad_account_id: null, campaign_ids: [] })
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
=======
  const [days, setDays] = useState(30)
  const [error, setError] = useState("")
>>>>>>> pr-2

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
<<<<<<< HEAD
    setFetchError(null)
    const days = reportConfig.days || 30
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
        authFetch(`${API}/api/v1/reports/summary?client_id=${selectedClient}&days=${days}`),
        authFetch(`${API}/api/v1/reports/snapshots?client_id=${selectedClient}&days=${days}`),
      ]

      if (isOrganic) {
        reqs.push(authFetch(`${API}/api/v1/instagram/media?client_id=${selectedClient}&days=${days}`))
        reqs.push(authFetch(`${API}/api/v1/instagram/audience?client_id=${selectedClient}`))
        reqs.push(authFetch(`${API}/api/v1/instagram/stories/history?client_id=${selectedClient}&days=${days}`))
      } else {
        reqs.push(Promise.resolve({ ok: true, json: () => Promise.resolve({data: []}) }))
        reqs.push(Promise.resolve({ ok: true, json: () => Promise.resolve({data: []}) }))
        reqs.push(Promise.resolve({ ok: true, json: () => Promise.resolve({data: []}) }))
      }

      if (isPaid) {
        let adsUrl = `${API}/api/v1/ads/insights?client_id=${selectedClient}&days=${days}`
        let creUrl = `${API}/api/v1/ads/creatives?client_id=${selectedClient}&days=${days}`
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
=======
    setError("")
    try {
      const [igRes, mediaRes, adsRes] = await Promise.all([
        fetch(`${API}/api/instagram/report?client_id=${selectedClient}&days=${days}`),
        fetch(`${API}/api/instagram/media?client_id=${selectedClient}`),
        fetch(`${API}/api/ads/report?client_id=${selectedClient}&days=${days}`),
      ])

      const igJson = await igRes.json()
      const mediaJson = await mediaRes.json()
      const adsJson = await adsRes.json()

      if (!igRes.ok) throw new Error(igJson?.detail?.error?.message || "Falha ao carregar relatório orgânico")
      if (!adsRes.ok) throw new Error(adsJson?.detail?.error?.message || "Falha ao carregar relatório de tráfego pago")

      setIgReport(igJson)
      setAdsReport(adsJson)
      setMedia(mediaJson.data ?? [])
    } catch (e) {
      setError(e.message || "Erro ao carregar relatórios")
>>>>>>> pr-2
    } finally {
      setLoading(false)
    }
  }

<<<<<<< HEAD
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
=======
  useEffect(() => { loadClients() }, [])
  useEffect(() => { if (selectedClient) fetchData() }, [selectedClient, days])

  const profile = igReport?.profile
  const chartData = igReport?.daily || []
>>>>>>> pr-2

  if (!auth?.access_token) {
    return <LoginScreen onLogin={handleLogin} />
  }

  const NavItem = ({ icon: Icon, label, active, onClick }) => (
<<<<<<< HEAD
    <button onClick={onClick} className={`nav-item${active ? ' active' : ''}`} style={{fontFamily:'inherit'}}>
      <Icon size={16}/> {label}
=======
    <button onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "10px", border: "none", cursor: "pointer", background: active ? "rgba(168,85,247,0.15)" : "transparent", color: active ? "#c084fc" : "#475569", fontSize: "14px", marginBottom: "2px" }}>
      <Icon size={17} /> {label}
>>>>>>> pr-2
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
    ]

    const isPaid = reportConfig.objective === 'all' || reportConfig.objective === 'paid';

    return (
      <div style={{padding:"48px 40px",maxWidth:"620px",margin:"0 auto",width:"100%"}}>
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
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.id})</option>
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
            <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
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
          </div>

          <button
            className="btn-primary"
            disabled={isPaid && !reportConfig.ad_account_id}
            onClick={() => { 
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
    )
  }

  const renderHome = () => (
    <div style={{padding:"48px 40px",maxWidth:"1100px",margin:"0 auto",width:"100%"}}>
      <div style={{marginBottom:"36px"}}>
        <h1 style={{fontSize:"26px",fontWeight:"800",color:"var(--text-primary)",letterSpacing:"-0.5px",marginBottom:"6px"}}>Meus Projetos</h1>
        <p style={{fontSize:"14px",color:"var(--text-muted)"}}>Selecione um projeto para gerar relatórios e acessar as métricas.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))",gap:"20px"}}>
        {clients.map(c => (
          <div key={c.id} className="project-card">
            <div style={{display:"flex",alignItems:"center",gap:"14px"}}>
              <div style={{width:"46px",height:"46px",borderRadius:"12px",background:"linear-gradient(135deg,#7c3aed,#ec4899)",flexShrink:0,display:"grid",placeItems:"center",boxShadow:"0 4px 14px rgba(124,58,237,0.3)"}}>
                <BarChart2 size={20} color="white"/>
              </div>
              <div style={{flex:1,overflow:"hidden"}}>
                <div style={{fontSize:"16px",fontWeight:"700",color:"var(--text-primary)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.name}</div>
                <div style={{fontSize:"12px",color:"var(--text-muted)",marginTop:"2px",fontFamily:"monospace"}}>ID: {c.ig_id}</div>
              </div>
              <button
                onClick={() => renameClient(c.id, c.name)}
                title="Renomear Projeto"
                className="btn-icon"
                style={{flexShrink:0,fontFamily:"inherit",fontSize:"14px"}}
              >
                ✏️
              </button>
            </div>
            <div style={{height:"1px",background:"var(--border)"}}/>
            <button
              className="btn-primary"
              onClick={() => startReportConfig(c.id)}
              style={{width:"100%",padding:"11px",fontSize:"14px"}}
            >
              Acessar Painel →
            </button>
          </div>
        ))}
        <div
          onClick={() => setShowAddModal(true)}
          style={{border:"1.5px dashed var(--border-med)",borderRadius:"var(--radius-lg)",padding:"32px 24px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",gap:"10px",color:"var(--text-muted)",transition:"all 0.2s ease",minHeight:"160px"}}
          onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent-light)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-med)'; e.currentTarget.style.color='var(--text-muted)'; }}
        >
          <div style={{width:"40px",height:"40px",borderRadius:"10px",background:"var(--bg-subtle-md)",display:"grid",placeItems:"center"}}>
            <Plus size={20}/>
          </div>
          <span style={{fontSize:"14px",fontWeight:"600"}}>Adicionar Projeto</span>
        </div>
      </div>
    </div>
  )

  return (
<<<<<<< HEAD
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
              </>
            )}
            {(reportConfig?.objective === 'all' || reportConfig?.objective === 'paid') && (
              <NavItem icon={BarChart2} label="Campanhas" active={tab==="ads"} onClick={()=>setTab("ads")}/>
            )}
          </>
        )}

        <div style={{flex:1}}/>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="btn-ghost"
          style={{width:"100%",marginBottom:"6px",fontFamily:"inherit",fontSize:"13px",justifyContent:"flex-start"}}
        >
          {theme === 'dark' ? <Sun size={15}/> : <Moon size={15}/>}
          <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{display:"flex",alignItems:"center",gap:"10px",padding:"9px 12px",borderRadius:"var(--radius-md)",border:"none",background:"transparent",color:"var(--red)",cursor:"pointer",fontFamily:"inherit",fontSize:"13px",fontWeight:"500",width:"100%"}}
        >
          <LogOut size={15}/> Sair
        </button>
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
              {tab==="dashboard"?"Visão Geral":tab==="media"?"Métricas de Publicações":tab==="stories"?"Histórico de Stories":tab==="report"?"Relatório de Instagram":"Relatório de Tráfego Pago"}
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

        {/* ── Dashboard / Reports ── */}
        {!loading && !fetchError && (
          <>

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
              value={summary.totals?.reach?.toLocaleString("pt-BR")} 
              trend={summary.deltas?.reach} 
              previousValue={summary.totals?.prev_reach} 
            />
            <AdvancedStatCard 
              title="Visualizações totais" 
              value={summary.totals?.impressions?.toLocaleString("pt-BR")} 
              trend={summary.deltas?.impressions} 
              previousValue={summary.totals?.prev_impressions} 
            />
            <AdvancedStatCard 
              title="Alcance Total (Orgânico + Pago)" 
              dateRange={dateRangeLabel}
              value={(summary.totals?.reach + parseInt(ads?.reach || 0)).toLocaleString("pt-BR")} 
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
              value={summary.totals?.profile_views?.toLocaleString("pt-BR")} 
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
          </>
        )}
          </div>
        )}
      </div>

      {showAddModal && <AddClientModal authFetch={authFetch} onClose={() => setShowAddModal(false)} onToast={pushToast} />}
      <OAuthPagePicker open={showPicker} pending={oauthPending} loading={completingOauth} onSelect={(pageId, adAccountId) => completeOauthSelection(oauthPending?.oauth_session, pageId, adAccountId)} onClose={() => setShowPicker(false)} />
      <Toasts items={toasts} onDismiss={dismissToast} />      
=======
    <div style={{ display: "flex", minHeight: "100vh", background: "#08080f", color: "#e2e8f0" }}>
      <div style={{ width: "230px", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "28px 16px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ marginBottom: "24px", paddingLeft: "4px" }}>
          <p style={{ color: "#f8fafc", fontWeight: "700", fontSize: "15px" }}>Meta Dash</p>
          <p style={{ color: "#334155", fontSize: "12px" }}>Relatórios Orgânico + Pago</p>
        </div>

        <ClientSwitcher clients={clients} selected={selectedClient} onSelect={setSelectedClient} onAdd={() => setShowAddModal(true)} />

        <NavItem icon={LayoutDashboard} label="Dashboard" active={tab === "dashboard"} onClick={() => setTab("dashboard")} />
        <NavItem icon={Image} label="Publicações" active={tab === "media"} onClick={() => setTab("media")} />
        <NavItem icon={BarChart2} label="Tráfego Pago" active={tab === "ads"} onClick={() => setTab("ads")} />
        <div style={{ flex: 1 }} />
        <NavItem icon={Settings} label="Configurações" active={tab === "settings"} onClick={() => setTab("settings")} />
      </div>

      <div style={{ flex: 1, padding: "40px 48px", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div>
            <h1 style={{ color: "#f8fafc", fontSize: "28px", fontWeight: "800" }}>{tab === "dashboard" ? "Relatório Instagram Orgânico" : tab === "media" ? "Publicações" : tab === "ads" ? "Relatório Tráfego Pago" : "Configurações"}</h1>
            <p style={{ color: "#475569", fontSize: "13px", marginTop: "4px" }}>{profile ? `@${profile.username}` : "Selecione um cliente"}</p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#94a3b8", padding: "10px 12px" }}>
              <option value={7}>Últimos 7 dias</option>
              <option value={14}>Últimos 14 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={90}>Últimos 90 dias</option>
            </select>
            <button onClick={fetchData} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", color: "#94a3b8", fontSize: "13px", cursor: "pointer" }}>
              <RefreshCw size={14} style={loading ? { animation: "spin 1s linear infinite" } : {}} /> Atualizar
            </button>
          </div>
        </div>

        {error && <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", color: "#fecaca", borderRadius: "12px", padding: "12px 16px", marginBottom: "20px" }}>{error}</div>}

        {tab === "dashboard" && (
          <>
            {profile && (
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "24px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "20px" }}>
                <img src={profile.profile_picture_url} alt="" style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(168,85,247,0.5)" }} />
                <div style={{ flex: 1 }}>
                  <p style={{ color: "#f1f5f9", fontWeight: "700", fontSize: "18px" }}>{profile.name}</p>
                  <p style={{ color: "#a855f7", fontSize: "13px" }}>@{profile.username}</p>
                </div>
                <a href={`https://instagram.com/${profile.username}`} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 14px", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.25)", borderRadius: "10px", color: "#c084fc", fontSize: "13px", textDecoration: "none" }}>
                  <ExternalLink size={13} /> Ver perfil
                </a>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "16px" }}>
              <StatCard icon={Users} label="Seguidores" value={formatInt(igReport?.summary?.followers_count)} iconBg="rgba(168,85,247,0.12)" iconColor="#c084fc" />
              <StatCard icon={Eye} label="Alcance no período" value={formatInt(igReport?.summary?.reach)} iconBg="rgba(59,130,246,0.12)" iconColor="#60a5fa" />
              <StatCard icon={TrendingUp} label="Impressões no período" value={formatInt(igReport?.summary?.impressions)} iconBg="rgba(236,72,153,0.12)" iconColor="#f472b6" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "16px", marginBottom: "32px" }}>
              <StatCard icon={MousePointerClick} label="Visitas ao perfil" value={formatInt(igReport?.summary?.profile_views)} iconBg="rgba(34,197,94,0.12)" iconColor="#4ade80" />
              <StatCard icon={Image} label="Publicações totais" value={formatInt(igReport?.summary?.media_count)} iconBg="rgba(250,204,21,0.12)" iconColor="#facc15" />
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "24px" }}>
              <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "20px", fontWeight: "600" }}>Alcance diário — últimos {days} dias</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#475569", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f1f5f9" }} labelStyle={{ color: "#94a3b8" }} />
                  <Area type="monotone" dataKey="reach" stroke="#a855f7" strokeWidth={2} fill="url(#grad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {tab === "media" && (
          media.length === 0
            ? <div style={{ textAlign: "center", color: "#334155", marginTop: "80px" }}>Nenhuma publicação encontrada.</div>
            : <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
              {media.map((post) => (
                <a key={post.id} href={post.permalink} target="_blank" rel="noreferrer" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "14px", overflow: "hidden", textDecoration: "none", display: "block" }}>
                  <div style={{ aspectRatio: "1", background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {(post.thumbnail_url || post.media_url) ? <img src={post.thumbnail_url || post.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Image size={28} color="#334155" />}
                  </div>
                  <div style={{ padding: "10px 12px", display: "flex", gap: "12px" }}>
                    <span style={{ color: "#64748b", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}><Heart size={11} /> {post.like_count ?? 0}</span>
                    <span style={{ color: "#64748b", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}><MessageCircle size={11} /> {post.comments_count ?? 0}</span>
                  </div>
                </a>
              ))}
            </div>
        )}

        {tab === "ads" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "24px" }}>
              <StatCard icon={TrendingUp} label="Investimento" value={formatMoney(adsReport?.summary?.spend)} iconBg="rgba(236,72,153,0.12)" iconColor="#f472b6" />
              <StatCard icon={Eye} label="Impressões" value={formatInt(adsReport?.summary?.impressions)} iconBg="rgba(59,130,246,0.12)" iconColor="#60a5fa" />
              <StatCard icon={MousePointerClick} label="Cliques" value={formatInt(adsReport?.summary?.clicks)} iconBg="rgba(34,197,94,0.12)" iconColor="#4ade80" />
              <StatCard icon={Users} label="Conversões" value={formatInt(adsReport?.summary?.conversions)} iconBg="rgba(168,85,247,0.12)" iconColor="#c084fc" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "24px" }}>
              <StatCard icon={BarChart2} label="CTR" value={`${adsReport?.summary?.ctr ?? 0}%`} iconBg="rgba(250,204,21,0.12)" iconColor="#facc15" />
              <StatCard icon={BarChart2} label="CPC" value={formatMoney(adsReport?.summary?.cpc)} iconBg="rgba(250,204,21,0.12)" iconColor="#facc15" />
              <StatCard icon={BarChart2} label="CPM" value={formatMoney(adsReport?.summary?.cpm)} iconBg="rgba(250,204,21,0.12)" iconColor="#facc15" />
              <StatCard icon={BarChart2} label="CPA" value={formatMoney(adsReport?.summary?.cpa)} iconBg="rgba(250,204,21,0.12)" iconColor="#facc15" />
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", overflow: "hidden" }}>
              <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", fontWeight: 600, fontSize: "13px" }}>Campanhas por investimento</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ color: "#64748b", textAlign: "left" }}>
                      <th style={{ padding: "12px 16px" }}>Campanha</th>
                      <th style={{ padding: "12px 16px" }}>Investimento</th>
                      <th style={{ padding: "12px 16px" }}>Impressões</th>
                      <th style={{ padding: "12px 16px" }}>Cliques</th>
                      <th style={{ padding: "12px 16px" }}>CTR</th>
                      <th style={{ padding: "12px 16px" }}>CPC</th>
                      <th style={{ padding: "12px 16px" }}>Conversões</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(adsReport?.campaigns || []).map((c) => (
                      <tr key={c.campaign_id} style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                        <td style={{ padding: "12px 16px", color: "#e2e8f0" }}>{c.campaign_name}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{formatMoney(c.spend)}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{formatInt(c.impressions)}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{formatInt(c.clicks)}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{c.ctr}%</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{formatMoney(c.cpc)}</td>
                        <td style={{ padding: "12px 16px", color: "#94a3b8" }}>{formatInt(c.conversions)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {showAddModal && <AddClientModal onClose={() => setShowAddModal(false)} onSave={() => { setShowAddModal(false); loadClients() }} />}
>>>>>>> pr-2

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}input::placeholder{color:#334155}::-webkit-scrollbar{width:8px;height:8px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}`}</style>
    </div>
  )
}
