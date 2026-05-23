import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

interface NavItem {
  url: string;
  title: string;
  active: boolean;
}

interface TocItem {
  id: string;
  text: string;
}

interface DocData {
  heading: string;
  content: string;
  navItems: NavItem[];
}

const SIDEBAR_KEY = 'docs-sidebar';
const SCROLL_SPY_MARGIN = '-10% 0px -75% 0px';

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const processContent = (html: string): { html: string; toc: TocItem[] } => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const toc: TocItem[] = [];
  doc.querySelectorAll('h2').forEach(h => {
    const text = h.textContent?.trim() ?? '';
    const id = slugify(text);
    h.id = id;
    const anchor = doc.createElement('a');
    anchor.href = `#${id}`;
    anchor.className = 'heading-anchor';
    anchor.setAttribute('aria-label', 'Link to this section');
    anchor.textContent = '#';
    h.appendChild(anchor);
    toc.push({ id, text });
  });
  return { html: doc.body.innerHTML, toc };
};

const logoUrl = document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href ?? '';

const { heading, content, navItems } = JSON.parse(
  document.getElementById('__doc__')!.textContent!
) as DocData;

const { html: processedContent, toc: tocItems } = processContent(content);

const MenuIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 12H5M12 5l-7 7 7 7" />
  </svg>
);

const usePersistedSidebar = () => {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) === 'collapsed'
  );
  const toggle = () =>
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, next ? 'collapsed' : 'open');
      return next;
    });
  return [collapsed, toggle] as const;
};

const useScrollSpy = (ref: React.RefObject<HTMLElement | null>) => {
  const [activeId, setActiveId] = useState('');
  useEffect(() => {
    const el = ref.current;
    if (!el || tocItems.length === 0) return;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting);
        if (!visible.length) return;
        const top = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b
        );
        setActiveId(top.target.id);
      },
      { rootMargin: SCROLL_SPY_MARGIN, threshold: 0 }
    );
    el.querySelectorAll<HTMLHeadingElement>('h2').forEach(h => observer.observe(h));
    return () => observer.disconnect();
  }, [ref]);
  return [activeId, setActiveId] as const;
};

const Header = ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) => (
  <header className="doc-header">
    <div className="header-left">
      <button
        id="sidebar-toggle"
        aria-label="Toggle Navigation"
        aria-expanded={!collapsed}
        aria-controls="doc-sidebar"
        onClick={onToggle}
      >
        <MenuIcon />
      </button>

      <a href="/" className="brand">
        <img src={logoUrl} alt="UncivGames Logo" className="brand-logo" />
        <span>UncivGames Docs</span>
      </a>

      <div className="header-sep" />
      <span className="header-section">Bot</span>
    </div>

    <div className="header-right">
      <a href="/" className="header-home-link">
        ← Home
      </a>
    </div>
  </header>
);

interface SidebarProps {
  activeId: string;
  onTocClick: (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

const Sidebar = ({ activeId, onTocClick }: SidebarProps) => (
  <nav className="doc-sidebar" id="doc-sidebar" aria-label="Documentation">
    <div className="sidebar-group">
      <p className="sidebar-section-title">Bot Documentation</p>
      <ul>
        {navItems.map(item => (
          <li key={item.url}>
            <a
              href={item.url}
              className={item.active ? 'active' : undefined}
              aria-current={item.active ? 'page' : undefined}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>

    {tocItems.length > 0 && (
      <div className="sidebar-group">
        <p className="sidebar-section-title">On this page</p>
        <ul>
          {tocItems.map(item => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`toc-link${activeId === item.id ? ' toc-active' : ''}`}
                onClick={onTocClick(item.id)}
              >
                {item.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    )}

    <div className="sidebar-back">
      <a href="/">
        <ArrowLeftIcon />
        Back to UncivServer.xyz
      </a>
    </div>
  </nav>
);

const Article = ({ articleRef }: { articleRef: React.RefObject<HTMLElement | null> }) => (
  <main className="doc-main-content">
    <article ref={articleRef}>
      <div className="doc-hero">
        <p className="doc-eyebrow">Democracy Bot Documentation</p>
        <h1>{heading}</h1>
      </div>
      <div dangerouslySetInnerHTML={{ __html: processedContent }} />
    </article>
  </main>
);

const Footer = () => (
  <footer className="doc-footer">
    <p>
      &copy; 2022&ndash;{new Date().getFullYear()}{' '}
      <a href="https://github.com/touhidurrr">Md. Touhidur Rahman</a>. All rights reserved.
    </p>
  </footer>
);

const Docs = () => {
  const [collapsed, toggleSidebar] = usePersistedSidebar();
  const articleRef = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useScrollSpy(articleRef);

  const handleTocClick = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
    setActiveId(id);
  };

  return (
    <>
      <Header collapsed={collapsed} onToggle={toggleSidebar} />
      <div className={`doc-container${collapsed ? ' sidebar-collapsed' : ''}`} id="doc-container">
        <Sidebar activeId={activeId} onTocClick={handleTocClick} />
        <Article articleRef={articleRef} />
      </div>
      <Footer />
    </>
  );
};

const container = document.getElementById('root') as HTMLDivElement;
createRoot(container).render(<Docs />);
