/**
 * chores.js - Chore/task management
 */
const Chores = (() => {
  const form = () => document.getElementById('chore-form');
  const nameInput = () => document.getElementById('chore-name');
  const freqSelect = () => document.getElementById('chore-frequency');
  const list = () => document.getElementById('chore-list');
  const empty = () => document.getElementById('chore-empty');

  const FREQ_LABELS = {
    daily: '每天',
    weekly: '每週一次',
  };

  function init() {
    form().addEventListener('submit', (e) => {
      e.preventDefault();
      const name = nameInput().value.trim();
      if (!name) return;
      const frequency = freqSelect().value;
      Store.addChore(name, frequency);
      nameInput().value = '';
      render();
      Schedule.render();
    });
    render();
  }

  function render() {
    const chores = Store.getChores();
    const listEl = list();
    const emptyEl = empty();

    if (chores.length === 0) {
      listEl.innerHTML = '';
      emptyEl.style.display = 'block';
      return;
    }

    emptyEl.style.display = 'none';
    listEl.innerHTML = chores.map(c => `
      <li>
        <span class="item-name">${escapeHtml(c.name)}</span>
        <span class="item-badge">${FREQ_LABELS[c.frequency] || c.frequency}</span>
        <button class="item-delete" data-id="${c.id}" title="刪除">&times;</button>
      </li>
    `).join('');

    listEl.querySelectorAll('.item-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm(`確定要刪除「${chores.find(c => c.id === btn.dataset.id)?.name}」嗎？`)) {
          Store.removeChore(btn.dataset.id);
          render();
          Schedule.render();
        }
      });
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { init, render };
})();
