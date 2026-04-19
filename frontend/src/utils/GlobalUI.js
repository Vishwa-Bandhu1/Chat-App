// src/utils/GlobalUI.js

class GlobalUIEmitter {
    listeners = {};

    on(event, listener) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
        return () => {
            this.listeners[event] = this.listeners[event].filter(l => l !== listener);
        };
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(listener => listener(data));
        }
    }

    // Sugar methods
    showLoader(text = "Loading...") {
        this.emit('loader', { visible: true, text });
    }

    hideLoader() {
        this.emit('loader', { visible: false });
    }

    showToast(message, type = 'error') {
        this.emit('toast', { visible: true, message, type });
    }
}

export const GlobalUI = new GlobalUIEmitter();
export default GlobalUI;
