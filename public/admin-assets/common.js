// Tiện ích dùng chung cho các trang quản trị
const AdminCommon = (() => {
  async function api(path, options = {}) {
    const res = await fetch('/admin/api' + path, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      ...options,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (res.status === 401) {
      window.location.href = '/admin/login';
      throw new Error('Chưa đăng nhập');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra.');
    return data;
  }

  function showToast(msg) {
    let el = document.getElementById('admin-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'admin-toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.add('hidden'), 3000);
  }

  const NAV_ITEMS = [
    { href: '/admin', label: 'Hôm nay cần gọi', key: 'dashboard' },
    { href: '/admin/leads', label: 'Tất cả lead', key: 'leads' },
    { href: '/admin/cam-nang', label: 'Tệp cẩm nang', key: 'cam-nang' },
    { href: '/admin/accounts', label: 'Tài khoản', key: 'accounts', adminOnly: true },
    { href: '/admin/audit-log', label: 'Nhật ký', key: 'audit-log', adminOnly: true },
  ];

  async function mountNav(activeKey) {
    const mount = document.getElementById('topbar-mount');
    if (!mount) return null;
    let me;
    try {
      const data = await api('/me');
      me = data.user;
    } catch (e) {
      window.location.href = '/admin/login';
      return null;
    }
    const isAdmin = me.role === 'quan_tri_vien';
    const links = NAV_ITEMS.filter((i) => !i.adminOnly || isAdmin)
      .map((i) => `<a href="${i.href}" class="${i.key === activeKey ? 'active' : ''}">${i.label}</a>`)
      .join('');
    mount.innerHTML = `
      <div class="topbar">
        <span class="brand">MIYOUNG · Quản trị</span>
        <nav>${links}<button type="button" id="btn-logout">Đăng xuất (${me.ten})</button></nav>
      </div>`;
    document.getElementById('btn-logout').addEventListener('click', async () => {
      await api('/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    });
    return me;
  }

  const TRANG_THAI_LABEL = {
    moi: 'Mới', da_goi: 'Đã gọi được', khong_nghe_1: 'Không nghe máy (lần 1)',
    khong_nghe_2: 'Không nghe máy (lần 2)', da_gui_cam_nang: 'Đã gửi cẩm nang', dung_lien_he: 'Dừng liên hệ',
  };
  const KHUNG_GIO_LABEL = { '08-11': '8h – 11h', '11-14': '11h – 14h', '14-17': '14h – 17h', '17-20': '17h – 20h' };

  function formatVN(iso) {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(iso));
  }

  return { api, showToast, mountNav, TRANG_THAI_LABEL, KHUNG_GIO_LABEL, formatVN };
})();
