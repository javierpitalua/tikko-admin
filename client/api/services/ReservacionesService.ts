/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CommandResult } from '../models/CommandResult';
import type { CreateReservacionRequest } from '../models/CreateReservacionRequest';
import type { ReservacionesListResponse } from '../models/ReservacionesListResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ReservacionesService {
    /**
     * @param requestBody
     * @returns CommandResult OK
     * @throws ApiError
     */
    public static postApiV1ReservacionesCreate(
        requestBody?: CreateReservacionRequest,
    ): CancelablePromise<CommandResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/Reservaciones/Create',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param estadoDeReservacionId
     * @param eventoId
     * @param zonaEventoId
     * @param id
     * @returns ReservacionesListResponse OK
     * @throws ApiError
     */
    public static getApiV1ReservacionesList(
        estadoDeReservacionId?: number,
        eventoId?: number,
        zonaEventoId?: number,
        id?: number,
    ): CancelablePromise<ReservacionesListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/Reservaciones/List',
            query: {
                'EstadoDeReservacionId': estadoDeReservacionId,
                'EventoId': eventoId,
                'ZonaEventoId': zonaEventoId,
                'Id': id,
            },
        });
    }
}
