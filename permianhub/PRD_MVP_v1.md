# PermianHub — Documento Maestro de Producto MVP v1.0
> Arquitecto de Producto + Tech Lead + PM  
> Fecha: 2026-05-22 | Fase: MVP → Beta → Escala  
> Idioma principal: Español (producto: ES/EN bilingüe)

---

## NOTA PREVIA: NAMING Y DOMINIO

| Opción | Dominio | Estado estimado | Observación |
|---|---|---|---|
| PermianHub | permianhub.com | Registrado (verificar) | Nombre ideal, explorar adquisición o negociación |
| PermianHub | permianhub.io / .app / .co | Probablemente libre | Alternativa de lanzamiento viable |
| BasinPro | basinpro.com | Verificar | Connotación profesional fuerte |
| PermianPro | permianpro.com | Verificar | Claro y directo |
| BasinConnect | basinconnect.com | Verificar | Énfasis en red/conexión |
| EnergyHub Permian | energyhubpermian.com | Verificar | Descriptivo, menos diferenciado |

**Decisión operativa:** Usar "PermianHub" como nombre de marca de trabajo. Para lanzamiento, registrar `permianhub.io` o `permianhub.app` mientras se evalúa adquisición del .com. Dominio no bloquea el build.

---

# 1. PRD COMPLETO (MVP)

## 1.1 Visión y Objetivo

**Visión:** Ser la plataforma de referencia del ecosistema energético del Permian Basin — donde empresas encuentran proveedores confiables, proveedores ganan visibilidad y profesionales acceden a oportunidades, todo en un entorno verificado, trazable y bilingüe.

**Problema a resolver:**
- La contratación y conexión de servicios en el Permian ocurre de manera fragmentada: WhatsApp, llamadas directas, grupos de Facebook, directorios dispersos y referencias informales.
- No existe trazabilidad de acuerdos, reputación verificable ni velocidad estructurada para cotizar y contratar.
- Empresas tardan días en conseguir cotizaciones comparables; proveedores desperdician tiempo en leads de mala calidad.

**Propuesta de valor central:**
> "Encuentra, verifica, cotiza y conecta con el proveedor correcto en el Permian — en minutos, no en días."

## 1.2 Objetivos de Negocio (MVP)

| Objetivo | Meta 90 días | Meta 6 meses |
|---|---|---|
| Empresas compradoras activas | 30 | 120 |
| Proveedores con perfil completo | 80 | 350 |
| Solicitudes publicadas | 150 | 800 |
| Leads entregados (válidos) | 200 | 2,000 |
| MRR (ingresos recurrentes) | USD 2,000 | USD 18,000 |
| NPS plataforma | ≥ 40 | ≥ 50 |

## 1.3 Usuarios Objetivo (Roles)

| Rol | Descripción | Motivación principal |
|---|---|---|
| **Empresa Compradora** | Operadoras, contratistas generales, depts. de compras/operaciones | Encontrar proveedor rápido, verificado y con historial |
| **Proveedor de Servicios** | Empresas de servicios directos e indirectos | Recibir leads calificados, ganar visibilidad, crecer ventas |
| **Profesional/Técnico** | Técnicos, operadores, ingenieros independientes | Encontrar empleo/contratos (fase 2 más fuerte; base en MVP) |
| **Admin Interno** | Staff de PermianHub (operaciones, soporte, moderación) | Gestionar, verificar y operar la plataforma |

**Supuesto explícito #1:** El rol de Profesional/Técnico está presente en MVP pero con funciones limitadas (perfil + feed); el marketplace de empleo es Beta.

## 1.4 Alcance MVP — IN SCOPE

### Módulo 1: Auth & Onboarding
- Registro por email + Google OAuth
- Selección de rol al registrar (empresa / proveedor / profesional)
- Flujo de onboarding guiado por rol (5 pasos máximo)
- MFA opcional en MVP, obligatorio para admin
- Recuperación de contraseña

### Módulo 2: Perfiles
- Perfil de Empresa: nombre, logo, industria, descripción, ubicación, contacto
- Perfil de Proveedor: razón social, logo, banner, descripción, categorías, zona de cobertura, certificaciones, galería (fotos/videos)
- Perfil de Profesional: nombre, foto, rol/especialidad, experiencia, certis
- Verificación básica: documento de empresa (LLC/Corp), email corporativo, teléfono
- Badges de verificación visibles en perfiles

