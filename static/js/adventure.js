let adventureData = null;
let currentChapter = null;
let currentPuzzle = null;
let stats = {
    stars: 0,
    puzzlesSolved: 0
};

document.addEventListener('DOMContentLoaded', function() {
    var params = new URLSearchParams(window.location.search);
    var bookId = params.get('book_id');
    
    if (!bookId) {
        App.showToast('缺少书籍ID', 'error');
        setTimeout(function() {
            window.location.href = '/bookshelf';
        }, 1500);
        return;
    }
    
    loadAdventure(bookId);
    initEvents();
});

function initEvents() {
    document.getElementById('continueBtn').addEventListener('click', continueAdventure);
    document.getElementById('resultContinue').addEventListener('click', function() {
        document.getElementById('resultModal').style.display = 'none';
        continueAdventure();
    });
}

async function loadAdventure(bookId) {
    try {
        adventureData = await App.api('/api/books/' + bookId);
        var chaptersData = await App.api('/api/chapters/book/' + bookId);
        
        if (chaptersData && chaptersData.length > 0) {
            adventureData.chapters = chaptersData;
            document.getElementById('adventureTitle').textContent = adventureData.title;
            startAdventure();
        } else {
            document.getElementById('storyText').innerHTML = '<p>这个故事还没有章节，快去创作吧！</p>';
        }
    } catch (err) {
        console.error('Load adventure error:', err);
        App.showToast('加载失败', 'error');
    }
}

function startAdventure() {
    currentChapter = 0;
    stats = { stars: 0, puzzlesSolved: 0 };
    updateStats();
    showChapter(0);
}

function showChapter(index) {
    if (!adventureData.chapters || index >= adventureData.chapters.length) {
        showEnding();
        return;
    }
    
    currentChapter = index;
    var chapter = adventureData.chapters[index];
    
    document.getElementById('chapterProgress').textContent = '第 ' + (index + 1) + ' 章';
    
    var storyText = document.getElementById('storyText');
    var content = chapter.content || '暂无内容';
    storyText.innerHTML = content.split('\n').map(function(p) {
        return '<p>' + p + '</p>';
    }).join('');
    
    var storyImage = document.getElementById('storyImage');
    if (chapter.image_url) {
        storyImage.style.display = 'block';
        storyImage.querySelector('img').src = chapter.image_url;
    } else {
        storyImage.style.display = 'none';
    }
    
    loadChapterPuzzle(chapter.chapter_id);
    
    document.getElementById('continueContainer').style.display = 'block';
}

async function loadChapterPuzzle(chapterId) {
    var puzzleContainer = document.getElementById('puzzleContainer');
    var choiceContainer = document.getElementById('choiceContainer');
    
    puzzleContainer.style.display = 'none';
    choiceContainer.style.display = 'none';
    
    try {
        var puzzleData = await App.api('/api/puzzles/chapter/' + chapterId);
        
        if (puzzleData && puzzleData.puzzle_id) {
            currentPuzzle = puzzleData;
            renderPuzzle(puzzleData);
            puzzleContainer.style.display = 'block';
        }
    } catch (err) {
        console.log('No puzzle for this chapter');
    }
}

function renderPuzzle(puzzle) {
    document.getElementById('puzzleQuestion').textContent = puzzle.question;
    document.getElementById('puzzleHint').style.display = 'none';
    
    var optionsHtml = '';
    var options = typeof puzzle.options === 'string' ? JSON.parse(puzzle.options) : puzzle.options;
    options.forEach(function(opt, index) {
        optionsHtml += '<button class="puzzle-option" data-index="' + index + '" onclick="answerPuzzle(' + index + ')">' +
            opt +
            '</button>';
    });
    
    document.getElementById('puzzleOptions').innerHTML = optionsHtml;
}

function answerPuzzle(answerIndex) {
    if (!currentPuzzle) return;
    
    var correctIndex = currentPuzzle.correct_index;
    var isCorrect = answerIndex === correctIndex;
    
    if (isCorrect) {
        stats.puzzlesSolved++;
        stats.stars += 10;
        updateStats();
        
        showResult(true, '回答正确！', '太棒了，继续冒险吧！');
    } else {
        showResult(false, '答案不对', '没关系，继续努力！');
    }
}

function showResult(success, title, message) {
    var modal = document.getElementById('resultModal');
    var icon = document.getElementById('resultIcon');
    var titleEl = document.getElementById('resultTitle');
    var msgEl = document.getElementById('resultMessage');
    
    icon.textContent = success ? '✓' : '✗';
    icon.className = 'result-icon ' + (success ? 'success' : 'error');
    titleEl.textContent = title;
    msgEl.textContent = message;
    
    modal.style.display = 'flex';
}

function updateStats() {
    document.getElementById('starsCount').textContent = stats.stars;
    document.getElementById('puzzlesSolved').textContent = stats.puzzlesSolved;
}

function continueAdventure() {
    var nextChapter = currentChapter + 1;
    
    if (nextChapter >= adventureData.chapters.length) {
        showEnding();
    } else {
        showChapter(nextChapter);
    }
}

function showEnding() {
    document.getElementById('storyText').innerHTML = 
        '<div class="ending">' +
        '<h2>🎉 故事完结 🎉</h2>' +
        '<p>恭喜你完成了这次冒险！</p>' +
        '<p>获得星星：' + stats.stars + ' ⭐</p>' +
        '<p>解决谜题：' + stats.puzzlesSolved + ' 🧩</p>' +
        '<button class="btn btn-primary" onclick="window.location.href=\'/bookshelf\'">返回书架</button>' +
        '</div>';
    
    document.getElementById('interactionPanel').style.display = 'none';
}
