let books = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
    if (!App.checkAuth()) return;
    loadBooks();
    initFilterTabs();
});

function initFilterTabs() {
    document.querySelectorAll('.filter-tabs .tab-btn').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.filter-tabs .tab-btn').forEach(function(t) {
                t.classList.remove('active');
            });
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            renderBooks();
        });
    });
}

async function loadBooks() {
    try {
        books = await App.api('/api/books');
        renderBooks();
    } catch (err) {
        console.error('Load books error:', err);
        document.getElementById('booksGrid').innerHTML = '<p class="error">加载失败，请刷新重试</p>';
    }
}

function renderBooks() {
    var grid = document.getElementById('booksGrid');
    var emptyState = document.getElementById('emptyState');
    
    var filtered = books;
    if (currentFilter === 'reading') {
        filtered = books.filter(function(b) { return !b.is_completed && !b.is_archived; });
    } else if (currentFilter === 'completed') {
        filtered = books.filter(function(b) { return b.is_completed; });
    } else if (currentFilter === 'archived') {
        filtered = books.filter(function(b) { return b.is_archived; });
    }

    if (!filtered.length) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    emptyState.style.display = 'none';
    grid.innerHTML = '';
    
    filtered.forEach(function(book) {
        grid.appendChild(createBookCard(book));
    });
}

function createBookCard(book) {
    var card = document.createElement('div');
    card.className = 'book-card';
    
    var progress = book.total_chapters ? Math.round((book.read_chapters || 0) / book.total_chapters * 100) : 0;
    var badge = book.is_archived ? '已归档' : (book.is_completed ? '已完成' : '');
    
    var html = '<div class="book-cover">';
    if (book.cover_image) {
        html += '<img src="' + book.cover_image + '">';
    }
    if (badge) {
        html += '<div class="book-badge">' + badge + '</div>';
    }
    html += '</div>';
    html += '<div class="book-info">';
    html += '<h3 class="book-title">' + book.title + '</h3>';
    html += '<p class="book-theme">' + App.getThemeName(book.theme) + '</p>';
    html += '<div class="book-progress">';
    html += '<div class="progress-bar"><div class="progress-fill" style="width:' + progress + '%"></div></div>';
    html += '<span class="progress-text">' + progress + '%</span>';
    html += '</div>';
    html += '<div class="book-actions">';
    html += '<button class="btn btn-primary btn-read">阅读</button>';
    html += '<button class="btn btn-outline btn-share">分享</button>';
    html += '<button class="btn btn-text btn-archive">' + (book.is_archived ? '恢复' : '归档') + '</button>';
    html += '</div></div>';
    
    card.innerHTML = html;
    
    card.querySelector('.btn-read').addEventListener('click', function() {
        window.location.href = '/book.html?id=' + book.book_id;
    });
    
    card.querySelector('.btn-share').addEventListener('click', function() {
        window.location.href = '/book.html?id=' + book.book_id + '&action=share';
    });
    
    card.querySelector('.btn-archive').addEventListener('click', function() {
        toggleArchive(book.book_id, !book.is_archived);
    });
    
    return card;
}

async function toggleArchive(bookId, archive) {
    try {
        await App.api('/api/books/' + bookId, {
            method: 'PATCH',
            body: JSON.stringify({ is_archived: archive })
        });
        App.showToast(archive ? '已归档' : '已恢复', 'success');
        loadBooks();
    } catch (err) {
        App.showToast(err.message, 'error');
    }
}
