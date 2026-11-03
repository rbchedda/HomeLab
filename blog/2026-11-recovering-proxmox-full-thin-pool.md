# Recovering a Proxmox node from a full thin pool

One of my nodes, node4, still answered ping but refused SSH and the web UI, and it dropped out of the cluster. That combination usually means the kernel is up but userspace never finished booting.

At the console it was in **emergency mode**. The media volume `/srv/media` had timed out at boot. Since the fstab entry had no `nofail`, systemd stopped before networking and SSH came up.

**Diagnosis:**
1. I commented out the fstab line and rebooted, which got SSH back.
2. `lvs` showed the volume was inactive and the `pve/data` thin pool was 95.77% full. It was also overcommitted: 166G provisioned on a 137G pool.
3. `lvchange -ay` activated the volume cleanly. `fsck -n`, which only reads, showed the usual unclean-shutdown errors.

**Fix:** I'm moving media to a NAS anyway, so I removed the volume, its LXC mount, the fstab entry and the NFS export. The pool dropped to 4.46% and the cluster went back to 4/4 quorate.

**Lessons:** don't overcommit thin pools without alerts, add `nofail` to data mounts, and monitor for nodes that ping but don't serve. Full write-up: [postmortem](../incidents/2026-11-node4-thin-pool.md).
