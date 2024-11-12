import {
	ITriggerFunctions,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
	IDataObject,
	INodePropertyOptions,
} from 'n8n-workflow';
import moment from 'moment-timezone';

import { resources } from './ResourceDescription';
import { IxcApiRequest } from './GenericFunctions';

export class IxcProvedorTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'IXC Provedor Trigger',
		name: 'ixcProvedorTrigger',
		icon: 'file:ixcprovedor.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{`watch ${$parameter["resource"]}`}}',
		description: 'Inicia o fluxo quando há mudanças na API do IXC Provedor',
		defaults: {
			name: 'IXC Provedor Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'ixcApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Recurso',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					...(Array.isArray(resources) ? resources : []),
					{
						name: 'Todos Os Recursos',
						value: 'all',
						description: 'Monitorar todos os recursos disponíveis',
					},
				] as INodePropertyOptions[],
				default: '',
				description: 'Recurso a ser monitorado',
			},
			{
				displayName: 'Intervalo De Polling (Minutos)',
				name: 'pollInterval',
				type: 'number',
				default: 5,
				description: 'Com que frequência a API deve ser verificada',
			},
			{
				displayName: 'Fuso Horário',
				name: 'timezone',
				type: 'options',
				options: [
					{ name: 'Acre (Rio Branco)', value: 'America/Rio_Branco' },
					{ name: 'Amazonas (Manaus)', value: 'America/Manaus' },
					{ name: 'Brasília (Distrito Federal)', value: 'America/Sao_Paulo' },
					{ name: 'Fernando De Noronha', value: 'America/Noronha' },
					{ name: 'Mato Grosso (Cuiabá)', value: 'America/Cuiaba' },
					{ name: 'Pará (Belém)', value: 'America/Belem' },
					{ name: 'Rondônia (Porto Velho)', value: 'America/Porto_Velho' },
					{ name: 'Roraima (Boa Vista)', value: 'America/Boa_Vista' },
					{ name: 'Tocantins (Palmas)', value: 'America/Araguaina' }
				],
				default: 'America/Sao_Paulo',
				description: 'Selecione o fuso horário para consulta',
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const resource = this.getNodeParameter('resource') as string;
		const pollInterval = this.getNodeParameter('pollInterval') as number;
		const timezone = this.getNodeParameter('timezone') as string;

		let lastPolled = moment.tz(timezone);

		const triggerFunction = async () => {
			const currentDate = moment.tz(timezone);
			const endpoint = 'ixc_logs';

			const body: IDataObject = {
				qtype: 'ixc_logs.tabela',
				oper: '=',
				query: resource,
				page: '1',
				rp: '100',
				sortname: 'ixc_logs.id',
				sortorder: 'desc',
				grid_param: JSON.stringify([
					{
						TB: 'ixc_logs.data',
						OP: '>',
						P: lastPolled.format('YYYY-MM-DD HH:mm:ss')
					}
				])
			};

			try {
				const responseData = await IxcApiRequest.call(this, endpoint, 'GET', body);
				lastPolled = currentDate;

				if (responseData && responseData.rows && Array.isArray(responseData.rows) && responseData.rows.length > 0) {
					return responseData.rows.map((item: any) => ({
						json: item,
					}));
				}
			} catch (error) {
				console.error('Erro ao buscar dados do IXC Provedor:', error);
			}

			return null;
		};

		const polling = setInterval(async () => {
			const data = await triggerFunction();
			if (data && data.length > 0) {
				this.emit([data]);
			}
		}, pollInterval * 60 * 1000);

		async function closeFunction() {
			clearInterval(polling);
		}

		return {
			closeFunction,
		};
	}
}
