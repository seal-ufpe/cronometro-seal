FROM node:22.14.0-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts --no-audit --loglevel=error && npm cache clean --force
COPY . .
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
RUN chown -R node:node /app
USER node

FROM base AS dev
EXPOSE 5173
ENV CHOKIDAR_USEPOLLING=true WATCHPACK_POLLING=true
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM base AS test
CMD ["npm", "test"]

FROM base AS lint
CMD ["npm", "run", "lint"]

FROM base AS build
RUN npm run build

FROM nginx:1.27.3-alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --retries=3 CMD wget -q -O - http://127.0.0.1/health || exit 1