### Módulo 3: Feed Social
- Timeline cronológico + ranked (por relevancia de categoría/zona)
- Tipos de post: texto, imagen(es), video, enlace, logro/hito, vacante básica
- Acciones: like, comentar, compartir, guardar
- Menciones (@usuario) y hashtags (#categoria)
- Filtro de feed por categoría y zona
- Reportar contenido inapropiado

### Módulo 4: Solicitudes (Marketplace)
- Publicación estructurada de solicitud por empresa/comprador
- Campos: categoría, descripción, ubicación, presupuesto estimado (opcional), fecha límite, adjuntos
- Estados: Abierta → En cotización → Adjudicada → Completada → Cancelada
- Vista de solicitudes para proveedores (con filtros)
- Envío de cotización por proveedor (monto, descripción, validez, adjuntos)
- Aceptar/rechazar cotización por empresa
- Historial de solicitudes y cotizaciones

### Módulo 5: Matching & Búsqueda
- Búsqueda full-text de proveedores y solicitudes
- Filtros: categoría, zona/radio, verificado, calificación, disponibilidad
- Matching automático básico: notificar a proveedores en categoría + zona cuando se publica solicitud compatible
- Ranking de resultados: verificado > calificación > distancia > actividad reciente
- Mapa de proveedores con pines (Mapbox)

### Módulo 6: Chat Interno
- Conversación por solicitud (contextual: empresa + proveedor)
- Mensajes de texto + adjuntos (imagen, PDF, doc)
- Estados: enviado / recibido / leído
- Historial completo y auditable
- Notificación de nuevo mensaje

### Módulo 7: Notificaciones
- In-app (bell icon + centro de notificaciones)
- Email (transaccional via SendGrid)
- Push web (PWA-ready para fase móvil)
- Eventos: nueva solicitud compatible, nueva cotización, nuevo mensaje, cambio de estado, reseña recibida, verificación resuelta, alerta de seguridad
- Preferencias configurables por usuario
- Quiet hours (no enviar entre 10pm–7am hora local)

### Módulo 8: Reseñas y Reputación
- Reseña post-servicio (solo tras solicitud completada)
- Rating 1-5 estrellas + comentario
- Dimensiones: calidad, puntualidad, comunicación, valor
- Verificadas (solo participantes de la solicitud)
- Respuesta del proveedor a reseña
- Score agregado visible en perfil

### Módulo 9: Geolocalización (Mapbox)
- Mapa principal con pines de proveedores
- Autocomplete de dirección en formularios
- Filtro por radio (10/25/50 millas)
- Distancia estimada solicitud → proveedor
- Radio de cobertura del proveedor
- Área aproximada (privacidad hasta match confirmado)
- Geocoding al crear solicitud; fallback por ciudad

### Módulo 10: Pagos y Suscripción (Stripe)
- Planes: Free / Pro Launch ($39/mes) / Business Launch ($99/mes)
- Leads incluidos por plan; créditos adicionales
- Método de pago: tarjeta (Visa/MC/Amex) + ACH
- Facturación mensual automática
- Dashboard de facturación y consumo de leads
- Reembolso de lead inválido (política 7 días)

### Módulo 11: Panel por Rol (Dashboards)
- **Empresa:** solicitudes activas, cotizaciones recibidas, proveedores favoritos, historial
- **Proveedor:** leads recibidos, cotizaciones enviadas, estadísticas de perfil, suscripción
- **Admin:** usuarios, verificaciones pendientes, solicitudes activas, reportes de contenido, métricas generales

### Módulo 12: Backoffice Admin (Web)
- Gestión de usuarios (crear, suspender, editar roles)
- Cola de verificación documental (aprobar/rechazar con nota)
- Moderación de feed y contenido reportado
- Gestión de solicitudes y disputas
- Facturación: planes, pagos, reembolsos
- Soporte y tickets básicos (integración Intercom o similar)
- Métricas operativas en tiempo real

## 1.5 Alcance MVP — OUT OF SCOPE (explícito)

| Fuera de alcance MVP | Fase |
|---|---|
| App nativa iOS/Android | Beta / Escala |
| Marketplace de empleo completo (bolsa de trabajo) | Beta |
| Enterprise billing (PO, facturas personalizadas) | Beta |
| Integración ERP/SAP de clientes | Escala |
| IA/ML para matching avanzado | Beta |
| Pagos en MXN o monedas distintas a USD | Escala |
| Video llamadas integradas | Beta |
| Contratos electrónicos (eSignature) | Beta |
| SMS como canal primario | Beta |
| Marketplace de equipos (venta de activos) | Escala |
| API pública para terceros | Escala |

## 1.6 Supuestos del MVP

1. El equipo de desarrollo tiene entre 3–5 devs fullstack senior + 1 diseñador UX/UI.
2. Se cuenta con acceso a cuentas Stripe, Mapbox, Auth0 (o Firebase), GCS/AWS, SendGrid desde el inicio.
3. La verificación documental en MVP es manual/semi-manual (admin revisa documentos). Automatización en Beta.
4. El contenido inicial del feed será sembrado por el equipo (seeding) para evitar "página vacía" en lanzamiento.
5. La app móvil se construirá sobre la base web (PWA + React Native posterior).
6. El soporte al cliente en MVP es vía email + chat de Intercom (no call center).
7. Cobertura geográfica: Odessa/Midland + 50 millas a la redonda como zona primaria de launch.

## 1.7 Criterios de Éxito del MVP

- Un proveedor puede registrarse, verificarse y recibir su primer lead en menos de 24 horas.
- Una empresa puede publicar una solicitud y recibir al menos 1 cotización en menos de 48 horas.
- El tiempo de respuesta de la plataforma (P95) es ≤ 1.5 segundos en operaciones críticas.
- Uptime ≥ 99.5% en los primeros 90 días.
- Tasa de leads inválidos disputados < 15%.
- NPS ≥ 40 al cierre del mes 3.

---

# 2. SITEMAP + ARQUITECTURA DE NAVEGACIÓN

## 2.1 Estructura de Páginas

```
PermianHub
│
├── PÚBLICO (sin login)
│   ├── / (Landing page)
│   ├── /precios (Pricing)
│   ├── /categorias (Directorio de categorías)
│   ├── /como-funciona (How it works)
│   ├── /proveedores (Directorio público de proveedores)
│   ├── /blog (Contenido sectorial)
│   ├── /nosotros (About)
│   ├── /contacto
│   ├── /terminos
│   ├── /privacidad
│   └── /auth
│       ├── /login
│       ├── /registro (selección de rol)
│       ├── /registro/empresa
│       ├── /registro/proveedor
│       ├── /registro/profesional
│       └── /recuperar-contrasena
│
├── EMPRESA (autenticado: rol empresa)
│   ├── /app/dashboard (resumen: solicitudes activas, cotizaciones)
│   ├── /app/feed (timeline social)
│   ├── /app/solicitudes
│   │   ├── / (lista de mis solicitudes)
│   │   ├── /nueva (crear solicitud)
│   │   └── /:id (detalle: cotizaciones, chat, estado)
│   ├── /app/proveedores (búsqueda + mapa)
│   │   └── /:slug (perfil público proveedor)
│   ├── /app/mensajes (centro de mensajes)
│   │   └── /:conversacionId
│   ├── /app/favoritos (proveedores guardados)
│   ├── /app/notificaciones
│   ├── /app/perfil (mi perfil empresa)
│   └── /app/configuracion
│       ├── /cuenta
│       ├── /notificaciones
│       └── /facturacion
│
├── PROVEEDOR (autenticado: rol proveedor)
│   ├── /app/dashboard (leads, cotizaciones enviadas, métricas)
│   ├── /app/feed
│   ├── /app/solicitudes (solicitudes abiertas compatibles)
│   │   └── /:id (detalle solicitud + enviar cotización)
│   ├── /app/mis-cotizaciones (cotizaciones enviadas y estados)
│   ├── /app/mensajes
│   │   └── /:conversacionId
│   ├── /app/mi-perfil
│   │   ├── /editar
│   │   ├── /verificacion (subir documentos)
│   │   ├── /galeria
│   │   └── /resenas
│   ├── /app/suscripcion (plan actual, créditos, facturación)
│   ├── /app/notificaciones
│   └── /app/configuracion
│
├── PROFESIONAL (autenticado: rol profesional)
│   ├── /app/dashboard
│   ├── /app/feed
│   ├── /app/vacantes (beta)
│   ├── /app/mi-perfil
│   ├── /app/notificaciones
│   └── /app/configuracion
│
└── ADMIN (autenticado: rol admin)
    ├── /admin/dashboard (métricas generales)
    ├── /admin/usuarios
    │   ├── / (lista + búsqueda)
    │   └── /:id (detalle, editar, suspender)
    ├── /admin/verificaciones
    │   ├── / (cola de pendientes)
    │   └── /:id (revisar documentos)
    ├── /admin/solicitudes
    │   └── / (todas, con filtros y disputas)
    ├── /admin/contenido (reportes de moderación)
    ├── /admin/facturacion
    │   ├── /planes
    │   ├── /pagos
    │   └── /reembolsos
    ├── /admin/soporte (tickets)
    ├── /admin/categorias (gestión de categorías)
    └── /admin/configuracion (settings de plataforma)
```

## 2.2 Flujos Principales por Rol

### Flujo A: Empresa publica solicitud y recibe cotización
```
Login → Dashboard → Nueva Solicitud → 
[Seleccionar categoría → Completar formulario → Ubicación → Adjuntos → Publicar] →
Notificación a proveedores compatibles →
Proveedor envía cotización →
Empresa recibe notificación → Ver cotización → Chat → Aceptar/Rechazar →
[Si acepta] → Solicitud pasa a "Adjudicada" → Servicio → Completar → Reseña
```

### Flujo B: Proveedor recibe y responde lead
```
Login → Dashboard → Notificación nueva solicitud →
Ver detalle solicitud → Evaluar → Enviar cotización →
[Empresa acepta] → Chat → Coordinar → Completar →
Recibir reseña → Score actualizado en perfil
```

### Flujo C: Búsqueda y descubrimiento (empresa busca proveedor)
```
Búsqueda/Mapa → Filtros (categoría, zona, verificado, rating) →
Lista de proveedores → Ver perfil → Galería + Reseñas →
Contactar (chat directo) o Publicar Solicitud dirigida
```

### Flujo D: Onboarding proveedor
```
Registro → Selección rol: Proveedor →
[Nombre empresa → Categorías → Zona cobertura → Logo → Descripción] →
Verificación: subir documentos → Admin revisa (24-48h) →
Badge verificado activado → Puede recibir leads
```

---

# 3. HISTORIAS DE USUARIO (MoSCoW)

## MUST HAVE — Sin esto no hay producto

### AUTH & ONBOARDING
| ID | Como... | Quiero... | Para... |
|---|---|---|---|
| U01 | Cualquier usuario | Registrarme con email y contraseña | Acceder a la plataforma |
| U02 | Cualquier usuario | Registrarme con Google OAuth | Reducir fricción de onboarding |
| U03 | Usuario nuevo | Seleccionar mi rol al registrarme | Que el sistema me muestre la experiencia correcta |
| U04 | Usuario nuevo | Completar un onboarding guiado por rol | Tener mi perfil listo rápido |
| U05 | Cualquier usuario | Recuperar mi contraseña por email | No perder acceso |
| U06 | Admin | Activar MFA obligatorio | Proteger cuentas críticas |

### PERFILES
| ID | Como... | Quiero... | Para... |
|---|---|---|---|
| P01 | Empresa | Crear perfil con nombre, logo, industria y ubicación | Ser reconocida en la plataforma |
| P02 | Proveedor | Crear perfil con categorías, cobertura y galería | Mostrar mis servicios a empresas |
| P03 | Proveedor | Subir documentos de verificación | Obtener badge verificado |
| P04 | Admin | Revisar y aprobar/rechazar documentos | Mantener confianza en la plataforma |
| P05 | Cualquier usuario | Ver el perfil público de un proveedor | Evaluar antes de cotizar o contratar |
| P06 | Proveedor | Ver mi badge de verificación en mi perfil | Ganar credibilidad ante empresas |

### SOLICITUDES
| ID | Como... | Quiero... | Para... |
|---|---|---|---|
| S01 | Empresa | Publicar una solicitud estructurada | Recibir cotizaciones de proveedores relevantes |
| S02 | Empresa | Seleccionar categoría, zona, descripción y fecha | Que los proveedores correctos me vean |
| S03 | Empresa | Ver todas mis solicitudes activas | Hacer seguimiento de mis necesidades |
| S04 | Proveedor | Ver solicitudes abiertas en mis categorías y zona | Identificar oportunidades de negocio |
| S05 | Proveedor | Enviar una cotización a una solicitud | Participar en el proceso de selección |
| S06 | Empresa | Ver todas las cotizaciones de una solicitud | Comparar y decidir |
| S07 | Empresa | Aceptar o rechazar una cotización | Avanzar en el proceso |
| S08 | Sistema | Cambiar el estado de la solicitud automáticamente | Mantener trazabilidad del ciclo |

### MATCHING Y NOTIFICACIONES
| ID | Como... | Quiero... | Para... |
|---|---|---|---|
| M01 | Proveedor | Ser notificado de nuevas solicitudes en mis categorías | No perder oportunidades |
| M02 | Empresa | Recibir notificación cuando llega una cotización | Actuar rápido |
| M03 | Cualquier usuario | Recibir notificación de nuevo mensaje | Responder en tiempo |
| M04 | Sistema | Enviar notificaciones por email como respaldo | Asegurar entrega del mensaje |

### CHAT
| ID | Como... | Quiero... | Para... |
|---|---|---|---|
| C01 | Empresa / Proveedor | Chatear dentro de una solicitud | Coordinar sin salir de la plataforma |
| C02 | Cualquier usuario | Adjuntar archivos al chat | Compartir documentos, fotos, specs |
| C03 | Cualquier usuario | Ver estado de mis mensajes (enviado/leído) | Saber si recibieron mi información |
| C04 | Admin | Acceder al historial de un chat en disputas | Resolver conflictos con evidencia |

### PAGOS
| ID | Como... | Quiero... | Para... |
|---|---|---|---|
| PG01 | Proveedor | Suscribirme a un plan | Acceder a leads del marketplace |
| PG02 | Proveedor | Pagar con tarjeta o ACH | Flexibilidad de pago |
| PG03 | Proveedor | Ver mi consumo de leads | Controlar mi inversión |
| PG04 | Admin | Ver todos los pagos y suscripciones | Gestionar ingresos |

### GEOLOCALIZACIÓN
| ID | Como... | Quiero... | Para... |
|---|---|---|---|
| G01 | Empresa | Especificar ubicación exacta en mi solicitud | Que proveedores cercanos la vean |
| G02 | Proveedor | Definir mi zona de cobertura en el mapa | Recibir solo leads que puedo atender |
| G03 | Empresa | Filtrar proveedores por radio en el mapa | Encontrar quien está cerca |

### RESEÑAS
| ID | Como... | Quiero... | Para... |
|---|---|---|---|
| R01 | Empresa | Dejar reseña al proveedor tras completar servicio | Ayudar a la comunidad a decidir |
| R02 | Proveedor | Ver mis reseñas en mi perfil | Mostrar mi reputación |
| R03 | Proveedor | Responder a una reseña | Tener voz ante feedback público |

---

## SHOULD HAVE — Importante pero no bloquea el lanzamiento

| ID | Historia | Módulo |
|---|---|---|
| SH01 | Feed con filtros por categoría y zona | Feed |
| SH02 | Guardar proveedores en favoritos | Búsqueda |
| SH03 | Búsqueda full-text de proveedores | Búsqueda |
| SH04 | Perfil público de proveedor indexable en Google | SEO |
| SH05 | Dashboard con métricas básicas para proveedor | Dashboard |
| SH06 | Configurar preferencias de notificación | Notif. |
| SH07 | Quiet hours para notificaciones | Notif. |
| SH08 | Dispute de lead inválido (7 días) | Pagos |
| SH09 | Reembolso de lead inválido por admin | Pagos |
| SH10 | Exportar historial de solicitudes | Admin |
| SH11 | Integración básica de soporte (Intercom) | Soporte |
| SH12 | Bilingüismo ES/EN (switch de idioma en UI) | i18n |
| SH13 | PWA manifest + service worker básico | Frontend |

---

## COULD HAVE — Si hay tiempo y capacidad

| ID | Historia | Módulo |
|---|---|---|
| CH01 | Menciones (@usuario) en feed y comentarios | Feed |
| CH02 | Galería de proyectos anteriores en perfil proveedor | Perfiles |
| CH03 | Verificación avanzada (LinkedIn, DUNS) | Verificación |
| CH04 | Comparador de cotizaciones side-by-side | Solicitudes |
| CH05 | Templates de solicitudes por categoría | Solicitudes |
| CH06 | Rating por dimensión en reseñas (calidad, tiempo, etc.) | Reseñas |
| CH07 | Notificación SMS (Twilio) | Notif. |
| CH08 | Apple Pay / Google Pay | Pagos |
| CH09 | Digest semanal de actividad por email | Notif. |
| CH10 | Analytics de perfil para proveedor (views, clicks) | Dashboard |
| CH11 | Badges de logros (primer servicio, 10 reseñas, etc.) | Gamificación |
| CH12 | Categorías destacadas en landing page | Marketing |

---

## WON'T HAVE (en MVP)

| Fuera de MVP | Justificación |
|---|---|
| App nativa iOS/Android | Requiere equipo y tiempo adicional; web primero |
| Contratos electrónicos | Complejidad legal/técnica alta |
| Bolsa de trabajo completa | Validar primero el marketplace de servicios |
| IA de matching avanzado | Datos insuficientes en MVP |
| Video llamadas | No crítico para el flujo core |
| Multimoneda | Mercado objetivo es USD |
| API pública | No hay demanda validada aún |

---

# 4. MODELO DE DATOS CONCEPTUAL

## 4.1 Entidades Principales

### USER (base de autenticación)
- `id` (UUID)
- `email` (único)
- `passwordHash`
- `role` (COMPANY | PROVIDER | PROFESSIONAL | ADMIN)
- `status` (PENDING | ACTIVE | SUSPENDED | DELETED)
- `mfaEnabled` (boolean)
- `createdAt`, `updatedAt`, `lastLoginAt`
- `preferredLanguage` (es | en)

---

### PROFILE (vinculado 1:1 a USER)

**CompanyProfile**
- `id`, `userId` (FK → User)
- `displayName`, `legalName`
- `logoUrl`, `bannerUrl`
- `industry`, `description`
- `websiteUrl`
- `locationId` (FK → Location)
- `verificationStatus` (UNVERIFIED | PENDING | VERIFIED)
- `createdAt`, `updatedAt`

**ProviderProfile**
- `id`, `userId` (FK → User)
- `displayName`, `legalName`
- `logoUrl`, `bannerUrl`
- `description`
- `categories` (array FK → ServiceCategory)
- `coverageRadiusMiles` (int)
- `locationId` (FK → Location)
- `verificationStatus` (UNVERIFIED | PENDING | VERIFIED)
- `verificationBadges` (array: DOCUMENT | EMAIL | PHONE)
- `averageRating` (float, calculado)
- `totalReviews` (int)
- `subscriptionId` (FK → Subscription)
- `createdAt`, `updatedAt`

**ProfessionalProfile**
- `id`, `userId` (FK → User)
- `fullName`, `title`
- `photoUrl`
- `specialties` (array FK → ServiceCategory)
- `experienceYears` (int)
- `locationId` (FK → Location)
- `resumeUrl`
- `verificationStatus`
- `createdAt`, `updatedAt`

---

### LOCATION
- `id` (UUID)
- `street`, `city`, `state`, `zip`, `country`
- `latitude`, `longitude`
- `formattedAddress`
- `placeId` (Mapbox place ID)
- `createdAt`

---

### SERVICE_CATEGORY
- `id` (UUID)
- `name_es`, `name_en`
- `slug`
- `type` (DIRECT | INDIRECT)
- `icon`, `description_es`, `description_en`
- `isActive` (boolean)
- `sortOrder`

---

### DOCUMENT (verificación)
- `id` (UUID)
- `ownerId` (FK → User)
- `type` (COMPANY_REGISTRATION | LICENSE | INSURANCE | ID | OTHER)
- `fileUrl` (URL firmada)
- `fileName`, `fileSize`, `mimeType`
- `status` (PENDING | APPROVED | REJECTED)
- `reviewedBy` (FK → User admin)
- `reviewNote`
- `expiresAt` (opcional)
- `createdAt`, `updatedAt`

---

### POST (feed social)
- `id` (UUID)
- `authorId` (FK → User)
- `type` (TEXT | IMAGE | VIDEO | LINK | ACHIEVEMENT | JOB_BASIC)
- `content` (texto)
- `mediaUrls` (array)
- `linkUrl`, `linkPreview`
- `categoryTags` (array FK → ServiceCategory)
- `locationId` (FK → Location, opcional)
- `visibility` (PUBLIC | FOLLOWERS | PRIVATE)
- `status` (ACTIVE | REMOVED | FLAGGED)
- `likeCount`, `commentCount`, `shareCount`
- `createdAt`, `updatedAt`

**PostComment**
- `id`, `postId` (FK → Post), `authorId` (FK → User)
- `content`, `parentCommentId` (para replies)
- `status` (ACTIVE | REMOVED)
- `createdAt`

**PostLike**
- `userId` (FK), `postId` (FK), `createdAt`
- PK compuesta

---

### REQUEST (solicitud marketplace)
- `id` (UUID)
- `companyId` (FK → CompanyProfile)
- `categoryId` (FK → ServiceCategory)
- `title`, `description`
- `budget` (decimal, opcional)
- `currency` (USD)
- `locationId` (FK → Location)
- `deadline` (date)
- `attachmentUrls` (array)
- `status` (OPEN | IN_QUOTE | AWARDED | COMPLETED | CANCELLED | EXPIRED)
- `awardedQuoteId` (FK → Quote, nullable)
- `expiresAt`
- `viewCount`
- `quoteCount`
- `isUrgent` (boolean)
- `createdAt`, `updatedAt`

---

### QUOTE (cotización)
- `id` (UUID)
- `requestId` (FK → Request)
- `providerId` (FK → ProviderProfile)
- `amount` (decimal)
- `currency` (USD)
- `description`
- `validUntil` (date)
- `attachmentUrls` (array)
- `status` (DRAFT | SENT | VIEWED | ACCEPTED | REJECTED | EXPIRED | WITHDRAWN)
- `isLead` (boolean — si califica como lead para billing)
- `leadBilledAt` (timestamp)
- `createdAt`, `updatedAt`

---

### CONVERSATION (chat)
- `id` (UUID)
- `requestId` (FK → Request, nullable — puede ser chat directo en Beta)
- `participants` (array FK → User)
- `lastMessageAt`
- `createdAt`

**Message**
- `id` (UUID)
- `conversationId` (FK → Conversation)
- `senderId` (FK → User)
- `content` (texto)
- `attachmentUrls` (array)
- `type` (TEXT | IMAGE | FILE | SYSTEM)
- `status` (SENT | DELIVERED | READ)
- `sentAt`, `deliveredAt`, `readAt`

---

### REVIEW (reseña)
- `id` (UUID)
- `requestId` (FK → Request)
- `reviewerId` (FK → User — empresa)
- `revieweeId` (FK → User — proveedor)
- `rating` (1–5)
- `qualityRating`, `timelinessRating`, `communicationRating` (1–5)
- `comment`
- `providerResponse` (texto)
- `status` (PENDING | PUBLISHED | REMOVED)
- `createdAt`, `updatedAt`

---

### NOTIFICATION
- `id` (UUID)
- `userId` (FK → User)
- `type` (enum: NEW_REQUEST_MATCH | NEW_QUOTE | NEW_MESSAGE | QUOTE_ACCEPTED | QUOTE_REJECTED | REQUEST_STATUS_CHANGE | REVIEW_RECEIVED | VERIFICATION_APPROVED | VERIFICATION_REJECTED | PAYMENT_SUCCESS | PAYMENT_FAILED | SECURITY_ALERT)
- `title_es`, `title_en`
- `body_es`, `body_en`
- `data` (JSON — contexto: requestId, quoteId, etc.)
- `channels` (array: IN_APP | EMAIL | PUSH)
- `isRead` (boolean)
- `priority` (HIGH | MEDIUM | LOW)
- `readAt`
- `createdAt`

---

### SUBSCRIPTION (plan de proveedor)
- `id` (UUID)
- `providerId` (FK → ProviderProfile)
- `plan` (FREE | PRO_LAUNCH | BUSINESS_LAUNCH)
- `status` (ACTIVE | PAST_DUE | CANCELLED | TRIALING)
- `stripeSubscriptionId`
- `stripeCustomerId`
- `currentPeriodStart`, `currentPeriodEnd`
- `leadsIncluded` (int — según plan)
- `leadsUsed` (int)
- `leadsExtraAvailable` (int — comprados)
- `leadsExtraUsed` (int)
- `createdAt`, `updatedAt`

---

### PAYMENT
- `id` (UUID)
- `userId` (FK → User)
- `subscriptionId` (FK → Subscription, nullable)
- `type` (SUBSCRIPTION | LEAD_PURCHASE | LEAD_REFUND)
- `amount` (decimal)
- `currency` (USD)
- `stripePaymentIntentId`
- `status` (PENDING | SUCCEEDED | FAILED | REFUNDED)
- `metadata` (JSON)
- `createdAt`

---

### LEAD_DISPUTE
- `id` (UUID)
- `quoteId` (FK → Quote)
- `providerId` (FK → ProviderProfile)
- `reason` (enum: FAKE_REQUEST | DUPLICATE | WRONG_CATEGORY | COMPANY_UNRESPONSIVE | OTHER)
- `description`
- `status` (OPEN | REVIEWING | RESOLVED_REFUND | RESOLVED_NO_REFUND | REJECTED)
- `resolvedBy` (FK → User admin)
- `resolvedNote`
- `createdAt`, `updatedAt`

---

### AUDIT_LOG (inmutable)
- `id` (UUID)
- `actorId` (FK → User)
- `action` (string)
- `entityType`, `entityId`
- `before` (JSON), `after` (JSON)
- `ipAddress`, `userAgent`
- `createdAt`

---

## 4.2 Relaciones Clave

```
User 1──1 CompanyProfile
User 1──1 ProviderProfile
User 1──1 ProfessionalProfile
User 1──N Notification
User 1──N Document

CompanyProfile 1──N Request
Request N──1 ServiceCategory
Request 1──N Quote
Request 1──1 Quote (awardedQuoteId, nullable)
Request 1──1 Conversation
Request 1──N Review
Request N──1 Location

ProviderProfile 1──N Quote
ProviderProfile N──N ServiceCategory (tabla pivot)
ProviderProfile 1──1 Subscription
ProviderProfile 1──N Review (como reviewee)

Conversation 1──N Message
Conversation N──N User (participants)

Quote 1──N LeadDispute
Subscription 1──N Payment

Post N──1 User
Post 1──N PostComment
Post N──N ServiceCategory (tags)
```

---

# 5. DISEÑO FUNCIONAL DE MÓDULOS

## 5.1 Feed Social

**Objetivo:** Visibilidad, reputación y comunidad sectorial. NO es el canal para solicitudes operativas.

**Composición del timeline:**
- Feed principal: mezcla de posts de perfiles que sigues + posts de tu zona/categoría
- Sección "Explorar": posts trending por zona y categoría
- Algoritmo MVP: cronológico con boost por: (a) categoría relevante al usuario, (b) zona geográfica cercana, (c) perfil verificado, (d) recurrencia de interacción previa

**Reglas del feed:**
- Solicitudes de trabajo (marketplace) NO aparecen en el feed; tienen su propio flujo
- Solo posts ACTIVE son visibles
- Posts FLAGGED van a revisión sin desaparecer inmediatamente
- Contenido explícito = eliminación directa + revisión de cuenta

**Tipos de post permitidos:**
| Tipo | Descripción | Adjuntos |
|---|---|---|
| TEXT | Texto puro | No |
| IMAGE | Imagen(es) + texto | Hasta 5 imágenes |
| VIDEO | Video + texto | 1 video (max 100MB) |
| LINK | URL con preview | Auto-preview |
| ACHIEVEMENT | Logro/hito de empresa/proveedor | Imagen opcional |
| JOB_BASIC | Vacante sencilla (título, descripción, contacto) | No (MVP) |

**Composer de post:**
1. Selección de tipo (o auto-detect por adjunto)
2. Área de texto (max 1,000 caracteres)
3. Adjuntos (drag & drop o seleccionar)
4. Tags de categoría (hasta 3)
5. Ubicación (opcional, ciudad/área)
6. Idioma del post (auto-detectado, ajustable)
7. Vista previa → Publicar

---

## 5.2 Solicitudes (Marketplace)

**Objetivo:** Flujo estructurado y trazable para conectar necesidades operativas con proveedores calificados.

**Flujo de publicación (empresa):**
1. Selección de categoría (con sugerencias)
2. Formulario:
   - Título (breve, max 120 chars)
   - Descripción detallada (max 2,000 chars)
   - Ubicación exacta (Mapbox autocomplete)
   - Presupuesto estimado (opcional, rango o monto)
   - Fecha límite de servicio
   - Urgente (toggle — prioridad alta)
   - Adjuntos (max 5 archivos, hasta 20MB c/u)
3. Vista previa de la solicitud
4. Confirmar publicación

**Reglas de solicitud:**
- Solo usuarios con rol COMPANY pueden publicar solicitudes
- Una empresa puede tener hasta 10 solicitudes abiertas simultáneas en plan Free
- Solicitudes expiran automáticamente a los 30 días si no son cerradas
- Solicitud AWARDED bloquea nuevas cotizaciones

**Flujo de cotización (proveedor):**
1. Proveedor ve solicitud (feed de solicitudes o notificación)
2. Revisa detalle: descripción, ubicación, presupuesto, adjuntos
3. Acepta o no enviar cotización (opcional: "no apto" para filtrar)
4. Formulario de cotización:
   - Monto (requerido)
   - Descripción de la propuesta (max 1,000 chars)
   - Validez de la cotización (fecha)
   - Adjuntos (propuesta, catálogo, etc.)
5. Enviar → se contabiliza como lead (billing)
6. Proveedor puede retirar cotización (WITHDRAWN) antes de ser aceptada

**Estados del ciclo de solicitud:**
```
OPEN → [proveedores cotizan] → IN_QUOTE → [empresa acepta] → AWARDED → [servicio] → COMPLETED
                                          → [empresa rechaza todo] → OPEN nuevamente (max 2 veces)
                                          → [sin cotizaciones en 7 días] → expiración manual
OPEN → [empresa cancela] → CANCELLED
OPEN → [expiración automática 30d] → EXPIRED
```

---

## 5.3 Matching

**Objetivo:** Conectar automáticamente solicitudes abiertas con proveedores idóneos.

**Criterios de matching MVP (orden de prioridad):**
1. Categoría exacta (requerido)
2. Zona geográfica: ubicación solicitud dentro del radio de cobertura del proveedor
3. Estado de suscripción: plan activo (FREE puede ver pero no cotizar ilimitado; PRO/BUSINESS tienen prioridad)
4. Verificación: proveedor verificado sube en ranking
5. Rating promedio (peso: 20%)
6. Última actividad (peso: 10%)

**Proceso de notificación por match:**
- Al publicarse solicitud: sistema calcula proveedores elegibles (max 50 notificados por solicitud en MVP)
- Cola de notificación ordenada por ranking de matching
- Envío inmediato: in-app + email
- Si proveedor no abre en 24h: recordatorio (1 vez)

**Ranking de resultados de búsqueda:**
```
Score = (Verificado × 30) + (Rating × 20) + (Distancia inversa × 25) + (Actividad reciente × 15) + (Plan premium × 10)
```
Todos los valores normalizados a 0-100.

**Supuesto explícito #2:** El matching en MVP es por reglas estáticas. En Beta se introduce scoring con ML básico (collaborative filtering).

---

## 5.4 Chat Interno

**Objetivo:** Comunicación contextual, trazable y auditada entre empresa y proveedor dentro del flujo de solicitud.

**Estructura:**
- Cada solicitud tiene una Conversation asociada
- Participantes: la empresa que publicó + los proveedores que enviaron cotización
- En MVP: cada empresa-proveedor tiene su sub-hilo dentro de la conversación de la solicitud (privado entre los dos)
- Admin puede ver cualquier conversación (para disputas)

**Funciones del chat:**
- Mensajes en tiempo real (WebSocket via Socket.io / Ably)
- Indicador de escritura ("está escribiendo...")
- Estados: enviado ✓ / recibido ✓✓ / leído ✓✓ (azul)
- Adjuntos: imágenes (preview inline), PDFs y documentos (link descarga)
- Tamaño max por adjunto: 20MB
- Formatos permitidos: JPG/PNG/WEBP/GIF/PDF/DOCX/XLSX/ZIP

**Historial:**
- Historial completo e inmutable (no se pueden borrar mensajes enviados)
- Exportable por admin en caso de disputa
- Retención: mínimo 2 años

**Mensajes del sistema (tipo SYSTEM):**
- "Solicitud creada"
- "Cotización enviada por [Proveedor]"
- "Cotización aceptada"
- "Solicitud marcada como Completada"
- "Disputa abierta"

---

## 5.5 Notificaciones

**Objetivo:** Mantener a los usuarios informados sin generar spam ni dependencia de canales externos.

**Centro de notificaciones (in-app):**
- Bell icon con badge de conteo (no leídas)
- Lista de notificaciones: ícono de tipo + título + tiempo relativo + estado (leída/no leída)
- Click en notificación → redirige al contexto (solicitud, mensaje, perfil)
- Marcar todas como leídas
- Paginación (infinite scroll)

**Prioridades y comportamiento:**
| Prioridad | Ejemplos | Comportamiento |
|---|---|---|
| HIGH | Mensaje nuevo, cotización aceptada/rechazada, alerta de seguridad | Toast inmediato + email inmediato |
| MEDIUM | Nueva solicitud compatible, reseña recibida, verificación resuelta | Toast + email en 15 min |
| LOW | Recordatorio inactividad, digest semanal | Solo email (agrupado) |

**Quiet hours:** 10pm–7am hora local del usuario. Las notificaciones MEDIUM y LOW se encolan y envían al inicio del período activo. HIGH se envía siempre.

**Configuración de preferencias (por usuario):**
- Toggle por tipo de evento (activar/desactivar)
- Toggle por canal (in-app, email, push)
- Configurar quiet hours personalizados

**Template de email:**
- Header: logo PermianHub + nombre del usuario
- Body: resumen del evento + CTA (botón)
- Footer: enlace a preferencias + unsubscribe (transaccional = no aplica CAN-SPAM directamente, pero respetar)
- Idioma según preferencia del usuario

---

## 5.6 Mapas (Mapbox)

**Objetivo:** Descubrimiento geográfico de proveedores y matching por cercanía.

**Vista de mapa principal:**
- Pines de proveedores (agrupados en clusters al hacer zoom out)
- Color de pin: azul = verificado, gris = no verificado
- Click en pin: mini-card con foto, nombre, categorías, rating → "Ver perfil"
- Controles: zoom, geolocalización del usuario, toggle lista/mapa

**Filtros del mapa:**
- Categoría (selector múltiple)
- Radio desde un punto (slider: 10/25/50 millas)
- Solo verificados (toggle)
- Rating mínimo (selector)
- Disponibilidad (futuro)

**Cobertura del proveedor:**
- Al ver perfil de proveedor en mapa: círculo de cobertura (radio definido por proveedor)
- Área aproximada hasta match confirmado (privacidad: no se muestra dirección exacta hasta que hay cotización activa entre las partes)

**Geocoding:**
- Al crear solicitud: autocomplete de dirección con Mapbox Geocoding API
- Validación: si no se puede geocodificar, fallback a selección de ciudad
- Coordenadas guardadas en Location al crear/actualizar

**Privacidad de ubicación:**
- Proveedor: muestra ciudad/área en perfil público; coordenadas exactas solo visibles para empresa tras cotización activa
- Solicitud: muestra área/zona (no dirección exacta) hasta que la empresa acepta cotización

---

# 6. BACKLOG POR SPRINTS (3 Sprints iniciales de 2 semanas)

## Sprint 1 (Semanas 1–2): Fundación

### Objetivo del sprint
Infraestructura base funcional, auth completa, onboarding y perfiles básicos desplegados en staging.

| ID | Tarea | Responsable | Puntos | Prioridad |
|---|---|---|---|---|
| SP1-01 | Setup monorepo (Nx o Turborepo: Next.js + NestJS) | Dev | 5 | P0 |
| SP1-02 | Configurar CI/CD (GitHub Actions → staging en GCP) | DevOps | 5 | P0 |
| SP1-03 | Setup PostgreSQL + Redis + migrations base | Dev | 3 | P0 |
| SP1-04 | Integrar Auth0 (login, registro, Google OAuth) | Dev | 5 | P0 |
| SP1-05 | Módulo de roles (COMPANY / PROVIDER / PROFESSIONAL / ADMIN) | Dev | 3 | P0 |
| SP1-06 | Flujo de onboarding por rol (5 pasos, formularios) | Dev + UX | 8 | P0 |
| SP1-07 | Modelo de datos: User, Profile, Location (migraciones) | Dev | 3 | P0 |
| SP1-08 | CRUD de CompanyProfile + ProviderProfile | Dev | 8 | P0 |
| SP1-09 | Upload de logo/banner a GCS (con validación y thumbnail) | Dev | 5 | P1 |
| SP1-10 | Integrar Mapbox: autocomplete de dirección en formularios | Dev | 3 | P1 |
| SP1-11 | Vista pública de perfil de proveedor | Dev + UX | 5 | P1 |
| SP1-12 | Design system base (colores, tipografía, componentes: botón, input, card, badge) | UX/Dev | 8 | P0 |
| SP1-13 | Setup Sentry (frontend + backend) y logging centralizado | Dev | 2 | P1 |
| SP1-14 | Setup entornos: dev / staging / prod (variables de entorno, secrets) | DevOps | 3 | P0 |

**Definición de "Listo" del Sprint 1:**
- Usuario puede registrarse, seleccionar rol, completar onboarding y ver su perfil en staging.
- CI/CD corre tests en cada PR y despliega a staging automáticamente.

---

## Sprint 2 (Semanas 3–4): Core Marketplace

### Objetivo del sprint
Solicitudes y cotizaciones funcionales end-to-end. Matching básico. Notificaciones in-app y email.

| ID | Tarea | Responsable | Puntos | Prioridad |
|---|---|---|---|---|
| SP2-01 | Módulo Solicitudes: crear, listar, ver detalle | Dev | 8 | P0 |
| SP2-02 | Estados de solicitud + transiciones automáticas | Dev | 5 | P0 |
| SP2-03 | Módulo Cotizaciones: enviar, listar, cambiar estado | Dev | 8 | P0 |
| SP2-04 | Upload de adjuntos en solicitudes y cotizaciones | Dev | 3 | P1 |
| SP2-05 | Motor de matching: query de proveedores por categoría + zona | Dev | 8 | P0 |
| SP2-06 | Notificaciones in-app: bell icon + centro | Dev + UX | 5 | P0 |
| SP2-07 | Notificaciones email (SendGrid): nueva solicitud, nueva cotización, estado | Dev | 5 | P0 |
| SP2-08 | Modelo de datos: Request, Quote, Notification, Conversation, Message | Dev | 3 | P0 |
| SP2-09 | Chat básico por solicitud (REST polling en MVP; WebSocket en iteración) | Dev | 8 | P0 |
| SP2-10 | Panel Empresa: mis solicitudes, cotizaciones recibidas | Dev + UX | 5 | P0 |
| SP2-11 | Panel Proveedor: solicitudes disponibles, mis cotizaciones | Dev + UX | 5 | P0 |
| SP2-12 | Mapa de proveedores con pines + filtro por categoría y radio | Dev + UX | 8 | P1 |
| SP2-13 | Upload de documentos de verificación (a GCS) | Dev | 3 | P0 |
| SP2-14 | Cola de verificación en Admin: ver, aprobar, rechazar | Dev + UX | 5 | P0 |

**Definición de "Listo" del Sprint 2:**
- Una empresa puede publicar solicitud, un proveedor puede cotizar, la empresa puede aceptar, y ambos pueden chatear dentro de la solicitud.
- Matching notifica proveedores al publicarse una solicitud.

---

## Sprint 3 (Semanas 5–6): Monetización + Reputación + Admin

### Objetivo del sprint
Pagos con Stripe operativos, reseñas post-servicio, backoffice admin funcional, feed social básico.

| ID | Tarea | Responsable | Puntos | Prioridad |
|---|---|---|---|---|
| SP3-01 | Integrar Stripe: planes, checkout, webhooks | Dev | 13 | P0 |
| SP3-02 | Dashboard de suscripción y consumo de leads (proveedor) | Dev + UX | 5 | P0 |
| SP3-03 | Billing de lead: descontar del plan al enviar cotización | Dev | 5 | P0 |
| SP3-04 | Flujo de disputa de lead (formulario + cola admin) | Dev + UX | 5 | P1 |
| SP3-05 | Módulo de reseñas: crear, listar, responder | Dev | 5 | P0 |
| SP3-06 | Score promedio calculado y visible en perfil | Dev | 3 | P0 |
| SP3-07 | Feed social: publicar, listar, like, comentar | Dev + UX | 8 | P1 |
| SP3-08 | Filtros de feed por categoría y zona | Dev | 3 | P1 |
| SP3-09 | Backoffice admin: gestión de usuarios (listar, ver, suspender) | Dev + UX | 8 | P0 |
| SP3-10 | Backoffice admin: moderación de contenido (reportes) | Dev + UX | 5 | P1 |
| SP3-11 | Backoffice admin: métricas generales (usuarios, solicitudes, MRR) | Dev + UX | 5 | P1 |
| SP3-12 | Integrar PostHog (analytics de producto) | Dev | 2 | P1 |
| SP3-13 | i18n básico ES/EN (switch de idioma, traducciones clave) | Dev | 5 | P1 |
| SP3-14 | QA integral en staging + corrección de bugs críticos | QA/Dev | 8 | P0 |
| SP3-15 | Preparar entorno prod + pentest básico | DevOps/Dev | 5 | P0 |

**Definición de "Listo" del Sprint 3:**
- Proveedor puede suscribirse a un plan, pagar con Stripe, y el sistema descuenta leads correctamente.
- Reseñas post-servicio funcionan.
- Admin puede operar la plataforma desde el backoffice web.
- Plataforma lista para lanzamiento piloto controlado.

---

# 7. ARQUITECTURA TÉCNICA V1

## 7.1 Vista General

```
┌─────────────────────────────────────────────────────────────────┐
│                        CAPA CLIENTE                             │
│  Next.js 14 (App Router) + TypeScript + TailwindCSS            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Web Pública │  │  App Roles   │  │  Admin Backoffice    │  │
│  │  (SEO/SSR)   │  │  (CSR/SSR)   │  │  (CSR, /admin)       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS / WSS
┌───────────────────────────▼─────────────────────────────────────┐
│                       CAPA API                                   │
│  NestJS (Node.js) + TypeScript — Monolito modular MVP           │
│  REST API + WebSocket (Socket.io / Ably)                        │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────┐ ┌──────────┐ │
│  │ Auth    │ │ Profiles │ │ Requests │ │ Chat  │ │ Notif.   │ │
│  │ Module  │ │ Module   │ │ & Quotes │ │ Module│ │ Module   │ │
│  └─────────┘ └──────────┘ └──────────┘ └───────┘ └──────────┘ │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────┐ ┌──────────┐ │
│  │ Feed    │ │ Reviews  │ │ Payments │ │ Admin │ │ Files    │ │
│  │ Module  │ │ Module   │ │ Module   │ │ Module│ │ Module   │ │
│  └─────────┘ └──────────┘ └──────────┘ └───────┘ └──────────┘ │
└──────────────┬─────────────────────────────────────────────────┘
               │
┌──────────────▼─────────────────────────────────────────────────┐
│                    CAPA DE DATOS Y SERVICIOS                    │
│  ┌───────────────┐  ┌───────────┐  ┌──────────────────────┐   │
│  │ PostgreSQL     │  │ Redis     │  │ Google Cloud Storage │   │
│  │ (Cloud SQL)    │  │ (Cache +  │  │ (archivos, medios,   │   │
│  │ (datos core)   │  │  Queues)  │  │  documentos)         │   │
│  └───────────────┘  └───────────┘  └──────────────────────┘   │
└────────────────────────────────────────────────────────────────┘

SERVICIOS EXTERNOS
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐
│  Auth0   │ │  Mapbox  │ │  Stripe  │ │ SendGrid │ │  Ably   │
│ (auth)   │ │  (mapas) │ │ (pagos)  │ │ (email)  │ │ (WS RT) │
└──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────────┘
┌──────────┐ ┌──────────┐ ┌──────────┐
│ PostHog  │ │  Sentry  │ │ Intercom │
│(analytics│ │ (errors) │ │(support) │
└──────────┘ └──────────┘ └──────────┘
```

## 7.2 Decisiones de Arquitectura + Tradeoffs

### Monolito modular vs Microservicios

| Criterio | Monolito Modular (elegido) | Microservicios |
|---|---|---|
| Velocidad de desarrollo | Alta | Baja |
| Complejidad operativa | Baja | Alta |
| Costo infraestructura | Bajo | Alto |
| Escalabilidad | Buena (vertical + horizontal) | Excelente |
| Equipo requerido | 3–5 devs | 8+ devs |
| **Decisión** | **MVP y Beta** | **Escala (si se justifica)** |

**Justificación:** Un monolito bien modularizado (NestJS por módulos) permite escalar a microservicios extrayendo módulos específicos cuando haya demanda que lo justifique. No hay costo de microservicios sin el beneficio.

### Base de datos

| Opción | PostgreSQL (elegida) | MongoDB | Firebase |
|---|---|---|---|
| Consistencia | ACID fuerte | Eventual | Eventual |
| Relaciones complejas | Excelente | Limitado | Muy limitado |
| Escalabilidad | Buena (Cloud SQL, réplicas) | Alta | Alta |
| Costo MVP | Medio | Medio | Bajo |
| **Decisión** | **PostgreSQL via Cloud SQL** | — | — |

### Real-time (Chat)

| Opción | Ably (elegida) | Socket.io propio | Firebase Realtime |
|---|---|---|---|
| Gestión infraestructura | Ninguna (SaaS) | Alta | Ninguna |
| Costo | ~$30–100/mes MVP | $0 + infra | ~$25–50/mes |
| Escalabilidad | Alta | Manual | Alta |
| **Decisión** | **Ably para MVP** | Opción si Ably encarece | — |

**Alternativa válida:** Si el equipo prefiere evitar otro vendor, Socket.io propio escalado con Redis adapter funciona bien hasta 10k conexiones concurrentes.

### Auth

| Opción | Auth0 (elegida) | Firebase Auth | Cognito |
|---|---|---|---|
| Facilidad de integración | Alta | Alta | Media |
| MFA | Sí (nativo) | Sí | Sí |
| Social login | Amplio | Amplio | Limitado |
| Costo MVP (< 7k MAU) | Gratis | Gratis | ~$0 |
| Portabilidad | Alta | Media | Baja |
| **Decisión** | **Auth0** | Alternativa válida | — |

## 7.3 Stack Tecnológico Detallado

| Capa | Tecnología | Versión | Justificación |
|---|---|---|---|
| Frontend framework | Next.js | 14 (App Router) | SSR/SSG para SEO + CSR para app |
| CSS | TailwindCSS | 3.x | Velocidad de desarrollo, consistencia |
| Componentes UI | shadcn/ui + Radix | — | Accesible, no opinionado de diseño |
| Estado global | Zustand | 4.x | Simple, sin boilerplate de Redux |
| Fetching | TanStack Query | 5.x | Cache, loading states, invalidación |
| Forms | React Hook Form + Zod | — | Validación robusta, TS-native |
| Mapas | Mapbox GL JS | 3.x | Mejor opción para geo+comercial |
| i18n | next-intl | — | Integrado con App Router |
| Backend framework | NestJS | 10.x | Estructurado, modular, TS nativo |
| ORM | Prisma | 5.x | Migraciones, type safety, DX |
| Validación | class-validator + zod | — | Decoradores + schema TS |
| WebSocket | Ably (SDK) | — | Real-time managed |
| Queue/Jobs | BullMQ + Redis | — | Jobs async, retries, scheduling |
| Testing | Jest + Supertest | — | Unit + integración |
| E2E tests | Playwright | — | Tests críticos de flujo |
| Monorepo | Turborepo | — | Builds compartidos, cache |
| Linting | ESLint + Prettier | — | Consistencia de código |
| CI/CD | GitHub Actions | — | Deploy automático a GCP |
| Contenedores | Docker + docker-compose | — | Dev local + prod |
| Infraestructura | Google Cloud Platform | — | Cloud Run + Cloud SQL + GCS |
| CDN | Cloudflare | — | Cache estático + WAF |
| DNS | Cloudflare | — | Control completo |
| Observabilidad | Sentry + PostHog + GCP Logs | — | Errores + analytics + logs |

## 7.4 Módulos NestJS

```
src/
├── modules/
│   ├── auth/          (JWT, guards, decorators)
│   ├── users/         (CRUD usuarios, roles)
│   ├── profiles/      (company, provider, professional)
│   ├── documents/     (verificación documental)
│   ├── feed/          (posts, comentarios, likes)
│   ├── requests/      (solicitudes de marketplace)
│   ├── quotes/        (cotizaciones)
│   ├── matching/      (motor de match, notificaciones)
│   ├── conversations/ (chat, mensajes)
│   ├── notifications/ (centro de notificaciones)
│   ├── reviews/       (reseñas y ratings)
│   ├── payments/      (Stripe: suscripciones, leads)
│   ├── locations/     (geocoding, Mapbox)
│   ├── files/         (GCS upload, URLs firmadas)
│   ├── admin/         (backoffice endpoints)
│   └── analytics/     (eventos para PostHog)
├── common/
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   └── pipes/
├── config/            (configuración por entorno)
└── database/
    └── migrations/
```

## 7.5 Infraestructura GCP (MVP)

| Servicio | Uso | Tier MVP |
|---|---|---|
| Cloud Run | API backend (auto-scaling) | Min 1, max 5 instancias |
| Cloud SQL (PostgreSQL) | Base de datos principal | db-g1-small (2vCPU, 4GB) |
| Cloud Storage | Archivos, medios, documentos | Standard |
| Redis (Upstash o Memorystore) | Cache + queues BullMQ | Cache básico |
| Vercel (Next.js) | Frontend (alternativa a Cloud Run frontend) | Pro |
| Cloudflare | CDN + WAF + DNS | Pro (~$20/mes) |
| GitHub Actions | CI/CD | Free tier |

**Estimado de costo mensual MVP (primeros 90 días):**

| Servicio | Costo estimado/mes |
|---|---|
| Cloud Run (API) | $30–80 |
| Cloud SQL | $50–100 |
| Cloud Storage + CDN | $10–20 |
| Redis (Upstash) | $10–30 |
| Vercel (frontend) | $20 |
| Cloudflare Pro | $20 |
| Auth0 (< 7k MAU) | $0 |
| Mapbox (< 50k tiles) | $0 |
| Stripe | % de transacciones |
| SendGrid | $0–20 (< 100 emails/día) |
| Ably | $29 |
| Sentry | $0–26 |
| PostHog (Cloud) | $0 |
| **Total estimado** | **~$200–350/mes** |

---

# 8. PLAN DE SEGURIDAD MVP

## 8.1 Checklist de Seguridad Ejecutable

### Autenticación y Autorización
- [ ] JWT con expiración corta (15 min) + refresh token (7 días, rotación)
- [ ] Auth0 como proveedor de identidad (no implementar auth propio)
- [ ] MFA obligatorio para rol ADMIN
- [ ] MFA opcional (recomendado) para empresa y proveedor
- [ ] RBAC estricto: cada endpoint valida rol antes de ejecutar
- [ ] Guards de NestJS en TODOS los endpoints protegidos
- [ ] Verificar que userId del JWT coincide con recurso solicitado (authorization check)
- [ ] Blacklist de tokens en Redis al hacer logout
- [ ] Rate limiting: 5 intentos de login por minuto por IP, bloqueo 15 min

### Validación de Inputs
- [ ] Sanitización de HTML en todos los campos de texto (DOMPurify o similar)
- [ ] Validación de schema en TODOS los endpoints (class-validator + Zod)
- [ ] Rechazar campos no declarados en DTOs (whitelist validation)
- [ ] Escape de queries (Prisma previene SQLi nativo)
- [ ] Validación de tipos de archivo en upload (no solo extensión: verificar MIME type real)
- [ ] Límite de tamaño de archivo en upload (app level + proxy level)
- [ ] Límite de tamaño de request body (10MB máximo)
- [ ] Sanitizar nombres de archivo en uploads

### Seguridad de API
- [ ] CORS configurado (solo dominios autorizados)
- [ ] Rate limiting global: 100 req/min por usuario autenticado
- [ ] Rate limiting en endpoints críticos: 10 req/min (registro, login, cotización)
- [ ] Headers de seguridad (Helmet): CSP, HSTS, X-Frame-Options, nosniff
- [ ] CSRF tokens en formularios de mutación (si usa cookies)
- [ ] API versioning (/api/v1/) desde el inicio
- [ ] No exponer stacktraces en producción (filtro global de errores)
- [ ] Logs de auditoría en operaciones sensibles (AUDIT_LOG table)

### Archivos y Storage
- [ ] Archivos en bucket PRIVADO por defecto
- [ ] URLs firmadas (signed URLs) para acceso a archivos sensibles (15 min de validez)
- [ ] Validación de formato/tamaño antes de subir a GCS
- [ ] Escaneo anti-malware (ClamAV o Cloud DLP) en uploads de documentos
- [ ] No permitir archivos ejecutables (.exe, .sh, .bat, .js server-side, etc.)
- [ ] Separar buckets: público (logos/banners) vs privado (documentos de verificación, adjuntos sensibles)
- [ ] CDN con control de acceso para imágenes públicas

### Infraestructura
- [ ] TLS 1.2+ en todos los endpoints (forzar HTTPS, HSTS)
- [ ] Secretos en Google Secret Manager (no en variables de entorno de código)
- [ ] Entornos completamente separados: dev / staging / prod (diferentes proyectos GCP)
- [ ] Firewall rules: Cloud SQL solo accesible desde Cloud Run (no público)
- [ ] Redis solo accesible desde backend (no público)
- [ ] Imágenes Docker con usuario no-root
- [ ] Dependencias con Dependabot o Renovate (actualizaciones automáticas + PR review)
- [ ] Escaneo de secretos en commits (git-secrets o truffleHog en CI)
- [ ] SAST en CI (CodeQL o similar)

### Datos y Privacidad
- [ ] Cifrado en reposo: Cloud SQL con encryption keys gestionadas
- [ ] Cifrado en tránsito: TLS en todas las conexiones
- [ ] PII mínimo: recopilar solo lo necesario
- [ ] Política de retención de datos documentada (2 años para chats, 7 años para registros financieros)
- [ ] Proceso de eliminación de cuenta (GDPR-style: right to erasure)
- [ ] Backups cifrados automáticos (Cloud SQL: punto de recuperación cada 24h)
- [ ] Test de restauración de backup mensual
- [ ] Anonimizar datos en entornos de staging

### Monitoreo y Respuesta
- [ ] Alertas de Sentry para errores críticos (P1: respuesta < 15 min)
- [ ] Alertas de GCP para: CPU > 85%, latencia P95 > 2s, errores 5xx > 1%
- [ ] Logs de acceso centralizados (GCP Cloud Logging)
- [ ] Alerta de login desde IP inusual
- [ ] Plan de respuesta a incidentes documentado (runbook)
- [ ] Contacto de seguridad: security@permianhub.io
- [ ] Página de status público (statuspage.io o similar)

### Pre-lanzamiento
- [ ] Pentest básico (OWASP Top 10) por equipo interno o externo
- [ ] Revisión de configuración de Stripe (webhooks con firma, no exponer secret key)
- [ ] Revisión de configuración de Auth0 (allowed callbacks, logout URLs)
- [ ] Confirmar que no hay credenciales en repositorio git (audit completo)
- [ ] Privacy Policy y Terms of Service publicados y actualizados
- [ ] Cookie consent (si se usan cookies no esenciales)

---

# 9. PLAN DE GO-TO-MARKET (PILOTO ODESSA/MIDLAND)

## 9.1 Estrategia General

**Modelo de lanzamiento:** Early Access por invitación → Piloto abierto controlado → Lanzamiento público

**Hipótesis de mercado:**
- Si consiguemos 30 empresas compradoras activas en los primeros 90 días, el network effect comenzará a atraer proveedores orgánicamente.
- Si consiguemos 80 proveedores con perfil completo y verificado, las empresas tendrán opciones reales para cotizar.

## 9.2 Fase Pre-lanzamiento (Semanas -8 a 0)

### Clientes ancla (objetivos mínimos antes del launch)
- Objetivo: 5 empresas compradoras comprometidas + 15 proveedores en lista de espera
- Método: contacto directo, reuniones presenciales, pitch personalizado

**Perfiles de empresa ancla a buscar:**
- Operadoras medianas del Permian (no majors — son más ágiles)
- Contratistas generales de workover, completions o pipeline
- Compañías de servicios generales que también compran servicios

**Perfiles de proveedor ancla:**
- Proveedores HSE, soldadura, mantenimiento mecánico, limpieza industrial, catering
- Priorizar empresas con buena reputación local pero sin presencia digital sólida

### Validación previa (Fase 0 del roadmap)
- 15 entrevistas con empresas compradoras (30 min c/u)
- 15 entrevistas con proveedores de servicios
- Preguntas clave: ¿Cómo encuentran proveedores hoy? ¿Cuánto tiempo toma? ¿Qué pagarían por resolverlo?
- Demo de wireframes/Figma en entrevistas
- Armar lista de espera (landing page con waitlist desde semana -8)

### Landing page de lanzamiento
- Propuesta de valor en 10 segundos (headline + subhead)
- Demo video (60–90 seg)
- Formulario de lista de espera (nombre, empresa, rol, email)
- Testimonios de usuarios ancla (tan pronto se tengan)
- Contador de "X proveedores ya en plataforma"
- CTA diferenciado: empresa vs proveedor

## 9.3 Canales de Adquisición

| Canal | Tipo | Esfuerzo | Costo | Tiempo al resultado |
|---|---|---|---|---|
| Ventas directas (outbound) | B2B directo | Alto | Bajo | Inmediato |
| LinkedIn (publicidad + orgánico) | Digital B2B | Medio | Medio | 2–4 semanas |
| Grupos de Facebook (Odessa/Midland industry) | Orgánico | Bajo | $0 | 1–2 semanas |
| WhatsApp business (comunidades existentes) | Orgánico | Medio | $0 | 1–2 semanas |
| Eventos industria local (Oil & Gas shows) | Presencial | Alto | Medio | Ciclo de evento |
| SEO local ("proveedores HSE Odessa TX") | Orgánico | Medio | Bajo | 3–6 meses |
| Referidos (programa de invitación) | Viral | Bajo | Bajo | Variable |
| Email marketing a base de datos propia | Owned | Bajo | $0 | 1 semana |

**Foco MVP:** Ventas directas + LinkedIn + Comunidades existentes. El SEO es inversión a mediano plazo.

## 9.4 Propuesta de Valor por Segmento

**Para empresas compradoras:**
- "Recibe 3 cotizaciones verificadas en 48 horas, sin llamadas en frío."
- "Proveedores con reputación real, no promesas."
- "Gratis para empresas compradoras."

**Para proveedores:**
- "Recibe leads reales de empresas del Permian directo a tu panel."
- "Destaca frente a la competencia con tu perfil verificado."
- "Tu reputación viaja contigo: las reseñas son tuyas, no de un directorio."
- "Prueba 30 días gratis (Pro Launch)."

## 9.5 Estrategia de Pricing para Lanzamiento

| Plan | Precio Launch | Precio Regular (mes 7+) | Notas |
|---|---|---|---|
| Free | $0 | $0 | 5 leads/mes, perfil básico |
| Pro Launch | $39/mes | $59/mes | 20 leads/mes, badge destacado |
| Business Launch | $99/mes | $149/mes | 80 leads/mes, posición prioritaria |
| Lead extra Pro | $3 | $3.50 | |
| Lead extra Business | $2 | $2.50 | |

- Precio de lanzamiento garantizado 6 meses con aviso de 30 días antes de cambio.
- Período de prueba: 14 días gratis en Pro Launch.
- Sin contrato de permanencia en MVP.

## 9.6 Timeline de Lanzamiento

| Semana | Actividad |
|---|---|
| -8 | Landing page con waitlist live. Inicio de entrevistas. |
| -6 | Resultado de entrevistas. Wireframes validados. Inicio de build. |
| -4 | Demo funcional con clientes ancla (staging). Feedback loop. |
| -2 | 5 clientes ancla con acceso anticipado. Bugs críticos resueltos. |
| 0 | Launch piloto: invitar lista de espera (por lotes de 20). |
| +2 | Primer análisis de retención y conversión. Ajustes rápidos. |
| +4 | Abrir registro público con fricción baja (sin código de invitación). |
| +8 | Primera campaña de LinkedIn ads (budget: $500–1,000/mes). |
| +12 | Revisión de KPIs 90 días. Decidir Beta features. |

---

# 10. KPIs CON METAS

## 10.1 Framework AARRR (Pirate Metrics)

### ADQUISICIÓN
| KPI | Fórmula | Meta 90 días | Meta 6 meses |
|---|---|---|---|
| Usuarios registrados (total) | Count usuarios | 150 | 600 |
| Empresas registradas | Count rol=COMPANY | 40 | 150 |
| Proveedores registrados | Count rol=PROVIDER | 80 | 300 |
| Tasa conversión landing → registro | Registros / visitas landing | > 8% | > 10% |
| CAC (Costo de Adquisición de Cliente) | Gasto marketing / nuevos clientes pagos | < $50 | < $35 |

### ACTIVACIÓN
| KPI | Fórmula | Meta 90 días | Meta 6 meses |
|---|---|---|---|
| Proveedores verificados | Count verificados / total | > 60% | > 75% |
| Tiempo primer lead recibido | Promedio días post-registro hasta primer lead | < 3 días | < 2 días |
| Empresas que publican 1ª solicitud (día 7) | % empresas activas con solicitud publicada | > 50% | > 60% |
| Solicitudes con ≥ 1 cotización | % solicitudes / total publicadas | > 70% | > 80% |

### RETENCIÓN
| KPI | Fórmula | Meta 90 días | Meta 6 meses |
|---|---|---|---|
| Retención semana 1 (empresa) | Activos semana 1 / total registrados | > 60% | > 65% |
| Retención mes 1 (proveedor) | Activos mes 1 / total registrados | > 45% | > 55% |
| Solicitudes por empresa activa/mes | Promedio | > 2 | > 3 |
| DAU/MAU ratio | DAU / MAU | > 15% | > 20% |
| Churn mensual (proveedores pagos) | Cancelaciones / activos | < 8% | < 5% |

### REVENUE
| KPI | Fórmula | Meta 90 días | Meta 6 meses |
|---|---|---|---|
| MRR (ingresos recurrentes) | Sum suscripciones activas | $2,000 | $18,000 |
| Proveedores en plan pago | Count plan != FREE | 30 | 130 |
| ARPU (ingreso promedio por usuario pago) | MRR / proveedores pagos | > $60 | > $80 |
| Leads facturados (total) | Count leads billled | 200 | 2,000 |
| Tasa de disputas de lead | Disputas / total leads | < 10% | < 7% |
| LTV estimado (proveedor) | ARPU × meses promedio activo | — | > $400 |

### REFERIDOS
| KPI | Fórmula | Meta 90 días | Meta 6 meses |
|---|---|---|---|
| NPS de plataforma | Encuesta mensual (0–10) | ≥ 40 | ≥ 50 |
| Tasa de referidos | Nuevos usuarios por referido / total nuevos | > 15% | > 25% |
| Reseñas publicadas | Count reviews published | > 50 | > 300 |

## 10.2 KPIs de Operación y Calidad

| KPI | Meta |
|---|---|
| Uptime de plataforma | ≥ 99.5% |
| Latencia P95 (operaciones críticas) | ≤ 1.5s |
| Tiempo resolución incidente P1 | < 1 hora |
| Tiempo de verificación de proveedor | < 48 horas |
| Tiempo de respuesta a soporte | < 4 horas hábiles |
| Tasa de error de API (5xx) | < 0.5% |

---

# 11. RIESGOS PRINCIPALES Y MITIGACIONES

## 11.1 Tabla de Riesgos

| # | Riesgo | Probabilidad | Impacto | Prioridad |
|---|---|---|---|---|
| R01 | Masa crítica insuficiente (chicken-and-egg) | ALTA | MUY ALTO | P0 |
| R02 | Proveedor con perfil incompleto o bajo engagement | ALTA | ALTO | P0 |
| R03 | Dominio permianhub.com disputado o costoso | MEDIA | MEDIO | P1 |
| R04 | Lead fraud (solicitudes falsas o spam) | MEDIA | ALTO | P1 |
| R05 | Proveedor percibe leads de baja calidad | MEDIA | ALTO | P0 |
| R06 | Competencia de WhatsApp/Facebook Groups | ALTA | MEDIO | P1 |
| R07 | Complejidad técnica subestimada en chat real-time | MEDIA | MEDIO | P1 |
| R08 | Stripe rechazos o problemas de KYB en cuentas | BAJA | ALTO | P2 |
| R09 | Brecha de seguridad / datos de clientes expuestos | BAJA | MUY ALTO | P0 |
| R10 | Equipo de desarrollo insuficiente para ritmo requerido | MEDIA | ALTO | P1 |
| R11 | Regulación local no anticipada (licencias, compliance) | BAJA | ALTO | P2 |
| R12 | Baja tasa de conversión de Free a pago | ALTA | ALTO | P0 |

## 11.2 Mitigaciones Detalladas

### R01 — Masa crítica insuficiente (chicken-and-egg)
**Riesgo:** Sin proveedores, las empresas no vienen. Sin empresas, los proveedores no ven valor.
**Mitigación:**
- Seeding activo: el equipo de PermianHub actúa como "broker" inicial, publicando solicitudes reales de empresas contactadas y conectando con proveedores.
- Comenzar con 2–3 categorías (HSE, soldadura, mantenimiento) antes de abrir todas las 40.
- Ofrecer perfil gratis para proveedores indefinidamente; la barrera de entrada debe ser $0.
- Comprometer 5 empresas ancla ANTES del lanzamiento (demostrando demanda a proveedores).

### R02 — Proveedor con perfil incompleto
**Riesgo:** Proveedores se registran pero no completan perfil, reduciendo calidad del directorio.
**Mitigación:**
- Onboarding gamificado: barra de progreso de perfil con incentivos (más leads con perfil más completo).
- Email sequence de onboarding (días 1, 3, 7, 14 post-registro) empujando completar secciones.
- Admin puede contactar directamente a proveedores incompletos en fase piloto.

### R05 — Leads de baja calidad
**Riesgo:** Proveedor recibe lead, pero la solicitud es vaga, irreal o la empresa no responde.
**Mitigación:**
- Formulario de solicitud con validaciones que obligan a completar campos críticos.
- Empresa compradora requiere email verificado para publicar solicitud.
- Política de lead inválido con reembolso (7 días): reduce riesgo percibido para proveedor.
- Score de calidad de solicitud visible (completo/incompleto) antes de que proveedor cotice.
- Empresa inactiva por 7 días → solicitud pasa a "en revisión" → alerta interna.

### R09 — Brecha de seguridad
**Riesgo:** Exposición de datos de empresas, proveedores o documentos de verificación.
**Mitigación:**
- Ejecutar el checklist de seguridad completo (sección 8) antes del launch.
- Pentest básico (interno o externo) antes de abrir al público.
- Seguro de ciberseguridad (cyber liability insurance) — explorar desde el lanzamiento.
- Plan de respuesta a incidentes documentado y ensayado.
- Acceso a documentos solo via URLs firmadas con expiración.

### R12 — Baja conversión Free → Pago
**Riesgo:** Proveedores usan el plan Free indefinidamente sin convertir.
**Mitigación:**
- Limitar leads en Free (5/mes) — suficiente para probar, insuficiente para hacer negocio.
- Trial de 14 días en Pro Launch antes de pagar.
- Email de conversión en día 10 del trial con caso de uso concreto ("Tu perfil recibió X vistas esta semana").
- A/B test de pricing y triggers de conversión en Beta.
- Considerar "freemium perpetuo" como estrategia de retención para proveedores pequeños que refieren clientes.

---

# 12. CHECKLIST "LISTO PARA PROGRAMAR"

## A. Producto y Diseño

- [ ] PRD firmado y congelado por el equipo (no añadir scope en MVP sin proceso formal)
- [ ] Wireframes de todos los flujos críticos (Figma) revisados y aprobados
- [ ] Sistema de diseño base definido: paleta de colores, tipografía, espaciado, iconos
- [ ] Flujos de usuario documentados: empresa, proveedor, admin (happy path + edge cases)
- [ ] Copy bilingüe (ES/EN) de pantallas principales preparado
- [ ] Estados vacíos diseñados (first-time user, no results, error)
- [ ] Componentes UI diseñados: formularios, cards, modals, tablas, mapas
- [ ] Responsive design definido: breakpoints mobile/tablet/desktop

## B. Producto y Negocio

- [ ] Naming y dominio decididos (al menos dominio alterno registrado)
- [ ] Entidad legal de PermianHub constituida (LLC en Texas)
- [ ] Cuentas de servicio creadas: Stripe, Mapbox, Auth0, GCS, SendGrid, Ably, Sentry, PostHog
- [ ] Política de Privacidad y Términos de Servicio redactados (por abogado)
- [ ] Política de lead válido/inválido documentada y aprobada
- [ ] Planes de precios confirmados y aprobados por stakeholders
- [ ] 5 clientes ancla comprometidos (empresa compradora)
- [ ] 15 proveedores en lista de espera comprometidos

## C. Técnico — Arquitectura

- [ ] Monorepo inicializado (Turborepo: apps/web + apps/api)
- [ ] Stack tecnológico confirmado por el equipo técnico
- [ ] Modelo de datos completo revisado y aprobado (incluyendo migraciones base)
- [ ] Decisiones de arquitectura documentadas (ADRs básicos)
- [ ] Contrato de API definido: endpoints, métodos, esquemas de request/response (OpenAPI)
- [ ] Estrategia de branching definida (GitFlow o trunk-based)
- [ ] Convenciones de código documentadas (ESLint rules, naming, estructura de módulos)

## D. Técnico — Infraestructura y DevOps

- [ ] Cuentas GCP creadas (3 proyectos: dev / staging / prod)
- [ ] CI/CD configurado (GitHub Actions → staging automático, prod con aprobación)
- [ ] Secretos en Secret Manager (no en repositorio ni variables hardcodeadas)
- [ ] Variables de entorno documentadas por servicio
- [ ] Base de datos staging provisionada con migraciones corriendo
- [ ] Backup automático configurado en Cloud SQL staging
- [ ] Docker Compose para desarrollo local funcional (api + db + redis)
- [ ] Dominio y DNS configurados (Cloudflare)
- [ ] Certificados SSL activos
- [ ] Logs centralizados configurados (GCP Cloud Logging)
- [ ] Alertas básicas configuradas (Sentry P1 → email inmediato)

## E. Técnico — Seguridad

- [ ] Auth0 tenant configurado (callback URLs, logout URLs, social connections)
- [ ] CORS configurado (solo dominios autorizados)
- [ ] Rate limiting configurado (global + endpoints críticos)
- [ ] Helmet.js activo (headers de seguridad)
- [ ] Buckets GCS: público vs privado configurados correctamente
- [ ] Dependabot o Renovate activo en repositorio
- [ ] Git-secrets o truffleHog en pre-commit hooks
- [ ] SAST básico en CI/CD (CodeQL)
- [ ] Política de contraseñas robusta en Auth0

## F. Equipo

- [ ] Roles del equipo definidos (quién decide qué, proceso de PR review)
- [ ] Ritmo de trabajo acordado: standup diario, sprint planning, retro
- [ ] Herramientas de PM configuradas (Linear, Jira o Notion) con backlog inicial
- [ ] Canal de comunicación de equipo operativo (Slack)
- [ ] Acceso a cuentas de servicios distribuido por persona/rol (no compartir credenciales root)
- [ ] Onboarding de dev documentado (README de setup local en < 30 minutos)

## G. Calidad

- [ ] Test plan básico documentado (qué se prueba en cada módulo)
- [ ] Definition of Done acordada por equipo
- [ ] Proceso de QA en staging antes de merge a prod documentado
- [ ] Plan de rollback definido (¿cómo revertir un deploy roto?)
- [ ] Cobertura mínima de tests acordada (sugerido: 60% en módulos críticos)

---

## RESUMEN EJECUTIVO

| Elemento | Decisión |
|---|---|
| Stack | Next.js 14 + NestJS + PostgreSQL + TypeScript |
| Arquitectura | Monolito modular (extraíble a microservicios en Escala) |
| Infra | Google Cloud Platform (Cloud Run + Cloud SQL + GCS) |
| Auth | Auth0 |
| Mapas | Mapbox |
| Pagos | Stripe |
| Real-time | Ably (WebSocket managed) |
| Email | SendGrid |
| Monitoring | Sentry + PostHog |
| Tiempo estimado MVP | 8–12 semanas (equipo de 3–5 devs) |
| Costo infra MVP | ~$200–350/mes |
| Costo total estimado build | $120,000–180,000 USD (equipo in-house) |
| Dominio trabajo | permianhub.io (pendiente confirmar) |
| Launch mínimo requerido | 5 empresas ancla + 15 proveedores + Sprint 3 completo |

---

*Documento generado: 2026-05-22 | Versión: 1.0 | Estado: BORRADOR para revisión del equipo*  
*Próxima revisión: antes de inicio de Sprint 1*
