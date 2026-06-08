let prevJson = '';

function getIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  const icons = {
    txt: '📄', js: '📜', ts: '📜', py: '🐍',
    json: '🗂️', html: '🌐', css: '🎨', md: '📝',
    csv: '📊', xml: '📋', sh: '⚙️', bat: '⚙️',
    png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️',
    pdf: '📕', zip: '📦', rar: '📦',
  };
  return icons[ext] || '📄';
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('th-TH');
}

function renderFiles(files) {
  const list = document.getElementById('fileList');
  const count = document.getElementById('fileCount');
  count.textContent = `${files.length} ไฟล์`;

  if (files.length === 0) {
    list.innerHTML = `
      <div class="empty">
        <div class="icon">📂</div>
        <p>ยังไม่มีไฟล์ในโฟลเดอร์</p>
      </div>`;
    return;
  }

  list.innerHTML = files.map(f => `
    <div class="file-card" data-name="${f.name}">
      <span class="file-icon">${getIcon(f.name)}</span>
      <div class="file-info">
        <div class="file-name">${f.name}</div>
        <div class="file-meta">${formatSize(f.size)} · ${formatDate(f.modified)}</div>
      </div>
      <button class="btn-copy" data-copy="${f.name}">Copy</button>
    </div>
  `).join('');
}

async function getFileContent(name) {
  const res = await fetch(`/flie/${encodeURIComponent(name)}`);
  return res.text();
}

let currentContent = '';

async function openFile(name) {
  const text = await getFileContent(name);
  currentContent = text;
  document.getElementById('modalTitle').textContent = name;
  document.getElementById('modalContent').textContent = text;
  document.getElementById('modal').classList.add('open');
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
}

async function copyContent(text, btn) {
  await navigator.clipboard.writeText(text);
  btn.textContent = 'Copied!';
  btn.classList.add('copied');
  showToast();
  setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
}

function showToast() {
  const t = document.getElementById('toast');
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}

// ───── Event Delegation ─────
document.getElementById('fileList').addEventListener('click', async e => {
  const copyBtn = e.target.closest('[data-copy]');
  const card = e.target.closest('[data-name]');

  if (copyBtn) {
    e.stopPropagation();
    const text = await getFileContent(copyBtn.dataset.copy);
    copyContent(text, copyBtn);
    return;
  }

  if (card) openFile(card.dataset.name);
});

document.getElementById('modalCopy').addEventListener('click', function () {
  copyContent(currentContent, this);
});

document.getElementById('modalClose').addEventListener('click', closeModal);

document.getElementById('modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

// ───── Polling (works on both local + Netlify) ─────
async function loadFiles() {
  try {
    const res = await fetch('/files.json?t=' + Date.now());
    const files = await res.json();
    const json = JSON.stringify(files);
    if (json !== prevJson) {
      prevJson = json;
      renderFiles(files);
    }
    document.getElementById('status').textContent = 'เชื่อมต่อแล้ว · อัปเดตทุก 5 วินาที';
  } catch {
    document.getElementById('status').textContent = 'เชื่อมต่อไม่ได้...';
  }
}

loadFiles();
setInterval(loadFiles, 5000);
