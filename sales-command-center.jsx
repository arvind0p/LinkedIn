import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Papa from "papaparse";
import {
  LayoutDashboard, Users, Building2, Kanban, MessageSquare, Settings as SettingsIcon,
  Search, Plus, ArrowLeft, Sparkles, Camera, CheckCircle2, Circle, Trash2, Copy,
  Flame, AlertTriangle, Clock, Target, ChevronDown, X, Loader2, Send, FileText,
  Library, TrendingUp, Link2, Mail, Phone, Video, MoreHorizontal, RefreshCw,
  Upload, FileSpreadsheet, ShieldAlert, Info
} from "lucide-react";

/* ============================== CONSTANTS ============================== */

const STAGES = [
  "New Lead", "Research Pending", "Researched", "Connection Request Ready",
  "Connection Request Sent", "Connection Accepted", "First Message Sent",
  "Waiting for Reply", "Engaged", "Requirement Identified", "Qualified",
  "Meeting Suggested", "Meeting Scheduled", "Proposal Requested", "Proposal Sent",
  "Negotiation", "Won", "Lost", "Not Interested", "Follow Up Later",
  "No Response", "Do Not Contact"
];

const LEAD_TYPES = [
  "Direct Client", "Potential Client", "Referral Partner", "Strategic Partner",
  "Agency Partner", "Outsourcing Partner", "White-label Partner", "Job Opportunity",
  "Networking", "High Intent Lead", "Low Intent Lead", "Not Relevant", "Other"
];

const PURPOSES = [
  "Generate direct business", "Identify a technology requirement",
  "Explore website opportunity", "Explore digital marketing opportunity",
  "Explore CRM opportunity", "Explore AI automation opportunity",
  "Explore custom software opportunity", "Explore referral partnership",
  "Explore agency partnership", "Explore outsourcing", "Explore white-label partnership",
  "Understand their business", "Respond to a public requirement",
  "Explore job opportunity", "Build professional relationship", "Other"
];

const CLICKNIFY_SERVICES = [
  "Website development", "Web design", "Custom software development", "CRM solutions",
  "AI automation", "Business automation", "Digital marketing", "SEO", "Google Ads",
  "Meta Ads", "Performance marketing", "Lead generation", "Branding",
  "School management software", "Other / none identified"
];

const PERSON_CLASSIFICATIONS = [
  "Founder", "CEO", "Co-Founder", "Director", "Partner", "C-Level", "VP", "Head",
  "Manager", "Decision Maker", "Influencer", "Recruiter", "Other"
];

const CHANNELS = ["LinkedIn", "Email", "WhatsApp", "Phone", "Meeting", "Other"];

const INTENTS = [
  "Interested", "Very Interested", "Curious", "Neutral", "Busy", "Not Interested",
  "Soft Rejection", "Strong Rejection", "Asking for Information", "Asking for Pricing",
  "Asking for Meeting", "Asking for Clarification", "Buying Signal",
  "Partnership Interest", "Job Interest"
];

const OBJECTION_INTENTS = ["Not Interested", "Soft Rejection", "Strong Rejection", "Busy"];

const HEALTH_OPTIONS = ["Healthy", "Nurturing", "At Risk", "Dead", "Hot"];
const HEALTH_COLOR = { Healthy: "#1a7f4b", Nurturing: "#b8860b", "At Risk": "#c0752c", Dead: "#8a8781", Hot: "#e8590c" };

const ACTIONS = [
  "Message now", "Wait", "Follow up later", "Ask a question", "Pitch",
  "Move to a call", "Send email", "Send details", "Send proposal", "Stop pursuing"
];

const BUYING_SIGNALS = ["None", "Low", "Medium", "High"];
const PRIORITIES = ["High", "Medium", "Low"];
const PRIORITY_COLOR = { High: "#e8590c", Medium: "#b8860b", Low: "#8a8781" };
const RELATIONSHIP_STATUS = ["Not Connected", "Request Pending", "Connected", "Cold", "Warm"];
const DECISION_AUTHORITY = ["Unknown", "Low", "Medium", "High"];

const MESSAGE_KINDS = ["Connection Request", "First Message", "Follow-up", "Custom"];
const MESSAGE_STYLES = ["Professional", "Conversational", "Direct", "Warm", "Discovery"];

const DEFAULT_ARVIND_PROFILE = `Arvind Chaudhary, Sales and Operations at Clicknify. Responsibilities: sales and business development, domestic and international outreach, LinkedIn prospecting, Sales Navigator lead generation, decision maker identification, client communication, lead qualification, closing, sales operations, team management, CRM management, process improvement. Manages an 8 member team, handles 100+ qualified leads a month, manages 50+ active client accounts, improved team conversion by 30 percent, redesigned follow up workflows and cut duplicate effort by 60 percent. Portfolio: https://arvind0p.github.io/web/`;

const DEFAULT_CLICKNIFY_CONTEXT = `Clicknify (clicknify.com) is a performance marketing and premium web design studio. Services: website development, web design, custom software development, CRM solutions, AI automation, business automation, digital marketing, SEO, Google Ads, Meta Ads, performance marketing, lead generation, branding, school management software. Only mention the one service that is genuinely relevant to a specific prospect. Never list multiple services in one message.`;

const DEFAULT_WRITING_STYLE = `Write like a real Indian sales professional talking to international business people. Natural, human, confident, conversational, simple, specific, direct, short where possible. Not overly polished, not robotic, no corporate jargon, never obviously AI generated. Never use the em dash character anywhere, not once. Use commas, full stops or brackets instead. Avoid these phrases completely: "I hope this message finds you well", "I came across your esteemed profile", "I was intrigued by your journey", "I would love to explore synergies", "let's unlock mutual value", "I believe there could be immense synergies".`;

const DEFAULT_LINKEDIN_NAME = "";

/* ============================== UTILS ============================== */

function uid() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch (e) { return d; }
}

function fmtDateTime(d) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch (e) { return d; }
}

function daysUntil(d) {
  if (!d) return null;
  const diff = new Date(d + "T00:00:00") - new Date(todayISO() + "T00:00:00");
  return Math.round(diff / 86400000);
}

function normalize(s) {
  return (s || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
}

async function loadKey(key, fallback) {
  try {
    const r = await window.storage.get(key, false);
    return r && r.value ? JSON.parse(r.value) : fallback;
  } catch (e) {
    return fallback;
  }
}

async function saveKey(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value), false);
  } catch (e) {
    console.error("storage save failed", key, e);
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

/* ---- LinkedIn official export (CSV) import ---- */

function parseCSVFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => resolve(results.data || []),
      error: reject,
      skipEmptyLines: true
    });
  });
}

function findHeaderRowIndex(matrix) {
  for (let i = 0; i < Math.min(matrix.length, 12); i++) {
    const row = (matrix[i] || []).map(c => (c || "").toString().toLowerCase());
    if (row.some(c => /first\s*name/.test(c)) || row.some(c => /conversation\s*id/.test(c)) ||
      (row.some(c => /^from$/.test(c.trim())) && row.some(c => /^to$/.test(c.trim())))) {
      return i;
    }
  }
  return 0;
}

function findCol(header, regexes) {
  for (let i = 0; i < header.length; i++) {
    const h = (header[i] || "").toString().toLowerCase();
    if (regexes.some(r => r.test(h))) return i;
  }
  return -1;
}

function importConnectionsCSV(matrix, companies, people) {
  const hIdx = findHeaderRowIndex(matrix);
  const header = matrix[hIdx] || [];
  const rows = matrix.slice(hIdx + 1).filter(r => r && r.some(c => c && c.toString().trim()));
  const iFirst = findCol(header, [/first\s*name/]);
  const iLast = findCol(header, [/last\s*name/]);
  const iEmail = findCol(header, [/email/]);
  const iCompany = findCol(header, [/^company$/, /company/]);
  const iPosition = findCol(header, [/position/, /title/]);
  const iDate = findCol(header, [/connected/]);
  const iUrl = findCol(header, [/url/, /profile/]);

  let newCompanies = [...companies];
  let newPeople = [...people];
  let created = 0, skipped = 0;

  rows.forEach(r => {
    const first = iFirst >= 0 ? (r[iFirst] || "").toString().trim() : "";
    const last = iLast >= 0 ? (r[iLast] || "").toString().trim() : "";
    const name = (first + " " + last).trim();
    if (!name) return;
    const companyName = iCompany >= 0 ? (r[iCompany] || "").toString().trim() : "";
    const position = iPosition >= 0 ? (r[iPosition] || "").toString().trim() : "";
    const url = iUrl >= 0 ? (r[iUrl] || "").toString().trim() : "";
    const email = iEmail >= 0 ? (r[iEmail] || "").toString().trim() : "";
    const connectedOn = iDate >= 0 ? (r[iDate] || "").toString().trim() : "";

    const dupe = newPeople.find(p => (url && p.linkedinUrl && normalize(p.linkedinUrl) === normalize(url)) || (p.name && p.name.trim().toLowerCase() === name.toLowerCase()));
    if (dupe) { skipped++; return; }

    let companyId = "";
    if (companyName) {
      let comp = newCompanies.find(c => c.name && c.name.trim().toLowerCase() === companyName.toLowerCase());
      if (!comp) {
        comp = { id: uid(), name: companyName, website: "", linkedinUrl: "", industry: "", location: "", size: "", businessOverview: "", digitalPresence: "", growthSignals: "", existingProviders: "", researchNotes: "" };
        newCompanies.push(comp);
      }
      companyId = comp.id;
    }
    newPeople.push({
      id: uid(), name, title: position, linkedinUrl: url, companyId, classification: "", location: "",
      department: "", decisionAuthority: "Unknown", background: "", interests: "", conversationStarters: "",
      relationshipStatus: "Connected", notes: email ? "Email (from LinkedIn export): " + email : "", connectedOn
    });
    created++;
  });

  return { companies: newCompanies, people: newPeople, created, skipped };
}

function importMessagesCSV(matrix, myName, people, leads, autoCreatePeople) {
  const hIdx = findHeaderRowIndex(matrix);
  const header = matrix[hIdx] || [];
  const rows = matrix.slice(hIdx + 1).filter(r => r && r.some(c => c && c.toString().trim()));
  const iFrom = findCol(header, [/^from$/, /sender/]);
  const iTo = findCol(header, [/^to$/, /recipient/]);
  const iDate = findCol(header, [/date/]);
  const iContent = findCol(header, [/content/, /message/, /body/]);

  let newPeople = [...people];
  let addedByLead = {};
  let added = 0, skippedNoLead = 0, skippedUnknown = 0, createdPeople = 0;
  const myNameLower = (myName || "").trim().toLowerCase();

  rows.forEach(r => {
    const from = iFrom >= 0 ? (r[iFrom] || "").toString().trim() : "";
    const to = iTo >= 0 ? (r[iTo] || "").toString().trim() : "";
    const content = iContent >= 0 ? (r[iContent] || "").toString().trim() : "";
    const date = iDate >= 0 ? (r[iDate] || "").toString().trim() : "";
    if (!content) return;
    const isFromMe = myNameLower && from.trim().toLowerCase() === myNameLower;
    const counterpart = (isFromMe ? to : from).trim();
    if (!counterpart) return;

    let person = newPeople.find(p => p.name && p.name.trim().toLowerCase() === counterpart.toLowerCase());
    if (!person && autoCreatePeople) {
      person = { id: uid(), name: counterpart, title: "", linkedinUrl: "", companyId: "", classification: "", location: "", department: "", decisionAuthority: "Unknown", background: "", interests: "", conversationStarters: "", relationshipStatus: "Connected", notes: "" };
      newPeople.push(person);
      createdPeople++;
    }
    if (!person) { skippedUnknown++; return; }

    const lead = leads.find(l => l.personId === person.id);
    if (!lead) { skippedNoLead++; return; }

    const sig = content.slice(0, 80);
    const alreadyThere = (lead.conversation || []).some(c => c.message && c.message.slice(0, 80) === sig);
    if (alreadyThere) return;

    if (!addedByLead[lead.id]) addedByLead[lead.id] = [];
    addedByLead[lead.id].push({ id: uid(), date: date || new Date().toISOString(), channel: "LinkedIn", sender: isFromMe ? "Arvind" : "Them", message: content, intent: "" });
    added++;
  });

  return { people: newPeople, addedByLead, added, skippedNoLead, skippedUnknown, createdPeople };
}

