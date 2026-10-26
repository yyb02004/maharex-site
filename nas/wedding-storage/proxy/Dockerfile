FROM caddy:2.11.7-alpine

USER 0:0
ENV XDG_DATA_HOME=/data XDG_CONFIG_HOME=/config
RUN apk add --no-cache acl \
    && addgroup -g 10001 wedding \
    && adduser -D -H -u 10001 -G wedding wedding
COPY proxy/Caddyfile /tmp/wedding-proxy-source/Caddyfile
# Normalize only image paths. The NAS shares and existing volumes are untouched.
# The official image grants low-port capability; port 8443 needs none.
RUN setcap -r /usr/bin/caddy \
    && setfacl -b /etc/caddy /etc/caddy/Caddyfile /usr/bin/caddy /data /data/caddy /config /config/caddy \
    && setfacl -k /etc/caddy /data /data/caddy /config /config/caddy \
    && rm -f /etc/caddy/Caddyfile \
    && cat /tmp/wedding-proxy-source/Caddyfile > /etc/caddy/Caddyfile \
    && setfacl -b /etc/caddy/Caddyfile \
    && chown 10001:10001 /etc/caddy /etc/caddy/Caddyfile /usr/bin/caddy /data /data/caddy /config /config/caddy \
    && chmod 0555 /etc/caddy /usr/bin/caddy \
    && chmod 0444 /etc/caddy/Caddyfile \
    && chmod 0700 /data /data/caddy /config /config/caddy \
    && rm -f /tmp/wedding-proxy-source/Caddyfile \
    && rmdir /tmp/wedding-proxy-source
USER 10001:10001
# validate provisions configuration but does not run servers or issue certificates.
RUN test "$(id -u)" = 10001 \
    && test -r /etc/caddy/Caddyfile \
    && touch /data/.permission-check /config/.permission-check \
    && rm /data/.permission-check /config/.permission-check \
    && caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
EXPOSE 8443/tcp
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
