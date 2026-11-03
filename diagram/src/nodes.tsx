import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Cable, Monitor, Printer, Router, Wifi } from "lucide-react";
import type { IconName } from "./layout";

function DeviceIcon({ name }: { name: IconName }) {
  const color = name === "printer" ? "#111827" : "#2563eb";
  const props = { size: 22, color, strokeWidth: 1.75, "aria-hidden": true };
  switch (name) {
    case "printer":
      return <Printer {...props} />;
    case "pc":
      return <Monitor {...props} />;
    case "ap":
      return <Wifi {...props} />;
    case "switch":
      return <Cable {...props} />;
    case "router":
      return <Router {...props} />;
  }
}

export function RoomNode({ data }: NodeProps) {
  const label = String(data.label ?? "");
  const subtitle = data.subtitle ? String(data.subtitle) : "";
  return (
    <div className="room">
      <div className="room-label">{label}</div>
      {subtitle ? <div className="room-sub">{subtitle}</div> : null}
    </div>
  );
}

export function DeviceNode({ data }: NodeProps) {
  const label = String(data.label ?? "");
  const icon = data.icon as IconName;
  return (
    <div className="device">
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <DeviceIcon name={icon} />
      <span>{label}</span>
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </div>
  );
}

export function HostNode({ data }: NodeProps) {
  const headerHeight = Number(data.headerHeight ?? 108);
  return (
    <div className="host">
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <div className="host-header" style={{ height: headerHeight }}>
        <div className="host-title">
          <span className="node-kicker">node {String(data.nodeId)}</span>
          <span className="host-name">{String(data.name)}</span>
          <span className="host-ip">{String(data.ip)}</span>
        </div>
        <div className="host-line">{String(data.model)}</div>
        <div className="host-line">
          {String(data.cpu)} · {String(data.ram)} RAM
        </div>
        <div className="host-line">{String(data.disk)}</div>
        <div className="host-line host-exporter">node_exporter</div>
        {data.note ? <div className="host-note">{String(data.note)}</div> : null}
      </div>
    </div>
  );
}

export function GuestNode({ data }: NodeProps) {
  const kind = String(data.kind ?? "");
  const services = Array.isArray(data.services) ? data.services.map(String) : [];
  return (
    <div className="guest">
      <div className="guest-title">
        <span className={kind === "VM" ? "kind kind-vm" : "kind kind-lxc"}>{kind}</span>
        <span>
          {String(data.vmid)} {String(data.name)}
        </span>
      </div>
      {data.resources ? <div className="guest-meta">{String(data.resources)}</div> : null}
      {services.map((service) => (
        <div className="guest-svc" key={service}>
          {service}
        </div>
      ))}
    </div>
  );
}

export const nodeTypes = {
  room: RoomNode,
  device: DeviceNode,
  host: HostNode,
  guest: GuestNode,
};
