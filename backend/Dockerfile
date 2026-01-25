FROM denoland/deno:alpine

WORKDIR /app

COPY deno.json deno.lock* ./

RUN deno install

COPY . .

RUN deno cache src/index.ts

CMD ["deno", "run", "-A", "src/index.ts"]
