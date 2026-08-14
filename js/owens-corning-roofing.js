(() => {
  const activateTab = (tabs, panels, activeTab, tabKey, panelKey) => {
    const value = activeTab.dataset[tabKey];

    tabs.forEach((tab) => {
      const selected = tab === activeTab;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });

    panels.forEach((panel) => {
      panel.hidden = panel.dataset[panelKey] !== value;
    });
  };

  const initializeTabs = ({ tabSelector, panelSelector, tabKey, panelKey }) => {
    const tabs = Array.from(document.querySelectorAll(tabSelector));
    const panels = Array.from(document.querySelectorAll(panelSelector));

    if (!tabs.length || !panels.length) return;

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => {
        activateTab(tabs, panels, tab, tabKey, panelKey);
      });

      tab.addEventListener("keydown", (event) => {
        const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
        if (!keys.includes(event.key)) return;

        event.preventDefault();
        let nextIndex = index;

        if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabs.length - 1;

        tabs[nextIndex].focus();
        activateTab(tabs, panels, tabs[nextIndex], tabKey, panelKey);
      });
    });
  };

  initializeTabs({
    tabSelector: "[data-tool]",
    panelSelector: "[data-panel]",
    tabKey: "tool",
    panelKey: "panel"
  });

  initializeTabs({
    tabSelector: "[data-shingle-tab]",
    panelSelector: "[data-shingle-panel]",
    tabKey: "shingleTab",
    panelKey: "shinglePanel"
  });

  document.querySelectorAll("[data-oc-tool-link]").forEach((link) => {
    link.addEventListener("click", () => {
      if (!Array.isArray(window.dataLayer)) return;
      window.dataLayer.push({
        event: "oc_tool_launch",
        oc_tool: link.dataset.ocToolLink,
        page_path: window.location.pathname
      });
    });
  });
})();
