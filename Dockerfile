FROM node:22-alpine

WORKDIR /app

# Install build dependencies for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++ sqlite

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

# Build frontend assets
RUN npm run build

# Ensure persistent database directory exists
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Start full-stack server
CMD ["npm", "run", "start"]
