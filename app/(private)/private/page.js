"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { RiAddLine } from "react-icons/ri";
import { useUser } from "@/hooks/useUser";
import { useDevices } from "@/hooks/useDevices";
import { Typography, Space, Spin, Button } from "antd";
import DeviceModal from "@/components/devices/DeviceModal";

const { Paragraph } = Typography;

// Dynamically import TrackerMap to avoid SSR issues with Leaflet
const DynamicTrackerMap = dynamic(() => import("@/components/map/TrackerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <Spin size="large" />
    </div>
  ),
});

export default function PrivatePage() {
  const { data: user, loading: userLoading } = useUser({
    redirectToLogin: true,
  });
  const {
    data: devices,
    loading: devicesLoading,
    refetch: refetchDevices,
  } = useDevices();
  const [positions, setPositions] = useState([]);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Fetch positions for devices
  useEffect(() => {
    const fetchPositions = async () => {
      if (!devices || devices.length === 0) {
        setPositions([]);
        return;
      }

      try {
        setLoadingPositions(true);
        // Use server-side proxy API route
        const response = await fetch("/api/traccar/positions", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const positionsData = await response.json();
        setPositions(positionsData || []);
      } catch (err) {
        console.error("Error fetching positions:", err);
        setPositions([]);
      } finally {
        setLoadingPositions(false);
      }
    };

    fetchPositions();
  }, [devices]);

  const handleModalSuccess = () => {
    refetchDevices();
    setModalOpen(false);
  };

  if (userLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Space direction="vertical" align="center" size="large">
          <Spin size="large" />
          <Paragraph className="text-gray-600">Cargando...</Paragraph>
        </Space>
      </div>
    );
  }

  const hasDevices = devices && devices.length > 0;
  const isLoading = devicesLoading || loadingPositions;

  return (
    <div className="w-full h-[calc(100vh-200px)] relative -m-6">
      {isLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <Space direction="vertical" align="center" size="large">
            <Spin size="large" />
            <Paragraph className="text-gray-600">Cargando mapa...</Paragraph>
          </Space>
        </div>
      ) : (
        <>
          <DynamicTrackerMap
            devices={devices || []}
            positions={positions}
            center={hasDevices ? [40.4168, -3.7038] : [0, 0]}
            zoom={hasDevices ? 6 : 2}
          />
          {!hasDevices && (
            <div className="absolute bottom-4 right-4 z-[1000]">
              <Button
                type="primary"
                size="large"
                icon={<RiAddLine />}
                onClick={() => setModalOpen(true)}
                className="shadow-lg"
                style={{
                  fontSize: "20px",
                  height: "64px",
                  minWidth: "120px",
                  padding: "0 24px",
                }}
              >
                Crear
              </Button>
            </div>
          )}
        </>
      )}
      <DeviceModal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        device={null}
      />
    </div>
  );
}
