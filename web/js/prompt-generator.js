// prompt-generator.js
// Purpose: JavaScript logic for the Prompt Generation tab within image-ai.html
// Integrates by being loaded dynamically and calling window.initializePromptGeneratorTab

(async (window, document, undefined) => {

        // --- EXPOSE INITIALIZATION LOGIC GLOBALLY ---
    // This is the entry point called by image-ai.js after HTML injection.
    window.initializePromptGeneratorTab = window.initializePromptGeneratorTab || async function () {
        if (window.__PROMPT_GEN_SCRIPT_LOADED) return;
        window.__PROMPT_GEN_SCRIPT_LOADED = true;

        console.log("Prompt Generator: Initializing tab view (called from image-ai.js)...");
        try {
            // --- State, Constants, Language Data (Scoped within the IIFE) ---
            let IS_GENERATING = false;
            let lastUploadedComfyUIName = null;
            let lastUploadedFileIdentifier = null;

            window.promptGenState = window.promptGenState || {
                uploadedImageFile: null,
                lastFileIdentifier: null
            };

            // Workflow Nodes
            const IMAGE_INPUT_NODE = '1';
            const PROMPT_GEN_NODE = '4';
            const OUTPUT_NODE = '6';

            // Preset Selector

            // Ensure this path is correct relative to image-ai.html when loaded
            const WORKFLOW_PATH = './js/prompt-gen-workflow.json';
            let promptGenWorkflow = null;
            const PROMPT_HISTORY_KEY = 'promptGeneratorHistory';
            let currentLanguage = localStorage.getItem('language') || 'ar'; // Default

            // Language definitions for standalone use or fallback
            // Note: image-ai.js also has a languages object for tab integration.
            const languages = {
                en: {
                    // Core UI
                    prompt_generator_title: "Prompt Generator",
                    prompt_generator_intro: "Generate AI prompts based on an image and your instructions.",
                    edit_instruction_title: "Edit Instruction",
                    edit_instruction_placeholder: "Describe how you want to modify the image...",
                    image_upload_title: "Image To Upload",
                    select_image_button: "Select Image",
                    image_preview_placeholder: "Image Preview",
                    generate_prompt_button: "Generate Prompt",
                    interrupt_button: "Interrupt",
                    generated_prompt_title: "Generated Prompt",
                    prompt_result_placeholder: "Generated prompt will appear here...",
                    prompt_output_label: "Prompt Output (Editable):",
                    copied_to_clipboard: "Copied to clipboard!",
                    copy_to_clipboard: "Copy",
                    failed_to_copy: "Failed to copy!",
                    use_prompt_in_image_ai: "Use in Image AI",
                    modal_notification_title: "Notification",
                    modal_close_button: "Close",
                    // Errors & Messages
                    prompt_queue_failed: "Failed to queue prompt:",
                    image_upload_failed: "Image upload failed:",
                    generation_interrupted: "Prompt generation interrupted.",
                    processing_status: "Processing:",
                    executing_status: "Executing:",
                    finished_status: "Finished!",
                    interrupted_status: "Interrupted!",
                    idle_status: "ComfyUI is idle.",
                    ws_connecting_message: "WebSocket connection lost. Attempting to reconnect...",
                    ws_max_reconnect_message: "WebSocket connection lost. Max reconnect attempts reached. Please reload the page manually.",
                    ws_error_message: "WebSocket connection error. Attempting to reconnect...",
                    reconnect_failed: "Could not reconnect to the server. Please refresh the page.",
                    prompt_generation_workflow_not_loaded: "Prompt generation workflow not loaded. Please check the path and server status.",
                    // Footer (if used standalone)
                    footer_text: "© 2024 Paltech Hub AI v0.1. All rights reserved.",
                    lang_english: "English",
                    lang_arabic: "العربية",
                    // History
                    prompt_history_title: "Prompt History",
                    prompt_history_empty_message: "No prompt history yet.",
                    clear_prompt_history_button: "Clear History",
                    // Preset Selection
                    preset_selection_title: "Preset Selection",
                    select_preset_label: "Choose a Preset:",
                    preset_kid_clothes: "Kid Clothes",
                    preset_womens_clothes: "Women’s Clothes",
                    preset_beauty_product_use: "Beauty Product Use",
                    preset_beauty_product_display: "Beauty Product Display",

                    // websocket
                    websocket_connected: "WebSocket connected.",

                    please_select_image: "Please select image",
                    edit_instruction_too_short: "Edit Instruction is too short",

                    uploading_image: "Uploading the image",
                },
                ar: {
                    // Core UI
                    prompt_generator_title: "مولد المطالبات",
                    prompt_generator_intro: "أنشئ مطالبات ذكاء اصطناعي بناءً على صورة وتعليماتك.",
                    edit_instruction_title: "تعليمات التعديل",
                    edit_instruction_placeholder: "صف كيف تريد تعديل الصورة...",
                    image_upload_title: "تحميل الصورة",
                    select_image_button: "اختر صورة",
                    image_preview_placeholder: "معاينة الصورة",
                    generate_prompt_button: "توليد المطالبة",
                    interrupt_button: "إيقاف",
                    generated_prompt_title: "المطالبة المولدة",
                    prompt_result_placeholder: "ستظهر المطالبة المولدة هنا...",
                    prompt_output_label: "إخراج المطالبة (قابل للتحرير):",
                    copied_to_clipboard: "تم النسخ إلى الحافظة!",
                    copy_to_clipboard: "نسخ",
                    failed_to_copy: "فشل النسخ الى الحافظة!",
                    use_prompt_in_image_ai: "استخدام في صور الذكاء الاصطناعي",
                    modal_notification_title: "إشعار",
                    modal_close_button: "اغلاق",
                    // Errors & Messages
                    prompt_queue_failed: "فشل في اضافة طلبك.:",
                    image_upload_failed: "فشل تحميل الصورة:",
                    generation_interrupted: "تم مقاطعت عملية توليد المطالبة.",
                    processing_status: "معالجة:",
                    executing_status: "جاري التنفيذ:",
                    finished_status: "انتهى!",
                    interrupted_status: "تم الإيقاف!",
                    idle_status: "ComfyUI خامل حاليا.",
                    ws_connecting_message: "انقطع الاتصال بالخادم . جاري محاولة إعادة الاتصال...",
                    ws_max_reconnect_message: "انقطع اتصال بالخادم. تم الوصول إلى الحد الأقصى لمحاولات إعادة الاتصال. يُرجى إعادة تحميل الصفحة يدويًا.",
                    ws_error_message: "خطأ في الاتصال بالخادم. جاري محاولة إعادة الاتصال...",
                    reconnect_failed: "تعذّر الاتصال بالخادم. يُرجى تحديث الصفحة.",
                    prompt_generation_workflow_not_loaded: "لم يتم تحميل مسار عمل توليد المطالبات. يرجى التحقق من المسار وحالة الخادم.",
                    // Footer (if used standalone)
                    footer_text: "© 2024 Paltech Hub AI v0.1. جميع الحقوق محفوظة.",
                    lang_english: "English",
                    lang_arabic: "العربية",
                    // History
                    prompt_history_title: "سجل المطالبات",
                    prompt_history_empty_message: "لا يوجد سجل مطالبات حتى الآن.",
                    clear_prompt_history_button: "مسح السجل",
                    // Preset Selection
                    preset_selection_title: "تحديد الإعداد المسبق",
                    select_preset_label: "اختر إعدادًا مسبقًا:",
                    preset_kid_clothes: "ملابس أطفال",
                    preset_womens_clothes: "ملابس نسائية",
                    preset_beauty_product_use: "استخدام منتج تجميل",
                    preset_beauty_product_display: "عرض منتج تجميل",
                    
                    // websocket
                    websocket_connected: "تم الاتصال.",

                    please_select_image: "الرجاء اضافة صورة",
                    edit_instruction_too_short: "تعليمات التعديل قصيرة جدا",

                    uploading_image: "يتم تحميل الصورة",

                }
            };

            const langConfig = { languages, currentLanguage };

            // --- UI and Helper Functions (Defined inside IIFE, used by initializePromptGeneratorTab) ---
            function updateUIForGenerationState(isGenerating) {
                
                const generatePromptButton = document.querySelector('#generate-prompt');
                const interruptPromptButton = document.querySelector('#interrupt-prompt');
                const imageInput = document.querySelector('#image-input');
                const editInstructionInput = document.querySelector('#edit-instruction-input');
                const presetSelect = document.querySelector('#preset-select');
                const loadingSpinner = document.querySelector('#prompt-loading-spinner');
                const progressbar = document.querySelector('#main-progress'); // Needed by updateProgress
                const node_status_el = document.querySelector('#current-node-status'); // Needed here and by updateProgress

                IS_GENERATING = isGenerating;
                if (generatePromptButton) generatePromptButton.disabled = isGenerating;
                interruptPromptButton.classList.toggle('hidden', !isGenerating);
                if (imageInput) imageInput.disabled = isGenerating;
                if (editInstructionInput) editInstructionInput.disabled = isGenerating;
                if (presetSelect) presetSelect.disabled = isGenerating;

                if (loadingSpinner) {
                    loadingSpinner.classList.toggle('hidden', !isGenerating);
                }

                if (!isGenerating) {
                    updateProgress(0);
                    if(node_status_el) node_status_el.textContent = '';
                }
            }

            function updateProgress(value, max = 100) {
                const progressbar = document.querySelector('#main-progress');
                if (progressbar) {
                    progressbar.style.width = max > 0 ? `${(value / max) * 100}%` : '0%';
                }
            }

            function updateResetButtonVisibility(hasImage) {
                const btn = document.querySelector('#remove-image');
                if (!btn) return;

                btn.classList.toggle('opacity-0', !hasImage);
                btn.classList.toggle('pointer-events-none', !hasImage);
                btn.classList.toggle('opacity-100', hasImage);
                btn.classList.toggle('pointer-events-auto', hasImage);
            }

            function handleImagePreview(file) {
                const displayEl = document.querySelector('#display-prompt-uploaded-image');
                const identifier = file ? `${file.name}-${file.size}` : null;
                if (identifier === window.promptGenState.lastFileIdentifier) return;
                    window.promptGenState.lastFileIdentifier = identifier;
                 window.promptGenState.uploadedImageFile = file;
                if (!displayEl) return;
                if (window.promptGenState.uploadedImageFile) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const img = new Image();
                        img.onload = () => {
                            // Apply styles to make background visible
                            displayEl.style.backgroundImage = `url(${reader.result})`;
                            displayEl.innerHTML = ''; // Clear placeholder

                            // Show clear image button
                            updateResetButtonVisibility(true);
                        };
                        img.onerror = () => {
                            console.error("Failed to load image data URL");
                            displayEl.innerHTML = '<span>Error loading image</span>';
                        };
                        img.src = reader.result;
                    };
                    reader.readAsDataURL(window.promptGenState.uploadedImageFile);
                } else {
                    displayEl.style.backgroundImage = 'none';
                    displayEl.innerHTML = `<span class="text-gray-500 dark:text-gray-400" data-lang-key="image_preview_placeholder">${languages[currentLanguage]?.image_preview_placeholder || 'Image Preview'}</span>`;
                    // Hide clear image button
                    updateResetButtonVisibility(false);
                    if (imageInput) imageInput.value = '';
                }
            }

            function showGeneratedPrompt(promptText) {
                const generatedPromptOutput = document.querySelector('#generated-prompt-output');
                const placeholderElement = document.querySelector('#prompt-result-placeholder');
                const promptResultTextarea = document.querySelector('#prompt-result-textarea');

                if (generatedPromptOutput && placeholderElement && promptResultTextarea) {
                    placeholderElement.classList.add('hidden');
                    const displayArea = generatedPromptOutput.closest('#prompt-result-display');
                    if (displayArea) displayArea.classList.remove('hidden');

                    generatedPromptOutput.value = promptText || '';
                    promptResultTextarea.value = promptText || '';

                    if (promptText) {
                        savePromptHistoryItem(promptText);
                    }
                }
            }

            async function load_workflow() {
                try {
                    const response = await fetch(WORKFLOW_PATH);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    promptGenWorkflow = await response.json();
                    console.log("Prompt generation workflow loaded:", promptGenWorkflow);
                } catch (error) {
                    console.error("Error loading workflow:", error);
                    window.appUtils.displayModalMessage('prompt_generation_workflow_not_loaded', langConfig);
                }
            }

            // async function uploadImageIfNeeded() {
            //     if (!window.promptGenState.uploadedImageFile) return "default_blank.png";

            //     const currentFileIdentifier = `${window.promptGenState.uploadedImageFile.name}-${window.promptGenState.uploadedImageFile.size}-${window.promptGenState.uploadedImageFile.lastModified}`;
            //     if (currentFileIdentifier === lastUploadedFileIdentifier) {
            //         return lastUploadedComfyUIName; // Skip upload
            //     }

            //     // Show spinner
            //     const spinner = document.querySelector('#image-upload-spinner');
            //     if (spinner) spinner.classList.remove('hidden');
            //     try {
            //         window.pgDisplayNotification('uploading_image', 3000, true);
            //         const uploadResult = await fetch('/upload/image', {
            //             method: 'POST',
            //             body: (() => {
            //                 const fd = new FormData();
            //                 fd.append('image', window.promptGenState.uploadedImageFile);
            //                 fd.append('overwrite', 'true');
            //                 return fd;
            //             })()
            //         }).then(res => res.json());
            //         lastUploadedComfyUIName = uploadResult.name;
            //         lastUploadedFileIdentifier = currentFileIdentifier;
            //         console.log("Image uploaded:", lastUploadedComfyUIName);
            //     } catch (e) {
            //         console.error("Image upload failed:", e);
            //         throw new Error(`${languages[currentLanguage]?.image_upload_failed || 'Image upload failed:'} ${e.message}`);
            //     } finally {
            //         // Hide spinner
            //         if (spinner) spinner.classList.add('hidden');
            //     }
            //     return lastUploadedComfyUIName;
            // }

            function handleExecutedEvent(data) {
                // Check if this is the output node with generated prompt
                if (data.node === OUTPUT_NODE && data.output?.text?.length > 0) {
                    const generatedPrompt = data.output.text[0];
                    console.log("Received generated prompt from PreviewAny node (6):", generatedPrompt);
                    showGeneratedPrompt(generatedPrompt);
                    savePromptHistoryItem(generatedPrompt); // ✅ Add this line
                    updateUIForGenerationState(false);
                }

                if (data.node === null) {
                    console.log("Execution finished for prompt ID:", data.prompt_id);
                }
            }

            // --- Prompt History Functions ---
            function savePromptHistoryItem(promptText) {
                if (!promptText || typeof promptText !== 'string') return;
                let history = loadPromptHistory();
                history.unshift({ promptText, timestamp: new Date().toISOString() });
                if (history.length > 10) {
                    history = history.slice(0, 10);
                }
                try {
                    sessionStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(history));
                } catch (e) {
                    console.error("Failed to save prompt history to sessionStorage:", e);
                }
                renderPromptHistory();
            }

            function loadPromptHistory() {
                try {
                    const historyString = sessionStorage.getItem(PROMPT_HISTORY_KEY);
                    return historyString ? JSON.parse(historyString) : [];
                } catch (e) {
                    console.error("Failed to load prompt history from sessionStorage:", e);
                    return [];
                }
            }

            function clearPromptHistory() {
                try {
                    sessionStorage.removeItem(PROMPT_HISTORY_KEY);
                } catch (e) {
                    console.error("Failed to clear prompt history from sessionStorage:", e);
                }
                renderPromptHistory();
            }

           function createHistoryItem(truncatedPrompt, fullPromptText, languages, currentLanguage) {
                // Create the container span
                const promptSpan = document.createElement('span');
                promptSpan.className = 'prompt-history-item-prompt';
                promptSpan.textContent = truncatedPrompt;

                // Create the copy button
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'prompt-history-item-copy-btn';

                const titleText = languages[currentLanguage]?.copy_to_clipboard || 'Copy';
                button.title = titleText;

                // Create SVG (with correct namespace)
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('class', 'w-4 h-4');
                svg.setAttribute('fill', 'none');
                svg.setAttribute('stroke', 'currentColor');
                svg.setAttribute('viewBox', '0 0 24 24');
                svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('stroke-linecap', 'round');
                path.setAttribute('stroke-linejoin', 'round');
                path.setAttribute('stroke-width', '2');
                path.setAttribute('d', 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z');
                svg.appendChild(path);

                // Screen reader text
                const srSpan = document.createElement('span');
                srSpan.className = 'sr-only';
                srSpan.textContent = titleText;

                // Assemble button
                button.appendChild(svg);
                button.appendChild(srSpan);

                // Return a wrapper div (so we can attach events easily)
                const wrapper = document.createElement('div');
                wrapper.className = 'prompt-history-item';
                wrapper.appendChild(promptSpan);
                wrapper.appendChild(button);

                // Attach data for later use (or just pass full text to event)
                wrapper.dataset.fullPrompt = fullPromptText;

                return wrapper;
            }

            function renderPromptHistory() {
                const history = loadPromptHistory();
                const promptHistoryContainer = document.querySelector('#prompt-history-container');
                if (!promptHistoryContainer) {
                    console.warn("renderPromptHistory: promptHistoryContainer element not found.");
                    return;
                }

                // Clear previous content
                promptHistoryContainer.innerHTML = '';

                if (history.length === 0) {
                    // ✅ Safe: Create empty message without innerHTML
                    const emptyMessage = document.createElement('p');
                    emptyMessage.id = 'prompt-history-empty-message';
                    emptyMessage.className = 'text-gray-400 dark:text-gray-400 text-sm text-center';
                    emptyMessage.dataset.langKey = 'prompt_history_empty_message';
                    emptyMessage.textContent = languages[currentLanguage]?.prompt_history_empty_message || 'No prompt history yet.';
                    promptHistoryContainer.appendChild(emptyMessage);
                    return;
                }

                // Render each history item
                history.forEach((item) => {
                    const truncatedPrompt = item.promptText.length > 100 
                        ? item.promptText.substring(0, 100) + '...' 
                        : item.promptText;

                    // Create the full DOM element
                    const historyItemDiv = createHistoryItem(truncatedPrompt, item.promptText, languages, currentLanguage);

                    // Now safely attach event listeners
                    const promptSpan = historyItemDiv.querySelector('.prompt-history-item-prompt');
                    const copyBtn = historyItemDiv.querySelector('.prompt-history-item-copy-btn');

                    if (promptSpan) {
                        promptSpan.addEventListener('click', () => {
                            copyTextToClipboard(item.promptText);
                        });
                    }

                    if (copyBtn) {
                        copyBtn.addEventListener('click', (e) => {
                            e.stopPropagation(); // Prevent triggering span click
                            copyTextToClipboard(item.promptText);
                        });
                    }

                    promptHistoryContainer.appendChild(historyItemDiv);
                });
            }

            async function copyTextToClipboard(text) {
                if (!text) return;

                if (navigator.clipboard) {
                    try {
                        await navigator.clipboard.writeText(text);
                            window.appUtils.displayNotification('copied_to_clipboard', langConfig);
                        return;
                    } catch (err) {
                        console.warn('Clipboard API failed:', err);
                    }
                }

                // Fallback: textarea method
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.setAttribute('readonly', '');
                textarea.style.position = 'absolute';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                try {
                    const success = document.execCommand('copy');
                    success 
                        ? window.appUtils.displayNotification('copied_to_clipboard', langConfig)
                        : window.appUtils.displayNotification('failed_to_copy', langConfig);
                } catch (err) {
                    window.appUtils.displayNotification('failed_to_copy', langConfig);
                }
                document.body.removeChild(textarea);
            }

            const generatePromptButton = document.querySelector('#generate-prompt'); // ← Re-query here!
            // Generate Button
            if (generatePromptButton) {
                generatePromptButton.addEventListener('click', async () => {
                    if (IS_GENERATING) return;

                    // validation 
                    if (!window.promptGenState.uploadedImageFile) {
                        window.appUtils.displayModalMessage('please_select_image', langConfig);
                        return;
                    }

                    if (editInstructionInput.value.trim().length < 20) {
                        window.appUtils.displayModalMessage('edit_instruction_too_short', langConfig);
                        return;
                    }

                    if (!promptGenWorkflow) {
                        window.appUtils.displayModalMessage('prompt_generation_workflow_not_loaded', langConfig);
                        return;
                    }

                    updateUIForGenerationState(true);
                    showGeneratedPrompt('');
                    const placeholderElement = document.querySelector('#prompt-result-placeholder');
                    if (placeholderElement) {
                        placeholderElement.classList.remove('hidden');
                    }
                    const generatedPromptOutput = document.querySelector('#generated-prompt-output');
                    const displayArea = generatedPromptOutput?.closest('#prompt-result-display');
                    if (displayArea) displayArea.classList.add('hidden');

                    try {
                        const editInstructionInput = document.querySelector('#edit-instruction-input');
                        const presetSelect = document.querySelector('#preset-select');

                        const comfyUIImageName = await window.appUtils.uploadImage(
                            window.promptGenState.uploadedImageFile,
                            'uploading_image',
                            langConfig
                        );

                        if (!comfyUIImageName) {
                            updateUIForGenerationState(false);
                            return;
                        }
                        
                        let wf_to_send = JSON.parse(JSON.stringify(promptGenWorkflow));

                        if (wf_to_send[IMAGE_INPUT_NODE]) {
                            wf_to_send[IMAGE_INPUT_NODE].inputs.image = comfyUIImageName;
                        }
                        if (wf_to_send[PROMPT_GEN_NODE] && editInstructionInput) {
                            wf_to_send[PROMPT_GEN_NODE].inputs.edit_instruction = editInstructionInput.value;
                        }
                        if (wf_to_send[PROMPT_GEN_NODE] && presetSelect) {
                             const selectedPresetValue = presetSelect.options[presetSelect.selectedIndex].value;
                             wf_to_send[PROMPT_GEN_NODE].inputs.preset = selectedPresetValue;
                             console.log("Setting preset for node 4:", selectedPresetValue);
                        }

                        // const response = await queue_prompt(wf_to_send);
                        const response = await window.appUtils.queuePrompt(wf_to_send, window.sharedWS.client_id);
                        const promptId = response.prompt_id;
                        console.log("Prompt generation queued with ID:", promptId);

                    } catch (e) {
                        console.error("Prompt generation error:", e);
                        window.appUtils.displayModalMessage(`${e.message}`, langConfig);
                        updateUIForGenerationState(false);
                    }
                });
            }

            const interruptPromptButton = document.querySelector('#interrupt-prompt');
            // Interrupt Button
            if (interruptPromptButton) {
                interruptPromptButton.addEventListener('click', () => {
                     fetch('/interrupt', { method: 'POST' })
                         .then(() => console.log("Interrupt signal sent"))
                         .catch(err => console.error("Interrupt failed:", err));
                });
            }

            // Save edit instruction as user types
            editInstructionInput = document.querySelector('#edit-instruction-input');
            if (editInstructionInput) {
                editInstructionInput.addEventListener('input', () => {
                    sessionStorage.setItem('promptGen_editInstruction', editInstructionInput.value);
                });
            }

            // Save preset when changed
            presetSelect = document.querySelector('#preset-select');
            if (presetSelect) {
                presetSelect.addEventListener('change', () => {
                    sessionStorage.setItem('promptGen_preset', presetSelect.value);
                });
            }

            const imageInput = document.querySelector('#image-input');
            // Image Input
            if (imageInput) {
                imageInput.addEventListener('change', function() {
                    handleImagePreview(this.files ? this.files[0] : null);
                });
            }

            const modalCloseButton = document.querySelector('#modal-close-button');
            // Modal Close Button
            if (modalCloseButton) {
                modalCloseButton.addEventListener('click', () => window.appUtils.displayModalMessage('', langConfig, false));
            }

            const copyPromptTextareaButton = document.querySelector('#copy-prompt-textarea-button');
            const promptResultTextarea = document.querySelector('#prompt-result-textarea');
            // Copy Textarea Button
            if (copyPromptTextareaButton && promptResultTextarea) {
                copyPromptTextareaButton.addEventListener('click', () => {
                    const textToCopy = promptResultTextarea.value;
                    if (textToCopy) {
                        window.appUtils.copyTextToClipboard(textToCopy, languages[currentLanguage]?.copied_to_clipboard || 'Copied!');
                        //copyTextToClipboard(textToCopy);
                    }
                });
            }

            const clearPromptHistoryButton = document.querySelector('#clear-prompt-history-button')
            // Clear History Button
            if (clearPromptHistoryButton) {
                clearPromptHistoryButton.addEventListener('click', () => {
                    console.log("Clearing prompt history...");
                    clearPromptHistory();
                });
            }

            const removeImageButton = document.querySelector('#remove-image');
            if (removeImageButton) {
                removeImageButton.addEventListener('click', () => {
                    handleImagePreview(null); // Clears the image
                });
            }

            // --- Re-run Initial Setup Functions ---
            renderPromptHistory();
            await load_workflow();
            // setupWebSocket();

            // Register with global WebSocket
            if (window.sharedWS) {
                window.sharedWS.addListener('prompt-generator', function(data) {
                    const node_status_el = document.querySelector('#current-node-status');

                    switch (data.type) {
                        case 'progress':
                            updateProgress(data.data.value, data.data.max);
                            if (data.data.node && node_status_el) {
                                node_status_el.textContent = `${languages[currentLanguage]?.processing_status || 'Processing'} ${data.data.node}`;
                            }
                            break;

                            case 'executing':
                                if (data.data.node === null) {
                                    updateUIForGenerationState(false);
                                    window.appUtils.displayNotification('generation_completed', langConfig);
                                    if (node_status_el) {
                                        node_status_el.textContent = t('finished_status', 'Finished!');
                                    }
                                } else {
                                    if (node_status_el) {
                                        node_status_el.textContent = `${t('executing_status', 'Executing')} ${data.data.node}`;
                                    }
                                }
                                break;

                        case 'executed':
                            // ✅ Call the existing function instead of duplicating logic
                            handleExecutedEvent(data.data);
                            break;

                        case 'execution_error':
                        case 'execution_interrupted':
                            updateUIForGenerationState(false);
                            window.appUtils.displayNotification('prompt_generation_failed', langConfig);
                            break;

                        default:
                            // Ignore
                            break;
                    }
                });
            } else {
                console.warn('Shared WebSocket not available. Is Image AI script loaded?');
            }
    
            updateUIForGenerationState(false);
            updateResetButtonVisibility(false);

            // --- Signal Completion for First-Time Language Sync ---
            // Dispatch a custom event to notify image-ai.js that initialization is complete.
            // This allows image-ai.js to perform post-init tasks like language sync.
            try {
                const initCompleteEvent = new CustomEvent('promptGeneratorTabInitialized', {
                    detail: { message: 'Prompt Generator tab initialization complete.' }
                });
                window.dispatchEvent(initCompleteEvent);
                console.log("[PG-INTERNAL] Custom event 'promptGeneratorTabInitialized' dispatched.");

                // Restore edit instruction
                editInstructionInput = document.querySelector('#edit-instruction-input');
                if (editInstructionInput) {
                    const savedEdit = sessionStorage.getItem('promptGen_editInstruction');
                    if (savedEdit) {
                        editInstructionInput.value = savedEdit;
                    }
                }

                // Restore preset
                presetSelect = document.querySelector('#preset-select');
                if (presetSelect) {
                    const savedPreset = sessionStorage.getItem('promptGen_preset');
                    if (savedPreset) {
                        // Find matching option
                        const optionExists = Array.from(presetSelect.options).some(opt => opt.value === savedPreset);
                        if (optionExists) {
                            presetSelect.value = savedPreset;
                        }
                    }
                }
            } catch (eventError) {
                console.error("[PG-INTERNAL] Failed to dispatch 'promptGeneratorTabInitialized' event:", eventError);
            }

            console.log("Prompt Generator: Tab view initialized successfully.");

        } catch (error) {
            console.error("Prompt Generator: Error during tab initialization:", error);
            // Try to show error in the view if elements are available
            const errorContainer = document.querySelector('#prompt-generation-view');
            if (errorContainer) {
                // Clear previous content
                errorContainer.innerHTML = '';

                // Create outer wrapper
                const outerDiv = document.createElement('div');
                outerDiv.className = 'p-4 sm:p-6';

                // Create inner centered div
                const innerDiv = document.createElement('div');
                innerDiv.className = 'text-center py-10 text-red-500 dark:text-red-400';

                // Create main error message
                const mainP = document.createElement('p');
                mainP.className = 'text-lg';
                mainP.dataset.langKey = 'prompt_generator_init_error';
                mainP.textContent = 'Failed to initialize Prompt Generator. Runtime error.';

                // Create details message
                const detailsP = document.createElement('p');
                detailsP.className = 'text-sm mt-2';
                detailsP.textContent = `Check console for details: ${error.message}`;

                // Append to structure
                innerDiv.appendChild(mainP);
                innerDiv.appendChild(detailsP);
                outerDiv.appendChild(innerDiv);
                errorContainer.appendChild(outerDiv);

                // errorContainer.innerHTML = `
                //     <div class="p-4 sm:p-6">
                //         <div class="text-center py-10 text-red-500 dark:text-red-400">
                //             <p class="text-lg" data-lang-key="prompt_generator_init_error">Failed to initialize Prompt Generator. Runtime error.</p>
                //             <p class="text-sm mt-2">Check console for details: ${error.message}</p>
                //         </div>
                //     </div>
                // `;
            }
            throw error;
        }
    };

    // --- Standalone Initialization (Optional, for prompt-generator.html if used standalone) ---
    // This part might not work as expected for the standalone page anymore due to refactoring.
    // Consider removing it or handling it differently if standalone functionality is needed.   
    // document.addEventListener('DOMContentLoaded', () => {
    //     if (typeof window.initializePromptGeneratorTab === 'function') {
    //         console.log("Prompt Generator: Running standalone initialization via DOMContentLoaded.");
    //         // window.initializePromptGeneratorTab().catch(err => console.error("Standalone init failed:", err));
    //     }
    // });

})(window, document);
