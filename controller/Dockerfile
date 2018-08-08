FROM node:carbon

WORKDIR /novelty/controller
COPY ./controller /novelty/controller
COPY ./common /novelty/common
COPY ./signaling /novelty/signaling

RUN npm install
RUN npm run build
EXPOSE 4001

CMD ["npm", "run", "start"]
