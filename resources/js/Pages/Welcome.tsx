import BrandLogo from '@/Components/BrandLogo';
import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import { CheckCircle2, Dumbbell, Eye, EyeOff } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

export default function Welcome({
    canRegister,
    canResetPassword,
    status,
}: {
    canRegister: boolean;
    canResetPassword: boolean;
    status?: string;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });
    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const inputClass =
        'w-full rounded-xl border border-zinc-600 bg-zinc-900 px-4 py-3 text-base text-zinc-100 placeholder-zinc-400 outline-none transition-colors focus:border-lime-400 focus:ring-2 focus:ring-lime-400';

    return (
        <>
            <Head title="Log in" />
            {/* Always dark: lime on near-black is the Gerak.in look, shared with GuestLayout. */}
            <div className="min-h-screen bg-zinc-950 text-zinc-100 lg:grid lg:grid-cols-[1fr_1.1fr]">
                {/* ===== Kolom kiri: form login ===== */}
                <div className="flex min-h-screen flex-col px-6 py-6 sm:px-12">
                    <Link href="/" className="flex w-fit items-center gap-2.5">
                        <BrandLogo size="lg" accent="text-lime-400" />
                    </Link>

                    <div className="flex flex-1 items-center justify-center py-10">
                        <div className="w-full max-w-sm">
                            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Welcome back</h1>
                            <p className="mt-2 text-base text-zinc-400">
                                Log in to continue training with intent.
                            </p>

                            {status && (
                                <div role="status" className="mt-6 rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-3 text-sm font-medium text-lime-300">
                                    {status}
                                </div>
                            )}

                            <form onSubmit={submit} className="mt-8 space-y-5">
                                <div>
                                    <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-zinc-200">
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        autoComplete="username"
                                        autoFocus
                                        placeholder="you@example.com"
                                        onChange={(e) => setData('email', e.target.value)}
                                        className={inputClass}
                                    />
                                    <InputError htmlFor="email" message={errors.email} className="mt-2" />
                                </div>

                                <div>
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <label htmlFor="password" className="block text-sm font-semibold text-zinc-200">
                                            Password
                                        </label>
                                        {canResetPassword && (
                                            <Link
                                                href={route('password.request')}
                                                className="text-sm font-medium text-zinc-400 hover:text-lime-300"
                                            >
                                                Forgot password?
                                            </Link>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={data.password}
                                            autoComplete="current-password"
                                            placeholder="Enter your password"
                                            onChange={(e) => setData('password', e.target.value)}
                                            className={`${inputClass} pr-12`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            aria-label="Show password"
                                            aria-pressed={showPassword}
                                            aria-controls="password"
                                            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-zinc-400 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lime-400"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
                                        </button>
                                    </div>
                                    <InputError htmlFor="password" message={errors.password} className="mt-2" />
                                </div>

                                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-400">
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="h-4 w-4 rounded border-zinc-500 bg-zinc-900 text-lime-400 focus:ring-lime-400 focus:ring-offset-zinc-950"
                                    />
                                    Remember me on this device
                                </label>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="min-h-11 w-full rounded-xl bg-lime-400 py-3 text-base font-bold text-zinc-950 transition-[background-color,transform] duration-150 ease-out hover:bg-lime-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:enabled:active:scale-[0.96]"
                                >
                                    {processing ? 'Logging in…' : 'Log in'}
                                </button>
                            </form>

                            {canRegister && (
                                <p className="mt-8 text-center text-sm text-zinc-400">
                                    Don&apos;t have an account?{' '}
                                    <Link href={route('register')} className="font-bold text-zinc-100 underline decoration-lime-400 decoration-2 underline-offset-4 hover:text-lime-300">
                                        Sign up
                                    </Link>
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ===== Kolom kanan: showcase produk ===== */}
                <div className="hidden border-l border-zinc-800 bg-zinc-900 lg:block">
                    <div className="flex min-h-screen flex-col items-center justify-center px-12 py-12">
                        <h2 className="max-w-md text-center text-3xl font-extrabold leading-snug tracking-tight">
                            Your workouts, routines &amp; PRs in one place.
                        </h2>

                        {/* mockup ponsel */}
                        <div className="mt-10" aria-hidden="true">
                            <div className="w-[290px] rounded-[2.5rem] border border-zinc-700 bg-black p-2.5">
                                <div className="rounded-[2rem] bg-zinc-950 p-4">
                                    <div className="mx-auto h-5 w-24 rounded-full bg-black ring-1 ring-zinc-800" />
                                    <div className="mt-3 flex items-center justify-between text-[13px]">
                                        <span className="font-bold">Log workout</span>
                                        <span className="font-bold text-lime-400">Finish</span>
                                    </div>
                                    <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[11px]">
                                        <div className="rounded-lg bg-zinc-900 p-2">
                                            <p className="text-zinc-400">Duration</p>
                                            <p className="mt-0.5 font-bold">1h 13m</p>
                                        </div>
                                        <div className="rounded-lg bg-zinc-900 p-2">
                                            <p className="text-zinc-400">Volume</p>
                                            <p className="mt-0.5 font-bold">8,200 kg</p>
                                        </div>
                                        <div className="rounded-lg bg-zinc-900 p-2">
                                            <p className="text-zinc-400">Sets</p>
                                            <p className="mt-0.5 font-bold">28</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 space-y-1.5 text-[12px]">
                                        <div className="flex items-center gap-1.5 font-bold">
                                            <Dumbbell className="h-3.5 w-3.5 text-lime-400" />
                                            Bench Press (Barbell)
                                        </div>
                                        {[
                                            ['30kg × 6', true],
                                            ['52.5kg × 6', true],
                                            ['55kg × 5', false],
                                        ].map(([w, done], i) => (
                                            <div
                                                key={i}
                                                className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 ${
                                                    done ? 'bg-lime-400 font-bold text-zinc-950' : 'bg-zinc-900 text-zinc-400'
                                                }`}
                                            >
                                                <span>{w}</span>
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sample numbers: label them so they don't read as real user data. */}
                        <p className="mt-8 text-sm text-zinc-400">Example screen with sample numbers, not real user data.</p>
                    </div>
                </div>
            </div>
        </>
    );
}
