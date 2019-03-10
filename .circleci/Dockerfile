FROM ubuntu

RUN apt-get update && \
    apt-get install -y \
        git \
        python3-pip \
        curl \
        unzip

# aws cli
RUN pip3 install awscli --upgrade

# itch.io cli
RUN curl -L -o butler.zip https://broth.itch.ovh/butler/linux-amd64/LATEST/archive/default && \
    unzip butler.zip && \
    chmod +x butler && \
    mv butler ./bin

# heroku
RUN curl https://cli-assets.heroku.com/install.sh | sh
