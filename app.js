const authCard = document.getElementById('authCard');
const verifyCard = document.getElementById('verifyCard');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const email = document.getElementById('email');
const password = document.getElementById('password');
const authBtn = document.getElementById('authBtn');
const authResult = document.getElementById('authResult');
const username = document.getElementById('username');
const startVerifyBtn = document.getElementById('startVerifyBtn');
const verifyResult = document.getElementById('verifyResult');

let mode = 'login';

loginTab.addEventListener('click', () => setMode('login'));
signupTab.addEventListener('click', () => setMode('signup'));

authBtn.addEventListener('click', async () => {
  const mail = email.value.trim();
  const pass = password.value;
  show(authResult, 'กำลังเตรียมระบบ...', 'success');

  if (!mail || !pass) {
    show(authResult, 'กรุณากรอกอีเมลและรหัสผ่าน', 'error');
    return;
  }

  // Supabase integration is intentionally configured through config.js.
  // Never put a Supabase service-role key in this public GitHub repository.
  if (!window.SUPABASE_CONFIG?.url || !window.SUPABASE_CONFIG?.anonKey) {
    show(authResult, 'ยังไม่ได้เชื่อมต่อ Supabase: ใส่ URL และ anon key ใน config.js ก่อน', 'error');
    return;
  }

  show(authResult, 'ระบบ Auth พร้อมเชื่อมต่อแล้ว แต่ต้องติดตั้ง Supabase client/config ก่อนใช้งานจริง', 'success');
});

startVerifyBtn.addEventListener('click', async () => {
  const name = username.value.trim();
  if (!name) {
    show(verifyResult, 'กรุณาใส่ชื่อผู้ใช้ Roblox', 'error');
    return;
  }

  show(verifyResult,
    `เตรียมสร้างรหัสยืนยันสำหรับ <strong>${escapeHtml(name)}</strong>...<br><small>การยืนยันจริงต้องให้ Roblox Experience ส่ง UserId กลับ backend หลังคุณเข้าเกม</small>`,
    'success', true);
});

function setMode(next) {
  mode = next;
  loginTab.classList.toggle('active', mode === 'login');
  signupTab.classList.toggle('active', mode === 'signup');
  authBtn.textContent = mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก';
  password.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
}

function show(element, message, type, html = false) {
  element.className = `result ${type}`;
  element.classList.remove('hidden');
  if (html) element.innerHTML = message;
  else element.textContent = message;
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}