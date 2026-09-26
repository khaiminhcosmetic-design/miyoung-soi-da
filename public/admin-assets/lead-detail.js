(async () => {
  const me = await AdminCommon.mountNav('leads');
  if (!me) return;

  const id = window.location.pathname.split('/').pop();
  const content = document.getElementById('content');

  function consentRows(dongY) {
    if (!dongY) return '<p class="hint-text">Không có bản ghi đồng ý.</p>';
    return `
      <div class="consent-record">
        <div>Thời điểm: ${AdminCommon.formatVN(dongY.thoi_diem)}</div>
        <div>Phiên bản thông báo: ${dongY.phien_ban_thong_bao}</div>
        <div>Khung giờ đã thỏa thuận: ${dongY.khung_gio_da_thoa_thuan}</div>
        <div>Gọi tư vấn và gửi cẩm nang: ${dongY.muc_dich && dongY.muc_dich.goi_tu_van_va_gui_cam_nang ? 'Đồng ý' : 'Không đồng ý'}</div>
        <div>Nhận thông tin ưu đãi: ${dongY.muc_dich && dongY.muc_dich.nhan_uu_dai ? 'Đồng ý' : 'Không đồng ý'}</div>
        <div>Xác nhận đủ 16 tuổi: ${dongY.xac_nhan_du_16_tuoi ? 'Có' : 'Không'}</div>
        <div>Kênh: ${dongY.kenh || '—'}</div>
      </div>`;
  }

  async function render() {
    try {
      const { lead } = await AdminCommon.api(`/leads/${id}`);
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
      const calledToday = lead.lan_goi_cuoi_ngay === today;

      content.innerHTML = `
        <div class="card">
          <h2 style="margin-top:0;">${lead.ten_goi || '(Không có tên)'} · <a href="tel:${lead.so_dien_thoai}">${lead.so_dien_thoai}</a></h2>
          <p>
            Mã kết quả: <strong>${lead.ma_ket_qua}</strong> · Nhánh ${lead.nhanh_cam_nang} ·
            Khung giờ: ${AdminCommon.KHUNG_GIO_LABEL[lead.khung_gio_goi]} ·
            Trạng thái: <span class="badge badge-${lead.trang_thai}">${AdminCommon.TRANG_THAI_LABEL[lead.trang_thai]}</span>
          </p>
          <p class="hint-text">Tạo lúc ${AdminCommon.formatVN(lead.created_at)} · Tương tác gần nhất ${AdminCommon.formatVN(lead.last_interaction_at)} · Đã gọi ${lead.so_lan_goi} lần</p>
          ${calledToday ? '<p class="error-text">Đã ghi nhận cuộc gọi cho lead này trong hôm nay (tối đa 1 cuộc/ngày).</p>' : ''}

          <div class="status-actions">
            <button class="btn btn-secondary btn-sm" data-action="da_goi" ${calledToday ? 'disabled' : ''}>Đã gọi được</button>
            <button class="btn btn-outline btn-sm" data-action="khong_nghe_1" ${calledToday ? 'disabled' : ''}>Không nghe máy</button>
            <button class="btn btn-outline btn-sm" data-action="khong_nghe_2" ${calledToday ? 'disabled' : ''}>Không nghe máy (lần 2)</button>
            <button class="btn btn-outline btn-sm" data-action="da_gui_cam_nang">Đã gửi cẩm nang</button>
            <button class="btn btn-outline btn-sm" data-action="dung_lien_he">Dừng liên hệ</button>
          </div>
        </div>

        <div class="card">
          <h2 style="margin-top:0;">Bản ghi đồng ý</h2>
          ${consentRows(lead.dong_y)}
          ${lead.nhan_uu_dai ? '<button class="btn btn-outline btn-sm" id="btn-rut-uu-dai" style="margin-top:12px;">Khách rút đồng ý ưu đãi</button>' : '<p class="hint-text" style="margin-top:12px;">Khách chưa đồng ý (hoặc đã rút) nhận ưu đãi.</p>'}
        </div>

        <div class="card">
          <h2 style="margin-top:0;">Ghi chú</h2>
          <textarea id="ghi-chu" rows="3" maxlength="300">${lead.ghi_chu || ''}</textarea>
          <p class="hint-text">Không ghi thông tin sức khỏe ngoài mã kết quả. Tối đa 300 ký tự.</p>
          <button class="btn btn-primary btn-sm" id="btn-save-note">Lưu ghi chú</button>
        </div>

        ${me.role === 'quan_tri_vien' ? `
        <div class="card">
          <h2 style="margin-top:0;color:var(--danger);">Xóa theo yêu cầu khách</h2>
          <p class="hint-text">Hành động không thể hoàn tác. Chỉ dùng khi khách yêu cầu xóa dữ liệu.</p>
          <button class="btn btn-outline btn-sm" id="btn-delete-step1">Xóa lead này</button>
          <div id="delete-confirm" class="hidden" style="margin-top:10px;">
            <p class="error-text">Xác nhận lần 2: bạn chắc chắn muốn xóa vĩnh viễn lead này?</p>
            <button class="btn btn-danger btn-sm" id="btn-delete-step2">Xác nhận xóa vĩnh viễn</button>
            <button class="btn btn-outline btn-sm" id="btn-delete-cancel">Hủy</button>
          </div>
        </div>` : ''}
      `;

      content.querySelectorAll('[data-action]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          try {
            const res = await AdminCommon.api(`/leads/${id}`, { method: 'PATCH', body: { trang_thai: btn.dataset.action } });
            AdminCommon.showToast(res.hint || 'Đã cập nhật trạng thái.');
            render();
          } catch (err) {
            AdminCommon.showToast(err.message);
            btn.disabled = false;
          }
        });
      });

      const noteBtn = document.getElementById('btn-save-note');
      if (noteBtn) noteBtn.addEventListener('click', async () => {
        try {
          await AdminCommon.api(`/leads/${id}`, { method: 'PATCH', body: { ghi_chu: document.getElementById('ghi-chu').value } });
          AdminCommon.showToast('Đã lưu ghi chú.');
        } catch (err) {
          AdminCommon.showToast(err.message);
        }
      });

      const rutBtn = document.getElementById('btn-rut-uu-dai');
      if (rutBtn) rutBtn.addEventListener('click', async () => {
        try {
          await AdminCommon.api(`/leads/${id}`, { method: 'PATCH', body: { nhan_uu_dai: false } });
          AdminCommon.showToast('Đã ghi nhận khách rút đồng ý ưu đãi.');
          render();
        } catch (err) {
          AdminCommon.showToast(err.message);
        }
      });

      const del1 = document.getElementById('btn-delete-step1');
      if (del1) {
        del1.addEventListener('click', () => document.getElementById('delete-confirm').classList.remove('hidden'));
        document.getElementById('btn-delete-cancel').addEventListener('click', () => document.getElementById('delete-confirm').classList.add('hidden'));
        document.getElementById('btn-delete-step2').addEventListener('click', async () => {
          try {
            await AdminCommon.api(`/leads/${id}`, { method: 'DELETE', body: { confirm: true } });
            window.location.href = '/admin/leads';
          } catch (err) {
            AdminCommon.showToast(err.message);
          }
        });
      }
    } catch (err) {
      content.innerHTML = `<p class="error-text">${err.message}</p>`;
    }
  }

  render();
})();
