'use client';

/* oxlint-disable jsx-a11y/media-has-caption -- No caption tracks were supplied with the original music videos. */
/* oxlint-disable next/no-img-element -- These below-fold WebP posters are already compressed, sized, and lazy loaded. */
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
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

const subscribeToHost = () => () => {};
const isLocalHost = () =>
  ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
const serverHost = () => false;

function FullVideoPlayback({
  video,
  local,
}: {
  video: FullMusicVideo;
  local: boolean;
}) {
  const element = useRef<HTMLVideoElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const delay = window.setTimeout(() => setSlow(true), 20000);
    const player = element.current;
    if (player) {
      // Restore the source after React's development effect cleanup as well.
      player.src = `http://127.0.0.1:4174/${video.id}.mp4`;
      void player.play().catch(() => {
        // The native play button remains available if autoplay is blocked.
        if (!cancelled) setLoading(false);
      });
    }
    return () => {
      cancelled = true;
      window.clearTimeout(delay);
      if (player) {
        player.pause();
        player.removeAttribute('src');
        player.load();
      }
    };
  }, [attempt, video.id]);

  const ready = () => {
    setLoading(false);
    setSlow(false);
  };
  const error = () => {
    setLoading(false);
    setFailed(true);
  };
  const retry = () => {
    setLoading(true);
    setSlow(false);
    setFailed(false);
    setAttempt((value) => value + 1);
  };

  return (
    <>
      <div className="full-video-screen" aria-busy={loading}>
        {local ? (
          <video
            key={`${video.id}-${attempt}`}
            ref={element}
            src={`http://127.0.0.1:4174/${video.id}.mp4`}
            poster={video.cover}
            controls
            playsInline
            autoPlay
            preload="metadata"
            aria-label={`${video.title}, full music video`}
            onLoadedData={ready}
            onPlaying={ready}
            onError={error}
          />
        ) : (
          <iframe
            key={`${video.id}-${attempt}`}
            src={`https://player.mux.com/${encodeURIComponent(video.playbackId)}?autoplay=true&max-resolution=1080p&primary-color=%23f2f3f3`}
            title={`${video.title} — full music video player`}
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            onLoad={ready}
            onError={error}
          />
        )}
        {loading && !failed && (
          <output className="full-video-loading" aria-live="polite">
            <span aria-hidden="true" /> Opening music video
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
  const localPreview = useSyncExternalStore(subscribeToHost, isLocalHost, serverHost);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  const closeButton = useRef<HTMLButtonElement | null>(null);

  const available = fullMusicVideos.filter(
    (video) => Boolean(video.playbackId) || localPreview,
  );
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
          {localPreview && available.some((video) => !video.playbackId) ? (
            <span className="full-video-preview-label">Local preview</span>
          ) : (
            <span className="full-video-count">0{available.length} music videos</span>
          )}
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
              local={localPreview && !selected.playbackId}
            />

            <div className="full-video-details">
              <div className="full-video-current" aria-live="polite">
                <DialogDescription className="full-video-description">
                  {localPreview && !selected.playbackId ? 'Local preview' : 'Full music video'}
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
