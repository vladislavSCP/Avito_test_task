import { Card, Tag, Space, Checkbox } from "antd";
import dayjs from "dayjs";
import type { Advertisement, AdStatus } from "../types";

const statusLabel: Record<AdStatus, string> = {
  pending: "На модерации",
  approved: "Одобрено",
  rejected: "Отклонено",
  draft: "На доработке",
};



export default function AdCard({
  ad,
  onOpen,
  showCheckbox,
  checked,
  onCheckedChange,
}: {
  ad: Advertisement;
  onOpen: () => void;
  showCheckbox?: boolean;
  checked?: boolean;
  onCheckedChange?: (next: boolean) => void;
}) {
  const img = ad.images?.[0] || "https://via.placeholder.com/300x200?text=Ad";

  return (
    <div style={{ position: "relative" }}>
      {showCheckbox && (
        <div
          style={{
            position: "absolute",
            zIndex: 2,
            top: 8,
            left: 8,
            background: "rgba(255,255,255,0.9)",
            borderRadius: 6,
            padding: "4px 6px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={!!checked}
            onChange={(e) => onCheckedChange?.(e.target.checked)}
          />
        </div>
      )}

      <Card
        hoverable
        cover={
          <img
            alt={ad.title}
            src={img}
            onError={(e) => {
              const ph = "https://via.placeholder.com/300x200?text=Ad";
              if (e.currentTarget.src !== ph) e.currentTarget.src = ph;
            }}
            style={{ height: 180, width: "100%", objectFit: "cover" }}
          />
        }
        onClick={onOpen}
      >
        <Space orientation="vertical" size={6} style={{ width: "100%" }}>
          <div style={{ fontWeight: 600 }}>{ad.title}</div>
          <div style={{ fontSize: 16 }}>{ad.price.toLocaleString()} ₽</div>
          <div style={{ color: "#777" }}>
            {ad.category} · {dayjs(ad.createdAt).format("DD.MM.YYYY")}
          </div>
          <Space wrap>
            <Tag>{statusLabel[ad.status]}</Tag>
            <Tag color={ad.priority === "urgent" ? "red" : "default"}>
              {ad.priority === "urgent" ? "Срочное" : "Обычное"}
            </Tag>
          </Space>
        </Space>
      </Card>
    </div>
  );
}
