/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateReservacionRequest = {
    folio?: string | null;
    nombre?: string | null;
    correoElectronico?: string | null;
    telefono?: string | null;
    eventoId?: number;
    zonaEventoId?: number | null;
    estadoDeReservacionId?: number;
    cantidadBoletos?: number;
    precioUnitario?: number | null;
    subtotal?: number | null;
    fechaReservacion?: string;
    fechaExpiracion?: string;
    fechaPago?: string | null;
};

