const App = (() => {
  // ---- Helpers ----
  function getStat(id) {
    return parseInt(document.getElementById(`stat-${id}`)?.value) || 0;
  }

  function getStats() {
    const s = {};
    CHARACTERISTICS.forEach(c => { s[c.id] = getStat(c.id); });
    return s;
  }

  function calcBase(base, stats) {
    if (base === 'DEX×2') return stats.dex * 2;
    if (base === 'EDU')   return stats.edu;
    return base;
  }

  function half(v)  { return Math.floor(v / 2); }
  function fifth(v) { return Math.floor(v / 5); }

  function skillId(name) {
    return name.replace(/[（）/\s・]/g, '_');
  }

  // ---- Dice ----
  function rollStat(id) {
    const char = CHARACTERISTICS.find(c => c.id === id);
    if (!char) return;
    const val = char.roll();
    const input = document.getElementById(`stat-${id}`);
    input.value = val;
    input.classList.add('rolled');
    setTimeout(() => input.classList.remove('rolled'), 600);
    updateDerived();
    updateSkillBases();
    updatePoints();
  }

  function rollAll() {
    CHARACTERISTICS.forEach(c => rollStat(c.id));
  }

  // ---- Derived Stats ----
  function updateDerived() {
    const s = getStats();
    const age = parseInt(document.getElementById('char-age')?.value) || 0;

    let mov = 8;
    if (s.dex < s.siz && s.str < s.siz) mov = 7;
    else if (s.dex >= s.siz && s.str >= s.siz) mov = 9;
    if      (age >= 80) mov -= 5;
    else if (age >= 70) mov -= 4;
    else if (age >= 60) mov -= 3;
    else if (age >= 50) mov -= 2;
    else if (age >= 40) mov -= 1;

    const strSiz = s.str + s.siz;
    let build = 0, db = '0';
    if      (strSiz <= 64)  { build = -2; db = '-2'; }
    else if (strSiz <= 84)  { build = -1; db = '-1'; }
    else if (strSiz <= 124) { build =  0; db = '0';  }
    else if (strSiz <= 164) { build =  1; db = '+1D4'; }
    else if (strSiz <= 204) { build =  2; db = '+1D6'; }
    else if (strSiz <= 284) { build =  3; db = '+2D6'; }
    else                    { build =  4; db = '+3D6'; }

    const hp  = Math.floor((s.con + s.siz) / 10);
    const mp  = Math.floor(s.pow / 5);
    const san = s.pow;

    const fields = {
      'der-hp':    hp    || '-',
      'der-mp':    mp    || '-',
      'der-san':   san   || '-',
      'der-san99': san ? `${san} / 99` : '-',
      'der-mov':   mov   || '-',
      'der-build': build !== undefined ? build : '0',
      'der-db':    db,
    };
    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
  }

  // ---- Skill Bases ----
  function updateSkillBases() {
    const stats = getStats();
    SKILLS.forEach(skill => {
      const id     = skillId(skill.name);
      const baseEl = document.getElementById(`skill-base-${id}`);
      if (!baseEl) return;
      const baseVal = calcBase(skill.base, stats);
      baseEl.textContent = baseVal;
      updateSkillCalc(skill.name);
    });
    updatePoints();
  }

  function updateSkillCalc(name) {
    const id      = skillId(name);
    const baseEl  = document.getElementById(`skill-base-${id}`);
    const occEl   = document.getElementById(`skill-occ-pts-${id}`);
    const hobbyEl = document.getElementById(`skill-hobby-pts-${id}`);
    const totalEl = document.getElementById(`skill-total-${id}`);
    const halfEl  = document.getElementById(`skill-half-${id}`);
    const fifthEl = document.getElementById(`skill-fifth-${id}`);
    if (!baseEl) return;

    const base  = parseInt(baseEl.textContent)  || 0;
    const occ   = parseInt(occEl?.value)         || 0;
    const hobby = parseInt(hobbyEl?.value)        || 0;
    const total = base + occ + hobby;

    if (totalEl) totalEl.textContent = total;
    if (halfEl)  halfEl.textContent  = half(total);
    if (fifthEl) fifthEl.textContent = fifth(total);
  }

  // ---- Occupation ----
  function applyOccupation() {
    const sel    = document.getElementById('char-occupation');
    const occ    = OCCUPATIONS.find(o => o.name === sel.value);
    const infoBox = document.getElementById('occupation-info');

    if (!occ) {
      infoBox.style.display = 'none';
      updatePoints();
      return;
    }

    document.getElementById('occupation-desc').textContent    = occ.description;
    document.getElementById('occupation-formula').textContent = occ.formulaLabel;
    document.getElementById('occupation-skills').textContent  = occ.suggestedSkills.join('、');
    infoBox.style.display = 'block';

    document.querySelectorAll('.skill-row').forEach(row => row.classList.remove('suggested'));
    occ.suggestedSkills.forEach(name => {
      const row = document.getElementById(`skill-row-${skillId(name)}`);
      if (row) row.classList.add('suggested');
    });

    updatePoints();
  }

  function updatePoints() {
    const stats = getStats();
    const sel   = document.getElementById('char-occupation');
    const occ   = OCCUPATIONS.find(o => o.name === sel?.value);

    const occTotal   = occ ? occ.calcPoints(stats) : null;
    const hobbyTotal = stats.int ? stats.int * 2 : null;

    document.getElementById('occ-points-total').textContent   = occTotal   ?? '-';
    document.getElementById('hobby-points-total').textContent = hobbyTotal ?? '-';

    let occSpent = 0, hobbySpent = 0;
    SKILLS.forEach(skill => {
      const id      = skillId(skill.name);
      const occPts  = parseInt(document.getElementById(`skill-occ-pts-${id}`)?.value)   || 0;
      const hobbyPts= parseInt(document.getElementById(`skill-hobby-pts-${id}`)?.value) || 0;
      occSpent   += occPts;
      hobbySpent += hobbyPts;
    });

    document.getElementById('occ-points-used').textContent   = occSpent;
    document.getElementById('hobby-points-used').textContent = hobbySpent;
  }

  // ---- Save / Load ----
  function save() {
    const stats = {};
    CHARACTERISTICS.forEach(c => { stats[c.id] = getStat(c.id); });

    const skills = {};
    SKILLS.forEach(skill => {
      const id = skillId(skill.name);
      skills[skill.name] = {
        occPts:   parseInt(document.getElementById(`skill-occ-pts-${id}`)?.value)   || 0,
        hobbyPts: parseInt(document.getElementById(`skill-hobby-pts-${id}`)?.value) || 0,
      };
    });

    const data = {
      version: '7th',
      basic: {
        name:       document.getElementById('char-name')?.value,
        occupation: document.getElementById('char-occupation')?.value,
        age:        document.getElementById('char-age')?.value,
        gender:     document.getElementById('char-gender')?.value,
        birthplace: document.getElementById('char-birthplace')?.value,
        residence:  document.getElementById('char-residence')?.value,
      },
      stats,
      skills,
      background: {
        appearance:  document.getElementById('bg-appearance')?.value,
        personality: document.getElementById('bg-personality')?.value,
        people:      document.getElementById('bg-people')?.value,
        places:      document.getElementById('bg-places')?.value,
        treasures:   document.getElementById('bg-treasures')?.value,
        trauma:      document.getElementById('bg-trauma')?.value,
        notes:       document.getElementById('bg-notes')?.value,
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${data.basic.name || 'character'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function load() {
    document.getElementById('fileInput').click();
  }

  function loadFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        applyData(JSON.parse(e.target.result));
      } catch {
        alert('JSONの読み込みに失敗しました。');
      }
    };
    reader.readAsText(file);
  }

  function applyData(data) {
    const b = data.basic || {};
    if (b.name)       document.getElementById('char-name').value       = b.name;
    if (b.occupation) document.getElementById('char-occupation').value = b.occupation;
    if (b.age)        document.getElementById('char-age').value        = b.age;
    if (b.gender)     document.getElementById('char-gender').value     = b.gender;
    if (b.birthplace) document.getElementById('char-birthplace').value = b.birthplace;
    if (b.residence)  document.getElementById('char-residence').value  = b.residence;

    Object.entries(data.stats || {}).forEach(([id, val]) => {
      const el = document.getElementById(`stat-${id}`);
      if (el) el.value = val;
    });

    Object.entries(data.skills || {}).forEach(([name, info]) => {
      const id      = skillId(name);
      const occEl   = document.getElementById(`skill-occ-pts-${id}`);
      const hobbyEl = document.getElementById(`skill-hobby-pts-${id}`);
      if (occEl)   occEl.value   = info.occPts   || 0;
      if (hobbyEl) hobbyEl.value = info.hobbyPts || 0;
      updateSkillCalc(name);
    });

    const bg = data.background || {};
    if (bg.appearance)  document.getElementById('bg-appearance').value  = bg.appearance;
    if (bg.personality) document.getElementById('bg-personality').value = bg.personality;
    if (bg.people)      document.getElementById('bg-people').value      = bg.people;
    if (bg.places)      document.getElementById('bg-places').value      = bg.places;
    if (bg.treasures)   document.getElementById('bg-treasures').value   = bg.treasures;
    if (bg.trauma)      document.getElementById('bg-trauma').value      = bg.trauma;
    if (bg.notes)       document.getElementById('bg-notes').value       = bg.notes;

    applyOccupation();
    updateDerived();
    updateSkillBases();
  }

  // ---- Init ----
  function init() {
    // Occupation dropdown
    const sel = document.getElementById('char-occupation');
    OCCUPATIONS.forEach(occ => {
      const opt = document.createElement('option');
      opt.value = occ.name;
      opt.textContent = occ.name;
      sel.appendChild(opt);
    });

    // Characteristics table
    const tbody = document.getElementById('stats-tbody');
    CHARACTERISTICS.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="stat-name">
          <span class="stat-abbr">${c.name}</span>
          <span class="stat-label">${c.label}</span>
          <span class="stat-formula">${c.formula}</span>
        </td>
        <td><input type="number" id="stat-${c.id}" class="stat-input" min="0" max="200"
            oninput="App.onStatInput()" placeholder="-"></td>
        <td class="stat-calc" id="stat-half-${c.id}">-</td>
        <td class="stat-calc" id="stat-fifth-${c.id}">-</td>
        <td><button class="btn dice-btn" onclick="App.rollStat('${c.id}')">🎲</button></td>
      `;
      tbody.appendChild(tr);
    });

    // Skills
    const container = document.getElementById('skills-container');
    SKILL_CATEGORIES.forEach(cat => {
      const catSkills = SKILLS.filter(s => s.category === cat);
      if (!catSkills.length) return;

      const section = document.createElement('div');
      section.className = 'skill-category';
      section.innerHTML = `<div class="skill-cat-header">${cat}</div>`;

      catSkills.forEach(skill => {
        const id  = skillId(skill.name);
        const row = document.createElement('div');
        row.className = 'skill-row';
        row.id = `skill-row-${id}`;
        row.innerHTML = `
          <span class="skill-name">${skill.name}</span>
          <span class="skill-base" id="skill-base-${id}">-</span>
          <input type="number" class="skill-pts" id="skill-occ-pts-${id}"
              min="0" max="100" placeholder="0"
              oninput="App.updateSkillCalc('${skill.name}'); App.updatePoints()">
          <input type="number" class="skill-pts" id="skill-hobby-pts-${id}"
              min="0" max="100" placeholder="0"
              oninput="App.updateSkillCalc('${skill.name}'); App.updatePoints()">
          <span class="skill-total" id="skill-total-${id}">-</span>
          <span class="skill-half"  id="skill-half-${id}">-</span>
          <span class="skill-fifth" id="skill-fifth-${id}">-</span>
        `;
        section.appendChild(row);
      });

      container.appendChild(section);
    });

    updateDerived();
    updateSkillBases();
  }

  function onStatInput() {
    CHARACTERISTICS.forEach(c => {
      const val     = getStat(c.id);
      const halfEl  = document.getElementById(`stat-half-${c.id}`);
      const fifthEl = document.getElementById(`stat-fifth-${c.id}`);
      if (halfEl)  halfEl.textContent  = val ? half(val)  : '-';
      if (fifthEl) fifthEl.textContent = val ? fifth(val) : '-';
    });
    updateDerived();
    updateSkillBases();
    updatePoints();
  }

  return { init, rollStat, rollAll, applyOccupation, updateDerived,
           updateSkillBases, updateSkillCalc, updatePoints,
           onStatInput, save, load, loadFromFile };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
