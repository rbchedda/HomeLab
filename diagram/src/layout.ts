// Home network map. Proxmox inventory verified 2026-11-03.
// Addresses use the repo placeholder `<LAN>.x` — never a real prefix.

export type IconName = "printer" | "pc" | "ap" | "switch" | "router";

export type Guest = {
  id: string;
  kind: "VM" | "LXC";
  vmid: number;
  name: string;
  resources?: string;
  services?: string[];
};

export type HostSpec = {
  id: string;
  nodeId: number;
  name: string;
  ip: string;
  model: string;
  cpu: string;
  ram: string;
  disk: string;
  note?: string;
  guests: Guest[];
};

export type FlowNode = {
  id: string;
  type: "room" | "device" | "host" | "guest";
  parentId?: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  data: Record<string, unknown>;
  draggable?: boolean;
  zIndex: number;
};

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
};

const DEVICE_H = 76;
const HOST_PAD_X = 12;
const GUEST_W_TWO_COL = 236;
const GUEST_W_ONE_COL = 280;
const COL_GAP = 10;
const ROW_GAP = 8;
const GUEST_TOP_GAP = 8;
const HOST_PAD_B = 12;

/**
 * Matches `.host-header` in styles.css: 10+8 padding, 26px title,
 * four 16px spec lines, plus the 1px border (border-box).
 */
export function headerHeight(noteLineCount: number): number {
  return 112 + noteLineCount * 16;
}

/** Matches `.guest` padding, 1px border, and 16px lines in styles.css. */
export function guestHeight(guest: Guest): number {
  let lines = 1;
  if (guest.resources) lines += 1;
  lines += guest.services?.length ?? 0;
  return Math.max(42, 18 + lines * 16);
}

function noteLineCount(note: string | undefined, hostWidth: number): number {
  if (!note) return 0;
  const textWidth = hostWidth - 24;
  const charsPerLine = Math.max(12, Math.floor(textWidth / 6.5));
  return Math.max(1, Math.ceil(note.length / charsPerLine));
}

const hosts: HostSpec[] = [
  {
    id: "host-1",
    nodeId: 1,
    name: "homelab",
    ip: "<LAN>.10",
    model: "Intel NUC6i7KYK",
    cpu: "i7-6770HQ",
    ram: "32 GB",
    disk: "Samsung 970 EVO Plus 250 GB NVMe",
    guests: [
      {
        id: "guest-100",
        kind: "VM",
        vmid: 100,
        name: "minecraftserver",
        resources: "4 cores · 10 GB RAM",
      },
      {
        id: "guest-112",
        kind: "LXC",
        vmid: 112,
        name: "monitor",
        resources: "2c · 2 GB RAM · 16 GB disk",
        services: [
          "Prometheus",
          "Alertmanager (Discord alerts)",
          "Grafana",
          "Uptime Kuma",
          "pve-exporter",
        ],
      },
    ],
  },
  {
    id: "host-2",
    nodeId: 2,
    name: "sc2",
    ip: "<LAN>.11",
    model: "NUC6i7KYK class",
    cpu: "i7-6770HQ",
    ram: "32 GB",
    disk: "Samsung 960 EVO 250 GB NVMe",
    guests: [
      {
        id: "guest-101",
        kind: "LXC",
        vmid: 101,
        name: "immich",
        resources: "4c · 8 GB RAM · 125 GB disk",
      },
    ],
  },
  {
    id: "host-3",
    nodeId: 3,
    name: "sc3",
    ip: "<LAN>.12",
    model: "Intel NUC6i7KYK",
    cpu: "i7-6770HQ",
    ram: "32 GB",
    disk: "Samsung 970 EVO Plus 250 GB NVMe",
    note: "Movie disk /srv/media was removed. Media will move to a NAS later.",
    guests: [
      {
        id: "guest-102",
        kind: "LXC",
        vmid: 102,
        name: "jellyfin",
        resources: "2c · 2 GB RAM · 30 GB disk",
      },
    ],
  },
  {
    id: "host-4",
    nodeId: 4,
    name: "sc4",
    ip: "<LAN>.9",
    model: "Intel NUC7i5BNK",
    cpu: "i5-7260U",
    ram: "32 GB",
    disk: "Transcend 250 GB SATA SSD",
    guests: [
      { id: "guest-103", kind: "LXC", vmid: 103, name: "pihole" },
      { id: "guest-104", kind: "LXC", vmid: 104, name: "arr" },
      { id: "guest-105", kind: "LXC", vmid: 105, name: "obsidian-sync" },
      { id: "guest-106", kind: "LXC", vmid: 106, name: "homepage" },
      {
        id: "guest-107",
        kind: "LXC",
        vmid: 107,
        name: "monitoring",
        services: ["Jellystat", "legacy Uptime Kuma"],
      },
      { id: "guest-108", kind: "LXC", vmid: 108, name: "torrent" },
      { id: "guest-109", kind: "LXC", vmid: 109, name: "rustdesk" },
      { id: "guest-110", kind: "LXC", vmid: 110, name: "prowlarr" },
      {
        id: "guest-111",
        kind: "LXC",
        vmid: 111,
        name: "docker",
        services: ["FlareSolverr"],
      },
    ],
  },
];

