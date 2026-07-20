# Static site — nginx serves HTML, JS, CSV, SEO files, and img/
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html 404.html app.js shows.csv robots.txt sitemap.xml /usr/share/nginx/html/
COPY img/ /usr/share/nginx/html/img/
COPY press/ /usr/share/nginx/html/press/

EXPOSE 80
