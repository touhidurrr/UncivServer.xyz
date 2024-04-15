import { Elysia } from 'elysia';
import { html } from '@elysiajs/html';
import { freemem, loadavg, totalmem } from 'os';
import { format } from 'bytes';

const usedmem = () => totalmem() - freemem();

const ProgressBar = ({
  id,
  value,
  max,
  title,
  info = '',
}: {
  id: string;
  value: number;
  max: number;
  title: string;
  info?: string;
}) => (
  <div style={{ minWidth: '20em', marginBottom: '20px', display: 'flex', flexDirection: 'column' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <label for={id} style={{ fontWeight: 'bold' }}>
        {title}
      </label>
      <b>
        <i>{info}</i>
      </b>
    </div>
    <progress id={id} value={value} max={max} style={{ width: '100%', height: '20px' }}></progress>
  </div>
);

export const infoPlugin = new Elysia().use(html()).get('/info', () => (
  <html lang="en">
    <head>
      <title>UncivServer.xyz Info Page</title>
    </head>
    <body
      style={{
        fontFamily: 'Arial, sans-serif',
        margin: '0',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f0f0f0',
      }}
    >
      <ProgressBar
        id="memory"
        value={usedmem()}
        max={totalmem()}
        title="Memory Usage"
        info={`${format(usedmem())} / ${format(totalmem())}`}
      />
      {[1, 5, 15].map((time, i) => {
        const usage = loadavg()[i];
        return (
          <ProgressBar
            id={`cpu-${i}`}
            value={usage}
            max={100}
            title={`CPU (last ${time} minutes)`}
            info={`${usage.toFixed(2)}%`}
          />
        );
      })}
    </body>
  </html>
));
