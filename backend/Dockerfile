FROM node:carbon
WORKDIR /novelty/backend
COPY ./backend /novelty/backend
COPY ./common /novelty/common
COPY ./signaling /novelty/signaling

RUN npm install
EXPOSE 3000

CMD ["npm", "start"]
