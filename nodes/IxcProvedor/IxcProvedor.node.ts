import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	INodePropertyOptions,
} from 'n8n-workflow';

import { resources as resourceOptions, resourceActions, resourceFields } from './ResourceDescription';
import { IxcApiRequest } from './GenericFunctions';

export class IxcProvedor implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'IXC Provedor',
		name: 'ixcProvedor',
		icon: 'file:ixcprovedor.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{`${$parameter["action"]} ${$parameter["resource"]}`}}',
		description: 'Conecte-se com a API do IXC Provedor',
		defaults: {
			name: 'IXC Provedor',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'ixcApi',
				required: true,
			},
		],
		requestDefaults: {
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Recursos',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: resourceOptions as INodePropertyOptions[],
				default: '',
				description: 'Formulário onde a ação será executada',
			},
			...resourceActions,
			...resourceFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData = [];

		for (let i = 0; i < items.length; i++) {
			const resource = this.getNodeParameter('resource', i) as string;
			const action = this.getNodeParameter('action', i) as string;

			let endpoint = resource;
			let method: IHttpRequestMethods = 'POST';
			let body: IDataObject = JSON.parse(this.getNodeParameter('requestBody', i) as string);

			switch (action) {
				case 'get':
					method = 'GET';
					break;
				case 'post':
					method = 'POST';
					body = JSON.parse(this.getNodeParameter('requestBody', i) as string);
					break;
				case 'put':
					method = 'PUT';
					const editId = this.getNodeParameter('recordId', i) as string;
					endpoint += `/${editId}`;
					body = JSON.parse(this.getNodeParameter('requestBody', i) as string);
					break;
				case 'delete':
					method = 'DELETE';
					const deleteId = this.getNodeParameter('recordId', i) as string;
					endpoint += `/${deleteId}`;
					break;
				default:
					endpoint = action;
					method = 'GET';
					if (this.getNodeParameter('requestBody', i, null) !== null) {
						body = JSON.parse(this.getNodeParameter('requestBody', i) as string);
					}
					break;
			}

			try {
				const responseData = await IxcApiRequest.call(this, endpoint, method, body);
				returnData.push(responseData);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ error: error.message });
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
