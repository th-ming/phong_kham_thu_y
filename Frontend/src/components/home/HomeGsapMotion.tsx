import React from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type HomeGsapMotionProps = {
    scopeRef: React.RefObject<HTMLElement>;
};

const HomeGsapMotion: React.FC<HomeGsapMotionProps> = ({ scopeRef }) => {
    useGSAP(() => {
        const root = scopeRef.current;
        if (!root) return;

        const mm = gsap.matchMedia();
        const scrollRevealSelectors = [
            ".home-stats-panel",
            ".stats-header",
            ".stat-card",
            ".home-process-container > .section-label",
            ".home-process-container > h2",
            ".home-process-container > p",
            ".step-card",
            ".home-doctors-heading",
            ".doc-featured",
            ".doc-card-small",
            ".doctor-all-card",
            ".home-partners-heading",
            ".stat-card-light",
            ".partner-card-new:not(.partner-card-duplicate)",
            ".reviews-header",
            ".reviews-rating-badge",
            ".faq-side",
            ".faq-item",
            ".home-cta-section .cta-badges > div",
            ".home-cta-section h2",
            ".home-cta-section p",
            ".cta-action-card",
            ".contact-heading",
            ".contact-card-main",
            ".contact-info-row",
            ".contact-map-wrap",
            ".contact-location-bar"
        ];

        mm.add("(prefers-reduced-motion: reduce)", () => {
            gsap.set(
                [
                    ".hero-content .section-label",
                    ".hero-title",
                    ".mission-text",
                    ".hero-cta-grid .btn",
                    ".hero-stat-pill",
                    ".hero-image-container",
                    ".home-feature-card",
                    ".home-services-heading",
                    ".featured-service-card",
                    ".service-tab",
                    ...scrollRevealSelectors
                ],
                { clearProps: "all" }
            );
        });

        mm.add("(prefers-reduced-motion: no-preference)", () => {
            const revealOnScroll = (
                selector: string,
                options: { x?: number; y?: number; stagger?: number; duration?: number; start?: string } = {}
            ) => {
                const targets = gsap.utils.toArray<HTMLElement>(selector);
                if (!targets.length) return;

                gsap.from(targets, {
                    x: options.x ?? 0,
                    y: options.y ?? 30,
                    autoAlpha: 0,
                    stagger: options.stagger ?? 0.08,
                    duration: options.duration ?? 0.65,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: targets[0],
                        start: options.start ?? "top 82%",
                        once: true
                    }
                });
            };

            const heroTimeline = gsap.timeline({
                defaults: { ease: "power3.out" },
                delay: 0.2
            });

            heroTimeline
                .from(".hero-content .section-label", {
                    y: 18,
                    duration: 0.45
                })
                .from(".hero-title", {
                    y: 34,
                    duration: 0.65
                }, "-=0.15")
                .from(".mission-text", {
                    y: 24,
                    duration: 0.55
                }, "-=0.3")
                .from(".hero-cta-grid .btn", {
                    y: 18,
                    stagger: 0.09,
                    duration: 0.45
                }, "-=0.22")
                .from(".hero-stat-pill", {
                    y: 22,
                    stagger: 0.08,
                    duration: 0.5
                }, "-=0.2")
                .from(".hero-image-container", {
                    x: 38,
                    scale: 0.98,
                    duration: 0.8
                }, "-=0.72");

            gsap.from(".home-feature-card", {
                y: 22,
                autoAlpha: 0,
                stagger: 0.06,
                duration: 0.5,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: ".home-feature-strip",
                    start: "top 82%",
                    once: true
                }
            });

            gsap.from(".home-services-heading", {
                y: 32,
                autoAlpha: 0,
                duration: 0.65,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: ".home-services-section",
                    start: "top 72%",
                    once: true
                }
            });

            gsap.from(".featured-service-card", {
                x: -34,
                autoAlpha: 0,
                duration: 0.75,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: ".home-services-section",
                    start: "top 62%",
                    once: true
                }
            });

            gsap.from(".service-tab", {
                x: 28,
                autoAlpha: 0,
                stagger: 0.045,
                duration: 0.45,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: ".service-list-shell",
                    start: "top 78%",
                    once: true
                }
            });

            revealOnScroll(".home-stats-panel", { y: 36, duration: 0.75 });
            revealOnScroll(".stats-header", { y: 24, duration: 0.55 });
            revealOnScroll(".stat-card", { y: 28, stagger: 0.07 });

            revealOnScroll(".home-process-container > .section-label, .home-process-container > h2, .home-process-container > p", {
                y: 24,
                stagger: 0.07
            });
            revealOnScroll(".step-card", { y: 34, stagger: 0.08 });

            revealOnScroll(".home-doctors-heading", { y: 28 });
            revealOnScroll(".doc-featured", { x: -34, y: 0, duration: 0.75 });
            revealOnScroll(".doc-card-small, .doctor-all-card", { x: 24, y: 18, stagger: 0.07 });

            revealOnScroll(".home-partners-heading", { y: 28 });
            revealOnScroll(".stat-card-light", { y: 26, stagger: 0.08 });
            revealOnScroll(".partner-card-new:not(.partner-card-duplicate)", { y: 20, stagger: 0.04, duration: 0.45 });

            revealOnScroll(".reviews-header, .reviews-rating-badge", { y: 28, stagger: 0.08 });

            revealOnScroll(".faq-side", { x: -28, y: 0 });
            revealOnScroll(".faq-item", { x: 28, y: 0, stagger: 0.06 });

            revealOnScroll(".home-cta-section .cta-badges > div, .home-cta-section h2, .home-cta-section p", {
                y: 26,
                stagger: 0.08
            });
            revealOnScroll(".cta-action-card", { x: 36, y: 0, duration: 0.75 });

            revealOnScroll(".contact-heading", { y: 28 });
            revealOnScroll(".contact-card-main", { y: 34, duration: 0.75 });
            revealOnScroll(".contact-info-row, .contact-map-wrap, .contact-location-bar", { y: 24, stagger: 0.07 });
        });

        return () => mm.revert();
    }, { scope: scopeRef });

    return null;
};

export default HomeGsapMotion;
