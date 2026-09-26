(async () => {
  const me = await AdminCommon.mountNav('accounts');
  if (!me) return;

  const ROLE_LABEL = { quan_tri_vien: 'Quản trị viên', chuyen_vien: 'Chuyên viên' };

  async function load() {
    const tbody = document.getElementById('users-tbody');
    tbody.innerHTML = '<tr><td colspan="5">Đang tải…</td></tr>';
    try {
      const { users } = await AdminCommon.api('/users');
      tbody.innerHTML = '';
      users.forEach((u) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${u.email}</td>
          <td>${u.ten || '—'}</td>
          <td>${ROLE_LABEL[u.role]}</td>
          <td>${u.active ? 'Đang hoạt động' : 'Đã khóa'}</td>
          <td>
            <button class="btn btn-outline btn-sm" data-toggle="${u.id}" data-active="${u.active}">${u.active ? 'Khóa' : 'Mở khóa'}</button>
          </td>`;
        tbody.appendChild(tr);
      });
      tbody.querySelectorAll('[data-toggle]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const nextActive = btn.dataset.active === '1' ? false : true;
          try {
            await AdminCommon.api(`/users/${btn.dataset.toggle}`, { method: 'PATCH', body: { active: nextActive } });
            AdminCommon.showToast(nextActive ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
            load();
          } catch (err) {
            AdminCommon.showToast(err.message);
          }
        });
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="error-text">${err.message}</td></tr>`;
    }
  }

  document.getElementById('create-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('create-error');
    errorEl.textContent = '';
    try {
      await AdminCommon.api('/users', {
        method: 'POST',
        body: {
          email: document.getElementById('new-email').value.trim(),
          ten: document.getElementById('new-ten').value.trim(),
          role: document.getElementById('new-role').value,
          password: document.getElementById('new-password').value,
        },
      });
      document.getElementById('create-form').reset();
      AdminCommon.showToast('Đã tạo tài khoản.');
      load();
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });

  load();
})();
