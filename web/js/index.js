(function(window, document) {
    const _ = (selector, contex = document) => contex.querySelector(selector); // Added for consistency

    const themeToggle = _('#theme-toggle');
    const themeIcon = _('#theme-icon');
    const languageSelect = _('#language-select');

    // Language Data (copied from image-ai.html for consistency)
    const languages = {
        en: {
            welcome_title: "Welcome to Paltech Hub AI",
            welcome_intro: "Your gateway to advanced AI image and video generation.",
            start_image_gen: "Generate AI Images",
            start_video_gen: "Generate AI Videos",
            footer_text: "© 2024 Paltech Hub AI v0.1. All rights reserved." // Updated footer text
        },
        ar: {
            welcome_title: "مرحبًا بك في Paltech Hub AI",
            welcome_intro: "بوابتك لتوليد صور ومقاطع فيديو متقدمة بالذكاء الاصطناعي.",
            start_image_gen: "توليد الصور بالذكاء الاصطناعي",
            start_video_gen: "توليد مقاطع فيديو بالذكاء الاصطناعي",
            footer_text: "© 2024 Paltech Hub AI v0.1. جميع الحقوق محفوظة." // Updated footer text
        }
    };

    let currentLanguage = localStorage.getItem('language') || 'ar'; // Changed default to 'ar' to match image-ai.html

    function setLanguage(langCode) {
        currentLanguage = langCode;
        localStorage.setItem('language', langCode);
        document.documentElement.lang = langCode;
        document.documentElement.dir = (langCode === 'ar') ? 'rtl' : 'ltr';

        // Update all elements with data-lang-key
        document.querySelectorAll('[data-lang-key]').forEach(element => {
            const key = element.getAttribute('data-lang-key');
            if (languages[langCode] && languages[langCode][key]) {
                if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                    element.placeholder = languages[langCode][key];
                } else if (element.tagName === 'TEXTAREA' && element.hasAttribute('placeholder')) {
                    element.placeholder = languages[langCode][key];
                } else {
                    element.innerHTML = languages[langCode][key];
                }
            }
        });
        
        // Update the language select dropdown
        if (languageSelect) {
            languageSelect.value = langCode;
        }
    }

    // Theme Toggle Logic
    const initialTheme = localStorage.getItem('theme');
    if (initialTheme) {
        document.documentElement.setAttribute('data-theme', initialTheme);
        if (themeIcon) themeIcon.textContent = initialTheme === 'dark' ? '🌙' : '💡';
    } else {
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
            if (themeIcon) themeIcon.textContent = '🌙';
        } else {
            document.documentElement.setAttribute('data-theme', 'white');
            if (themeIcon) themeIcon.textContent = '💡';
        }
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            let theme = document.documentElement.getAttribute('data-theme');
            if (theme === 'white') {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                if (themeIcon) themeIcon.textContent = '🌙';
            } else {
                document.documentElement.setAttribute('data-theme', 'white');
                localStorage.setItem('theme', 'white');
                if (themeIcon) themeIcon.textContent = '💡';
            }
        });
    }

    // Language Switcher Logic
    if (languageSelect) {
        languageSelect.addEventListener('change', (event) => {
            setLanguage(event.target.value);
        });
    }

    // Initial UI setup
    setLanguage(currentLanguage); // Set language on initial load
})(window, document);