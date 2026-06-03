const LOOPBACK_HOSTS = new Set(['localhost', '::1', '[::1]']);

const normalizeLoopbackUrl = (rawUrl) => {
    const value = String(rawUrl || '').trim();
    if (!value) {
        return value;
    }

    try {
        const parsed = new URL(value);
        if (LOOPBACK_HOSTS.has(parsed.hostname)) {
            parsed.hostname = '127.0.0.1';
        }
        return parsed.toString();
    } catch (error) {
        return value.replace(/\/\/localhost(?=[:/]|$)/i, '//127.0.0.1');
    }
};

module.exports = {
    normalizeLoopbackUrl
};
