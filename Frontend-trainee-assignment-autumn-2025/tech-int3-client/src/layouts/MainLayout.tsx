import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Layout, Button, Switch, ConfigProvider, theme as antdTheme, Space } from "antd";
import { useEffect, useMemo, useState } from "react";

const { Header, Content } = Layout;

type ThemeMode = "light" | "dark";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    localStorage.setItem("theme", mode);
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const algorithm = useMemo(
    () => (mode === "dark" ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm),
    [mode]
  );

  const isList = location.pathname.startsWith("/list");
  const isStats = location.pathname.startsWith("/stats");

  return (
    <ConfigProvider theme={{ algorithm }}>
      <Layout style={{ minHeight: "100vh" }}>
        <Header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Space>
            <Button type={isList ? "primary" : "default"} onClick={() => navigate("/list")}>
              Список
            </Button>
            <Button type={isStats ? "primary" : "default"} onClick={() => navigate("/stats")}>
              Статистика
            </Button>
          </Space>

          <Space>
            <span style={{ color: "white", opacity: 0.8 }}>Тёмная тема</span>
            <Switch
              checked={mode === "dark"}
              onChange={(v) => setMode(v ? "dark" : "light")}
            />
          </Space>
        </Header>

        <Content style={{ padding: 0 }}>
          <Outlet />
        </Content>
      </Layout>
    </ConfigProvider>
  );
}


