// ===== CONTENT BRIEF MODAL =====
// Inject modal HTML vào body khi cần

function openContentBriefModal() {
  if (!document.getElementById('modal-content-brief')) {
    document.body.insertAdjacentHTML('beforeend', contentBriefModalHTML())
  }
  resetBriefForm()
  document.getElementById('modal-content-brief').classList.remove('hidden')
  showBriefStep(1)
}

function contentBriefModalHTML() {
  return `
  <div class="modal-overlay hidden" id="modal-content-brief">
    <div class="modal modal-lg">
      <div class="modal-header">
        <h2><i class="ti ti-sparkles" style="color:var(--accent)"></i> Tạo content với AI</h2>
        <button class="btn-icon" onclick="closeModal('modal-content-brief')"><i class="ti ti-x"></i></button>
      </div>
      <div class="modal-body" style="padding:1.25rem">

        <!-- STEP INDICATOR -->
        <div class="brief-steps" id="brief-step-indicator">
          <div class="brief-step active" data-step="1"><span class="brief-step-num">1</span>Cơ bản</div>
          <div class="brief-step" data-step="2"><span class="brief-step-num">2</span>Khách hàng</div>
          <div class="brief-step" data-step="3"><span class="brief-step-num">3</span>Phong cách</div>
          <div class="brief-step" data-step="4"><span class="brief-step-num">4</span>Nội dung</div>
          <div class="brief-step" data-step="5"><span class="brief-step-num">5</span>Format</div>
          <div class="brief-step" data-step="6"><span class="brief-step-num">6</span>Hình ảnh</div>
          <div class="brief-step" data-step="7"><span class="brief-step-num">7</span>CTA & Lịch</div>
          <div class="brief-step" data-step="8"><span class="brief-step-num">8</span>Kết quả AI</div>
        </div>

        <!-- STEP 1: CƠ BẢN -->
        <div class="brief-pane" id="brief-pane-1">
          <div class="form-row">
            <div class="form-group">
              <label>Số lượng bài muốn tạo *</label>
              <input type="number" id="b-post-count" value="5" min="1" max="30">
            </div>
            <div class="form-group">
              <label>Mục đích bài viết *</label>
              <select id="b-purpose">
                <option value="brand_awareness">Tăng nhận diện thương hiệu</option>
                <option value="conversion">Ra đơn hàng (Conversion)</option>
                <option value="engagement">Tăng tương tác (Comment/Share)</option>
                <option value="educate">Cung cấp kiến thức (Educate)</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Bối cảnh bài viết *</label>
            <select id="b-context">
              <option value="new_product">Ra mắt sản phẩm mới</option>
              <option value="daily_tips">Chia sẻ tips hàng ngày</option>
              <option value="crisis">Xử lý khủng hoảng truyền thông</option>
              <option value="other">Bối cảnh khác</option>
            </select>
          </div>
          <div class="form-group" id="b-context-other-wrap" style="display:none">
            <label>Mô tả bối cảnh cụ thể</label>
            <input type="text" id="b-context-other" placeholder="Nhập bối cảnh...">
          </div>
        </div>

        <!-- STEP 2: KHÁCH HÀNG -->
        <div class="brief-pane hidden" id="brief-pane-2">
          <div style="font-size:13px;font-weight:600;color:var(--text-muted);margin-bottom:.75rem;text-transform:uppercase;letter-spacing:.04em">Nhân khẩu học</div>
          <div class="form-row-3">
            <div class="form-group">
              <label>Độ tuổi</label>
              <input type="text" id="b-age" placeholder="Ví dụ: 25–35">
            </div>
            <div class="form-group">
              <label>Giới tính</label>
              <select id="b-gender">
                <option value="all">Tất cả</option>
                <option value="female">Nữ</option>
                <option value="male">Nam</option>
              </select>
            </div>
            <div class="form-group">
              <label>Nghề nghiệp</label>
              <input type="text" id="b-occupation" placeholder="Ví dụ: Nhân viên văn phòng">
            </div>
          </div>
          <div style="font-size:13px;font-weight:600;color:var(--text-muted);margin-bottom:.75rem;text-transform:uppercase;letter-spacing:.04em">Tâm lý & Nỗi đau</div>
          <div class="form-group">
            <label>Pain points — Khách hàng đang gặp vấn đề gì?</label>
            <textarea id="b-pain" placeholder="Ví dụ: Không có thời gian, tốn chi phí cao, kết quả không như mong đợi..."></textarea>
          </div>
          <div class="form-group">
            <label>Khao khát / Mong muốn — Họ muốn đạt được điều gì?</label>
            <textarea id="b-desire" placeholder="Ví dụ: Tiết kiệm thời gian, kết quả rõ ràng, giá cả hợp lý..."></textarea>
          </div>
        </div>

        <!-- STEP 3: PHONG CÁCH -->
        <div class="brief-pane hidden" id="brief-pane-3">
          <div class="form-group">
            <label>Phong cách trình bày</label>
            <select id="b-style">
              <option value="storytelling">Kể chuyện (Storytelling)</option>
              <option value="qa">Hỏi đáp (Q&A)</option>
              <option value="pas">Nêu vấn đề – Giải pháp (PAS)</option>
              <option value="review">Review thực tế</option>
            </select>
          </div>
          <div class="form-group">
            <label>Giọng văn (Tone of Voice)</label>
            <select id="b-tone">
              <option value="professional">Chuyên gia đáng tin cậy</option>
              <option value="funny">Hài hước châm biếm</option>
              <option value="energetic">Năng động tràn đầy năng lượng</option>
              <option value="empathetic">Đồng cảm và nhẹ nhàng</option>
            </select>
          </div>
          <div style="padding:.75rem 1rem;background:var(--accent-light);border-radius:var(--radius-sm);font-size:12px;color:#3C3489">
            <i class="ti ti-info-circle"></i> Tone mặc định của kênh đã được áp dụng. Bạn có thể thay đổi cho lần tạo này.
          </div>
        </div>

        <!-- STEP 4: NỘI DUNG CỐT LÕI -->
        <div class="brief-pane hidden" id="brief-pane-4">
          <div class="form-group">
            <label>USP — Điểm bán hàng độc nhất</label>
            <textarea id="b-usp" placeholder="Tính năng nổi bật nhất, lý do khách hàng chọn bạn thay vì đối thủ..."></textarea>
          </div>
          <div class="form-group">
            <label>Dữ liệu chính xác bắt buộc (AI KHÔNG được sai)</label>
            <textarea id="b-facts" placeholder="Các con số, thành phần, tỷ lệ, tên sản phẩm chính xác... AI sẽ dùng đúng y như bạn nhập"></textarea>
          </div>
        </div>

        <!-- STEP 5: FORMAT -->
        <div class="brief-pane hidden" id="brief-pane-5">
          <div class="form-row">
            <div class="form-group">
              <label>Kiểu trình bày</label>
              <select id="b-format">
                <option value="bullets">Bullet points</option>
                <option value="paragraphs">Đoạn văn ngắn</option>
                <option value="mixed">Kết hợp cả hai</option>
              </select>
            </div>
            <div class="form-group">
              <label>Số tiêu đề phụ (H2, H3)</label>
              <input type="number" id="b-headings" value="0" min="0" max="10">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Số từ tối đa mỗi bài</label>
              <input type="number" id="b-maxwords" value="300" min="50" max="2000">
            </div>
            <div class="form-group">
              <label>Ngôn ngữ</label>
              <select id="b-language">
                <option value="vi">Tiếng Việt</option>
                <option value="en">English</option>
                <option value="bilingual">Song ngữ Việt–Anh</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Từ ngữ CẤM sử dụng</label>
            <input type="text" id="b-forbidden" placeholder="Ví dụ: cam kết chữa khỏi, 100% hiệu quả, ... (cách nhau bởi dấu phẩy)">
          </div>
        </div>

        <!-- STEP 6: HÌNH ẢNH -->
        <div class="brief-pane hidden" id="brief-pane-6">
          <div class="form-group">
            <label>Nguồn hình ảnh</label>
            <select id="b-image-source" onchange="toggleImageOptions()">
              <option value="internet">Lấy từ internet (Unsplash/Pexels)</option>
              <option value="ai_generate">AI tạo ảnh (Pollinations.ai)</option>
              <option value="upload">Tôi tự tải ảnh lên</option>
              <option value="prompt_only">AI xuất prompt để nhờ tool khác tạo</option>
              <option value="none">Không cần ảnh</option>
            </select>
          </div>
          <div class="toggle-wrap">
            <span style="font-size:13px">AI gợi ý loại ảnh phù hợp cho từng bài</span>
            <div class="toggle on" id="toggle-suggest-img" onclick="toggleEl('toggle-suggest-img')"></div>
          </div>
          <div id="image-upload-wrap" style="display:none;margin-top:.75rem">
            <label>Tải ảnh lên (dùng cho tất cả bài hoặc chọn từng bài sau)</label>
            <input type="file" id="b-image-upload" accept="image/*" multiple>
          </div>
        </div>

        <!-- STEP 7: CTA & LỊCH -->
        <div class="brief-pane hidden" id="brief-pane-7">
          <div class="form-row">
            <div class="form-group">
              <label>Call to Action (CTA)</label>
              <select id="b-cta" onchange="toggleCTACustom()">
                <option value="link_bio">Click link Bio</option>
                <option value="comment">Để lại bình luận</option>
                <option value="inbox">Inbox ngay</option>
                <option value="share">Chia sẻ bài viết</option>
                <option value="custom">Tùy chỉnh CTA</option>
              </select>
            </div>
            <div class="form-group" id="cta-custom-wrap" style="display:none">
              <label>CTA tùy chỉnh</label>
              <input type="text" id="b-cta-custom" placeholder="Nhập CTA cụ thể...">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Hashtag</label>
              <select id="b-hashtag-mode" onchange="toggleHashtagCustom()">
                <option value="ai">AI tự tạo hashtag</option>
                <option value="manual">Tôi tự nhập</option>
                <option value="none">Không dùng hashtag</option>
              </select>
            </div>
            <div class="form-group" id="hashtag-custom-wrap" style="display:none">
              <label>Hashtag cố định</label>
              <input type="text" id="b-hashtag-custom" placeholder="#thuonghieu #sanpham ...">
            </div>
          </div>
          <hr class="divider">
          <div style="font-size:13px;font-weight:600;margin-bottom:.75rem">Lịch đăng</div>
          <div class="form-row">
            <div class="form-group">
              <label>Ngày bắt đầu đăng</label>
              <input type="date" id="b-start-date" value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
              <label>Tần suất đăng</label>
              <select id="b-frequency">
                <option value="daily">Mỗi ngày 1 bài</option>
                <option value="every2days">Cách 2 ngày</option>
                <option value="weekly">Mỗi tuần 1 bài</option>
                <option value="custom">Tùy chỉnh</option>
              </select>
            </div>
          </div>
          <div class="toggle-wrap">
            <span style="font-size:13px">AI đề xuất khung giờ vàng phù hợp</span>
            <div class="toggle" id="toggle-ai-time" onclick="toggleEl('toggle-ai-time')"></div>
          </div>
          <div id="manual-time-wrap" style="margin-top:.75rem">
            <label>Giờ đăng mỗi ngày</label>
            <input type="time" id="b-post-time" value="08:00">
          </div>
        </div>

        <!-- STEP 8: KẾT QUẢ AI -->
        <div class="brief-pane hidden" id="brief-pane-8">
          <div id="ai-result-area">
            <div style="text-align:center;padding:2rem">
              <div style="font-size:40px;margin-bottom:12px">🤖</div>
              <p style="color:var(--text-muted);margin-bottom:1.25rem">AI sẽ tạo tiêu đề và lịch đăng cho ${5} bài viết.<br>Bạn duyệt tiêu đề xong, AI mới viết nội dung chi tiết.</p>
              <button class="btn btn-primary" onclick="generateTitles()"><i class="ti ti-sparkles"></i> Bắt đầu tạo tiêu đề</button>
            </div>
          </div>
        </div>

        <!-- NAV BUTTONS -->
        <div style="display:flex;justify-content:space-between;margin-top:1.25rem;padding-top:1rem;border-top:1px solid var(--border)">
          <button class="btn btn-secondary" id="brief-btn-back" onclick="briefStepNav(-1)" style="visibility:hidden">
            <i class="ti ti-arrow-left"></i> Quay lại
          </button>
          <div style="font-size:12px;color:var(--text-hint);align-self:center" id="brief-step-label">Bước 1 / 8</div>
          <button class="btn btn-primary" id="brief-btn-next" onclick="briefStepNav(1)">
            Tiếp theo <i class="ti ti-arrow-right"></i>
          </button>
        </div>

      </div>
    </div>
  </div>`
}

