'use client';

import { useEffect, useRef, useState } from 'react';

// Layered glass notes and a low tactile accent, synthesized only on interaction.
// Default-on preference; the context is armed only by a trusted visitor gesture.
export function useInterfaceSound(filmOpen: boolean, ambientPaused = false) {
  const [enabled, setEnabled] = useState(true);
  const [available, setAvailable] = useState(true);
  const context = useRef<AudioContext | null>(null);
  const settings = useRef({ enabled, filmOpen, ambientPaused });
  settings.current = { enabled, filmOpen, ambientPaused };
  const last = useRef(0);
  const voices = useRef(new Set<OscillatorNode>());
  const lastGesture = useRef(-20000);
  const lastAmbient = useRef(-2000);
  const variation = useRef(0);
  const unlocking = useRef(false);

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
          ? [523.25, 783.99, 1046.5]
          : kind === 'open'
            ? [392, 587.33, 783.99]
            : kind === 'step'
              ? [659.25, 880]
              : [523.25];
      notes.forEach((frequency, i) => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        const start = t + i * 0.045;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, start);
        oscillator.frequency.exponentialRampToValueAtTime(
          frequency * 0.96,
          start + 0.22,
        );
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.085 / notes.length, start + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
        oscillator.connect(gain);
        gain.connect(audio.destination);
        voices.current.add(oscillator);
        oscillator.onended = () => {
          voices.current.delete(oscillator);
          oscillator.disconnect();
          gain.disconnect();
        };
        oscillator.start(start);
        oscillator.stop(start + 0.31);
      });
      // A short body under the glass tone makes taps perceptible on phone speakers.
      const body = audio.createOscillator();
      const bodyGain = audio.createGain();
      body.type = 'sine';
      body.frequency.setValueAtTime(kind === 'open' ? 240 : 190, t);
      body.frequency.exponentialRampToValueAtTime(90, t + 0.13);
      bodyGain.gain.setValueAtTime(0, t);
      bodyGain.gain.linearRampToValueAtTime(0.065, t + 0.006);
      bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      body.connect(bodyGain);
      bodyGain.connect(audio.destination);
      voices.current.add(body);
      body.onended = () => {
        voices.current.delete(body);
        body.disconnect();
        bodyGain.disconnect();
      };
      body.start(t);
      body.stop(t + 0.17);
    };
    if (audio.state === 'suspended')
      void audio
        .resume()
        .then(play)
        .catch(() => {});
    else play();
  }

  function toggle() {
    try {
      localStorage.setItem('aicanfeel-sound', enabled ? 'off' : 'on');
    } catch {
      /* optional preference */
    }
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
    try {
      if (localStorage.getItem('aicanfeel-sound') === 'off') {
        settings.current.enabled = false;
        setEnabled(false);
      }
    } catch {
      /* storage optional */
    }
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
        'button, a, [role="button"], [role="radio"]',
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
        target.closest('.stage-arrows') || target.matches('[role="radio"]')
          ? 'step'
          : target.matches('.hero-book,.nav-book,.booking-submit')
            ? 'open'
            : 'tap',
      );
    };
    const arm = (event: Event) => {
      if (!event.isTrusted || !(event.target instanceof Element)) return;
      if (
        event instanceof PointerEvent &&
        (!event.isPrimary || event.button !== 0)
      )
        return;
      // Touch activation is reliable on release; do not lock out the qualifying event.
      if (
        event instanceof PointerEvent &&
        event.pointerType !== 'mouse' &&
        event.type === 'pointerdown'
      )
        return;
      if (
        event instanceof KeyboardEvent &&
        (event.repeat || event.ctrlKey || event.metaKey || event.altKey)
      )
        return;
      lastGesture.current = performance.now();
      if (
        !settings.current.enabled ||
        settings.current.filmOpen ||
        (unlocking.current && event.type !== 'pointerup') ||
        event.target.closest(
          '[data-sound-toggle],.cinema,.film-entry,.primary-watch,.sculpture-canvas,.fallback-watch',
        )
      )
        return;
      try {
        const Constructor =
          window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!Constructor) return;
        const fresh = !context.current;
        context.current ||= new Constructor();
        if (!fresh && context.current.state === 'running') return;
        unlocking.current = true;
        void context.current
          .resume()
          .then(() => {
            unlocking.current = false;
            accent('enable');
          })
          .catch(() => {
            unlocking.current = false;
          });
      } catch {
        setAvailable(false);
      }
    };
    const scan = (event: Event) => {
      const audio = context.current;
      const now = performance.now();
      if (
        !audio ||
        audio.state !== 'running' ||
        !settings.current.enabled ||
        settings.current.filmOpen ||
        settings.current.ambientPaused ||
        document.hidden ||
        now - lastGesture.current > 10000 ||
        now - lastAmbient.current < 1150 ||
        now - last.current < 420
      )
        return;
      lastAmbient.current = now;
      last.current = now;
      const scrolling =
        (event as CustomEvent<{ cause?: string }>).detail?.cause === 'scroll';
      const variant = variation.current++ % 3;
      const frequency = [740, 980, 620][variant];
      // Quiet digital doublets, with a falling tail when the scan follows scrolling.
      [0, 1].forEach((i) => {
        const oscillator = audio.createOscillator(),
          gain = audio.createGain(),
          filter = audio.createBiquadFilter();
        const t = audio.currentTime + i * 0.058;
        const duration = i ? 0.055 : 0.038;
        filter.type = 'lowpass';
        filter.frequency.value = 1900;
        oscillator.type = i ? 'triangle' : 'square';
        oscillator.frequency.setValueAtTime(frequency * (i ? 1.52 : 1), t);
        oscillator.frequency.exponentialRampToValueAtTime(
          scrolling ? 280 : frequency * 0.48,
          t + duration,
        );
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(i ? 0.009 : 0.011, t + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
        oscillator.connect(filter);
        filter.connect(gain);
        gain.connect(audio.destination);
        voices.current.add(oscillator);
        oscillator.onended = () => {
          voices.current.delete(oscillator);
          oscillator.disconnect();
          filter.disconnect();
          gain.disconnect();
        };
        oscillator.start(t);
        oscillator.stop(t + duration + 0.01);
      });
    };
    const scrollIntent = (event: Event) => {
      if (event.isTrusted) lastGesture.current = performance.now();
    };
    const visibility = () => {
      document.documentElement.dataset.pageHidden = String(document.hidden);
      if (document.hidden) {
        silence();
        void context.current?.suspend().catch(() => {});
      }
    };
    document.addEventListener('pointerdown', arm, true);
    document.addEventListener('pointerup', arm, true);
    document.addEventListener('keydown', arm, true);
    window.addEventListener('wheel', scrollIntent, { passive: true });
    window.addEventListener('touchmove', scrollIntent, { passive: true });
    window.addEventListener('aicanfeel:scan', scan);
    document.addEventListener('click', click);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      document.removeEventListener('pointerdown', arm, true);
      document.removeEventListener('pointerup', arm, true);
      document.removeEventListener('keydown', arm, true);
      window.removeEventListener('wheel', scrollIntent);
      window.removeEventListener('touchmove', scrollIntent);
      window.removeEventListener('aicanfeel:scan', scan);
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
