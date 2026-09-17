const username = document.getElementById('username');
const verifyBtn = document.getElementById('verifyBtn');
const result = document.getElementById('result');

verifyBtn.addEventListener('click', () => {
  const name = username.value.trim();
  result.classList.remove('hidden');

  if (!name) {
    result.className = 'result error';
    result.textContent = 'กรุณาใส่ชื่อผู้ใช้ Roblox ก่อน';
    return;
  }

  result.className = 'result success';
  result.innerHTML = `บัญชี <strong>${escapeHtml(name)}</strong> พร้อมเข้าสู่ขั้นตอนยืนยัน<br><small>ตอนนี้เป็นโหมด DEMO — ยังไม่ได้ตรวจการเล่นเกมจริง</small>`;
});

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}