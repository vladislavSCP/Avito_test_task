import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  Col,
  Row,
  Button,
  Space,
  Spin,
  Empty,
  Table,
  Tag,
  message,
} from "antd";
import dayjs from "dayjs";
import ModerationHistoryBlock from "../components/ModerationHistory";
import ReasonModal from "../components/ReasonModal";
import {
  fetchAd,
  fetchAds,
  approveAd,
  rejectAd,
  requestChangesAd,
} from "../api/ads";
import type { Advertisement, AdStatus, AdsListResponse } from "../types";



const statusLabel: Record<AdStatus, string> = {
  pending: "На модерации",
  approved: "Одобрено",
  rejected: "Отклонено",
  draft: "На доработке",
};

const placeholderImg = "https://via.placeholder.com/600x400?text=Ad";



export default function ItemPage() {



  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const queryClient = useQueryClient();

  const [reasonOpen, setReasonOpen] = useState<null | "reject" | "requestChanges">(null);

  const adQuery = useQuery<Advertisement>({
    queryKey: ["ad", id],
    queryFn: ({ signal }) => fetchAd(id!, signal),
  });

  const stateNav = location.state || {};
  const stateIds: number[] | null = stateNav.ids ?? null;
  const stateIndex: number | null = stateNav.index ?? null;

  const neighborsQuery = useQuery<AdsListResponse>({
    queryKey: ["neighbors", id],
    enabled: !stateIds,
    queryFn: ({ signal }) =>
      fetchAds({ page: 1, limit: 100, sortBy: "createdAt", sortOrder: "desc" }, signal),
    staleTime: 60_000,
  });

  const computedIds = useMemo(() => {
    if (stateIds && Array.isArray(stateIds)) return stateIds;
    return neighborsQuery.data?.ads.map((a) => a.id) ?? [];
  }, [stateIds, neighborsQuery.data]);

  const computedIndex = useMemo(() => {
    if (stateIndex !== null && stateIndex !== undefined) return stateIndex;
    const currentId = Number(id);
    return computedIds.indexOf(currentId);
  }, [stateIndex, computedIds, id]);

  const prevId = computedIndex > 0 ? computedIds[computedIndex - 1] : null;
  const nextId =
    computedIndex >= 0 && computedIndex < computedIds.length - 1
      ? computedIds[computedIndex + 1]
      : null;

  const goPrev = () => {
    if (!prevId) return;
    navigate(`/item/${prevId}`, {
      state: { ids: computedIds, index: computedIndex - 1 },
    });
  };

  const goNext = () => {
    if (!nextId) return;
    navigate(`/item/${nextId}`, {
      state: { ids: computedIds, index: computedIndex + 1 },
    });
  };

  const afterDecision = () => {
    if (nextId) {
      navigate(`/item/${nextId}`, {
        state: { ids: computedIds, index: computedIndex + 1 },
      });
      return;
    }
    navigate("/list");
  };

  const approveMutation = useMutation({
    mutationFn: () => approveAd(id!),
    onSuccess: () => {
      message.success("Объявление одобрено");
      queryClient.invalidateQueries({ queryKey: ["ad", id] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      afterDecision();
    },
    onError: () => message.error("Не удалось одобрить"),
  });

  const rejectMutation = useMutation({
    mutationFn: (payload: { reason: string; comment?: string }) =>
      rejectAd(id!, payload),
    onSuccess: () => {
      message.success("Объявление отклонено");
      setReasonOpen(null);
      queryClient.invalidateQueries({ queryKey: ["ad", id] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      afterDecision();
    },
    onError: () => message.error("Не удалось отклонить"),
  });

  const requestChangesMutation = useMutation({
    mutationFn: (payload: { reason: string; comment?: string }) =>
      requestChangesAd(id!, payload),
    onSuccess: () => {
      message.success("Отправлено на доработку");
      setReasonOpen(null);
      queryClient.invalidateQueries({ queryKey: ["ad", id] });
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      afterDecision();
    },
    onError: () => message.error("Не удалось отправить на доработку"),
  });

  const ad = adQuery.data;

  const images = useMemo(() => {
    const imgs = ad?.images || [];
    const filled = [...imgs];
    while (filled.length < 3) filled.push(placeholderImg);
    return filled.slice(0, 5);
  }, [ad]);

  const characteristicsData = useMemo(() => {
    const obj = ad?.characteristics || {};
    return Object.entries(obj).map(([key, value]) => ({
      key,
      name: key,
      value,
    }));
  }, [ad]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.key.toLowerCase() === "a") {
        if (!approveMutation.isPending) approveMutation.mutate();
      }

      if (e.key.toLowerCase() === "d") {
        setReasonOpen("reject");
      }

      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [prevId, nextId, approveMutation.isPending, computedIndex, computedIds]);

  if (adQuery.isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!ad) return <Empty description="Объявление не найдено" />;





  return (


    <div style={{ padding: 20, maxWidth: 1400, margin: "0 auto" }}>
      <Space style={{ marginBottom: 12 }}>
        <Button onClick={() => navigate("/list")}>К списку</Button>
        <Button onClick={goPrev} disabled={!prevId}>
          ← Пред
        </Button>
        <Button onClick={goNext} disabled={!nextId}>
          След →
        </Button>
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>

          <Card
            title={
              <Space wrap>
                <span>{ad.title}</span>
                <Tag>{statusLabel[ad.status]}</Tag>
                <Tag color={ad.priority === "urgent" ? "red" : "default"}>
                  {ad.priority === "urgent" ? "Срочное" : "Обычное"}
                </Tag>
              </Space>
            }
          >

            <Row gutter={[8, 8]}>
              {images.map((src, i) => (
                <Col span={8} key={`${src}-${i}`}>
                  <img
                    src={src}
                    alt={`img-${i}`}
                    onError={(e) => {
                      if (e.currentTarget.src !== placeholderImg) {
                        e.currentTarget.src = placeholderImg;
                      }
                    }}
                    style={{
                      width: "100%",
                      height: 160,
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <ModerationHistoryBlock items={ad.moderationHistory || []} />
        </Col>



        <Col xs={24} lg={14}>
          <Card title="Описание">
            <div style={{ marginBottom: 12, fontSize: 18 }}>
              {ad.price.toLocaleString()} ₽
            </div>
            <div style={{ color: "#666", marginBottom: 12 }}>
              {ad.category} · {dayjs(ad.createdAt).format("DD.MM.YYYY")}
            </div>
            <div>{ad.description}</div>
          </Card>

          <Card title="Характеристики" style={{ marginTop: 16 }}>
            <Table
              size="small"
              pagination={false}
              dataSource={characteristicsData}
              columns={[
                { title: "Параметр", dataIndex: "name", key: "name" },
                { title: "Значение", dataIndex: "value", key: "value" },
              ]}
              locale={{ emptyText: "Нет характеристик" }}
            />
          </Card>
        </Col>


        <Col xs={24} lg={10}>
          <Card title="Продавец">
            <Space orientation="vertical" size={6}>
              <div style={{ fontWeight: 600 }}>{ad.seller.name}</div>
              <div>Рейтинг: {ad.seller.rating}</div>
              <div>Объявлений: {ad.seller.totalAds}</div>
              <div>
                На сайте: {dayjs(ad.seller.registeredAt).format("DD.MM.YYYY")}
              </div>
            </Space>
          </Card>

          <Card style={{ marginTop: 16 }}>
            <Space wrap>
              <Button
                type="primary"
                onClick={() => approveMutation.mutate()}
                loading={approveMutation.isPending}
              >
                ✓ Одобрить (A)
              </Button>

              <Button
                danger
                onClick={() => setReasonOpen("reject")}
                loading={rejectMutation.isPending}
              >
                ✕ Отклонить (D)
              </Button>

              <Button
                onClick={() => setReasonOpen("requestChanges")}
                loading={requestChangesMutation.isPending}
              >
                ↺ Доработка
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      

      <ReasonModal
        open={reasonOpen === "reject"}
        mode="reject"
        onCancel={() => setReasonOpen(null)}
        onSubmit={(payload) => rejectMutation.mutate(payload)}
      />

      <ReasonModal
        open={reasonOpen === "requestChanges"}
        mode="requestChanges"
        onCancel={() => setReasonOpen(null)}
        onSubmit={(payload) => requestChangesMutation.mutate(payload)}
      />
    </div>


  );
}
