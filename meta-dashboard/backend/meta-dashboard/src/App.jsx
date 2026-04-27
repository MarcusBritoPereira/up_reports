import { useState, useEffect } from "react"
import { Users, TrendingUp, Image, RefreshCw, Heart, MessageCircle, ExternalLink, LayoutDashboard, BarChart2, Settings, ChevronDown, Plus, Check, Eye, MousePointerClick } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const API = "http://localhost:8000"

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
      </div>
    </div>
  )
}

function ClientSwitcher({ clients, selected, onSelect, onAdd }) {
  const [open, setOpen] = useState(false)
  const current = clients.find((c) => c.id === selected)

  return (
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
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

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
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [igReport, setIgReport] = useState(null)
  const [adsReport, setAdsReport] = useState(null)
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState("dashboard")
  const [showAddModal, setShowAddModal] = useState(false)
  const [days, setDays] = useState(30)
  const [error, setError] = useState("")

  const loadClients = async () => {
    const r = await fetch(`${API}/api/clients/`)
    const data = await r.json()
    setClients(data)
    if (data.length > 0 && !selectedClient) setSelectedClient(data[0].id)
  }

  const fetchData = async () => {
    if (!selectedClient) return
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadClients() }, [])
  useEffect(() => { if (selectedClient) fetchData() }, [selectedClient, days])

  const profile = igReport?.profile
  const chartData = igReport?.daily || []

  const NavItem = ({ icon: Icon, label, active, onClick }) => (
    <button onClick={onClick} style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "10px", border: "none", cursor: "pointer", background: active ? "rgba(168,85,247,0.15)" : "transparent", color: active ? "#c084fc" : "#475569", fontSize: "14px", marginBottom: "2px" }}>
      <Icon size={17} /> {label}
    </button>
  )

  return (
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

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}*{box-sizing:border-box}input::placeholder{color:#334155}`}</style>
    </div>
  )
}
