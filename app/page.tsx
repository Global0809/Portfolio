'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Play,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { films } from './films';
import { FilmSculpture } from './sculpture';
import { ShaderAnimation } from '@/components/ui/shader-lines';
import { BookingDialog, useAvailability } from './booking';
import { VerifiedMark } from './verified-mark';
import { studio } from './studio-config';
import { useExperienceMotion } from './motion';
import { NeuralLinks } from './neural-links';
import { useInterfaceSound } from './interface-sound';
import { SlotInvitation } from './slot-invitation';
import { FilmPlayer } from './film-player';

const time = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

export default function Home() {
  useExperienceMotion();
  const [active, setActive] = useState(4);
  const [viewing, setViewing] = useState<number | null>(null);
  const [showDock, setShowDock] = useState(false);
  const [about, setAbout] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const { availability, refresh } = useAvailability();
  const [reduced, setReduced] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const sound = useInterfaceSound(viewing !== null);
  const [origin, setOrigin] = useState({ x: 70, y: 45 });
  const returnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    document.documentElement.dataset.effectsPaused = String(
      reduced || motionPaused,
    );
    return () => {
      delete document.documentElement.dataset.effectsPaused;
    };
  }, [reduced, motionPaused]);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const films = document.querySelector('.film-index');
    const hero = document.querySelector('.hero-book');
    const invitation = document.querySelector(
      '.invitation-glass .booking-submit',
    );
    if (!films || !hero || !invitation) return;
    if (!('IntersectionObserver' in window)) {
      setShowDock(true);
      return;
    }
    let explored = false,
      heroVisible = true,
      invitationVisible = false;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === films && entry.isIntersecting) explored = true;
          if (entry.target === hero) heroVisible = entry.isIntersecting;
          if (entry.target === invitation)
            invitationVisible = entry.isIntersecting;
        }
        setShowDock(explored && !heroVisible && !invitationVisible);
      },
      { threshold: 0.15 },
    );
    [films, hero, invitation].forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);
  function openFilm(index: number, target?: HTMLElement) {
    returnFocus.current = target || (document.activeElement as HTMLElement);
    const rect = target?.getBoundingClientRect();
    setOrigin(
      rect
        ? {
            x: ((rect.left + rect.width / 2) / innerWidth) * 100,
            y: ((rect.top + rect.height / 2) / innerHeight) * 100,
          }
        : { x: 70, y: 45 },
    );
    setActive(index);
    setViewing(index);
  }
  function closeFilm() {
    setViewing(null);
    requestAnimationFrame(() => {
      const selected = document.querySelector<HTMLElement>(
        `[data-film-index="${viewing}"]`,
      );
      (selected || returnFocus.current)?.focus({ preventScroll: true });
    });
  }
  return (
    <main className="archive" data-effects-paused={reduced || motionPaused}>
      <div className="shader-background" aria-hidden="true">
        <ShaderAnimation
          reducedMotion={reduced || motionPaused}
          paused={viewing !== null || bookingOpen || about}
        />
        <div className="shader-vignette" />
      </div>
      <NeuralLinks
        paused={viewing !== null || bookingOpen || about}
        reduced={reduced || motionPaused}
        signal={active}
      />
      <a className="skip-link" href="#film-index">
        Skip to films
      </a>
      <header className="masthead">
        <a className="wordmark" href="#" aria-label="AICANFEEL home">
          AICANFEEL{studio.instagramVerified && <VerifiedMark />}
        </a>
        <span className="header-descriptor">CGI / VFX / MUSIC VIDEOS</span>
        <nav aria-label="Main navigation">
          <button
            className="sound-toggle"
            data-sound-toggle
            aria-label={
              sound.enabled
                ? 'Turn interface sounds off'
                : 'Turn interface sounds on'
            }
            aria-pressed={sound.enabled}
            disabled={!sound.available}
            onClick={sound.toggle}
          >
            {sound.enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>Sound {sound.enabled ? 'on' : 'off'}</span>
          </button>
          <button
            data-press
            data-scan="book"
            data-scan-id="header-book"
            className="nav-book"
            onClick={() => setBookingOpen(true)}
          >
            Create my film
            <ArrowUpRight size={15} />
          </button>
        </nav>
      </header>

      <section className="exhibition" aria-label="Explore the films">
        <div className="editorial">
          <h1>
            <span className="sound-word title-word">Sound.</span>
            <br />
            <span className="title-word">Made</span>
            <br />
            <em className="title-word">visible.</em>
          </h1>
          <div className="hero-actions">
            <button
              data-press
              data-scan="book"
              data-scan-id="hero-book"
              className="hero-book"
              onClick={() => setBookingOpen(true)}
            >
              Create my film
              <ArrowUpRight size={19} />
            </button>
            <button
              data-scan="watch"
              data-scan-id="hero-watch"
              className="primary-watch"
              aria-label="Watch a film"
              onClick={(e) => openFilm(active, e.currentTarget)}
            >
              <span className="play-disc" data-scan-port>
                <Play size={17} fill="currentColor" />
              </span>{' '}
              Watch a film <ArrowUpRight size={18} />
            </button>
          </div>
          <div className="social-proof">
            {studio.instagramUrl ? (
              <a
                href={studio.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <strong>{studio.instagramFollowers}</strong> followers on
                Instagram
                <ArrowUpRight size={13} />
              </a>
            ) : (
              <p>
                <strong>{studio.instagramFollowers}</strong> followers on
                Instagram
              </p>
            )}
          </div>
        </div>
        <div className="spatial-stage">
          <div className="stage-halo" />
          <FilmSculpture
            active={active}
            paused={viewing !== null || about || bookingOpen}
            reduced={reduced || motionPaused}
            onSelect={openFilm}
            onPreview={setActive}
          />
          <div className="stage-caption">
            <span className="sr-only" aria-live="polite" aria-atomic="true">
              {films[active].title}
            </span>
            <div className="stage-arrows">
              <button
                data-press
                data-scan="previous"
                data-scan-id="previous-film"
                aria-label="Preview previous film"
                onClick={() => setActive((active + 4) % 5)}
              >
                <ArrowLeft size={20} strokeWidth={1.6} />
              </button>
              <button
                data-press
                data-scan="next"
                data-scan-id="next-film"
                aria-label="Preview next film"
                onClick={() => setActive((active + 1) % 5)}
              >
                <ArrowRight size={20} strokeWidth={1.6} />
              </button>
            </div>
          </div>
          <span className="swipe-hint" id="swipe-hint">
            Swipe to explore · Tap to watch
          </span>
        </div>
      </section>

      <section
        className="film-index"
        id="film-index"
        aria-label="All five films"
      >
        <div className="index-heading" data-reveal>
          <h2>Selected films</h2>
          <span>Five ways to feel.</span>
        </div>
        <div className="film-list">
          {films.map((film, index) => (
            <button
              key={film.id}
              data-film-index={index}
              data-scan="film"
              data-scan-id={`film-${index}`}
              data-scan-film={index}
              data-reveal
              style={
                { '--reveal-delay': `${index * 45}ms` } as React.CSSProperties
              }
              className={`film-entry ${active === index ? 'is-active' : ''}`}
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onClick={(e) => openFilm(index, e.currentTarget)}
              aria-label={`Watch ${film.title}, ${time(film.duration)}`}
            >
              <span className="film-number">0{index + 1}</span>
              <img src={film.cover} alt="" width="48" height="68" />
              <span className="film-entry-text">
                <strong>{film.title}</strong>
                <span>
                  {film.subtitle}{' '}
                  <span className="duration">{time(film.duration)}</span>
                </span>
              </span>
              <span className="entry-play" data-scan-port>
                <Play size={12} fill="currentColor" />
              </span>
            </button>
          ))}
        </div>
      </section>
      <SlotInvitation
        availability={availability}
        onStart={() => setBookingOpen(true)}
      />
      <div
        className={`mobile-booking-dock ${showDock && !bookingOpen && viewing === null && !about ? 'is-visible' : ''}`}
        inert={!showDock || bookingOpen || viewing !== null || about}
      >
        <span>
          {availability.enabled ? (
            <>
              <i className="signal-dot" />
              {availability.remaining} places available
            </>
          ) : (
            <>
              Your next release.
              <br />
              <strong>Make it cinematic.</strong>
            </>
          )}
        </span>
        <button
          data-press
          data-scan="book"
          data-scan-id="dock-book"
          onClick={() => setBookingOpen(true)}
        >
          {availability.enabled && availability.remaining !== 0
            ? 'Hold my slot'
            : 'Request my slot'}
          <ArrowUpRight size={17} />
        </button>
      </div>
      <BookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        availability={
          availability.remaining === 0
            ? { ...availability, enabled: false }
            : availability
        }
        onReserved={() => void refresh()}
        inspiration={films[active].title}
      />
      <footer>
        <span>AICANFEEL © {new Date().getFullYear()}</span>
        <div className="footer-tools">
          <button
            className="effects-toggle"
            aria-pressed={motionPaused || reduced}
            disabled={reduced}
            aria-label={
              reduced
                ? 'Motion reduced by device preference'
                : motionPaused
                  ? 'Resume visual effects'
                  : 'Pause visual effects'
            }
            onClick={() => setMotionPaused((value) => !value)}
          >
            {motionPaused || reduced ? 'Motion paused' : 'Pause motion'}
          </button>
          <button onClick={() => setAbout(true)}>About AICANFEEL</button>
        </div>
      </footer>

      <Dialog
        disablePointerDismissal
        open={viewing !== null}
        onOpenChange={(open) => {
          if (!open) closeFilm();
        }}
      >
        {viewing !== null && (
          <DialogContent
            showCloseButton={false}
            className="cinema"
            style={
              {
                '--origin-x': `${origin.x}%`,
                '--origin-y': `${origin.y}%`,
              } as React.CSSProperties
            }
          >
            <FilmPlayer
              index={viewing}
              reduced={reduced || motionPaused}
              onBook={() => {
                setViewing(null);
                setBookingOpen(true);
              }}
              onClose={closeFilm}
              onSelect={(index) => {
                setViewing(index);
                setActive(index);
              }}
            />
          </DialogContent>
        )}
      </Dialog>
      <Dialog open={about} onOpenChange={setAbout}>
        <DialogContent
          className="studio-dialog liquid-panel"
          showCloseButton={false}
        >
          <button
            className="studio-close icon-button"
            onClick={() => setAbout(false)}
            aria-label="Close studio information"
          >
            <X />
          </button>
          <p className="eyebrow">AICANFEEL</p>
          <DialogTitle className="studio-title">
            If you can hear it,
            <br />
            <em>we can imagine it.</em>
          </DialogTitle>
          <DialogDescription className="studio-description">
            We create CGI and VFX music videos. A meeting of sound, cinema, and
            worlds that could only exist in imagination.
          </DialogDescription>
          <button className="studio-back" onClick={() => setAbout(false)}>
            <ArrowLeft size={17} /> Back to the films
          </button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
