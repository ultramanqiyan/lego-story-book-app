let currentStep = 1;
let selectedCharacter = null;
let selectedTheme = null;
let presetCharacters = [];
let customCharacters = [];

document.addEventListener('DOMContentLoaded', function() {
    if (!App.checkAuth()) return;
    initSteps();
    loadCharacters();
    checkUrlParams();
});

function checkUrlParams() {
    var params = new URLSearchParams(window.location.search);
    var theme = params.get('theme');
    if (theme) {
        selectedTheme = theme;
        var themeOption = document.querySelector('.theme-option[data-theme="' + theme + '"]');
        if (themeOption) {
            selectTheme(theme);
        }
    }
}

function initSteps() {
    document.getElementById('prevBtn').addEventListener('click', prevStep);
    document.getElementById('nextBtn').addEventListener('click', nextStep);
    
    document.querySelectorAll('.character-tabs .tab-btn').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.character-tabs .tab-btn').forEach(function(t) {
                t.classList.remove('active');
            });
            tab.classList.add('active');
            
            var tabType = tab.dataset.tab;
            if (tabType === 'preset') {
                document.getElementById('presetCharacters').style.display = 'grid';
                document.getElementById('customCharacters').style.display = 'none';
            } else {
                document.getElementById('presetCharacters').style.display = 'none';
                document.getElementById('customCharacters').style.display = 'grid';
            }
        });
    });
    
    document.querySelectorAll('.theme-option').forEach(function(option) {
        option.addEventListener('click', function() {
            selectTheme(option.dataset.theme);
        });
    });
    
    document.getElementById('generateBtn').addEventListener('click', generateStory);
}

async function loadCharacters() {
    try {
        var preset = await App.api('/api/characters/preset');
        presetCharacters = preset;
        renderPresetCharacters();
    } catch (err) {
        console.error('Load preset characters error:', err);
    }
    
    try {
        var custom = await App.api('/api/characters/custom');
        customCharacters = custom;
        renderCustomCharacters();
    } catch (err) {
        console.error('Load custom characters error:', err);
    }
}

function renderPresetCharacters() {
    var container = document.getElementById('presetCharacters');
    if (!presetCharacters.length) {
        container.innerHTML = '<p class="empty">暂无预设角色</p>';
        return;
    }
    
    container.innerHTML = presetCharacters.map(function(char) {
        return '<div class="character-card" data-id="' + char.character_id + '" onclick="selectCharacter(\'' + char.character_id + '\', \'preset\')">' +
            '<div class="character-avatar">' + (char.avatar_emoji || '🎭') + '</div>' +
            '<div class="character-info">' +
            '<h4>' + char.name + '</h4>' +
            '<p>' + (char.personality || '') + '</p>' +
            '</div>' +
            '</div>';
    }).join('');
}

function renderCustomCharacters() {
    var container = document.getElementById('customCharacters');
    var html = '<div class="create-new-card" onclick="window.location.href=\'/characters\'">' +
        '<span class="plus-icon">+</span>' +
        '<span>创建新角色</span>' +
        '</div>';
    
    if (customCharacters.length > 0) {
        html += customCharacters.map(function(char) {
            return '<div class="character-card" data-id="' + char.character_id + '" onclick="selectCharacter(\'' + char.character_id + '\', \'custom\')">' +
                '<div class="character-avatar">' + (char.avatar_emoji || '🧑') + '</div>' +
                '<div class="character-info">' +
                '<h4>' + char.name + '</h4>' +
                '<p>' + (char.personality || '') + '</p>' +
                '</div>' +
                '</div>';
        }).join('');
    }
    
    container.innerHTML = html;
}

function selectCharacter(characterId, type) {
    var characters = type === 'preset' ? presetCharacters : customCharacters;
    var char = characters.find(function(c) { return c.character_id === characterId; });
    if (!char) return;
    
    selectedCharacter = char;
    
    document.querySelectorAll('.character-card').forEach(function(card) {
        card.classList.remove('selected');
    });
    
    var selectedCard = document.querySelector('.character-card[data-id="' + characterId + '"]');
    if (selectedCard) selectedCard.classList.add('selected');
    
    var selectedDiv = document.getElementById('selectedCharacter');
    selectedDiv.style.display = 'block';
    selectedDiv.querySelector('.character-preview').innerHTML = 
        '<div class="selected-char-info">' +
        '<span class="char-avatar">' + (char.avatar_emoji || '🎭') + '</span>' +
        '<span class="char-name">' + char.name + '</span>' +
        '</div>';
}

