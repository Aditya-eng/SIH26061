/** @jsxImportSource @emotion/react */
import { css, Global, useTheme } from '@emotion/react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { Page, Row, Segmented, Small } from './components/ui.jsx';
import { useData } from './data.js';
import Data from './views/Data.jsx';
import Season from './views/Season.jsx';
import Sizing from './views/Sizing.jsx';
import Story from './views/Story.jsx';
import Stress from './views/Stress.jsx';
import Week from './views/Week.jsx';

const VIEWS = [
  { value: 'story', label: 'Overview' },
  { value: 'season', label: 'The winter' },
  { value: 'week', label: 'Hour by hour' },
  { value: 'stress', label: 'Bad days' },
  { value: 'sizing', label: 'Design Maitri II' },
  { value: 'data', label: 'The data' },
];

const fromHash = () => {
  const h = window.location.hash.replace('#', '');
  return VIEWS.some((v) => v.value === h) ? h : 'story';
};

export default function App() {
  const t = useTheme();
  const data = useData();
  const [view, setView] = useState(fromHash);

  useEffect(() => {
    const on = () => setView(fromHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  const go = useCallback((v) => {
    window.location.hash = v;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <>
      <Global
        styles={css`
          *, *::before, *::after { box-sizing: border-box; }
          html { -webkit-text-size-adjust: 100%; }
          body {
            margin: 0;
            background: ${t.color.ground};
            color: ${t.color.text};
            font-family: ${t.font.sans};
            font-size: 15px;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
          }
          button { font-family: inherit; }
          ::selection { background: ${t.color.accentSoft}; }
          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
          }
        `}
      />
      <header
        css={css`
          position: sticky;
          top: 0;
          z-index: 10;
          background: rgba(244, 247, 251, 0.86);
          backdrop-filter: saturate(160%) blur(12px);
          border-bottom: 1px solid ${t.color.line};
        `}
      >
        <div css={css`max-width: 1180px; margin: 0 auto; padding: 12px 22px; display: flex; gap: 16px; align-items: center; justify-content: space-between; flex-wrap: wrap;`}>
          <button
            onClick={() => go('story')}
            css={css`display: flex; align-items: center; gap: 10px; border: 0; background: none; cursor: pointer; padding: 0;`}
          >
            <img src="./favicon.svg" width="32" height="32" alt="" />
            <span css={css`text-align: left; line-height: 1.15;`}>
              <span css={css`display: block; font-weight: 780; font-size: 16px; letter-spacing: 0.04em; color: ${t.color.ink};`}>HIMSHAKTI</span>
              <span css={css`display: block; font-size: 12px; color: ${t.color.muted};`}>Polar fuel console · SIH26061</span>
            </span>
          </button>
          <Segmented options={VIEWS} value={view} onChange={go} size="sm" />
        </div>
      </header>

      <Page>
        {data.status === 'loading' && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            css={css`padding: 80px 0; text-align: center; color: ${t.color.muted}; font-size: 16px;`}
          >
            Loading the station&apos;s season…
          </motion.div>
        )}
        {data.status === 'error' && (
          <div css={css`padding: 60px 0; text-align: center;`}>
            <div css={css`font-size: 18px; font-weight: 700; color: ${t.color.ink};`}>The data did not load</div>
            <Small css={css`margin: 8px auto;`}>
              {data.message} If you opened index.html straight from disk, serve the folder instead: <code>npm run preview</code>.
            </Small>
          </div>
        )}
        {data.status === 'ready' && (
          // Enter-only transition, keyed by view. An exit animation (AnimatePresence
          // mode="wait") holds the next page until the old one finishes animating out,
          // and in a backgrounded tab animation frames pause, so the swap can stall.
          <motion.div
              key={view}
              initial={{ y: 10 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              css={css`display: flex; flex-direction: column; gap: 22px;`}
            >
              {view === 'story' && <Story season={data.season} station={data.station} go={go} />}
              {view === 'season' && <Season season={data.season} />}
              {view === 'week' && <Week season={data.season} station={data.station} />}
              {view === 'stress' && <Stress season={data.season} />}
              {view === 'sizing' && <Sizing sizing={data.sizing} />}
              {view === 'data' && <Data season={data.season} station={data.station} />}
            </motion.div>
        )}
      </Page>

      <footer css={css`border-top: 1px solid ${t.color.line}; background: ${t.color.surface};`}>
        <div css={css`max-width: 1180px; margin: 0 auto; padding: 22px; font-size: 13px; color: ${t.color.muted}; line-height: 1.6;`}>
          <Row justify="space-between" align="flex-start">
            <div css={css`max-width: 70ch;`}>
              Smart India Hackathon 2026 · SIH26061 · Ministry of Earth Sciences / NCPOR · Clean &amp; Green Technology.
              <br />
              Weather: ERA5 reanalysis (ECMWF/Copernicus). Station load: physics model — no polar station publishes its load data.
              Results: closed-loop controllers in the HIMSHAKTI engine.
            </div>
            <a href="https://github.com/Aditya-eng/SIH26061" css={css`color: ${t.color.accent}; font-weight: 650; text-decoration: none;`}>
              Source on GitHub →
            </a>
          </Row>
        </div>
      </footer>
    </>
  );
}
