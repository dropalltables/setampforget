let permissions = [];
let mcpPermissions = [];
let mcpServers = {};
let customSettings = [];

const knownSettings = [
    'amp.anthropic.thinking.enabled',
    'amp.notifications.enabled',
    'amp.showCosts',
    'amp.tab.clipboard.enabled',
    'amp.git.commit.coauthor.enabled',
    'amp.git.commit.ampThread.enabled',
    'amp.updates.mode',
    'amp.terminal.commands.nodeSpawn.loadProfile',
    'amp.tools.stopTimeout',
    'amp.tools.disable',
    'amp.fuzzy.alwaysIncludePaths',
    'amp.skills.path',
    'amp.terminal.theme',
    'amp.dangerouslyAllowAll',
    'amp.anthropic.interleavedThinking.enabled',
    'amp.workerUrl',
    'amp.url',
    'amp.permissions',
    'amp.mcpPermissions',
    'amp.mcpServers'
];

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function addPermission() {
    const id = Date.now();
    permissions.push({ id, tool: '*', action: 'ask', matches: null, delegateTo: null });
    renderPermissions();
}

function removePermission(id) {
    permissions = permissions.filter(p => p.id !== id);
    renderPermissions();
}

function renderPermissions() {
    const list = document.getElementById('permissionsList');
    list.innerHTML = permissions.map(p => `
        <div class="border rounded p-2 mb-2">
            <div class="row g-2 align-items-end">
                <div class="col-md-4">
                    <label class="form-label small">Tool</label>
                    <input type="text" class="form-control form-control-sm" value="${escapeHtml(p.tool)}" 
                        onchange="updatePermission(${p.id}, 'tool', this.value)" placeholder="Bash, mcp__*, *">
                </div>
                <div class="col-md-2">
                    <label class="form-label small">Action</label>
                    <select class="form-select form-select-sm" onchange="updatePermission(${p.id}, 'action', this.value)">
                        <option value="allow" ${p.action === 'allow' ? 'selected' : ''}>Allow</option>
                        <option value="ask" ${p.action === 'ask' ? 'selected' : ''}>Ask</option>
                        <option value="reject" ${p.action === 'reject' ? 'selected' : ''}>Reject</option>
                        <option value="delegate" ${p.action === 'delegate' ? 'selected' : ''}>Delegate</option>
                    </select>
                </div>
                <div class="col-md-3">
                    <label class="form-label small">Match (cmd pattern)</label>
                    <input type="text" class="form-control form-control-sm" value="${escapeHtml(p.matches)}" 
                        onchange="updatePermission(${p.id}, 'matches', this.value)" placeholder="*git push*">
                </div>
                <div class="col-md-2 ${p.action === 'delegate' ? '' : 'd-none'}" id="delegate-${p.id}">
                    <label class="form-label small">Delegate to</label>
                    <input type="text" class="form-control form-control-sm" value="${escapeHtml(p.delegateTo)}" 
                        onchange="updatePermission(${p.id}, 'delegateTo', this.value)" placeholder="helper-script">
                </div>
                <div class="col-md-1">
                    <button class="btn btn-sm btn-outline-secondary" onclick="removePermission(${p.id})" aria-label="Remove rule">X</button>
                </div>
            </div>
        </div>
    `).join('');
    generateConfig();
}

function updatePermission(id, field, value) {
    const p = permissions.find(p => p.id === id);
    if (p) {
        p[field] = value || null;
        if (field === 'action') renderPermissions();
    }
    generateConfig();
}

function addMcpPermission() {
    const id = Date.now();
    mcpPermissions.push({ id, matchType: 'command', matchValue: '*', action: 'ask' });
    renderMcpPermissions();
}

function removeMcpPermission(id) {
    mcpPermissions = mcpPermissions.filter(p => p.id !== id);
    renderMcpPermissions();
}

