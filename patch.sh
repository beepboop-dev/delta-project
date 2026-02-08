#!/bin/bash
set -e
cd /opt/delta-project

# Backup
cp server.js server.js.bak3

# Add require at top (after existing requires)
sed -i '9a const { CONTRACT_TEMPLATES } = require("./templates");' server.js

# Add template API routes before SPA routes
sed -i '/\/\/ SPA routes/i \
// ========== CONTRACT TEMPLATE LIBRARY ROUTES ==========\
app.get("/api/templates", (req, res) => {\
  const { search, category } = req.query;\
  let templates = CONTRACT_TEMPLATES.map(t => ({\
    id: t.id, title: t.title, category: t.category, description: t.description,\
    riskLevel: t.riskLevel, commonRedFlags: t.commonRedFlags,\
    wordCount: t.text.split(/\\s+/).length,\
    placeholderCount: (t.text.match(/\\[([A-Z][A-Z_ ,\\/.()]+)\\]/g) || []).length,\
  }));\
  if (search) { const q = search.toLowerCase(); templates = templates.filter(t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)); }\
  if (category) { templates = templates.filter(t => t.category.toLowerCase() === category.toLowerCase()); }\
  const categories = [...new Set(CONTRACT_TEMPLATES.map(t => t.category))];\
  res.json({ templates, categories });\
});\
\
app.get("/api/templates/:id", (req, res) => {\
  const template = CONTRACT_TEMPLATES.find(t => t.id === req.params.id);\
  if (!template) return res.status(404).json({ error: "Template not found" });\
  const placeholders = [...new Set((template.text.match(/\\[([A-Z][A-Z_ ,\\/.()]+)\\]/g) || []).map(p => p.slice(1, -1)))];\
  res.json({ ...template, placeholders, wordCount: template.text.split(/\\s+/).length });\
});\
\
app.post("/api/templates/:id/analyze", optionalAuth, (req, res) => {\
  const template = CONTRACT_TEMPLATES.find(t => t.id === req.params.id);\
  if (!template) return res.status(404).json({ error: "Template not found" });\
  const { values } = req.body;\
  let text = template.text;\
  if (values && typeof values === "object") {\
    for (const [key, value] of Object.entries(values)) {\
      const regex = new RegExp("\\\\[" + key.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&") + "\\\\]", "g");\
      text = text.replace(regex, value);\
    }\
  }\
  const ip = req.headers["x-forwarded-for"] || req.ip;\
  const u = getUsage(ip);\
  if (!req.userId && u.count >= 3) return res.status(429).json({ error: "Free limit reached.", upgrade: true });\
  if (!req.userId) u.count++;\
  const result = analyzeContract(text);\
  const clauseData = annotateContractClauses(text);\
  result.clauseAnnotations = clauseData;\
  result.negotiationPlaybook = generateNegotiationPlaybook(result.redFlags);\
  result.templateId = template.id;\
  result.templateTitle = template.title;\
  const remaining = (text.match(/\\[([A-Z][A-Z_ ,\\/.()]+)\\]/g) || []);\
  result.unfilledPlaceholders = [...new Set(remaining.map(p => p.slice(1, -1)))];\
  const shareId = crypto.randomBytes(6).toString("hex");\
  sharedResults.set(shareId, { analysis: result, createdAt: Date.now(), textPreview: text.slice(0, 200) });\
  res.json({ ...result, filledText: text, shareId });\
});\
' server.js

# Add SPA route for /templates
sed -i "/app.get('\/bulk'/a app.get('/templates', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));\napp.get('/templates/:id', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));" server.js

echo "Server patched successfully"
