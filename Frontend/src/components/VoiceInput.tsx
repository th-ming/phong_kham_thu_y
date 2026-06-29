import { toastError } from '@utils/toastHelpers';
import { useState, useRef } from 'react';
import { toast } from './Toast';
import axiosInstance from '@services/axios';

// * * Component VoiceInput – Sử dụng Groq Whisper AI qua MediaRecorder để nhận dạng siêu chuẩn.
export const VoiceInput = ({ onSend, onTyping: _onTyping }: { onSend: (text: string) => void, onTyping?: (text: string) => void }) => {
  const [listening, setListening] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
              noiseSuppression: true,
              autoGainControl: true,
              echoCancellation: true,
              channelCount: 1
          }
      });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.webm');
        toast.info('Đang gửi âm thanh cho Whisper AI...');
        try {
          const response = await axiosInstance.post('/api/chat/transcribe', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (response.data.text) {
              toast.success('🎤 Nhận dạng thành công');
              onSend(response.data.text);
          } else {
              toastError('AI không nghe rõ âm thanh.');
          }
        } catch (error) {
            toastError('Lỗi khi dịch giọng nói.');
        }
      };

      mediaRecorder.start();
      setListening(true);
    } catch (error) {
      toastError('Không mở được micro.');
    }
  };

  const toggleListening = () => {
    if (listening) {
      mediaRecorderRef.current?.stop();
      setListening(false);
    } else {
      startRecording();
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
