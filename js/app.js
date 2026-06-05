// ===== STATE =====
let currentUser = null
let currentProfile = null
let currentChannel = null
let channels = []

// ===== INIT =====
window.addEventListener('load', async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return window.location.href = 'login.html'
  currentUser = session.user
  await loadProfile()
  await loadChannels()
  navigate('dashboard')
  supabase.auth.onAuthStateChange((event, session) => {
    if (!session) window.location.href = 'login.html'
  })
})

// ===== PROFILE =====
async function loadProfile() {
  const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single()
  currentProfile = data
  const name = data?.full_name || currentUser.email.split('@')[0]
  const initials = name.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()
  document.getElementById('topbar-avatar').textContent = initials
  document.getElementById('menu-name').textContent = name
  document.getElementById('menu-email').textContent = currentUser.email
}

async function saveProfile() {
  const name = document.getElementById('profile-name-input').value.trim()
  const newPw = document.getElementById('new-password').value
  const confirmPw = document.getElementById('confirm-password').value
  const errEl = document.getElementById('profile-error')
  const okEl = document.getElementById('profile-success')
  errEl.style.display = 'none'; okEl.style.display = 'none'

  if (name) {
    await supabase.from('profiles').update({ full_name: name }).eq('id', currentUser.id)
  }
  if (newPw) {
    if (newPw !== confirmPw) { errEl.textContent = 'Mật khẩu xác nhận không khớp'; errEl.style.display = 'block'; return }
    if (newPw.length < 6) { errEl.textContent = 'Mật khẩu tối thiểu 6 ký tự'; errEl.style.display = 'block'; return }
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) { errEl.textContent = error.message; errEl.style.display = 'block'; return }
  }
  okEl.textContent = 'Đã lưu thành công!'; okEl.style.display = 'block'
  await loadProfile()
}

// ===== CHANNELS =====
async function loadChannels() {
  const { data } = await supabase.from('channels').select('*').eq('user_id', currentUser.id).order('created_at')
  channels = data || []
  renderSidebar()
}

function renderSidebar() {
  const el = document.getElementById('sidebar-channels')
  if (!channels.length) {
    el.innerHTML = `<div style="padding:1rem .5rem;text-align:center;color:var(--text-hint);font-size:12px">Chưa có kênh nào.<br>Bấm "Thêm kênh" để bắt đầu.</div>`
    return
  }
  el.innerHTML = channels.map(ch => `
    <div class="channel-item ${currentChannel?.id === ch.id ? 'active' : ''}" onclick="selectChannel('${ch.id}')">
      <div class="channel-avatar">${ch.logo_url ? `<img src="${ch.logo_url}">` : platformIcon(ch.platform)}</div>
      <div>
        <div class="channel-name">${ch.name}</div>
        <div class="channel-platform">${platformLabel(ch.platform)}</div>
      </div>
    </div>
  `).join('')
}

function platformIcon(p) {
  const map = { facebook_page:'<i class="ti ti-brand-facebook"></i>', facebook_group:'<i class="ti ti-users"></i>', instagram:'<i class="ti ti-brand-instagram"></i>', threads:'<i class="ti ti-at"></i>' }
  return map[p] || '<i class="ti ti-world"></i>'
}
function platformLabel(p) {
  const map = { facebook_page:'Facebook Page', facebook_group:'Facebook Group', instagram:'Instagram', threads:'Threads' }
  return map[p] || p
}

function selectChannel(id) {
  currentChannel = channels.find(c => c.id === id)
  renderSidebar()
  navigate('channel')
}

async function saveChannel() {
  const name = document.getElementById('ch-name').value.trim()
  const platform = document.getElementById('ch-platform').value
  const slogan = document.getElementById('ch-slogan').value.trim()
  const description = document.getElementById('ch-desc').value.trim()
  if (!name) return alert('Vui lòng nhập tên kênh')
  const { data, error } = await supabase.from('channels').insert({ user_id: currentUser.id, name, platform, slogan, description }).select().single()
  if (error) return alert('Lỗi: ' + error.message)
  channels.push(data)
  renderSidebar()
  closeModal('modal-add-channel')
  currentChannel = data
  navigate('channel')
}

