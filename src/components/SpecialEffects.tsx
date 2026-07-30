import React, { useState, useEffect, useRef } from "react";

export const ScrollToTop: React.FC = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      setShow(window.scrollY > scrollableHeight * 0.8);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      id="scrollTopBtn"
      className="show"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <span className="material-symbols-outlined">arrow_upward</span>
    </button>
  );
};


export const MemeCat: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoAvailable, setVideoAvailable] = useState(true);

  useEffect(() => {
    if (!videoAvailable) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    let animationFrameId: number;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const processFrame = () => {
      if (video.paused || video.ended) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frame.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (g > 100 && g > r * 1.3 && g > b * 1.3) data[i + 3] = 0;
      }
      ctx.putImageData(frame, 0, 0);
      animationFrameId = requestAnimationFrame(processFrame);
    };

    const handleLoadedData = () => {
      canvas.width = video.videoWidth || 300;
      canvas.height = video.videoHeight || 300;
      void video.play();
      processFrame();
    };

    video.addEventListener("play", processFrame);
    video.addEventListener("loadeddata", handleLoadedData);
    const handleMouseEnter = () => {
      canvas.getAnimations().forEach((animation) => {
        animation.playbackRate = 0.15;
      });
      video.playbackRate = 0.5;
    };
    const handleMouseLeave = () => {
      canvas.getAnimations().forEach((animation) => {
        animation.playbackRate = 1;
      });
      video.playbackRate = 1;
    };
    canvas.addEventListener("mouseenter", handleMouseEnter);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      video.removeEventListener("play", processFrame);
      video.removeEventListener("loadeddata", handleLoadedData);
      canvas.removeEventListener("mouseenter", handleMouseEnter);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [videoAvailable]);

  if (!videoAvailable) return null;

  return (
    <>
      <video
        ref={videoRef}
        src="/img/memerun.mp4"
        autoPlay
        loop
        muted
        playsInline
        onError={() => setVideoAvailable(false)}
        style={{ display: "none" }}
      />
      <canvas ref={canvasRef} id="meme-canvas" width={300} height={300} />
    </>
  );
};