function renderMcpPermissions() {
    const list = document.getElementById('mcpPermissionsList');
    list.innerHTML = mcpPermissions.map(p => `
        <div class="border rounded p-2 mb-2">
            <div class="row g-2 align-items-end">
                <div class="col-md-3">
                    <label class="form-label small">Match Type</label>
                    <select class="form-select form-select-sm" onchange="updateMcpPermission(${p.id}, 'matchType', this.value)">
                        <option value="command" ${p.matchType === 'command' ? 'selected' : ''}>Command</option>
                        <option value="url" ${p.matchType === 'url' ? 'selected' : ''}>URL</option>
                    </select>
                </div>
                <div class="col-md-4">
                    <label class="form-label small">Match Value</label>
                    <input type="text" class="form-control form-control-sm" value="${escapeHtml(p.matchValue)}" 
                        onchange="updateMcpPermission(${p.id}, 'matchValue', this.value)" placeholder="npx, https://*">
                </div>
                <div class="col-md-3">
                    <label class="form-label small">Action</label>
                    <select class="form-select form-select-sm" onchange="updateMcpPermission(${p.id}, 'action', this.value)">
                        <option value="allow" ${p.action === 'allow' ? 'selected' : ''}>Allow</option>
                        <option value="ask" ${p.action === 'ask' ? 'selected' : ''}>Ask</option>
                        <option value="reject" ${p.action === 'reject' ? 'selected' : ''}>Reject</option>
                    </select>
                </div>
                <div class="col-md-2">
                    <button class="btn btn-sm btn-outline-secondary" onclick="removeMcpPermission(${p.id})" aria-label="Remove rule">X</button>
                </div>
            </div>
        </div>
    `).join('');
    generateConfig();
}

function updateMcpPermission(id, field, value) {
    const p = mcpPermissions.find(p => p.id === id);
    if (p) p[field] = value;
    generateConfig();
}

function addMcpServer() {
    const name = prompt('Server name (e.g., playwright, linear):');
    if (!name || !name.trim()) return;
    const safeName = name.trim().replace(/[^a-zA-Z0-9_-]/g, '-');
    mcpServers[safeName] = { type: 'command', command: '', args: [], url: '' };
    renderMcpServers();
}

function removeMcpServer(name) {
    delete mcpServers[name];
    renderMcpServers();
}

function addPresetMcp(preset) {
    const presets = {
        playwright: {
            type: 'command',
            command: 'npx',
            args: ['-y', '@playwright/mcp@latest', '--headless'],
            url: ''
        },
        filesystem: {
            type: 'command',
            command: 'npx',
            args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/dir'],
            url: ''
        },
        context7: {
            type: 'command',
            command: 'npx',
            args: ['-y', '@upstash/context7-mcp'],
            url: ''
        }
    };
    mcpServers[preset] = presets[preset];
    renderMcpServers();
}

