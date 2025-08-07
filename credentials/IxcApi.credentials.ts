import {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class IxcApi implements ICredentialType {
	name = 'ixcApi';
	displayName = 'IXC Soft API';
	documentationUrl = 'https://wiki.ixcsoft.com.br/pt-br/API/como_gerar_um_token_para_integra%C3%A7%C3%B5es_API/';
	properties: INodeProperties[] = [
		{
			displayName: 'Domínio',
			name: 'domain',
			type: 'string',
			default: '',
			placeholder: 'https://seudominio.ixcsoft.com.br',
			required: true,
		},
		{
			displayName: 'Token API (Base64)',
			name: 'apiToken',
			type: 'string',
			default: '',
			placeholder: '',
			required: true,
			typeOptions: {
				password: true,
			},
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Basic {{$credentials.apiToken}}',
			},
		},
	};
}
