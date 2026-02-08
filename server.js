const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const { CONTRACT_TEMPLATES } = require("./templates");
const app = express();
const PORT = process.env.PORT || 3400;
const STRIPE_PK = process.env.STRIPE_PK || '';
const DOMAIN = process.env.DOMAIN || 'https://delta.abapture.ai';

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ========== IN-MEMORY STORES ==========
const usage = new Map();
const sharedResults = new Map();
const users = new Map(); // email -> { id, email, passwordHash, analyses: [] }
const sessions = new Map(); // token -> { userId, expires }

function getUsage(ip) {
  const now = new Date().toDateString();
  const entry = usage.get(ip);
  if (!entry || entry.date !== now) { usage.set(ip, { date: now, count: 0 }); return usage.get(ip); }
  return entry;
}

// ========== AUTH MIDDLEWARE ==========
function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && sessions.has(token)) {
    const sess = sessions.get(token);
    if (sess.expires > Date.now()) {
      req.userId = sess.userId;
      req.user = [...users.values()].find(u => u.id === sess.userId);
    }
  }
  next();
}

// ========== RED FLAG PATTERNS (30+) ==========
const RED_FLAG_PATTERNS = [
  { id: 'unlimited_liability', name: 'Unlimited Liability', severity: 'high', patterns: [/unlimited liability/i, /shall be liable for all/i, /liability shall not be (limited|capped)/i, /without limitation/i], description: 'No cap on financial liability — could expose you to unlimited damages.', plainEnglish: 'This means there\'s no limit on how much money you could owe. If something goes wrong, you could be on the hook for everything — your savings, your assets, all of it.' },
  { id: 'rights_waiver', name: 'Rights Waiver', severity: 'high', patterns: [/waive(s)? (any |all )?rights?/i, /surrender(s)? (any |all )?rights?/i, /relinquish(es)? (any |all )?rights?/i, /forfeit(s)? (any |all )?rights?/i], description: 'You may be giving up important legal rights.', plainEnglish: 'This means you\'re giving up legal protections you\'d normally have. If a dispute arises, you may have fewer options to defend yourself.' },
  { id: 'unilateral_modification', name: 'Unilateral Modification', severity: 'high', patterns: [/may (modify|change|alter|amend|update) (this|the) (agreement|contract|terms)/i, /reserves? the right to (modify|change|alter|amend)/i, /at (its|our|their) sole discretion/i, /without (prior )?notice/i], description: 'The other party can change terms without your consent.', plainEnglish: 'This means they can change the rules of the deal whenever they want — and you\'re stuck with the new terms whether you like them or not.' },
  { id: 'auto_renewal', name: 'Auto-Renewal Trap', severity: 'medium', patterns: [/auto(matically)?[- ]renew/i, /shall (automatically )?renew/i, /renewal period/i, /unless (written )?notice.{0,30}(days?|months?)/i], description: 'Contract auto-renews — you may be locked in if you miss the cancellation window.', plainEnglish: 'This means the contract keeps going automatically unless you cancel by a specific deadline. Miss that window and you\'re locked in for another term.' },
  { id: 'non_compete', name: 'Non-Compete Clause', severity: 'high', patterns: [/non[- ]?compete/i, /shall not (compete|engage in|work for)/i, /covenant not to compete/i, /restrictive covenant/i, /competitive activit/i], description: 'Restricts your ability to work in your field after the contract ends.', plainEnglish: 'This means after you leave, you can\'t work for competitors or start a competing business — potentially for years. This could seriously limit your career options.' },
  { id: 'non_solicit', name: 'Non-Solicitation', severity: 'medium', patterns: [/non[- ]?solicit/i, /shall not (solicit|recruit|hire|entice)/i, /refrain from soliciting/i], description: 'Prevents you from contacting clients or hiring employees from the other party.', plainEnglish: 'This means you can\'t reach out to their clients or try to hire their employees, even after the relationship ends.' },
  { id: 'arbitration', name: 'Mandatory Arbitration', severity: 'medium', patterns: [/binding arbitration/i, /mandatory arbitration/i, /shall be (resolved|settled) (by|through) arbitration/i, /waive.{0,20}(right to|jury) trial/i, /class action waiver/i], description: 'Disputes must go through arbitration — you lose the right to sue in court.', plainEnglish: 'This means if there\'s a problem, you can\'t go to court. Instead, a private arbitrator decides — and their decision is usually final, with very limited appeal options.' },
  { id: 'indemnification', name: 'Broad Indemnification', severity: 'high', patterns: [/indemnif(y|ies|ication)/i, /hold harmless/i, /defend and indemnify/i], description: 'You may be required to cover the other party\'s legal costs and damages.', plainEnglish: 'This means if someone sues them because of something related to your work, you have to pay their legal bills and any damages — even if it wasn\'t entirely your fault.' },
  { id: 'termination_without_cause', name: 'Termination Without Cause', severity: 'medium', patterns: [/terminat(e|ion) (without|for no) cause/i, /terminat(e|ion) at (any time|will|its sole)/i, /immediately terminat/i, /terminat(e|ion) (with|upon) (\d+|thirty|sixty|ninety) days?' notice/i], description: 'The other party can end the contract at any time without reason.', plainEnglish: 'This means they can fire you or end the deal tomorrow with no explanation and potentially no severance or compensation for work in progress.' },
  { id: 'penalty_clause', name: 'Penalty Clauses', severity: 'high', patterns: [/liquidated damages/i, /penalty (of|for|clause)/i, /early termination fee/i, /breakage fee/i, /shall pay.{0,30}(penalty|fee|damages)/i], description: 'Financial penalties for breaking the contract.', plainEnglish: 'This means if you need to exit the contract early or breach any terms, you\'ll owe a specific amount of money — sometimes a very large sum.' },
  { id: 'ip_assignment', name: 'IP Assignment', severity: 'high', patterns: [/assign(s|ment)?.{0,30}(intellectual property|IP|copyright|patent|trademark)/i, /work(s)?[- ]?(made)?[- ]?for[- ]?hire/i, /all (work|materials|deliverables).{0,30}(belong|property of|owned by)/i, /hereby assign/i, /transfer(s)? (all |any )?(right|title|interest)/i], description: 'You may be signing away ownership of your work or ideas.', plainEnglish: 'This means everything you create — code, designs, ideas, even things you work on in your spare time — becomes their property. You can\'t use it, sell it, or even show it in your portfolio.' },
  { id: 'non_disparagement', name: 'Non-Disparagement', severity: 'medium', patterns: [/non[- ]?disparagement/i, /shall not (make|publish|communicate).{0,30}(negative|disparaging|derogatory)/i, /refrain from.{0,20}(negative|disparaging|critical)/i, /not (criticize|disparage)/i], description: 'Prevents you from making negative public statements about the other party.', plainEnglish: 'This means you can\'t publicly criticize them — no bad reviews, no warning others about problems, no venting on social media. Even truthful statements could get you in trouble.' },
  { id: 'moonlighting_restriction', name: 'Moonlighting Restriction', severity: 'medium', patterns: [/outside (employment|work|activities)/i, /devote.{0,20}(full|entire|exclusive).{0,20}(time|attention|effort)/i, /shall not (engage in|perform|undertake).{0,30}(other|outside|additional)/i, /exclusiv(e|ity) (of service|engagement)/i, /moonlight/i], description: 'Restricts your ability to do other work or side projects.', plainEnglish: 'This means you can\'t do freelance work, side projects, or even volunteer in your field without their permission. Your side hustle? Off limits.' },
  { id: 'confidentiality_overbroad', name: 'Overbroad Confidentiality', severity: 'medium', patterns: [/all (information|materials|data).{0,30}confidential/i, /perpetual(ly)? confidential/i, /survive(s)? (termination|expiration).{0,30}(indefinitely|perpetual|forever)/i, /in perpetuity/i], description: 'Confidentiality obligations that are too broad or last forever.', plainEnglish: 'This means you\'re sworn to secrecy about almost everything — potentially forever. Even basic skills or knowledge you gained could be considered "confidential."' },
  { id: 'governing_law', name: 'Unfavorable Jurisdiction', severity: 'low', patterns: [/govern(ed|ing) (by the )?law(s)? of/i, /jurisdiction of the courts of/i, /exclusive (jurisdiction|venue)/i, /submit to the jurisdiction/i], description: 'Disputes may need to be resolved in an inconvenient location.', plainEnglish: 'This means if there\'s a legal dispute, you may have to travel to another state or city to deal with it — at your own expense.' },
  { id: 'severability_missing', name: 'Missing Severability', severity: 'low', patterns: [], description: 'No severability clause — if one part is invalid, the whole contract could fail.', plainEnglish: 'This means if a court finds one part of this contract illegal or unenforceable, the entire contract could be thrown out — which might actually hurt you.' },
  { id: 'data_rights', name: 'Data Rights Grab', severity: 'high', patterns: [/irrevocable.{0,20}license/i, /perpetual.{0,20}license/i, /royalty[- ]?free.{0,20}license/i, /right to (use|sell|share|transfer).{0,20}(data|information|content)/i, /we (may|can|will) (use|sell|share)/i], description: 'The other party gets broad rights to use your data.', plainEnglish: 'This means they can use, sell, or share your personal data and content however they want — forever. They could sell it to advertisers or use it to train AI.' },
  { id: 'force_majeure', name: 'One-Sided Force Majeure', severity: 'medium', patterns: [/force majeure/i, /act(s)? of god/i, /beyond.{0,20}(reasonable )?control/i], description: 'Force majeure clause may only protect one party.', plainEnglish: 'This means if something unexpected happens (pandemic, natural disaster), they can stop performing their obligations — but you might still be on the hook for yours.' },
  { id: 'late_payment', name: 'Late Payment Terms', severity: 'medium', patterns: [/late (payment )?fee/i, /interest (on|at).{0,20}(overdue|late|unpaid)/i, /net[- ]?(30|45|60|90)/i, /payment.{0,30}(within|due in) (60|90|120)/i], description: 'Payment terms may be unfavorable — long delays or steep late fees.', plainEnglish: 'This means you might wait 60-90 days to get paid, and if you\'re late paying them, the fees and interest can add up fast.' },
  { id: 'entire_agreement', name: 'Entire Agreement (Merger)', severity: 'low', patterns: [/entire agreement/i, /supersedes? (all )?prior/i, /merger clause/i], description: 'This overrides all previous agreements and verbal promises.', plainEnglish: 'This means any promises they made before — in emails, calls, or earlier drafts — don\'t count anymore. Only what\'s written in this document matters.' },
  { id: 'assignment_restriction', name: 'Assignment Restriction', severity: 'low', patterns: [/may not (assign|transfer|delegate)/i, /shall not (assign|transfer)/i, /consent.{0,20}(required|necessary).{0,20}assign/i], description: 'You cannot transfer your rights under this contract.', plainEnglish: 'This means you can\'t hand off this contract to someone else — even if you sell your business or want a partner to take over.' },
  { id: 'warranty_disclaimer', name: 'Warranty Disclaimer', severity: 'medium', patterns: [/as[- ]?is/i, /without warranty/i, /disclaims? (all |any )?(warranties|warranty)/i, /no (warranties|warranty|guarantee)/i], description: 'The other party provides no guarantees about their product/service.', plainEnglish: 'This means if their product breaks, doesn\'t work, or causes problems, they\'re not responsible. You\'re getting it "as-is" with zero guarantees.' },
  { id: 'limitation_of_remedy', name: 'Limitation of Remedy', severity: 'medium', patterns: [/sole (and exclusive )?remedy/i, /exclusive remedy/i, /maximum (aggregate )?liability.{0,30}shall not exceed/i, /in no event.{0,20}(exceed|liable)/i], description: 'Your legal remedies may be severely limited.', plainEnglish: 'This means even if they cause you major harm, the most you can recover might be a tiny fraction of your actual losses — sometimes as little as one month\'s fees.' },
  { id: 'survival_clause', name: 'Broad Survival Clause', severity: 'low', patterns: [/shall survive (termination|expiration)/i, /survive(s)? the (termination|expiration)/i, /obligations.{0,30}survive/i], description: 'Some obligations continue even after the contract ends.', plainEnglish: 'This means even after the deal is over, some rules still apply to you — like confidentiality, non-compete, or non-solicitation. Read carefully which ones survive.' },
  { id: 'personal_guarantee', name: 'Personal Guarantee', severity: 'high', patterns: [/personal(ly)? guarantee/i, /individual(ly)? liable/i, /jointly and severally/i, /personal liability/i], description: 'You\'re personally liable, not just your business.', plainEnglish: 'This means your personal assets — house, car, savings — are at risk, not just your company\'s. If the business can\'t pay, they come after you personally.' },
  { id: 'automatic_price_increase', name: 'Automatic Price Increase', severity: 'medium', patterns: [/price.{0,20}increase/i, /rate.{0,20}increase/i, /escalat(e|ion)/i, /cost of living adjustment/i, /CPI adjustment/i, /annual increase/i], description: 'Prices may increase automatically over time.', plainEnglish: 'This means the price goes up automatically — often every year. You might start paying $100/month and end up at $150/month without any new negotiation.' },
  { id: 'no_cure_period', name: 'No Cure Period', severity: 'medium', patterns: [/immediate(ly)? terminat/i, /without.{0,20}(opportunity|right) to cure/i], description: 'No chance to fix a breach before the contract is terminated.', plainEnglish: 'This means if you make a mistake or violate any term, they can immediately end the contract — no warning, no chance to fix it.' },
  { id: 'venue_selection', name: 'Venue Selection Clause', severity: 'low', patterns: [/exclusive venue/i, /venue shall be/i, /brought (only )?in the courts/i], description: 'Lawsuits must be filed in a specific location.', plainEnglish: 'This means if you need to take legal action, you\'d have to do it in their preferred city — which could mean expensive travel and unfamiliar courts.' },
  { id: 'clawback', name: 'Clawback Provision', severity: 'high', patterns: [/clawback/i, /repay(ment)?.{0,30}(bonus|commission|payment)/i, /return.{0,30}(payment|compensation|bonus)/i, /refund.{0,30}(all|any) (payments|fees|amounts)/i], description: 'The other party can take back money already paid to you.', plainEnglish: 'This means money you\'ve already earned and received can be taken back. That bonus you spent? They could demand it back months later.' },
  { id: 'moral_rights_waiver', name: 'Moral Rights Waiver', severity: 'medium', patterns: [/moral rights/i, /waive.{0,30}moral/i, /attribution/i], description: 'You waive the right to be credited for your work.', plainEnglish: 'This means they can use your work without giving you credit, modify it beyond recognition, or even put someone else\'s name on it.' },
];

// ========== DOCUMENT TYPE DETECTION ==========
function detectDocumentType(text) {
  const lower = text.toLowerCase();
  const scores = {
    nda: 0, lease: 0, employment: 0, freelance: 0, tos: 0,
    loan: 0, partnership: 0, purchase: 0, service: 0, saas: 0, licensing: 0
  };

  if (/non[- ]?disclosure|nda|confidential(ity)? agreement/i.test(lower)) scores.nda += 10;
  if (/disclosing party|receiving party|confidential information/i.test(lower)) scores.nda += 5;

  if (/lease|landlord|tenant|premises|rent|security deposit/i.test(lower)) scores.lease += 10;
  if (/month[- ]?to[- ]?month|occupancy|habitable|evict/i.test(lower)) scores.lease += 5;

  if (/employ(ee|er|ment)|salary|compensation|benefits|401k|pto|paid time off/i.test(lower)) scores.employment += 10;
  if (/at[- ]?will|termination of employment|job (title|duties|description)/i.test(lower)) scores.employment += 5;

  if (/freelance|independent contractor|contractor|scope of work|deliverables/i.test(lower)) scores.freelance += 10;
  if (/project (fee|rate)|milestone|invoice|1099/i.test(lower)) scores.freelance += 5;

  if (/terms of (service|use)|user agreement|acceptable use/i.test(lower)) scores.tos += 10;
  if (/account.{0,20}(terminat|suspend)|content.{0,20}policy|privacy/i.test(lower)) scores.tos += 5;

  if (/loan|principal|interest rate|repayment|borrow/i.test(lower)) scores.loan += 10;
  if (/promissory note|collateral|default|maturity date/i.test(lower)) scores.loan += 5;

  if (/partnership|partner(s)?|profit sharing|joint venture/i.test(lower)) scores.partnership += 10;

  if (/purchase (agreement|order)|buyer|seller|goods|shipping/i.test(lower)) scores.purchase += 10;

  if (/service (agreement|contract)|service provider|client/i.test(lower)) scores.service += 8;
  if (/scope of services|service level|SLA/i.test(lower)) scores.service += 5;

  if (/subscription|SaaS|software as a service|cloud/i.test(lower)) scores.saas += 10;

  if (/licens(e|or|ee)|grant of license|royalt/i.test(lower)) scores.licensing += 10;

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] === 0) return { type: 'general', label: 'General Contract', confidence: 0.3 };

  const labels = {
    nda: 'Non-Disclosure Agreement (NDA)', lease: 'Lease Agreement',
    employment: 'Employment Contract', freelance: 'Freelance/Contractor Agreement',
    tos: 'Terms of Service', loan: 'Loan Agreement',
    partnership: 'Partnership Agreement', purchase: 'Purchase Agreement',
    service: 'Service Agreement', saas: 'SaaS/Subscription Agreement',
    licensing: 'Licensing Agreement'
  };

  return { type: sorted[0][0], label: labels[sorted[0][0]], confidence: Math.min(sorted[0][1] / 15, 1) };
}

