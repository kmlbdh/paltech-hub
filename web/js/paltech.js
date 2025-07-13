(async (window, d, undefined) => {

    // --- 1. Helper Functions ---
    // ===========================

    /**
     * Helper function to query the DOM.
     * @param {string} selector - The CSS selector string.
     * @param {Document|HTMLElement} contex - The context to search within (defaults to document).
     * @returns {HTMLElement|null} The first element matching the selector, or null if not found.
     */
    const _ = (selector, contex = d) => contex.querySelector(selector);

    let startTime; // Variable to store the start time for performance measurement.

    /**
     * Starts a timer to measure execution time.
     */
    function timerStart() { startTime = new Date(); }

    /**
     * Calculates the elapsed time since the timer was started.
     * @returns {number} Elapsed time in seconds.
     */
    function elapsedTime() {
        if (!startTime) return 0;
        return (new Date() - startTime) / 1000;
    }

    /**
     * Generates a random seed number.
     * @returns {number} A random integer between 0 and 9,999,999,999.
     */
    function seed() { return Math.floor(Math.random() * 9999999999); }

    /**
     * Toggles the display style of an HTML element between '' (visible) and 'none'.
     * Optionally sets the display based on a boolean value.
     * @param {HTMLElement} el - The HTML element to toggle.
     * @param {boolean|null} value - If true, displays the element; if false, hides it. If null, toggles current display.
     */
    function toggleDisplay(el, value = null) {
        if (el) {
            if (value !== null) {
                el.style.display = (value === true) ? '' : 'none';
                return;
            }
            el.style.display = (el.style.display === 'none') ? '' : 'none';
        }
    }

    /**
     * Generates a UUID (Universally Unique Identifier) version 4.
     * @returns {string} A UUID string.
     */
    function uuidv4() { return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)); }


    // --- 2. API Interaction Functions ---
    // ====================================

    /**
     * Loads predefined ComfyUI API workflows from JSON files.
     * @returns {Promise<Object>} An object containing loaded workflow JSONs, keyed by their names.
     */
    async function load_api_workflows() {
        let wf = {
            // 'flux_kontext': '/js/flux-kontext.json'
            'flux_kontext': 'paltech/js/flux-kontext.json'

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

    /**
     * Uploads an image file to the ComfyUI server.
     * @param {File} imageFile - The image file to upload.
     * @param {string} filename - The desired filename on the server.
     * @param {string} serverAddress - The base URL of the ComfyUI server.
     * @param {string} folderType - The folder on the ComfyUI server to save the image ('input', 'output', 'temp').
     * @param {boolean} overwrite - Whether to overwrite an existing file with the same name.
     * @returns {Promise<Object>} A promise that resolves with the server's response (e.g., { name: "filename.png" }).
     * @throws {Error} If the upload fails.
     */
    async function uploadImage(imageFile, filename, serverAddress = window.location.origin, folderType = 'input', overwrite = false) {
        const url = `${serverAddress}/upload/image`;
        const formData = new FormData();
        formData.append('image', imageFile, filename);
        formData.append('type', folderType);
        formData.append('overwrite', String(overwrite).toLowerCase());

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Image upload failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Image uploaded successfully:', data);
            return data;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    /**
     * Queues a ComfyUI workflow prompt for execution.
     * @param {Object} prompt - The ComfyUI workflow JSON object.
     * @returns {Promise<Object>} A promise that resolves with the server's response (e.g., { prompt_id: "...", number: ... }).
     * @throws {Error} If queuing the prompt fails.
     */
    async function queue_prompt(prompt = {}) {
        const data = { 'prompt': prompt, 'client_id': client_id };

        try {
            const response = await fetch('/prompt', {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Prompt queue failed: ${response.status} ${response.statusText} - ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error queuing prompt:', error);
            throw error;
        }
    }

    /**
     * Sends an interrupt signal to the ComfyUI server to stop the current generation.
     * @returns {Promise<void>} A promise that resolves when the interrupt request is sent.
     * @throws {Error} If sending the interrupt signal fails.
     */
    async function interrupt() {
        try {
            const response = await fetch('/interrupt', {
                method: 'POST',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'text/html'
                },
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Interrupt failed: ${response.status} ${response.statusText} - ${errorText}`);
            }
            console.log('Interrupt signal sent successfully.');
        } catch (error) {
            console.error('Error sending interrupt signal:', error);
        }
    }


    // --- 3. Global Variables and Initial Setup ---
    // =============================================

    const client_id = uuidv4();

    // const realSkin_texture_tigger = "skin texture style";
    // Assumes ComfyUI is on the same host/port as the frontend
    const server_address = window.location.hostname + ':' + window.location.port;

    let IS_GENERATING = false; // Current generation status

    // Track the filename of the last successfully uploaded image to ComfyUI
    let lastUploadedComfyUIName = null;
    // Track a unique identifier for the last uploaded image file to ensure it's truly the same file
    let lastUploadedFileIdentifier = null;
    // Stores the File object selected by the user
    let uploadedImageFile = null;

    // WebSocket variables for reconnection logic
    let ws;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 10; // Max attempts before giving up and asking user to reload
    const RECONNECT_DELAY_MS = 5000; // Delay between reconnect attempts (3 seconds)

    // HTML elements references (defined once to avoid repeated DOM queries)
    const generate = _('#generate');
    const interrupt_button = _('#interrupt');
    const progressbar = _('#main-progress');
    const seed_input = _('#main-seed');
    const is_random_input = _('#is-random');
    const modal = _('#app-modal'); // UIkit modal for displaying messages/errors
    const results = _('#results'); // Container for displaying generated images
    const batch_size_input = _('#batch-size-input');
    const prompt_input = _('#prompt-input');
    const img_height_input = _('#image-height');
    const img_width_input = _('#image-width');
    const image_input = _("#image-input"); // The <input type="file"> element for image selection
    const image_size_radioBtn = _("#image-dimension-presets"); // Container for radio buttons
    const node_status_el = _('#current-node-status'); // Element for displaying current node status
    const display_uploaded_image_el = _("#display-uploaded-image"); // Element to display image preview

    // Load workflows immediately when the script starts.
    const workflows = await load_api_workflows();
    // IMPORTANT: Ensure 'default_blank.png' (or your chosen default) exists in your ComfyUI 'input' directory.
    const defaultImageFilename = "default_blank.png";


    // --- 4. UI Update Functions ---
    // ==============================

    /**
     * Displays a message in the UIkit modal.
     * @param {string} message - The message to display.
     * @param {boolean} show - Whether to show (true) or hide (false) the modal.
     */
    function displayModalMessage(message, show = true) {
        const modalMessageEl = _('#modal-message');
        if (modalMessageEl && modal) { // Ensure both elements exist
            modalMessageEl.innerHTML = message;
            if (show) {
                UIkit.modal(modal).show();
            } else {
                UIkit.modal(modal).hide();
            }
        }
    }

    /**
     * Updates the progress bar's maximum and current values.
     * @param {number} max - The maximum value of the progress bar.
     * @param {number} value - The current value of the progress bar.
     */
    function updateProgress(max = 0, value = 0) {
        if (progressbar) {
            progressbar.max = max;
            progressbar.value = value;
        }
    }

    /**
     * Updates the UI elements based on the generation state (IS_GENERATING).
     * Ensures all elements are checked for existence before interaction.
     * @param {boolean} isGenerating - True if generation is in progress, false otherwise.
     */
    function updateUIForGenerationState(isGenerating) {
        IS_GENERATING = isGenerating;

        // Toggle display of generate/interrupt buttons
        if (generate) toggleDisplay(generate, !isGenerating);
        if (interrupt_button) toggleDisplay(interrupt_button, isGenerating);

        // Disable/enable input fields
        if (seed_input) seed_input.disabled = isGenerating;
        if (prompt_input) prompt_input.disabled = isGenerating;
        if (batch_size_input) batch_size_input.disabled = isGenerating;
        if (img_height_input) img_height_input.disabled = isGenerating;
        if (img_width_input) img_width_input.disabled = isGenerating;
        if (image_input) image_input.disabled = isGenerating;
        if (is_random_input) is_random_input.disabled = isGenerating;

        // Special handling for seed input and progress bar when not generating
        if (!isGenerating) {
            // Only re-disable seed input if 'is random' checkbox exists and is checked
            if (seed_input && is_random_input) {
                seed_input.disabled = is_random_input.checked;
            }
            updateProgress(0, 0); // Reset progress bar
            if (node_status_el) {
                node_status_el.innerText = ''; // Clear node status
            }
        } else {
            if (node_status_el) {
                node_status_el.innerText = 'Initializing...'; // Set initial status when generating
            }
        }
    }

    /**
     * Sets the image width and height based on the selected dimension preset.
     * @param {string} selectedValue - The value of the selected radio button ('portrait', 'landscape', 'square', or 'default').
     */
    function setImageDimensions(selectedValue) {
        if (!img_width_input || !img_height_input) {
            console.error("Image dimension input fields not found in DOM.");
            return;
        }

        console.log('Setting image dimensions based on option:', selectedValue);

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
            default: // Handles 'square' and any unrecognized values
                img_width_input.value = 1024;
                img_height_input.value = 1024;
                break;
        }
    }

    /**
     * Renders generated images in the results container.
     * @param {Array<Object>} images - An array of image objects from ComfyUI output.
     */
    function renderGeneratedImages(images) {
        if (results) {
            results.innerHTML = ''; // Clear previous results
            const gridClass = (images.length > 1) ? ' class="uk-width-1-2"' : ''; // For grid layout if multiple images

            for (const image of images) {
                const { filename, subfolder, type } = image;
                const rand = Math.random(); // Cache-busting for image src
                const imageUrl = `/view?filename=${filename}&type=${type}&subfolder=${subfolder}&rand=${rand}`;

                results.innerHTML += `
                    <div${gridClass}>
                        <div>
                            <a href="${imageUrl}" data-type="image" target="_blank">
                                <img src="${imageUrl}" alt="Generated Image" class="uk-responsive-width uk-border-rounded">
                            </a>
                        </div>
                    </div>
                `;
            }
        }
    }

    /**
     * Handles the display of the uploaded image preview.
     * @param {File|null} file - The uploaded File object, or null to clear.
     */
    function handleImagePreview(file) {
        uploadedImageFile = file; // Store the selected File object

        if (!display_uploaded_image_el) {
            console.warn("Element with ID 'display-uploaded-image' not found. Image preview will not work.");
            return;
        }

        if (uploadedImageFile) {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    const aspectRatio = img.width / img.height;
                    display_uploaded_image_el.style.backgroundImage = `url(${reader.result})`;
                    display_uploaded_image_el.style.backgroundSize = 'contain';
                    display_uploaded_image_el.style.backgroundRepeat = 'no-repeat';
                    display_uploaded_image_el.style.backgroundPosition = 'center';
                    // Adjust height based on aspect ratio, assuming divElement has a fixed width
                    display_uploaded_image_el.style.height = display_uploaded_image_el.offsetWidth / aspectRatio + 'px';
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(uploadedImageFile);
        } else {
            display_uploaded_image_el.style.backgroundImage = 'none';
            display_uploaded_image_el.style.height = '0px'; // Collapse or set to default height
        }
    }


    // --- 5. Event Listeners ---
    // ==========================

    // Listen for changes within the image_size_radioBtn container
    if (image_size_radioBtn) {
        image_size_radioBtn.addEventListener('change', (event) => {
            if (event.target.name === 'image-size') {
                setImageDimensions(event.target.value);
            }
        });
    } else {
        console.warn("Element with ID 'image-dimension-presets' not found. Image dimension presets might not work.");
    }

    // Event listener for the "Is Random Seed" checkbox
    if (is_random_input) {
        is_random_input.addEventListener('change', (event) => {
            event.preventDefault();
            if (seed_input) {
                seed_input.disabled = is_random_input.checked;
            }
        });
    } else {
        console.warn("Element with ID 'is-random' not found. Random seed functionality might not work.");
    }

    // Event listener for image file input changes
    if (image_input) {
        image_input.addEventListener('change', function() {
            handleImagePreview(this.files && this.files[0] ? this.files[0] : null);
        });
    } else {
        console.warn("Element with ID 'image-input' not found. Image upload functionality might not work.");
    }

    // Event listener for the main "Generate" button click
    if (generate) {
        generate.addEventListener('click', async (event) => {
            event.preventDefault();

            if (IS_GENERATING) {
                console.warn("Generate button clicked while generation is in progress. This should not happen.");
                return;
            }

            // Deep clone the workflow to avoid modifying the original loaded workflow object
            let wf = structuredClone(workflows['flux_kontext']);

            // Define workflow parameters - ensure these are based on input elements' current values
            const base_steps = 20; // Fixed for now
            const sampler_name = 'euler'; // Fixed for now
            const scheduler = 'simple'; // Fixed for now
            const CFG = 1.0; // Fixed for now

            const prompt_text = prompt_input ? prompt_input.value : '';
            const width = img_width_input ? parseInt(img_width_input.value, 10) : 0;
            const height = img_height_input ? parseInt(img_height_input.value, 10) : 0;
            const batch_size = batch_size_input ? parseInt(batch_size_input.value, 10) : 1;

            // Input validation
            if (!prompt_text.trim()) {
                displayModalMessage('Please enter a prompt.', true);
                return;
            }
            if (isNaN(width) || width <= 0 || isNaN(height) || height <= 0) {
                displayModalMessage('Image width and height must be positive numbers.', true);
                return;
            }
            if (isNaN(batch_size) || batch_size <= 0) {
                displayModalMessage('Batch size must be a positive number.', true);
                return;
            }

            //add-ons according to choices of the user
            // if(true){
            //     prompt_text = prompt_text.append()
            // }

            // Determine seed number
            let rndseed = seed_input ? seed_input.value : seed(); // Default to random if seed_input is missing
            if (is_random_input && is_random_input.checked) {
                rndseed = seed();
                if (seed_input) seed_input.value = rndseed; // Update UI if element exists
            }

            // Update workflow with user inputs - add checks for node existence
            if (wf['308'] && wf['308']['inputs']) {
                wf['308']['inputs']["text"] = prompt_text;
            } else {
                console.warn("Workflow node '308' (CLIPTextEncode) or its 'inputs' not found. Prompt text might not be applied.");
            }

            if (wf['318'] && wf['318']['inputs']) {
                wf['318']['inputs']["sampler_name"] = sampler_name;
                wf['318']['inputs']["scheduler"] = scheduler;
                wf['318']['inputs']['seed'] = rndseed;
                wf['318']['inputs']['steps'] = base_steps;
                wf['318']['inputs']['cfg'] = CFG;
            } else {
                console.warn("Workflow node '318' (KSampler) or its 'inputs' not found. Sampler settings might not be applied.");
            }

            if (wf['355'] && wf['355']['inputs']) {
                wf['355']['inputs']['batch_size'] = batch_size;
                wf['355']['inputs']['width'] = width;
                wf['355']['inputs']['height'] = height;
            } else {
                console.warn("Workflow node '355' (EmptyLatentImage) or its 'inputs' not found. Image dimensions/batch might not be applied.");
            }

            let uploadedFilenameForPrompt = null;

            // Handle image upload logic
            if (uploadedImageFile) {
                const currentFileIdentifier = `${uploadedImageFile.name}-${uploadedImageFile.size}-${uploadedImageFile.lastModified}`;

                if (currentFileIdentifier !== lastUploadedFileIdentifier) {
                    try {
                        console.log(`Uploading new image: ${uploadedImageFile.name}`);
                        const uploadResult = await uploadImage(uploadedImageFile, uploadedImageFile.name, window.location.origin, 'input', true);

                        uploadedFilenameForPrompt = uploadResult.name;
                        lastUploadedComfyUIName = uploadedFilenameForPrompt;
                        lastUploadedFileIdentifier = currentFileIdentifier;

                        if (wf['357'] && wf['357']['inputs']) {
                            wf['357']['inputs']['image'] = uploadedFilenameForPrompt;
                            console.log(`Workflow updated: LoadImage node (ID 357) set to use ${uploadedFilenameForPrompt}`);
                        } else {
                            console.warn("Workflow node '357' (LoadImage) or its 'inputs' not found. This might indicate an issue with the workflow JSON.");
                        }

                    } catch (uploadError) {
                        console.error("Error during image upload:", uploadError);
                        displayModalMessage(`Failed to upload image: ${uploadError.message}`, true);
                        updateUIForGenerationState(false);
                        return;
                    }
                } else {
                    uploadedFilenameForPrompt = lastUploadedComfyUIName;
                    console.log(`Image "${uploadedImageFile.name}" already on server, reusing it for prompt.`);
                    if (wf['357'] && wf['357']['inputs']) {
                        wf['357']['inputs']['image'] = uploadedFilenameForPrompt;
                        console.log(`Workflow updated: LoadImage node (ID 357) set to use existing ${uploadedFilenameForPrompt}`);
                    }
                }
            } else {
                console.log("No image selected for upload. Setting LoadImage node (ID 357) to a default placeholder image.");
                if (wf['357'] && wf['357']['inputs']) {
                    wf['357']['inputs']['image'] = defaultImageFilename;
                    console.log(`Workflow updated: LoadImage node (ID 357) set to use default image "${defaultImageFilename}".`);
                } else {
                    console.warn("Workflow node '357' (LoadImage) or its 'inputs' not found. It will not receive a default image and might cause validation errors if it's a required node.");
                }
            }

            console.log("Starting new generation...");

            updateUIForGenerationState(true);
            timerStart();

            try {
                let response = await queue_prompt(wf);
                console.log('Prompt successfully queued:', response);
            } catch (queueError) {
                console.error('Error queuing prompt:', queueError);
                displayModalMessage(`Failed to queue prompt: ${queueError.message}`, true);
                updateUIForGenerationState(false);
            } finally {
                wf = null;
            }
        });
    } else {
        console.warn("Element with ID 'generate' not found. Generate button might not work.");
    }

    // Event listener for the Interrupt button click
    if (interrupt_button) {
        interrupt_button.addEventListener('click', async (event) => {
            event.preventDefault();
            if (IS_GENERATING) {
                console.log("Interrupt button clicked. Sending interrupt signal...");
                await interrupt();
            } else {
                console.warn("Interrupt button clicked but no generation is in progress. This should not happen.");
            }
        });
    } else {
        console.warn("Element with ID 'interrupt' not found. Interrupt button might not work.");
    }


    // --- 6. WebSocket Setup and Event Handlers ---
    // =============================================

    function setupWebSocket() {
        // Only try to create a new WebSocket if one doesn't exist or is already open/connecting
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
            console.log("WebSocket already open or connecting, not re-establishing.");
            return;
        }

        ws = null; // Ensure `ws` is null before creating a new WebSocket instance

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(protocol + '//' + server_address + '/ws?clientId=' + client_id);

        ws.onopen = function(event) {
            console.log('Connected to the ComfyUI server WebSocket.');
            reconnectAttempts = 0; // Reset attempts on successful connection
            displayModalMessage('', false); // Clear and hide any previous WebSocket error messages
        };

       ws.onmessage = async function(event) {            
            let receivedData = event.data;

            // Check if the received data is a Blob
            if (receivedData instanceof Blob) {
                // If it's a Blob, it's likely an intermediate image preview.
                // Log it if you want to confirm, then simply return to ignore it.
                console.log("Ignoring Blob (intermediate image) message.");
                return; // <--- This line will skip all further processing for Blob messages
            }

            // If it's not a Blob, it should be a string (presumably JSON)
            try {
                const data = JSON.parse(receivedData); // Parse the string data
                
                switch (data.type) {
                    case 'progress':
                        updateProgress(data['data']['max'], data['data']['value']);
                        if (data['data']['node'] && node_status_el) {
                            node_status_el.innerText = `Processing: ${data['data']['node']}`;
                        }
                        break;
                    case 'executing':
                        if (data.data.node === null) {
                            console.log("ComfyUI workflow execution finished.");
                            if (node_status_el) {
                                node_status_el.innerText = 'Finished!';
                            }
                        } else {
                            console.log(`Executing node: ${data.data.node}`);
                            if (node_status_el) {
                                node_status_el.innerText = `Processing: Node ${data.data.node}`;
                            }
                        }
                        break;
                    case 'executed':
                        const execution_time = elapsedTime();
                        console.log('Execution time: ' + execution_time + 's');
                        console.log('Received executed data:', data);

                        if (data['data']['output'] && 'images' in data['data']['output']) {
                            renderGeneratedImages(data['data']['output']['images']);
                            console.log('data[data][output][images]', data['data']['output']['images'])
                        } else {
                            console.warn("No 'images' found in the executed output data for this node.");
                        }
                        break;
                    case 'execution_interrupted':
                        console.log('ComfyUI Execution Interrupted.');
                        updateUIForGenerationState(false);
                        displayModalMessage('Generation interrupted.', true);
                        if (node_status_el) {
                            node_status_el.innerText = 'Interrupted!';
                        }
                        break;
                    case 'status':
                        updateUIForGenerationState(data['data']['status']['exec_info']['queue_remaining'] > 0);
                        if (!IS_GENERATING) {
                            console.log('ComfyUI queue is empty. Generation finished or idle.');
                            if (modal && _('#modal-message') && _('#modal-message').innerHTML.includes('WebSocket connection')) {
                                displayModalMessage('', false);
                            }
                        }
                        break;
                    default:
                        console.log('Received unknown WebSocket message type:', data.type, data);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message or handling data:', error, receivedData);
                displayModalMessage('Error receiving updates from server.', true);
            }
        };

        ws.onclose = function(event) {
            console.log('WebSocket Closed:', event);
            updateUIForGenerationState(false); // Reset UI on connection close

            if (event.wasClean) {
                console.log(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
            } else {
                console.error('Connection died unexpectedly.');
            }

            // displayModalMessage('WebSocket connection lost. Attempting to reconnect...', true);

            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                reconnectAttempts++;
                console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
                setTimeout(setupWebSocket, RECONNECT_DELAY_MS);
            } else {
                console.error("Max reconnect attempts reached. Please reload the page.");
                displayModalMessage('WebSocket connection lost. Max reconnect attempts reached. Please reload the page manually.', true);
            }
        };

        ws.onerror = function(error) {
            console.error('WebSocket Error:', error);
            // The 'onclose' event usually follows 'onerror', so the reconnection logic is mostly in 'onclose'
            displayModalMessage('WebSocket connection error. Attempting to reconnect...', true);
        };
    }


    // --- 7. Initialization Logic ---
    // ===============================

    // Handle initial image dimension state on page load
    const initialCheckedRadio = _('input[type="radio"][name="image-size"]:checked');
    if (initialCheckedRadio) {
        setImageDimensions(initialCheckedRadio.value);
    } else {
        // If no radio button is checked initially, default to 'square' (handled by default in setImageDimensions)
        console.warn('No initial image size radio button checked or "image-dimension-presets" not found. Defaulting image dimensions.');
        setImageDimensions('default');
    }

    // Start WebSocket connection
    setupWebSocket();

})(window, document, undefined);