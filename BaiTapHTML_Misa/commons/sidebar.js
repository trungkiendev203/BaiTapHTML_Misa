/* ============================================================
   SIDEBAR.JS – Sidebar, Router, Navigation
   ============================================================ */

const Sidebar = (() => {
  const STORAGE_KEY = 'misa_sidebar_collapsed';

  let isCollapsed = false;

  function init() {
    isCollapsed = localStorage.getItem(STORAGE_KEY) === 'true';
    applyCollapsed(false); // no animation on init
    bindEvents();
    Router.init();
  }

  function applyCollapsed(animate = true) {
    const sidebar = document.getElementById('appSidebar');
    const edge = document.getElementById('sidebarEdge');
    if (!animate) { sidebar.style.transition = 'none'; }
    sidebar.classList.toggle('collapsed', isCollapsed);
    if (!animate) { requestAnimationFrame(() => { sidebar.style.transition = ''; }); }

    // Update edge button icon
    const edgeIcon = edge.querySelector('svg');
    if (isCollapsed) {
      edgeIcon.innerHTML = '<polyline points="9 18 15 12 9 6"/>';
    } else {
      edgeIcon.innerHTML = '<polyline points="15 18 9 12 15 6"/>';
    }

    // Update collapse button label
    const collapseLabel = document.querySelector('.sidebar-collapse-label');
    if (collapseLabel) collapseLabel.textContent = isCollapsed ? 'Mở rộng' : 'Thu gọn';
  }

  function toggle() {
    isCollapsed = !isCollapsed;
    localStorage.setItem(STORAGE_KEY, isCollapsed);
    applyCollapsed(true);
  }

  function bindEvents() {
    // Collapse button
    document.getElementById('collapseBtn').addEventListener('click', toggle);
    document.getElementById('sidebarEdge').addEventListener('click', toggle);

    // Nav items with submenu
    document.querySelectorAll('.nav-link[data-submenu]').forEach(link => {
      link.addEventListener('click', function(e) {
        const item = this.closest('.nav-item');
        const isOpen = item.classList.contains('open');
        // close other open items at same level
        item.parentElement.querySelectorAll('.nav-item.open').forEach(i => {
          if (i !== item) i.classList.remove('open');
        });
        item.classList.toggle('open', !isOpen);
      });
    });

    // Nav items without submenu (route/toast)
    document.querySelectorAll('.nav-link[data-route]').forEach(link => {
      link.addEventListener('click', function(e) {
        const route = this.dataset.route;
        Router.navigate(route);
      });
    });

    document.querySelectorAll('.nav-sublink[data-route]').forEach(link => {
      link.addEventListener('click', function(e) {
        const route = this.dataset.route;
        Router.navigate(route);
      });
    });
  }

  return { init };
})();


const Router = (() => {
  const MAIN_ROUTE = 'danh-muc/ca-lam-viec';

  function getRoute() {
    return (location.hash || '#/').replace('#/', '');
  }

  function navigate(route) {
    location.hash = '#/' + route;
  }

  function render(route) {
    // Update active state in sidebar
    document.querySelectorAll('.nav-link, .nav-sublink').forEach(el => {
      el.classList.remove('active');
    });

    const page = document.getElementById('page-ca-lam-viec');
    const placeholder = document.getElementById('page-placeholder');

    if (route === MAIN_ROUTE) {
      if (page) { page.classList.add('active'); page.style.display = 'flex'; }
      if (placeholder) { placeholder.classList.remove('active'); placeholder.style.display = 'none'; }

      // Open Danh mục khác submenu
      const danhMucItem = document.querySelector('.nav-item[data-id="danh-muc"]');
      if (danhMucItem) danhMucItem.classList.add('open');

      // Set active on link and sublink
      const activeLink = document.querySelector('[data-id="danh-muc"] > .nav-link');
      const activeSublink = document.querySelector('.nav-sublink[data-route="danh-muc/ca-lam-viec"]');
      if (activeLink) activeLink.classList.add('active');
      if (activeSublink) activeSublink.classList.add('active');
    } else {
      if (page) { page.classList.remove('active'); page.style.display = 'none'; }
      if (placeholder) {
        placeholder.classList.add('active');
        placeholder.style.display = 'flex';
        const title = placeholder.querySelector('.placeholder-title');
        if (title) title.textContent = routeLabel(route) || 'Trang này đang được phát triển';
      }

      // Highlight correct nav item
      const activeEl = document.querySelector(`[data-route="${route}"]`);
      if (activeEl) activeEl.classList.add('active');

      if (route !== '') Toast.dev();
    }
  }

  function routeLabel(route) {
    const map = {
      'tong-quan': 'Tổng quan',
      'don-dat-hang': 'Đơn đặt hàng',
      'ke-hoach': 'Kế hoạch sản xuất',
      'dieu-phoi': 'Điều phối và thực thi',
      'kiem-tra': 'Kiểm tra chất lượng',
      'kho': 'Kho vật tư',
      'bao-cao': 'Báo cáo',
      'quy-trinh': 'Quy trình sản xuất',
      'nang-luc': 'Năng lực sản xuất',
      'thiet-lap': 'Thiết lập',
    };
    return map[route] || route;
  }

  function init() {
    window.addEventListener('hashchange', () => render(getRoute()));
    // Default redirect
    if (!location.hash || location.hash === '#/') {
      navigate(MAIN_ROUTE);
    } else {
      render(getRoute());
    }
  }

  return { init, navigate };
})();

window.Sidebar = Sidebar;
window.Router = Router;
