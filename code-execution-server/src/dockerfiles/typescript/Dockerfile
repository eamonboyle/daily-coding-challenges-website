# Base image for TypeScript submissions
FROM node:18-alpine
WORKDIR /usr/src/app
RUN npm install -g typescript ts-node
COPY package*.json ./
RUN npm install
CMD ["node"]
