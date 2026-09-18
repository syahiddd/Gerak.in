import InputError from '@/Components/InputError';
import { Head, Link, useForm } from '@inertiajs/react';
import { CheckCircle2, Dumbbell, Eye, EyeOff, Flame, TrendingUp } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

export default function Welcome({
    canLogin,
    canRegister,
    canResetPassword,
    status,
}: {
    auth: { user: { name: string } | null };
    canLogin: boolean;
    canRegister: boolean;
    canResetPassword: boolean;
    status?: string;
    laravelVersion: string;
    phpVersion: string;
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
        'w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-[15px] text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-lime-400/70 focus:ring-2 focus:ring-lime-400/20';

    return (
        <>
            <Head title="Log in" />
            <div
                className="min-h-screen text-zinc-100 lg:grid lg:grid-cols-[1fr_1.1fr]"
                style={{
                    background: 'linear-gradient(105deg, #09090b 0%, #09090b 42%, #0d1008 68%, #141b0c 100%)',
                }}
            >
                {/* ===== Kolom kiri: form login ===== */}
                <div className="flex min-h-screen flex-col px-6 py-6 sm:px-12">
                    <Link href="/" className="flex w-fit items-center gap-2.5">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-lime-400 text-xl font-extrabold text-zinc-950">
                            G
                        </span>
                        <span className="text-xl font-extrabold tracking-tight">
                            Gerak<span className="text-lime-400">.in</span>
                        </span>
                    </Link>

                    <div className="flex flex-1 items-center justify-center py-10">
                        <div className="w-full max-w-sm">
                            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Welcome back</h1>
                            <p className="mt-2 text-[15px] text-zinc-400">
                                Log in to continue training with intent.
                            </p>

                            {status && (
                                <div className="mt-6 rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-3 text-sm font-medium text-lime-300">
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
                                    <InputError message={errors.email} className="mt-2" />
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
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-500 hover:text-zinc-200"
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    <InputError message={errors.password} className="mt-2" />
                                </div>

                                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-400">
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 accent-lime-400"
                                    />
                                    Remember me on this device
                                </label>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full rounded-xl bg-lime-400 py-3 text-[15px] font-bold text-zinc-950 transition hover:bg-lime-300 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
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

                            {canLogin && (
                                <p className="mt-3 text-center text-xs text-zinc-600">
                                    Demo: demo@example.com / password
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ===== Kolom kanan: showcase produk ===== */}
                <div className="relative hidden overflow-hidden lg:block">
                    {/* pola titik + cahaya lembut */}
                    <div
                        className="absolute inset-0"
                        aria-hidden="true"
                        style={{
                            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
                            backgroundSize: '26px 26px',
                            maskImage: 'radial-gradient(ellipse 90% 80% at 50% 40%, black 30%, transparent 75%)',
                            WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 50% 40%, black 30%, transparent 75%)',
                        }}
                    />
                    <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-lime-400/10 blur-3xl" aria-hidden="true" />

                    <div className="relative flex min-h-screen flex-col items-center justify-center px-12 py-12">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-lime-400">
                            Train with intent
                        </p>
                        <h2 className="mt-3 max-w-md text-center text-3xl font-extrabold leading-snug tracking-tight">
                            Your workouts, routines &amp; PRs — in one place.
                        </h2>

                        {/* mockup ponsel */}
                        <div className="relative mt-10" aria-hidden="true">
                            <div className="w-[290px] rounded-[2.5rem] border border-zinc-700 bg-black p-2.5 shadow-2xl shadow-black/60">
                                <div className="rounded-[2rem] bg-zinc-950 p-4">
                                    <div className="mx-auto h-5 w-24 rounded-full bg-black ring-1 ring-zinc-800" />
                                    <div className="mt-3 flex items-center justify-between text-[13px]">
                                        <span className="font-bold">Log workout</span>
                                        <span className="font-bold text-lime-400">Finish</span>
                                    </div>
                                    <div className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[11px]">
                                        <div className="rounded-lg bg-zinc-900 p-2">
                                            <p className="text-zinc-500">Duration</p>
                                            <p className="mt-0.5 font-bold">1h 13m</p>
                                        </div>
                                        <div className="rounded-lg bg-zinc-900 p-2">
                                            <p className="text-zinc-500">Volume</p>
                                            <p className="mt-0.5 font-bold">8.200kg</p>
                                        </div>
                                        <div className="rounded-lg bg-zinc-900 p-2">
                                            <p className="text-zinc-500">Sets</p>
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

                            {/* chip melayang */}
                            <div className="absolute -left-16 top-16 flex -rotate-6 items-center gap-2 rounded-2xl border border-zinc-700/80 bg-zinc-900/95 p-3 shadow-xl">
                                <Flame className="h-5 w-5 text-lime-400" />
                                <div className="text-[13px]">
                                    <p className="font-extrabold leading-none">12 days</p>
                                    <p className="mt-1 text-[11px] text-zinc-500">streak</p>
                                </div>
                            </div>
                            <div className="absolute -right-14 bottom-20 flex rotate-3 items-center gap-2 rounded-2xl border border-zinc-700/80 bg-zinc-900/95 p-3 shadow-xl">
                                <TrendingUp className="h-5 w-5 text-lime-400" />
                                <div className="text-[13px]">
                                    <p className="font-extrabold leading-none">+5kg PR</p>
                                    <p className="mt-1 text-[11px] text-zinc-500">bench press</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
