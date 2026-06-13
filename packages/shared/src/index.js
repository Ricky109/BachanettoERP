"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstadoEntregaLabel = exports.MetodoPagoLabel = exports.MetodoPago = exports.EstadoEntrega = exports.EstadoPedidoLabel = exports.EstadoPedido = exports.TurnoLabel = exports.Turno = exports.Rol = void 0;
// Roles del sistema
exports.Rol = {
    ADMIN: 'ADMIN',
    REPARTIDOR: 'REPARTIDOR',
};
// Turnos de entrega
exports.Turno = {
    MANANA: 'MANANA',
    TARDE: 'TARDE',
};
exports.TurnoLabel = {
    MANANA: 'Mañana',
    TARDE: 'Tarde',
};
// Estados del pedido
exports.EstadoPedido = {
    PENDIENTE: 'PENDIENTE',
    ENTREGADO: 'ENTREGADO',
    CANCELADO: 'CANCELADO',
};
exports.EstadoPedidoLabel = {
    PENDIENTE: 'Pendiente',
    ENTREGADO: 'Entregado',
    CANCELADO: 'Cancelado',
};
// Estados de la entrega
exports.EstadoEntrega = {
    PENDIENTE: 'PENDIENTE',
    CONFIRMADA: 'CONFIRMADA',
};
// Métodos de pago
exports.MetodoPago = {
    EFECTIVO: 'EFECTIVO',
    YAPE: 'YAPE',
    PLIN: 'PLIN',
};
exports.MetodoPagoLabel = {
    EFECTIVO: 'Efectivo',
    YAPE: 'Yape',
    PLIN: 'Plin',
};
// ── Entregas ───────────────────────────────────────────────
exports.EstadoEntregaLabel = {
    PENDIENTE: 'Pendiente',
    CONFIRMADA: 'Confirmada',
};
