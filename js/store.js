/**
 * store.js - Data persistence layer using localStorage
 */
const Store = (() => {
  const KEYS = {
    members: 'housework_members',
    chores: 'housework_chores',
    schedule: 'housework_schedule',
  };

  function load(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- Members ---
  function getMembers() {
    return load(KEYS.members) || [];
  }

  function saveMembers(members) {
    save(KEYS.members, members);
  }

  function addMember(name, color) {
    const members = getMembers();
    const member = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      color,
    };
    members.push(member);
    saveMembers(members);
    return member;
  }

  function removeMember(id) {
    const members = getMembers().filter(m => m.id !== id);
    saveMembers(members);
    // Also remove from schedule
    const schedule = getSchedule();
    for (const weekKey of Object.keys(schedule)) {
      for (const choreId of Object.keys(schedule[weekKey])) {
        for (const day of Object.keys(schedule[weekKey][choreId])) {
          if (schedule[weekKey][choreId][day] === id) {
            delete schedule[weekKey][choreId][day];
          }
        }
      }
    }
    saveSchedule(schedule);
  }

  // --- Chores ---
  function getChores() {
    return load(KEYS.chores) || [];
  }

  function saveChores(chores) {
    save(KEYS.chores, chores);
  }

  function addChore(name, frequency) {
    const chores = getChores();
    const chore = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      frequency, // 'daily' or 'weekly'
    };
    chores.push(chore);
    saveChores(chores);
    return chore;
  }

  function removeChore(id) {
    const chores = getChores().filter(c => c.id !== id);
    saveChores(chores);
    // Also remove from schedule
    const schedule = getSchedule();
    for (const weekKey of Object.keys(schedule)) {
      delete schedule[weekKey][id];
    }
    saveSchedule(schedule);
  }

  // --- Schedule ---
  // Structure: { "2026-W07": { choreId: { "0": memberId, "1": memberId, ... } } }
  function getSchedule() {
    return load(KEYS.schedule) || {};
  }

  function saveSchedule(schedule) {
    save(KEYS.schedule, schedule);
  }

  function getWeekSchedule(weekKey) {
    const schedule = getSchedule();
    return schedule[weekKey] || {};
  }

  function setAssignment(weekKey, choreId, dayIndex, memberId) {
    const schedule = getSchedule();
    if (!schedule[weekKey]) schedule[weekKey] = {};
    if (!schedule[weekKey][choreId]) schedule[weekKey][choreId] = {};
    if (memberId) {
      schedule[weekKey][choreId][dayIndex] = memberId;
    } else {
      delete schedule[weekKey][choreId][dayIndex];
    }
    saveSchedule(schedule);
  }

  function clearWeekSchedule(weekKey) {
    const schedule = getSchedule();
    delete schedule[weekKey];
    saveSchedule(schedule);
  }

  function setWeekSchedule(weekKey, weekData) {
    const schedule = getSchedule();
    schedule[weekKey] = weekData;
    saveSchedule(schedule);
  }

  return {
    getMembers,
    addMember,
    removeMember,
    getChores,
    addChore,
    removeChore,
    getSchedule,
    getWeekSchedule,
    setAssignment,
    clearWeekSchedule,
    setWeekSchedule,
  };
})();
