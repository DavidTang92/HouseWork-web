/**
 * schedule.js - Weekly schedule view and assignment logic
 */
const Schedule = (() => {
  const DAY_NAMES = ['一', '二', '三', '四', '五', '六', '日'];
  let currentWeekOffset = 0; // 0 = this week

  const weekLabel = () => document.getElementById('week-label');
  const scheduleBody = () => document.getElementById('schedule-body');
  const scheduleEmpty = () => document.getElementById('schedule-empty');
  const scheduleTable = () => document.getElementById('schedule-table');
  const modal = () => document.getElementById('assign-modal');
  const modalTitle = () => document.getElementById('modal-title');
  const modalMembers = () => document.getElementById('modal-members');

  function init() {
    document.getElementById('prev-week').addEventListener('click', () => {
      currentWeekOffset--;
      render();
    });
    document.getElementById('next-week').addEventListener('click', () => {
      currentWeekOffset++;
      render();
    });
    document.getElementById('auto-assign').addEventListener('click', autoAssign);
    document.getElementById('clear-week').addEventListener('click', clearWeek);
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-clear').addEventListener('click', () => {
      // handled per-open
    });
    modal().querySelector('.modal-backdrop').addEventListener('click', closeModal);
    render();
  }

  /**
   * Get the Monday date for a given week offset from the current week.
   */
  function getMondayOfWeek(offset) {
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon, ...
    const diff = day === 0 ? -6 : 1 - day; // adjust to Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff + offset * 7);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  /**
   * Get ISO week key like "2026-W07"
   */
  function getWeekKey(offset) {
    const monday = getMondayOfWeek(offset);
    const year = monday.getFullYear();
    // Calculate ISO week number
    const jan1 = new Date(year, 0, 1);
    const dayOfYear = Math.floor((monday - jan1) / 86400000) + 1;
    const weekNum = Math.ceil((dayOfYear + jan1.getDay()) / 7);
    return `${year}-W${String(weekNum).padStart(2, '0')}`;
  }

  /**
   * Format a date range label for the week.
   */
  function getWeekLabel(offset) {
    const monday = getMondayOfWeek(offset);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
    return `${monday.getFullYear()} 年 ${fmt(monday)} - ${fmt(sunday)}`;
  }

  /**
   * Get which days of the week are active for a given frequency.
   * Returns array of day indices (0=Mon, 6=Sun).
   */
  function getActiveDays(frequency) {
    switch (frequency) {
      case 'daily':      return [0, 1, 2, 3, 4, 5, 6];
      case 'every2days':  return [0, 2, 4, 6];        // 一、三、五、日
      case 'every3days':  return [0, 3, 6];            // 一、四、日
      case 'weekly':      return [0];                  // 一
      default:            return [0, 1, 2, 3, 4, 5, 6];
    }
  }

  function render() {
    const members = Store.getMembers();
    const chores = Store.getChores();
    const weekKey = getWeekKey(currentWeekOffset);
    const weekData = Store.getWeekSchedule(weekKey);

    weekLabel().textContent = getWeekLabel(currentWeekOffset);

    if (chores.length === 0 || members.length === 0) {
      scheduleTable().style.display = 'none';
      scheduleEmpty().style.display = 'block';
      document.querySelector('.schedule-actions').style.display = 'none';
      return;
    }

    scheduleTable().style.display = 'table';
    scheduleEmpty().style.display = 'none';
    document.querySelector('.schedule-actions').style.display = 'flex';

    const memberMap = {};
    members.forEach(m => { memberMap[m.id] = m; });

    const rows = chores.map(chore => {
      const choreData = weekData[chore.id] || {};
      const activeDays = getActiveDays(chore.frequency);
      const cells = [];

      for (let day = 0; day < 7; day++) {
        const memberId = choreData[day];
        const member = memberId ? memberMap[memberId] : null;

        if (!activeDays.includes(day)) {
          // This day is not active for this frequency
          cells.push(`<td class="cell-inactive"></td>`);
        } else {
          const label = member ? escapeHtml(member.name) : '';
          const bgStyle = member ? `background:${member.color};` : '';
          const cls = member ? 'cell-btn assigned' : 'cell-btn';
          cells.push(`
            <td>
              <button class="${cls}" style="${bgStyle}"
                data-chore="${chore.id}" data-day="${day}">
                ${label}
              </button>
            </td>
          `);
        }
      }

      return `<tr><td>${escapeHtml(chore.name)}</td>${cells.join('')}</tr>`;
    });

    scheduleBody().innerHTML = rows.join('');

    // Bind cell click events
    scheduleBody().querySelectorAll('.cell-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        openModal(btn.dataset.chore, parseInt(btn.dataset.day));
      });
    });
  }

  function openModal(choreId, dayIndex) {
    const members = Store.getMembers();
    const chores = Store.getChores();
    const chore = chores.find(c => c.id === choreId);
    const weekKey = getWeekKey(currentWeekOffset);

    const dayLabel = `週${DAY_NAMES[dayIndex]}`;
    modalTitle().textContent = `${chore.name} - ${dayLabel}`;

    modalMembers().innerHTML = members.map(m => `
      <button class="modal-member-btn" data-member-id="${m.id}">
        <span class="dot" style="background:${m.color}"></span>
        <span>${escapeHtml(m.name)}</span>
      </button>
    `).join('');

    modalMembers().querySelectorAll('.modal-member-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Store.setAssignment(weekKey, choreId, dayIndex, btn.dataset.memberId);
        closeModal();
        render();
      });
    });

    // Clear assignment button
    const clearBtn = document.getElementById('modal-clear');
    const newClear = clearBtn.cloneNode(true);
    clearBtn.parentNode.replaceChild(newClear, clearBtn);
    newClear.addEventListener('click', () => {
      Store.setAssignment(weekKey, choreId, dayIndex, null);
      closeModal();
      render();
    });

    modal().style.display = 'flex';
  }

  function closeModal() {
    modal().style.display = 'none';
  }

  /**
   * Auto-assign chores to members evenly for the current week.
   */
  function autoAssign() {
    const members = Store.getMembers();
    const chores = Store.getChores();
    if (members.length === 0 || chores.length === 0) return;

    const weekKey = getWeekKey(currentWeekOffset);
    const weekData = {};

    // Track assignment count per member for fairness
    const assignCount = {};
    members.forEach(m => { assignCount[m.id] = 0; });

    chores.forEach(chore => {
      weekData[chore.id] = {};
      const activeDays = getActiveDays(chore.frequency);

      for (const day of activeDays) {
        const chosen = pickLeastAssigned(members, assignCount);
        weekData[chore.id][day] = chosen.id;
        assignCount[chosen.id]++;
      }
    });

    Store.setWeekSchedule(weekKey, weekData);
    render();
  }

  /**
   * Pick the member with the fewest assignments so far.
   */
  function pickLeastAssigned(members, assignCount) {
    let min = Infinity;
    let candidates = [];
    members.forEach(m => {
      if (assignCount[m.id] < min) {
        min = assignCount[m.id];
        candidates = [m];
      } else if (assignCount[m.id] === min) {
        candidates.push(m);
      }
    });
    // Pick randomly among ties
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function clearWeek() {
    if (!confirm('確定要清除本週的排班嗎？')) return;
    const weekKey = getWeekKey(currentWeekOffset);
    Store.clearWeekSchedule(weekKey);
    render();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { init, render };
})();
