export function validateName(name: string): boolean {
    // Name must be at least 3 non-space characters
    return name.trim().length >= 3;
}

/**
 * Format a name string: trim, collapse multiple spaces, and capitalize each word.
 */
export function formatName(name: string): string {
    return name
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}
