import InputError from '@/Components/InputError';
import Modal from '@/Components/Modal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Routine, RoutineFolder } from '@/types';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, ReactNode, useState } from 'react';

type FolderDialog = { mode: 'create' } | { mode: 'rename'; folder: RoutineFolder } | null;

export default function RoutineIndex({ folders, ungrouped }: { folders: RoutineFolder[]; ungrouped: Routine[] }) {
    const [dialog, setDialog] = useState<FolderDialog>(null);

    return (
        <AuthenticatedLayout>
            <Head title="Routines" />

            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Routines</h1>

            <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
                {/* Actions first on mobile, right column on desktop — same as Hevy. */}
                <aside className="rounded-2xl bg-white p-2 ring-1 ring-zinc-200 lg:sticky lg:top-6 lg:order-2 dark:bg-zinc-900 dark:ring-zinc-800">
                    <ActionRow href={route('routines.create')} icon={<ClipboardIcon />} label="New Routine" />
                    <div className="mx-4 h-px bg-zinc-200 dark:bg-zinc-800" />
                    <ActionRow onClick={() => setDialog({ mode: 'create' })} icon={<FolderPlusIcon />} label="New Folder" />
                </aside>

                <div className="space-y-6 lg:order-1">
                    <Section title="My Routines" count={ungrouped.length}>
                        {ungrouped.length === 0 ? (
                            <EmptyCard
                                text={folders.length ? 'Every routine is in a folder.' : 'No routines yet. Build one once and start it in a tap every time you train.'}
                                showCta={folders.length === 0}
                            />
                        ) : (
                            ungrouped.map((r) => <RoutineCard key={r.id} routine={r} />)
                        )}
                    </Section>

                    {folders.map((folder) => (
                        <Section
                            key={folder.id}
                            title={folder.name}
                            count={folder.routines.length}
                            menu={
                                <KebabMenu label={`Folder options for ${folder.name}`}>
                                    <MenuAction onClick={() => setDialog({ mode: 'rename', folder })}>Rename folder</MenuAction>
                                    <MenuAction
                                        danger
                                        onClick={() => {
                                            if (confirm(`Delete "${folder.name}"? Its routines move to My Routines.`)) {
                                                router.delete(route('folders.destroy', folder.id), { preserveScroll: true });
                                            }
                                        }}
                                    >
                                        Delete folder
                                    </MenuAction>
                                </KebabMenu>
                            }
                        >
                            {folder.routines.length === 0 ? (
                                <EmptyCard text="This folder is empty. Pick a folder when you create or edit a routine." />
                            ) : (
                                folder.routines.map((r) => <RoutineCard key={r.id} routine={r} />)
                            )}
                        </Section>
                    ))}
                </div>
            </div>

            <FolderModal dialog={dialog} onClose={() => setDialog(null)} />
        </AuthenticatedLayout>
    );
}

function Section({ title, count, menu, children }: { title: string; count: number; menu?: ReactNode; children: ReactNode }) {
    const [open, setOpen] = useState(true);

    return (
        <section>
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    aria-expanded={open}
                    className="-ml-1 flex items-center gap-3 rounded-lg px-1 py-1 text-zinc-500 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 dark:text-zinc-400 dark:hover:text-white"
                >
                    <svg viewBox="0 0 20 20" className={`h-4 w-4 transition-transform motion-reduce:transition-none ${open ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M5 7.5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-base">
                        {title} ({count})
                    </span>
                </button>
                {menu}
            </div>
            {open && <div className="mt-3 space-y-3">{children}</div>}
        </section>
    );
}

function RoutineCard({ routine }: { routine: Routine }) {
    const names = routine.exercises?.map((e) => e.exercise?.name).filter(Boolean) ?? [];
    const summary = names.length ? names.join(', ') : 'No exercises yet';

    return (
        <article className="group relative rounded-2xl bg-white px-6 py-5 ring-1 ring-zinc-200 transition hover:ring-lime-400 dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:ring-lime-400/60">
            <div className="flex items-start justify-between gap-4">
                <h3 className="min-w-0 truncate text-lg font-bold">
                    {/* Stretched link: the whole card opens the routine, the menu stays clickable above it. */}
                    <Link
                        href={route('routines.show', routine.id)}
                        className="rounded after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-lime-400"
                    >
                        {routine.name}
                    </Link>
                </h3>
                <div className="relative z-10 -mr-2 -mt-1">
                    <KebabMenu label={`Options for ${routine.name}`}>
                        <MenuAction onClick={() => router.visit(route('routines.edit', routine.id))}>Edit routine</MenuAction>
                        <MenuAction onClick={() => router.post(route('routines.duplicate', routine.id))}>Duplicate routine</MenuAction>
                        <MenuAction
                            danger
                            onClick={() => {
                                if (confirm(`Delete "${routine.name}"? This can't be undone.`)) {
                                    router.delete(route('routines.destroy', routine.id), { preserveScroll: true });
                                }
                            }}
                        >
                            Delete routine
                        </MenuAction>
                    </KebabMenu>
                </div>
            </div>
            <p className="mt-2 truncate text-[15px] text-zinc-500 dark:text-zinc-400" title={summary}>
                {summary}
            </p>
        </article>
    );
}

