FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

ENV VITE_API_URL=http://backend:8000
ENV VITE_PUBLIC_API_URL=http://localhost:8000
ENV VITE_HOST=0.0.0.0

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"] 