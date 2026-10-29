FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html ./
COPY src ./src
COPY public ./public
COPY scripts/generate-notices.mjs ./scripts/generate-notices.mjs
RUN npm run build

FROM node:22-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4318 AI_MODE=mock
WORKDIR /app
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node server ./server
COPY --chown=node:node src/*.mjs ./src/
# Production server uses Node built-ins and shared pure modules only.
USER node
EXPOSE 4318
CMD ["node", "server/index.mjs"]
