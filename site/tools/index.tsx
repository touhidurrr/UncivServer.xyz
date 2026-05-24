import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  FaCheckCircle,
  FaEnvelopeOpenText,
  FaExclamationCircle,
  FaTools,
  FaUserCheck,
  FaUserEdit,
} from 'react-icons/fa';

const ID_REGEX = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AUTH_STATUS: Record<number, string> = {
  200: 'Authenticated',
  204: 'Unregistered',
  401: 'Unauthorized',
};

type ResultType = 'success' | 'error';
type Result = { text: string; detail?: string; type: ResultType };

const responseToResult = async (response: Response): Promise<Result> => {
  const body = await response.text();
  return {
    text: AUTH_STATUS[response.status] ?? `${response.status} ${response.statusText}`,
    detail: body || undefined,
    type: response.ok ? 'success' : 'error',
  };
};

const basicAuth = (userId: string, password: string) =>
  'Basic ' + btoa(userId.trim() + ':' + password);

interface SharedFields {
  userId: string;
  password: string;
  email: string;
}

interface SharedProps {
  shared: SharedFields;
  setShared: React.Dispatch<React.SetStateAction<SharedFields>>;
}

const sharedField = ({ shared, setShared }: SharedProps, key: keyof SharedFields) => ({
  value: shared[key],
  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
    setShared(s => ({ ...s, [key]: e.target.value })),
});

const useCardSubmit = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  const submit = async (validate: () => string | null, request: () => Promise<Result>) => {
    setError('');
    setResult(null);
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    try {
      setResult(await request());
    } catch (e) {
      setResult({ text: (e as Error).message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, result, submit };
};

const btnBase =
  'mt-1 w-full cursor-pointer rounded-lg border-0 px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-px hover:opacity-90 active:translate-y-0 active:opacity-100 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none';

const btnDanger = 'bg-danger shadow-danger hover:shadow-danger-strong disabled:hover:shadow-danger';

interface FieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  half?: boolean;
}

const Field = ({ label, type = 'text', half, ...rest }: FieldProps) => (
  <div className={`flex flex-col gap-1.5 ${half ? 'min-w-0 flex-1' : ''}`}>
    <label className="text-xs font-semibold text-muted">{label}</label>
    <input
      className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm font-medium text-fg placeholder:font-normal placeholder:text-subtle/60 transition focus:border-accent focus:bg-accent/5 focus:shadow-input-focus focus:outline-none"
      type={type}
      autoComplete={type === 'password' ? 'new-password' : 'off'}
      {...rest}
    />
  </div>
);

const ResultBox = ({ result }: { result: Result }) => {
  const tone =
    result.type === 'success' ? 'border-success/25 bg-success/10' : 'border-danger/25 bg-danger/10';
  const textTone = result.type === 'success' ? 'text-success-soft' : 'text-danger-soft';
  return (
    <div className={`rounded-xl border px-4.5 py-3.5 animate-result-in ${tone}`}>
      <p className={`flex items-center gap-2 text-[14.7px] font-bold ${textTone}`}>
        {result.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
        {result.text}
      </p>
      {result.detail && (
        <p className="mt-1.5 pl-6 text-[13.3px] font-medium text-muted">{result.detail}</p>
      )}
    </div>
  );
};

interface CardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}

const Card = ({ icon, title, desc, children }: CardProps) => (
  <div className="flex flex-col gap-5.5 rounded-2xl border border-line bg-card p-6 shadow-card transition-colors hover:border-line-strong hover:shadow-card-hover sm:p-7">
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3.5">
        <span className="inline-flex size-8.5 shrink-0 items-center justify-center rounded-lg bg-accent-glow text-accent-bright">
          {icon}
        </span>
        <h2 className="text-base font-bold leading-tight tracking-tight text-fg">{title}</h2>
      </div>
      <p className="text-[13.6px] font-medium leading-snug text-subtle">{desc}</p>
    </div>
    {children}
  </div>
);

const errorCls =
  "flex items-center gap-1.5 text-xs font-medium text-danger-soft before:opacity-85 before:content-['⚠']";

const UserIdField = (field: { value: string; onChange: FieldProps['onChange'] }) => (
  <Field label="User ID" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required {...field} />
);

const ValidateCard = (props: SharedProps) => {
  const userId = sharedField(props, 'userId');
  const password = sharedField(props, 'password');
  const { loading, error, result, submit } = useCardSubmit();

  const onSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit(
      () => (ID_REGEX.test(userId.value.trim()) ? null : 'Invalid UUID format.'),
      () =>
        fetch('/auth', {
          method: 'GET',
          headers: { Authorization: basicAuth(userId.value, password.value) },
        }).then(responseToResult)
    );
  };

  return (
    <Card
      icon={<FaUserCheck />}
      title="Validate Credentials"
      desc="Check if a user ID and password are correct"
    >
      <form onSubmit={onSubmit} autoComplete="off" className="flex flex-col gap-4">
        <UserIdField {...userId} />
        <Field label="Password" type="password" placeholder="Current password" {...password} />
        {error && <p className={errorCls}>{error}</p>}
        <button
          type="submit"
          className={`${btnBase} bg-accent shadow-primary hover:shadow-primary-strong disabled:hover:shadow-primary`}
          disabled={loading}
        >
          {loading ? 'Validating…' : 'Validate'}
        </button>
      </form>
      {result && <ResultBox result={result} />}
    </Card>
  );
};

