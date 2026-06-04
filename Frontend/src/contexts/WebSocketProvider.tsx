import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { toast } from '@components/Toast';
import { kiemTraLaAdmin } from '@utils/permissions';

interface WebSocketContextType {
    connected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({ connected: false });

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        // ⚡ Tối ưu: chỉ khởi tạo WS khi user đã đăng nhập
        // Tránh tốn tài nguyên kết nối WS trên trang public (trang chủ, đăng nhập, bảng giá...)
        const token = localStorage.getItem('token');
        if (!token) {
            return;
        }

        // Khởi tạo STOMP client
        const client = new Client({
            webSocketFactory: () => new SockJS('/ws'),
            debug: () => {
                // console.log(str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            setConnected(true);
            console.log('Đã kết nối WebSocket thành công');
            
            // Lắng nghe topic public (thông báo chung)
            client.subscribe('/topic/public', (message) => {
                if (message.body) {
                    try {
                        const payload = JSON.parse(message.body);
                        const msg = payload.title ? `${payload.title}: ${payload.content}` : payload.content;
                        if (payload.type === 'error') {
                            toast.error(msg);
                        } else if (payload.type === 'success') {
                            toast.success(msg);
                        } else {
                            toast.info(msg);
                        }
                    } catch (e) {
                        console.error('Lỗi parse message', e);
                    }
                }
            });

            client.subscribe('/topic/security-alerts', (message) => {
                if (!message.body) return;
                try {
                    const payload = JSON.parse(message.body);
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    if (!kiemTraLaAdmin(user)) return;
                    window.dispatchEvent(new CustomEvent('rexi-security-alert', { detail: payload }));
                    toast.error(payload.message || 'Cảnh báo bảo mật: phát hiện tấn công và đã chặn IP.');
                } catch (e) {
                    console.error('Lỗi parse security alert', e);
                }
            });

            client.subscribe('/topic/web-errors', (message) => {
                if (!message.body) return;
                try {
                    const payload = JSON.parse(message.body);
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    if (!kiemTraLaAdmin(user)) return;
                    window.dispatchEvent(new CustomEvent('rexi-web-error-alert', { detail: payload }));
                    toast.error(payload.message ? `Lỗi web: ${payload.message}` : 'Rexi phát hiện lỗi web cần Admin kiểm tra.');
                } catch (e) {
                    console.error('Lỗi parse web error alert', e);
                }
            });

            client.subscribe('/topic/appointments', (message) => {
                if (!message.body) return;
                try {
                    const payload = JSON.parse(message.body);
                    window.dispatchEvent(new CustomEvent('rexi-appointments-changed', { detail: payload }));
                } catch (e) {
                    console.error('Lỗi parse appointment realtime event', e);
                }
            });

            client.subscribe('/topic/data-changes', (message) => {
                if (!message.body) return;
                try {
                    const payload = JSON.parse(message.body);
                    window.dispatchEvent(new CustomEvent('rexi-data-changed', { detail: payload }));
                } catch (e) {
                    console.error('Lỗi parse data realtime event', e);
                }
            });
        };

        client.onStompError = (frame) => {
            console.error('Broker reported error: ' + frame.headers['message']);
            console.error('Additional details: ' + frame.body);
            toast.error('Rexi realtime gặp lỗi kết nối. Một số cảnh báo hoặc cập nhật realtime có thể không hiển thị.');
        };

        client.onWebSocketClose = () => {
            setConnected(false);
            // ⚡ Tối ưu UX: chỉ log, không toast – STOMP tự động reconnect sau 5s
            // Người dùng sẽ không bị spam lỗi khi mạng chập chờn
            console.warn('WebSocket đóng kết nối. STOMP sẽ tự động thử kết nối lại...');
        };

        client.onWebSocketError = (event) => {
            console.error('WebSocket error:', event);
            setConnected(false);
            // ⚡ Tối ưu UX: chỉ log, không toast – tránh spam cho user
        };

        client.activate();

        return () => {
            client.deactivate();
        };
    }, []);

    return (
        <WebSocketContext.Provider value={{ connected }}>
            {children}
        </WebSocketContext.Provider>
    );
};
