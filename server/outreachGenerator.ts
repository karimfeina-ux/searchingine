import { getGeminiClient } from './ai.ts';
import type { AppSettings, OutreachDraft, Prospect } from '../src/types/index.ts';

const GDPR_LSSI_COMPLIANCE_NOTICE = `
LEGAL & COMPLIANCE NOTICE (SPAIN & EU - GDPR / LSSI-CE):
1. Ley 34/2002 (LSSI-CE, Art. 21): Commercial communications by electronic means (email, SMS, WhatsApp) to corporate entities or business contacts must be directly relevant to their professional activity.
2. GDPR (Reg. 2016/679 - Art. 6(1)(f)): Processing business contact details for B2B outreach relies on Legitimate Interest. You must provide a clear, effortless opt-out ("Si no deseas recibir más mensajes de mi parte, respóndeme indicándolo y no te volveré a escribir").
3. Do not send mass unreviewed blast campaigns. Review and customize each message before sending.
`.trim();

export const generateOutreachDraft = async (
  prospect: Prospect,
  channel: OutreachDraft['channel'],
  tone: OutreachDraft['tone'],
  settings: AppSettings
): Promise<OutreachDraft> => {
  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `
You are a consultative business development advisor helping an independent web creator in ${settings.cities[0] || 'Barcelona'}, Spain.
The web creator offers bespoke website design starting at €${settings.baseWebsitePrice} and optional €${settings.monthlyHostingPrice}/mo managed hosting.

Draft a highly personalized, non-pushy, high-value outreach message for this business:
Business Name: ${prospect.name}
Category: ${prospect.category}
Location: ${prospect.address}, ${prospect.city}
Channel: ${channel} (Options: email, phone_script, in_person_script, instagram_dm, whatsapp)
Tone: ${tone} (Options: professional, consultative, friendly, value_first)
Website Status: ${prospect.websiteStatus}
Rating: ${prospect.reviewRating}★ (${prospect.reviewCount} reviews)
Positive Highlights: ${prospect.positiveThemes.join(', ') || 'Warm craft and strong local reputation'}

Language: Spanish if in Spain/Catalonia (or English if requested). Default to polished, respectful Spanish suited for a local business owner.

Provide the response in JSON format:
{
  "subject": "Compelling, non-spammy subject line (or conversation title)",
  "body": "The exact script or message text customized to their strengths"
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return {
        id: `outreach_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        prospectId: prospect.id,
        channel,
        subject: parsed.subject || `Propuesta digital para ${prospect.name}`,
        body: parsed.body || getDefaultBody(prospect, channel, settings),
        tone,
        complianceNotes: GDPR_LSSI_COMPLIANCE_NOTICE,
        createdAt: new Date().toISOString()
      };
    } catch (err) {
      console.error('Gemini outreach generation error, using programmatic template:', err);
    }
  }

  return {
    id: `outreach_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    prospectId: prospect.id,
    channel,
    subject: getDefaultSubject(prospect, channel),
    body: getDefaultBody(prospect, channel, settings),
    tone,
    complianceNotes: GDPR_LSSI_COMPLIANCE_NOTICE,
    createdAt: new Date().toISOString()
  };
};

function getDefaultSubject(p: Prospect, channel: string): string {
  if (channel === 'phone_script') return `Guión telefónico para ${p.name}`;
  if (channel === 'in_person_script') return `Visita presencial a ${p.name}`;
  if (channel === 'instagram_dm') return `Mensaje directo para @${p.name.toLowerCase().replace(/\s+/g, '')}`;
  return `Idea de web profesional para ${p.name} en ${p.city}`;
}

function getDefaultBody(p: Prospect, channel: string, settings: AppSettings): string {
  if (channel === 'phone_script') {
    return `— Buenas tardes, ¿podría hablar con el responsable o propietario de ${p.name}?
— Hola, te llamo porque soy diseñador web independiente aquí en ${p.city}. He visto las magníficas valoraciones que tenéis en ${p.category} (${p.reviewRating} estrellas) y me he fijado en que no disponéis de una web oficial propia.
— He preparado un concepto visual de cómo podríais captar reservas directamente desde Google sin depender de plataformas de terceros ni pagar comisiones.
— ¿Te parecería bien que te envíe un enlace de 1 minuto por WhatsApp o email para que le eches un vistazo sin ningún compromiso?`;
  }

  if (channel === 'in_person_script') {
    return `— Hola, buenas tardes. Vengo siguiendo vuestro trabajo aquí en ${p.address} y la excelente reputación que tenéis en ${p.city}.
— Me dedico a crear páginas web a medida para negocios de referencia local. Me he dado cuenta de que clientes potenciales que os buscan en Google no encuentran vuestra web oficial.
— Trabajo con proyectos completos desde €${settings.baseWebsitePrice} y he preparado tres propuestas de diseño pensadas específicamente para ${p.name}. ¿Con quién podría hablar un par de minutos o a qué WhatsApp puedo mandaros el dossier visual?`;
  }

  if (channel === 'instagram_dm' || channel === 'whatsapp') {
    return `¡Hola equipo de ${p.name}! 👋 Enhorabuena por el trabajo que hacéis en ${p.city}, tenéis una comunidad y unas reseñas excelentes (${p.reviewRating}★).

Soy creador web local aquí en la zona. Viendo vuestro perfil, he diseñado un concepto de web interactiva para que vuestros clientes puedan ver la carta/servicios y pedir cita directamente en 2 clics, sin comisiones de intermediarios.

Proyectos completos desde €${settings.baseWebsitePrice}. ¿Os apetecería ver una muestra visual rápida sin ningún compromiso? Un saludo cordial.`;
  }

  // Email
  return `Estimado equipo de ${p.name},

Me pongo en contacto con vosotros porque sigo de cerca los negocios de referencia en ${p.city}. Os felicito por la reputación que habéis consolidado (${p.reviewRating}★ en opiniones públicas).

Al buscar vuestros servicios en Google, he comprobado que actualmente no disponéis de un sitio web oficial independiente. Muchos clientes potenciales que buscan "${p.category.toLowerCase()} en ${p.city}" acaban en directorios genéricos o perfiles de la competencia.

Como diseñador web independiente, creo páginas web modernas, rápidas y optimizadas para móviles desde €${settings.baseWebsitePrice} (con opción de mantenimiento y alojamiento gestionado por €${settings.monthlyHostingPrice}/mes).

He preparado un borrador de cómo podría ser la web de ${p.name}, incluyendo:
1. Catálogo claro de servicios y precios para evitar llamadas innecesarias.
2. Botón directo de reserva y chat de WhatsApp para móvil.
3. Posicionamiento local en Google para vuestro barrio.

Si os resulta de interés, estaré encantado de mostraros el concepto visual sin ningún tipo de compromiso.

Atentamente,
[Tu Nombre / LeadHunter Studio]
Web Creator & Consultor Digital en ${p.city}`;
}
