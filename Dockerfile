FROM node:20-slim

RUN apt-get update && apt-get install -y openssh-client && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

COPY . .

# Remove local host key - will be auto-generated at runtime
RUN rm -f host_key host_key.pub

EXPOSE 3000 2222

CMD ["node", "server.js"]
