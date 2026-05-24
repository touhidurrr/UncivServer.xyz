import React from 'react';
import { createRoot } from 'react-dom/client';
import { FaGithub, FaPatreon, FaTools } from 'react-icons/fa';

const btnSecondary =
  'flex flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-white/5 px-5 py-3 text-sm font-semibold text-muted transition hover:-translate-y-px hover:border-line-strong hover:bg-surface-hover-strong hover:text-fg active:translate-y-0';

const Home = () => (
  <div className="flex min-h-screen items-start justify-center bg-aurora-home p-4 md:items-center md:p-6">
    <div className="relative my-4 flex w-full max-w-120 flex-col overflow-hidden rounded-2xl border border-line bg-dashboard shadow-dashboard backdrop-blur-xl md:my-0 md:min-h-145 md:max-w-230 md:flex-row">
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center md:items-start md:p-14 md:text-left">
        <div className="mb-10">
          <h1 className="mb-3 text-3xl font-extrabold leading-tight tracking-tight text-fg md:text-[40px]">
            UncivServer.xyz
          </h1>
          <p className="text-[15px] font-medium leading-relaxed text-subtle">
            A project by{' '}
            <a
              href="https://discord.gg/Q6AWccwcEg"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-accent-bright hover:underline"
            >
              The Unciv Games
            </a>
          </p>
        </div>

        <div className="flex w-full max-w-75 flex-col gap-2.5 md:max-w-85">
          <a
            href="/tools"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white shadow-primary-cta transition hover:-translate-y-px hover:opacity-95 hover:shadow-primary-cta-hover active:translate-y-0"
          >
            <FaTools size={18} />
            Open Server Tools
          </a>

          <div className="flex w-full gap-2">
            <a
              href="https://github.com/touhidurrr"
              target="_blank"
              rel="noreferrer"
              className={btnSecondary}
            >
              <FaGithub size={18} />
              GitHub
            </a>

            <a
              href="https://www.patreon.com/bePatron?u=69568666"
              target="_blank"
              rel="noreferrer"
              className={btnSecondary}
            >
              <FaPatreon size={18} className="text-[#ff6b6b]" />
              Support
            </a>
          </div>
        </div>
      </div>

      <iframe
        src="https://canary.discord.com/widget?id=866650187211210762&theme=dark"
        className="h-125 w-full border-0 border-t border-line bg-surface-deep md:h-auto md:min-h-145 md:w-89 md:border-l md:border-t-0"
        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
        title="Discord Widget"
      />
    </div>
  </div>
);

const container = document.getElementById('root') as HTMLDivElement;
createRoot(container).render(<Home />);
