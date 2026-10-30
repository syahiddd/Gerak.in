import Modal from '@/Components/Modal';
import { btn } from '@/Components/ui';
import { useEffect, useState } from 'react';

interface ConfirmOptions {
    title: string;
    body?: string;
    confirmLabel?: string;
    /** Red confirm button for destructive actions (default true). */
    danger?: boolean;
}

let ask: ((opts: ConfirmOptions) => Promise<boolean>) | null = null;

/** Themed replacement for window.confirm(). Resolves true when the user confirms. */
export function confirmAction(opts: ConfirmOptions): Promise<boolean> {
    // Falls back to the native dialog on pages that don't mount <ConfirmHost />.
    return ask ? ask(opts) : Promise.resolve(window.confirm(opts.title));
}

/** Mounted once in the app layout; renders whatever confirmAction() asks for. */
export function ConfirmHost() {
    const [opts, setOpts] = useState<ConfirmOptions | null>(null);
    const [show, setShow] = useState(false);
    const [resolver, setResolver] = useState<((ok: boolean) => void) | null>(null);

    useEffect(() => {
        ask = (o) =>
            new Promise<boolean>((resolve) => {
                setOpts(o);
                setResolver(() => resolve);
                setShow(true);
            });
        return () => {
            ask = null;
        };
    }, []);

    // Content stays mounted while the modal fades out, so it doesn't flash empty.
    const finish = (ok: boolean) => {
        resolver?.(ok);
        setResolver(null);
        setShow(false);
    };

    const danger = opts?.danger ?? true;

    return (
        <Modal show={show} maxWidth="sm" onClose={() => finish(false)}>
            <div className="p-6">
                <h2 className="text-lg font-extrabold">{opts?.title}</h2>
                {opts?.body && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{opts.body}</p>}
                <div className="mt-6 flex flex-wrap justify-end gap-2">
                    {/* Destructive: focus Cancel so a stray Enter does nothing harmful. */}
                    <button type="button" onClick={() => finish(false)} className={btn.ghost} autoFocus={danger}>
                        Cancel
                    </button>
                    <button type="button" onClick={() => finish(true)} className={danger ? btn.dangerSolid : btn.primary} autoFocus={!danger}>
                        {opts?.confirmLabel ?? 'Confirm'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
