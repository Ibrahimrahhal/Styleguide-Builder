FROM node:14.17.6
COPY . /builder
WORKDIR /builder
RUN npm i
RUN npm run compile
WORKDIR /ui-products
CMD rm -rf /ui-products/.build && \
    cp -r /builder/dist/* /ui-products/.build && \
    node --max-old-space-size=8192 .build/core/install/index.js && \ 
    node --max-old-space-size=8192 .build/core/build/index.js
