import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { InertiaLinkProps, Link } from '@inertiajs/react';
import { ButtonHTMLAttributes, Fragment, PropsWithChildren, ReactElement } from 'react';

// Headless UI Menu gives Escape, arrow keys, focus return and aria-expanded for free.
const itemBase = 'flex min-h-11 w-full items-center gap-2 px-4 text-start text-sm data-[focus]:outline-none';
const itemTone = (danger: boolean) =>
    danger
        ? 'font-semibold text-red-600 data-[focus]:bg-red-50 dark:text-red-400 dark:data-[focus]:bg-red-950/40'
        : 'text-zinc-700 data-[focus]:bg-zinc-100 dark:text-zinc-200 dark:data-[focus]:bg-zinc-700';

const Dropdown = ({ children }: PropsWithChildren) => (
    <Menu as="div" className="relative">
        {children}
    </Menu>
);

/** The child must be a single focusable element, usually a <button>. */
const Trigger = ({ children }: { children: ReactElement }) => <MenuButton as={Fragment}>{children}</MenuButton>;

const Content = ({
    align = 'right',
    width = '48',
    contentClasses = 'py-1 bg-white dark:bg-zinc-800',
    children,
}: PropsWithChildren<{
    align?: 'left' | 'right' | 'top';
    width?: '48' | 'full';
    contentClasses?: string;
}>) => {
    const anchor = align === 'top' ? 'top start' : align === 'left' ? 'bottom start' : 'bottom end';

    return (
        <MenuItems
            anchor={anchor}
            transition
            className={`z-50 rounded-xl shadow-lg ring-1 ring-black/5 [--anchor-gap:0.5rem] focus:outline-none dark:ring-white/10 ${
                width === 'full' ? 'w-[var(--button-width)]' : 'w-48'
            } ${contentClasses} origin-top transition duration-150 ease-out data-[closed]:opacity-0 motion-safe:data-[closed]:scale-95`}
        >
            {children}
        </MenuItems>
    );
};

const DropdownLink = ({ className = '', ...props }: InertiaLinkProps) => (
    <MenuItem>
        <Link {...props} className={`${itemBase} ${itemTone(false)} ${className}`} />
    </MenuItem>
);

const DropdownButton = ({ className = '', danger = false, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) => (
    <MenuItem>
        <button type="button" {...props} className={`${itemBase} ${itemTone(danger)} ${className}`} />
    </MenuItem>
);

Dropdown.Trigger = Trigger;
Dropdown.Content = Content;
Dropdown.Link = DropdownLink;
Dropdown.Button = DropdownButton;

export default Dropdown;
