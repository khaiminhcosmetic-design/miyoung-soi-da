document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorEl = document.getElementById('error-text');
  const btn = document.getElementById('btn-submit');
  errorEl.textContent = '';
  btn.disabled = true;
  try {
    const res = await fetch('/admin/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      errorEl.textContent = data.error || 'Không thể đăng nhập.';
      btn.disabled = false;
      return;
    }
    window.location.href = '/admin';
  } catch (err) {
    errorEl.textContent = 'Không kết nối được máy chủ. Thử lại.';
    btn.disabled = false;
  }
});
