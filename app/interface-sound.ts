'use client';

import { useEffect, useRef, useState } from 'react';

// Short synthesized accents: no audio files, autoplay, hover sounds, or loop.
// The audio context is created only by the visitor's explicit sound toggle.
export function useInterfaceSound(filmOpen: boolean) {
  const [enabled, setEnabled] = useState(false);
  const [available, setAvailable] = useState(true);
  const context = useRef<AudioContext | null>(null);
  const settings = useRef({ enabled, filmOpen });
  settings.current = { enabled, filmOpen };
  const last = useRef(0);
  const voices = useRef(new Set<OscillatorNode>());

  function silence() {
    for (const oscillator of voices.current) {
      try {
        oscillator.stop();
      } catch {
        /* already ended */
      }
    }
    voices.current.clear();
  }

  function accent(kind: 'tap' | 'step' | 'open' | 'enable' = 'tap') {
    const audio = context.current;
    if (!audio || document.hidden || settings.current.filmOpen) return;
    if (performance.now() - last.current < 85) return;
    last.current = performance.now();
    const play = () => {
      if (
        !settings.current.enabled ||
        settings.current.filmOpen ||
        document.hidden ||
        audio.state !== 'running'
      )
        return;
      const t = audio.currentTime;
      const notes =
        kind === 'enable'
          ? [523.25, 783.99]
          : kind === 'open'
            ? [392, 587.33]
            : kind === 'step'
              ? [660]
              : [480];
      notes.forEach((frequency, i) => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        const start = t + i * 0.035;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, start);
        oscillator.frequency.exponentialRampToValueAtTime(
          frequency * 0.78,
          start + 0.12,
        );
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.035 / notes.length, start + 0.009);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.15);
        oscillator.connect(gain);
        gain.connect(audio.destination);
        voices.current.add(oscillator);
        oscillator.onended = () => {
          voices.current.delete(oscillator);
          oscillator.disconnect();
          gain.disconnect();
        };
        oscillator.start(start);
        oscillator.stop(start + 0.16);
      });
    };
    if (audio.state === 'suspended')
      void audio
        .resume()
        .then(play)
        .catch(() => {});
    else play();
  }

  function toggle() {
    if (enabled) {
      settings.current.enabled = false;
      setEnabled(false);
      silence();
      void context.current?.suspend().catch(() => {});
      return;
    }
    try {
      const Constructor =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Constructor) {
        setAvailable(false);
        return;
      }
      context.current ||= new Constructor();
      settings.current.enabled = true;
      setEnabled(true);
      accent('enable');
    } catch {
      setAvailable(false);
    }
  }

  useEffect(() => {
    if (filmOpen) silence();
  }, [filmOpen]);

  useEffect(() => {
    setAvailable(
      !!(
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      ),
    );
    const click = (event: MouseEvent) => {
      if (
        !event.isTrusted ||
        !settings.current.enabled ||
        settings.current.filmOpen ||
        !(event.target instanceof Element)
      )
        return;
      const target = event.target.closest<HTMLElement>(
        'button, a, [role="button"]',
      );
      if (
        !target ||
        target.closest('.cinema') ||
        target.matches('[data-sound-toggle],:disabled,[aria-disabled="true"]')
      )
        return;
      // Film selection is deliberately quiet, leaving its original soundtrack alone.
      if (
        target.matches(
          '.film-entry,.primary-watch,.sculpture-canvas,.fallback-watch',
        )
      )
        return;
      accent(
        target.closest('.stage-arrows')
          ? 'step'
          : target.matches('.hero-book,.nav-book,.booking-submit')
            ? 'open'
            : 'tap',
      );
    };
    const visibility = () => {
      document.documentElement.dataset.pageHidden = String(document.hidden);
      if (document.hidden) {
        silence();
        void context.current?.suspend().catch(() => {});
      }
    };
    document.addEventListener('click', click);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      document.removeEventListener('click', click);
      document.removeEventListener('visibilitychange', visibility);
      delete document.documentElement.dataset.pageHidden;
      silence();
      void context.current?.close().catch(() => {});
      context.current = null;
    };
  }, []);

  return { enabled, available, toggle };
}
