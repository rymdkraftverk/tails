FROM node:carbon
WORKDIR /novelty/backend
COPY ./backend /novelty/backend
COPY ./common /novelty/common

RUN npm install
EXPOSE 3000

CMD ["node", "./index.js"]