type PlacedGuest = Guest & { x: number; y: number; width: number; height: number };

function placeHost(host: HostSpec): {
  width: number;
  height: number;
  headerH: number;
  guests: PlacedGuest[];
} {
  const cols = host.guests.length > 2 ? 2 : host.guests.length;
  const guestW = cols === 2 ? GUEST_W_TWO_COL : GUEST_W_ONE_COL;
  const width = HOST_PAD_X * 2 + cols * guestW + (cols - 1) * COL_GAP;
  const headerH = headerHeight(noteLineCount(host.note, width));
  const heights = host.guests.map(guestHeight);
  const rows = Math.ceil(host.guests.length / cols);
  let y = headerH + GUEST_TOP_GAP;
  const guests: PlacedGuest[] = [];
  for (let row = 0; row < rows; row++) {
    let rowH = 0;
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col;
      if (index < heights.length) rowH = Math.max(rowH, heights[index]);
    }
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col;
      if (index >= host.guests.length) break;
      guests.push({
        ...host.guests[index],
        x: HOST_PAD_X + col * (guestW + COL_GAP),
        y,
        width: guestW,
        height: heights[index],
      });
    }
    y += rowH + ROW_GAP;
  }
  const height = y - ROW_GAP + HOST_PAD_B;
  return { width, height, headerH, guests };
}

function device(
  id: string,
  parentId: string,
  label: string,
  icon: IconName,
  x: number,
  y: number,
  width: number,
): FlowNode {
  return {
    id,
    type: "device",
    parentId,
    position: { x, y },
    width,
    height: DEVICE_H,
    zIndex: 2,
    data: { label, icon },
  };
}

function roomBox(
  id: string,
  label: string,
  children: FlowNode[],
  position: { x: number; y: number },
  pad: { right: number; bottom: number },
  subtitle?: string,
): FlowNode {
  let maxX = 0;
  let maxY = 0;
  for (const child of children) {
    if (child.parentId !== id) continue;
    maxX = Math.max(maxX, child.position.x + child.width);
    maxY = Math.max(maxY, child.position.y + child.height);
  }
  return {
    id,
    type: "room",
    position,
    width: maxX + pad.right,
    height: maxY + pad.bottom,
    zIndex: 0,
    data: { label, subtitle },
  };
}

const upstairsDevices: FlowNode[] = [
  device("printer", "upstairs", "3d printer", "printer", 24, 46, 140),
  device("omarchy", "upstairs", "Omarchy PC", "pc", 250, 46, 148),
  device("windows", "upstairs", "Windows PC", "pc", 20, 188, 148),
  device("ap-office", "upstairs", "Wireless AP", "ap", 250, 188, 148),
  device("switch-office", "upstairs", "office switch", "switch", 140, 330, 156),
];

