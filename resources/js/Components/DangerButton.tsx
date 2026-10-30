import { btn } from '@/Components/ui';
import { ButtonHTMLAttributes } from 'react';

export default function DangerButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return <button {...props} className={`${btn.dangerSolid} ${className}`} />;
}
