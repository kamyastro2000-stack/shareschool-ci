import {
  Html,
  Body,
  Container,
  Text,
  Link,
  Preview,
  Tailwind,
  Section,
  Heading,
  Hr,
} from "@react-email/components";

interface ResourceNotificationEmailProps {
  firstName: string;
  resourceTitle: string;
  status: "APPROVED" | "REJECTED";
  comment?: string;
}

export default function ResourceNotificationEmail({
  firstName,
  resourceTitle,
  status,
  comment,
}: ResourceNotificationEmailProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const isApproved = status === "APPROVED";

  return (
    <Html>
      <Preview>
        Ressource {isApproved ? "approuvée" : "refusée"} — {resourceTitle}
      </Preview>
      <Tailwind>
        <Body className="bg-[#0f172a] font-sans">
          <Container className="mx-auto py-12 px-4 max-w-[480px]">
            <Section
              className="bg-[#1e293b] rounded-2xl p-8 border border-[#334155] shadow-2xl"
            >
              <Section className="text-center mb-6">
                <Section
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                    isApproved
                      ? "bg-gradient-to-br from-[#22c55e] to-[#16a34a]"
                      : "bg-gradient-to-br from-[#ef4444] to-[#dc2626]"
                  }`}
                >
                  <Text className="text-white font-bold text-xl m-0">
                    {isApproved ? "✓" : "✗"}
                  </Text>
                </Section>
                <Heading className="text-2xl font-bold text-white m-0">
                  Ressource {isApproved ? "approuvée" : "refusée"}
                </Heading>
              </Section>

              <Text className="text-[#94a3b8] text-base leading-relaxed mb-2">
                Bonjour {firstName},
              </Text>

              <Text className="text-[#94a3b8] text-base leading-relaxed mb-4">
                Ta ressource{" "}
                <Text className="text-white font-semibold inline">
                  &ldquo;{resourceTitle}&rdquo;
                </Text>{" "}
                a été{" "}
                {isApproved ? (
                  <Text className="text-[#22c55e] font-semibold inline">
                    approuvée
                  </Text>
                ) : (
                  <Text className="text-[#ef4444] font-semibold inline">
                    refusée
                  </Text>
                )}{" "}
                par un validateu{isApproved ? "r" : "r"}.
              </Text>

              {comment && (
                <Section className="bg-[#0f172a] rounded-xl p-4 mb-6 border border-[#334155]">
                  <Text className="text-[#64748b] text-xs uppercase tracking-wider mb-2">
                    Commentaire du validateur
                  </Text>
                  <Text className="text-[#cbd5e1] text-sm m-0 italic">
                    &ldquo;{comment}&rdquo;
                  </Text>
                </Section>
              )}

              {isApproved && (
                <Section className="text-center mb-6">
                  <Link
                    href={baseUrl + "/dashboard"}
                    className="inline-block px-8 py-4 rounded-xl text-white font-semibold text-base no-underline"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                    }}
                  >
                    Voir mes ressources
                  </Link>
                </Section>
              )}

              <Hr className="border-[#334155] mb-6" />

              <Text className="text-[#64748b] text-xs text-center m-0">
                ShareSchool CI — Plateforme de partage pédagogique pour les élèves ivoiriens
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
