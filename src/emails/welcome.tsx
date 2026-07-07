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

interface WelcomeEmailProps {
  firstName: string;
  establishmentName: string;
  className: string;
}

export default function WelcomeEmail({
  firstName,
  establishmentName,
  className,
}: WelcomeEmailProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <Html>
      <Preview>Bienvenue sur ShareSchool CI, {firstName} !</Preview>
      <Tailwind>
        <Body className="bg-[#0f172a] font-sans">
          <Container className="mx-auto py-12 px-4 max-w-[480px]">
            <Section className="bg-[#1e293b] rounded-2xl p-8 border border-[#334155] shadow-2xl">
              <Section className="text-center mb-6">
                <Section className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#f97316] flex items-center justify-center mx-auto mb-4">
                  <Text className="text-white font-bold text-xl m-0">SC</Text>
                </Section>
                <Heading className="text-2xl font-bold text-white m-0">
                  Bienvenue sur ShareSchool 🎉
                </Heading>
              </Section>

              <Text className="text-[#94a3b8] text-base leading-relaxed mb-2">
                Bonjour {firstName},
              </Text>

              <Text className="text-[#94a3b8] text-base leading-relaxed mb-6">
                Ton email a été vérifié avec succès ! Tu fais maintenant partie
                de l&apos;établissement{" "}
                <Text className="text-white font-semibold inline">
                  {establishmentName}
                </Text>
                , dans la classe{" "}
                <Text className="text-white font-semibold inline">
                  {className}
                </Text>
                .
              </Text>

              <Text className="text-[#94a3b8] text-base leading-relaxed mb-6">
                Voici ce qui t&apos;attend :
              </Text>

              <Section className="space-y-3 mb-6">
                {[
                  "📚 Consulte et télécharge les ressources de ta classe",
                  "✍️ Participe aux quiz et teste tes connaissances",
                  "⭐ Gagne de l'XP et débloque des badges",
                  "💬 Discute avec tes camarades dans le chat",
                ].map((item, i) => (
                  <Section key={i} className="bg-[#0f172a] rounded-lg px-4 py-3 border border-[#334155]">
                    <Text className="text-[#cbd5e1] text-sm m-0">{item}</Text>
                  </Section>
                ))}
              </Section>

              <Section className="text-center mb-6">
                <Link
                  href={baseUrl + "/dashboard"}
                  className="inline-block px-8 py-4 rounded-xl text-white font-semibold text-base no-underline"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  }}
                >
                  Accéder à mon tableau de bord
                </Link>
              </Section>

              <Hr className="border-[#334155] mb-6" />

              <Text className="text-[#64748b] text-xs text-center m-0">
                ShareSchool CI — La plateforme de partage pédagogique pour les élèves ivoiriens
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
