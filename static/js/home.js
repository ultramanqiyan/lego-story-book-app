document.addEventListener('DOMContentLoaded', () => {
    initThemeCards();
});

function initThemeCards() {
    const themeCards = document.querySelectorAll('.theme-card');
    themeCards.forEach(card => {
        card.addEventListener('click', () => {
            const theme = card.dataset.theme;
            window.location.href = `/story-create?theme=${theme}`;
        });
    });
}
