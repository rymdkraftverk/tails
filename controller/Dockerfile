FROM node:carbon

WORKDIR /tails/controller
COPY ./controller /tails/controller
COPY ./common /tails/common
COPY ./signaling /tails/signaling

RUN npm install
RUN npm run build
EXPOSE 4001

CMD ["npm", "run", "start"]
