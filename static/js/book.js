let bookData = null;
let chapters = [];
let currentChapterIndex = -1;
let puzzles = {};

document.addEventListener('DOMContentLoaded', function() {
    if (!App.checkAuth()) return;
    
    var params = new URLSearchParams(window.location.search);
    var bookId = params.get('id');
    
    if (!bookId) {
        App.showToast('书籍ID不存在', 'error');
        setTimeout(function() {
            window.location.href = '/bookshelf';
        }, 1500);
        return;
    }
    
    loadBook(bookId);
    initEvents();
});

function initEvents() {
    document.getElementById('prevChapter').addEventListener('click', function() {
        if (currentChapterIndex > 0) {
            showChapter(currentChapterIndex - 1);
        }
    });
    
    document.getElementById('nextChapter').addEventListener('click', function() {
        if (currentChapterIndex < chapters.length - 1) {
            showChapter(currentChapterIndex + 1);
        }
    });
    
    document.getElementById('shareBtn').addEventListener('click', openShareModal);
    document.getElementById('archiveBtn').addEventListener('click', toggleArchive);
    
    document.querySelector('#shareModal .close-btn').addEventListener('click', closeShareModal);
    document.getElementById('createShare').addEventListener('click', createShare);
    document.getElementById('copyLink').addEventListener('click', copyShareLink);
}

async function loadBook(bookId) {
    try {
        bookData = await App.api('/api/books/' + bookId);
        chapters = await App.api('/api/chapters/book/' + bookId);
        
        renderBookInfo();
        renderChaptersList();
        
        if (chapters.length > 0) {
            showChapter(0);
        }
    } catch (err) {
        console.error('Load book error:', err);
        App.showToast('加载书籍失败', 'error');
    }
}

function renderBookInfo() {
    document.getElementById('bookTitle').textContent = bookData.title;
    document.getElementById('bookTheme').textContent = App.getThemeName(bookData.theme);
    document.getElementById('bookCreatedAt').textContent = App.formatDate(bookData.created_at);
    
    var progress = bookData.total_chapters > 0 
        ? Math.round((bookData.read_chapters || 0) / bookData.total_chapters * 100) 
        : 0;
    document.getElementById('bookProgress').textContent = progress + '%';
    
    if (bookData.cover_image) {
        document.getElementById('bookCover').src = bookData.cover_image;
    }
    
    document.getElementById('archiveBtn').textContent = bookData.is_archived ? '恢复' : '归档';
}

function renderChaptersList() {
    var list = document.getElementById('chaptersList');
    
    if (!chapters.length) {
        list.innerHTML = '<li class="empty">暂无章节</li>';
        return;
    }
    
    list.innerHTML = chapters.map(function(ch, index) {
        return '<li class="' + (ch.is_read ? 'read' : '') + '" onclick="showChapter(' + index + ')">' +
            '<span class="chapter-num">第' + ch.chapter_number + '章</span>' +
            '<span class="chapter-title">' + ch.title + '</span>' +
            '</li>';
    }).join('');
}

function showChapter(index) {
    if (index < 0 || index >= chapters.length) return;
    
    currentChapterIndex = index;
    var chapter = chapters[index];
    
    document.getElementById('chapterTitle').textContent = '第' + chapter.chapter_number + '章: ' + chapter.title;
    
    var content = chapter.content || '暂无内容';
    document.getElementById('chapterContent').innerHTML = content.split('\n').map(function(p) {
        return '<p>' + p + '</p>';
    }).join('');
    
    var imageDiv = document.getElementById('chapterImage');
    if (chapter.image_url) {
        imageDiv.style.display = 'block';
        imageDiv.querySelector('img').src = chapter.image_url;
    } else {
        imageDiv.style.display = 'none';
    }
    
    document.querySelectorAll('#chaptersList li').forEach(function(li, i) {
        li.classList.toggle('active', i === index);
    });
    
    document.getElementById('prevChapter').disabled = index <= 0;
    document.getElementById('nextChapter').disabled = index >= chapters.length - 1;
    
    loadPuzzle(chapter.chapter_id);
    
    if (!chapter.is_read) {
        markChapterRead(chapter.chapter_id);
    }
}

