"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiDeviceLine, RiEditLine, RiDeleteBinLine, RiAddLine } from "react-icons/ri";
import { useDevices } from "@/hooks/useDevices";
import { useTraccarToken } from "@/hooks/useTraccarToken";
import { traccarClient } from "@/utils/traccar/client";
import {
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Popconfirm,
  Spin,
  Card,
  App,
} from "antd";
import DeviceModal from "@/components/devices/DeviceModal";

const { Title } = Typography;

export default function DevicesPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const { data: devices, loading, error, refetch } = useDevices();
  const { token } = useTraccarToken();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleEdit = (device) => {
    setEditingDevice(device);
    setModalOpen(true);
  };

  const handleDelete = async (deviceId) => {
    if (!token) {
      message.error("Token de sesión no disponible");
      return;
    }

    try {
      setDeleting(true);
      await traccarClient.deleteDevice(deviceId, token);
      message.success("Dispositivo eliminado exitosamente");
      refetch();
    } catch (err) {
      console.error("Error deleting device:", err);
      const errorMessage =
        err.data?.message ||
        err.message ||
        "Error al eliminar el dispositivo";
      message.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleModalSuccess = () => {
    refetch();
    setModalOpen(false);
    setEditingDevice(null);
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    setEditingDevice(null);
  };

  const handleCreate = () => {
    setEditingDevice(null);
    setModalOpen(true);
  };

  const columns = [
    {
      title: "Nombre",
      dataIndex: "name",
      key: "name",
      render: (text) => text || "Sin nombre",
    },
    {
      title: "ID Único",
      dataIndex: "uniqueId",
      key: "uniqueId",
    },
    {
      title: "Estado",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        const color =
          status === "online"
            ? "green"
            : status === "offline"
            ? "red"
            : "default";
        const text =
          status === "online"
            ? "En línea"
            : status === "offline"
            ? "Desconectado"
            : status || "Desconocido";
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Última Actualización",
      dataIndex: "lastUpdate",
      key: "lastUpdate",
      render: (date) => {
        if (!date) return "Nunca";
        try {
          return new Date(date).toLocaleString("es-ES");
        } catch {
          return date;
        }
      },
    },
    {
      title: "Modelo",
      dataIndex: "model",
      key: "model",
      render: (text) => text || "-",
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<RiEditLine />}
            onClick={() => handleEdit(record)}
          >
            Editar
          </Button>
          <Popconfirm
            title="¿Estás seguro de eliminar este dispositivo?"
            description="Esta acción no se puede deshacer."
            onConfirm={() => handleDelete(record.id)}
            okText="Sí, eliminar"
            cancelText="Cancelar"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              danger
              icon={<RiDeleteBinLine />}
              loading={deleting}
            >
              Eliminar
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <Title level={4}>Error al cargar dispositivos</Title>
          <p>{error.message}</p>
          <Button onClick={refetch} className="mt-4">
            Reintentar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <Title level={2}>
          <RiDeviceLine className="inline mr-2" />
          Dispositivos
        </Title>
        <Button
          type="primary"
          icon={<RiAddLine />}
          size="large"
          onClick={handleCreate}
        >
          Crear Dispositivo
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={devices || []}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} dispositivos`,
          }}
          locale={{
            emptyText: "No hay dispositivos configurados",
          }}
        />
      </Card>

      <DeviceModal
        open={modalOpen}
        onCancel={handleModalCancel}
        onSuccess={handleModalSuccess}
        device={editingDevice}
      />
    </div>
  );
}