function KebabMenu({ label, children }: { label: string; children: ReactNode }) {
    return (
        <Menu as="div" className="relative">
            <MenuButton
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
                    <circle cx="4" cy="10" r="1.6" />
                    <circle cx="10" cy="10" r="1.6" />
                    <circle cx="16" cy="10" r="1.6" />
                </svg>
            </MenuButton>
            <MenuItems
                anchor="bottom end"
                className="z-50 mt-1 w-48 rounded-xl bg-white p-1 text-sm shadow-lg ring-1 ring-zinc-200 focus:outline-none dark:bg-zinc-800 dark:ring-zinc-700"
            >
                {children}
            </MenuItems>
        </Menu>
    );
}

function MenuAction({ onClick, danger = false, children }: { onClick: () => void; danger?: boolean; children: ReactNode }) {
    return (
        <MenuItem>
            <button
                type="button"
                onClick={onClick}
                className={`block w-full rounded-lg px-3 py-2 text-left data-[focus]:bg-zinc-100 dark:data-[focus]:bg-zinc-700 ${
                    danger ? 'text-red-600 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-200'
                }`}
            >
                {children}
            </button>
        </MenuItem>
    );
}

function ActionRow({ href, onClick, icon, label }: { href?: string; onClick?: () => void; icon: ReactNode; label: string }) {
    const inner = (
        <>
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-white">
                {icon}
            </span>
            <span className="flex-1 text-left font-bold">{label}</span>
            <svg viewBox="0 0 20 20" className="h-5 w-5 text-zinc-400 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M7.5 5l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </>
    );
    const cls =
        'group flex w-full items-center gap-5 rounded-xl px-4 py-4 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 dark:hover:bg-zinc-800/60';

    return href ? (
        <Link href={href} className={cls}>
            {inner}
        </Link>
    ) : (
        <button type="button" onClick={onClick} className={cls}>
            {inner}
        </button>
    );
}

function EmptyCard({ text, showCta = false }: { text: string; showCta?: boolean }) {
    return (
        <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-8 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{text}</p>
            {showCta && (
                <Link href={route('routines.create')} className="mt-4 inline-block rounded-xl bg-lime-400 px-4 py-2 text-sm font-bold text-zinc-950">
                    New Routine
                </Link>
            )}
        </div>
    );
}

function FolderModal({ dialog, onClose }: { dialog: FolderDialog; onClose: () => void }) {
    const form = useForm({ name: '' });
    const renaming = dialog?.mode === 'rename';

    // Seed the field each time the dialog opens.
    const [seededFor, setSeededFor] = useState<FolderDialog>(null);
    if (dialog !== seededFor) {
        setSeededFor(dialog);
        form.setData('name', dialog?.mode === 'rename' ? dialog.folder.name : '');
        form.clearErrors();
    }

    const close = () => {
        onClose();
        form.reset();
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const opts = { preserveScroll: true, onSuccess: close };
        if (dialog?.mode === 'rename') {
            form.patch(route('folders.update', dialog.folder.id), opts);
        } else {
            form.post(route('folders.store'), opts);
        }
    };

    return (
        <Modal show={dialog !== null} onClose={close} maxWidth="sm">
            <form onSubmit={submit} className="p-6 dark:bg-zinc-900">
                <h2 className="text-lg font-bold dark:text-white">{renaming ? 'Rename folder' : 'New folder'}</h2>
                <label htmlFor="folder-name" className="mt-4 block text-sm text-zinc-500 dark:text-zinc-400">
                    Folder name
                </label>
                <input
                    id="folder-name"
                    autoFocus
                    required
                    maxLength={80}
                    value={form.data.name}
                    onChange={(e) => form.setData('name', e.target.value)}
                    placeholder="e.g. Push Pull Legs"
                    className="mt-1 block w-full rounded-xl border-zinc-300 focus:border-lime-400 focus:ring-lime-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
                <InputError message={form.errors.name} className="mt-2" />
                <div className="mt-6 flex justify-end gap-2">
                    <button type="button" onClick={close} className="rounded-xl px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
                        Cancel
                    </button>
                    <button disabled={form.processing} className="rounded-xl bg-lime-400 px-4 py-2 text-sm font-bold text-zinc-950 disabled:opacity-60">
                        {renaming ? 'Save name' : 'Create folder'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function ClipboardIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="4" width="14" height="17" rx="2.5" />
            <path d="M9 4.5h6V3H9zM9 10h6M9 14h6M9 18h3" />
        </svg>
    );
}

function FolderPlusIcon() {
    return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7.5A2.5 2.5 0 015.5 5H9l2 2h7.5A2.5 2.5 0 0121 9.5v8a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 17.5z" />
            <path d="M12 11v5M9.5 13.5h5" />
        </svg>
    );
}
