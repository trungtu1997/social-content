import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { LoginScreen } from './components/LoginScreen'
import { DashboardTab } from './components/DashboardTab'
import { ChannelSetupTab } from './components/ChannelSetupTab'
import { ContentMgmtTab } from './components/ContentMgmtTab'
import {
  LayoutDashboard, Settings, Plus, ChevronDown, LogOut, User,
  KeyRound, Facebook, Instagram, Youtube, X, Hash,
  Sparkles, Check, Trash2, AlertCircle
} from 'lucide-react'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [channels, setChannels] = useState([])
  const [activeChannel, setActiveChannel] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard') // dashboard | setup | content
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showAddChannel, setShowAddChannel] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // ── AUTH GUARD ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) { setUser(session.user); loadProfile(session.user.id); loadChannels(session.user.id) }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) { setUser(session.user); loadProfile(session.user.id); loadChannels(session.user.id) }
      else { setUser(null); setProfile(null); setChannels([]); setActiveChannel(null) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(uid) {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
    setProfile(data)
  }

  async function loadChannels(uid) {
    const { data } = await supabase.from('channels').select('*').eq('user_id', uid).order('created_at')
    setChannels(data || [])
    if (data?.length && !activeChannel) setActiveChannel(data[0])
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (session === undefined) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F2F2F0' }}>
      <div style={{ width: 20, height: 20, border: '2px solid #E5E5E1', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
    </div>
  )

  if (!session) return <LoginScreen onLoginSuccess={() => {}} />

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'
  const initials = displayName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F2F2F0', overflow: 'hidden' }}>

      {/* ══ SIDEBAR ══ */}
      <aside style={{ width: 240, flexShrink: 0, background: '#fff', borderRight: '1px solid #E5E5E1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Logo */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0F0EE', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#2563EB,#7C3AED)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={15} color="#fff" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.2px' }}>Social Content</span>
        </div>

        {/* Channel section label */}
        <div style={{ padding: '14px 16px 5px', fontSize: 10, fontWeight: 700, color: '#A8A8A3', textTransform: 'uppercase', letterSpacing: '.08em' }}>Kênh của bạn</div>

        {/* Channels list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
          {channels.length === 0 && (
            <div style={{ padding: '1rem', textAlign: 'center', fontSize: 12, color: '#A8A8A3', lineHeight: 1.6 }}>
              Chưa có kênh nào.<br />Bấm "+ Thêm kênh" để bắt đầu.
            </div>
          )}
          {channels.map(ch => (
            <div key={ch.id} onClick={() => { setActiveChannel(ch); setActiveTab('dashboard') }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 10, cursor: 'pointer', marginBottom: 2, transition: 'background .12s', background: activeChannel?.id === ch.id ? '#EFF6FF' : 'transparent' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid #E5E5E1', background: '#F5F5F3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden', fontSize: 13 }}>
                {ch.logo_url ? <img src={ch.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" /> : platEmoji(ch.platform)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: activeChannel?.id === ch.id ? 600 : 400, color: activeChannel?.id === ch.id ? '#2563EB' : '#111110', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ch.name}</div>
                <div style={{ fontSize: 10, color: '#A8A8A3' }}>{platLabel(ch.platform)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom nav */}
        <div style={{ padding: '8px', borderTop: '1px solid #F0F0EE' }}>
          <button onClick={() => setShowAddChannel(true)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1.5px dashed #D1D5DB', background: 'transparent', color: '#6F6F6B', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit', transition: 'all .15s' }}>
            <Plus size={14} /> Thêm kênh
          </button>
          <div onClick={() => setShowSettings(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 10, cursor: 'pointer', marginTop: 4, color: '#6F6F6B', fontSize: 13, transition: 'background .12s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#F5F5F3'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Settings size={15} /> Cài đặt
          </div>
        </div>
      </aside>

      {/* ══ MAIN COLUMN ══ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* TOPBAR */}
        <header style={{ height: 54, background: '#fff', borderBottom: '1px solid #E5E5E1', display: 'flex', alignItems: 'center', padding: '0 1.5rem', gap: 12, flexShrink: 0 }}>
          {/* Channel tabs */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            {activeChannel && [
              { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={13} /> },
              { id: 'setup', label: 'Cài đặt kênh', icon: <Settings size={13} /> },
              { id: 'content', label: 'Quản lý Content', icon: <Sparkles size={13} /> },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, border: 'none', background: activeTab === t.id ? '#F0F4FF' : 'transparent', color: activeTab === t.id ? '#2563EB' : '#6F6F6B', fontSize: 13, fontWeight: activeTab === t.id ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s' }}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setShowAddChannel(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 9, border: '1px solid #E5E5E1', background: '#fff', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={13} /> Thêm kênh
            </button>

            {/* User menu */}
            <div style={{ position: 'relative' }}>
              <div onClick={() => setShowUserMenu(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 8px', borderRadius: 10, border: '1px solid #E5E5E1', cursor: 'pointer', background: showUserMenu ? '#F5F5F3' : '#fff', transition: 'background .12s' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>
                  {initials}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</span>
                <ChevronDown size={13} color="#A8A8A3" />
              </div>

              {showUserMenu && (
                <div onClick={e => e.stopPropagation()}
                  style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', background: '#fff', border: '1px solid #E5E5E1', borderRadius: 16, width: 220, boxShadow: '0 8px 24px rgba(0,0,0,.1)', zIndex: 100, overflow: 'hidden', animation: 'slideUp .15s' }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid #F0F0EE' }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{displayName}</div>
                    <div style={{ fontSize: 11, color: '#A8A8A3', marginTop: 2 }}>{user?.email}</div>
                  </div>
                  <div style={{ padding: 6 }}>
                    {[
                      { icon: <User size={14} />, label: 'Thông tin cá nhân', action: () => { setShowProfile(true); setShowUserMenu(false) } },
                      { icon: <Settings size={14} />, label: 'Cài đặt', action: () => { setShowSettings(true); setShowUserMenu(false) } },
                    ].map(item => (
                      <div key={item.label} onClick={item.action}
                        style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 9, cursor: 'pointer', fontSize: 13, color: '#374151', transition: 'background .1s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#F5F5F3'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <span style={{ color: '#A8A8A3' }}>{item.icon}</span>{item.label}
                      </div>
                    ))}
                    <div onClick={handleLogout}
                      style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 9, cursor: 'pointer', fontSize: 13, color: '#DC2626', transition: 'background .1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <LogOut size={14} /> Đăng xuất
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }} onClick={() => setShowUserMenu(false)}>
          {!activeChannel ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg,#EFF6FF,#F5F3FF)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Sparkles size={28} color="#2563EB" />
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.3px' }}>Chào mừng đến Social Content!</div>
              <p style={{ fontSize: 14, color: '#6F6F6B', maxWidth: 360, lineHeight: 1.6, marginBottom: 20 }}>
                Thêm kênh mạng xã hội đầu tiên để bắt đầu lên lịch và tạo content tự động bằng AI.
              </p>
              <button onClick={() => setShowAddChannel(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 12, border: 'none', background: '#111110', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Plus size={16} /> Thêm kênh đầu tiên
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && <DashboardTab activeChannel={activeChannel} user={user} />}
              {activeTab === 'setup' && <ChannelSetupTab activeChannel={activeChannel} user={user} onChannelUpdated={ch => { setActiveChannel(ch); setChannels(prev => prev.map(c => c.id === ch.id ? ch : c)) }} />}
              {activeTab === 'content' && <ContentMgmtTab activeChannel={activeChannel} user={user} />}
            </>
          )}
        </main>
      </div>

      {/* ══ MODAL: ADD CHANNEL ══ */}
      {showAddChannel && <AddChannelModal user={user} onClose={() => setShowAddChannel(false)} onCreated={ch => { setChannels(p => [...p, ch]); setActiveChannel(ch); setActiveTab('setup'); setShowAddChannel(false) }} />}

      {/* ══ MODAL: PROFILE ══ */}
      {showProfile && <ProfileModal user={user} profile={profile} onClose={() => setShowProfile(false)} onUpdated={p => setProfile(p)} />}

      {/* ══ MODAL: SETTINGS ══ */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}

// ─────────────────────────────────────────
// ADD CHANNEL MODAL
// ─────────────────────────────────────────
function AddChannelModal({ user, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [platform, setPlatform] = useState('facebook_page')
  const [slogan, setSlogan] = useState('')
  const [desc, setDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim()) return alert('Vui lòng nhập tên kênh')
    setSaving(true)
    const { data, error } = await supabase.from('channels').insert({ user_id: user.id, name: name.trim(), platform, slogan, description: desc }).select().single()
    setSaving(false)
    if (error) return alert('Lỗi: ' + error.message)
    onCreated(data)
  }

  const plats = [
    { v: 'facebook_page', label: 'Facebook Page', emoji: '👤' },
    { v: 'facebook_group', label: 'Facebook Group', emoji: '👥' },
    { v: 'instagram', label: 'Instagram', emoji: '📸' },
    { v: 'threads', label: 'Threads', emoji: '🧵' },
    { v: 'youtube', label: 'YouTube', emoji: '▶️' },
    { v: 'tiktok', label: 'TikTok', emoji: '🎵' },
  ]

  return (
    <Modal title="Thêm kênh mới" onClose={onClose} maxWidth={480}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <F label="Tên kênh *"><input value={name} onChange={e => setName(e.target.value)} placeholder="Ví dụ: Fanpage giày thể thao" style={inp} autoFocus /></F>
        <F label="Nền tảng *">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
            {plats.map(p => (
              <div key={p.v} onClick={() => setPlatform(p.v)}
                style={{ padding: '9px 8px', borderRadius: 10, border: `1.5px solid ${platform === p.v ? '#2563EB' : '#E5E5E1'}`, background: platform === p.v ? '#EFF6FF' : '#FAFAF9', cursor: 'pointer', textAlign: 'center', transition: 'all .12s' }}>
                <div style={{ fontSize: 18, marginBottom: 3 }}>{p.emoji}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: platform === p.v ? '#2563EB' : '#6F6F6B' }}>{p.label}</div>
              </div>
            ))}
          </div>
        </F>
        <F label="Slogan"><input value={slogan} onChange={e => setSlogan(e.target.value)} placeholder="Tagline kênh..." style={inp} /></F>
        <F label="Mô tả ngắn"><textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Kênh này về gì?" style={{ ...inp, minHeight: 70, resize: 'vertical' }} /></F>
      </div>
      <ModalFooter>
        <button onClick={onClose} style={btnSec}>Hủy</button>
        <button onClick={save} disabled={saving} style={{ ...btnDark, display: 'flex', alignItems: 'center', gap: 6 }}>
          {saving ? <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .6s linear infinite', display: 'inline-block' }} /> : <Check size={13} />}
          Tạo kênh
        </button>
      </ModalFooter>
    </Modal>
  )
}

// ─────────────────────────────────────────
// PROFILE MODAL
// ─────────────────────────────────────────
function ProfileModal({ user, profile, onClose, onUpdated }) {
  const [name, setName] = useState(profile?.full_name || '')
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setMsg({ type: '', text: '' }); setSaving(true)
    if (name.trim()) await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', user.id)
    if (pw1) {
      if (pw1 !== pw2) { setMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp' }); setSaving(false); return }
      if (pw1.length < 6) { setMsg({ type: 'error', text: 'Mật khẩu tối thiểu 6 ký tự' }); setSaving(false); return }
      const { error } = await supabase.auth.updateUser({ password: pw1 })
      if (error) { setMsg({ type: 'error', text: error.message }); setSaving(false); return }
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    onUpdated(data); setSaving(false); setMsg({ type: 'success', text: 'Đã lưu thành công!' })
  }

  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'

  return (
    <Modal title="Thông tin cá nhân" onClose={onClose} maxWidth={440}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: '#FAFAF9', borderRadius: 14, border: '1px solid #F0F0EE' }}>
        <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'linear-gradient(135deg,#2563EB,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700 }}>{initials}</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{name || 'Người dùng'}</div>
          <div style={{ fontSize: 12, color: '#A8A8A3' }}>{user?.email}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <F label="Họ và tên"><input value={name} onChange={e => setName(e.target.value)} style={inp} /></F>
        <div style={{ borderTop: '1px solid #F0F0EE', paddingTop: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#374151' }}>Đổi mật khẩu</div>
          <F label="Mật khẩu mới"><input type="password" value={pw1} onChange={e => setPw1(e.target.value)} placeholder="Để trống nếu không đổi" style={inp} /></F>
          <F label="Xác nhận mật khẩu"><input type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Nhập lại mật khẩu mới" style={inp} /></F>
        </div>
        {msg.text && <div style={{ padding: '9px 12px', borderRadius: 9, fontSize: 12, background: msg.type === 'error' ? '#FEF2F2' : '#F0FDF4', color: msg.type === 'error' ? '#DC2626' : '#16A34A', border: `1px solid ${msg.type === 'error' ? '#FECACA' : '#BBF7D0'}` }}>{msg.text}</div>}
      </div>
      <ModalFooter>
        <button onClick={onClose} style={btnSec}>Đóng</button>
        <button onClick={save} disabled={saving} style={{ ...btnDark, display: 'flex', alignItems: 'center', gap: 6 }}>
          {saving ? <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .6s linear infinite', display: 'inline-block' }} /> : <Check size={13} />}
          Lưu thay đổi
        </button>
      </ModalFooter>
    </Modal>
  )
}

// ─────────────────────────────────────────
// SETTINGS MODAL
// ─────────────────────────────────────────
function SettingsModal({ onClose }) {
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem('sc_gemini_key') || '')
  const [saved, setSaved] = useState(false)

  const save = () => {
    localStorage.setItem('sc_gemini_key', geminiKey.trim())
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Modal title="Cài đặt" onClose={onClose} maxWidth={500}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Gemini */}
        <div style={{ background: '#FAFAF9', border: '1px solid #E5E5E1', borderRadius: 14, padding: '1rem' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Sparkles size={14} color="#2563EB" /> Gemini API Key (AI viết bài)
          </div>
          <F label="API Key">
            <input type="password" value={geminiKey} onChange={e => setGeminiKey(e.target.value)} placeholder="AIzaSy..." style={inp} />
          </F>
          <div style={{ fontSize: 11, color: '#A8A8A3', marginTop: 5 }}>
            Lấy miễn phí tại{' '}
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>aistudio.google.com</a>
          </div>
        </div>

        {/* Facebook Guide */}
        <div style={{ background: '#FAFAF9', border: '1px solid #E5E5E1', borderRadius: 14, padding: '1rem' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Kết nối Facebook / Instagram</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              'Vào developers.facebook.com → tạo App miễn phí',
              'Vào Graph API Explorer → chọn Page → lấy Page Access Token',
              'Điền Page ID và Access Token vào Cài đặt từng kênh',
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, fontSize: 12, color: '#374151' }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#EFF6FF', color: '#2563EB', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* GitHub deploy note */}
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: '#166534', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Check size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          App này chạy hoàn toàn miễn phí trên GitHub Pages + Supabase (free tier).
        </div>
      </div>
      <ModalFooter>
        <button onClick={onClose} style={btnSec}>Đóng</button>
        <button onClick={save} style={{ ...btnDark, display: 'flex', alignItems: 'center', gap: 6 }}>
          {saved ? <><Check size={13} /> Đã lưu!</> : <><Check size={13} /> Lưu cài đặt</>}
        </button>
      </ModalFooter>
    </Modal>
  )
}

// ─────────────────────────────────────────
// SHARED UI PRIMITIVES
// ─────────────────────────────────────────
function Modal({ title, onClose, children, maxWidth = 560 }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(3px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="animate-slide-up" style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
        <div style={{ padding: '1.125rem 1.5rem', borderBottom: '1px solid #F0F0EE', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A8A8A3', display: 'flex' }}><X size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>{children}</div>
      </div>
    </div>
  )
}
function ModalFooter({ children }) {
  return <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: '1.25rem', marginTop: '1.25rem', borderTop: '1px solid #F0F0EE' }}>{children}</div>
}
function F({ label, children }) {
  return <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6F6F6B', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</label>{children}</div>
}

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
function platLabel(p) {
  return { facebook_page: 'Facebook Page', facebook_group: 'Facebook Group', instagram: 'Instagram', threads: 'Threads', youtube: 'YouTube', tiktok: 'TikTok' }[p] || p
}
function platEmoji(p) {
  return { facebook_page: '👤', facebook_group: '👥', instagram: '📸', threads: '🧵', youtube: '▶️', tiktok: '🎵' }[p] || '🌐'
}

const inp = { width: '100%', padding: '8px 11px', background: '#FAFAF9', border: '1px solid #E5E5E1', borderRadius: 10, fontSize: 13, color: '#111110', outline: 'none', fontFamily: 'inherit' }
const btnSec = { padding: '8px 16px', borderRadius: 10, border: '1px solid #E5E5E1', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
const btnDark = { padding: '8px 16px', borderRadius: 10, border: 'none', background: '#111110', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
