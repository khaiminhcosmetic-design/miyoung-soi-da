(async () => {
  const me = await AdminCommon.mountNav('dashboard');
  if (!me) return;

  const SLOT_RANGES = { '08-11': [8, 11], '11-14': [11, 14], '14-17': [14, 17], '17-20': [17, 20] };

  function currentSlot() {
    const hour = parseInt(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', hourCycle: 'h23' }).format(new Date()), 10);
    for (const [slot, [start, end]] of Object.entries(SLOT_RANGES)) {
      if (hour >= start && hour < end) return slot;
    }
    return null;
  }

  async function updateStatus(leadId, trangThai, btn) {
    btn.disabled = true;
    try {
      const res = await AdminCommon.api(`/leads/${leadId}`, { method: 'PATCH', body: { trang_thai: trangThai } });
      AdminCommon.showToast(res.hint ? res.hint : 'Đã cập nhật.');
      load();
    } catch (err) {
      AdminCommon.showToast(err.message);
      btn.disabled = false;
    }
  }

  function renderRow(lead) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <div class="flex-between">
        <div>
          <strong>${lead.ten_goi || '(Không có tên)'}</strong> ·
          <a href="tel:${lead.so_dien_thoai}">${lead.so_dien_thoai}</a> ·
          Mã ${lead.ma_ket_qua} · Nhánh ${lead.nhanh_cam_nang} · Đã gọi ${lead.so_lan_goi} lần
        </div>
        <a href="/admin/leads/${lead.id}" class="btn btn-outline btn-sm">Xem chi tiết</a>
      </div>
      <div class="status-actions">
        <button class="btn btn-secondary btn-sm" data-action="da_goi">Đã gọi được</button>
        <button class="btn btn-outline btn-sm" data-action="khong_nghe_1">Không nghe máy</button>
        <button class="btn btn-outline btn-sm" data-action="khong_nghe_2">Không nghe máy (lần 2)</button>
        <button class="btn btn-outline btn-sm" data-action="da_gui_cam_nang">Đã gửi cẩm nang</button>
        <button class="btn btn-outline btn-sm" data-action="dung_lien_he">Dừng liên hệ</button>
      </div>`;
    div.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => updateStatus(lead.id, btn.dataset.action, btn));
    });
    if (lead.lan_goi_cuoi_ngay) {
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
      if (lead.lan_goi_cuoi_ngay === today) {
        div.querySelectorAll('[data-action="da_goi"],[data-action="khong_nghe_1"],[data-action="khong_nghe_2"]').forEach((b) => (b.disabled = true));
      }
    }
    return div;
  }

  async function load() {
    const groupsEl = document.getElementById('groups');
    groupsEl.innerHTML = 'Đang tải…';
    try {
      const { leads } = await AdminCommon.api('/leads/today');
      const cur = currentSlot();
      groupsEl.innerHTML = '';
      if (leads.length === 0) {
        groupsEl.innerHTML = '<p class="hint-text">Không có lead nào cần gọi hôm nay.</p>';
        return;
      }
      const bySlot = {};
      leads.forEach((l) => {
        (bySlot[l.khung_gio_goi] = bySlot[l.khung_gio_goi] || []).push(l);
      });
      Object.keys(AdminCommon.KHUNG_GIO_LABEL).forEach((slot) => {
        if (!bySlot[slot]) return;
        const section = document.createElement('div');
        section.className = 'slot-group' + (slot === cur ? ' current' : '');
        section.innerHTML = `<h3>${AdminCommon.KHUNG_GIO_LABEL[slot]}${slot === cur ? ' · Đang diễn ra' : ''}</h3>`;
        bySlot[slot].forEach((lead) => section.appendChild(renderRow(lead)));
        groupsEl.appendChild(section);
      });
    } catch (err) {
      groupsEl.innerHTML = `<p class="error-text">${err.message}</p>`;
    }
  }

  load();
})();
