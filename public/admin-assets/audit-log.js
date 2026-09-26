(async () => {
  const me = await AdminCommon.mountNav('audit-log');
  if (!me) return;

  const ACTION_LABEL = {
    xem_lead: 'Xem lead', cap_nhat_trang_thai: 'Cập nhật trạng thái', rut_dong_y_uu_dai: 'Rút đồng ý ưu đãi',
    xoa_theo_yeu_cau: 'Xóa theo yêu cầu khách', tu_dong_xoa: 'Tự động xóa (hết hạn lưu trữ)',
  };

  let page = 1;

  async function load() {
    const tbody = document.getElementById('log-tbody');
    tbody.innerHTML = '<tr><td colspan="5">Đang tải…</td></tr>';
    try {
      const { entries, total, pageSize } = await AdminCommon.api('/audit-log?page=' + page);
      tbody.innerHTML = '';
      entries.forEach((e) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${AdminCommon.formatVN(e.thoi_diem)}</td>
          <td>${e.user_email || '(hệ thống)'}</td>
          <td>${ACTION_LABEL[e.hanh_dong] || e.hanh_dong}</td>
          <td>${e.lead_id ? e.lead_id.slice(0, 8) + '…' : '—'}</td>
          <td>${e.so_luong ?? '—'}</td>`;
        tbody.appendChild(tr);
      });
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      const pag = document.getElementById('pagination');
      pag.innerHTML = `
        <button class="btn btn-outline btn-sm" id="btn-prev" ${page <= 1 ? 'disabled' : ''}>← Trước</button>
        <span class="hint-text">Trang ${page}/${totalPages} · ${total} mục</span>
        <button class="btn btn-outline btn-sm" id="btn-next" ${page >= totalPages ? 'disabled' : ''}>Sau →</button>`;
      document.getElementById('btn-prev').addEventListener('click', () => { page--; load(); });
      document.getElementById('btn-next').addEventListener('click', () => { page++; load(); });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="error-text">${err.message}</td></tr>`;
    }
  }

  load();
})();
