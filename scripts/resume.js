const colorThemes = [
    { bg: 'rgba(219, 234, 254, 0.4)', overlay: 'rgba(219, 234, 254, 0.95)', border: '#93c5fd' }, // Blue
    { bg: 'rgba(220, 252, 231, 0.4)', overlay: 'rgba(220, 252, 231, 0.95)', border: '#86efac' }, // Green
    { bg: 'rgba(254, 249, 195, 0.6)', overlay: 'rgba(254, 249, 195, 0.95)', border: '#fde047' }, // Yellow
    { bg: 'rgba(255, 237, 213, 0.6)', overlay: 'rgba(255, 237, 213, 0.95)', border: '#fdba74' }, // Orange
    { bg: 'rgba(243, 232, 255, 0.5)', overlay: 'rgba(243, 232, 255, 0.95)', border: '#d8b4fe' }  // Purple
];

let timerOut;

document.querySelectorAll('.highlight').forEach((el) => {
    const theme = colorThemes[Math.floor(Math.random() * colorThemes.length)];

    el.style.backgroundColor = theme.bg;
    el.style.borderBottom = `2px dashed ${theme.border}`;

    el.addEventListener('mouseenter', () => el.style.backgroundColor = theme.bg.replace('0.4', '0.6').replace('0.5', '0.7').replace('0.6', '0.8'));
    el.addEventListener('mouseleave', () => el.style.backgroundColor = theme.bg);

    // Only attach the click event if it DOES NOT have the 'no-op' class
    if (!el.classList.contains('no-op')) {
        el.addEventListener('click', (e) => {
            e.stopPropagation();
            openComment(el.dataset.title, el.dataset.text, theme.overlay);
        });
    } 
});

function openComment(title, text, color) {
    const overlay = document.getElementById('comment-overlay');
    const resume = document.getElementById('resume');
    const timer = document.getElementById('timer');

    clearTimeout(timerOut);
    timer.style.transition = 'none';
    timer.style.width = '100%';

    document.getElementById('overlay-title').innerText = title;
    document.getElementById('overlay-body').innerText = text;
    overlay.style.backgroundColor = color;

    overlay.classList.add('active');
    resume.classList.add('shifted');

    setTimeout(() => {
        timer.style.transition = 'width 8s linear';
        timer.style.width = '0%';
    }, 50);

    timerOut = setTimeout(closeComment, 8000);
}

function closeComment() {
    document.getElementById('comment-overlay').classList.remove('active');
    document.getElementById('resume').classList.remove('shifted');
    clearTimeout(timerOut);
}

document.addEventListener('click', closeComment);

function closeWelcomeModal() {
    document.getElementById('welcome-modal').classList.add('hidden');
}