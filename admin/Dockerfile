FROM node:22-alpine
WORKDIR /app
COPY package.json etats.mjs server.mjs vues.mjs ./
RUN mkdir -p /data && chown node:node /data
USER node
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/admin/sante || exit 1
CMD ["node", "server.mjs"]
