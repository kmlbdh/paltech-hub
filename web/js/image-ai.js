(async (window, document, undefined) => {
    const _ = (selector, contex = document) => contex.querySelector(selector);

    if (window.__IMAGE_AI_SCRIPT_LOADED) return;
        window.__IMAGE_AI_SCRIPT_LOADED = true;

    const generate = _('#generate');
    const interrupt_button = _('#interrupt');
    const progressbar = _('#main-progress');
    const seed_input = _('#main-seed');
    const is_random_input = _('#is-random');

    const modalCloseButton = _('#modal-close-button');
    const results = _('#results');
    const batch_size_input = _('#batch-size-input');
    const guidance_scale_input = _('#guidance-scale-input');
    const guidance_scale_value_el = _('#guidance-scale-value');
    const prompt_input = _('#prompt-input');
    // const img_height_input = _('#image-height');
    // const img_width_input = _('#image-width');

    const image_input_1 = _("#image-input-1");
    const image_input_2 = _("#image-input-2");
    const display_uploaded_image_el_1 = _("#display-uploaded-image-1");
    const display_uploaded_image_el_2 = _("#display-uploaded-image-2");

    // const image_size_radioBtn = _("#image-dimension-presets");
    const node_status_el = _('#current-node-status');
    const guideContainer = _("#guide-container");

    const languageSelect = _('#language-select');
    const clearHistoryButton = _('#clear-history-button');

    // --- Element Selectors (Prompt Generation Tab) ---
    const tabButtons = document.querySelectorAll('.tab-button-link'); // Updated selector
    const imageGenerationView = _('#image-generation-view');
    const promptGenerationView = _('#prompt-generation-view');
    const promptGeneratorLoadingIndicator = promptGenerationView?.querySelector('[data-lang-key="prompt_generator_loading"]');

    // Turkish WOW elements
    const enableTurkishWowCheckbox = _('#enable-turkish-wow');
    const turkishWowControls = _('#turkish-wow-controls');
    // Custom dropdown elements
    const poseSelectButton = _('#custom-pose-select-button');
    const selectedPoseText = _('#selected-pose-text');
    const poseSelectValueInput = _('#pose-select-value');
    const posesModal = _('#poses-modal');
    const posesModalList = _('#poses-modal-list');

    const img_megapixel_input = _('#image-megapixel');
    const img_aspect_ratio_select = _('#image-aspect-ratio');
    const display_width_el = _('#display-width');
    const display_height_el = _('#display-height');
    const calculated_dimensions_el = _('#calculated-dimensions');

    // const posesModalCloseButton = _('#poses-modal-close-button');
    let posesData = []; // To store the loaded poses from poses.json

    // --- State Variables ---
    const workflows = {};
    let IS_GENERATING = false;

    // --- Workflow Node Constants (Updated for your workflow) ---
    const QWEN_CLIP_TEXT_ENCODE_POSITIVE_NODE = '97'; // TextEncodeQwenImageEdit (Positive)
    const QWEN_CLIP_TEXT_ENCODE_NEGATIVE_NODE = '98'; // TextEncodeQwenImageEdit (Negative)
    const K_SAMPLER_NODE = '3';
    const EMPTY_LATENT_IMAGE_NODE = '109'; // EmptySD3LatentImage
    const FLUX_RESOLUTION_NODE = '108'; // FluxResolutionNode
    const LOAD_IMAGE_NODE_1 = '110'; // LoadImage for Model/Clothes 1
    const LOAD_IMAGE_NODE_2 = '113'; // LoadImage for Clothes 2
    const IMAGE_STITCH_NODE = '111'; // ImageStitch
    const CFG_NORM_NODE = '102'; // CFGNorm
    // Add more if needed for steps, scheduler, etc.

    window.imageGenState = window.imageGenState || {
        uploadedImageFile1: null, // For Model/Clothes 1
        uploadedImageFile2: null, // For Clothes 2
        lastUploadedComfyUIName1: null,
        lastUploadedComfyUIName2: null,
        lastUploadedFileIdentifier1: null,
        lastUploadedFileIdentifier2: null
    };

    let activeView = 'image-generation';
    let promptGeneratorLoaded = false; // Tracks if prompt gen content is loaded
    let currentLanguage = localStorage.getItem('language') || 'ar'; // Changed default to 'ar'

    // --- Constants ---
    const SESSION_HISTORY_KEY = 'imagePromptHistory';
    const WORKFLOW_PATHS = {
        qwen_edit: '/js/qwen_edit_2imgs.json',
        flux_kontext: '/js/flux-kontext-rosmary.json',
        flux_kontext_model: '/js/flux-kontext-model.json'
        // flux_kontext: '/paltech/js/flux-kontext.json',
        // flux_kontext_model: '/paltech/js/flux-kontext-model.json'
    };
    // const POSES_FOLDER = '/paltech/js/';
    const POSES_FOLDER = './js/';
    const POSES_JSON_PATH = POSES_FOLDER + 'poses.json';
    const PROMPT_GENERATOR_JS_PATH = './js/prompt-generator.js'; // Ensure this path is correct relative to image-ai.html

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
            generation_completed: "Generation completed.",
            processing_status: "Processing:",
            executing_status: "Executing:",
            finished_status: "Finished!",
            interrupted_status: "Interrupted!",
            idle_status: "ComfyUI is idle.",
            reconnect_failed: "Could not reconnect to the server. Please refresh the page.",
            footer_text: "© 2024 Paltech Hub AI v0.1. All rights reserved.",
            copied_to_clipboard: "Copied to clipboard!",
            customized_prompt_title: "Customized Prompt",
            enable_custom_poses: "Enable Custom Poses",
            pose_select_label: "Select a Pose",
            select_pose_placeholder: "-- Select a Pose --",
            failed_load_poses_json: "Failed to load pose data. Please check the poses.json file.",
            guidance_scale_label: "Guidance Scale",
            guidance_scale_tooltip: "Higher values result in images that more closely match the prompt but may lack some creativity. Lower values result in images that are less closely matched to the prompt but may be more creative.",
            // Tab Navigation
            tab_image_generation: "Image Generation",
            tab_prompt_generation: "Prompt Generation",
            prompt_generator_loading: "Loading Prompt Generator...",
            prompt_generator_load_error: "Failed to load Prompt Generator. Please try again later.",
            prompt_generator_init_error: "Failed to initialize Prompt Generator. Please try again later.",

            prompt_generator_title: "Prompt Generator",
            prompt_generator_intro: "Generate AI prompts based on an image and your instructions.",
            edit_instruction_title: "Edit Instruction",
            edit_instruction_placeholder: "Describe how you want to modify the image...",
            image_upload_title: "Image To Upload",
            select_image_button: "Select Image",
            generate_prompt_button: "Generate Prompt",
            generated_prompt_title: "Generated Prompt",
            prompt_result_placeholder: "Generated prompt will appear here...",
            prompt_output_label: "Prompt Output (Editable):",
            copied_to_clipboard: "Copied to clipboard!",
            copy_to_clipboard: "Copy",
            use_prompt_in_image_ai: "Use in Image AI",
            image_generation_workflow_not_loaded: "Workflow not loaded. Please ensure the workflow JSON is accessible and try again.",
            prompt_generation_workflow_not_loaded: "Prompt generation workflow not loaded. Please check the path and server status.",
            prompt_history_title: "Prompt History",
            prompt_history_empty_message: "No prompt history yet.",
            clear_prompt_history_button: "Clear History",
            // Preset Selection (Ensure these match prompt-generator.js keys)
            preset_selection_title: "Preset Selection",
            select_preset_label: "Choose a Preset:",
            preset_kid_clothes: "Kid Clothes",
            preset_womens_clothes: "Women’s Clothes",
            preset_beauty_product_use: "Beauty Product Use",
            preset_beauty_product_display: "Beauty Product Display",
            // Tab Navigation

            uploading_image: "Uploading image...",
            prompt_required: "Please enter a prompt.",
            image_required: "Please upload an image.",

            ws_connected_message: "WebSocket connected",

            clothes_upload_title: "Clothes",
            select_clothes_button: "choose clothes' image",
            clothes_image_preview_placeholder: "Clothes Image Preview",
            clothes_image_upload_title: "Upload Clothes Image",

            model_upload_title: "Model",
            select_model_button: "choose model's image",
            model_image_preview_placeholder: "Model Image Preview",
            model_image_upload_title: "Upload Model Image",

            aspect_ratio: "Aspect Ratio",
            megapixel: "Megapixel",

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
            generation_completed: "تم الانتهاء من عملية التوليد.",
            processing_status: "معالجة:",
            executing_status: "جاري التنفيذ:",
            finished_status: "انتهى!",
            interrupted_status: "تم الإيقاف!",
            idle_status: "ComfyUI خامل حاليا.",
            reconnect_failed: "تعذّر الاتصال بالخادم. يُرجى تحديث الصفحة.",
            footer_text: "© 2024 Paltech Hub AI v0.1. جميع الحقوق محفوظة.",
            copied_to_clipboard: "تم النسخ إلى الحافظة!",
            customized_prompt_title: "مطالبة مخصصة",
            enable_custom_poses: "تفعيل وضعيات المودل (الملابس)",
            pose_select_label: "اختر وضعية المودل",
            select_pose_placeholder: "-- اختر وضعية المودل --",
            failed_load_poses_json: "فشل في تحميل  ملف الوضعيات. يُرجى التأكد من توفر ملف الوضعيات في مسار صحيح.",
            guidance_scale_label: "مقياس قوةالمطالبة",
            guidance_scale_tooltip: "القيم الأعلى تؤدي إلى صور تتطابق بشكل وثيق مع المطالبة ولكنها قد تفتقر إلى بعض الإبداع. القيم الأقل تؤدي إلى صور أقل تطابقًا مع المطالبة ولكنها قد تكون أكثر إبداعًا.",
            // Tab Navigation
            tab_image_generation: "توليد الصور",
            tab_prompt_generation: "توليد المطالبات",
            prompt_generator_loading: "جارٍ تحميل مولد المطالبات...",
            prompt_generator_load_error: "فشل في تحميل مولد المطالبات. يُرجى المحاولة مرة أخرى لاحقًا.",
            prompt_generator_init_error: "فشل في تهيئة مولد المطالبات. يُرجى المحاولة مرة أخرى لاحقًا.",

            // Prompt Generator Tab UI Text
            prompt_generator_title: "مولد المطالبات",
            prompt_generator_intro: "أنشئ مطالبات ذكاء اصطناعي بناءً على صورة وتعليماتك.",
            edit_instruction_title: "تعليمات التعديل",
            edit_instruction_placeholder: "صف كيف تريد تعديل الصورة...",
            image_upload_title: "تحميل الصورة",
            select_image_button: "اختر صورة",
            generate_prompt_button: "توليد المطالبة",
            interrupt_button: "إيقاف",
            generated_prompt_title: "المطالبة المولدة",
            prompt_result_placeholder: "ستظهر المطالبة المولدة هنا...",
            prompt_output_label: "إخراج المطالبة (قابل للتحرير):",
            copied_to_clipboard: "تم النسخ إلى الحافظة!",
            copy_to_clipboard: "نسخ",
            use_prompt_in_image_ai: "استخدام في صور الذكاء الاصطناعي",
            image_generation_workflow_not_loaded: "لم يتم تحميل مسار عمل توليد الصور. يرجى التحقق من المسار وحالة الخادم.",
            prompt_generation_workflow_not_loaded: "لم يتم تحميل مسار عمل توليد المطالبات. يرجى التحقق من المسار وحالة الخادم.",
            prompt_history_title: "سجل المطالبات",
            prompt_history_empty_message: "لا يوجد سجل مطالبات حتى الآن.",
            clear_prompt_history_button: "مسح السجل",
            // Preset Selection (Ensure these match prompt-generator.js keys)
            preset_selection_title: "اختيار الإعدادات المسبقة",
            select_preset_label: "اختر إعدادًا مسبقًا:",
            preset_kid_clothes: "ملابس الأطفال",
            preset_womens_clothes: "ملابس النساء",
            preset_beauty_product_use: "استخدام منتج تجميل",
            preset_beauty_product_display: "عرض منتج تجميل",

            uploading_image: "جاري تحميل الصورة...",
            prompt_required: "الرجاء إدخال مطالبة.",
            image_required: "الرجاء تحميل صورة.",

            ws_connected_message: "تم الاتصال بالخادم",

            clothes_upload_title: "ملابس",
            select_clothes_button: "اختر صورة للملابس",
            clothes_image_preview_placeholder: "معاينة الصورة الملابس",
            clothes_image_upload_title: "تحميل صورة الملابس",

            model_upload_title: "المودل",
            select_model_button: "اختر صورة للمودل",
            model_image_preview_placeholder: "معاينة الصورة المودل",
            model_image_upload_title: "تحميل صورة المودل",

            aspect_ratio: "نسبة العرض إلى الارتفاع",
            megapixel: "الميغابكسل",
        }
    };

    const langConfig = { languages, currentLanguage };

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
    
    async function loadSharedContent() {
        try {
            // Load header
            const headerResponse = await fetch('common_header.html');
            if (!headerResponse.ok) throw new Error('Failed to load common_header.html');
            const headerHtml = await headerResponse.text();
            const headerPlaceholder = _('#header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = headerHtml;
            }

            // Load footer
            const footerResponse = await fetch('common_footer.html');
            if (!footerResponse.ok) throw new Error('Failed to load common_footer.html');
            const footerHtml = await footerResponse.text();
            const footerPlaceholder = _('#footer-placeholder');
            console.log('Footer HTML fetched:', footerHtml); // Debugging log
            if (footerPlaceholder) {
                footerPlaceholder.innerHTML = footerHtml;
                console.log('Footer placeholder innerHTML after insertion:', footerPlaceholder.innerHTML); // Debugging log
            }            

        } catch (error) {
            console.error('Error loading shared content:', error);
            // Potentially display a user-friendly error message
        }
    }

    // --- Dimension Calculation and Display ---
    function calculateAndDisplayDimensions() {
        // Get values from inputs
        const megapixel = parseFloat(img_megapixel_input.value) || 1.0; // Default to 1.0 if invalid
        const aspectRatioStr = img_aspect_ratio_select.value;
        let [wRatio, leftText] = aspectRatioStr.split(':');
        const [hRatio, leftTxt] = leftText.split(' ').map(Number);
    
        wRatio = Number(wRatio);
        
        if (isNaN(wRatio) || isNaN(hRatio)) {
            console.warn("Invalid aspect ratio selected:", aspectRatioStr);
            // Optionally display an error or default values
            if(display_width_el) display_width_el.textContent = 'N/A';
            if(display_height_el) display_height_el.textContent = 'N/A';
            return;
        }

        // Calculate base dimension using the smaller ratio as baseline for simplicity
        // MP = W * H / 1e6 => W = sqrt(MP * 1e6 * wRatio / hRatio) if keeping aspect ratio
        // More accurate: Total pixels = MP * 1e6. W/H = wRatio/hRatio => W = sqrt(Total * wRatio / hRatio)
        const totalPixels = megapixel * 1_000_000;
        const calculatedWidth = Math.round(Math.sqrt(totalPixels * (wRatio / hRatio)));
        const calculatedHeight = Math.round(Math.sqrt(totalPixels * (hRatio / wRatio)));

        // Update display elements
        if(display_width_el) display_width_el.textContent = calculatedWidth;
        if(display_height_el) display_height_el.textContent = calculatedHeight;

        console.log(`Dimensions updated: ${calculatedWidth} x ${calculatedHeight} (MP: ${megapixel}, AR: ${aspectRatioStr})`);
    }

    function updateLanguageInContext(context, langCode, languagePack) {
        if (!context || !langCode || !languagePack) {
            console.warn("[updateLanguageInContext] Invalid arguments provided.", { context, langCode, languagePack });
            return;
        }

        const elementsToUpdate = context.querySelectorAll('[data-lang-key]');
        elementsToUpdate.forEach(element => {
            const key = element.getAttribute('data-lang-key');
            if (languagePack[key]) {
                // console.log(`[updateLanguageInContext] Updating element with key '${key}' to '${languagePack[key]}'`, element);
                if (element.textContent === languagePack[key] || element.placeholder === languagePack[key]) 
                    return;
                
                if (element.tagName === 'INPUT' && element.hasAttribute('placeholder')) {
                    element.placeholder = languagePack[key];
                } else if (element.tagName === 'TEXTAREA' && element.hasAttribute('placeholder')) {
                    element.placeholder = languagePack[key];
                } else if (element.tagName === 'TITLE') {
                    // Note: Updating document.title via an element's textContent might not work as expected
                    // if the element itself isn't the <title> tag. Consider passing document.title separately if needed.
                    element.textContent = languagePack[key];
                } else if (element.tagName === 'OPTION') {
                    element.textContent = languagePack[key];
                } else {
                    // General case for <p>, <span>, <div>, <h1>-<h6>, <summary>, etc.
                    element.innerHTML = languagePack[key];
                }
            } else if (key) { // Warn only if a key attribute was present but not found
                console.warn(`[updateLanguageInContext] Key '${key}' not found in language pack for '${langCode}'.`, element);
            }
        });
    }
    // --- End Utility Function ---

    function setupEventListenersAndLanguage() {
        // Elements from the header (now directly in HTML via placeholder)
        const themeToggle = _('#theme-toggle');
        const themeIcon = _('#theme-icon');
        const languageSelect = _('#language-select');
        const backButton = _('#back-button');
        window.appUtils.themeSwitcher(themeToggle, themeIcon);

        // Language Switcher Logic
        if (languageSelect) {
            languageSelect.addEventListener('change', (event) => {
                console.log('Language changed:', event.target.value);
                const langCode = event.target.value;
                window.appUtils.setLanguage(langCode, langConfig, () => {
                    renderHistory();
                    populatePoseModal();
                });
            });
        }

        // Back button logic
        if (backButton) {
            backButton.addEventListener('click', () => window.location.href = 'index.html');
        }

        // Initial UI setup
        window.appUtils.setLanguage(langConfig.currentLanguage, langConfig,()=>{}); // Set language on initial load
        renderHistory(); // Render history on initial load
        // Ensure guide is visible on initial load
        if (guideContainer) guideContainer.classList.remove('hidden');
        if (results) results.classList.add('hidden');
    }

    function updateUIForGenerationState(isGenerating) {
        IS_GENERATING = isGenerating;
        function toggleDisplay(element, show) {
            if (element) {
                if (show) element.style.display = '';
                else element.style.display = 'none';
            }
        }
        
        if (generate) toggleDisplay(generate, !isGenerating);
        if (interrupt_button) toggleDisplay(interrupt_button, isGenerating);

        const inputs = [
            seed_input, prompt_input, batch_size_input, is_random_input,
            enableTurkishWowCheckbox, poseSelectButton, image_input_1, image_input_2, img_aspect_ratio_select
        ];
        inputs.forEach(input => { if (input) input.disabled = isGenerating; });
        
        if (!isGenerating && seed_input && is_random_input) {
            seed_input.disabled = is_random_input.checked;
        }
        if (!isGenerating && enableTurkishWowCheckbox && poseSelectButton) {
            poseSelectButton.disabled = !enableTurkishWowCheckbox.checked;
        }

        updateProgress(0);
        if(node_status_el) node_status_el.innerText = isGenerating ? languages[currentLanguage].processing_status : '';

        if (isGenerating) {
            if (guideContainer) guideContainer.classList.add('hidden');
            if (results) results.classList.remove('hidden');
            if (results) results.innerHTML = `<div class="flex justify-center items-center h-full"><div class="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#3c32c8]"></div></div>`;
        } else {
            const hasImagesInResults = results && results.querySelector('img');
            if (guideContainer && results) {
                if (!hasImagesInResults) {
                    results.innerHTML = '';
                    results.classList.add('hidden');
                    guideContainer.classList.remove('hidden');
                } else {
                    guideContainer.classList.add('hidden');
                    results.classList.remove('hidden');
                }
            }
        }
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

    // --- Modified handleImagePreview Function ---
    function handleImagePreview(file, imageId) {
        if (imageId === 1) {
            window.imageGenState.uploadedImageFile1 = file;
            updateImagePreview(file, display_uploaded_image_el_1);
        } else if (imageId === 2) {
            window.imageGenState.uploadedImageFile2 = file;
            updateImagePreview(file, display_uploaded_image_el_2);
        }
    }

    function updateImagePreview(file, displayElement) {
        if (!displayElement) return;
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    displayElement.style.backgroundImage = `url(${reader.result})`;
                    displayElement.innerHTML = '';
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        } else {
            displayElement.style.backgroundImage = 'none';
            displayElement.innerHTML = `<span class="text-gray-500 dark:text-gray-400" data-lang-key="image_preview_placeholder">${languages[currentLanguage].image_preview_placeholder}</span>`;
        }
    }

    function saveHistoryItem(imageUrl, promptText) {
        let history = loadHistory();
        history.unshift({ imageUrl, promptText, timestamp: new Date().toISOString() });
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

    function buildHistoryHTMLEl(item) {
        // Create container
        const historyItemDiv = document.createElement('div');
        historyItemDiv.className = 'history-item';

        // Create image
        const img = document.createElement('img');
        img.className = 'rounded-md';
        img.src = item.imageUrl;
        img.alt = 'Generated Image'; // Always provide meaningful alt text

        // Create prompt paragraph
        const p = document.createElement('p');
        p.className = 'history-item-prompt';
        p.textContent = item.promptText; // Safe: textContent prevents XSS

        // Append in desired order
        historyItemDiv.appendChild(img);
        historyItemDiv.appendChild(p);

        // Attach full prompt as data attribute for copying
        historyItemDiv.dataset.fullPrompt = item.promptText;

        return historyItemDiv;
    }

    function renderHistory() {
        const historyContainer = _('#history-container');
        if (!historyContainer) return;

        const history = loadHistory();
        
        // Clear previous content
        historyContainer.innerHTML = '';

        if (history.length === 0) {
            // ✅ Safe: Create empty message using DOM methods
            const emptyMessage = document.createElement('p');
            emptyMessage.className = 'text-gray-500 dark:text-gray-400 text-sm';
            emptyMessage.dataset.langKey = 'history_empty_message';

            // Fallback in case language key is missing
            const emptyText = languages[currentLanguage]?.history_empty_message || 'No history yet.';
            emptyMessage.textContent = emptyText;

            historyContainer.appendChild(emptyMessage);
            return;
        }

        // Render each history item
        history.forEach(item => {
            const historyItemDiv = buildHistoryHTMLEl(item);

            // Find the prompt element to attach click-to-copy
            const promptElement = historyItemDiv.querySelector('.history-item-prompt');
            if (promptElement) {
                promptElement.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent any container bubbling
                    copyTextToClipboard(item.promptText);
                });
            }

            historyContainer.appendChild(historyItemDiv);
        });
    }

    function clearHistory() {
        sessionStorage.removeItem(SESSION_HISTORY_KEY);
        renderHistory();
    }
    
    // Register with global WebSocket
    window.sharedWS.addListener('image-generator', function(data) {
        const nodeStatusEl = document.querySelector('#node-status');
        const results = document.querySelector('#results');
        const guideContainer = document.querySelector('#guide-container');

        const t = (key, fallback) => languages[currentLanguage]?.[key] || fallback;

        switch (data.type) {
            case 'progress':
                updateProgress(data.data.value, data.data.max);
                if (data.data.node && nodeStatusEl) {
                    nodeStatusEl.textContent = `${t('processing_status', 'Processing')} ${data.data.node}`;
                }
                break;

            case 'executing':
                if (data.data.node === null) {
                    updateUIForGenerationState(false);
                    window.appUtils.displayNotification('generation_completed', langConfig);
                    if (nodeStatusEl) {
                        nodeStatusEl.textContent = t('finished_status', 'Finished!');
                    }
                } else {
                    if (nodeStatusEl) {
                        nodeStatusEl.textContent = `${t('executing_status', 'Executing')} ${data.data.node}`;
                    }
                }
                break;

            case 'executed':
                // ✅ Reconnect to your full business logic
                if (results && data.data.output && 'images' in data.data.output) {
                    handleExecutedEvent(data.data, results, guideContainer);
                }
                break;

            case 'execution_error':
            case 'execution_interrupted':
                updateUIForGenerationState(false);
                displayModalMessage('generation_interrupted', true);
                if (nodeStatusEl) {
                    nodeStatusEl.textContent = t('interrupted_status', 'Interrupted!');
                }
                break;

            case 'status':
                const isProcessing = data.data.status?.exec_info?.queue_remaining > 0;
                updateUIForGenerationState(isProcessing);
                if (!IS_GENERATING) {
                    console.log(t('idle_status', 'System is idle.'));
                }
                break;

            default:
                console.log('Unknown WS message type (image gen):', data.type);
        }
    });

    // --- Business Logic: Executed Event ---
    function handleExecutedEvent(data, results, guideContainer) {
        if (!results || !data.output?.images || !Array.isArray(data.output.images)) return;

        const images = data.output.images;
        if (images.length === 0) return;

        // Generate image URLs
        const imageElements = images.map(image => {
            const imageUrl = `/view?filename=${encodeURIComponent(image.filename)}&subfolder=${encodeURIComponent(image.subfolder)}&type=${encodeURIComponent(image.type)}`;

            // Save to history immediately
            console.log("window.prompt_input?.value", prompt_input);
            saveHistoryItem(imageUrl, prompt_input?.value || '');

            return `
                <div>
                    <a href="${imageUrl}" target="_blank" rel="noopener">
                        <img src="${imageUrl}" class="rounded-lg shadow-lg" loading="lazy" alt="Generated image">
                    </a>
                </div>
            `;
        }).join('');

        // Grid class based on count
        const gridClass = images.length > 1 ? 'grid-cols-2' : 'grid-cols-1';

        // ✅ Safe: We control the image source (from backend), but still sanitize via encodeURI
        results.innerHTML = `<div class="grid ${gridClass} gap-4">${imageElements}</div>`;

        // Hide guide, show results
        if (guideContainer) guideContainer.classList.add('hidden');
        results.classList.remove('hidden');
    }
    
    async function load_api_workflows() {
        for (let key in WORKFLOW_PATHS) {
            try {
                // let response = await fetch(WORKFLOW_PATHS[key]);
                let response = await window.appUtils.fetchWithTimeout(WORKFLOW_PATHS[key], {}, 8000);
                console.log('response', response); // return undefined
                if (!response.ok) {
                    throw new Error(`Failed to load workflow ${WORKFLOW_PATHS[key]}: ${response.status} ${response.statusText}`);
                }
                workflows[key] = await response.json();
                console.log(`Workflow ${key} loaded successfully:`, workflows[key]);
            } catch (error) {
                console.error(`Error loading workflow ${key}:`, error);
                workflows[key] = {};
                window.appUtils.displayModalMessage(`Failed to load workflow: ${key}. Please check the path and server status.`, langConfig);
            }
        }
        return workflows;
    }

    async function loadPoses() {
        try {
            const response = await fetch(POSES_JSON_PATH);
            if (!response.ok) {
                throw new Error(`Failed to load poses.json: ${response.status} ${response.statusText}`);
            }
            posesData = await response.json();
            populatePoseModal();
        } catch (error) {
            console.error('Error loading poses data:', error);
            window.appUtils.displayModalMessage('failed_load_poses_json', langConfig);
        }
    }

   function populatePoseModal() {
       if (!posesModalList) return;
       posesModalList.innerHTML = ''; // Clear existing content

       const grid = document.createElement('div');
       grid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4';

       posesData.forEach((pose, index) => {
           const card = document.createElement('div');
           card.className = 'pose-card flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200';
           card.dataset.index = index;
           const poseName = currentLanguage === 'ar' && pose.name_ar ? pose.name_ar : pose.name;

           card.innerHTML = `
               <img src="${pose.image}" alt="${poseName}" class="w-full h-48 object-cover">
               <div class="p-3 flex flex-col flex-grow">
                   <h3 class="font-semibold text-gray-900 dark:text-white mb-1 truncate">${poseName}</h3>
                   <p class="text-xs text-gray-600 dark:text-gray-400 flex-grow">${pose.description.substring(0, 100)}...</p>
               </div>
           `;
           
           card.addEventListener('click', () => handlePoseSelection(index));
           grid.appendChild(card);
       });

       posesModalList.appendChild(grid);
   }

    function handlePoseSelection(selectedIndex) {
        if (!selectedPoseText || !poseSelectValueInput || !prompt_input || !posesModal) return;

        poseSelectValueInput.value = selectedIndex;

        if (selectedIndex !== null && posesData[selectedIndex]) {
            const selectedPose = posesData[selectedIndex];
            const selectedPoseImg = _('#selected-pose-img');
            const selectedPoseTextSpan = _('#selected-pose-text');

            if (selectedPoseImg && selectedPoseTextSpan) {
               const poseName = currentLanguage === 'ar' && selectedPose.name_ar ? selectedPose.name_ar : selectedPose.name;
               selectedPoseImg.src = selectedPose.image;
               selectedPoseImg.alt = poseName;
               selectedPoseImg.classList.remove('hidden');
               selectedPoseTextSpan.textContent = poseName;
            }
            prompt_input.value = selectedPose.description;
        }
        posesModal.classList.add('hidden');
        document.body.classList.remove('modal-open');
    }

    // Event listeners
    if (generate) {
        generate.addEventListener('click', async () => {
            if (IS_GENERATING) return;

            if (!prompt_input.value.trim()) {
                window.appUtils.displayNotification('prompt_required', langConfig);
                updateUIForGenerationState(false);
                return;
            }

            if (!window.imageGenState.uploadedImageFile1 || !window.imageGenState.uploadedImageFile2) {
                window.appUtils.displayNotification('image_required', langConfig); // You might want a more specific message
                updateUIForGenerationState(false);
                return;
            }
            
            updateUIForGenerationState(true);

            if (!workflows || !workflows.qwen_edit) {
                window.appUtils.displayModalMessage('image_generation_workflow_not_loaded', langConfig);
                updateUIForGenerationState(false);
                return;
            }

            let wf_to_use = JSON.parse(JSON.stringify(workflows.qwen_edit));

            // if(enableTurkishWowCheckbox.checked) {
            //     wf_to_use = JSON.parse(JSON.stringify(workflows.flux_kontext_model));
            // }
            
            
            // 2. Set Prompt
            if (prompt_input && wf_to_use[QWEN_CLIP_TEXT_ENCODE_POSITIVE_NODE]) {
                wf_to_use[QWEN_CLIP_TEXT_ENCODE_POSITIVE_NODE].inputs.prompt = prompt_input.value;
            }
            // Set negative prompt (usually empty for this model/setup)
            if (wf_to_use[QWEN_CLIP_TEXT_ENCODE_NEGATIVE_NODE]) {
                wf_to_use[QWEN_CLIP_TEXT_ENCODE_NEGATIVE_NODE].inputs.prompt = ""; // Or get from a separate input if you add one
            }

            // 3. Set Seed
            if (is_random_input && is_random_input.checked && seed_input) {
                seed_input.value = Math.floor(Math.random() * 1e15);
            }
            if (wf_to_use[K_SAMPLER_NODE]) {
                wf_to_use[K_SAMPLER_NODE].inputs.seed = parseInt(seed_input.value);
            }

            // 4. Set CFG (Guidance Scale)
            // Note: Your workflow has CFG=1. The slider value (guidance_scale_input) might map differently.
            // If you want to control the 'shift' in ModelSamplingAuraFlow (node 66):
            // if(wf_to_use['66']) { // Directly reference the node ID
            //     wf_to_use['66'].inputs.shift = parseFloat(guidance_scale_input.value); // Or map the slider value appropriately
            // }
            // Or if you want to control the CFG in KSampler (node 3):
            // if(wf_to_use[K_SAMPLER_NODE]) {
            //    wf_to_use[K_SAMPLER_NODE].inputs.cfg = parseFloat(guidance_scale_input.value);
            // }

            // 5. Set Steps (if you add a steps input or want to control it)
            // if(wf_to_use[K_SAMPLER_NODE]) {
            //    wf_to_use[K_SAMPLER_NODE].inputs.steps = parseInt(steps_input.value); // Add steps_input element
            // }

            // 6. Set Dimensions (Modify based on your resolution node setup)
            // Option A: Set FluxResolutionNode (108)
            // You'll likely need separate height/width inputs or derive them from aspect ratio.
            // const height = parseInt(img_height_input.value);
            // const width = parseInt(img_width_input.value);
            // if(wf_to_use[FLUX_RESOLUTION_NODE]) {
            //     // This node calculates based on megapixel and aspect ratio.
            //     // You might need to adjust its inputs (megapixel, aspect_ratio) instead of direct width/height.
            //     // Or modify the node to accept direct width/height if possible.
            //     // Example (if it accepted direct inputs - check your node's actual inputs):
            //     // wf_to_use[FLUX_RESOLUTION_NODE].inputs.width = width;
            //     // wf_to_use[FLUX_RESOLUTION_NODE].inputs.height = height;
            // }

            // --- UPDATE FLUX RESOLUTION NODE ---
            // This is the key change based on your request
            // Get values from the new UI elements
            const userMegapixel = parseFloat(img_megapixel_input.value);
            const userAspectRatio = img_aspect_ratio_select.value; // This should match the format expected by the node, e.g., "1:1"

            // Find the FluxResolutionNode in your workflow (node ID '108')
            const fluxResolutionNode = wf_to_use[FLUX_RESOLUTION_NODE];
            if (fluxResolutionNode) {
                // Update the inputs of the FluxResolutionNode
                fluxResolutionNode.inputs.megapixel = userMegapixel;
                fluxResolutionNode.inputs.aspect_ratio = userAspectRatio;
                // Ensure custom_ratio is false if you're using the preset list
                fluxResolutionNode.inputs.custom_ratio = false;
                // If you wanted to use custom_aspect_ratio, you would set it like this:
                // fluxResolutionNode.inputs.custom_aspect_ratio = userAspectRatio; // Only if custom_ratio is true
                // But based on your image, it seems you use the preset list (aspect_ratio) with custom_ratio = false

                console.log(`Updated FluxResolutionNode (${FLUX_RESOLUTION_NODE}): Megapixel=${userMegapixel}, Aspect Ratio=${userAspectRatio}`);
            } else {
                console.warn("FluxResolutionNode (ID '108') not found in the workflow. Dimensions might not be set correctly.");
                // You might want to display a warning to the user or handle this case
            }

            // Option B: Set EmptySD3LatentImage (109) directly
            const batchSize = parseInt(batch_size_input.value);
            if(wf_to_use[EMPTY_LATENT_IMAGE_NODE]) {
                wf_to_use[EMPTY_LATENT_IMAGE_NODE].inputs.batch_size = batchSize;
                // wf_to_use[EMPTY_LATENT_IMAGE_NODE].inputs.width = width; // If node accepts direct input
                // wf_to_use[EMPTY_LATENT_IMAGE_NODE].inputs.height = height; // If node accepts direct input
            }

            // 7. Upload Images and Set LoadImage Nodes
            let comfyUIImageName1 = null;
            let comfyUIImageName2 = null;

            // --- Upload Image 1 ---
            comfyUIImageName1 = await window.appUtils.uploadImage(
                window.imageGenState.uploadedImageFile1,
                'uploading_image', // Or a specific key for image 1
                langConfig
            );
            if (!comfyUIImageName1) {
                console.error("Failed to upload image 1");
                updateUIForGenerationState(false);
                return; // Stop if upload fails
            }
            // Set the filename for the first LoadImage node (110)
            if (wf_to_use[LOAD_IMAGE_NODE_1]) {
                wf_to_use[LOAD_IMAGE_NODE_1].inputs.image = comfyUIImageName1;
                console.log(`Set LoadImage Node ${LOAD_IMAGE_NODE_1} image to:`, comfyUIImageName1);
            }

            // --- Upload Image 2 ---
            comfyUIImageName2 = await window.appUtils.uploadImage(
                window.imageGenState.uploadedImageFile2,
                'uploading_image', // Or a specific key for image 2
                langConfig
            );
            if (!comfyUIImageName2) {
                console.error("Failed to upload image 2");
                updateUIForGenerationState(false);
                return; // Stop if upload fails
            }
            // Set the filename for the second LoadImage node (113)
            if (wf_to_use[LOAD_IMAGE_NODE_2]) {
                wf_to_use[LOAD_IMAGE_NODE_2].inputs.image = comfyUIImageName2;
                console.log(`Set LoadImage Node ${LOAD_IMAGE_NODE_2} image to:`, comfyUIImageName2);
            }

            // 8. Queue Prompt
            try {
                await window.appUtils.queuePrompt(wf_to_use, window.sharedWS.client_id);
                console.log("Prompt queued successfully.");
            } catch (e) {
                console.error("Error queuing prompt:", e);
                window.appUtils.displayModalMessage(`${e.message || 'Unknown error queuing prompt'}`, langConfig);
                updateUIForGenerationState(false);
            }
        });
    }


    if(interrupt_button) interrupt_button.addEventListener('click', () => fetch('/interrupt', { method: 'POST' }));
    // if(image_size_radioBtn) image_size_radioBtn.addEventListener('change', e => { 
    //     if (e.target.name === 'image-size') setImageDimensions(e.target.value); 
    // });
    let timeout;
    guidance_scale_input.addEventListener('input', e => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            if(guidance_scale_value_el) guidance_scale_value_el.textContent = e.target.value;
        }, 50);
    });
    // Replace the single image_input listener
    document.querySelectorAll('.image-input-class').forEach(input => {
        input.addEventListener('change', function() {
            const imageId = this.dataset.imageId; // Get ID from data attribute
            const file = this.files ? this.files[0] : null;
            if (imageId === '1') {
                handleImagePreview(file, 1); // Pass file and ID
            } else if (imageId === '2') {
                handleImagePreview(file, 2); // Pass file and ID
            }
        });
    });

    if(modalCloseButton) modalCloseButton.addEventListener('click', () => window.appUtils.displayModalMessage('', langConfig, false));
    if(clearHistoryButton) clearHistoryButton.addEventListener('click', clearHistory);
    
    // Turkish WOW event listeners
    // if (enableTurkishWowCheckbox) {
    //     enableTurkishWowCheckbox.addEventListener('change', () => {
    //         if (turkishWowControls) {
    //             const isChecked = enableTurkishWowCheckbox.checked;
    //             turkishWowControls.style.display = isChecked ? 'block' : 'none';
    //             poseSelectButton.disabled = !isChecked;
                
    //             if (!isChecked) {
    //                 // Clear selection and prompt when disabled
    //                 poseSelectValueInput.value = "";
    //                 const selectedPoseImg = _('#selected-pose-img');
    //                 const selectedPoseTextSpan = _('#selected-pose-text');
    //                 if(selectedPoseImg) selectedPoseImg.classList.add('hidden');
    //                 if(selectedPoseTextSpan) selectedPoseTextSpan.innerHTML = `<span data-lang-key="select_pose_placeholder">${languages[currentLanguage].select_pose_placeholder}</span>`;
    //                 if(prompt_input) prompt_input.value = "";
    //             }
    //         }
    //     });
    // }

   // Poses Modal Listeners
