FROM node:carbon
WORKDIR /tails/game
COPY ./game /tails/game
COPY ./common/ /tails/common
COPY ./signaling/ /tails/signaling

RUN npm install
RUN npm run build
EXPOSE 8081

CMD ["npm", "run", "start"]