// ========== ANALYSIS ENGINE ==========
function analyzeContract(text) {
  const lines = text.split('\n');
  const lower = text.toLowerCase();

  // Document type
  const docType = detectDocumentType(text);

  // Red flags
  const redFlags = [];
  for (const flag of RED_FLAG_PATTERNS) {
    for (const pattern of flag.patterns) {
      const match = text.match(pattern);
      if (match) {
        // Find the surrounding context
        const idx = text.indexOf(match[0]);
        const start = Math.max(0, idx - 80);
        const end = Math.min(text.length, idx + match[0].length + 80);
        const context = text.slice(start, end).replace(/\n/g, ' ').trim();
        redFlags.push({
          id: flag.id, name: flag.name, severity: flag.severity,
          description: flag.description,
          plainEnglish: flag.plainEnglish || '',
          context: (start > 0 ? '...' : '') + context + (end < text.length ? '...' : ''),
          match: match[0]
        });
        break; // one match per flag is enough
      }
    }
  }

  // Check for missing severability
  if (!/severab/i.test(text)) {
    redFlags.push({
      id: 'severability_missing', name: 'Missing Severability Clause', severity: 'low',
      description: 'No severability clause found. If any part of this contract is found invalid, the entire contract could be voided.',
      plainEnglish: 'This means if a court finds one part of this contract illegal, the entire contract could be thrown out — which might actually hurt you.',
      context: '', match: ''
    });
  }

  // Extract key terms
  const keyTerms = [];
  // Money
  const moneyMatches = text.match(/\$[\d,]+(?:\.\d{2})?(?:\s*(?:per|\/)\s*(?:month|year|hour|day|week|annum|annually|project|milestone))?/g) || [];
  moneyMatches.forEach(m => keyTerms.push({ type: 'financial', value: m.trim() }));
  // Also match written amounts
  const writtenMoney = text.match(/(?:sum of|amount of|fee of|salary of|compensation of|rate of)\s+[^.;,]+/gi) || [];
  writtenMoney.forEach(m => keyTerms.push({ type: 'financial', value: m.trim() }));

  // Time periods
  const timeMatches = text.match(/\b\d+\s*(?:day|week|month|year|business day|calendar day|working day)s?\b/gi) || [];
  timeMatches.forEach(m => keyTerms.push({ type: 'duration', value: m.trim() }));

  // Percentages
  const pctMatches = text.match(/\b\d+(?:\.\d+)?%/g) || [];
  pctMatches.forEach(m => keyTerms.push({ type: 'percentage', value: m.trim() }));

  // Extract dates
  const dates = [];
  const datePatterns = [
    /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/g,
    /\d{1,2}\/\d{1,2}\/\d{2,4}/g,
    /\d{4}-\d{2}-\d{2}/g,
  ];
  for (const dp of datePatterns) {
    const dm = text.match(dp) || [];
    dm.forEach(d => dates.push(d));
  }

  // Extract parties
  const parties = [];
  const partyPatterns = [
    /(?:between|by and between)\s+"?([^"(]+?)"?\s*\(.*?\)\s*and\s+"?([^"(]+?)"?\s*\(/i,
    /(?:between|by and between)\s+([A-Z][A-Za-z\s,.]+?)\s*(?:\(|,\s*a\s)/i,
    /"(the\s+)?company"/gi, /"(the\s+)?contractor"/gi, /"(the\s+)?client"/gi,
    /"(the\s+)?employee"/gi, /"(the\s+)?employer"/gi,
    /"(the\s+)?landlord"/gi, /"(the\s+)?tenant"/gi,
    /"(the\s+)?licensor"/gi, /"(the\s+)?licensee"/gi,
  ];
  const partyMatch = text.match(/(?:between|by and between)\s+"?([^"(\n]+?)"?\s*\(.*?\)\s*and\s+"?([^"(\n]+?)"?\s*\(/i);
  if (partyMatch) {
    parties.push(partyMatch[1].trim(), partyMatch[2].trim());
  } else {
    // Look for defined roles
    const roles = ['company', 'contractor', 'client', 'employee', 'employer', 'landlord', 'tenant', 'licensor', 'licensee', 'seller', 'buyer', 'provider', 'recipient', 'disclosing party', 'receiving party', 'service provider'];
    for (const role of roles) {
      if (new RegExp(`"?the ${role}"?`, 'i').test(text) || new RegExp(`\\("${role}"\\)`, 'i').test(text)) {
        parties.push(role.charAt(0).toUpperCase() + role.slice(1));
      }
    }
  }

  // Extract obligations
  const obligations = [];
  const obligationPatterns = [
    { pattern: /(?:shall|must|agrees? to|is required to|will)\s+([^.;]{10,80})/gi, strength: 'mandatory' },
    { pattern: /(?:should|may wish to|is encouraged to)\s+([^.;]{10,80})/gi, strength: 'recommended' },
  ];
  for (const op of obligationPatterns) {
    let m;
    while ((m = op.pattern.exec(text)) !== null) {
      const full = m[0].trim();
      if (full.length > 15 && full.length < 200) {
        obligations.push({ text: full, strength: op.strength });
      }
    }
    if (obligations.length > 25) break;
  }

  // Calculate risk score
  let riskScore = 20; // base
  for (const flag of redFlags) {
    if (flag.severity === 'high') riskScore += 12;
    else if (flag.severity === 'medium') riskScore += 6;
    else riskScore += 3;
  }
  // Adjust for document length (very short = suspicious)
  if (text.length < 500) riskScore += 10;
  // Cap at 100
  riskScore = Math.min(Math.max(riskScore, 5), 100);

  // Generate recommendations
  const recommendations = [];
  for (const flag of redFlags) {
    switch (flag.id) {
      case 'unlimited_liability':
        recommendations.push({ priority: 'high', text: 'Negotiate a liability cap (e.g., total fees paid under the contract).' }); break;
      case 'non_compete':
        recommendations.push({ priority: 'high', text: 'Narrow the non-compete: limit geographic scope, duration (max 1 year), and industry definition.' }); break;
      case 'ip_assignment':
        recommendations.push({ priority: 'high', text: 'Clarify IP ownership. Consider "license" instead of "assignment" — or limit to work created specifically for this project.' }); break;
      case 'arbitration':
        recommendations.push({ priority: 'medium', text: 'Consider negotiating the right to small claims court, or at minimum ensure arbitration is in a convenient location.' }); break;
      case 'auto_renewal':
        recommendations.push({ priority: 'medium', text: 'Set a calendar reminder before the renewal date. Negotiate a shorter notice period for cancellation.' }); break;
      case 'unilateral_modification':
        recommendations.push({ priority: 'high', text: 'Require mutual written consent for any changes to terms. Add "material changes require 30-day notice."' }); break;
      case 'termination_without_cause':
        recommendations.push({ priority: 'medium', text: 'Negotiate a longer notice period (60-90 days) and a "kill fee" for early termination.' }); break;
      case 'indemnification':
        recommendations.push({ priority: 'high', text: 'Make indemnification mutual. Cap indemnification obligations at the contract value.' }); break;
      case 'non_disparagement':
        recommendations.push({ priority: 'medium', text: 'Ensure non-disparagement is mutual. Carve out exceptions for truthful statements and legal proceedings.' }); break;
      case 'moonlighting_restriction':
        recommendations.push({ priority: 'medium', text: 'Negotiate to allow outside work that doesn\'t directly compete. Clarify what counts as "competing."' }); break;
      case 'personal_guarantee':
        recommendations.push({ priority: 'high', text: 'Try to remove the personal guarantee entirely, or cap it at a specific dollar amount.' }); break;
      case 'data_rights':
        recommendations.push({ priority: 'high', text: 'Limit data usage to what\'s necessary for the service. Require data deletion upon termination.' }); break;
      case 'confidentiality_overbroad':
        recommendations.push({ priority: 'medium', text: 'Define specific categories of confidential information. Set an expiration (2-5 years is standard).' }); break;
      case 'penalty_clause':
        recommendations.push({ priority: 'high', text: 'Ensure penalties are proportional to actual damages. Negotiate mutual penalty provisions.' }); break;
      case 'clawback':
        recommendations.push({ priority: 'high', text: 'Limit clawback to cases of fraud or willful misconduct. Set a time limit on clawback rights.' }); break;
      default:
        recommendations.push({ priority: flag.severity === 'high' ? 'high' : 'medium', text: `Review the ${flag.name.toLowerCase()} clause carefully. Consider consulting a lawyer.` });
    }
  }
  if (redFlags.length === 0) {
    recommendations.push({ priority: 'low', text: 'This contract looks relatively clean. Still worth having a lawyer review before signing.' });
  }

  // Unique recommendations
  const seen = new Set();
  const uniqueRecs = recommendations.filter(r => { if (seen.has(r.text)) return false; seen.add(r.text); return true; });

  return {
    documentType: docType,
    riskScore,
    riskLevel: riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
    redFlags: redFlags.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity])),
    keyTerms: [...new Map(keyTerms.map(t => [t.value, t])).values()].slice(0, 20),
    dates: [...new Set(dates)].slice(0, 10),
    parties: [...new Set(parties)].slice(0, 6),
    obligations: obligations.slice(0, 20),
    recommendations: uniqueRecs,
    wordCount: text.split(/\s+/).length,
    charCount: text.length,
  };
}


// ========== NEGOTIATION SUGGESTIONS ENGINE ==========
const NEGOTIATION_SUGGESTIONS = {
  unlimited_liability: {
    priority: 'must-negotiate',
    suggestedLanguage: '"The total aggregate liability of either party under this Agreement shall not exceed the total fees paid or payable during the 12-month period preceding the claim."',
    negotiationTip: 'Frame liability caps as industry standard. Most businesses accept caps tied to contract value. Start by proposing a cap equal to fees paid, then negotiate up if needed.',
    leveragePoints: ['Liability caps are standard in virtually all commercial contracts', 'Insurance carriers often require liability caps', 'Unlimited liability is a dealbreaker for most legal departments']
  },
  rights_waiver: {
    priority: 'must-negotiate',
    suggestedLanguage: '"Nothing in this Agreement shall be construed as a waiver of either party\'s rights under applicable federal, state, or local law."',
    negotiationTip: 'Rights waivers are often unenforceable anyway. Push to remove entirely or narrow to specific, named rights with clear consideration in return.',
    leveragePoints: ['Many rights waivers are unenforceable in court', 'Broad waivers suggest the other party expects disputes', 'You can offer specific, narrow waivers in exchange for better terms elsewhere']
  },
  unilateral_modification: {
    priority: 'must-negotiate',
    suggestedLanguage: '"No modification, amendment, or waiver of any provision of this Agreement shall be effective unless in writing and signed by both parties."',
    negotiationTip: 'This is a non-starter for most sophisticated parties. Insist on mutual written consent for all changes. If they push back, require 60-day notice plus right to terminate if you disagree.',
    leveragePoints: ['Unilateral modification undermines contract certainty', 'Courts often view these clauses unfavorably', 'Propose a compromise: they can modify with 60-day notice, but you can terminate without penalty if you object']
  },
  auto_renewal: {
    priority: 'should-negotiate',
    suggestedLanguage: '"This Agreement shall not automatically renew. Any renewal must be mutually agreed upon in writing at least 30 days before the expiration of the current term."',
    negotiationTip: 'If they insist on auto-renewal, negotiate a shorter notice window (30 days instead of 90-120) and require them to send a reminder notice 45 days before the renewal date.',
    leveragePoints: ['Auto-renewal often benefits the drafter disproportionately', 'Propose month-to-month after initial term as alternative', 'Many jurisdictions require conspicuous disclosure of auto-renewal terms']
  },
  non_compete: {
    priority: 'must-negotiate',
    suggestedLanguage: '"For a period of 6 months following termination, [Party] shall not directly solicit the specific clients served during the term of this Agreement within [City/County]. This restriction shall not apply to general advertising or inbound inquiries."',
    negotiationTip: 'Non-competes must be narrow to be enforceable. Push for: (1) shorter duration (6 months max), (2) limited geography, (3) specific activity restrictions rather than broad industry bans. Many states limit or ban non-competes entirely.',
    leveragePoints: ['Non-competes are unenforceable in California, Oklahoma, North Dakota, and Minnesota', 'Courts routinely strike down overbroad non-competes', 'FTC has proposed banning most non-competes', 'Offer a non-solicitation as a compromise']
  },
  non_solicit: {
    priority: 'should-negotiate',
    suggestedLanguage: '"For 12 months following termination, neither party shall directly solicit employees or contractors who were actively engaged during the final 6 months of the term."',
    negotiationTip: 'Make it mutual and time-limited. Exclude people who respond to general job postings. Define "solicit" narrowly as direct, personal outreach.',
    leveragePoints: ['Mutual non-solicitation is more enforceable than one-sided', 'General job postings should never count as solicitation', 'Standard duration is 12 months, push back on anything longer']
  },
  arbitration: {
    priority: 'should-negotiate',
    suggestedLanguage: '"Disputes shall first be submitted to mediation. If unresolved after 30 days, either party may pursue binding arbitration or litigation in [mutually agreed location]. Claims under $25,000 may be brought in small claims court."',
    negotiationTip: 'Push for mediation-first, then arbitration. Ensure arbitration location is convenient for you. Preserve the right to go to small claims court for minor disputes. Negotiate cost-sharing for arbitration fees.',
    leveragePoints: ['Arbitration costs can exceed $10,000 in filing fees alone', 'Requiring mediation first often resolves disputes cheaper', 'Small claims court carve-out is standard and reasonable']
  },
  indemnification: {
    priority: 'must-negotiate',
    suggestedLanguage: '"Each party shall indemnify and hold harmless the other party from claims arising from its own negligence, willful misconduct, or material breach of this Agreement. Total indemnification obligations shall not exceed the fees paid under this Agreement."',
    negotiationTip: 'Always push for mutual indemnification. Cap it at the contract value. Exclude indemnification for the other party\'s own negligence. Require prompt notice and right to control defense.',
    leveragePoints: ['One-sided indemnification is a red flag for any attorney', 'Mutual indemnification is the professional standard', 'Cap indemnification at contract value — this is widely accepted']
  },
  termination_without_cause: {
    priority: 'should-negotiate',
    suggestedLanguage: '"Either party may terminate this Agreement with 60 days\' written notice. Upon termination without cause, [paying party] shall compensate [service party] for all work completed through the termination date, plus a termination fee equal to 30 days\' fees."',
    negotiationTip: 'Negotiate longer notice periods (60-90 days) and a "kill fee" to cover transition costs. Ensure you get paid for work already completed regardless of termination reason.',
    leveragePoints: ['Termination without cause is standard, but notice period matters', 'Kill fees compensate for opportunity cost of turning down other work', 'Payment for completed work should be non-negotiable']
  },
  penalty_clause: {
    priority: 'must-negotiate',
    suggestedLanguage: '"In the event of early termination, the terminating party shall pay liquidated damages equal to [reasonable amount], which the parties agree represents a reasonable estimate of actual damages."',
    negotiationTip: 'Penalties must be proportional to actual damages to be enforceable. Push for actual damages language instead of fixed penalties. If a fixed amount is required, ensure it\'s reasonable.',
    leveragePoints: ['Courts can strike down penalties that are disproportionate to actual damages', 'The term "penalty" itself suggests unenforceability — "liquidated damages" is the legally proper term', 'Propose mutual penalty provisions for fairness']
  },
  ip_assignment: {
    priority: 'must-negotiate',
    suggestedLanguage: '"Client receives an exclusive, perpetual license to use all deliverables created under this Agreement. Contractor retains ownership of pre-existing IP and general tools/methodologies. Contractor may display deliverables in portfolio with Client approval."',
    negotiationTip: 'Push for license instead of assignment. Retain ownership of pre-existing IP, general skills, and tools. Negotiate portfolio usage rights. If assignment is required, carve out pre-existing IP and ensure fair compensation.',
    leveragePoints: ['License vs. assignment is a standard negotiation point', 'Pre-existing IP should never be assigned', 'Portfolio rights are important for future business', 'If they insist on assignment, increase your fee by 20-30% to compensate']
  },
  non_disparagement: {
    priority: 'should-negotiate',
    suggestedLanguage: '"Neither party shall make materially false statements about the other party. This provision shall not restrict truthful statements made in legal proceedings, regulatory filings, or good-faith reviews."',
    negotiationTip: 'Make it mutual and narrow. Protect your right to give honest reviews and make truthful statements. Ensure it doesn\'t prevent you from discussing factual experiences.',
    leveragePoints: ['Non-disparagement should always be mutual', 'Truthful statements are often protected by law regardless', 'Carving out legal proceedings and regulatory matters is standard']
  },
  moonlighting_restriction: {
    priority: 'should-negotiate',
    suggestedLanguage: '"Employee may engage in outside activities, including freelance work, provided such activities do not directly compete with the Company\'s business, interfere with Employee\'s duties, or use Company resources."',
    negotiationTip: 'Push for the right to do non-competing work. Define "competing" narrowly. Ensure personal projects and open-source contributions are explicitly permitted.',
    leveragePoints: ['Blanket moonlighting bans are increasingly seen as overreach', 'Many top employers (Google, Microsoft) allow side projects', 'Skilled workers can negotiate this easily — it\'s a retention issue']
  },
  confidentiality_overbroad: {
    priority: 'should-negotiate',
    suggestedLanguage: '"Confidential Information means information clearly marked as confidential or that a reasonable person would understand to be confidential. Confidentiality obligations expire 3 years after termination. General skills, knowledge, and experience are not confidential."',
    negotiationTip: 'Narrow the definition. Add a time limit (2-5 years). Explicitly exclude publicly available information, independently developed knowledge, and general skills.',
    leveragePoints: ['Perpetual confidentiality is unenforceable in many jurisdictions', 'Courts prefer specific, bounded definitions', 'Your general skills and industry knowledge can\'t be made confidential']
  },
  personal_guarantee: {
    priority: 'must-negotiate',
    suggestedLanguage: '"All obligations under this Agreement are obligations of [Business Entity] only. No individual shall be personally liable for the obligations of [Business Entity]."',
    negotiationTip: 'Try to eliminate entirely. If required, cap the personal guarantee at a specific dollar amount and set an expiration date. Consider offering additional collateral or a larger security deposit instead.',
    leveragePoints: ['Personal guarantees defeat the purpose of having an LLC/corporation', 'Offer alternative security: larger deposit, letter of credit, or phased payments', 'If unavoidable, cap it and add an expiration date']
  },
  data_rights: {
    priority: 'must-negotiate',
    suggestedLanguage: '"Provider may use Customer data solely to provide the Service. Aggregated, anonymized data may be used for product improvement only. Customer data shall be deleted within 30 days of termination upon request."',
    negotiationTip: 'Limit data usage to service delivery. Require anonymization for any analytics. Add data deletion requirements upon termination. Prohibit selling data to third parties.',
    leveragePoints: ['GDPR, CCPA, and other privacy laws increasingly restrict data usage', 'Data rights grab is a PR liability — companies are sensitive about this', 'Offer to allow anonymized analytics as a compromise for removing broad rights']
  },
  force_majeure: {
    priority: 'nice-to-have',
    suggestedLanguage: '"Neither party shall be liable for failure to perform due to circumstances beyond its reasonable control. If the force majeure event continues for more than 60 days, either party may terminate this Agreement without penalty."',
    negotiationTip: 'Ensure force majeure applies equally to both parties. Add a termination right if the event lasts beyond a reasonable period (30-90 days).',
    leveragePoints: ['Mutual force majeure is fair and standard', 'A termination trigger prevents indefinite suspension', 'Post-COVID, force majeure clauses receive more scrutiny']
  },
  late_payment: {
    priority: 'should-negotiate',
    suggestedLanguage: '"Payment shall be due within 30 days of invoice. Late payments shall accrue interest at 1% per month or the maximum rate permitted by law, whichever is less."',
    negotiationTip: 'Push for Net-30 or Net-15 terms. Negotiate reasonable late fees. For large projects, negotiate milestone payments rather than payment upon completion.',
    leveragePoints: ['Net-30 is the business standard — anything longer is unfavorable', 'Milestone payments reduce your financial risk on long projects', 'Late payment interest motivates timely payment']
  },
  warranty_disclaimer: {
    priority: 'should-negotiate',
    suggestedLanguage: '"Provider warrants that the Service shall perform materially in accordance with the documentation for a period of 90 days. Provider shall correct any material defects at no additional cost."',
    negotiationTip: 'Push for at least a basic warranty of merchantability. For services, request a warranty that work will be performed in a professional manner. Negotiate a correction period for defects.',
    leveragePoints: ['Complete warranty disclaimers are uncommon in service agreements', 'A basic performance warranty is reasonable and standard', '"As-is" is appropriate for used goods, not professional services']
  },
  clawback: {
    priority: 'must-negotiate',
    suggestedLanguage: '"Clawback provisions apply only in cases of fraud, material misrepresentation, or breach of fiduciary duty, and only for payments made within the preceding 6 months."',
    negotiationTip: 'Limit clawback to fraud/misconduct only. Add a time limit. Ensure the clawback amount is proportional to the harm caused, not a blanket return of all compensation.',
    leveragePoints: ['Broad clawback provisions create financial uncertainty', 'Limiting to fraud/misconduct is the professional standard', 'Time limits on clawback are essential — 6-12 months max']
  },
  moral_rights_waiver: {
    priority: 'nice-to-have',
    suggestedLanguage: '"Creator retains the right of attribution. Client shall credit Creator in any public-facing use of the work, unless Creator requests otherwise in writing."',
    negotiationTip: 'Push for attribution rights, especially for creative/design work. At minimum, negotiate portfolio usage rights so you can showcase your work.',
    leveragePoints: ['Attribution costs the client nothing but means a lot to creators', 'Many jurisdictions make moral rights non-waivable', 'Portfolio rights help you get future business — frame it as win-win']
  },
  automatic_price_increase: {
    priority: 'should-negotiate',
    suggestedLanguage: '"Fees shall remain fixed during the initial term. Upon renewal, fees may increase by no more than 3% per year or the Consumer Price Index (CPI), whichever is lower."',
    negotiationTip: 'Cap annual increases at 3-5% or tie them to CPI. Require advance notice of price changes. Negotiate the right to terminate without penalty if increases exceed the cap.',
    leveragePoints: ['Uncapped increases can double costs over time', 'CPI-linked increases are fair and predictable', 'Right to terminate on price increase gives you leverage']
  },
  no_cure_period: {
    priority: 'should-negotiate',
    suggestedLanguage: '"In the event of a breach, the non-breaching party shall provide written notice specifying the breach. The breaching party shall have 30 days to cure the breach before termination."',
    negotiationTip: 'A cure period is fundamental fairness. Push for 30 days for non-payment issues, 15 days for payment issues. Ensure notice must be in writing with specific details.',
    leveragePoints: ['Cure periods are standard in virtually all commercial contracts', 'Courts view no-cure-period contracts less favorably', 'Immediate termination rights suggest bad faith']
  },
  governing_law: {
    priority: 'nice-to-have',
    suggestedLanguage: '"This Agreement shall be governed by the laws of [your state]. Any litigation shall be brought in [your county/city]."',
    negotiationTip: 'Try for your home jurisdiction. If not possible, negotiate for a neutral location or allow for remote proceedings. At minimum, ensure the jurisdiction is reasonable for both parties.',
    leveragePoints: ['Home court advantage is real — travel costs, local counsel', 'Many courts now allow remote proceedings', 'A neutral jurisdiction is a fair compromise']
  },
  venue_selection: {
    priority: 'nice-to-have',
    suggestedLanguage: '"Venue for any legal proceedings shall be in [mutually convenient location], or either party may request proceedings be conducted remotely."',
    negotiationTip: 'Negotiate for your local venue or a neutral location. Remote proceedings are increasingly accepted and save both parties money.',
    leveragePoints: ['Remote proceedings reduce costs for both parties', 'Inconvenient venue can effectively deny access to justice', 'Courts are sympathetic to venue fairness arguments']
  },
  assignment_restriction: {
    priority: 'nice-to-have',
    suggestedLanguage: '"Neither party may assign this Agreement without written consent, which shall not be unreasonably withheld. Assignment in connection with a merger, acquisition, or sale of substantially all assets shall be permitted."',
    negotiationTip: 'Ensure assignment is permitted for M&A transactions. Add "consent shall not be unreasonably withheld" language.',
    leveragePoints: ['M&A assignment carve-outs are standard', '"Not unreasonably withheld" prevents arbitrary blocking', 'This matters if you ever sell your business']
  },
  limitation_of_remedy: {
    priority: 'should-negotiate',
    suggestedLanguage: '"Limitation of liability shall not apply to: (a) breaches of confidentiality; (b) intellectual property infringement; (c) indemnification obligations; or (d) willful misconduct or gross negligence."',
    negotiationTip: 'Accept reasonable liability caps but carve out exceptions for serious breaches. The cap should be at least 12 months of fees, not a nominal amount.',
    leveragePoints: ['Carve-outs for serious breaches are industry standard', 'A $10 liability cap is effectively no liability at all', 'Insurance can cover liability concerns — ask if they have E&O insurance']
  },
  entire_agreement: {
    priority: 'nice-to-have',
    suggestedLanguage: null,
    negotiationTip: 'Before signing, ensure ALL promises made during negotiations are included in the written agreement. If they said it but didn\'t write it, it doesn\'t count.',
    leveragePoints: ['This is standard and generally acceptable', 'Use it as motivation to get everything in writing', 'Reference specific emails or proposals that should be incorporated']
  },
  severability_missing: {
    priority: 'nice-to-have',
    suggestedLanguage: '"If any provision of this Agreement is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect."',
    negotiationTip: 'Adding a severability clause protects both parties. It\'s a standard boilerplate provision that the other side should readily accept.',
    leveragePoints: ['Severability is standard boilerplate', 'Both parties benefit from it', 'Its absence is usually an oversight, not intentional']
  },
  survival_clause: {
    priority: 'nice-to-have',
    suggestedLanguage: '"Only Sections [specific sections] shall survive termination, for a period not exceeding 24 months after the termination date."',
    negotiationTip: 'Review which obligations survive and for how long. Push for specific time limits on survival rather than indefinite post-termination obligations.',
    leveragePoints: ['Indefinite survival is often unenforceable', 'Specific sections and time limits create clarity', 'Standard survival period is 12-24 months']
  }
};

function generateNegotiationPlaybook(redFlags) {
  const suggestions = [];
  for (const flag of redFlags) {
    const neg = NEGOTIATION_SUGGESTIONS[flag.id];
    if (neg) {
      suggestions.push({
        flagId: flag.id,
        flagName: flag.name,
        severity: flag.severity,
        priority: neg.priority,
        problematicClause: flag.context || '',
        whyRisky: flag.plainEnglish || flag.description,
        suggestedLanguage: neg.suggestedLanguage,
        negotiationTip: neg.negotiationTip,
        leveragePoints: neg.leveragePoints || []
      });
    } else {
      // Generic suggestion for unknown flags
      suggestions.push({
        flagId: flag.id,
        flagName: flag.name,
        severity: flag.severity,
        priority: flag.severity === 'high' ? 'must-negotiate' : flag.severity === 'medium' ? 'should-negotiate' : 'nice-to-have',
        problematicClause: flag.context || '',
        whyRisky: flag.plainEnglish || flag.description,
        suggestedLanguage: null,
        negotiationTip: 'Review this clause carefully with legal counsel. Consider requesting mutual obligations and reasonable limitations.',
        leveragePoints: ['Industry standards favor balanced terms', 'Courts tend to interpret ambiguous terms against the drafter']
      });
    }
  }
  // Sort by priority
  const priorityOrder = { 'must-negotiate': 0, 'should-negotiate': 1, 'nice-to-have': 2 };
  suggestions.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));
  return {
    suggestions,
    summary: {
      total: suggestions.length,
      mustNegotiate: suggestions.filter(s => s.priority === 'must-negotiate').length,
      shouldNegotiate: suggestions.filter(s => s.priority === 'should-negotiate').length,
      niceToHave: suggestions.filter(s => s.priority === 'nice-to-have').length
    }
  };
}