let currentBriefStep = 1

function showBriefStep(step) {
  currentBriefStep = step
  document.querySelectorAll('.brief-pane').forEach(p => p.classList.add('hidden'))
  document.getElementById('brief-pane-'+step).classList.remove('hidden')
  document.querySelectorAll('.brief-step').forEach(s => {
    const n = parseInt(s.dataset.step)
    s.classList.toggle('active', n === step)
    s.classList.toggle('done', n < step)
  })
  document.getElementById('brief-step-label').textContent = `Bước ${step} / 8`
  document.getElementById('brief-btn-back').style.visibility = step > 1 ? 'visible' : 'hidden'
  const nextBtn = document.getElementById('brief-btn-next')
  if (step === 8) nextBtn.style.display = 'none'
  else { nextBtn.style.display = ''; nextBtn.innerHTML = step === 7 ? '<i class="ti ti-sparkles"></i> Tạo content' : 'Tiếp theo <i class="ti ti-arrow-right"></i>' }
}

function briefStepNav(dir) {
  const next = currentBriefStep + dir
  if (next < 1 || next > 8) return
  if (dir === 1 && currentBriefStep === 7) { showBriefStep(8); return }
  showBriefStep(next)
}

function resetBriefForm() { currentBriefStep = 1 }

function toggleEl(id) {
  document.getElementById(id).classList.toggle('on')
}
function toggleImageOptions() {
  const v = document.getElementById('b-image-source').value
  document.getElementById('image-upload-wrap').style.display = v === 'upload' ? 'block' : 'none'
}
function toggleCTACustom() {
  document.getElementById('cta-custom-wrap').style.display = document.getElementById('b-cta').value === 'custom' ? 'block' : 'none'
}
function toggleHashtagCustom() {
  document.getElementById('hashtag-custom-wrap').style.display = document.getElementById('b-hashtag-mode').value === 'manual' ? 'block' : 'none'
}

