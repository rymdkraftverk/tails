FROM node:carbon
WORKDIR /novelty/controller
COPY ./controller /novelty/controller
COPY ./common /novelty/common

RUN npm install
RUN REACT_APP_WS_ADDRESS=http://localhost:3000 npm run build
EXPOSE 3000

CMD ["npm", "run", "start"]
