"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Spin,
  Button,
  App,
  Alert,
} from "antd";
import { RiDeviceLine, RiAlertLine } from "react-icons/ri";

/**
 * DeviceModal Component
 * Modal for creating or editing a device
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is open
 * @param {Function} props.onCancel - Callback when modal is closed
 * @param {Function} props.onSuccess - Callback when device is created/updated successfully
 * @param {Object} props.device - Device object for editing (null for creating)
 */
export default function DeviceModal({
  open,
  onCancel,
  onSuccess,
  device = null,
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [tokenError, setTokenError] = useState(null);
  const isEditing = !!device;

  useEffect(() => {
    if (open) {
      if (device) {
        // Populate form for editing
        form.setFieldsValue({
          name: device.name,
          uniqueId: device.uniqueId,
          model: device.model || "",
          phone: device.phone || "",
          contact: device.contact || "",
        });
      } else {
        // Reset form for creating
        form.resetFields();
      }
      setTokenError(null);
    }
  }, [open, device, form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setTokenError(null);

      // Prepare device data
      const deviceData = {
        name: values.name,
        uniqueId: values.uniqueId,
        model: values.model || null,
        phone: values.phone || null,
        contact: values.contact || null,
      };

      let response;
      if (isEditing) {
        // Update existing device
        response = await fetch(`/api/traccar/devices/${device.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(deviceData),
        });
      } else {
        // Create new device
        response = await fetch("/api/traccar/devices", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(deviceData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle authentication errors
        if (response.status === 401) {
          setTokenError(
            new Error(
              errorData.error ||
                "Sesión expirada. Por favor, inicia sesión nuevamente."
            )
          );
          message.error(
            errorData.error ||
              "Sesión expirada. Por favor, inicia sesión nuevamente."
          );
          return;
        }

        // Handle other errors
        const errorMessage =
          errorData.error ||
          `Error al ${isEditing ? "actualizar" : "configurar"} el tracker. Por favor, intenta nuevamente.`;
        message.error(errorMessage);
        return;
      }

      const result = await response.json();
      
      message.success(
        isEditing
          ? "Tracker actualizado exitosamente"
          : "Tracker configurado exitosamente"
      );

      form.resetFields();
      if (onSuccess) {
        onSuccess();
      }
      onCancel();
    } catch (err) {
      console.error("Error saving device:", err);
      const errorMessage =
        err.message ||
        `Error al ${isEditing ? "actualizar" : "configurar"} el tracker. Por favor, intenta nuevamente.`;
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <span>
          <RiDeviceLine className="inline mr-2" />
          {isEditing ? "Editar Tracker" : "Configurar Mi Primer Tracker"}
        </span>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={600}
      destroyOnHidden
    >
      {tokenError ? (
        <div className="space-y-4">
          <Alert
            message="Sincronización con Traccar requerida"
            description={
              tokenError?.message?.includes("sincronizado")
                ? "Necesitas iniciar sesión en Traccar primero para poder gestionar dispositivos. Por favor, contacta al administrador o inicia sesión en Traccar con tus credenciales."
                : tokenError?.message ||
                  "No se pudo obtener el token de sesión de Traccar. Por favor, inicia sesión en Traccar primero."
            }
            type="warning"
            showIcon
            icon={<RiAlertLine />}
            className="mb-4"
          />
          <div className="text-center">
            <Button onClick={handleCancel}>Cerrar</Button>
          </div>
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            label="Nombre del Tracker"
            name="name"
            rules={[
              {
                required: true,
                message: "Por favor, ingresa un nombre para el tracker",
              },
            ]}
          >
            <Input
              prefix={<RiDeviceLine />}
              placeholder="Ej: Mi Vehículo, Mi Moto, etc."
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="ID Único (Unique ID)"
            name="uniqueId"
            rules={[
              {
                required: true,
                message:
                  "El ID único es requerido (generalmente el IMEI del dispositivo)",
              },
              {
                min: 1,
                message: "El ID único debe tener al menos 1 carácter",
              },
            ]}
            extra="Este es el identificador único del dispositivo GPS (normalmente el IMEI)"
          >
            <Input
              placeholder="Ej: 123456789012345"
              size="large"
              maxLength={255}
              disabled={isEditing}
            />
          </Form.Item>

          <Form.Item
            label="Modelo (Opcional)"
            name="model"
            extra="Modelo del dispositivo GPS"
          >
            <Input
              placeholder="Ej: TK103, GT06, etc."
              size="large"
              maxLength={100}
            />
          </Form.Item>

          <Form.Item
            label="Teléfono (Opcional)"
            name="phone"
            extra="Número de teléfono asociado al dispositivo"
          >
            <Input
              placeholder="Ej: +34612345678"
              size="large"
              maxLength={50}
            />
          </Form.Item>

          <Form.Item
            label="Contacto (Opcional)"
            name="contact"
            extra="Nombre de la persona de contacto"
          >
            <Input
              placeholder="Ej: Juan Pérez"
              size="large"
              maxLength={255}
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="flex justify-end gap-2">
              <Button onClick={handleCancel}>Cancelar</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
              >
                {isEditing ? "Actualizar" : "Configurar"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}

