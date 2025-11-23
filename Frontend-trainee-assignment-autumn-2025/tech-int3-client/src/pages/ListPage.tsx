import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  Col,
  Row,
  Select,
  Input,
  InputNumber,
  Button,
  Pagination,
  Spin,
  Empty,
  Space,
  message,
  type InputRef,
} from "antd";
import { useNavigate, useSearchParams } from "react-router-dom";
import AdCard from "../components/AdCard";
import ReasonModal from "../components/ReasonModal";
import { approveAd, fetchAds, rejectAd } from "../api/ads";
import type { AdStatus, AdsListResponse } from "../types";

const statusOptions: { value: AdStatus; label: string }[] = [
  { value: "pending", label: "На модерации" },
  { value: "approved", label: "Одобрено" },
  { value: "rejected", label: "Отклонено" },
  { value: "draft", label: "На доработке" },
];

export default function ListPage() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const queryClient = useQueryClient();
  const searchRef = useRef<InputRef>(null);



  const [page, setPage] = useState<number>(Number(sp.get("page")) || 1);
  const [status, setStatus] = useState<AdStatus[]>(
    (sp.getAll("status") as AdStatus[]) || []
  );
  const [categoryId, setCategoryId] = useState<number | undefined>(() => {
    const v = sp.get("categoryId");
    return v ? Number(v) : undefined;
  });
  const [minPrice, setMinPrice] = useState<number | undefined>(() => {
    const v = sp.get("minPrice");
    return v ? Number(v) : undefined;
  });
  const [maxPrice, setMaxPrice] = useState<number | undefined>(() => {
    const v = sp.get("maxPrice");
    return v ? Number(v) : undefined;
  });
  const [search, setSearch] = useState<string>(sp.get("search") || "");
  const [sortBy, setSortBy] = useState<"createdAt" | "price" | "priority">(
    (sp.get("sortBy") as any) || "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (sp.get("sortOrder") as any) || "desc"
  );





  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      status: status.length ? status : undefined,
      categoryId,
      minPrice,
      maxPrice,
      search: search.trim() || undefined,
      sortBy,
      sortOrder,
    }),
    [page, status, categoryId, minPrice, maxPrice, search, sortBy, sortOrder]
  );

  useEffect(() => {
    const next = new URLSearchParams();
    next.set("page", String(page));
    status.forEach((s) => next.append("status", s));
    if (categoryId !== undefined) next.set("categoryId", String(categoryId));
    if (minPrice !== undefined) next.set("minPrice", String(minPrice));
    if (maxPrice !== undefined) next.set("maxPrice", String(maxPrice));
    if (search.trim()) next.set("search", search.trim());
    if (sortBy) next.set("sortBy", sortBy);
    if (sortOrder) next.set("sortOrder", sortOrder);
    setSp(next, { replace: true });
  }, [
    page,
    status,
    categoryId,
    minPrice,
    maxPrice,
    search,
    sortBy,
    sortOrder,
    setSp,
  ]);




  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);







  const adsQuery = useQuery<AdsListResponse>({
    queryKey: ["ads", params],
    queryFn: ({ signal }) => fetchAds(params, signal),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const categoriesQuery = useQuery<AdsListResponse>({
    queryKey: ["categoriesSeed"],
    queryFn: ({ signal }) =>
      fetchAds({ page: 1, limit: 100, sortBy: "createdAt", sortOrder: "desc" }, signal),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const categoryOptions = useMemo(() => {
    const ads = categoriesQuery.data?.ads ?? [];
    const map = new Map<number, string>();
    ads.forEach((a) => map.set(a.categoryId, a.category));
    return Array.from(map.entries()).map(([id, name]) => ({
      value: id,
      label: name,
    }));
  }, [categoriesQuery.data]);

  const resetFilters = () => {
    setPage(1);
    setStatus([]);
    setCategoryId(undefined);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setSearch("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setSelectedIds(new Set());
  };


  const idsOnPage = useMemo(() => adsQuery.data?.ads.map((a) => a.id) ?? [], [adsQuery.data]);



  const toggleSelect = (id: number, next: boolean) => {
    setSelectedIds((prev) => {
      const s = new Set(prev);
      if (next) s.add(id);
      else s.delete(id);
      return s;
    });
  };



  const clearSelection = () => setSelectedIds(new Set());



  const bulkApproveMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      for (const id of ids) {
        await approveAd(id);
      }
    },
    onSuccess: () => {
      message.success("Выбранные объявления одобрены");
      clearSelection();
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
    onError: () => message.error("Не удалось одобрить выбранные объявления"),
  });



  const bulkRejectMutation = useMutation({
    mutationFn: async ({
      ids,
      reason,
      comment,
    }: {
      ids: number[];
      reason: string;
      comment?: string;
    }) => {
      for (const id of ids) {
        await rejectAd(id, { reason, comment });
      }
    },
    onSuccess: () => {
      message.success("Выбранные объявления отклонены");
      setBulkRejectOpen(false);
      clearSelection();
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
    onError: () => message.error("Не удалось отклонить выбранные объявления"),
  });

  const openItem = (index: number) => {
    const list = adsQuery.data?.ads ?? [];
    const current = list[index];
    if (!current) return;

    navigate(`/item/${current.id}`, {
      state: {
        ids: list.map((a) => a.id),
        index,
      },
    });
  };

  const selectedCount = selectedIds.size;
  const selectedArray = Array.from(selectedIds);





  return (
    <div style={{ padding: 20, maxWidth: 1400, margin: "0 auto" }}>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={6}>
            <Select
              mode="multiple"
              allowClear
              placeholder="Статус"
              options={statusOptions}
              value={status}
              onChange={(v) => {
                setPage(1);
                setStatus(v);
                clearSelection();
              }}
              style={{ width: "100%" }}
            />
          </Col>

          <Col xs={24} md={6}>
            <Select
              allowClear
              placeholder="Категория"
              options={categoryOptions}
              loading={categoriesQuery.isLoading}
              value={categoryId}
              onChange={(v) => {
                setPage(1);
                setCategoryId(v);
                clearSelection();
              }}
              style={{ width: "100%" }}
            />
          </Col>

          <Col xs={12} md={3}>
            <InputNumber
              placeholder="Мин. цена"
              value={minPrice}
              min={0}
              onChange={(v) => {
                setPage(1);
                setMinPrice(v ?? undefined);
                clearSelection();
              }}
              style={{ width: "100%" }}
            />
          </Col>

          <Col xs={12} md={3}>
            <InputNumber
              placeholder="Макс. цена"
              value={maxPrice}
              min={0}
              onChange={(v) => {
                setPage(1);
                setMaxPrice(v ?? undefined);
                clearSelection();
              }}
              style={{ width: "100%" }}
            />
          </Col>

          <Col xs={24} md={6}>
            <Input
              ref={searchRef}
              placeholder="Поиск по названию ( / )"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
                clearSelection();
              }}
              allowClear
            />
          </Col>

          <Col xs={12} md={4}>
            <Select
              value={`${sortBy}:${sortOrder}`}
              onChange={(v) => {
                const [sb, so] = v.split(":") as [
                  "createdAt" | "price" | "priority",
                  "asc" | "desc"
                ];
                setPage(1);
                setSortBy(sb);
                setSortOrder(so);
                clearSelection();
              }}
              style={{ width: "100%" }}
              options={[
                { value: "createdAt:desc", label: "Дата: новые" },
                { value: "createdAt:asc", label: "Дата: старые" },
                { value: "price:asc", label: "Цена: ↑" },
                { value: "price:desc", label: "Цена: ↓" },
                { value: "priority:desc", label: "Приоритет: срочные" },
                { value: "priority:asc", label: "Приоритет: обычные" },
              ]}
            />
          </Col>

          <Col xs={12} md={4}>
            <Button onClick={resetFilters} style={{ width: "100%" }}>
              Сбросить фильтры
            </Button>
          </Col>
        </Row>
      </Card>



      {selectedCount > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Space wrap style={{ justifyContent: "space-between", width: "100%" }}>
            <div>
              Выбрано: <b>{selectedCount}</b>
            </div>
            <Space>
              <Button
                type="primary"
                loading={bulkApproveMutation.isPending}
                onClick={() => bulkApproveMutation.mutate(selectedArray)}
              >
                Одобрить выбранные
              </Button>
              <Button
                danger
                loading={bulkRejectMutation.isPending}
                onClick={() => setBulkRejectOpen(true)}
              >
                Отклонить выбранные
              </Button>
              <Button onClick={clearSelection}>Сбросить выбор</Button>
            </Space>
          </Space>
        </Card>
      )}




      {adsQuery.isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : adsQuery.data?.ads?.length ? (
        <>
          <Row gutter={[16, 16]}>
            {adsQuery.data.ads.map((ad, i) => (
              <Col xs={24} sm={12} md={8} lg={6} key={ad.id}>
                <AdCard
                  ad={ad}
                  onOpen={() => openItem(i)}
                  showCheckbox
                  checked={selectedIds.has(ad.id)}
                  onCheckedChange={(next) => toggleSelect(ad.id, next)}
                />
              </Col>
            ))}
          </Row>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 16,
            }}
          >
            <div style={{ color: "#777" }}>
              Всего: {adsQuery.data.pagination.totalItems}
            </div>

            <Pagination
              current={adsQuery.data.pagination.currentPage}
              total={adsQuery.data.pagination.totalItems}
              pageSize={adsQuery.data.pagination.itemsPerPage}
              showSizeChanger={false}
              onChange={(p) => {
                setPage(p);
                clearSelection();
              }}
            />
          </div>
        </>
      ) : (
        <Empty description="Ничего не найдено" />
      )}

      <ReasonModal
        open={bulkRejectOpen}
        mode="reject"
        onCancel={() => setBulkRejectOpen(false)}
        onSubmit={(payload) =>
          bulkRejectMutation.mutate({
            ids: selectedArray,
            reason: payload.reason,
            comment: payload.comment,
          })
        }
      />
    </div>
  );
}
