import ApplicationLogo from '@/Components/ApplicationLogo';

export default function BrandLogo({ size = 'md', accent = 'text-lime-500' }: { size?: 'md' | 'lg'; accent?: string }) {
    return (
        <span className="flex items-center gap-2.5">
            <ApplicationLogo className={size === 'lg' ? 'h-9 w-9' : 'h-8 w-8'} />
            <span className={`${size === 'lg' ? 'text-xl' : 'text-lg'} font-extrabold tracking-tight`}>
                Gerak<span className={accent}>.in</span>
            </span>
        </span>
    );
}
