"use client";

import { useRef, useState, useEffect } from "react";
import {
  RiRocketLine,
  RiLoginBoxLine,
  RiMapPinLine,
  RiTimeLine,
  RiBarChartLine,
  RiNotificationLine,
  RiSmartphoneLine,
  RiRouteLine,
  RiMapPinRangeLine,
  RiCheckLine,
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { Layout, Typography, Card, Row, Col, Space, Spin, Badge } from "antd";
import { motion, useMotionValue, useTransform } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";

const { Title, Paragraph } = Typography;

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

// Flip Card Component
function FlipCard({ service, IconComponent, index }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div
      variants={itemVariants}
      className="h-full"
      style={{
        perspective: "1000px",
        perspectiveOrigin: "center center",
        minHeight: "380px",
      }}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <motion.div
        className="relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          height: "100%",
          minHeight: "380px",
          position: "relative",
        }}
        animate={{
          rotateY: isFlipped ? 180 : 0,
        }}
        transition={{
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {/* Front Side - Icon and Title */}
        <div
          className={`absolute inset-0 ${service.borderColor} rounded-lg bg-white shadow-lg`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(0deg)",
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          <div
            className="h-full w-full flex flex-col items-center justify-center"
            style={{
              padding: "56px 40px",
            }}
          >
            <Space
              direction="vertical"
              size="large"
              className="w-full text-center"
            >
              <div
                className={`${service.bgColor} ${service.color} w-28 h-28 rounded-full flex items-center justify-center mx-auto`}
              >
                <IconComponent className="text-6xl" />
              </div>
              <Title
                level={3}
                className="!mb-0 !text-2xl md:!text-3xl !font-bold"
              >
                {service.title}
              </Title>
            </Space>
          </div>
        </div>

        {/* Back Side - Description */}
        <div
          className={`absolute inset-0 ${service.borderColor} rounded-lg bg-white shadow-lg`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          <div
            className="h-full w-full flex flex-col items-center justify-center"
            style={{
              padding: "56px 40px",
            }}
          >
            <Paragraph className="text-gray-700 !mb-0 !text-lg md:!text-xl !leading-relaxed !text-center">
              {service.description}
            </Paragraph>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Vehicle Pointer Component with Viewport Visibility
function VehiclePointer({ vehicle, index, heroRef }) {
  const xKeyframes = vehicle.path.map((p) => p.x);
  const yKeyframes = vehicle.path.map((p) => p.y);
  const x = useMotionValue(vehicle.path[0].x);
  const y = useMotionValue(vehicle.path[0].y);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkVisibility = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const xValue = x.get();
      const yValue = y.get();

      // Parse percentage string (e.g., "10%" -> 10) or number
      const xPercent =
        typeof xValue === "string"
          ? parseFloat(xValue.replace("%", ""))
          : xValue;
      const yPercent =
        typeof yValue === "string"
          ? parseFloat(yValue.replace("%", ""))
          : yValue;

      const xPos = (rect.width * xPercent) / 100;
      const yPos = (rect.height * yPercent) / 100;
      const isInViewport =
        xPos >= -50 &&
        xPos <= rect.width + 50 &&
        yPos >= -50 &&
        yPos <= rect.height + 50;
      setIsVisible(isInViewport);
    };

    const unsubscribeX = x.on("change", checkVisibility);
    const unsubscribeY = y.on("change", checkVisibility);

    // Also check on scroll/resize
    const interval = setInterval(checkVisibility, 100);
    checkVisibility();

    return () => {
      unsubscribeX();
      unsubscribeY();
      clearInterval(interval);
    };
  }, [x, y, heroRef]);

  return (
    <motion.div
      key={index}
      className="absolute"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -100%)",
        opacity: isVisible ? 1 : 0,
        pointerEvents: "none",
        transition: "opacity 0.3s ease",
      }}
      animate={{
        left: xKeyframes,
        top: yKeyframes,
      }}
      transition={{
        duration: vehicle.duration,
        repeat: Infinity,
        ease: "linear",
        delay: vehicle.delay,
        times: vehicle.path.map((_, i) => i / (vehicle.path.length - 1)),
      }}
    >
      {/* GPS Pointer Pin */}
      <div
        className="relative"
        style={{
          width: "24px",
          height: "32px",
        }}
      >
        {/* Pin Shadow */}
        <div
          className="absolute"
          style={{
            width: "20px",
            height: "8px",
            background: "rgba(0, 0, 0, 0.2)",
            borderRadius: "50%",
            bottom: "-4px",
            left: "50%",
            transform: "translateX(-50%)",
            filter: "blur(4px)",
          }}
        />
        {/* Pin Body */}
        <div
          className="absolute"
          style={{
            width: "24px",
            height: "24px",
            background: vehicle.color,
            borderRadius: "50% 50% 50% 0",
            transform: "rotate(-45deg)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Inner Circle */}
          <div
            className="absolute"
            style={{
              width: "12px",
              height: "12px",
              background: "#ffffff",
              borderRadius: "50%",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
        {/* Pulse Animation */}
        <motion.div
          className="absolute"
          animate={{
            scale: [1, 1.8, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut",
          }}
          style={{
            width: "24px",
            height: "24px",
            background: vehicle.color,
            borderRadius: "50%",
            top: "0",
            left: "0",
            opacity: 0.3,
          }}
        />
      </div>
      {/* Moving Trail Effect */}
      <motion.div
        className="absolute"
        animate={{
          opacity: [0, 0.5, 0],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          width: "3px",
          height: "40px",
          background: `linear-gradient(to bottom, ${vehicle.color}, transparent)`,
          top: "32px",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />
    </motion.div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { data: user, loading } = useUser();
  const heroRef = useRef(null);
  const servicosRef = useRef(null);
  const precosRef = useRef(null);

  const handleLogin = () => {
    router.push("/login");
  };

  const handleDashboard = () => {
    router.push("/private");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Space direction="vertical" align="center" size="large">
          <Spin size="large" />
          <Paragraph className="text-gray-600">Carregando...</Paragraph>
        </Space>
      </div>
    );
  }

  const services = [
    {
      icon: RiMapPinLine,
      title: "Rastreamento em Tempo Real",
      description:
        "Monitore a localização de seus veículos em tempo real com atualizações instantâneas e precisas.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-2 border-blue-200",
    },
    {
      icon: RiMapPinRangeLine,
      title: "Cercas Virtuais",
      description:
        "Configure geocercas e receba alertas quando veículos entram ou saem de áreas definidas.",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-2 border-green-200",
    },
    {
      icon: RiBarChartLine,
      title: "Relatórios e Análises",
      description:
        "Gere relatórios detalhados sobre rotas, velocidade, consumo e muito mais para otimizar sua frota.",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-2 border-purple-200",
    },
    {
      icon: RiNotificationLine,
      title: "Alertas e Notificações",
      description:
        "Receba notificações instantâneas sobre eventos importantes como excesso de velocidade, paradas e manutenções.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-2 border-orange-200",
    },
    {
      icon: RiSmartphoneLine,
      title: "Aplicativos Móveis",
      description:
        "Acesse todas as funcionalidades através de aplicativos móveis para iOS e Android.",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      borderColor: "border-2 border-indigo-200",
    },
    {
      icon: RiRouteLine,
      title: "Histórico de Rotas",
      description:
        "Visualize o histórico completo de rotas percorridas com detalhes de tempo, distância e paradas.",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-2 border-red-200",
    },
  ];

  const pricingPlans = [
    {
      name: "Básico",
      price: "R$ 49",
      period: "/mês",
      features: [
        "Até 5 veículos",
        "Rastreamento em tempo real",
        "Histórico de 30 dias",
        "Relatórios básicos",
        "Suporte por email",
      ],
      popular: false,
    },
    {
      name: "Profissional",
      price: "R$ 149",
      period: "/mês",
      features: [
        "Até 25 veículos",
        "Rastreamento em tempo real",
        "Histórico de 1 ano",
        "Cercas virtuais",
        "Relatórios avançados",
        "Alertas personalizados",
        "Suporte prioritário",
        "API de integração",
      ],
      popular: true,
    },
    {
      name: "Empresarial",
      price: "Sob consulta",
      period: "",
      features: [
        "Veículos ilimitados",
        "Todos os recursos do Profissional",
        "Histórico ilimitado",
        "Multi-usuários e permissões",
        "Dashboard personalizado",
        "Suporte 24/7",
        "Treinamento dedicado",
        "SLA garantido",
      ],
      popular: false,
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Header
        authButton={
          user ? (
            <Button
              type="primary"
              onClick={handleDashboard}
              className="!bg-blue-600 hover:!bg-blue-700 !border-blue-600 !text-white !font-semibold !h-10 !px-6 !cursor-pointer"
            >
              Ir ao Dashboard
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<RiLoginBoxLine />}
              onClick={handleLogin}
              className="!bg-blue-600 hover:!bg-blue-700 !border-blue-600 !text-white !font-semibold !h-10 !px-6 !cursor-pointer"
            >
              Entrar
            </Button>
          )
        }
      />

      <Layout.Content>
        {/* Hero Section */}
        <section
          id="hero"
          ref={heroRef}
          className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 overflow-hidden"
        >
          {/* Map-like Background */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Base Map Grid */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(100, 116, 139, 0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(100, 116, 139, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: "40px 40px",
              }}
            />

            {/* Streets/Roads - Horizontal */}
            {[
              { top: "15%", width: "100%", height: "3px" },
              { top: "35%", width: "100%", height: "4px" },
              { top: "55%", width: "100%", height: "3px" },
              { top: "75%", width: "100%", height: "4px" },
            ].map((street, idx) => (
              <div
                key={`h-${idx}`}
                className="absolute bg-gray-300 opacity-40"
                style={{
                  top: street.top,
                  left: 0,
                  width: street.width,
                  height: street.height,
                }}
              />
            ))}

            {/* Streets/Roads - Vertical */}
            {[
              { left: "20%", width: "3px", height: "100%" },
              { left: "40%", width: "4px", height: "100%" },
              { left: "60%", width: "3px", height: "100%" },
              { left: "80%", width: "4px", height: "100%" },
            ].map((street, idx) => (
              <div
                key={`v-${idx}`}
                className="absolute bg-gray-300 opacity-40"
                style={{
                  left: street.left,
                  top: 0,
                  width: street.width,
                  height: street.height,
                }}
              />
            ))}

            {/* Green Spaces (Parks) */}
            {[
              { left: "5%", top: "5%", width: "12%", height: "8%" },
              { left: "25%", top: "25%", width: "10%", height: "7%" },
              { left: "50%", top: "10%", width: "15%", height: "12%" },
              { left: "70%", top: "40%", width: "12%", height: "10%" },
              { left: "15%", top: "60%", width: "18%", height: "12%" },
              { left: "60%", top: "70%", width: "14%", height: "9%" },
            ].map((park, idx) => (
              <div
                key={`park-${idx}`}
                className="absolute rounded-lg opacity-60"
                style={{
                  left: park.left,
                  top: park.top,
                  width: park.width,
                  height: park.height,
                  background:
                    "linear-gradient(135deg, #86efac 0%, #4ade80 100%)",
                  boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
                }}
              />
            ))}

            {/* Building Blocks */}
            {[
              { left: "10%", top: "20%", width: "8%", height: "12%" },
              { left: "30%", top: "45%", width: "7%", height: "10%" },
              { left: "45%", top: "30%", width: "10%", height: "15%" },
              { left: "65%", top: "15%", width: "9%", height: "11%" },
              { left: "75%", top: "55%", width: "8%", height: "13%" },
              { left: "20%", top: "75%", width: "12%", height: "10%" },
            ].map((block, idx) => (
              <div
                key={`block-${idx}`}
                className="absolute rounded-sm opacity-50"
                style={{
                  left: block.left,
                  top: block.top,
                  width: block.width,
                  height: block.height,
                  background:
                    "linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                }}
              />
            ))}

            {/* Animated GPS Pointers with Viewport Visibility */}
            {[
              {
                path: [
                  { x: "-5%", y: "20%" },
                  { x: "10%", y: "15%" },
                  { x: "25%", y: "25%" },
                  { x: "40%", y: "20%" },
                  { x: "55%", y: "30%" },
                  { x: "70%", y: "25%" },
                  { x: "85%", y: "35%" },
                  { x: "105%", y: "30%" },
                ],
                duration: 30,
                delay: 0,
                color: "#3b82f6",
              },
              {
                path: [
                  { x: "105%", y: "60%" },
                  { x: "90%", y: "55%" },
                  { x: "75%", y: "65%" },
                  { x: "60%", y: "60%" },
                  { x: "45%", y: "70%" },
                  { x: "30%", y: "65%" },
                  { x: "15%", y: "75%" },
                  { x: "-5%", y: "70%" },
                ],
                duration: 35,
                delay: 3,
                color: "#8b5cf6",
              },
              {
                path: [
                  { x: "5%", y: "-5%" },
                  { x: "20%", y: "10%" },
                  { x: "35%", y: "5%" },
                  { x: "50%", y: "15%" },
                  { x: "65%", y: "10%" },
                  { x: "80%", y: "20%" },
                  { x: "95%", y: "15%" },
                  { x: "110%", y: "25%" },
                ],
                duration: 32,
                delay: 6,
                color: "#06b6d4",
              },
              {
                path: [
                  { x: "110%", y: "25%" },
                  { x: "95%", y: "20%" },
                  { x: "80%", y: "30%" },
                  { x: "65%", y: "25%" },
                  { x: "50%", y: "35%" },
                  { x: "35%", y: "30%" },
                  { x: "20%", y: "40%" },
                  { x: "5%", y: "35%" },
                  { x: "-10%", y: "45%" },
                ],
                duration: 38,
                delay: 2,
                color: "#10b981",
              },
              {
                path: [
                  { x: "-5%", y: "50%" },
                  { x: "10%", y: "45%" },
                  { x: "25%", y: "55%" },
                  { x: "40%", y: "50%" },
                  { x: "55%", y: "60%" },
                  { x: "70%", y: "55%" },
                  { x: "85%", y: "65%" },
                  { x: "100%", y: "60%" },
                  { x: "115%", y: "70%" },
                ],
                duration: 33,
                delay: 4,
                color: "#f59e0b",
              },
              {
                path: [
                  { x: "15%", y: "105%" },
                  { x: "30%", y: "100%" },
                  { x: "45%", y: "110%" },
                  { x: "60%", y: "105%" },
                  { x: "75%", y: "115%" },
                  { x: "90%", y: "110%" },
                  { x: "105%", y: "120%" },
                ],
                duration: 28,
                delay: 8,
                color: "#ef4444",
              },
              {
                path: [
                  { x: "105%", y: "15%" },
                  { x: "90%", y: "10%" },
                  { x: "75%", y: "20%" },
                  { x: "60%", y: "15%" },
                  { x: "45%", y: "25%" },
                  { x: "30%", y: "20%" },
                  { x: "15%", y: "30%" },
                  { x: "0%", y: "25%" },
                  { x: "-15%", y: "35%" },
                ],
                duration: 36,
                delay: 1,
                color: "#a855f7",
              },
              {
                path: [
                  { x: "-10%", y: "75%" },
                  { x: "5%", y: "70%" },
                  { x: "20%", y: "80%" },
                  { x: "35%", y: "75%" },
                  { x: "50%", y: "85%" },
                  { x: "65%", y: "80%" },
                  { x: "80%", y: "90%" },
                  { x: "95%", y: "85%" },
                  { x: "110%", y: "95%" },
                ],
                duration: 31,
                delay: 5,
                color: "#14b8a6",
              },
              {
                path: [
                  { x: "50%", y: "-10%" },
                  { x: "65%", y: "-5%" },
                  { x: "80%", y: "5%" },
                  { x: "95%", y: "0%" },
                  { x: "110%", y: "10%" },
                ],
                duration: 25,
                delay: 7,
                color: "#f97316",
              },
              {
                path: [
                  { x: "110%", y: "80%" },
                  { x: "95%", y: "75%" },
                  { x: "80%", y: "85%" },
                  { x: "65%", y: "80%" },
                  { x: "50%", y: "90%" },
                  { x: "35%", y: "85%" },
                  { x: "20%", y: "95%" },
                  { x: "5%", y: "90%" },
                  { x: "-10%", y: "100%" },
                ],
                duration: 34,
                delay: 9,
                color: "#6366f1",
              },
              {
                path: [
                  { x: "25%", y: "-5%" },
                  { x: "40%", y: "0%" },
                  { x: "55%", y: "10%" },
                  { x: "70%", y: "5%" },
                  { x: "85%", y: "15%" },
                  { x: "100%", y: "10%" },
                  { x: "115%", y: "20%" },
                ],
                duration: 29,
                delay: 11,
                color: "#ec4899",
              },
              {
                path: [
                  { x: "-5%", y: "40%" },
                  { x: "10%", y: "35%" },
                  { x: "25%", y: "45%" },
                  { x: "40%", y: "40%" },
                  { x: "55%", y: "50%" },
                  { x: "70%", y: "45%" },
                  { x: "85%", y: "55%" },
                  { x: "100%", y: "50%" },
                  { x: "115%", y: "60%" },
                ],
                duration: 37,
                delay: 13,
                color: "#22c55e",
              },
            ].map((vehicle, index) => (
              <VehiclePointer
                key={index}
                vehicle={vehicle}
                index={index}
                heroRef={heroRef}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 py-20 text-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <RiRocketLine className="text-7xl md:text-8xl text-blue-600 mx-auto mb-6" />
            </motion.div>
            <Title
              level={1}
              className="!text-4xl md:!text-6xl lg:!text-7xl !mb-6 !font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            >
              Rastreie seus Veículos em Tempo Real
            </Title>
            <Paragraph className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Solução completa de rastreamento GPS para gerenciar sua frota com
              eficiência. Monitore, analise e otimize seus veículos com
              tecnologia de ponta.
            </Paragraph>
            <Space size="middle" className="flex-wrap justify-center">
              {!user ? (
                <>
                  <Button
                    type="primary"
                    size="large"
                    icon={<RiLoginBoxLine />}
                    onClick={handleLogin}
                    className="!h-12 !px-8 !text-lg"
                  >
                    Começar Grátis
                  </Button>
                  <Button
                    size="large"
                    onClick={() => {
                      const element = document.getElementById("servicos");
                      element?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="!h-12 !px-8 !text-lg"
                  >
                    Ver Demonstração
                  </Button>
                </>
              ) : (
                <Button
                  type="primary"
                  size="large"
                  onClick={handleDashboard}
                  className="!h-12 !px-8 !text-lg"
                >
                  Acessar Dashboard
                </Button>
              )}
            </Space>
          </motion.div>
        </section>

        {/* Services Section */}
        <section
          id="servicos"
          ref={servicosRef}
          className="py-20 md:py-28 bg-white"
        >
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <Title level={2} className="!text-3xl md:!text-4xl !mb-4">
                Recursos Completos para sua Frota
              </Title>
              <Paragraph className="text-lg text-gray-600 max-w-2xl mx-auto">
                Tudo que você precisa para gerenciar e otimizar sua frota de
                veículos em um só lugar
              </Paragraph>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <Row gutter={[32, 32]}>
                {services.map((service, index) => {
                  const IconComponent = service.icon;
                  return (
                    <Col xs={24} sm={12} lg={8} key={index}>
                      <FlipCard
                        service={service}
                        IconComponent={IconComponent}
                        index={index}
                      />
                    </Col>
                  );
                })}
              </Row>
            </motion.div>
          </div>
        </section>

        {/* Pricing Section */}
        <section
          id="precos"
          ref={precosRef}
          className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white"
        >
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <Title level={2} className="!text-3xl md:!text-4xl !mb-4">
                Planos que Crescem com Você
              </Title>
              <Paragraph className="text-lg text-gray-600 max-w-2xl mx-auto">
                Escolha o plano ideal para suas necessidades. Todos os planos
                incluem teste gratuito de 14 dias.
              </Paragraph>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <Row gutter={[24, 24]}>
                {pricingPlans.map((plan, index) => (
                  <Col xs={24} md={8} key={index}>
                    <motion.div
                      variants={itemVariants}
                      whileHover={{ scale: plan.popular ? 1.05 : 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        className={`h-full relative ${
                          plan.popular
                            ? "border-2 border-blue-500 shadow-xl"
                            : "border border-gray-200"
                        }`}
                        styles={{
                          body: { padding: "40px 32px" },
                        }}
                      >
                        {plan.popular && (
                          <Badge
                            count="Mais Popular"
                            className="absolute -top-3 left-1/2 transform -translate-x-1/2"
                            style={{
                              backgroundColor: "#2563eb",
                            }}
                          />
                        )}
                        <Space
                          direction="vertical"
                          size="large"
                          className="w-full text-center"
                        >
                          <div>
                            <Title level={3} className="!mb-2">
                              {plan.name}
                            </Title>
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-4xl font-bold text-gray-900">
                                {plan.price}
                              </span>
                              {plan.period && (
                                <span className="text-gray-600">
                                  {plan.period}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="w-full border-t border-gray-200 pt-6">
                            <Space
                              direction="vertical"
                              size="middle"
                              className="w-full text-left"
                            >
                              {plan.features.map((feature, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-3"
                                >
                                  <RiCheckLine className="text-green-600 text-xl flex-shrink-0 mt-0.5" />
                                  <span className="text-gray-700">
                                    {feature}
                                  </span>
                                </div>
                              ))}
                            </Space>
                          </div>
                          <Button
                            type={plan.popular ? "primary" : "default"}
                            size="large"
                            block
                            onClick={handleLogin}
                            className="!h-12 !mt-4"
                          >
                            Escolher Plano
                          </Button>
                        </Space>
                      </Card>
                    </motion.div>
                  </Col>
                ))}
              </Row>
            </motion.div>
          </div>
        </section>
      </Layout.Content>

      <Footer>
        <Paragraph className="text-gray-500 !mb-0">
          © 2024 Trackio. Todos os direitos reservados.
        </Paragraph>
      </Footer>
    </Layout>
  );
}
