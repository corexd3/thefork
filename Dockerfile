# Use Playwright's official image which has all dependencies pre-installed
# Based on Node 20 (noble = Ubuntu 24.04)
# Match the playwright version in package.json (1.56.1)
FROM mcr.microsoft.com/playwright:v1.56.1-noble

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
