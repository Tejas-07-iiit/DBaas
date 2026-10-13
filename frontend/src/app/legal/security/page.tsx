import { LegalLayout } from "@/components/legal/LegalLayout";
import { securityLayers, securityYourPart, securityReport } from "@/data/security";

export default function SecurityPolicy() {
  const sections = [
    ...securityLayers.map((layer, index) => ({
      id: `layer-${index}`,
      title: `${index + 1}. ${layer.title}`
    })),
    { id: 'your-part', title: securityYourPart.title },
    { id: 'report-issue', title: securityReport.title }
  ];

  return (
    <LegalLayout title="Security Policy" lastUpdated="October 2026" sections={sections}>
      <div className="bg-accent/10 text-accent p-4 rounded-lg mb-8">
        <strong>Note:</strong> This is a sample security policy for demonstration purposes.
      </div>
      
      {securityLayers.map((layer, index) => (
        <section key={index} id={`layer-${index}`} className="mb-8">
          <h2 className="text-2xl font-bold mb-4">{index + 1}. {layer.title}</h2>
          <p className="mb-4">{layer.description}</p>
          <ul className="list-disc pl-6 space-y-2">
            {layer.bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </section>
      ))}

      <section id="your-part" className="mb-8">
        <h2 className="text-2xl font-bold mb-4">{securityYourPart.title}</h2>
        <p className="mb-4">{securityYourPart.description}</p>
        <ul className="list-disc pl-6 space-y-2">
          {securityYourPart.bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      </section>

      <section id="report-issue" className="mb-8">
        <h2 className="text-2xl font-bold mb-4">{securityReport.title}</h2>
        <p className="mb-4">{securityReport.content}</p>
        <p><a href={`mailto:${securityReport.email}?subject=Security report`} className="text-accent hover:underline">{securityReport.email}</a></p>
      </section>
    </LegalLayout>
  );
}
