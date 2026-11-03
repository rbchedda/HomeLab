# Architecture

All addresses are placeholders (`<LAN>.x`). Unknowns are marked TODO.

```mermaid
flowchart TB
  internet((Internet))
  remote([Phone / laptop off-site])
  remote -- WireGuard via Tailscale --> tsnet[Tailscale tailnet]
  internet --- router[Router / gateway TODO]
  router --- lan[Home LAN LAN.0/24]
  clients([LAN clients]) -. planned: DNS cutover .-> pihole[Pi-hole VM<br/>staged, not yet LAN DNS]
  pihole -- upstream DNS TODO --> internet
  subgraph cluster[Proxmox VE cluster: 3x Skull Canyon NUC + 1x Intel NUC, corosync quorum]
    n9[node1 LAN.9]
    n10[node2 LAN.10]
    n11[node3 LAN.11]
    subgraph node4[node4 LAN.12]
      lxc102[LXC 102: Jellyfin]
    end
    subgraph ctHost[CT 104 host: TODO node1-3]
      subgraph ct104[CT 104 'arr']
        ts104[Tailscale]
        hp[Homepage :3000]
        js[Jellyseerr]
        rd[Radarr]
        cdb[CouchDB / Obsidian LiveSync]
      end
    end
  end
  lan --- cluster
  tsnet --> ts104
  js -- requests --> rd
  js -- library --> lxc102
  hp -. status tiles .-> lxc102
  hp -. status tiles .-> js
  nas[(Planned DIY NAS<br/>barebones PC + HDDs)] -. media share .-> lxc102
```

## Node to service map
| Node | IP | Workloads |
|---|---|---|
| node1 | <LAN>.9 | TODO |
| node2 | <LAN>.10 | TODO |
| node3 | <LAN>.11 | TODO |
| node4 | <LAN>.12 | LXC 102 Jellyfin |
| TODO (one of node1-3) | - | CT 104 'arr': Homepage, Jellyseerr, Radarr, CouchDB, Tailscale |

## Flows
- **DNS:** Pi-hole is deployed in a VM (TODO: which node) but is not yet the LAN's DNS server. Planned: point the router's DHCP DNS at Pi-hole (upstream TODO).
- **Remote access:** Tailscale only. No router ports are forwarded; there are no inbound ports from the internet.
- **Media:** Jellyseerr → Radarr → library → Jellyfin. Media storage will move to a planned DIY NAS.

## Hardware
3x Intel NUC "Skull Canyon" + 1x standard Intel NUC. TODO: map nodes to hardware.
