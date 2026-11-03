# Changelog
## 2026-11-03
- Confirmed remote access is Tailscale-only with no router port forwards.
- Renamed nodes to generic node1-node4 (incident node is node4); incident file renamed to `incidents/2026-11-node4-thin-pool.md`.
- Documented hardware: 3x Intel NUC "Skull Canyon" + 1x standard Intel NUC.
- Pi-hole described accurately: running in a VM, staged; LAN DNS cutover on the roadmap.
- NAS plan: DIY barebones PC with bulk hard drives; OS options (TrueNAS/Unraid/OMV) under consideration.
- Monitoring draft: Alertmanager now routes to Discord via `discord_configs` with a gitignored webhook file.
## 2026-11-02
- Added README, architecture doc, monitoring plan (not deployed), first postmortem and blog posts.
- node4: removed the media volume `vm-102-disk-1`, its LXC 102 mount, the fstab entry and the NFS export; pool 95.77% → 4.46%; cluster 4/4 quorate.
- Repo security: gitleaks pre-commit hook, `.gitignore` and `.env.example`.
## 2026-10-22 (approx.)
- node4 outage begins (see incidents/2026-11-node4-thin-pool.md).
## 2026-02-01
- Repo created.
