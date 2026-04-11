#!/usr/bin/env node

/**
 * Ultra-Dex Skills Dashboard
 * Simple web dashboard for skills discovery and execution
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
  
  skills.forEach(skill => {
    if (!categories[skill.category]) {
      categories[skill.category] = [];
    }
    categories[skill.category].push({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      connectors: skill.connectors || []
    });
  });
  
  res.json({
    total: skills.length,
    categories: categories
  });
});

app.post('/api/skills/execute', async (req, res) => {
  const { skillId, input, options = {} } = req.body;
  
  try {
    const result = await core.skills.execute(skillId, input, options);
    res.json({
      success: true,
      result: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/providers', (req, res) => {
  const providers = ['openai', 'anthropic', 'google', 'mock'];
  res.json({
    providers: providers.map(name => ({
      name,
      status: 'available'
    }))
  });
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
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f7;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .skill-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: transform 0.2s;
        }
        .skill-card:hover {
            transform: translateY(-2px);
        }
        .category {
            margin-bottom: 40px;
        }
        .category h2 {
            border-bottom: 2px solid #007AFF;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .execution-form {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
        }
        input, textarea, select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 14px;
        }
        button {
            background: #007AFF;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
        .result {
            margin-top: 20px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 6px;
            white-space: pre-wrap;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Ultra-Dex Skills Dashboard</h1>
            <p>Execute 104 AI skills across 15 categories with any AI provider</p>
            <div id="stats">Loading...</div>
        </div>

        <div class="execution-form">
            <h3>Execute Skill</h3>
            <div class="form-group">
                <label for="skillSelect">Select Skill:</label>
                <select id="skillSelect">
                    <option value="">Loading skills...</option>
                </select>
            </div>
            
            <div id="skillInputs">
                <!-- Dynamic inputs based on selected skill -->
            </div>
            
            <button onclick="executeSkill()">Execute Skill</button>
            
            <div id="result" class="result" style="display: none;"></div>
        </div>

        <div id="skillsByCategory">
            <!-- Skills will be loaded here -->
        </div>
    </div>

    <script>
        // Load skills on page load
        async function loadSkills() {
            try {
                const response = await fetch('/api/skills');
                const data = await response.json();
                
                // Update stats
                document.getElementById('stats').innerHTML = 
                    `<strong>${data.total} skills</strong> across <strong>${Object.keys(data.categories).length} categories</strong>`;
                
                // Populate skill select
                const skillSelect = document.getElementById('skillSelect');
                skillSelect.innerHTML = '<option value="">Select a skill...</option>';
                
                Object.entries(data.categories).forEach(([category, skills]) => {
                    skills.forEach(skill => {
                        const option = document.createElement('option');
                        option.value = skill.id;
                        option.textContent = `${skill.name} (${skill.id})`;
                        skillSelect.appendChild(option);
                    });
                });
                
                // Display skills by category
                const skillsContainer = document.getElementById('skillsByCategory');
                skillsContainer.innerHTML = '';
                
                Object.entries(data.categories).forEach(([category, skills]) => {
                    const categoryDiv = document.createElement('div');
                    categoryDiv.className = 'category';
                    
                    const skillsGrid = document.createElement('div');
                    skillsGrid.className = 'skills-grid';
                    
                    skills.forEach(skill => {
                        const skillCard = document.createElement('div');
                        skillCard.className = 'skill-card';
                        skillCard.onclick = function() { selectSkill(skill.id); };
                        
                        const skillName = document.createElement('h4');
                        skillName.textContent = skill.name;
                        
                        const skillDesc = document.createElement('p');
                        skillDesc.textContent = skill.description;
                        
                        skillCard.appendChild(skillName);
                        skillCard.appendChild(skillDesc);
                        
                        if (skill.connectors.length > 0) {
                            const connectors = document.createElement('small');
                            connectors.textContent = 'Connectors: ' + skill.connectors.join(', ');
                            skillCard.appendChild(connectors);
                        }
                        
                        skillsGrid.appendChild(skillCard);
                    });
                    
                    const categoryTitle = document.createElement('h2');
                    categoryTitle.textContent = category.toUpperCase() + ' (' + skills.length + ' skills)';
                    
                    categoryDiv.appendChild(categoryTitle);
                    categoryDiv.appendChild(skillsGrid);
                    skillsContainer.appendChild(categoryDiv);
                });
                
            } catch (error) {
                console.error('Error loading skills:', error);
            }
        }
        
        function selectSkill(skillId) {
            document.getElementById('skillSelect').value = skillId;
            updateSkillInputs(skillId);
        }
        
        function updateSkillInputs(skillId) {
            // Simple input form based on skill ID
            const inputsDiv = document.getElementById('skillInputs');
            
            let inputs = '';
            
            if (skillId === '/code-review') {
                inputs = `
                    <div class="form-group">
                        <label for="code">Code:</label>
                        <textarea id="code" rows="6" placeholder="Paste your code here"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="language">Language:</label>
                        <input type="text" id="language" value="javascript" placeholder="Programming language">
                    </div>
                `;
            } else if (skillId === '/sql-queries') {
                inputs = `
                    <div class="form-group">
                        <label for="prompt">Prompt:</label>
                        <textarea id="prompt" rows="3" placeholder="Describe the query you need"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="dialect">SQL Dialect:</label>
                        <input type="text" id="dialect" value="postgresql" placeholder="postgresql, mysql, etc.">
                    </div>
                `;
            } else {
                inputs = `
                    <div class="form-group">
                        <label for="input">Input (JSON):</label>
                        <textarea id="input" rows="4" placeholder='{"key": "value"}'></textarea>
                    </div>
                `;
            }
            
            inputsDiv.innerHTML = inputs;
        }
        
        async function executeSkill() {
            const skillId = document.getElementById('skillSelect').value;
            if (!skillId) {
                alert('Please select a skill');
                return;
            }
            
            const resultDiv = document.getElementById('result');
            resultDiv.style.display = 'none';
            
            try {
                let input = {};
                
                if (skillId === '/code-review') {
                    input = {
                        code: document.getElementById('code').value,
                        language: document.getElementById('language').value
                    };
                } else if (skillId === '/sql-queries') {
                    input = {
                        prompt: document.getElementById('prompt').value,
                        dialect: document.getElementById('dialect').value
                    };
                } else {
                    const inputText = document.getElementById('input').value;
                    input = inputText ? JSON.parse(inputText) : {};
                }
                
                const response = await fetch('/api/skills/execute', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        skillId,
                        input
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    resultDiv.innerHTML = `<strong>Success!</strong>\n${JSON.stringify(data.result, null, 2)}`;
                    resultDiv.style.display = 'block';
                } else {
                    resultDiv.innerHTML = `<strong>Error:</strong> ${data.error}`;
                    resultDiv.style.display = 'block';
                }
                
            } catch (error) {
                resultDiv.innerHTML = `<strong>Error:</strong> ${error.message}`;
                resultDiv.style.display = 'block';
            }
        }
        
        // Initialize
        document.getElementById('skillSelect').addEventListener('change', (e) => {
            updateSkillInputs(e.target.value);
        });
        
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
    console.log(`🌐 Skills Dashboard running on http://localhost:${PORT}`);
    console.log(`📋 Skills API available at http://localhost:${PORT}/api/skills`);
    console.log(`🔧 Ready to execute 104 skills across 15 categories`);
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
startServer().catch(error => {
  console.error('Failed to start Skills Dashboard:', error);
  process.exit(1);
});