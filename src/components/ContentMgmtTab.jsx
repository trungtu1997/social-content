import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Sparkles, Calendar, Plus, Eye, Edit3, Trash2, CheckCircle, Clock, Check, X, RefreshCw, Layers, ChevronLeft, ChevronRight, AlertTriangle, Download } from 'lucide-react'

const GEMINI_KEY = () => localStorage.getItem('sc_gemini_key') || ''

export function ContentMgmtTab({ activeChannel, user }) {
  if (!activeChannel) return null

  const [posts, setPosts] = useState([])
  const [viewMode, setViewMode] = useState('calendar')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [step, setStep] = useState('form') // form | outlines | generating
  const [outlines, setOutlines] = useState([])
  const [checkedOutlines, setCheckedOutlines] = useState({})
  const [generatingIdx, setGeneratingIdx] = useState(0)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [draggedPost, setDraggedPost] = useState(null)

  // ── BRIEF FORM STATE (all 30 fields) ──
  const [postCount, setPostCount] = useState(3)
  const [goal, setGoal] = useState('conversion')
  const [context, setContext] = useState('Ra mắt sản phẩm mới')
  const [demographics, setDemographics] = useState('25–35 tuổi, nhân viên văn phòng')
  const [painPoints, setPainPoints] = useState('')
  const [desires, setDesires] = useState('')
  const [style, setStyle] = useState('Storytelling')
  const [tone, setTone] = useState(activeChannel.default_tone || 'Expert')
  const [usp, setUsp] = useState('')
  const [coreFacts, setCoreFacts] = useState('')
  const [formatOption, setFormatOption] = useState('Bullet points rõ ràng, có đề mục H2/H3')
  const [wordLimit, setWordLimit] = useState(300)
  const [headings, setHeadings] = useState(2)
  const [forbiddenWords, setForbiddenWords] = useState('')
  const [imageOption, setImageOption] = useState('internet')
  const [suggestImage, setSuggestImage] = useState(true)
  const [cta, setCta] = useState('Click vào link Bio hoặc inbox để nhận ưu đãi')
  const [language, setLanguage] = useState('Tiếng Việt')
  const [hashtagMode, setHashtagMode] = useState('ai')
  const [hashtagCustom, setHashtagCustom] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [frequency, setFrequency] = useState('daily')
  const [postTime, setPostTime] = useState('08:00')
  const [aiSuggestTime, setAiSuggestTime] = useState(false)
  const [topicOption, setTopicOption] = useState('configured')
  const [customTopic, setCustomTopic] = useState('')

  useEffect(() => { loadPosts() }, [activeChannel])

  async function loadPosts() {
    const { data } = await supabase.from('posts').select('*').eq('channel_id', activeChannel.id).eq('user_id', user.id).order('scheduled_at', { ascending: true })
    setPosts(data || [])
  }

  // ── STEP 1: Generate outlines ──
  async function generateOutlines() {
    const key = GEMINI_KEY()
    if (!key) return alert('Vui lòng cài Gemini API Key trong Cài đặt trước!')
    setStep('generating')
    const brief = buildBriefText()
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Bạn là chuyên gia content marketing. Tạo ${postCount} tiêu đề bài đăng mạng xã hội cho kênh "${activeChannel.name}".

${brief}

Trả về JSON array ONLY (không markdown, không giải thích):
[{"title":"Tiêu đề 1","angle":"Góc tiếp cận ngắn","dayOffset":0},{"title":"Tiêu đề 2","angle":"...","dayOffset":2}]` }] }] })
      })
      const d = await res.json()
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
      let parsed = []
      try { parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) } catch {
        parsed = text.split('\n').filter(l => l.trim() && !l.startsWith('[')).slice(0, postCount).map((t, i) => ({ title: t.replace(/^\d+\.\s*/, ''), angle: '', dayOffset: i }))
      }
      const withDates = parsed.map((o, i) => {
        const d = new Date(startDate); d.setDate(d.getDate() + (o.dayOffset ?? i * (frequency === 'daily' ? 1 : frequency === 'every2days' ? 2 : 7)))
        return { ...o, scheduledDate: d.toISOString().split('T')[0], scheduledTime: postTime, checked: true }
      })
      setOutlines(withDates)
      const checks = {}; withDates.forEach((_, i) => { checks[i] = true }); setCheckedOutlines(checks)
      setStep('outlines')
    } catch (e) { alert('Lỗi AI: ' + e.message); setStep('form') }
  }

  // ── STEP 2: Generate full content for approved outlines ──
  async function generateContent() {
    const key = GEMINI_KEY()
    const selected = outlines.filter((_, i) => checkedOutlines[i])
    if (!selected.length) return alert('Chọn ít nhất 1 tiêu đề!')
    setStep('generating')
    const newPosts = []
    for (let i = 0; i < selected.length; i++) {
      setGeneratingIdx(i)
      const o = selected[i]
      let content = '', imagePrompt = '', imageUrl = ''
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: buildContentPrompt(o) }] }] })
        })
        const d = await res.json()
        content = d.candidates?.[0]?.content?.parts?.[0]?.text || ''
        if (imageOption === 'ai') {
          imagePrompt = `Social media photo for: ${o.title}, ${activeChannel.name}, professional, high quality`
          imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=800&height=600&nologo=true`
        } else if (imageOption === 'internet') {
          const q = encodeURIComponent(o.title + ' ' + (activeChannel.title || ''))
          imageUrl = `https://source.unsplash.com/800x600/?${q}`
        }
      } catch { content = 'Lỗi tạo nội dung. Bạn có thể sửa thủ công.' }

      const scheduledAt = `${o.scheduledDate}T${o.scheduledTime}:00`
      const { data } = await supabase.from('posts').insert({
        channel_id: activeChannel.id, user_id: user.id,
        title: o.title, content, image_url: imageUrl, image_prompt: imagePrompt,
        hashtags: hashtagMode === 'ai' ? '' : hashtagCustom,
        status: 'draft_outline', scheduled_at: scheduledAt,
      }).select().single()
      if (data) newPosts.push(data)
      await supabase.from('activity_log').insert({ user_id: user.id, channel_id: activeChannel.id, post_id: data?.id, action: 'created', description: `AI tạo bài: "${o.title}"` })
    }
    loadPosts(); setIsModalOpen(false); setStep('form'); setOutlines([])
  }

  function buildBriefText() {
    return `Thông tin kênh: ${activeChannel.name} (${activeChannel.platform})
Mô tả: ${activeChannel.description || 'Chưa có'}
Sản phẩm/dịch vụ: ${activeChannel.products_services || 'Chưa có'}

Yêu cầu:
- Mục đích: ${goal}
- Bối cảnh: ${context}
- Khách hàng: ${demographics}
- Pain points: ${painPoints}
- Mong muốn: ${desires}
- Phong cách: ${style}
- Tone: ${tone}
- USP: ${usp}
- Dữ liệu bắt buộc: ${coreFacts}
- Chủ đề: ${topicOption === 'custom' ? customTopic : 'Xoay quanh sản phẩm/dịch vụ kênh'}
- Ngôn ngữ: ${language}`
  }

  function buildContentPrompt(outline) {
    const ctaLine = `CTA cuối bài: ${cta}`
    const hashLine = hashtagMode === 'ai' ? 'Tự tạo 5–8 hashtag phù hợp ở cuối.' : hashtagMode === 'manual' ? `Hashtag: ${hashtagCustom}` : 'Không dùng hashtag.'
    const formatLine = `Format: ${formatOption}. Tối đa ${wordLimit} từ. ${headings > 0 ? `Dùng ${headings} tiêu đề phụ.` : ''}`
    const forbidLine = forbiddenWords ? `TUYỆT ĐỐI không dùng: ${forbiddenWords}` : ''
    const imageLine = suggestImage ? 'Cuối bài thêm dòng "Gợi ý ảnh: [mô tả ảnh phù hợp]".' : ''
    return `Viết bài đăng mạng xã hội cho kênh "${activeChannel.name}".

Tiêu đề: ${outline.title}
Góc tiếp cận: ${outline.angle}
${buildBriefText()}
Dữ liệu bắt buộc KHÔNG sai: ${coreFacts}
${forbidLine}
${formatLine}
${ctaLine}
${hashLine}
${imageLine}
Ngôn ngữ: ${language}

Chỉ trả về nội dung bài viết hoàn chỉnh.`
  }

  const updateOutline = (i, field, value) => setOutlines(prev => prev.map((o, idx) => idx === i ? { ...o, [field]: value } : o))

  // Calendar helpers
  const yr = currentDate.getFullYear(), mo = currentDate.getMonth()
  const firstDay = new Date(yr, mo, 1).getDay()
  const daysInMonth = new Date(yr, mo + 1, 0).getDate()
  const today = new Date()
  const months = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']
  const dows = ['CN','T2','T3','T4','T5','T6','T7']
  const postsByDate = {}
  posts.forEach(p => { const d = p.scheduled_at?.split('T')[0]; if (d) { if (!postsByDate[d]) postsByDate[d] = []; postsByDate[d].push(p) } })

  const scColor = { published: { bg: '#F0FDF4', c: '#16A34A' }, approved_scheduled: { bg: '#EFF6FF', c: '#2563EB' }, draft_outline: { bg: '#F5F5F4', c: '#6F6F6B' }, cancelled: { bg: '#FEF2F2', c: '#DC2626' }, pending_review: { bg: '#FFFBEB', c: '#D97706' } }
  const scLabel = { published: 'Đã đăng', approved_scheduled: 'Chờ đăng', draft_outline: 'Nháp', cancelled: 'Hủy', pending_review: 'Chờ duyệt' }

  const handleDrop = async (e, dayDate) => {
    e.preventDefault()
    if (!draggedPost) return
    const dateStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth()+1).padStart(2,'0')}-${String(dayDate.getDate()).padStart(2,'0')}`
    const time = draggedPost.scheduled_at?.split('T')[1] || '08:00:00'
    await supabase.from('posts').update({ scheduled_at: `${dateStr}T${time}`, updated_at: new Date().toISOString() }).eq('id', draggedPost.id)
    setDraggedPost(null); loadPosts()
  }

  const approvePost = async (post) => {
    await supabase.from('posts').update({ status: 'approved_scheduled' }).eq('id', post.id)
    await supabase.from('activity_log').insert({ user_id: user.id, channel_id: activeChannel.id, action: 'approved', description: `Duyệt lên lịch: "${post.title}"` })
    loadPosts()
  }

  const deletePost = async (id, title) => {
    if (!confirm(`Xóa bài "${title}"?`)) return
    await supabase.from('posts').delete().eq('id', id)
    loadPosts()
  }

  const exportCSV = () => {
    const header = ['Tiêu đề','Nội dung','Giờ đăng','Trạng thái','Hashtag']
    const rows = posts.map(p => [p.title, (p.content||'').replace(/\n/g,' '), p.scheduled_at, scLabel[p.status]||p.status, p.hashtags||''])
    const csv = [header, ...rows].map(r => r.map(c => `"${(c||'').replace(/"/g,'""')}"`).join(',')).join('\n')
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv); a.download = `content-${activeChannel.name}.csv`; a.click()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['calendar','list'].map(m => (
            <button key={m} onClick={() => setViewMode(m)} style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid #E5E5E1', background: viewMode === m ? '#111110' : '#fff', color: viewMode === m ? '#fff' : '#6F6F6B', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
              {m === 'calendar' ? <><Calendar size={13} /> Lịch</> : <><Layers size={13} /> Danh sách</>}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={exportCSV} style={{ ...btnSec, display: 'flex', alignItems: 'center', gap: 6 }}><Download size={13} /> Xuất CSV</button>
          <button onClick={() => { setIsModalOpen(true); setStep('form') }} style={{ ...btnDark, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Sparkles size={14} /> Tạo content AI
          </button>
        </div>
      </div>

      {/* CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div style={{ background: '#fff', border: '1px solid #E5E5E1', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #F0F0EE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{months[mo]} {yr}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setCurrentDate(new Date(yr, mo-1, 1))} style={navBtn}>‹</button>
              <button onClick={() => setCurrentDate(new Date(yr, mo+1, 1))} style={navBtn}>›</button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {dows.map(d => <div key={d} style={{ padding: '7px 4px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#A8A8A3', background: '#FAFAF9', borderBottom: '1px solid #F0F0EE' }}>{d}</div>)}
            {Array.from({ length: firstDay }).map((_, i) => <div key={'e'+i} style={{ minHeight: 90, borderRight: '1px solid #F0F0EE', borderBottom: '1px solid #F0F0EE' }} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dateStr = `${yr}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const isToday = today.getFullYear()===yr && today.getMonth()===mo && today.getDate()===day
              const dp = postsByDate[dateStr] || []
              const col = (firstDay + i) % 7
              const dayDate = new Date(yr, mo, day)
              return (
                <div key={day}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDrop(e, dayDate)}
                  style={{ minHeight: 90, padding: 5, borderRight: col===6?'none':'1px solid #F0F0EE', borderBottom: '1px solid #F0F0EE', background: draggedPost ? '#F8F9FF' : 'transparent', transition: 'background .1s' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, background: isToday ? '#111110' : 'transparent', color: isToday ? '#fff' : '#6F6F6B', marginBottom: 3 }}>{day}</div>
                  {dp.slice(0, 3).map(p => (
                    <div key={p.id} draggable onDragStart={() => setDraggedPost(p)}
                      style={{ fontSize: 10, padding: '2px 5px', borderRadius: 4, marginBottom: 2, cursor: 'grab', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', background: scColor[p.status]?.bg || '#F5F5F4', color: scColor[p.status]?.c || '#6F6F6B' }}>
                      {p.title}
                    </div>
                  ))}
                  {dp.length > 3 && <div style={{ fontSize: 10, color: '#A8A8A3' }}>+{dp.length-3}</div>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#A8A8A3', background: '#fff', border: '1px solid #E5E5E1', borderRadius: 16 }}>
              <Sparkles size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }} />
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: '#6F6F6B' }}>Chưa có bài viết nào</div>
              <p style={{ fontSize: 13, marginBottom: 14 }}>Bấm "Tạo content AI" để bắt đầu</p>
              <button onClick={() => { setIsModalOpen(true); setStep('form') }} style={btnDark}><Sparkles size={13} /> Tạo content AI</button>
            </div>
          ) : posts.map(p => (
            <div key={p.id} style={{ background: '#fff', border: '1px solid #E5E5E1', borderRadius: 14, padding: '1rem 1.125rem', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 46, height: 46, borderRadius: 10, background: '#FAFAF9', border: '1px solid #E5E5E1', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D1D5DB', fontSize: 20 }}>
                {p.image_url ? <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" /> : '🖼'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                <div style={{ fontSize: 12, color: '#6F6F6B', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.content}</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 11, color: '#A8A8A3', flexWrap: 'wrap' }}>
                  {p.scheduled_at && <span><Clock size={10} style={{ display: 'inline', marginRight: 3, verticalAlign: '-1px' }} />{new Date(p.scheduled_at).toLocaleString('vi-VN')}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: scColor[p.status]?.bg, color: scColor[p.status]?.c }}>{scLabel[p.status]}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {p.status === 'draft_outline' && p.content && (
                    <button onClick={() => approvePost(p)} style={{ ...btnSec, fontSize: 11, padding: '4px 10px', color: '#2563EB', borderColor: '#BFDBFE', background: '#EFF6FF', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={11} /> Duyệt</button>
                  )}
                  <button onClick={() => deletePost(p.id, p.title)} style={{ ...btnSec, fontSize: 11, padding: '4px 8px', color: '#DC2626', borderColor: '#FECACA', background: '#FEF2F2' }}><Trash2 size={11} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════ MODAL: BRIEF WIZARD ══════════ */}
      {isModalOpen && (
        <div onClick={e => e.target === e.currentTarget && setIsModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(3px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="animate-slide-up" style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 780, maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,.15)' }}>
            {/* Modal head */}
            <div style={{ padding: '1.125rem 1.5rem', borderBottom: '1px solid #F0F0EE', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#2563EB,#7C3AED)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={14} color="#fff" /></div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Tạo content AI cho {activeChannel.name}</div>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A8A8A3' }}><X size={18} /></button>
            </div>

            {/* GENERATING state */}
            {step === 'generating' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg,#EFF6FF,#F5F3FF)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Sparkles size={24} color="#2563EB" className="animate-pulse" />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>AI đang tạo nội dung...</div>
                <p style={{ fontSize: 13, color: '#6F6F6B' }}>{outlines.length > 0 ? `Đang viết bài ${generatingIdx + 1}/${outlines.filter((_,i) => checkedOutlines[i]).length}` : 'Đang tạo tiêu đề và lịch đăng'}</p>
              </div>
            )}

            {/* OUTLINES step */}
            {step === 'outlines' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#166534', display: 'flex', gap: 8 }}>
                  <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                  AI đã tạo {outlines.length} tiêu đề. Chọn bài muốn giữ, chỉnh sửa tiêu đề/giờ nếu cần, rồi bấm "Viết nội dung chi tiết".
                </div>
                {outlines.map((o, i) => (
                  <div key={i} style={{ background: '#FAFAF9', border: '1px solid #E5E5E1', borderRadius: 14, padding: '1rem', display: 'flex', gap: 10 }}>
                    <input type="checkbox" checked={!!checkedOutlines[i]} onChange={e => setCheckedOutlines(p => ({ ...p, [i]: e.target.checked }))} style={{ marginTop: 3, flexShrink: 0, accentColor: '#2563EB', width: 15, height: 15 }} />
                    <div style={{ flex: 1 }}>
                      <input value={o.title} onChange={e => updateOutline(i, 'title', e.target.value)} style={{ ...inp, fontWeight: 600, marginBottom: 8 }} />
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 140 }}><label style={lbl}>Ngày đăng</label><input type="date" value={o.scheduledDate} onChange={e => updateOutline(i, 'scheduledDate', e.target.value)} style={inp} /></div>
                        <div style={{ width: 100 }}><label style={lbl}>Giờ đăng</label><input type="time" value={o.scheduledTime} onChange={e => updateOutline(i, 'scheduledTime', e.target.value)} style={inp} /></div>
                      </div>
                      {o.angle && <div style={{ fontSize: 11, color: '#A8A8A3', marginTop: 6 }}>Góc tiếp cận: {o.angle}</div>}
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, gap: 8 }}>
                  <button onClick={() => { setStep('form'); setOutlines([]) }} style={btnSec}>← Làm lại</button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={generateOutlines} style={{ ...btnSec, display: 'flex', alignItems: 'center', gap: 6 }}><RefreshCw size={13} /> Tạo lại tiêu đề</button>
                    <button onClick={generateContent} style={{ ...btnDark, display: 'flex', alignItems: 'center', gap: 7 }}><Sparkles size={13} /> Viết nội dung chi tiết</button>
                  </div>
                </div>
              </div>
            )}

            {/* FORM step */}
            {step === 'form' && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {/* LEFT */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <BriefSection title="Thông tin cơ bản">
                      <BF label="Số lượng bài"><input type="number" value={postCount} onChange={e => setPostCount(+e.target.value)} min={1} max={20} style={inp} /></BF>
                      <BF label="Mục đích">
                        <select value={goal} onChange={e => setGoal(e.target.value)} style={inp}>
                          <option value="conversion">Ra đơn hàng (Conversion)</option>
                          <option value="brand_awareness">Tăng nhận diện thương hiệu</option>
                          <option value="engagement">Tăng tương tác (Comment/Share)</option>
                          <option value="educate">Cung cấp kiến thức (Educate)</option>
                        </select>
                      </BF>
                      <BF label="Bối cảnh"><input value={context} onChange={e => setContext(e.target.value)} placeholder="Ra mắt sản phẩm, tips hàng ngày..." style={inp} /></BF>
                      <BF label="Chủ đề">
                        <select value={topicOption} onChange={e => setTopicOption(e.target.value)} style={{ ...inp, marginBottom: 6 }}>
                          <option value="configured">Dựa trên thông tin kênh đã cấu hình</option>
                          <option value="custom">Chủ đề tùy chỉnh</option>
                        </select>
                        {topicOption === 'custom' && <input value={customTopic} onChange={e => setCustomTopic(e.target.value)} placeholder="Nhập chủ đề cụ thể..." style={inp} />}
                      </BF>
                    </BriefSection>

                    <BriefSection title="Chân dung khách hàng">
                      <BF label="Nhân khẩu học (độ tuổi, giới tính, nghề nghiệp)"><textarea value={demographics} onChange={e => setDemographics(e.target.value)} placeholder="25–35 tuổi, nhân viên văn phòng..." style={{ ...inp, minHeight: 60, resize: 'vertical' }} /></BF>
                      <BF label="Pain points (nỗi đau, vấn đề đang gặp)"><textarea value={painPoints} onChange={e => setPainPoints(e.target.value)} placeholder="Không có thời gian, tốn chi phí cao..." style={{ ...inp, minHeight: 60, resize: 'vertical' }} /></BF>
                      <BF label="Khao khát / Mong muốn"><textarea value={desires} onChange={e => setDesires(e.target.value)} placeholder="Tiết kiệm thời gian, kết quả rõ ràng..." style={{ ...inp, minHeight: 60, resize: 'vertical' }} /></BF>
                    </BriefSection>

                    <BriefSection title="Phong cách & Giọng văn">
                      <BF label="Phong cách">
                        <select value={style} onChange={e => setStyle(e.target.value)} style={inp}>
                          {['Storytelling','PAS (Vấn đề – Giải pháp)','Q&A (Hỏi đáp)','Review thực tế'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </BF>
                      <BF label="Tone of voice">
                        <select value={tone} onChange={e => setTone(e.target.value)} style={inp}>
                          {['Expert (Chuyên gia)','Friendly (Thân thiện)','Humorous (Hài hước)','Empathetic (Đồng cảm)','Energetic (Năng động)'].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </BF>
                    </BriefSection>
                  </div>

                  {/* RIGHT */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <BriefSection title="Thông tin cốt lõi & Dữ kiện">
                      <BF label="USP – Điểm bán hàng độc nhất"><textarea value={usp} onChange={e => setUsp(e.target.value)} placeholder="Tính năng nổi bật nhất, lý do chọn bạn..." style={{ ...inp, minHeight: 70, resize: 'vertical' }} /></BF>
                      <BF label="Dữ liệu bắt buộc (AI KHÔNG được sai)"><textarea value={coreFacts} onChange={e => setCoreFacts(e.target.value)} placeholder="Các con số, thành phần, tỷ lệ chính xác..." style={{ ...inp, minHeight: 70, resize: 'vertical' }} /></BF>
                    </BriefSection>

                    <BriefSection title="Định dạng trình bày">
                      <BF label="Kiểu format">
                        <select value={formatOption} onChange={e => setFormatOption(e.target.value)} style={inp}>
                          <option>Bullet points rõ ràng, có đề mục H2/H3</option>
                          <option>Đoạn văn ngắn, liền mạch</option>
                          <option>Kết hợp bullet và đoạn văn</option>
                        </select>
                      </BF>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <BF label="Số từ tối đa"><input type="number" value={wordLimit} onChange={e => setWordLimit(+e.target.value)} min={50} max={2000} style={inp} /></BF>
                        <BF label="Số tiêu đề phụ"><input type="number" value={headings} onChange={e => setHeadings(+e.target.value)} min={0} max={10} style={inp} /></BF>
                      </div>
                      <BF label="Từ CẤM sử dụng"><input value={forbiddenWords} onChange={e => setForbiddenWords(e.target.value)} placeholder="cam kết chữa khỏi, 100% hiệu quả..." style={inp} /></BF>
                    </BriefSection>

                    <BriefSection title="Hình ảnh">
                      <BF label="Nguồn ảnh">
                        <select value={imageOption} onChange={e => setImageOption(e.target.value)} style={inp}>
                          <option value="internet">Lấy từ internet (Unsplash/Pexels)</option>
                          <option value="ai_generate">AI tạo ảnh (Pollinations.ai)</option>
                          <option value="upload">Tự tải ảnh lên</option>
                          <option value="prompt">AI xuất prompt để nhờ tool khác tạo</option>
                          <option value="none">Không cần ảnh</option>
                        </select>
                      </BF>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                        <span style={{ fontSize: 13 }}>AI gợi ý loại ảnh phù hợp</span>
                        <button type="button" onClick={() => setSuggestImage(v => !v)} style={{ width: 34, height: 18, borderRadius: 99, border: 'none', background: suggestImage ? '#2563EB' : '#D1D5DB', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
                          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: suggestImage ? 18 : 2, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                        </button>
                      </div>
                    </BriefSection>

                    <BriefSection title="CTA, Ngôn ngữ & Hashtag">
                      <BF label="Call to Action"><input value={cta} onChange={e => setCta(e.target.value)} placeholder="Click link Bio, inbox ngay..." style={inp} /></BF>
                      <BF label="Ngôn ngữ">
                        <select value={language} onChange={e => setLanguage(e.target.value)} style={inp}>
                          <option>Tiếng Việt</option><option>English</option><option>Song ngữ Việt–Anh</option>
                        </select>
                      </BF>
                      <BF label="Hashtag">
                        <select value={hashtagMode} onChange={e => setHashtagMode(e.target.value)} style={{ ...inp, marginBottom: 6 }}>
                          <option value="ai">AI tự tạo hashtag</option>
                          <option value="manual">Tôi tự nhập</option>
                          <option value="none">Không dùng hashtag</option>
                        </select>
                        {hashtagMode === 'manual' && <input value={hashtagCustom} onChange={e => setHashtagCustom(e.target.value)} placeholder="#hashtag1 #hashtag2..." style={inp} />}
                      </BF>
                    </BriefSection>

                    <BriefSection title="Lịch đăng">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <BF label="Ngày bắt đầu"><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inp} /></BF>
                        <BF label="Tần suất">
                          <select value={frequency} onChange={e => setFrequency(e.target.value)} style={inp}>
                            <option value="daily">Mỗi ngày</option>
                            <option value="every2days">Cách 2 ngày</option>
                            <option value="weekly">Mỗi tuần</option>
                          </select>
                        </BF>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                        <span style={{ fontSize: 13 }}>AI đề xuất khung giờ vàng</span>
                        <button type="button" onClick={() => setAiSuggestTime(v => !v)} style={{ width: 34, height: 18, borderRadius: 99, border: 'none', background: aiSuggestTime ? '#2563EB' : '#D1D5DB', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background .2s' }}>
                          <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: aiSuggestTime ? 18 : 2, transition: 'left .2s' }} />
                        </button>
                      </div>
                      {!aiSuggestTime && <BF label="Giờ đăng"><input type="time" value={postTime} onChange={e => setPostTime(e.target.value)} style={inp} /></BF>}
                    </BriefSection>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: '1.25rem', borderTop: '1px solid #F0F0EE', marginTop: '1.25rem' }}>
                  <button onClick={() => setIsModalOpen(false)} style={btnSec}>Hủy</button>
                  <button onClick={generateOutlines} style={{ ...btnDark, display: 'flex', alignItems: 'center', gap: 7 }}><Sparkles size={14} /> Tạo tiêu đề & Lịch đăng</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function BriefSection({ title, children }) {
  return (
    <div style={{ background: '#FAFAF9', border: '1px solid #E5E5E1', borderRadius: 14, padding: '1rem' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#6F6F6B', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #F0F0EE' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>{children}</div>
    </div>
  )
}
function BF({ label, children }) {
  return <div><label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#6F6F6B', marginBottom: 4 }}>{label}</label>{children}</div>
}

const inp = { width: '100%', padding: '7px 10px', background: '#fff', border: '1px solid #E5E5E1', borderRadius: 8, fontSize: 12, color: '#111110', outline: 'none', fontFamily: 'inherit' }
const lbl = { display: 'block', fontSize: 11, fontWeight: 600, color: '#6F6F6B', marginBottom: 4 }
const btnSec = { padding: '7px 16px', borderRadius: 10, border: '1px solid #E5E5E1', background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
const btnDark = { padding: '7px 16px', borderRadius: 10, border: 'none', background: '#111110', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
const navBtn = { width: 28, height: 28, borderRadius: 8, border: '1px solid #E5E5E1', background: '#fff', cursor: 'pointer', fontSize: 16, color: '#6F6F6B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }
