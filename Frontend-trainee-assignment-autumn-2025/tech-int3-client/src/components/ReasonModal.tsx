import { Modal, Radio, Input, Space } from "antd";
import { useEffect, useState } from "react";




const templates = [
  "Запрещённый товар",
  "Неверная категория",
  "Некорректное описание",
  "Проблемы с фото",
  "Подозрение на мошенничество",
  "Другое",
];




export default function ReasonModal({
  open,
  mode,
  onCancel,
  onSubmit,
}: {
  open: boolean;
  mode: "reject" | "requestChanges";
  onCancel: () => void;
  onSubmit: (payload: { reason: string; comment?: string }) => void;
}) {
  const [reason, setReason] = useState<string | null>(null);
  const [other, setOther] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!open) {
      setReason(null);
      setOther("");
      setComment("");
    }
  }, [open]);

  const isOther = reason === "Другое";
  const finalReason = isOther ? other.trim() : reason || "";
  const canSubmit = finalReason.length > 0;

  return (
    <Modal
      open={open}
      title={mode === "reject" ? "Отклонение" : "Вернуть на доработку"}
      okText="Отправить"
      cancelText="Отмена"
      onCancel={onCancel}
      onOk={() => onSubmit({ reason: finalReason, comment: comment.trim() || undefined })}
      okButtonProps={{ disabled: !canSubmit }}
    >
      <Space direction="vertical" style={{ width: "100%" }} size={12}>
        <Radio.Group
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          <Space direction="vertical">
            {templates.map((t) => (
              <Radio key={t} value={t}>
                {t}
              </Radio>
            ))}
          </Space>
        </Radio.Group>

        {isOther && (
          <Input.TextArea
            rows={3}
            placeholder="Укажи причину"
            value={other}
            onChange={(e) => setOther(e.target.value)}
          />
        )}

        <Input.TextArea
          rows={3}
          placeholder="Комментарий (необязательно)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </Space>
    </Modal>
  );
}
