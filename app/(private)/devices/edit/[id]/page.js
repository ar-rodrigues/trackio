"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { RiDeviceLine } from "react-icons/ri";
import { useDevice } from "@/hooks/useDevice";
import { Card, Typography, Spin, Alert, App } from "antd";
import DeviceModal from "@/components/devices/DeviceModal";

const { Title } = Typography;

export default function EditDevicePage() {
  const { message } = App.useApp();
  const router = useRouter();
  const params = useParams();
  const deviceId = params?.id ? parseInt(params.id, 10) : null;
  const { data: device, loading, error } = useDevice(deviceId);
  const [modalOpen, setModalOpen] = useState(true);

  const handleSuccess = () => {
    message.success("Dispositivo actualizado exitosamente");
    router.push("/devices");
  };

  const handleCancel = () => {
    router.push("/devices");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <Alert
            message="Error al cargar el dispositivo"
            description={error.message}
            type="error"
            showIcon
            action={
              <button
                onClick={() => router.push("/devices")}
                className="text-blue-600 hover:text-blue-800"
              >
                Volver a dispositivos
              </button>
            }
          />
        </Card>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="p-6">
        <Card>
          <Alert
            message="Dispositivo no encontrado"
            description="El dispositivo que buscas no existe o no tienes permisos para acceder a él."
            type="warning"
            showIcon
            action={
              <button
                onClick={() => router.push("/devices")}
                className="text-blue-600 hover:text-blue-800"
              >
                Volver a dispositivos
              </button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <Title level={2} className="mb-6">
          <RiDeviceLine className="inline mr-2" />
          Editar Dispositivo
        </Title>
        <DeviceModal
          open={modalOpen}
          onCancel={handleCancel}
          onSuccess={handleSuccess}
          device={device}
        />
      </Card>
    </div>
  );
}

