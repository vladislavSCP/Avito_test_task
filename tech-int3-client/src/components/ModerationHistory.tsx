import { Card, Tag } from "antd";
import dayjs from "dayjs";
import type { ModerationHistory } from "../types";

const actionLabel: Record<string, string> = {
  approved: "Одобрено",
  rejected: "Отклонено",
  requestChanges: "На доработку",
};



const actionColor: Record<string, string> = {
  approved: "green",
  rejected: "red",
  requestChanges: "gold",
};



export default function ModerationHistoryBlock({
  items,
  height = 360,
}: {
  items: ModerationHistory[];
  height?: number;
}) {
  return (
    <Card title="История модерации" size="small">
      <div style={{ maxHeight: height, overflowY: "auto", paddingRight: 6 }}>
        {items.length === 0 && (
          <div style={{ color: "#777" }}>Истории пока нет</div>
        )}

        {items.map((it) => (
          <div
            key={it.id}
            style={{
              padding: "8px 0",
              borderBottom: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Tag color={actionColor[it.action] || "default"}>
                {actionLabel[it.action] || it.action}
              </Tag>
              <span>{it.moderatorName}</span>
            </div>

            <div style={{ color: "#666", marginTop: 4 }}>
              {dayjs(it.timestamp).format("DD.MM.YYYY HH:mm")}
              {it.reason ? ` · ${it.reason}` : ""}
              {it.comment ? ` · ${it.comment}` : ""}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
