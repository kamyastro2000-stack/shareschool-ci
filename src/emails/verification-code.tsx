import {
  Html,
  Body,
  Container,
  Text,
  Preview,
  Tailwind,
  Section,
  Heading,
  Hr,
} from "@react-email/components";

interface VerificationCodeEmailProps {
  code: string;
  firstName: string;
}

export default function VerificationCodeEmail({
  code,
  firstName,
}: VerificationCodeEmailProps) {
  return (
    <Html>
      <Preview>Ton code de vérification ShareSchool</Preview>
      <Tailwind>
        <Body className="bg-[#0f172a] font-sans">
          <Container className="mx-auto py-12 px-4 max-w-[480px]">
            <Section className="bg-[#1e293b] rounded-2xl p-8 border border-[#334155] shadow-2xl">
              <Section className="text-center mb-6">
                <Section className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#f97316] flex items-center justify-center mx-auto mb-4">
                  <Text className="text-white font-bold text-xl m-0">SC</Text>
                </Section>
                <Heading className="text-2xl font-bold text-white m-0">
                  Vérification de ton email
                </Heading>
              </Section>

              <Text className="text-[#94a3b8] text-base leading-relaxed mb-2">
                Bonjour{firstName ? ` ${firstName}` : ""},
              </Text>

              <Text className="text-[#94a3b8] text-base leading-relaxed mb-6">
                Utilise le code ci-dessous pour activer ton compte ShareSchool :
              </Text>

              <Section className="bg-[#0f172a] rounded-xl py-6 px-4 text-center mb-6 border border-[#334155]">
                <Text className="text-[40px] font-bold tracking-[10px] text-white font-mono m-0 select-all">
                  {code}
                </Text>
              </Section>

              <Text className="text-[#64748b] text-sm text-center mb-6">
                Ce code expire dans 15 minutes. Si tu n&apos;as pas demandé cette
                vérification, ignore cet email.
              </Text>

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
