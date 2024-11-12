import {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
	IRequestOptions, ITriggerFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export async function IxcApiRequest(
	this: IHookFunctions | IExecuteFunctions | ITriggerFunctions | ILoadOptionsFunctions,
	endpoint: string,
	method: IHttpRequestMethods,
	body: any = {}
): Promise<any> {
	const domain = (await this.getCredentials('ixcApi')).domain as string;
	const options: IRequestOptions = {
		headers: {
			'Content-Type': 'application/json',
			'ixc-type-response': 'application/json'
		},
		method,
		uri: `${domain.replace(/\/$/, '')}/webservice/v1/${endpoint}`,
		body,
		json: true,
	};

	if (method === 'GET'){
		options.headers = options.headers || {};
		options.headers['ixcsoft'] = 'listar';
	}

	if (Object.keys(body as IDataObject).length === 0) {
		delete options.body;
	}

	const responseData = await this.helpers.requestWithAuthentication.call(this, 'ixcApi', options);
	const parsedData = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;

	if (parsedData.type === 'error') {
		throw new NodeApiError(this.getNode(), parsedData as JsonObject, {
			message: parsedData.message || 'Erro na resposta da API',
			httpCode: '400',
		});
	}

	return parsedData;
}
