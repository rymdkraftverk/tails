FROM node:carbon
WORKDIR /tails/backend
COPY ./backend /tails/backend
COPY ./common /tails/common
COPY ./signaling /tails/signaling

RUN npm install
EXPOSE 3000

CMD ["node", "."]
