import Welcome from '@/Pages/Welcome';

// "/" and "/login" show the same screen, so being sent to /login never looks like a different app.
export default function Login({ status, canResetPassword }: { status?: string; canResetPassword: boolean }) {
    return <Welcome canRegister canResetPassword={canResetPassword} status={status} />;
}
