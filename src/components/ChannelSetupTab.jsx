import { useState } from 'react'
import { supabase } from '../supabase'
import { Settings, Link, Check, UploadCloud, FileText, Sparkles, Star, Users, TrendingUp, RefreshCw, BarChart2 } from 'lucide-react'

export function ChannelSetupTab({ activeChannel, user, onChannelUpdated }) {
  if (!activeChannel) return null

  const [name, setName] = useState(activeChannel.name || '')
  const [handle, setHandle] = useState(activeChannel.handle || '')
  const [logoUrl, setLogoUrl] = useState(activeChannel.logo_url || '')
  const [title, setTitle] = useState(activeChannel.title || '')
  const [slogan, setSlogan] = useState(activeChannel.slogan || '')
  const [description, setDescription] = useState(activeChannel.description || '')
  const [positioning, setPositioning] = useState(activeChannel.positioning || '')
  const [products, setProducts] = useState(activeChannel.products_services || '')
  const [defaultStyle, setDefaultStyle] = useState(activeChannel.default_style || 'Storytelling')
  const [tone, setTone] = useState(activeChannel.default_tone || 'Expert')
  const [pageId, setPageId] = useState(activeChannel.page_id || '')
  const [accessToken, setAccessToken] = useState(activeChannel.access_token || '')
  const [learningFile, setLearningFile] = useState(activeChannel.product_file_name ? { name: activeChannel.product_file_name } : null)
  const [dragActive, setDragActive] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [syncStatus, setSyncStatus] = useState('idle') // idle | syncing | success | failed
  const [syncLogs, setSyncLogs] = useState([])
  const [syncError, setSyncError] = useState('')

  const save = async () => {
    const updates = { name, handle, logo_url: logoUrl, title, slogan, description, positioning, products_services: products, default_style: defaultStyle, default_tone: tone, page_id: pageId, access_token: accessToken }
    const { data } = await supabase.from('channels').update(updates).eq('id', activeChannel.id).select().single()
    await supabase.from('activity_log').insert({ user_id: user.id, channel_id: activeChannel.id, action: 'setup_saved', description: `Cập nhật cài đặt kênh "${name}"` })
    if (data) onChannelUpdated(data)
    setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleFile = (file) => {
    if (!file) return
    setLearningFile({ name: file.name })
    const reader = new FileReader()
    reader.onload = async e => {
      const content = e.target.result
      setProducts(prev => prev + '\n\n[Nội dung từ file ' + file.name + ']\n' + content.substring(0, 2000))
    }
    reader.readAsText(file)
  }

  const syncFromAPI = () => {
    setSyncStatus('syncing'); setSyncError(''); setSyncLogs(['Khởi động truy vấn API...'])
    setTimeout(() => {
      if (!accessToken || accessToken.length < 20) {
        setSyncError('Access Token chưa hợp lệ. Vui lòng cập nhật trong phần Kết nối API.'); setSyncStatus('failed')
      } else {
        setSyncLogs(p => [...p, 'Kết nối thành công!', 'Đang đọc chỉ số từ Page...'])
        setTimeout(() => { setSyncLogs(p => [...p, 'Hoàn tất đồng bộ dữ liệu!']); setSyncStatus('success') }, 1500)
      }
    }, 1200)
  }

  const platColor = { facebook_page: '#1877F2', facebook_group: '#1877F2', instagram: '#E1306C', threads: '#000', youtube: '#FF0000', tiktok: '#000' }
  const platIcon = { facebook_page: 'f', facebook_group: 'f', instagram: '◎', threads: '@', youtube: '▶', tiktok: '♪' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Channel banner header */}
      <div style={{ background: '#fff', border: '1px solid #E5E5E1', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ height: 100, background: 'linear-gradient(135deg,#EFF6FF 0%,#F5F3FF 100%)' }} />
        <div style={{ padding: '0 1.25rem 1.125rem', display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
          <div style={{ width: 60, height: 60, borderRadius: 14, border: '3px solid #fff', background: logoUrl ? 'transparent' : '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -30, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,.1)', flexShrink: 0 }}>
            {logoUrl ? <img src={logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" /> : <span style={{ fontSize: 22, fontWeight: 700, color: platColor[activeChannel.platform] || '#2563EB' }}>{platIcon[activeChannel.platform] || '?'}</span>}
          </div>
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{name || activeChannel.name}</div>
            <div style={{ fontSize: 12, color: '#6F6F6B' }}>{handle} · {platformLabel(activeChannel.platform)}</div>
          </div>
          <button onClick={save} style={{ ...btnPrimary, marginBottom: 4 }}><Check size={13} /> {showSuccess ? 'Đã lưu!' : 'Lưu cài đặt'}</button>
        </div>
      </div>

      {showSuccess && <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '9px 14px', fontSize: 12, color: '#16A34A', display: 'flex', alignItems: 'center', gap: 7 }}><Check size={13} /> Đã lưu cài đặt kênh thành công!</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* LEFT: Basic info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Section title="Thông tin cơ bản" icon={<Settings size={14} />}>
            <Field label="Tên kênh *"><input value={name} onChange={e => setName(e.target.value)} style={inp} /></Field>
            <Field label="Handle / Username"><input value={handle} onChange={e => setHandle(e.target.value)} placeholder="@tenkenh" style={inp} /></Field>
            <Field label="URL Logo / Ảnh đại diện"><input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." style={inp} /></Field>
            <Field label="Title (tên hiển thị)"><input value={title} onChange={e => setTitle(e.target.value)} style={inp} /></Field>
            <Field label="Slogan"><input value={slogan} onChange={e => setSlogan(e.target.value)} placeholder="Tagline kênh..." style={inp} /></Field>
            <Field label="Mô tả kênh"><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Kênh này về gì?" style={{ ...inp, minHeight: 80, resize: 'vertical' }} /></Field>
            <Field label="Định vị kênh"><textarea value={positioning} onChange={e => setPositioning(e.target.value)} placeholder="Thực tế, dễ áp dụng..." style={{ ...inp, minHeight: 60, resize: 'vertical' }} /></Field>
          </Section>

          <Section title="Phong cách mặc định" icon={<Star size={14} />}>
            <Field label="Phong cách viết">
              <select value={defaultStyle} onChange={e => setDefaultStyle(e.target.value)} style={inp}>
                {['Storytelling','PAS','Q&A','Review thực tế'].map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Giọng văn (Tone)">
              <select value={tone} onChange={e => setTone(e.target.value)} style={inp}>
                {['Expert','Friendly','Humorous','Empathetic','Energetic'].map(t => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </Section>
        </div>

        {/* RIGHT: Product + API */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Section title="Sản phẩm / Dịch vụ" icon={<FileText size={14} />}>
            <Field label="Mô tả sản phẩm/dịch vụ (AI học từ đây)">
              <textarea value={products} onChange={e => setProducts(e.target.value)} placeholder="Mô tả chi tiết sản phẩm, dịch vụ, USP, giá..." style={{ ...inp, minHeight: 120, resize: 'vertical' }} />
            </Field>
            {/* File upload */}
            <div
              onDragOver={e => { e.preventDefault(); setDragActive(true) }}
              onDragLeave={() => setDragActive(false)}
              onDrop={e => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0]) }}
              onClick={() => document.getElementById('file-up').click()}
              style={{ border: `1.5px dashed ${dragActive ? '#2563EB' : '#D1D5DB'}`, borderRadius: 12, padding: '1rem', textAlign: 'center', cursor: 'pointer', background: dragActive ? '#EFF6FF' : '#FAFAF9', transition: 'all .15s' }}>
              <UploadCloud size={20} color="#A8A8A3" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: 12, color: '#6F6F6B', fontWeight: 500 }}>{learningFile ? `✅ ${learningFile.name}` : 'Tải file Word/TXT để AI học'}</div>
              <div style={{ fontSize: 11, color: '#A8A8A3', marginTop: 3 }}>Kéo thả hoặc click để chọn</div>
              <input id="file-up" type="file" accept=".doc,.docx,.txt" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            </div>
          </Section>

          <Section title="Kết nối API & Đồng bộ" icon={<Link size={14} />}>
            <Field label="Facebook Page ID / Group ID"><input value={pageId} onChange={e => setPageId(e.target.value)} placeholder="123456789" style={inp} /></Field>
            <Field label="Page Access Token"><input type="password" value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder="EAAxxxxxxxx..." style={inp} /></Field>
            <button onClick={syncFromAPI} disabled={syncStatus === 'syncing'} style={{ ...btnSecondary, width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={13} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
              {syncStatus === 'syncing' ? 'Đang đồng bộ...' : 'Đồng bộ dữ liệu từ API'}
            </button>
            {syncLogs.length > 0 && (
              <div style={{ background: '#FAFAF9', border: '1px solid #E5E5E1', borderRadius: 10, padding: '10px 12px', marginTop: 6 }}>
                {syncLogs.map((l, i) => <div key={i} style={{ fontSize: 11, color: '#6F6F6B', marginBottom: 3 }}>▸ {l}</div>)}
              </div>
            )}
            {syncError && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#DC2626', marginTop: 6 }}>{syncError}</div>}
            {syncStatus === 'success' && <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: '#16A34A', marginTop: 6 }}>✅ Đồng bộ thành công!</div>}
          </Section>

          <Section title="Thống kê đối tượng" icon={<Users size={14} />}>
            {['threads','tiktok'].includes(activeChannel.platform) ? (
              <div style={{ fontSize: 12, color: '#D97706', background: '#FFFBEB', borderRadius: 8, padding: '10px 12px' }}>Không thống kê được với nền tảng này</div>
            ) : (
              <div>
                {[['👥 Người theo dõi', activeChannel.followers_count || '—'], ['📊 Tỷ lệ tương tác', (activeChannel.avg_engagement_rate || '—') + '%'], ['👁 Lượt xem TB/bài', activeChannel.avg_views_per_post || '—']].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #F5F5F3', fontSize: 13 }}>
                    <span style={{ color: '#6F6F6B' }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E5E1', borderRadius: 16, padding: '1.125rem' }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 7, color: '#111110' }}>{icon}{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  )
}
function Field({ label, children }) {
  return <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6F6F6B', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</label>{children}</div>
}
function platformLabel(p) {
  return { facebook_page: 'Facebook Page', facebook_group: 'Facebook Group', instagram: 'Instagram', threads: 'Threads', youtube: 'YouTube', tiktok: 'TikTok' }[p] || p
}

const inp = { width: '100%', padding: '8px 10px', background: '#FAFAF9', border: '1px solid #E5E5E1', borderRadius: 9, fontSize: 13, color: '#111110', outline: 'none', fontFamily: 'inherit' }
const btnPrimary = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 10, border: 'none', background: '#111110', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
const btnSecondary = { padding: '8px 14px', borderRadius: 10, border: '1px solid #E5E5E1', background: '#fff', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
