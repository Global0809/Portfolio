'use client';

import { useEffect, useRef } from 'react';
import { ArrowUpRight, Send } from 'lucide-react';
import { studio } from './studio-config';
import { VerifiedMark } from './verified-mark';

export function InstagramInvitation() {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = panel.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      element.dataset.inView = String(entry.isIntersecting);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <section className="instagram-contact" id="contact" aria-labelledby="contact-title">
      <div ref={panel} className="instagram-invitation liquid-panel" data-reveal>
        <div className="contact-orbit" aria-hidden="true"><i /><i /><span><Send size={28} strokeWidth={1.1} /></span></div>
        <div className="contact-copy">
          <p className="contact-eyebrow"><span /> LET’S CREATE TOGETHER</p>
          <h2 id="contact-title">Your next music video<br /><em>starts with a message.</em></h2>
          <p className="contact-description">Send us your track. Tell us what you have in mind.<br className="contact-desktop-break" /> We’ll take it from there.</p>
          <a className="instagram-message" href={studio.instagramMessageUrl} target="_blank" rel="noopener noreferrer" data-press data-scan="contact" data-scan-id="instagram-message">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".9" fill="currentColor" stroke="none" /></svg>
            <span>Message us on Instagram</span>
            <ArrowUpRight size={20} strokeWidth={1.6} data-scan-port />
          </a>
          <div className="contact-profile">
            <a href={studio.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Visit the AICANFEEL Instagram profile"><span>@aicanfeel</span><VerifiedMark /><ArrowUpRight size={12} /></a>
            <span>{studio.instagramFollowers} followers</span>
          </div>
        </div>
      </div>
    </section>
  );
}
