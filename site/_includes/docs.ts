const curYearSpan = document.getElementById('current-year');
const toggleBtn = document.getElementById('sidebar-toggle');
const container = document.getElementById('doc-container');

if (curYearSpan) curYearSpan.textContent = new Date().getFullYear().toString();
toggleBtn?.addEventListener('click', () => {
  container?.classList?.toggle('sidebar-collapsed');
});
