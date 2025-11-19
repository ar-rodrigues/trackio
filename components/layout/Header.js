"use client";

import { useState, useEffect } from "react";
import { Layout, Typography } from "antd";
import { RiMenuLine, RiCloseLine, RiRocketLine } from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";

const { Header: LayoutHeader } = Layout;
const { Title } = Typography;

/**
 * Reusable Header component with navigation
 * @param {Object} props - Header props
 * @param {React.ReactNode} props.authButton - Auth button to display on the right
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.rest - Additional Ant Design Header props
 */
export default function Header({ authButton, className = "", ...rest }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      
      // Update active section based on scroll position
      const sections = ["hero", "servicos", "precos"];
      const scrollPosition = window.scrollY + 150;
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const element = document.getElementById(sections[i]);
        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setMobileMenuOpen(false);
      setActiveSection(sectionId);
    }
  };

  const navItems = [
    { id: "hero", label: "Início" },
    { id: "servicos", label: "Serviços" },
    { id: "precos", label: "Preços" },
  ];

  return (
    <LayoutHeader
      className={`sticky top-0 z-50 flex items-center justify-between bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 shadow-lg px-4 md:px-8 lg:px-12 py-5 md:py-6 transition-all duration-300 ${
        scrolled ? "shadow-2xl" : ""
      } ${className}`}
      style={{
        minHeight: "80px",
      }}
      {...rest}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3"
      >
        <RiRocketLine className="text-3xl md:text-4xl text-white" />
        <Title
          level={3}
          className="!mb-0 !text-white !font-bold !text-xl md:!text-2xl"
          style={{ color: "#ffffff" }}
        >
          Trackio
        </Title>
      </motion.div>

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-2">
        {navItems.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollToSection(item.id)}
            className={`relative px-5 py-2.5 rounded-lg font-semibold text-base transition-all duration-300 cursor-pointer ${
              activeSection === item.id
                ? "bg-blue-600 shadow-lg"
                : "hover:bg-blue-800/70"
            }`}
            style={{ color: "#ffffff" }}
          >
            {item.label}
            {activeSection === item.id && (
              <motion.div
                layoutId="activeSection"
                className="absolute inset-0 bg-blue-600 rounded-lg -z-10"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </nav>

      {/* Auth Button & Mobile Menu */}
      <div className="flex items-center gap-4">
        {authButton && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="hidden md:block"
          >
            {authButton}
          </motion.div>
        )}

        {/* Mobile Menu Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="lg:hidden text-white hover:text-blue-300 transition-colors p-2 cursor-pointer"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <RiCloseLine className="text-2xl" />
          ) : (
            <RiMenuLine className="text-2xl" />
          )}
        </motion.button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute top-full left-0 right-0 bg-slate-900 border-t border-blue-800 shadow-2xl lg:hidden overflow-hidden"
          >
            <nav className="flex flex-col p-4">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-left rounded-lg font-semibold py-4 px-5 transition-all duration-200 cursor-pointer ${
                    activeSection === item.id
                      ? "bg-blue-600"
                      : "hover:bg-blue-800/70"
                  }`}
                  style={{ color: "#ffffff" }}
                >
                  {item.label}
                </motion.button>
              ))}
              {authButton && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="mt-4 pt-4 border-t border-blue-800"
                >
                  {authButton}
                </motion.div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutHeader>
  );
}