const ChangePasswordCard = (props: SharedProps) => {
  const userId = sharedField(props, 'userId');
  const oldPass = sharedField(props, 'password');
  const email = sharedField(props, 'email');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const { loading, error, result, submit } = useCardSubmit();

  const onSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit(
      () => {
        if (!ID_REGEX.test(userId.value.trim())) return 'Invalid UUID format.';
        const trimmedEmail = email.value.trim();
        if (!newPass && !trimmedEmail) return 'Provide a new password or email to update.';
        if (newPass) {
          if (newPass.length < 6) return 'Password must be at least 6 characters.';
          if (newPass !== confirmPass) return 'Passwords do not match.';
        }
        if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) return 'Invalid email format.';
        return null;
      },
      () =>
        fetch('/auth', {
          method: 'PUT',
          headers: {
            Authorization: basicAuth(userId.value, oldPass.value),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...(newPass ? { password: newPass } : {}),
            ...(email.value.trim() ? { email: email.value.trim() } : {}),
          }),
        }).then(responseToResult)
    );
  };

  return (
    <Card
      icon={<FaUserEdit />}
      title="Update Information"
      desc="Set or update password or email. Provide at least one."
    >
      <form onSubmit={onSubmit} autoComplete="off" className="flex flex-col gap-4">
        <UserIdField {...userId} />
        <Field
          label="Current Password"
          type="password"
          placeholder="Leave empty if none"
          {...oldPass}
        />
        <div className="flex gap-2.5">
          <Field
            label="New Password (optional)"
            type="password"
            placeholder="Min. 6 chars"
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
            half
          />
          <Field
            label="Confirm"
            type="password"
            placeholder="Repeat"
            value={confirmPass}
            onChange={e => setConfirmPass(e.target.value)}
            half
          />
        </div>
        <Field label="Email (optional)" type="email" placeholder="For password resets" {...email} />
        {error && <p className={errorCls}>{error}</p>}
        <button type="submit" className={`${btnBase} ${btnDanger}`} disabled={loading}>
          {loading ? 'Updating…' : 'Update Account'}
        </button>
      </form>
      {result && <ResultBox result={result} />}
    </Card>
  );
};

