FROM node:carbon
WORKDIR /novelty/backend/src
COPY ./backend/src /novelty/backend/src
COPY ./common /novelty/common
COPY ./signaling /novelty/signaling

RUN npm install
EXPOSE 3000

CMD ["node", "./src/index.js"]
