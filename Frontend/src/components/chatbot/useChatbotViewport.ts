import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

export const useChatbotViewport = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= MOBILE_BREAKPOINT);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const updateViewportHeight = () => {
            const height = window.visualViewport?.height || window.innerHeight;
            document.documentElement.style.setProperty("--rexi-viewport-height", `${height}px`);
        };

        updateViewportHeight();
        window.addEventListener("resize", updateViewportHeight);
        window.visualViewport?.addEventListener("resize", updateViewportHeight);
        window.visualViewport?.addEventListener("scroll", updateViewportHeight);

        return () => {
            window.removeEventListener("resize", updateViewportHeight);
            window.visualViewport?.removeEventListener("resize", updateViewportHeight);
            window.visualViewport?.removeEventListener("scroll", updateViewportHeight);
        };
    }, []);

    return { isMobile };
};
