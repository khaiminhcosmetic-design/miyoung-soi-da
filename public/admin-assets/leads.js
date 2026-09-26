(async () => {
  const me = await AdminCommon.mountNav('leads');
  if (!me) return;

  let page = 1;

  function currentFilters() {
    const f = {};
    const phone = document.getElementById('f-phone').value.trim();
    const khungGio = document.getElementById('f-khung-gio').value;
    const nhanh = document.getElementById('f-nhanh').value;
    const trangThai = document.getElementById('f-trang-thai').value;
    const uuDai = document.getElementById('f-uu-dai').value;
    if (phone) f.phone = phone;
    if (khungGio) f.khung_gio_goi = khungGio;
    if (nhanh) f.nhanh_cam_nang = nhanh;
    if (trangThai) f.trang_thai = trangThai;
    if (uuDai) f.nhan_uu_dai = uuDai;
    return f;
  }

  async function load() {
    const tbody = document.getElementById('leads-tbody');
    tbody.innerHTML = '<tr><td colspan="8">Đang tải…</td></tr>';
    const params = new URLSearchParams({ page: String(page), ...currentFilters() });
    try {
      const { leads, total, pageSize } = await AdminCommon.api('/leads?' + params.toString());
      tbody.innerHTML = '';
      if (leads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">Không có lead phù hợp.</td></tr>';
      }
      leads.forEach((lead) => {
        const tr = document.createElement('tr');
        tr.className = 'row-link';
        tr.innerHTML = `
          <td>${AdminCommon.formatVN(lead.created_at)}</td>
          <td>${lead.ten_goi || '—'}</td>
          <td>${lead.so_dien_thoai}</td>
          <td>${AdminCommon.KHUNG_GIO_LABEL[lead.khung_gio_goi] || lead.khung_gio_goi}</td>
          <td>${lead.ma_ket_qua}</td>
          <td>${lead.nhanh_cam_nang}</td>
          <td><span class="badge badge-${lead.trang_thai}">${AdminCommon.TRANG_THAI_LABEL[lead.trang_thai]}</span></td>
          <td>${lead.nhan_uu_dai ? 'Có' : 'Không'}</td>`;
        tr.addEventListener('click', () => (window.location.href = `/admin/leads/${lead.id}`));
        tbody.appendChild(tr);
      });

      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const pag = document.getElementById('pagination');
      pag.innerHTML = `
        <button class="btn btn-outline btn-sm" id="btn-prev" ${page <= 1 ? 'disabled' : ''}>← Trước</button>
        <span class="hint-text">Trang ${page}/${totalPages} · ${total} lead</span>
        <button class="btn btn-outline btn-sm" id="btn-next" ${page >= totalPages ? 'disabled' : ''}>Sau →</button>`;
      document.getElementById('btn-prev').addEventListener('click', () => { page--; load(); });
      document.getElementById('btn-next').addEventListener('click', () => { page++; load(); });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8" class="error-text">${err.message}</td></tr>`;
    }
  }

  document.getElementById('btn-filter').addEventListener('click', () => { page = 1; load(); });
  document.getElementById('btn-reset').addEventListener('click', () => {
    document.querySelectorAll('.filters input, .filters select').forEach((el) => (el.value = ''));
    page = 1;
    load();
  });

  load();
})();
