const tokenGate = document.querySelector('#token-gate');
const adminPanel = document.querySelector('#admin-panel');
const tokenForm = document.querySelector('#token-form');
const tokenInput = document.querySelector('#token-input');
const tokenError = document.querySelector('#token-error');
const lockButton = document.querySelector('#lock-button');

const projectForm = document.querySelector('#project-form');
const projectIdField = document.querySelector('#project-id');
const titleField = document.querySelector('#field-title');
const categoryField = document.querySelector('#field-category');
const urlField = document.querySelector('#field-url');
const imageField = document.querySelector('#field-image');
const descriptionField = document.querySelector('#field-description');
const submitButton = document.querySelector('#submit-button');
const cancelEditButton = document.querySelector('#cancel-edit');
const formError = document.querySelector('#form-error');
const projectList = document.querySelector('#project-list');

function getToken() {
  return localStorage.getItem('adminToken') || '';
}

async function apiRequest(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': getToken(),
      ...options.headers,
    },
  });
  if (response.status === 401) {
    localStorage.removeItem('adminToken');
    showGate('That token was rejected. Please re-enter it.');
    throw new Error('Unauthorized');
  }
  if (!response.ok && response.status !== 204) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Request failed');
  }
  return response.status === 204 ? null : response.json();
}

function showGate(message = '') {
  tokenGate.hidden = false;
  adminPanel.hidden = true;
  tokenError.textContent = message;
}

function showPanel() {
  tokenGate.hidden = true;
  adminPanel.hidden = false;
  loadProjects();
}

tokenForm.addEventListener('submit', (event) => {
  event.preventDefault();
  localStorage.setItem('adminToken', tokenInput.value.trim());
  apiRequest('/api/projects').then(() => showPanel()).catch(() => showGate('That token was rejected.'));
});

lockButton.addEventListener('click', () => {
  localStorage.removeItem('adminToken');
  tokenInput.value = '';
  showGate();
});

function resetForm() {
  projectForm.reset();
  projectIdField.value = '';
  submitButton.textContent = 'Add project';
  cancelEditButton.hidden = true;
}
cancelEditButton.addEventListener('click', resetForm);

function renderProjectList(projects) {
  if (projects.length === 0) {
    projectList.innerHTML = '<p class="muted">No projects yet — add your first one above.</p>';
    return;
  }
  projectList.innerHTML = projects.map((project) => `
    <div class="project-row" data-id="${project.id}">
      <div class="info">
        <h4>${project.title}</h4>
        <span>${project.category} · ${project.url}</span>
      </div>
      <div class="row-actions">
        <button type="button" data-action="edit">Edit</button>
        <button type="button" data-action="delete">Delete</button>
      </div>
    </div>`).join('');

  projectList.querySelectorAll('[data-action="edit"]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.closest('.project-row').dataset.id;
      const project = projects.find((p) => p.id === id);
      projectIdField.value = project.id;
      titleField.value = project.title;
      categoryField.value = project.category;
      urlField.value = project.url;
      imageField.value = project.imageUrl || '';
      descriptionField.value = project.description || '';
      submitButton.textContent = 'Save changes';
      cancelEditButton.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  projectList.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const id = button.closest('.project-row').dataset.id;
      if (!confirm('Delete this project link?')) return;
      await apiRequest(`/api/projects/${id}`, { method: 'DELETE' });
      loadProjects();
    });
  });
}

async function loadProjects() {
  try {
    const projects = await apiRequest('/api/projects');
    renderProjectList(projects);
  } catch {
    // apiRequest already handled unauthorized/gate display
  }
}

projectForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  formError.textContent = '';
  const payload = {
    title: titleField.value.trim(),
    category: categoryField.value,
    url: urlField.value.trim(),
    imageUrl: imageField.value.trim(),
    description: descriptionField.value.trim(),
  };
  const id = projectIdField.value;
  try {
    if (id) {
      await apiRequest(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await apiRequest('/api/projects', { method: 'POST', body: JSON.stringify(payload) });
    }
    resetForm();
    loadProjects();
  } catch (error) {
    formError.textContent = error.message;
  }
});

if (getToken()) {
  apiRequest('/api/projects').then(() => showPanel()).catch(() => showGate());
} else {
  showGate();
}
