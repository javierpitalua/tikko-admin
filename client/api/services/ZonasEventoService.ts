/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CommandResult } from '../models/CommandResult';
import type { CreateZonaEventoRequest } from '../models/CreateZonaEventoRequest';
import type { DeleteZonaEventoRequest } from '../models/DeleteZonaEventoRequest';
import type { EditZonaEventoRequest } from '../models/EditZonaEventoRequest';
import type { SearchResultList } from '../models/SearchResultList';
import type { SelectListItem } from '../models/SelectListItem';
import type { ZonasEventoListResponse } from '../models/ZonasEventoListResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ZonasEventoService {
    /**
     * @param requestBody
     * @returns CommandResult OK
     * @throws ApiError
     */
    public static postApiV1ZonasEventoCreate(
        requestBody?: CreateZonaEventoRequest,
    ): CancelablePromise<CommandResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/ZonasEvento/Create',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns CommandResult OK
     * @throws ApiError
     */
    public static postApiV1ZonasEventoEdit(
        requestBody?: EditZonaEventoRequest,
    ): CancelablePromise<CommandResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/ZonasEvento/Edit',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns CommandResult OK
     * @throws ApiError
     */
    public static postApiV1ZonasEventoDelete(
        requestBody?: DeleteZonaEventoRequest,
    ): CancelablePromise<CommandResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/ZonasEvento/Delete',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns SelectListItem OK
     * @throws ApiError
     */
    public static getApiV1ZonasEventoGetDescription(
        id?: number,
    ): CancelablePromise<SelectListItem> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/ZonasEvento/GetDescription',
            query: {
                'id': id,
            },
        });
    }
    /**
     * @param eventoId
     * @param id
     * @returns ZonasEventoListResponse OK
     * @throws ApiError
     */
    public static getApiV1ZonasEventoList(
        eventoId?: number,
        id?: number,
    ): CancelablePromise<ZonasEventoListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/ZonasEvento/List',
            query: {
                'EventoId': eventoId,
                'Id': id,
            },
        });
    }
    /**
     * @param searchTerm
     * @returns SearchResultList OK
     * @throws ApiError
     */
    public static getApiV1ZonasEventoLoadSelectList(
        searchTerm?: string,
    ): CancelablePromise<SearchResultList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/ZonasEvento/LoadSelectList',
            query: {
                'searchTerm': searchTerm,
            },
        });
    }
}
