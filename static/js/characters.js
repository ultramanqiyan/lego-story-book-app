let presetCharacters = [];
let customCharacters = [];
let currentTab = 'custom';
let editingCharacter = null;

document.addEventListener('DOMContentLoaded', function() {
    if (!App.checkAuth()) return;
    initTabs();
    loadCharacters();
    initModal();
});

function initTabs() {
    document.querySelectorAll('.characters-tabs .tab-btn').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.characters-tabs .tab-btn').forEach(function(t) {
                t.classList.remove('active');
            });
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            
            if (currentTab === 'custom') {
                document.getElementById('customCharacters').style.display = 'grid';
                document.getElementById('presetCharacters').style.display = 'none';
            } else {
                document.getElementById('customCharacters').style.display = 'none';
                document.getElementById('presetCharacters').style.display = 'grid';
            }
        });
    });
}

async function loadCharacters() {
    await Promise.all([
        loadPresetCharacters(),
        loadCustomCharacters()
    ]);
}

async function loadPresetCharacters() {
    try {
        const data = await App.api('/api/characters/preset');
        presetCharacters = data;
        renderPresetCharacters();
    } catch (err) {
        console.error('Load preset characters error:', err);
        document.getElementById('presetCharacters').innerHTML = '<p class="error">加载失败</p>';
    }
}

async function loadCustomCharacters() {
    try {
        const data = await App.api('/api/characters/custom');
        customCharacters = data;
        renderCustomCharacters();
    } catch (err) {
        console.error('Load custom characters error:', err);
        document.getElementById('customCharacters').innerHTML = '<p class="error">加载失败</p>';
    }
}

function renderPresetCharacters() {
    const container = document.getElementById('presetCharacters');
    if (!presetCharacters.length) {
        container.innerHTML = '<p class="empty">暂无预设角色</p>';
        return;
    }
    
    container.innerHTML = presetCharacters.map(function(char) {
        return '<div class="character-card preset">' +
            '<div class="character-avatar">' + (char.avatar_emoji || '🎭') + '</div>' +
            '<div class="character-info">' +
            '<h4>' + char.name + '</h4>' +
            '<p>' + (char.personality || '') + '</p>' +
            '</div>' +
            '</div>';
    }).join('');
}

function renderCustomCharacters() {
    const container = document.getElementById('customCharacters');
    
    var html = '<div class="create-new-card" onclick="openCreateModal()">' +
        '<span class="plus-icon">+</span>' +
        '<span>创建新角色</span>' +
        '</div>';
    
    if (customCharacters.length > 0) {
        html += customCharacters.map(function(char) {
            return '<div class="character-card custom" data-id="' + char.character_id + '">' +
                '<div class="character-avatar">' + (char.avatar_emoji || '🧑') + '</div>' +
                '<div class="character-info">' +
                '<h4>' + char.name + '</h4>' +
                '<p>' + (char.personality || '') + '</p>' +
                '</div>' +
                '<div class="character-actions">' +
                '<button class="btn btn-small btn-outline" onclick="editCharacter(\'' + char.character_id + '\')">编辑</button>' +
                '<button class="btn btn-small btn-text" onclick="deleteCharacter(\'' + char.character_id + '\')">删除</button>' +
                '</div>' +
                '</div>';
        }).join('');
    }
    
    container.innerHTML = html;
}

function initModal() {
    document.getElementById('createCharacterBtn').addEventListener('click', openCreateModal);
    
    document.querySelector('#characterModal .close-btn').addEventListener('click', closeCreateModal);
    document.getElementById('cancelEdit').addEventListener('click', closeCreateModal);
    document.getElementById('saveCharacter').addEventListener('click', saveCharacter);
    
    initCharacterOptions();
}

function initCharacterOptions() {
    var optionGroups = ['hairOptions', 'outfitOptions', 'accessoryOptions'];
    optionGroups.forEach(function(groupId) {
        var group = document.getElementById(groupId);
        if (group) {
            group.querySelectorAll('.option-item').forEach(function(item) {
                item.addEventListener('click', function() {
                    group.querySelectorAll('.option-item').forEach(function(i) {
                        i.classList.remove('active');
                    });
                    item.classList.add('active');
                    updateCharacterPreview();
                });
            });
        }
    });
    
    var colorGroups = ['hairColorOptions', 'skinColorOptions'];
    colorGroups.forEach(function(groupId) {
        var group = document.getElementById(groupId);
        if (group) {
            group.querySelectorAll('.color-item').forEach(function(item) {
                item.addEventListener('click', function() {
                    group.querySelectorAll('.color-item').forEach(function(i) {
                        i.classList.remove('active');
                    });
                    item.classList.add('active');
                    updateCharacterPreview();
                });
            });
        }
    });
}