// ===== AI: GENERATE TITLES =====
async function generateTitles() {
  const area = document.getElementById('ai-result-area')
  area.innerHTML = `<div class="loading"><div class="spinner"></div> AI đang tạo tiêu đề và lịch đăng...</div>`

  const brief = collectBrief()
  const geminiKey = window.GEMINI_API_KEY || localStorage.getItem('gemini_key')
  if (!geminiKey || geminiKey === 'YOUR_GEMINI_API_KEY') {
    area.innerHTML = `<div style="background:var(--warning-light);padding:1rem;border-radius:var(--radius);color:var(--warning)">
      <i class="ti ti-alert-triangle"></i> Bạn chưa cài Gemini API Key. Vào <b>Cài đặt</b> để thêm key miễn phí.
    </div>`
    return
  }

  const ch = currentChannel
  const prompt = buildTitlePrompt(brief, ch)

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    })
    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    let titles = []
    try {
      const clean = text.replace(/```json|```/g, '').trim()
      titles = JSON.parse(clean)
    } catch {
      titles = text.split('\n').filter(l => l.trim()).map((t, i) => ({ title: t.replace(/^\d+\.\s*/, ''), date: getScheduleDate(brief, i) }))
    }
    renderTitlesForApproval(titles, brief)
  } catch(e) {
    area.innerHTML = `<div style="background:var(--danger-light);padding:1rem;border-radius:var(--radius);color:var(--danger)">Lỗi kết nối AI: ${e.message}</div>`
  }
}

