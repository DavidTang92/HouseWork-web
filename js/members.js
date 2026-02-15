/**
 * members.js - Family member management
 */
const Members = (() => {
  const form = () => document.getElementById('member-form');
  const nameInput = () => document.getElementById('member-name');
  const colorInput = () => document.getElementById('member-color');
  const list = () => document.getElementById('member-list');
  const empty = () => document.getElementById('member-empty');

  const COLORS = ['#4A90D9', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#3498DB'];
  let colorIndex = 0;

  function init() {
    form().addEventListener('submit', (e) => {
      e.preventDefault();
      const name = nameInput().value.trim();
      if (!name) return;
      const color = colorInput().value;
      Store.addMember(name, color);
      nameInput().value = '';
      colorIndex = (colorIndex + 1) % COLORS.length;
      colorInput().value = COLORS[colorIndex];
      render();
      Schedule.render();
    });
    render();
  }

  function render() {
    const members = Store.getMembers();
    const listEl = list();
    const emptyEl = empty();

    if (members.length === 0) {
      listEl.innerHTML = '';
      emptyEl.style.display = 'block';
      return;
    }

    emptyEl.style.display = 'none';
    listEl.innerHTML = members.map(m => `
      <li>
        <span class="item-color" style="background:${m.color}"></span>
        <span class="item-name">${escapeHtml(m.name)}</span>
        <button class="item-delete" data-id="${m.id}" title="刪除">&times;</button>
      </li>
    `).join('');

    listEl.querySelectorAll('.item-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm(`確定要刪除「${members.find(m => m.id === btn.dataset.id)?.name}」嗎？`)) {
          Store.removeMember(btn.dataset.id);
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
