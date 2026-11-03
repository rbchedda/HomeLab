# Monitoring plan (not deployed)

Stack: Prometheus + Grafana + node-exporter + prometheus-pve-exporter, with Alertmanager for alerts. Uptime Kuma handles simple up/down checks. Compose file: [`configs/monitoring/docker-compose.yml`](../configs/monitoring/docker-compose.yml).

## Targets
- node-exporter on each Proxmox node (port 9100).
- pve-exporter (port 9221) using a **read-only** Proxmox API token (`PVE_TOKEN_*` in `.env`, role PVEAuditor).
- Uptime Kuma: ping, SSH (22) and 8006 on each node, plus HTTP for Homepage (3000) and Jellyfin.

## Thin pool alert
node-exporter has no LVM metrics, so a textfile collector cron on each node writes them:
```sh
# /usr/local/bin/lvm-thin-prom.sh, run every minute via cron
lvs --noheadings --units b -o vg_name,lv_name,data_percent,metadata_percent --select 'lv_attr=~^t' |
awk '{printf "lvm_thin_data_percent{vg=\"%s\",lv=\"%s\"} %s\nlvm_thin_meta_percent{vg=\"%s\",lv=\"%s\"} %s\n",$1,$2,$3,$1,$2,$4}' \
  > /var/lib/node_exporter/textfile/lvm.prom.$$ && mv /var/lib/node_exporter/textfile/lvm.prom.$$ /var/lib/node_exporter/textfile/lvm.prom
```
Rules are in `configs/monitoring/alerts.yml`: warning at 80%, critical at 90%, node down after 5 minutes.

## Alerts to Discord
Alertmanager sends alerts to a Discord channel with its native `discord_configs` receiver. The webhook URL is **never in git**: it is read from a file mounted into the container.
1. In Discord: Channel settings → Integrations → Webhooks → New webhook → Copy URL.
2. On the host, next to the compose file: `printf '%s' "$DISCORD_WEBHOOK_URL" > discord_webhook && chmod 600 discord_webhook` (`DISCORD_WEBHOOK_URL` comes from your local `.env`).
3. `docker compose up -d alertmanager`. The file is mounted at `/etc/alertmanager/discord_webhook` and is gitignored.
Treat the webhook URL like a password: anyone with it can post to the channel. If it leaks, delete it in Discord and make a new one.

## Screenshots
Put them in `docs/screenshots/` (for example `grafana-overview.png`, `uptime-kuma.png` and `homepage.png`). Blur any IPs, hostnames or tokens before committing.
