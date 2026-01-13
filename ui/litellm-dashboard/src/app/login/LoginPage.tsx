"use client";

import { useLogin } from "@/app/(dashboard)/hooks/login/useLogin";
import { useUIConfig } from "@/app/(dashboard)/hooks/uiConfig/useUIConfig";
import LoadingScreen from "@/components/common_components/LoadingScreen";
import { getProxyBaseUrl } from "@/components/networking";
import { getCookie } from "@/utils/cookieUtils";
import { isJwtExpired } from "@/utils/jwtUtils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Alert, Card, Space, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function LoginPageContent() {
  const [isLoading, setIsLoading] = useState(true);
  const { data: uiConfig, isLoading: isConfigLoading } = useUIConfig();
  const loginMutation = useLogin();
  const router = useRouter();

  const error = loginMutation.error instanceof Error ? loginMutation.error.message : null;
  const isLoginLoading = loginMutation.isPending;

  useEffect(() => {
    if (isConfigLoading) {
      return;
    }

    // Check if admin UI is disabled
    if (uiConfig && uiConfig.admin_ui_disabled) {
      setIsLoading(false);
      return;
    }

    const rawToken = getCookie("token");
    if (rawToken && !isJwtExpired(rawToken)) {
      router.replace(`${getProxyBaseUrl()}/ui`);
      return;
    }

    if (uiConfig && uiConfig.auto_redirect_to_sso) {
      router.push(`${getProxyBaseUrl()}/sso/key/generate`);
      return;
    }

    if (!isLoginLoading && !error) {
      loginMutation.mutate(
        { username: "x-litellm-api-key", password: "" },
        {
          onSuccess: (data) => {
            router.push(data.redirect_url);
          },
        },
      );
    }

    setIsLoading(false);
  }, [isConfigLoading, router, uiConfig, error, isLoginLoading]);

  const { Title, Text, Paragraph } = Typography;

  if (isConfigLoading || isLoading) {
    return <LoadingScreen />;
  }

  // Show disabled message if admin UI is disabled
  if (uiConfig && uiConfig.admin_ui_disabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-lg shadow-md">
          <Space direction="vertical" size="middle" className="w-full">
            <div className="text-center">
              <Title level={2}>🚅 LiteLLM</Title>
            </div>

            <Alert
              message="Admin UI Disabled"
              description={
                <>
                  <Paragraph className="text-sm">
                    The Admin UI has been disabled by the administrator. To re-enable it, please update the following
                    environment variable:
                  </Paragraph>
                  <Paragraph className="text-sm">
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">DISABLE_ADMIN_UI=False</code>
                  </Paragraph>
                </>
              }
              type="warning"
              showIcon
            />
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-lg shadow-md">
        <Space direction="vertical" size="middle" className="w-full">
          <div className="text-center">
            <Title level={2}>🚅 LiteLLM</Title>
          </div>

          <div className="text-center">
            <Title level={3}>Login</Title>
            <Text type="secondary">Access your LiteLLM Admin UI.</Text>
          </div>

          {error && <Alert message={error} type="error" showIcon />}
        </Space>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <LoginPageContent />
    </QueryClientProvider>
  );
}
