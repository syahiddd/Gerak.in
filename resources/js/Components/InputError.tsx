import { HTMLAttributes, useEffect } from 'react';

/**
 * Inline field error. With `htmlFor` it also marks that field aria-invalid and points
 * its aria-describedby here, so screen readers read the error with the field.
 */
export default function InputError({
    message,
    htmlFor,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string; htmlFor?: string }) {
    const errorId = htmlFor ? `${htmlFor}-error` : undefined;

    useEffect(() => {
        const field = htmlFor ? document.getElementById(htmlFor) : null;
        if (!field || !message || !errorId) return;
        const before = field.getAttribute('aria-describedby');
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', [before, errorId].filter(Boolean).join(' '));
        return () => {
            field.removeAttribute('aria-invalid');
            if (before) field.setAttribute('aria-describedby', before);
            else field.removeAttribute('aria-describedby');
        };
    }, [htmlFor, errorId, message]);

    return message ? (
        <p {...props} id={errorId} className={'text-sm text-red-600 dark:text-red-400 ' + className}>
            {message}
        </p>
    ) : null;
}
