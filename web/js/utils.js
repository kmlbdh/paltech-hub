// /js/utils.js
((window, document) => {
    // --- Create a global namespace for our utilities ---
    if (!window.appUtils) {
        window.appUtils = {};
    }

    // --- Shared DOM Element Selectors ---
    const notificationBar = () => document.querySelector('#notification-bar');
    const modal = () => document.querySelector('#app-modal');
    const modalMessageEl = () => document.querySelector('#modal-message');
    const spinner = () => document.querySelector('#upload-image-spinner');

       // --- SVG Icons ---
    const ICONS = {
        sun: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`,
        moon: `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>`
    };

    /**
     * Initializes a theme toggle button.
     * @param {HTMLElement} toggleButton - The button element that triggers the theme change.
     * @param {HTMLElement} iconElement - The element where the sun/moon icon will be rendered.
     */
    window.appUtils.themeSwitcher = (toggleButton, iconElement) => {
        if (!toggleButton || !iconElement) {
            console.warn("Theme switcher setup failed: button or icon element not provided.");
            return;
        }

        const applyTheme = (theme) => {
            if (theme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
                iconElement.innerHTML = ICONS.moon;
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.setAttribute('data-theme', 'white');
                iconElement.innerHTML = ICONS.sun;
                localStorage.setItem('theme', 'white');
            }
        };

        // Set initial theme on load
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme) {
            applyTheme(currentTheme);
        } else {
            // Fallback to system preference
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyTheme(prefersDark ? 'dark' : 'white');
        }

        // Add click listener
        toggleButton.addEventListener('click', () => {
            const newTheme = document.documentElement.getAttribute('data-theme') === 'white' ? 'dark' : 'white';
            applyTheme(newTheme);
        });
    };

    /**
     * Displays a notification message, with language support.
     * @param {string} messageKey - The language key or raw message text.
     * @param {object} langConfig - The language configuration object, e.g., { languages, currentLanguage }.
     * @param {number} [duration=3000] - How long to display the message in milliseconds.
     * @param {boolean} [isLangKey=true] - Set to false to treat messageKey as a raw string.
     */
    window.appUtils.displayNotification = (messageKey, langConfig, duration = 3000, isLangKey = true) => {
        const bar = notificationBar();
        if (!bar) {
            console.warn('Notification bar element not found.');
            return;
        }

        let messageText = messageKey;
        if (isLangKey && langConfig && langConfig.languages && langConfig.currentLanguage) {
            messageText = langConfig.languages[langConfig.currentLanguage]?.[messageKey] || messageKey;
        }

        bar.textContent = messageText;
        bar.classList.add('show');
        setTimeout(() => {
            bar.classList.remove('show');
        }, duration);
    };

    /**
     * Shows or hides the main application modal with a message, with language support.
     * @param {string} messageKey - The language key or raw message text.
     * @param {object} langConfig - The language configuration object, e.g., { languages, currentLanguage }.
     * @param {boolean} [show=true] - Whether to show or hide the modal.
     * @param {boolean} [isLangKey=true] - Set to false to treat messageKey as a raw string.
     */
    window.appUtils.displayModalMessage = (messageKey, langConfig, show = true, isLangKey = true) => {
        const modalEl = modal();
        const messageEl = modalMessageEl();
        if (!modalEl || !messageEl) {
            console.warn('Modal elements not found.');
            return;
        }

        let messageText = messageKey;
        if (isLangKey && langConfig && langConfig.languages && langConfig.currentLanguage) {
            messageText = langConfig.languages[langConfig.currentLanguage]?.[messageKey] || messageKey;
        }
        messageEl.innerHTML = messageText;
        if (show) {
            modalEl.classList.remove('hidden');
        } else {
            modalEl.classList.add('hidden');
        }
    };

    /**
     * A wrapper for the fetch API that includes a timeout.
     * @param {string} url - The URL to fetch.
     * @param {object} [options={}] - Fetch options (method, headers, body, etc.).
     * @param {number} [timeout=10000] - Timeout in milliseconds.
     * @returns {Promise<Response>} A promise that resolves with the fetch Response.
     */
    window.appUtils.fetchWithTimeout = (url, options = {}, timeout = 10000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        return fetch(url, { ...options, signal: controller.signal })
            .finally(() => clearTimeout(id));
    };

    /**
     * Queues a prompt for execution via the backend API.
     * @param {object} prompt - The prompt workflow object.
     * @param {string} clientId - The WebSocket client ID.
     * @returns {Promise<object>} A promise that resolves with the server's JSON response.
     */
    window.appUtils.queuePrompt = async (prompt = {}, clientId) => {
        // This function does not need language support and remains the same.
        const data = { 'prompt': prompt, 'client_id': clientId };
        const response = await fetch('/prompt', {
            method: 'POST', cache: 'no-cache', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`Failed to queue prompt: ${response.status} - ${await response.text()}`);
        return response.json();
    };

    /**
     * Uploads an image file to the server.
     * @param {File} imageFile - The image file to upload.
     * @param {string} notificationMessageKey - The language key for the message to show while uploading.
     * @param {object} langConfig - The language configuration object.
     * @returns {Promise<string|null>} A promise that resolves with the uploaded image name, or null on failure.
     */
    window.appUtils.uploadImage = async (imageFile, notificationMessageKey, langConfig) => {
        if (!imageFile) {
             console.warn("uploadImage: No file provided.");
             return null;
        }
        const uploadSpinner = spinner();
        if (uploadSpinner) uploadSpinner.classList.remove('hidden');

        try {
            if (notificationMessageKey) {
                window.appUtils.displayNotification(notificationMessageKey, langConfig);
            }
            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('overwrite', 'true');

            const uploadResult = await window.appUtils.fetchWithTimeout('/upload/image', {
                method: 'POST', body: formData
            }).then(res => res.json());

            console.log("Image uploaded successfully:", uploadResult.name);
            return uploadResult.name;

        } catch (e) {
            console.error("Image upload failed:", e);
            // Display the error as a raw string, not a language key
            window.appUtils.displayModalMessage(`Image upload failed: ${e.message}`, langConfig, true, false);
            return null;
        } finally {
            if (uploadSpinner) uploadSpinner.classList.add('hidden');
        }
    };

    /**
     * Sets the language for the application, updating the localStorage and DOM.
     * @param {string} langCode - The language code to set (e.g., 'en', 'ar').
     * @param {object} langConfig - The language configuration object.
     * @param {function} [callback] - Optional callback function to execute after setting the language.
     */
    window.appUtils.setLanguage = (langCode, langConfig, callback) => {
        if (!langCode || !langConfig || !langConfig.languages) {
            console.warn("setLanguage: Invalid arguments provided.");
            return;
        }

        langConfig.currentLanguage = langCode;
        localStorage.setItem('language', langCode);
        document.documentElement.lang = langCode;
        document.documentElement.dir = (langCode === 'ar') ? 'rtl' : 'ltr';

        // Update all elements with data-lang-key
        document.querySelectorAll('[data-lang-key]').forEach(element => {
            const key = element.getAttribute('data-lang-key');
            if (langConfig.languages[langCode] && langConfig.languages[langCode][key]) {
                if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                    element.placeholder = langConfig.languages[langCode][key];
                } else if (element.tagName === 'TEXTAREA' && element.hasAttribute('placeholder')) {
                    element.placeholder = langConfig.languages[langCode][key];
                } else {
                    element.innerHTML = langConfig.languages[langCode][key];
                }
            }
        });

        const step5DescElement = document.querySelector('[data-lang-key="step5_desc"] strong');
        if (step5DescElement) {
            step5DescElement.className = 'text-[#3c32c8]'; // Reapply the color class
        }

        const languageSelect = document.querySelector('#language-select');
        console.log('languageSelect', languageSelect);

        if (languageSelect) {
            languageSelect.value = langCode;
        }

        if (typeof callback === 'function') {
            callback();
        }
    };



    /**
     * Copies text to the user's clipboard.
     * @param {string} text - The text to copy.
     * @param {string} successMessageKey - The language key for the success message.
     * @param {object} langConfig - The language configuration object.
     */
    window.appUtils.copyTextToClipboard = (text, successMessageKey, langConfig) => {
        if (!text) return;

        const fallbackCopy = (textToCopy) => {
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'absolute';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                const successful = document.execCommand('copy');
                const message = successful ? successMessageKey : 'failed_to_copy';
                window.appUtils.displayNotification(message, langConfig);
            } catch (err) {
                console.error('Fallback copy failed:', err);
                window.appUtils.displayNotification('failed_to_copy', langConfig);
            }
            document.body.removeChild(textarea);
        };

        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => {
                    window.appUtils.displayNotification(successMessageKey, langConfig);
                })
                .catch(err => {
                    console.warn('Clipboard API failed, using fallback:', err);
                    fallbackCopy(text);
                });
        } else {
            fallbackCopy(text);
        }
    };

})(window, document);
