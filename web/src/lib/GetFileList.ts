export async function fileGetList(): Promise<string[]> {
    	await new Promise((resolve) => setTimeout(resolve, 500))

	return [
		'passport.pdf',
		'contract_2026.pdf',
		'identity_document.pdf',
		'bank_statement.pdf',
		'resume.pdf',
	]
}