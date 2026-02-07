import React from 'react';
import { createRoot } from 'react-dom/client';
import { FaGithub, FaPatreon, FaTools } from 'react-icons/fa';

const Home = () => {
  return (
    <div className="page-wrapper">
      <div className="dashboard-card">
        {/* Left Side */}
        <div className="content-section">
          <div className="header">
            <h1>UncivServer.xyz</h1>
            <p className="subtitle">
              A Project by{' '}
              <a href="https://discord.gg/Q6AWccwcEg" target="_blank" rel="noreferrer">
                The Unciv Games
              </a>
            </p>
          </div>

          <div className="actions">
            <a href="/tools" className="btn btn-primary">
              <FaTools size={20} />
              Open Server Tools
            </a>

            <div className="btn-row">
              <a
                href="https://github.com/touhidurrr"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
              >
                <FaGithub size={20} />
                GitHub
              </a>

              <a
                href="https://www.patreon.com/bePatron?u=69568666"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
              >
                <FaPatreon size={20} className="icon-patreon" />
                Join
              </a>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="discord-section">
          <iframe
            src="https://canary.discord.com/widget?id=866650187211210762&theme=dark"
            className="discord-frame"
            sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
            title="Discord Widget"
          />
        </div>
      </div>
    </div>
  );
};

const container = document.getElementById('root') as HTMLDivElement;
const root = createRoot(container);
root.render(<Home />);
