/**
 * app.js – Vue 3 App Entry Point
 * Ca Làm Việc – AMIS Quản Trị Sản Xuất
 * Vue 3 CDN Global Build
 */

const { createApp, nextTick } = Vue;

createApp({
  /* ─────────────────────────────────────────────────────
     DATA
  ───────────────────────────────────────────────────── */
  data() {
    return {
      /* Sidebar */
      sidebarCollapsed: localStorage.getItem('misa_sb') === 'true',
      openMenus: {
        keHoach: false, dieuPhoi: false, kiemTra: false,
        kho: false, giaoViec: false, giaThanhKH: false,
        thueGiaCong: false, sanPham: false, quyTrinh: false,
        nangLuc: false, danhMuc: true, thietLap: false,
      },
      currentRoute: 'danh-muc/ca-lam-viec',

      /* Records */
      records: [
        { id:1, ma_ca:'CA_CHIEU', ten_ca:'Ca chiều',  gio_vao:'13:30', gio_het:'17:30', bat_dau_nghi:'',      ket_thuc_nghi:'',      tg_lam_viec:4.0, tg_nghi:0.0, trang_thai:true,  mo_ta:'', nguoi_tao:'Trần Minh Hà', ngay_tao:'24/10/2025', nguoi_sua:'Trần Minh Hà', ngay_sua:'08/03/2026' },
        { id:2, ma_ca:'CA_SANG',  ten_ca:'Ca Sáng',   gio_vao:'08:00', gio_het:'12:00', bat_dau_nghi:'',      ket_thuc_nghi:'',      tg_lam_viec:4.0, tg_nghi:0.0, trang_thai:false, mo_ta:'', nguoi_tao:'Trần Minh Hà', ngay_tao:'24/10/2025', nguoi_sua:'Trần Minh Hà', ngay_sua:'05/03/2026' },
        { id:3, ma_ca:'CAtest',   ten_ca:'CAtest',    gio_vao:'08:00', gio_het:'17:30', bat_dau_nghi:'08:00', ket_thuc_nghi:'17:30', tg_lam_viec:0.0, tg_nghi:9.5, trang_thai:false, mo_ta:'', nguoi_tao:'Trần Minh Hà', ngay_tao:'01/03/2026', nguoi_sua:'Trần Minh Hà', ngay_sua:'01/03/2026' },
        { id:4, ma_ca:'CA_TOI',   ten_ca:'Ca tối',    gio_vao:'19:00', gio_het:'22:00', bat_dau_nghi:'',      ket_thuc_nghi:'',      tg_lam_viec:3.0, tg_nghi:0.0, trang_thai:false, mo_ta:'', nguoi_tao:'Trần Minh Hà', ngay_tao:'24/10/2025', nguoi_sua:'Trần Minh Hà', ngay_sua:'02/03/2026' },
      ],
      nextId: 5,

      /* Table state */
      searchQuery: '',
      selectedIds: [],
      activeId: null,
      page: 1,
      perPage: 20,

      /* Dialog */
      dialogVisible: false,
      dialogMode:    'add',
      editingId:     null,
      form: {
        ma_ca:'', ten_ca:'',
        gio_vao:'', gio_vao_hh:'', gio_vao_mm:'',
        gio_het:'', gio_het_hh:'', gio_het_mm:'',
        bat_dau_nghi:'', bat_dau_nghi_hh:'', bat_dau_nghi_mm:'',
        ket_thuc_nghi:'', ket_thuc_nghi_hh:'', ket_thuc_nghi_mm:'',
        mo_ta:'', trang_thai:true
      },
      formErrors: { ma_ca:false, ten_ca:false, gio_vao:false, gio_het:false },

      /* Warning & Delete */
      warningVisible: false,
      warningMsg:     '',
      deleteVisible:  false,
      deleteTargetIds:[],

      /* Context menu */
      ctxVisible:  false,
      ctxX:        0,
      ctxY:        0,
      ctxTargetId: null,

      /* Flyout Mega Menu */
      flyoutVisible: false,
      flyoutX: 0,
      flyoutY: 0,
      flyoutTimeout: null,
    };
  },

  /* ─────────────────────────────────────────────────────
     COMPUTED
  ───────────────────────────────────────────────────── */
  computed: {
    filteredData() {
      const q = this.searchQuery.toLowerCase().trim();
      if (!q) return this.records;
      return this.records.filter(r =>
        r.ma_ca.toLowerCase().includes(q) ||
        r.ten_ca.toLowerCase().includes(q) ||
        (r.nguoi_tao || '').toLowerCase().includes(q)
      );
    },
    pagedData() {
      const s = (this.page - 1) * this.perPage;
      return this.filteredData.slice(s, s + this.perPage);
    },
    totalPages() {
      return Math.max(1, Math.ceil(this.filteredData.length / this.perPage));
    },
    pageInfo() {
      const total = this.filteredData.length;
      if (!total) return '0';
      const s = (this.page - 1) * this.perPage + 1;
      const e = Math.min(this.page * this.perPage, total);
      return `${s} - ${e}`;
    },
    pageIds()      { return this.pagedData.map(r => r.id); },
    isAllSelected(){ return this.pageIds.length > 0 && this.pageIds.every(id => this.selectedIds.includes(id)); },
    isSomeSelected(){ return this.pageIds.some(id => this.selectedIds.includes(id)); },
    hasActiveSelected()   { return this.records.some(r => this.selectedIds.includes(r.id) && r.trang_thai); },
    hasInactiveSelected() { return this.records.some(r => this.selectedIds.includes(r.id) && !r.trang_thai); },

    computedTgNghi() {
      const b = this.toMin(this.form.bat_dau_nghi);
      const k = this.toMin(this.form.ket_thuc_nghi);
      if (b === null || k === null || k <= b) return '0,0';
      return ((k - b) / 60).toFixed(1).replace('.', ',');
    },
    computedTgLamViec() {
      const v = this.toMin(this.form.gio_vao);
      const h = this.toMin(this.form.gio_het);
      if (v === null || h === null) return '0,0';
      const b = this.toMin(this.form.bat_dau_nghi);
      const k = this.toMin(this.form.ket_thuc_nghi);
      const nghiMin = (b !== null && k !== null && k > b) ? k - b : 0;
      return (Math.max(0, h - v - nghiMin) / 60).toFixed(1).replace('.', ',');
    },
    ctxRow() { return this.records.find(r => r.id === this.ctxTargetId) || null; },
    placeholderTitle() {
      const m = { 'tong-quan':'Tổng quan', 'don-dat-hang':'Đơn đặt hàng', 'bao-cao':'Báo cáo' };
      return m[this.currentRoute] || this.currentRoute;
    },
  },

  /* ─────────────────────────────────────────────────────
     WATCH
  ───────────────────────────────────────────────────── */
  watch: {
    searchQuery() { this.page = 1; },
    perPage()     { this.page = 1; },
  },

  /* ─────────────────────────────────────────────────────
     METHODS
  ───────────────────────────────────────────────────── */
  methods: {
    /* Sidebar */
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      localStorage.setItem('misa_sb', this.sidebarCollapsed);
    },
    toggleMenu(k) { this.openMenus[k] = !this.openMenus[k]; },
    navigate(r) {
      this.currentRoute = r;
      if (r !== 'danh-muc/ca-lam-viec') this.showToast('Tính năng đang trong quá trình phát triển', 'info');
    },

    /* Custom time input helpers */
    onTimeInput(field, nextField, e) {
      // only digits
      this.form[field] = e.target.value.replace(/\D/g, '');
      // auto-jump to next field when 2 digits typed
      if (nextField && this.form[field].length === 2) {
        const next = e.target.closest('.ctime-wrap').querySelector('.ctime-mm');
        if (next) next.focus();
      }
    },
    padTime(field) {
      const v = this.form[field];
      if (v && v.length === 1) this.form[field] = '0' + v;
    },
    syncTime(base) {
      const hh = this.form[base + '_hh'];
      const mm = this.form[base + '_mm'];
      if (hh !== '' && mm !== '') {
        const h = Math.min(23, parseInt(hh) || 0);
        const m = Math.min(59, parseInt(mm) || 0);
        const hs = String(h).padStart(2,'0');
        const ms = String(m).padStart(2,'0');
        this.form[base + '_hh'] = hs;
        this.form[base + '_mm'] = ms;
        this.form[base] = hs + ':' + ms;
      } else {
        this.form[base] = '';
      }
    },
    splitTime(base) {
      const t = this.form[base] || '';
      if (t && t.includes(':')) {
        const [h, m] = t.split(':');
        this.form[base + '_hh'] = h;
        this.form[base + '_mm'] = m;
      } else {
        this.form[base + '_hh'] = '';
        this.form[base + '_mm'] = '';
      }
    },
    /* Helpers */
    toMin(t) {
      if (!t) return null;
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    },
    formatNum(n) { return typeof n === 'number' ? n.toFixed(1).replace('.', ',') : '-'; },

    /* Table */
    refreshTable() { this.searchQuery = ''; this.selectedIds = []; this.page = 1; },
    toggleSelectAll() {
      if (this.isAllSelected) {
        this.selectedIds = this.selectedIds.filter(id => !this.pageIds.includes(id));
      } else {
        const add = this.pageIds.filter(id => !this.selectedIds.includes(id));
        this.selectedIds = [...this.selectedIds, ...add];
      }
    },
    toggleSelect(id) {
      const i = this.selectedIds.indexOf(id);
      if (i >= 0) this.selectedIds.splice(i, 1); else this.selectedIds.push(id);
    },
    clearSelection() { this.selectedIds = []; },

    /* Dialog */
    openDialog(mode, row = null) {
      this.dialogMode = mode;
      this.editingId  = mode === 'edit' && row ? row.id : null;
      this.formErrors = { ma_ca:false, ten_ca:false, gio_vao:false, gio_het:false };
      this.form = {
        ma_ca:'', ten_ca:'',
        gio_vao:'', gio_vao_hh:'', gio_vao_mm:'',
        gio_het:'', gio_het_hh:'', gio_het_mm:'',
        bat_dau_nghi:'', bat_dau_nghi_hh:'', bat_dau_nghi_mm:'',
        ket_thuc_nghi:'', ket_thuc_nghi_hh:'', ket_thuc_nghi_mm:'',
        mo_ta:'', trang_thai:true
      };
      if (row && mode === 'edit') {
        this.form = { ...this.form, ...row };
        ['gio_vao','gio_het','bat_dau_nghi','ket_thuc_nghi'].forEach(k => this.splitTime(k));
      }
      if (row && mode === 'clone')  { this.form = { ...row, ma_ca:'' }; this.formErrors.ma_ca = true; }
      this.dialogVisible = true;
      nextTick(() => {
        const el = mode === 'edit'
          ? document.getElementById('fTenCa')
          : document.getElementById('fMaCa');
        if (el) el.focus();
      });
    },
    closeDialog() { this.dialogVisible = false; this.editingId = null; },

    saveForm(keepOpen) {
      this.formErrors = { ma_ca:false, ten_ca:false, gio_vao:false, gio_het:false };
      const errors = [];
      if (!this.form.ma_ca.trim()) { this.formErrors.ma_ca = true; errors.push('Mã ca không được để trống.'); }
      else if (this.form.ma_ca.length > 20) { this.formErrors.ma_ca = true; errors.push('Mã ca không được vượt quá 20 ký tự.'); }
      else if (this.dialogMode !== 'edit') {
        if (this.records.some(r => r.ma_ca.toLowerCase() === this.form.ma_ca.trim().toLowerCase())) {
          this.formErrors.ma_ca = true; errors.push('Mã ca đã tồn tại.');
        }
      }
      if (!this.form.ten_ca.trim()) { this.formErrors.ten_ca = true; errors.push('Tên ca không được để trống.'); }
      if (!this.form.gio_vao)       { this.formErrors.gio_vao = true; errors.push('Giờ vào ca không được để trống.'); }
      if (!this.form.gio_het)       { this.formErrors.gio_het = true; errors.push('Giờ hết ca không được để trống.'); }
      if (errors.length) { this.warningMsg = errors[0]; this.warningVisible = true; return; }

      const tgNghi    = parseFloat(this.computedTgNghi.replace(',', '.'));
      const tgLamViec = parseFloat(this.computedTgLamViec.replace(',', '.'));

      if (this.dialogMode === 'edit') {
        const i = this.records.findIndex(r => r.id === this.editingId);
        if (i !== -1) {
          const today = new Date();
          const dd = String(today.getDate()).padStart(2,'0');
          const mm = String(today.getMonth()+1).padStart(2,'0');
          const yyyy = today.getFullYear();
          const dateStr = dd+'/'+mm+'/'+yyyy;
          this.records[i] = { ...this.records[i], ...this.form, tg_nghi:tgNghi, tg_lam_viec:tgLamViec, nguoi_sua:'Admin', ngay_sua:dateStr };
        }
        this.showToast('Cập nhật ca làm việc thành công!', 'success');
      } else {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2,'0');
        const mm = String(today.getMonth()+1).padStart(2,'0');
        const yyyy = today.getFullYear();
        const dateStr = dd+'/'+mm+'/'+yyyy;
        this.records.push({
          id: this.nextId++,
          ma_ca:         this.form.ma_ca.trim(),
          ten_ca:        this.form.ten_ca.trim(),
          gio_vao:       this.form.gio_vao,
          gio_het:       this.form.gio_het,
          bat_dau_nghi:  this.form.bat_dau_nghi,
          ket_thuc_nghi: this.form.ket_thuc_nghi,
          tg_lam_viec:   tgLamViec,
          tg_nghi:       tgNghi,
          trang_thai:    true,
          mo_ta:         this.form.mo_ta,
          nguoi_tao:     'Admin',
          ngay_tao:      dateStr,
          nguoi_sua:     'Admin',
          ngay_sua:      dateStr,
        });
        this.showToast('Thêm ca làm việc thành công!', 'success');
      }

      if (keepOpen) {
        this.dialogMode = 'add'; this.editingId = null;
        this.form = { ma_ca:'', ten_ca:'', gio_vao:'', gio_het:'', bat_dau_nghi:'', ket_thuc_nghi:'', mo_ta:'', trang_thai:true };
        this.formErrors = { ma_ca:false, ten_ca:false, gio_vao:false, gio_het:false };
        nextTick(() => { const el = document.getElementById('fMaCa'); if (el) el.focus(); });
      } else {
        this.closeDialog();
      }
    },

    /* Delete */
    confirmDelete(ids) { this.deleteTargetIds = [...ids]; this.deleteVisible = true; this.ctxVisible = false; },
    doDelete() {
      this.records        = this.records.filter(r => !this.deleteTargetIds.includes(r.id));
      this.selectedIds    = this.selectedIds.filter(id => !this.deleteTargetIds.includes(id));
      this.deleteVisible  = false;
      this.deleteTargetIds = [];
      this.showToast('Xóa ca làm việc thành công!', 'success');
    },

    /* Status */
    bulkSetStatus(active) {
      this.selectedIds.forEach(id => {
        const r = this.records.find(x => x.id === id);
        if (r) r.trang_thai = active;
      });
      this.selectedIds = [];
      this.showToast('Cập nhật trạng thái thành công!', 'success');
    },

    /* Flyout Menu */
    showFlyout(e) {
      clearTimeout(this.flyoutTimeout);
      const rect = e.currentTarget.getBoundingClientRect();
      this.flyoutX = rect.right + 2; 
      this.flyoutY = rect.top - 50;  
      this.flyoutVisible = true;
    },
    keepFlyout() {
      clearTimeout(this.flyoutTimeout);
    },
    hideFlyout() {
      this.flyoutTimeout = setTimeout(() => {
        this.flyoutVisible = false;
      }, 250);
    },

    /* Context menu */
    showContextMenu(event, id) {
      this.ctxTargetId = id;
      this.ctxX = Math.min(event.clientX, window.innerWidth  - 170);
      this.ctxY = Math.min(event.clientY, window.innerHeight - 160);
      this.ctxVisible = true;
      event.stopPropagation();
    },
    closeContextMenu() { this.ctxVisible = false; this.ctxTargetId = null; },
    ctxEdit()   { const r = this.records.find(x => x.id === this.ctxTargetId); this.closeContextMenu(); this.openDialog('edit', r); },
    ctxClone()  { const r = this.records.find(x => x.id === this.ctxTargetId); this.closeContextMenu(); this.openDialog('clone', r); },
    ctxToggleStatus() {
      const r = this.records.find(x => x.id === this.ctxTargetId);
      if (r) r.trang_thai = !r.trang_thai;
      this.closeContextMenu();
      this.showToast('Cập nhật trạng thái thành công!', 'success');
    },
    ctxDelete() { const id = this.ctxTargetId; this.closeContextMenu(); this.confirmDelete([id]); },

    /* Toast */
    showToast(msg, type = 'success') {
      const c = document.getElementById('toast-container');
      if (!c) return;
      const icons = {
        success: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>',
        error:   '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        info:    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
      };
      const el = document.createElement('div');
      el.className = `toast ${type}`;
      el.innerHTML = `<span>${icons[type]||icons.info}</span><span>${msg}</span>`;
      c.appendChild(el);
      setTimeout(() => {
        el.classList.add('hiding');
        el.addEventListener('animationend', () => el.remove(), { once:true });
      }, 3200);
    },
    devToast() { this.showToast('Tính năng đang trong quá trình phát triển', 'info'); },
  },

  /* ─────────────────────────────────────────────────────
     LIFECYCLE
  ───────────────────────────────────────────────────── */
  mounted() {
    /* Close context menu on click */
    document.addEventListener('click', () => {
      if (this.ctxVisible) this.closeContextMenu();
    });

    /* Sidebar collapse */
    this.sidebarCollapsed = localStorage.getItem('misa_sb') === 'true';

    /* Hash routing */
    const handleHash = () => {
      const r = (location.hash || '').replace(/^#\/?/, '') || 'danh-muc/ca-lam-viec';
      this.currentRoute = r;
      if (r.startsWith('danh-muc')) this.openMenus.danhMuc = true;
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
  },
}).mount('#app');
