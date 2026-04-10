(function attachDebugNamespaces(global) {
    'use strict';

    const STORAGE_KEY = 'rougecow_debug_namespaces';

    function normalizeNamespace(value) {
        return String(value || '').trim().toLowerCase();
    }

    function parseFromSearch() {
        const search = new URLSearchParams(global.location?.search || '');
        const raw = search.get('debug_ns') || search.get('debugNs') || '';
        if (!raw) return new Set();
        return new Set(
            raw
                .split(',')
                .map(normalizeNamespace)
                .filter(Boolean)
        );
    }

    function parseFromStorage() {
        try {
            const raw = global.localStorage?.getItem(STORAGE_KEY) || '';
            if (!raw) return new Set();
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return new Set();
            return new Set(parsed.map(normalizeNamespace).filter(Boolean));
        } catch (_) {
            return new Set();
        }
    }

    const storageNamespaces = parseFromStorage();
    const searchNamespaces = parseFromSearch();
    const enabledNamespaces = new Set([
        ...Array.from(storageNamespaces),
        ...Array.from(searchNamespaces)
    ]);

    function persist() {
        try {
            const sorted = Array.from(enabledNamespaces).sort();
            global.localStorage?.setItem(STORAGE_KEY, JSON.stringify(sorted));
        } catch (_) {
            // ignore persistence failures
        }
    }

    function isEnabled(namespace) {
        const key = normalizeNamespace(namespace);
        if (!key) return false;
        return enabledNamespaces.has('*') || enabledNamespaces.has(key);
    }

    function isSearchEnabled(namespace) {
        const key = normalizeNamespace(namespace);
        if (!key) return false;
        return searchNamespaces.has('*') || searchNamespaces.has(key);
    }

    function setEnabled(namespace, enabled, options = {}) {
        const key = normalizeNamespace(namespace);
        if (!key) return false;
        if (enabled) enabledNamespaces.add(key);
        else enabledNamespaces.delete(key);
        if (options.persist !== false) persist();
        return true;
    }

    function list() {
        return Array.from(enabledNamespaces).sort();
    }

    global.DebugNamespaces = {
        isEnabled,
        isSearchEnabled,
        setEnabled,
        list,
        storageKey: STORAGE_KEY
    };
})(window);
