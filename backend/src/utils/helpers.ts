export function generateResponse(success: boolean, message: string, data?: any) {
    return {
        success,
        message,
        data: data || null,
    };
}

export function parseJsonBody(req: any) {
    try {
        return JSON.parse(req.body);
    } catch (error) {
        throw new Error('Invalid JSON body');
    }
}

export function isEmpty(value: any) {
    return value === null || value === undefined || value === '';
}

export function formatDate(date: Date, format: string) {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Intl.DateTimeFormat('en-US', options).format(date);
}