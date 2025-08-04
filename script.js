// Animácie pri scrollovaní
document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('.text-section, .map-container');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    sections.forEach(section => {
        observer.observe(section);
    });

    // Animácia pre nadpisy
    const headings = document.querySelectorAll('.text-section h2');
    headings.forEach((heading, index) => {
        heading.style.animation = `fadeIn 0.5s ease-out ${index * 0.2 + 0.3}s forwards`;
        heading.style.opacity = '0';
    });
});
