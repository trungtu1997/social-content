import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Calendar, BarChart2, Eye, Flame, CheckCircle, Clock, AlertTriangle, AlertCircle, Sparkles, RefreshCw, Trash2, Edit2, Check, X, TrendingUp, Users } from 'lucide-react'

const GEMINI_KEY = () => localStorage.getItem('sc_gemini_key') || ''

export function DashboardTab({ activeChannel, user }) {
  const [timeFilter, setTimeFilter] = useState('7days')
  const [posts, setPosts] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [calDate, setCalDate] = useState(new Date())
  const [selectedPost, setSelectedPost] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editStatus, setEditStatus] = useState('draft_outline')
  const [aiRec, setAiRec] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)

  useEffect(() => { if (activeChannel) { loadData(); loadAI() } }, [activeChannel])

  async function loadData() {
    setLoading(true)
    const { data: p } = await supabase.from('posts').select('*').eq('channel_id', activeChannel.id).eq('user_id', user.id).order('scheduled_at', { ascending: true })
    const { data: a } = await supabase.from('activity_log').select('*').eq('channel_id', activeChannel.id).eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
    setPosts(p || [])
    setActivities(a || [])
    setLoading(false)
  }

  async function loadAI() {
    if (!activeChannel) return
    setLoadingAI(true)
    const key = GEMINI_KEY()
    if (!key) { setAiRec('Cấu hình Gemini API Key trong Cài đặt để nhận gợi ý AI.'); setLoadingAI(false); return }
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Kênh "${activeChannel.name}" (${activeChannel.platform}). Mô tả: ${activeChannel.description || 'Chưa có'}. Cho 2-3 gợi ý cải thiện page ngắn gọn, bằng tiếng Việt, không markdown.` }] }] })
      })
      const d = await res.json()
      setAiRec(d.candidates?.[0]?.content?.parts?.[0]?.text || 'Tăng cường bài viết hỏi đáp để kích hoạt tương tác tự nhiên cuối tuần.')
    } catch { setAiRec('Tập trung xây dựng bài viết chia sẻ tips hàng ngày để giữ tương tác đều đặn.') }
    setLoadingAI(false)
  }

  if (!activeChannel) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', background: '#fff', border: '1px solid #E5E5E1', borderRadius: 20, textAlign: 'center' }}>
      <AlertCircle size={40} color="#D1D5DB" style={{ marginBottom: 14 }} />
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Chưa chọn kênh social</div>
      <p style={{ fontSize: 13, color: '#6F6F6B', maxWidth: 320 }}>Thêm kênh mạng xã hội ở thanh bên để mở bảng thống kê Dashboard.</p>
    </div>
  )

  // Filter by time
  const filterTime = (dateStr) => {
    if (!dateStr) return true
    const d = new Date(dateStr), now = new Date()
    const diff = Math.ceil(Math.abs(now - d) / 86400000)
    if (timeFilter === 'today') return diff <= 1
    if (timeFilter === '7days') return diff <= 7
    if (timeFilter === '30days') return diff <= 30
    return true
  }

  const fp = posts.filter(p => filterTime(p.scheduled_at || p.created_at))
  const published = fp.filter(p => p.status === 'published').length
  const scheduled = fp.filter(p => p.status === 'approved_scheduled').length
  const cancelled = fp.filter(p => p.status === 'cancelled').length
  const drafts = fp.filter(p => p.status === 'draft_outline').length
  const totalViews = fp.filter(p => p.status === 'published').reduce((s, p) => s + (p.views || 0), 0)
  const totalEng = fp.filter(p => p.status === 'published').reduce((s, p) => s + (p.engagement || 0), 0)
  const isUnstatable = activeChannel.platform === 'threads' || activeChannel.platform === 'tiktok'

  // Open post modal
  const openPost = (post) => {
    setSelectedPost(post); setEditTitle(post.title); setEditContent(post.content || '')
    setEditTime(post.scheduled_at ? post.scheduled_at.slice(0, 16) : ''); setEditStatus(post.status); setIsEditing(false)
  }

  const saveEdit = async () => {
    if (!selectedPost) return
    const updates = { title: editTitle, content: editContent, scheduled_at: editTime || null, status: editStatus, updated_at: new Date().toISOString() }
    await supabase.from('posts').update(updates).eq('id', selectedPost.id)
    await supabase.from('activity_log').insert({ user_id: user.id, channel_id: activeChannel.id, post_id: selectedPost.id, action: 'edited', description: `Chỉnh sửa bài: "${editTitle}"` })
    setSelectedPost({ ...selectedPost, ...updates }); setIsEditing(false); loadData()
  }

  const deletePost = async (id, title) => {
    await supabase.from('posts').delete().eq('id', id)
    await supabase.from('activity_log').insert({ user_id: user.id, channel_id: activeChannel.id, post_id: id, action: 'deleted', description: `Xóa bài: "${title}"` })
    setSelectedPost(null); loadData()
  }

  const approvePost = async (post) => {
    await supabase.from('posts').update({ status: 'approved_scheduled', updated_at: new Date().toISOString() }).eq('id', post.id)
    await supabase.from('activity_log').insert({ user_id: user.id, channel_id: activeChannel.id, post_id: post.id, action: 'approved', description: `Duyệt lên lịch: "${post.title}"` })
    setSelectedPost({ ...post, status: 'approved_scheduled' }); loadData()
  }

  // Calendar helpers
  const yr = calDate.getFullYear(), mo = calDate.getMonth()
  const firstDay = new Date(yr, mo, 1).getDay()
  const daysInMonth = new Date(yr, mo + 1, 0).getDate()
  const today = new Date()
  const postsByDate = {}
  posts.forEach(p => {
    const d = (p.scheduled_at || p.created_at)?.split('T')[0]
    if (d) { if (!postsByDate[d]) postsByDate[d] = []; postsByDate[d].push(p) }
  })

  const months = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']
  const dows = ['CN','T2','T3','T4','T5','T6','T7']

  const statusColor = { published: { bg: '#F0FDF4', color: '#16A34A' }, approved_scheduled: { bg: '#EFF6FF', color: '#2563EB' }, draft_outline: { bg: '#F5F5F4', color: '#6F6F6B' }, cancelled: { bg: '#FEF2F2', color: '#DC2626' } }
  const statusLabel = { published: 'Đã đăng', approved_scheduled: 'Chờ đăng', draft_outline: 'Nháp', cancelled: 'Đã hủy' }

  const timeAgo = (d) => {
    const diff = Date.now() - new Date(d)
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'Vừa xong'
    if (m < 60) return `${m} phút trước`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h} giờ trước`
    return `${Math.floor(h / 24)} ngày trước`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>{activeChannel.name}</div>
          <div style={{ fontSize: 12, color: '#6F6F6B', marginTop: 2 }}>Dashboard tổng quan</div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['today','7days','30days','all'].map(f => (
            <button key={f} onClick={() => setTimeFilter(f)} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #E5E5E1', background: timeFilter === f ? '#111110' : '#fff', color: timeFilter === f ? '#fff' : '#6F6F6B', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {{ today: 'Hôm nay', '7days': '7 ngày', '30days': '30 ngày', all: 'Tất cả' }[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { label: 'Đã đăng', val: published, icon: <CheckCircle size={16} color="#16A34A" />, color: '#16A34A' },
          { label: 'Đã lên lịch', val: scheduled, icon: <Clock size={16} color="#2563EB" />, color: '#2563EB' },
          { label: 'Chưa duyệt', val: drafts, icon: <AlertTriangle size={16} color="#D97706" />, color: '#D97706' },
          { label: 'Đã hủy', val: cancelled, icon: <X size={16} color="#DC2626" />, color: '#DC2626' },
        ].map((s, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #E5E5E1', borderRadius: 16, padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 12, color: '#6F6F6B', fontWeight: 500 }}>
              {s.icon}{s.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Views + Engagement */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: '#fff', border: '1px solid #E5E5E1', borderRadius: 16, padding: '1rem' }}>
          <div style={{ fontSize: 12, color: '#6F6F6B', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}><Eye size={14} />Tổng lượt xem</div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{isUnstatable ? <span style={{ fontSize: 13, color: '#D97706' }}>Không thống kê được</span> : totalViews.toLocaleString()}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #E5E5E1', borderRadius: 16, padding: '1rem' }}>
          <div style={{ fontSize: 12, color: '#6F6F6B', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}><Flame size={14} />Tổng tương tác</div>
          <div style={{ fontSize: 26, fontWeight: 700 }}>{isUnstatable ? <span style={{ fontSize: 13, color: '#D97706' }}>Không thống kê được</span> : totalEng.toLocaleString()}</div>
        </div>
      </div>

      {/* Calendar */}
      <div style={{ background: '#fff', border: '1px solid #E5E5E1', borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #F0F0EE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}><Calendar size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }} />{months[mo]} {yr}</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setCalDate(new Date(yr, mo - 1, 1))} style={navBtnStyle}>‹</button>
            <button onClick={() => setCalDate(new Date(yr, mo + 1, 1))} style={navBtnStyle}>›</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
          {dows.map(d => <div key={d} style={{ padding: '7px 4px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#A8A8A3', background: '#FAFAF9', borderBottom: '1px solid #F0F0EE' }}>{d}</div>)}
          {Array.from({ length: firstDay }).map((_, i) => <div key={'e'+i} style={{ minHeight: 76, borderRight: '1px solid #F0F0EE', borderBottom: '1px solid #F0F0EE' }} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = `${yr}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const isToday = today.getFullYear()===yr && today.getMonth()===mo && today.getDate()===day
            const dp = postsByDate[dateStr] || []
            const col = (firstDay + i) % 7
            return (
              <div key={day} style={{ minHeight: 76, padding: 5, borderRight: col === 6 ? 'none' : '1px solid #F0F0EE', borderBottom: '1px solid #F0F0EE', cursor: dp.length ? 'pointer' : 'default' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, background: isToday ? '#111110' : 'transparent', color: isToday ? '#fff' : '#6F6F6B', marginBottom: 3 }}>{day}</div>
                {dp.slice(0, 3).map(p => (
                  <div key={p.id} onClick={() => openPost(p)} style={{ fontSize: 10, padding: '2px 5px', borderRadius: 4, marginBottom: 2, cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', ...statusColor[p.status] || {} }}>
                    {p.title}
                  </div>
                ))}
                {dp.length > 3 && <div style={{ fontSize: 10, color: '#A8A8A3' }}>+{dp.length - 3}</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom row: Audience + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Audience */}
        <div style={{ background: '#fff', border: '1px solid #E5E5E1', borderRadius: 16, padding: '1.125rem' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 6 }}><Users size={14} />Đối tượng theo dõi</div>
          {isUnstatable ? (
            <div style={{ fontSize: 12, color: '#D97706', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 12px' }}>Không thống kê được với nền tảng {activeChannel.platform}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['18–24 tuổi', 45], ['25–34 tuổi', 35], ['35–44 tuổi', 15], ['Khác', 5]].map(([g, pct]) => (
                <div key={g}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span style={{ color: '#6F6F6B' }}>{g}</span><span style={{ fontWeight: 600 }}>{pct}%</span>
                  </div>
                  <div style={{ height: 5, background: '#F0F0EE', borderRadius: 99 }}>
                    <div style={{ height: 5, borderRadius: 99, background: '#2563EB', width: pct + '%', transition: 'width .5s' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity */}
        <div style={{ background: '#fff', border: '1px solid #E5E5E1', borderRadius: 16, padding: '1.125rem' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: '1rem' }}>Hoạt động gần nhất</div>
          {activities.length === 0 ? (
            <div style={{ fontSize: 12, color: '#A8A8A3', textAlign: 'center', padding: '1rem 0' }}>Chưa có hoạt động nào</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {activities.slice(0, 6).map((a, i) => (
                <div key={a.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < Math.min(activities.length, 6) - 1 ? '1px solid #F5F5F3' : 'none' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2563EB', flexShrink: 0, marginTop: 5 }} />
                  <div>
                    <div style={{ fontSize: 12, color: '#111110', lineHeight: 1.5 }}>{a.description}</div>
                    <div style={{ fontSize: 11, color: '#A8A8A3', marginTop: 2 }}>{timeAgo(a.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Suggestion */}
      <div style={{ background: 'linear-gradient(135deg,#EFF6FF 0%,#F5F3FF 100%)', border: '1px solid #BFDBFE', borderRadius: 16, padding: '1.125rem', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#2563EB,#7C3AED)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Sparkles size={16} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
            Gợi ý AI cải thiện trang
            <button onClick={loadAI} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={12} className={loadingAI ? 'animate-spin' : ''} />
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#3730A3', lineHeight: 1.7 }}>
            {loadingAI ? <span style={{ color: '#A8A8A3' }}>Đang phân tích...</span> : aiRec || 'Bấm nút refresh để tải gợi ý...'}
          </div>
        </div>
      </div>

      {/* POST DETAIL MODAL */}
      {selectedPost && (
        <div onClick={e => e.target === e.currentTarget && setSelectedPost(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(2px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="animate-slide-up" style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 600, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,.15)' }}>
            {/* Modal header */}
            <div style={{ padding: '1.125rem 1.5rem', borderBottom: '1px solid #F0F0EE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{isEditing ? 'Chỉnh sửa bài viết' : 'Chi tiết bài viết'}</div>
              <button onClick={() => setSelectedPost(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A8A8A3', display: 'flex' }}><X size={18} /></button>
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div><label style={labelStyle}>Tiêu đề</label><input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={inputStyle2} /></div>
                  <div><label style={labelStyle}>Nội dung</label><textarea value={editContent} onChange={e => setEditContent(e.target.value)} style={{ ...inputStyle2, minHeight: 160, resize: 'vertical' }} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label style={labelStyle}>Giờ đăng</label><input type="datetime-local" value={editTime} onChange={e => setEditTime(e.target.value)} style={inputStyle2} /></div>
                    <div><label style={labelStyle}>Trạng thái</label>
                      <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={inputStyle2}>
                        <option value="draft_outline">Bản nháp</option>
                        <option value="approved_scheduled">Chờ đăng tự động</option>
                        <option value="published">Đã xuất bản</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                    </div>
                  </div>
                  {selectedPost.status === 'published' && (
                    <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#1D4ED8', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                      Bài này đang hiển thị trên {activeChannel.name}. Khi lưu, bài gốc sẽ được đồng bộ tự động.
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 }}>
                    <button onClick={() => setIsEditing(false)} style={btnSecondary}>Bỏ qua</button>
                    <button onClick={saveEdit} style={btnPrimary2}><Check size={13} /> Lưu & Đồng bộ</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Status + time */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid #F5F5F3' }}>
                    <div style={{ fontSize: 12, color: '#6F6F6B', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Clock size={13} /> {selectedPost.scheduled_at ? new Date(selectedPost.scheduled_at).toLocaleString('vi-VN') : 'Chưa lên lịch'}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, ...(statusColor[selectedPost.status] || {}) }}>
                      {statusLabel[selectedPost.status]}
                    </span>
                  </div>

                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', lineHeight: 1.4 }}>{selectedPost.title}</div>

                  {selectedPost.image_url && (
                    <img src={selectedPost.image_url} alt={selectedPost.title} style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 14, border: '1px solid #E5E5E1' }} referrerPolicy="no-referrer" />
                  )}
                  {!selectedPost.image_url && selectedPost.image_prompt && (
                    <div style={{ background: '#FAFAF9', border: '1px solid #E5E5E1', borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#A8A8A3', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5 }}>Image Prompt:</div>
                      <div style={{ fontSize: 11, color: '#6F6F6B', fontFamily: 'monospace' }}>{selectedPost.image_prompt}</div>
                    </div>
                  )}

                  <div style={{ background: '#FAFAF9', borderRadius: 14, border: '1px solid #F0F0EE', padding: '1rem' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#A8A8A3', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>Nội dung chi tiết:</div>
                    <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                      {selectedPost.content || 'Bài chưa được viết chi tiết. Sang tab "Quản lý Content" để AI viết nội dung.'}
                    </p>
                  </div>

                  {selectedPost.hashtags && (
                    <div style={{ fontSize: 12, color: '#2563EB' }}>{selectedPost.hashtags}</div>
                  )}

                  {selectedPost.status === 'published' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                      {[['👁 Lượt xem', selectedPost.views || 0], ['❤️ Lượt thích', selectedPost.likes || 0], ['💬 Bình luận', selectedPost.comments || 0]].map(([l, v]) => (
                        <div key={l} style={{ background: '#FAFAF9', border: '1px solid #F0F0EE', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: '#6F6F6B', marginBottom: 4 }}>{l}</div>
                          <div style={{ fontSize: 20, fontWeight: 700 }}>{v.toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedPost.status === 'published' && (
                    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: '#166534', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <CheckCircle size={14} color="#16A34A" style={{ flexShrink: 0 }} />
                      Bài viết đã đăng trên <b>{activeChannel.name}</b>. Mọi chỉnh sửa sẽ đồng bộ tự động.
                    </div>
                  )}

                  {/* Footer buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #F5F5F3', flexWrap: 'wrap', gap: 8 }}>
                    <button onClick={() => deletePost(selectedPost.id, selectedPost.title)} style={{ ...btnSecondary, color: '#DC2626', borderColor: '#FECACA', background: '#FEF2F2', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Trash2 size={13} /> Xóa
                    </button>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setIsEditing(true)} style={{ ...btnSecondary, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Edit2 size={13} /> Sửa / Đổi giờ đăng
                      </button>
                      {selectedPost.status === 'draft_outline' && selectedPost.content && (
                        <button onClick={() => approvePost(selectedPost)} style={{ ...btnPrimary2 }}>
                          <Check size={13} /> Duyệt & Lên lịch
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const navBtnStyle = { width: 28, height: 28, borderRadius: 8, border: '1px solid #E5E5E1', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#6F6F6B', fontFamily: 'inherit' }
const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: '#6F6F6B', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }
const inputStyle2 = { width: '100%', padding: '8px 11px', background: '#FAFAF9', border: '1px solid #E5E5E1', borderRadius: 10, fontSize: 13, color: '#111110', outline: 'none', fontFamily: 'inherit' }
const btnSecondary = { padding: '7px 14px', borderRadius: 10, border: '1px solid #E5E5E1', background: '#fff', color: '#374151', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
const btnPrimary2 = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, border: 'none', background: '#2563EB', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }
const statusColor = { published: { background: '#F0FDF4', color: '#16A34A' }, approved_scheduled: { background: '#EFF6FF', color: '#2563EB' }, draft_outline: { background: '#F5F5F4', color: '#6F6F6B' }, cancelled: { background: '#FEF2F2', color: '#DC2626' } }
const statusLabel = { published: 'Đã đăng', approved_scheduled: 'Chờ đăng', draft_outline: 'Nháp', cancelled: 'Đã hủy' }
