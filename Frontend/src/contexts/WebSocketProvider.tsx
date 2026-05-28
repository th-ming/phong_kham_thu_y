import React, { createContext, useContext, useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { toast } from '@components/Toast';

interface WebSocketContextType {
    connected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({ connected: false });

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [connected, setConnected] = useState(false);

    useEffect(() => {
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
                    const role = String(`${user?.vai_tro || ''} ${user?.role || ''} ${user?.ten_vai_tro || ''} ${user?.id_vai_tro || ''}`).toLowerCase();
                    const isAdmin = role.includes('admin') || role.includes('vt-1') || role.includes('vt-admin');
                    if (!isAdmin) return;
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
                    const role = String(`${user?.vai_tro || ''} ${user?.role || ''} ${user?.ten_vai_tro || ''} ${user?.id_vai_tro || ''}`).toLowerCase();
                    const isAdminOnly = role.includes('admin') || role.includes('vt-1') || role.includes('vt-admin');
                    if (!isAdminOnly) return;
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
