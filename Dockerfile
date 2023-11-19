FROM alpine as builder

RUN apk add --no-cache wget
RUN wget https://github.com/metrico/libchdb/releases/latest/download/libchdb.zip \
 && unzip libchdb.zip \
 && mv libchdb.so /libchdb.so


FROM oven/bun:latest

RUN mkdir -p /usr/lib/
COPY --from=builder /libchdb.so /usr/lib/libchdb.so

COPY . /app
WORKDIR /app
RUN rm -rf package-lock.json
RUN bun install

EXPOSE 8123
CMD [ "bun", "run", "server.js" ]
