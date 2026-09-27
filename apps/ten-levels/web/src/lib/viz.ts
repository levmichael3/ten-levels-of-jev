// @ts-nocheck
/* The Outputs panel renderer: typed answers as probability bars. Levels 1 to 5 show status,
   Answers, Received. Levels 6 to 10 render the agent window instead and reuse answerHTML in its modal. */

export const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const short = (s, n=220) => { s = typeof s === "string" ? s : JSON.stringify(s); return s.length > n ? s.slice(0,n)+" ..." : s; };
export const el = (html) => { const d = document.createElement("div"); d.innerHTML = html; return d.firstElementChild; };

/* Minimal markdown for agent text: bold, code, headings as bold lines, bullets. */
export function mdRender(text){
  const inline = s => esc(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>");
  let html = "", inList = false;
  for(const raw of text.split("\n")){
    const line = raw.trim();
    if(/^#{1,4}\s+/.test(line)){ if(inList){html+="</ul>";inList=false;} html += `<span class="md-b">${inline(line.replace(/^#{1,4}\s+/,""))}</span>`; }
    else if(/^[-*]\s+/.test(line)){ if(!inList){html+="<ul>";inList=true;} html += `<li>${inline(line.replace(/^[-*]\s+/,""))}</li>`; }
    else if(line === ""){ if(inList){html+="</ul>";inList=false;} }
    else { if(inList){html+="</ul>";inList=false;} html += `<div>${inline(line)}</div>`; }
  }
  if(inList) html += "</ul>";
  return `<div class="md">${html}</div>`;
}


/* Typed answer as probability bars. Also used by the Outputs panel. */
/** "is_urgent" -> "Is urgent", "has_repro_steps" -> "Has repro steps". */
export const humanize = (id) => { const t = String(id).replace(/_/g, " ").trim(); return t.charAt(0).toUpperCase() + t.slice(1); };

/** Ten 10% buckets, b0 (strong no) to b9 (strong yes); the stylesheet maps them magenta, yellow, mint. */
export const bucket = (p) => "b" + Math.min(9, Math.max(0, Math.floor(Number(p) * 10)));

/**
 * Polarity. The bucket scale runs magenta at 0 to mint at 1, which reads as bad to good. For these
 * questions and options a high answer is the bad outcome, so their color is flipped: yes on
 * "destructive intent" is magenta, "irreversible" at 1.00 is magenta. Level 1 keeps the plain scale.
 */
const NEGATIVE_QUESTIONS = new Set([
  "destructive_intent", "touches_outside_repo", "trapped", "ambiguous", "ambiguity",
  "security_risk", "complexity", "bad_practice", "severity", "frustration", "blast_radius", "danger", "reads_as_ai",
]);
const NEGATIVE_OPTIONS = new Set([
  "irreversible", "destructive", "external_side_effect", "rage_bait", "promo", "political_argument", "injection", "contradicts",
]);
const flip = (p, negative) => (negative ? 1 - p : p);

/** The value an answer's color should follow, with polarity applied. Shared with the run modal. */
export function signal(id, a){
  if(a.type === "noul") return flip(a.noul, NEGATIVE_QUESTIONS.has(id));
  if(a.type === "choice") return flip(a.confidence, NEGATIVE_OPTIONS.has(a.choice));
  const top = Object.keys(a.legend ?? {}).length - 1;
  return NEGATIVE_QUESTIONS.has(id) && top > 0 ? 1 - a.score / top : a.confidence;
}

const bar = (labelHtml, p, win, negative = false) => `<div class="bar-row"><span class="bar-label">${labelHtml}</span><div class="bar-track"><div class="bar-fill ${bucket(flip(p, negative))} ${win ? "win" : ""}" style="width:${Math.round(p*100)}%"></div></div><span class="bar-val">${Number(p).toFixed(2)}</span></div>`;

/** One typed answer. `lead` is the bar label for a noul (the returned yes or no); choice and score show only the pick and the bars. */
export function answerHTML(id, a, lead = ""){
  if(a.type === "noul"){
    const negative = NEGATIVE_QUESTIONS.has(id);
    return `<div class="ans ${bucket(signal(id, a))}"><div class="ans-head"><b>${esc(humanize(id))}?</b></div>${bar(lead, a.noul, true, negative)}</div>`;
  }
  if(a.type === "choice"){
    const rows = Object.entries(a.probabilities).sort((x,y)=>y[1]-x[1]).slice(0,8).map(([k,p]) => bar(esc(k), p, k===a.choice, NEGATIVE_OPTIONS.has(k))).join("");
    return `<div class="ans ${bucket(signal(id, a))}"><div class="ans-head"><b>${esc(humanize(id))}:</b> <span class="ans-pick">${esc(a.choice)}</span><span class="ans-sub">confidence ${a.confidence.toFixed(2)}</span></div>${rows}</div>`;
  }
  const top = Math.max(...Object.values(a.probabilities).map(Number));
  const nearest = a.legend?.[String(Math.round(a.score))] ?? "";
  const negative = NEGATIVE_QUESTIONS.has(id);
  const levels = Object.keys(a.probabilities).length - 1;
  // A negative score colors each level by how bad that level is, so the winning high level runs magenta.
  const rows = Object.entries(a.probabilities).map(([k,p]) => negative
    ? bar(esc(short(a.legend?.[k] ?? k, 40)), p, Number(p)===top, false).replace(/bar-fill b\d/, `bar-fill ${bucket(1 - Number(k) / Math.max(1, levels))}`)
    : bar(esc(short(a.legend?.[k] ?? k, 40)), p, Number(p)===top)).join("");
  return `<div class="ans ${bucket(signal(id, a))}"><div class="ans-head"><b>${esc(humanize(id))}:</b> <span class="ans-pick">${a.score.toFixed(2)} of ${Object.keys(a.legend).length - 1}</span><span class="ans-sub">${esc(short(nearest, 80))}, confidence ${a.confidence.toFixed(2)}</span></div>${rows}</div>`;
}
