FROM ubuntu:20.04

RUN apt update && apt install -y wget unzip gcc sudo curl
RUN wget -q -O - https://github.com/metrico/metrico.github.io/raw/main/libchdb_installer.sh | sudo bash 
RUN apt install -y libchdb

RUN curl -fsSL https://bun.sh/install | sudo bash \
 && ln -s $HOME/.bun/bin/bun /usr/local/bin/bun

COPY . /app
WORKDIR /app
RUN bun run build
RUN bun install

RUN mkdir -p .chdb_data

EXPOSE 8123
CMD [ "bun", "run", "server.ts" ]
