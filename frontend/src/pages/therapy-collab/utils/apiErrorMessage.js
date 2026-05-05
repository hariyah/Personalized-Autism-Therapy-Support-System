export const getApiErrorMessage = (error, fallbackMessage) => {
    const responseData = error?.response?.data;

    if (responseData && typeof responseData === 'object' && typeof responseData.message === 'string') {
        return responseData.message;
    }

    if (typeof responseData === 'string') {
        if (responseData.includes('Cannot DELETE /api/parent/children/')) {
            return 'Delete profile is not available on the running therapy service yet. Restart the therapy-collab backend and try again.';
        }

        const routeErrorMatch = responseData.match(/<pre>(.*?)<\/pre>/i);
        if (routeErrorMatch?.[1]) {
            return routeErrorMatch[1].trim();
        }
    }

    return fallbackMessage;
};