function renderMcpServers() {
    const list = document.getElementById('mcpServersList');
    list.innerHTML = Object.entries(mcpServers).map(([name, s]) => `
        <div class="border rounded p-2 mb-2" data-server="${escapeHtml(name)}">
            <div class="d-flex justify-content-between align-items-center mb-2">
                <strong>${escapeHtml(name)}</strong>
                <button class="btn btn-sm btn-outline-secondary btn-remove-server" aria-label="Remove server">X</button>
            </div>
            <div class="row g-2">
                <div class="col-md-3">
                    <label class="form-label small">Type</label>
                    <select class="form-select form-select-sm select-type">
                        <option value="command" ${s.type === 'command' ? 'selected' : ''}>Command</option>
                        <option value="url" ${s.type === 'url' ? 'selected' : ''}>URL</option>
                    </select>
                </div>
                ${s.type === 'command' ? `
                    <div class="col-md-3">
                        <label class="form-label small">Command</label>
                        <input type="text" class="form-control form-control-sm input-command" value="${escapeHtml(s.command)}" placeholder="npx">
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small">Args (JSON array)</label>
                        <input type="text" class="form-control form-control-sm input-args" value="${escapeHtml(JSON.stringify(s.args))}" placeholder='["-y", "@pkg/name"]'>
                    </div>
                ` : `
                    <div class="col-md-9">
                        <label class="form-label small">URL</label>
                        <input type="text" class="form-control form-control-sm input-url" value="${escapeHtml(s.url)}" placeholder="https://mcp.example.com/sse">
                    </div>
                `}
            </div>
        </div>
    `).join('');
    
    list.querySelectorAll('.btn-remove-server').forEach(btn => {
        btn.onclick = () => { removeMcpServer(btn.closest('[data-server]').dataset.server); };
    });
    list.querySelectorAll('.select-type').forEach(sel => {
        sel.onchange = () => { updateMcpServer(sel.closest('[data-server]').dataset.server, 'type', sel.value); };
    });
    list.querySelectorAll('.input-command').forEach(inp => {
        inp.onchange = () => { updateMcpServer(inp.closest('[data-server]').dataset.server, 'command', inp.value); };
    });
    list.querySelectorAll('.input-args').forEach(inp => {
        inp.onchange = () => { updateMcpServer(inp.closest('[data-server]').dataset.server, 'args', inp.value); };
    });
    list.querySelectorAll('.input-url').forEach(inp => {
        inp.onchange = () => { updateMcpServer(inp.closest('[data-server]').dataset.server, 'url', inp.value); };
    });
    generateConfig();
}

function updateMcpServer(name, field, value) {
    if (field === 'args') {
        try {
            const parsed = JSON.parse(value);
            mcpServers[name].args = Array.isArray(parsed) ? parsed : [value];
        } catch {
            mcpServers[name].args = value.split(',').map(s => s.trim()).filter(Boolean);
        }
    } else if (field === 'type') {
        mcpServers[name].type = value;
        renderMcpServers();
        return;
    } else {
        mcpServers[name][field] = value;
    }
    generateConfig();
}

function generateConfig() {
    const config = {};

    const thinking = document.getElementById('thinkingEnabled').checked;
    const notif = document.getElementById('notificationsEnabled').checked;
    const showCosts = document.getElementById('showCosts').checked;
    const tabClipboard = document.getElementById('tabClipboard').checked;
    const coauthor = document.getElementById('gitCoauthor').checked;
    const threadId = document.getElementById('gitThreadId').checked;
    const updates = document.getElementById('updatesMode').value;
    const profile = document.getElementById('loadProfile').value;
    const stopTimeout = document.getElementById('stopTimeout').value;
    const toolsDisable = document.getElementById('toolsDisable').value;
    const fuzzyPaths = document.getElementById('fuzzyPaths').value;
    const skillsPath = document.getElementById('skillsPath').value;
    const theme = document.getElementById('terminalTheme').value;
    const customTheme = document.getElementById('customThemeName').value;
    const dangerouslyAllowAll = document.getElementById('dangerouslyAllowAll').checked;
    const interleavedThinking = document.getElementById('interleavedThinking').checked;
    const workerUrl = document.getElementById('workerUrl').value;
    const ampUrl = document.getElementById('ampUrl').value;

    if (!thinking) config['amp.anthropic.thinking.enabled'] = false;
    if (!notif) config['amp.notifications.enabled'] = false;
    if (!showCosts) config['amp.showCosts'] = false;
    if (!tabClipboard) config['amp.tab.clipboard.enabled'] = false;
    if (!coauthor) config['amp.git.commit.coauthor.enabled'] = false;
    if (!threadId) config['amp.git.commit.ampThread.enabled'] = false;
    if (updates !== 'auto') config['amp.updates.mode'] = updates;
    if (profile !== 'always') config['amp.terminal.commands.nodeSpawn.loadProfile'] = profile;
    if (stopTimeout && stopTimeout !== '300') config['amp.tools.stopTimeout'] = parseInt(stopTimeout);
    if (toolsDisable) config['amp.tools.disable'] = toolsDisable.split(',').map(s => s.trim()).filter(Boolean);
    if (fuzzyPaths) config['amp.fuzzy.alwaysIncludePaths'] = fuzzyPaths.split(',').map(s => s.trim()).filter(Boolean);
    if (skillsPath) config['amp.skills.path'] = skillsPath;
    if (dangerouslyAllowAll) config['amp.dangerouslyAllowAll'] = true;
    if (interleavedThinking) config['amp.anthropic.interleavedThinking.enabled'] = true;
    if (workerUrl) config['amp.workerUrl'] = workerUrl;
    if (ampUrl) config['amp.url'] = ampUrl;

    if (theme === 'custom' && customTheme) {
        config['amp.terminal.theme'] = customTheme;
    } else if (theme && theme !== 'custom') {
        config['amp.terminal.theme'] = theme;
    }

    if (permissions.length > 0) {
        config['amp.permissions'] = permissions.map(p => {
            const rule = { tool: p.tool, action: p.action };
            if (p.matches) rule.matches = { cmd: p.matches };
            if (p.action === 'delegate' && p.delegateTo) rule.to = p.delegateTo;
            return rule;
        });
    }

    if (mcpPermissions.length > 0) {
        config['amp.mcpPermissions'] = mcpPermissions.map(p => ({
            matches: { [p.matchType]: p.matchValue },
            action: p.action
        }));
    }

    if (Object.keys(mcpServers).length > 0) {
        config['amp.mcpServers'] = {};
        for (const [name, s] of Object.entries(mcpServers)) {
            if (s.type === 'command') {
                config['amp.mcpServers'][name] = { command: s.command, args: s.args };
            } else {
                config['amp.mcpServers'][name] = { url: s.url };
            }
        }
    }

    for (const s of customSettings) {
        if (s.key && s.value !== null && s.value !== undefined) {
            config[s.key] = s.value;
        }
    }

    document.getElementById('output').value = JSON.stringify(config, null, 2);
}