function buildTitlePrompt(brief, ch) {
  return `Bạn là chuyên gia viết content mạng xã hội.

Thông tin kênh:
- Tên: ${ch.name}
- Nền tảng: ${platformLabel(ch.platform)}
- Mô tả: ${ch.description || 'Chưa có'}
- Sản phẩm/dịch vụ: ${ch.products_services || 'Chưa có'}

Yêu cầu tạo content:
- Số lượng: ${brief.postCount} bài
- Mục đích: ${brief.purpose}
- Bối cảnh: ${brief.context}
- Độ tuổi KH: ${brief.age}, Giới tính: ${brief.gender}, Nghề nghiệp: ${brief.occupation}
- Pain points: ${brief.pain}
- Mong muốn: ${brief.desire}
- Phong cách: ${brief.style}
- Tone: ${brief.tone}
- USP: ${brief.usp}
- Dữ liệu bắt buộc: ${brief.facts}
- Ngôn ngữ: ${brief.language}

Hãy tạo ${brief.postCount} tiêu đề bài viết hấp dẫn, phù hợp với yêu cầu trên.
Trả về JSON array theo định dạng sau (chỉ JSON, không có gì khác):
[
  {"title": "Tiêu đề bài 1", "date": "${brief.startDate}", "angle": "Góc tiếp cận ngắn gọn"},
  {"title": "Tiêu đề bài 2", "date": "YYYY-MM-DD", "angle": "..."}
]`
}

