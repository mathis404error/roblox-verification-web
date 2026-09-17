const { url: supabaseUrl, anonKey: supabaseAnonKey } = window.SUPABASE_CONFIG || {};
const supabaseReady = Boolean(window.supabase && supabaseUrl && supabaseAnonKey);
const db = supabaseReady ? window.supabase.createClient(supabaseUrl, supabaseAnonKey) : null;

const authCard = document.getElementById('authCard');
const verifyCard = document.getElementById('verifyCard');
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const email = document.getElementById('email');
const password = document.getElementById('password');
const authBtn = document.getElementById('authBtn');
const logoutBtn = document.getElementById('logoutBtn');
const authResult = document.getElementById('authResult');
const username = document.getElementById('username');
const startVerifyBtn = document.getElementById('startVerifyBtn');
const verifyResult = document.getElementById('verifyResult');
let mode = 'login';

loginTab.addEventListener('click', () => setMode('login'));
signupTab.addEventListener('click', () => setMode('signup'));

authBtn.addEventListener('click', handleAuth);
logoutBtn.addEventListener('click', async () => {
  if (!db) return;
  const { error } = await db.auth.signOut();
  if (error) show(authResult, error.message, 'error');
  else renderSession(null);
});

startVerifyBtn.addEventListener('click', async () => {
  const name = username.value.trim();
  if (!name) return show(verifyResult, 'กรุณาใส่ชื่อผู้ใช้ Roblox', 'error');
  if (!db) return show(verifyResult, 'ยังไม่ได้ตั้งค่า Supabase ใน config.js', 'error');

  const { data: { session } } = await db.auth.getSession();
  if (!session) return show(verifyResult, 'กรุณาเข้าสู่ระบบก่อน', 'error');

  // This UI is ready for the verification_codes Edge Function.
  // The backend must generate/store a one-time code and Roblox Experience must redeem it.
  show(verifyResult,
    `กำลังเริ่มยืนยัน <strong>${escapeHtml(name)}</strong>...<br><small>ต้องติดตั้ง backend สำหรับสร้างรหัสและรับ Roblox UserId ต่อ</small>`,
    'success', true);
});

async function handleAuth() {
  const mail = email.value.trim();
  const pass = password.value;
  if (!mail || !pass) return show(authResult, 'กรุณากรอกอีเมลและรหัสผ่าน', 'error');
  if (pass.length < 6) return show(authResult, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร', 'error');
  if (!db) return show(authResult, 'ยังไม่ได้เชื่อมต่อ Supabase: ใส่ URL และ anon key ใน config.js', 'error');

  authBtn.disabled = true;
  show(authResult, mode === 'login' ? 'กำลังเข้าสู่ระบบ...' : 'กำลังสมัครสมาชิก...', 'success');
  const result = mode === 'login'
    ? await db.auth.signInWithPassword({ email: mail, password: pass })
    : await db.auth.signUp({ email: mail, password: pass });
  authBtn.disabled = false;

  if (result.error) return show(authResult, result.error.message, 'error');
  if (mode === 'signup' && !result.data.session) {
    return show(authResult, 'สมัครสำเร็จแล้ว กรุณาตรวจอีเมลเพื่อยืนยันอีเมลก่อนเข้าสู่ระบบ', 'success');
  }
  renderSession(result.data.session);
}

function renderSession(session) {
  if (session) {
    authCard.classList.add('signed-in');
    verifyCard.classList.remove('hidden');
    authBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    loginTab.classList.add('hidden');
    signupTab.classList.add('hidden');
    email.disabled = true;
    password.classList.add('hidden');
    show(authResult, `เข้าสู่ระบบแล้ว: ${escapeHtml(session.user.email || '')}`, 'success');
  } else {
    authCard.classList.remove('signed-in');
    verifyCard.classList.add('hidden');
    authBtn.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
    loginTab.classList.remove('hidden');
    signupTab.classList.remove('hidden');
    email.disabled = false;
    password.classList.remove('hidden');
    authResult.classList.add('hidden');
  }
}

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
  return String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

if (db) {
  db.auth.getSession().then(({ data: { session } }) => renderSession(session));
  db.auth.onAuthStateChange((_event, session) => renderSession(session));
} else {
  show(authResult, 'เว็บไซต์พร้อมแล้ว แต่ต้องใส่ Supabase URL + anon key ใน config.js เพื่อเปิดระบบบัญชีจริง', 'error');
}