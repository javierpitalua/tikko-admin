/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CommandResult } from '../models/CommandResult';
import type { CreateEventoRequest } from '../models/CreateEventoRequest';
import type { DeleteEventoRequest } from '../models/DeleteEventoRequest';
import type { EditEventoRequest } from '../models/EditEventoRequest';
import type { EventosListResponse } from '../models/EventosListResponse';
import type { SearchResultList } from '../models/SearchResultList';
import type { SelectListItem } from '../models/SelectListItem';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class EventosService {
    /**
     * @param searchTerm
     * @returns SearchResultList OK
     * @throws ApiError
     */
    public static getApiV1EventosLoadSelectList(
        searchTerm?: string,
    ): CancelablePromise<SearchResultList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/Eventos/LoadSelectList',
            query: {
                'searchTerm': searchTerm,
            },
        });
    }
    /**
     * @param requestBody
     * @returns CommandResult OK
     * @throws ApiError
     */
    public static postApiV1EventosCreate(
        requestBody?: CreateEventoRequest,
    ): CancelablePromise<CommandResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/Eventos/Create',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns CommandResult OK
     * @throws ApiError
     */
    public static postApiV1EventosEdit(
        requestBody?: EditEventoRequest,
    ): CancelablePromise<CommandResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/Eventos/Edit',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns CommandResult OK
     * @throws ApiError
     */
    public static postApiV1EventosDelete(
        requestBody?: DeleteEventoRequest,
    ): CancelablePromise<CommandResult> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/Eventos/Delete',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns SelectListItem OK
     * @throws ApiError
     */
    public static getApiV1EventosGetDescription(
        id?: number,
    ): CancelablePromise<SelectListItem> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/Eventos/GetDescription',
            query: {
                'id': id,
            },
        });
    }
    /**
     * @param dominioId
     * @param estadoDeEventoId
     * @param tipoDeCategoriaEventoId
     * @param ubicacionId
     * @param id
     * @returns EventosListResponse OK
     * @throws ApiError
     */
    public static getApiV1EventosList(
        dominioId?: number,
        estadoDeEventoId?: number,
        tipoDeCategoriaEventoId?: number,
        ubicacionId?: number,
        id?: number,
    ): CancelablePromise<EventosListResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/Eventos/List',
            query: {
                'DominioId': dominioId,
                'EstadoDeEventoId': estadoDeEventoId,
                'TipoDeCategoriaEventoId': tipoDeCategoriaEventoId,
                'UbicacionId': ubicacionId,
                'Id': id,
            },
        });
    }
}
