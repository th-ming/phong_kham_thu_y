import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "@services/axios";
import { useTheme } from "../contexts/ThemeContextV2";
import { getUserProfile } from "../utils/index";

/* component chatbot trợ lý rexi */
export const ChatBot: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // BƯỚC 1: LẤY THÔNG TIN KHÁCH HÀNG ĐÃ ĐĂNG NHẬP
    // Tìm tên người dùng từ localStorage để chào hỏi cá nhân
    // Ưu tiên: ten_khach_hang (tên pet) > ho_ten (tên chủ) > ten_dang_nhap (username)

    // Hàm xóa số thứ tự ở đầu tên (Ví dụ: "1. Nguyễn Văn A" -> "Nguyễn Văn A")
    const cleanName = (name: string) => name ? name.replace(/^\d+\.\s*/, '').trim() : '';

    const user = getUserProfile();
    const rawName = user?.ten_khach_hang || user?.ho_ten || user?.ten_dang_nhap || "";
    const userName = cleanName(rawName);

    // ĐẶC BIỆT: Phân quyền Trợ lý Rexi cực kỳ linh hoạt (Báo cáo, Quản trị, Nhân sự)
    const userRole = user?.loai_tai_khoan || user?.id_vai_tro || "";
    const isClinicStaff = userRole && userRole !== "CUSTOMER" && userRole !== "KHACH_HANG" && userRole !== "VT-5";
    const userRoleName = user?.ten_vai_tro || 
        (userRole.includes("ADMIN") || userRole === "VT-1" ? "Quản trị" : 
         userRole.includes("QL") || userRole === "VT-6" ? "Quản lý" : 
         userRole.includes("BS") || userRole === "VT-2" ? "Bác sĩ" : 
         userRole.includes("KT") || userRole === "VT-4" ? "Kế toán" : 
         userRole.includes("TT") || userRole === "VT-7" ? "Tiếp tân" : 
         userRole.includes("YT") || userRole === "VT-8" ? "Y tá" : 
         userRole.includes("STAFF") || userRole.includes("NV") || userRole === "VT-3" ? "Nhân viên" : "Nhân sự");

    // Tạo tên chào hỏi thông minh (Tránh lặp từ như "Bác sĩ BS. Hoàng Nam" hoặc "Quản lý Quản lý Rexi")
    const displayGreetingName = (userName.toLowerCase().includes(userRoleName.toLowerCase()) || 
                                 (userRoleName.toLowerCase() === 'bác sĩ' && userName.toLowerCase().startsWith('bs')))
        ? userName
        : `${userRoleName} ${userName}`;

    // CÂU CHÀO THÔNG MINH THEO GIỜ HỆ THỐNG
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 11) return "Chào buổi sáng";
        if (hour >= 11 && hour < 14) return "Chào buổi trưa";
        if (hour >= 14 && hour < 18) return "Chào buổi chiều";
        if (hour >= 18 && hour <= 23) return "Chào buổi tối";
        return "Chào cú đêm"; // Dành riêng cho các Sen thức khuya từ 0h - 5h sáng
    };
    const timeGreeting = getGreeting();

    const [isOpen, setIsOpen] = useState(false);
    const [showCallout, setShowCallout] = useState(false);
    const [calloutMessage, setCalloutMessage] = useState(isClinicStaff ? "Cần Rexi hỗ trợ tra cứu thông tin gì không ạ? 🐾" : "Sen ơi, Rexi có thể giúp gì không? 🐾");
    const [messages, setMessages] = useState<{ type: string, text: string, image?: string, video?: string, images?: string[], videos?: string[] }[]>(() => {
        try {
            const saved = sessionStorage.getItem("rexi_chat_history");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.length > 0) return parsed;
            }
        } catch (e) {
            console.error("Lỗi đọc lịch sử chat:", e);
        }
        return [
            {
                type: "ai",
                text: isClinicStaff
                    ? `${timeGreeting} **${displayGreetingName}**! 🐾 Trợ lý Rexi rất vui được đồng hành cùng bạn hôm nay. Bạn cần tôi hỗ trợ tra cứu thông tin hoặc thao tác tác vụ phòng khám nào không ạ?`
                    : userName
                        ? `${timeGreeting} Sen **${userName}**! 🐾 Trợ lý Rexi rất vui được gặp lại. Hôm nay bé yêu nhà mình có khỏe không dạ?`
                        : `${timeGreeting} Sen! 🐾 Rexi đây ạ. Rexi có thể giúp gì cho sức khỏe của bé nhà mình hôm nay?`
            }
        ];
    });
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isCompressing, setIsCompressing] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<{ data: string, type: 'image' | 'video' }[]>([]);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textInputRef = useRef<HTMLTextAreaElement>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);

    // Các Ref để phân tích âm lượng Micro thời gian thực (Audio Analyser)
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const waveBar1Ref = useRef<HTMLDivElement>(null);
    const waveBar2Ref = useRef<HTMLDivElement>(null);
    const waveBar3Ref = useRef<HTMLDivElement>(null);

    const stopAudioAnalysis = React.useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (audioContextRef.current) {
            // Bắt lỗi nếu context đã đóng sẵn
            audioContextRef.current.close().catch(() => { });
            audioContextRef.current = null;
        }
        // Trả thanh sóng về kích thước chuẩn khi tắt
        if (waveBar1Ref.current) { waveBar1Ref.current.style.height = '6px'; waveBar1Ref.current.style.opacity = '0.6'; }
        if (waveBar2Ref.current) { waveBar2Ref.current.style.height = '6px'; waveBar2Ref.current.style.opacity = '0.6'; }
        if (waveBar3Ref.current) { waveBar3Ref.current.style.height = '6px'; waveBar3Ref.current.style.opacity = '0.6'; }
    }, []);

    // BẢO MẬT: Tự động tắt Micro (ngừng nghe lén) nếu người dùng đóng cửa sổ Chat
    useEffect(() => {
        if (!isOpen && isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
            stopAudioAnalysis();
        }
    }, [isOpen, isListening, stopAudioAnalysis]);

    // LƯU LỊCH SỬ CHAT VÀO SESSION STORAGE (TỒN TẠI KHI F5)
    useEffect(() => {
        try {
            sessionStorage.setItem("rexi_chat_history", JSON.stringify(messages));
        } catch (e) {
            // Xử lý khi bộ nhớ đầy (thường do chứa quá nhiều ảnh/video Base64)
            // => Lọc bỏ dữ liệu media, chỉ lưu lại văn bản để không làm treo trang web
            try {
                const strippedMessages = messages.map(msg => ({
                    ...msg,
                    image: undefined,
                    images: undefined,
                    video: undefined,
                    videos: undefined,
                    text: msg.text || "[Đã gửi tệp đính kèm]"
                }));
                sessionStorage.setItem("rexi_chat_history", JSON.stringify(strippedMessages));
            } catch (err) {
                console.error("Không thể lưu lịch sử chat:", err);
            }
        }
    }, [messages]);

    useEffect(() => {
        // TỐI ƯU UX: Thêm setTimeout để chờ DOM render xong (đặc biệt khi có ảnh/video) rồi mới cuộn
        const timer = setTimeout(() => {
            endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }, 150);
        return () => clearTimeout(timer);
    }, [messages, loading]);

    useEffect(() => {
        const calloutMessages = isClinicStaff
            ? [
                "Cần Rexi hỗ trợ tra cứu thông tin gì không ạ? 🐾",
                "Hôm nay ca trực của bạn thế nào rồi? 🩺",
                "Cần kiểm tra phác đồ hay thông tin thuốc không ạ? 💊",
                "Rexi luôn sẵn sàng hỗ trợ bạn 24/7! 🕒",
                "Cần tra cứu hồ sơ bệnh án thú y không ạ? 🩺"
              ]
            : [
                "Sen ơi, Rexi có thể giúp gì không? 🐾",
                "Bé cưng nhà mình đến hạn tiêm phòng chưa Sen? 💉",
                "Bụng đói cồn cào... à nhầm, Sen cần tư vấn gì không? 🐟",
                "Đừng ngại nhắn tin cho Rexi nha, miễn phí 100% đó! ✨",
                "Mùa này nhiều ve rận lắm, Sen nhớ kiểm tra cho bé nhé! 🩺",
                "Trợ lý Rexi trực 24/7 chờ tin nhắn của Sen nè! 🕒",
                "Sen ơi, nhớ lịch sổ giun định kỳ cho Boss nha! 💊"
            ];

        let timeoutId: number;
        const triggerCallout = () => {
            const randomMsg = calloutMessages[Math.floor(Math.random() * calloutMessages.length)];
            setCalloutMessage(randomMsg);
            setShowCallout(true);
            timeoutId = window.setTimeout(() => setShowCallout(false), 6000);
        };

        const initialTimer = window.setTimeout(triggerCallout, 5000);
        const interval = window.setInterval(triggerCallout, 25000);

        return () => {
            clearTimeout(initialTimer);
            clearTimeout(timeoutId);
            clearInterval(interval);
        };
    }, [isClinicStaff]);

    // KHỞI TẠO BỘ NHẬN DIỆN GIỌNG NÓI (SPEECH-TO-TEXT AI)
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true; // TỐI ƯU: Thu âm liên tục nhiều câu
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'vi-VN'; // Ngôn ngữ Tiếng Việt

            recognitionRef.current.onresult = (event: any) => {
                // Lấy các câu nói mới nhất và nối vào văn bản hiện tại
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setInput(prev => prev + (prev && !prev.endsWith(" ") ? " " : "") + finalTranscript);
                }
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Lỗi nhận diện giọng nói:", event.error);
                setIsListening(false);
                stopAudioAnalysis();
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
                stopAudioAnalysis();
            };
        }
    }, [stopAudioAnalysis]);

    // BẢO MẬT: Giới hạn thời gian ghi âm tối đa 6 phút (360,000ms) để tránh treo trình duyệt hoặc quên tắt Micro
    useEffect(() => {
        let timeoutId: number;
        let intervalId: number;
        if (isListening) {
            setRecordingTime(0); // Bắt đầu đếm từ 0 khi bật Mic
            intervalId = window.setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

            timeoutId = window.setTimeout(() => {
                if (recognitionRef.current) {
                    recognitionRef.current.stop();
                }
                setIsListening(false);
                stopAudioAnalysis();
                alert("Đã đạt giới hạn ghi âm liên tục (Tối đa 6 phút). Micro đã được tự động tắt để bảo vệ quyền riêng tư.");
            }, 6 * 60 * 1000); // 6 phút
        } else {
            setRecordingTime(0); // Reset khi Mic tắt
        }
        return () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
        };
    }, [isListening, stopAudioAnalysis]);

    // TẮT ẢNH PHÓNG TO KHI BẤM PHÍM ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setZoomedImage(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const processFiles = async (files: FileList | File[]) => {
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

        const filesToProcess = Array.from(files).filter(file => {
            if (!validImageTypes.includes(file.type) && !validVideoTypes.includes(file.type)) {
                alert(`Bảo mật: Định dạng file ${file.name} không hợp lệ! Vui lòng chỉ tải lên Ảnh (JPG, PNG, GIF, WEBP) hoặc Video (MP4, WEBM, MOV).`);
                return false;
            }
            if (file.size > 50 * 1024 * 1024) {
                alert(`Vui lòng chọn file ${file.name} dưới 50MB.`);
                return false;
            }
            return true;
        });

        if (filesToProcess.length === 0) return;

        setIsCompressing(true);

        try {
            const processedFiles = await Promise.all(filesToProcess.map(file => {
                return new Promise<{ data: string, type: 'image' | 'video' }>((resolve) => {
                    const isVideo = file.type.startsWith('video/');
                    const reader = new FileReader();

                    if (isVideo) {
                        reader.onload = (event) => {
                            resolve({ data: event.target?.result as string, type: 'video' });
                        };
                        reader.readAsDataURL(file);
                    } else {
                        reader.onload = (event) => {
                            const img = new Image();
                            img.onload = () => {
                                const canvas = document.createElement('canvas');
                                let { width, height } = img;
                                const MAX_SIZE = 1024;

                                if (width > height && width > MAX_SIZE) {
                                    height = Math.round(height * (MAX_SIZE / width)); width = MAX_SIZE;
                                } else if (height > MAX_SIZE) {
                                    width = Math.round(width * (MAX_SIZE / height)); height = MAX_SIZE;
                                }

                                canvas.width = width; canvas.height = height;
                                canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);

                                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                                resolve({ data: compressedBase64, type: 'image' });
                            };
                            img.onerror = () => {
                                // Tránh treo Promise khi file ảnh bị lỗi, trả về base64 ban đầu để gửi trực tiếp
                                resolve({ data: event.target?.result as string, type: 'image' });
                            };
                            img.src = event.target?.result as string;
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }));

            setSelectedFiles(prev => [...prev, ...processedFiles]);
        } catch (error) {
            console.error("Lỗi nén ảnh:", error);
        } finally {
            setIsCompressing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        processFiles(e.target.files);
    };

    // --- DRAG AND DROP HANDLERS ---
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    // XỬ LÝ SỰ KIỆN BẤM NÚT MICRO
    const toggleListening = async () => {
        if (!recognitionRef.current) {
            alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói (Khuyên dùng Google Chrome)!");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
            stopAudioAnalysis();
        } else {
            recognitionRef.current.start();
            setIsListening(true);

            // Bắt đầu đọc dữ liệu âm thanh thật của người dùng
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaStreamRef.current = stream;

                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                const audioContext = new AudioContextClass();
                audioContextRef.current = audioContext;

                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                analyserRef.current = analyser;

                const source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);

                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                const updateVolume = () => {
                    if (!analyserRef.current) return;
                    analyserRef.current.getByteFrequencyData(dataArray);

                    // Lấy tần số Trầm (vol1), Trung (vol2), Cao (vol3)
                    const vol1 = dataArray[5] || 0;
                    const vol2 = dataArray[15] || 0;
                    const vol3 = dataArray[30] || 0;

                    const scale = 20 / 255; // Tỷ lệ max ~20px

                    // Trực tiếp thay đổi DOM để Animation 60fps mượt mà nhất (không qua React State)
                    if (waveBar1Ref.current) { waveBar1Ref.current.style.height = `${6 + vol1 * scale}px`; waveBar1Ref.current.style.opacity = `${0.5 + (vol1 / 255) * 0.5}`; }
                    if (waveBar2Ref.current) { waveBar2Ref.current.style.height = `${6 + vol2 * scale * 1.5}px`; waveBar2Ref.current.style.opacity = `${0.5 + (vol2 / 255) * 0.5}`; }
                    if (waveBar3Ref.current) { waveBar3Ref.current.style.height = `${6 + vol3 * scale * 1.2}px`; waveBar3Ref.current.style.opacity = `${0.5 + (vol3 / 255) * 0.5}`; }

                    animationFrameRef.current = requestAnimationFrame(updateVolume);
                };
                updateVolume();
            } catch (err) {
                console.error("Không thể lấy dữ liệu Audio:", err);
            }
        }
    };

    const handleSend = async (textOverride?: string) => {
        if (!user) {
            setMessages(prev => [...prev, { type: "ai", text: "Sen ơi, vui lòng **[ĐĂNG KÝ TÀI KHOẢN]** hoặc Đăng nhập để sử dụng tính năng Chat với Trợ lý Rexi nhé! 🐾" }]);
            return;
        }

        const textToSend = textOverride || input;
        if (!textToSend.trim() && selectedFiles.length === 0) return;
        if (loading || isCompressing) return;

        const currentFiles = [...selectedFiles];
        const images = currentFiles.filter(f => f.type === 'image').map(f => f.data);
        const videos = currentFiles.filter(f => f.type === 'video').map(f => f.data);

        setMessages(prev => [...prev, {
            type: "user",
            text: textToSend,
            ...(images.length > 0 && { images }),
            ...(videos.length > 0 && { videos })
        }]);

        if (!textOverride) {
            setInput("");
            // Tự động thu nhỏ chiều cao ô chat về mặc định sau khi gửi
            if (textInputRef.current) {
                textInputRef.current.style.height = 'auto';
            }
            // TỰ ĐỘNG FOCUS LẠI VÀO Ô NHẬP TEXT SAU KHI GỬI (KỂ CẢ CLICK HAY ENTER)
            setTimeout(() => textInputRef.current?.focus(), 10);
        }

        // FIX: Luôn xóa file đính kèm sau khi gửi để không bị lặp ảnh khi bấm nút Hành động nhanh (Quick Action)
        setSelectedFiles([]);
        setLoading(true);

        try {
            const apiHistory = messages.map((msg, idx) => {
                const isRecent = idx >= messages.length - 2; // Chỉ giữ media ở 2 tin gần nhất
                return {
                    role: msg.type === "ai" ? "assistant" : "user",
                    content: msg.text,
                    ...(isRecent && msg.images && msg.images.length > 0 && { images: msg.images.map(img => img.includes(',') ? img.split(',')[1] : img) }),
                    ...(isRecent && msg.videos && msg.videos.length > 0 && { videos: msg.videos })
                };
            });

            let payloadImage = undefined;
            let payloadVideo = undefined;
            if (currentFiles.length > 0) {
                const firstImage = currentFiles.find(f => f.type === 'image');
                const firstVideo = currentFiles.find(f => f.type === 'video');
                if (firstImage) payloadImage = firstImage.data.split(',')[1];
                if (firstVideo) payloadVideo = firstVideo.data;
            }

            apiHistory.push({
                role: "user",
                content: textToSend,
                ...(images.length > 0 && { images: images.map(img => img.includes(',') ? img.split(',')[1] : img) }),
                ...(videos.length > 0 && { videos: videos })
            });

            const response = await axiosInstance.post("/api/chat", apiHistory, {
                headers: {
                    "X-User-Name": userName // Gửi tên người dùng sang Backend để track ai đang chat
                }
            });
            const data = response.data;
            setMessages(prev => [...prev, { type: "ai", text: data.reply || "Tôi đang bận một chút, bạn thử lại sau nhé!" }]);
        } catch {
            setMessages(prev => [...prev, { type: "ai", text: "Kết nối gián đoạn. Đừng lo, tôi vẫn ở đây!" }]);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoBook = async (info: { date: string, time: string, petName: string, service: string, doctorName: string }) => {
        if (!user) {
            alert("Bạn cần đăng nhập để đặt lịch!");
            return;
        }
        setLoading(true);
        try {
            // Lấy ID Thú Cưng
            const petRes = await axiosInstance.get(`/api/thu-cung/khach/${user.id_khach_hang || user.id_tai_khoan || user.id}`, { params: { page: 0, size: 999 } });
            const petData = Array.isArray(petRes.data) ? petRes.data : (petRes.data?.content || petRes.data?.data || []);
            const petId = petData.find((p: any) => p.ten_thu_cung.toLowerCase().includes(info.petName.toLowerCase()))?.id_thu_cung;

            if (!petId) {
                alert(`Không tìm thấy bé nào tên "${info.petName}" trong hồ sơ của bạn. Vui lòng nhắn yêu cầu "Thêm thú cưng" trước nhé!`);
                setLoading(false);
                return;
            }

            // Lấy ID Dịch vụ
            const srvRes = await axiosInstance.get(`/api/dich-vu/active`);
            const srvData = Array.isArray(srvRes.data) ? srvRes.data : (srvRes.data?.content || srvRes.data?.data || []);
            const serviceId = srvData.find((s: any) => s.ten_dich_vu.toLowerCase().includes(info.service.toLowerCase()))?.id_dich_vu || 201; // Mặc định Khám Đa Khoa

            // Lấy ID Bác sĩ (Nếu khách có yêu cầu)
            let doctorId = null;
            if (info.doctorName && info.doctorName.toLowerCase() !== 'bất kỳ' && info.doctorName.toLowerCase() !== 'bat ky') {
                const docRes = await axiosInstance.get(`/api/bac-si`);
                const docData = Array.isArray(docRes.data) ? docRes.data : (docRes.data?.content || docRes.data?.data || []);
                const matchedDoctor = docData.find((d: any) => d.ho_ten.toLowerCase().includes(info.doctorName.toLowerCase().replace(/bs\.?\s*/g, '')));
                if (matchedDoctor) {
                    doctorId = matchedDoctor.id_nhan_vien;
                }
            }

            // KIỂM TRA GIỜ RẢNH (TRÁNH TRÙNG LỊCH)
            const timeToCheck = info.time.trim().substring(0, 5); // Đảm bảo lấy chuẩn định dạng HH:MM
            const checkRes = await axiosInstance.get(`/api/lich-hen/gio-ranh?ngay=${info.date}&id_dich_vu=${serviceId}&id_nhan_vien=${doctorId || ''}`);
            if (!checkRes.data.includes(timeToCheck)) {
                setMessages(prev => [...prev, { type: "ai", text: `Rất tiếc Sen ơi! 😿 Khung giờ **${timeToCheck}** ngày **${info.date}** bác sĩ ${doctorId ? `**${info.doctorName}**` : 'của phòng khám'} đã kín lịch hoặc không có ca trực. Sen đổi sang giờ khác giúp Rexi nhé!` }]);
                setLoading(false);
                return;
            }

            // Đẩy lên API Lịch hẹn
            await axiosInstance.post('/api/lich-hen', {
                id_khach_hang: user.id_khach_hang || user.id_tai_khoan || user.id,
                id_thu_cung: petId,
                id_dich_vu: serviceId,
                id_bac_si: doctorId,
                ngay_kham: info.date,
                gio_kham: info.time.length === 5 ? `${info.time}:00` : info.time,
                ly_do: info.service,
                trang_thai: 'CHO_XAC_NHAN',
                id_nguoi_dat: user.id_khach_hang || user.id_tai_khoan || user.id
            });

            setMessages(prev => [...prev, { type: "ai", text: `Tuyệt vời! Rexi đã chốt lịch thành công cho bé **${info.petName}** vào lúc **${info.time}** ngày **${info.date}**${doctorId ? ` với bác sĩ **${info.doctorName}**` : ''}. Sen có thể xem lại trong mục Lịch hẹn của tôi nhé! 🐾` }]);
        } catch (error: any) {
            let msg = "Lỗi khi tự động đặt lịch. Bạn vui lòng thao tác qua form Đặt Lịch thông thường nhé!";
            if (error.response?.data) {
                const d = error.response.data;
                if (typeof d === 'string' && d.trim() !== '' && !d.startsWith('<')) msg = d;
                else if (d.message && typeof d.message === 'string') msg = d.message;
                else if (d.errors && Array.isArray(d.errors)) {
                    msg = d.errors.map((x: any) => x.defaultMessage).filter(Boolean).join(', ');
                }
            }
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleAutoAddPet = async (info: { petName: string, species: string, breed: string, weight: string, gender: string }) => {
        if (!user) {
            alert("Bạn cần đăng nhập để thêm thú cưng!");
            return;
        }
        setLoading(true);
        try {
            const payload = {
                id_khach_hang: user.id_khach_hang || user.id_tai_khoan || user.id,
                ten_thu_cung: info.petName,
                loai: info.species,
                giong_loai: info.species,
                giong: info.breed,
                trong_luong: parseFloat(info.weight) || 0,
                can_nang: parseFloat(info.weight) || 0,
                gioi_tinh: info.gender,
                tuoi: 0
            };
            await axiosInstance.post('/api/thu-cung', payload);
            setMessages(prev => [...prev, { type: "ai", text: `Tuyệt vời! Rexi đã tạo xong hồ sơ cho bé **${info.petName}**. Sen có thể xem chi tiết ở trang Quản lý Thú cưng nhé! 🐶` }]);
        } catch (error: any) {
            let msg = "Lỗi khi tự động thêm thú cưng. Vui lòng thao tác thủ công qua trang Quản lý Thú cưng.";
            if (error.response?.data) {
                const d = error.response.data;
                if (typeof d === 'string' && d.trim() !== '' && !d.startsWith('<')) msg = d;
                else if (d.message && typeof d.message === 'string') msg = d.message;
                else if (d.errors && Array.isArray(d.errors)) {
                    msg = d.errors.map((x: any) => x.defaultMessage).filter(Boolean).join(', ');
                }
            }
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleFindNearest = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;
                // Mở Google Maps với query tìm "thú y" gần đây tại vị trí GPS hiện tại
                // Link format: @latitude,longitude,15z (15z = zoom level 15)
                window.open(`https://www.google.com/maps/search/thú+y+gần+đây/@${latitude},${longitude},15z`, '_blank');
            }, (error) => {
                console.error("Lỗi GPS:", error);
                // Nếu lỗi hoặc khách từ chối cấp quyền GPS, mở tìm kiếm chung không tọa độ
                window.open(`https://www.google.com/maps/search/thú+y+gần+đây/`, '_blank');
            });
        } else {
            // Trình duyệt cũ không hỗ trợ Geolocation, mở search chung
            window.open(`https://www.google.com/maps/search/thú+y+gần+đây/`, '_blank');
        }
    };

    // Hàm chuyển đổi số giây thành định dạng MM:SS
    const formatRecordingTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const s = (totalSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const renderText = (text: string) => {
        const isEmergency = text.includes("[EMERGENCY]");

        const autoBookMatch = text.match(/\[AUTO_BOOK:(.*?)\]/i);
        let bookingInfo = null;
        if (autoBookMatch && autoBookMatch[1]) {
            const parts = autoBookMatch[1].split('|');
            if (parts.length >= 4) {
                bookingInfo = {
                    date: parts[0].trim(),
                    time: parts[1].trim(),
                    petName: parts[2].trim(),
                    service: parts[3].trim(),
                    doctorName: parts[4] ? parts[4].trim() : 'Bất kỳ'
                };
            }
        }

        const addPetMatch = text.match(/\[ADD_PET:(.*?)\]/i);
        let addPetInfo = null;
        if (addPetMatch && addPetMatch[1]) {
            const parts = addPetMatch[1].split('|');
            if (parts.length >= 5) {
                addPetInfo = {
                    petName: parts[0].trim(),
                    species: parts[1].trim(),
                    breed: parts[2].trim(),
                    weight: parts[3].trim(),
                    gender: parts[4].trim()
                };
            }
        }

        const cleanText = text.replace("[EMERGENCY]", "").replace(/\[AUTO_BOOK:.*?\]/gi, "").replace(/\[ADD_PET:.*?\]/gi, "").replace("[ĐĂNG KÝ TÀI KHOẢN]", "").trim();
        const parts = cleanText.split(/(\[LINK\s+ĐẶT\s+LỊCH.*?\]|\[LINK\s+BẢN\s+ĐỒ\]|\[ĐĂNG\s+KÝ\s+TÀI\s+KHOẢN\]|\*\*.*?\*\*)/gi);

        return (
            <div style={{ lineHeight: '1.5', fontSize: '0.9rem' }}>
                {parts.map((part, i) => {
                    const upperPart = part.toUpperCase().replace(/\s+/g, ' ');

                    if (upperPart.includes("[LINK ĐẶT LỊCH")) {
                        return (
                            <Link key={i} to="/khach-hang/dat-lich-hen" onClick={() => setIsOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0f9d8a', color: 'white', padding: '8px 16px', borderRadius: '20px', textDecoration: 'none', fontWeight: 800, fontSize: '0.8rem', margin: '8px 0', boxShadow: '0 4px 10px rgba(15, 157, 138, 0.2)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_today</span>
                                Đặt lịch khám ngay
                            </Link>
                        );
                    }
                    if (upperPart === "[LINK BẢN ĐỒ]") {
                        return (
                            <a key={i} href="https://maps.google.com" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--gray-200)', color: 'var(--ink)', padding: '8px 16px', borderRadius: '20px', textDecoration: 'none', fontWeight: 800, fontSize: '0.8rem', margin: '8px 0' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>map</span>
                                Xem bản đồ
                            </a>
                        );
                    }
                    if (upperPart === "[ĐĂNG KÝ TÀI KHOẢN]") {
                        return (
                            <Link key={i} to="/login" onClick={() => setIsOpen(false)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--primary-gradient)', color: 'white', padding: '8px 16px', borderRadius: '20px', textDecoration: 'none', fontWeight: 800, fontSize: '0.8rem', margin: '8px 0', boxShadow: '0 4px 10px rgba(15, 157, 138, 0.2)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person_add</span>
                                Đăng ký / Đăng nhập ngay
                            </Link>
                        );
                    }
                    if (part.startsWith("**") && part.endsWith("**")) {
                        return <strong key={i} style={{ color: '#0f9d8a' }}>{part.slice(2, -2)}</strong>;
                    }
                    return <span key={i}>{part.split('\n').map((line, j, arr) => <React.Fragment key={j}>{line}{j < arr.length - 1 && <br />}</React.Fragment>)}</span>;
                })}

                {bookingInfo && (
                    <div style={{ marginTop: '12px', padding: '16px', background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: '16px' }}>
                        <div style={{ fontWeight: 900, color: 'var(--primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>event_available</span>
                            XÁC NHẬN ĐẶT LỊCH
                        </div>
                        <ul style={{ fontSize: '0.9rem', color: 'var(--ink)', marginBottom: '16px', paddingLeft: '20px', lineHeight: '1.6' }}>
                            <li>Bé cưng: <b style={{ color: 'var(--primary)' }}>{bookingInfo.petName}</b></li>
                            <li>Dịch vụ: <b>{bookingInfo.service}</b></li>
                            <li>Bác sĩ: <b>{bookingInfo.doctorName}</b></li>
                            <li>Thời gian: <b>{bookingInfo.time}</b> ngày <b>{bookingInfo.date}</b></li>
                        </ul>
                        <button onClick={() => handleAutoBook(bookingInfo!)} disabled={loading} style={{ width: '100%', background: 'var(--primary-gradient)', color: 'white', border: 'none', padding: '10px', borderRadius: '12px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(15, 157, 138, 0.3)', opacity: loading ? 0.7 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                            {loading ? (
                                <>
                                    <span className="icon-spin material-symbols-outlined" style={{ fontSize: '18px' }}>autorenew</span>
                                    Đang chốt lịch...
                                </>
                            ) : "Chốt lịch luôn! 🚀"}
                        </button>
                    </div>
                )}

                {addPetInfo && (
                    <div style={{ marginTop: '12px', padding: '16px', background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: '16px' }}>
                        <div style={{ fontWeight: 900, color: 'var(--primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>pets</span>
                            XÁC NHẬN THÊM THÚ CƯNG
                        </div>
                        <ul style={{ fontSize: '0.9rem', color: 'var(--ink)', marginBottom: '16px', paddingLeft: '20px', lineHeight: '1.6' }}>
                            <li>Tên bé: <b style={{ color: 'var(--primary)' }}>{addPetInfo.petName}</b></li>
                            <li>Loài/Giống: <b>{addPetInfo.species} - {addPetInfo.breed}</b></li>
                            <li>Cân nặng: <b>{addPetInfo.weight} kg</b></li>
                            <li>Giới tính: <b>{addPetInfo.gender}</b></li>
                        </ul>
                        <button onClick={() => handleAutoAddPet(addPetInfo!)} disabled={loading} style={{ width: '100%', background: 'var(--primary-gradient)', color: 'white', border: 'none', padding: '10px', borderRadius: '12px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 15px rgba(15, 157, 138, 0.3)', opacity: loading ? 0.7 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                            {loading ? (
                                <>
                                    <span className="icon-spin material-symbols-outlined" style={{ fontSize: '18px' }}>autorenew</span>
                                    Đang tạo hồ sơ...
                                </>
                            ) : "Tạo hồ sơ ngay! 🐶"}
                        </button>
                    </div>
                )}

                {isEmergency && (
                    <div style={{
                        marginTop: '16px', padding: '16px', borderRadius: '16px',
                        background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2', border: isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #fee2e2', color: isDark ? '#fca5a5' : '#b91c1c'
                    }}>
                        <div style={{ fontWeight: 900, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>emergency</span>
                            TÌNH TRẠNG CẤP CỨU!
                        </div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '12px', fontWeight: 600 }}>
                            Có vẻ bé đang gặp nguy hiểm. Hãy thực hiện sơ cứu như trên và đưa bé đến Rexi hoặc phòng khám gần nhất ngay lập tức!
                        </div>
                        <div style={{ display: 'grid', gap: '8px' }}>
                            <a href="https://maps.google.com" target="_blank" rel="noreferrer" style={{
                                textDecoration: 'none', background: '#b91c1c', color: 'white',
                                borderRadius: '12px', padding: '10px', fontWeight: 900, display: 'flex',
                                alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '0.8rem'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>location_on</span>
                                CHỈ ĐƯỜNG ĐẾN REXI
                            </a>
                            <button onClick={handleFindNearest} style={{
                                border: '2px solid #b91c1c', background: 'var(--surface)', color: '#b91c1c',
                                borderRadius: '12px', padding: '10px', fontWeight: 900, display: 'flex',
                                alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '0.8rem', cursor: 'pointer'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>explore</span>
                                TÌM PHÒNG KHÁM GẦN NHẤT (GPS)
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <style>{`
        @keyframes chatPulseGlow {
            0%, 100% { transform: scale(1); box-shadow: 0 10px 30px rgba(15, 157, 138, 0.4); }
            50% { transform: scale(1.08); box-shadow: 0 0 40px rgba(45, 212, 191, 0.6), 0 10px 40px rgba(15, 157, 138, 0.3); }
        }
        @keyframes chatIconWaggle {
          0%, 100% { transform: rotate(0deg); }
          10%, 20% { transform: rotate(-8deg); }
          15%, 25% { transform: rotate(8deg); }
          30% { transform: rotate(0deg); }
        }
        @keyframes chatMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .chat-marquee-wrapper {
          overflow: hidden;
          width: 100%;
          background: var(--surface);
          border-top: 1px solid var(--gray-200);
          position: relative;
        }
        .chat-marquee-content {
          display: flex;
          gap: 10px;
          padding: 12px 20px;
          width: max-content;
          animation: chatMarquee 40s linear infinite;
        }
        .chat-marquee-content:hover {
          animation-play-state: paused;
        }
        
        .wave-bar {
            width: 3px;
            background-color: #ef4444;
            border-radius: 3px;
            transition: height 0.05s ease-out, opacity 0.05s ease-out;
        }

        /* TỐI ƯU RESPONSIVE CHO ĐIỆN THOẠI NHỎ */
        @media (max-width: 768px) {
            #chatCallout {
                /* Ẩn bong bóng chat trên mobile để tránh che khuất nội dung trang web, mang lại giao diện premium sạch sẽ */
                display: none !important;
            }
            #chatBtn {
                right: 20px !important;
                bottom: 20px !important;
                width: 56px !important;
                height: 56px !important;
            }
            #chatWindow {
                right: 16px !important;
                bottom: 85px !important;
                width: calc(100vw - 32px) !important;
                height: calc(100vh - 120px) !important;
                max-height: 600px !important;
            }
            .chat-backdrop {
                display: block !important;
            }
        }

        /* LỚP NỀN MỜ PHÍA SAU CHATBOT KHI MỞ TRÊN MOBILE */
        .chat-backdrop {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            z-index: 1100;
        }
      `}</style>

            <div id="chatCallout" className="glass-card animate-fade-in" style={{
                position: 'fixed', bottom: '110px', right: '30px', padding: '12px 20px',
                borderRadius: '24px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)',
                boxShadow: 'var(--shadow-lg)', zIndex: 1100, display: (isOpen || !showCallout) ? 'none' : 'flex',
                alignItems: 'center', gap: '10px', border: '2px solid var(--surface)', background: 'var(--surface)', backdropFilter: 'none' // Tắt blur khi thu nhỏ để nhẹ hơn

            }}>
                <div style={{ width: '10px', height: '10px', background: '#4ade80', borderRadius: '50%', animation: 'blink 1s infinite', boxShadow: '0 0 10px #4ade80' }}></div>
                {calloutMessage}
            </div>

            <button
                id="chatBtn"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed', bottom: '30px', right: '30px', zIndex: 1101,
                    background: 'var(--chat-gradient)',
                    color: 'white', border: '1.5px solid rgba(255, 255, 255, 0.1)',
                    width: '64px', height: '64px', borderRadius: '50%', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 10px 40px var(--primary-light)',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    animation: isOpen ? 'none' : 'chatPulseGlow 4s infinite ease-in-out',
                    backdropFilter: 'blur(5px)'
                }}
            >
                <span className="material-symbols-outlined" style={{ fontSize: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))', animation: isOpen ? 'none' : 'chatIconWaggle 6s infinite ease-in-out' }}>
                    {isOpen ? 'close' : 'pets'}
                </span>
            </button>

            {isOpen && (
                <>
                    {/* NỀN MỜ CHO ĐIỆN THOẠI */}
                    <div className="chat-backdrop animate-fade-in" onClick={() => setIsOpen(false)}></div>

                    <div id="chatWindow" className="glass-card animate-fade-in"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        style={{ position: 'fixed', bottom: '100px', right: '30px', width: 'calc(100vw - 60px)', maxWidth: '400px', height: '580px', zIndex: 1101, borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                        {isDragging && (
                            <div style={{
                                position: 'absolute', inset: 0, background: 'rgba(15, 157, 138, 0.85)',
                                zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center',
                                justifyContent: 'center', color: 'white', backdropFilter: 'blur(6px)'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '80px', marginBottom: '16px', animation: 'float 2s ease-in-out infinite' }}>cloud_upload</span>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 950, marginBottom: '8px' }}>Thả file vào đây</h3>
                                <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Hỗ trợ Ảnh và Video (Tối đa 20MB)</p>
                            </div>
                        )}

                        {/* tiêu đề chatbot */}
                        <div style={{ background: 'var(--chat-gradient)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '10px', height: '10px', background: '#4ade80', borderRadius: '50%', boxShadow: '0 0 10px #4ade80' }}></div>
                                <span style={{ fontWeight: 800, fontSize: '1rem' }}>Trợ lý Rexi</span>
                            </div>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px', cursor: 'pointer' }} onClick={() => setIsOpen(false)}>remove</span>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px', cursor: 'pointer' }} onClick={() => setIsOpen(false)}>close</span>
                            </div>
                        </div>

                        {/* vùng hiển thị tin nhắn chatbot */}
                        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--background)' }}>
                            {messages.map((msg, idx) => (
                                <div key={idx} style={{
                                    alignSelf: msg.type === "user" ? "flex-end" : "flex-start",
                                    maxWidth: '85%',
                                    padding: '14px 18px',
                                    borderRadius: msg.type === "user" ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                    background: msg.type === "user" ? (isDark ? 'rgba(15, 157, 138, 0.2)' : '#ecfdf5') : 'var(--surface)',
                                    color: 'var(--ink)',
                                    boxShadow: 'var(--shadow-sm)',
                                    border: msg.type === "user" ? '1px solid var(--primary-light)' : '1px solid var(--gray-200)'

                                }}>
                                    {msg.image && <img src={msg.image} onClick={() => setZoomedImage(msg.image!)} alt="upload" style={{ width: '100%', borderRadius: '12px', marginBottom: msg.text ? '8px' : '0', cursor: 'zoom-in' }} />}
                                    {msg.images && msg.images.length > 0 && (
                                        <div style={{ display: 'grid', gridTemplateColumns: msg.images.length > 1 ? '1fr 1fr' : '1fr', gap: '8px', marginBottom: msg.text ? '8px' : '0' }}>
                                            {msg.images.map((img, i) => (
                                                <img key={i} src={img} onClick={() => setZoomedImage(img)} alt="upload" style={{ width: '100%', borderRadius: '12px', objectFit: 'cover', cursor: 'zoom-in' }} />
                                            ))}
                                        </div>
                                    )}
                                    {msg.video && <video src={msg.video} controls style={{ width: '100%', borderRadius: '12px', marginBottom: msg.text ? '8px' : '0' }} />}
                                    {msg.videos && msg.videos.length > 0 && (
                                        <div style={{ display: 'grid', gridTemplateColumns: msg.videos.length > 1 ? '1fr 1fr' : '1fr', gap: '8px', marginBottom: msg.text ? '8px' : '0' }}>
                                            {msg.videos.map((vid, i) => (
                                                <video key={i} src={vid} controls style={{ width: '100%', borderRadius: '12px', objectFit: 'cover' }} />
                                            ))}
                                        </div>
                                    )}
                                    {msg.text && renderText(msg.text)}
                                </div>
                            ))}
                            {loading && <div className="dot-pulse" style={{ marginLeft: '20px' }}></div>}
                            <div ref={endRef} />
                        </div>

                        {/* nút hành động nhanh chatbot */}
                        <div className="chat-marquee-wrapper" style={{ overflowX: 'auto' }}>
                            <div className="chat-marquee-content">
                                {[1, 2].map((loop) => (
                                    <React.Fragment key={loop}>
                                        <button onClick={() => handleSend("Cấp cứu hóc dị vật")} style={{ whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '20px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>emergency</span> Cấp cứu hóc dị vật
                                        </button>
                                        <button onClick={() => handleSend("Nhận biết dấu hiệu bệnh dại")} style={{ whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '20px', border: 'none', background: '#f97316', color: 'white', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>coronavirus</span> Nhận biết bệnh dại
                                        </button>
                                        <button onClick={() => handleSend("Lịch tiêm phòng cho chó/mèo")} style={{ whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '20px', border: 'none', background: '#10b981', color: 'white', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>vaccines</span> Lịch tiêm phòng
                                        </button>
                                        <button onClick={() => handleSend("Cách cầm máu khẩn cấp")} style={{ whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '20px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bloodtype</span> Cách cầm máu khẩn cấp
                                        </button>
                                        <button onClick={() => handleSend("Địa chỉ phòng khám Rexi")} style={{ whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '20px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>location_on</span> Địa chỉ phòng khám
                                        </button>
                                        <button onClick={() => handleSend("Đăng ký khám sức khỏe")} style={{ whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '20px', border: 'none', background: '#ec4899', color: 'white', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>calendar_month</span> Đăng ký khám bệnh
                                        </button>
                                        <button onClick={() => handleSend("Chăm sóc sau đại phẫu")} style={{ whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '20px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>healing</span> Chăm sóc sau phẫu thuật
                                        </button>
                                        <button onClick={() => handleSend("Thực đơn dinh dưỡng cho bé yêu")} style={{ whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '20px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>restaurant</span> Tư vấn dinh dưỡng
                                        </button>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        {/* xem trước ảnh video tải lên */}
                        {(selectedFiles.length > 0 || isCompressing) && (
                            <div style={{ padding: '10px 20px', background: 'var(--background)', borderTop: '1px solid var(--gray-200)', display: 'flex', gap: '10px', overflowX: 'auto', alignItems: 'center' }}>
                                {selectedFiles.map((file, idx) => (
                                    <div key={idx} style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
                                        {file.type === 'image' ? (
                                            <img src={file.data} alt="preview" style={{ height: '60px', width: '60px', borderRadius: '8px', border: '1px solid var(--gray-200)', objectFit: 'cover' }} />
                                        ) : (
                                            <video src={file.data} style={{ height: '60px', width: '60px', borderRadius: '8px', border: '1px solid var(--gray-200)', objectFit: 'cover' }} />
                                        )}
                                        <button onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'white', border: 'none', borderRadius: '50%', color: '#ef4444', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', padding: '2px' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                                        </button>
                                    </div>
                                ))}
                                {isCompressing && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--primary-light)', borderRadius: '12px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.8rem', height: '60px' }}>
                                        <span className="icon-spin material-symbols-outlined" style={{ fontSize: '20px' }}>autorenew</span>
                                        Đang nén ảnh...
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ô nhập tin nhắn chatbot */}
                        <div style={{ padding: '16px 20px', background: 'var(--surface)', borderTop: '1px solid var(--gray-200)', display: 'flex', alignItems: 'flex-end', gap: '12px' }}>

                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*,video/*"
                                multiple
                                style={{ display: 'none' }}
                                onChange={handleFileChange}
                            />
                            <button onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', padding: 0 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>add_circle</span>
                            </button>

                            {/* NÚT MICRO NHẬN DIỆN GIỌNG NÓI */}
                            <button
                                onClick={toggleListening}
                                style={{ background: 'none', border: 'none', color: isListening ? '#ef4444' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}
                                title="Nhập bằng giọng nói"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '28px', animation: isListening ? 'blink 1.5s infinite' : 'none' }}>
                                    {isListening ? 'mic' : 'mic_none'}
                                </span>
                                {isListening && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '28px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <div className="wave-bar" ref={waveBar1Ref} style={{ height: '6px' }}></div>
                                            <div className="wave-bar" ref={waveBar2Ref} style={{ height: '6px' }}></div>
                                            <div className="wave-bar" ref={waveBar3Ref} style={{ height: '6px' }}></div>
                                        </div>
                                        {/* Hiển thị bộ đếm giờ (tabular-nums giúp chữ số không bị giật lùi khi chạy) */}
                                        <span style={{
                                            fontSize: '0.85rem',
                                            fontWeight: 800,
                                            fontVariantNumeric: 'tabular-nums',
                                            color: recordingTime >= 300 ? '#ef4444' : 'inherit',
                                            animation: recordingTime >= 300 ? 'blink 1s infinite' : 'none'
                                        }}>
                                            {formatRecordingTime(recordingTime)}
                                        </span>
                                    </div>
                                )}
                            </button>

                            <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
                                <textarea
                                    ref={textInputRef}
                                    placeholder="Nhập triệu chứng của bé..."
                                    value={input}
                                    onChange={(e) => {
                                        setInput(e.target.value);
                                        e.target.style.height = 'auto'; // Cho phép co lại nếu người dùng xóa bớt chữ
                                        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`; // Giới hạn chiều cao tối đa 120px
                                    }}
                                    onKeyDown={(e) => {
                                        // Nhấn Enter để gửi, Shift + Enter để xuống dòng
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            if (!isCompressing) handleSend();
                                        }
                                    }}
                                    maxLength={1000}
                                    rows={1}
                                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', background: 'transparent', resize: 'none', overflowY: 'auto', padding: '4px 0', maxHeight: '120px', lineHeight: '1.5' }}
                                />
                                <div style={{ position: 'absolute', bottom: '-16px', right: '0', fontSize: '0.65rem', fontWeight: 700, color: input.length >= 1000 ? '#ef4444' : 'var(--gray-400)', pointerEvents: 'none' }}>
                                    {input.length}/1000
                                </div>
                            </div>
                            <button onClick={() => handleSend()} disabled={(!input.trim() && selectedFiles.length === 0) || isCompressing} style={{ background: 'none', border: 'none', color: ((!input.trim() && selectedFiles.length === 0) || isCompressing) ? '#cbd5e1' : 'var(--primary)', cursor: ((!input.trim() && selectedFiles.length === 0) || isCompressing) ? 'not-allowed' : 'pointer', display: 'flex', padding: 0 }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>send</span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            {zoomedImage && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999999, background: 'rgba(0,0,0,0.85)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
                        backdropFilter: 'blur(5px)'
                    }}
                    onClick={() => setZoomedImage(null)}
                >
                    <button
                        onClick={() => setZoomedImage(null)}
                        style={{
                            position: 'absolute', top: '20px', right: '20px',
                            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                            width: '40px', height: '40px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', cursor: 'pointer', zIndex: 99999999,
                            color: 'white', fontSize: '24px', backdropFilter: 'blur(5px)'
                        }}
                        title="Đóng"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                    <img
                        src={zoomedImage}
                        alt="Zoomed"
                        style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                    />
                </div>
            )}
        </>
    );
};
