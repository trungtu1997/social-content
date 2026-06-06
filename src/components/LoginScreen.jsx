import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Mail, Lock, Sparkles, Chrome, ShieldAlert, Eye, EyeOff } from 'lucide-react'

export function LoginScreen({ onLoginSuccess }) {
  const [mode, setMode] = useState('login') // login | register | forgot | google
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [googleEmail, setGoogleEmail] = useState('')
  const [googleName, setGoogleName] = useState('')
  const [googleClientId, setGoogleClientId] = useState(() => localStorage.getItem('sc_google_client_id') || '')
  const [errorMsg, setErrorMsg] = useState('')
  const [infoMsg, setInfoMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const clear = () => { setErrorMsg(''); setInfoMsg('') }

  // ── SUPABASE AUTH ──
  const handleLogin = async (e) => {
    e.preventDefault(); clear()
    if (!email || !password) return setErrorMsg('Vui lòng nhập đầy đủ thông tin.')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setErrorMsg('Email hoặc mật khẩu không đúng.')
    else onLoginSuccess()
  }

  const handleRegister = async (e) => {
    e.preventDefault(); clear()
    if (!email || !password || !name) return setErrorMsg('Vui lòng điền đầy đủ thông tin.')
    if (password.length < 6) return setErrorMsg('Mật khẩu tối thiểu 6 ký tự.')
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
    setLoading(false)
    if (error) setErrorMsg(error.message)
    else { setInfoMsg('Đăng ký thành công! Kiểm tra email để xác nhận tài khoản.'); setMode('login') }
  }

  const handleForgot = async (e) => {
    e.preventDefault(); clear()
    if (!email) return setErrorMsg('Vui lòng nhập email.')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password'
    })
    setLoading(false)
    if (error) setErrorMsg(error.message)
    else setInfoMsg('Đã gửi link đặt lại mật khẩu vào email của bạn!')
  }

  const handleGoogleOAuth = async () => {
    const clientId = googleClientId.trim()
    if (clientId && !clientId.includes('YOUR_')) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      })
      if (error) setErrorMsg(error.message)
    } else {
      setMode('google'); clear()
    }
  }

  const handleGoogleSandbox = async (e) => {
    e.preventDefault(); clear()
    if (!googleEmail || !googleEmail.includes('@')) return setErrorMsg('Vui lòng nhập Gmail hợp lệ.')
    const finalName = googleName.trim() || googleEmail.split('@')[0]
    // Register sandbox user
    const pw = 'oauth_sandbox_' + googleEmail
    const { error: signUpErr } = await supabase.auth.signUp({ email: googleEmail, password: pw, options: { data: { full_name: finalName } } })
    if (signUpErr && !signUpErr.message.includes('already')) return setErrorMsg(signUpErr.message)
    const { error } = await supabase.auth.signInWithPassword({ email: googleEmail, password: pw })
    if (error) setErrorMsg(error.message)
    else onLoginSuccess()
  }

  // floating blobs
  const blobs = [
    { cls: 'animate-float-1', style: { width: 220, height: 220, top: '8%', left: '12%', background: 'rgba(59,130,246,0.07)', filter: 'blur(40px)', borderRadius: '50%' } },
    { cls: 'animate-float-2', style: { width: 300, height: 300, top: '55%', left: '65%', background: 'rgba(99,102,241,0.06)', filter: 'blur(50px)', borderRadius: '50%' } },
    { cls: 'animate-float-1', style: { width: 150, height: 150, top: '72%', left: '8%', background: 'rgba(59,130,246,0.08)', filter: 'blur(30px)', borderRadius: '50%' } },
    { cls: 'animate-float-2', style: { width: 100, height: 100, top: '20%', left: '78%', background: 'rgba(139,92,246,0.08)', filter: 'blur(25px)', borderRadius: '50%' } },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F3', position: 'relative', overflow: 'hidden', padding: '1.5rem' }}>
      {/* Blobs */}
      {blobs.map((b, i) => (
        <div key={i} className={b.cls} style={{ position: 'absolute', pointerEvents: 'none', ...b.style }} />
      ))}

      {/* Card */}
      <div className="animate-slide-up" style={{ background: '#fff', border: '1px solid #E5E5E1', borderRadius: 24, padding: '2.25rem', width: '100%', maxWidth: 400, position: 'relative', zIndex: 2, boxShadow: '0 8px 32px rgba(0,0,0,.08)' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#2563EB,#7C3AED)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>Social Content</span>
        </div>
        <p style={{ fontSize: 13, color: '#6F6F6B', marginBottom: '1.75rem' }}>Quản lý mọi kênh social, tự động bằng AI</p>

        {/* Messages */}
        {errorMsg && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '9px 12px', fontSize: 12, color: '#DC2626', marginBottom: '1rem' }}>{errorMsg}</div>}
        {infoMsg  && <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '9px 12px', fontSize: 12, color: '#16A34A', marginBottom: '1rem' }}>{infoMsg}</div>}

        {/* ── GOOGLE MODE ── */}
        {mode === 'google' && (
          <form onSubmit={handleGoogleSandbox}>
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14, padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                <ShieldAlert size={16} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>Kích Hoạt Google OAuth Thật</div>
                  <p style={{ fontSize: 10, color: '#B45309', lineHeight: 1.6 }}>Nhập Google Client ID để dùng xác thực Google thật sự:</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="text" value={googleClientId} onChange={e => { setGoogleClientId(e.target.value); localStorage.setItem('sc_google_client_id', e.target.value) }}
                  placeholder="xxxx.apps.googleusercontent.com"
                  style={inputStyle} />
                <button type="button" onClick={handleGoogleOAuth} style={{ ...btnStyle, background: '#2563EB', color: '#fff', whiteSpace: 'nowrap', fontSize: 11 }}>Kết nối</button>
              </div>
            </div>

            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 12px', marginBottom: '1rem', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Chrome size={14} color="#2563EB" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 11, color: '#1D4ED8', fontWeight: 500 }}>Chưa có Client ID? Nhập Gmail bên dưới để trải nghiệm thử:</div>
            </div>

            <FieldWrap label="Email Google (Gmail)">
              <InputIcon icon={<Mail size={14} color="#A8A8A3" />}>
                <input type="email" required value={googleEmail} onChange={e => setGoogleEmail(e.target.value)} placeholder="user@gmail.com" style={{ ...inputStyle, paddingLeft: 36 }} />
              </InputIcon>
            </FieldWrap>
            <FieldWrap label="Họ và tên">
              <InputIcon icon={<Sparkles size={14} color="#A8A8A3" />}>
                <input type="text" value={googleName} onChange={e => setGoogleName(e.target.value)} placeholder="Nguyễn Văn A" style={{ ...inputStyle, paddingLeft: 36 }} />
              </InputIcon>
            </FieldWrap>
            <button type="submit" style={{ ...btnStyle, ...btnPrimary, width: '100%', justifyContent: 'center', marginTop: 8 }}>
              <Chrome size={15} /> Xác nhận kết nối Gmail
            </button>
            <button type="button" onClick={() => { setMode('login'); clear() }} style={{ width: '100%', background: 'none', border: 'none', color: '#6F6F6B', fontSize: 12, marginTop: 12, cursor: 'pointer', textDecoration: 'underline' }}>
              Quay lại đăng nhập thông thường
            </button>
          </form>
        )}

        {/* ── FORGOT ── */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgot}>
            <p style={{ fontSize: 13, color: '#6F6F6B', marginBottom: '1.25rem' }}>Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu.</p>
            <FieldWrap label="Email đã đăng ký">
              <InputIcon icon={<Mail size={14} color="#A8A8A3" />}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" style={{ ...inputStyle, paddingLeft: 36 }} />
              </InputIcon>
            </FieldWrap>
            <button type="submit" disabled={loading} style={{ ...btnStyle, ...btnPrimary, width: '100%', justifyContent: 'center', marginTop: 8 }}>
              {loading ? <span className="animate-spin" style={spinnerStyle} /> : null} Gửi link đặt lại
            </button>
            <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: '#6F6F6B' }}>
              <button type="button" onClick={() => { setMode('login'); clear() }} style={linkBtn}>← Quay lại đăng nhập</button>
            </div>
          </form>
        )}

        {/* ── REGISTER ── */}
        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <FieldWrap label="Họ và tên">
              <InputIcon icon={<Sparkles size={14} color="#A8A8A3" />}>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nguyễn Văn A" style={{ ...inputStyle, paddingLeft: 36 }} />
              </InputIcon>
            </FieldWrap>
            <FieldWrap label="Email">
              <InputIcon icon={<Mail size={14} color="#A8A8A3" />}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" style={{ ...inputStyle, paddingLeft: 36 }} />
              </InputIcon>
            </FieldWrap>
            <FieldWrap label="Mật khẩu">
              <InputIcon icon={<Lock size={14} color="#A8A8A3" />} right={
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A8A8A3', padding: '0 10px' }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Tối thiểu 6 ký tự" style={{ ...inputStyle, paddingLeft: 36, paddingRight: 36 }} />
              </InputIcon>
            </FieldWrap>
            <button type="submit" disabled={loading} style={{ ...btnStyle, ...btnPrimary, width: '100%', justifyContent: 'center', marginTop: 8 }}>
              {loading ? <span className="animate-spin" style={spinnerStyle} /> : null} Tạo tài khoản
            </button>
            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#6F6F6B' }}>
              Đã có tài khoản? <button type="button" onClick={() => { setMode('login'); clear() }} style={linkBtn}>Đăng nhập</button>
            </div>
          </form>
        )}

        {/* ── LOGIN ── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <FieldWrap label="Email">
              <InputIcon icon={<Mail size={14} color="#A8A8A3" />}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" style={{ ...inputStyle, paddingLeft: 36 }} autoFocus />
              </InputIcon>
            </FieldWrap>
            <FieldWrap label="Mật khẩu">
              <InputIcon icon={<Lock size={14} color="#A8A8A3" />} right={
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A8A8A3', padding: '0 10px' }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={{ ...inputStyle, paddingLeft: 36, paddingRight: 36 }} />
              </InputIcon>
            </FieldWrap>
            <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
              <button type="button" onClick={() => { setMode('forgot'); clear() }} style={linkBtn}>Quên mật khẩu?</button>
            </div>
            <button type="submit" disabled={loading} style={{ ...btnStyle, ...btnPrimary, width: '100%', justifyContent: 'center' }}>
              {loading ? <span className="animate-spin" style={spinnerStyle} /> : null} Đăng nhập
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '1.25rem 0', color: '#A8A8A3', fontSize: 11 }}>
              <div style={{ flex: 1, borderTop: '1px solid #E5E5E1' }} /><span>Hoặc sử dụng</span><div style={{ flex: 1, borderTop: '1px solid #E5E5E1' }} />
            </div>

            <button type="button" onClick={handleGoogleOAuth} style={{ ...btnStyle, width: '100%', justifyContent: 'center', border: '1px solid #E5E5E1', background: '#fff', color: '#111110' }}>
              <svg width="16" height="16" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/><path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/></svg>
              Đăng nhập bằng Google
            </button>

            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: '#6F6F6B' }}>
              Chưa có tài khoản? <button type="button" onClick={() => { setMode('register'); clear() }} style={linkBtn}>Đăng ký miễn phí</button>
            </div>
          </form>
        )}

        {/* Footer hint */}
        <p style={{ fontSize: 11, color: '#A8A8A3', textAlign: 'center', marginTop: '1.5rem' }}>
          Mỗi tài khoản có dữ liệu riêng biệt, bảo mật tuyệt đối.
        </p>
      </div>
    </div>
  )
}

// ── Mini helpers ──
function FieldWrap({ label, children }) {
  return <div style={{ marginBottom: '0.875rem' }}><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6F6F6B', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</label>{children}</div>
}
function InputIcon({ icon, right, children }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <span style={{ position: 'absolute', left: 10, pointerEvents: 'none', display: 'flex' }}>{icon}</span>
      {children}
      {right && <span style={{ position: 'absolute', right: 0, display: 'flex' }}>{right}</span>}
    </div>
  )
}

const inputStyle = { width: '100%', padding: '9px 12px', background: '#FAFAF9', border: '1px solid #E5E5E1', borderRadius: 10, fontSize: 13, color: '#111110', outline: 'none', fontFamily: 'inherit' }
const btnStyle = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }
const btnPrimary = { background: '#2563EB', color: '#fff' }
const linkBtn = { background: 'none', border: 'none', color: '#2563EB', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
const spinnerStyle = { display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%' }
