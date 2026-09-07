const SKILLS = [
  { name: 'HTML', level: 95 },
  { name: 'CSS', level: 90 },
  { name: 'JavaScript', level: 90 },
  { name: 'React.js', level: 85 },
  { name: 'TypeScript', level: 85 },
  { name: 'Node.js', level: 80 },
];

const skillsGrid = document.querySelector('#skills-grid');
skillsGrid.innerHTML = SKILLS.map((skill) => `
  <div class="skill">
    <div class="skill-top"><span>${skill.name}</span><span>${skill.level}%</span></div>
    <div class="skill-bar"><i style="width:${skill.level}%"></i></div>
  </div>`).join('');

const projectGrid = document.querySelector('#project-grid');
const filterButtons = document.querySelectorAll('#filters button');
const statProjects = document.querySelector('#stat-projects');
let projects = [];

function renderProjects(filter = 'all') {
  const visible = filter === 'all' ? projects : projects.filter((p) => p.category === filter);
  if (visible.length === 0) {
    projectGrid.innerHTML = `<p class="empty-state">${
      projects.length === 0 ? 'No projects yet — add your first one from the admin page.' : 'No projects in this category yet.'
    }</p>`;
    return;
  }
  projectGrid.innerHTML = visible.map((project) => `
    <a class="project-card" href="${project.url}" target="_blank" rel="noreferrer">
      <div class="project-thumb" style="${project.imageUrl ? `background-image:url('${project.imageUrl}')` : ''}"></div>
      <div class="project-body">
        <span class="project-category">${project.category}</span>
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        <span class="project-link">View project ↗</span>
      </div>
    </a>`).join('');
}

fetch('/api/projects')
  .then((response) => response.json())
  .then((data) => {
    projects = data;
    statProjects.textContent = `${projects.length}+`;
    renderProjects();
  })
  .catch(() => {
    projectGrid.innerHTML = '<p class="empty-state">Could not load projects. Is the server running?</p>';
  });

filterButtons.forEach((button) => button.addEventListener('click', () => {
  filterButtons.forEach((item) => item.classList.remove('selected'));
  button.classList.add('selected');
  renderProjects(button.dataset.filter);
}));

const menuButton = document.querySelector('.menu-button');
const mobileNav = document.querySelector('#mobile-nav');
menuButton.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', open);
  menuButton.textContent = open ? 'Close' : 'Menu';
});
mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  mobileNav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.textContent = 'Menu';
}));
