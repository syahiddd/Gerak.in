import { btn } from '@/Components/ui';
import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return <button {...props} className={`${btn.primary} ${className}`} />;
}
