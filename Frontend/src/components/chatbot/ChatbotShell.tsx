import React from "react";
import { useNavigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { BoTaiSuyNghi, BangQuaTrinhSuyNghi } from "@components/chatbot/BangTrangThaiChatbot";
import { BangDieuPhoiSwarm } from "@components/chatbot/BangDieuPhoiSwarm";
import { getDynamicLoadingText } from "@components/chatbot/NoiDungTaiChatbot";
import { isUnreliableSpeechRecognitionBrowser } from "@components/chatbot/TrinhDuyetGiongNoiChatbot";
import { GoiYNhanhChatbot } from "@components/chatbot/GoiYNhanhChatbot";
import { HienThiVanBanChatbot } from "@components/chatbot/HienThiVanBanChatbot";
import { BangCapCuuChatbot, HuyHieuLamSangChatbot } from "@components/chatbot/HuyHieuVaCapCuuChatbot";
import { MediaDinhKemChatbot } from "@components/chatbot/MediaDinhKemChatbot";
import { AnhPhongToChatbot } from "@components/chatbot/AnhPhongToChatbot";
import { BangHanhDongAgentChatbot } from "@components/chatbot/BangHanhDongAgentChatbot";
import { StyleChatbot } from "@components/chatbot/StyleChatbot";
import { NutNoiChatbot } from "@components/chatbot/NutNoiChatbot";
import { TabChatbot } from "@components/chatbot/TabChatbot";
import { LopKeoThaFileChatbot } from "@components/chatbot/LopKeoThaFileChatbot";
import { TieuDeChatbot } from "@components/chatbot/TieuDeChatbot";
import { PhieuDieuTriChatbot } from "@components/chatbot/PhieuDieuTriChatbot";
import { KetQuaTimKiemChatbot } from "@components/chatbot/KetQuaTimKiemChatbot";
import { CanhBaoDangNhapChatbot } from "@components/chatbot/CanhBaoDangNhapChatbot";

type ChatbotShellProps = {
    [key: string]: any;
};

export const ChatbotShell: React.FC<ChatbotShellProps> = (props) => {
    const navigate = useNavigate();
    const {
        activeTab, agentElapsedTime, agentEndRef, agentInput, agentLoading, agentMessages, agentSuggestions,
        calloutMessage, currentAgentAction, dismissChatBubbleForSession, dismissProactiveMessage,
        fileInputRef, handleAgentSend, handleDownloadTreatmentPdf, handleDragLeave, handleDragOver, handleDrop,
        handleFileChange, handlePasteFiles, handleResetChat, handleSend, handleShareCurrentLocation,
        input, isChatBubbleDismissed, isClinicalUser, isClinicStaff, isCompressing, isDark, isDragging,
        isListening, isMobile, isOpen, isUnreliableSpeechRecognitionBrowser: _ignoredBrowserCheck,
        isVoiceEnabled, lastAgentQuery, lastQuery, loading, messages, proactiveMessage, removeSelectedFile,
        selectedFiles, setActiveTab, setAgentInput, setInput, setIsOpen, setIsVoiceEnabled, setProactiveMessage, setZoomedImage, showCallout,
        shouldUseMatureCustomerTone, standardElapsedTime, standardEndRef, standardSuggestions, textInputRef,
        toggleListening, voiceLiveText, voiceMode, voiceStatus, waveBar1Ref, waveBar2Ref, waveBar3Ref, zoomedImage, isCustomerRoute, isAdminRoute
    } = props;
    const hasMobileBottomNav = isCustomerRoute || isAdminRoute;

    return (
        <>
            <StyleChatbot />

            {/* BÓNG CHÚ THÍCH FLOATING CALLOUT */}
            <div id="chatCallout" className="glass-card animate-fade-in" style={{
                position: 'fixed', bottom: '110px', right: '30px', padding: '12px 42px 12px 20px',
                borderRadius: '24px', fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)',
                boxShadow: 'var(--shadow-lg)', zIndex: 1100, display: (isChatBubbleDismissed || isOpen || !showCallout || proactiveMessage) ? 'none' : 'flex',
                alignItems: 'center', gap: '10px', border: '2px solid var(--surface)', background: 'var(--surface)'
            }}>
                <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', animation: 'blink 1s infinite', boxShadow: '0 0 10px #10b981' }}></div>
                {calloutMessage}
                <button
                    type="button"
                    aria-label="Ẩn bong bóng gợi ý chatbot"
                    title="Ẩn bong bóng gợi ý cho tới khi tải lại trang"
                    onClick={dismissChatBubbleForSession}
                    style={{
                        position: 'absolute',
                        top: '7px',
                        right: '8px',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'var(--gray-100)',
                        color: 'var(--gray-500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px', lineHeight: 1 }}>close</span>
                </button>
            </div>

            {/* BÓNG CHÁT CHỦ ĐỘNG GỢI Ý CỦA REXI (PROACTIVE NOTIFICATION BUBBLE) */}
            {proactiveMessage && !isOpen && !isChatBubbleDismissed && (
                <div className="glass-card animate-fade-in" style={{
                    position: 'fixed', bottom: '110px', right: '30px', padding: '20px',
                    borderRadius: '28px', fontSize: '0.88rem', fontWeight: 800, color: 'var(--ink)',
                    boxShadow: '0 20px 50px rgba(16, 185, 129, 0.25), var(--shadow-lg)', zIndex: 1100,
                    display: 'flex', flexDirection: 'column', gap: '12px', border: '2px solid var(--primary-light)',
                    background: 'var(--surface)', maxWidth: '340px',
                    paddingRight: '44px',
                    animation: 'chatPulseGlow 3s infinite ease-in-out'
                }}>
                    <button
                        type="button"
                        aria-label="Ẩn bong bóng gợi ý chatbot"
                        title="Ẩn bong bóng gợi ý cho tới khi tải lại trang"
                        onClick={dismissChatBubbleForSession}
                        style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'var(--gray-100)',
                            color: 'var(--gray-500)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0
                        }}
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', lineHeight: 1 }}>close</span>
                    </button>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '24px', animation: 'chatIconWaggle 3s infinite ease-in-out' }}>pets</span>
                        <div style={{ lineHeight: '1.5', color: 'var(--ink)' }}>{proactiveMessage.text}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <button onClick={dismissProactiveMessage} style={{
                            background: 'transparent', border: 'none', color: 'var(--gray-500)',
                            fontWeight: 800, cursor: 'pointer', padding: '6px 12px', fontSize: '0.78rem'
                        }}>{shouldUseMatureCustomerTone ? "Để sau" : "Lờ đi"}</button>
                        <button onClick={() => { proactiveMessage.action(); setProactiveMessage(null); setIsOpen(true); }} style={{
                            background: 'var(--primary-gradient)', border: 'none', color: 'white',
                            fontWeight: 800, cursor: 'pointer', padding: '8px 16px', borderRadius: '12px',
                            fontSize: '0.78rem', boxShadow: '0 4px 10px var(--primary-light)'
                        }}>{shouldUseMatureCustomerTone ? "Đồng ý, hỗ trợ tôi" : "Đồng ý giúp em! ✨"}</button>
                    </div>
                </div>
            )}

            {/* NÚT KÍCH HOẠT FLOATING CHAT DUY NHẤT */}
            <NutNoiChatbot
                isOpen={isOpen}
                isMobile={isMobile}
                activeTab={activeTab}
                hasMobileBottomNav={hasMobileBottomNav}
                isAdminRoute={isAdminRoute}
                onToggle={() => setIsOpen(!isOpen)}
            />

            {/* CỬA SỔ CHAT TÍCH HỢP PREMIUM TABS */}
            {isOpen && (
                <>
                    {/* Backdrop mờ hỗ trợ mobile & desktop (chủ đích của ) */}
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(3px)', zIndex: 1100 }} onClick={() => setIsOpen(false)}></div>

                    <div id="chatWindow" className="glass-card animate-fade-in"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        style={{
                            position: 'fixed',
                            bottom: isMobile
                                ? (hasMobileBottomNav ? '164px' : '80px')
                                : '110px',
                            right: isMobile ? '16px' : '30px',
                            width: isMobile ? 'calc(100vw - 32px)' : 'min(450px, calc(100vw - 60px))',
                            height: isMobile ? 'min(650px, calc(100vh - 110px))' : '600px',
                            zIndex: 1101,
                            borderRadius: isMobile ? '28px' : '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                            border: activeTab === 'agent' ? '2.5px solid rgba(244, 63, 94, 0.35)' : '2.5px solid rgba(16, 185, 129, 0.35)',
                            boxShadow: activeTab === 'agent' ? '0 20px 50px rgba(244, 63, 94, 0.2)' : '0 20px 50px rgba(16, 185, 129, 0.2)',
                            transition: 'all 0.4s ease',
                            minWidth: 0,
                            minHeight: 0
                        }}
                    >
                        {/* Drag Upload Overlay */}
                        <LopKeoThaFileChatbot isVisible={isDragging} />

                        {/* 1. TIÊU ĐỀ KHỚP MÀU DYNAMIC GIỮA HAI CHẾ ĐỘ */}
                        <TieuDeChatbot
                            activeTab={activeTab}
                            isMobile={isMobile}
                            isVoiceEnabled={isVoiceEnabled}
                            onToggleVoice={() => setIsVoiceEnabled(!isVoiceEnabled)}
                            onResetChat={handleResetChat}
                            onClose={() => setIsOpen(false)}
                        />

                        {/* 2. DYNAMIC GLASSMORPHIC TAB BAR SELECTOR */}
                        <TabChatbot
                            activeTab={activeTab}
                            isDark={isDark}
                            isMobile={isMobile}
                            onChangeTab={setActiveTab}
                        />

                        {/* 3. DYNAMIC TAB PANEL CONDITIONAL RENDERING */}
                        {activeTab === 'standard' ? (
                            // ==================== TAB 1: STANDARD CHATBOT ====================
                            <>
                                <div className="chat-message-scroll" style={{ flex: 1, minHeight: 0, minWidth: 0, padding: '20px', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--background)' }}>
                                    {messages.map((msg: any, idx: number) => (
                                        <div key={idx}
                                             className={msg.type === "user" ? "chat-message-user" : "chat-message-ai"}
                                             style={{ display: 'flex', flexDirection: 'column', alignSelf: msg.type === "user" ? "flex-end" : "flex-start", maxWidth: '85%', minWidth: 0 }}>
                                            <div
                                                style={{
                                                    padding: '12px 16px', borderRadius: msg.type === "user" ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                                    background: msg.type === "user" ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#e6f4ea') : 'var(--surface)',
                                                    color: 'var(--ink)', boxShadow: 'var(--shadow-sm)',
                                                    border: msg.type === "user" ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--gray-200)',
                                                    minWidth: 0,
                                                    maxWidth: '100%',
                                                    overflowWrap: 'anywhere'
                                                }}
                                            >
                                                {msg.images && msg.images.map((img: string, i: number) => (
                                                    <img alt="upload" key={i} src={img} onClick={() => setZoomedImage(img)} style={{ width: '100%', borderRadius: '12px', marginBottom: '8px', cursor: 'zoom-in', objectFit: 'cover' }} />
                                                ))}
                                                {msg.videos && msg.videos.map((vid: string, i: number) => (
                                                    <video key={i} src={vid} controls style={{ width: '100%', borderRadius: '12px', marginBottom: '8px' }} />
                                                ))}
                                                <HuyHieuLamSangChatbot msg={msg} isClinicalUser={isClinicalUser} isDark={isDark} />
                                                {msg.text && (msg.isHtml ? <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.text) }} /> : <HienThiVanBanChatbot text={msg.text} />)}

                                                {msg.swarmData && (
                                                    <BangDieuPhoiSwarm data={msg.swarmData} isDark={isDark} />
                                                )}

                                                <PhieuDieuTriChatbot treatmentData={msg.treatmentData} isDark={isDark} onDownload={handleDownloadTreatmentPdf} />

                                                {msg.agentHandoff && (
                                                    <button
                                                        data-ai-id="button-chatbot-agent-handoff"
                                                        onClick={() => {
                                                            setActiveTab("agent");
                                                            setAgentInput("");
                                                            setTimeout(() => handleAgentSend(msg.agentHandoff.prompt), 180);
                                                        }}
                                                        style={{
                                                            marginTop: '12px',
                                                            width: '100%',
                                                            border: '1px solid rgba(244, 63, 94, 0.55)',
                                                            background: isDark ? 'rgba(244, 63, 94, 0.16)' : 'rgba(255, 241, 242, 0.95)',
                                                            color: isDark ? '#fb7185' : '#be123c',
                                                            borderRadius: '14px',
                                                            padding: '10px 12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '8px',
                                                            fontWeight: 900,
                                                            cursor: 'pointer',
                                                            boxShadow: 'var(--shadow-sm)'
                                                        }}
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>smart_toy</span>
                                                        {msg.agentHandoff.label}
                                                    </button>
                                                )}

                                                    {msg.suggestedNavigation && (
                                                        <button
                                                            data-ai-id="button-chatbot-suggested-nav"
                                                            onClick={() => navigate(msg.suggestedNavigation.path)}
                                                            style={{
                                                                marginTop: '12px',
                                                                width: '100%',
                                                                border: '1px solid rgba(16, 185, 129, 0.35)',
                                                                background: isDark ? 'rgba(16,185,129,0.08)' : '#e6f4ea',
                                                                color: isDark ? '#10b981' : '#059669',
                                                                borderRadius: '14px',
                                                                padding: '10px 12px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '8px',
                                                                fontWeight: 900,
                                                                cursor: 'pointer',
                                                                boxShadow: 'var(--shadow-sm)'
                                                            }}
                                                        >
                                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>open_in_new</span>
                                                            {msg.suggestedNavigation.label || 'Mở trang được đề xuất'}
                                                        </button>
                                                    )}

                                                {msg.type === "ai" && msg.provider && isClinicStaff && (
                                                    <div style={{
                                                        fontSize: '0.65rem',
                                                        color: 'var(--gray-400)',
                                                        marginTop: '8px',
                                                        textAlign: 'right',
                                                        fontStyle: 'italic',
                                                        fontWeight: 700
                                                    }}>
                                                        Trả lời bởi {msg.provider}
                                                    </div>
                                                )}

                                                {msg.suggestedNavigation && (
                                                    <button
                                                        data-ai-id="button-chatbot-suggested-nav"
                                                        onClick={() => navigate(msg.suggestedNavigation.path)}
                                                        style={{
                                                            marginTop: '12px',
                                                            width: '100%',
                                                            border: '1px solid rgba(244, 63, 94, 0.35)',
                                                            background: isDark ? 'rgba(244,63,94,0.08)' : '#fff1f2',
                                                            color: isDark ? '#fb7185' : '#be123c',
                                                            borderRadius: '14px',
                                                            padding: '10px 12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '8px',
                                                            fontWeight: 900,
                                                            cursor: 'pointer',
                                                            boxShadow: 'var(--shadow-sm)'
                                                        }}
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>open_in_new</span>
                                                        {msg.suggestedNavigation.label || 'Mở trang được đề xuất'}
                                                    </button>
                                                )}

                                                <CanhBaoDangNhapChatbot
                                                    isVisible={msg.isLoginPrompt}
                                                    isDark={isDark}
                                                    loginButtonId="button-chatbot-jos2"
                                                    registerButtonId="button-chatbot-8gxv"
                                                    onGoLogin={() => navigate("/dang-nhap")}
                                                />
                                            </div>

                                            {/* Dynamic Clinical Triage Card */}
                                            {msg.type === "ai" && msg.isEmergency && (
                                                <BangCapCuuChatbot
                                                    isClinicSide={isClinicStaff}
                                                    onOpenReception={() => navigate("/quan-ly/lich-hen")}
                                                    onOpenDoctorSchedule={() => navigate("/quan-ly/lich-lam-viec")}
                                                    onShareLocation={handleShareCurrentLocation}
                                                />
                                            )}
                                        </div>
                                    ))}
                                    {loading && (
                                        <BoTaiSuyNghi
                                            elapsedTime={standardElapsedTime}
                                            loadingText={getDynamicLoadingText(lastQuery, standardElapsedTime, false)}
                                            isDark={isDark}
                                        />
                                    )}
                                    <div ref={standardEndRef} />
                                </div>

                                {/* QUICK SUGGESTIONS BY ROLE */}
                                <GoiYNhanhChatbot suggestions={standardSuggestions} onSelect={handleSend} prefix="standard" />
                            </>
                        ) : (
                            // ==================== TAB 2: REXI AGENT V2 ====================
                            <>
                                <div className="chat-message-scroll" style={{ flex: 1, minHeight: 0, minWidth: 0, padding: '20px', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--background)' }}>
                                    {agentMessages.map((msg: any, idx: number) => (
                                        <div key={idx}
                                             className={msg.type === "user" ? "chat-message-user" : "chat-message-ai"}
                                             style={{ display: 'flex', flexDirection: 'column', alignSelf: msg.type === "user" ? "flex-end" : "flex-start", maxWidth: '85%', minWidth: 0 }}>
                                            <div
                                                style={{
                                                    padding: '12px 16px', borderRadius: msg.type === "user" ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                                    background: msg.type === "user" ? (isDark ? 'rgba(244, 63, 94, 0.2)' : '#ffe4e6') : 'var(--surface)',
                                                    color: 'var(--ink)', boxShadow: 'var(--shadow-sm)',
                                                    border: msg.type === "user" ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid var(--gray-200)',
                                                    minWidth: 0,
                                                    maxWidth: '100%',
                                                    overflowWrap: 'anywhere'
                                                }}
                                            >
                                                <HuyHieuLamSangChatbot msg={msg} isClinicalUser={isClinicalUser} isDark={isDark} />
                                                {msg.steps && (
                                                    <BangQuaTrinhSuyNghi steps={msg.steps} isDark={isDark} />
                                                )}
                                                {msg.text && (msg.isHtml ? <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.text) }} /> : <HienThiVanBanChatbot text={msg.text} />)}

                                                {msg.swarmData && (
                                                    <BangDieuPhoiSwarm data={msg.swarmData} isDark={isDark} />
                                                )}

                                                <PhieuDieuTriChatbot treatmentData={msg.treatmentData} isDark={isDark} onDownload={handleDownloadTreatmentPdf} />

                                                {msg.type === "ai" && msg.provider && isClinicStaff && (
                                                    <div style={{
                                                        fontSize: '0.65rem',
                                                        color: 'var(--gray-400)',
                                                        marginTop: '8px',
                                                        textAlign: 'right',
                                                        fontStyle: 'italic',
                                                        fontWeight: 700
                                                    }}>
                                                        Trả lời bởi {msg.provider}
                                                    </div>
                                                )}

                                                {/* KỸ NĂNG 5+7: HIỂN THỊ KẾT QUẢ DẠNG BẢNG (THUỐC, THÚ CƯNG, V.V.) */}
                                                {msg.isTableData && msg.tableHeader && msg.tableRows && (
                                                    <div style={{ marginTop: '12px', overflowX: 'auto' }}>
                                                        <div className="table-responsive-wrapper">
<div style={{ minWidth: '800px' }}>
<table style={{
                                                            width: '100%', borderCollapse: 'collapse',
                                                            fontSize: '0.75rem', fontFamily: 'inherit'
                                                        }}>
                                                            <thead>
                                                                <tr style={{ background: isDark ? 'rgba(244,63,94,0.2)' : '#fff1f2' }}>
                                                                    {msg.tableHeader.map((h: string, hIdx: number) => (
                                                                        <th key={hIdx} style={{
                                                                            padding: '7px 10px', textAlign: 'left',
                                                                            fontWeight: 900, color: '#e11d48',
                                                                            borderBottom: '2px solid rgba(244,63,94,0.3)',
                                                                            whiteSpace: 'nowrap'
                                                                        }}>{h}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {msg.tableRows.map((row: string[], rIdx: number) => (
                                                                    <tr key={rIdx} style={{
                                                                        background: rIdx % 2 === 0
                                                                            ? 'transparent'
                                                                            : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)')
                                                                    }}>
                                                                        {row.map((cell: string, cIdx: number) => (
                                                                            <td key={cIdx} style={{
                                                                                padding: '6px 10px',
                                                                                borderBottom: '1px solid var(--gray-200)',
                                                                                color: 'var(--ink)',
                                                                                maxWidth: '140px',
                                                                                overflow: 'hidden',
                                                                                textOverflow: 'ellipsis',
                                                                                whiteSpace: 'nowrap'
                                                                            }} title={cell}>{cell}</td>
                                                                        ))}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
</div></div>
                                                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '6px', fontStyle: 'italic' }}>
                                                            Hiển thị {msg.tableRows.length} dòng đầu • Dữ liệu trực tiếp từ hệ thống Rexi
                                                        </div>
                                                    </div>
                                                )}

                                                {/* KỸ NĂNG 1: HIỂN THỊ KẾT QUẢ GOOGLE SEARCH */}
                                                {msg.isSearchResult && <KetQuaTimKiemChatbot results={msg.searchResults} isDark={isDark} />}

                                                {/* KỸ NĂNG 2: HIỂN THỊ HÓA ĐƠN / LỊCH TRỰC HÀNH CHÍNH (ĐỒNG NGHIỆP DỮ LIỆU) */}
                                                {msg.isTableData && msg.tableRows && (
                                                    <div style={{ marginTop: '10px', overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--gray-200)' }}>
                                                        <div className="table-responsive-wrapper">
<div style={{ minWidth: '800px' }}>
<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                                            <thead>
                                                                <tr style={{ background: 'var(--gray-100)', fontWeight: 900 }}>
                                                                    {msg.tableHeader.map((h: string, hIdx: number) => (
                                                                        <th key={hIdx} style={{ padding: '8px 10px', textAlign: 'left', borderBottom: '1px solid var(--gray-200)' }}>{h}</th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {msg.tableRows.map((row: string[], rIdx: number) => (
                                                                    <tr key={rIdx} style={{ borderBottom: '1px solid var(--gray-200)', background: 'var(--surface)' }}>
                                                                        {row.map((cell: string, cIdx: number) => (
                                                                            <td key={cIdx} style={{ padding: '8px 10px' }}>{cell}</td>
                                                                        ))}
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
</div></div>
                                                    </div>
                                                )}

                                                {/* KỸ NĂNG 3: HIỂN THỊ RECEIPT LỊCH HẸN TỰ ĐỘNG THÀNH CÔNG */}
                                                {msg.isReceipt && msg.receipt && (
                                                    <div style={{
                                                        marginTop: '12px', padding: '14px', borderRadius: '16px',
                                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white',
                                                        boxShadow: '0 8px 20px rgba(16,185,129,0.25)'
                                                    }}>
                                                        <div style={{ fontWeight: 950, fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span className="material-symbols-outlined">check_circle</span>
                                                            ĐÃ LẬP LỊCH HẸN THÀNH CÔNG!
                                                        </div>
                                                        <div style={{ fontSize: '0.78rem', display: 'grid', gap: '6px', opacity: 0.95 }}>
                                                            <div>📅 **Ngày hẹn:** {msg.receipt.date}</div>
                                                            <div>🕒 **Giờ hẹn:** {msg.receipt.time}</div>
                                                            <div>🐶 **Thú cưng:** {msg.receipt.petName}</div>
                                                            <div>🩺 **Dịch vụ:** {msg.receipt.service}</div>
                                                            <div>👨‍⚕️ **Bác sĩ phụ trách:** {msg.receipt.doctorName}</div>
                                                        </div>
                                                        <button data-ai-id="button-chatbot-bohj" onClick={() => navigate("/khach-hang/lich-su-lich-hen")} style={{
                                                            marginTop: '12px', width: '100%', background: 'white', color: '#059669', border: 'none',
                                                            borderRadius: '10px', padding: '8px 0', fontWeight: 900, fontSize: '0.78rem', cursor: 'pointer'
                                                        }}>
                                                            XEM LỊCH HẸN CỦA TÔI
                                                        </button>
                                                    </div>
                                                )}

                                                <CanhBaoDangNhapChatbot
                                                    isVisible={msg.isLoginPrompt}
                                                    isDark={isDark}
                                                    accentColor="#f43f5e"
                                                    loginButtonId="button-chatbot-fbml"
                                                    registerButtonId="button-chatbot-cy8o"
                                                    onGoLogin={() => navigate("/dang-nhap")}
                                                />
                                            </div>

                                            {/* Dynamic Clinical Triage Card */}
                                            {msg.type === "ai" && msg.isEmergency && (
                                                <BangCapCuuChatbot
                                                    isClinicSide={isClinicStaff}
                                                    onOpenReception={() => navigate("/quan-ly/lich-hen")}
                                                    onOpenDoctorSchedule={() => navigate("/quan-ly/lich-lam-viec")}
                                                    onShareLocation={handleShareCurrentLocation}
                                                />
                                            )}
                                        </div>
                                    ))}
                                    {agentLoading && (
                                        <BoTaiSuyNghi
                                            elapsedTime={agentElapsedTime}
                                            loadingText={getDynamicLoadingText(lastAgentQuery, agentElapsedTime, true)}
                                            isDark={isDark}
                                        />
                                    )}
                                    <div ref={agentEndRef} />
                                </div>

                                {/* QUICK SUGGESTIONS BY ROLE */}
                                <GoiYNhanhChatbot suggestions={agentSuggestions} onSelect={handleAgentSend} prefix="agent" />
                            </>
                        )}

                        {/* 4. Đính kèm Files Preview */}
                        {activeTab === 'standard' && (
                            <MediaDinhKemChatbot
                                files={selectedFiles}
                                isCompressing={isCompressing}
                                onRemove={removeSelectedFile}
                            />
                        )}

                        {activeTab === 'agent' && agentLoading && (
                            <div style={{
                                margin: isMobile ? '0 14px 8px' : '0 20px 10px',
                                padding: '9px 12px',
                                border: '1px solid rgba(244, 63, 94, 0.22)',
                                borderRadius: '12px',
                                background: isDark ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255, 241, 242, 0.95)',
                                color: isDark ? '#fecdd3' : '#be123c',
                                fontSize: '0.78rem',
                                fontWeight: 900,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '17px', animation: 'spin 1.2s linear infinite' }}>progress_activity</span>
                                <span>Rexi Agent đang xử lý yêu cầu...</span>
                            </div>
                        )}

                        {/* 5. Ô NHẬP TIN NHẮN TẬP TRUNG (CONSOLIDATED INPUT DYNAMIC STYLING) */}
                        <div style={{
                            padding: isMobile ? '12px 14px max(12px, env(safe-area-inset-bottom, 0px))' : '16px 20px',
                            background: 'var(--surface)', borderTop: '1px solid var(--gray-200)', display: 'flex', alignItems: 'flex-end', gap: isMobile ? '8px' : '12px',
                            flex: '0 0 auto',
                            minWidth: 0
                        }}>
                            {/* Nút File Đính kèm (Chỉ cho Tab 1) */}
                            {activeTab === 'standard' && (
                                <>
                                    <input data-ai-id="input-chatbot-jmt6"
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*,video/*" multiple style={{ display: 'none' }} onChange={handleFileChange} /> <button data-ai-id="button-chatbot-veod" onClick={() => fileInputRef.current?.click()} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flexShrink: 0, width: isMobile ? '40px' : '28px', height: isMobile ? '42px' : '28px' }}> <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>add_circle</span> </button> </> )} {/* MICROPHONE NHẬN DIỆN GIỌNG NÓI */}
                            <button data-ai-id="button-chatbot-4mbq"
                                onClick={toggleListening}
                                style={{ background: 'none', border: 'none', color: isListening ? (voiceMode === 'hold' ? '#f59e0b' : voiceMode === 'fast' ? '#22c55e' : '#ef4444') : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, flex: '0 0 auto', width: isMobile ? '40px' : '32px', height: isMobile ? '42px' : '34px' }}
                                title={isListening ? `Đang nghe liên tục (${voiceMode === 'fast' ? 'nhanh' : voiceMode === 'hold' ? 'đang chờ' : 'bình thường'})` : "Bấm một lần để nói chuyện liên tục với Rexi"}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '28px', animation: isListening ? 'blink 1.5s infinite' : 'none' }}>
                                    {isListening ? 'mic' : 'mic_none'}
                                </span>
                            </button>
                            {isListening && !isMobile && (
                                <div aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
                                    <div ref={waveBar1Ref} className="wave-bar"></div>
                                    <div ref={waveBar2Ref} className="wave-bar"></div>
                                    <div ref={waveBar3Ref} className="wave-bar"></div>
                                </div>
                            )}

                            {/* Ô Nhập Dữ Liệu Tự Động Co Giãn */}
                            <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <textarea
                                    ref={textInputRef}
                                    value={activeTab === 'standard' ? input : agentInput}
                                    maxLength={1000}
                                    onChange={(e) => {
                                        if (activeTab === 'standard') {
                                            setInput(e.target.value);
                                        } else {
                                            setAgentInput(e.target.value);
                                        }
                                        e.target.style.height = 'auto';
                                        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (activeTab === 'standard') {
                                                handleSend();
                                            } else {
                                                handleAgentSend();
                                            }
                                        }
                                    }}
                                    onPaste={handlePasteFiles}
                                    placeholder={activeTab === 'agent' ? (isMobile ? "Lệnh" : "Lệnh tác vụ cho Agent (e.g. đặt lịch, tra cứu mạng)...") : (isMobile ? "Tin nhắn" : "Nhắn tin cho Bác sĩ Thú y Rexi...")}
                                    rows={1}
                                    style={{
                                        width: '100%', minWidth: 0, border: '1px solid var(--gray-300)', borderRadius: '18px', padding: '10px 16px',
                                        resize: 'none', background: 'var(--background)', color: 'var(--ink)', fontSize: '0.88rem',
                                        outline: 'none', maxHeight: '120px', lineHeight: '1.4'
                                    }}
                                />
                                {((activeTab === 'standard' ? input.length : agentInput.length) > 0) && (
                                    <div style={{
                                        fontSize: '0.7rem',
                                        color: (activeTab === 'standard' ? input.length : agentInput.length) > 900 ? 'var(--danger)' : 'var(--gray-400)',
                                        textAlign: 'right',
                                        padding: '0 8px 2px',
                                        fontWeight: 800,
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        alignItems: 'center',
                                        gap: '4px',
                                        animation: 'fadeIn 0.2s ease-out'
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>edit_note</span>
                                        {(activeTab === 'standard' ? input.length : agentInput.length)}/1000 ký tự
                                    </div>
                                )}
                                {isListening && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        marginTop: '4px',
                                        padding: '6px 12px',
                                        background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
                                        borderRadius: '16px',
                                        border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
                                        boxShadow: isDark ? 'inset 0 1px 2px rgba(255,255,255,0.03)' : 'inset 0 1px 2px rgba(0,0,0,0.03)',
                                        animation: 'pulse-soft 2s infinite ease-in-out'
                                    }}>
                                        {/* Premium Glowing Soundwave Visualizer */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '3.5px', height: '16px', padding: '0 4px', flexShrink: 0 }}>
                                            <div style={{ width: '3px', height: '8px', background: activeTab === 'agent' ? '#f43f5e' : '#10b981', borderRadius: '3px', transformOrigin: 'center', animation: 'waveGrow 1.0s ease-in-out infinite alternate', boxShadow: activeTab === 'agent' ? '0 0 6px rgba(244,63,94,0.4)' : '0 0 6px rgba(16,185,129,0.4)' }}></div>
                                            <div style={{ width: '3px', height: '14px', background: activeTab === 'agent' ? '#f43f5e' : '#10b981', borderRadius: '3px', transformOrigin: 'center', animation: 'waveGrow 0.7s ease-in-out infinite alternate', animationDelay: '0.15s', boxShadow: activeTab === 'agent' ? '0 0 6px rgba(244,63,94,0.4)' : '0 0 6px rgba(16,185,129,0.4)' }}></div>
                                            <div style={{ width: '3px', height: '10px', background: activeTab === 'agent' ? '#f43f5e' : '#10b981', borderRadius: '3px', transformOrigin: 'center', animation: 'waveGrow 0.85s ease-in-out infinite alternate', animationDelay: '0.3s', boxShadow: activeTab === 'agent' ? '0 0 6px rgba(244,63,94,0.4)' : '0 0 6px rgba(16,185,129,0.4)' }}></div>
                                            <div style={{ width: '3px', height: '15px', background: activeTab === 'agent' ? '#f43f5e' : '#10b981', borderRadius: '3px', transformOrigin: 'center', animation: 'waveGrow 0.6s ease-in-out infinite alternate', animationDelay: '0.1s', boxShadow: activeTab === 'agent' ? '0 0 6px rgba(244,63,94,0.4)' : '0 0 6px rgba(16,185,129,0.4)' }}></div>
                                            <div style={{ width: '3px', height: '6px', background: activeTab === 'agent' ? '#f43f5e' : '#10b981', borderRadius: '3px', transformOrigin: 'center', animation: 'waveGrow 1.2s ease-in-out infinite alternate', animationDelay: '0.2s', boxShadow: activeTab === 'agent' ? '0 0 6px rgba(244,63,94,0.4)' : '0 0 6px rgba(16,185,129,0.4)' }}></div>
                                        </div>

                                        <div style={{
                                            flex: 1,
                                            fontSize: '0.75rem',
                                            fontWeight: 850,
                                            lineHeight: 1.35,
                                            color: voiceLiveText ? (activeTab === 'agent' ? '#f43f5e' : 'var(--primary)') : 'var(--gray-400)',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            <span style={{ color: voiceMode === 'hold' ? '#f59e0b' : voiceMode === 'fast' ? '#22c55e' : '#ef4444', flexShrink: 0, marginRight: '8px' }}>
                                                {voiceMode === 'fast' ? 'FAST' : voiceMode === 'hold' ? 'WAIT' : 'LIVE'}
                                            </span>
                                            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {voiceLiveText
                                                    ? `Đã nghe: ${voiceLiveText}`
                                                    : voiceStatus || (isUnreliableSpeechRecognitionBrowser()
                                                        ? 'Opera không ra chữ - mở Chrome hoặc Edge'
                                                        : 'Đang chờ giọng nói...')}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* NÚT GỬI KHỚP DYNAMIC THEO TAB */}
                            <button data-ai-id="button-chatbot-5x21"
                                onClick={() => activeTab === 'standard' ? handleSend() : handleAgentSend()}
                                disabled={(activeTab === 'agent' ? agentLoading : false) || isCompressing}
                                style={{
                                    background: activeTab === 'agent' ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' : 'var(--chat-gradient)',
                                    color: 'white', border: 'none', borderRadius: '50%', width: '42px', height: '42px', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: ((activeTab === 'agent' ? agentLoading : false) || isCompressing) ? 'not-allowed' : 'pointer',
                                    opacity: ((activeTab === 'agent' ? agentLoading : false) || isCompressing) ? 0.72 : 1,
                                    boxShadow: 'var(--shadow-md)', transition: 'all 0.3s ease'
                                }}
                            >
                                <span className="material-symbols-outlined" style={{
                                    fontSize: '20px',
                                    transform: ((activeTab === 'agent' ? agentLoading : false) || isCompressing) ? 'none' : 'rotate(-30deg)',
                                    animation: ((activeTab === 'agent' ? agentLoading : false) || isCompressing) ? 'spin 1.2s linear infinite' : 'none'
                                }}>
                                    {((activeTab === 'agent' ? agentLoading : false) || isCompressing) ? 'progress_activity' : 'send'}
                                </span>
                            </button>
                        </div>
                    </div>
                </>
            )}

            <AnhPhongToChatbot src={zoomedImage} onClose={() => setZoomedImage(null)} />
            <BangHanhDongAgentChatbot action={currentAgentAction} isMobile={isMobile} />
        </>
    );
};
