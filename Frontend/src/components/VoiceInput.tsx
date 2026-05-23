import { useState, useEffect } from 'react';
import { toast } from './Toast';

/**
 * Component VoiceInput – cung cấp nút bấm thu âm giọng nói.
 * Sử dụng Web Speech API gốc của trình duyệt để chuyển đổi giọng nói thành văn bản
 * và chuyển văn bản đã nhận dạng cho ChatBot qua callback onSend.
 * Nếu trình duyệt không hỗ trợ SpeechRecognition, sẽ hiển thị thông báo hướng dẫn.
 */
export const VoiceInput = ({ onSend, onTyping }: { onSend: (text: string) => void, onTyping?: (text: string) => void }) => {
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Khởi tạo tính năng nhận dạng giọng nói nếu trình duyệt có hỗ trợ
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'vi-VN';
      rec.interimResults = true; // Hiện chữ ngay khi đang nói
      rec.maxAlternatives = 1;
      
      let silenceTimer: NodeJS.Timeout;
      let finalTranscriptAccumulated = '';

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
             finalTranscriptAccumulated += event.results[i][0].transcript;
          } else {
             interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const currentText = (finalTranscriptAccumulated + interimTranscript).trim();
        if (onTyping) onTyping(currentText);

        // Nếu người dùng im lặng 2.5 giây -> Tự động Send
        clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          rec.stop();
          if (currentText) {
             toast.success('🎤 Nhận dạng thành công');
             onSend(currentText);
             finalTranscriptAccumulated = '';
          }
        }, 2500);
      };
      
      rec.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
           toast.error('❌ Lỗi nhận dạng giọng nói');
           console.error(e);
        }
        setListening(false);
      };
      
      rec.onend = () => {
        setListening(false);
        clearTimeout(silenceTimer);
      };
      setRecognition(rec);
    }
  }, [onSend, onTyping]);

  const toggleListening = () => {
    if (!recognition) {
      toast.error('Trình duyệt không hỗ trợ SpeechRecognition, vui lòng gõ phím thay thế');
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
      className={`voice-btn ${listening ? 'listening pulse' : ''}`}
      onClick={toggleListening}
      title={listening ? 'Nhấn để dừng' : 'Nhấn để nói'}
    >
      {listening ? '🔴' : '🎙️'}
    </button>
  );
};
