FROM node:carbon
WORKDIR /novelty/game
COPY ./game /novelty/game
COPY ./common/ /novelty/common
COPY ./signaling/ /novelty/signaling

RUN npm install
RUN npm run build
EXPOSE 8081

CMD ["npm", "run", "start"]