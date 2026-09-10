'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { films } from './films';
import { FilmWave } from './film-wave';
import { VerifiedMark } from './verified-mark';

const time = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

export function FilmPlayer({
  index,
  onClose,
  onSelect,
  onBook,
  reduced,
}: {
  index: number;
  onClose: () => void;
  onSelect: (index: number) => void;
  onBook: () => void;
  reduced: boolean;
}) {
  const film = films[index];
  const video = useRef<HTMLVideoElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const playButton = useRef<HTMLButtonElement>(null);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(film.duration);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [ended, setEnded] = useState(false);
  const [full, setFull] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const el = video.current!;
    let current = true;
    setPlaying(false);
    setElapsed(0);
    setDuration(film.duration);
    setLoading(true);
    setError(false);
    setEnded(false);
    setNotice('');
    if (el.getAttribute('src') !== film.src) el.src = film.src;
    el.play()?.catch(() => {
      if (current) {
        setLoading(false);
        setPlaying(false);
      }
    });
    return () => {
      current = false;
      el.pause();
      el.removeAttribute('src');
      el.load();
    };
  }, [film.src, film.duration]);
  useEffect(() => {
    setFullscreenSupported(
      !!(
        document.fullscreenEnabled ||
        (
          video.current as HTMLVideoElement & {
            webkitEnterFullscreen?: () => void;
          }
        )?.webkitEnterFullscreen
      ),
    );
    const changed = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', changed);
    return () => document.removeEventListener('fullscreenchange', changed);
  }, []);
  async function play() {
    const el = video.current!;
    if (!el.paused) {
      el.pause();
      return;
    }
    setEnded(false);
    try {
      await el.play();
      if (video.current === el) setNotice('');
    } catch {
      if (video.current === el) setNotice('Tap play to start the music video.');
    }
  }
  function replay() {
    const el = video.current!;
    el.currentTime = 0;
    setEnded(false);
    void el.play().catch(() => {
      if (video.current === el) setPlaying(false);
    });
  }
  function select(next: number, fromCover = false) {
    if (next === index) return;
    video.current?.pause();
    onSelect((next + films.length) % films.length);
    if (fromCover)
      requestAnimationFrame(() =>
        playButton.current?.focus({ preventScroll: true }),
      );
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.fullscreenEnabled && frame.current?.requestFullscreen)
        await frame.current.requestFullscreen();
      else
        (
          video.current as HTMLVideoElement & {
            webkitEnterFullscreen?: () => void;
          }
        )?.webkitEnterFullscreen?.();
    } catch {
      setNotice('Fullscreen is unavailable in this browser.');
    }
  }
  function seek(value: number | readonly number[]) {
    const next = Array.isArray(value) ? value[0] : (value as number);
    if (Number.isFinite(video.current?.duration)) {
      video.current!.currentTime = next;
      setElapsed(next);
      if (next < duration) setEnded(false);
    }
  }
  function keyControl(e: React.KeyboardEvent) {
    if ((e.target as HTMLElement).closest('button,input,[role="slider"]'))
      return;
    if (e.key === ' ' || e.key.toLowerCase() === 'k') {
      e.preventDefault();
      void play();
    }
    if (e.key.toLowerCase() === 'm') setMuted((m) => !m);
    if (e.key.toLowerCase() === 'f') void fullscreen();
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      seek(
        Math.min(
          duration,
          Math.max(0, elapsed + (e.key === 'ArrowRight' ? 5 : -5)),
        ),
      );
    }
  }

  return (
    <div
      className="screening listening-room"
      ref={frame}
      onKeyDown={keyControl}
      tabIndex={0}
      data-playing={playing && !loading}
    >
      <div className="room-light" aria-hidden="true">
        {films.map((item, i) => (
          <div
            key={item.id}
            className={i === index ? 'is-current' : ''}
            style={{ backgroundImage: `url(${item.cover})` }}
          />
        ))}
      </div>
      <header className="cinema-header">
        <button
          className="return-button"
          onClick={() => {
            video.current?.pause();
            onClose();
          }}
        >
          <ArrowLeft size={18} />
          <span>Music videos</span>
        </button>
        <span className="cinema-brand">
          AICANFEEL <VerifiedMark />
        </span>
        <span className="cinema-count">
          0{index + 1}
          <span> / 05</span>
        </span>
      </header>
      <div
        className="reel-stage"
        onPointerDown={(e) => {
          if (e.pointerType === 'touch')
            gesture.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerCancel={() => {
          gesture.current = null;
        }}
        onPointerUp={(e) => {
          const start = gesture.current;
          gesture.current = null;
          if (!start) return;
          const dx = e.clientX - start.x,
            dy = e.clientY - start.y;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            suppressClick.current = performance.now() + 350;
            select(index + (dx < 0 ? 1 : -1));
          }
        }}
        onClickCapture={(e) => {
          if (performance.now() < suppressClick.current) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
      >
        <div className="reel-horizon" aria-hidden="true" />
        {films.map((item, i) => {
          const offset = ((i - index + 7) % 5) - 2;
          const active = offset === 0;
          return (
            <article
              key={item.id}
              className={`reel-card ${active ? 'is-current' : ''}`}
              data-position={offset}
              aria-label={active ? `Now playing: ${film.title}` : undefined}
            >
              {active ? (
                <>
                  <div className="reel-picture">
                    <video
                      ref={video}
                      src={film.src}
                      poster={film.cover}
                      playsInline
                      preload="auto"
                      muted={muted}
                      onClick={() => void play()}
                      onLoadedMetadata={(e) => {
                        if (Number.isFinite(e.currentTarget.duration))
                          setDuration(e.currentTarget.duration);
                      }}
                      onTimeUpdate={(e) =>
                        setElapsed(e.currentTarget.currentTime)
                      }
                      onPlaying={() => {
                        setPlaying(true);
                        setLoading(false);
                        setError(false);
                      }}
                      onPause={() => setPlaying(false)}
                      onWaiting={() => setLoading(true)}
                      onCanPlay={() => setLoading(false)}
                      onEnded={() => {
                        setEnded(true);
                        setPlaying(false);
                      }}
                      onError={() => {
                        setError(true);
                        setLoading(false);
                        setPlaying(false);
                      }}
                      aria-label={`${film.title} video`}
                    />
                    {loading && !error && (
                      <div className="screen-state" role="status">
                        <span className="loading-ring" />
                        <span>Loading your music video…</span>
                      </div>
                    )}
                    {error ? (
                      <div className="screen-state error-state" role="alert">
                        <p>The music video couldn’t load.</p>
                        <span>Check your connection and try again.</span>
                        <button
                          className="state-play"
                          onClick={() => {
                            setError(false);
                            setLoading(true);
                            const el = video.current!;
                            el.load();
                            void el.play().catch(() => {
                              if (video.current === el) {
                                setPlaying(false);
                                setLoading(false);
                              }
                            });
                          }}
                        >
                          <RotateCcw size={18} />
                          Try again
                        </button>
                      </div>
                    ) : (
                      !loading &&
                      !playing && (
                        <div
                          className={`paused-overlay ${ended ? 'is-ended' : ''}`}
                        >
                          <button
                            className="big-play"
                            onClick={ended ? replay : () => void play()}
                            aria-label={
                              ended ? 'Replay music video' : 'Play music video'
                            }
                          >
                            {ended ? (
                              <RotateCcw size={27} />
                            ) : (
                              <Play size={27} fill="currentColor" />
                            )}
                          </button>
                          <span>
                            {ended ? 'Feel it again.' : 'Press play.'}
                          </span>
                          {ended && (
                            <button
                              data-press
                              className="ended-book"
                              onClick={onBook}
                            >
                              Book my slot
                              <ArrowUpRight size={16} />
                            </button>
                          )}
                        </div>
                      )
                    )}
                  </div>
                  <div className="reel-caption">
                    <div>
                      <DialogTitle className="reel-title">
                        {film.title}
                      </DialogTitle>
                      <DialogDescription className="reel-description">
                        {film.subtitle}
                      </DialogDescription>
                    </div>
                    <span
                      className="reel-activity"
                      data-active={playing && !loading && !muted}
                      aria-hidden="true"
                    >
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                  </div>
                </>
              ) : (
                <button
                  className="reel-cover"
                  onClick={() => select(i, true)}
                  aria-label={`Watch ${item.title}`}
                >
                  <img
                    src={item.cover}
                    alt=""
                    width={288}
                    height={512}
                    draggable={false}
                  />
                  <span className="reel-cover-caption">
                    <strong>{item.title}</strong>
                    <span>AICANFEEL</span>
                  </span>
                </button>
              )}
            </article>
          );
        })}
      </div>
      <div className="room-console">
        <div className="signal-readout">
          <span>
            {playing ? 'NOW PLAYING' : ended ? 'FIN' : 'PAUSED'}
            <span className="readout-separator"> / </span>0{index + 1}
          </span>
          <FilmWave
            video={video}
            filmId={film.id}
            playing={playing && !loading}
            muted={muted}
            reduced={reduced}
          />
          <span>{muted ? 'SOUND OFF' : 'ORIGINAL SOUND'}</span>
        </div>
        <div className="glass-transport">
          <div className="transport-topline">
            <div className="transport-track">
              <img src={film.cover} alt="" width={30} height={40} />
              <span>
                <strong>{film.title}</strong>
                <small>AICANFEEL</small>
              </span>
            </div>
            <div className="time-tools">
              <span className="time-code">
                {time(elapsed)} <span>/ {time(duration)}</span>
              </span>
              <button
                className="icon-button"
                onClick={replay}
                disabled={error}
                aria-label="Replay music video"
              >
                <RotateCcw size={17} />
              </button>
            </div>
          </div>
          <label className="seek-label">
            <span className="sr-only">Seek through music video</span>
            <Slider
              className="seek-bar"
              value={[elapsed]}
              min={0}
              max={duration || 1}
              step={0.1}
              onValueChange={seek}
              disabled={error}
            />
          </label>
          <div className="deck-controls">
            <button
              className="icon-button"
              onClick={() => setMuted(!muted)}
              aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            >
              {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <div className="deck-primary-controls">
              <button
                className="icon-button"
                onClick={() => select(index - 1)}
                aria-label="Previous music video"
              >
                <SkipBack size={20} fill="currentColor" />
              </button>
              <button
                ref={playButton}
                className="deck-play"
                onClick={() => void play()}
                disabled={error}
                aria-label={playing ? 'Pause music video' : 'Play music video'}
              >
                {playing ? (
                  <Pause size={21} fill="currentColor" />
                ) : (
                  <Play size={21} fill="currentColor" />
                )}
              </button>
              <button
                className="icon-button"
                onClick={() => select(index + 1)}
                aria-label="Next music video"
              >
                <SkipForward size={20} fill="currentColor" />
              </button>
            </div>
            <div className="deck-secondary-controls">
              {fullscreenSupported && (
                <button
                  className="icon-button"
                  onClick={() => void fullscreen()}
                  aria-label={full ? 'Exit fullscreen' : 'Enter fullscreen'}
                >
                  {full ? <Minimize size={18} /> : <Maximize size={18} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <span className="player-notice" role="status">
        {notice}
      </span>
    </div>
  );
}
