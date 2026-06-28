const form = document.getElementById('mailForm');
const sendBtn = document.getElementById('sendBtn');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('attachments');
const fileList = document.getElementById('fileList');
const browseBtn = document.getElementById('browseBtn');
const toast = document.getElementById('toast');

let files = [];

// Dropzone
dropzone.addEventListener('click', () => fileInput.click());
browseBtn.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });

dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('over'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('over'));
dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('over');
  addFiles([...e.dataTransfer.files]);
});

fileInput.addEventListener('change', () => {
  addFiles([...fileInput.files]);
  fileInput.value = '';
});

function addFiles(newFiles) {
  for (const f of newFiles) {
    if (!files.find(x => x.name === f.name && x.size === f.size)) {
      files.push(f);
    }
  }
  renderFileList();
}

function removeFile(index) {
  files.splice(index, 1);
  renderFileList();
}

function renderFileList() {
  fileList.innerHTML = '';
  files.forEach((f, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="file-name">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
        ${escHtml(f.name)}
        <span class="file-size">${fmtSize(f.size)}</span>
      </span>
      <button type="button" title="Remove" onclick="removeFile(${i})">&times;</button>
    `;
    fileList.appendChild(li);
  });
}

function fmtSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Form submit
form.addEventListener('submit', async e => {
  e.preventDefault();

  const fromEmail = form.fromEmail.value.trim();
  const subject   = form.subject.value.trim();
  const body      = form.body.value.trim();

  if (!fromEmail || !subject || !body) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  const data = new FormData();
  data.append('fromName',  form.fromName.value.trim());
  data.append('fromEmail', fromEmail);
  data.append('subject',   subject);
  data.append('body',      body);
  files.forEach(f => data.append('attachments', f));

  setLoading(true);

  try {
    const res = await fetch('/send', { method: 'POST', body: data });
    const json = await res.json();

    if (res.ok && json.ok) {
      showToast('Mail sent successfully!', 'success');
      form.reset();
      files = [];
      renderFileList();
    } else {
      showToast(json.error || 'Something went wrong.', 'error');
    }
  } catch {
    showToast('Network error — could not reach the server.', 'error');
  } finally {
    setLoading(false);
  }
});

function setLoading(on) {
  sendBtn.disabled = on;
  sendBtn.innerHTML = on
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin 0.8s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Sending…`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg> Send Mail`;
}

let toastTimer;
function showToast(msg, type = '') {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 4000);
}

// Spinner keyframe
const style = document.createElement('style');
style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(style);