const ResetPasswordCard = (props: SharedProps) => {
  const userId = sharedField(props, 'userId');
  const email = sharedField(props, 'email');
  const { loading, error, result, submit } = useCardSubmit();

  const onSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit(
      () => {
        if (!ID_REGEX.test(userId.value.trim())) return 'Invalid UUID format.';
        if (!EMAIL_REGEX.test(email.value.trim())) return 'Invalid email format.';
        return null;
      },
      () =>
        fetch('/auth/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId.value.trim(),
            email: email.value.trim(),
          }),
        }).then(responseToResult)
    );
  };

  return (
    <Card
      icon={<FaEnvelopeOpenText />}
      title="Reset Password"
      desc="Generate a new random password and send it to your registered email"
    >
      <form onSubmit={onSubmit} autoComplete="off" className="flex flex-col gap-4">
        <UserIdField {...userId} />
        <Field
          label="Registered Email"
          type="email"
          placeholder="The email set on your account"
          required
          {...email}
        />
        {error && <p className={errorCls}>{error}</p>}
        <button type="submit" className={`${btnBase} ${btnDanger}`} disabled={loading}>
          {loading ? 'Sending…' : 'Reset Password'}
        </button>
      </form>
      {result && <ResultBox result={result} />}
    </Card>
  );
};

interface ToolOption {
  id: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  Component: React.FC<SharedProps>;
}

const TOOL_OPTIONS: ToolOption[] = [
  {
    id: 'validate',
    label: 'Validate Credentials',
    desc: 'Check user ID and password',
    icon: <FaUserCheck />,
    Component: ValidateCard,
  },
  {
    id: 'change',
    label: 'Update Information',
    desc: 'Set or update password or email',
    icon: <FaUserEdit />,
    Component: ChangePasswordCard,
  },
  {
    id: 'reset',
    label: 'Reset Password',
    desc: 'Email a new random password',
    icon: <FaEnvelopeOpenText />,
    Component: ResetPasswordCard,
  },
];

const Tools = () => {
  const [activeId, setActiveId] = useState(TOOL_OPTIONS[0].id);
  const [shared, setShared] = useState<SharedFields>({ userId: '', password: '', email: '' });
  const Active = (TOOL_OPTIONS.find(o => o.id === activeId) ?? TOOL_OPTIONS[0]).Component;

  return (
    <div className="flex min-h-screen justify-center bg-aurora-tools px-5 pb-14 pt-18">
      <div className="flex w-full max-w-320 flex-col gap-12">
        <header className="text-center">
          <h1 className="flex items-center justify-center gap-3 text-4xl font-extrabold leading-tight tracking-tight text-fg sm:text-[34.4px]">
            <FaTools size={28} className="text-accent-bright/85" /> Toolbox
          </h1>
          <p className="mt-2.5 text-[14.7px] font-medium text-subtle">
            Manage your UncivServer account credentials
          </p>
        </header>

        <div className="grid w-full items-start justify-center gap-5.5 md:grid-cols-[260px_minmax(0,520px)] lg:grid-cols-[300px_minmax(0,580px)] lg:gap-7">
          <nav
            className="flex flex-row gap-2.5 overflow-x-auto scrollbar-hide md:sticky md:top-6 md:flex-col md:overflow-x-visible"
            aria-label="Tools"
          >
            {TOOL_OPTIONS.map(opt => {
              const active = opt.id === activeId;
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`flex shrink-0 cursor-pointer items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5 text-left font-[inherit] transition duration-200 md:w-full md:gap-3.5 md:px-4 md:py-3.5 ${
                    active
                      ? 'border-accent/55 bg-card-active text-fg shadow-nav-active'
                      : 'border-line text-muted hover:border-line-strong hover:text-fg'
                  }`}
                  onClick={() => setActiveId(opt.id)}
                >
                  <span
                    className={`inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-xs md:size-9 md:text-[15px] ${
                      active ? 'bg-accent text-white' : 'bg-accent-glow text-accent-bright'
                    }`}
                  >
                    {opt.icon}
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-xs font-semibold tracking-tight md:text-sm">
                      {opt.label}
                    </span>
                    <span className="text-[11px] font-medium text-subtle md:text-xs">
                      {opt.desc}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>

          <section className="min-w-0">
            <Active shared={shared} setShared={setShared} />
          </section>
        </div>

        <div className="text-center">
          <a
            href="/"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-subtle transition-colors hover:bg-accent-glow hover:text-accent-bright"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById('root') as HTMLDivElement;
createRoot(container).render(<Tools />);
