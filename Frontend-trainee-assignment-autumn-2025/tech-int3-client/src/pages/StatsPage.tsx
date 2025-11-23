import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, Col, Row, Segmented, Spin, Button, Space, message } from "antd";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  fetchStatsSummary,
  fetchActivityChart,
  fetchDecisionsChart,
  fetchCategoriesChart,
} from "../api/stats";
import type { StatsPeriod } from "../types";
import { useNavigate } from "react-router-dom";

export default function StatsPage() {


  const navigate = useNavigate();
  const [period, setPeriod] = useState<StatsPeriod>("week");

  const summaryQuery = useQuery({
    queryKey: ["statsSummary", period],
    queryFn: ({ signal }) => fetchStatsSummary(period, signal),
  });

  const activityQuery = useQuery({
    queryKey: ["activityChart", period],
    queryFn: ({ signal }) => fetchActivityChart(period, signal),
  });

  const decisionsQuery = useQuery({
    queryKey: ["decisionsChart", period],
    queryFn: ({ signal }) => fetchDecisionsChart(period, signal),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categoriesChart", period],
    queryFn: ({ signal }) => fetchCategoriesChart(period, signal),
  });

  const decisionsData = useMemo(() => {
    const d = decisionsQuery.data;
    if (!d) return [];
    return [
      { name: "Одобрено", value: d.approved },
      { name: "Отклонено", value: d.rejected },
      { name: "На доработку", value: d.requestChanges },
    ];
  }, [decisionsQuery.data]);

  const categoriesData = useMemo(() => {
    const obj = categoriesQuery.data || {};
    return Object.entries(obj).map(([name, value]) => ({ name, value }));
  }, [categoriesQuery.data]);

  const isLoading =
    summaryQuery.isLoading ||
    activityQuery.isLoading ||
    decisionsQuery.isLoading ||
    categoriesQuery.isLoading;



  const exportCSV = () => {
    const s = summaryQuery.data;
    const activity = activityQuery.data || [];
    const decisions = decisionsQuery.data;
    const categories = categoriesQuery.data || {};

    const lines: string[] = [];
    lines.push(`Period,${period}`);
    lines.push("");
    lines.push("Summary");
    lines.push(
      [
        "totalReviewed",
        "approvedPercentage",
        "rejectedPercentage",
        "requestChangesPercentage",
        "averageReviewTime",
      ].join(",")
    );
    lines.push(
      [
        s?.totalReviewed ?? "",
        s?.approvedPercentage ?? "",
        s?.rejectedPercentage ?? "",
        s?.requestChangesPercentage ?? "",
        s?.averageReviewTime ?? "",
      ].join(",")
    );

    lines.push("");
    lines.push("Activity");
    lines.push("date,approved,rejected,requestChanges");
    activity.forEach((a) =>
      lines.push([a.date, a.approved, a.rejected, a.requestChanges].join(","))
    );

    lines.push("");
    lines.push("Decisions");
    if (decisions) {
      lines.push("approved,rejected,requestChanges");
      lines.push(
        [decisions.approved, decisions.rejected, decisions.requestChanges].join(",")
      );
    }

    lines.push("");
    lines.push("Categories");
    lines.push("category,value");
    Object.entries(categories).forEach(([k, v]) => lines.push(`${k},${v}`));

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `stats_${period}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    message.success("CSV скачан");
  };



  const exportPDF = () => {
    window.print();
  };




  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  const s = summaryQuery.data;


  const avgSec = s?.averageReviewTime ?? 0;
  const avgMin = avgSec / 60;

  let avgText = `${avgMin.toFixed(1)} мин`;
  if (avgMin >= 60 && avgMin < 1440) avgText = `${(avgMin / 60).toFixed(1)} ч`;
  if (avgMin >= 1440) avgText = `${(avgMin / 1440).toFixed(1)} дн`;



  return (
    <div style={{ padding: 20, maxWidth: 1400, margin: "0 auto" }}>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ justifyContent: "space-between", width: "100%" }}>
          <Segmented
            value={period}
            onChange={(v) => setPeriod(v as StatsPeriod)}
            options={[
              { label: "Сегодня", value: "today" },
              { label: "7 дней", value: "week" },
              { label: "30 дней", value: "month" },
            ]}
          />

          <Space>
           
            <Button onClick={exportCSV}>Скачать CSV</Button>
            <Button onClick={exportPDF}>Скачать PDF</Button>
          </Space>
        </Space>
      </Card>





      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={6}>
          <Card>
            <div style={{ color: "#666" }}>Проверено</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>
              {period === "today" ? s?.totalReviewedToday : s?.totalReviewed}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card>
            <div style={{ color: "#666" }}>Одобрено</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>
              {s?.approvedPercentage?.toFixed(1)}%
            </div>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card>
            <div style={{ color: "#666" }}>Отклонено</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>
              {s?.rejectedPercentage?.toFixed(1)}%
            </div>
          </Card>
        </Col>

        <Col xs={24} md={6}>



          <Card>
            <div style={{ color: "#666" }}>Ср. время до решения</div>
            <div style={{ fontSize: 22, fontWeight: 600 }}>{avgText}</div>
          </Card>



        </Col>
      </Row>





      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Активность">
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={activityQuery.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="approved" name="Одобрено" />
                  <Bar dataKey="rejected" name="Отклонено" />
                  <Bar dataKey="requestChanges" name="Доработка" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>


        <Col xs={24} lg={12}>
          <Card title="Распределение решений">
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={decisionsData} dataKey="value" nameKey="name" label />
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>




        <Col xs={24}>
          <Card title="Категории проверенных объявлений">
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={categoriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Кол-во" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>


        
      </Row>
    </div>
  );

}
