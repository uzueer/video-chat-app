# ---------- BUILD STAGE ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY client/package*.json ./
RUN npm install

COPY client .
RUN npm run build


# ---------- PRODUCTION (NGINX) ----------
FROM nginx:alpine

# copy nginx config
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]