import { useState, useEffect, useRef } from "react";

/**
 * HOOK TÙY CHỈNH: useCountUp
 * Tạo hiệu ứng số đếm tăng dần khi phần tử xuất hiện trong khung hình
 */
export const useCountUp = (end: number, duration: number = 2000) => {
    const [count, setCount] = useState(0);
    const [started, setStarted] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) setStarted(true);
        }, { threshold: 0.5 });

        if (elementRef.current) observer.observe(elementRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!started) return;
        let startTimestamp: any = null;
        const step = (timestamp: any) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }, [started, end, duration]);

    return { count, elementRef };
};
