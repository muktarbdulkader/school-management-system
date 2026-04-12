FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json .

RUN npm install apexcharts@latest react-apexcharts@latest --legacy-peer-deps
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build --force

# Stage 2: Setup the Nginx Server to serve the React Application
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