// ===== NAVIGATION =====
function navigate(page) {
  document.getElementById('topbar-title').textContent = pageTitles[page] || 'Social Content'
  closeAllMenus()
  const el = document.getElementById('page-content')
  if (page === 'dashboard') renderDashboard(el)
  else if (page === 'channel') renderChannelPage(el)
  else if (page === 'settings') renderSettings(el)
  else if (page === 'profile') { openProfileModal(); return }
}

const pageTitles = { dashboard: 'Dashboard', channel: 'Quản lý kênh', settings: 'Cài đặt' }

// ===== DASHBOARD =====
async function renderDashboard(el) {
  const ch = currentChannel
  const title = ch ? `Dashboard — ${ch.name}` : 'Dashboard'
  document.getElementById('topbar-title').textContent = title

  el.innerHTML = `<div class="loading"><div class="spinner"></div> Đang tải dashboard...</div>`

  const now = new Date()
  const y = now.getFullYear(), m = now.getMonth()

  // Load posts for current channel or all
  let query = supabase.from('posts').select('*').eq('user_id', currentUser.id)
  if (ch) query = query.eq('channel_id', ch.id)
  const { data: posts } = await query.order('scheduled_at', { ascending: true })
  const allPosts = posts || []

  const published = allPosts.filter(p => p.status === 'published').length
  const scheduled = allPosts.filter(p => p.status === 'scheduled').length
  const pending = allPosts.filter(p => p.status === 'pending_review').length
  const cancelled = allPosts.filter(p => p.status === 'cancelled').length
  const totalViews = allPosts.reduce((s, p) => s + (p.views||0), 0)
  const totalLikes = allPosts.reduce((s, p) => s + (p.likes||0), 0)

  // Load activity
  let aQuery = supabase.from('activity_log').select('*').eq('user_id', currentUser.id)
  if (ch) aQuery = aQuery.eq('channel_id', ch.id)
  const { data: activities } = await aQuery.order('created_at', { ascending: false }).limit(8)

  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
      <div style="font-size:18px;font-weight:600">${ch ? ch.name : 'Tất cả kênh'}</div>
      <div style="display:flex;gap:8px;align-items:center">
        <input type="date" id="filter-from" style="width:140px" value="${new Date(y,m,1).toISOString().split('T')[0]}">
        <span style="color:var(--text-muted);font-size:13px">→</span>
        <input type="date" id="filter-to" style="width:140px" value="${new Date(y,m+1,0).toISOString().split('T')[0]}">
        <button class="btn btn-secondary btn-sm" onclick="renderDashboard(document.getElementById('page-content'))"><i class="ti ti-refresh"></i></button>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="stat-label">Đã đăng</div><div class="stat-value" style="color:var(--success)">${published}</div><div class="stat-sub">bài viết</div></div>
      <div class="stat-card"><div class="stat-label">Đã lên lịch</div><div class="stat-value" style="color:var(--accent)">${scheduled}</div><div class="stat-sub">bài viết</div></div>
      <div class="stat-card"><div class="stat-label">Chờ duyệt</div><div class="stat-value" style="color:var(--warning)">${pending}</div><div class="stat-sub">bài viết</div></div>
      <div class="stat-card"><div class="stat-label">Đã hủy</div><div class="stat-value" style="color:var(--danger)">${cancelled}</div><div class="stat-sub">bài viết</div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:1.25rem">
      <div class="stat-card"><div class="stat-label">Tổng lượt xem</div><div class="stat-value">${totalViews.toLocaleString()}</div><div class="stat-sub">trên tất cả bài đăng</div></div>
      <div class="stat-card"><div class="stat-label">Tổng tương tác</div><div class="stat-value">${totalLikes.toLocaleString()}</div><div class="stat-sub">likes + comments</div></div>
    </div>

    ${renderCalendar(y, m, allPosts)}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem">
      <div class="card">
        <div class="section-title" style="font-size:14px">Đối tượng theo dõi</div>
        <div style="font-size:13px;color:var(--text-muted)">
          ${ch ? `<div style="padding:1rem 0;text-align:center">
            <div style="font-size:28px;font-weight:600;color:var(--text)">—</div>
            <div style="font-size:12px;margin-top:4px">Kết nối API để xem số liệu</div>
          </div>` : '<div style="padding:1rem 0;text-align:center;color:var(--text-hint);font-size:12px">Chọn 1 kênh để xem</div>'}
        </div>
      </div>
      <div class="card">
        <div class="section-title" style="font-size:14px">Hoạt động gần nhất</div>
        <div class="activity-list">
          ${(activities||[]).length ? (activities||[]).map(a => `
            <div class="activity-item">
              <div class="activity-dot"></div>
              <div>
                <div class="activity-text">${a.description}</div>
                <div class="activity-time">${timeAgo(a.created_at)}</div>
              </div>
            </div>
          `).join('') : '<div style="color:var(--text-hint);font-size:12px;padding:.5rem 0">Chưa có hoạt động nào</div>'}
        </div>
      </div>
    </div>

    <div class="ai-suggest">
      <div class="ai-suggest-icon"><i class="ti ti-robot"></i></div>
      <div>
        <div style="font-weight:600;margin-bottom:4px;font-size:13px">Gợi ý AI cho kênh của bạn</div>
        <div class="ai-suggest-text" id="ai-suggestion-text">
          ${ch ? '<span style="color:var(--accent);cursor:pointer" onclick="loadAISuggestion()">Bấm để tải gợi ý từ AI...</span>' : 'Chọn một kênh để nhận gợi ý cải thiện từ AI.'}
        </div>
      </div>
    </div>
  `
}

function renderCalendar(y, m, posts) {
  const months = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12']
  const days = ['CN','T2','T3','T4','T5','T6','T7']
  const firstDay = new Date(y, m, 1).getDay()
  const lastDate = new Date(y, m+1, 0).getDate()
  const today = new Date()

  // Group posts by date
  const postsByDate = {}
  posts.forEach(p => {
    const d = (p.scheduled_at || p.published_at || p.created_at)?.split('T')[0]
    if (d) { if (!postsByDate[d]) postsByDate[d] = []; postsByDate[d].push(p) }
  })

  let html = `<div class="calendar-wrap" style="margin-bottom:1.25rem">
    <div class="calendar-header">
      <button class="btn-icon btn-sm" onclick="changeMonth(-1)"><i class="ti ti-chevron-left"></i></button>
      <div style="font-size:14px;font-weight:600">${months[m]} ${y}</div>
      <button class="btn-icon btn-sm" onclick="changeMonth(1)"><i class="ti ti-chevron-right"></i></button>
    </div>
    <div class="calendar-grid">
      ${days.map(d => `<div class="cal-day-label">${d}</div>`).join('')}`

  let dayCount = 0
  for (let i = 0; i < firstDay; i++) { html += `<div class="cal-day other-month"></div>`; dayCount++ }
  for (let d = 1; d <= lastDate; d++) {
    const dateStr = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const isToday = today.getFullYear()===y && today.getMonth()===m && today.getDate()===d
    const dayPosts = postsByDate[dateStr] || []
    html += `<div class="cal-day ${isToday?'today':''}">
      <div class="cal-day-num">${d}</div>
      ${dayPosts.slice(0,3).map(p => `<div class="cal-post-pill ${p.status}" onclick="openPostDetail('${p.id}')" title="${p.title||'Bài viết'}">${p.title||'Bài viết'}</div>`).join('')}
      ${dayPosts.length > 3 ? `<div style="font-size:10px;color:var(--text-hint)">+${dayPosts.length-3} bài</div>` : ''}
    </div>`
    dayCount++
  }
  const remaining = (7 - (dayCount % 7)) % 7
  for (let i = 0; i < remaining; i++) html += `<div class="cal-day other-month"></div>`
  html += `</div></div>`
  return html
}

let calYear = new Date().getFullYear()
let calMonth = new Date().getMonth()
function changeMonth(dir) {
  calMonth += dir
  if (calMonth > 11) { calMonth = 0; calYear++ }
  if (calMonth < 0) { calMonth = 11; calYear-- }
  renderDashboard(document.getElementById('page-content'))
}

async function loadAISuggestion() {
  const el = document.getElementById('ai-suggestion-text')
  if (!el || !currentChannel) return
  el.innerHTML = '<div class="loading" style="padding:0"><div class="spinner"></div> Đang phân tích...</div>'
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: `Bạn là chuyên gia social media. Kênh tên "${currentChannel.name}" (${platformLabel(currentChannel.platform)}), mô tả: "${currentChannel.description||'chưa có'}". Hãy đưa ra 2-3 gợi ý cụ thể ngắn gọn để cải thiện hiệu quả kênh này. Viết bằng tiếng Việt, không dùng markdown.` }] }] })
    })
    const data = await res.json()
    el.textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Không thể tải gợi ý lúc này.'
  } catch(e) {
    el.textContent = 'Vui lòng cấu hình Gemini API key trong Cài đặt.'
  }
}

// ===== POST DETAIL MODAL =====
async function openPostDetail(postId) {
  const { data: post } = await supabase.from('posts').select('*').eq('id', postId).single()
  if (!post) return
  const body = document.getElementById('modal-post-body')
  const footer = document.getElementById('modal-post-footer')
  document.getElementById('modal-post-title').textContent = post.title || 'Chi tiết bài viết'

  body.innerHTML = `
    <div style="display:flex;gap:8px;margin-bottom:1rem;align-items:center">
      <span class="badge badge-${post.status}">${statusLabel(post.status)}</span>
      <span style="font-size:12px;color:var(--text-muted)">${post.scheduled_at ? '📅 ' + formatDate(post.scheduled_at) : ''}</span>
    </div>
    ${post.image_url ? `<img src="${post.image_url}" style="width:100%;max-height:240px;object-fit:cover;border-radius:var(--radius);margin-bottom:1rem">` : ''}
    <div class="form-group">
      <label>Tiêu đề</label>
      <input type="text" id="edit-title" value="${post.title||''}">
    </div>
    <div class="form-group">
      <label>Nội dung</label>
      <textarea id="edit-content" style="min-height:180px">${post.content||''}</textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>Thời gian đăng</label>
        <input type="datetime-local" id="edit-schedule" value="${post.scheduled_at ? post.scheduled_at.slice(0,16) : ''}">
      </div>
      <div class="form-group">
        <label>Hashtag</label>
        <input type="text" id="edit-hashtags" value="${post.hashtags||''}">
      </div>
    </div>
    ${post.status === 'published' ? `
    <div class="form-row-3" style="margin-top:.5rem">
      <div class="stat-card"><div class="stat-label">Lượt xem</div><div class="stat-value">${post.views||0}</div></div>
      <div class="stat-card"><div class="stat-label">Lượt thích</div><div class="stat-value">${post.likes||0}</div></div>
      <div class="stat-card"><div class="stat-label">Bình luận</div><div class="stat-value">${post.comments||0}</div></div>
    </div>` : ''}
  `

  footer.innerHTML = `
    <button class="btn btn-danger btn-sm" onclick="deletePost('${post.id}')"><i class="ti ti-trash"></i> Xóa</button>
    ${post.status === 'pending_review' ? `<button class="btn btn-secondary btn-sm" onclick="approvePost('${post.id}')"><i class="ti ti-check"></i> Duyệt bài</button>` : ''}
    <button class="btn btn-secondary" onclick="closeModal('modal-post-detail')">Hủy</button>
    <button class="btn btn-primary" onclick="savePostEdit('${post.id}')"><i class="ti ti-device-floppy"></i> Lưu</button>
  `
  document.getElementById('modal-post-detail').classList.remove('hidden')
}

async function savePostEdit(id) {
  const updates = {
    title: document.getElementById('edit-title').value,
    content: document.getElementById('edit-content').value,
    hashtags: document.getElementById('edit-hashtags').value,
    scheduled_at: document.getElementById('edit-schedule').value || null,
    updated_at: new Date().toISOString()
  }
  await supabase.from('posts').update(updates).eq('id', id)
  await logActivity(currentChannel?.id, id, 'edited', `Đã chỉnh sửa bài: ${updates.title}`)
  closeModal('modal-post-detail')
  renderDashboard(document.getElementById('page-content'))
}

async function deletePost(id) {
  if (!confirm('Bạn có chắc muốn xóa bài này?')) return
  await supabase.from('posts').delete().eq('id', id)
  await logActivity(currentChannel?.id, id, 'deleted', 'Đã xóa 1 bài viết')
  closeModal('modal-post-detail')
  renderDashboard(document.getElementById('page-content'))
}

async function approvePost(id) {
  await supabase.from('posts').update({ status: 'scheduled', updated_at: new Date().toISOString() }).eq('id', id)
  await logActivity(currentChannel?.id, id, 'approved', 'Đã duyệt bài và lên lịch đăng')
  closeModal('modal-post-detail')
  renderDashboard(document.getElementById('page-content'))
}

// ===== CHANNEL PAGE =====
async function renderChannelPage(el) {
  if (!currentChannel) { el.innerHTML = '<div class="empty-state"><i class="ti ti-arrow-left"></i><p>Chọn 1 kênh từ sidebar</p></div>'; return }
  const ch = currentChannel
  el.innerHTML = `
    <div class="channel-header-banner"></div>
    <div class="channel-header-info">
      <div class="channel-big-avatar">${ch.logo_url ? `<img src="${ch.logo_url}">` : platformIcon(ch.platform)}</div>
      <div style="flex:1">
        <div style="font-size:18px;font-weight:600">${ch.name}</div>
        <div style="font-size:13px;color:var(--text-muted)">${platformLabel(ch.platform)} ${ch.slogan ? '· ' + ch.slogan : ''}</div>
      </div>
      <button class="btn btn-primary" onclick="showCreateContent()"><i class="ti ti-sparkles"></i> Tạo content AI</button>
    </div>

    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab('setup')">Cài đặt kênh</button>
      <button class="tab-btn" onclick="switchTab('content')">Quản lý content</button>
    </div>

    <div class="tab-pane active" id="tab-setup">${renderChannelSetup(ch)}</div>
    <div class="tab-pane" id="tab-content"><div class="loading"><div class="spinner"></div></div></div>
  `
  loadContentTab()
}

function renderChannelSetup(ch) {
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
      <div>
        <div class="card" style="margin-bottom:1rem">
          <div style="font-size:14px;font-weight:600;margin-bottom:1rem">Thông tin cơ bản</div>
          <div class="form-group"><label>Tên kênh</label><input type="text" id="setup-name" value="${ch.name||''}"></div>
          <div class="form-group"><label>Slogan</label><input type="text" id="setup-slogan" value="${ch.slogan||''}"></div>
          <div class="form-group"><label>Mô tả kênh</label><textarea id="setup-desc">${ch.description||''}</textarea></div>
          <div class="form-group"><label>Định vị kênh</label><textarea id="setup-positioning" style="min-height:60px">${ch.positioning||''}</textarea></div>
        </div>
        <div class="card">
          <div style="font-size:14px;font-weight:600;margin-bottom:1rem">Tùy chọn mặc định</div>
          <div class="form-group"><label>Tone mặc định</label>
            <select id="setup-tone">
              <option value="professional" ${ch.default_tone==='professional'?'selected':''}>Chuyên gia đáng tin cậy</option>
              <option value="funny" ${ch.default_tone==='funny'?'selected':''}>Hài hước châm biếm</option>
              <option value="energetic" ${ch.default_tone==='energetic'?'selected':''}>Năng động tràn đầy năng lượng</option>
              <option value="empathetic" ${ch.default_tone==='empathetic'?'selected':''}>Đồng cảm nhẹ nhàng</option>
            </select>
          </div>
          <div class="form-group"><label>Ngôn ngữ mặc định</label>
            <select id="setup-language">
              <option value="vi" ${ch.default_language==='vi'?'selected':''}>Tiếng Việt</option>
              <option value="en" ${ch.default_language==='en'?'selected':''}>English</option>
              <option value="bilingual" ${ch.default_language==='bilingual'?'selected':''}>Song ngữ Việt–Anh</option>
            </select>
          </div>
        </div>
      </div>
      <div>
        <div class="card" style="margin-bottom:1rem">
          <div style="font-size:14px;font-weight:600;margin-bottom:1rem">Sản phẩm / Dịch vụ</div>
          <div class="form-group"><label>Mô tả sản phẩm/dịch vụ (AI sẽ học từ đây)</label><textarea id="setup-products" style="min-height:140px">${ch.products_services||''}</textarea></div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:.5rem">Hoặc tải file Word lên để AI học:</div>
          <input type="file" id="setup-file" accept=".doc,.docx,.txt" style="font-size:12px">
        </div>
        <div class="card">
          <div style="font-size:14px;font-weight:600;margin-bottom:1rem">Kết nối API</div>
          <div class="form-group"><label>Page ID / Group ID</label><input type="text" id="setup-pageid" value="${ch.page_id||''}" placeholder="ID từ Facebook"></div>
          <div class="form-group"><label>Access Token</label><input type="password" id="setup-token" value="${ch.access_token||''}" placeholder="Page Access Token"></div>
        </div>
      </div>
    </div>
    <div style="margin-top:1rem;display:flex;justify-content:flex-end">
      <button class="btn btn-primary" onclick="saveChannelSetup()"><i class="ti ti-device-floppy"></i> Lưu cài đặt kênh</button>
    </div>
  `
}