async function loadPuzzle(chapterId) {
    var puzzleSection = document.getElementById('puzzleSection');
    
    try {
        var puzzleData = await App.api('/api/puzzles/chapter/' + chapterId);
        
        if (puzzleData && puzzleData.puzzle_id) {
            puzzles[chapterId] = puzzleData;
            renderPuzzle(puzzleData);
            puzzleSection.style.display = 'block';
        } else {
            puzzleSection.style.display = 'none';
        }
    } catch (err) {
        puzzleSection.style.display = 'none';
    }
}

function renderPuzzle(puzzle) {
    document.getElementById('puzzleQuestion').textContent = puzzle.question;
    
    var optionsHtml = '';
    var options = typeof puzzle.options === 'string' ? JSON.parse(puzzle.options) : puzzle.options;
    options.forEach(function(opt, index) {
        optionsHtml += '<button class="puzzle-option" data-index="' + index + '" onclick="answerPuzzle(\'' + puzzle.puzzle_id + '\', ' + index + ')">' +
            opt +
            '</button>';
    });
    
    document.getElementById('puzzleOptions').innerHTML = optionsHtml;
    document.getElementById('puzzleResult').style.display = 'none';
}

async function answerPuzzle(puzzleId, answerIndex) {
    try {
        var result = await App.api('/api/puzzle/verify', {
            method: 'POST',
            body: JSON.stringify({
                puzzle_id: puzzleId,
                answer_index: answerIndex
            })
        });
        
        var resultDiv = document.getElementById('puzzleResult');
        resultDiv.style.display = 'block';
        
        if (result.is_correct) {
            resultDiv.className = 'puzzle-result correct';
            resultDiv.innerHTML = '<span class="result-icon">✓</span> 回答正确！太棒了！';
            
            document.querySelectorAll('.puzzle-option').forEach(function(btn) {
                btn.disabled = true;
            });
        } else {
            resultDiv.className = 'puzzle-result wrong';
            resultDiv.innerHTML = '<span class="result-icon">✗</span> 答案不对，再想想？';
        }
    } catch (err) {
        App.showToast(err.message, 'error');
    }
}

async function markChapterRead(chapterId) {
    try {
        await App.api('/api/chapters/' + chapterId + '/read', {
            method: 'POST'
        });
        
        chapters[currentChapterIndex].is_read = true;
        renderChaptersList();
    } catch (err) {
        console.error('Mark read error:', err);
    }
}

function openShareModal() {
    document.getElementById('shareModal').style.display = 'flex';
    document.getElementById('shareResult').style.display = 'none';
}

function closeShareModal() {
    document.getElementById('shareModal').style.display = 'none';
}

async function createShare() {
    var password = document.getElementById('sharePassword').value.trim();
    var expiry = document.getElementById('shareExpiry').value;
    
    if (password && (password.length < 4 || password.length > 6 || !/^\d+$/.test(password))) {
        App.showToast('密码需为4-6位数字', 'error');
        return;
    }
    
    try {
        var result = await App.api('/api/share', {
            method: 'POST',
            body: JSON.stringify({
                book_id: bookData.book_id,
                password: password || null,
                expiry_days: parseInt(expiry)
            })
        });
        
        var shareUrl = window.location.origin + '/share.html?id=' + result.share_id;
        document.getElementById('shareLink').value = shareUrl;
        document.getElementById('shareResult').style.display = 'block';
        
        App.showToast('分享链接已创建', 'success');
    } catch (err) {
        App.showToast(err.message, 'error');
    }
}

function copyShareLink() {
    var input = document.getElementById('shareLink');
    input.select();
    document.execCommand('copy');
    App.showToast('链接已复制', 'success');
}

async function toggleArchive() {
    try {
        var newArchiveState = !bookData.is_archived;
        
        await App.api('/api/books/' + bookData.book_id, {
            method: 'PATCH',
            body: JSON.stringify({ is_archived: newArchiveState })
        });
        
        bookData.is_archived = newArchiveState;
        document.getElementById('archiveBtn').textContent = newArchiveState ? '恢复' : '归档';
        App.showToast(newArchiveState ? '已归档' : '已恢复', 'success');
    } catch (err) {
        App.showToast(err.message, 'error');
    }
}