//    if (poseSelectButton) {
//        poseSelectButton.addEventListener('click', () => {
//            if (posesModal) {
//                posesModal.classList.remove('hidden');
//                document.body.classList.add('modal-open');
//            }
//        });
//    }

      // --- Tab Navigation ---
    function switchView(viewId) {
        if (viewId === activeView) return;

        const currentActiveView = activeView === 'image-generation' ? imageGenerationView : promptGenerationView;
        const targetViewElement = viewId === 'image-generation' ? imageGenerationView : promptGenerationView;

        if (currentActiveView && targetViewElement) {
            // Start fade out
            currentActiveView.style.opacity = '0';
            setTimeout(() => {
                // After fade out, hide current and show target
                currentActiveView.classList.add('hidden');
                targetViewElement.classList.remove('hidden');
                // Trigger reflow
                void targetViewElement.offsetWidth;
                // Start fade in
                targetViewElement.style.opacity = '1';

                activeView = viewId;

                // --- Update tab state (for new <a> tag tabs with background/text active style) ---
                tabButtons.forEach(link => {
                    const tabViewId = link.dataset.tab;
                    const isSelected = tabViewId === viewId;                    
                    // Update visual state using classes similar to Tailwind example logic
                    // Toggle active/inactive state with Tailwind classes
                    link.classList.toggle('bg-gray-100', isSelected);
                    link.classList.toggle('text-blue-600', isSelected);
                    link.classList.toggle('dark:bg-gray-800', isSelected);
                    link.classList.toggle('dark:text-blue-500', isSelected);

                    link.setAttribute('aria-selected', isSelected ? 'true' : 'false');
                });
                // --- End Update tab state ---

                // Load prompt generator if needed
                if (viewId === 'prompt-generation' && !promptGeneratorLoaded) {
                    loadPromptGeneratorContent();
                } 
            }, 300); // Match CSS transition duration
        } else {
            tabButtons.forEach(button => {
                if (button.dataset.tab === viewId) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
        }
    }

    function setupTabNavigation() {
        tabButtons.forEach(link => {
            let isSelected = link.getAttribute('aria-selected') === 'true';

            link.classList.toggle('bg-gray-100', isSelected);
            link.classList.toggle('text-blue-600', isSelected);
            link.classList.toggle('dark:bg-gray-800', isSelected);
            link.classList.toggle('dark:text-blue-500', isSelected);
            link.addEventListener('click', (event) => {
                event.preventDefault(); // Prevent default '#' navigation
                const targetView = link.dataset.tab;
                switchView(targetView);
            });
        });
    }

    // --- Prompt Generation Tab Logic ---
    async function loadPromptGeneratorContent() {
        if (promptGeneratorLoaded || !promptGenerationView) return;

        try {
            if (promptGeneratorLoadingIndicator) {
                promptGeneratorLoadingIndicator.parentElement.classList.remove('hidden');
            }

            const [htmlResponse, jsResponse] = await Promise.all([
                fetch('prompt-generator.html'),
                // Load JS via script tag injection as before, or use dynamic import if ES module
                new Promise((resolve, reject) => {
                    if (typeof window.initializePromptGeneratorTab === 'function') {
                        console.log("Prompt Generator JS: Function already available.");
                        resolve(); // Already loaded
                        return;
                    }
                    const script = document.createElement('script');
                    script.src = PROMPT_GENERATOR_JS_PATH; // Ensure path is correct
                    script.onload = () => {
                        console.log("Prompt Generator JS: Script loaded successfully.");
                        resolve();
                    };
                    script.onerror = (e) => {
                        console.error("Prompt Generator JS: Failed to load script:", e);
                        reject(new Error(`Failed to load ${PROMPT_GENERATOR_JS_PATH}`));
                    };
                    document.head.appendChild(script);
                })
            ]);

            if (!htmlResponse.ok) throw new Error(`Failed to load prompt-generator.html: ${htmlResponse.status}`);
            const htmlText = await htmlResponse.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const mainGridDiv = doc.getElementById('prompt-generator-main-content');

            if (mainGridDiv) {
                if (promptGeneratorLoadingIndicator) {
                    promptGeneratorLoadingIndicator.parentElement.classList.add('hidden');
                }

                promptGenerationView.innerHTML = '';
                promptGenerationView.appendChild(mainGridDiv);

                promptGeneratorLoaded = true;
                console.log("Prompt Generator content loaded and injected.");

                if (typeof window.initializePromptGeneratorTab === 'function') {
                    console.log("Prompt Generator: Calling initialization function...");
                    try {
                        await window.initializePromptGeneratorTab();
                        console.log("Prompt Generator: Initialization function completed.");

                        const currentLang = languageSelect ? languageSelect.value : currentLanguage;
                        updateLanguageInContext(promptGenerationView, currentLang, languages[currentLang]);
                        console.log("Prompt Generator view language synced to:", currentLang);
                        // Language sync for first load happens via custom event listener now
                    } catch (initError) {
                        console.error("Prompt Generator: Error calling initialization function:", initError);
                        promptGenerationView.innerHTML = `
                            <div class="p-4 sm:p-6">
                                <div class="text-center py-10 text-red-500 dark:text-red-400">
                                    <p class="text-lg" data-lang-key="prompt_generator_init_error">Failed to initialize Prompt Generator. Runtime error occurred.</p>
                                    <p class="text-sm mt-2">Details: ${initError.message}</p>
                                </div>
                            </div>
                        `;
                    }
                } else {
                    const errorMsg = "Prompt Generator: Global initialization function 'window.initializePromptGeneratorTab' not found after script execution.";
                    console.error(errorMsg);
                    promptGenerationView.innerHTML = `
                        <div class="p-4 sm:p-6">
                            <div class="text-center py-10 text-red-500 dark:text-red-400">
                                <p class="text-lg" data-lang-key="prompt_generator_init_error">${errorMsg}</p>
                            </div>
                        </div>
                    `;
                }
            } else {
                throw new Error("Could not find main content grid in prompt-generator.html");
            }

        } catch (error) {
            console.error("Error loading prompt generator content:", error);
            if (promptGeneratorLoadingIndicator) {
                promptGeneratorLoadingIndicator.parentElement.classList.add('hidden');
            }
            promptGenerationView.innerHTML = `
                <div class="p-4 sm:p-6">
                    <div class="text-center py-10 text-red-500 dark:text-red-400">
                        <p class="text-lg" data-lang-key="prompt_generator_load_error">Failed to load Prompt Generator. Please try again later.</p>
                        <p class="text-sm mt-2">${error.message}</p>
                    </div>
                </div>
            `;
        }
    }

    // Inside the event listener for img_aspect_ratio_select change
    // if (img_aspect_ratio_select) {
    //     img_aspect_ratio_select.addEventListener('change', () => {
    //         console.log('changed', img_aspect_ratio_select);
    //         // Update the FluxResolutionNode logic here...
            
    //         // Now update the icon
    //         const selectedValue = img_aspect_ratio_select.value;
    //         const ratioParts = selectedValue.split(':');
    //         const ratioNum = parseInt(ratioParts[0]);
    //         aspect_ratio_icon.style.display = 'block';
    //         aspect_ratio_icon.textContent = ratioNum;
    //     });
    // }

    // --- Event Listeners for Dimension Inputs ---
    // Add these listeners, typically after the selectors are defined and inside the DOMContentLoaded or IIFE
    // if (img_megapixel_input) {
    //     img_megapixel_input.addEventListener('input', calculateAndDisplayDimensions);
    //     img_megapixel_input.addEventListener('change', calculateAndDisplayDimensions); // For final value
    // }
    if (img_aspect_ratio_select) {
        console.log('tessssssssssssssst');
        img_aspect_ratio_select.addEventListener('change', calculateAndDisplayDimensions);
    }

    // Initial Load
    document.addEventListener('DOMContentLoaded', async () => {
        setupEventListenersAndLanguage();
        await load_api_workflows();
        // await loadPoses();
        // setImageDimensions(_('input[name="image-size"]:checked')?.value || 'square');
        updateUIForGenerationState(false);
        setupTabNavigation(); // Setup tab navigation
        calculateAndDisplayDimensions(); 
    });

})(window, document);