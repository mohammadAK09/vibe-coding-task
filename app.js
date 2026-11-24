(() => {
  "use strict";

  const BLOOM = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];

  const TEXT = {
    English: {
      levels: { Remember: "Remember", Understand: "Understand", Apply: "Apply", Analyze: "Analyze", Evaluate: "Evaluate", Create: "Create" },
      objectives: "Learning objectives",
      quiz: "Check for understanding",
      copy: "Copy objectives",
      copied: "Copied",
      saved: "Saved to the Google Sheets log by n8n.",
      notSaved: "Generated, but n8n could not save this one to the Google Sheets log.",
      correct: "Correct.",
      incorrect: "Not quite.",
      none: "No objective at this level"
    },
    Arabic: {
      levels: { Remember: "تذكّر", Understand: "فهم", Apply: "تطبيق", Analyze: "تحليل", Evaluate: "تقويم", Create: "ابتكار" },
      objectives: "الأهداف التعليمية",
      quiz: "أسئلة التحقق من الفهم",
      copy: "نسخ الأهداف",
      copied: "تم النسخ",
      saved: "تم حفظ النتيجة في سجل Google Sheets عبر n8n.",
      notSaved: "تم إنشاء المحتوى، لكن لم يتم حفظه في سجل Google Sheets.",
      correct: "إجابة صحيحة.",
      incorrect: "إجابة غير صحيحة.",
      none: "لا يوجد هدف في هذا المستوى"
    }
  };

  const $ = (id) => document.getElementById(id);
  const form = $("builder");
  const btn = $("submitBtn");
  const statusEl = $("status");
  const output = $("output");
  const empty = $("empty");
  const config = window.APP_CONFIG || {};

  // Header link to the repository
  if (config.GITHUB_REPO_URL && !config.GITHUB_REPO_URL.includes("YOUR-")) {
    $("repoLink").href = config.GITHUB_REPO_URL;
  } else {
    $("repoLink").hidden = true;
  }

  let lastResult = null;
  let lastLang = "English";

  function setStatus(msg, isError = false) {
    statusEl.textContent = msg;
    statusEl.classList.toggle("error", isError);
  }

  function normalizeLevel(value) {
    const v = String(value || "").trim().toLowerCase().slice(0, 4);
    return BLOOM.find((b) => b.toLowerCase().slice(0, 4) === v) || "Understand";
  }

  function renderStairs(list, objectives, lang) {
    const t = TEXT[lang];
    const byLevel = {};
    objectives.forEach((o) => {
      const level = normalizeLevel(o.bloom);
      (byLevel[level] = byLevel[level] || []).push(String(o.text || ""));
    });

    list.innerHTML = "";
    // Top of the staircase is the highest level
    [...BLOOM].reverse().forEach((level) => {
      const i = BLOOM.indexOf(level);
      const li = document.createElement("li");
      li.className = "step" + (byLevel[level] ? " filled" : "") + (byLevel[level] && i >= 3 ? " deep" : "");
      li.style.setProperty("--i", i);

      const tag = document.createElement("span");
      tag.className = "step-level";
      tag.textContent = t.levels[level];

      const body = document.createElement("div");
      (byLevel[level] || [objectives.length ? t.none : ""]).forEach((txt) => {
        const p = document.createElement("p");
        p.className = "step-text";
        p.textContent = txt;
        body.appendChild(p);
      });

      li.append(tag, body);
      list.appendChild(li);
    });
  }

  function renderQuiz(container, quiz, lang) {
    const t = TEXT[lang];
    container.innerHTML = "";
    quiz.forEach((q, qi) => {
      const options = Array.isArray(q.options) ? q.options : [];
      const answer = Number.isInteger(q.answer) && q.answer >= 0 && q.answer < options.length ? q.answer : 0;

      const card = document.createElement("div");
      card.className = "q";

      const text = document.createElement("p");
      text.className = "q-text";
      text.id = "q" + qi;
      text.textContent = (qi + 1) + ". " + String(q.question || "");

      const opts = document.createElement("div");
      opts.className = "options";
      opts.setAttribute("role", "group");
      opts.setAttribute("aria-labelledby", text.id);

      const feedback = document.createElement("p");
      feedback.className = "feedback";
      feedback.setAttribute("aria-live", "polite");

      options.forEach((opt, oi) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "option";
        b.textContent = String(opt);
        b.addEventListener("click", () => {
          [...opts.children].forEach((child, ci) => {
            child.disabled = true;
            if (ci === answer) child.classList.add("correct");
          });
          const right = oi === answer;
          if (!right) b.classList.add("wrong");
          feedback.innerHTML = "";
          const verdict = document.createElement("strong");
          verdict.className = right ? "ok" : "no";
          verdict.textContent = right ? t.correct : t.incorrect;
          feedback.append(verdict, " " + String(q.explanation || ""));
        });
        opts.appendChild(b);
      });

      card.append(text, opts, feedback);
      container.appendChild(card);
    });
  }

  function render(data, lang) {
    const t = TEXT[lang];
    lastResult = data;
    lastLang = lang;

    output.lang = lang === "Arabic" ? "ar" : "en";
    output.dir = lang === "Arabic" ? "rtl" : "ltr";

    $("resultTitle").textContent = data.title || "";
    $("resultSummary").textContent = data.summary || "";
    $("objectivesHeading").textContent = t.objectives;
    $("quizHeading").textContent = t.quiz;
    $("copyBtn").textContent = t.copy;

    const stairs = $("stairs");
    renderStairs(stairs, data.objectives, lang);
    stairs.classList.remove("animate");
    void stairs.offsetWidth; // restart animation
    stairs.classList.add("animate");

    renderQuiz($("quiz"), Array.isArray(data.quiz) ? data.quiz : [], lang);

    const saved = $("savedNote");
    saved.textContent = data.saved ? t.saved : t.notSaved;
    saved.classList.toggle("ok", !!data.saved);

    empty.hidden = true;
    output.hidden = false;
    $("resultTitle").focus({ preventScroll: true });
    if (window.matchMedia("(max-width: 860px)").matches) {
      $("results").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // Empty-state staircase
  renderStairs($("emptyStairs"), [], "English");

  $("copyBtn").addEventListener("click", async () => {
    if (!lastResult) return;
    const t = TEXT[lastLang];
    const lines = [lastResult.title, ""].concat(
      lastResult.objectives.map((o, i) => `${i + 1}. ${o.text} (${t.levels[normalizeLevel(o.bloom)]})`)
    );
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      $("copyBtn").textContent = t.copied;
      setTimeout(() => ($("copyBtn").textContent = t.copy), 2000);
    } catch {
      setStatus("Copying is blocked in this browser. Select the text and copy it manually.", true);
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form));
    Object.keys(data).forEach((k) => (data[k] = String(data[k]).trim()));

    const missing = ["topic", "audience"].filter((k) => !data[k]);
    ["topic", "audience"].forEach((k) => $(k).setAttribute("aria-invalid", missing.includes(k) ? "true" : "false"));
    if (missing.length) {
      setStatus("Add a topic and an audience to generate objectives.", true);
      $(missing[0]).focus();
      return;
    }

    const url = config.N8N_WEBHOOK_URL || "";
    if (!url || url.includes("YOUR-")) {
      setStatus("The n8n webhook URL is not set yet. Add it to config.js.", true);
      return;
    }

    btn.disabled = true;
    btn.textContent = "Generating…";
    setStatus("The n8n workflow is writing your objectives. This usually takes 5 to 20 seconds.");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: controller.signal
      });
      if (!res.ok) throw new Error(`The n8n workflow returned an error (${res.status}). Try again in a moment.`);

      let json = await res.json();
      if (Array.isArray(json)) json = json[0];
      if (!json || !Array.isArray(json.objectives) || !json.objectives.length) {
        throw new Error("The workflow replied without objectives. Try again with a more specific topic.");
      }

      render(json, data.language === "Arabic" ? "Arabic" : "English");
      setStatus("");
    } catch (err) {
      let msg = err.message;
      if (err.name === "AbortError") msg = "The workflow took longer than 60 seconds. Try again.";
      else if (err instanceof TypeError) msg = "Could not reach the n8n workflow. Check that it is active and its webhook allows this site (CORS).";
      setStatus(msg, true);
    } finally {
      clearTimeout(timer);
      btn.disabled = false;
      btn.textContent = "Generate objectives";
    }
  });
})();