/* ============================== AI LAYER ============================== */

async function callClaude(system, content, { json = false } = {}) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system,
        messages: [{ role: "user", content }]
      })
    });
    const data = await res.json();
    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").trim();
    if (json) {
      const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      try { return JSON.parse(clean); } catch (e) { return { _raw: text, _parseError: true }; }
    }
    return text;
  } catch (e) {
    console.error("Claude call failed", e);
    return json ? { _error: true } : "";
  }
}

function buildSystem(settings) {
  return [
    "You are a sales research and outreach assistant working only for Arvind Chaudhary.",
    "ABOUT ARVIND: " + (settings.arvindProfile || DEFAULT_ARVIND_PROFILE),
    "ABOUT CLICKNIFY: " + (settings.clicknifyContext || DEFAULT_CLICKNIFY_CONTEXT),
    "WRITING STYLE: " + (settings.writingStyle || DEFAULT_WRITING_STYLE),
    "HARD RULES: Never invent facts about a person or company that are not given to you. If information is missing, say so plainly instead of guessing. Never use the em dash character anywhere in any output. Keep responses concise."
  ].join("\n\n");
}

function summarizeLead(lead, company, person) {
  const lines = [];
  lines.push("PERSON: " + (person?.name || "unknown") + (person?.title ? ", " + person.title : "") + (person?.classification ? " (" + person.classification + ")" : ""));
  if (person?.location) lines.push("Location: " + person.location);
  if (person?.background) lines.push("Background: " + person.background);
  if (person?.interests) lines.push("Interests / recent activity: " + person.interests);
  lines.push("COMPANY: " + (company?.name || "unknown"));
  if (company?.industry) lines.push("Industry: " + company.industry);
  if (company?.businessOverview) lines.push("Business overview: " + company.businessOverview);
  if (company?.digitalPresence) lines.push("Digital presence: " + company.digitalPresence);
  if (company?.growthSignals) lines.push("Growth signals: " + company.growthSignals);
  lines.push("LEAD TYPE: " + (lead.leadType || "unset"));
  lines.push("PURPOSE OF CONTACT: " + (lead.purpose || "unset") + (lead.purposeNote ? " - " + lead.purposeNote : ""));
  lines.push("PIPELINE STAGE: " + lead.stage);
  if (lead.whyThisLead) lines.push("Why this lead: " + lead.whyThisLead);
  if (lead.research) {
    lines.push("RESEARCH - Verified: " + (lead.research.verified || []).join(" | "));
    lines.push("RESEARCH - Inferred: " + (lead.research.inferred || []).join(" | "));
    lines.push("RESEARCH - Unknown: " + (lead.research.unknown || []).join(" | "));
    if (lead.research.conversationAngle) lines.push("Best conversation angle: " + lead.research.conversationAngle);
    if (lead.research.opportunityService) lines.push("Identified service opportunity: " + lead.research.opportunityService);
  }
  if (lead.notes?.length) {
    lines.push("NOTES:");
    lead.notes.slice(-5).forEach(n => lines.push("- " + n.text));
  }
  if (lead.conversation?.length) {
    lines.push("CONVERSATION HISTORY (most recent last):");
    lead.conversation.slice(-10).forEach(c => {
      lines.push("[" + fmtDate(c.date) + " | " + c.channel + " | " + c.sender + (c.intent ? " | intent: " + c.intent : "") + "] " + c.message);
    });
  } else {
    lines.push("CONVERSATION HISTORY: none yet, no message has been sent.");
  }
  return lines.join("\n");
}

function summarizeLeadShort(lead, company, person) {
  const last = lead.conversation?.length ? lead.conversation[lead.conversation.length - 1] : null;
  return `${person?.name || "Unknown"} at ${company?.name || "unknown company"} | stage: ${lead.stage} | health: ${lead.health} | buying signal: ${lead.buyingSignal} | last activity: ${last ? last.sender + " said: " + last.message.slice(0, 140) : "none"}`;
}

async function aiRunResearch(rawNotes, lead, company, person, settings) {
  const system = buildSystem(settings) + "\n\nTASK: Organize the raw research notes below into structured findings. Respond with ONLY valid JSON, no markdown fences, in this exact shape:\n{\"verified\":[\"short fact\"],\"inferred\":[\"short reasonable inference, labeled as such\"],\"unknown\":[\"what cannot be determined\"],\"conversationAngle\":\"one natural specific conversation opener\",\"opportunityService\":\"exactly one Clicknify service, or the words none identified\",\"whyThisLead\":\"2 to 3 lines\",\"avoid\":\"1 line on what not to say\"}. Keep each array to at most 5 short items. Verified means directly stated in the notes. If there is no obvious pain point, say so honestly in whyThisLead and make conversationAngle a genuine discovery question instead of a forced sales angle.";
  const user = `Person: ${person?.name || "unknown"}, ${person?.title || "role unknown"} at ${company?.name || "unknown company"}.\n\nRaw notes pasted by Arvind:\n${rawNotes}`;
  return callClaude(system, user, { json: true });
}

async function aiScoreLead(lead, company, person, settings) {
  const system = buildSystem(settings) + "\n\nTASK: Score this lead from 0 to 100 based only on the information given: decision maker authority, industry relevance to Clicknify, strength of Clicknify fit, recent activity or buying signal evidence, and general company relevance. Respond with ONLY valid JSON: {\"score\": number, \"breakdown\": [{\"label\":\"...\",\"points\": number}]}. Points in breakdown must sum to score. Never invent evidence, if a factor is unknown give it 0 and say why in the label.";
  return callClaude(system, summarizeLead(lead, company, person), { json: true });
}

async function aiNextBestAction(lead, company, person, settings) {
  const system = buildSystem(settings) + "\n\nTASK: Decide the single next best action for this lead, chosen from exactly this list: " + ACTIONS.join(", ") + ". Respond with ONLY valid JSON: {\"action\":\"one item from the list, verbatim\",\"why\":\"2 to 4 lines grounded only in the conversation history and notes given\"}. If the prospect said they would get back and nothing new has happened since, recommend Wait. If there is no conversation yet and research is not done, recommend the honest next step instead of inventing urgency.";
  return callClaude(system, summarizeLead(lead, company, person), { json: true });
}

const MESSAGE_KIND_INSTRUCTIONS = {
  "Connection Request": "Write a LinkedIn connection request note. Keep it under 300 characters. Reference something specific and genuine, never generic flattery. Do not pitch anything yet.",
  "First Message": "Write the first message after the connection request was accepted. Check the purpose of contact and research before deciding whether to open with a genuine question or a light, specific observation. Do not force a pitch unless there is already a clear buying signal.",
  "Follow-up": "Write a follow-up message. Read the full conversation history carefully first. Never repeat information already discussed. Only send this if there is a genuine new reason to reach out, otherwise write a short, low-pressure check-in.",
  "Custom": "Write a natural next message appropriate to wherever this conversation currently stands."
};

async function aiGenerateMessage(kind, style, lead, company, person, settings) {
  const system = buildSystem(settings) + "\n\nTASK: " + MESSAGE_KIND_INSTRUCTIONS[kind] + "\nTone: " + style + ".\nRespond with ONLY the message text itself. No preamble, no labels, no quotation marks around it.";
  return callClaude(system, summarizeLead(lead, company, person), { json: false });
}

async function aiCheckQuality(message, settings) {
  const system = buildSystem(settings) + "\n\nTASK: You are a blunt editor. Score how human and natural this message sounds. Respond with ONLY valid JSON: {\"humanScore\": number, \"issues\": [\"short issue\"], \"suggestions\": [\"short practical fix\"]}. Flag if it is: too salesy, too long, too generic, sounds AI written, too formal, over complimentary, full of corporate jargon, unclear in purpose, or pushy. Keep each array to at most 5 items.";
  return callClaude(system, "Message to review:\n" + message, { json: true });
}

