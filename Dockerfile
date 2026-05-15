FROM node:22-bookworm-slim AS app-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM app-deps AS app-dev
WORKDIR /app
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM app-deps AS app-build
WORKDIR /app
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS mcp-deps
WORKDIR /app/mcp-server
COPY mcp-server/package.json mcp-server/package-lock.json ./
RUN npm ci

FROM mcp-deps AS mcp-dev
WORKDIR /app
COPY . .
WORKDIR /app/mcp-server
CMD ["sh", "-c", "npm run build && npm run dev"]
