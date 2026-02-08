#!/bin/bash
set -e
cd /opt/delta-project/public

# Backup
cp index.html index.html.bak3

# 1. Add Templates nav link after Glossary link
sed -i "s|<a href=\"#\" onclick=\"showPage('glossary'); return false;\">Glossary</a>|<a href=\"#\" onclick=\"showPage('glossary'); return false;\">Glossary</a>\n        <a href=\"#\" onclick=\"showPage('templates'); return false;\">Templates</a>|" index.html

# 2. Add the templates page div after page-glossary closing div
# Find the page-glossary section and add after it
python3 << 'PYEOF'
import re

with open('index.html', 'r') as f:
    content = f.read()

# Add templates page after page-glossary section
templates_page = '''
    <div id="page-templates" class="hidden">
      <h2 style="font-size:1.8rem;font-weight:800;margin-bottom:0.5rem;">📄 Contract Template Library</h2>
      <p style="color:var(--text-muted);margin-bottom:1.5rem;">Pre-built contract templates with placeholder fields. Preview, customize, and analyze any template instantly.</p>
      
      <div style="display:flex;gap:0.75rem;margin-bottom:1.5rem;flex-wrap:wrap;">
        <input type="text" id="template-search" placeholder="Search templates..." style="flex:1;min-width:200px;" oninput="filterTemplates()">
        <select id="template-category-filter" style="padding:0.75rem 1rem;background:var(--surface2);border:1px solid var(--border);border-radius:10px;color:var(--text);font-family:inherit;" onchange="filterTemplates()">
          <option value="">All Categories</option>
        </select>
      </div>
      
      <div id="templates-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1rem;"></div>
    </div>

    <!-- Template Preview Modal -->
    <div id="template-modal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:1000;overflow-y:auto;padding:2rem;">
      <div style="max-width:800px;margin:0 auto;background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:2rem;position:relative;">
        <button onclick="closeTemplateModal()" style="position:absolute;top:1rem;right:1rem;background:none;border:none;color:var(--text-muted);font-size:1.5rem;cursor:pointer;">&times;</button>
        <div id="template-modal-content"></div>
      </div>
    </div>
'''

# Insert after page-glossary div
# Find the closing tag pattern for page-glossary
glossary_end = content.find('<div id="page-glossary"')
if glossary_end == -1:
    print("ERROR: Could not find page-glossary")
    exit(1)

# Find the closing </div> for page-glossary by counting div depth
pos = glossary_end
depth = 0
found_end = -1
while pos < len(content):
    if content[pos:pos+4] == '<div':
        depth += 1
    elif content[pos:pos+6] == '</div>':
        depth -= 1
        if depth == 0:
            found_end = pos + 6
            break
    pos += 1

if found_end == -1:
    print("ERROR: Could not find end of page-glossary")
    exit(1)

content = content[:found_end] + '\n' + templates_page + content[found_end:]

