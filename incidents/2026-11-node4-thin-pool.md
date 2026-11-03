# Postmortem: node4 unreachable — LVM thin pool overcommitted

**Dates:** ~2026-10-22 to 2026-11-02 · **Severity:** one node down, media service unavailable · **Status:** resolved

## Summary
Node node4 (<LAN>.12) answered ping but refused SSH and the Proxmox UI (8006) and dropped out of the cluster. At the console it was in systemd emergency mode: the media volume `vm-102-disk-1` (`/srv/media`, 136G) timed out at boot. The `pve/data` thin pool (137G) was 95.77% full while overcommitted (30G + 136G provisioned = 166G).

## Timeline
| Date | Event |
|---|---|
| ~Oct 22 | node4 stops responding to SSH/8006; still pings; leaves cluster quorum |
| Oct 23 | Remote checks confirm SSH and web UI refused |
| Nov 2 | Console: emergency mode, `/srv/media` mount timeout |
| Nov 2 | `/srv/media` commented out of fstab → node boots, SSH restored |
| Nov 2 | `lvs`: `vm-102-disk-1` inactive; pool 95.77%, overcommitted |
| Nov 2 | `lvchange -ay` succeeds; `fsck -n` shows unclean-shutdown errors |
| Nov 2 | Decision: delete media volume (media moving to a NAS) |
| Nov 2 | Volume removed, LXC mount / fstab / NFS export cleaned; pool 4.46%; cluster 4/4 quorate |

## Root cause
The thin pool was provisioned beyond physical capacity. As media grew, the pool approached full; after an unclean shutdown the thin volume failed to activate in time. Because `/srv/media` was a hard (non-`nofail`) fstab mount, systemd dropped to emergency mode **before networking and SSH started**, making the node look "alive but unreachable."

## Resolution
1. Console login; commented the fstab entry; rebooted to restore access.
2. Activated and inspected the volume read-only (`lvchange -ay`, `fsck -n`).
3. Removed `vm-102-disk-1`, its LXC 102 mount point, fstab entry and NFS export.
4. Verified pool usage (4.46%) and cluster quorum (4/4).

## What went well / poorly
- ✅ Console diagnosis was quick once a screen was attached; data was confirmed intact before deletion.
- ❌ No alerting on thin pool usage; outage went unnoticed for ~10 days.
- ❌ A non-critical data mount could block boot.

## Prevention
- [ ] **Monitor thin pools:** alert at 80% / 90% on `data_percent` and `metadata_percent` via Prometheus + Alertmanager → Discord (drafted in `configs/monitoring/`, not deployed).
- [ ] **No overcommit:** total provisioned ≤ pool size, or set `thin_pool_autoextend_threshold` with free VG space.
- [ ] **`nofail,x-systemd.device-timeout=10s`** on all non-root data mounts.
- [ ] Media moved to a planned DIY NAS (barebones PC + bulk HDDs), off hypervisor local storage.
- [ ] Node-down alert (e.g. Uptime Kuma on 8006/SSH).
