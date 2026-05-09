# ==========================================
# BƯỚC 1: BUILD ỨNG DỤNG (Builder Stage)
# ==========================================
FROM node:18-alpine as builder

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

# Cấu hình Nginx: Mở port 3000 và điều hướng mọi URL về index.html (Quan trọng cho React Router SPA)
RUN echo "server { listen 3000; location / { root /usr/share/nginx/html; index index.html; try_files \$uri \$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf

# Copy mã tĩnh đã đóng gói từ Bước 1 sang thư mục gốc của Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]