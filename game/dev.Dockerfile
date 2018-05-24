FROM node:carbon
WORKDIR /novelty/game
COPY ./game /novelty/game
COPY ./common/ /novelty/common

RUN npm install
RUN npm run build
EXPOSE 8081

CMD ["sh", "-c", "npm run watch & npm run start"]