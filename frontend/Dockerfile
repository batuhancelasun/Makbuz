FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage - just output the dist folder
FROM alpine:latest
COPY --from=builder /app/dist /dist
CMD ["echo", "Build complete"]