// ========== COMPARE TWO CONTRACTS ==========

// ========== CLAUSE-BY-CLAUSE ANNOTATION ==========
function annotateContractClauses(text) {
  // Split contract into clauses by common patterns
  const clausePatterns = [
    /(?:^|\n)\s*(?:\d+\.(?:\d+\.?)*)\s+/gm,           // 1. 2. 3.1 etc.
    /(?:^|\n)\s*(?:Section|Article|Clause)\s+\d+/gim,   // Section 1, Article 2
    /(?:^|\n)\s*(?:[A-Z]\.)\s+/gm,                      // A. B. C.
    /(?:^|\n)\s*(?:[ivxlc]+\.)\s+/gm,                   // i. ii. iii.
  ];
  
  // Try to split by numbered sections first
  let clauses = [];
  const sectionRegex = /(?:^|\n)\s*(?:(?:\d+\.(?:\d+\.?)*)|(?:(?:Section|Article|Clause)\s+\d+[^:\n]*:?)|(?:[A-Z]\.)\s)/gim;
  const matches = [...text.matchAll(sectionRegex)];
  
  if (matches.length >= 3) {
    // Use matched sections
    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index;
      const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
      const clauseText = text.slice(start, end).trim();
      if (clauseText.length > 20) {
        clauses.push(clauseText);
      }
    }
    // Add preamble if there's text before first match
    if (matches[0].index > 50) {
      clauses.unshift(text.slice(0, matches[0].index).trim());
    }
  } else {
    // Fall back to paragraph splitting
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20);
    clauses = paragraphs;
  }
  
  if (clauses.length === 0) {
    clauses = [text];
  }

  // Annotate each clause
  const CLAUSE_ANNOTATIONS = [
    { patterns: [/unlimited liability/i, /shall be liable for all/i, /liability shall not be (limited|capped)/i], risk: 'red', label: 'Unlimited Liability', explanation: 'This clause removes any cap on what you could owe. There is no maximum limit on your financial exposure.', concern: 'Without a liability cap, you could be responsible for damages far exceeding the value of the contract.', alternative: 'Consider: "Total liability under this agreement shall not exceed the fees paid in the preceding 12 months."' },
    { patterns: [/waive(s)? (any |all )?rights?/i, /surrender(s)? (any |all )?rights?/i, /relinquish/i, /forfeit(s)? (any |all )?rights?/i], risk: 'red', label: 'Rights Waiver', explanation: 'You are giving up legal protections or entitlements that you would normally have.', concern: 'Once waived, these rights are extremely difficult or impossible to reclaim.', alternative: 'Consider: "Nothing in this agreement shall be construed as a waiver of rights under applicable law."' },
    { patterns: [/may (modify|change|alter|amend|update) (this|the) (agreement|contract|terms)/i, /reserves? the right to (modify|change|alter|amend)/i], risk: 'red', label: 'Unilateral Modification', explanation: 'The other party can change the terms of this agreement without needing your approval.', concern: 'They could change pricing, obligations, or other critical terms at any time.', alternative: 'Consider: "Any amendments to this agreement must be in writing and signed by both parties."' },
    { patterns: [/at (its|our|their) sole discretion/i], risk: 'red', label: 'Sole Discretion', explanation: 'One party has complete decision-making power with no requirement to be reasonable or fair.', concern: 'Sole discretion means they don\'t need to justify their decisions to you.', alternative: 'Consider: "at its reasonable discretion" or "with mutual agreement of both parties."' },
    { patterns: [/without (prior )?notice/i], risk: 'yellow', label: 'No Notice Required', explanation: 'Actions can be taken without informing you first.', concern: 'You may not have time to prepare or respond to changes.', alternative: 'Consider: "with at least 30 days\' written notice."' },
    { patterns: [/auto(matically)?[- ]renew/i, /shall (automatically )?renew/i], risk: 'yellow', label: 'Auto-Renewal', explanation: 'This contract will automatically extend for another term unless you actively cancel.', concern: 'If you forget to cancel before the deadline, you\'re locked in for another period.', alternative: 'Consider: "This agreement shall expire at the end of the initial term unless both parties agree in writing to renew."' },
    { patterns: [/non[- ]?compete/i, /shall not (compete|engage in)/i, /covenant not to compete/i, /restrictive covenant/i], risk: 'red', label: 'Non-Compete', explanation: 'After this agreement ends, you are restricted from working in competing businesses.', concern: 'Overly broad non-competes can prevent you from earning a living in your field.', alternative: 'Consider narrowing: "limited to [specific geography] for a period not exceeding 6 months, covering only [specific activities]."' },
    { patterns: [/non[- ]?solicit/i, /shall not (solicit|recruit|hire)/i], risk: 'yellow', label: 'Non-Solicitation', explanation: 'You cannot approach or recruit their employees or clients.', concern: 'This may limit your business relationships even after the contract ends.', alternative: 'Consider: "Non-solicitation shall apply only during the term and for 6 months after termination."' },
    { patterns: [/binding arbitration/i, /mandatory arbitration/i, /shall be (resolved|settled) (by|through) arbitration/i], risk: 'yellow', label: 'Mandatory Arbitration', explanation: 'Any disputes must go through private arbitration instead of the court system.', concern: 'Arbitration can be expensive, and decisions are nearly impossible to appeal.', alternative: 'Consider: "Disputes under $10,000 may be brought in small claims court. All other disputes shall be resolved through mediation before arbitration."' },
    { patterns: [/waive.{0,20}(right to|jury) trial/i, /class action waiver/i], risk: 'red', label: 'Trial/Class Action Waiver', explanation: 'You are giving up your right to a jury trial or to join a class-action lawsuit.', concern: 'If many people are harmed by the same issue, you cannot band together for legal action.', alternative: 'Consider removing this clause entirely or limiting waiver to specific dispute types.' },
    { patterns: [/indemnif(y|ies|ication)/i, /hold harmless/i, /defend and indemnify/i], risk: 'red', label: 'Indemnification', explanation: 'You agree to cover the other party\'s legal costs and damages if claims arise.', concern: 'One-sided indemnification means you bear all the financial risk of third-party claims.', alternative: 'Consider: "Each party shall indemnify the other for claims arising from its own negligence or breach." (mutual indemnification)' },
    { patterns: [/terminat(e|ion) (without|for no) cause/i, /terminat(e|ion) at (any time|will|its sole)/i, /immediately terminat/i], risk: 'yellow', label: 'Termination Rights', explanation: 'The contract can be ended, potentially without reason or with short notice.', concern: 'You could lose income or access with little or no warning.', alternative: 'Consider: "Either party may terminate with 60 days\' written notice. Upon termination, payment for work completed shall be due within 15 days."' },
    { patterns: [/liquidated damages/i, /penalty (of|for|clause)/i, /early termination fee/i], risk: 'red', label: 'Penalty Clause', explanation: 'If you breach or exit early, you owe a specific financial penalty.', concern: 'Penalties may be disproportionate to actual damages suffered.', alternative: 'Consider: "Liquidated damages shall be limited to actual demonstrable losses, not to exceed [specific amount]."' },
    { patterns: [/assign(s|ment)?.{0,30}(intellectual property|IP|copyright|patent|trademark)/i, /work(s)?[- ]?(made)?[- ]?for[- ]?hire/i, /hereby assign/i], risk: 'red', label: 'IP Assignment', explanation: 'Ownership of intellectual property you create is being transferred to the other party.', concern: 'You lose all rights to your own work — you can\'t reuse it, display it, or build upon it.', alternative: 'Consider: "Contractor grants Client a perpetual license to use deliverables. Contractor retains underlying IP and portfolio rights."' },
    { patterns: [/non[- ]?disparagement/i, /shall not (make|publish).{0,30}(negative|disparaging)/i], risk: 'yellow', label: 'Non-Disparagement', explanation: 'You cannot make negative public statements about the other party.', concern: 'Even truthful criticism or honest reviews could be considered a violation.', alternative: 'Consider: "Non-disparagement shall be mutual and shall not restrict truthful statements made in legal proceedings or regulatory filings."' },
    { patterns: [/devote.{0,20}(full|entire|exclusive).{0,20}(time|attention|effort)/i, /shall not (engage in|perform).{0,30}(other|outside)/i, /exclusiv(e|ity) (of service|engagement)/i], risk: 'yellow', label: 'Exclusivity/Moonlighting Restriction', explanation: 'You are restricted from doing other work or side projects during this agreement.', concern: 'This could prevent freelancing, consulting, or personal projects.', alternative: 'Consider: "Employee may engage in outside activities provided they do not directly compete or interfere with duties under this agreement."' },
    { patterns: [/all (information|materials|data).{0,30}confidential/i, /perpetual(ly)? confidential/i, /in perpetuity/i], risk: 'yellow', label: 'Broad Confidentiality', explanation: 'A wide range of information is classified as confidential, potentially indefinitely.', concern: 'Overly broad definitions can restrict your general knowledge and skills.', alternative: 'Consider: "Confidential information shall be specifically marked as such. Obligations expire 3 years after termination."' },
    { patterns: [/govern(ed|ing) (by the )?law(s)? of/i, /jurisdiction of the courts of/i, /exclusive (jurisdiction|venue)/i], risk: 'green', label: 'Governing Law', explanation: 'This specifies which state/country\'s laws apply and where disputes are handled.', concern: 'If the jurisdiction is far from you, legal proceedings could be costly and inconvenient.', alternative: null },
    { patterns: [/entire agreement/i, /supersedes? (all )?prior/i], risk: 'green', label: 'Entire Agreement', explanation: 'This document replaces all prior negotiations, agreements, and promises.', concern: 'Any verbal promises or email agreements that aren\'t in this document are no longer valid.', alternative: null },
    { patterns: [/severab/i], risk: 'green', label: 'Severability', explanation: 'If any part of this contract is found invalid, the rest still stands.', concern: 'This is a standard protective clause — generally favorable for both parties.', alternative: null },
    { patterns: [/shall survive (termination|expiration)/i, /survive(s)? the (termination|expiration)/i], risk: 'yellow', label: 'Survival Clause', explanation: 'Certain obligations continue even after the contract ends.', concern: 'Check which specific obligations survive — non-competes and confidentiality often outlast the contract.', alternative: 'Consider: "Only Sections [X] and [Y] shall survive termination, for a period not exceeding 12 months."' },
    { patterns: [/personal(ly)? guarantee/i, /jointly and severally/i], risk: 'red', label: 'Personal Guarantee', explanation: 'You are personally responsible — not just your business entity.', concern: 'Your personal assets (home, savings) could be at risk if obligations aren\'t met.', alternative: 'Consider removing the personal guarantee or capping it: "Personal guarantee shall not exceed $[amount]."' },
    { patterns: [/irrevocable.{0,20}license/i, /perpetual.{0,20}license/i, /right to (use|sell|share).{0,20}(data|information|content)/i], risk: 'red', label: 'Data/Content Rights', explanation: 'The other party receives broad, potentially permanent rights to your data or content.', concern: 'They could use, sell, or sublicense your data without further consent or compensation.', alternative: 'Consider: "License is limited to the purpose of this agreement and terminates upon contract expiration."' },
    { patterns: [/as[- ]?is/i, /without warranty/i, /disclaims? (all |any )?warrant/i], risk: 'yellow', label: 'Warranty Disclaimer', explanation: 'The product or service comes with no guarantees of quality or fitness.', concern: 'If something doesn\'t work, you may have no recourse.', alternative: 'Consider: "Provider warrants that services shall be performed in a professional and workmanlike manner."' },
    { patterns: [/clawback/i, /repay(ment)?.{0,30}(bonus|commission|payment)/i], risk: 'red', label: 'Clawback', explanation: 'Money already paid to you can be demanded back under certain conditions.', concern: 'Even if you\'ve spent the money, you could be forced to return it.', alternative: 'Consider: "Clawback applies only in cases of fraud or material misrepresentation, within 6 months of payment."' },
    { patterns: [/moral rights/i, /waive.{0,30}moral/i], risk: 'yellow', label: 'Moral Rights Waiver', explanation: 'You waive the right to be credited for your creative work.', concern: 'Your work can be modified, used without attribution, or credited to someone else.', alternative: 'Consider: "Creator retains the right of attribution for all published works."' },
    { patterns: [/force majeure/i, /act(s)? of god/i, /beyond.{0,20}(reasonable )?control/i], risk: 'green', label: 'Force Majeure', explanation: 'Excuses performance failures caused by extraordinary events (war, natural disasters, etc).', concern: 'Check if this protection applies equally to both parties.', alternative: null },
    { patterns: [/price.{0,20}increase/i, /rate.{0,20}increase/i, /escalat(e|ion)/i, /annual increase/i], risk: 'yellow', label: 'Price Escalation', explanation: 'Costs may automatically increase over time.', concern: 'Without a cap, increases could become unaffordable.', alternative: 'Consider: "Annual increases shall not exceed 3% or CPI, whichever is lower."' },
    { patterns: [/net[- ]?(30|45|60|90)/i, /payment.{0,30}(within|due in) (60|90|120)/i], risk: 'yellow', label: 'Payment Terms', explanation: 'Specifies when payment is due after invoicing.', concern: 'Long payment terms (Net-60, Net-90) can cause cash flow problems.', alternative: 'Consider: "Payment due within 15 days of invoice. Late payments accrue interest at 1.5% per month."' },
    { patterns: [/may not (assign|transfer)/i, /shall not (assign|transfer)/i], risk: 'green', label: 'Assignment Restriction', explanation: 'You cannot transfer this contract to another party.', concern: 'If you sell your business, this contract may not transfer with it.', alternative: null },
    { patterns: [/renewal period/i, /unless (written )?notice.{0,30}(days?|months?)/i], risk: 'yellow', label: 'Renewal Terms', explanation: 'Details how and when the contract renews.', concern: 'Make sure you know the exact cancellation deadline.', alternative: null },
    { patterns: [/terminat(e|ion) (with|upon) (\d+|thirty|sixty|ninety) days?' notice/i], risk: 'green', label: 'Notice Period for Termination', explanation: 'The contract requires advance notice before termination.', concern: 'Standard clause — check the notice period is reasonable for your situation.', alternative: null },
    { patterns: [/sole (and exclusive )?remedy/i, /exclusive remedy/i, /maximum (aggregate )?liability.{0,30}shall not exceed/i], risk: 'yellow', label: 'Limitation of Remedy', explanation: 'Your legal options for recovery are capped or restricted.', concern: 'Maximum recovery could be much less than your actual damages.', alternative: 'Consider: "Limitation of liability shall not apply to breaches of confidentiality, IP infringement, or willful misconduct."' },
  ];

  const annotatedClauses = clauses.map((clauseText, idx) => {
    const annotations = [];
    const lower = clauseText.toLowerCase();
    
    for (const ann of CLAUSE_ANNOTATIONS) {
      for (const pattern of ann.patterns) {
        if (pattern.test(clauseText)) {
          annotations.push({
            risk: ann.risk,
            label: ann.label,
            explanation: ann.explanation,
            concern: ann.concern,
            alternative: ann.alternative,
          });
          break;
        }
      }
    }

    // Determine overall clause risk
    let risk = 'green';
    if (annotations.some(a => a.risk === 'red')) risk = 'red';
    else if (annotations.some(a => a.risk === 'yellow')) risk = 'yellow';

    // Extract a title from the clause
    const firstLine = clauseText.split('\n')[0].trim().slice(0, 100);
    const title = firstLine.replace(/^\d+\.?\d*\.?\s*/, '').replace(/[:.]\s*$/, '').trim() || `Clause ${idx + 1}`;

    return {
      index: idx + 1,
      title: title.length > 80 ? title.slice(0, 77) + '...' : title,
      text: clauseText,
      risk,
      annotations,
    };
  });

  // Stats
  const stats = {
    total: annotatedClauses.length,
    safe: annotatedClauses.filter(c => c.risk === 'green').length,
    caution: annotatedClauses.filter(c => c.risk === 'yellow').length,
    danger: annotatedClauses.filter(c => c.risk === 'red').length,
  };

  return { clauses: annotatedClauses, stats };
}
function compareContracts(text1, text2) {
  const a1 = analyzeContract(text1);
  const a2 = analyzeContract(text2);

  const flagsOnlyIn1 = a1.redFlags.filter(f => !a2.redFlags.find(f2 => f2.id === f.id));
  const flagsOnlyIn2 = a2.redFlags.filter(f => !a1.redFlags.find(f2 => f2.id === f.id));
  const flagsInBoth = a1.redFlags.filter(f => a2.redFlags.find(f2 => f2.id === f.id));

  return {
    contract1: a1,
    contract2: a2,
    comparison: {
      riskDifference: a2.riskScore - a1.riskScore,
      safer: a1.riskScore <= a2.riskScore ? 'contract1' : 'contract2',
      flagsOnlyInFirst: flagsOnlyIn1,
      flagsOnlyInSecond: flagsOnlyIn2,
      flagsInBoth,
      summary: generateComparisonSummary(a1, a2, flagsOnlyIn1, flagsOnlyIn2)
    }
  };
}

function generateComparisonSummary(a1, a2, only1, only2) {
  const lines = [];
  if (a1.riskScore === a2.riskScore) {
    lines.push('Both contracts have similar risk levels.');
  } else {
    const safer = a1.riskScore < a2.riskScore ? 'Contract 1' : 'Contract 2';
    const riskier = a1.riskScore < a2.riskScore ? 'Contract 2' : 'Contract 1';
    lines.push(`${safer} is safer (risk score ${Math.min(a1.riskScore, a2.riskScore)} vs ${Math.max(a1.riskScore, a2.riskScore)}).`);
  }
  if (only1.length > 0) lines.push(`Contract 1 has ${only1.length} unique risk(s): ${only1.map(f => f.name).join(', ')}.`);
  if (only2.length > 0) lines.push(`Contract 2 has ${only2.length} unique risk(s): ${only2.map(f => f.name).join(', ')}.`);
  if (a1.documentType.type !== a2.documentType.type) {
    lines.push(`Different document types: ${a1.documentType.label} vs ${a2.documentType.label}.`);
  }
  return lines;
}

// ========== SAMPLE CONTRACTS ==========
const SAMPLE_CONTRACTS = {
  nda: {
    name: 'Non-Disclosure Agreement',
    icon: '🔒',
    description: 'Standard mutual NDA with some aggressive terms',
    text: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of January 15, 2026, by and between TechVentures Inc. ("Disclosing Party") and the undersigned individual ("Receiving Party").

1. CONFIDENTIAL INFORMATION
All information, in any form, disclosed by the Disclosing Party to the Receiving Party shall be considered confidential information, including but not limited to business plans, customer lists, financial data, technical specifications, trade secrets, and any other proprietary information.

2. OBLIGATIONS
The Receiving Party shall not disclose, publish, or otherwise reveal any Confidential Information to any third party. The Receiving Party shall use the Confidential Information solely for the purpose of evaluating a potential business relationship.

3. DURATION
This obligation of confidentiality shall survive termination of this Agreement and shall remain in effect in perpetuity.

4. NON-SOLICITATION
The Receiving Party shall not solicit, recruit, or hire any employees, contractors, or consultants of the Disclosing Party for a period of 3 years following termination of this Agreement.

5. NON-DISPARAGEMENT
The Receiving Party shall not make or publish any negative, disparaging, or derogatory statements about the Disclosing Party, its products, services, officers, or employees, whether oral or written.

6. REMEDIES
The Receiving Party acknowledges that any breach of this Agreement may cause irreparable harm and that the Disclosing Party shall be entitled to seek injunctive relief without the necessity of posting a bond, in addition to any other remedies available at law or in equity. The Receiving Party shall indemnify and hold harmless the Disclosing Party from any damages arising from breach.

7. GOVERNING LAW
This Agreement shall be governed by the laws of the State of Delaware. Any disputes shall be resolved through binding arbitration in Wilmington, Delaware.

8. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations, representations, or agreements.

The Receiving Party waives any and all rights to challenge the enforceability of this Agreement.`
  },

  lease: {
    name: 'Residential Lease Agreement',
    icon: '🏠',
    description: 'Apartment lease with typical landlord-favorable terms',
    text: `RESIDENTIAL LEASE AGREEMENT

This Lease Agreement is entered into as of February 1, 2026, between Skyline Properties LLC ("Landlord") and the undersigned ("Tenant") for the premises located at 450 Oak Avenue, Apt 12B, San Francisco, CA 94102.

1. TERM
The lease term shall commence on March 1, 2026 and end on February 28, 2027. This lease shall automatically renew for successive 12-month periods unless either party provides written notice of termination at least 90 days prior to the end of the current term.

2. RENT
Monthly rent shall be $3,200 per month, due on the 1st of each month. A late payment fee of $150 shall be assessed for any payment received after the 5th of the month. Rent may be increased by the Landlord at any time during the lease term with 30 days written notice.

3. SECURITY DEPOSIT
Tenant shall pay a security deposit of $6,400 upon execution of this lease. The Landlord reserves the right to apply the security deposit to any damages, unpaid rent, or cleaning costs at its sole discretion.

4. MAINTENANCE AND REPAIRS
Tenant shall maintain the premises in good condition. Tenant shall be responsible for all repairs costing less than $500. Landlord shall have the right to enter the premises at any time for inspection, maintenance, or showing to prospective tenants without prior notice.

5. EARLY TERMINATION
Early termination fee: $6,400 (2 months' rent) plus forfeiture of security deposit. Tenant shall provide 60 days written notice.

6. PETS
No pets are permitted without prior written consent. If approved, a non-refundable pet deposit of $800 and additional monthly pet rent of $100 shall apply.

7. LIABILITY
Tenant shall indemnify and hold harmless the Landlord from any and all claims, damages, losses, and liabilities arising from Tenant's use of the premises. Landlord's liability shall not exceed the amount of rent paid in the current month.

8. GOVERNING LAW
This lease shall be governed by the laws of the State of California. Disputes shall be resolved through binding arbitration in San Francisco County. Tenant waives the right to a jury trial.

9. MODIFICATIONS
Landlord reserves the right to modify the terms of this lease at its sole discretion with 30 days written notice. Continued occupancy after notice constitutes acceptance.`
  },

  freelance: {
    name: 'Freelance Agreement',
    icon: '💼',
    description: 'Client-heavy freelance contract with IP assignment',
    text: `FREELANCE SERVICES AGREEMENT

This Freelance Services Agreement ("Agreement") is entered into as of January 20, 2026, between MegaCorp Digital ("Client") and the undersigned independent contractor ("Contractor").

1. SCOPE OF WORK
Contractor shall provide web development and design services as directed by Client. Specific deliverables, timelines, and milestones shall be communicated by Client and may be modified at Client's sole discretion.

2. COMPENSATION
Client shall pay Contractor a project fee of $8,000, payable in two installments:
- $4,000 upon completion of Phase 1 (design mockups)
- $4,000 upon completion of Phase 2 (development)
Payment shall be made within 60 days of invoice receipt via bank transfer.

3. INTELLECTUAL PROPERTY
All work, materials, deliverables, code, designs, and documentation created by Contractor in connection with this Agreement shall be considered works made for hire and shall be the sole and exclusive property of Client. Contractor hereby assigns all right, title, and interest in any intellectual property created under this Agreement. Contractor waives all moral rights in the deliverables.

4. NON-COMPETE
During the term of this Agreement and for a period of 2 years following termination, Contractor shall not engage in any work or provide services to any direct competitor of Client within North America.

5. CONFIDENTIALITY
All information provided by Client is strictly confidential. This obligation shall survive termination of this Agreement indefinitely.

6. REVISIONS
Contractor shall provide unlimited revisions until Client is satisfied with the deliverables. No additional compensation shall be provided for revision work.

7. TERMINATION
Client may terminate this Agreement at any time without cause with 7 days notice. Upon termination, Contractor shall deliver all completed and in-progress work. Client shall only be obligated to pay for work completed and approved prior to termination.

8. INDEMNIFICATION
Contractor shall defend, indemnify, and hold harmless Client from any claims, damages, losses, and expenses arising from Contractor's services or breach of this Agreement.

9. LIMITATION OF LIABILITY
In no event shall Client's total liability under this Agreement exceed the amount of fees actually paid to Contractor. Client provides no warranty regarding the accuracy of project requirements.

10. OUTSIDE WORK
Contractor shall devote full and exclusive time and attention to Client's project during the term of this Agreement and shall not engage in any other freelance or employment activities without Client's prior written consent.

11. DISPUTE RESOLUTION
Any disputes shall be resolved through binding arbitration in New York, NY. Contractor waives the right to a jury trial and any class action claims.`
  },

  employment: {
    name: 'Employment Contract',
    icon: '👔',
    description: 'Tech company employment agreement',
    text: `EMPLOYMENT AGREEMENT

This Employment Agreement ("Agreement") is entered into as of February 10, 2026, by and between NexGen Technologies Inc. ("Company") and the undersigned ("Employee").

1. POSITION AND DUTIES
Employee is hired as Senior Software Engineer. Employee shall report to the VP of Engineering. Employee shall perform such duties as may be assigned from time to time by the Company.

2. COMPENSATION
Base salary: $165,000 per year, paid bi-weekly. Employee shall be eligible for an annual performance bonus of up to 20% of base salary, at the Company's sole discretion. The Company may adjust compensation at any time.

3. EQUITY
Employee shall receive a stock option grant of 10,000 shares, vesting over 4 years with a 1-year cliff. The stock option agreement shall be governed by the Company's equity incentive plan, which the Company reserves the right to modify at its sole discretion.

4. BENEFITS
Employee shall be eligible for standard company benefits including health insurance, dental, vision, and 401(k) with 4% match. Company reserves the right to modify or terminate benefits at any time.

5. AT-WILL EMPLOYMENT
Employment is at-will and may be terminated by either party at any time, with or without cause, with or without notice.

6. INTELLECTUAL PROPERTY
All inventions, discoveries, ideas, improvements, and works of authorship conceived or developed by Employee during employment, whether or not during working hours, shall be the sole property of the Company. Employee hereby assigns all right, title, and interest in such intellectual property to the Company.

7. NON-COMPETE
For a period of 18 months following termination of employment, Employee shall not work for, consult with, or provide services to any competitor of the Company, defined as any company operating in the enterprise software space within the United States.

8. NON-SOLICITATION
For a period of 2 years following termination, Employee shall not solicit, recruit, or hire any employees or contractors of the Company.

9. NON-DISPARAGEMENT
Employee shall not make any negative, disparaging, or derogatory statements about the Company, its products, management, or employees, during or after employment.

10. CONFIDENTIALITY
Employee shall not disclose any confidential information during or after employment. This obligation shall survive termination indefinitely.

11. MOONLIGHTING
Employee shall devote full time and attention to Company business. Employee shall not engage in any outside employment, consulting, or business activities without prior written approval from the Company.

12. CLAWBACK
Company reserves the right to require repayment of any bonus or incentive compensation paid within the 12 months preceding termination if Employee is terminated for cause or voluntarily resigns within 12 months of receiving such compensation.

13. DISPUTE RESOLUTION
Disputes shall be resolved through binding arbitration in San Francisco, CA, under AAA rules. Employee waives the right to a jury trial and class action claims.

14. GOVERNING LAW
This Agreement shall be governed by the laws of the State of California.`
  },

  tos: {
    name: 'Terms of Service',
    icon: '📱',
    description: 'Mobile app Terms of Service with broad data rights',
    text: `TERMS OF SERVICE — DataSync Pro

Last Updated: January 1, 2026

Welcome to DataSync Pro ("Service"). By accessing or using our Service, you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Service.

1. ACCEPTANCE
By creating an account, you acknowledge that you have read, understood, and agree to be bound by these Terms. We reserve the right to modify these Terms at any time at our sole discretion without prior notice. Your continued use of the Service constitutes acceptance of any changes.

2. LICENSE
We grant you a limited, non-exclusive, non-transferable, revocable license to use the Service for personal, non-commercial purposes.

3. USER CONTENT
By uploading content to DataSync Pro, you grant us a perpetual, irrevocable, worldwide, royalty-free license to use, reproduce, modify, distribute, display, and create derivative works from your content for any purpose, including commercial purposes. You waive any moral rights in your content.

4. DATA COLLECTION
We may collect, store, analyze, and share your data, including personal information, usage patterns, device information, location data, and content, with third-party partners for advertising and service improvement purposes. We may use your data in any way we see fit to improve our products and services.

5. PRIVACY
Your use of the Service is subject to our Privacy Policy. By using the Service, you consent to the collection and use of your information as described therein.

6. SERVICE AVAILABILITY
The Service is provided "as-is" and "as available" without warranty of any kind, express or implied. We do not guarantee uninterrupted, secure, or error-free operation. We may modify, suspend, or discontinue the Service at any time without notice.

7. LIMITATION OF LIABILITY
In no event shall DataSync Pro or its affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or goodwill. Our maximum aggregate liability shall not exceed $10.

8. INDEMNIFICATION
You agree to defend, indemnify, and hold harmless DataSync Pro, its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Service or violation of these Terms.

9. ACCOUNT TERMINATION
We may suspend or terminate your account at any time, for any reason, without notice. Upon termination, your right to use the Service ceases immediately. We may delete your data without liability.

10. DISPUTE RESOLUTION
All disputes shall be resolved through binding arbitration. You waive your right to participate in a class action lawsuit or class-wide arbitration.

11. GOVERNING LAW
These Terms shall be governed by the laws of the State of Delaware, without regard to conflict of law principles. Exclusive venue shall be in Wilmington, Delaware.

12. ENTIRE AGREEMENT
These Terms constitute the entire agreement between you and DataSync Pro and supersede all prior agreements.`
  },

  saas: {
    name: 'SaaS Subscription Agreement',
    icon: '☁️',
    description: 'Cloud software subscription with vendor-favorable terms',
    text: `SAAS SUBSCRIPTION AGREEMENT

This SaaS Subscription Agreement ("Agreement") is entered into as of March 1, 2026, between CloudStack Solutions Inc. ("Provider") and the subscribing entity ("Customer").

1. SUBSCRIPTION
Customer subscribes to CloudStack Enterprise Plan at $2,499 per month. The initial subscription term is 24 months. The subscription shall automatically renew for successive 12-month periods unless Customer provides written notice of cancellation at least 120 days prior to renewal.

2. PAYMENT
All fees are non-refundable. Payment is due within 30 days of invoice. Late payments shall incur interest at 1.5% per month. Provider may increase subscription fees by up to 10% annually upon renewal without prior notice.

3. SERVICE LEVEL
Provider shall use commercially reasonable efforts to maintain 99.5% uptime. Customer's sole remedy for failure to meet the SLA shall be a service credit not to exceed 5% of monthly fees.

4. DATA
Customer retains ownership of its data. However, Provider shall have the right to use anonymized and aggregated Customer data for analytics, benchmarking, product improvement, and marketing purposes. Provider shall maintain commercially reasonable security measures.

5. INTELLECTUAL PROPERTY
All intellectual property rights in the Service, including any customizations, integrations, or configurations created for Customer, shall remain the exclusive property of Provider. Customer receives a limited license to use the Service during the subscription term.

6. LIMITATION OF LIABILITY
In no event shall Provider's aggregate liability exceed the fees paid by Customer in the 3 months preceding the claim. Provider shall not be liable for any indirect, consequential, incidental, or punitive damages, loss of data, or business interruption.

7. WARRANTY DISCLAIMER
THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. PROVIDER DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.

8. EARLY TERMINATION
Customer may terminate early by paying a fee equal to the remaining months on the subscription term. If Customer terminates for convenience, no refund shall be provided.

9. DATA PORTABILITY
Upon termination, Customer shall have 30 days to export its data. After 30 days, Provider may delete all Customer data without liability.

10. INDEMNIFICATION
Customer shall indemnify and hold harmless Provider from any claims arising from Customer's use of the Service or Customer's data.

11. FORCE MAJEURE
Provider shall not be liable for failure to perform due to circumstances beyond its reasonable control, including but not limited to acts of God, war, terrorism, pandemic, natural disasters, government actions, or infrastructure failures.

12. GOVERNING LAW
This Agreement shall be governed by the laws of the State of Washington. Any disputes shall be resolved through binding arbitration in Seattle, WA.`
  },

  partnership: {
    name: 'Partnership Agreement',
    icon: '🤝',
    description: 'Business partnership with profit sharing and exit terms',
    text: `PARTNERSHIP AGREEMENT

This Partnership Agreement ("Agreement") is entered into as of January 10, 2026, by and between Alex Chen ("Partner A") and Jordan Rivera ("Partner B"), collectively referred to as the "Partners."

1. PARTNERSHIP NAME AND PURPOSE
The Partners hereby form a general partnership under the name "ChenRivera Digital Consulting" for the purpose of providing digital marketing and consulting services.

2. CAPITAL CONTRIBUTIONS
Partner A shall contribute $50,000 in cash. Partner B shall contribute $25,000 in cash and equipment valued at $25,000.

3. PROFIT AND LOSS SHARING
Profits and losses shall be shared 60% to Partner A and 40% to Partner B. Distributions shall be made quarterly, provided the partnership maintains a minimum cash reserve of $20,000.

4. MANAGEMENT
Both Partners shall have equal management authority. Major decisions (expenditures exceeding $5,000, new hires, contracts exceeding $10,000) require unanimous consent.

5. COMPENSATION
Each Partner shall receive a monthly draw of $8,000 against their share of profits. Partner A shall receive an additional management fee of $2,000 per month.

6. NON-COMPETE
During the partnership and for a period of 3 years following dissolution or withdrawal, neither Partner shall engage in any competing business within a 100-mile radius. Violation of this provision shall result in liquidated damages of $100,000.

7. CONFIDENTIALITY
All partnership information shall be kept strictly confidential during and after the partnership. This obligation shall survive termination indefinitely.

8. WITHDRAWAL
Either Partner may withdraw with 180 days written notice. The withdrawing Partner's interest shall be purchased by the remaining Partner at a price determined by an independent appraiser. Payment shall be made over 36 months at 6% interest.

9. DEATH OR DISABILITY
Upon death or permanent disability of a Partner, the remaining Partner shall purchase the deceased/disabled Partner's interest at appraised value, payable over 48 months.

10. DISPUTE RESOLUTION
Disputes shall first be submitted to mediation. If mediation fails, disputes shall be resolved through binding arbitration in Denver, Colorado. Each Partner shall bear their own legal costs.

11. INDEMNIFICATION
Each Partner shall indemnify and hold harmless the other Partner from any claims arising from their individual negligence or misconduct.

12. DISSOLUTION
The partnership shall dissolve upon mutual agreement, bankruptcy of either Partner, or by court order. Upon dissolution, assets shall be liquidated and distributed after payment of all debts and obligations.

13. GOVERNING LAW
This Agreement shall be governed by the laws of the State of Colorado. Both Partners are jointly and severally liable for partnership obligations.

14. PERSONAL GUARANTEE
Each Partner personally guarantees all partnership debts and obligations, including any loans, leases, or vendor agreements entered into by the partnership.`
  }
};

// ========== API ROUTES ==========

// Config
app.get('/api/config', (req, res) => {
  res.json({ stripePublicKey: STRIPE_PK, sampleContracts: Object.keys(SAMPLE_CONTRACTS).map(k => ({ id: k, name: SAMPLE_CONTRACTS[k].name, icon: SAMPLE_CONTRACTS[k].icon, description: SAMPLE_CONTRACTS[k].description })) });
});

app.get('/api/stripe/config', (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
});

// Analyze
app.post('/api/analyze', optionalAuth, (req, res) => {
  const { text } = req.body;
  if (!text || text.trim().length < 50) return res.status(400).json({ error: 'Contract text too short (minimum 50 characters).' });
  if (text.length > 100000) return res.status(400).json({ error: 'Contract text too long (max 100,000 characters).' });

  const ip = req.headers['x-forwarded-for'] || req.ip;
  const u = getUsage(ip);
  if (!req.userId && u.count >= 3) {
    return res.status(429).json({ error: 'Free limit reached (3/day). Sign up or upgrade to Pro for unlimited analyses.', upgrade: true });
  }
  if (!req.userId) u.count++;

  const result = analyzeContract(text);
  const clauseData = annotateContractClauses(text);
  result.clauseAnnotations = clauseData;
  result.negotiationPlaybook = generateNegotiationPlaybook(result.redFlags);

  // Generate share ID
  const shareId = crypto.randomBytes(6).toString('hex');
  sharedResults.set(shareId, { analysis: result, createdAt: Date.now(), textPreview: text.slice(0, 200) });

  // Save to user account if logged in
  if (req.user) {
    req.user.analyses.unshift({
      id: uuidv4(),
      shareId,
      documentType: result.documentType.label,
      riskScore: result.riskScore,
      redFlagCount: result.redFlags.length,
      createdAt: new Date().toISOString(),
      textPreview: text.slice(0, 200),
    });
    if (req.user.analyses.length > 50) req.user.analyses = req.user.analyses.slice(0, 50);
  }

  res.json({ ...result, shareId, shareUrl: `${DOMAIN}/share/${shareId}` });
});

// Compare
app.post('/api/compare', optionalAuth, (req, res) => {
  const { text1, text2 } = req.body;
  if (!text1 || !text2) return res.status(400).json({ error: 'Both contract texts are required.' });
  if (text1.trim().length < 50 || text2.trim().length < 50) return res.status(400).json({ error: 'Each contract must be at least 50 characters.' });

  const ip = req.headers['x-forwarded-for'] || req.ip;
  const u = getUsage(ip);
  if (!req.userId && u.count >= 3) {
    return res.status(429).json({ error: 'Free limit reached. Sign up or upgrade to Pro.', upgrade: true });
  }
  if (!req.userId) u.count++;

  const result = compareContracts(text1, text2);
  res.json(result);
});

// Get sample contract
app.get('/api/samples/:id', (req, res) => {
  const sample = SAMPLE_CONTRACTS[req.params.id];
  if (!sample) return res.status(404).json({ error: 'Sample not found' });
  res.json(sample);
});

// Get all samples
app.get('/api/samples', (req, res) => {
  res.json(Object.entries(SAMPLE_CONTRACTS).map(([id, s]) => ({ id, name: s.name, icon: s.icon, description: s.description })));
});

// Share
app.get('/api/share/:id', (req, res) => {
  const data = sharedResults.get(req.params.id);
  if (!data) return res.status(404).json({ error: 'Share not found or expired' });
  res.json(data);
});

// ========== AUTH ROUTES ==========
const bcrypt = require('bcryptjs');

app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });
  if (users.has(email.toLowerCase())) return res.status(409).json({ error: 'Email already registered.' });
  const hash = await bcrypt.hash(password, 10);
  const user = { id: uuidv4(), email: email.toLowerCase(), name: name || '', passwordHash: hash, analyses: [], createdAt: new Date().toISOString() };
  users.set(email.toLowerCase(), user);
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId: user.id, expires: Date.now() + 30 * 24 * 60 * 60 * 1000 });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.get(email?.toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId: user.id, expires: Date.now() + 30 * 24 * 60 * 60 * 1000 });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.get('/api/auth/me', optionalAuth, (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ id: req.user.id, email: req.user.email, name: req.user.name, analyses: req.user.analyses });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) sessions.delete(token);
  res.json({ ok: true });
});

// ========== PDF EXPORT ==========
app.post('/api/export-pdf', (req, res) => {
  // Generate a simple HTML-based PDF (download as HTML that prints nicely)
  const { analysis } = req.body;
  if (!analysis) return res.status(400).json({ error: 'No analysis data' });

  const riskColor = analysis.riskLevel === 'high' ? '#ef4444' : analysis.riskLevel === 'medium' ? '#f59e0b' : '#22c55e';

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>BriefPulse Contract Analysis Report</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1a1a2e; line-height: 1.6; }
  h1 { color: #7c5cfc; border-bottom: 3px solid #7c5cfc; padding-bottom: 10px; }
  h2 { color: #374151; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
  .risk-badge { display: inline-block; background: ${riskColor}; color: white; padding: 8px 20px; border-radius: 20px; font-size: 18px; font-weight: bold; }
  .flag { padding: 12px; margin: 8px 0; border-left: 4px solid; border-radius: 4px; background: #f9fafb; }
  .flag.high { border-color: #ef4444; }
  .flag.medium { border-color: #f59e0b; }
  .flag.low { border-color: #3b82f6; }
  .flag-name { font-weight: bold; }
  .flag-severity { text-transform: uppercase; font-size: 11px; font-weight: bold; margin-left: 8px; }
  .context { font-style: italic; color: #6b7280; font-size: 13px; margin-top: 4px; }
  .rec { padding: 8px 12px; margin: 6px 0; background: #f0fdf4; border-left: 3px solid #22c55e; border-radius: 4px; }
  .rec.high { background: #fef2f2; border-color: #ef4444; }
  .rec.medium { background: #fffbeb; border-color: #f59e0b; }
  .meta { color: #6b7280; font-size: 13px; }
  .terms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; }
  .term { padding: 8px 12px; background: #f3f4f6; border-radius: 6px; font-size: 14px; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center; }
  @media print { body { padding: 20px; } }
</style></head><body>
<h1>📋 BriefPulse Contract Analysis Report</h1>
<p class="meta">Generated: ${new Date().toLocaleString()} | Document Type: ${analysis.documentType?.label || 'Unknown'} | Words: ${analysis.wordCount?.toLocaleString() || 'N/A'}</p>

<h2>Risk Score</h2>
<p><span class="risk-badge">${analysis.riskScore}/100 — ${analysis.riskLevel?.toUpperCase()} RISK</span></p>

${analysis.parties?.length ? `<h2>Parties</h2><p>${analysis.parties.join(' • ')}</p>` : ''}

<h2>Red Flags (${analysis.redFlags?.length || 0})</h2>
${(analysis.redFlags || []).map(f => `<div class="flag ${f.severity}"><span class="flag-name">${f.name}</span><span class="flag-severity" style="color:${f.severity === 'high' ? '#ef4444' : f.severity === 'medium' ? '#f59e0b' : '#3b82f6'}"> ${f.severity}</span><br>${f.description}${f.context ? `<div class="context">"${f.context}"</div>` : ''}</div>`).join('\n')}

<h2>Key Terms</h2>
<div class="terms-grid">${(analysis.keyTerms || []).map(t => `<div class="term"><strong>${t.type}:</strong> ${t.value}</div>`).join('')}</div>

${analysis.dates?.length ? `<h2>Important Dates</h2><p>${analysis.dates.join(' • ')}</p>` : ''}

<h2>Recommendations</h2>
${(analysis.recommendations || []).map(r => `<div class="rec ${r.priority}">${r.text}</div>`).join('\n')}

<div class="footer">Generated by BriefPulse — AI Contract Analyzer | https://delta.abapture.ai<br>This analysis is for informational purposes only and does not constitute legal advice.</div>
</body></html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', 'attachment; filename="briefpulse-report.html"');
  res.send(html);
});

// Stripe checkout
app.post('/api/checkout', async (req, res) => {
  try {
    const { plan } = req.body;
    const prices = {
      'pro-monthly': { amount: 2900, interval: 'month', name: 'BriefPulse Pro Monthly' },
      'pro-annual': { amount: 19900, interval: 'year', name: 'BriefPulse Pro Annual' },
      monthly: { amount: 2900, interval: 'month', name: 'BriefPulse Pro Monthly' },
      annual: { amount: 19900, interval: 'year', name: 'BriefPulse Pro Annual' },
    };
    const p = prices[plan] || prices['pro-monthly'];
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'usd', product_data: { name: p.name, description: 'Unlimited AI contract analyses' }, unit_amount: p.amount, recurring: { interval: p.interval } }, quantity: 1 }],
      mode: 'subscription',
      success_url: 'https://delta.abapture.ai/?payment=success',
      cancel_url: 'https://delta.abapture.ai',
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: 'Payment setup failed' });
  }
});

// ========== BULK UPLOAD & ANALYZE ==========
const bulkUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }).array('files', 20);

app.post('/api/bulk-upload', (req, res) => {
  bulkUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
    const results = [];
    for (const file of req.files) {
      let text = '';
      try {
        if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
          const pdfParse = require('pdf-parse');
          const data = await pdfParse(file.buffer);
          text = data.text;
        } else {
          text = file.buffer.toString('utf-8');
        }
      } catch(e) { results.push({ filename: file.originalname, error: 'Could not parse file' }); continue; }
      if (text.trim().length < 50) { results.push({ filename: file.originalname, error: 'Not enough text extracted' }); continue; }
      results.push({ filename: file.originalname, text: text.trim() });
    }
    res.json({ files: results });
  });
});

app.post('/api/bulk-analyze', optionalAuth, (req, res) => {
  const { contracts } = req.body;
  if (!contracts || !Array.isArray(contracts) || contracts.length === 0) return res.status(400).json({ error: 'No contracts provided' });
  if (contracts.length > 20) return res.status(400).json({ error: 'Maximum 20 contracts at once' });
  const ip = req.headers['x-forwarded-for'] || req.ip;
  const u = getUsage(ip);
  if (!req.userId && u.count >= 3) return res.status(429).json({ error: 'Free limit reached. Sign up or upgrade to Pro.', upgrade: true });
  if (!req.userId) u.count++;
  const results = contracts.map(c => {
    if (!c.text || c.text.trim().length < 50) return { filename: c.filename, error: 'Text too short' };
    const analysis = analyzeContract(c.text);
    const shareId = crypto.randomBytes(6).toString('hex');
    sharedResults.set(shareId, { analysis, createdAt: Date.now(), textPreview: c.text.slice(0, 200) });
    return { filename: c.filename, analysis, shareId };
  });
  const valid = results.filter(r => r.analysis);
  const flagCounts = {};
  valid.forEach(r => r.analysis.redFlags.forEach(f => {
    if (!flagCounts[f.id]) flagCounts[f.id] = { name: f.name, severity: f.severity, count: 0 };
    flagCounts[f.id].count++;
  }));
  const summary = {
    total: results.length, analyzed: valid.length, errors: results.length - valid.length,
    avgRiskScore: valid.length ? Math.round(valid.reduce((s, r) => s + r.analysis.riskScore, 0) / valid.length) : 0,
    highRisk: valid.filter(r => r.analysis.riskLevel === 'high').length,
    mediumRisk: valid.filter(r => r.analysis.riskLevel === 'medium').length,
    lowRisk: valid.filter(r => r.analysis.riskLevel === 'low').length,
    totalRedFlags: valid.reduce((s, r) => s + r.analysis.redFlags.length, 0),
    ranking: [...valid].sort((a, b) => b.analysis.riskScore - a.analysis.riskScore).map(r => ({
      filename: r.filename, riskScore: r.analysis.riskScore, riskLevel: r.analysis.riskLevel,
      redFlagCount: r.analysis.redFlags.length, documentType: r.analysis.documentType?.label
    })),
    commonFlags: Object.values(flagCounts).sort((a, b) => b.count - a.count),
  };
  res.json({ results, summary });
});

// File upload
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  let text = '';
  if (req.file.mimetype === 'text/plain' || req.file.originalname.endsWith('.txt')) {
    text = req.file.buffer.toString('utf-8');
  } else if (req.file.mimetype === 'application/pdf' || req.file.originalname.endsWith('.pdf')) {
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(req.file.buffer);
      text = data.text;
    } catch (e) {
      return res.status(400).json({ error: 'Could not parse PDF. Try pasting the text instead.' });
    }
  } else {
    // Try as text
    text = req.file.buffer.toString('utf-8');
  }
  if (text.trim().length < 50) return res.status(400).json({ error: 'Could not extract enough text from file.' });
  res.json({ text: text.trim() });
});

// ========== GLOSSARY ==========
const GLOSSARY = [
  { term: 'Indemnification', aka: 'Hold Harmless', definition: 'A promise to compensate someone for harm or loss. If you indemnify someone, you agree to pay their legal costs and damages if something goes wrong.', example: 'If a customer sues the company over your work, you\'d have to pay the company\'s legal bills.' },
  { term: 'Force Majeure', aka: 'Act of God', definition: 'A clause that frees both parties from obligation when an extraordinary event occurs (war, pandemic, natural disaster). Often only protects one side.', example: 'If a hurricane destroys their office, they don\'t have to deliver your project on time.' },
  { term: 'Severability', aka: 'Savings Clause', definition: 'If one part of the contract is found illegal or unenforceable, the rest of the contract still stands.', example: 'If a court strikes down the non-compete clause, the rest of your employment contract still applies.' },
  { term: 'Arbitration', aka: 'Alternative Dispute Resolution', definition: 'A private process where a neutral third party (arbitrator) settles disputes instead of going to court. Usually binding and hard to appeal.', example: 'Instead of suing in court, you\'d present your case to a private arbitrator whose decision is final.' },
  { term: 'Non-Compete', aka: 'Restrictive Covenant', definition: 'Prevents you from working for competitors or starting a competing business for a specified time period and geographic area after the contract ends.', example: 'After leaving, you can\'t work for any competitor within 50 miles for 2 years.' },
  { term: 'Non-Solicitation', aka: 'Anti-Poaching', definition: 'Prevents you from recruiting employees or contacting clients of the other party after the relationship ends.', example: 'You can\'t hire your former coworkers or contact the company\'s clients for your new business.' },
  { term: 'Non-Disparagement', aka: 'No Bad-Mouthing', definition: 'Prevents you from making negative public statements about the other party, their products, or their employees.', example: 'You can\'t post a negative review, warn others publicly, or criticize them on social media.' },
  { term: 'Liquidated Damages', aka: 'Pre-Set Penalty', definition: 'A fixed amount of money agreed upon in advance that must be paid if the contract is breached, regardless of actual damages.', example: 'If you leave early, you owe $10,000 — even if they suffered no actual loss.' },
  { term: 'Work Made for Hire', aka: 'IP Assignment', definition: 'Anything you create during the contract automatically belongs to the other party. You have no ownership rights.', example: 'The website you designed, the code you wrote — it all belongs to the client, not you.' },
  { term: 'At-Will Employment', aka: 'Employment at Will', definition: 'Either party can end the employment relationship at any time, for any reason (or no reason), with no advance notice required.', example: 'Your employer can fire you tomorrow with no explanation and no severance pay.' },
  { term: 'Liability Cap', aka: 'Limitation of Liability', definition: 'Sets a maximum amount one party can owe the other, regardless of actual damages. Often set very low.', example: 'Even if their software crashes and costs you $1M in lost business, the most you can recover is $500.' },
  { term: 'Warranty Disclaimer', aka: 'As-Is Clause', definition: 'The product or service is provided with no guarantees. If it doesn\'t work as expected, you have no recourse.', example: '"As-is" means if the software has bugs or the apartment has problems, that\'s your problem.' },
  { term: 'Auto-Renewal', aka: 'Evergreen Clause', definition: 'The contract automatically renews for another term unless you actively cancel before a deadline. Easy to miss.', example: 'Your 1-year subscription renews for another year if you don\'t cancel 90 days before it expires.' },
  { term: 'Governing Law', aka: 'Choice of Law', definition: 'Determines which state\'s or country\'s laws apply to the contract and where legal disputes must be filed.', example: 'Even though you live in California, disputes must be handled under Delaware law in a Delaware court.' },
  { term: 'Entire Agreement', aka: 'Merger Clause, Integration Clause', definition: 'States that this written contract is the complete agreement and overrides all previous discussions, emails, or verbal promises.', example: 'That raise they promised you in the interview? If it\'s not in this document, it doesn\'t count.' },
  { term: 'Confidentiality', aka: 'NDA, Non-Disclosure', definition: 'Restricts what information you can share with others. Can range from reasonable (trade secrets) to overbroad (everything).', example: 'You can\'t tell anyone about projects you worked on, even in a job interview.' },
  { term: 'Assignment', aka: 'Transfer of Rights', definition: 'Whether you can transfer your rights or obligations under the contract to someone else (like a new business partner).', example: 'If you sell your business, you can\'t transfer this client contract to the new owner without permission.' },
  { term: 'Clawback', aka: 'Repayment Clause', definition: 'Allows the other party to reclaim money already paid to you under certain conditions.', example: 'If you quit within a year, you have to repay your entire signing bonus.' },
  { term: 'Moral Rights', aka: 'Attribution Rights', definition: 'The right to be credited as the creator of your work and to prevent it from being modified in ways that harm your reputation.', example: 'Waiving moral rights means they can put someone else\'s name on your design work.' },
  { term: 'Cure Period', aka: 'Right to Cure, Grace Period', definition: 'A specified time you have to fix a contract violation before the other party can terminate.', example: 'If you miss a deadline, you get 30 days to deliver before they can cancel the contract.' },
  { term: 'Personal Guarantee', aka: 'Individual Liability', definition: 'Makes you personally responsible for the contract obligations, not just your business entity. Your personal assets are at risk.', example: 'If your LLC can\'t pay, they can go after your house, car, and savings.' },
  { term: 'Survival Clause', aka: 'Post-Termination Obligations', definition: 'Specifies which contract terms continue to apply even after the contract ends.', example: 'The contract is over, but you still can\'t compete, share secrets, or disparage them for 2 more years.' },
];

app.get('/api/glossary', (req, res) => {
  const q = req.query.q?.toLowerCase();
  if (q) {
    const filtered = GLOSSARY.filter(g => g.term.toLowerCase().includes(q) || g.aka.toLowerCase().includes(q) || g.definition.toLowerCase().includes(q));
    return res.json(filtered);
  }
  res.json(GLOSSARY);
});

// Blog routes (static SEO pages)
app.get('/blog', (req, res) => res.sendFile(path.join(__dirname, 'public', 'blog', 'index.html')));
app.get('/blog/:slug', (req, res) => {
  const slug = req.params.slug.replace(/[^a-z0-9-]/g, '');
  const filePath = path.join(__dirname, 'public', 'blog', slug + '.html');
  if (fs.existsSync(filePath)) return res.sendFile(filePath);
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ========== CONTRACT TEMPLATE LIBRARY ROUTES ==========
app.get("/api/templates", (req, res) => {
  const { search, category } = req.query;
  let templates = CONTRACT_TEMPLATES.map(t => ({
    id: t.id, title: t.title, category: t.category, description: t.description,
    riskLevel: t.riskLevel, commonRedFlags: t.commonRedFlags,
    wordCount: t.text.split(/\s+/).length,
    placeholderCount: (t.text.match(/\[([A-Z][A-Z_ ,\/.()]+)\]/g) || []).length,
  }));
  if (search) { const q = search.toLowerCase(); templates = templates.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)); }
  if (category) { templates = templates.filter(t => t.category.toLowerCase() === category.toLowerCase()); }
  const categories = [...new Set(CONTRACT_TEMPLATES.map(t => t.category))];
  res.json({ templates, categories });
});

app.get("/api/templates/:id", (req, res) => {
  const template = CONTRACT_TEMPLATES.find(t => t.id === req.params.id);
  if (!template) return res.status(404).json({ error: "Template not found" });
  const placeholders = [...new Set((template.text.match(/\[([A-Z][A-Z_ ,\/.()]+)\]/g) || []).map(p => p.slice(1, -1)))];
  res.json({ ...template, placeholders, wordCount: template.text.split(/\s+/).length });
});

app.post("/api/templates/:id/analyze", optionalAuth, (req, res) => {
  const template = CONTRACT_TEMPLATES.find(t => t.id === req.params.id);
  if (!template) return res.status(404).json({ error: "Template not found" });
  const { values } = req.body;
  let text = template.text;
  if (values && typeof values === "object") {
    for (const [key, value] of Object.entries(values)) {
      const regex = new RegExp("\\[" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\]", "g");
      text = text.replace(regex, value);
    }
  }
  const ip = req.headers["x-forwarded-for"] || req.ip;
  const u = getUsage(ip);
  if (!req.userId && u.count >= 3) return res.status(429).json({ error: "Free limit reached.", upgrade: true });
  if (!req.userId) u.count++;
  const result = analyzeContract(text);
  const clauseData = annotateContractClauses(text);
  result.clauseAnnotations = clauseData;
  result.negotiationPlaybook = generateNegotiationPlaybook(result.redFlags);
  result.templateId = template.id;
  result.templateTitle = template.title;
  const remaining = (text.match(/\[([A-Z][A-Z_ ,\/.()]+)\]/g) || []);
  result.unfilledPlaceholders = [...new Set(remaining.map(p => p.slice(1, -1)))];
  const shareId = crypto.randomBytes(6).toString("hex");
  sharedResults.set(shareId, { analysis: result, createdAt: Date.now(), textPreview: text.slice(0, 200) });
  res.json({ ...result, filledText: text, shareId });
});

// SPA routes
app.get('/share/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/compare', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/samples', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/account', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/glossary', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/bulk', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/templates', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/templates/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`BriefPulse running on port ${PORT}`));
