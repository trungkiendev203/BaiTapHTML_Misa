/* ============================================================
   CA-LAM-VIEC.JS – Main Module Logic
   Ca Làm Việc – AMIS Quản Trị Sản Xuất
   ============================================================ */

const CaLamViec = (() => {

  /* ── MOCK DATA ── */
  let data = [
    { id: 1, ma_ca: 'CA_CHIEU', ten_ca: 'Ca chiều',  gio_vao: '13:30', gio_het: '17:30', bat_dau_nghi: '', ket_thuc_nghi: '', tg_lam_viec: 4.0, tg_nghi: 0.0, trang_thai: true,  mo_ta: '', nguoi_tao: 'Trần Minh Hà' },
    { id: 2, ma_ca: 'CA_SANG',  ten_ca: 'Ca Sáng',   gio_vao: '08:00', gio_het: '12:00', bat_dau_nghi: '', ket_thuc_nghi: '', tg_lam_viec: 4.0, tg_nghi: 0.0, trang_thai: false,  mo_ta: '', nguoi_tao: 'Trần Minh Hà' },
    { id: 3, ma_ca: 'CAtest',   ten_ca: 'CAtest',    gio_vao: '08:00', gio_het: '17:30', bat_dau_nghi: '08:00', ket_thuc_nghi: '17:30', tg_lam_viec: 0.0, tg_nghi: 9.5, trang_thai: false, mo_ta: '', nguoi_tao: 'Trần Minh Hà' },
    { id: 4, ma_ca: 'CA_TOI',   ten_ca: 'Ca tối',    gio_vao: '19:00', gio_het: '22:00', bat_dau_nghi: '', ket_thuc_nghi: '', tg_lam_viec: 3.0, tg_nghi: 0.0, trang_thai: false,  mo_ta: '', nguoi_tao: 'Trần Minh Hà' },
  ];
  let nextId = 5;

  /* ── STATE ── */
  let filtered = [...data];
  let selectedIds = new Set();
  let editingId = null;
  let contextTargetId = null;
  let deleteTargetIds = [];
  let page = 1;
  let perPage = 20;
  let searchQuery = '';
  let dialogMode = 'add'; // 'add' | 'edit' | 'clone'

  /* ── DOM REFS ── */
  const $ = id => document.getElementById(id);

  /* ── HELPERS ── */
  function toMinutes(hhmm) {
    if (!hhmm) return null;
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
  }

  function calcTimes(vao, het, batDau, ketThuc) {
    const v = toMinutes(vao), h = toMinutes(het);
    const b = toMinutes(batDau), k = toMinutes(ketThuc);
    let nghi = 0;
    if (b !== null && k !== null && k > b) nghi = k - b;
    let lamViec = 0;
    if (v !== null && h !== null) {
      lamViec = Math.max(0, (h - v) - nghi);
    }
    return {
      tg_nghi:     parseFloat((nghi / 60).toFixed(1)),
      tg_lam_viec: parseFloat((lamViec / 60).toFixed(1)),
    };
  }

  function formatNum(n) {
    return typeof n === 'number' ? n.toFixed(1).replace('.', ',') : '-';
  }

  function applySearch() {
    const q = searchQuery.toLowerCase();
    filtered = data.filter(r =>
      !q ||
      r.ma_ca.toLowerCase().includes(q) ||
      r.ten_ca.toLowerCase().includes(q) ||
      (r.nguoi_tao || '').toLowerCase().includes(q)
    );
  }

  /* ── RENDER TABLE ── */
  function render() {
    applySearch();
    const start = (page - 1) * perPage;
    const rows = filtered.slice(start, start + perPage);

    // Toolbar
    updateToolbar();

    // Table body
    const tbody = $('tableBody');
    tbody.innerHTML = '';

    rows.forEach(row => {
      const sel = selectedIds.has(row.id);
      const isEditing = editingId === row.id;
      const tr = document.createElement('tr');
      if (sel) tr.classList.add('selected');
      if (isEditing) tr.classList.add('editing');

      const statusClass = row.trang_thai ? 'status-active' : 'status-inactive';
      const statusText  = row.trang_thai ? 'Đang sử dụng' : 'Ngừng sử dụng';

      tr.innerHTML = `
        <td class="col-check">
          <div class="misa-checkbox ${sel ? 'checked' : ''}" data-id="${row.id}" role="checkbox" tabindex="0"></div>
        </td>
        <td class="col-ma">
          <div class="tooltip-wrap">
            <span>${row.ma_ca}</span>
            <span class="tooltip-text">${row.ten_ca}</span>
          </div>
        </td>
        <td>${row.ten_ca}</td>
        <td>${row.gio_vao || '-'}</td>
        <td>${row.gio_het || '-'}</td>
        <td>${row.bat_dau_nghi || '-'}</td>
        <td>${row.ket_thuc_nghi || '-'}</td>
        <td class="col-num">${formatNum(row.tg_lam_viec)}</td>
        <td class="col-num">${formatNum(row.tg_nghi)}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${row.nguoi_tao || ''}</td>
        <td>
          <div class="row-actions">
            <button class="row-action-btn" data-action="edit" data-id="${row.id}" title="Sửa">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="row-action-btn" data-action="menu" data-id="${row.id}" title="Thêm tùy chọn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

    renderPagination();
    updateSelectAll();
  }

  function renderPagination() {
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    if (page > totalPages) page = totalPages;
    const start = (page - 1) * perPage + 1;
    const end   = Math.min(page * perPage, total);

    $('totalCount').textContent = `Tổng số: ${total}`;
    $('pageInfo').textContent   = total ? `${start} - ${end}` : '0';
    $('firstBtn').disabled  = page <= 1;
    $('prevBtn').disabled   = page <= 1;
    $('nextBtn').disabled   = page >= totalPages;
    $('lastBtn').disabled   = page >= totalPages;
  }

  function updateSelectAll() {
    const rows = pageIds();
    const allSel = rows.length > 0 && rows.every(id => selectedIds.has(id));
    const someSel = rows.some(id => selectedIds.has(id));
    const cb = $('selectAll');
    cb.className = 'misa-checkbox' + (allSel ? ' checked' : someSel ? ' indeterminate' : '');
  }

  function pageIds() {
    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage).map(r => r.id);
  }

  /* ── TOOLBAR (bulk mode) ── */
  function updateToolbar() {
    const count = selectedIds.size;
    const searchBar = $('searchBar');
    const bulkBar   = $('bulkBar');

    if (count > 0) {
      searchBar.classList.add('hidden');
      bulkBar.classList.remove('hidden');
      $('selectedCount').textContent = `Đã chọn ${count}`;

      // Determine which bulk buttons to show
      const selRows = data.filter(r => selectedIds.has(r.id));
      const hasActive   = selRows.some(r => r.trang_thai);
      const hasInactive = selRows.some(r => !r.trang_thai);
      $('bulkUse').classList.toggle('hidden',  !hasInactive);
      $('bulkStop').classList.toggle('hidden', !hasActive);
    } else {
      searchBar.classList.remove('hidden');
      bulkBar.classList.add('hidden');
    }
  }

  /* ── DIALOG ── */
  function openDialog(mode, row = null) {
    dialogMode = mode;
    editingId = mode === 'edit' ? row.id : null;

    const title = mode === 'edit' ? 'Sửa Ca làm việc' : 'Thêm Ca làm việc';
    $('dialogTitle').textContent = title;

    // Reset form
    resetForm();

    if (row && (mode === 'edit' || mode === 'clone')) {
      if (mode === 'clone') {
        // Clone: copy all except ma_ca
        $('fTenCa').value       = row.ten_ca;
        $('fGioVao').value      = row.gio_vao;
        $('fGioHet').value      = row.gio_het;
        $('fBatDauNghi').value  = row.bat_dau_nghi;
        $('fKetThucNghi').value = row.ket_thuc_nghi;
        $('fMoTa').value        = row.mo_ta || '';
        $('fMaCa').value        = '';
        $('fMaCa').classList.add('error');
      } else {
        // Edit: fill all
        $('fMaCa').value        = row.ma_ca;
        $('fMaCa').readOnly     = true;
        $('fMaCa').style.background = '#f5f5f5';
        $('fTenCa').value       = row.ten_ca;
        $('fGioVao').value      = row.gio_vao;
        $('fGioHet').value      = row.gio_het;
        $('fBatDauNghi').value  = row.bat_dau_nghi;
        $('fKetThucNghi').value = row.ket_thuc_nghi;
        $('fMoTa').value        = row.mo_ta || '';
        // Status radio
        if (row.trang_thai) {
          $('statusActive').checked = true;
        } else {
          $('statusInactive').checked = true;
        }
      }
      // Auto-calc
      recalc();
    }

    // Show/hide status row
    $('statusRow').classList.toggle('hidden', mode !== 'edit');

    // Open overlay
    $('dialogOverlay').classList.add('open');

    // Focus first field
    setTimeout(() => {
      if (mode !== 'edit') $('fMaCa').focus();
      else $('fTenCa').focus();
    }, 50);
  }

  function closeDialog() {
    $('dialogOverlay').classList.remove('open');
    editingId = null;
    render();
  }

  function resetForm() {
    ['fMaCa','fTenCa','fGioVao','fGioHet','fBatDauNghi','fKetThucNghi','fMoTa'].forEach(id => {
      const el = $(id);
      el.value = '';
      el.classList.remove('error');
      el.readOnly = false;
      el.style.background = '';
    });
    $('fTgLamViec').value = '';
    $('fTgNghi').value = '';
    $('statusActive').checked = true;
  }

  function recalc() {
    const vao = $('fGioVao').value;
    const het = $('fGioHet').value;
    const bd  = $('fBatDauNghi').value;
    const kt  = $('fKetThucNghi').value;
    const { tg_nghi, tg_lam_viec } = calcTimes(vao, het, bd, kt);
    $('fTgLamViec').value = tg_lam_viec.toFixed(1).replace('.', ',');
    $('fTgNghi').value    = tg_nghi.toFixed(1).replace('.', ',');
  }

  /* ── VALIDATION ── */
  function validate() {
    const fields = [
      { id: 'fMaCa',   label: 'Mã ca', max: 20 },
      { id: 'fTenCa',  label: 'Tên ca', max: 50 },
      { id: 'fGioVao', label: 'Giờ vào ca', max: null },
      { id: 'fGioHet', label: 'Giờ hết ca', max: null },
    ];

    let errors = [];
    fields.forEach(f => {
      const el = $(f.id);
      el.classList.remove('error');
      const v = el.value.trim();
      if (!v) {
        el.classList.add('error');
        errors.push(`${f.label} không được để trống.`);
      } else if (f.max && v.length > f.max) {
        el.classList.add('error');
        errors.push(`${f.label} không được vượt quá ${f.max} ký tự.`);
      }
    });

    // Unique mã ca (only for add/clone)
    if (dialogMode !== 'edit') {
      const ma = $('fMaCa').value.trim();
      if (ma && data.some(r => r.ma_ca.toLowerCase() === ma.toLowerCase())) {
        $('fMaCa').classList.add('error');
        errors.push('Mã ca đã tồn tại trong hệ thống.');
      }
    }

    return errors;
  }

  function saveForm(keepOpen = false) {
    const errors = validate();
    if (errors.length) {
      showWarning(errors[0]);
      return;
    }

    const vao = $('fGioVao').value;
    const het = $('fGioHet').value;
    const bd  = $('fBatDauNghi').value;
    const kt  = $('fKetThucNghi').value;
    const { tg_nghi, tg_lam_viec } = calcTimes(vao, het, bd, kt);

    if (dialogMode === 'edit' && editingId !== null) {
      const idx = data.findIndex(r => r.id === editingId);
      if (idx !== -1) {
        data[idx] = {
          ...data[idx],
          ten_ca:       $('fTenCa').value.trim(),
          gio_vao:      vao,
          gio_het:      het,
          bat_dau_nghi: bd,
          ket_thuc_nghi: kt,
          tg_lam_viec,
          tg_nghi,
          trang_thai:   $('statusActive').checked,
          mo_ta:        $('fMoTa').value.trim(),
        };
      }
      Toast.success('Cập nhật ca làm việc thành công!');
    } else {
      const newRow = {
        id: nextId++,
        ma_ca:        $('fMaCa').value.trim(),
        ten_ca:       $('fTenCa').value.trim(),
        gio_vao:      vao,
        gio_het:      het,
        bat_dau_nghi: bd,
        ket_thuc_nghi: kt,
        tg_lam_viec,
        tg_nghi,
        trang_thai:   true,
        mo_ta:        $('fMoTa').value.trim(),
        nguoi_tao:    'Admin',
      };
      data.push(newRow);
      Toast.success('Thêm ca làm việc thành công!');
    }

    if (keepOpen) {
      resetForm();
      dialogMode = 'add';
      editingId = null;
      $('dialogTitle').textContent = 'Thêm Ca làm việc';
      $('statusRow').classList.add('hidden');
      setTimeout(() => $('fMaCa').focus(), 30);
    } else {
      closeDialog();
    }
    render();
  }

  /* ── WARNING DIALOG ── */
  function showWarning(msg) {
    $('warningMsg').textContent = msg;
    $('warningOverlay').classList.add('open');
  }

  function closeWarning() {
    $('warningOverlay').classList.remove('open');
  }

  /* ── DELETE ── */
  function confirmDelete(ids) {
    deleteTargetIds = ids;
    $('deleteOverlay').classList.add('open');
  }

  function doDelete() {
    data = data.filter(r => !deleteTargetIds.includes(r.id));
    deleteTargetIds.forEach(id => selectedIds.delete(id));
    $('deleteOverlay').classList.remove('open');
    Toast.success('Xóa ca làm việc thành công!');
    render();
  }

  /* ── CONTEXT MENU ── */
  function showContextMenu(id, x, y) {
    contextTargetId = id;
    const row = data.find(r => r.id === id);
    const menu = $('contextMenu');
    const useItem = $('ctxUse');
    useItem.textContent = row.trang_thai ? 'Ngừng sử dụng' : 'Sử dụng';

    // Position
    menu.style.top  = y + 'px';
    menu.style.left = x + 'px';
    menu.classList.add('open');

    // Adjust to not go off screen
    requestAnimationFrame(() => {
      const rect = menu.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        menu.style.left = (x - rect.width) + 'px';
      }
      if (rect.bottom > window.innerHeight) {
        menu.style.top = (y - rect.height) + 'px';
      }
    });
  }

  function closeContextMenu() {
    $('contextMenu').classList.remove('open');
    contextTargetId = null;
  }

  /* ── STATUS TOGGLE ── */
  function toggleStatus(ids) {
    ids.forEach(id => {
      const row = data.find(r => r.id === id);
      if (row) row.trang_thai = !row.trang_thai;
    });
    Toast.success('Cập nhật trạng thái thành công!');
    render();
  }

  function setStatus(ids, active) {
    ids.forEach(id => {
      const row = data.find(r => r.id === id);
      if (row) row.trang_thai = active;
    });
    Toast.success('Cập nhật trạng thái thành công!');
    render();
  }

  /* ── EVENTS ── */
  function bindEvents() {
    // Search
    $('searchInput').addEventListener('input', e => {
      searchQuery = e.target.value;
      page = 1;
      render();
    });

    // Refresh
    $('refreshBtn').addEventListener('click', () => {
      searchQuery = ''; $('searchInput').value = '';
      selectedIds.clear(); page = 1;
      render();
    });

    // Add button
    $('addBtn').addEventListener('click', () => openDialog('add'));

    // Select all
    $('selectAll').addEventListener('click', () => {
      const ids = pageIds();
      const allSel = ids.every(id => selectedIds.has(id));
      if (allSel) {
        ids.forEach(id => selectedIds.delete(id));
      } else {
        ids.forEach(id => selectedIds.add(id));
      }
      render();
    });

    // Table body events (delegate)
    $('tableBody').addEventListener('click', e => {
      // Checkbox
      const cb = e.target.closest('.misa-checkbox');
      if (cb) {
        const id = parseInt(cb.dataset.id);
        if (selectedIds.has(id)) selectedIds.delete(id);
        else selectedIds.add(id);
        render();
        return;
      }
      // Edit button
      const editBtn = e.target.closest('[data-action="edit"]');
      if (editBtn) {
        const id = parseInt(editBtn.dataset.id);
        const row = data.find(r => r.id === id);
        openDialog('edit', row);
        return;
      }
      // Context menu
      const menuBtn = e.target.closest('[data-action="menu"]');
      if (menuBtn) {
        const id = parseInt(menuBtn.dataset.id);
        const rect = menuBtn.getBoundingClientRect();
        showContextMenu(id, rect.right - 150, rect.bottom + 4);
        return;
      }
    });

    // Row keyboard accessibility for checkbox
    $('tableBody').addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        const cb = e.target.closest('.misa-checkbox');
        if (cb) { cb.click(); e.preventDefault(); }
      }
    });

    // Dialog overlay close on backdrop click
    $('dialogOverlay').addEventListener('click', e => {
      if (e.target === $('dialogOverlay')) closeDialog();
    });
    $('dialogClose').addEventListener('click', closeDialog);
    $('dialogCancel').addEventListener('click', closeDialog);
    $('dialogSave').addEventListener('click', () => saveForm(false));
    $('dialogSaveAdd').addEventListener('click', () => saveForm(true));

    // Auto-calculate on time field change
    ['fGioVao','fGioHet','fBatDauNghi','fKetThucNghi'].forEach(id => {
      $(id).addEventListener('input', recalc);
      $(id).addEventListener('change', recalc);
    });

    // Warning dialog
    $('warningClose').addEventListener('click', closeWarning);
    $('warningOverlay').addEventListener('click', e => {
      if (e.target === $('warningOverlay')) closeWarning();
    });

    // Delete dialog
    $('deleteCancelBtn').addEventListener('click', () => {
      $('deleteOverlay').classList.remove('open');
    });
    $('deleteConfirmBtn').addEventListener('click', doDelete);
    $('deleteOverlay').addEventListener('click', e => {
      if (e.target === $('deleteOverlay')) {
        $('deleteOverlay').classList.remove('open');
      }
    });

    // Context menu actions
    $('ctxEdit').addEventListener('click', () => {
      const row = data.find(r => r.id === contextTargetId);
      closeContextMenu();
      openDialog('edit', row);
    });
    $('ctxClone').addEventListener('click', () => {
      const row = data.find(r => r.id === contextTargetId);
      closeContextMenu();
      openDialog('clone', row);
    });
    $('ctxUse').addEventListener('click', () => {
      const id = contextTargetId;
      closeContextMenu();
      toggleStatus([id]);
    });
    $('ctxDelete').addEventListener('click', () => {
      const id = contextTargetId;
      closeContextMenu();
      confirmDelete([id]);
    });

    // Close context menu on outside click
    document.addEventListener('click', e => {
      if (!e.target.closest('#contextMenu') && !e.target.closest('[data-action="menu"]')) {
        closeContextMenu();
      }
    });

    // Bulk actions
    $('bulkDeselect').addEventListener('click', () => {
      selectedIds.clear(); render();
    });
    $('bulkUse').addEventListener('click', () => {
      setStatus([...selectedIds], true);
      selectedIds.clear(); render();
    });
    $('bulkStop').addEventListener('click', () => {
      setStatus([...selectedIds], false);
      selectedIds.clear(); render();
    });
    $('bulkDelete').addEventListener('click', () => {
      confirmDelete([...selectedIds]);
    });

    // Pagination
    $('perPageSelect').addEventListener('change', e => {
      perPage = parseInt(e.target.value);
      page = 1; render();
    });
    $('firstBtn').addEventListener('click', () => { page = 1; render(); });
    $('prevBtn').addEventListener('click',  () => { page--; render(); });
    $('nextBtn').addEventListener('click',  () => { page++; render(); });
    $('lastBtn').addEventListener('click',  () => {
      page = Math.ceil(filtered.length / perPage); render();
    });

    // FAB
    $('fab').addEventListener('click', () => Toast.dev());
  }

  function init() {
    bindEvents();
    render();
  }

  return { init };
})();

window.CaLamViec = CaLamViec;
