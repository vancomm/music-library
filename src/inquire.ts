import inquirer, { ConfirmQuestion } from 'inquirer';

function makeConfirmQuestion(name: string, message?: string): ConfirmQuestion {
	return {
		type: 'confirm',
		name,
		message,
	};
}

export async function askForBool(name: string, message?: string): Promise<boolean> {
	const question = makeConfirmQuestion(name, message);
	const answer = await inquirer.prompt([question]);
	const result = answer[name] as boolean;
	return result;
}