function renderTitlesForApproval(titles, brief) {
  const area = document.getElementById('ai-result-area')
  area.innerHTML = `
    <div style="margin-bottom:1rem">
      <div style="font-size:14px;font-weight:600;margin-bottom:.5rem">✅ AI đã tạo ${titles.length} tiêu đề — Chọn bài muốn giữ rồi bấm "Duyệt & Viết nội dung"</div>
      <div style="font-size:12px;color:var(--text-muted)">Bỏ chọn những tiêu đề bạn không muốn. Chỉ bài được chọn mới được AI viết chi tiết.</div>
    </div>
    <div id="titles-list">
      ${titles.map((t, i) => `
        <div class="card card-sm" style="margin-bottom:8px;display:flex;align-items:flex-start;gap:10px">
          <input type="checkbox" id="title-check-${i}" checked style="margin-top:3px;width:16px;height:16px;flex-shrink:0;accent-color:var(--accent)">
          <div style="flex:1">
            <input type="text" id="title-text-${i}" value="${t.title}" style="font-weight:500;border:none;background:transparent;padding:0;font-size:13px;width:100%">
            <div style="display:flex;gap:8px;margin-top:4px">
              <input type="date" id="title-date-${i}" value="${t.date || brief.startDate}" style="font-size:11px;width:140px">
              <input type="time" id="title-time-${i}" value="${brief.postTime || '08:00'}" style="font-size:11px;width:100px">
              <span style="font-size:11px;color:var(--text-hint);align-self:center">${t.angle || ''}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:1rem;justify-content:flex-end">
      <button class="btn btn-secondary" onclick="generateTitles()"><i class="ti ti-refresh"></i> Tạo lại</button>
      <button class="btn btn-primary" onclick="generateFullContent(${JSON.stringify(titles).replace(/"/g,'&quot;')}, ${JSON.stringify(brief).replace(/"/g,'&quot;')})">
        <i class="ti ti-writing"></i> Duyệt & Viết nội dung chi tiết
      </button>
    </div>
  `
  window._titles = titles
  window._brief = brief
}

// ===== AI: GENERATE FULL CONTENT =====
async function generateFullContent(titlesData, briefData) {
  const area = document.getElementById('ai-result-area')
  const titles = window._titles || titlesData
  const brief = window._brief || briefData
  const geminiKey = window.GEMINI_API_KEY || localStorage.getItem('gemini_key')

  // Get checked titles
  const selectedTitles = titles.filter((t, i) => {
    const el = document.getElementById('title-check-'+i)
    return el ? el.checked : true
  }).map((t, i) => ({
    ...t,
    title: document.getElementById('title-text-'+i)?.value || t.title,
    date: document.getElementById('title-date-'+i)?.value || t.date,
    time: document.getElementById('title-time-'+i)?.value || '08:00'
  }))

  if (!selectedTitles.length) return alert('Vui lòng chọn ít nhất 1 bài!')

  area.innerHTML = `<div class="loading"><div class="spinner"></div> AI đang viết ${selectedTitles.length} bài viết chi tiết... (có thể mất 30–60 giây)</div>`

  const ch = currentChannel
  const results = []

  for (let i = 0; i < selectedTitles.length; i++) {
    const t = selectedTitles[i]
    area.innerHTML = `<div class="loading"><div class="spinner"></div> Đang viết bài ${i+1}/${selectedTitles.length}: "${t.title}"</div>`
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: buildContentPrompt(t, brief, ch) }] }] })
      })
      const data = await res.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      results.push({ title: t.title, content, date: t.date, time: t.time })
    } catch(e) {
      results.push({ title: t.title, content: 'Lỗi tạo nội dung: ' + e.message, date: t.date, time: t.time })
    }
  }

  // Save to Supabase
  const savedPosts = []
  for (const r of results) {
    const scheduledAt = r.date && r.time ? `${r.date}T${r.time}:00` : null
    const { data } = await supabase.from('posts').insert({
      channel_id: ch.id,
      user_id: currentUser.id,
      title: r.title,
      content: r.content,
      hashtags: brief.hashtagCustom || '',
      status: 'pending_review',
      scheduled_at: scheduledAt,
    }).select().single()
    if (data) { savedPosts.push(data); await logActivity(ch.id, data.id, 'created', `AI đã tạo bài: ${r.title}`) }
  }

  renderContentResults(savedPosts)
}

function buildContentPrompt(titleObj, brief, ch) {
  const ctaText = { link_bio:'Click link Bio', comment:'Để lại bình luận', inbox:'Inbox ngay', share:'Chia sẻ bài viết', custom: brief.ctaCustom }
  const formatInstr = brief.format === 'bullets' ? 'dùng bullet points' : brief.format === 'paragraphs' ? 'viết đoạn văn ngắn' : 'kết hợp bullet và đoạn văn'
  return `Bạn là copywriter chuyên nghiệp. Viết 1 bài đăng mạng xã hội với thông tin sau:

Tiêu đề: ${titleObj.title}
Kênh: ${ch.name} (${platformLabel(ch.platform)})
Sản phẩm/dịch vụ: ${ch.products_services || ch.description || 'Chưa có'}
Mục đích: ${brief.purpose}
Tone: ${brief.tone}
Phong cách: ${brief.style}
USP: ${brief.usp || 'Chưa có'}
Dữ liệu bắt buộc (KHÔNG sai): ${brief.facts || 'Không có'}
Từ CẤM dùng: ${brief.forbidden || 'Không có'}
Format: ${formatInstr}, tối đa ${brief.maxWords} từ
${brief.headings > 0 ? `Dùng ${brief.headings} tiêu đề phụ` : ''}
CTA cuối bài: ${ctaText[brief.cta] || brief.ctaCustom}
Hashtag: ${brief.hashtagMode === 'ai' ? 'Tạo 5-10 hashtag phù hợp ở cuối bài' : brief.hashtagMode === 'manual' ? brief.hashtagCustom : 'Không dùng hashtag'}
Ngôn ngữ: ${brief.language === 'vi' ? 'Tiếng Việt' : brief.language === 'en' ? 'English' : 'Song ngữ Việt và Anh'}

Chỉ trả về nội dung bài viết, không có giải thích thêm.`
}

function renderContentResults(posts) {
  const area = document.getElementById('ai-result-area')
  area.innerHTML = `
    <div style="background:var(--success-light);padding:.75rem 1rem;border-radius:var(--radius);color:var(--success);margin-bottom:1rem;font-weight:500">
      <i class="ti ti-check"></i> Đã tạo và lưu ${posts.length} bài viết — trạng thái "Chờ duyệt"
    </div>
    <div style="font-size:13px;color:var(--text-muted);margin-bottom:1rem">Vào tab <b>Quản lý content</b> để xem, chỉnh sửa và duyệt từng bài trước khi đăng.</div>
    <div class="post-list">
      ${posts.map(p => `
        <div class="card card-sm" style="margin-bottom:8px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <div style="font-size:13px;font-weight:500">${p.title}</div>
            <span class="badge badge-pending">Chờ duyệt</span>
          </div>
          <div style="font-size:12px;color:var(--text-muted);white-space:pre-wrap;max-height:80px;overflow:hidden">${(p.content||'').substring(0,200)}...</div>
          <div style="margin-top:8px;display:flex;gap:6px">
            <button class="btn btn-secondary btn-sm" onclick="openPostDetail('${p.id}')"><i class="ti ti-edit"></i> Xem & Sửa</button>
            <button class="btn btn-primary btn-sm" onclick="approvePost('${p.id}')"><i class="ti ti-check"></i> Duyệt</button>
          </div>
        </div>
      `).join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:1rem;justify-content:flex-end">
      <button class="btn btn-secondary" onclick="closeModal('modal-content-brief');navigate('channel')">Xem tất cả trong Quản lý content</button>
    </div>
  `
}

// ===== HELPERS =====
function collectBrief() {
  return {
    postCount: parseInt(document.getElementById('b-post-count')?.value) || 5,
    purpose: document.getElementById('b-purpose')?.value,
    context: document.getElementById('b-context')?.value,
    age: document.getElementById('b-age')?.value || 'Không xác định',
    gender: document.getElementById('b-gender')?.value || 'all',
    occupation: document.getElementById('b-occupation')?.value || '',
    pain: document.getElementById('b-pain')?.value || '',
    desire: document.getElementById('b-desire')?.value || '',
    style: document.getElementById('b-style')?.value || 'storytelling',
    tone: document.getElementById('b-tone')?.value || 'professional',
    usp: document.getElementById('b-usp')?.value || '',
    facts: document.getElementById('b-facts')?.value || '',
    format: document.getElementById('b-format')?.value || 'mixed',
    headings: document.getElementById('b-headings')?.value || 0,
    maxWords: document.getElementById('b-maxwords')?.value || 300,
    language: document.getElementById('b-language')?.value || 'vi',
    forbidden: document.getElementById('b-forbidden')?.value || '',
    imageSource: document.getElementById('b-image-source')?.value || 'internet',
    cta: document.getElementById('b-cta')?.value || 'comment',
    ctaCustom: document.getElementById('b-cta-custom')?.value || '',
    hashtagMode: document.getElementById('b-hashtag-mode')?.value || 'ai',
    hashtagCustom: document.getElementById('b-hashtag-custom')?.value || '',
    startDate: document.getElementById('b-start-date')?.value || new Date().toISOString().split('T')[0],
    frequency: document.getElementById('b-frequency')?.value || 'daily',
    postTime: document.getElementById('b-post-time')?.value || '08:00',
    aiSuggestTime: document.getElementById('toggle-ai-time')?.classList.contains('on') || false,
  }
}

function getScheduleDate(brief, index) {
  const start = new Date(brief.startDate)
  const freqDays = { daily: 1, every2days: 2, weekly: 7, custom: 1 }
  const days = freqDays[brief.frequency] || 1
  start.setDate(start.getDate() + index * days)
  return start.toISOString().split('T')[0]
}
