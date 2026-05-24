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
  <div className={half ? 'form-group half' : 'form-group'}>
    <label>{label}</label>
    <input type={type} autoComplete={type === 'password' ? 'new-password' : 'off'} {...rest} />
  </div>
);

const ResultBox = ({ result }: { result: Result }) => (
  <div className={`result-box ${result.type}`}>
    <p className="status-text">
      {result.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
      {result.text}
    </p>
    {result.detail && <p className="result-detail">{result.detail}</p>}
  </div>
);

interface CardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  children: React.ReactNode;
}

const Card = ({ icon, title, desc, children }: CardProps) => (
  <div className="glass-card">
    <div className="card-header">
      <div className="card-title-row">
        <span className="card-icon-wrap">{icon}</span>
        <h2>{title}</h2>
      </div>
      <p className="card-desc">{desc}</p>
    </div>
    {children}
  </div>
);

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
      <form onSubmit={onSubmit} autoComplete="off">
        <UserIdField {...userId} />
        <Field label="Password" type="password" placeholder="Current password" {...password} />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
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
      <form onSubmit={onSubmit} autoComplete="off">
        <UserIdField {...userId} />
        <Field
          label="Current Password"
          type="password"
          placeholder="Leave empty if none"
          {...oldPass}
        />
        <div className="row">
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
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-danger" disabled={loading}>
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
      <form onSubmit={onSubmit} autoComplete="off">
        <UserIdField {...userId} />
        <Field
          label="Registered Email"
          type="email"
          placeholder="The email set on your account"
          required
          {...email}
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-danger" disabled={loading}>
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
    <div className="page-wrapper">
      <div className="main-container">
        <header className="page-header">
          <h1>
            <FaTools className="icon-title" /> Toolbox
          </h1>
          <p className="subtitle">Manage your UncivServer account credentials</p>
        </header>

        <div className="tools-layout">
          <nav className="tools-nav" aria-label="Tools">
            {TOOL_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                className={`tools-nav-item${opt.id === activeId ? ' active' : ''}`}
                onClick={() => setActiveId(opt.id)}
              >
                <span className="tools-nav-icon">{opt.icon}</span>
                <span className="tools-nav-text">
                  <span className="tools-nav-label">{opt.label}</span>
                  <span className="tools-nav-desc">{opt.desc}</span>
                </span>
              </button>
            ))}
          </nav>

          <section className="tools-panel">
            <Active shared={shared} setShared={setShared} />
          </section>
        </div>

        <div className="footer-link">
          <a href="/">← Back to Home</a>
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById('root') as HTMLDivElement;
createRoot(container).render(<Tools />);
