# Base Dockerfile for TypeScript
FROM node:latest

# Set working directory
WORKDIR /usr/src/app

# Install TypeScript globally
RUN npm install -g typescript

# Copy package.json and package-lock.json if available
COPY package*.json ./

# Install dependencies
RUN npm install

# Default command (can be overridden)
CMD ["node"]
