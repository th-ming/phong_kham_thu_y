# ==========================================
# BƯỚC 1: BUILD ỨNG DỤNG (Builder Stage)
# ==========================================
FROM node:20-alpine as builder

WORKDIR /app

# Cài đặt dependencies trước để tận dụng Docker Cache (Giúp build nhanh hơn ở các lần sau)
COPY package.json package-lock.json* ./
RUN npm install

# Copy toàn bộ mã nguồn vào
COPY . .

# Nhận các biến môi trường lúc Build (Để Vite nhúng vào mã tĩnh)
ARG VITE_API_URL
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Build ra thư mục /dist
RUN npm run build

# ==========================================
# BƯỚC 2: CHẠY NGINX (Production Stage)
# ==========================================
FROM nginx:alpine

# Cau hinh Nginx: Mo port 3000 va dieu huong moi URL ve index.html (React Router SPA)
RUN echo "server { \r
    listen 3000; \r
    location / { \r
        root /usr/share/nginx/html; \r
        index index.html; \r
        try_files \$uri \$uri/ /index.html; \r
    } \r
    # GZIP cho static assets\r
    gzip on;\r
    gzip_types text/plain text/css application/json application/javascript text/xml image/svg+xml;\r
    # SECURITY: An version, chan clickjacking\r
    server_tokens off;\r
    add_header X-Frame-Options SAMEORIGIN always;\r
    add_header X-Content-Type-Options nosniff always;\r
}" > /etc/nginx/conf.d/default.conf

# Copy mã tĩnh đã đóng gói từ Bước 1 sang thư mục gốc của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]