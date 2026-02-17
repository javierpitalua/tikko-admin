/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ActividadesEventoListResponse } from '../models/ActividadesEventoListResponse';
import type { CommandResult } from '../models/CommandResult';
import type { CreateActividadEventoRequest } from '../models/CreateActividadEventoRequest';
import type { DeleteActividadEventoRequest } from '../models/DeleteActividadEventoRequest';
import type { EditActividadEventoRequest } from '../models/EditActividadEventoRequest';
import type { SelectListItem } from '../models/SelectListItem';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ActividadesEventoService {
    /**
     * @param requestBody
     * @returns CommandResult OK
     * @throws ApiError
     */
    public static postApiV1ActividadesEventoCreate(
        requestBody?: CreateActividadEventoRequest,
    ): CancelablePromise<CommandResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/ActividadesEvento/Create',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns CommandResult OK
     * @throws ApiError
     */
    public static postApiV1ActividadesEventoEdit(
        requestBody?: EditActividadEventoRequest,
    ): CancelablePromise<CommandResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/ActividadesEvento/Edit',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns CommandResult OK
     * @throws ApiError
     */
    public static postApiV1ActividadesEventoDelete(
        requestBody?: DeleteActividadEventoRequest,
    ): CancelablePromise<CommandResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/ActividadesEvento/Delete',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns SelectListItem OK
     * @throws ApiError
     */
    public static getApiV1ActividadesEventoGetDescription(
        id?: number,
    ): CancelablePromise<SelectListItem> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/ActividadesEvento/GetDescription',
            query: {
                'id': id,
            },
        });
    }
    /**
     * @param eventoId
     * @param id
     * @returns ActividadesEventoListResponse OK
     * @throws ApiError
     */
    public static getApiV1ActividadesEventoList(
        eventoId?: number,
        id?: number,
    ): CancelablePromise<ActividadesEventoListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/ActividadesEvento/List',
            query: {
                'EventoId': eventoId,
                'Id': id,
            },
        });
    }
}
