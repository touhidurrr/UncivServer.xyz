import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FaCheckCircle, FaExclamationCircle, FaKey, FaTools, FaUserCheck } from 'react-icons/fa';

const ID_REGEX = /^[\da-f]{8}-([\da-f]{4}-){3}[\da-f]{12}$/;

const AUTH_STATUS: Record<number, string> = {
  200: 'Authenticated',
  204: 'Unregistered',
  401: 'Unauthorized',
};

type ResultType = 'success' | 'error';
type Result = { text: string; detail?: string; type: ResultType };

const responseToResult = (response: Response, detail?: string): Result => ({
  text: AUTH_STATUS[response.status] ?? response.statusText,
  detail: detail || `${response.status} ${response.statusText}`,
  type: response.ok ? 'success' : 'error',
});

const basicAuth = (userId: string, password: string) =>
  'Basic ' + btoa(userId.trim() + ':' + password);

const useApiForm = <T extends Record<string, string>>(initial: T) => {
  const [form, setForm] = useState<T>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  const update = (key: keyof T) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

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

  return { form, update, loading, error, result, submit };
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
    <input type={type} {...rest} />
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

const ValidateCard = () => {
  const { form, update, loading, error, result, submit } = useApiForm({
    userId: '',
    password: '',
  });

  const onSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit(
      () => (ID_REGEX.test(form.userId.trim()) ? null : 'Invalid UUID format.'),
      async () => {
        const response = await fetch('/auth', {
          method: 'GET',
          headers: { Authorization: basicAuth(form.userId, form.password) },
        });
        return responseToResult(response);
      }
    );
  };

  return (
    <Card
      icon={<FaUserCheck />}
      title="Validate Credentials"
      desc="Check if a user ID and password are correct"
    >
      <form onSubmit={onSubmit}>
        <Field
          label="User ID"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          value={form.userId}
          onChange={update('userId')}
          required
        />
        <Field
          label="Password"
          type="password"
          placeholder="Current password"
          value={form.password}
          onChange={update('password')}
        />
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Validating…' : 'Validate'}
        </button>
      </form>
      {result && <ResultBox result={result} />}
    </Card>
  );
};

const ChangePasswordCard = () => {
  const { form, update, loading, error, result, submit } = useApiForm({
    userId: '',
    oldPass: '',
    newPass: '',
    confirmPass: '',
  });

  const onSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit(
      () => {
        if (!ID_REGEX.test(form.userId.trim())) return 'Invalid UUID format.';
        if (form.newPass.length < 6) return 'Password must be at least 6 characters.';
        if (form.newPass !== form.confirmPass) return 'Passwords do not match.';
        return null;
      },
      async () => {
        const response = await fetch('/auth', {
          method: 'PUT',
          headers: {
            Authorization: basicAuth(form.userId, form.oldPass),
            'Content-Type': 'text/plain',
          },
          body: form.newPass,
        });
        return responseToResult(response, await response.text());
      }
    );
  };

  return (
    <Card icon={<FaKey />} title="Change Password" desc="Update your account password">
      <form onSubmit={onSubmit}>
        <Field
          label="User ID"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          value={form.userId}
          onChange={update('userId')}
          required
        />
        <Field
          label="Current Password"
          type="password"
          placeholder="Leave empty if none"
          value={form.oldPass}
          onChange={update('oldPass')}
        />
        <div className="row">
          <Field
            label="New Password"
            type="password"
            placeholder="Min. 6 chars"
            value={form.newPass}
            onChange={update('newPass')}
            required
            half
          />
          <Field
            label="Confirm"
            type="password"
            placeholder="Repeat"
            value={form.confirmPass}
            onChange={update('confirmPass')}
            required
            half
          />
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-danger" disabled={loading}>
          {loading ? 'Changing…' : 'Change Password'}
        </button>
      </form>
      {result && <ResultBox result={result} />}
    </Card>
  );
};

const Tools = () => (
  <div className="page-wrapper">
    <div className="main-container">
      <header className="page-header">
        <h1>
          <FaTools className="icon-title" /> Toolbox
        </h1>
        <p className="subtitle">Manage your UncivServer account credentials</p>
      </header>

      <div className="cards-grid">
        <ValidateCard />
        <ChangePasswordCard />
      </div>

      <div className="footer-link">
        <a href="/">← Back to Home</a>
      </div>
    </div>
  </div>
);

const container = document.getElementById('root') as HTMLDivElement;
createRoot(container).render(<Tools />);
