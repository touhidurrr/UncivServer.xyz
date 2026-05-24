import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FaArrowLeft, FaBars } from 'react-icons/fa';
import logo from '../assets/logo.png';

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

const { heading, content, navItems } = JSON.parse(
  document.getElementById('__doc__')!.textContent!
) as DocData;

const { html: processedContent, toc: tocItems } = processContent(content);

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
  <header className="sticky top-0 z-50 flex h-15 items-center justify-between border-b border-line-subtle bg-bg-translucent px-6 backdrop-blur-2xl backdrop-saturate-150">
    <div className="flex items-center gap-3.5">
      <button
        aria-label="Toggle Navigation"
        aria-expanded={!collapsed}
        aria-controls="doc-sidebar"
        onClick={onToggle}
        className="flex shrink-0 cursor-pointer items-center rounded-lg p-1.5 text-muted transition-colors hover:bg-accent-glow hover:text-accent-bright"
      >
        <FaBars size={20} />
      </button>

      <a
        href="/"
        className="flex items-center gap-2.5 text-[15px] font-bold tracking-tight text-fg hover:opacity-85"
      >
        <img src={logo} alt="UncivGames" className="h-6.5 w-auto rounded-md" />
        <span className="hidden md:inline">UncivGames Docs</span>
      </a>

      <div className="mx-1.5 hidden h-5 w-px shrink-0 bg-line md:block" />
      <span className="hidden rounded-md bg-accent-glow px-2.5 py-0.75 text-xs font-semibold tracking-wide text-accent-bright md:inline">
        Bot
      </span>
    </div>

    <a
      href="/"
      className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-accent-bright hover:bg-accent-glow hover:text-fg"
    >
      ← Home
    </a>
  </header>
);

interface SidebarProps {
  activeId: string;
  collapsed: boolean;
  onTocClick: (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

const sidebarSectionTitle =
  'mb-1.5 px-3 text-[10.9px] font-bold uppercase tracking-[0.11em] text-subtle';

const Sidebar = ({ activeId, collapsed, onTocClick }: SidebarProps) => (
  <nav
    className={`flex flex-col gap-7 overflow-hidden border-line-subtle transition-all duration-200 md:sticky md:top-15 md:h-[calc(100vh-60px)] md:overflow-y-auto md:border-r ${
      collapsed
        ? 'h-0 opacity-0 md:border-r-0'
        : 'h-auto border-b px-3.5 py-7 pb-8 opacity-100 md:border-b-0'
    }`}
    id="doc-sidebar"
    aria-label="Documentation"
  >
      <div className="flex flex-col">
        <p className={sidebarSectionTitle}>Bot Documentation</p>
        <ul className="flex flex-col gap-0.5">
          {navItems.map(item => (
            <li key={item.url}>
              <a
                href={item.url}
                className={`block rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  item.active
                    ? 'relative bg-accent-glow font-semibold text-accent-bright! md:before:absolute md:before:-left-3.5 md:before:top-1/2 md:before:h-[60%] md:before:w-0.5 md:before:-translate-y-1/2 md:before:rounded-r-sm md:before:bg-accent md:before:content-[""]'
                    : 'text-muted hover:bg-surface-hover hover:text-fg'
                }`}
                aria-current={item.active ? 'page' : undefined}
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {tocItems.length > 0 && (
        <div className="flex flex-col">
          <p className={sidebarSectionTitle}>On this page</p>
          <ul className="flex flex-col gap-0.5">
            {tocItems.map(item => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={`block truncate rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors hover:bg-surface-hover ${
                    activeId === item.id
                      ? 'bg-violet-glow font-semibold text-violet-bright'
                      : 'text-subtle hover:text-muted'
                  }`}
                  onClick={onTocClick(item.id)}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto border-t border-line-subtle pt-4">
        <a
          href="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold text-subtle transition-colors hover:bg-accent-glow hover:text-accent-bright"
        >
          <FaArrowLeft size={13} />
          Back to UncivServer.xyz
        </a>
      </div>
    </nav>
);

const Article = ({ articleRef }: { articleRef: React.RefObject<HTMLElement | null> }) => (
  <main className="min-w-0 flex-1 px-6 pb-12 pt-9 md:px-14 md:pb-20 md:pt-14">
    <article ref={articleRef} className="mx-auto max-w-184">
      <div className="mb-10 border-b border-line-subtle pb-7">
        <p className="mb-3.5 inline-block rounded-md bg-accent-glow px-2.5 py-1 text-[10.9px] font-bold uppercase tracking-[0.12em] text-accent-bright">
          Democracy Bot Documentation
        </p>
        <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-fg md:text-3xl">
          {heading}
        </h1>
      </div>
      <div className="doc-body" dangerouslySetInnerHTML={{ __html: processedContent }} />
    </article>
  </main>
);

const Footer = () => (
  <footer className="border-t border-line-subtle px-8 py-4 text-center text-xs font-medium text-subtle">
    <p>
      &copy; 2022&ndash;{new Date().getFullYear()}{' '}
      <a
        href="https://github.com/touhidurrr"
        className="text-accent-bright hover:text-violet-bright hover:underline"
      >
        Md. Touhidur Rahman
      </a>
      . All rights reserved.
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
    target.scrollIntoView({ block: 'start' });
    history.replaceState(null, '', `#${id}`);
    setActiveId(id);
  };

  return (
    <>
      <Header collapsed={collapsed} onToggle={toggleSidebar} />
      <div
        className={`grid min-h-[calc(100vh-108px)] grid-cols-1 transition-[grid-template-columns] duration-200 ${
          collapsed ? 'md:grid-cols-[0_1fr]' : 'md:grid-cols-[268px_1fr]'
        }`}
      >
        <Sidebar activeId={activeId} collapsed={collapsed} onTocClick={handleTocClick} />
        <Article articleRef={articleRef} />
      </div>
      <Footer />
    </>
  );
};

const container = document.getElementById('root') as HTMLDivElement;
createRoot(container).render(<Docs />);
