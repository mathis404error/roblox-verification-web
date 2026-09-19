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
const shareScreenBtn = document.getElementById('shareScreenBtn');
const screenPreview = document.getElementById('screenPreview');
const screenStatus = document.getElementById('screenStatus');
const screenConfirmBtn = document.getElementById('screenConfirmBtn');
const gameUrl = document.getElementById('gameUrl');
const checkGameBtn = document.getElementById('checkGameBtn');
const gameResult = document.getElementById('gameResult');
const confirmDevBtn = document.getElementById('confirmDevBtn');
const devResult = document.getElementById('devResult');
let screenStream = null;
let screenConfirmed = false;
let devEligible = false;
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

shareScreenBtn.addEventListener('click', async () => {
  const name = username.value.trim();
  if (!name) return show(screenStatus, 'กรุณาใส่ชื่อผู้ใช้ Roblox ก่อน', 'error');
  if (!navigator.mediaDevices?.getDisplayMedia) {
    return show(screenStatus, 'เบราว์เซอร์นี้ไม่รองรับการแชร์หน้าจอ ใช้การยืนยันด้วย Roblox Experience แทนได้', 'error');
  }
  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    screenPreview.srcObject = screenStream;
    screenPreview.classList.remove('hidden');
    screenConfirmBtn.classList.remove('hidden');
    show(screenStatus, 'เริ่มแชร์หน้าจอแล้ว กรุณาเปิดหน้าโปรไฟล์ Roblox ของคุณให้เห็นชื่อผู้ใช้ชัดเจน', 'success');
    screenStream.getVideoTracks()[0].addEventListener('ended', () => {
      screenConfirmed = false;
      screenConfirmBtn.classList.add('hidden');
      show(screenStatus, 'หยุดแชร์หน้าจอแล้ว', 'error');
    });
  } catch {
    show(screenStatus, 'ยกเลิกการแชร์หน้าจอแล้ว', 'error');
  }
});

screenConfirmBtn.addEventListener('click', () => {
  screenConfirmed = true;
  show(screenStatus, `✓ เห็นชื่อที่คุณแสดงบนหน้าจอแล้ว: <strong>${escapeHtml(username.value.trim())}</strong><br><small>ขั้นตอนนี้เป็นการยืนยันด้วยหน้าจอ ไม่ใช่หลักฐานความเป็นเจ้าของบัญชีเพียงอย่างเดียว</small>`, 'success', true);
});

checkGameBtn.addEventListener('click', async () => {
  const link = gameUrl.value.trim();
  const name = username.value.trim();
  if (!screenConfirmed) return show(gameResult, 'กรุณายืนยันขั้นตอนชื่อผู้ใช้ก่อน', 'error');
  if (!link) return show(gameResult, 'กรุณาส่งลิงก์เกม Roblox', 'error');
  if (!/^https?:\\/\\/(www\\.)?roblox\\.com\\/games\\/\\d+/i.test(link)) {
    return show(gameResult, 'ลิงก์ต้องเป็นรูปแบบ https://www.roblox.com/games/รหัสเกม', 'error');
  }

  show(gameResult, 'กำลังตรวจสอบผู้สร้างเกมและจำนวนผู้เล่น...', 'success');
  // Real verification belongs in a backend: it must resolve the universe,
  // confirm the creator matches the verified Roblox UserId, then read the
  // current player count. Never trust a browser-supplied DEV flag.
  if (!db) return show(gameResult, 'ยังไม่ได้เชื่อมต่อ backend สำหรับตรวจเกมจริง', 'error');

  try {
    const { data: { session } } = await db.auth.getSession();
    if (!session) return show(gameResult, 'กรุณาเข้าสู่ระบบก่อน', 'error');

    const { data, error } = await db.functions.invoke('check-roblox-game', {
      body: { gameUrl: link, robloxUsername: name }
    });
    if (error) throw error;

    if (!data?.creatorMatch) {
      devEligible = false;
      confirmDevBtn.classList.add('hidden');
      return show(gameResult, '❌ เกมนี้ไม่ได้ยืนยันว่าเป็นเกมที่สร้างโดยบัญชี Roblox นี้ จึงส่ง DEV ไม่ได้', 'error');
    }

    const players = Number(data.currentPlayers || 0);
    devEligible = players > 300;
    if (!devEligible) {
      confirmDevBtn.classList.add('hidden');
      return show(gameResult, `เกมเป็นของบัญชีนี้ แต่ตอนนี้มีผู้เล่น ${players} คน — ต้องมากกว่า 300 คนจึงยืนยัน DEV ได้`, 'error');
    }

    confirmDevBtn.classList.remove('hidden');
    show(gameResult, `✓ ผู้สร้างตรงกัน และตอนนี้มีผู้เล่น ${players} คน (>300)<br>กด “ยืนยัน DEV อีกครั้ง” เพื่อส่งสถานะ`, 'success', true);
  } catch (error) {
    show(gameResult, 'ตรวจเกมไม่สำเร็จ: backend ยังไม่ได้ติดตั้ง/ตั้งค่า หรือไม่สามารถอ่านข้อมูล Roblox ได้', 'error');
  }
});

confirmDevBtn.addEventListener('click', async () => {
  if (!devEligible) return show(devResult, 'ยังไม่ผ่านเงื่อนไข DEV', 'error');
  if (!db) return show(devResult, 'ยังไม่ได้เชื่อมต่อ backend', 'error');
  try {
    const { data, error } = await db.functions.invoke('confirm-dev', {
      body: { gameUrl: gameUrl.value.trim() }
    });
    if (error) throw error;
    show(devResult, data?.ok ? '✓ ยืนยัน DEV สำเร็จ' : 'ไม่สามารถยืนยัน DEV ได้', data?.ok ? 'success' : 'error');
  } catch {
    show(devResult, 'ยืนยัน DEV ไม่สำเร็จ: ต้องติดตั้ง backend ก่อน', 'error');
  }
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