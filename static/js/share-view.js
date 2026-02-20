let shareData = null;
let currentChapterIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    const shareId = new URLSearchParams(window.location.search).get('id');
    if (!shareId) { showError('分享链接无效'); return; }
    loadShare(shareId);
});

async function loadShare(shareId, password = null) {
    try {
        let url = `/api/share/${shareId}`;
        if (password) url += `?password=${encodeURIComponent(password)}`;
        shareData = await App.api(url);
        document.getElementById('passwordPrompt').style.display = 'none';
        document.getElementById('shareContent').style.display = 'block';
        renderShareContent();
    } catch (err) {
        if (err.message.includes('密码')) {
            document.getElementById('passwordPrompt').style.display = 'flex';
            document.getElementById('shareContent').style.display = 'none';
            document.getElementById('passwordForm').onsubmit = (e) => { e.preventDefault(); loadShare(shareId, document.getElementById('sharePassword').value); };
        } else showError(err.message);
    }
}

function showError(message) {
    document.getElementById('passwordPrompt').style.display = 'none';
    document.getElementById('shareContent').style.display = 'none';
    document.getElementById('errorState').style.display = 'flex';
    document.getElementById('errorMessage').textContent = message;
}

function renderShareContent() {
    document.getElementById('bookTitle').textContent = shareData.book.title;
    document.getElementById('bookTheme').textContent = App.getThemeName(shareData.book.theme);
    document.getElementById('bookAge').textContent = `适合年龄：${shareData.book.age_range || '3-12岁'}`;
    if (shareData.book.cover_image) document.getElementById('bookCover').src = shareData.book.cover_image;
    renderChaptersList();
}

function renderChaptersList() {
    const list = document.getElementById('chaptersList');
    list.innerHTML = '';
    shareData.chapters.forEach((ch, i) => {
        const item = document.createElement('div');
        item.className = 'chapter-item';
        item.innerHTML = `<div class="chapter-number">第${ch.chapter_number}章</div><div class="chapter-title">${ch.title}</div>`;
        item.onclick = () => showChapter(i);
        list.appendChild(item);
    });
}

function showChapter(index) {
    currentChapterIndex = index;
    const ch = shareData.chapters[index];
    document.getElementById('chaptersList').parentElement.style.display = 'none';
    document.getElementById('chapterReader').style.display = 'block';
    document.getElementById('chapterTitle').textContent = `第${ch.chapter_number}章: ${ch.title}`;
    document.getElementById('chapterContent').innerHTML = ch.content.split('\n').map(p => `<p>${p}</p>`).join('');
    const img = document.getElementById('readerImage');
    img.style.display = ch.image_url ? 'block' : 'none';
    if (ch.image_url) img.querySelector('img').src = ch.image_url;
    document.getElementById('prevChapter').disabled = index <= 0;
    document.getElementById('nextChapter').disabled = index >= shareData.chapters.length - 1;
}

document.addEventListener('click', (e) => {
    if (e.target.id === 'backToList') {
        document.getElementById('chaptersList').parentElement.style.display = 'block';
        document.getElementById('chapterReader').style.display = 'none';
    }
    if (e.target.id === 'prevChapter' && currentChapterIndex > 0) showChapter(currentChapterIndex - 1);
    if (e.target.id === 'nextChapter' && currentChapterIndex < shareData.chapters.length - 1) showChapter(currentChapterIndex + 1);
});
