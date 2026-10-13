import { LegalLayout } from "@/components/legal/LegalLayout";

const sections = [
  { id: "accounts", title: "1. Accounts" },
  { id: "acceptable-use", title: "2. Acceptable use" },
  { id: "plans", title: "3. Plans and billing" },
  { id: "availability", title: "4. Service availability" },
  { id: "ownership", title: "5. Data ownership" },
  { id: "termination", title: "6. Termination" },
  { id: "liability", title: "7. Limitation of liability" },
];

export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="Sep 15, 2026" sections={sections}>
      <h2 id="accounts">1. Accounts</h2>
      <p>When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms.</p>
      <h2 id="acceptable-use">2. Acceptable use</h2>
      <p>You agree not to use the Service in any way that causes, or may cause, damage to the Service or impairment of the availability or accessibility of the Service.</p>
      <h2 id="plans">3. Plans and billing</h2>
      <p>Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis.</p>
      <h2 id="availability">4. Service availability</h2>
      <p>We constantly update our offerings of products and services on the Service. We cannot and do not guarantee the accuracy or completeness of any information.</p>
      <h2 id="ownership">5. Data ownership</h2>
      <p>You retain all your rights to any content you submit, post or display on or through the Service and you are responsible for protecting those rights.</p>
      <h2 id="termination">6. Termination</h2>
      <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever.</p>
      <h2 id="liability">7. Limitation of liability</h2>
      <p>In no event shall DBaaS, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages.</p>
    </LegalLayout>
  );
}
