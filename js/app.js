/**
 * app.js - Main application entry point
 */
document.addEventListener('DOMContentLoaded', () => {
  // Tab switching
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(`tab-${target}`).classList.add('active');

      // Re-render schedule when switching to it
      if (target === 'schedule') {
        Schedule.render();
      }
    });
  });

  // Initialize modules
  Members.init();
  Chores.init();
  Schedule.init();
});
