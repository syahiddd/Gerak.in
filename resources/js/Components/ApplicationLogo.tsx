import { SVGAttributes } from 'react';

// Gerak.in mark: monogram G whose with speed lines trailing on the left (motion).
export default function ApplicationLogo(props: SVGAttributes<SVGElement>) {
    return (
        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-label="Gerak.in" {...props}>
            <rect width="64" height="64" rx="16" fill="#A3E635" />
            <g fill="none" stroke="#09090B" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M44 20A15 15 0 1 0 47 34H36" />
                <path d="M8 26H16M6 34H14M8 42H16" strokeWidth="5" />
            </g>
        </svg>
    );
}