const firstFloorDevices: FlowNode[] = [
  device("tv-bed", "first", "Bedroom TV", "pc", 24, 46, 144),
  device("tv-living", "first", "Living Room TV", "pc", 188, 46, 164),
  device("bazzite", "first", "Living Room Bazzite PC", "pc", 372, 46, 196),
  device("ap-first", "first", "Wireless AP", "ap", 24, 188, 148),
];

const upstairs = roomBox("upstairs", "Upstairs Office", upstairsDevices, { x: 0, y: 0 }, { right: 24, bottom: 20 });
const firstFloor = roomBox(
  "first",
  "First Floor",
  firstFloorDevices,
  { x: upstairs.width + 40, y: 64 },
  { right: 24, bottom: 20 },
);

const placedHosts = hosts.map(placeHost);
const HOST_GAP = 16;
const ROUTER_W = 132;
const SWITCH_W = 168;
const BASE_LEFT = 16;
const hostsOriginX = BASE_LEFT + ROUTER_W + 20;
let cursorX = hostsOriginX;
const hostPositions = placedHosts.map((placed) => {
  const x = cursorX;
  cursorX += placed.width + HOST_GAP;
  return x;
});
const hostsRight = cursorX - HOST_GAP;
const switchX = Math.round((hostsOriginX + hostsRight) / 2 - SWITCH_W / 2);
const switchY = 52;
const hostY = switchY + DEVICE_H + 56;

const basementChildren: FlowNode[] = [
  device("switch-basement", "basement", "basement switch", "switch", switchX, switchY, SWITCH_W),
  device("router", "basement", "Router", "router", BASE_LEFT, hostY, ROUTER_W),
];

const hostNodes: FlowNode[] = hosts.map((host, index) => {
  const placed = placedHosts[index];
  return {
    id: host.id,
    type: "host",
    parentId: "basement",
    position: { x: hostPositions[index], y: hostY },
    width: placed.width,
    height: placed.height,
    zIndex: 2,
    data: {
      nodeId: host.nodeId,
      name: host.name,
      ip: host.ip,
      model: host.model,
      cpu: host.cpu,
      ram: host.ram,
      disk: host.disk,
      note: host.note,
      headerHeight: placed.headerH,
    },
  };
});

const guestNodes: FlowNode[] = hosts.flatMap((host, index) =>
  placedHosts[index].guests.map((guest) => ({
    id: guest.id,
    type: "guest" as const,
    parentId: host.id,
    position: { x: guest.x, y: guest.y },
    width: guest.width,
    height: guest.height,
    zIndex: 3,
    draggable: false,
    data: {
      kind: guest.kind,
      vmid: guest.vmid,
      name: guest.name,
      resources: guest.resources,
      services: guest.services,
    },
  })),
);

const basementKids = [...basementChildren, ...hostNodes];
const basement = roomBox(
  "basement",
  "Basement",
  basementKids,
  { x: 0, y: Math.max(upstairs.height, firstFloor.position.y + firstFloor.height) + 40 },
  { right: 16, bottom: 16 },
  "Proxmox VE cluster",
);

export const flowNodes: FlowNode[] = [
  upstairs,
  firstFloor,
  basement,
  ...upstairsDevices,
  ...firstFloorDevices,
  ...basementChildren,
  ...hostNodes,
  ...guestNodes,
];

const links: Array<[string, string]> = [
  ["printer", "ap-office"],
  ["omarchy", "ap-office"],
  ["windows", "switch-office"],
  ["ap-office", "switch-office"],
  ["switch-office", "switch-basement"],
  ["tv-bed", "ap-first"],
  ["tv-living", "ap-first"],
  ["bazzite", "ap-first"],
  ["ap-first", "switch-basement"],
  ["switch-basement", "router"],
  ["switch-basement", "host-1"],
  ["switch-basement", "host-2"],
  ["switch-basement", "host-3"],
  ["switch-basement", "host-4"],
];

export const flowEdges: FlowEdge[] = links.map(([source, target]) => ({
  id: `${source}->${target}`,
  source,
  target,
}));

export const inventoryHosts = hosts;
