FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev && npm install sequelize-cli

COPY . .

EXPOSE 5001

CMD ["sh", "-c", "node scripts/wait-for-db.js && npx sequelize-cli db:migrate && npx sequelize-cli db:seed:all && npm start"]