function selectTheme(theme) {
    selectedTheme = theme;
    
    document.querySelectorAll('.theme-option').forEach(function(option) {
        option.classList.remove('selected');
    });
    
    var selectedOption = document.querySelector('.theme-option[data-theme="' + theme + '"]');
    if (selectedOption) selectedOption.classList.add('selected');
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        updateStepDisplay();
    }
}

function nextStep() {
    if (currentStep < 4) {
        if (!validateCurrentStep()) return;
        currentStep++;
        updateStepDisplay();
        
        if (currentStep === 4) {
            updateSummary();
        }
    }
}

function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            if (!selectedCharacter) {
                App.showToast('请选择一个角色', 'error');
                return false;
            }
            return true;
        case 2:
            if (!selectedTheme) {
                App.showToast('请选择一个主题', 'error');
                return false;
            }
            return true;
        case 3:
            var title = document.getElementById('bookTitle').value.trim();
            if (!title) {
                App.showToast('请输入故事标题', 'error');
                return false;
            }
            return true;
        default:
            return true;
    }
}

function updateStepDisplay() {
    document.querySelectorAll('.progress-steps .step').forEach(function(step, index) {
        step.classList.toggle('active', index < currentStep);
    });
    
    document.querySelectorAll('.step-panel').forEach(function(panel, index) {
        panel.classList.toggle('active', index === currentStep - 1);
    });
    
    document.getElementById('prevBtn').disabled = currentStep === 1;
    document.getElementById('nextBtn').textContent = currentStep === 3 ? '生成故事' : '下一步';
    document.getElementById('nextBtn').style.display = currentStep === 4 ? 'none' : 'inline-block';
}

function updateSummary() {
    document.getElementById('summaryCharacter').textContent = selectedCharacter ? selectedCharacter.name : '-';
    document.getElementById('summaryTheme').textContent = App.getThemeName(selectedTheme);
    document.getElementById('summaryTitle').textContent = document.getElementById('bookTitle').value || '-';
    
    var lengthValue = document.querySelector('input[name="length"]:checked');
    var lengthText = lengthValue ? {short: '短篇', medium: '中篇', long: '长篇'}[lengthValue.value] : '-';
    document.getElementById('summaryLength').textContent = lengthText;
}

async function generateStory() {
    var title = document.getElementById('bookTitle').value.trim();
    var length = document.querySelector('input[name="length"]:checked');
    var customPlot = document.getElementById('customPlot').value.trim();
    
    if (!selectedCharacter || !selectedTheme || !title) {
        App.showToast('请完成所有必填项', 'error');
        return;
    }
    
    document.getElementById('generateBtn').disabled = true;
    document.getElementById('generatingStatus').style.display = 'block';
    
    var progressFill = document.getElementById('progressFill');
    var progress = 0;
    var progressInterval = setInterval(function() {
        progress += Math.random() * 10;
        if (progress > 90) progress = 90;
        progressFill.style.width = progress + '%';
    }, 500);
    
    try {
        var data = await App.api('/api/story/generate', {
            method: 'POST',
            body: JSON.stringify({
                title: title,
                theme: selectedTheme,
                character_id: selectedCharacter.character_id,
                length: length ? length.value : 'short',
                custom_plot: customPlot
            })
        });
        
        clearInterval(progressInterval);
        progressFill.style.width = '100%';
        
        App.showToast('故事生成成功！', 'success');
        
        setTimeout(function() {
            window.location.href = '/book.html?id=' + data.book_id;
        }, 1000);
        
    } catch (err) {
        clearInterval(progressInterval);
        document.getElementById('generateBtn').disabled = false;
        document.getElementById('generatingStatus').style.display = 'none';
        App.showToast(err.message, 'error');
    }
}