function copyConfig() {
    navigator.clipboard.writeText(document.getElementById('output').value).then(() => {
        const btn = document.querySelector('[onclick="copyConfig()"]');
        const orig = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => btn.textContent = orig, 1500);
    });
}

function downloadConfig() {
    const blob = new Blob([document.getElementById('output').value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'settings.json';
    a.click();
    URL.revokeObjectURL(url);
}

function handleImport() {
    const text = document.getElementById('output').value.trim();
    if (!text) {
        document.getElementById('fileInput').click();
        return;
    }
    try {
        const parsed = JSON.parse(text);
        if (typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length > 0) {
            importConfig(text);
        } else {
            document.getElementById('fileInput').click();
        }
    } catch {
        document.getElementById('fileInput').click();
    }
}

function importFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => importConfig(e.target.result);
    reader.readAsText(file);
    event.target.value = '';
}

function showImportError(msg) {
    const el = document.getElementById('importError');
    el.textContent = msg;
    el.classList.remove('d-none');
}

function hideImportError() {
    document.getElementById('importError').classList.add('d-none');
}

function importConfig(jsonString) {
    hideImportError();
    let config;
    try {
        config = JSON.parse(jsonString);
    } catch (e) {
        showImportError('Invalid JSON: ' + e.message);
        return;
    }
    if (typeof config !== 'object' || config === null || Array.isArray(config)) {
        showImportError('Config must be a JSON object');
        return;
    }

    document.getElementById('thinkingEnabled').checked = config['amp.anthropic.thinking.enabled'] !== false;
    document.getElementById('notificationsEnabled').checked = config['amp.notifications.enabled'] !== false;
    document.getElementById('showCosts').checked = config['amp.showCosts'] !== false;
    document.getElementById('tabClipboard').checked = config['amp.tab.clipboard.enabled'] !== false;
    document.getElementById('gitCoauthor').checked = config['amp.git.commit.coauthor.enabled'] !== false;
    document.getElementById('gitThreadId').checked = config['amp.git.commit.ampThread.enabled'] !== false;
    document.getElementById('updatesMode').value = config['amp.updates.mode'] || 'auto';
    document.getElementById('loadProfile').value = config['amp.terminal.commands.nodeSpawn.loadProfile'] || 'always';
    document.getElementById('stopTimeout').value = config['amp.tools.stopTimeout'] ?? 300;
    document.getElementById('toolsDisable').value = Array.isArray(config['amp.tools.disable']) ? config['amp.tools.disable'].join(', ') : '';
    document.getElementById('fuzzyPaths').value = Array.isArray(config['amp.fuzzy.alwaysIncludePaths']) ? config['amp.fuzzy.alwaysIncludePaths'].join(', ') : '';
    document.getElementById('skillsPath').value = config['amp.skills.path'] || '';
    document.getElementById('dangerouslyAllowAll').checked = config['amp.dangerouslyAllowAll'] === true;
    document.getElementById('interleavedThinking').checked = config['amp.anthropic.interleavedThinking.enabled'] === true;
    document.getElementById('workerUrl').value = config['amp.workerUrl'] || '';
    document.getElementById('ampUrl').value = config['amp.url'] || '';

    const theme = config['amp.terminal.theme'] || '';
    const themeSelect = document.getElementById('terminalTheme');
    const validThemes = [...themeSelect.options].map(o => o.value);
    if (validThemes.includes(theme)) {
        themeSelect.value = theme;
        document.getElementById('customThemeInput').style.display = 'none';
    } else if (theme) {
        themeSelect.value = 'custom';
        document.getElementById('customThemeName').value = theme;
        document.getElementById('customThemeInput').style.display = 'block';
    } else {
        themeSelect.value = '';
        document.getElementById('customThemeInput').style.display = 'none';
    }

    permissions = [];
    if (Array.isArray(config['amp.permissions'])) {
        config['amp.permissions'].forEach(p => {
            permissions.push({
                id: Date.now() + Math.random(),
                tool: p.tool || '*',
                action: p.action || 'ask',
                matches: p.matches?.cmd || null,
                delegateTo: p.to || null
            });
        });
    }
    renderPermissions();

    mcpPermissions = [];
    if (Array.isArray(config['amp.mcpPermissions'])) {
        config['amp.mcpPermissions'].forEach(p => {
            const matchType = p.matches?.command ? 'command' : 'url';
            const matchValue = p.matches?.command || p.matches?.url || '*';
            mcpPermissions.push({
                id: Date.now() + Math.random(),
                matchType,
                matchValue,
                action: p.action || 'ask'
            });
        });
    }
    renderMcpPermissions();

    mcpServers = {};
    if (config['amp.mcpServers'] && typeof config['amp.mcpServers'] === 'object') {
        for (const [name, s] of Object.entries(config['amp.mcpServers'])) {
            if (s.url) {
                mcpServers[name] = { type: 'url', command: '', args: [], url: s.url };
            } else {
                mcpServers[name] = { type: 'command', command: s.command || '', args: s.args || [], url: '' };
            }
        }
    }
    renderMcpServers();

    customSettings = [];
    for (const [key, value] of Object.entries(config)) {
        if (!knownSettings.includes(key)) {
            customSettings.push({ id: Date.now() + Math.random(), key, value });
        }
    }
    renderCustomSettings();

    generateConfig();
}

function resetForm() {
    permissions = [];
    mcpPermissions = [];
    mcpServers = {};
    customSettings = [];

    document.getElementById('thinkingEnabled').checked = true;
    document.getElementById('notificationsEnabled').checked = true;
    document.getElementById('showCosts').checked = true;
    document.getElementById('tabClipboard').checked = true;
    document.getElementById('gitCoauthor').checked = true;
    document.getElementById('gitThreadId').checked = true;
    document.getElementById('updatesMode').value = 'auto';
    document.getElementById('loadProfile').value = 'always';
    document.getElementById('stopTimeout').value = 300;
    document.getElementById('toolsDisable').value = '';
    document.getElementById('fuzzyPaths').value = '';
    document.getElementById('skillsPath').value = '';
    document.getElementById('terminalTheme').value = '';
    document.getElementById('customThemeName').value = '';
    document.getElementById('customThemeInput').style.display = 'none';
    document.getElementById('dangerouslyAllowAll').checked = false;
    document.getElementById('interleavedThinking').checked = false;
    document.getElementById('workerUrl').value = '';
    document.getElementById('ampUrl').value = '';
    hideImportError();

    renderPermissions();
    renderMcpPermissions();
    renderMcpServers();
    renderCustomSettings();
    generateConfig();
}

function addCustomSetting() {
    customSettings.push({ id: Date.now(), key: '', value: null });
    renderCustomSettings();
}

function removeCustomSetting(id) {
    customSettings = customSettings.filter(s => s.id !== id);
    renderCustomSettings();
}

function updateCustomSetting(id, field, rawValue) {
    const s = customSettings.find(s => s.id === id);
    if (!s) return;
    if (field === 'value') {
        try {
            s.value = JSON.parse(rawValue);
        } catch {
            s.value = rawValue;
        }
    } else {
        s[field] = rawValue;
    }
    generateConfig();
}

function renderCustomSettingValue(s) {
    if (Array.isArray(s.value)) {
        const items = s.value.map((item, i) => `
            <div class="input-group input-group-sm mb-1">
                <input type="text" class="form-control" value="${escapeHtml(typeof item === 'string' ? item : JSON.stringify(item))}"
                    onchange="updateCustomArrayItem(${s.id}, ${i}, this.value)">
                <button class="btn btn-outline-secondary" onclick="removeCustomArrayItem(${s.id}, ${i})">X</button>
            </div>
        `).join('');
        return `
            <div>
                ${items}
                <button class="btn btn-sm btn-outline-primary" onclick="addCustomArrayItem(${s.id})">+ Add</button>
            </div>
        `;
    }
    const valueStr = s.value === null ? '' : JSON.stringify(s.value);
    return `<input type="text" class="form-control form-control-sm" value="${escapeHtml(valueStr)}" 
        onchange="updateCustomSetting(${s.id}, 'value', this.value)" placeholder='true, "string", [1,2,3]'>`;
}

function updateCustomArrayItem(id, index, value) {
    const s = customSettings.find(s => s.id === id);
    if (!s || !Array.isArray(s.value)) return;
    try {
        s.value[index] = JSON.parse(value);
    } catch {
        s.value[index] = value;
    }
    generateConfig();
}

function addCustomArrayItem(id) {
    const s = customSettings.find(s => s.id === id);
    if (!s) return;
    if (!Array.isArray(s.value)) s.value = [];
    s.value.push('');
    renderCustomSettings();
}

function removeCustomArrayItem(id, index) {
    const s = customSettings.find(s => s.id === id);
    if (!s || !Array.isArray(s.value)) return;
    s.value.splice(index, 1);
    renderCustomSettings();
}

function renderCustomSettings() {
    const list = document.getElementById('customSettingsList');
    list.innerHTML = customSettings.map(s => `
        <div class="border rounded p-2 mb-2">
            <div class="d-flex justify-content-between align-items-start mb-2">
                <input type="text" class="form-control form-control-sm" style="max-width: 300px;" value="${escapeHtml(s.key)}" 
                    onchange="updateCustomSetting(${s.id}, 'key', this.value)" placeholder="amp.some.setting">
                <button class="btn btn-sm btn-outline-secondary ms-2" onclick="removeCustomSetting(${s.id})" aria-label="Remove setting">X</button>
            </div>
            ${renderCustomSettingValue(s)}
        </div>
    `).join('');
    generateConfig();
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('terminalTheme').addEventListener('change', function() {
        document.getElementById('customThemeInput').style.display = this.value === 'custom' ? 'block' : 'none';
        generateConfig();
    });

    document.querySelectorAll('input, select').forEach(el => {
        el.addEventListener('change', generateConfig);
        el.addEventListener('input', generateConfig);
    });

    generateConfig();
});
