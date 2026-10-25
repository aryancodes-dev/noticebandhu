// NoticeBandhu — pure extraction logic. No API, no server.
// Guarded so it can be tested in Node: DOM code only runs in a browser.
function analyzeNotice(text) {
  const t = (text || "").trim();
  const lower = t.toLowerCase();

  // Category by keyword (first match wins)
  const categories = [
    { key: "exam-form", words: ["exam form", "examination form", "form fill", "form fill-up", "form fillup"], label: "Exam Form" },
    { key: "fee", words: ["fee", "fees", "payment", "tuition"], label: "Fee Payment" },
    { key: "scholarship", words: ["scholarship", "stipend"], label: "Scholarship" },
    { key: "holiday", words: ["holiday", "closed", "vacation"], label: "Holiday / Closure" },
    { key: "admission", words: ["admission", "enrolment", "enrollment"], label: "Admission" },
    { key: "result", words: ["result", "marksheet", "grade card"], label: "Result" },
  ];
  let category = { key: "general", label: "College Notice" };
  for (const c of categories) {
    if (c.words.some(w => lower.includes(w))) { category = c; break; }
  }

  // Dates: 15/11/2026, 15-11-2026, 15 November 2026, Nov 15, 2026, "last date: ..."
  const months = { january:0, february:1, march:2, april:3, may:4, june:5, july:6, august:7, september:8, october:9, november:10, december:11, jan:0, feb:1, mar:2, apr:3, jun:5, jul:6, aug:7, sep:8, sept:8, oct:9, nov:10, dec:11 };
  let lastDate = null, lastDateText = null;
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
    /(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{4})/i,
    /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2}),?\s+(\d{4})/i,
  ];
  // Prefer a date near "last date / deadline / before / by"
  const deadlineMatch = t.match(/(?:last date|deadline|before|by)\D{0,30}?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s+[A-Za-z]+\s+\d{4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})/i);
  const dateStr = deadlineMatch ? deadlineMatch[1] : null;
  function parseDate(s) {
    if (!s) return null;
    let m = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (m) { let y = +m[3]; if (y < 100) y += 2000; return new Date(y, +m[2]-1, +m[1]); }
    m = s.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    if (m && months[m[2].toLowerCase()] !== undefined) return new Date(+m[3], months[m[2].toLowerCase()], +m[1]);
    m = s.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
    if (m && months[m[1].toLowerCase()] !== undefined) return new Date(+m[3], months[m[1].toLowerCase()], +m[2]);
    return null;
  }
  if (dateStr) { lastDate = parseDate(dateStr); lastDateText = dateStr; }
  else {
    for (const re of datePatterns) {
      const m = t.match(re);
      if (m) { lastDate = parseDate(m[0]); lastDateText = m[0]; break; }
    }
  }

  // Fees: ₹5,000 / Rs. 5000 / INR 5000 / 5000/-
  const feeMatch = t.match(/(?:₹|Rs\.?|INR)\s*([\d,]+(?:\.\d+)?)|([\d,]+)\s*\/-/);
  const fee = feeMatch ? (feeMatch[1] || feeMatch[2]).replace(/,/g, "") : null;

  // Who must act
  let who = "All students";
  if (/all students|students of|bca|b\.tech|semester/i.test(t)) {
    const m = t.match(/(all\s+[^.\n]{0,40}students?|students?\s+of\s+[^.\n]{0,40}|BCA\s+[^.\n]{0,30})/i);
    if (m) who = m[0].trim();
  }
  if (/parents?|guardians?/i.test(t)) who += " (parents/guardians also need to know)";

  // What: first meaningful line (skip bare headers like "NOTICE")
  const lines = t.split("\n").map(s => s.trim()).filter(Boolean)
    .filter(s => !/^(notice|circular|notification|office order)$/i.test(s));
  let what = lines[0] || "College notice";
  if (what.length > 120) what = what.slice(0, 117) + "...";

  let daysLeft = null;
  if (lastDate && !isNaN(lastDate)) {
    const today = new Date(); today.setHours(0,0,0,0);
    const d = new Date(lastDate); d.setHours(0,0,0,0);
    daysLeft = Math.round((d - today) / 86400000);
  }

  return { category: category.label, categoryKey: category.key, what, lastDate, lastDateText, fee, who, daysLeft, text: t };
}

function simpleSummary(r) {
  let s = `This notice is about ${r.category.toLowerCase()}. ${r.what}.`;
  if (r.lastDateText) s += ` Last date: ${r.lastDateText}.`;
  if (r.daysLeft !== null) {
    if (r.daysLeft < 0) s += ` That date has already passed.`;
    else if (r.daysLeft === 0) s += ` Today is the last date — do it today.`;
    else s += ` You have ${r.daysLeft} day${r.daysLeft === 1 ? "" : "s"} left.`;
  }
  if (r.fee) s += ` Amount: ₹${Number(r.fee).toLocaleString("en-IN")}.`;
  s += ` Who should act: ${r.who}.`;
  return s;
}