async function aiAnalyzeScreenshot(base64, mediaType, lead, company, person, settings) {
  const system = buildSystem(settings) + "\n\nTASK: Read the conversation shown in this screenshot. Respond with ONLY valid JSON in this exact shape: {\"transcript\":\"short plain summary of what was said, both sides\",\"hinglish\":\"same summary in simple Hindi and Hinglish, one or two lines\",\"intent\":\"exactly one of " + INTENTS.join(", ") + "\",\"recommendation\":\"exactly one of " + ACTIONS.join(", ") + "\",\"recommendedMessage\":\"a ready to send reply, empty string if recommendation is Wait or Stop pursuing\",\"why\":\"1 to 2 lines\"}.";
  const content = [
    { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
    { type: "text", text: "Context for this lead:\n" + summarizeLead(lead, company, person) + "\n\nAnalyze the attached conversation screenshot." }
  ];
  return callClaude(system, content, { json: true });
}

async function aiObjectionGuidance(objectionText, settings) {
  const system = buildSystem(settings) + "\n\nTASK: The prospect raised an objection or pushback. Respond with ONLY valid JSON: {\"whatItMeans\":\"1 to 2 lines\",\"approach\":\"1 to 2 lines\",\"avoid\":\"1 line\",\"suggestedReply\":\"ready to send reply text\"}. Never attack a competitor or existing agency. Never pressure the prospect.";
  return callClaude(system, "Objection or pushback from the prospect:\n" + objectionText, { json: true });
}

async function aiDailyBrief(leads, companies, people, settings) {
  const system = buildSystem(settings) + "\n\nTASK: Write a short daily sales brief for Arvind, 6 to 10 lines, plain text, no markdown headers, no bullet symbols, no em dash. Cover: how many hot conversations, follow ups due, leads needing research, high intent leads and meetings. Name the single top priority lead by name and say why in one line. If any lead should be avoided right now, name that lead and say why in one line.";
  const findCompany = id => companies.find(c => c.id === id);
  const findPerson = id => people.find(p => p.id === id);
  const user = leads.map(l => summarizeLeadShort(l, findCompany(l.companyId), findPerson(l.personId))).join("\n");
  return callClaude(system, user || "No leads yet.", { json: false });
}

/* ============================== SMALL UI ATOMS ============================== */

function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
      :root {
        --ink: #111110; --paper: #fafaf8; --signal: #e8590c; --signal-soft: #fbe3d3;
        --line: #e6e3dc; --slate: #706c63; --slate-soft: #a9a49a; --card: #ffffff;
      }
      .cn-root { font-family: 'Inter', sans-serif; background: var(--paper); color: var(--ink); }
      .cn-display { font-family: 'Instrument Serif', serif; }
      .cn-mono { font-family: 'JetBrains Mono', monospace; }
      .cn-card { background: var(--card); border: 1px solid var(--line); border-radius: 10px; }
      .cn-input, .cn-select, .cn-textarea {
        width: 100%; background: var(--paper); border: 1px solid var(--line); border-radius: 6px;
        padding: 8px 10px; font-size: 13px; font-family: 'Inter', sans-serif; color: var(--ink); outline: none;
      }
      .cn-input:focus, .cn-select:focus, .cn-textarea:focus { border-color: var(--signal); }
      .cn-textarea { resize: vertical; min-height: 70px; }
      .cn-btn {
        display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500;
        padding: 7px 13px; border-radius: 6px; border: 1px solid var(--line); background: var(--card);
        color: var(--ink); cursor: pointer; transition: all .12s ease; white-space: nowrap;
      }
      .cn-btn:hover { border-color: var(--slate-soft); }
      .cn-btn:disabled { opacity: .5; cursor: not-allowed; }
      .cn-btn-primary { background: var(--signal); border-color: var(--signal); color: #fff; }
      .cn-btn-primary:hover { background: #cf4c0a; }
      .cn-btn-ghost { border-color: transparent; background: transparent; }
      .cn-btn-ghost:hover { background: var(--signal-soft); }
      .cn-badge {
        display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600;
        padding: 2px 8px; border-radius: 100px; font-family: 'JetBrains Mono', monospace; letter-spacing: .02em;
      }
      .cn-nav-item {
        display: flex; align-items: center; gap: 10px; padding: 9px 14px; border-radius: 7px;
        font-size: 13px; font-weight: 500; color: #d8d4cb; cursor: pointer; transition: background .12s;
      }
      .cn-nav-item:hover { background: #232220; }
      .cn-nav-item.active { background: var(--signal); color: #fff; }
      .cn-nba-box {
        border: 1.5px solid var(--signal); background: var(--signal-soft); border-radius: 10px; padding: 18px;
      }
      .cn-scroll::-webkit-scrollbar { height: 8px; width: 8px; }
      .cn-scroll::-webkit-scrollbar-thumb { background: #d8d4cb; border-radius: 4px; }
      .cn-fade-in { animation: cnFadeIn .15s ease; }
      @keyframes cnFadeIn { from { opacity: 0; transform: translateY(2px);} to { opacity: 1; transform: translateY(0);} }
    `}</style>
  );
}

function Btn({ children, onClick, variant, disabled, loading, title, type }) {
  const cls = "cn-btn" + (variant === "primary" ? " cn-btn-primary" : variant === "ghost" ? " cn-btn-ghost" : "");
  return (
    <button className={cls} onClick={onClick} disabled={disabled || loading} title={title} type={type || "button"}>
      {loading ? <Loader2 size={13} className="animate-spin" /> : null}
      {children}
    </button>
  );
}

function Field({ label, children, hint }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--slate)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".04em" }}>{label}</div>
      {children}
      {hint ? <div style={{ fontSize: 11, color: "var(--slate-soft)", marginTop: 3 }}>{hint}</div> : null}
    </div>
  );
}

function TextIn(props) { return <input className="cn-input" {...props} />; }
function TextArea(props) { return <textarea className="cn-textarea" {...props} />; }
function Sel({ value, onChange, options, placeholder }) {
  return (
    <select className="cn-select" value={value || ""} onChange={e => onChange(e.target.value)}>
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Badge({ children, color, bg }) {
  return <span className="cn-badge" style={{ color: color || "var(--ink)", background: bg || "#f0eee8" }}>{children}</span>;
}

function PriorityDot({ p }) {
  return <span style={{ width: 7, height: 7, borderRadius: 99, background: PRIORITY_COLOR[p] || "#ccc", display: "inline-block" }} />;
}

function HealthBadge({ h }) {
  if (!h) return null;
  return <Badge color="#fff" bg={HEALTH_COLOR[h] || "#999"}>{h === "Hot" ? <Flame size={11} /> : null}{h}</Badge>;
}

function Section({ title, icon, right, children, hint }) {
  return (
    <div className="cn-card" style={{ padding: 16, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: hint ? 4 : 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700 }}>
          {icon}{title}
        </div>
        {right}
      </div>
      {hint && <div style={{ fontSize: 11.5, color: "var(--slate-soft)", marginBottom: 10 }}>{hint}</div>}
      {children}
    </div>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(17,17,16,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 50, padding: "40px 16px", overflowY: "auto" }} onClick={onClose}>
      <div className="cn-card cn-fade-in" style={{ width: "100%", maxWidth: wide ? 720 : 480, padding: 20 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{title}</div>
          <button className="cn-btn cn-btn-ghost" onClick={onClose}><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div style={{ padding: "28px 10px", textAlign: "center", color: "var(--slate-soft)", fontSize: 13 }}>{text}</div>;
}

/* ============================== APP ============================== */

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [companies, setCompanies] = useState([]);
  const [people, setPeople] = useState([]);
  const [leads, setLeads] = useState([]);
  const [library, setLibrary] = useState([]);
  const [settings, setSettings] = useState({ arvindProfile: DEFAULT_ARVIND_PROFILE, clicknifyContext: DEFAULT_CLICKNIFY_CONTEXT, writingStyle: DEFAULT_WRITING_STYLE, myLinkedinName: DEFAULT_LINKEDIN_NAME });
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [showNewLead, setShowNewLead] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const [c, p, l, lib, s] = await Promise.all([
        loadKey("crm_companies", []),
        loadKey("crm_people", []),
        loadKey("crm_leads", []),
        loadKey("crm_message_library", []),
        loadKey("crm_settings", null)
      ]);
      setCompanies(c); setPeople(p); setLeads(l); setLibrary(lib);
      if (s) setSettings(s);
      setLoaded(true);
    })();
  }, []);

  const persistCompanies = useCallback((next) => { setCompanies(next); saveKey("crm_companies", next); }, []);
  const persistPeople = useCallback((next) => { setPeople(next); saveKey("crm_people", next); }, []);
  const persistLeads = useCallback((next) => { setLeads(next); saveKey("crm_leads", next); }, []);
  const persistLibrary = useCallback((next) => { setLibrary(next); saveKey("crm_message_library", next); }, []);
  const persistSettings = useCallback((next) => { setSettings(next); saveKey("crm_settings", next); }, []);

  const updateLead = useCallback((id, patch) => {
    setLeads(prev => {
      const next = prev.map(l => l.id === id ? { ...l, ...(typeof patch === "function" ? patch(l) : patch), updatedAt: new Date().toISOString() } : l);
      saveKey("crm_leads", next);
      return next;
    });
  }, []);

  const updateCompany = useCallback((id, patch) => {
    setCompanies(prev => { const next = prev.map(c => c.id === id ? { ...c, ...patch } : c); saveKey("crm_companies", next); return next; });
  }, []);

  const updatePerson = useCallback((id, patch) => {
    setPeople(prev => { const next = prev.map(p => p.id === id ? { ...p, ...patch } : p); saveKey("crm_people", next); return next; });
  }, []);

  const companyById = useCallback(id => companies.find(c => c.id === id), [companies]);
  const personById = useCallback(id => people.find(p => p.id === id), [people]);

  function openLead(id) { setSelectedLeadId(id); setTab("leadDetail"); }
  function openCompany(id) { setSelectedCompanyId(id); setTab("companyDetail"); }
  function openPerson(id) { setSelectedPersonId(id); setTab("personDetail"); }

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.trim().toLowerCase();
    const leadHits = leads.filter(l => {
      const c = companyById(l.companyId), p = personById(l.personId);
      return (c?.name || "").toLowerCase().includes(q) || (p?.name || "").toLowerCase().includes(q) || (p?.title || "").toLowerCase().includes(q) || (l.purpose || "").toLowerCase().includes(q);
    }).slice(0, 8);
    return leadHits;
  }, [search, leads, companyById, personById]);

  if (!loaded) {
    return (
      <div className="cn-root" style={{ minHeight: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <GlobalStyles /><Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  const NAV = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { id: "pipeline", label: "Pipeline", icon: <Kanban size={16} /> },
    { id: "leads", label: "Leads", icon: <Target size={16} /> },
    { id: "companies", label: "Companies", icon: <Building2 size={16} /> },
    { id: "people", label: "People", icon: <Users size={16} /> },
    { id: "import", label: "Import from LinkedIn", icon: <Upload size={16} /> },
    { id: "library", label: "Message Library", icon: <Library size={16} /> },
    { id: "settings", label: "Settings", icon: <SettingsIcon size={16} /> }
  ];

  return (
    <div className="cn-root" style={{ display: "flex", minHeight: 600, borderRadius: 12, overflow: "hidden", border: "1px solid var(--line)" }}>
      <GlobalStyles />

      {/* Sidebar */}
      <div style={{ width: 208, background: "var(--ink)", padding: "18px 10px", flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "0 8px 18px 8px" }}>
          <div className="cn-display" style={{ color: "#fff", fontSize: 20, lineHeight: 1 }}>Sales Command</div>
          <div className="cn-mono" style={{ color: "var(--signal)", fontSize: 11, marginTop: 3 }}>ARVIND · CLICKNIFY</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {NAV.map(n => (
            <div key={n.id} className={"cn-nav-item" + (tab === n.id || (n.id === "leads" && tab === "leadDetail") || (n.id === "companies" && tab === "companyDetail") || (n.id === "people" && tab === "personDetail") ? " active" : "")}
              onClick={() => setTab(n.id)}>
              {n.icon}{n.label}
            </div>
          ))}
        </div>
        <div style={{ padding: "10px 8px 2px 8px", color: "#8a877e", fontSize: 10.5, lineHeight: 1.5 }}>
          Personal sales intelligence tool. Data stored to your Claude account only.
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid var(--line)", background: "var(--card)", position: "relative" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: 9, color: "var(--slate-soft)" }} />
            <input className="cn-input" style={{ paddingLeft: 30 }} placeholder="Search leads, people, companies..." value={search} onChange={e => setSearch(e.target.value)} />
            {searchResults && searchResults.length > 0 && (
              <div className="cn-card cn-fade-in" style={{ position: "absolute", top: 36, left: 0, right: 0, zIndex: 30, maxHeight: 260, overflowY: "auto" }}>
                {searchResults.map(l => {
                  const c = companyById(l.companyId), p = personById(l.personId);
                  return (
                    <div key={l.id} style={{ padding: "9px 12px", fontSize: 12.5, cursor: "pointer", borderBottom: "1px solid var(--line)" }}
                      onClick={() => { openLead(l.id); setSearch(""); }}>
                      <b>{p?.name || "Unnamed"}</b> · {c?.name || "Unknown company"} <span style={{ color: "var(--slate-soft)" }}>· {l.stage}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {searchResults && searchResults.length === 0 && (
              <div className="cn-card" style={{ position: "absolute", top: 36, left: 0, right: 0, zIndex: 30, padding: 12, fontSize: 12.5, color: "var(--slate-soft)" }}>No matches.</div>
            )}
          </div>
          <div style={{ flex: 1 }} />
          <Btn variant="primary" onClick={() => setShowNewLead(true)}><Plus size={14} />New Lead</Btn>
        </div>

        {/* Content */}
        <div className="cn-scroll" style={{ flex: 1, overflowY: "auto", padding: 20, background: "var(--paper)" }}>
          {tab === "dashboard" && <Dashboard leads={leads} companies={companies} people={people} companyById={companyById} personById={personById} openLead={openLead} settings={settings} />}
          {tab === "pipeline" && <PipelineBoard leads={leads} companyById={companyById} personById={personById} updateLead={updateLead} openLead={openLead} />}
          {tab === "leads" && <LeadsList leads={leads} companyById={companyById} personById={personById} openLead={openLead} />}
          {tab === "companies" && <CompaniesList companies={companies} leads={leads} openCompany={openCompany} />}
          {tab === "people" && <PeopleList people={people} companies={companies} openPerson={openPerson} companyById={companyById} />}
          {tab === "import" && (
            <ImportView
              companies={companies} people={people} leads={leads} settings={settings}
              persistCompanies={persistCompanies} persistPeople={persistPeople} persistLeads={persistLeads}
              persistSettings={persistSettings}
            />
          )}
          {tab === "library" && <MessageLibraryView library={library} persistLibrary={persistLibrary} />}
          {tab === "settings" && <SettingsView settings={settings} persistSettings={persistSettings} />}
          {tab === "leadDetail" && selectedLeadId && (
            <LeadDetail
              lead={leads.find(l => l.id === selectedLeadId)}
              company={companyById(leads.find(l => l.id === selectedLeadId)?.companyId)}
              person={personById(leads.find(l => l.id === selectedLeadId)?.personId)}
              updateLead={updateLead}
              updateCompany={updateCompany}
              updatePerson={updatePerson}
              settings={settings}
              library={library} persistLibrary={persistLibrary}
              back={() => setTab("leads")}
              openCompany={openCompany} openPerson={openPerson}
              onDelete={() => { persistLeads(leads.filter(l => l.id !== selectedLeadId)); setTab("leads"); }}
            />
          )}
          {tab === "companyDetail" && selectedCompanyId && (
            <CompanyDetail
              company={companies.find(c => c.id === selectedCompanyId)}
              people={people.filter(p => p.companyId === selectedCompanyId)}
              leads={leads.filter(l => l.companyId === selectedCompanyId)}
              updateCompany={updateCompany}
              personById={personById}
              openLead={openLead} openPerson={openPerson}
              back={() => setTab("companies")}
            />
          )}
          {tab === "personDetail" && selectedPersonId && (
            <PersonDetail
              person={people.find(p => p.id === selectedPersonId)}
              company={companyById(people.find(p => p.id === selectedPersonId)?.companyId)}
              leads={leads.filter(l => l.personId === selectedPersonId)}
              updatePerson={updatePerson}
              openLead={openLead}
              back={() => setTab("people")}
            />
          )}
        </div>
      </div>

      {showNewLead && (
        <NewLeadModal
          companies={companies} people={people}
          onClose={() => setShowNewLead(false)}
          onCreate={({ company, person, lead }) => {
            let finalCompanies = companies, finalPeople = people;
            if (company._new) { finalCompanies = [...companies, company]; persistCompanies(finalCompanies); }
            if (person._new) { finalPeople = [...people, person]; persistPeople(finalPeople); }
            const newLeads = [...leads, lead];
            persistLeads(newLeads);
            setShowNewLead(false);
            openLead(lead.id);
          }}
        />
      )}
    </div>
  );
}

/* ============================== DASHBOARD ============================== */

function Dashboard({ leads, companies, people, companyById, personById, openLead, settings }) {
  const [brief, setBrief] = useState("");
  const [briefLoading, setBriefLoading] = useState(false);

  const stats = useMemo(() => {
    const s = {
      total: leads.length,
      newLeads: leads.filter(l => l.stage === "New Lead").length,
      researched: leads.filter(l => l.stage === "Researched").length,
      connSent: leads.filter(l => l.stage === "Connection Request Sent").length,
      connAccepted: leads.filter(l => l.stage === "Connection Accepted").length,
      active: leads.filter(l => !["Won", "Lost", "Not Interested", "Do Not Contact"].includes(l.stage)).length,
      waitingReply: leads.filter(l => l.stage === "Waiting for Reply").length,
      followUpsDue: 0,
      highIntent: leads.filter(l => l.buyingSignal === "High").length,
      hot: leads.filter(l => l.health === "Hot").length,
      meetings: leads.filter(l => ["Meeting Suggested", "Meeting Scheduled"].includes(l.stage)).length,
      proposals: leads.filter(l => ["Proposal Requested", "Proposal Sent"].includes(l.stage)).length,
      won: leads.filter(l => l.stage === "Won").length,
      lost: leads.filter(l => l.stage === "Lost").length
    };
    let due = 0;
    leads.forEach(l => (l.tasks || []).forEach(t => { if (t.status !== "Done" && t.dueDate && t.dueDate <= todayISO()) due++; }));
    s.followUpsDue = due;
    return s;
  }, [leads]);

  const urgentReplies = leads.filter(l => l.conversation?.length && l.conversation[l.conversation.length - 1].sender === "Them" && !["Won", "Lost", "Not Interested", "Do Not Contact"].includes(l.stage));
  const followUpTasks = [];
  leads.forEach(l => (l.tasks || []).forEach(t => { if (t.status !== "Done" && t.dueDate && t.dueDate <= todayISO()) followUpTasks.push({ lead: l, task: t }); }));
  const highIntentLeads = leads.filter(l => l.buyingSignal === "High");
  const researchNeeded = leads.filter(l => ["New Lead", "Research Pending"].includes(l.stage));
  const connReady = leads.filter(l => l.stage === "Connection Request Ready");
  const upcomingMeetings = leads.filter(l => l.meetingDate && daysUntil(l.meetingDate) !== null && daysUntil(l.meetingDate) >= 0 && daysUntil(l.meetingDate) <= 7);
  const atRisk = leads.filter(l => ["At Risk", "Dead"].includes(l.health));

  const StatCard = ({ label, value, accent }) => (
    <div className="cn-card" style={{ padding: "14px 16px", minWidth: 120 }}>
      <div className="cn-mono" style={{ fontSize: 24, fontWeight: 600, color: accent ? "var(--signal)" : "var(--ink)" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--slate)", marginTop: 2 }}>{label}</div>
    </div>
  );

  const PriorityBlock = ({ icon, title, items, render, empty }) => (
    <div className="cn-card" style={{ padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, fontWeight: 700, marginBottom: 10 }}>{icon}{title} <span className="cn-mono" style={{ color: "var(--slate-soft)", fontWeight: 500 }}>({items.length})</span></div>
      {items.length === 0 ? <div style={{ fontSize: 12, color: "var(--slate-soft)" }}>{empty}</div> :
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{items.slice(0, 6).map(render)}</div>}
    </div>
  );

  const leadRow = (l) => {
    const c = companyById(l.companyId), p = personById(l.personId);
    return (
      <div key={l.id} onClick={() => openLead(l.id)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12.5 }}
        onMouseEnter={e => e.currentTarget.style.background = "#f4f2ec"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        <span><PriorityDot p={l.priority} /> &nbsp;<b>{p?.name || "Unnamed"}</b> <span style={{ color: "var(--slate-soft)" }}>· {c?.name || ""}</span></span>
        <span className="cn-mono" style={{ fontSize: 10.5, color: "var(--slate-soft)" }}>{l.stage}</span>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 16 }}>
        <div className="cn-display" style={{ fontSize: 26 }}>Today</div>
        <Btn loading={briefLoading} onClick={async () => { setBriefLoading(true); const b = await aiDailyBrief(leads, companies, people, settings); setBrief(b); setBriefLoading(false); }}>
          <Sparkles size={13} />Generate AI Daily Brief
        </Btn>
      </div>

      {brief && (
        <div className="cn-nba-box" style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--signal)", marginBottom: 6, textTransform: "uppercase", letterSpacing: ".04em" }}>Arvind's Daily Sales Brief</div>
          <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{brief}</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard label="Total Leads" value={stats.total} />
        <StatCard label="New Leads" value={stats.newLeads} />
        <StatCard label="Researched" value={stats.researched} />
        <StatCard label="Conn. Sent" value={stats.connSent} />
        <StatCard label="Conn. Accepted" value={stats.connAccepted} />
        <StatCard label="Active Convos" value={stats.active} />
        <StatCard label="Waiting Reply" value={stats.waitingReply} />
        <StatCard label="Follow-ups Due" value={stats.followUpsDue} accent={stats.followUpsDue > 0} />
        <StatCard label="High Intent" value={stats.highIntent} accent={stats.highIntent > 0} />
        <StatCard label="Hot" value={stats.hot} accent={stats.hot > 0} />
        <StatCard label="Meetings" value={stats.meetings} />
        <StatCard label="Proposals" value={stats.proposals} />
        <StatCard label="Won" value={stats.won} />
        <StatCard label="Lost" value={stats.lost} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <PriorityBlock icon={<Flame size={14} color="var(--signal)" />} title="Urgent Replies" items={urgentReplies} empty="Nothing waiting on you." render={leadRow} />
        <PriorityBlock icon={<Clock size={14} />} title="Follow-ups Due" items={followUpTasks} empty="No follow-ups due today."
          render={({ lead, task }) => (
            <div key={task.id} onClick={() => openLead(lead.id)} style={{ padding: "6px 8px", borderRadius: 6, cursor: "pointer", fontSize: 12.5 }}
              onMouseEnter={e => e.currentTarget.style.background = "#f4f2ec"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              {task.text} <span style={{ color: "var(--slate-soft)" }}>· {personById(lead.personId)?.name || ""}</span>
            </div>
          )} />
        <PriorityBlock icon={<Target size={14} />} title="High Intent Leads" items={highIntentLeads} empty="None flagged yet." render={leadRow} />
        <PriorityBlock icon={<Search size={14} />} title="Research Required" items={researchNeeded} empty="All caught up." render={leadRow} />
        <PriorityBlock icon={<Link2 size={14} />} title="Connection Requests Ready" items={connReady} empty="Nothing queued." render={leadRow} />
        <PriorityBlock icon={<Video size={14} />} title="Meetings (next 7 days)" items={upcomingMeetings} empty="Nothing scheduled." render={leadRow} />
        <PriorityBlock icon={<AlertTriangle size={14} color="var(--signal)" />} title="At Risk / Going Cold" items={atRisk} empty="Nothing going cold." render={leadRow} />
      </div>
    </div>
  );
}

/* ============================== PIPELINE ============================== */

function PipelineBoard({ leads, companyById, personById, updateLead, openLead }) {
  function onDrop(e, stage) {
    const id = e.dataTransfer.getData("text/plain");
    if (id) updateLead(id, { stage });
  }
  return (
    <div>
      <div className="cn-display" style={{ fontSize: 26, marginBottom: 14 }}>Pipeline</div>
      <div className="cn-scroll" style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 10 }}>
        {STAGES.map(stage => {
          const items = leads.filter(l => l.stage === stage);
          return (
            <div key={stage} style={{ width: 210, flexShrink: 0 }} onDragOver={e => e.preventDefault()} onDrop={e => onDrop(e, stage)}>
              <div style={{ padding: "6px 4px", fontSize: 11.5, fontWeight: 700, color: "var(--slate)", display: "flex", justifyContent: "space-between" }}>
                <span>{stage}</span><span className="cn-mono" style={{ color: "var(--slate-soft)" }}>{items.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 40 }}>
                {items.map(l => {
                  const c = companyById(l.companyId), p = personById(l.personId);
                  return (
                    <div key={l.id} draggable onDragStart={e => e.dataTransfer.setData("text/plain", l.id)}
                      className="cn-card" style={{ padding: 10, cursor: "grab" }} onClick={() => openLead(l.id)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{p?.name || "Unnamed"}</div>
                        <PriorityDot p={l.priority} />
                      </div>
                      <div style={{ fontSize: 11, color: "var(--slate)", marginTop: 2 }}>{c?.name || "Unknown company"}</div>
                      <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
                        {l.score ? <Badge>{l.score}/100</Badge> : null}
                        {l.health ? <HealthBadge h={l.health} /> : null}
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && <div style={{ fontSize: 11, color: "var(--slate-soft)", padding: "6px 4px" }}>—</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== LEADS LIST ============================== */

function LeadsList({ leads, companyById, personById, openLead }) {
  const [q, setQ] = useState("");
  const [fStage, setFStage] = useState("");
  const [fPriority, setFPriority] = useState("");
  const [fType, setFType] = useState("");

  const filtered = leads.filter(l => {
    const c = companyById(l.companyId), p = personById(l.personId);
    const text = ((c?.name || "") + " " + (p?.name || "") + " " + (p?.title || "")).toLowerCase();
    if (q && !text.includes(q.toLowerCase())) return false;
    if (fStage && l.stage !== fStage) return false;
    if (fPriority && l.priority !== fPriority) return false;
    if (fType && l.leadType !== fType) return false;
    return true;
  });

  return (
    <div>
      <div className="cn-display" style={{ fontSize: 26, marginBottom: 14 }}>Leads</div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ minWidth: 200 }}><TextIn placeholder="Search leads..." value={q} onChange={e => setQ(e.target.value)} /></div>
        <div style={{ width: 190 }}><Sel value={fStage} onChange={setFStage} options={STAGES} placeholder="All stages" /></div>
        <div style={{ width: 140 }}><Sel value={fPriority} onChange={setFPriority} options={PRIORITIES} placeholder="All priorities" /></div>
        <div style={{ width: 180 }}><Sel value={fType} onChange={setFType} options={LEAD_TYPES} placeholder="All lead types" /></div>
      </div>
      <div className="cn-card">
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.4fr 1fr 1fr .8fr .8fr .8fr", padding: "9px 14px", fontSize: 11, fontWeight: 700, color: "var(--slate)", borderBottom: "1px solid var(--line)" }}>
          <div>Person</div><div>Company</div><div>Stage</div><div>Type</div><div>Priority</div><div>Score</div><div>Health</div>
        </div>
        {filtered.length === 0 && <EmptyState text="No leads match. Click New Lead to add one." />}
        {filtered.map(l => {
          const c = companyById(l.companyId), p = personById(l.personId);
          return (
            <div key={l.id} onClick={() => openLead(l.id)}
              style={{ display: "grid", gridTemplateColumns: "1.6fr 1.4fr 1fr 1fr .8fr .8fr .8fr", padding: "10px 14px", fontSize: 12.5, borderBottom: "1px solid var(--line)", cursor: "pointer", alignItems: "center" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f4f2ec"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ fontWeight: 600 }}>{p?.name || "Unnamed"}<div style={{ fontWeight: 400, color: "var(--slate)", fontSize: 11 }}>{p?.title}</div></div>
              <div>{c?.name || "-"}</div>
              <div style={{ fontSize: 11 }}>{l.stage}</div>
              <div style={{ fontSize: 11 }}>{l.leadType}</div>
              <div><PriorityDot p={l.priority} /> <span style={{ fontSize: 11 }}>{l.priority}</span></div>
              <div className="cn-mono" style={{ fontSize: 11 }}>{l.score || "-"}</div>
              <div><HealthBadge h={l.health} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== NEW LEAD MODAL ============================== */

function NewLeadModal({ companies, people, onClose, onCreate }) {
  const [companyMode, setCompanyMode] = useState("new");
  const [existingCompanyId, setExistingCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [personName, setPersonName] = useState("");
  const [personTitle, setPersonTitle] = useState("");
  const [personLinkedin, setPersonLinkedin] = useState("");
  const [leadType, setLeadType] = useState("Potential Client");
  const [purpose, setPurpose] = useState("");
  const [purposeNote, setPurposeNote] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dupWarning, setDupWarning] = useState(null);

  function checkDupes() {
    const dupPerson = people.find(p => (personLinkedin && p.linkedinUrl && normalize(p.linkedinUrl) === normalize(personLinkedin)) || (personName && p.name && p.name.trim().toLowerCase() === personName.trim().toLowerCase()));
    const dupCompany = companyMode === "new" && companies.find(c => (companyWebsite && c.website && normalize(c.website) === normalize(companyWebsite)) || (companyName && c.name && c.name.trim().toLowerCase() === companyName.trim().toLowerCase()));
    if (dupPerson || dupCompany) { setDupWarning({ dupPerson, dupCompany }); return true; }
    setDupWarning(null);
    return false;
  }

  function submit(force) {
    if (!force && checkDupes()) return;
    let company;
    if (companyMode === "existing") {
      company = companies.find(c => c.id === existingCompanyId);
    } else {
      company = { id: uid(), name: companyName || "Unnamed company", website: companyWebsite, industry: "", location: "", size: "", businessOverview: "", digitalPresence: "", growthSignals: "", existingProviders: "", researchNotes: "", _new: true };
    }
    const person = { id: uid(), name: personName || "Unnamed", title: personTitle, linkedinUrl: personLinkedin, companyId: company.id, classification: "", location: "", department: "", decisionAuthority: "Unknown", background: "", interests: "", conversationStarters: "", relationshipStatus: "Not Connected", notes: "", _new: true };
    const lead = {
      id: uid(), companyId: company.id, personId: person.id, leadType, purpose, purposeNote,
      priority, stage: "New Lead", score: 0, scoreBreakdown: [], whyThisLead: "", research: null,
      health: "Nurturing", buyingSignal: "None", conversation: [], notes: [], tasks: [], generatedMessages: [],
      nextBestAction: null, meetingDate: "", createdAt: new Date().toISOString()
    };
    onCreate({ company, person, lead });
  }

  return (
    <Modal title="Add New Lead" onClose={onClose} wide>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Company</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <Btn variant={companyMode === "new" ? "primary" : undefined} onClick={() => setCompanyMode("new")}>New</Btn>
            <Btn variant={companyMode === "existing" ? "primary" : undefined} onClick={() => setCompanyMode("existing")}>Existing</Btn>
          </div>
          {companyMode === "existing" && (
            <select className="cn-select" value={existingCompanyId} onChange={e => setExistingCompanyId(e.target.value)}>
              <option value="">Select company</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {companyMode === "new" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Field label="Company Name"><TextIn value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="ABC Real Estate" /></Field>
              <Field label="Website"><TextIn value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)} placeholder="abcrealestate.com" /></Field>
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Person</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Field label="Full Name"><TextIn value={personName} onChange={e => setPersonName(e.target.value)} placeholder="Full name" /></Field>
            <Field label="Job Title"><TextIn value={personTitle} onChange={e => setPersonTitle(e.target.value)} placeholder="CEO, Marketing Head..." /></Field>
            <Field label="LinkedIn URL"><TextIn value={personLinkedin} onChange={e => setPersonLinkedin(e.target.value)} placeholder="linkedin.com/in/..." /></Field>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
        <Field label="Lead Type"><Sel value={leadType} onChange={setLeadType} options={LEAD_TYPES} /></Field>
        <Field label="Purpose of Contact"><Sel value={purpose} onChange={setPurpose} options={PURPOSES} placeholder="Select purpose" /></Field>
        <Field label="Priority"><Sel value={priority} onChange={setPriority} options={PRIORITIES} /></Field>
      </div>
      <div style={{ marginTop: 10 }}>
        <Field label="Purpose Notes (optional)" hint="Write your own reasoning, e.g. why this person specifically might have relevant clients or needs."><TextArea value={purposeNote} onChange={e => setPurposeNote(e.target.value)} rows={2} /></Field>
      </div>

      {dupWarning && (
        <div style={{ marginTop: 12, padding: 12, background: "#fdf1ea", border: "1px solid var(--signal)", borderRadius: 8, fontSize: 12.5 }}>
          <div style={{ fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} color="var(--signal)" />Existing lead found</div>
          {dupWarning.dupPerson && <div>A person matching this name or LinkedIn URL already exists: <b>{dupWarning.dupPerson.name}</b></div>}
          {dupWarning.dupCompany && <div>A company matching this name or website already exists: <b>{dupWarning.dupCompany.name}</b></div>}
          <div style={{ marginTop: 8 }}><Btn onClick={() => submit(true)}>Create anyway</Btn></div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={() => submit(false)}>Create Lead</Btn>
      </div>
    </Modal>
  );
}

/* ============================== LEAD DETAIL ============================== */

function LeadDetail({ lead, company, person, updateLead, updateCompany, updatePerson, settings, library, persistLibrary, back, openCompany, openPerson, onDelete }) {
  if (!lead) return <EmptyState text="Lead not found." />;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button className="cn-btn cn-btn-ghost" onClick={back}><ArrowLeft size={15} /></button>
        <div style={{ flex: 1 }}>
          <div className="cn-display" style={{ fontSize: 24 }}>{person?.name || "Unnamed"}</div>
          <div style={{ fontSize: 12.5, color: "var(--slate)" }}>
            {person?.title || "Title unknown"} at <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => openCompany(company.id)}>{company?.name}</span>
          </div>
        </div>
        <HealthBadge h={lead.health} />
        <Btn onClick={onDelete}><Trash2 size={13} /></Btn>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <Field label="Stage"><div style={{ width: 190 }}><Sel value={lead.stage} onChange={v => updateLead(lead.id, { stage: v })} options={STAGES} /></div></Field>
        <Field label="Priority"><div style={{ width: 120 }}><Sel value={lead.priority} onChange={v => updateLead(lead.id, { priority: v })} options={PRIORITIES} /></div></Field>
        <Field label="Lead Type"><div style={{ width: 170 }}><Sel value={lead.leadType} onChange={v => updateLead(lead.id, { leadType: v })} options={LEAD_TYPES} /></div></Field>
        <Field label="Health"><div style={{ width: 140 }}><Sel value={lead.health} onChange={v => updateLead(lead.id, { health: v })} options={HEALTH_OPTIONS} /></div></Field>
        <Field label="Buying Signal"><div style={{ width: 130 }}><Sel value={lead.buyingSignal} onChange={v => updateLead(lead.id, { buyingSignal: v })} options={BUYING_SIGNALS} /></div></Field>
        <Field label="Meeting Date"><div style={{ width: 150 }}><TextIn type="date" value={lead.meetingDate || ""} onChange={e => updateLead(lead.id, { meetingDate: e.target.value })} /></div></Field>
      </div>

      <NextBestActionPanel lead={lead} company={company} person={person} updateLead={updateLead} settings={settings} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <PurposePanel lead={lead} updateLead={updateLead} />
          <ScorePanel lead={lead} company={company} person={person} updateLead={updateLead} settings={settings} />
          <WhyThisLeadPanel lead={lead} company={company} person={person} updateLead={updateLead} settings={settings} />
          <ResearchPanel lead={lead} company={company} person={person} updateLead={updateLead} settings={settings} />
          <NotesPanel lead={lead} updateLead={updateLead} />
          <TasksPanel lead={lead} updateLead={updateLead} />
        </div>
        <div>
          <MessageGeneratorPanel lead={lead} company={company} person={person} updateLead={updateLead} settings={settings} library={library} persistLibrary={persistLibrary} />
          <ConversationPanel lead={lead} company={company} person={person} updateLead={updateLead} settings={settings} />
        </div>
      </div>
    </div>
  );
}

function NextBestActionPanel({ lead, company, person, updateLead, settings }) {
  const [loading, setLoading] = useState(false);
  async function run() {
    setLoading(true);
    const r = await aiNextBestAction(lead, company, person, settings);
    setLoading(false);
    if (r && r.action) updateLead(lead.id, { nextBestAction: { action: r.action, why: r.why, updatedAt: new Date().toISOString() } });
  }
  return (
    <div className="cn-nba-box" style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--signal)", textTransform: "uppercase", letterSpacing: ".04em" }}>Next Best Action</div>
          <div className="cn-display" style={{ fontSize: 26, marginTop: 2 }}>{lead.nextBestAction?.action || "Not yet analyzed"}</div>
          {lead.nextBestAction?.why && <div style={{ fontSize: 13, marginTop: 6, maxWidth: 560, lineHeight: 1.5 }}>{lead.nextBestAction.why}</div>}
        </div>
        <Btn loading={loading} variant="primary" onClick={run}><Sparkles size={13} />{lead.nextBestAction ? "Recalculate" : "Calculate"}</Btn>
      </div>
    </div>
  );
}

function PurposePanel({ lead, updateLead }) {
  return (
    <Section title="Purpose of Contact" icon={<Target size={14} />}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Sel value={lead.purpose} onChange={v => updateLead(lead.id, { purpose: v })} options={PURPOSES} placeholder="Select purpose" />
        <TextArea rows={2} placeholder="Why exactly are you contacting this person? Write your own reasoning..." value={lead.purposeNote || ""} onChange={e => updateLead(lead.id, { purposeNote: e.target.value })} />
      </div>
    </Section>
  );
}

function ScorePanel({ lead, company, person, updateLead, settings }) {
  const [loading, setLoading] = useState(false);
  async function run() {
    setLoading(true);
    const r = await aiScoreLead(lead, company, person, settings);
    setLoading(false);
    if (r && typeof r.score === "number") updateLead(lead.id, { score: r.score, scoreBreakdown: r.breakdown || [] });
  }
  return (
    <Section title="Lead Score" icon={<TrendingUp size={14} />} right={<Btn loading={loading} onClick={run}><Sparkles size={13} />{lead.score ? "Recalculate" : "Score"}</Btn>}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
        <div className="cn-mono" style={{ fontSize: 30, fontWeight: 600 }}>{lead.score || 0}</div>
        <div style={{ fontSize: 12, color: "var(--slate)" }}>/ 100</div>
      </div>
      {(lead.scoreBreakdown || []).map((b, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}><span>{b.label}</span><span className="cn-mono">{b.points > 0 ? "+" : ""}{b.points}</span></div>
          <div style={{ height: 4, background: "#f0eee8", borderRadius: 4, overflow: "hidden" }}><div style={{ height: "100%", width: Math.max(0, Math.min(100, b.points * 4)) + "%", background: "var(--signal)" }} /></div>
        </div>
      ))}
      {(!lead.scoreBreakdown || lead.scoreBreakdown.length === 0) && <div style={{ fontSize: 12, color: "var(--slate-soft)" }}>Not scored yet. Run research first for a more accurate score.</div>}
    </Section>
  );
}

function WhyThisLeadPanel({ lead, company, person, updateLead, settings }) {
  return (
    <Section title="Why This Lead" icon={<FileText size={14} />}>
      <TextArea rows={4} value={lead.whyThisLead || ""} onChange={e => updateLead(lead.id, { whyThisLead: e.target.value })} placeholder="Filled automatically after running Research below. Editable." />
    </Section>
  );
}

function ResearchPanel({ lead, company, person, updateLead, settings }) {
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  async function run() {
    if (!raw.trim()) return;
    setLoading(true);
    const r = await aiRunResearch(raw, lead, company, person, settings);
    setLoading(false);
    if (r && !r._error) {
      updateLead(lead.id, prev => ({
        research: { verified: r.verified || [], inferred: r.inferred || [], unknown: r.unknown || [], conversationAngle: r.conversationAngle, opportunityService: r.opportunityService },
        whyThisLead: r.whyThisLead || prev.whyThisLead,
        stage: prev.stage === "New Lead" || prev.stage === "Research Pending" ? "Researched" : prev.stage
      }));
    }
  }
  return (
    <Section title="Deep Research" icon={<Search size={14} />}>
      <TextArea rows={4} placeholder="Paste raw info here: LinkedIn about section, recent posts, company website copy, anything public..." value={raw} onChange={e => setRaw(e.target.value)} />
      <div style={{ marginTop: 8 }}><Btn variant="primary" loading={loading} onClick={run}><Sparkles size={13} />Run Research</Btn></div>

      {lead.research && (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
          <ResearchList title="Verified" color="#1a7f4b" items={lead.research.verified} />
          <ResearchList title="Reasonable Inference" color="#b8860b" items={lead.research.inferred} />
          <ResearchList title="Unknown" color="#8a8781" items={lead.research.unknown} />
          {lead.research.conversationAngle && <div style={{ fontSize: 12.5 }}><b>Best conversation angle:</b> {lead.research.conversationAngle}</div>}
          {lead.research.opportunityService && <div style={{ fontSize: 12.5 }}><b>Opportunity:</b> <Badge bg="var(--signal-soft)" color="var(--signal)">{lead.research.opportunityService}</Badge></div>}
        </div>
      )}
    </Section>
  );
}

function ResearchList({ title, color, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: ".03em", marginBottom: 4 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, lineHeight: 1.6 }}>{items.map((it, i) => <li key={i}>{it}</li>)}</ul>
    </div>
  );
}

function NotesPanel({ lead, updateLead }) {
  const [text, setText] = useState("");
  function add() {
    if (!text.trim()) return;
    updateLead(lead.id, prev => ({ notes: [...(prev.notes || []), { id: uid(), text, date: new Date().toISOString() }] }));
    setText("");
  }
  function remove(id) { updateLead(lead.id, prev => ({ notes: (prev.notes || []).filter(n => n.id !== id) })); }
  return (
    <Section title="Notes" icon={<FileText size={14} />}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <TextIn placeholder="Add a note..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
        <Btn onClick={add}><Plus size={13} /></Btn>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {(lead.notes || []).slice().reverse().map(n => (
          <div key={n.id} style={{ fontSize: 12.5, borderBottom: "1px solid var(--line)", paddingBottom: 6, display: "flex", justifyContent: "space-between", gap: 8 }}>
            <div><span style={{ color: "var(--slate-soft)", fontSize: 10.5 }}>{fmtDate(n.date)}</span> — {n.text}</div>
            <X size={12} style={{ cursor: "pointer", flexShrink: 0, marginTop: 2 }} onClick={() => remove(n.id)} />
          </div>
        ))}
        {(!lead.notes || lead.notes.length === 0) && <div style={{ fontSize: 12, color: "var(--slate-soft)" }}>No notes yet.</div>}
      </div>
    </Section>
  );
}

function TasksPanel({ lead, updateLead }) {
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const [prio, setPrio] = useState("Medium");
  function add() {
    if (!text.trim()) return;
    updateLead(lead.id, prev => ({ tasks: [...(prev.tasks || []), { id: uid(), text, dueDate: due, priority: prio, status: "Open" }] }));
    setText(""); setDue("");
  }
  function toggle(id) {
    updateLead(lead.id, prev => ({ tasks: (prev.tasks || []).map(t => t.id === id ? { ...t, status: t.status === "Done" ? "Open" : "Done" } : t) }));
  }
  function remove(id) { updateLead(lead.id, prev => ({ tasks: (prev.tasks || []).filter(t => t.id !== id) })); }
  return (
    <Section title="Tasks" icon={<CheckCircle2 size={14} />}>
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 140 }}><TextIn placeholder="Task..." value={text} onChange={e => setText(e.target.value)} /></div>
        <div style={{ width: 130 }}><TextIn type="date" value={due} onChange={e => setDue(e.target.value)} /></div>
        <div style={{ width: 100 }}><Sel value={prio} onChange={setPrio} options={PRIORITIES} /></div>
        <Btn onClick={add}><Plus size={13} /></Btn>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {(lead.tasks || []).map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, padding: "4px 0" }}>
            {t.status === "Done" ? <CheckCircle2 size={15} color="#1a7f4b" style={{ cursor: "pointer" }} onClick={() => toggle(t.id)} /> : <Circle size={15} color="var(--slate-soft)" style={{ cursor: "pointer" }} onClick={() => toggle(t.id)} />}
            <span style={{ flex: 1, textDecoration: t.status === "Done" ? "line-through" : "none", color: t.status === "Done" ? "var(--slate-soft)" : "var(--ink)" }}>{t.text}</span>
            <PriorityDot p={t.priority} />
            {t.dueDate && <span className="cn-mono" style={{ fontSize: 10.5, color: t.dueDate <= todayISO() && t.status !== "Done" ? "var(--signal)" : "var(--slate-soft)" }}>{fmtDate(t.dueDate)}</span>}
            <X size={12} style={{ cursor: "pointer" }} onClick={() => remove(t.id)} />
          </div>
        ))}
        {(!lead.tasks || lead.tasks.length === 0) && <div style={{ fontSize: 12, color: "var(--slate-soft)" }}>No tasks yet.</div>}
      </div>
    </Section>
  );
}

function ConversationPanel({ lead, company, person, updateLead, settings }) {
  const [channel, setChannel] = useState("LinkedIn");
  const [sender, setSender] = useState("Them");
  const [message, setMessage] = useState("");
  const [intent, setIntent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [screenshotResult, setScreenshotResult] = useState(null);
  const [objectionGuidance, setObjectionGuidance] = useState(null);
  const [objectionLoading, setObjectionLoading] = useState(false);
  const fileRef = useRef(null);

  function addEntry(entry) {
    updateLead(lead.id, prev => ({ conversation: [...(prev.conversation || []), { id: uid(), date: new Date().toISOString(), ...entry }] }));
  }

  function addManual() {
    if (!message.trim()) return;
    addEntry({ channel, sender, message, intent });
    setMessage(""); setIntent("");
  }

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setScreenshotResult(null);
    try {
      const base64 = await fileToBase64(file);
      const r = await aiAnalyzeScreenshot(base64, file.type || "image/png", lead, company, person, settings);
      if (r && !r._error) {
        addEntry({ channel: "LinkedIn", sender: "Them", message: r.transcript || "(screenshot analyzed)", intent: r.intent });
        setScreenshotResult(r);
      }
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function getObjectionHelp(text) {
    setObjectionLoading(true);
    const r = await aiObjectionGuidance(text, settings);
    setObjectionGuidance(r);
    setObjectionLoading(false);
  }

  return (
    <Section title="Conversation Timeline" icon={<MessageSquare size={14} />}
      right={
        <label className="cn-btn">
          {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
          Upload Screenshot
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
        </label>
      }>
      {screenshotResult && (
        <div style={{ background: "#fdf1ea", border: "1px solid var(--signal)", borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 12.5 }}>
          <div style={{ fontWeight: 700, marginBottom: 3 }}>What it means: {screenshotResult.intent}</div>
          {screenshotResult.hinglish && <div style={{ marginBottom: 3, color: "var(--slate)" }}>{screenshotResult.hinglish}</div>}
          <div style={{ marginBottom: 3 }}><b>Recommendation:</b> {screenshotResult.recommendation}</div>
          {screenshotResult.recommendedMessage && <div style={{ marginBottom: 3, fontStyle: "italic" }}>"{screenshotResult.recommendedMessage}"</div>}
          <div style={{ color: "var(--slate)" }}>{screenshotResult.why}</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
        <div style={{ width: 110 }}><Sel value={channel} onChange={setChannel} options={CHANNELS} /></div>
        <div style={{ width: 90 }}><Sel value={sender} onChange={setSender} options={["Arvind", "Them"]} /></div>
        <div style={{ width: 160 }}><Sel value={intent} onChange={setIntent} options={INTENTS} placeholder="Intent (optional)" /></div>
      </div>
      <TextArea rows={2} placeholder="Paste or type the message..." value={message} onChange={e => setMessage(e.target.value)} />
      <div style={{ marginTop: 6 }}><Btn onClick={addManual}><Plus size={13} />Add to Timeline</Btn></div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14, maxHeight: 340, overflowY: "auto" }} className="cn-scroll">
        {(lead.conversation || []).slice().reverse().map(c => (
          <div key={c.id} style={{ fontSize: 12.5, padding: "8px 10px", borderRadius: 7, background: c.sender === "Them" ? "#f4f2ec" : "#fdf1ea" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--slate-soft)", marginBottom: 3 }}>
              <span className="cn-mono">{c.sender} · {c.channel}</span><span>{fmtDateTime(c.date)}</span>
            </div>
            <div>{c.message}</div>
            {c.intent && <div style={{ marginTop: 4 }}><Badge>{c.intent}</Badge>
              {OBJECTION_INTENTS.includes(c.intent) && <button className="cn-btn cn-btn-ghost" style={{ marginLeft: 6, fontSize: 10.5, padding: "2px 6px" }} onClick={() => getObjectionHelp(c.message)}>Get objection guidance</button>}
            </div>}
          </div>
        ))}
        {(!lead.conversation || lead.conversation.length === 0) && <div style={{ fontSize: 12, color: "var(--slate-soft)" }}>No conversation logged yet.</div>}
      </div>

      {objectionLoading && <div style={{ marginTop: 10, fontSize: 12, color: "var(--slate-soft)" }}><Loader2 size={12} className="animate-spin" style={{ display: "inline", marginRight: 5 }} />Thinking through the objection...</div>}
      {objectionGuidance && !objectionLoading && (
        <div style={{ marginTop: 10, padding: 10, border: "1px solid var(--line)", borderRadius: 8, fontSize: 12.5 }}>
          <div><b>What it means:</b> {objectionGuidance.whatItMeans}</div>
          <div><b>Approach:</b> {objectionGuidance.approach}</div>
          <div><b>Avoid:</b> {objectionGuidance.avoid}</div>
          {objectionGuidance.suggestedReply && <div style={{ marginTop: 4, fontStyle: "italic" }}>"{objectionGuidance.suggestedReply}"</div>}
        </div>
      )}
    </Section>
  );
}

function MessageGeneratorPanel({ lead, company, person, updateLead, settings, library, persistLibrary }) {
  const [kind, setKind] = useState("Connection Request");
  const [style, setStyle] = useState("Conversational");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [quality, setQuality] = useState(null);
  const [qLoading, setQLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true); setQuality(null);
    const r = await aiGenerateMessage(kind, style, lead, company, person, settings);
    setMsg(r); setLoading(false);
    updateLead(lead.id, prev => ({ generatedMessages: [...(prev.generatedMessages || []), { id: uid(), kind, style, text: r, date: new Date().toISOString() }] }));
  }

  async function checkQ() {
    if (!msg.trim()) return;
    setQLoading(true);
    const r = await aiCheckQuality(msg, settings);
    setQuality(r); setQLoading(false);
  }

  function copy() { navigator.clipboard?.writeText(msg); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  function saveToLibrary() {
    if (!msg.trim()) return;
    persistLibrary([...library, { id: uid(), type: kind, style, leadType: lead.leadType, text: msg, date: new Date().toISOString(), sent: 0, replies: 0, positive: 0, meetings: 0 }]);
  }

  return (
    <Section title="Message Generator" icon={<Send size={14} />}>
      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
        <div style={{ width: 160 }}><Sel value={kind} onChange={setKind} options={MESSAGE_KINDS} /></div>
        <div style={{ width: 150 }}><Sel value={style} onChange={setStyle} options={MESSAGE_STYLES} /></div>
        <Btn variant="primary" loading={loading} onClick={generate}><Sparkles size={13} />Generate</Btn>
      </div>
      <TextArea rows={5} value={msg} onChange={e => setMsg(e.target.value)} placeholder="Generated message will appear here. Fully editable before you send it anywhere." />
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        <Btn onClick={copy}><Copy size={13} />{copied ? "Copied" : "Copy"}</Btn>
        <Btn onClick={saveToLibrary}><Library size={13} />Save to Library</Btn>
        <Btn loading={qLoading} onClick={checkQ}><CheckCircle2 size={13} />Check Message Quality</Btn>
      </div>

      {quality && !quality._error && (
        <div style={{ marginTop: 10, padding: 10, border: "1px solid var(--line)", borderRadius: 8 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700 }}>Human Score</span>
            <span className="cn-mono" style={{ fontSize: 18, color: quality.humanScore >= 75 ? "#1a7f4b" : quality.humanScore >= 50 ? "#b8860b" : "#c0392b" }}>{quality.humanScore}/100</span>
          </div>
          {(quality.issues || []).length > 0 && <div style={{ fontSize: 12, marginBottom: 4 }}><b>Issues:</b> {quality.issues.join(", ")}</div>}
          {(quality.suggestions || []).length > 0 && <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>{quality.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>}
        </div>
      )}
    </Section>
  );
}

/* ============================== COMPANIES ============================== */

function CompaniesList({ companies, leads, openCompany }) {
  const [q, setQ] = useState("");
  const filtered = companies.filter(c => (c.name || "").toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="cn-display" style={{ fontSize: 26, marginBottom: 14 }}>Companies</div>
      <div style={{ maxWidth: 300, marginBottom: 12 }}><TextIn placeholder="Search companies..." value={q} onChange={e => setQ(e.target.value)} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
        {filtered.map(c => {
          const leadCount = leads.filter(l => l.companyId === c.id).length;
          return (
            <div key={c.id} className="cn-card" style={{ padding: 14, cursor: "pointer" }} onClick={() => openCompany(c.id)}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{c.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--slate)", marginTop: 2 }}>{c.industry || "Industry unknown"}</div>
              <div className="cn-mono" style={{ fontSize: 11, color: "var(--slate-soft)", marginTop: 8 }}>{leadCount} lead{leadCount !== 1 ? "s" : ""}</div>
            </div>
          );
        })}
        {filtered.length === 0 && <EmptyState text="No companies yet." />}
      </div>
    </div>
  );
}

function CompanyDetail({ company, people, leads, updateCompany, personById, openLead, openPerson, back }) {
  if (!company) return <EmptyState text="Company not found." />;
  const set = (k) => (e) => updateCompany(company.id, { [k]: e.target.value });
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button className="cn-btn cn-btn-ghost" onClick={back}><ArrowLeft size={15} /></button>
        <div className="cn-display" style={{ fontSize: 24 }}>{company.name}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <Section title="Company Profile" icon={<Building2 size={14} />}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Field label="Name"><TextIn value={company.name || ""} onChange={set("name")} /></Field>
              <Field label="Website"><TextIn value={company.website || ""} onChange={set("website")} /></Field>
              <Field label="LinkedIn Company URL"><TextIn value={company.linkedinUrl || ""} onChange={set("linkedinUrl")} /></Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Field label="Industry"><TextIn value={company.industry || ""} onChange={set("industry")} /></Field>
                <Field label="Location / Country"><TextIn value={company.location || ""} onChange={set("location")} /></Field>
                <Field label="Company Size"><TextIn value={company.size || ""} onChange={set("size")} /></Field>
              </div>
              <Field label="Business Overview" hint="What they do, products/services, customers, business model, markets served"><TextArea rows={3} value={company.businessOverview || ""} onChange={set("businessOverview")} /></Field>
              <Field label="Digital Presence" hint="Website quality, SEO, social, ads, tech stack where publicly visible"><TextArea rows={3} value={company.digitalPresence || ""} onChange={set("digitalPresence")} /></Field>
              <Field label="Growth Signals" hint="Recent news, activity, expansion, hiring"><TextArea rows={2} value={company.growthSignals || ""} onChange={set("growthSignals")} /></Field>
              <Field label="Existing Providers" hint="Any known existing technology / marketing providers"><TextIn value={company.existingProviders || ""} onChange={set("existingProviders")} /></Field>
              <Field label="Research Notes"><TextArea rows={2} value={company.researchNotes || ""} onChange={set("researchNotes")} /></Field>
            </div>
          </Section>
        </div>
        <div>
          <Section title="People (Relationship Map)" icon={<Users size={14} />}>
            {people.length === 0 && <EmptyState text="No people linked to this company yet." />}
            {people.map(p => {
              const l = leads.find(le => le.personId === p.id);
              return (
                <div key={p.id} style={{ padding: "8px 4px", borderBottom: "1px solid var(--line)", cursor: "pointer" }} onClick={() => openPerson(p.id)}>
                  <div style={{ fontWeight: 600, fontSize: 12.5 }}>{p.name} <span style={{ fontWeight: 400, color: "var(--slate)" }}>· {p.title}</span></div>
                  <div style={{ fontSize: 11, color: "var(--slate-soft)", display: "flex", gap: 8, marginTop: 2 }}>
                    <span>{p.relationshipStatus || "Not connected"}</span>
                    {l && <span onClick={(e) => { e.stopPropagation(); openLead(l.id); }} style={{ textDecoration: "underline" }}>{l.stage}</span>}
                  </div>
                </div>
              );
            })}
          </Section>
          <Section title="Opportunities / Leads" icon={<Target size={14} />}>
            {leads.length === 0 && <EmptyState text="No leads yet for this company." />}
            {leads.map(l => (
              <div key={l.id} style={{ padding: "6px 4px", borderBottom: "1px solid var(--line)", cursor: "pointer", fontSize: 12.5 }} onClick={() => openLead(l.id)}>
                {personById(l.personId)?.name || "Unnamed"} <span style={{ color: "var(--slate-soft)" }}>· {l.stage}</span>
              </div>
            ))}
          </Section>
        </div>
      </div>
    </div>
  );
}

/* ============================== PEOPLE ============================== */

function PeopleList({ people, companies, openPerson, companyById }) {
  const [q, setQ] = useState("");
  const filtered = people.filter(p => (p.name || "").toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="cn-display" style={{ fontSize: 26, marginBottom: 14 }}>People</div>
      <div style={{ maxWidth: 300, marginBottom: 12 }}><TextIn placeholder="Search people..." value={q} onChange={e => setQ(e.target.value)} /></div>
      <div className="cn-card">
        {filtered.map(p => (
          <div key={p.id} onClick={() => openPerson(p.id)} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid var(--line)", cursor: "pointer", fontSize: 12.5 }}>
            <div><b>{p.name}</b> <span style={{ color: "var(--slate)" }}>· {p.title}</span></div>
            <div style={{ color: "var(--slate-soft)" }}>{companyById(p.companyId)?.name || ""} {p.classification ? "· " + p.classification : ""}</div>
          </div>
        ))}
        {filtered.length === 0 && <EmptyState text="No people yet." />}
      </div>
    </div>
  );
}

function PersonDetail({ person, company, leads, updatePerson, openLead, back }) {
  if (!person) return <EmptyState text="Person not found." />;
  const set = (k) => (e) => updatePerson(person.id, { [k]: e.target.value });
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <button className="cn-btn cn-btn-ghost" onClick={back}><ArrowLeft size={15} /></button>
        <div className="cn-display" style={{ fontSize: 24 }}>{person.name}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Section title="Person Profile" icon={<Users size={14} />}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Field label="Full Name"><TextIn value={person.name || ""} onChange={set("name")} /></Field>
            <Field label="Job Title"><TextIn value={person.title || ""} onChange={set("title")} /></Field>
            <Field label="LinkedIn URL"><TextIn value={person.linkedinUrl || ""} onChange={set("linkedinUrl")} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <Field label="Classification"><Sel value={person.classification} onChange={v => updatePerson(person.id, { classification: v })} options={PERSON_CLASSIFICATIONS} placeholder="Select" /></Field>
              <Field label="Decision Authority"><Sel value={person.decisionAuthority} onChange={v => updatePerson(person.id, { decisionAuthority: v })} options={DECISION_AUTHORITY} /></Field>
              <Field label="Location"><TextIn value={person.location || ""} onChange={set("location")} /></Field>
              <Field label="Department"><TextIn value={person.department || ""} onChange={set("department")} /></Field>
              <Field label="Relationship Status"><Sel value={person.relationshipStatus} onChange={v => updatePerson(person.id, { relationshipStatus: v })} options={RELATIONSHIP_STATUS} /></Field>
            </div>
          </div>
        </Section>
        <Section title="Background & Conversation Starters" icon={<FileText size={14} />}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Field label="Professional Background" hint="Previous companies, current responsibilities, achievements"><TextArea rows={3} value={person.background || ""} onChange={set("background")} /></Field>
            <Field label="Interests & Recent Activity" hint="Topics they discuss, recent posts, achievements"><TextArea rows={3} value={person.interests || ""} onChange={set("interests")} /></Field>
            <Field label="Conversation Starters"><TextArea rows={2} value={person.conversationStarters || ""} onChange={set("conversationStarters")} /></Field>
            <Field label="Notes"><TextArea rows={2} value={person.notes || ""} onChange={set("notes")} /></Field>
          </div>
        </Section>
      </div>
      <Section title="Linked Leads" icon={<Target size={14} />}>
        {leads.length === 0 && <EmptyState text="No leads for this person yet." />}
        {leads.map(l => (
          <div key={l.id} onClick={() => openLead(l.id)} style={{ padding: "6px 4px", borderBottom: "1px solid var(--line)", cursor: "pointer", fontSize: 12.5 }}>
            {l.leadType} <span style={{ color: "var(--slate-soft)" }}>· {l.stage}</span>
          </div>
        ))}
      </Section>
    </div>
  );
}

/* ============================== MESSAGE LIBRARY ============================== */

function MessageLibraryView({ library, persistLibrary }) {
  const [filterType, setFilterType] = useState("");
  const filtered = library.filter(m => !filterType || m.type === filterType);
  function bump(id, field) {
    persistLibrary(library.map(m => m.id === id ? { ...m, [field]: (m[field] || 0) + 1 } : m));
  }
  function remove(id) { persistLibrary(library.filter(m => m.id !== id)); }
  return (
    <div>
      <div className="cn-display" style={{ fontSize: 26, marginBottom: 14 }}>Message Library</div>
      <div style={{ width: 200, marginBottom: 12 }}><Sel value={filterType} onChange={setFilterType} options={MESSAGE_KINDS} placeholder="All types" /></div>
      {filtered.length === 0 && <EmptyState text="Saved messages from lead pages will show up here." />}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.slice().reverse().map(m => (
          <div key={m.id} className="cn-card" style={{ padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div><Badge>{m.type}</Badge> <Badge bg="#f0eee8">{m.style}</Badge> {m.leadType && <Badge bg="#f0eee8">{m.leadType}</Badge>}</div>
              <X size={13} style={{ cursor: "pointer" }} onClick={() => remove(m.id)} />
            </div>
            <div style={{ fontSize: 13, whiteSpace: "pre-wrap" }}>{m.text}</div>
            <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 11.5, color: "var(--slate)" }}>
              <span onClick={() => bump(m.id, "sent")} style={{ cursor: "pointer" }}>Sent: <b className="cn-mono">{m.sent}</b></span>
              <span onClick={() => bump(m.id, "replies")} style={{ cursor: "pointer" }}>Replies: <b className="cn-mono">{m.replies}</b></span>
              <span onClick={() => bump(m.id, "positive")} style={{ cursor: "pointer" }}>Positive: <b className="cn-mono">{m.positive}</b></span>
              <span onClick={() => bump(m.id, "meetings")} style={{ cursor: "pointer" }}>Meetings: <b className="cn-mono">{m.meetings}</b></span>
              <span style={{ marginLeft: "auto", color: "var(--slate-soft)" }}>Click a number to log one</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================== IMPORT FROM LINKEDIN ============================== */

function ImportView({ companies, people, leads, settings, persistCompanies, persistPeople, persistLeads, persistSettings }) {
  const [myName, setMyName] = useState(settings.myLinkedinName || "");
  const [connFile, setConnFile] = useState(null);
  const [msgFile, setMsgFile] = useState(null);
  const [autoCreate, setAutoCreate] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function runImport() {
    setRunning(true); setError(""); setResult(null);
    try {
      let workingCompanies = companies, workingPeople = people, workingLeads = leads;
      const summary = { connCreated: 0, connSkipped: 0, msgAdded: 0, msgSkippedNoLead: 0, msgSkippedUnknown: 0, msgCreatedPeople: 0 };

      if (connFile) {
        const matrix = await parseCSVFile(connFile);
        const r = importConnectionsCSV(matrix, workingCompanies, workingPeople);
        workingCompanies = r.companies; workingPeople = r.people;
        summary.connCreated = r.created; summary.connSkipped = r.skipped;
      }

      if (msgFile) {
        if (!myName.trim()) throw new Error("Enter your exact LinkedIn display name first, so the importer knows which side of each message is you.");
        const matrix = await parseCSVFile(msgFile);
        const r = importMessagesCSV(matrix, myName, workingPeople, workingLeads, autoCreate);
        workingPeople = r.people;
        summary.msgAdded = r.added; summary.msgSkippedNoLead = r.skippedNoLead; summary.msgSkippedUnknown = r.skippedUnknown; summary.msgCreatedPeople = r.createdPeople;
        if (Object.keys(r.addedByLead).length) {
          workingLeads = workingLeads.map(l => r.addedByLead[l.id] ? { ...l, conversation: [...(l.conversation || []), ...r.addedByLead[l.id]] } : l);
        }
      }

      persistCompanies(workingCompanies);
      persistPeople(workingPeople);
      persistLeads(workingLeads);
      if (myName.trim() !== (settings.myLinkedinName || "")) persistSettings({ ...settings, myLinkedinName: myName.trim() });
      setResult(summary);
    } catch (e) {
      setError(e.message || "Import failed. Check the file format and try again.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="cn-display" style={{ fontSize: 26, marginBottom: 6 }}>Import from LinkedIn</div>
      <div style={{ fontSize: 12.5, color: "var(--slate)", marginBottom: 16 }}>Bulk-load your existing network and message history instead of typing it in one by one.</div>

      <div className="cn-card" style={{ padding: 14, marginBottom: 14, display: "flex", gap: 10 }}>
        <ShieldAlert size={18} color="var(--signal)" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
          <b>There is no live auto-sync here, and that is deliberate.</b> LinkedIn does not give third party apps an API for your personal connections, DMs or followers. Tools that get around this by automating your login or scraping the site put your account at risk of restriction, which is not a trade worth making when your whole pipeline runs through LinkedIn. This uses LinkedIn's own official export instead, so there is nothing here that can get your account flagged.
        </div>
      </div>

      <Section title="Step 1: get your export from LinkedIn" icon={<Info size={14} />}>
        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.9 }}>
          <li>On desktop, go to Settings &amp; Privacy → Data privacy → Get a copy of your data (or open linkedin.com/mypreferences/d/download-my-data directly).</li>
          <li>Choose "Want something in particular" and select <b>Connections</b> and <b>Messages</b> (Invitations is optional).</li>
          <li>Click Request archive. LinkedIn emails a download link, usually within a few minutes to 24 hours.</li>
          <li>Unzip the file on your computer. You will find Connections.csv and messages.csv inside.</li>
        </ol>
      </Section>

      <Section title="Step 2: upload the files" icon={<Upload size={14} />}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Your LinkedIn Display Name" hint="Exactly how your name appears as the sender on your own messages, e.g. Arvind Chaudhary. Needed so the importer can tell your messages apart from theirs.">
            <TextIn value={myName} onChange={e => setMyName(e.target.value)} placeholder="Arvind Chaudhary" />
          </Field>
          <Field label="Connections.csv" hint="Creates a Person (and Company, matched by name) for each connection that doesn't already exist. Does not create Leads automatically.">
            <label className="cn-btn" style={{ display: "inline-flex" }}>
              <FileSpreadsheet size={13} />{connFile ? connFile.name : "Choose Connections.csv"}
              <input type="file" accept=".csv" style={{ display: "none" }} onChange={e => setConnFile(e.target.files[0] || null)} />
            </label>
          </Field>
          <Field label="messages.csv" hint="Only added to a lead's conversation timeline if that person already has a Lead record. People without one are counted but skipped, run Connections first, convert who matters to a Lead, then re-run this.">
            <label className="cn-btn" style={{ display: "inline-flex" }}>
              <FileSpreadsheet size={13} />{msgFile ? msgFile.name : "Choose messages.csv"}
              <input type="file" accept=".csv" style={{ display: "none" }} onChange={e => setMsgFile(e.target.files[0] || null)} />
            </label>
          </Field>
          <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, cursor: "pointer" }}>
            <input type="checkbox" checked={autoCreate} onChange={e => setAutoCreate(e.target.checked)} />
            Also create a new Person for message senders not already in People
          </label>
          <div><Btn variant="primary" loading={running} onClick={runImport} disabled={!connFile && !msgFile}><Upload size={13} />Run Import</Btn></div>
          {error && <div style={{ fontSize: 12.5, color: "#c0392b" }}>{error}</div>}
        </div>
      </Section>

      {result && (
        <div className="cn-nba-box">
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--signal)", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 8 }}>Import complete</div>
          <div style={{ fontSize: 13, lineHeight: 1.8 }}>
            {connFile && <div>Connections: <b>{result.connCreated}</b> people added, <b>{result.connSkipped}</b> already existed.</div>}
            {msgFile && <>
              <div>Messages: <b>{result.msgAdded}</b> added to existing lead timelines.</div>
              <div>Messages skipped, no Lead yet for that person: <b>{result.msgSkippedNoLead}</b> (their Person record still updated where possible, convert them to a Lead and re-run to pull in their history).</div>
              <div>Messages skipped, sender not recognized: <b>{result.msgSkippedUnknown}</b>{autoCreate ? "" : " (turn on the checkbox above to auto-create People for these and re-run)"}.</div>
              {autoCreate && <div>New People auto-created from message senders: <b>{result.msgCreatedPeople}</b></div>}
            </>}
          </div>
        </div>
      )}

      <div style={{ fontSize: 11.5, color: "var(--slate-soft)", marginTop: 4 }}>
        Followers and following are not part of LinkedIn's standard data export in a usable list format, so they are not covered here. If you specifically need that list for a reason, tell me and I will find a separate way to get it.
      </div>
    </div>
  );
}

/* ============================== SETTINGS ============================== */

function SettingsView({ settings, persistSettings }) {
  const [local, setLocal] = useState(settings);
  const [saved, setSaved] = useState(false);
  useEffect(() => setLocal(settings), [settings]);
  function save() { persistSettings(local); setSaved(true); setTimeout(() => setSaved(false), 1500); }
  return (
    <div style={{ maxWidth: 720 }}>
      <div className="cn-display" style={{ fontSize: 26, marginBottom: 14 }}>Settings</div>
      <Section title="Arvind's Profile" icon={<Users size={14} />} hint="Used by the AI to write in your voice and understand your context.">
        <TextArea rows={5} value={local.arvindProfile} onChange={e => setLocal({ ...local, arvindProfile: e.target.value })} />
      </Section>
      <Section title="Your LinkedIn Display Name" icon={<Upload size={14} />} hint="Used only by the Import from LinkedIn feature to tell your messages apart from theirs.">
        <TextIn value={local.myLinkedinName || ""} onChange={e => setLocal({ ...local, myLinkedinName: e.target.value })} placeholder="Arvind Chaudhary" />
      </Section>
      <Section title="Clicknify Context" icon={<Building2 size={14} />}>
        <TextArea rows={5} value={local.clicknifyContext} onChange={e => setLocal({ ...local, clicknifyContext: e.target.value })} />
      </Section>
      <Section title="Writing Style Rules" icon={<FileText size={14} />}>
        <TextArea rows={6} value={local.writingStyle} onChange={e => setLocal({ ...local, writingStyle: e.target.value })} />
      </Section>
      <Btn variant="primary" onClick={save}>{saved ? "Saved" : "Save Settings"}</Btn>
    </div>
  );
}
