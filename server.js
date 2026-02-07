const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3400;

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || '');
const STRIPE_PK = process.env.STRIPE_PK || '';
const DOMAIN = process.env.DOMAIN || 'https://delta.abapture.ai';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple in-memory rate limiting (per IP, 5 free/day)
const usage = new Map();
function getUsage(ip) {
  const now = new Date().toDateString();
  const entry = usage.get(ip);
  if (!entry || entry.date !== now) {
    usage.set(ip, { date: now, count: 0 });
    return usage.get(ip);
  }
  return entry;
}

// Tone definitions with system prompts
const TONES = {
  professional: { name: 'Professional', emoji: '👔', prompt: 'Rewrite this text in a polished, professional business tone. Keep the same meaning but make it sound like a senior executive wrote it.' },
  genz: { name: 'Gen Z', emoji: '💀', prompt: 'Rewrite this text in Gen Z slang. Use terms like "no cap", "slay", "bussin", "fr fr", "lowkey", "highkey", "based", "its giving", etc. Keep it authentic and funny.' },
  shakespeare: { name: 'Shakespeare', emoji: '🎭', prompt: 'Rewrite this text in Shakespearean English. Use "thee", "thou", "hath", "doth", "prithee", iambic patterns, and dramatic flair. Make it sound like it belongs in a Shakespeare play.' },
  pirate: { name: 'Pirate', emoji: '🏴‍☠️', prompt: 'Rewrite this text as a pirate would say it. Use "arr", "matey", "ye", "shiver me timbers", nautical terms. Go full pirate.' },
  corporate: { name: 'Corporate BS', emoji: '📊', prompt: 'Rewrite this text in maximum corporate buzzword speak. Use "synergy", "leverage", "circle back", "move the needle", "low-hanging fruit", "paradigm shift", etc. Make it hilariously overloaded with jargon while keeping the core meaning.' },
  romantic: { name: 'Romantic', emoji: '💕', prompt: 'Rewrite this text in an intensely romantic, poetic style. Use flowery language, metaphors about love, hearts, and passion. Make even mundane things sound like a love letter.' },
  passive_aggressive: { name: 'Passive Aggressive', emoji: '😊', prompt: 'Rewrite this text in a passive-aggressive tone. Use phrases like "per my last email", "as previously mentioned", "just to clarify", "going forward", with subtle hostility masked by politeness.' },
  surfer: { name: 'Surfer Dude', emoji: '🏄', prompt: 'Rewrite this text as a laid-back surfer dude. Use "dude", "gnarly", "radical", "bro", "stoked", "vibes". Everything is chill and awesome.' },
  noir: { name: 'Film Noir', emoji: '🕵️', prompt: 'Rewrite this text in the style of a 1940s film noir narrator. Dark, moody, with metaphors about rain, shadows, dame, and trouble. First person, world-weary detective voice.' },
  yoda: { name: 'Yoda', emoji: '🟢', prompt: 'Rewrite this text in Yoda\'s speech pattern. Invert the sentence structure (object-subject-verb). Add wisdom and Force references. "Hmm" and "yes" optional.' },
};

