import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "@services/axios";
import { useTheme } from "../contexts/ThemeContext";
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

    const [isOpen, setIsOpen] = useState(false);
    const [showCallout, setShowCallout] = useState(false);
    const [messages, setMessages] = useState<{ type: string, text: string, image?: string, video?: string, images?: string[], videos?: string[] }[]>([
        {
            type: "ai",
            text: userName
                ? `Sen **${userName}** ơi! 🐾 Trợ lý Rexi rất vui được gặp lại. Hôm nay bé yêu nhà mình có khỏe không dạ?`
                : "Xin chào Sen! 🐾 Rexi đây ạ. Rexi có thể giúp gì cho sức khỏe của bé nhà mình hôm nay?"
        }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<{ data: string, type: 'image' | 'video' }[]>([]);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const endRef = useRef<HTMLDivElement>(null);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);

    // BẢO MẬT: Tự động tắt Micro (ngừng nghe lén) nếu người dùng đóng cửa sổ Chat
    useEffect(() => {
        if (!isOpen && isListening && recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isOpen, isListening]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    useEffect(() => {
        let timeoutId: number;
        const triggerCallout = () => {
            setShowCallout(true);
            timeoutId = window.setTimeout(() => setShowCallout(false), 6000);
        };

        const initialTimer = window.setTimeout(triggerCallout, 3000);
        const interval = window.setInterval(triggerCallout, 25000);

        return () => {
            clearTimeout(initialTimer);
            clearTimeout(timeoutId);
            clearInterval(interval);
        };
    }, []);

    // KHỞI TẠO BỘ NHẬN DIỆN GIỌNG NÓI (SPEECH-TO-TEXT AI)
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'vi-VN'; // Ngôn ngữ Tiếng Việt

            recognitionRef.current.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev + (prev ? " " : "") + transcript);
            };

            recognitionRef.current.onerror = (event: any) => {
                console.error("Lỗi nhận diện giọng nói:", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, []);

    // TẮT ẢNH PHÓNG TO KHI BẤM PHÍM ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setZoomedImage(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const processFiles = (files: FileList | File[]) => {
        const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

        Array.from(files).forEach(file => {
            // BẢO MẬT: Kiểm tra Whitelist định dạng MIME (Ngăn chặn chèn mã độc qua file giả mạo)
            if (!validImageTypes.includes(file.type) && !validVideoTypes.includes(file.type)) {
                alert(`Bảo mật: Định dạng file ${file.name} không hợp lệ! Vui lòng chỉ tải lên Ảnh (JPG, PNG, GIF, WEBP) hoặc Video (MP4, WEBM, MOV).`);
                return;
            }

            if (file.size > 20 * 1024 * 1024) {
                alert(`Vui lòng chọn file ${file.name} dưới 20MB.`);
                return;
            }

            const isVideo = file.type.startsWith('video/');
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                setSelectedFiles(prev => [...prev, { data: base64, type: isVideo ? 'video' : 'image' }]);
            };
            reader.readAsDataURL(file);
        });

        if (fileInputRef.current) fileInputRef.current.value = '';
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
    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói (Khuyên dùng Google Chrome)!");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || input;
        if (!textToSend.trim() && selectedFiles.length === 0) return;
        if (loading) return;

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
            setSelectedFiles([]);
        }
        setLoading(true);

        try {
            const apiHistory = messages.map((msg, idx) => {
                const isRecent = idx >= messages.length - 2; // Chỉ giữ media ở 2 tin gần nhất
                return {
                    role: msg.type === "ai" ? "assistant" : "user",
                    content: msg.text,
                    ...(isRecent && msg.image && { image: msg.image.includes(',') ? msg.image.split(',')[1] : msg.image }),
                    ...(isRecent && msg.video && { video: msg.video }),
                    ...(isRecent && msg.images && msg.images.length > 0 && { image: msg.images[0].includes(',') ? msg.images[0].split(',')[1] : msg.images[0] }),
                    ...(isRecent && msg.videos && msg.videos.length > 0 && { video: msg.videos[0] })
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
                ...(payloadImage && { image: payloadImage }),
                ...(payloadVideo && { video: payloadVideo })
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

        const cleanText = text.replace("[EMERGENCY]", "").replace(/\[AUTO_BOOK:.*?\]/gi, "").replace(/\[ADD_PET:.*?\]/gi, "").trim();
        const parts = cleanText.split(/(\[LINK\s+ĐẶT\s+LỊCH.*?\]|\[LINK\s+BẢN\s+ĐỒ\]|\*\*.*?\*\*)/gi);

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
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(15, 157, 138, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(15, 157, 138, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(15, 157, 138, 0); }
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
      `}</style>

            <div id="chatCallout" className="glass-card animate-fade-in" style={{
                position: 'fixed', bottom: '110px', right: '30px', padding: '12px 20px',
                borderRadius: '24px', fontSize: '0.85rem', fontWeight: 800, color: '#0f9d8a',
                boxShadow: 'var(--shadow-lg)', zIndex: 1100, display: (isOpen || !showCallout) ? 'none' : 'flex',
                alignItems: 'center', gap: '10px', border: '2px solid var(--surface)', background: 'var(--surface)', backdropFilter: 'none' // Tắt blur khi thu nhỏ để nhẹ hơn

            }}>
                <div style={{ width: '10px', height: '10px', background: '#4ade80', borderRadius: '50%', animation: 'blink 1s infinite', boxShadow: '0 0 10px #4ade80' }}></div>
                Sen ơi, Rexi có thể giúp gì không?
            </div>

            <button id="chatBtn" onClick={() => setIsOpen(!isOpen)} style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1101, background: 'linear-gradient(135deg, #2dd4bf 0%, #0f9d8a 100%)', color: 'white', border: 'none', width: '64px', height: '64px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(15, 157, 138, 0.4)', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', animation: isOpen ? 'none' : 'chatPulseGlow 3s infinite ease-in-out' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px', animation: isOpen ? 'none' : 'chatIconWaggle 5s infinite' }}>{isOpen ? 'close' : 'pets'}</span>
            </button>

            {isOpen && (
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
                    <div style={{ background: '#0f9d8a', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '10px', height: '10px', background: '#4ade80', borderRadius: '50%', boxShadow: '0 0 10px #4ade80' }}></div>
                            <span style={{ fontWeight: 800, fontSize: '1rem' }}>Trợ lý Rexi</span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px', cursor: 'pointer' }}>remove</span>
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
                                    <button onClick={() => handleSend("Địa chỉ phòng khám Rexi")} style={{ whiteSpace: 'nowrap', padding: '8px 16px', borderRadius: '20px', border: 'none', background: '#8b5cf6', color: 'white', fontWeight: 700, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
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
                    {selectedFiles.length > 0 && (
                        <div style={{ padding: '10px 20px', background: 'var(--background)', borderTop: '1px solid var(--gray-200)', display: 'flex', gap: '10px', overflowX: 'auto' }}>
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
                        </div>
                    )}

                    {/* ô nhập tin nhắn chatbot */}
                    <div style={{ padding: '16px 20px', background: 'var(--surface)', borderTop: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', gap: '12px' }}>

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
                            style={{ background: 'none', border: 'none', color: isListening ? '#ef4444' : '#94a3b8', cursor: 'pointer', display: 'flex', padding: 0, animation: isListening ? 'blink 1s infinite' : 'none' }}
                            title="Nhập bằng giọng nói"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
                                {isListening ? 'mic' : 'mic_none'}
                            </span>
                        </button>

                        <input
                            type="text"
                            placeholder="Nhập triệu chứng của bé..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSend()}
                            maxLength={1000}
                            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', background: 'transparent' }}
                        />
                        <button onClick={() => handleSend()} disabled={!input.trim() && selectedFiles.length === 0} style={{ background: 'none', border: 'none', color: (!input.trim() && selectedFiles.length === 0) ? '#cbd5e1' : '#0f9d8a', cursor: (!input.trim() && selectedFiles.length === 0) ? 'not-allowed' : 'pointer', display: 'flex', padding: 0 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>send</span>
                        </button>
                    </div>
                </div>
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
