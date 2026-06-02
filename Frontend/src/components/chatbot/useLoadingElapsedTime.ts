import { useEffect, useState } from "react";

export const useLoadingElapsedTime = (isLoading: boolean) => {
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        let timer: number | undefined;

        if (isLoading) {
            setElapsedTime(0);
            timer = window.setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else {
            setElapsedTime(0);
        }

        return () => {
            if (timer) window.clearInterval(timer);
        };
    }, [isLoading]);

    return elapsedTime;
};
