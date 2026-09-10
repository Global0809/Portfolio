'use client';

import { useEffect, useRef, useState } from 'react';

// Layered glass notes and a low tactile accent, synthesized only on interaction.
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
