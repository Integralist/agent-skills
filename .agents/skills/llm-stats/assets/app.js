(() => {
  "use strict";
  const report = JSON.parse(document.getElementById("report-data").textContent);
  const models = report.models;
  const bySlug = new Map(models.map(model => [model.slug, model]));
  const $ = id => document.getElementById(id);
  const svgNS = "http://www.w3.org/2000/svg";
  const effortOrder = ["none", "default", "minimal", "low", "medium", "high", "xhigh", "max"];
  const palettes = {
    anthropic: ["#ff650d", "#ef286d", "#f5b400"],
    openai: ["#00d4bb", "#39d353", "#00c7ef"],
    google: ["#9865ff", "#3181ff", "#e14aff"],
    other: ["#ffb000", "#00d4ff", "#ff40bd"],
  };
  const xInfo = {
    cost: { label: "Avg cost per task · USD", unit: "USD", lower: true,
      note: "Reported benchmark cost per task, not price per million tokens. Intelligence Index costs use the source’s weighted task average; missing costs are omitted." },
    tokens: { label: "Output tokens per task", unit: "tokens", lower: true,
      note: "Reported output tokens per task. Reasoning-token inclusion follows the supplied benchmark export." },
    time: { label: "Output-generation time per task · seconds", unit: "seconds", lower: true,
      note: "Output-generation time, not wall-clock latency. Use only exports with this time definition." },
    price: { label: "Blended token price · USD / 1M tokens", unit: "USD / 1M", lower: true,
      note: "Blended token price (3 input : 1 output), not cost per task. Benchmark scores and pricing are separate measurements." },
    speed: { label: "Output speed · tokens / second", unit: "tokens/s", lower: false,
      note: "Median output-generation speed from the source data; not end-to-end task completion speed." },
  };
  const seriesKey = model => JSON.stringify([model.provider, model.series]);
  const searchable = value => value.toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
  const glob = (pattern, value) => new RegExp("^" + pattern
    .split("*").map(part => part.split("?").map(piece =>
      piece.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".")).join(".*") + "$", "i").test(value);
  const fuzzyScore = (query, model) => {
    const fields = [model.name, model.slug, model.provider].map(searchable);
    let total = 0;
    for (const word of query.toLowerCase().split(/\s+/).map(searchable).filter(Boolean)) {
      const scores = fields.map(haystack => {
        const exact = haystack.indexOf(word);
        if (exact >= 0) return exact;
        let index = -1;
        let start = -1;
        for (const char of word) {
          index = haystack.indexOf(char, index + 1);
          if (index < 0) return Infinity;
          if (start < 0) start = index;
        }
        return 100 + index - start;
      });
      total += Math.min(...scores);
    }
    return total;
  };
  const valueFor = (model, benchmark, x) => {
    if (x === "price") return model.pricing.blended;
    if (x === "speed") return model.output_speed;
    const field = { cost: "cost_per_task", tokens: "output_tokens_per_task", time: "time_per_task" }[x];
    return model[field]?.[benchmark];
  };
  const finite = value => typeof value === "number" && Number.isFinite(value);
  const benchmarkInfo = key => report.benchmarks[key] || { label: key, unit: "points" };
  const defaults = config => {
    if (config.models?.length) return [...config.models];
    let candidates = models.filter(model => !config.providers?.length || config.providers.includes(model.provider));
    if (config.model_patterns?.length) {
      return candidates.filter(model => config.model_patterns.some(pattern => glob(pattern, model.slug)))
        .map(model => model.slug);
    }
    const limit = config.families_per_provider || 0;
    if (!limit) return candidates.map(model => model.slug);
    const groups = new Map();
    for (const model of candidates) {
      const key = seriesKey(model);
      const group = groups.get(key) || { key, provider: model.provider, score: -1, date: "" };
      group.score = Math.max(group.score, model.scores.intelligence ?? -1);
      group.date = group.date > model.release_date ? group.date : model.release_date;
      groups.set(key, group);
    }
    const ordered = [...groups.values()].sort((a, b) =>
      b.date.localeCompare(a.date) || b.score - a.score || a.key.localeCompare(b.key));
    const counts = new Map();
    const allowed = new Set();
    for (const group of ordered) {
      const count = counts.get(group.provider) || 0;
      if (count < limit) {
        allowed.add(group.key);
        counts.set(group.provider, count + 1);
      }
    }
    return candidates.filter(model => allowed.has(seriesKey(model))).map(model => model.slug);
  };

  let state;
  let points = new Map();
  let groups = new Map();
  let guides;
  let urlWarnings = [];
  const readState = () => {
    const params = new URLSearchParams(location.search);
    const saved = report.savedState || {};
    let benchmark = params.get("benchmark") || saved.benchmark || report.config.benchmark;
    let x = params.get("x") || saved.x || report.config.x;
    if (!params.has("x")) {
      if (params.get("eval-cost") === "intelligence-vs-total-cost") {
        x = "cost";
        if (!params.has("benchmark")) benchmark = "intelligence";
      } else if (params.get("eval-token-usage") === "score-vs-output-tokens-per-task") {
        x = "tokens";
      } else if (params.get("eval-speed") === "intelligence-vs-time-per-task") {
        x = "time";
        if (!params.has("benchmark")) benchmark = "intelligence";
      }
    }
    urlWarnings = [];
    if (!xInfo[x]) {
      urlWarnings.push("Unknown x metric: " + x);
      x = report.config.x;
    }
    const selected = params.has("models")
      ? params.get("models").split(",").map(slug => slug.trim()).filter(Boolean)
      : saved.models || defaults(report.config);
    const pinned = params.has("highlight") ? params.get("highlight") : saved.pinned || null;
    state = { selected: new Set(selected), benchmark, x, pinned, hovered: null };
    if (!state.selected.has(pinned) || !bySlug.has(pinned)) state.pinned = null;
  };
  const syncURL = () => {
    const url = new URL(location.href);
    url.searchParams.set("models", [...state.selected].sort().join(","));
    url.searchParams.set("benchmark", state.benchmark);
    url.searchParams.set("x", state.x);
    if (state.pinned) url.searchParams.set("highlight", state.pinned);
    else url.searchParams.delete("highlight");
    if (state.x === "cost") url.searchParams.set("eval-cost",
      state.benchmark === "intelligence" ? "intelligence-vs-total-cost" : "score-vs-cost-per-task");
    if (state.x === "tokens") url.searchParams.set("eval-token-usage", "score-vs-output-tokens-per-task");
    if (state.x === "time") url.searchParams.set("eval-speed",
      state.benchmark === "intelligence" ? "intelligence-vs-time-per-task" : "score-vs-time-per-task");
    try {
      history.replaceState(null, "", url);
    } catch {
      $("action-status").textContent = "This browser blocks local URL updates. Save HTML view to keep this selection.";
    }
  };
  const savedState = () => ({
    models: [...state.selected], benchmark: state.benchmark, x: state.x, pinned: state.pinned,
  });
  const svgElement = (tag, attributes, parent, content) => {
    const element = document.createElementNS(svgNS, tag);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
    if (content !== undefined) element.textContent = content;
    parent.append(element);
    return element;
  };
  const number = value => new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(value);
  const formatX = value => state.x === "cost"
    ? "$" + new Intl.NumberFormat("en", { maximumFractionDigits: 4 }).format(value)
    : state.x === "price" ? "$" + number(value) : number(value);
  const formatY = value => number(value) + (benchmarkInfo(state.benchmark).unit === "percent" ? "%" : "");
  const niceStep = (value, ticks) => {
    if (value <= 0) return 1;
    const rough = value / ticks;
    const power = 10 ** Math.floor(Math.log10(rough));
    const factor = [1, 2, 2.5, 5, 10].find(candidate => candidate >= rough / power);
    return factor * power;
  };
  const matches = () => models.map(model => ({ model, score: fuzzyScore($("model-search").value, model) }))
    .filter(item => Number.isFinite(item.score))
    .sort((a, b) => a.score - b.score || a.model.name.localeCompare(b.model.name))
    .map(item => item.model);
  const updateModelCount = () => {
    const count = models.filter(model => state.selected.has(model.slug)).length;
    $("models-toggle").textContent = `Models · ${count} of ${models.length}`;
  };
  const renderPicker = () => {
    const options = $("model-options");
    options.replaceChildren();
    const filtered = matches();
    for (const model of filtered) {
      const label = document.createElement("label");
      label.className = "model-option";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = state.selected.has(model.slug);
      input.setAttribute("aria-label", model.name);
      input.addEventListener("change", () => {
        if (input.checked) state.selected.add(model.slug);
        else state.selected.delete(model.slug);
        state.hovered = null;
        renderChart();
        syncURL();
      });
      const description = document.createElement("span");
      description.textContent = model.name;
      const metadata = document.createElement("span");
      metadata.className = "model-meta";
      metadata.textContent = model.provider + " · " + model.effort;
      description.append(metadata);
      label.append(input, description);
      options.append(label);
    }
    $("search-count").textContent = filtered.length + " matches · all providers available";
    updateModelCount();
  };
  const closePicker = () => {
    $("models-panel").hidden = true;
    $("models-toggle").setAttribute("aria-expanded", "false");
  };
  const pin = slug => {
    state.pinned = state.pinned === slug ? null : slug;
    state.hovered = null;
    paintHighlight();
    syncURL();
  };
  const clearHighlight = () => {
    state.pinned = null;
    state.hovered = null;
    paintHighlight();
    syncURL();
  };
  const tooltip = point => {
    const box = $("tooltip");
    box.replaceChildren();
    const title = document.createElement("strong");
    title.textContent = point.model.name;
    const score = document.createElement("div");
    score.textContent = benchmarkInfo(state.benchmark).label + ": " + formatY(point.y);
    const value = document.createElement("div");
    value.textContent = xInfo[state.x].label + ": " + formatX(point.x);
    const status = document.createElement("div");
    status.className = "muted";
    status.textContent = point.model.provider + " · " + point.model.effort.toUpperCase()
      + (state.pinned ? " · pinned" : " · click to pin");
    box.append(title, score, value, status);
    box.hidden = false;
  };
  const paintHighlight = () => {
    const slug = state.pinned || state.hovered;
    const point = points.get(slug);
    const key = point ? seriesKey(point.model) : null;
    for (const [groupKey, group] of groups) {
      group.classList.toggle("is-dim", Boolean(key && key !== groupKey));
      group.classList.toggle("is-active", key === groupKey);
    }
    for (const element of $("chart").querySelectorAll(".node")) {
      element.setAttribute("aria-pressed", String(element.dataset.slug === state.pinned));
    }
    for (const button of $("legend").querySelectorAll("button")) {
      button.classList.toggle("is-dim", Boolean(key && key !== button.dataset.series));
      button.setAttribute("aria-pressed", String(Boolean(state.pinned && key === button.dataset.series)));
    }
    guides?.replaceChildren();
    $("tooltip").hidden = !point;
    if (point) {
      const { sx, sy, color } = point;
      svgElement("line", { x1: 92, x2: sx, y1: sy, y2: sy, stroke: color }, guides);
      svgElement("line", { x1: sx, x2: sx, y1: sy, y2: 565, stroke: color }, guides);
      svgElement("text", { x: 80, y: sy + 4, "text-anchor": "end", fill: color }, guides, formatY(point.y));
      svgElement("text", { x: sx, y: 588, "text-anchor": "middle", fill: color }, guides, formatX(point.x));
      tooltip(point);
    }
    $("pin-status").textContent = state.pinned && point
      ? "Pinned: " + point.model.series + " · " + point.model.effort.toUpperCase() : "No line pinned";
    $("clear-highlight").disabled = !slug;
  };
  const renderChart = () => {
    const chart = $("chart");
    chart.replaceChildren();
    $("legend").replaceChildren();
    points = new Map();
    groups = new Map();
    const chosen = models.filter(model => state.selected.has(model.slug));
    const valid = chosen.filter(model =>
      finite(model.scores[state.benchmark]) && finite(valueFor(model, state.benchmark, state.x)));
    if (!valid.some(model => model.slug === state.pinned)) state.pinned = null;
    const unknown = [...state.selected].filter(slug => !bySlug.has(slug));
    const warnings = [...urlWarnings];
    if (unknown.length) warnings.push("Unknown model slugs: " + unknown.join(", "));
    const omitted = chosen.filter(model =>
      !finite(model.scores[state.benchmark]) || !finite(valueFor(model, state.benchmark, state.x)));
    if (omitted.length) {
      warnings.push(omitted.length + " selected " + (omitted.length === 1 ? "model" : "models") + " omitted:");
    }
    $("warnings").replaceChildren();
    if (warnings.length) {
      const summary = document.createElement("p");
      summary.textContent = warnings.join(" ");
      $("warnings").append(summary);
    }
    if (omitted.length) {
      const list = document.createElement("ul");
      for (const model of omitted) {
        const missing = [];
        if (!finite(model.scores[state.benchmark])) missing.push("benchmark score");
        if (!finite(valueFor(model, state.benchmark, state.x))) {
          missing.push(xInfo[state.x].label.split(" · ")[0].toLowerCase());
        }
        const item = document.createElement("li");
        item.dataset.model = model.slug;
        item.textContent = model.name + " — missing " + missing.join(" and ") + ".";
        list.append(item);
      }
      $("warnings").append(list);
    }
    $("warnings").hidden = !warnings.length;
    $("empty-state").hidden = valid.length > 0;
    $("empty-state").textContent = state.selected.size === 0
      ? "Select models from the dropdown to start comparing."
      : "No data for this combination. Choose another metric or import the matching benchmark export.";
    chart.hidden = !valid.length;
    const info = benchmarkInfo(state.benchmark);
    $("chart-title").textContent = info.label + " vs " + xInfo[state.x].label.split(" · ")[0].toLowerCase();
    $("metric-note").textContent = xInfo[state.x].note;
    $("point-count").textContent = valid.length + " effort nodes";
    updateModelCount();
    if (!valid.length) { guides = null; paintHighlight(); return; }
    const left = 92, right = 1190, top = 62, bottom = 565;
    const xPeak = Math.max(...valid.map(model => valueFor(model, state.benchmark, state.x)));
    const yPeak = Math.max(...valid.map(model => model.scores[state.benchmark]));
    const stepX = niceStep(xPeak, 5), stepY = niceStep(yPeak, 8);
    const maxX = Math.max(stepX, Math.ceil(xPeak / stepX) * stepX);
    const maxY = Math.max(stepY, Math.ceil(yPeak / stepY) * stepY);
    const sx = value => left + (xInfo[state.x].lower ? 1 - value / maxX : value / maxX) * (right - left);
    const sy = value => bottom - value / maxY * (bottom - top);
    for (let index = 0; index <= Math.round(maxY / stepY); index++) {
      const y = stepY * index, yPos = sy(y);
      svgElement("line", { x1: left, x2: right, y1: yPos, y2: yPos, class: "grid-line" }, chart);
      svgElement("text", { x: 80, y: yPos + 4, "text-anchor": "end", class: "axis-tick" }, chart, formatY(y));
    }
    for (let index = 0; index <= Math.round(maxX / stepX); index++) {
      const x = stepX * index, xPos = sx(x);
      svgElement("line", { x1: xPos, x2: xPos, y1: top, y2: bottom, class: "grid-line" }, chart);
      svgElement("text", { x: xPos, y: 588, "text-anchor": "middle", class: "axis-tick" }, chart, formatX(x));
    }
    svgElement("text", { id: "y-axis-label", x: left, y: 32, class: "axis-title" }, chart,
      info.label + (info.unit === "percent" ? " score · %" : " · points"));
    svgElement("text", { id: "x-axis-label", x: (left + right) / 2, y: 629,
      "text-anchor": "middle", class: "axis-title" }, chart, xInfo[state.x].label);
    svgElement("text", { x: right - 5, y: top + 20, "text-anchor": "end", class: "direction-label" },
      chart, { cost: "higher score, lower task cost ↗", tokens: "higher score, fewer tokens ↗",
        time: "higher score, less generation time ↗", price: "higher score, lower token price ↗",
        speed: "higher score, faster output ↗" }[state.x]);
    guides = svgElement("g", { class: "crosshair" }, chart);
    const grouped = new Map();
    for (const model of valid) {
      const key = seriesKey(model);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(model);
    }
    const providerCounts = new Map();
    const labelPositions = [];
    for (const [key, family] of grouped) {
      family.sort((a, b) => effortOrder.indexOf(a.effort) - effortOrder.indexOf(b.effort)
        || valueFor(a, state.benchmark, state.x) - valueFor(b, state.benchmark, state.x)
        || a.slug.localeCompare(b.slug));
      const provider = family[0].provider;
      const index = providerCounts.get(provider) || 0;
      providerCounts.set(provider, index + 1);
      const colors = palettes[provider] || palettes.other;
      const color = colors[index % colors.length];
      const group = svgElement("g", { class: "series", "data-series": key, "data-provider": provider }, chart);
      groups.set(key, group);
      const line = family.map(model => {
        const x = valueFor(model, state.benchmark, state.x), y = model.scores[state.benchmark];
        const point = { model, x, y, sx: sx(x), sy: sy(y), color };
        points.set(model.slug, point);
        return point;
      });
      if (line.length > 1) {
        svgElement("path", { d: line.map((point, i) =>
          (i ? "L" : "M") + point.sx + "," + point.sy).join(" "), stroke: color }, group);
      }
      for (const point of line) {
        const model = point.model;
        const element = svgElement("g", {
          class: "node", "data-slug": model.slug, tabindex: 0, role: "button",
          "aria-label": model.name + ", " + formatY(point.y) + ", " + formatX(point.x),
          "aria-pressed": "false",
        }, group);
        svgElement("circle", { cx: point.sx, cy: point.sy, r: 15, fill: "transparent" }, element);
        svgElement("circle", { class: "dot", cx: point.sx, cy: point.sy, r: 5.5, fill: color }, element);
        svgElement("text", { x: point.sx, y: point.sy + 20, fill: color,
          "text-anchor": "middle", class: "effort-label" }, element, model.effort.toUpperCase());
        svgElement("title", {}, element, model.name);
        const hover = () => { if (!state.pinned) { state.hovered = model.slug; paintHighlight(); } };
        element.addEventListener("pointerenter", hover);
        element.addEventListener("focus", hover);
        const leave = () => { state.hovered = null; paintHighlight(); };
        element.addEventListener("pointerleave", leave);
        element.addEventListener("blur", leave);
        element.addEventListener("click", () => pin(model.slug));
        element.addEventListener("keydown", event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            pin(model.slug);
          }
        });
      }
      const anchor = line[line.length - 1];
      const familyName = anchor.model.series.replace(" [DEMO]", "");
      const halfWidth = Math.min(familyName.length * 3.9, 155);
      const labelX = Math.min(right - halfWidth, Math.max(left + halfWidth, anchor.sx));
      let labelY = Math.max(25, anchor.sy - 25);
      for (let attempts = 0; attempts < 10; attempts++) {
        if (!labelPositions.some(position =>
          Math.abs(position.x - labelX) < position.width + halfWidth + 10
          && Math.abs(position.y - labelY) < 20)) break;
        labelY -= 22;
      }
      // If the top margin is crowded, move labels below their points.
      if (labelY < 20) labelY = anchor.sy + 42;
      labelPositions.push({ x: labelX, y: labelY, width: halfWidth });
      svgElement("text", { x: labelX, y: labelY, "text-anchor": "middle",
        fill: color, class: "family-label" }, group, familyName);
      const legend = document.createElement("button");
      legend.dataset.series = key;
      legend.setAttribute("aria-label", "Highlight " + anchor.model.series);
      const swatch = document.createElement("span");
      swatch.className = "legend-swatch";
      swatch.style.background = color;
      const label = document.createElement("span");
      label.textContent = anchor.model.series;
      legend.append(swatch, label);
      legend.addEventListener("click", () => pin(anchor.model.slug));
      $("legend").append(legend);
    }
    paintHighlight();
  };

  const refresh = () => { renderPicker(); renderChart(); syncURL(); };
  const download = (content, type, name) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $("action-status").textContent = "Saved " + name;
  };
  const safeJSON = value => JSON.stringify(value).replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
  const exportPayload = () => ({ ...report, savedState: savedState() });
  const csvCell = value => {
    let text = value == null ? "" : String(value);
    if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  $("save-html").addEventListener("click", () => {
    const clone = document.documentElement.cloneNode(true);
    clone.querySelector("#report-data").textContent = safeJSON(exportPayload());
    clone.querySelector("#models-panel").hidden = true;
    clone.querySelector("#tooltip").hidden = true;
    clone.querySelector("#link-fallback").hidden = true;
    download("<!doctype html>\n" + clone.outerHTML, "text/html", "llm-stats-view.html");
  });
  $("export-json").addEventListener("click", () => {
    download(JSON.stringify(exportPayload(), null, 2), "application/json", "llm-stats-data.json");
  });
  $("export-csv").addEventListener("click", () => {
    const header = ["slug", "name", "provider", "series", "effort", "benchmark", "score",
      "cost_per_task", "output_tokens_per_task", "time_per_task", "price_blended", "output_speed", "demo"];
    const rows = models.filter(model => state.selected.has(model.slug)).map(model => [
      model.slug, model.name, model.provider, model.series, model.effort, state.benchmark,
      model.scores[state.benchmark], model.cost_per_task[state.benchmark],
      model.output_tokens_per_task[state.benchmark], model.time_per_task[state.benchmark],
      model.pricing.blended, model.output_speed, report.demo,
    ]);
    download([header, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n") + "\r\n",
      "text/csv;charset=utf-8", "llm-stats-chart.csv");
  });
  $("copy-link").addEventListener("click", async () => {
    syncURL();
    try {
      await navigator.clipboard.writeText(location.href);
      $("action-status").textContent = "View URL copied. A local file URL works only where the same file exists.";
    } catch {
      $("link-fallback").hidden = false;
      $("view-url").value = location.href;
      $("view-url").focus();
      $("view-url").select();
    }
  });
  $("models-toggle").addEventListener("click", () => {
    if (!$("models-panel").hidden) { closePicker(); return; }
    renderPicker();
    $("models-panel").hidden = false;
    $("models-toggle").setAttribute("aria-expanded", "true");
    $("model-search").focus();
  });
  $("model-search").addEventListener("input", renderPicker);
  $("model-search").addEventListener("keydown", event => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      $("model-options").querySelector("input")?.focus();
    }
  });
  $("model-options").addEventListener("keydown", event => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Enter") return;
    const inputs = [...$("model-options").querySelectorAll("input")];
    const index = inputs.indexOf(document.activeElement);
    if (event.key === "Enter") {
      event.preventDefault();
      inputs[index]?.click();
    } else {
      event.preventDefault();
      inputs[(index + (event.key === "ArrowDown" ? 1 : -1) + inputs.length) % inputs.length]?.focus();
    }
  });
  $("clear-models").addEventListener("click", () => {
    state.selected.clear();
    state.hovered = null;
    refresh();
  });
  $("select-matches").addEventListener("click", () => {
    for (const model of matches()) state.selected.add(model.slug);
    refresh();
  });
  $("reset-models").addEventListener("click", () => {
    state.selected = new Set(defaults(report.config));
    state.hovered = null;
    state.pinned = null;
    $("preset").value = "";
    refresh();
  });
  for (const [index, preset] of (report.config.presets || []).entries()) {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = preset.name;
    $("preset").append(option);
  }
  $("preset").addEventListener("change", () => {
    const preset = report.config.presets[Number($("preset").value)];
    if (!preset || $("preset").value === "") return;
    state.selected = new Set(defaults({ ...report.config, ...preset }));
    if (preset.benchmark) state.benchmark = preset.benchmark;
    if (preset.x) state.x = preset.x;
    state.hovered = null;
    state.pinned = null;
    renderMetricControls();
    refresh();
  });
  const renderMetricControls = () => {
    $("benchmark").replaceChildren();
    for (const key of new Set([...Object.keys(report.benchmarks), state.benchmark])) {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = benchmarkInfo(key).label;
      $("benchmark").append(option);
    }
    $("benchmark").value = state.benchmark;
    $("x-metric").value = state.x;
  };
  $("benchmark").addEventListener("change", () => {
    state.benchmark = $("benchmark").value;
    state.hovered = null;
    urlWarnings = [];
    renderChart();
    syncURL();
  });
  $("x-metric").addEventListener("change", () => {
    state.x = $("x-metric").value;
    state.hovered = null;
    urlWarnings = [];
    renderChart();
    syncURL();
  });
  $("clear-highlight").addEventListener("click", clearHighlight);
  document.addEventListener("click", event => {
    if (!event.target.closest(".picker")) closePicker();
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    if (!$("models-panel").hidden) {
      closePicker();
      $("models-toggle").focus();
    } else clearHighlight();
  });
  window.addEventListener("popstate", () => {
    readState();
    renderMetricControls();
    refresh();
  });
  $("demo-banner").hidden = !report.demo;
  $("provenance").textContent = report.source + " · HTML generated " + report.generated_at
    + " · Data, scripts, and styles are embedded; no live browser requests.";
  readState();
  renderMetricControls();
  refresh();
})();
