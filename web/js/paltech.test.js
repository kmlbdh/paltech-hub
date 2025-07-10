// paltech.test.js

// Mock the global WebSocket object BEFORE importing paltech.js
class MockWebSocket {
    constructor(url) {
        this.url = url;
        this.readyState = MockWebSocket.CONNECTING; // Mimic initial state
        this.onopen = null;
        this.onmessage = null;
        this.onerror = null;
        this.onclose = null;
        this.send = jest.fn(); // Mock the send method
        MockWebSocket.instances.push(this); // Keep track of instances
    }

    // Mock WebSocket states
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    static instances = []; // To track all WebSocket instances created

    // Helper to simulate events
    _simulateOpen() {
        this.readyState = MockWebSocket.OPEN;
        if (this.onopen) {
            this.onopen();
        }
    }

    _simulateMessage(data) {
        if (this.onmessage) {
            this.onmessage({ data: JSON.stringify(data) });
        }
    }

    _simulateError(error) {
        this.readyState = MockWebSocket.CLOSED;
        if (this.onerror) {
            this.onerror(error);
        }
    }

    _simulateClose(code, reason) {
        this.readyState = MockWebSocket.CLOSED;
        if (this.onclose) {
            this.onclose({ code, reason, wasClean: true });
        }
    }

    close = jest.fn(); // Mock the close method
}

// Assign our mock to the global scope that JSDOM provides
global.WebSocket = MockWebSocket;

// Mock the UIkit modal if you need to test its interactions
const mockUIkit = {
    modal: jest.fn(() => ({
        show: jest.fn(),
        hide: jest.fn(),
    }))
};
global.UIkit = mockUIkit;

// Mock the global fetch function
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ /* Mock your API response structure here for /api/workflows/flux_kontext */ }),
        text: () => Promise.resolve(''),
        ok: true,
        status: 200,
    })
);

// Mock console.error, console.warn, console.log globally
global.console.error = jest.fn();
global.console.warn = jest.fn();
global.console.log = jest.fn();


