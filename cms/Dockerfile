FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
COPY prisma ./prisma
COPY server/package.json server/package-lock.json* ./server/
COPY client/package.json client/package-lock.json* ./client/
COPY scripts ./scripts

RUN npm install \
  && npm install --prefix server \
  && npm install --prefix client --omit=dev || npm install --prefix client

COPY . .

RUN npx prisma generate --schema=prisma/schema.prisma \
  && node -e "const fs=require('fs');const s='server/node_modules';fs.mkdirSync(s+'/@prisma',{recursive:true});fs.mkdirSync(s+'/.prisma',{recursive:true});fs.cpSync('node_modules/@prisma/client',s+'/@prisma/client',{recursive:true});if(fs.existsSync('node_modules/.prisma'))fs.cpSync('node_modules/.prisma',s+'/.prisma',{recursive:true});"

ENV NODE_ENV=production
ENV PORT=4000
ENV DATABASE_URL=file:./dev.db
ENV UPLOAD_DIR=./uploads
ENV TRUST_PROXY=1
ENV COOKIE_SECURE=true
ENV ALLOW_DEV_RESET_FILE=false

EXPOSE 4000

CMD ["node", "scripts/docker-boot.mjs"]
