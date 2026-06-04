// Roles del sistema
export const Rol = {
  ADMIN:       'ADMIN',
  REPARTIDOR:  'REPARTIDOR',
} as const;
export type Rol = (typeof Rol)[keyof typeof Rol];

// Turnos de entrega
export const Turno = {
  MANANA: 'MANANA',
  TARDE:  'TARDE',
} as const;
export type Turno = (typeof Turno)[keyof typeof Turno];

export const TurnoLabel: Record<Turno, string> = {
  MANANA: 'Mañana',
  TARDE:  'Tarde',
};

// Estados del pedido
export const EstadoPedido = {
  PENDIENTE:  'PENDIENTE',
  ENTREGADO:  'ENTREGADO',
  CANCELADO:  'CANCELADO',
} as const;
export type EstadoPedido = (typeof EstadoPedido)[keyof typeof EstadoPedido];

export const EstadoPedidoLabel: Record<EstadoPedido, string> = {
  PENDIENTE:  'Pendiente',
  ENTREGADO:  'Entregado',
  CANCELADO:  'Cancelado',
};

// Estados de la entrega
export const EstadoEntrega = {
  PENDIENTE:  'PENDIENTE',
  CONFIRMADA: 'CONFIRMADA',
} as const;
export type EstadoEntrega = (typeof EstadoEntrega)[keyof typeof EstadoEntrega];

// Métodos de pago
export const MetodoPago = {
  EFECTIVO: 'EFECTIVO',
  YAPE:     'YAPE',
  PLIN:     'PLIN',
} as const;
export type MetodoPago = (typeof MetodoPago)[keyof typeof MetodoPago];

export const MetodoPagoLabel: Record<MetodoPago, string> = {
  EFECTIVO: 'Efectivo',
  YAPE:     'Yape',
  PLIN:     'Plin',
};

// Formato estándar de respuesta de la API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?:    T;
  message?: string;
  errors?:  Record<string, string[]>;
}

// Paginación
export interface PaginationQuery {
  page?:   number;
  limit?:  number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data:       T[];
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
}

// ── Categorías ─────────────────────────────────────────────

export interface Categoria {
  ID_CAT:  number;
  NOM_CAT: string;
  DES_CAT: string | null;
}

// ── Productos ──────────────────────────────────────────────

export interface Producto {
  ID_PRD:    number;
  ID_CAT:    number | null;
  NOM_PRD:   string;
  PRC_STD:   string;          // Decimal → string en Prisma
  ACT_PRD:   boolean;
  FEC_CRE:   string;
  FEC_ACT:   string;
  categoria: Pick<Categoria, 'ID_CAT' | 'NOM_CAT'> | null;
}

// ── Pedidos ────────────────────────────────────────────────

export interface DetallePedidoItem {
  ID_PRD:      number
  NOM_PRD:     string
  CAN:         number
  PRC_UNI:     string
  precio_nuevo?: boolean
}

export interface Pedido {
  ID_PED:      number
  ID_CLI:      string
  NOM_CLI:     string
  ID_USR_CRE:  string
  NOM_USR_CRE: string
  FEC_ENT_PED: string
  TUR_PED:     string
  EST_PED:     EstadoPedido
  FEC_CRE:     string
  FEC_ACT:     string
  detalles:    DetallePedidoItem[]
}

// DTOs
export interface CreateDetallePedidoDto {
  ID_PRD:      number;
  CAN:         number;
  PRC_UNI:     number;
  precio_nuevo?: boolean;
}

export interface CreatePedidoDto {
  ID_CLI:      string;
  FEC_ENT_PED: string;
  TUR_PED?:    string;
  detalles:    CreateDetallePedidoDto[];
}

export interface UpdatePedidoDto {
  FEC_ENT_PED?: string;
  TUR_PED?:     string;
  detalles?:    CreateDetallePedidoDto[];
}

// Respuesta del endpoint productos-pactados
export interface ProductoPactado {
  ID_PRD:      number;
  NOM_PRD:     string;
  PRC_UNI:     string;   // precio pactado o estándar
  precio_nuevo: boolean; // true = no tenía precio pactado
}

// ── Entregas ───────────────────────────────────────────────

export const EstadoEntregaLabel: Record<EstadoEntrega, string> = {
  PENDIENTE:  'Pendiente',
  CONFIRMADA: 'Confirmada',
}

export interface DetalleEntregaItem {
  ID_PRD:    number
  NOM_PRD:   string
  CAN:       number
  CAN_CAM:   number   // cambios/devoluciones
  PRC_UNI:   string
  SUB_TOT:   string
}

export interface Entrega {
  ID_ENT:    number
  ID_PED:    number | null
  ID_CLI:    string
  NOM_CLI:   string
  ID_USR_REG: string
  NOM_USR_REG: string
  FEC_ENT:   string
  TUR_ENT:   string
  EST_ENT:   EstadoEntrega
  TOT_ENT:   string
  OBS_ENT:   string | null
  FEC_CRE:   string
  FEC_ACT:   string
  detalles:  DetalleEntregaItem[]
}

export interface CreateDetalleEntregaDto {
  ID_PRD:  number
  CAN:     number
  CAN_CAM: number
  PRC_UNI: number
}

export interface CreateEntregaDto {
  ID_PED?:  number
  ID_CLI:   string
  FEC_ENT:  string
  TUR_ENT:  string
  OBS_ENT?: string
  detalles: CreateDetalleEntregaDto[]
}

// ── Salidas ────────────────────────────────────────────────

export interface SalidaItem {
  ID_PRD:  number
  NOM_PRD: string
  CAN_SAL: number
}

export interface Salida {
  FEC_SAL: string
  TUR_SAL: string
  items:   SalidaItem[]
}

export interface CreateSalidaDto {
  FEC_SAL: string
  TUR_SAL: string
  items:   { ID_PRD: number; CAN_SAL: number }[]
}