describe('paltech.js WebSocket behavior', () => {
    let wsInstance;

    beforeEach(async () => {
        // Clear all mock instances and calls before each test
        MockWebSocket.instances = [];
        jest.clearAllMocks();

        // 1. Set up a comprehensive DOM structure for paltech.js to interact with
        document.body.innerHTML = `
            <div id="modal-message"></div>
            <div id="modal-message-modal"></div> <div id="image-dimension-presets">
                <input type="radio" name="image-size-radio" id="size-square" value="square" checked>
                <input type="radio" name="image-size-radio" id="size-tall" value="tall">
                <input type="radio" name="image-size-radio" id="size-wide" value="wide">
            </div>
            <input type="checkbox" id="is-random">
            <input type="file" id="image-input">
            <button id="generate"></button>
            <button id="interrupt"></button>

            <button id="connect-button"></button>
            <button id="disconnect-button"></button>
            <select id="workflow-select"></select>
            <input id="positive-input">
            <input id="negative-input">
            <input id="steps-input">
            <input id="cfg-input">
            <input id="sampler-input">
            <input id="scheduler-input">
            <input id="seed-input">
            <input id="clip-skip-input">
            <input id="dimensions-width">
            <input id="dimensions-height">
            <select id="dimensions-select"></select>
            <input id="generate-count">
            <input id="batch-size">
            <div id="status-text"></div>
            <div id="status-progress"></div>
            <img id="output-image">
            <div id="output-gallery"></div>
            <div id="output-controls"></div>
            <div id="progress-bar"></div>
            <div id="progress-text"></div>
            <div id="progress-bar-container"></div>
            <div id="modal-info"></div>
            <div id="info-text"></div>
            <div id="interrupt-message"></div>
            <input id="send-prompt-input">
            <button id="send-prompt-button"></button>
            <div id="chat-output"></div>
            <div id="message-template"></div>
            <div id="prompt-template"></div>
            <div id="modal-send-image"></div>
            <img id="upload-image-preview">
            <input type="file" id="upload-image-input">
            <button id="send-image-button"></button>
            <button id="send-file-button"></button>
            <button id="toggle-info-panel"></button>
            <div id="connect-status"></div>
            <div id="image-settings-container"></div>
            <div id="workflow-settings-container"></div>
            <div id="chat-controls-container"></div>
            <div id="image-upload-container"></div>
            <div id="workflow-output-container"></div>
            <div id="info-panel-container"></div>
            <div id="main-content-container"></div>
        `;

        // 2. Reset modules and re-require paltech.js
        jest.resetModules();
        require('./paltech.js'); // Make sure this path is correct based on your project structure

        // Allow time for all initial module loading side effects to complete
        await new Promise(resolve => setTimeout(resolve, 100)); // Increased delay for robustness

        // Debug log (keep for now)
        console.log('MockWebSocket.instances.length before assertion:', MockWebSocket.instances.length);


        // 3. Assert WebSocket instance creation
        expect(MockWebSocket.instances).toHaveLength(1);
        wsInstance = MockWebSocket.instances[0];
    });

    test('should attempt to connect to WebSocket on script load', () => {
        // Corrected regex to accurately match "ws://localhost:/ws" structure
        expect(wsInstance.url).toMatch(/^ws:\/\/localhost:\/ws\?clientId=[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/);
        expect(wsInstance.readyState).toBe(MockWebSocket.CONNECTING);
        // Ensure fetch was called for loading workflows
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/js/flux_kontext'));
    });

    test('should handle WebSocket connection open', () => {
        wsInstance._simulateOpen();
        expect(wsInstance.readyState).toBe(MockWebSocket.OPEN);
        // Add expectations for what happens when WebSocket opens in paltech.js
    });

    test('should handle incoming WebSocket messages', () => {
        const testData = { type: 'hello', payload: 'world' };
        wsInstance._simulateMessage(testData);

        // Add assertions based on how paltech.js processes messages
    });

    test('should attempt to reconnect on WebSocket close (unclean)', async () => { // Made test async
        const MAX_RECONNECT_ATTEMPTS = 5;

        wsInstance._simulateClose(1006, 'Abnormal closure');
        await Promise.resolve(); // Allow DOM updates from onclose handler to process

        const modalMessageEl = document.querySelector('#modal-message');
        // Debug logs for innerHTML
        console.log('modalMessageEl existence:', !!modalMessageEl);
        if (modalMessageEl) {
            console.log('modalMessageEl.tagName:', modalMessageEl.tagName);
            console.log('modalMessageEl.id:', modalMessageEl.id);
            console.log('modalMessageEl.innerHTML BEFORE assertion (reconnect):', modalMessageEl.innerHTML);
        }
        expect(modalMessageEl.innerHTML).toContain('WebSocket connection lost. Attempting to reconnect...');
        // Expect UIkit.modal to be called with the actual modal element
        expect(mockUIkit.modal).toHaveBeenCalledWith(document.querySelector('#modal-message-modal'));
        expect(mockUIkit.modal().show).toHaveBeenCalled();

        jest.useFakeTimers();

        for (let i = 1; i <= MAX_RECONNECT_ATTEMPTS; i++) {
            jest.advanceTimersByTime(2000);
            expect(MockWebSocket.instances.length).toBe(1 + i);
            let currentWs = MockWebSocket.instances[MockWebSocket.instances.length - 1];
            // Adjusted URL expectation for reconnects as well
            expect(currentWs.url).toMatch(/^ws:\/\/localhost:\/ws\?clientId=[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/);
            expect(currentWs.readyState).toBe(MockWebSocket.CONNECTING);
        }

        jest.advanceTimersByTime(2000);
        expect(modalMessageEl.innerHTML).toContain('Max reconnect attempts reached');
        expect(mockUIkit.modal().show).toHaveBeenCalledTimes(MAX_RECONNECT_ATTEMPTS + 1);

        jest.useRealTimers();
    });

    test('should handle WebSocket errors', async () => { // Made test async
        const mockError = new Error('Network error');
        wsInstance._simulateError(mockError);
        await Promise.resolve(); // Allow DOM updates from onerror handler to process

        expect(console.error).toHaveBeenCalledWith('WebSocket Error:', mockError);

        const modalMessageEl = document.querySelector('#modal-message');
        // Debug logs for innerHTML
        console.log('modalMessageEl existence:', !!modalMessageEl);
        if (modalMessageEl) {
            console.log('modalMessageEl.tagName:', modalMessageEl.tagName);
            console.log('modalMessageEl.id:', modalMessageEl.id);
            console.log('modalMessageEl.innerHTML BEFORE assertion (error):', modalMessageEl.innerHTML);
        }
        expect(modalMessageEl.innerHTML).toContain('WebSocket connection error. Attempting to reconnect...');
        // Expect UIkit.modal to be called with the actual modal element
        expect(mockUIkit.modal).toHaveBeenCalledWith(document.querySelector('#modal-message-modal'));
        expect(mockUIkit.modal().show).toHaveBeenCalled();
    });
});