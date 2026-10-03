FROM node:24-alpine
WORKDIR /srv/yordam
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8000
COPY --chown=node:node package.json server.js gemini.js cors.js ./
USER node
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