// Mock AI transformation (smart pattern-based, no API needed)
function mockTransform(text, toneKey) {
  const tone = TONES[toneKey];
  if (!tone) return 'Unknown tone selected.';
  
  // Smart mock responses based on tone
  const transforms = {
    professional: (t) => {
      const replacements = [
        [/\bhey\b/gi, 'Greetings'],
        [/\bthanks\b/gi, 'Thank you for your consideration'],
        [/\bsorry\b/gi, 'I sincerely apologize'],
        [/\bgonna\b/gi, 'going to'],
        [/\bwanna\b/gi, 'would like to'],
        [/\byeah\b/gi, 'Indeed'],
        [/\bnope\b/gi, 'Unfortunately, that will not be feasible'],
        [/\bcool\b/gi, 'excellent'],
        [/\bASAP\b/gi, 'at your earliest convenience'],
        [/\bFYI\b/gi, 'For your information'],
        [/\bbtw\b/gi, 'Additionally'],
        [/\bguys\b/gi, 'team'],
        [/!/g, '.'],
      ];
      let result = t;
      replacements.forEach(([pattern, replacement]) => { result = result.replace(pattern, replacement); });
      return `I hope this message finds you well.\n\n${result}\n\nPlease do not hesitate to reach out should you require any further clarification.\n\nBest regards`;
    },
    genz: (t) => {
      const replacements = [
        [/\bgood\b/gi, 'bussin'],
        [/\bgreat\b/gi, 'fire no cap'],
        [/\bbad\b/gi, 'mid fr fr'],
        [/\breally\b/gi, 'lowkey'],
        [/\bvery\b/gi, 'highkey'],
        [/\byes\b/gi, 'bet'],
        [/\bno\b/gi, 'nah fam'],
        [/\bfunny\b/gi, 'sending me 💀'],
        [/\bcool\b/gi, 'slay'],
        [/\blike\b/gi, 'literally like'],
        [/\bseriously\b/gi, 'no cap'],
        [/\bI think\b/gi, 'its giving'],
      ];
      let result = t;
      replacements.forEach(([pattern, replacement]) => { result = result.replace(pattern, replacement); });
      return `ok so like ${result} 💀✨ and that's on periodt`;
    },
    shakespeare: (t) => {
      const replacements = [
        [/\byou\b/gi, 'thou'],
        [/\byour\b/gi, 'thy'],
        [/\bis\b/gi, 'doth be'],
        [/\bare\b/gi, 'art'],
        [/\bwill\b/gi, 'shall'],
        [/\bvery\b/gi, 'most verily'],
        [/\bno\b/gi, 'nay'],
        [/\byes\b/gi, 'aye, forsooth'],
        [/\bfriend\b/gi, 'good fellow'],
        [/\blove\b/gi, 'adoration most divine'],
      ];
      let result = t;
      replacements.forEach(([pattern, replacement]) => { result = result.replace(pattern, replacement); });
      return `Hark! Hear these words well:\n\n${result}\n\nThus I have spoken, and the truth doth ring like bells upon the morn.`;
    },
    pirate: (t) => {
      const replacements = [
        [/\bmy\b/gi, 'me'],
        [/\byou\b/gi, 'ye'],
        [/\bfriend\b/gi, 'matey'],
        [/\bmoney\b/gi, 'doubloons'],
        [/\byes\b/gi, 'aye'],
        [/\bno\b/gi, 'nay'],
        [/\bhello\b/gi, 'ahoy'],
        [/\bhi\b/gi, 'ahoy'],
        [/\bpeople\b/gi, 'scallywags'],
        [/\bwork\b/gi, 'plunder'],
        [/\bsteal\b/gi, 'commandeer'],
      ];
      let result = t;
      replacements.forEach(([pattern, replacement]) => { result = result.replace(pattern, replacement); });
      return `Arrr! 🏴‍☠️ ${result} Shiver me timbers, that be the truth of it, savvy?`;
    },
    corporate: (t) => {
      return `Let's circle back on this and align our stakeholders:\n\n${t}\n\nTo summarize, we need to leverage our core competencies, move the needle on our KPIs, and capture the low-hanging fruit. Let's take this offline, boil the ocean, and create a paradigm shift. Going forward, let's ensure we're all swimming in the same lane and driving synergistic value across the enterprise ecosystem.\n\nI'll ping you to schedule a sync.`;
    },
    romantic: (t) => {
      return `My dearest, my heart overflows as I pen these words to you...\n\n${t.replace(/\./g, ', my love.')}\n\nEvery word is a rose petal falling from my lips to yours. You are the moonlight to my midnight, the warmth in my eternal winter. Until we meet again, my heart beats only for this message. 💕🌹`;
    },
    passive_aggressive: (t) => {
      return `Hi there! 😊\n\nAs per my last email (which I'm sure you read thoroughly), I just wanted to gently circle back on this:\n\n${t}\n\nNot sure if my previous message got lost in your inbox, but just to clarify — going forward, it would be *so great* if we could address this. No worries at all though! I totally understand you must be super busy. 🙂\n\nThanks so much for your time (again)!`;
    },
    surfer: (t) => {
      const replacements = [
        [/\bgood\b/gi, 'gnarly'],
        [/\bgreat\b/gi, 'radical'],
        [/\bbad\b/gi, 'total wipeout'],
        [/\bwork\b/gi, 'grind'],
        [/\bproblem\b/gi, 'bummer'],
      ];
      let result = t;
      replacements.forEach(([pattern, replacement]) => { result = result.replace(pattern, replacement); });
      return `Duuude! 🤙 ${result} Totally stoked about the vibes here, bro. Life's a wave, just gotta ride it! 🏄‍♂️`;
    },
    noir: (t) => {
      return `It was a dark night in the city. The kind of night that makes you question everything. I lit a cigarette and stared at the rain-streaked window.\n\n${t}\n\nThat's what they told me, anyway. But in this town, nothing is ever what it seems. The shadows have secrets, and the secrets have teeth. I pulled my hat low and walked into the fog.`;
    },
    yoda: (t) => {
      // Simple inversion: split sentences and reverse word order loosely
      const sentences = t.split(/[.!?]+/).filter(s => s.trim());
      const yodafied = sentences.map(s => {
        const words = s.trim().split(' ');
        if (words.length > 3) {
          const mid = Math.floor(words.length / 2);
          return [...words.slice(mid), ...words.slice(0, mid)].join(' ');
        }
        return words.reverse().join(' ');
      });
      return `Hmm. ${yodafied.join('. ')}. \n\nStrong with this message, the Force is. Yes, hmmm. 🟢`;
    },
  };

  const transformer = transforms[toneKey];
  if (transformer) return transformer(text);
  return text;
}

// API: Get available tones
app.get('/api/tones', (req, res) => {
  const toneList = Object.entries(TONES).map(([key, val]) => ({
    key,
    name: val.name,
    emoji: val.emoji,
  }));
  res.json(toneList);
});

// API: Transform text
app.post('/api/transform', (req, res) => {
  const { text, tone } = req.body;
  if (!text || !tone) return res.status(400).json({ error: 'Missing text or tone' });
  if (text.length > 5000) return res.status(400).json({ error: 'Text too long (max 5000 chars)' });

  const ip = req.headers['x-forwarded-for'] || req.ip;
  const u = getUsage(ip);
  
  if (u.count >= 5) {
    return res.status(429).json({ 
      error: 'Daily limit reached! Upgrade to Pro for unlimited transforms.',
      upgrade: true 
    });
  }

  u.count++;
  
  // Simulate slight delay for "AI processing" feel
  setTimeout(() => {
    const result = mockTransform(text, tone);
    res.json({ 
      result, 
      remaining: 5 - u.count,
      tone: TONES[tone]?.name 
    });
  }, 500 + Math.random() * 1000);
});

// API: Get config (public key)
app.get('/api/config', (req, res) => {
  res.json({ stripePublicKey: STRIPE_PK });
});

// API: Create Stripe checkout session
app.post('/api/checkout', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'ToneShift Pro',
            description: 'Unlimited AI text transformations',
          },
          unit_amount: 500, // $5.00
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${DOMAIN}?success=true`,
      cancel_url: `${DOMAIN}?canceled=true`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err.message);
    res.status(500).json({ error: 'Payment setup failed' });
  }
});

app.listen(PORT, () => {
  console.log(`ToneShift running on port ${PORT}`);
});
