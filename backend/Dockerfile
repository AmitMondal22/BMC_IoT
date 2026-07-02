FROM node:22-alpine

WORKDIR /app

# Install build essentials if needed (e.g. for bcrypt)
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install --only=production

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "npx sequelize-cli db:migrate && npx sequelize-cli db:seed:all && npm run start"]
