import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  console.log('Seeding profile data from LinkedIn...');

  // ── 1. UserDetail (singleton) ──────────────────────────────────
  const existingProfile = await prisma.userDetail.findFirst();
  if (existingProfile) {
    await prisma.userDetail.update({
      where: { id: existingProfile.id },
      data: {
        welcomeTitle: 'Ronald Cardenas',
        welcomeNote: 'Sr Backend Developer | AI Engineer | Cloud Architecture (AWS, Azure, GCP)',
        welcomeDescription:
          'Ingeniero de Software con más de 4 años de experiencia desarrollando soluciones escalables en entornos cloud. ' +
          'Experiencia en proyectos de banca, seguros y pagos digitales, participando en el diseño técnico de soluciones, ' +
          'arquitecturas backend y revisión de código (PRs). Trabajo con microservicios y arquitectura hexagonal, aplicando ' +
          'buenas prácticas para construir software limpio, robusto y mantenible. Me motiva resolver problemas complejos ' +
          'y desarrollar soluciones con impacto real.',
      },
    });
    console.log('  ✓ UserDetail updated');
  } else {
    await prisma.userDetail.create({
      data: {
        welcomeTitle: 'Ronald Cardenas',
        welcomeNote: 'Sr Backend Developer | AI Engineer | Cloud Architecture (AWS, Azure, GCP)',
        welcomeDescription:
          'Ingeniero de Software con más de 4 años de experiencia desarrollando soluciones escalables en entornos cloud. ' +
          'Experiencia en proyectos de banca, seguros y pagos digitales, participando en el diseño técnico de soluciones, ' +
          'arquitecturas backend y revisión de código (PRs). Trabajo con microservicios y arquitectura hexagonal, aplicando ' +
          'buenas prácticas para construir software limpio, robusto y mantenible. Me motiva resolver problemas complejos ' +
          'y desarrollar soluciones con impacto real.',
        userImage: '',
      },
    });
    console.log('  ✓ UserDetail created');
  }

  // ── 2. UserSocialLinks ─────────────────────────────────────────
  const socialLinksData = [
    { name: 'LinkedIn', link: 'https://www.linkedin.com/in/ronal-cardenas-c/', icon: 'linkedin' },
    { name: 'Website', link: 'https://www.corleo.dev/', icon: 'globe' },
    { name: 'Email', link: 'mailto:cardenascode7@outlook.com', icon: 'mail' },
    { name: 'GitHub', link: 'https://github.com/', icon: 'github' },
    { name: 'Instagram', link: 'https://www.instagram.com/', icon: 'instagram' },
    { name: 'TikTok', link: 'https://www.tiktok.com/', icon: 'tiktok' },
  ];

  for (const sl of socialLinksData) {
    const existing = await prisma.userSocialLink.findFirst({ where: { name: sl.name } });
    if (existing) {
      await prisma.userSocialLink.update({ where: { id: existing.id }, data: { link: sl.link, icon: sl.icon } });
    } else {
      await prisma.userSocialLink.create({ data: sl });
    }
  }
  console.log('  ✓ Social links seeded');

  // ── 3. AboutContent ────────────────────────────────────────────
  const aboutText =
    'Ingeniero de Software con más de 4 años de experiencia desarrollando soluciones escalables en entornos cloud. ' +
    'Experiencia en proyectos de banca, seguros y pagos digitales, participando en el diseño técnico de soluciones, ' +
    'arquitecturas backend y revisión de código (PRs). Trabajo con microservicios y arquitectura hexagonal, aplicando ' +
    'buenas prácticas para construir software limpio, robusto y mantenible. Me motiva resolver problemas complejos ' +
    'y desarrollar soluciones con impacto real.';

  const existingAbout = await prisma.aboutContent.findFirst();
  if (existingAbout) {
    await prisma.aboutContent.update({ where: { id: existingAbout.id }, data: { paragraph: aboutText } });
  } else {
    await prisma.aboutContent.create({ data: { paragraph: aboutText } });
  }
  console.log('  ✓ About content seeded');

  // ── 4. Experiences ─────────────────────────────────────────────
  const experiencesData = [
    {
      title: 'Senior Software Engineer',
      company: 'Coforge',
      location: 'Lima, Perú',
      description:
        'Coforge (antes Encora) — Cliente: Niubiz – Soluciones de Pagos Digitales',
      startDate: new Date('2025-02-01'),
      endDate: null,
      technologies: ['NestJS', 'Node.js', 'TypeScript', 'AWS', 'Microservices', 'QR Payments', 'Digital Payments'],
      inputs: [
        'Desarrollé soluciones de pagos digitales con QR y pasarela de pagos integradas en la plataforma de Niubiz.',
        'Diseñé arquitecturas backend escalables y seguras para soportar altos volúmenes transaccionales y alta disponibilidad.',
        'Integré servicios y sistemas Core, optimizando rendimiento, estabilidad y tiempos de respuesta.',
        'Colaboré con equipos multidisciplinarios bajo metodologías ágiles, contribuyendo a entregas continuas con altos estándares de calidad técnica.',
      ],
    },
    {
      title: 'Desarrollador de back-end',
      company: 'Inetum',
      location: 'Lima, Perú',
      description:
        'Cliente: Pacífico Salud – Core Backend y Cloud Infraestructura',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-11-30'),
      technologies: ['NestJS', 'TypeScript', 'Azure', 'Hexagonal Architecture', 'Node.js'],
      inputs: [
        'Desarrollé una librería core y un generador de arquetipos con arquitectura hexagonal en NestJS, estableciendo bases reutilizables y escalables para servicios backend.',
        'Implementé servicios y despliegue en la nube (Azure) para soportar infraestructura backend con alta disponibilidad, seguridad y escalabilidad.',
        'Participé en el diseño de patrones de arquitectura de software y mejores prácticas para garantizar mantenimiento eficiente, pruebas consistentes y estándares de calidad.',
        'Colaboré con equipos remotos y multidisciplinarios bajo metodologías ágiles para entregar soluciones de backend robustas y alineadas a objetivos del cliente.',
      ],
    },
    {
      title: 'Ingeniero de software',
      company: 'NTT DATA Europe & Latam',
      location: 'Lima, Perú',
      description:
        'Cliente: Interbank – Backend Cloud para Proyectos Financieros',
      startDate: new Date('2022-03-01'),
      endDate: new Date('2024-06-30'),
      technologies: ['Java', 'Spring Boot', 'NestJS', 'Azure', 'Kubernetes', 'Docker', 'Microservices', 'TypeScript'],
      inputs: [
        'Desembolsos para grandes empresas: Desarrollé microservicios y APIs en Java (Spring Boot) y NestJS para soportar operaciones de desembolso y financiamiento empresarial, integrando sistemas internos y garantizando rendimiento y seguridad.',
        'Digitalización del proceso hipotecario: Contribuí al desarrollo de servicios backend para la digitalización del proceso de créditos hipotecarios, apoyando la automatización de flujos críticos de negocio en la banca digital.',
        'Implementé soluciones en Microsoft Azure y orquestación con Kubernetes, asegurando despliegues eficientes, alta disponibilidad y escalabilidad de servicios en producción.',
        'Colaboré con equipos técnicos en entornos ágiles, aportando en diseño de software, integración de APIs y mejores prácticas de desarrollo continuo.',
      ],
    },
    {
      title: 'Desarrollador Backend Asistente',
      company: 'Summit Consulting',
      location: 'Lima, Perú',
      description: 'Soporte técnico y desarrollo en sistemas empresariales.',
      startDate: new Date('2021-11-01'),
      endDate: new Date('2022-02-28'),
      technologies: ['Angular', '.NET', 'C#', 'SQL Server', 'Electronic Invoicing'],
      inputs: [
        'Realicé soporte técnico y análisis de incidencias (bugs) en dos sistemas empresariales, aportando a la estabilidad y mejora continua de las aplicaciones.',
        'Trabajé en el módulo de facturación electrónica, revisando y corrigiendo errores en un sistema frontend en Angular y backend en .NET, asegurando cumplimiento con procesos contables y flujos de emisión electrónica.',
        'Brindé soporte y corrección de fallos en un ERP orientado a la gestión de negocios (incluyendo facturación y módulos administrativos para boticas y otros comercios), mejorando su calidad operativa.',
        'Colaboré con el equipo de desarrollo para reproducir, analizar y resolver reportes de fallas, facilitando la entrega de nuevas versiones con mayor calidad y menor tasa de errores.',
      ],
    },
  ];

  for (const expData of experiencesData) {
    const slug = generateSlug(`${expData.title}-${expData.company}`);
    const existing = await prisma.experience.findUnique({ where: { slug } });

    if (existing) {
      // Update existing experience
      const { inputs: inputContents, ...expFields } = expData;
      await prisma.experience.update({
        where: { id: existing.id },
        data: {
          ...expFields,
          slug,
        },
      });
      // Replace inputs
      await prisma.experienceInput.deleteMany({ where: { experienceId: existing.id } });
      for (const content of inputContents) {
        await prisma.experienceInput.create({
          data: { content, experienceId: existing.id },
        });
      }
      console.log(`  ✓ Experience updated: ${expData.title} @ ${expData.company}`);
    } else {
      const { inputs: inputContents, ...expFields } = expData;
      const created = await prisma.experience.create({
        data: {
          ...expFields,
          slug,
        },
      });
      for (const content of inputContents) {
        await prisma.experienceInput.create({
          data: { content, experienceId: created.id },
        });
      }
      console.log(`  ✓ Experience created: ${expData.title} @ ${expData.company}`);
    }
  }

  // ── 5. SkillCategories & Skills ────────────────────────────────
  const skillCategoriesData = [
    {
      name: 'Backend & Cloud',
      description: 'Server-side frameworks, cloud platforms, and infrastructure tools',
      icon: '☁️',
      color: 'from-blue-400 to-blue-600',
      order: 0,
      skills: [
        { name: 'NestJS', proficiency: 92, order: 0 },
        { name: 'Spring Boot', proficiency: 80, order: 1 },
        { name: 'Node.js', proficiency: 88, order: 2 },
        { name: 'Java', proficiency: 82, order: 3 },
        { name: 'TypeScript', proficiency: 90, order: 4 },
        { name: 'Azure', proficiency: 80, order: 5 },
        { name: 'AWS', proficiency: 75, order: 6 },
        { name: 'Kubernetes', proficiency: 72, order: 7 },
        { name: 'Docker', proficiency: 78, order: 8 },
        { name: 'MongoDB', proficiency: 80, order: 9 },
        { name: 'PostgreSQL', proficiency: 75, order: 10 },
        { name: 'GraphQL', proficiency: 70, order: 11 },
      ],
    },
    {
      name: 'Frontend & Tools',
      description: 'Frontend frameworks and development tools',
      icon: '🎨',
      color: 'from-green-400 to-emerald-600',
      order: 1,
      skills: [
        { name: 'Angular', proficiency: 72, order: 0 },
        { name: 'React', proficiency: 70, order: 1 },
        { name: 'Next.js', proficiency: 75, order: 2 },
        { name: '.NET / C#', proficiency: 65, order: 3 },
        { name: 'Tailwind CSS', proficiency: 78, order: 4 },
      ],
    },
    {
      name: 'AI & Machine Learning',
      description: 'AI/ML tools and frameworks',
      icon: '🤖',
      color: 'from-purple-400 to-violet-600',
      order: 2,
      skills: [
        { name: 'AWS Glue', proficiency: 70, order: 0 },
        { name: 'AI-Powered Software Design', proficiency: 75, order: 1 },
        { name: 'GitHub Copilot', proficiency: 88, order: 2 },
        { name: 'Claude Code', proficiency: 86, order: 3 },
        { name: 'OpenCode', proficiency: 82, order: 4 },
        { name: 'OpenAI Codex', proficiency: 78, order: 5 },
        { name: 'Microsoft Foundry', proficiency: 80, order: 6 },
        { name: 'Amazon Bedrock', proficiency: 78, order: 7 },
      ],
    },
    {
      name: 'Languages & Certifications',
      description: 'Languages and professional certifications',
      icon: '📜',
      color: 'from-amber-400 to-orange-600',
      order: 3,
      skills: [
        { name: 'English (C1 Advanced)', proficiency: 75, order: 0 },
        { name: 'Spanish (Native)', proficiency: 100, order: 1 },
      ],
    },
  ];

  for (const catData of skillCategoriesData) {
    const slug = generateSlug(catData.name);
    const { skills: skillsData, ...catFields } = catData;

    const existingCat = await prisma.skillCategory.findUnique({ where: { slug } });
    let categoryId: string;

    if (existingCat) {
      await prisma.skillCategory.update({
        where: { id: existingCat.id },
        data: { ...catFields, slug },
      });
      categoryId = existingCat.id;
      console.log(`  ✓ SkillCategory updated: ${catData.name}`);
    } else {
      const created = await prisma.skillCategory.create({
        data: { ...catFields, slug },
      });
      categoryId = created.id;
      console.log(`  ✓ SkillCategory created: ${catData.name}`);
    }

    for (const skillData of skillsData) {
      const skillSlug = generateSlug(skillData.name);
      const existingSkill = await prisma.skill.findUnique({ where: { slug: skillSlug } });

      if (existingSkill) {
        await prisma.skill.update({
          where: { id: existingSkill.id },
          data: { proficiency: skillData.proficiency, order: skillData.order, categoryId },
        });
      } else {
        await prisma.skill.create({
          data: {
            name: skillData.name,
            slug: skillSlug,
            proficiency: skillData.proficiency,
            order: skillData.order,
            categoryId,
          },
        });
      }
    }
    console.log(`  ✓ Skills seeded for: ${catData.name}`);
  }

  // ── 6. Education ───────────────────────────────────────────────
  const educationData = [
    {
      institution: 'UTP Universidad Tecnológica del Perú',
      degree: 'Software Engineer',
      field: 'Tecnología de la información',
      startDate: new Date('2022-06-01'),
      endDate: new Date('2024-03-31'),
      order: 0,
    },
    {
      institution: 'Idat',
      degree: 'Desarrollo de Sistemas',
      field: 'Desarrollo de Sistemas',
      startDate: new Date('2019-01-01'),
      endDate: new Date('2021-12-31'),
      order: 1,
    },
  ];

  for (const eduData of educationData) {
    const slug = generateSlug(`${eduData.degree}-${eduData.institution}`);
    const existing = await prisma.education.findUnique({ where: { slug } });

    if (existing) {
      await prisma.education.update({
        where: { id: existing.id },
        data: { ...eduData, slug },
      });
      console.log(`  ✓ Education updated: ${eduData.degree} @ ${eduData.institution}`);
    } else {
      await prisma.education.create({
        data: { ...eduData, slug },
      });
      console.log(`  ✓ Education created: ${eduData.degree} @ ${eduData.institution}`);
    }
  }

  console.log('\nProfile seeding complete!');
}

main()
  .catch((e) => {
    console.error('Error seeding profile:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
