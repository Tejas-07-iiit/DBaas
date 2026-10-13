import { LegalLayout } from "@/components/legal/LegalLayout";

const sections = [
  { id: "information-we-collect", title: "1. Information we collect" },
  { id: "how-we-use", title: "2. How we use your information" },
  { id: "data-storage", title: "3. Data storage and retention" },
  { id: "sharing", title: "4. Sharing your information" },
  { id: "cookies", title: "5. Cookies" },
  { id: "security", title: "6. Security" },
  { id: "your-rights", title: "7. Your rights" },
];

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="Oct 1, 2026" sections={sections}>
      <h2 id="information-we-collect">1. Information we collect</h2>
      <p>We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us.</p>
      
      <h2 id="how-we-use">2. How we use your information</h2>
      <p>We use the information we collect about you to provide, maintain, and improve our services, including facilitating payments, sending receipts, providing products and services you request.</p>
      
      <h2 id="data-storage">3. Data storage and retention</h2>
      <p>We store your personal data on secure servers and retain it only as long as necessary to fulfill the purposes described in this policy.</p>
      
      <h2 id="sharing">4. Sharing your information</h2>
      <p>We may share the information we collect about you with vendors, consultants, marketing partners, and other service providers who need access to such information to carry out work on our behalf.</p>
      
      <h2 id="cookies">5. Cookies</h2>
      <p>We use cookies and similar tracking technologies to track the activity on our service and hold certain information.</p>
      
      <h2 id="security">6. Security</h2>
      <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>
      
      <h2 id="your-rights">7. Your rights</h2>
      <p>You have the right to access, update or to delete the information we have on you. You can do this directly within your account settings section.</p>
    </LegalLayout>
  );
}
