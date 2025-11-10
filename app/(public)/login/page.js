"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  RiUserLine,
  RiLockLine,
  RiMailLine,
  RiRocketLine,
  RiCheckLine,
  RiArrowLeftLine,
} from "react-icons/ri";
import { useUser } from "@/hooks/useUser";
import { login, signup } from "./actions";
import { Form, Tabs, Card, Typography, Space, Alert } from "antd";
import Input from "@/components/ui/Input";
import Password from "@/components/ui/Password";
import Button from "@/components/ui/Button";

const { Title, Paragraph, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loginForm] = Form.useForm();
  const [signupForm] = Form.useForm();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if user is already logged in and redirect if so
  useUser({ redirectIfAuthenticated: true });

  useEffect(() => {
    // Check for success message
    const message = searchParams.get("message");
    if (message === "signup_success") {
      setShowSuccess(true);
    } else if (message === "password_reset_success") {
      // Show success message for password reset on login form
      setErrorMessage(null);
      // Clear any existing success state and ensure login tab is active
      setActiveTab("login");
    }
  }, [searchParams]);

  const handleLogin = async (values) => {
    setLoading(true);
    setErrorMessage(null); // Clear previous errors
    const formDataObj = new FormData();
    formDataObj.append("email", values.email);
    formDataObj.append("password", values.password);

    startTransition(async () => {
      try {
        const result = await login(formDataObj);

        // Check if login returned an error object
        if (result && result.error) {
          setErrorMessage(result.message);
          setLoading(false);
        }
        // If no error object returned, login was successful and redirect happened
      } catch (error) {
        // Handle unexpected errors
        setErrorMessage(
          "Ocurrió un error inesperado. Por favor, intenta nuevamente."
        );
        setLoading(false);
        console.error("Login error:", error);
      }
    });
  };

  const handleSignup = async (values) => {
    setLoading(true);
    setErrorMessage(null); // Clear previous errors
    const formDataObj = new FormData();
    formDataObj.append("email", values.email);
    formDataObj.append("password", values.password);

    startTransition(async () => {
      try {
        const result = await signup(formDataObj);

        // Check if signup returned an error object
        if (result && result.error) {
          setErrorMessage(result.message);
          setLoading(false);
        }
        // If no error object returned, signup was successful and redirect happened
      } catch (error) {
        // Handle unexpected errors
        setErrorMessage(
          "Ocurrió un error inesperado. Por favor, intenta nuevamente."
        );
        setLoading(false);
        console.error("Signup error:", error);
      }
    });
  };

  const tabItems = [
    {
      key: "login",
      label: "Iniciar Sesión",
      children: (
        <Form
          form={loginForm}
          onFinish={handleLogin}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Por favor ingresa tu email" },
              {
                type: "email",
                message: "Por favor ingresa un email válido",
              },
            ]}
          >
            <Input prefixIcon={<RiMailLine />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Por favor ingresa tu contraseña" },
              {
                min: 6,
                message: "La contraseña debe tener al menos 6 caracteres",
              },
            ]}
          >
            <Password prefixIcon={<RiLockLine />} placeholder="Contraseña" />
          </Form.Item>

          <Form.Item className="mb-0">
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading || isPending}
              className="w-full"
              size="large"
            >
              Iniciar Sesión
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: "signup",
      label: "Crear Cuenta",
      children: (
        <Form
          form={signupForm}
          onFinish={handleSignup}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Por favor ingresa tu email" },
              {
                type: "email",
                message: "Por favor ingresa un email válido",
              },
            ]}
          >
            <Input prefixIcon={<RiMailLine />} placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Por favor ingresa tu contraseña" },
              {
                min: 6,
                message: "La contraseña debe tener al menos 6 caracteres",
              },
            ]}
          >
            <Password prefixIcon={<RiLockLine />} placeholder="Contraseña" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              {
                required: true,
                message: "Por favor confirma tu contraseña",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Las contraseñas no coinciden")
                  );
                },
              }),
            ]}
          >
            <Password
              prefixIcon={<RiLockLine />}
              placeholder="Confirmar Contraseña"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading || isPending}
              className="w-full"
              size="large"
              style={{ backgroundColor: "#16a34a" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#15803d";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#16a34a";
              }}
            >
              Crear Cuenta
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Space
          direction="vertical"
          size="large"
          className="w-full text-center mb-8"
        >
          <Space size="middle" className="justify-center">
            <RiRocketLine className="text-4xl text-blue-600" />
            <Title level={2} className="!mb-0">
              Proyecto Starter
            </Title>
          </Space>
          <Paragraph className="text-gray-600">
            Un proyecto base completo y listo para usar con Next.js 15, Tailwind
            CSS 4 y autenticación
          </Paragraph>
        </Space>

        {/* Success Message */}
        {showSuccess ? (
          <Card>
            <Space
              direction="vertical"
              size="large"
              className="w-full text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <RiCheckLine className="text-3xl text-green-600" />
              </div>
              <Title level={3}>¡Cuenta Creada Exitosamente!</Title>
              <Paragraph className="text-gray-600">
                Hemos enviado un enlace de confirmación a tu correo electrónico.
                Por favor, revisa tu bandeja de entrada y haz clic en el enlace
                para activar tu cuenta.
              </Paragraph>
              <Space direction="vertical" className="w-full" size="small">
                <Button
                  type="primary"
                  onClick={() => router.push("/")}
                  className="w-full"
                  size="large"
                >
                  Volver al Inicio
                </Button>
                <Button
                  onClick={() => {
                    router.replace("/login");
                    setShowSuccess(false);
                  }}
                  className="w-full"
                  size="large"
                  icon={<RiArrowLeftLine />}
                >
                  Volver al Login
                </Button>
              </Space>
            </Space>
          </Card>
        ) : (
          <Card>
            {/* Error Alert */}
            {errorMessage && (
              <Alert
                message={errorMessage}
                type="error"
                showIcon
                closable
                onClose={() => setErrorMessage(null)}
                className="mb-6"
              />
            )}

            {/* Success Alert for Password Reset */}
            {searchParams.get("message") === "password_reset_success" && (
              <Alert
                message="Contraseña restablecida exitosamente"
                description="Tu contraseña ha sido restablecida. Ahora puedes iniciar sesión con tu nueva contraseña."
                type="success"
                showIcon
                closable
                className="mb-6"
              />
            )}

            <Tabs
              activeKey={activeTab}
              onChange={(key) => {
                setActiveTab(key);
                setErrorMessage(null); // Clear errors when switching tabs
              }}
              items={tabItems}
              centered
            />
          </Card>
        )}

        <div className="text-center mt-6">
          <Text type="secondary" className="text-sm">
            Al crear una cuenta o iniciar sesión, aceptas nuestros términos y
            condiciones
          </Text>
        </div>
      </div>
    </div>
  );
}