# 3. Add templates JS before the closing </script> tag
templates_js = '''
    // ========== TEMPLATES ==========
    let allTemplates = [];
    let templateCategories = [];
    
    async function loadTemplates() {
      try {
        const res = await fetch('/api/templates');
        const data = await res.json();
        allTemplates = data.templates;
        templateCategories = data.categories;
        
        const sel = document.getElementById('template-category-filter');
        sel.innerHTML = '<option value="">All Categories</option>' + templateCategories.map(c => '<option value="'+c+'">'+c+'</option>').join('');
        
        renderTemplates(allTemplates);
      } catch(e) { console.error('Failed to load templates', e); }
    }
    
    function filterTemplates() {
      const search = document.getElementById('template-search').value.toLowerCase();
      const cat = document.getElementById('template-category-filter').value;
      let filtered = allTemplates;
      if (search) filtered = filtered.filter(t => t.title.toLowerCase().includes(search) || t.description.toLowerCase().includes(search));
      if (cat) filtered = filtered.filter(t => t.category === cat);
      renderTemplates(filtered);
    }
    
    function renderTemplates(templates) {
      const grid = document.getElementById('templates-grid');
      if (!templates.length) { grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:2rem;">No templates found.</p>'; return; }
      grid.innerHTML = templates.map(t => {
        const riskColors = { low: 'var(--green)', medium: 'var(--orange)', high: 'var(--red)' };
        const riskLabels = { low: 'Low Risk', medium: 'Medium Risk', high: 'High Risk' };
        return '<div style="background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:1.5rem;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.borderColor=\\'var(--accent)\\';this.style.transform=\\'translateY(-2px)\\'" onmouseout="this.style.borderColor=\\'var(--border)\\';this.style.transform=\\'none\\'" onclick="openTemplate(\\''+t.id+'\\')">' +
          '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.75rem;">' +
            '<span style="font-size:0.75rem;padding:0.2rem 0.6rem;border-radius:100px;background:var(--surface2);color:var(--text-muted);">'+t.category+'</span>' +
            '<span style="font-size:0.75rem;padding:0.2rem 0.6rem;border-radius:100px;color:white;background:'+riskColors[t.riskLevel]+';">'+riskLabels[t.riskLevel]+'</span>' +
          '</div>' +
          '<h3 style="font-size:1.05rem;font-weight:700;margin-bottom:0.5rem;">'+t.title+'</h3>' +
          '<p style="color:var(--text-muted);font-size:0.85rem;line-height:1.5;margin-bottom:0.75rem;">'+t.description+'</p>' +
          '<div style="display:flex;gap:1rem;font-size:0.8rem;color:var(--text-dim);">' +
            '<span>📝 '+t.wordCount+' words</span>' +
            '<span>🔤 '+t.placeholderCount+' fields</span>' +
            '<span>⚠️ '+t.commonRedFlags.length+' watch items</span>' +
          '</div>' +
        '</div>';
      }).join('');
    }
    
    async function openTemplate(id) {
      try {
        const res = await fetch('/api/templates/' + id);
        const t = await res.json();
        const riskColors = { low: 'var(--green)', medium: 'var(--orange)', high: 'var(--red)' };
        const riskLabels = { low: 'Low Risk', medium: 'Medium Risk', high: 'High Risk' };
        
        document.getElementById('template-modal-content').innerHTML =
          '<div style="display:flex;gap:0.75rem;align-items:center;margin-bottom:1rem;flex-wrap:wrap;">' +
            '<span style="font-size:0.8rem;padding:0.25rem 0.75rem;border-radius:100px;background:var(--surface2);color:var(--text-muted);">'+t.category+'</span>' +
            '<span style="font-size:0.8rem;padding:0.25rem 0.75rem;border-radius:100px;color:white;background:'+riskColors[t.riskLevel]+';">'+riskLabels[t.riskLevel]+'</span>' +
            '<span style="font-size:0.8rem;color:var(--text-dim);">📝 '+t.wordCount+' words</span>' +
            '<span style="font-size:0.8rem;color:var(--text-dim);">🔤 '+t.placeholders.length+' placeholders</span>' +
          '</div>' +
          '<h2 style="font-size:1.5rem;font-weight:800;margin-bottom:0.75rem;">'+t.title+'</h2>' +
          '<p style="color:var(--text-muted);margin-bottom:1rem;">'+t.description+'</p>' +
          
          (t.commonRedFlags.length ? '<div style="margin-bottom:1.5rem;"><h3 style="font-size:0.9rem;font-weight:700;margin-bottom:0.5rem;color:var(--orange);">⚠️ Common Red Flags to Watch For</h3>' +
            '<div style="display:flex;flex-wrap:wrap;gap:0.5rem;">' + t.commonRedFlags.map(f => '<span style="font-size:0.8rem;padding:0.3rem 0.7rem;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:8px;color:var(--orange);">'+f+'</span>').join('') + '</div></div>' : '') +
          
          '<div style="margin-bottom:1.5rem;">' +
            '<h3 style="font-size:0.9rem;font-weight:700;margin-bottom:0.5rem;">📋 Contract Text</h3>' +
            '<pre style="background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:1.25rem;font-size:0.85rem;line-height:1.6;white-space:pre-wrap;word-wrap:break-word;max-height:400px;overflow-y:auto;color:var(--text);">' + t.text.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\[([A-Z][A-Z_ ,\/.()]+)\]/g, '<span style="background:rgba(124,92,252,0.2);color:var(--accent);padding:0.1rem 0.3rem;border-radius:4px;">[$1]</span>') + '</pre>' +
          '</div>' +
          
          '<div style="display:flex;gap:0.75rem;flex-wrap:wrap;">' +
            '<button class="btn btn-primary" onclick="analyzeTemplate(\\''+t.id+'\\')">🔍 Analyze This Template</button>' +
            '<button class="btn btn-secondary" onclick="downloadTemplatePDF(\\''+t.id+'\\')">📥 Download as PDF</button>' +
            '<button class="btn btn-secondary" onclick="copyTemplateText(\\''+t.id+'\\')">📋 Copy Text</button>' +
            '<button class="btn btn-secondary" onclick="useTemplateInAnalyzer(\\''+t.id+'\\')">✏️ Edit & Analyze</button>' +
          '</div>';
        
        document.getElementById('template-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        window._currentTemplate = t;
      } catch(e) { alert('Failed to load template'); }
    }
    
    function closeTemplateModal() {
      document.getElementById('template-modal').style.display = 'none';
      document.body.style.overflow = '';
    }
    
    async function analyzeTemplate(id) {
      closeTemplateModal();
      showPage('home');
      const heroEl = document.getElementById('hero-section');
      if (heroEl) heroEl.classList.add('hidden');
      
      const btn = document.getElementById('analyze-btn');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Analyzing template...';
      document.getElementById('results-section').classList.add('hidden');
      
      try {
        const res = await fetch('/api/templates/' + id + '/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(typeof authToken !== 'undefined' && authToken ? { Authorization: 'Bearer ' + authToken } : {}) },
          body: JSON.stringify({ values: {} })
        });
        const data = await res.json();
        if (!res.ok) { alert(data.error || 'Analysis failed'); return; }
        renderResults(data);
      } catch(e) { alert('Analysis failed: ' + e.message); }
      finally { btn.disabled = false; btn.textContent = '🔍 Analyze Contract'; }
    }
    
    function downloadTemplatePDF(id) {
      const t = window._currentTemplate;
      if (!t) return;
      const html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+t.title+' — BriefPulse Template</title>' +
        '<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:800px;margin:0 auto;padding:40px;line-height:1.6;color:#1a1a2e;}' +
        'h1{color:#7c5cfc;border-bottom:3px solid #7c5cfc;padding-bottom:10px;}' +
        '.meta{color:#6b7280;font-size:13px;margin-bottom:20px;}' +
        '.placeholder{background:#f3e8ff;color:#7c5cfc;padding:2px 6px;border-radius:4px;font-weight:600;}' +
        '.flags{margin:20px 0;padding:15px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;}' +
        '.footer{margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:12px;text-align:center;}' +
        'pre{white-space:pre-wrap;word-wrap:break-word;background:#f9fafb;padding:20px;border-radius:8px;font-size:14px;line-height:1.8;}' +
        '@media print{body{padding:20px;}}</style></head><body>' +
        '<h1>'+t.title+'</h1>' +
        '<p class="meta">Category: '+t.category+' | Risk Level: '+t.riskLevel.toUpperCase()+' | '+t.wordCount+' words | '+t.placeholders.length+' placeholders</p>' +
        '<p>'+t.description+'</p>' +
        (t.commonRedFlags.length ? '<div class="flags"><strong>⚠️ Common Red Flags:</strong><ul>'+t.commonRedFlags.map(f=>'<li>'+f+'</li>').join('')+'</ul></div>' : '') +
        '<h2>Contract Text</h2><pre>'+t.text.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\[([A-Z][A-Z_ ,\/.()]+)\]/g,'<span class="placeholder">[$1]</span>')+'</pre>' +
        '<div class="footer">Generated by BriefPulse — https://delta.abapture.ai<br>This is a template for informational purposes only and does not constitute legal advice.</div>' +
        '</body></html>';
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = t.id + '-template.html';
      a.click();
      URL.revokeObjectURL(url);
    }
    
    function copyTemplateText(id) {
      const t = window._currentTemplate;
      if (!t) return;
      navigator.clipboard.writeText(t.text).then(() => {
        const btn = event.target;
        const orig = btn.textContent;
        btn.textContent = '✅ Copied!';
        setTimeout(() => btn.textContent = orig, 2000);
      });
    }
    
    function useTemplateInAnalyzer(id) {
      const t = window._currentTemplate;
      if (!t) return;
      closeTemplateModal();
      showPage('home');
      document.getElementById('contract-text').value = t.text;
      document.getElementById('contract-text').scrollIntoView({ behavior: 'smooth' });
    }
'''

# Find last </script> and insert before it
last_script = content.rfind('</script>')
if last_script == -1:
    print("ERROR: Could not find </script>")
    exit(1)

content = content[:last_script] + templates_js + '\n    ' + content[last_script:]

# 4. Update showPage to load templates
content = content.replace(
    "if (page === 'glossary') loadGlossary();",
    "if (page === 'glossary') loadGlossary();\n      if (page === 'templates') loadTemplates();"
)

# 5. Add /templates to the router if there's one
# Look for route handling
if "'/templates'" not in content:
    content = content.replace(
        "else if (path === '/glossary') showPage('glossary');",
        "else if (path === '/glossary') showPage('glossary');\n      else if (path === '/templates' || path.startsWith('/templates/')) showPage('templates');"
    )

with open('index.html', 'w') as f:
    f.write(content)

print("Frontend patched successfully")
PYEOF
