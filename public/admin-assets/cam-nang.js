(async () => {
  const me = await AdminCommon.mountNav('cam-nang');
  if (!me) return;

  const NAMES = { A: 'Sáng mờ thâm', B: 'Đều màu rạng rỡ', C: 'Ẩm mịn căng sáng' };

  try {
    const { branches } = await AdminCommon.api('/cam-nang');
    const container = document.getElementById('branches');
    container.innerHTML = '';
    branches.forEach(({ nhanh, available }) => {
      const div = document.createElement('div');
      div.className = 'card branch-card';
      div.innerHTML = `
        <div>
          <div class="name">Nhánh ${nhanh} – ${NAMES[nhanh]}</div>
          ${available ? '<span class="hint-text">Sẵn sàng tải xuống</span>' : '<span class="unavailable">Chưa có file trên máy chủ</span>'}
        </div>
        ${available ? `<a class="btn btn-primary btn-sm" href="/admin/cam-nang/download/${nhanh}">Tải PDF</a>` : ''}
      `;
      container.appendChild(div);
    });
  } catch (err) {
    document.getElementById('branches').innerHTML = `<p class="error-text">${err.message}</p>`;
  }
})();