// Template translations for common categories. Dates/fees are filled in
// from the real notice — the template itself is fixed, not machine translation.
function translatedSummary(r, lang) {
  const date = r.lastDateText || "the last date given in the notice";
  const fee = r.fee ? `₹${Number(r.fee).toLocaleString("en-IN")}` : "";
  const templates = {
    "exam-form": {
      bn: `পরীক্ষার ফর্ম পূরণ করতে হবে। শেষ তারিখ: ${date}। ${fee ? `ফি: ${fee}। ` : ""}দয়া করে সময়ের মধ্যে ফর্মটি পূরণ করুন।`,
      hi: `परीक्षा फॉर्म भरना है। अंतिम तिथि: ${date}। ${fee ? `शुल्क: ${fee}। ` : ""}कृपया समय पर फॉर्म भरें।`,
    },
    fee: {
      bn: `কলেজের ফি জমা দিতে হবে। শেষ তারিখ: ${date}। ${fee ? `টাকা: ${fee}। ` : ""}দয়া করে সময়ের মধ্যে জমা দিন।`,
      hi: `कॉलेज की फीस जमा करनी है। अंतिम तिथि: ${date}। ${fee ? `राशि: ${fee}। ` : ""}कृपया समय पर जमा करें।`,
    },
    scholarship: {
      bn: `বৃত্তির জন্য আবেদন করতে হবে। শেষ তারিখ: ${date}। দয়া করে সময়ের মধ্যে আবেদন করুন।`,
      hi: `छात्रवृत्ति के लिए आवेदन करना है। अंतिम तिथि: ${date}। कृपया समय पर आवेदन करें।`,
    },
  };
  const tpl = templates[r.categoryKey];
  if (tpl && tpl[lang]) return tpl[lang];
  if (lang === "bn") return `এই নোটিশটি ${r.category} সম্পর্কে। শেষ তারিখ: ${date}। দয়া করে সময়ের মধ্যে কাজটি করুন।`;
  if (lang === "hi") return `यह नोटिस ${r.category} के बारे में है। अंतिम तिथि: ${date}। कृपया समय पर काम पूरा करें।`;
  return simpleSummary(r);
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { analyzeNotice, simpleSummary, translatedSummary };
}

if (typeof document !== "undefined") {
  const $ = id => document.getElementById(id);
  const samples = {
    exam: "NOTICE\nAll BCA 1st Semester students are hereby informed that the Examination Form fill-up for Semester I will start from 20 October 2026. The last date for form submission is 15/11/2026. Examination fee is Rs. 1200/-. Students must submit the form online before the last date.",
    fee: "NOTICE\nAll students of BCA are informed that the tuition fee for the odd semester must be paid before 30 November 2026. The fee amount is ₹25,000. Late payment will attract a fine. Parents are requested to ensure timely payment.",
    scholarship: "NOTICE\nApplications are invited for the State Scholarship 2026. Eligible students must apply online. The last date for application is 10 December 2026. Students must submit documents to the college office.",
  };
  let current = null;
  document.querySelectorAll("[data-sample]").forEach(b => {
    b.onclick = () => { $("notice").value = samples[b.dataset.sample]; };
  });
  $("analyze-btn").onclick = () => {
    const text = $("notice").value;
    if (!text.trim()) { alert("Please paste a notice first, or tap a sample notice."); return; }
    current = analyzeNotice(text);
    const r = current;
    $("result").hidden = false;
    $("r-category").textContent = r.category;
    $("r-what").textContent = r.what;
    $("r-date").textContent = r.lastDateText || "Not found in this notice — check the notice again";
    $("r-days").textContent = r.daysLeft === null ? "" : r.daysLeft < 0 ? "⚠️ Date has passed" : r.daysLeft === 0 ? "🔴 Today is the last date!" : `⏳ ${r.daysLeft} day${r.daysLeft === 1 ? "" : "s"} left`;
    $("r-fee").textContent = r.fee ? "₹" + Number(r.fee).toLocaleString("en-IN") : "No amount found in this notice";
    $("r-who").textContent = r.who;
    $("r-simple").textContent = simpleSummary(r);
    $("r-bn").textContent = translatedSummary(r, "bn");
    $("r-hi").textContent = translatedSummary(r, "hi");
    $("r-wa").value = `📢 College Notice — ${r.category}\n${simpleSummary(r)}\n\nForwarded via NoticeBandhu — please check the original notice too.`;
    $("result").scrollIntoView({ behavior: "smooth", block: "start" });
  };
  $("copy-btn").onclick = async () => {
    try { await navigator.clipboard.writeText($("r-wa").value); $("copy-btn").textContent = "Copied ✓"; setTimeout(() => $("copy-btn").textContent = "Copy WhatsApp Message", 2000); }
    catch (e) { $("r-wa").select(); document.execCommand("copy"); }
  };
  $("speak-btn").onclick = () => {
    if (!current) return;
    speechSynthesis.cancel();
    const lang = $("speak-lang").value;
    const text = lang === "en" ? simpleSummary(current) : translatedSummary(current, lang);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "bn" ? "bn-IN" : lang === "hi" ? "hi-IN" : "en-IN";
    speechSynthesis.speak(u);
  };
  $("stop-btn").onclick = () => speechSynthesis.cancel();
}