function openCreateModal() {
    editingCharacter = null;
    document.getElementById('modalTitle').textContent = '创建角色';
    document.getElementById('characterName').value = '';
    resetCharacterOptions();
    document.getElementById('characterModal').style.display = 'flex';
}

function closeCreateModal() {
    document.getElementById('characterModal').style.display = 'none';
}

function resetCharacterOptions() {
    document.querySelectorAll('.option-item').forEach(function(item, index) {
        item.classList.toggle('active', index === 0);
    });
    document.querySelectorAll('.color-item').forEach(function(item, index) {
        item.classList.toggle('active', index === 0);
    });
    updateCharacterPreview();
}

function updateCharacterPreview() {
    var preview = document.getElementById('characterPreview');
    var hair = document.querySelector('#hairOptions .option-item.active');
    var hairColor = document.querySelector('#hairColorOptions .color-item.active');
    var skinColor = document.querySelector('#skinColorOptions .color-item.active');
    var outfit = document.querySelector('#outfitOptions .option-item.active');
    
    var hairStyle = hair ? hair.dataset.value : 'short';
    var hairColorValue = hairColor ? hairColor.dataset.color : 'brown';
    var skinColorValue = skinColor ? skinColor.dataset.color : 'light';
    var outfitStyle = outfit ? outfit.dataset.value : 'casual';
    
    var hairEl = preview.querySelector('.hair');
    var faceEl = preview.querySelector('.face');
    var torsoEl = preview.querySelector('.torso');
    
    var colorMap = {
        brown: '#8B4513',
        black: '#000000',
        blonde: '#FFD700',
        red: '#CD5C5C',
        light: '#FFDAB9',
        medium: '#D2691E',
        dark: '#8B4513'
    };
    
    if (hairEl) hairEl.style.background = colorMap[hairColorValue] || colorMap.brown;
    if (faceEl) faceEl.style.background = colorMap[skinColorValue] || colorMap.light;
}

function editCharacter(characterId) {
    var char = customCharacters.find(function(c) { return c.character_id === characterId; });
    if (!char) return;
    
    editingCharacter = char;
    document.getElementById('modalTitle').textContent = '编辑角色';
    document.getElementById('characterName').value = char.name;
    
    if (char.appearance) {
        if (char.appearance.hair) {
            var hairOption = document.querySelector('#hairOptions .option-item[data-value="' + char.appearance.hair + '"]');
            if (hairOption) {
                document.querySelectorAll('#hairOptions .option-item').forEach(function(i) { i.classList.remove('active'); });
                hairOption.classList.add('active');
            }
        }
        if (char.appearance.outfit) {
            var outfitOption = document.querySelector('#outfitOptions .option-item[data-value="' + char.appearance.outfit + '"]');
            if (outfitOption) {
                document.querySelectorAll('#outfitOptions .option-item').forEach(function(i) { i.classList.remove('active'); });
                outfitOption.classList.add('active');
            }
        }
    }
    
    updateCharacterPreview();
    document.getElementById('characterModal').style.display = 'flex';
}

async function saveCharacter() {
    var name = document.getElementById('characterName').value.trim();
    if (!name) {
        App.showToast('请输入角色名称', 'error');
        return;
    }
    
    var hair = document.querySelector('#hairOptions .option-item.active');
    var outfit = document.querySelector('#outfitOptions .option-item.active');
    var accessory = document.querySelector('#accessoryOptions .option-item.active');
    
    var characterData = {
        name: name,
        appearance: {
            hair: hair ? hair.dataset.value : 'short',
            outfit: outfit ? outfit.dataset.value : 'casual',
            accessory: accessory ? accessory.dataset.value : 'none'
        },
        personality: ''
    };
    
    try {
        if (editingCharacter) {
            await App.api('/api/characters/custom/' + editingCharacter.character_id, {
                method: 'PUT',
                body: JSON.stringify(characterData)
            });
            App.showToast('角色已更新', 'success');
        } else {
            await App.api('/api/characters/custom', {
                method: 'POST',
                body: JSON.stringify(characterData)
            });
            App.showToast('角色创建成功', 'success');
        }
        
        closeCreateModal();
        loadCustomCharacters();
    } catch (err) {
        App.showToast(err.message, 'error');
    }
}

async function deleteCharacter(characterId) {
    if (!confirm('确定要删除这个角色吗？')) return;
    
    try {
        await App.api('/api/characters/custom/' + characterId, {
            method: 'DELETE'
        });
        App.showToast('角色已删除', 'success');
        loadCustomCharacters();
    } catch (err) {
        App.showToast(err.message, 'error');
    }
}
