import React from "react";

export const StyleChatbot: React.FC = () => (
    <style>{`
        @keyframes chatPulseGlow {
            0%, 100% { box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4); }
            50% { box-shadow: 0 0 35px rgba(52, 211, 153, 0.7), 0 10px 40px rgba(16, 185, 129, 0.3); }
        }
        @keyframes chatIconWaggle {
            0%, 100% { transform: rotate(0deg); }
            10%, 20% { transform: rotate(-8deg); }
            15%, 25% { transform: rotate(8deg); }
            30% { transform: rotate(0deg); }
        }
        .emergency-customer-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            align-items: stretch;
        }
        .emergency-customer-action {
            min-height: 68px;
            width: 100%;
            box-sizing: border-box;
            line-height: 1.25;
            text-align: center;
            white-space: normal;
            transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .emergency-customer-action:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 22px rgba(14, 165, 233, 0.16);
        }
        .emergency-customer-action .material-symbols-outlined {
            flex: 0 0 auto;
        }
        .emergency-customer-location-action {
            grid-column: 1 / -1;
            min-height: 56px;
        }
        @media (max-width: 640px) {
            .emergency-customer-actions {
                grid-template-columns: 1fr;
                gap: 8px;
            }
            .emergency-customer-location-action {
                grid-column: auto;
            }
            .emergency-customer-action {
                min-height: 48px;
            }
        }
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes pulse-soft {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.85; transform: scale(0.995); }
        }
        .dot-pulse {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 8px 12px;
            background: var(--surface);
            border-radius: 12px;
            border: 1px solid var(--gray-200);
        }
        .dot-pulse span {
            width: 6px;
            height: 6px;
            background: var(--primary);
            border-radius: 50%;
            animation: blink 1.2s infinite ease-in-out;
        }
        .dot-pulse span:nth-child(2) { animation-delay: 0.2s; }
        .dot-pulse span:nth-child(3) { animation-delay: 0.4s; }

        .chat-tab-btn {
            position: relative;
            flex: 1;
            padding: 10px 0;
            border: none;
            background: transparent;
            color: var(--gray-500);
            font-weight: 800;
            font-size: 0.8rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: all 0.3s ease;
        }
        .chat-tab-btn:focus-visible,
        .chat-suggestion-chip:focus-visible,
        #chatWindow button:focus-visible {
            outline: 2px solid rgba(34, 211, 238, 0.85);
            outline-offset: 2px;
        }
        .chat-tab-btn.active-tab {
            color: white;
        }
        .chat-suggestion-shell {
            position: relative;
            z-index: 3;
            flex: 0 0 auto;
            width: 100%;
            max-width: 100%;
            min-width: 0;
            box-sizing: border-box;
            overflow-x: auto;
            overflow-y: hidden;
            padding: 10px 14px;
            background: var(--surface);
            border-top: 1px solid var(--gray-200);
            overscroll-behavior-x: contain;
            scrollbar-width: thin;
            scrollbar-color: rgba(34, 211, 238, 0.45) transparent;
        }
        .chat-suggestion-shell::-webkit-scrollbar {
            height: 6px;
        }
        .chat-suggestion-shell::-webkit-scrollbar-track {
            background: transparent;
        }
        .chat-suggestion-shell::-webkit-scrollbar-thumb {
            background: rgba(34, 211, 238, 0.45);
            border-radius: 999px;
        }
        .chat-suggestion-track {
            display: flex;
            width: max-content;
            max-width: none;
            min-width: 100%;
            gap: 8px;
        }
        .chat-suggestion-chip {
            position: relative;
            z-index: 4;
            flex: 0 0 auto;
            white-space: nowrap;
            padding: 7px 12px;
            border-radius: 12px;
            border: 1px solid;
            font-size: 0.75rem;
            font-weight: 850;
            cursor: pointer;
            max-width: min(220px, 70vw);
            overflow: hidden;
            text-overflow: ellipsis;
            transition: transform 0.18s ease, filter 0.18s ease, box-shadow 0.18s ease;
        }
        .chat-suggestion-chip:hover {
            transform: translateY(-1px);
            filter: brightness(1.08);
            box-shadow: 0 6px 16px rgba(15, 23, 42, 0.14);
        }
        [data-theme='dark'] .chat-suggestion-shell {
            background: rgba(15, 23, 42, 0.96);
            border-top-color: rgba(148, 163, 184, 0.18);
        }
        [data-theme='dark'] .chat-suggestion-chip:hover {
            box-shadow: 0 8px 18px rgba(0, 0, 0, 0.28);
        }
        #chatWindow,
        #chatWindow * {
            box-sizing: border-box;
        }
        #chatWindow {
            max-width: calc(100vw - 20px);
            contain: layout paint;
        }
        .chat-message-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(34, 211, 238, 0.45) transparent;
        }
        .chat-message-scroll::-webkit-scrollbar {
            width: 7px;
        }
        .chat-message-scroll::-webkit-scrollbar-track {
            background: transparent;
        }
        .chat-message-scroll::-webkit-scrollbar-thumb {
            background: rgba(34, 211, 238, 0.4);
            border-radius: 999px;
        }
        .chat-message-ai,
        .chat-message-user {
            min-width: 0;
            max-width: min(85%, 100%);
        }
        .chat-message-ai > div,
        .chat-message-user > div {
            min-width: 0;
            max-width: 100%;
            overflow-wrap: anywhere;
        }
        .table-responsive-wrapper {
            max-width: 100%;
            overflow-x: auto;
        }

        @media (max-width: 768px) {
            #chatCallout { display: none !important; }
            #chatBtn {
                right: 16px !important;
                width: 56px !important;
                height: 56px !important;
            }
            #chatBtn.admin-chat-btn {
                bottom: max(88px, env(safe-area-inset-bottom, 0px) + 84px) !important;
                width: 46px !important;
                height: 46px !important;
            }
            #chatWindow {
                left: 50% !important;
                right: auto !important;
                bottom: max(12px, env(safe-area-inset-bottom, 0px) + 12px) !important;
                width: min(430px, calc(100vw - 20px)) !important;
                height: min(680px, calc(var(--rexi-viewport-height, 100dvh) - max(24px, env(safe-area-inset-bottom, 0px) + 24px))) !important;
                max-height: min(680px, calc(var(--rexi-viewport-height, 100dvh) - max(24px, env(safe-area-inset-bottom, 0px) + 24px))) !important;
                border-radius: 22px !important;
                transform: translateX(-50%) !important;
                padding-bottom: env(safe-area-inset-bottom, 0px);
                box-shadow: 0 16px 42px rgba(2, 132, 199, 0.22) !important;
            }
            #chatWindow.chat-window-has-mobile-nav {
                bottom: max(82px, env(safe-area-inset-bottom, 0px) + 76px) !important;
                height: min(620px, calc(var(--rexi-viewport-height, 100dvh) - max(96px, env(safe-area-inset-bottom, 0px) + 90px))) !important;
                max-height: min(620px, calc(var(--rexi-viewport-height, 100dvh) - max(96px, env(safe-area-inset-bottom, 0px) + 90px))) !important;
            }
            #chatWindow textarea {
                font-size: 16px !important;
            }
            .chat-tab-btn {
                padding: 8px 0;
                gap: 5px;
                font-size: 0.76rem;
                min-width: 0;
            }
            .chat-tab-btn .material-symbols-outlined {
                font-size: 17px !important;
            }
            .chat-message-scroll {
                padding: 12px !important;
                gap: 10px !important;
            }
            .chat-message-ai,
            .chat-message-user {
                max-width: 90% !important;
            }
            .chat-message-ai > div,
            .chat-message-user > div {
                padding: 10px 12px !important;
                border-radius: 17px !important;
                font-size: 0.95rem;
                line-height: 1.45;
            }
            .chat-suggestion-shell {
                padding: 7px 10px;
                scrollbar-width: none;
            }
            .chat-suggestion-shell::-webkit-scrollbar {
                display: none;
            }
            .chat-suggestion-chip {
                max-width: min(170px, 54vw);
                padding: 7px 9px;
                font-size: 0.72rem;
                border-radius: 11px;
            }
        }
        @media (max-width: 380px) {
            #chatWindow {
                width: calc(100vw - 14px) !important;
                border-radius: 18px !important;
            }
            .chat-message-scroll {
                padding: 10px !important;
            }
            .chat-message-ai,
            .chat-message-user {
                max-width: 94% !important;
            }
            .chat-suggestion-chip {
                max-width: 148px;
            }
        }
        @keyframes chatSoftWave {
            0%, 8%, 34%, 100% {
                opacity: 0;
                transform: scale(0.82);
            }
            12% {
                opacity: 0.34;
                transform: scale(1);
            }
            28% {
                opacity: 0;
                transform: scale(1.72);
            }
        }
        @keyframes chatLightSweep {
            0%, 52% {
                opacity: 0;
                transform: translateX(-120%) rotate(25deg);
            }
            66% {
                opacity: 0.56;
            }
            88%, 100% {
                opacity: 0;
                transform: translateX(125%) rotate(25deg);
            }
        }
        #chatBtn {
            isolation: isolate;
            overflow: visible;
        }
        #chatBtn::before,
        #chatBtn::after {
            content: "";
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            border: 1px solid rgba(45, 212, 191, 0.16);
            pointer-events: none;
            z-index: -1;
            box-shadow:
                0 0 18px rgba(45, 212, 191, 0.16),
                inset 0 0 14px rgba(125, 211, 252, 0.12);
            animation: chatSoftWave 6s ease-out infinite;
            transform-origin: center;
        }
        #chatBtn::after {
            inset: -8px;
            border-color: rgba(34, 211, 238, 0.18);
            box-shadow:
                0 0 22px rgba(34, 211, 238, 0.12),
                inset 0 0 18px rgba(103, 232, 249, 0.10);
            animation-delay: 0.12s;
        }
        #chatBtn.is-open::before,
        #chatBtn.is-open::after {
            animation: none;
            opacity: 0;
        }
        [data-theme='dark'] #chatBtn::before {
            border-color: rgba(34, 211, 238, 0.20);
            box-shadow: 0 0 20px rgba(34, 211, 238, 0.12);
        }
        [data-theme='dark'] #chatBtn::after {
            border-color: rgba(20, 184, 166, 0.12);
            box-shadow: 0 0 24px rgba(20, 184, 166, 0.08);
        }
        #chatBtn:hover::before,
        #chatBtn:hover::after {
            animation-duration: 2.4s;
        }
        @keyframes waveGrow {
            0% { transform: scaleY(0.35); }
            100% { transform: scaleY(1.35); }
        }
    `}</style>
);
