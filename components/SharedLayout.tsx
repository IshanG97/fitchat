import React from "react";
import { Link } from "react-router-dom";
import { Button } from "./Button";
import styles from "./SharedLayout.module.css";
import { MessageSquareHeart } from "lucide-react";

interface SharedLayoutProps {
  children: React.ReactNode;
}

export const SharedLayout = ({ children }: SharedLayoutProps) => {
  const WHATSAPP_LINK = "https://wa.me/1234567890?text=I'm%20ready%20to%20start%20my%20fitness%20journey!";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logo}>
            <MessageSquareHeart size={28} className={styles.logoIcon} />
            <span className={styles.logoText}>FitChat</span>
          </Link>
          <nav className={styles.nav}>
            <a href="#features" className={styles.navLink}>Features</a>
            <a href="#pricing" className={styles.navLink}>Pricing</a>
            <a href="#faq" className={styles.navLink}>FAQ</a>
          </nav>
          <Button asChild size="md" className={styles.headerCta}>
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
              Start Free on WhatsApp
            </a>
          </Button>
        </div>
      </header>
      <main className={styles.mainContent}>{children}</main>
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <Link to="/" className={styles.logo}>
              <MessageSquareHeart size={24} className={styles.logoIcon} />
              <span className={styles.logoText}>FitChat</span>
            </Link>
            <p className={styles.footerTagline}>Your personal coach, right in WhatsApp.</p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.linkColumn}>
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#testimonials">Testimonials</a>
            </div>
            <div className={styles.linkColumn}>
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
            </div>
            <div className={styles.linkColumn}>
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>&copy; {new Date().getFullYear()} FitChat. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};