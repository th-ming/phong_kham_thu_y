export const isUnreliableSpeechRecognitionBrowser = (): boolean =>
    /\bOPR\/|Opera/i.test(navigator.userAgent);

export const getSpeechRecognitionConstructor = (): (new () => any) | null => {
    return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
};

export const OPERA_VOICE_HINT =
    "Bạn đang dùng Opera: micro bật được nhưng trình duyệt này không chuyển giọng nói thành chữ ổn định. Hãy mở cùng trang bằng Chrome hoặc Microsoft Edge, bấm micro và nói lại.";
