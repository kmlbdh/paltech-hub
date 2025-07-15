(async (window, d, undefined) => {
    const _ = (selector, contex = d) => contex.querySelector(selector);

    // const workflows = {};
    // Load workflows immediately when the script starts.
    const workflows = await load_api_workflows();
    let IS_GENERATING = false;
    let lastUploadedComfyUIName = null;
    let lastUploadedFileIdentifier = null;
    let uploadedImageFile = null;
    let ws;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY_MS = 3000;
    const client_id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); });

    const generate = _('#generate');
    const interrupt_button = _('#interrupt');
    const progressbar = _('#main-progress');
    const seed_input = _('#main-seed');
    const is_random_input = _('#is-random');
    const modal = _('#app-modal');
    const modalMessageEl = _('#modal-message');
    const modalCloseButton = _('#modal-close-button');
    const results = _('#results');
    const batch_size_input = _('#batch-size-input');
    const prompt_input = _('#prompt-input');
    const img_height_input = _('#image-height');
    const img_width_input = _('#image-width');
    const image_input = _("#image-input");
    const image_size_radioBtn = _("#image-dimension-presets");
    const node_status_el = _('#current-node-status');
    const display_uploaded_image_el = _("#display-uploaded-image");
    const guideContainer = _("#guide-container");
    const themeToggle = _('#theme-toggle');
    const themeIcon = _('#theme-icon');
    const languageSelect = _('#language-select');
    const historyContainer = _('#history-container');
    const clearHistoryButton = _('#clear-history-button');
    const notificationBar = _('#notification-bar'); // New: Get notification bar element
    const backButton = _('#back-button'); // New: Get back button element

    const SESSION_HISTORY_KEY = 'paltech_image_history';

    // Language Data
    const languages = {
        en: {
            generation_params_title: "Generation Params",
            images_to_generate_label: "Images to generate",
            image_size_label: "Image Size",
            size_square: "Square",
            size_portrait: "Portrait",
            size_landscape: "Landscape",
            height_label: "Height",
            width_label: "Width",
            prompt_title: "Prompt",
            prompt_placeholder: "Add prompt...",
            image_upload_title: "Image To Upload",
            select_image_button: "Select Image",
            image_preview_placeholder: "Image Preview",
            generate_button: "Generate",
            interrupt_button: "Interrupt",
            seed_label: "Seed", // Added seed label
            random_checkbox: "Random",
            history_title: "History",
            history_empty_message: "No history yet.",
            clear_history_button: "Clear History",
            guide_title: "How to Generate Your AI Images",
            guide_intro: "Welcome to Paltech Hub AI! Follow these steps to generate your unique images. This tool leverages the Flux Kontext Dev model, which intelligently integrates your provided image into new scenes and backgrounds based on your creative prompts.",
            guide_steps_title: "Step-by-Step Guide:",
            step1_title: "Set Quantity (Images to Generate)",
            step1_desc: "Navigate to the \"Generation params\" section on the left. Use the <strong>\"Images to generate\" slider</strong> to select how many variations of your image you would like to create. You can typically choose between 1 and 4 images.",
            step2_title: "Define Image Dimensions (Image Size)",
            step2_desc: "In the \"Image Size\" subsection, choose your preferred aspect ratio and dimensions: Square, Portrait, or Landscape. The \"Height\" and \"Width\" fields will automatically update to reflect your selection.",
            step3_title: "Craft Your Prompt",
            step3_desc: "Proceed to the \"Prompt\" section. In the text box labeled <strong>\"Add prompt,\"</strong> describe in detail what you envision for your generated image. This prompt will guide the AI in transforming or re-contextualizing your input image. Be descriptive and imaginative!",
            step4_title: "Upload Your Input Image",
            step4_desc: "Locate the image upload area. Click to select an image from your device. This image will serve as the <strong>core visual element</strong> that the AI will integrate and transform according to your prompt. A preview of your uploaded image will appear, confirming your selection.",
            step5_title: "Initiate Generation",
            step5_desc: "Once you have configured all settings and uploaded your image, click the <strong class=\"text-[#3c32c8]\">⚡️ GENERATE</strong> button at the top of the main content area. The system will begin processing your request.",
            step6_title: "View Your Results",
            step6_desc: "Your generated images will appear in this area once the generation process is complete.",
            guide_footer: "We hope you enjoy creating with Paltech Hub AI!",
            modal_notification_title: "Notification",
            modal_close_button: "Close",
            ws_connecting_message: "WebSocket connection lost. Attempting to reconnect...",
            ws_max_reconnect_message: "WebSocket connection lost. Max reconnect attempts reached. Please reload the page manually.",
            ws_error_message: "WebSocket connection error. Attempting to reconnect...",
            prompt_queue_failed: "Failed to queue prompt:",
            image_upload_failed: "Image upload failed:",
            generation_interrupted: "Generation interrupted.",
            processing_status: "Processing:",
            executing_status: "Executing:",
            finished_status: "Finished!",
            interrupted_status: "Interrupted!",
            idle_status: "ComfyUI is idle.",
            reconnect_failed: "Could not reconnect to the server. Please refresh the page.",
            footer_text: "© 2024 Paltech Hub AI v0.1. جميع الحقوق محفوظة."
        },
        ar: {
            generation_params_title: "معلمات التوليد",
            images_to_generate_label: "عدد الصور المراد توليدها",
            image_size_label: "حجم الصورة",
            size_square: "مربع",
            size_portrait: "عمودي",
            size_landscape: "أفقي",
            height_label: "الارتفاع",
            width_label: "العرض",
            prompt_title: "المطالبة",
            prompt_placeholder: "أدخل المطالبة...",
            image_upload_title: "تحميل الصورة",
            select_image_button: "اختر صورة",
            image_preview_placeholder: "معاينة الصورة",
            generate_button: "توليد",
            interrupt_button: "إيقاف",
            seed_label: "البذرة", // Added seed label
            random_checkbox: "عشوائي",
            history_title: "السجل",
            history_empty_message: "لا يوجد سجل حتى الآن.",
            clear_history_button: "مسح السجل",
            guide_title: "كيفية توليد صور الذكاء الاصطناعي",
            guide_intro: "مرحبًا بك في Paltech Hub AI! اتبع هذه الخطوات لتوليد صورك الفريدة. تستخدم هذه الأداة نموذج Flux، الذي يدمج صورتك المقدمة بذكاء في مشاهد وخلفيات جديدة بناءً على مطالباتك الإبداعية.",
            guide_steps_title: "دليل خطوة بخطوة:",
            step1_title: "تحديد الكمية (الصور المراد توليدها)",
            step1_desc: "انتقل إلى قسم \"معلمات التوليد\" على اليسار. استخدم شريط تمرير <strong>\"عدد الصور المراد توليدها\"</strong> لتحديد عدد المتغيرات التي ترغب في إنشائها من صورتك. يمكنك عادةً الاختيار بين 1 و 4 صور.",
            step2_title: "تحديد أبعاد الصورة (حجم الصورة)",
            step2_desc: "في القسم الفرعي \"حجم الصورة\"، اختر نسبة العرض إلى الارتفاع والأبعاد المفضلة لديك: مربع، عمودي، أو أفقي. سيتم تحديث حقلي \"الارتفاع\" و \"العرض\" تلقائيًا ليعكسا اختيارك.",
            step3_title: "صياغة المطالبة",
            step3_desc: "انتقل إلى قسم \"المطالبة\". في مربع النص المسمى <strong>\"أدخل المطالبة،\"</strong> صف بالتفصيل ما تتصوره لصورتك التي تم إنشاؤها. ستوجه هذه المطالبة الذكاء الاصطناعي في تحويل أو إعادة سياقة صورتك المدخلة. كن وصفيًا ومبدعًا!",
            step4_title: "تحميل صورتك المدخلة",
            step4_desc: "حدد منطقة تحميل الصورة (على الأرجح أسفل قسم المطالبة). انقر لتحديد صورة من جهازك. ستكون هذه الصورة هي <strong>العنصر المرئي الأساسي</strong> الذي سيقوم الذكاء الاصطناعي بدمجه وتحويله وفقًا لمطالبتك. ستظهر معاينة لصورتك التي تم تحميلها، مؤكدة اختيارك.",
            step5_title: "بدء التوليد",
            step5_desc: "بمجرد تكوين جميع الإعدادات وتحميل صورتك، انقر فوق زر <strong class=\"text-[#3c32c8]\">⚡️ توليد</strong> في الجزء العلوي من منطقة المحتوى الرئيسية. سيبدأ النظام في معالجة طلبك.",
            step6_title: "عرض نتائجك",
            step6_desc: "ستظهر صورك التي تم إنشاؤها في هذه المنطقة بمجرد اكتمال عملية التوليد.",
            guide_footer: "نأمل أن تستمتع بالإبداع مع Paltech Hub AI!",
            modal_notification_title: "إشعار",
            modal_close_button: "اغلاق",
            ws_connecting_message: "انقطع الاتصال بالخادم . جاري محاولة إعادة الاتصال...",
            ws_max_reconnect_message: "انقطع اتصال بالخادم. تم الوصول إلى الحد الأقصى لمحاولات إعادة الاتصال. يُرجى إعادة تحميل الصفحة يدويًا.",
            ws_error_message: "خطأ في الاتصال بالخادم. جاري محاولة إعادة الاتصال...",
            prompt_queue_failed: "فشل في اضافة طلبك.:",
            image_upload_failed: "فشل تحميل الصورة:",
            generation_interrupted: "تم مقاطعت عملية التوليد.",
            processing_status: "معالجة:",
            executing_status: "جاري التنفيذ:",
            finished_status: "انتهى!",
            interrupted_status: "تم الإيقاف!",
            idle_status: "ComfyUI is idle.",
            reconnect_failed: "تعذّر الاتصال بالخادم. يُرجى تحديث الصفحة.",
            footer_text: "© 2024 Paltech Hub AI v0.1. جميع الحقوق محفوظة."
        }
    };

    let currentLanguage = localStorage.getItem('language') || 'ar'; // Changed default to 'ar'

    function setLanguage(langCode) {
        currentLanguage = langCode;
        localStorage.setItem('language', langCode);
        document.documentElement.lang = langCode;
        document.documentElement.dir = (langCode === 'ar') ? 'rtl' : 'ltr';

        // The logo image already has mr-2, which is correct for LTR.
        // In RTL, the logo will be on the right, and the "AI" text will be on its left.
        // The mr-2 will then act as a margin-left in RTL, which is still correct.
        // No dynamic margin adjustment needed for the logo image.

        // The right-controls div now has dir="ltr" in HTML, so its internal order is always LTR.
        // No dynamic flex-row-reverse needed here.

        // Update all elements with data-lang-key
        d.querySelectorAll('[data-lang-key]').forEach(element => {
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
        
        // Special handling for the guide container's strong tag in step5_desc
        const step5DescElement = _('[data-lang-key="step5_desc"] strong');
        if (step5DescElement) {
            step5DescElement.className = 'text-[#3c32c8]'; // Reapply the color class
        }

        // Update the language select dropdown
        if (languageSelect) {
            languageSelect.value = langCode;
        }
        renderHistory(); // Re-render history to apply new language strings
    }

    // Function to display modal messages (for critical errors)
    function displayModalMessage(messageKey, show = true, isLangKey = true) {
        if (modalMessageEl && modal) {
            let messageText = isLangKey && languages[currentLanguage] ? languages[currentLanguage][messageKey] : messageKey;
            modalMessageEl.innerHTML = messageText;
            if (show) modal.classList.remove('hidden');
            else modal.classList.add('hidden');
        }
    }

    // New function to display temporary notifications
    function displayNotification(messageKey, duration = 5000, isLangKey = true) {
        if (notificationBar) {
            let messageText = isLangKey && languages[currentLanguage] ? languages[currentLanguage][messageKey] : messageKey;
            notificationBar.textContent = messageText;
            notificationBar.classList.add('show'); // Show the notification bar

            setTimeout(() => {
                notificationBar.classList.remove('show'); // Hide after duration
            }, duration);
        }
    }

    function updateUIForGenerationState(isGenerating) {
        IS_GENERATING = isGenerating;
        // Using a helper function to toggle display based on a boolean
        function toggleDisplay(element, show) {
            if (element) {
                if (show) element.style.display = '';
                else element.style.display = 'none';
            }
        }
        
        if (generate) toggleDisplay(generate, !isGenerating);
        if (interrupt_button) toggleDisplay(interrupt_button, isGenerating);

        const inputs = [seed_input, prompt_input, batch_size_input, img_height_input, img_width_input, image_input, is_random_input];
        inputs.forEach(input => { if (input) input.disabled = isGenerating; });
        
        if (!isGenerating && seed_input && is_random_input) {
            seed_input.disabled = is_random_input.checked;
        }
        updateProgress(0); // Reset progress bar
        if(node_status_el) node_status_el.innerText = isGenerating ? languages[currentLanguage].processing_status : '';

        // --- REVISED LOGIC FOR GUIDE AND RESULTS VISIBILITY ---
        if (isGenerating) {
            // When generation starts
            if (guideContainer) guideContainer.classList.add('hidden'); // Hide guide
            if (results) results.classList.remove('hidden'); // Show results area
            if (results) results.innerHTML = `<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#3c32c8]"></div></div>`; // Show spinner
        } else {
            // When generation stops (idle, finished, interrupted, error)
            const hasImagesInResults = results && results.querySelector('img');

            if (guideContainer && results) {
                if (!hasImagesInResults) {
                    // If no images are present in results, show the guide and hide results
                    results.innerHTML = ''; // Clear results area (e.g., remove spinner)
                    results.classList.add('hidden'); // Hide results area
                    guideContainer.classList.remove('hidden'); // Show guide
                } else {
                    // If images are present, keep the guide hidden and results visible
                    guideContainer.classList.add('hidden');
                    results.classList.remove('hidden');
                }
            }
        }
        // --- END REVISED LOGIC ---
    }

    function updateProgress(value, max = 100) {
        if (progressbar) {
            progressbar.style.width = max > 0 ? `${(value / max) * 100}%` : '0%';
        }
    }

    function setImageDimensions(selectedValue) {
        if (!img_width_input || !img_height_input) return;
        switch (selectedValue) {
            case 'portrait':
                img_width_input.value = 1080;
                img_height_input.value = 1350;
                break;
            case 'landscape':
                img_width_input.value = 1350;
                img_height_input.value = 1080;
                break;
            case 'square':
            default:
                img_width_input.value = 1024;
                img_height_input.value = 1024;
                break;
        }
    }
    
    async function queue_prompt(prompt = {}) {
        const data = { 'prompt': prompt, 'client_id': client_id };
        const response = await fetch('/prompt', {
            method: 'POST', cache: 'no-cache', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error(`${languages[currentLanguage].prompt_queue_failed} ${response.status} - ${await response.text()}`);
        return response.json();
    }

    function handleImagePreview(file) {
        uploadedImageFile = file;
        if (!display_uploaded_image_el) return;
        if (uploadedImageFile) {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    display_uploaded_image_el.style.backgroundImage = `url(${reader.result})`;
                    display_uploaded_image_el.innerHTML = ''; // Remove placeholder text
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(uploadedImageFile);
        } else {
            display_uploaded_image_el.style.backgroundImage = 'none';
            display_uploaded_image_el.innerHTML = `<span class="text-gray-500 dark:text-gray-400" data-lang-key="image_preview_placeholder">${languages[currentLanguage].image_preview_placeholder}</span>`;
        }
    }

    // History functions
    function saveHistoryItem(imageUrl, promptText) {
        let history = loadHistory();
        history.unshift({ imageUrl, promptText, timestamp: new Date().toISOString() }); // Add to beginning
        // Keep only the last 10 items to prevent excessive storage
        if (history.length > 10) {
            history = history.slice(0, 10);
        }
        sessionStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(history));
        renderHistory();
    }

    function loadHistory() {
        const historyString = sessionStorage.getItem(SESSION_HISTORY_KEY);
        return historyString ? JSON.parse(historyString) : [];
    }

    function renderHistory() {
        if (!historyContainer) return;
        const history = loadHistory();
        historyContainer.innerHTML = ''; // Clear existing history

        if (history.length === 0) {
            historyContainer.innerHTML = `<p class="text-gray-500 dark:text-gray-400 text-sm" data-lang-key="history_empty_message">${languages[currentLanguage].history_empty_message}</p>`;
        } else {
            history.forEach(item => {
                const historyItemDiv = d.createElement('div');
                historyItemDiv.className = 'history-item';
                historyItemDiv.innerHTML = `
                    <img src="${item.imageUrl}" alt="Generated Image" class="rounded-md">
                    <p class="history-item-prompt">${item.promptText}</p>
                `;
                const promptElement = historyItemDiv.querySelector('.history-item-prompt');
                if (promptElement) {
                    promptElement.addEventListener('click', () => {
                        // Use document.execCommand for clipboard copy due to iframe restrictions
                        const textarea = document.createElement('textarea');
                        textarea.value = item.promptText;
                        document.body.appendChild(textarea);
                        textarea.select();
                        try {
                            const successful = document.execCommand('copy');
                            if (successful) {
                                displayNotification('copied_to_clipboard', 2000); // Show success notification
                            } else {
                                console.error('Fallback: Copying text command was unsuccessful.');
                                displayNotification('Failed to copy!', 2000, false); // Show failure notification
                            }
                        } catch (err) {
                            console.error('Fallback: Oops, unable to copy', err);
                            displayNotification('Failed to copy!', 2000, false); // Show failure notification
                        }
                        document.body.removeChild(textarea);
                    });
                }
                historyContainer.appendChild(historyItemDiv);
            });
        }
    }

    function clearHistory() {
        sessionStorage.removeItem(SESSION_HISTORY_KEY);
        renderHistory();
    }
    
    function setupWebSocket() {
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${protocol}//${window.location.host}/ws?clientId=${client_id}`);

        ws.onopen = () => {
            console.log('WebSocket connected.');
            reconnectAttempts = 0;
            displayNotification('WebSocket connected.', 3000, false); // Notify connection
        };

        ws.onmessage = (event) => {
            if (event.data instanceof Blob) {
                console.log("Ignoring Blob (intermediate image) message.");
                return;
            }
            try {
                const data = JSON.parse(event.data);
                switch (data.type) {
                    case 'progress':
                        updateProgress(data.data.value, data.data.max);
                        if (data.data.node && node_status_el) node_status_el.innerText = `${languages[currentLanguage].processing_status} ${data.data.node}`;
                        break;
                    case 'executing':
                        if (data.data.node === null) {
                            if (node_status_el) node_status_el.innerText = languages[currentLanguage].finished_status;
                        } else {
                            if (node_status_el) node_status_el.innerText = `${languages[currentLanguage].executing_status} ${data.data.node}`;
                        }
                        break;
                    case 'executed':
                        if (results && data.data.output && 'images' in data.data.output) {
                            const gridClass = data.data.output.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1';
                            results.innerHTML = `<div class="grid ${gridClass} gap-4">${data.data.output.images.map(image => {
                                const imageUrl = `/view?filename=${image.filename}&subfolder=${image.subfolder}&type=${image.type}`;
                                // Save to history
                                saveHistoryItem(imageUrl, prompt_input.value);
                                return `<div><a href="${imageUrl}" target="_blank"><img src="${imageUrl}" class="rounded-lg shadow-lg"></a></div>`;
                            }).join('')}</div>`;
                            if (guideContainer) guideContainer.classList.add('hidden'); // Ensure guide is hidden if images are shown
                            if (results) results.classList.remove('hidden'); // Ensure results are visible
                        }
                        break;
                    case 'execution_interrupted':
                        updateUIForGenerationState(false);
                        displayModalMessage('generation_interrupted', true); // Still a modal, as it's an important event
                        if (node_status_el) node_status_el.innerText = languages[currentLanguage].interrupted_status;
                        break;
                    case 'status':
                        updateUIForGenerationState(data.data.status.exec_info.queue_remaining > 0);
                        if (!IS_GENERATING) { // If not generating, and queue is empty
                            console.log(languages[currentLanguage].idle_status);
                        }
                        break;
                    default:
                        console.log('Unknown WS message type:', data.type);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        ws.onclose = () => {
            console.warn('WebSocket disconnected.');
            updateUIForGenerationState(false);
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                setTimeout(setupWebSocket, RECONNECT_DELAY_MS);
                displayNotification('ws_connecting_message', 3000); // Changed to notification
            } else {
                displayNotification('reconnect_failed', 5000); // Changed to notification
            }
        };
    
        ws.onerror = function() {
            console.error('WebSocket Error. Attempting to reconnect via onclose.');
            displayNotification('ws_error_message', 5000); // Changed to notification
        };
    }
    
        /**
     * Loads predefined ComfyUI API workflows from JSON files.
     * @returns {Promise<Object>} An object containing loaded workflow JSONs, keyed by their names.
     */
    async function load_api_workflows() {
        let wf = {
            // 'flux_kontext': '/js/flux-kontext.json'
            'flux_kontext': '/paltech/js/flux-kontext.json'

        }

        for (let key in wf) {
            try {
                let response = await fetch(wf[key]);
                if (!response.ok) {
                    throw new Error(`Failed to load workflow ${wf[key]}: ${response.status} ${response.statusText}`);
                }
                wf[key] = await response.json();
            } catch (error) {
                console.error(`Error loading workflow ${key}:`, error);
                wf[key] = {}; // Set to empty object on error
                displayModalMessage(`Failed to load workflow: ${key}. Please check the path and server status.`, true);
            }
        }
        return wf;
    }

    if (generate) {
        generate.addEventListener('click', async () => {
            if (IS_GENERATING) return;
            
            updateUIForGenerationState(true); // Set state to generating, which hides guide and shows spinner
            // if (!prompt_input || !img_width_input || !img_height_input || !batch_size_input || !seed_input) {
            //     displayModalMessage('Please fill in all required fields.', true, false);
            //     updateUIForGenerationState(false); // Reset state if validation fails
            //     return;
            // }

            let wf_to_use = JSON.parse(JSON.stringify(workflows.flux_kontext)); // Use a copy
            
            if(prompt_input) wf_to_use['308'].inputs.text = prompt_input.value;
            if(is_random_input && is_random_input.checked && seed_input) seed_input.value = Math.floor(Math.random() * 1e15);

            if(wf_to_use['318']) {
                wf_to_use['318'].inputs.seed = parseInt(seed_input.value);
            }
            if(wf_to_use['355']) {
                wf_to_use['355'].inputs.batch_size = parseInt(batch_size_input.value);
                wf_to_use['355'].inputs.width = parseInt(img_width_input.value);
                wf_to_use['355'].inputs.height = parseInt(img_height_input.value);
            }

            if (uploadedImageFile) {
                const currentFileIdentifier = `${uploadedImageFile.name}-${uploadedImageFile.size}-${uploadedImageFile.lastModified}`;
                if (currentFileIdentifier !== lastUploadedFileIdentifier) {
                        try {
                        const uploadResult = await fetch('/upload/image', {
                            method: 'POST',
                            body: (() => {
                                const fd = new FormData();
                                fd.append('image', uploadedImageFile);
                                fd.append('overwrite', 'true');
                                return fd;
                            })()
                        }).then(res => res.json());
                        lastUploadedComfyUIName = uploadResult.name;
                        lastUploadedFileIdentifier = currentFileIdentifier;
                    } catch (e) {
                        displayModalMessage(`${languages[currentLanguage].image_upload_failed} ${e.message}`, true, false);
                        updateUIForGenerationState(false); // This will now handle guide visibility
                        return;
                    }
                }
                if(wf_to_use['357']) wf_to_use['357'].inputs.image = lastUploadedComfyUIName;
            } else {
                // If no image is uploaded, use a blank image or remove the node if not needed
                // For now, we'll assume a default blank image is always available or the node is optional
                if(wf_to_use['357']) wf_to_use['357'].inputs.image = "default_blank.png";
            }

            try {
                await queue_prompt(wf_to_use);
            } catch (e) {
                displayModalMessage(`${e.message}`, true, false); // Keep as modal for prompt queue errors
                updateUIForGenerationState(false); // This will now handle guide visibility
            }
        });
    }

    // Other event listeners
    if (interrupt_button) interrupt_button.addEventListener('click', () => fetch('/interrupt', { method: 'POST' }));
    if (image_size_radioBtn) image_size_radioBtn.addEventListener('change', e => { if (e.target.name === 'image-size') setImageDimensions(e.target.value); });
    if(image_input) image_input.addEventListener('change', function() { handleImagePreview(this.files ? this.files[0] : null); });
    if(modalCloseButton) modalCloseButton.addEventListener('click', () => displayModalMessage('', false));
    if(clearHistoryButton) clearHistoryButton.addEventListener('click', clearHistory);
    if(backButton) backButton.addEventListener('click', () => window.location.href = 'index.html'); // New: Back button logic
    
    // Theme Toggle Logic
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (themeIcon) themeIcon.textContent = currentTheme === 'dark' ? '🌙' : '💡';
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
    setImageDimensions(_('input[name="image-size"]:checked')?.value || 'square');
    setLanguage(currentLanguage); // Set language on initial load
    renderHistory(); // Render history on initial load
    setupWebSocket(); // Keep WebSocket connected on page load for status updates

    // Ensure guide is visible on initial load
    if (guideContainer) guideContainer.classList.remove('hidden');
    if (results) results.classList.add('hidden');
})(window, document);