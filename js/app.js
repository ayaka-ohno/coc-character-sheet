const App = (() => {
  const LS_CHARS = 'coc7-saved-characters';
  const LS_OCCS  = 'coc7-custom-occupations';

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

  function allOccupations() {
    const custom = loadCustomOccupations().map(o => {
      const formula = FORMULA_OPTIONS.find(f => f.key === o.formulaKey);
      return {
        name:          o.name,
        formulaLabel:  formula ? formula.label : o.formulaKey,
        calcPoints:    formula ? formula.calc : () => 0,
        creditRating:  [o.crMin || 0, o.crMax || 0],
        suggestedSkills: o.suggestedSkills || [],
        description:   o.description || '',
        isCustom:      true,
      };
    });
    return [...OCCUPATIONS, ...custom];
  }

  // ---- Tabs ----
  function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabId}`);
    });
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
    const s   = getStats();
    const age = parseInt(document.getElementById('char-age')?.value) || 0;

    let mov = 8;
    if (s.dex < s.siz && s.str < s.siz)      mov = 7;
    else if (s.dex >= s.siz && s.str >= s.siz) mov = 9;
    if      (age >= 80) mov -= 5;
    else if (age >= 70) mov -= 4;
    else if (age >= 60) mov -= 3;
    else if (age >= 50) mov -= 2;
    else if (age >= 40) mov -= 1;

    const strSiz = s.str + s.siz;
    let build = 0, db = '0';
    if      (strSiz <= 64)  { build = -2; db = '-2';   }
    else if (strSiz <= 84)  { build = -1; db = '-1';   }
    else if (strSiz <= 124) { build =  0; db = '0';    }
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
      baseEl.textContent = calcBase(skill.base, stats);
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

    const base  = parseInt(baseEl.textContent) || 0;
    const occ   = parseInt(occEl?.value)        || 0;
    const hobby = parseInt(hobbyEl?.value)       || 0;
    const total = base + occ + hobby;

    if (totalEl) totalEl.textContent = total;
    if (halfEl)  halfEl.textContent  = half(total);
    if (fifthEl) fifthEl.textContent = fifth(total);
  }

  // ---- Occupation ----
  function rebuildOccupationDropdown() {
    const sel = document.getElementById('char-occupation');
    const current = sel.value;
    sel.innerHTML = '<option value="">── 選択してください ──</option>';
    allOccupations().forEach(occ => {
      const opt = document.createElement('option');
      opt.value = occ.name;
      opt.textContent = occ.name + (occ.isCustom ? ' ✦' : '');
      sel.appendChild(opt);
    });
    sel.value = current;
  }

  function applyOccupation() {
    const sel    = document.getElementById('char-occupation');
    const occ    = allOccupations().find(o => o.name === sel.value);
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
    const stats    = getStats();
    const sel      = document.getElementById('char-occupation');
    const occ      = allOccupations().find(o => o.name === sel?.value);
    const occTotal = occ ? occ.calcPoints(stats) : null;
    const hobbyTotal = stats.int ? stats.int * 2 : null;

    setText('occ-points-total',   occTotal   ?? '-');
    setText('hobby-points-total', hobbyTotal ?? '-');

    let occSpent = 0, hobbySpent = 0;
    SKILLS.forEach(skill => {
      const id = skillId(skill.name);
      occSpent   += parseInt(document.getElementById(`skill-occ-pts-${id}`)?.value)   || 0;
      hobbySpent += parseInt(document.getElementById(`skill-hobby-pts-${id}`)?.value) || 0;
    });

    setText('occ-points-used',   occSpent);
    setText('hobby-points-used', hobbySpent);

    // Remaining
    setRemain('occ-points-remain',   occTotal,   occSpent);
    setRemain('hobby-points-remain', hobbyTotal, hobbySpent);

    // Sticky bar
    setText('sb-occ-total',   occTotal   ?? '-');
    setText('sb-hobby-total', hobbyTotal ?? '-');
    setText('sb-occ-used',   occSpent);
    setText('sb-hobby-used', hobbySpent);
    setRemainBadge('sb-occ-remain',   occTotal,   occSpent);
    setRemainBadge('sb-hobby-remain', hobbyTotal, hobbySpent);

    // 95 cap check
    SKILLS.forEach(skill => {
      const id    = skillId(skill.name);
      const total = parseInt(document.getElementById(`skill-total-${id}`)?.textContent) || 0;
      const row   = document.getElementById(`skill-row-${id}`);
      if (row) {
        row.classList.toggle('over-cap', total > 95);
      }
    });
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function setRemain(id, total, spent) {
    const el = document.getElementById(id);
    if (!el) return;
    if (total === null) { el.textContent = '-'; el.className = ''; return; }
    const remain = total - spent;
    el.textContent = remain < 0 ? `${remain}` : `残り ${remain}`;
    el.className = remain < 0 ? 'over' : remain === 0 ? 'zero' : 'ok';
  }

  function setRemainBadge(id, total, spent) {
    const el = document.getElementById(id);
    if (!el) return;
    if (total === null) { el.textContent = ''; el.className = 'points-bar-remain unknown'; return; }
    const remain = total - spent;
    el.textContent = remain < 0 ? `超過 ${Math.abs(remain)}` : `残り ${remain}`;
    el.className = `points-bar-remain ${remain < 0 ? 'over' : remain === 0 ? 'zero' : 'ok'}`;
  }

  // ---- Character Data ----
  function getCharacterData() {
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

    return {
      version: '7th',
      basic: {
        name:       document.getElementById('char-name')?.value || '',
        occupation: document.getElementById('char-occupation')?.value || '',
        age:        document.getElementById('char-age')?.value || '',
        gender:     document.getElementById('char-gender')?.value || '',
        birthplace: document.getElementById('char-birthplace')?.value || '',
        residence:  document.getElementById('char-residence')?.value || '',
      },
      stats,
      skills,
      portrait: {
        hair:    document.getElementById('pt-hair')?.value || '',
        eyes:    document.getElementById('pt-eyes')?.value || '',
        build:   document.getElementById('pt-build')?.value || '',
        clothes: document.getElementById('pt-clothes')?.value || '',
        vibe:    document.getElementById('pt-vibe')?.value || '',
        notes:   document.getElementById('pt-notes')?.value || '',
      },
      background: {
        appearance:  document.getElementById('bg-appearance')?.value || '',
        personality: document.getElementById('bg-personality')?.value || '',
        people:      document.getElementById('bg-people')?.value || '',
        places:      document.getElementById('bg-places')?.value || '',
        treasures:   document.getElementById('bg-treasures')?.value || '',
        trauma:      document.getElementById('bg-trauma')?.value || '',
        notes:       document.getElementById('bg-notes')?.value || '',
      },
    };
  }

  function applyCharacterData(data) {
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

    const pt = data.portrait || {};
    if (pt.hair)    document.getElementById('pt-hair').value    = pt.hair;
    if (pt.eyes)    document.getElementById('pt-eyes').value    = pt.eyes;
    if (pt.build)   document.getElementById('pt-build').value   = pt.build;
    if (pt.clothes) document.getElementById('pt-clothes').value = pt.clothes;
    if (pt.vibe)    document.getElementById('pt-vibe').value    = pt.vibe;
    if (pt.notes)   document.getElementById('pt-notes').value   = pt.notes;

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

  // ---- Save / Load (JSON file) ----
  function save() {
    const data = getCharacterData();
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
      try { applyCharacterData(JSON.parse(e.target.result)); }
      catch { alert('JSONの読み込みに失敗しました。'); }
    };
    reader.readAsText(file);
  }

  // ---- Custom Occupations (localStorage) ----
  let editingOccId = null;

  function loadCustomOccupations() {
    try { return JSON.parse(localStorage.getItem(LS_OCCS) || '[]'); }
    catch { return []; }
  }

  function saveCustomOccupations(list) {
    localStorage.setItem(LS_OCCS, JSON.stringify(list));
  }

  function getCheckedSkills() {
    return Array.from(document.querySelectorAll('#occ-skill-checkboxes input[type="checkbox"]:checked'))
      .map(cb => cb.value);
  }

  function setCheckedSkills(skills) {
    document.querySelectorAll('#occ-skill-checkboxes input[type="checkbox"]').forEach(cb => {
      cb.checked = skills.includes(cb.value);
    });
  }

  function clearOccForm() {
    document.getElementById('occ-new-name').value    = '';
    document.getElementById('occ-new-desc').value    = '';
    document.getElementById('occ-new-cr-min').value  = '';
    document.getElementById('occ-new-cr-max').value  = '';
    setCheckedSkills([]);
  }

  function addCustomOccupation() {
    const name    = document.getElementById('occ-new-name').value.trim();
    const desc    = document.getElementById('occ-new-desc').value.trim();
    const formula = document.getElementById('occ-new-formula').value;
    const crMin   = parseInt(document.getElementById('occ-new-cr-min').value) || 0;
    const crMax   = parseInt(document.getElementById('occ-new-cr-max').value) || 0;
    const skills  = getCheckedSkills();

    if (!name)    { alert('職業名を入力してください。'); return; }
    if (!formula) { alert('技能ポイント計算式を選択してください。'); return; }

    const list = loadCustomOccupations();

    if (editingOccId) {
      const idx = list.findIndex(o => o.id === editingOccId);
      if (idx !== -1) {
        list[idx] = { ...list[idx], name, description: desc, formulaKey: formula, crMin, crMax, suggestedSkills: skills };
      }
      editingOccId = null;
    } else {
      list.push({ id: Date.now().toString(), name, description: desc, formulaKey: formula, crMin, crMax, suggestedSkills: skills });
    }

    saveCustomOccupations(list);
    clearOccForm();
    setOccFormMode(false);
    renderCustomOccupationList();
    rebuildOccupationDropdown();
  }

  function editCustomOccupation(id) {
    const occ = loadCustomOccupations().find(o => o.id === id);
    if (!occ) return;
    editingOccId = id;

    document.getElementById('occ-new-name').value   = occ.name;
    document.getElementById('occ-new-desc').value   = occ.description || '';
    document.getElementById('occ-new-formula').value = occ.formulaKey;
    document.getElementById('occ-new-cr-min').value = occ.crMin || '';
    document.getElementById('occ-new-cr-max').value = occ.crMax || '';
    setCheckedSkills(occ.suggestedSkills || []);

    setOccFormMode(true);
    document.getElementById('occ-new-name').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cancelEditOccupation() {
    editingOccId = null;
    clearOccForm();
    setOccFormMode(false);
  }

  function setOccFormMode(isEdit) {
    const submitBtn = document.getElementById('occ-submit-btn');
    const cancelBtn = document.getElementById('occ-cancel-btn');
    const formTitle = document.querySelector('.occ-form-col .card h3');
    if (submitBtn) submitBtn.textContent = isEdit ? '更新する' : '追加する';
    if (cancelBtn) cancelBtn.style.display = isEdit ? '' : 'none';
    if (formTitle) formTitle.textContent   = isEdit ? '職業を編集' : '新しい職業を追加';
  }

  function deleteCustomOccupation(id) {
    const occ = loadCustomOccupations().find(o => o.id === id);
    if (!confirm(`「${occ?.name || 'この職業'}」を削除しますか？`)) return;
    if (editingOccId === id) cancelEditOccupation();
    saveCustomOccupations(loadCustomOccupations().filter(o => o.id !== id));
    renderCustomOccupationList();
    rebuildOccupationDropdown();
  }

  function renderCustomOccupationList() {
    const container = document.getElementById('custom-occ-list');
    const list = loadCustomOccupations();

    if (!list.length) {
      container.innerHTML = '<p class="empty-msg">まだ職業が追加されていません。</p>';
      return;
    }

    container.innerHTML = list.map(o => {
      const formula = FORMULA_OPTIONS.find(f => f.key === o.formulaKey);
      return `
        <div class="custom-occ-card">
          <div class="custom-occ-header">
            <span class="custom-occ-name">${o.name}</span>
            <div class="custom-occ-btns">
              <button class="btn small" onclick="App.editCustomOccupation('${o.id}')">編集</button>
              <button class="btn danger small" onclick="App.deleteCustomOccupation('${o.id}')">削除</button>
            </div>
          </div>
          ${o.description ? `<p class="custom-occ-desc">${o.description}</p>` : ''}
          <p class="custom-occ-meta">技能P：${formula ? formula.label : o.formulaKey}</p>
          ${o.suggestedSkills?.length ? `<p class="custom-occ-meta">推奨技能：${o.suggestedSkills.join('、')}</p>` : ''}
          <p class="custom-occ-meta">信用ランク：${o.crMin} 〜 ${o.crMax}</p>
        </div>
      `;
    }).join('');
  }

  // ---- Character Management (localStorage) ----
  function loadSavedCharacters() {
    try { return JSON.parse(localStorage.getItem(LS_CHARS) || '[]'); }
    catch { return []; }
  }

  function saveCurrentCharacter() {
    const data = getCharacterData();
    const name = data.basic.name || '名無しの探索者';
    const list = loadSavedCharacters();
    list.unshift({ id: Date.now().toString(), name, occupation: data.basic.occupation, savedAt: new Date().toISOString(), data });
    localStorage.setItem(LS_CHARS, JSON.stringify(list));
    renderCharacterList();
    alert(`「${name}」を保存しました。`);
  }

  function loadCharacterById(id) {
    const entry = loadSavedCharacters().find(c => c.id === id);
    if (!entry) return;
    applyCharacterData(entry.data);
    switchTab('status');
  }

  function deleteCharacterById(id) {
    const entry = loadSavedCharacters().find(c => c.id === id);
    if (!confirm(`「${entry?.name || 'このキャラクター'}」を削除しますか？`)) return;
    const list = loadSavedCharacters().filter(c => c.id !== id);
    localStorage.setItem(LS_CHARS, JSON.stringify(list));
    renderCharacterList();
  }

  function renderCharacterList() {
    const container = document.getElementById('character-list');
    const list = loadSavedCharacters();

    if (!list.length) {
      container.innerHTML = '<p class="empty-msg">保存済みのキャラクターはありません。</p>';
      return;
    }

    container.innerHTML = list.map(c => {
      const date  = new Date(c.savedAt).toLocaleString('ja-JP', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
      const stats = c.data?.stats || {};
      const statKeys = ['str','con','siz','dex','app','int','pow','edu','luk'];
      const statLabels = { str:'STR',con:'CON',siz:'SIZ',dex:'DEX',app:'APP',int:'INT',pow:'POW',edu:'EDU',luk:'LUK' };
      const statsHTML = statKeys.map(k =>
        `<span class="prev-stat"><span class="prev-stat-name">${statLabels[k]}</span><span class="prev-stat-val">${stats[k] || '-'}</span></span>`
      ).join('');

      const bg = c.data?.background || {};
      const topSkills = Object.entries(c.data?.skills || {})
        .map(([name, v]) => {
          const skill = SKILLS.find(s => s.name === name);
          const base  = typeof skill?.base === 'number' ? skill.base : 0;
          return { name, total: base + (v.occPts || 0) + (v.hobbyPts || 0) };
        })
        .filter(s => s.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);
      const topSkillsHTML = topSkills.map(s =>
        `<span class="prev-skill"><span>${s.name}</span><span class="prev-skill-val">${s.total}</span></span>`
      ).join('');

      return `
        <div class="char-card" onclick="App.togglePreview('${c.id}')" data-id="${c.id}">
          <div class="char-card-summary">
            <div>
              <div class="char-card-name">${c.name}</div>
              <div class="char-card-occ">${c.occupation || '職業未設定'}</div>
              <div class="char-card-date">${date}</div>
            </div>
            <span class="char-card-chevron" id="chevron-${c.id}">▼</span>
          </div>

          <div class="char-preview" id="preview-${c.id}" style="display:none">
            <div class="prev-section">
              <div class="prev-label">能力値</div>
              <div class="prev-stats">${statsHTML}</div>
            </div>
            ${topSkills.length ? `
            <div class="prev-section">
              <div class="prev-label">主要技能（上位6）</div>
              <div class="prev-skills">${topSkillsHTML}</div>
            </div>` : ''}
            ${bg.personality ? `
            <div class="prev-section">
              <div class="prev-label">性格・信条</div>
              <div class="prev-text">${bg.personality}</div>
            </div>` : ''}
            <div class="char-card-actions" onclick="event.stopPropagation()">
              <button class="btn primary small" onclick="App.loadCharacterById('${c.id}')">読み込む</button>
              <button class="btn danger small"  onclick="App.deleteCharacterById('${c.id}')">削除</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function togglePreview(id) {
    const preview = document.getElementById(`preview-${id}`);
    const chevron = document.getElementById(`chevron-${id}`);
    if (!preview) return;
    const isOpen = preview.style.display !== 'none';
    preview.style.display = isOpen ? 'none' : 'block';
    if (chevron) chevron.textContent = isOpen ? '▼' : '▲';
  }

  // ---- Stat Input ----
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

  // ---- Init ----
  function init() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Occupation dropdown
    rebuildOccupationDropdown();

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
          <input type="number" class="skill-pts" id="skill-occ-pts-${id}" min="0" max="100" placeholder="0"
              oninput="App.updateSkillCalc('${skill.name}'); App.updatePoints()">
          <input type="number" class="skill-pts" id="skill-hobby-pts-${id}" min="0" max="100" placeholder="0"
              oninput="App.updateSkillCalc('${skill.name}'); App.updatePoints()">
          <span class="skill-total" id="skill-total-${id}">-</span>
          <span class="skill-half"  id="skill-half-${id}">-</span>
          <span class="skill-fifth" id="skill-fifth-${id}">-</span>
        `;
        section.appendChild(row);
      });
      container.appendChild(section);
    });

    // Occupation form: formula select
    const formulaSel = document.getElementById('occ-new-formula');
    FORMULA_OPTIONS.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f.key;
      opt.textContent = f.label;
      formulaSel.appendChild(opt);
    });

    // Occupation form: skill checkboxes grouped by category
    const cbContainer = document.getElementById('occ-skill-checkboxes');
    SKILL_CATEGORIES.forEach(cat => {
      const catSkills = SKILLS.filter(s => s.category === cat);
      if (!catSkills.length) return;
      const group = document.createElement('div');
      group.className = 'skill-cb-group';
      group.innerHTML = `<div class="skill-cb-cat">${cat}</div>`;
      catSkills.forEach(skill => {
        const id  = `occ-cb-${skillId(skill.name)}`;
        const item = document.createElement('label');
        item.className = 'skill-cb-item';
        item.innerHTML = `<input type="checkbox" id="${id}" value="${skill.name}"><span>${skill.name}</span>`;
        group.appendChild(item);
      });
      cbContainer.appendChild(group);
    });

    renderCustomOccupationList();
    renderCharacterList();
    updateDerived();
    updateSkillBases();
  }

  return {
    init, rollStat, rollAll, applyOccupation, updateDerived,
    updateSkillBases, updateSkillCalc, updatePoints, onStatInput,
    save, load, loadFromFile,
    addCustomOccupation, editCustomOccupation, deleteCustomOccupation, cancelEditOccupation,
    saveCurrentCharacter, loadCharacterById, deleteCharacterById, togglePreview,
  };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
