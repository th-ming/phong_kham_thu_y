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
            webSocketFactory: () => new SockJS('http://localhost:8081/ws'), // URL tới Spring Boot
            debug: () => {},
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            setConnected(true);
            
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
