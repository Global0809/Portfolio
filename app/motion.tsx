'use client';

import { useEffect } from 'react';

// One observer and delegated input listeners; no scroll loop or animation library.
export function useExperienceMotion() {
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const reveals = Array.from(
      document.querySelectorAll<HTMLElement>('[data-reveal]'),
    );
    const animations = new Set<Animation>();
    const cleanups = new Set<() => void>();
    const presses = new WeakMap<HTMLElement, () => void>();
    let observer: IntersectionObserver | null = null;
    const settle = () => {
      observer?.disconnect();
      for (const element of reveals) element.dataset.reveal = 'visible';
      for (const cleanup of cleanups) cleanup();
      for (const animation of animations) animation.cancel();
      animations.clear();
    };
    if (!preference.matches && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            (entry.target as HTMLElement).dataset.reveal = 'visible';
            observer?.unobserve(entry.target);
          }
        },
        { threshold: 0.08 },
      );
      for (const element of reveals) {
        if (element.getBoundingClientRect().top > innerHeight * 0.9) {
          element.dataset.reveal = 'waiting';
          observer.observe(element);
        } else element.dataset.reveal = 'visible';
      }
    }
    const press = (target: EventTarget | null, x?: number, y?: number) => {
      if (
        preference.matches ||
        document.documentElement.dataset.effectsPaused === 'true' ||
        !(target instanceof Element)
      )
        return;
      const button = target.closest<HTMLElement>('[data-press]');
      if (
        !button ||
        button.matches(':disabled,[aria-disabled="true"]') ||
        !button.animate
      )
        return;
      presses.get(button)?.();
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'touch-light';
      ripple.setAttribute('aria-hidden', 'true');
      const size = Math.max(rect.width, rect.height) * 2;
      Object.assign(ripple.style, {
        width: `${size}px`,
        height: `${size}px`,
        left: `${(x ?? rect.left + rect.width / 2) - rect.left - size / 2}px`,
        top: `${(y ?? rect.top + rect.height / 2) - rect.top - size / 2}px`,
      });
      button.appendChild(ripple);
      const spring = button.animate(
        [
          { scale: '1', offset: 0 },
          { scale: '0.96', offset: 0.18 },
          { scale: '1.025', offset: 0.55 },
          { scale: '0.997', offset: 0.8 },
          { scale: '1', offset: 1 },
        ],
        { duration: 440, easing: 'cubic-bezier(.22,.7,.2,1)' },
      );
      const light = ripple.animate(
        [
          { transform: 'scale(.08)', opacity: 0.45 },
          { transform: 'scale(.75)', opacity: 0.18, offset: 0.5 },
          { transform: 'scale(1)', opacity: 0 },
        ],
        { duration: 520, easing: 'ease-out' },
      );
      const cleanup = () => {
        spring.cancel();
        light.cancel();
        ripple.remove();
        animations.delete(spring);
        animations.delete(light);
        cleanups.delete(cleanup);
        presses.delete(button);
      };
      presses.set(button, cleanup);
      cleanups.add(cleanup);
      animations.add(spring);
      animations.add(light);
      light.onfinish = cleanup;
    };
    const pointer = (event: PointerEvent) => {
      if (event.isPrimary && event.button === 0)
        press(event.target, event.clientX, event.clientY);
    };
    const keyboard = (event: KeyboardEvent) => {
      if (!event.repeat && (event.key === 'Enter' || event.key === ' '))
        press(event.target);
    };
    const preferenceChanged = () => {
      if (preference.matches) settle();
    };
    document.addEventListener('pointerdown', pointer, { passive: true });
    document.addEventListener('keydown', keyboard);
    preference.addEventListener('change', preferenceChanged);
    return () => {
      settle();
      document.removeEventListener('pointerdown', pointer);
      document.removeEventListener('keydown', keyboard);
      preference.removeEventListener('change', preferenceChanged);
    };
  }, []);
}
