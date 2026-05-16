package com.rexi.pkty.security;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * Lớp chứa dữ liệu yêu cầu để giới hạn băng thông (Rate Limiting)
 */
public class RequestData {
    private final AtomicInteger count = new AtomicInteger(1);
    private final long timestamp;

    public RequestData() {
        this.timestamp = System.currentTimeMillis();
    }

    public AtomicInteger getCount() {
        return count;
    }

    public long getTimestamp() {
        return timestamp;
    }
}
