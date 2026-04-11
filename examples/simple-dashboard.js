#!/usr/bin/env node

/**
 * Ultra-Dex Simple Skills Dashboard
 * Basic web interface for skills discovery
 */

import express from 'express';
import { UltraDexCore } from '../src/core/orchestration/ultra-dex-core.ts';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Ultra-Dex core
let core;

async function initializeApp() {
  console.log('🚀 Starting Ultra-Dex Skills Dashboard...');

  core = new UltraDexCore();
  process.env.MOCK_AI_PROVIDERS = 'true'; // Use mock for demo

  await core.initialize({ env: 'development' });
  console.log('✅ Ultra-Dex Core initialized');
}

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API Routes
app.get('/api/skills', (req, res) => {
  const skills = core.skills.list();
  const categories = {};

  skills.forEach((skill) => {
    if (!categories[skill.category]) {
      categories[skill.category] = [];
    }
    categories[skill.category].push({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      connectors: skill.connectors || [],
    });
  });

  res.json({
    total: skills.length,
    categories: categories,
  });
});

app.post('/api/skills/execute', async (req, res) => {
  const { skillId, input, options = {} } = req.body;

  try {
    const result = await core.skills.execute(skillId, input, options);
    res.json({
      success: true,
      result: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Serve HTML dashboard
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ultra-Dex Skills Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 8px; }
        .skill { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border: 1px solid #ddd; }
        button { background: #007AFF; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        textarea { width: 100%; height: 100px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Ultra-Dex Skills Dashboard</h1>
        <p id="stats">Loading skills...</p>
    </div>
    
    <div>
        <h3>Execute Skill</h3>
        <select id="skillSelect">
            <option value="">Select a skill...</option>
        </select>
        <br><br>
        <textarea id="input" placeholder='{"key": "value"}'></textarea>
        <br>
        <button onclick="executeSkill()">Execute</button>
        <div id="result" style="margin-top: 20px; display: none;"></div>
    </div>
    
    <div id="skillsList"></div>

    <script>
        async function loadSkills() {
            try {
                const response = await fetch('/api/skills');
                const data = await response.json();
                
                document.getElementById('stats').textContent = 
                    data.total + ' skills across ' + Object.keys(data.categories).length + ' categories';
                
                const skillSelect = document.getElementById('skillSelect');
                skillSelect.innerHTML = '<option value="">Select a skill...</option>';
                
                Object.entries(data.categories).forEach(([category, skills]) => {
                    skills.forEach(skill => {
                        const option = document.createElement('option');
                        option.value = skill.id;
                        option.textContent = skill.name + ' (' + skill.id + ')';
                        skillSelect.appendChild(option);
                    });
                });
                
                const skillsContainer = document.getElementById('skillsList');
                skillsContainer.innerHTML = '<h3>All Skills by Category</h3>';
                
                Object.entries(data.categories).forEach(([category, skills]) => {
                    const categoryDiv = document.createElement('div');
                    categoryDiv.innerHTML = '<h4>' + category.toUpperCase() + ' (' + skills.length + ' skills)</h4>';
                    
                    skills.forEach(skill => {
                        const skillDiv = document.createElement('div');
                        skillDiv.className = 'skill';
                        
                        const skillName = document.createElement('strong');
                        skillName.textContent = skill.name + ' (' + skill.id + ')';
                        
                        const skillDesc = document.createElement('p');
                        skillDesc.textContent = skill.description;
                        
                        skillDiv.appendChild(skillName);
                        skillDiv.appendChild(document.createElement('br'));
                        skillDiv.appendChild(skillDesc);
                        
                        if (skill.connectors.length > 0) {
                            const connectors = document.createElement('small');
                            connectors.textContent = 'Connectors: ' + skill.connectors.join(', ');
                            skillDiv.appendChild(document.createElement('br'));
                            skillDiv.appendChild(connectors);
                        }
                        
                        categoryDiv.appendChild(skillDiv);
                    });
                    
                    skillsContainer.appendChild(categoryDiv);
                });
                
            } catch (error) {
                console.error('Error loading skills:', error);
            }
        }
        
        async function executeSkill() {
            const skillId = document.getElementById('skillSelect').value;
            const inputText = document.getElementById('input').value;
            
            if (!skillId) {
                alert('Please select a skill');
                return;
            }
            
            const resultDiv = document.getElementById('result');
            resultDiv.style.display = 'none';
            
            try {
                const input = inputText ? JSON.parse(inputText) : {};
                
                const response = await fetch('/api/skills/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ skillId, input })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    resultDiv.innerHTML = '<strong>Success!</strong><br><pre>' + 
                        JSON.stringify(data.result, null, 2) + '</pre>';
                    resultDiv.style.display = 'block';
                } else {
                    resultDiv.innerHTML = '<strong>Error:</strong> ' + data.error;
                    resultDiv.style.display = 'block';
                }
                
            } catch (error) {
                resultDiv.innerHTML = '<strong>Error:</strong> ' + error.message;
                resultDiv.style.display = 'block';
            }
        }
        
        loadSkills();
    </script>
</body>
</html>
  `);
});

// Start server
async function startServer() {
  await initializeApp();

  app.listen(PORT, () => {
    console.log('🌐 Skills Dashboard running on http://localhost:' + PORT);
    console.log('📋 Skills API available at http://localhost:' + PORT + '/api/skills');
    console.log('🔧 Ready to execute 104 skills across 15 categories');
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down Skills Dashboard...');
  if (core) {
    await core.stop();
  }
  process.exit(0);
});

// Start the application
startServer().catch((error) => {
  console.error('Failed to start Skills Dashboard:', error);
  process.exit(1);
});
