# Why I'm moving media to a NAS

My movie library lived on a 136G thin volume on a hypervisor's local disk. When that pool filled up, it took down the whole node: SSH, the web UI and cluster membership.

**The problem with media on a hypervisor:**
- It grows without bound and competes with VM and container storage.
- One failed mount can block boot.
- Backups and redundancy are harder on a single mini PC disk.

**The plan:**
- Build a DIY NAS: a barebones PC filled with bulk hard drives (planned, not built yet). It serves media over NFS or SMB.
- Still deciding on the OS. Options I'm weighing:
  - **TrueNAS SCALE:** ZFS, strong data integrity, but likes matched drives and plenty of RAM.
  - **Unraid:** mix-and-match drive sizes and easy expansion; paid license.
  - **OpenMediaVault:** lightweight Debian-based, free, works well with mergerfs + SnapRAID.
- TODO: pick an OS and redundancy level (mirror, RAIDZ, or parity).
- Jellyfin mounts it with `nofail` so the NAS being down never blocks a node from booting.
- Hypervisor storage stays for VMs and containers only, with thin pool alerts at 80% and 90%.

Separating compute from bulk storage makes each easier to grow, back up and replace.