async function saveChannelSetup() {
  const updates = {
    name: document.getElementById('setup-name').value,
    slogan: document.getElementById('setup-slogan').value,
    description: document.getElementById('setup-desc').value,
    positioning: document.getElementById('setup-positioning').value,
    products_services: document.getElementById('setup-products').value,
    default_tone: document.getElementById('setup-tone').value,
    default_language: document.getElementById('setup-language').value,
    page_id: document.getElementById('setup-pageid').value,
    access_token: document.getElementById('setup-token').value,
  }
  const { data } = await supabase.from('channels').update(updates).eq('id', currentChannel.id).select().single()
  currentChannel = data
  channels = channels.map(c => c.id === data.id ? data : c)
  renderSidebar()
  alert('Đã lưu cài đặt kênh!')
}

async function loadContentTab() {
  const { data: posts } = await supabase.from('posts').select('*').eq('channel_id', currentChannel.id).order('created_at', { ascending: false })
  const el = document.getElementById('tab-content')
  if (!el) return
  const allPosts = posts || []
  if (!allPosts.length) {
    el.innerHTML = `<div class="empty-state"><i class="ti ti-writing"></i><p>Chưa có bài viết nào</p><button class="btn btn-primary" onclick="showCreateContent()"><i class="ti ti-sparkles"></i> Tạo content với AI</button></div>`
    return
  }
  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem">
      <div style="display:flex;gap:6px">
        ${['all','draft','pending_review','scheduled','published','cancelled'].map(s =>
          `<button class="btn btn-secondary btn-sm ${s==='all'?'':'filter-btn'}" onclick="filterPosts('${s}',this)">${s==='all'?'Tất cả':statusLabel(s)}</button>`
        ).join('')}
      </div>
      <button class="btn btn-primary btn-sm" onclick="showCreateContent()"><i class="ti ti-sparkles"></i> Tạo content</button>
    </div>
    <div class="post-list" id="post-list-container">
      ${allPosts.map(p => renderPostRow(p)).join('')}
    </div>
  `
  window._allPosts = allPosts
}

function renderPostRow(p) {
  return `<div class="post-row">
    <div class="post-thumb">${p.image_url ? `<img src="${p.image_url}">` : '<i class="ti ti-photo"></i>'}</div>
    <div class="post-info">
      <div class="post-title">${p.title || 'Bài viết chưa có tiêu đề'}</div>
      <div class="post-preview">${(p.content||'').substring(0,100)}...</div>
      <div class="post-meta">
        <span>${p.scheduled_at ? '📅 ' + formatDate(p.scheduled_at) : formatDate(p.created_at)}</span>
        ${p.views ? `<span>👁 ${p.views}</span>` : ''}
        ${p.likes ? `<span>❤️ ${p.likes}</span>` : ''}
      </div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
      <span class="badge badge-${p.status}">${statusLabel(p.status)}</span>
      <div class="post-actions">
        ${p.status==='pending_review' ? `<button class="btn-icon btn-sm" onclick="approvePost('${p.id}')" title="Duyệt"><i class="ti ti-check" style="color:var(--success)"></i></button>` : ''}
        <button class="btn-icon btn-sm" onclick="openPostDetail('${p.id}')" title="Xem/Sửa"><i class="ti ti-edit"></i></button>
        <button class="btn-icon btn-sm" onclick="deletePost('${p.id}')" title="Xóa"><i class="ti ti-trash"></i></button>
      </div>
    </div>
  </div>`
}

function filterPosts(status, btn) {
  const posts = status === 'all' ? window._allPosts : window._allPosts.filter(p => p.status === status)
  document.getElementById('post-list-container').innerHTML = posts.map(renderPostRow).join('')
}

// ===== SETTINGS PAGE =====
function renderSettings(el) {
  const key = localStorage.getItem('gemini_key') || ''
  el.innerHTML = `
    <div style="max-width:600px">
      <div class="card" style="margin-bottom:1rem">
        <div style="font-size:15px;font-weight:600;margin-bottom:1rem">API Keys</div>
        <div class="form-group">
          <label>Gemini API Key (Google AI)</label>
          <input type="password" id="gemini-key" value="${key}" placeholder="AIza...">
          <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Lấy miễn phí tại <a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--accent)">aistudio.google.com</a></div>
        </div>
        <button class="btn btn-primary" onclick="saveGeminiKey()">Lưu API Key</button>
      </div>
      <div class="card">
        <div style="font-size:15px;font-weight:600;margin-bottom:1rem">Hướng dẫn kết nối Facebook</div>
        <div style="font-size:13px;color:var(--text-muted);line-height:1.8">
          <p>1. Vào <a href="https://developers.facebook.com" target="_blank" style="color:var(--accent)">developers.facebook.com</a> → tạo App</p>
          <p>2. Vào Graph API Explorer → chọn Page → lấy Page Access Token</p>
          <p>3. Điền Page ID và Access Token vào phần Cài đặt của từng kênh</p>
        </div>
      </div>
    </div>
  `
}

function saveGeminiKey() {
  const key = document.getElementById('gemini-key').value.trim()
  localStorage.setItem('gemini_key', key)
  // Update config
  window.GEMINI_API_KEY = key
  alert('Đã lưu Gemini API Key!')
}

// ===== CREATE CONTENT MODAL =====
function showCreateContent() {
  if (!currentChannel) return alert('Vui lòng chọn kênh trước')
  // Load the content creation modal from content.js
  openContentBriefModal()
}

// ===== HELPERS =====
function statusLabel(s) {
  const map = { draft:'Nháp', pending_review:'Chờ duyệt', scheduled:'Đã lên lịch', published:'Đã đăng', cancelled:'Đã hủy' }
  return map[s] || s
}
function formatDate(d) {
  if (!d) return ''
  const dt = new Date(d)
  return dt.toLocaleDateString('vi-VN') + ' ' + dt.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' })
}
function timeAgo(d) {
  const diff = Date.now() - new Date(d)
  const mins = Math.floor(diff/60000)
  if (mins < 1) return 'Vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hrs = Math.floor(mins/60)
  if (hrs < 24) return `${hrs} giờ trước`
  return `${Math.floor(hrs/24)} ngày trước`
}
async function logActivity(channelId, postId, action, description) {
  await supabase.from('activity_log').insert({ user_id: currentUser.id, channel_id: channelId||null, post_id: postId||null, action, description })
}

// ===== MODAL/MENU UTILS =====
function openModal(id) { document.getElementById(id).classList.remove('hidden') }
function closeModal(id) { document.getElementById(id).classList.add('hidden') }
function openAddChannel() { document.getElementById('modal-add-channel').classList.remove('hidden') }
function toggleUserMenu() { document.getElementById('user-menu').classList.toggle('hidden') }
function closeAllMenus() { document.getElementById('user-menu').classList.add('hidden') }
function openProfileModal() {
  const name = currentProfile?.full_name || currentUser?.email?.split('@')[0] || ''
  const initials = name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()
  document.getElementById('profile-avatar').textContent = initials
  document.getElementById('profile-name-display').textContent = name
  document.getElementById('profile-email-display').textContent = currentUser?.email || ''
  document.getElementById('profile-name-input').value = name
  document.getElementById('modal-profile').classList.remove('hidden')
}
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach((b,i) => {
    const names = ['setup','content']
    b.classList.toggle('active', names[i] === name)
  })
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'))
  document.getElementById('tab-'+name).classList.add('active')
  if (name === 'content') loadContentTab()
}
async function logout() {
  await supabase.auth.signOut()
  window.location.href = 'login.html'
}
document.addEventListener('click', e => {
  if (!e.target.closest('#user-btn') && !e.target.closest('#user-menu')) {
    document.getElementById('user-menu')?.classList.add('hidden')
  }
})

// Load gemini key from localStorage
window.addEventListener('load', () => {
  const k = localStorage.getItem('gemini_key')
  if (k) window.GEMINI_API_KEY = k
}, true)
