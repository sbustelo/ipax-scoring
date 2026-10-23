(function () {
	"use strict";
	
	if (window.j0 && window.j0.registry) return;

	window.j0 = window.j0 || {};
	
	// [!] RESTAURACIÓN ARQUITECTÓNICA: Instanciación real del Bus de Eventos.
	window.j0.bus = window.j0.bus || new EventChannel("global");
	window.j0.bus.schema = window.j0.bus.schema || {};

	window.j0.registry = window.j0.registry || new Map();
	window.j0.manifest = window.j0.manifest || { bases: {}, tpl_bases: {} };

    window.j0.logger = window.j0.logger || {
        _bootQueue: [],
        _isBroken: false,
        _flushNative: function() {
            this._bootQueue.forEach(item => {
                const out = `[J0:PRE-BOOT] [${item.type}] ${item.msg}`;
                if (item.type === 'ERROR') console.error(out, item.data || '');
                else if (item.type === 'WARN') console.warn(out, item.data || '');
                else console.log(out, item.data || '');
            });
            this._bootQueue = [];
            this._isBroken = true;
        },
        log: function(msg, data) { 
            if (this._isBroken) console.log(`[J0:PRE-BOOT] [INFO] ${msg}`, data || '');
            else this._bootQueue.push({ type: 'INFO', msg, data }); 
        },
        warn: function(msg, data) { 
            if (this._isBroken) console.warn(`[J0:PRE-BOOT] [WARN] ${msg}`, data || '');
            else this._bootQueue.push({ type: 'WARN', msg, data }); 
        },
        error: function(msg, data) { 
            this._bootQueue.push({ type: 'ERROR', msg, data });
            this._flushNative();
        }
    };

    setTimeout(() => {
        if (window.j0.logger && window.j0.logger._bootQueue && window.j0.logger._bootQueue.length > 0) {
            console.error("[j0:Kernel] TIMEOUT: El OS j0ui no logró instanciarse. Volcando bitácora de arranque:");
            window.j0.logger._flushNative();
        }
    }, 3000);

	window.j0.i18n = {
		dicts: {},
		stringsEmitted: new Set(),
        isReady: false,
		slugify: function(text) {
			if (!text) return '';
			return text
				.replace(/<[^>]*>/g, '')
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "")
				.toLowerCase()
				.replace(/[^a-z0-9]/g, "")
				.substring(0, 40);
		},
		add: function(lang, translations) {
			if (!this.dicts[lang]) this.dicts[lang] = {};
			for (const [key, value] of Object.entries(translations)) {
				if (window.j0.env === 'local' && this.dicts[lang][key] && this.dicts[lang][key] !== value) {
					if (window.j0.logger) window.j0.logger.warn(`[i18n:Collision] La llave '${key}' ('${this.dicts[lang][key]}') fue pisada por '${value}'.`);
				}
				this.dicts[lang][key] = value;
			}
			if (window.j0.bus) window.j0.bus.emit('j0:i18n:dictionary-updated', { lang });
		},
        updateDOM: function(forceFallback = false) {
            const lang = window.j0.lang || document.documentElement.lang || 'en';
            const dict = this.dicts[lang] || {};

            document.querySelectorAll('.j0ui-text-spinner[data-j0-i18n-key]').forEach(el => {
                const key = el.getAttribute('data-j0-i18n-key');
                let resolvedText = null;
                
                if (!forceFallback && dict[key] !== undefined) {
                    resolvedText = dict[key];
                } else {
                    const delNode = el.querySelector('del');
                    resolvedText = delNode ? delNode.textContent : key;
                }

                el.innerHTML = resolvedText;
                el.removeAttribute('aria-busy');
                el.removeAttribute('aria-label');
                el.classList.remove('j0ui-text-spinner');
                el.removeAttribute('data-j0-i18n-key');
            });

            document.querySelectorAll('[data-j0-i18n-attr]').forEach(el => {
                try {
                    const map = JSON.parse(el.getAttribute('data-j0-i18n-attr'));
                    let updated = false;
                    Object.entries(map).forEach(([attr, key]) => {
                        if (!forceFallback && dict[key] !== undefined) {
                            el.setAttribute(attr, dict[key]);
                            delete map[attr];
                            updated = true;
                        } else if (forceFallback) {
                            delete map[attr];
                            updated = true;
                        }
                    });
                    if (updated) {
                        if (Object.keys(map).length === 0) el.removeAttribute('data-j0-i18n-attr');
                        else el.setAttribute('data-j0-i18n-attr', JSON.stringify(map));
                    }
                } catch (e) {}
            });
        }
	};

	window.j0.helpers = window.j0.helpers || {};

	window.j0.helpers.M = function(text) {
		if (!text) return '';
		const lang = window.j0.lang || document.documentElement.lang || 'en';
		const key = window.j0.i18n.slugify(text);
		const dict = window.j0.i18n.dicts[lang] || {};
		
        if (window.j0.i18n.isReady) {
            const resolvedValue = dict[key] !== undefined ? dict[key] : text;
            window.j0.i18n.stringsEmitted.add(resolvedValue);
            return resolvedValue;
        }

		if (dict[key] !== undefined) {
            const resolvedValue = dict[key];
            window.j0.i18n.stringsEmitted.add(resolvedValue);
		    if (window.j0.bus) window.j0.bus.emit('j0:i18n:string-emitted', { resolved: resolvedValue, key, original: text });
            return resolvedValue;
        }

        return `<span class="j0ui-text-spinner" data-j0-i18n-key="${key}" aria-busy="true" aria-label="Loading..."><del aria-hidden="true" style="visibility:hidden;pointer-events:none;">${text}</del></span>`;
	};

	window.j0.register = (name, instance) => {
		window.j0.registry.set(name, instance);
		if (window.j0.bus) window.j0.bus.emit("module:registered", { name });
	};

	window.j0.get = (name) => window.j0.registry.get(name);
})();