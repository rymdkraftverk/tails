FROM node:carbon
WORKDIR /novelty/backend
COPY ./backend /novelty/backend
COPY ./common /novelty/common

RUN npm install
EXPOSE 3000

CMD ["npm", "run", "nodemon", "--redis", "rs://redis:6379"]