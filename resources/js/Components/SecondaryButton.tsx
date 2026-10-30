import { btn } from '@/Components/ui';
import { ButtonHTMLAttributes } from 'react';

export default function SecondaryButton({ type = 'button', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
    return <button {...props} type={type} className={`${btn.secondary} ${className}`} />;
}
