(async (window, document, undefined) => {
    const _ = (selector, context = document) => context.querySelector(selector);
    if (window.__VIDEO_AI_SCRIPT_LOADED) return;
    window.__VIDEO_AI_SCRIPT_LOADED = true;

    // --- Element Selectors ---
    const generateVideoButton = _('#generate-video');
    const interruptVideoButton = _('#interrupt-video');
    const progressBar = _('#main-progress');
    const seedInput = _('#video-seed');
    const isRandomInput = _('#video-is-random');
    const modalCloseButton = _('#modal-close-button');
    const videoResultsContainer = _('#video-results');
    const videoStepsInput = _('#video-steps-input');
    const videoLengthRadioBtn = _('#video-length-presets');
    const videoLengthFramesInput = _('#video-length-frames');
    const videoPromptInput = _('#video-prompt-input');
    const videoSourceImageInput = _("#video-source-image-input");
    const displaySourceImageEl = _("#display-source-image");
    const guideContainer = _("#guide-container");
    const languageSelect = _('#language-select');
    const videoStatusMessage = _('#video-status-message');
    const videoProcessingSpinner = _('#video-processing-spinner');
    const videoPlayer = _('#video-player');
    const videoDownloadLink = _('#video-download-link');
    const nodeStatusEl = _('#current-node-status');
    const videoDimensionRadioBtn = _('#video-dimensions-presets'); // Container for dimension radios
    // const videoCurrentWidthEl = _('#video-current-width'); // Optional
    // const videoCurrentHeightEl = _('#video-current-height'); // Optional

    // --- State Variables ---
    const workflows = {};
    let IS_GENERATING = false;
    let IS_GENERATION_SUCCESSFUL = false;
    let currentLanguage = localStorage.getItem('language') || 'ar'; // Default to 'ar' as in image-ai.js

    // --- Workflow Node Constants (Wan I2V) ---
    const WAN_CLIP_TEXT_ENCODE_NODE = '6';
    const WAN_NEGATIVE_CLIP_TEXT_ENCODE_NODE = '7';
    const WAN_KSAMPLER_HIGH_NODE = '57';
    const WAN_KSAMPLER_LOW_NODE = '58';
    const WAN_IMAGE_TO_VIDEO_NODE = '50';
    const WAN_LOAD_IMAGE_NODE = '52';
    const WAN_MODEL_SAMPLING_HIGH_NODE = '54';
    const WAN_MODEL_SAMPLING_LOW_NODE = '55';

    // --- Workflow Node Constants (Upscale Video) ---
    const UPSCALE_LOAD_IMAGE_SEQ_NODE = '17'; // Load Image Sequence
    const UPSCALE_VIDEO_COMBINE_NODE = '9'; // KMLBDH_VideoCombine

    window.videoGenState = window.videoGenState || {
        uploadedSourceImageFile: null,
        lastUploadedComfyUIName: null,
        lastUploadedFileIdentifier: null,
        generatedVideoPath: null, // To store the path for download/watching
        generatedVideoFilename: null // To store the filename for download
    };

    // --- Constants ---
    const WORKFLOW_PATHS = {
        wan_i2v: './js/wan_i2v.json',
        refine_upscale_video: './js/refine_upscale_video.json'
    };

    const VIDEO_DIMENSION_PRESETS = {
        square: { width: 832, height: 832 }, // Default, matches existing base size
        portrait: { width: 480, height: 832 }, // Flipped: W < H
        landscape: { width: 832, height: 480 } // Flipped: W > H
    };

    // --- ADD: Workflow Progress Tracking ---
    let CURRENT_WORKFLOW_TOTAL_NODES = 0; // Total nodes in the workflow currently running
    let CURRENT_WORKFLOW_FINAL_NODE_ID = null; // ID of the last node expected to execute
    let HAS_RECEIVED_FINAL_VIDEO = false; // <-- Add this flag

    // Language Data (Extending existing)
    // Assuming `languages` object from image-ai.js is available globally or imported
    // If not, you'll need to define it here or import it.
    // For now, let's assume it exists and add new keys.
    // You should add these keys to the `en` and `ar` objects in your main language file or here.
    const videoLanguageKeys = {
        en: {
            video_generation_params_title: "Video Generation Params",
            video_steps_label: "Steps",
            video_length_label: "Video Length",
            length_short: "Short (5s)",
            length_medium: "Medium (10s)",
            video_frames_label: "Frames",
            video_prompt_title: "Video Prompt",
            video_prompt_placeholder: "Describe the action...",
            video_source_image_title: "Source Image",
            generate_video_button: "Generate Video",
            video_guide_title: "How to Generate Your AI Video",
            video_guide_intro: "Welcome to Paltech Hub AI Video Generation! Follow these steps to create your unique video.",
            video_guide_steps_title: "Step-by-Step Guide:",
            video_step1_title: "Define Video Parameters",
            video_step1_desc: "Adjust the seed, steps, and video length (frames) in the \"Video Generation Params\" section.",
            video_step2_title: "Craft Your Prompt",
            video_step2_desc: "In the \"Video Prompt\" section, describe the action or transformation you want applied to the source image.",
            video_step3_title: "Upload Your Source Image",
            video_step3_desc: "Click \"Select Image\" to choose the base image for your video.",
            video_step4_title: "Initiate Generation",
            video_step4_desc: "Click the <strong class=\"text-[#3c32c8]\">🎬 GENERATE VIDEO</strong> button. The system will process your request and generate the initial video.",
            video_step5_title: "Automatic Upscaling & Video Creation",
            video_step5_desc: "Once the initial video frames are generated, the system will automatically upscale them and compile the final video file. You will see a progress bar indicating this process.",
            video_step6_title: "View & Download Your Video",
            video_step6_desc: "The final video will appear in the results area once processing is complete. You can watch it directly or download it.",
            video_guide_footer: "Enjoy creating with Paltech Hub AI Video!",
            video_processing_message: "Processing video...",
            download_video_button: "Download Video",
            video_generation_completed: "Video generation completed.",
            video_generation_interrupted: "Video generation interrupted.",
            video_upscaling_started: "Starting video upscaling...",
            video_upscaling_completed: "Video upscaling completed.",
            video_required: "Please upload a source image.",
            video_prompt_required: "Please enter a video prompt.",
            video_workflow_not_loaded: "Workflow not loaded. Please ensure the workflow JSON is accessible and try again.",
            // Add any other missing keys from image-ai.js that might be used here
            seed_label: "Seed",
            random_checkbox: "Random",
            select_image_button: "Select Image",
            image_preview_placeholder: "Image Preview",
            interrupt_button: "Interrupt",
            modal_notification_title: "Notification",
            modal_close_button: "Close",
            footer_text: "© 2024 Paltech Hub AI v0.1. All rights reserved.",
            ws_connecting_message: "WebSocket connection lost. Attempting to reconnect...",
            ws_max_reconnect_message: "WebSocket connection lost. Max reconnect attempts reached. Please reload the page manually.",
            ws_error_message: "WebSocket connection error. Attempting to reconnect...",
            prompt_queue_failed: "Failed to queue prompt:",
            image_upload_failed: "Image upload failed:",
            generation_interrupted: "Generation interrupted.",
            generation_completed: "Generation completed.",
            processing_status: "Processing:",
            executing_status: "Executing:",
            finished_status: "Finished!",
            interrupted_status: "Interrupted!",
            idle_status: "ComfyUI is idle.",
            reconnect_failed: "Could not reconnect to the server. Please refresh the page.",
            copied_to_clipboard: "Copied to clipboard!",
            uploading_image: "uploading the image",
            upload_image_failed: "Image upload failed.",
            ws_connected_message: "WebSocket connected",
            video_dimensions_title: "Video Dimensions",
            // ... (Ensure all keys used in this script are present)
        },
        ar: {
            // Translate all the above keys to Arabic
            video_generation_params_title: "معلمات توليد الفيديو",
            video_steps_label: "الخطوات",
            video_length_label: "طول الفيديو",
            length_short: "قصير (5 ث)",
            length_medium: "متوسط (10 ث)",
            video_frames_label: "الإطارات",
            video_prompt_title: "مطالبة الفيديو",
            video_prompt_placeholder: "صف الحركة...",
            video_source_image_title: "صورة المصدر",
            generate_video_button: "توليد الفيديو",
            video_guide_title: "كيفية توليد فيديو ذكاء اصطناعي",
            video_guide_intro: "مرحبًا بك في توليد فيديو Paltech Hub AI! اتبع هذه الخطوات لإنشاء فيديو فريد.",
            video_guide_steps_title: "دليل خطوة بخطوة:",
            video_step1_title: "تحديد معلمات الفيديو",
            video_step1_desc: "اضبط البذرة والخطوات وطول الفيديو (الإطارات) في قسم \"معلمات توليد الفيديو\".",
            video_step2_title: "صياغة مطالبتك",
            video_step2_desc: "في قسم \"مطالبة الفيديو\"، صف الحركة أو التحويل الذي تريده على صورة المصدر.",
            video_step3_title: "تحميل صورة المصدر",
            video_step3_desc: "انقر على \"اختر صورة\" لتحديد الصورة الأساسية للفيديو.",
            video_step4_title: "بدء التوليد",
            video_step4_desc: "انقر على زر <strong class=\"text-[#3c32c8]\">🎬 توليد الفيديو</strong>. سيقوم النظام بمعالجة طلبك وتوليد الفيديو الأولي.",
            video_step5_title: "التحسين التلقائي وإنشاء الفيديو",
            video_step5_desc: "بمجرد توليد الإطارات الأولية للفيديو، سيقوم النظام تلقائيًا بتحسينها وترجمة الملف النهائي للفيديو. سترى شريط تقدم يشير إلى هذه العملية.",
            video_step6_title: "عرض وتنزيل الفيديو",
            video_step6_desc: "سيظهر الفيديو النهائي في منطقة النتائج بمجرد اكتمال المعالجة. يمكنك مشاهدته مباشرة أو تنزيله.",
            video_guide_footer: "استمتع بالإبداع مع فيديو Paltech Hub AI!",
            video_processing_message: "جاري معالجة الفيديو...",
            download_video_button: "تنزيل الفيديو",
            video_generation_completed: "اكتمل توليد الفيديو.",
            video_generation_interrupted: "تم مقاطعة توليد الفيديو.",
            video_upscaling_started: "بدء تحسين الفيديو...",
            video_upscaling_completed: "اكتمل تحسين الفيديو.",
            video_required: "الرجاء تحميل صورة مصدر.",
            video_prompt_required: "الرجاء إدخال مطالبة فيديو.",
            video_workflow_not_loaded: "لم يتم تحميل سير العمل. يرجى التأكد من إمكانية الوصول إلى ملف JSON لسير العمل والمحاولة مرة أخرى.",
            // Add translations for other keys...
            seed_label: "البذرة",
            random_checkbox: "عشوائي",
            select_image_button: "اختر صورة",
            image_preview_placeholder: "معاينة الصورة",
            interrupt_button: "إيقاف",
            modal_notification_title: "إشعار",
            modal_close_button: "اغلاق",
            footer_text: "© 2024 Paltech Hub AI v0.1. جميع الحقوق محفوظة.",
            ws_connecting_message: "انقطع الاتصال بالخادم . جاري محاولة إعادة الاتصال...",
            ws_max_reconnect_message: "انقطع اتصال بالخادم. تم الوصول إلى الحد الأقصى لمحاولات إعادة الاتصال. يُرجى إعادة تحميل الصفحة يدويًا.",
            ws_error_message: "خطأ في الاتصال بالخادم. جاري محاولة إعادة الاتصال...",
            prompt_queue_failed: "فشل في اضافة طلبك.:",
            image_upload_failed: "فشل تحميل الصورة:",
            uploading_image: "جاري تحميل الصورة",
            generation_interrupted: "تم مقاطعت عملية التوليد.",
            generation_completed: "تم الانتهاء من عملية التوليد.",
            processing_status: "معالجة:",
            executing_status: "جاري التنفيذ:",
            finished_status: "انتهى!",
            interrupted_status: "تم الإيقاف!",
            idle_status: "ComfyUI خامل حاليا.",
            reconnect_failed: "تعذّر الاتصال بالخادم. يُرجى تحديث الصفحة.",
            copied_to_clipboard: "تم النسخ إلى الحافظة!",
            upload_image_failed: "فشل رفع الصورة",
            ws_connected_message: "تم الاتصال بالخادم",
            video_dimensions_title: "ابعاد الفيديو",
            // ... (Ensure all keys used in this script are present)

        }
    };

    // Merge language keys if needed or assume they are in the main `languages` object
    // Assuming `window.appUtils.langConfig` exists from image-ai.js and contains `languages` and `currentLanguage`
    // If not, you need to set it up here or pass it.
    const langConfig = window.appUtils.langConfig || { languages: videoLanguageKeys, currentLanguage: currentLanguage };
    // Ensure our new keys are added
    Object.keys(videoLanguageKeys).forEach(lang => {
        if (langConfig.languages[lang]) {
            Object.assign(langConfig.languages[lang], videoLanguageKeys[lang]);
        } else {
            langConfig.languages[lang] = videoLanguageKeys[lang];
        }
    });

    // === GLOBAL WEBSOCKET MANAGER ===
    if (!window.sharedWS) {
        window.sharedWS = {
            ws: null,
            client_id: 'page-' + Math.random().toString(36).substring(2, 15),
            ready: false,
            reconnectAttempts: 0,
            MAX_RECONNECT_ATTEMPTS: 5,
            RECONNECT_DELAY_MS: 9000,
            listeners: [],
            _initialized: false, // Prevent double connect

            connect() {
                if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
                    return;
                }

                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                this.ws = new WebSocket(`${protocol}//${window.location.host}/ws?clientId=${this.client_id}`);

                this.ws.onopen = () => {
                    console.log('✅ Global WebSocket connected:', this.client_id);
                    this.ready = true;
                    this.reconnectAttempts = 0;
                    window.appUtils.displayNotification('ws_connected_message', langConfig);
                };

                this.ws.onmessage = (event) => {
                    if (event.data instanceof Blob) return;
                    let data;
                    try {
                        data = JSON.parse(event.data);
                    } catch (e) {
                        console.error('Failed to parse WebSocket message:', e);
                        return;
                    }

                    this.listeners.forEach(({ module, handler }) => {
                        try {
                            handler(data);
                        } catch (err) {
                            console.error(`Error in ${module} WebSocket handler:`, err);
                        }
                    });
                };

                this.ws.onclose = () => {
                    console.warn('❌ WebSocket disconnected. Attempting to reconnect...');
                    this.ready = false;
                    this.ws = null;

                    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
                        this.reconnectAttempts++;
                        setTimeout(() => this.connect(), this.RECONNECT_DELAY_MS);
                        window.appUtils.displayNotification('ws_connecting_message', langConfig);
                    } else {
                        window.appUtils.displayNotification('reconnect_failed', langConfig);
                    }
                };

                this.ws.onerror = (error) => {
                    console.error('🚨 WebSocket Error:', error);
                    window.appUtils.displayNotification('ws_error_message', langConfig);
                };
            },

            addListener(moduleName, handler) {
                this.listeners.push({ module: moduleName, handler });
                if (this.ready && this.ws) {
                    console.log(`👂 ${moduleName} listening to WebSocket`);
                }
            },

            removeListener(moduleName) {
                this.listeners = this.listeners.filter(l => l.module !== moduleName);
            }
        };
    }

    // Connect only once
    if (!window.sharedWS._initialized) {
        window.sharedWS._initialized = true;
        window.sharedWS.connect();
    }

    // --- Utility Functions ---
    function setVideoDimensions(selectedValue) {
        // Use the global workflows object to get the base size if needed,
        // or just use the presets directly.
        // const baseWorkflow = workflows.wan_i2v;
        // const baseWidth = baseWorkflow?.[WAN_EMPTY_LATENT_NODE]?.inputs?.width || 1024;
        // const baseHeight = baseWorkflow?.[WAN_EMPTY_LATENT_NODE]?.inputs?.height || 1024;

        const dimensions = VIDEO_DIMENSION_PRESETS[selectedValue] || VIDEO_DIMENSION_PRESETS.square; // Default to square

        // Update optional display elements if they exist
        // if (videoCurrentWidthEl) videoCurrentWidthEl.textContent = dimensions.width;
        // if (videoCurrentHeightEl) videoCurrentHeightEl.textContent = dimensions.height;

        // Store the selected dimensions in a way the generate function can access them
        // We'll use a temporary property on the window object or a dedicated state variable.
        // Let's add it to videoGenState for clarity.
        window.videoGenState.selectedWidth = dimensions.width;
        window.videoGenState.selectedHeight = dimensions.height;
    }

    function updateLanguageInContext(context, langCode, languagePack) {
        // This function should be in utils.js. If not, copy it from image-ai.js
        // Placeholder call - assuming it exists
        if (window.appUtils && typeof window.appUtils.updateLanguageInContext === 'function') {
             window.appUtils.updateLanguageInContext(context, langCode, languagePack);
        } else {
            console.warn("updateLanguageInContext utility not found.");
        }
    }

    function updateProgress(value, max = 100) {
        if (progressBar) {
            progressBar.style.width = max > 0 ? `${(value / max) * 100}%` : '0%';
        }
    }

    function updateUIForGenerationState(isGenerating, isSuccessfulCompletion = false) {
        IS_GENERATING = isGenerating;
        IS_GENERATION_SUCCESSFUL = isSuccessfulCompletion;

        // --- ADD: Reset progress tracking when generation starts ---
        if (isGenerating) {
            CURRENT_WORKFLOW_TOTAL_NODES = 0;
            CURRENT_WORKFLOW_FINAL_NODE_ID = null;
            HAS_RECEIVED_FINAL_VIDEO = false; // <-- Add this line
            // Reset node counter if it exists
            if (window.videoGenState) {
                window.videoGenState.executedNodeCount = 0;
            }
        }
        // --- END: Reset progress tracking ---

        function toggleDisplay(element, show) {
            if (element) {
                if (show) element.style.display = '';
                else element.style.display = 'none';
            }
        }
        if (generateVideoButton) toggleDisplay(generateVideoButton, !isGenerating);
        if (interruptVideoButton) toggleDisplay(interruptVideoButton, isGenerating);
        const inputs = [
            seedInput, videoPromptInput, videoStepsInput, videoLengthFramesInput,
            videoSourceImageInput, isRandomInput
        ];
        inputs.forEach(input => { if (input) input.disabled = isGenerating; });
        if (!isGenerating && seedInput && isRandomInput) {
            seedInput.disabled = isRandomInput.checked;
        }
        updateProgress(0);
        if(nodeStatusEl) nodeStatusEl.innerText = isGenerating ? langConfig.languages[currentLanguage].processing_status : '';
        if (isGenerating) {
            if (guideContainer) guideContainer.classList.add('hidden');
            if (videoResultsContainer) {
                videoResultsContainer.classList.remove('hidden');
                // Show processing state
                if(videoStatusMessage) videoStatusMessage.classList.remove('hidden');
                if(videoProcessingSpinner) videoProcessingSpinner.classList.remove('hidden');
                if(videoPlayer) videoPlayer.classList.add('hidden');
                if(videoDownloadLink) videoDownloadLink.classList.add('hidden');
                if(videoStatusMessage) videoStatusMessage.textContent = langConfig.languages[currentLanguage].video_processing_message;
            }
        } else {
        // Hide the results container on failure or when stopped.
        // Successful completion will manage its own visibility (showing video/player).
        if (videoResultsContainer) {
             if (IS_GENERATION_SUCCESSFUL) {
                 // If successful, keep results visible (displayVideoResult handles specifics)
                 videoResultsContainer.classList.remove('hidden');
             } else {
                 // If failed or cancelled, hide results and show guide
                 videoResultsContainer.classList.add('hidden');
             }
        }
        // Optionally, ensure guide is shown if it was hidden
        if (guideContainer && !IS_GENERATION_SUCCESSFUL) { // Show guide only if not successful
             guideContainer.classList.remove('hidden');
        }
        // Reset specific result elements to their initial hidden/processing state
        // Only if it's not a successful completion, as displayVideoResult manages that.
        if (!IS_GENERATION_SUCCESSFUL) {
            if(videoStatusMessage) {
                videoStatusMessage.classList.remove('hidden');
                videoStatusMessage.textContent = '';
            }
            if(videoProcessingSpinner) videoProcessingSpinner.classList.remove('hidden'); // Keep spinner visible if needed for next start?
            if(videoPlayer) videoPlayer.classList.add('hidden');
            if(videoDownloadLink) videoDownloadLink.classList.add('hidden');
        }
        // The original comment's intent might have been to keep results if successful,
        // but the successful path (displayVideoResult) handles that.
        // This else block now correctly handles the failure/reset case.
        
        // Reset progress bar and node status
        updateProgress(0);
        if(nodeStatusEl) nodeStatusEl.innerText = '';
     }
    }

    function getImageOrientation(imgElement) {
        if (!imgElement) return null;
        
        const width = imgElement.naturalWidth || imgElement.width;
        const height = imgElement.naturalHeight || imgElement.height;
        
        if (width > height) {
            return 'landscape';
        } else if (height > width) {
            return 'portrait';
        } else {
            return 'square';
        }
    }

    function handleImagePreview(file) {
        window.videoGenState.uploadedSourceImageFile = file;
        if (!displaySourceImageEl) return;
        if (window.videoGenState.uploadedSourceImageFile) {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    const orientation = getImageOrientation(img);
                    window.videoGenState.imageOrientation = orientation;
                    updateUIBasedOnImageOrientation();
                    displaySourceImageEl.style.backgroundImage = `url(${reader.result})`;
                    displaySourceImageEl.innerHTML = '';
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(window.videoGenState.uploadedSourceImageFile);
        } else {
            displaySourceImageEl.style.backgroundImage = 'none';
            displaySourceImageEl.innerHTML = `<span class="text-gray-500 dark:text-gray-400" data-lang-key="image_preview_placeholder">${langConfig.languages[currentLanguage].image_preview_placeholder}</span>`;
        }
    }

    function setVideoLength(selectedValue) {
        if (!videoLengthFramesInput) return;
        switch (selectedValue) {
            case 'short':
                videoLengthFramesInput.value = 81;
                break;
            case 'medium':
            default:
                videoLengthFramesInput.value = 101;
                break;
        }
    }

    function displayVideoResult(videoPath, filename) {
        if (!videoPlayer || !videoDownloadLink) return;
        // Set video source
        videoPlayer.src = videoPath; // This should be a path the browser can access, e.g., /view?...
        videoPlayer.load(); // Reload the video element
        // Set download link
        videoDownloadLink.href = videoPath;
        videoDownloadLink.download = filename || 'generated_video.mp4'; // Suggest a filename

        // Update UI
        if(videoStatusMessage) videoStatusMessage.classList.add('hidden');
        if(videoProcessingSpinner) videoProcessingSpinner.classList.add('hidden');
        videoPlayer.classList.remove('hidden');
        videoDownloadLink.classList.remove('hidden');
        if(videoStatusMessage) videoStatusMessage.textContent = ""; // Clear message
    }


    // --- Workflow Loading ---
    async function load_api_workflows() {
        for (let key in WORKFLOW_PATHS) {
            try {
                let response = await window.appUtils.fetchWithTimeout(WORKFLOW_PATHS[key], {}, 8000);
                if (!response.ok) {
                    throw new Error(`Failed to load workflow ${WORKFLOW_PATHS[key]}: ${response.status} ${response.statusText}`);
                }
                workflows[key] = await response.json();
                console.log(`Workflow ${key} loaded successfully.`);
            } catch (error) {
                console.error(`Error loading workflow ${key}:`, error);
                workflows[key] = {};
                window.appUtils.displayModalMessage(`${langConfig.languages[currentLanguage].video_workflow_not_loaded} (${key})`, langConfig);
            }
        }
        return workflows;
    }

    // --- Main Generation Logic ---
    async function generateVideo() {
        if (IS_GENERATING) return;
        if (!videoPromptInput.value.trim()) {
            window.appUtils.displayNotification('video_prompt_required', langConfig);
            updateUIForGenerationState(false);
            return;
        }
        if (!window.videoGenState.uploadedSourceImageFile) {
            window.appUtils.displayNotification('video_required', langConfig);
            updateUIForGenerationState(false);
            return;
        }

        updateUIForGenerationState(true);
        if (!workflows || !workflows.wan_i2v) {
            window.appUtils.displayModalMessage('video_workflow_not_loaded', langConfig);
            updateUIForGenerationState(false);
            return;
        }

        try {
            // --- Step 1: Upload Source Image ---
            const comfyUIImageName = await window.appUtils.uploadImage(
                window.videoGenState.uploadedSourceImageFile,
                'uploading_image', // Reuse key, or add specific one
                langConfig
            );
            if (!comfyUIImageName) {
                updateUIForGenerationState(false);
                window.appUtils.displayModalMessage('upload_image_failed', langConfig);
                return;
            }
            window.videoGenState.lastUploadedComfyUIName = comfyUIImageName;

            // --- Step 2: Prepare Wan I2V Workflow ---
            let wf_wan_i2v = JSON.parse(JSON.stringify(workflows.wan_i2v));

            // --- ADD: Track Wan I2V Workflow Info Before Queueing ---
            // Estimate total nodes (roughly nodes array length)
            const totalNodesWanI2V = Object.keys(wf_wan_i2v).length;
            // Assume the final save node is 163 (based on previous discussions and workflow)
            const finalNodeIdWanI2V = '163';
            console.log(`Prepared Wan I2V workflow. Estimated total nodes: ${totalNodesWanI2V}, Final node ID: ${finalNodeIdWanI2V}`);
            // --- END: Track Wan I2V Workflow Info ---

            if(wf_wan_i2v[WAN_CLIP_TEXT_ENCODE_NODE]) {
                wf_wan_i2v[WAN_CLIP_TEXT_ENCODE_NODE].inputs.text = videoPromptInput.value;
            }
            if(isRandomInput && isRandomInput.checked && seedInput) {
                seedInput.value = Math.floor(Math.random() * 1e15);
            }
            if(wf_wan_i2v[WAN_KSAMPLER_HIGH_NODE]) {
                wf_wan_i2v[WAN_KSAMPLER_HIGH_NODE].inputs.noise_seed = parseInt(seedInput.value);
                wf_wan_i2v[WAN_KSAMPLER_HIGH_NODE].inputs.steps = parseInt(videoStepsInput.value);
            }
            if(wf_wan_i2v[WAN_KSAMPLER_LOW_NODE]) {
                 wf_wan_i2v[WAN_KSAMPLER_LOW_NODE].inputs.noise_seed = parseInt(seedInput.value); // Use same seed?
                 wf_wan_i2v[WAN_KSAMPLER_LOW_NODE].inputs.steps = parseInt(videoStepsInput.value);
            }
            if(wf_wan_i2v[WAN_IMAGE_TO_VIDEO_NODE]) {
                wf_wan_i2v[WAN_IMAGE_TO_VIDEO_NODE].inputs.length = parseInt(videoLengthFramesInput.value);
                wf_wan_i2v[WAN_IMAGE_TO_VIDEO_NODE].inputs.width = window.videoGenState.selectedWidth || VIDEO_DIMENSION_PRESETS.square
                wf_wan_i2v[WAN_IMAGE_TO_VIDEO_NODE].inputs.height = window.videoGenState.selectedHeight || VIDEO_DIMENSION_PRESETS.square; // Fallback
                // Width/Height? Assuming defaults or handled by node. If needed, set here.
            }
            if (wf_wan_i2v[WAN_LOAD_IMAGE_NODE]) {
                 wf_wan_i2v[WAN_LOAD_IMAGE_NODE].inputs.image = comfyUIImageName;
            }
            
            // Model Sampling Shift? Assuming default or handled. If needed, adjust nodes 54 & 55.

            console.log("Queueing Wan I2V workflow...");
            await window.appUtils.queuePrompt(wf_wan_i2v, window.sharedWS.client_id);
            console.log("Wan I2V workflow queued.");

            // --- ADD: Update Progress Tracking After Queueing ---
            CURRENT_WORKFLOW_TOTAL_NODES = totalNodesWanI2V;
            CURRENT_WORKFLOW_FINAL_NODE_ID = finalNodeIdWanI2V;
            updateProgress(0, CURRENT_WORKFLOW_TOTAL_NODES); // Initialize progress bar
            // --- END: Update Progress Tracking ---

            // --- Step 3: Wait for Wan I2V Completion and Get Output Path ---
            // This is tricky without knowing the exact output node or filename format.
            // The `Save Images Mikey` node (163) saves the images.
            // We need to listen for the `executed` event that corresponds to this save node
            // or infer the path from the `executed` event of the final processing node (158).
            // Let's assume we listen for the `Save Images Mikey` output or a specific message.
            // For simplicity here, we'll wait for a specific node execution to finish and then trigger upscale.

            // A more robust way is to have the backend send a custom message or modify the workflow
            // to output the path explicitly. For now, we'll use a promise-based wait within the WS listener.

            // --- Step 4 & 5: Trigger Upscale Workflow (Handled in WS Listener) ---
            // The actual upscale trigger and video creation will happen in the WebSocket listener
            // once the initial video generation is confirmed complete.

        } catch (error) {
            console.error("Video generation error:", error);
            window.appUtils.displayModalMessage(`${error.message || langConfig.languages[currentLanguage].prompt_queue_failed}`, langConfig);
            updateUIForGenerationState(false);
        }
    }

    // --- WebSocket Listener for Video Generation ---
    window.sharedWS.addListener('video-generator', function(data) {
        // const nodeStatusEl = document.querySelector('#current-node-status'); // Already defined globally
        const t = (key, fallback) => langConfig.languages[currentLanguage]?.[key] || fallback;

        switch (data.type) {
            case 'progress':
                // updateProgress(data.data.value, data.data.max);
                if (data.data.node && nodeStatusEl) {
                    nodeStatusEl.textContent = `${t('processing_status', 'Processing')} ${data.data.node}`;
                }
                break;
            case 'executing':
                if (data.data.node === null) {
                    // Queue item finished execution.
                } else {
                    if (nodeStatusEl) {
                        nodeStatusEl.textContent = `${t('executing_status', 'Executing')} ${data.data.node}`;
                    }
                    
                    // Estimate progress: If we know the total nodes, update the bar
                    // This assumes nodes execute roughly in order or that we get messages for most nodes.
                    if (CURRENT_WORKFLOW_TOTAL_NODES > 0 && !HAS_RECEIVED_FINAL_VIDEO) {
                        // Simple estimation: increment progress for each node start.
                        // A more complex method could try to map node IDs to an order if needed,
                        // but this is a reasonable starting point.
                        // We need to track how many nodes have started.
                        // Let's add a simple counter to window.videoGenState or as a local var in this scope/context.
                        // For simplicity here, we'll just increment a counter each time 'executing' is called
                        // for a non-null node, up to total nodes - 1 (as the last node triggers completion).
                        // Let's add a counter to videoGenState.
                        window.videoGenState.executedNodeCount = (window.videoGenState.executedNodeCount || 0) + 1;
                        
                        // Cap progress at Total Nodes - 1 to leave final jump for completion
                        const progressValue = Math.min(window.videoGenState.executedNodeCount, CURRENT_WORKFLOW_TOTAL_NODES - 1);
                        updateProgress(progressValue, CURRENT_WORKFLOW_TOTAL_NODES);
                        console.log(`Estimated progress: ${progressValue}/${CURRENT_WORKFLOW_TOTAL_NODES} (Node: ${data.data.node})`);
                    }
                    // --- END: Update progress based on node execution ---
                }
                break;
            case 'executed':
                console.log("Executed data received:", data);
                // --- MODIFIED BLOCK STARTS HERE ---
                // Check if this execution corresponds to the final save node of the *initial* workflow (Wan I2V)
                // Node 163 is 'Save Images Mikey' in wan_i2v.json. It saves the generated frames.
                // Assuming paths are correctly configured in nodes, we just need to trigger upscale.
                if (data.data.node === '163' && IS_GENERATING && data.data.output?.images?.length > 0) {
                    console.log("Initial video frames saved by 'Save Images Mikey' (Node 163). Triggering upscale workflow.");

                    // --- Step 4: Trigger Upscale Workflow ---
                    if (workflows.refine_upscale_video) {
                        window.appUtils.displayNotification('video_upscaling_started', langConfig);
                        if(nodeStatusEl) nodeStatusEl.textContent = t('video_upscaling_started', 'Starting video upscaling...');
                        let wf_upscale = JSON.parse(JSON.stringify(workflows.refine_upscale_video));
                        // No path update needed - nodes are assumed correctly configured
                        console.log("Queueing upscale workflow...");
                         
                        // --- ADD: Track Upscale Workflow Info Before Queueing ---
                        const totalNodesUpscale = Object.keys(wf_upscale).length;
                        // Assume the final save node is 9 (based on previous discussions and workflow)
                        const finalNodeIdUpscale = '9';
                        console.log(`Prepared Upscale workflow. Estimated total nodes: ${totalNodesUpscale}, Final node ID: ${finalNodeIdUpscale}`);
                        // --- END: Track Upscale Workflow Info ---

                        window.appUtils.queuePrompt(wf_upscale, window.sharedWS.client_id)
                        .then(() => {
                            // --- ADD: Update Progress Tracking After Queueing Upscale ---
                            CURRENT_WORKFLOW_TOTAL_NODES = totalNodesUpscale;
                            CURRENT_WORKFLOW_FINAL_NODE_ID = finalNodeIdUpscale;
                            window.videoGenState.executedNodeCount = 0; // Reset counter for new workflow
                            updateProgress(0, CURRENT_WORKFLOW_TOTAL_NODES); // Initialize progress bar for upscale
                            console.log("Upscale workflow queued and progress tracking updated.");
                            // --- END: Update Progress Tracking ---
                        })
                        .catch(err => {
                            console.error("Error queuing upscale workflow:", err);
                            window.appUtils.displayModalMessage(`Upscale queue failed: ${err.message}`, langConfig);
                            updateUIForGenerationState(false);
                        });
                    } else {
                        console.error("Upscale workflow not loaded.");
                        window.appUtils.displayModalMessage('Upscale workflow not loaded.', langConfig);
                        updateUIForGenerationState(false);
                    }
                }
                // Check if this execution corresponds to the final save node of the *upscale* workflow
                // Node 9 is 'KMLBDH_VideoCombine' in refine_upscale_video.json. It saves the final video.
                if (data.data.node === '9' && IS_GENERATING && data.data.output?.video?.length > 0) { 
                    console.log("Final video saved by 'KMLBDH_VideoCombine' (Node 9).");
                    // Extract the video file path
                    const videoOutput = data.data.output.video[0];

                    if (videoOutput.filename) {
                        // Construct the URL to view/download the video
                        // Assuming it's saved in the 'output' directory and accessible via /view
                        const videoPath = `/view?filename=${encodeURIComponent(videoOutput.filename)}&subfolder=${encodeURIComponent(videoOutput.subfolder || '')}&type=${encodeURIComponent(videoOutput.type || 'output')}`;
                        window.videoGenState.generatedVideoPath = videoPath;
                        window.videoGenState.generatedVideoFilename = videoOutput.filename.split('/').pop(); // Get filename part
                        console.log("Final video path:", videoPath);

                        // --- ADD: Set the flag BEFORE starting UI updates ---
                        HAS_RECEIVED_FINAL_VIDEO = true; // <-- Add this line
                        console.log("HAS_RECEIVED_FINAL_VIDEO flag set to true.");
                        // --- END: Set flag ---

                        // --- Display Video and Update UI for Success ---
                        // 1. Display the video player and download link
                        displayVideoResult(videoPath, window.videoGenState.generatedVideoFilename);
                        // Set progress to 100% upon final node completion
                        if (CURRENT_WORKFLOW_TOTAL_NODES > 0) {
                            updateProgress(CURRENT_WORKFLOW_TOTAL_NODES, CURRENT_WORKFLOW_TOTAL_NODES);
                            console.log("Progress set to 100% on final node completion.");
                        }
                        // 2. Update UI state: Not generating anymore, AND mark as successful
                        updateUIForGenerationState(false, true);
                        // 3. Show notification
                        window.appUtils.displayNotification('video_generation_completed', langConfig);
                        // 4. Update node status
                        if (nodeStatusEl) {
                            nodeStatusEl.textContent = t('finished_status', 'Finished!');
                        }
                        // --- End Display Video ---
                        // updateUIForGenerationState(false); // Hide spinner, show player/link
                        // window.appUtils.displayNotification('video_generation_completed', langConfig);
                        // if (nodeStatusEl) {
                        //     nodeStatusEl.textContent = t('finished_status', 'Finished!');
                        // }
                        // displayVideoResult(videoPath, window.videoGenState.generatedVideoFilename);
                    } else {
                        console.warn("Could not determine final video path from executed data.");
                        HAS_RECEIVED_FINAL_VIDEO = true; // <-- Add this line
                        updateUIForGenerationState(false, false);
                        window.appUtils.displayModalMessage('Could not retrieve final video.', langConfig);
                    }
                }
                // --- MODIFIED BLOCK ENDS HERE ---
                break;
            case 'execution_error':
            case 'execution_interrupted':
                updateProgress(0);
                updateUIForGenerationState(false, false);
                window.appUtils.displayNotification('video_generation_interrupted', langConfig);
                if (nodeStatusEl) {
                    nodeStatusEl.textContent = t('interrupted_status', 'Interrupted!');
                }
                break;
            case 'execution_success': // Handle the success message if needed
                // This message signifies the overall workflow queue item finished successfully.
                // It arrives after the final 'executed' message for the last node.
                // Ensure the UI reflects successful completion if we were generating.
                // Although the 'executed' for node 9 should handle it, this is a backup.
                if (IS_GENERATING) {
                    console.log("Received 'execution_success', finalizing UI state as successful.");
                    // Ensure progress is full
                    if (CURRENT_WORKFLOW_TOTAL_NODES > 0) {
                        updateProgress(CURRENT_WORKFLOW_TOTAL_NODES, CURRENT_WORKFLOW_TOTAL_NODES);
                    }
                    updateUIForGenerationState(false, true); // Mark as not generating AND successful
                }
                break;
            case 'progress_state': // Same for progress_state
                console.log('Unknown WS message type (video gen):', data.type);
                break;
            case 'status':
                const isProcessing = data.data.status?.exec_info?.queue_remaining > 0;
                // updateUIForGenerationState(isProcessing); // Don't override our specific video state logic
                if (!IS_GENERATING && isProcessing) {
                    // This might trigger if another process starts, but we are not generating.
                    console.log(t('idle_status', 'System is idle (or another process started).'));
                }
                break;
            default:
                console.log('Unknown WS message type (video gen):', data.type);
        }
    });

    // --- Event Listeners ---
    if (generateVideoButton) {
        generateVideoButton.addEventListener('click', generateVideo);
    }
    if (interruptVideoButton) {
        interruptVideoButton.addEventListener('click', () => {
             // Simple interrupt POST, relies on backend handling and WS messages
             fetch('/interrupt', { method: 'POST' }).catch(err => console.error("Interrupt request failed:", err));
        });
    }
    if (videoLengthRadioBtn) {
        videoLengthRadioBtn.addEventListener('change', e => {
            if (e.target.name === 'video-length') setVideoLength(e.target.value);
        });
    }
    if (videoSourceImageInput) {
        videoSourceImageInput.addEventListener('change', function () {
            handleImagePreview(this.files ? this.files[0] : null);
        });
    }
    if (modalCloseButton) {
        modalCloseButton.addEventListener('click', () => window.appUtils.displayModalMessage('', langConfig, false));
    }
    if (isRandomInput) {
        isRandomInput.addEventListener('change', () => {
            if (seedInput) seedInput.disabled = isRandomInput.checked;
        });
    }
    
    // --- ADD THIS NEW BLOCK ---
    // Update UI based on image orientation
    function updateUIBasedOnImageOrientation() {
        const orientation = window.videoGenState.imageOrientation;
        if (!orientation) return;
        console.log('ori', orientation);
        // Find the corresponding radio button
        const dimensionRadio = _(`input[name="video-dimensions"][value="${orientation}"]`);
        if (dimensionRadio) {
            dimensionRadio.checked = true;
            setVideoDimensions(orientation);
        }
    }

    // --- Initial Load ---
    document.addEventListener('DOMContentLoaded', async () => {
        // Setup common UI elements (theme, language, back button)
        const themeToggle = _('#theme-toggle');
        const themeIcon = _('#theme-icon');
        const backButton = _('#back-button');
        window.appUtils.themeSwitcher(themeToggle, themeIcon);

        if (languageSelect) {
            languageSelect.addEventListener('change', (event) => {
                console.log('Language changed:', event.target.value);
                const langCode = event.target.value;
                window.appUtils.setLanguage(langCode, langConfig, () => {
                    // Callback after language is set, if needed
                });
            });
        }

        if (backButton) {
            backButton.addEventListener('click', () => window.location.href = 'index.html'); // Adjust if needed
        }

        // Set initial language
        window.appUtils.setLanguage(langConfig.currentLanguage, langConfig, () => {});

        // Set initial video length
        setVideoLength(_('input[name="video-length"]:checked')?.value || 'short');

        // --- ADD THIS BLOCK ---
        // Set initial video dimensions
        setVideoDimensions(_('input[name="video-dimensions"]:checked')?.value || 'square');
        // Add event listener for dimension changes
        if (videoDimensionRadioBtn) {
            videoDimensionRadioBtn.addEventListener('change', e => {
                if (e.target.name === 'video-dimensions') {
                    setVideoDimensions(e.target.value);
                }
            });
        }

        // Load workflows
        await load_api_workflows();

        // Initial UI state
        updateUIForGenerationState(false);
        if (seedInput && isRandomInput) {
            seedInput.disabled = isRandomInput.checked;
        }
    });

})(window, document);