export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [messages, setMessages] = useState<{ type: string; text: string; image?: string; video?: string }[]>([
    {
      type: "ai",
      text: "Chào bạn! 🐾 Tôi là Trợ lý sức khỏe của Rexi. Rất vui được đồng hành cùng sức khỏe của bé. Đừng ngần ngại chia sẻ hình ảnh hoặc triệu chứng để tôi hỗ trợ ngay nhé!",
    },
  ]);
  const [input, setInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll xuong cuoi khi co tin nhan moi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const cycle = () => {
      setShowTooltip(true);
      timer = setTimeout(() => {
        setShowTooltip(false);
        timer = setTimeout(cycle, 11000); // Hide for 11s (total 15s cycle)
      }, 4000); // Show for 4s
    };
    
    timer = setTimeout(cycle, 5000); // Initial delay
    return () => clearTimeout(timer);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("File selected:", file?.name, "Size:", file?.size, "Type:", file?.type);
    if (file) {
      if (file.type.startsWith('video/')) {
        // Giới hạn video 30MB (khoảng 20 giây)
        if (file.size > 30 * 1024 * 1024) {
          alert("Video quá lớn. Vui lòng chọn video dưới 30MB (khoảng 20 giây).");
          e.target.value = "";
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (typeof result === "string" && result.includes(",")) {
            setVideo(result);
            setImage(null);
          } else {
            alert("Lỗi: Không thể chuyển đổi video.");
          }
          e.target.value = "";
        };
        reader.readAsDataURL(file);
        return;
      }

      // Kiểm tra định dạng ảnh
      if (!file.type.startsWith('image/')) {
        alert("Vui lòng chọn một file hình ảnh hoặc video hợp lệ (jpg, png, mp4...).");
        e.target.value = "";
        return;
      }
      
      // Bỏ giới hạn kích thước theo yêu cầu
      const reader = new FileReader();
      reader.onload = () => {
        console.log("FileReader loaded success");
        const result = reader.result;
        if (typeof result === "string" && result.includes(",")) {
          // Nén và resize ảnh trước khi gửi để AI phân tích chuẩn hơn
          const img = new Image();
          img.onload = () => {
            console.log("Image object loaded, starting resize...");
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxSide = 1024; // Kích thước tiêu chuẩn cho AI Vision

            if (width > maxSide || height > maxSide) {
              if (width > height) {
                height = (height * maxSide) / width;
                width = maxSide;
              } else {
                width = (width * maxSide) / height;
                height = maxSide;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            // Xuất ra jpeg chất lượng 0.7 để cân bằng giữa độ nét và dung lượng
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
            setImage(compressedBase64);
            setVideo(null);
          };
          img.src = result;
        } else {
          alert("Lỗi: Không thể chuyển đổi ảnh sang định dạng xử lý.");
        }
        e.target.value = ""; 
      };
      
      reader.onerror = (err) => {
        console.error("FileReader Error:", err);
        alert("Lỗi trình duyệt: Không thể đọc được file này. Hãy thử ảnh/video khác hoặc dùng trình duyệt khác.");
        e.target.value = "";
      };
      
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          console.log("Image pasted:", file.name);
          const event = { target: { files: [file] } } as any;
          handleImageChange(event);
        }
      }
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !image && !video) || loading) return;
    const userMsg = input.trim();
    const userImg = image;
    const userVid = video;
    const displayText = userMsg || (userImg ? "Phân tích ảnh này giúp tôi." : (userVid ? "Phân tích video này giúp tôi." : ""));
    setMessages((prev) => [...prev, { type: "user", text: displayText, image: userImg || undefined, video: userVid || undefined }]);
    setInput("");
    setImage(null);
    setVideo(null);
    setLoading(true);

    try {
      const apiHistory = messages.map(m => ({
        role: m.type === "ai" ? "assistant" : "user",
        content: m.text,
        image: m.image,
        video: m.video
      }));
      apiHistory.push({ role: "user", content: displayText, image: userImg || undefined, video: userVid || undefined });

      const response = await fetch("http://localhost:8081/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiHistory),
      });
      const responseText = await response.text();
      let aiText = responseText;
      // Try to parse as JSON in case it ever returns JSON
      try {
        const parsed = JSON.parse(responseText);
        aiText = parsed.reply || parsed.message || responseText;
      } catch { /* Response is plain text, use as-is */ }
      setMessages((prev) => [
        ...prev,
        { type: "ai", text: aiText || "Xin lỗi, máy chủ bận." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { type: "ai", text: "Không thể kết nối với máy chủ AI." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes emergencyBlink {
            0% { background-color: #ef4444; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); color: white; }
            50% { background-color: #ffcccc; box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); color: #ef4444; }
            100% { background-color: #ef4444; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); color: white; }
          }
          .emergency-blink {
            animation: emergencyBlink 1s infinite;
          }
          .btn-chat-book {
            transition: all 0.2s ease;
          }
          .btn-chat-book:hover {
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 6px 16px rgba(15, 157, 138, 0.4) !important;
          }
          @keyframes shake {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-10deg); }
            75% { transform: rotate(10deg); }
          }
          .image-attached {
            animation: shake 0.5s infinite;
            color: #f59e0b !important;
          }
          @keyframes pulse-teal {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(15, 157, 138, 0.7); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(15, 157, 138, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(15, 157, 138, 0); }
          }
          .chat-pulse {
            animation: pulse-teal 2s infinite;
          }
        `}
      </style>
      <div
        id="chatTooltip"
        style={{
          opacity: showTooltip && !isOpen ? 1 : 0,
          transform:
            showTooltip && !isOpen ? "translateY(0)" : "translateY(15px)",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ color: "var(--teal)" }}
        >
          waving_hand
        </span>
        Tư vấn sức khỏe ngay!
      </div>
      <button
        id="chatBtn"
        className="chat-pulse"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, var(--teal), #12b4a1)',
          boxShadow: '0 4px 15px rgba(15, 157, 138, 0.4)',
          border: 'none',
          cursor: 'pointer'
        }}
        onClick={() => {
          setIsOpen(!isOpen);
          setShowTooltip(false);
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>support_agent</span>
      </button>
      <div id="chatWindow" style={{ display: isOpen ? "flex" : "none" }}>
        <div
          style={{
            background: "var(--teal)",
            color: "white",
            padding: "16px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontWeight: 800 }}>Trợ lý sức khỏe - Rexi</span>
          <span
            className="material-symbols-outlined"
            style={{ cursor: "pointer" }}
            onClick={() => setIsOpen(false)}
          >
            close
          </span>
        </div>
        <div
          style={{
            flex: 1,
            padding: "16px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            background: "var(--gray-50)",
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.type === "ai" ? "chat-msg-ai" : "chat-msg-user"}
            >
              {m.image && (
                <img 
                  src={`data:image/jpeg;base64,${m.image}`} 
                  alt="Pet" 
                  style={{ width: '100%', borderRadius: '12px', marginBottom: '8px', display: 'block' }} 
                />
              )}
              {m.video && (
                <video 
                  src={m.video} 
                  controls
                  style={{ width: '100%', borderRadius: '12px', marginBottom: '8px', display: 'block', maxHeight: '200px' }} 
                />
              )}
              {(() => {
                if (m.type === "user") return m.text;
                
                // Chuẩn hoá Unicode và dùng Regex cực mạnh để bắt mọi trường hợp AI gõ sai (khoảng trắng, thiếu dấu)
                const normalizedText = m.text.normalize("NFC");
                const parts = normalizedText.split(/\[\s*LINK\s*(?:ĐẶT|DAT|Đ.T|D\s*A\s*T)\s*(?:LỊCH|LICH|L.CH|L\s*I\s*C\s*H)\s*\]/giu);
                return (
                  <>
                    {parts.map((part, index) => {
                      const mapParts = part.split(/\[\s*LINK\s*(?:BẢN|BAN|B.N|B\s*A\s*N)\s*(?:ĐỒ|DO|Đ.|D\s*O)\s*\]/giu);
                      return (
                        <React.Fragment key={index}>
                          {mapParts.map((mPart, mIdx) => {
                            // Dùng Regex để tách "KHẨN CẤP" không phân biệt hoa thường
                            const subParts = mPart.split(/(KHẨN CẤP)/i);
                            return (
                              <React.Fragment key={mIdx}>
                                {subParts.map((sub, subIdx) => (
                                  <React.Fragment key={subIdx}>
                                    {sub.toUpperCase() === "KHẨN CẤP" ? (
                                      <b className="emergency-blink" style={{ padding: "2px 8px", borderRadius: "4px", margin: "0 4px", display: "inline-block", fontWeight: "900", letterSpacing: "0.5px" }}>
                                        KHẨN CẤP
                                      </b>
                                    ) : (
                                      sub
                                    )}
                                  </React.Fragment>
                                ))}
                                {mIdx < mapParts.length - 1 && (
                                  <div style={{ marginTop: "12px", marginBottom: "4px", width: "100%" }}>
                                    <button 
                                      onClick={() => window.open('https://www.google.com/maps/dir//68+Ngô+Xuân+Quảng,+Trâu+Quỳ,+Gia+Lâm,+Hà+Nội', '_blank')}
                                      className="btn-chat-book" 
                                      style={{ display: "flex", justifyContent: "center", alignItems: "center", background: "white", color: "var(--teal)", border: "2px solid var(--teal)", padding: "10px 16px", borderRadius: "20px", fontSize: "14px", fontWeight: "900", cursor: "pointer", width: "100%" }}
                                    >
                                      <span className="material-symbols-outlined" style={{ fontSize: "18px", marginRight: "6px" }}>location_on</span>
                                      XEM VỊ TRÍ PHÒNG KHÁM
                                    </button>
                                  </div>
                                )}
                              </React.Fragment>
                            );
                          })}
                          {index < parts.length - 1 && (
                            <div style={{ marginTop: "12px", marginBottom: "4px", width: "100%" }}>
                              {localStorage.getItem("token") ? (
                                <a href="/khach-hang/dat-lich-hen" className="btn-chat-book" style={{ display: "flex", justifyContent: "center", alignItems: "center", background: "var(--teal)", color: "white", padding: "12px 16px", borderRadius: "20px", textDecoration: "none", fontSize: "14px", fontWeight: "900", boxShadow: "0 4px 6px rgba(15, 157, 138, 0.25)" }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: "18px", marginRight: "6px" }}>calendar_today</span>
                                  ĐẶT LỊCH NGAY
                                </a>
                              ) : (
                                <a href="/dang-nhap" className="btn-chat-book" style={{ display: "flex", justifyContent: "center", alignItems: "center", background: "var(--teal)", color: "white", padding: "12px 16px", borderRadius: "20px", textDecoration: "none", fontSize: "14px", fontWeight: "900", boxShadow: "0 4px 6px rgba(15, 157, 138, 0.25)" }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: "18px", marginRight: "6px" }}>calendar_today</span>
                                  ĐẶT LỊCH NGAY
                                </a>
                              )}
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </>
                );
              })()}
            </div>
          ))}
          {loading && (
            <div className="chat-msg-ai" style={{ width: 'fit-content', padding: '12px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', background: 'var(--teal)', borderRadius: '50%', animation: 'pulseChat 1.5s infinite ease-in-out' }}></div>
                <div style={{ width: '8px', height: '8px', background: 'var(--teal)', borderRadius: '50%', animation: 'pulseChat 1.5s infinite ease-in-out', animationDelay: '0.2s' }}></div>
                <div style={{ width: '8px', height: '8px', background: 'var(--teal)', borderRadius: '50%', animation: 'pulseChat 1.5s infinite ease-in-out', animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {image && (
          <div style={{ padding: "8px 16px", background: "white", borderTop: "1px solid var(--gray-200)", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ position: "relative", width: "40px", height: "40px" }}>
              <img src={`data:image/jpeg;base64,${image}`} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }} />
              <button onClick={() => setImage(null)} style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ef4444", color: "white", borderRadius: "50%", border: "none", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "14px" }}>×</button>
            </div>
            <span style={{ fontSize: "12px", color: "var(--gray-500)", fontWeight: "600" }}>Ảnh đã sẵn sàng gửi...</span>
          </div>
        )}

        {video && (
          <div style={{ padding: "8px 16px", background: "white", borderTop: "1px solid var(--gray-200)", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ position: "relative", width: "40px", height: "40px", background: "#000", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span className="material-symbols-outlined" style={{ color: "white", fontSize: "20px" }}>movie</span>
              <button onClick={() => setVideo(null)} style={{ position: "absolute", top: "-6px", right: "-6px", background: "#ef4444", color: "white", borderRadius: "50%", border: "none", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "14px" }}>×</button>
            </div>
            <span style={{ fontSize: "12px", color: "var(--gray-500)", fontWeight: "600" }}>Video đã sẵn sàng gửi...</span>
          </div>
        )}

        <div
          style={{
            padding: "12px",
            borderTop: "1px solid var(--gray-200)",
            display: "flex",
            gap: "8px",
            alignItems: "center",
            background: "white"
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*,video/mp4,video/webm"
            style={{ display: "none" }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              background: "none", 
              border: "none", 
              color: (image || video) ? "#f59e0b" : "var(--teal)", 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              transition: "all 0.3s ease"
            }}
            title={(image || video) ? "Đã đính kèm file" : "Đính kèm ảnh/video"}
          >
            <span className={`material-symbols-outlined ${(image || video) ? 'image-attached' : ''}`}>
              {(image || video) ? 'check_circle' : 'attach_file'}
            </span>
          </button>
          <input
            className="form-input"
            value={input}
            placeholder="Nhập triệu chứng..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            onPaste={handlePaste}
            style={{ flex: 1 }}
          />
          <button className="chat-send-btn" onClick={handleSend} disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </>
  );
};
