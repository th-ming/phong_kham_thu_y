import { useState, useEffect } from 'react';
import { toast } from './Toast';

/**
 * Component VoiceInput – cung cấp nút bấm thu âm giọng nói.
 * Sử dụng Web Speech API gốc của trình duyệt để chuyển đổi giọng nói thành văn bản
 * và chuyển văn bản đã nhận dạng cho ChatBot qua callback onSend.
 * Nếu trình duyệt không hỗ trợ SpeechRecognition, sẽ hiển thị thông báo hướng dẫn.
 */
export const VoiceInput = ({ onSend }: { onSend: (text: string) => void }) => {
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Khởi tạo tính năng nhận dạng giọng nói nếu trình duyệt có hỗ trợ
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'vi-VN';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.trim();
        toast.success('🎤 Nhận dạng thành công');
        onSend(transcript);
      };
      rec.onerror = (e: any) => {
        toast.error('❌ Lỗi nhận dạng giọng nói');
        console.error(e);
        setListening(false);
      };
      rec.onend = () => setListening(false);
      setRecognition(rec);
    }
  }, [onSend]);

  const toggleListening = () => {
    if (!recognition) {
      // Giải pháp dự phòng thu âm và gửi về Server (chưa được cài đặt ở bản này)
      toast.error('Trình duyệt không hỗ trợ SpeechRecognition, vui lòng bật microphone và gửi file âm thanh');
      return;
    }
    if (listening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
        setListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <button data-ai-id="button-voiceinput-2spt"
      type="button"
      className={`voice-btn ${listening ? 'listening' : ''}`}
      onClick={toggleListening}
      title={listening ? 'Nhấn để dừng' : 'Nhấn để nói'}
    >
      {listening ? '🔴 Đang nghe...' : '🎙️'}
    </button>
  );
};
