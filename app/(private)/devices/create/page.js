"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiDeviceLine } from "react-icons/ri";
import { useTraccarToken } from "@/hooks/useTraccarToken";
import { traccarClient } from "@/utils/traccar/client";
import { Card, Typography, Spin, App } from "antd";
import DeviceModal from "@/components/devices/DeviceModal";

const { Title } = Typography;

export default function CreateDevicePage() {
  const { message } = App.useApp();
  const router = useRouter();
  const { token, loading: tokenLoading } = useTraccarToken();
  const [modalOpen, setModalOpen] = useState(true);

  const handleSuccess = () => {
    message.success("Dispositivo creado exitosamente");
    router.push("/devices");
  };

  const handleCancel = () => {
    router.push("/devices");
  };

  if (tokenLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <Title level={2} className="mb-6">
          <RiDeviceLine className="inline mr-2" />
          Crear Nuevo Dispositivo
        </Title>
        <DeviceModal
          open={modalOpen}
          onCancel={handleCancel}
          onSuccess={handleSuccess}
          device={null}
        />
      </Card>
    </div>
  );
}

