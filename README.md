 FitLog: Multi-Tenant Management API
Bienvenido a FitLog Pro, una solución de backend robusta diseñada para centralizar la operación de múltiples gimnasios de forma independiente. Desde la gestión financiera hasta la asistencia inteligente mediante IA, este sistema es el núcleo de una infraestructura fitness escalable.

Arquitectura y Tecnologías
Este backend está construido bajo una arquitectura limpia y modular, asegurando que cada "inquilino" (Tenant) mantenga la integridad y privacidad de sus datos.

Runtime: Node.js (v20+)

Framework: Express.js con TypeScript para un tipado estricto.

Base de Datos: PostgreSQL (Relacional y escalable).

IA: Agente inteligente con Tool Calling para consultas dinámicas sobre el estado del gimnasio.

Testing: Suite completa de pruebas automatizadas.

Características Principales
 Arquitectura Multi-Tenant
Aislamiento completo de datos por gimnasio, permitiendo que una sola instancia del backend sirva a múltiples clientes corporativos.

 Gestión Integral
Administración de Clientes: Control total del ciclo de vida del socio.

Oferta Comercial: Configuración flexible de planes y servicios.

Control de Membresías: Automatización de altas, renovaciones y estados de vigencia.

Motor de Pagos y Finanzas
Transacciones en Tiempo Real: Procesamiento de pagos integrados al flujo de creación y renovación de membresías.

Historial Centralizado: Auditoría completa de movimientos financieros por usuario y tenant.

Asistente IA (Agentic Mode)
Capacidad de procesamiento de lenguaje natural que utiliza Tool Calling para interactuar con la base de datos.

Ejemplo: "Muestra cuántos socios vencen mañana" o "¿Cuál fue el plan más vendido este mes?".