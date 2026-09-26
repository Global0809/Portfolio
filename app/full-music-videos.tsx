'use client';

/* oxlint-disable jsx-a11y/media-has-caption -- No caption tracks were supplied with the original music videos. */
/* oxlint-disable next/no-img-element -- These below-fold WebP posters are already compressed, sized, and lazy loaded. */
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Play, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { fullMusicVideos, type FullMusicVideo } from './full-music-video-catalog';

const durationLabel = (seconds: number) => {
  const rounded = Math.round(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
};

type VideoQuality = keyof FullMusicVideo['sources'];

const defaultQuality = (): VideoQuality => {
  if (typeof window === 'undefined') return 'mobile';
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData || window.matchMedia('(max-width: 767px)').matches
    ? 'mobile'
    : 'hd';
};

function FullVideoPlayback({
  video,
}: {
  video: FullMusicVideo;
}) {
  const element = useRef<HTMLVideoElement>(null);
  const resume = useRef({ time: 0, playing: true, muted: false, volume: 1, rate: 1 });
  const [quality, setQuality] = useState<VideoQuality>(defaultQuality);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [failed, setFailed] = useState(false);
  const [playBlocked, setPlayBlocked] = useState(false);
  const source = video.sources[quality];

  useEffect(() => {
    if (!loading) return;
    const delay = window.setTimeout(() => setSlow(true), 20000);
    return () => window.clearTimeout(delay);
  }, [loading, attempt, quality]);

  useEffect(() => {
    let cancelled = false;
    const player = element.current;
    if (!player) return;
    const saved = { ...resume.current };
    const tryPlay = () => {
      void player.play().catch((reason: unknown) => {
        if (cancelled || !(reason instanceof DOMException) || reason.name !== 'NotAllowedError') return;
        setLoading(false);
        setPlayBlocked(true);
      });
    };
    const restore = () => {
      if (cancelled) return;
      if (Number.isFinite(player.duration)) {
        player.currentTime = Math.min(saved.time, Math.max(0, player.duration - 0.05));
      }
      player.muted = saved.muted;
      player.volume = saved.volume;
      player.playbackRate = saved.rate;
    };
    player.addEventListener('loadedmetadata', restore, { once: true });
    player.muted = saved.muted;
    player.volume = saved.volume;
    player.playbackRate = saved.rate;
    player.src = source;
    player.load();
    // Calling play immediately retains the selection gesture where browsers allow it.
    if (saved.playing) tryPlay();
    return () => {
      cancelled = true;
      player.removeEventListener('loadedmetadata', restore);
      player.pause();
      player.removeAttribute('src');
      player.load();
    };
  }, [attempt, source]);

  const ready = () => {
    setLoading(false);
    setSlow(false);
  };
  const playing = () => {
    ready();
    setPlayBlocked(false);
  };
  const error = () => {
    setLoading(false);
    setFailed(true);
  };
  const rememberPlayback = () => {
    const player = element.current;
    if (!player) return;
    // A second quality choice during loading must keep the first saved position.
    if (player.readyState < HTMLMediaElement.HAVE_METADATA) return;
    resume.current = {
      time: player.currentTime,
      playing: !player.paused && !player.ended,
      muted: player.muted,
      volume: player.volume,
      rate: player.playbackRate,
    };
  };
  const beginLoading = () => {
    setLoading(true);
    setSlow(false);
    setFailed(false);
    setPlayBlocked(false);
  };
  const retry = () => {
    rememberPlayback();
    resume.current.playing = true;
    beginLoading();
    setAttempt((value) => value + 1);
  };
  const changeQuality = (next: VideoQuality) => {
    if (next === quality) return;
    rememberPlayback();
    beginLoading();
    setQuality(next);
  };
  const play = () => {
    void element.current?.play().catch(() => setPlayBlocked(true));
  };

  return (
    <>
      <div className="full-video-screen" aria-busy={loading}>
        <video
          ref={element}
          poster={video.cover}
          controls
          playsInline
          preload="metadata"
          aria-label={`${video.title}, full music video`}
          onLoadedData={ready}
          onCanPlay={ready}
          onPlaying={playing}
          onWaiting={() => setLoading(true)}
          onError={error}
        />
        {playBlocked && !failed && (
          <button className="full-video-start" onClick={play}>
            <Play size={20} fill="currentColor" /> Play music video
          </button>
        )}
        {loading && !failed && (
          <output className="full-video-loading" aria-live="polite">
            <span aria-hidden="true" /> Loading music video
          </output>
        )}
        {failed && (
          <div className="full-video-error" role="alert">
            <p>This music video couldn’t load.</p>
            <button onClick={retry}>
              <RotateCcw size={16} /> Try again
            </button>
          </div>
        )}
      </div>
      <div className="full-video-playback-options">
        <label className="full-video-quality">
          Quality
          <select value={quality} onChange={(event) => changeQuality(event.target.value as VideoQuality)}>
            <option value="mobile">720p</option>
            <option value="hd">1080p</option>
          </select>
        </label>
      </div>
      {slow && loading && !failed && (
        <output className="full-video-slow" aria-live="polite">
          Taking longer than expected.
          <button onClick={retry}>
            Retry player
          </button>
        </output>
      )}
    </>
  );
}

export function FullMusicVideos({
  onViewingChange,
}: {
  onViewingChange: (open: boolean) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const closeButton = useRef<HTMLButtonElement | null>(null);

  const available = fullMusicVideos;
  const selected = available.find((video) => video.id === selectedId);
  const selectedIndex = available.findIndex((video) => video.id === selectedId);

  function open(video: FullMusicVideo, trigger: HTMLButtonElement) {
    returnFocus.current = trigger;
    setSelectedId(video.id);
    onViewingChange(true);
  }

  function close() {
    setSelectedId(null);
    onViewingChange(false);
  }

  function change(direction: number) {
    const next = (selectedIndex + direction + available.length) % available.length;
    setSelectedId(available[next].id);
  }

  if (!available.length) return null;

  return (
    <>
      <section
        id="full-music-videos"
        className="full-music-videos"
        aria-labelledby="full-video-heading"
      >
        <div className="full-video-heading" data-reveal>
          <div>
            <h2 id="full-video-heading">Full music videos<span>.</span></h2>
          </div>
          <span className="full-video-count">0{available.length} music videos</span>
        </div>

        <div className="full-video-grid">
          {available.map((video) => (
            <button
              key={video.id}
              className="full-video-card"
              data-reveal
              data-press
              data-scan="watch"
              data-scan-id={`full-video-${video.id}`}
              aria-label={`Watch ${video.title}, ${durationLabel(video.duration)}`}
              onClick={(event) => open(video, event.currentTarget)}
            >
              <span className="full-video-cover">
                <img
                  src={video.cover}
                  alt=""
                  width={960}
                  height={540}
                  loading="lazy"
                  decoding="async"
                />
                <span className="full-video-play" data-scan-port>
                  <Play size={17} strokeWidth={1.6} fill="currentColor" />
                </span>
                <span className="full-video-runtime">{durationLabel(video.duration)}</span>
              </span>
              <span className="full-video-caption">
                <span className="full-video-title">{video.title}</span>
                <span className="full-video-watch">
                  <span>Watch</span>
                  <ArrowRight size={17} strokeWidth={1.5} />
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <Dialog
        open={Boolean(selected)}
        onOpenChange={(isOpen) => {
          if (!isOpen) close();
        }}
      >
        {selected && (
          <DialogContent
            className="full-video-dialog"
            showCloseButton={false}
            initialFocus={closeButton}
            finalFocus={returnFocus}
          >
            <header className="full-video-toolbar">
              <button ref={closeButton} onClick={close} className="full-video-back">
                <ArrowLeft size={18} strokeWidth={1.6} /> All music videos
              </button>
              <span className="full-video-position" aria-hidden="true">
                0{selectedIndex + 1} <span>/ 0{available.length}</span>
              </span>
            </header>

            <FullVideoPlayback
              key={selected.id}
              video={selected}
            />

            <div className="full-video-details">
              <div className="full-video-current" aria-live="polite">
                <DialogDescription className="full-video-description">
                  Full music video
                  <span aria-hidden="true"> · </span>
                  {durationLabel(selected.duration)}
                </DialogDescription>
                <DialogTitle className="full-video-current-title">
                  {selected.title}
                </DialogTitle>
              </div>
              {available.length > 1 && (
                <nav className="full-video-switch" aria-label="Choose a music video">
                  <button
                    aria-label={`Previous music video: ${available[(selectedIndex - 1 + available.length) % available.length].title}`}
                    onClick={() => change(-1)}
                  >
                    <ArrowLeft size={20} strokeWidth={1.5} />
                  </button>
                  <button
                    aria-label={`Next music video: ${available[(selectedIndex + 1) % available.length].title}`}
                    onClick={() => change(1)}
                  >
                    <ArrowRight size={20} strokeWidth={1.5} />
                  </button>
                </nav>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
