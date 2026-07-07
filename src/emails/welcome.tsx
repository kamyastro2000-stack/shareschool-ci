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
  return (
    <Html>
      <Preview>Bienvenue sur ShareSchool CI, {firstName} !</Preview>
      <Tailwind>
        <Body className="bg-[#1e1b4b] font-sans">
          <Container className="mx-auto py-12 px-4">
            <Section className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <Heading className="text-3xl font-bold text-white text-center mb-6">
                Bienvenue sur ShareSchool CI 🎉
              </Heading>

              <Text className="text-white/80 text-lg mb-4">
                Bonjour {firstName},
              </Text>

              <Text className="text-white/70 text-base leading-relaxed mb-6">
                Ton compte a été créé avec succès ! Tu fais maintenant partie de
                l&apos;établissement <strong className="text-white">{establishmentName}</strong>,
                dans la classe <strong className="text-white">{className}</strong>.
              </Text>

              <Text className="text-white/70 text-base leading-relaxed mb-6">
                Tu peux dès maintenant te connecter et commencer à explorer les
                ressources pédagogiques partagées par tes camarades et professeurs.
              </Text>

              <Section className="text-center mb-8">
                <Link
                  href={process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}
                  className="inline-block px-8 py-4 rounded-xl text-white font-semibold text-base"
                  style={{
                    background: "linear-gradient(135deg, #1e3a5f, #2d5a8e)",
                  }}
                >
                  Accéder à mon espace
                </Link>
              </Section>

              <Text className="text-white/50 text-sm text-center">
                ShareSchool CI — La plateforme de partage pédagogique pour les
                élèves ivoiriens
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
