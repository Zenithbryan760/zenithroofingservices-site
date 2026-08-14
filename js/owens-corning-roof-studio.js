(function () {
  "use strict";

  var products = {
    oakridge: {
      label: "Oakridge",
      shingle: "oakridge",
      budgetId: "55df30e1-90f3-44ff-bc6f-f0227ceb6d3b"
    },
    duration: {
      label: "Duration",
      shingle: "trudefinition-duration",
      budgetId: "c0bfcc13-f8ba-4b78-9d7b-a7fa306adc14"
    },
    "duration-cool": {
      label: "Duration COOL",
      shingle: "trudefinition-duration-cool",
      budgetId: "d1c3335a-b00f-4fea-836a-9db3bfc2bdc8"
    }
  };

  var tools = {
    budget: {
      eyebrow: "Preliminary roof budget",
      title: "Budget Your Roof",
      copy: "Choose a Zenith product configuration, enter the home's living area and roof complexity, and receive a preliminary planning range.",
      note: "<b>Planning guidance:</b> This is a preliminary budget range. Roof measurements, decking, extra layers, low-slope areas, access and concealed conditions can change the final proposal.",
      fallbackUrl: "https://www.owenscorning.com/en-us/roofing/budget-your-roof",
      fallbackLabel: "Open Budget Your Roof on Owens Corning"
    },
    shingles: {
      eyebrow: "Official shingle selector",
      title: "Compare shingle colors on a house",
      copy: "Switch among Oakridge, Duration and Duration COOL, then compare the current color choices in the official Owens Corning house view.",
      note: "<b>Color guidance:</b> Screens and printed materials can shift color. Confirm the current regional palette and review a physical sample before ordering.",
      fallbackUrl: "https://www.owenscorning.com/en-us/roofing/shingles",
      fallbackLabel: "Browse shingles on Owens Corning"
    },
    visualizer: {
      eyebrow: "Design EyeQ visualization",
      title: "Try a roof color on your home",
      copy: "Upload a property photo or choose a sample home to explore shingle, siding and trim combinations before requesting physical samples.",
      note: "<b>Design guidance:</b> Visualization is a planning aid. Current availability, HOA rules, physical samples and the written proposal control the final selection.",
      fallbackUrl: "https://www.owenscorning.com/en-us/roofing/design-eyeq",
      fallbackLabel: "Open Design EyeQ on Owens Corning"
    },
    build: {
      eyebrow: "Roof system planning",
      title: "Build Your Roof",
      copy: "Walk through the official Owens Corning planning experience to see how shingles, protection, ventilation and accessories work together.",
      note: "<b>System guidance:</b> Zenith verifies roof slope, deck condition, transitions, attic ventilation and warranty requirements before writing the proposal.",
      fallbackUrl: "https://www.owenscorning.com/en-us/roofing/build-your-roof",
      fallbackLabel: "Open Build Your Roof on Owens Corning"
    },
    style: {
      eyebrow: "Design and inspire",
      title: "Coordinate the complete exterior",
      copy: "Use official style boards to compare roof, siding and trim pairings built around popular Owens Corning Duration Series colors.",
      note: "<b>Style guidance:</b> Use the boards to narrow the direction, then confirm the final shingle and color with current physical samples.",
      fallbackUrl: "https://www.owenscorning.com/en-us/roofing/widgets",
      fallbackLabel: "Open the Owens Corning widget library"
    },
    smarter: {
      eyebrow: "Homeowner education",
      title: "Roof Smarter",
      copy: "Review official roofing education intended to help homeowners understand the decisions behind a complete roof replacement.",
      note: "<b>Next step:</b> Bring your questions to the inspection. Zenith connects the general guidance to the deck, roof shape and attic at your property.",
      fallbackUrl: "https://www.owenscorning.com/en-us/roofing",
      fallbackLabel: "Explore Owens Corning roofing resources"
    },
    system: {
      eyebrow: "SEAL. DEFEND. BREATHE.",
      title: "Total Protection Roofing System",
      copy: "Explore the official Owens Corning explanation of the integrated components that help seal the deck, defend the home and support balanced ventilation.",
      note: "<b>Scope guidance:</b> Flashing, fasteners, pipe boots and wood decking are roof-critical details but are not branded Total Protection Roofing System components.",
      fallbackUrl: "https://www.owenscorning.com/en-us/roofing/total-protection-roofing-system",
      fallbackLabel: "Open the official Total Protection overview"
    },
    warranty: {
      eyebrow: "Manufacturer protection",
      title: "Compare Owens Corning warranty options",
      copy: "Review Standard, System Protection and Preferred Protection limited warranty choices, including current enhanced-coverage and workmanship distinctions.",
      note: "<b>Eligibility guidance:</b> The actual warranty document, qualifying products, installation requirements, contractor status and registration control coverage.",
      embedUrl: "https://www.owenscorning.com/en-us/public_widgets/warranty",
      fallbackUrl: "https://www.owenscorning.com/en-us/roofing/warranty",
      fallbackLabel: "Open the official warranty comparison"
    }
  };

  var activeTool = "budget";
  var activeProduct = "oakridge";
  var loadToken = 0;
  var currentFrame = null;

  function track(eventName, details) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: eventName }, details || {}));
  }

  function fallbackMarkup(tool) {
    return [
      '<div class="oc-widget-fallback">',
      "<span>Official Owens Corning resource</span>",
      "<b>The embedded tool is temporarily unavailable in this window.</b>",
      "<p>Continue with the official Owens Corning resource, retry the embed, or ask Zenith to review the selection with your roof conditions.</p>",
      '<div class="oc-widget-fallback__actions">',
      '<a href="' + tool.fallbackUrl + '" target="_blank" rel="noopener">' + tool.fallbackLabel + "</a>",
      '<button type="button" data-retry-widget>Retry embedded tool</button>',
      '<a class="is-secondary" href="#estimate">Ask Zenith</a>',
      "</div>",
      "</div>"
    ].join("");
  }

  function loadingMarkup() {
    return '<div class="oc-widget-loading"><i aria-hidden="true"></i><b>Loading the official Owens Corning tool</b></div>';
  }

  function setWidgetMarkup(mount, toolKey, productKey, token) {
    var tool = tools[toolKey];
    var query = new URLSearchParams({
      tool: toolKey,
      system: productKey,
      attempt: String(token)
    });
    var title = "Official Owens Corning " + tool.title + " tool";

    mount.className = "oc-widget-mount oc-widget-" + toolKey + " is-loading";
    mount.innerHTML = loadingMarkup() + '<iframe class="oc-widget-host-frame" title="' + title + '" src="/owens-corning-roofing/widget-host.html?' + query.toString() + '" loading="eager" referrerpolicy="strict-origin-when-cross-origin"></iframe>';
    return mount.querySelector(".oc-widget-host-frame");
  }

  function markWidgetReady(mount) {
    var loading = mount.querySelector(".oc-widget-loading");
    if (loading) loading.remove();
    mount.classList.remove("is-loading", "is-fallback");
    mount.classList.add("is-ready");
    mount.setAttribute("aria-busy", "false");
  }

  function showWidgetFallback(mount, tool) {
    mount.innerHTML = fallbackMarkup(tool);
    mount.classList.remove("is-loading", "is-ready");
    mount.classList.add("is-fallback");
    mount.setAttribute("aria-busy", "false");
  }

  function frameHeight(toolKey, measuredHeight) {
    var maximums = {
      budget: 980,
      shingles: 760,
      visualizer: 900,
      build: 900,
      style: 760,
      smarter: 800,
      system: 800,
      warranty: 860
    };
    var height = Number(measuredHeight);
    if (!Number.isFinite(height) || height < 1) return null;
    return Math.max(280, Math.min(maximums[toolKey] || 820, Math.ceil(height)));
  }

  function handleWidgetMessage(event) {
    if (event.origin !== window.location.origin || !currentFrame || event.source !== currentFrame.contentWindow) return;
    var message = event.data || {};
    if (message.channel !== "zenith-oc-widget" || message.tool !== activeTool || message.product !== activeProduct) return;

    var mount = document.getElementById("oc-widget-mount");
    if (!mount) return;

    if (message.type === "height") {
      var height = frameHeight(activeTool, message.height);
      if (height) currentFrame.style.height = height + "px";
      return;
    }

    if (message.type === "ready") {
      markWidgetReady(mount);
      return;
    }

    if (message.type === "fallback") {
      currentFrame = null;
      showWidgetFallback(mount, tools[activeTool]);
    }
  }

  function updateQuery() {
    if (!window.history || !window.history.replaceState) return;
    var url = new URL(window.location.href);
    url.searchParams.set("tool", activeTool);
    if (activeTool === "budget" || activeTool === "shingles") {
      url.searchParams.set("system", activeProduct);
    } else {
      url.searchParams.delete("system");
    }
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  }

  function renderWidget(options) {
    options = options || {};
    var mount = document.getElementById("oc-widget-mount");
    var tool = tools[activeTool];
    var picker = document.getElementById("oc-product-picker");
    if (!mount || !tool || !products[activeProduct]) return;

    loadToken += 1;
    var token = loadToken;
    currentFrame = null;

    document.getElementById("oc-tool-eyebrow").textContent = tool.eyebrow;
    document.getElementById("oc-tool-title").textContent = tool.title;
    document.getElementById("oc-tool-copy").textContent = tool.copy;
    document.getElementById("oc-tool-note").innerHTML = tool.note;

    document.querySelectorAll("[data-tool]").forEach(function (button) {
      var selected = button.getAttribute("data-tool") === activeTool;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-selected", selected ? "true" : "false");
    });

    document.querySelectorAll("#oc-product-picker [data-product]").forEach(function (button) {
      var selected = button.getAttribute("data-product") === activeProduct;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });

    picker.hidden = activeTool !== "budget" && activeTool !== "shingles";
    mount.setAttribute("aria-busy", "true");

    currentFrame = setWidgetMarkup(mount, activeTool, activeProduct, token);
    if (!currentFrame) showWidgetFallback(mount, tool);

    window.setTimeout(function () {
      if (token === loadToken && mount.getAttribute("aria-busy") === "true") {
        currentFrame = null;
        showWidgetFallback(mount, tool);
      }
    }, 20000);

    if (!options.skipQuery) updateQuery();
  }

  function selectTool(toolKey, productKey, options) {
    if (tools[toolKey]) activeTool = toolKey;
    if (products[productKey]) activeProduct = productKey;
    renderWidget(options);
  }

  function configureSharedChrome() {
    var headerButton = document.querySelector(".site-header .header-actions a.button");
    if (headerButton) {
      headerButton.href = "#estimate";
      headerButton.textContent = "OC Estimate";
    }

    var mobilePrimary = document.querySelector(".mobile-dock__primary");
    if (mobilePrimary) mobilePrimary.href = "#estimate";

    var footerButton = document.querySelector(".site-footer .footer-cta__actions a.button--orange");
    if (footerButton) footerButton.href = "#estimate";
  }

  function initialize() {
    var params = new URLSearchParams(window.location.search);
    var queryTool = params.get("tool");
    var queryProduct = params.get("system");
    if (tools[queryTool]) activeTool = queryTool;
    if (products[queryProduct]) activeProduct = queryProduct;

    window.addEventListener("message", handleWidgetMessage);

    document.querySelectorAll("[data-tool]").forEach(function (button) {
      button.addEventListener("click", function () {
        var toolKey = button.getAttribute("data-tool");
        selectTool(toolKey, activeProduct);
        track("owens_corning_tool_selected", { oc_tool: toolKey, oc_product: activeProduct });
      });
    });

    document.querySelectorAll("#oc-product-picker [data-product]").forEach(function (button) {
      button.addEventListener("click", function () {
        var productKey = button.getAttribute("data-product");
        selectTool(activeTool, productKey);
        track("owens_corning_product_selected", { oc_tool: activeTool, oc_product: productKey });
      });
    });

    document.querySelectorAll("[data-open-tool]").forEach(function (button) {
      button.addEventListener("click", function () {
        var toolKey = button.getAttribute("data-open-tool");
        var productKey = button.getAttribute("data-product") || activeProduct;
        selectTool(toolKey, productKey);
        track("owens_corning_tool_selected", { oc_tool: toolKey, oc_product: productKey, oc_origin: "page_content" });
        document.getElementById("roof-tools").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    document.querySelectorAll("[data-oc-phone]").forEach(function (link) {
      link.addEventListener("click", function () {
        track("owens_corning_phone_click", { oc_path: window.location.pathname });
      });
    });

    document.addEventListener("click", function (event) {
      var retry = event.target.closest("[data-retry-widget]");
      if (!retry) return;
      renderWidget({ skipQuery: true });
      track("owens_corning_widget_retry", { oc_tool: activeTool, oc_product: activeProduct });
    });

    document.addEventListener("includes:ready", configureSharedChrome);
    configureSharedChrome();
    renderWidget({ skipQuery: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
