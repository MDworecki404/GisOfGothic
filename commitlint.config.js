export default {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'subject-case': [0],
		'body-max-line-length': [0],
		'footer-max-line-length': [0],
		'body-leading-blank': [2, 'always'],
		'body-empty': [2, 'never'],
		'trailer-exists': [2, 'never', 'Co-Authored-By:']
	}
};
