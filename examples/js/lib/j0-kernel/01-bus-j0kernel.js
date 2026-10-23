class EventChannel {
    constructor(name) {
        this.name = name;
        this._handlers = new Map();
    }

    emit(action, payload = {}) {
        if (window.j0 && window.j0.QA && window.j0.bus && window.j0.bus.schema) {
            const contract = window.j0.bus.schema[action];
            if (contract) {
                for (const [key, expectedType] of Object.entries(contract)) {
                    const actualType = typeof payload[key];
                    if (actualType !== expectedType) {
                        const msg = `[J0_BUS_SCHEMA] Payload inválido en evento '${action}': '${key}' debe ser '${expectedType}', recibido '${actualType}'.`;
                        if (window.j0?.logger) window.j0.logger.error(msg);
                        else console.error(msg);
                        throw new Error(msg);
                    }
                }
            }
        }

        const set = this._handlers.get(action);
        if (!set || set.size === 0) return;
        
        new Set(set).forEach(fn => {
            try { 
                fn(payload); 
            } catch (e) { 
                const fnSource = fn.toString().substring(0, 50) + "...";
                if (window.j0 && window.j0.logger) {
                    window.j0.logger.error(`[TELEMETRÍA] CRASH en Bus '${this.name}' evento '${action}'. Handler: ${fnSource}`, e);
                } else {
                    console.error(`[TELEMETRÍA] CRASH en Bus '${this.name}' evento '${action}':`, e);
                }
            }
        });
    }

    on(action, handler) {
        if (!this._handlers.has(action)) this._handlers.set(action, new Set());
        this._handlers.get(action).add(handler);
        return () => {
            const set = this._handlers.get(action);
            if (set) {
                set.delete(handler);
                if (set.size === 0) this._handlers.delete(action);
            }
        };
    }
}